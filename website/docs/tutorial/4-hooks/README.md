# Level 4: Adding State to Our Components Using Hooks

## Introduction

Until now, we are able to split up our code into multiple components, which can either be static or functional elements. But as our components will just be rendered once so far, it's not possible to really interact with those components.

In this level, we are going to explore how we can *store* data inside a component and re-render the component automatically once that data changes. This will allow us to interact with the component and return results which depend on previous executions of it, meaning that the functions of our components become *stateful*.

To do so, we are going to look at the concept of **Hooks** in this level. SuiWeb comes with two hooks, namely [`useState`](/docs/api/internal/modules/hooks#usestate) and [`useEffect`](/docs/api/internal/modules/hooks#useeffect), which are both also available in React with almost the same syntax. Note that React includes various additional hooks, which are not implemented in SuiWeb to keep things simple. Having seen and understood the two hooks implemented in SuiWeb, however, should give you good understanding of how the concept generally works, which is the goal of SuiWeb after all.

With that, let's look at demo we have for this level on what we want to achieve.


## Goal

- [Demo](https://suiweb.github.io/demos/tutorial/04-hooks/index.html)
- [Source Code](https://github.com/suiweb/suiweb/tree/main/demos/tutorial/04-hooks)

We create two components for the demo of this level. When we render it, we can see a `h1` title, a text field and a button. The title displays what is currently written to the text field, and updates automatically as soon as the text in the text field changes. The button shows how many times it has been clicked, and updates every time it is clicked.

Here is the source code of our `index.js` for the current level. The contents of `index.html` remain unchanged.

### `index.js`

```javascript
import { createElement } from '../../lib/js/fiber.js'
import { useEffect, useState } from '../../lib/js/hooks.js'
import { render } from '../../lib/js/render.js'
import { parseSjdon } from '../../lib/js/sjdon.js'


const App = () => {
    const [text, setText] = useState('SuiWeb App')
    const [count, setCount] = useState(0)

    useEffect(
        () => console.log('First render done'), 
        []
    )

    useEffect(
        () => console.log(`The value of text has changed: ${text}`),
        [text]
    )

    useEffect(
        () => console.log('Component was re-rendered')
    )

    return [
        'div',
        ['h1', text],
        [TextField, {text, setText}],
        [Counter, {count, setCount}]
    ]
}

const TextField = ({text, setText}) => {
    return [
        'div',
        [
            'input',
            {
                value: text,
                oninput: (event) => setText(event.target.value),
            },
        ],
    ]
}

const Counter = ({count, setCount}) => {
    return [
        'button', 
        { onclick: () => setCount(count + 1) }, 
        `Clicked ${count} times`
    ]
}

render(
    parseSjdon([App], createElement), 
    document.getElementById('app')
)
```

Because the title updates automatically as we change the value of the text field, we need some logic that re-renders the component `App`, if the *internal data* of the component changes, as we have mentioned in the introduction. 

To understand how this is working, we are first going to have a look at how we *use* the functions provided by SuiWeb to achieve this functionality, and will then dive into how it works under the hood.


## Using Hooks

Inside the function (or *component*) `App`, we call the `useState` function (or *hook*) with an initial value of `'SuiWeb App'`. This call returns an array, which we destructure to two constants `text` and `setText`. Initially, `text` has the value `'SuiWeb App'`, as this is what we passed as the `initialValue` to `useState`. `setText` is a function which we can use to update the value assigned to `text` and trigger a re-rendering of the component.

Similarly, we call `useState` once more in the following line, passing `0` as the initial value and storing destructured result in two constants `count` and `setCount`.

Going further in the implementation of our `App` component, we can see three calls of the hook `useEffect`, which all print some text to the console. If we look at the console, we can see that the text "First render done" is printed only once, after the component `App` was rendered for the first time. We tell the effect to do so, by defining an empty array (`[]`) as the second argument when calling `useEffect`. If you look at the console while altering the text of the text field, you will see that the *actions* of the second and the third effect are executed every time the text changes. For the second call of `useEffect`, we set its dependencies (defined in the second argument) to `[text]`. This means that the *action* of the effect will execute every time the component re-renders, if the value of `text` has changed since it last rendered. At our third call to `useEffect`, we did not set the second parameter, meaning we did not set any dependencies. Because of this, the *action* of our third effect will be executed on *every* re-rendering, no matter *which* value was updated. We can verify this by looking at the console while clicking the counter button: The only text that will be printed is "Component was re-rendered".

> Note that the behavior of `useEffect` is different when ***not* passing anything** as its *dependencies*, vs. **passing an empty array (`[]`)**: Passing an **empty array** will execute the action of the effect **exactly once**, on the initial rendering, while passing **nothing** (or `undefined`), will execute the action on **every execution** of the component. If you think it's a strange decision to differentiate on the behavior like that, well, this is how the `useEffect` hook of React works, and we wanted ours to work the same way as it does in React.

The `App` component returns an SJDON structure, with a `div` at the top level and two child elements: A `h1` with the current value of `text` as its content, the `TextField` component and the `Counter` component. We pass an object consisting of our `text` and `setText` as the `props` to our `TextField` component and one consisting of `count` and `setCount` to our `Counter` component.

The `TextField` component returns an `input`, that is wrapped inside a `div`. If the value of the `input` changes (`oninput`), the `setText` function, which was passed to the component, will be called with the current value of the input.

Things are similar for our `Counter` component. We return a button with a text that displays the current value of `count`, that will be passed in the props of the function. When the button is clicked (`onclick`), we call the `setCount` function, that was passed via props as well, with the value `count + 1`.

With that, the components will re-render every time the *state* of the component changes, which happens by calling the `setText` or `setCount` functions. Re-rendering a component basically means executing the function which defines the component, and then updating the existing HTML element which is present in the DOM, to reflect the changes that happened. If we update the value of `text` using `setText`, for example, this will run the `App` function, as this *state* is defined in the `App` component. The difference from the first execution of `App` is that now, `useState` does not return what is passed as the `initialValue`, but what was set previously using the `setText` function. This means that the `useState` function somehow recognizes that it already has a value for that exact `useState` call, and returns that, instead of the initial value. This is what makes hooks somehow magic. Now, let's have a look at their implementation to demystify them a bit.


## The Hooks Module

To understand how hooks work, we need to revisit the `unwrapFunctionalFiber` function. So far, we have left away everything inside that function that was related to hooks. Now, we will have a look at the full implementation.

```typescript
function unwrapFunctionalFiber(fiber: FunctionalFiber, container: HTMLElement, previousVersion?: Fiber) {
    // highlight-start
    // Copy memorizedStates from previousStates, or assign an empty array in case there is none
    fiber.memorizedStates = (previousVersion as FunctionalFiber)?.memorizedStates ?? []

    // Make fiber ready for hook calls.
    prepareToUseHooks(fiber.memorizedStates, () => rerenderFunctionalFiber(fiber, container))
    // highlight-end

    // Unwrap fibers until the fiberFunction returns a StaticFiber.
    let unwrappedFiber = fiber.fiberFunction(fiber.functionProps)
    while (isFunctionalFiber(unwrappedFiber))
        unwrappedFiber = unwrappedFiber.fiberFunction(unwrappedFiber.functionProps)

    // Merge all properties of the unwrappedFiber into the functional fiber.
    Object.assign(fiber, unwrappedFiber)
}
```

In the first line of the function, we can see that the `memorizedStates` property of the `fiber` which is unwrapped, is retrieved from the `previousVersion`'s `memorizedStates` property, in case that exists. Otherwise, it is initialized as an empty array.

The reason why we try to retrieve the value from the previous version is exactly because of what we have discussed before: Re-rendering means re-executing the function that defines a component. If that happens, however, the Fiber will no longer have its `memorizedStates` array, as initializing this array is not part of the Fiber's `fiberFunction`, but happens inside `unwrapFunctionalFiber`, as you have seen before. If we wouldn't copy over the value from the Fiber's previous version, we would initialize an empty array at each execution of the component, meaning that we would lose everything that was previously written to the array. This is why for every render, except of the first one, we will always also pass the previous version of a Functional Fiber to `unwrapFunctionalFiber`.


### Preparing the Use of Hooks

In the following line of `unwrapFunctionalFiber`, we can see that the function `prepareToUseHooks` is called. We pass it the `memorizedStates` array of our `fiber` and an anonymous (arrow) function, in which will call `rerenderFunctionalFiber(fiber, container)` once it's executed. We will take a look at `renderFunctionalFiber` later in this level, for now just know, that we will use it to trigger a re-rendering of the component, once its state has changed.

```typescript
export function prepareToUseHooks(memorizedStates: unknown[], rerenderFunction: () => void) {
    states = memorizedStates
    rerender = rerenderFunction
    stateIndex = 0
}
```

In `prepareToUseHooks`, we assign the parameters `memorizedStates` and `rerenderFunction` to the variables `states` and `rerender`, which are defined globally in the *hooks* module. Additionally, we reset the global variable `stateIndex` to `0`. It might actually seem quite strange that we set those values globally on the *hooks* module, as we have nothing like an instance of this module. So calling `prepareToUseHooks` again will overwrite the values we've just set. But this is actually not really a problem, as you will see when we look into the implementations of `useState` and `useEffect`, because those global values are just used temporarily.

With those two additions to `unwrapFunctionalFiber`, we have now covered the full implementation of this function, as the rest of the lines have already been discussed throughout the previous levels.


## The `useState` Hook

Now that we've seen how the use of hooks is being prepared, let's have a look at the implementation of the `useState` function.

```typescript
export function useState<T>(initialValue: T): [T, (newValue: T) => void] {
    // By assining these variables inside this function, their references are captured.
    // This means that when setState is called later, e.g., the capturedStates array
    // still has the same reference as it had at the time this function (useState) was called.
    const capturedStates = states
    const capturedRerender = rerender
    const capturedStateIndex = stateIndex

    // The current value of the state
    const state = (capturedStates[capturedStateIndex] ?? initialValue) as T

    // This function updates the values of the states and triggers a re-render of the component.
    const setState = (newValue: T) => {
        capturedStates[capturedStateIndex] = newValue
        capturedRerender()
    }

    // The state index is incremented, so the correct element from the array is taken as the state value.
    stateIndex++

    return [state, setState]
}
```

> Note the `<T>` after `useState`. This means that the function uses a generic type, that we call `T`. We define that both the parameter `initialValue` and the parameter of the closure that is returned are of the same type, which we declare by assigning `T` to both of them. If we later call `useState` with a number, `T` will correspond to the type `number`, if we call `useState` with a string, `T` will correspond to `string`, etc.

In the first three lines, our global variables `states`, `rerender` and `stateIndex`, which we set before in `prepareToUseHooks`, are now assigned to the local variables `capturedStates`, `capturedRerender` and `capturedStateIndex`. Remember how we previously said that it's not really a problem that those variables are set globally? This is the explanation for it. When a component is rendered, we first call `prepareToUseHooks`, followed by the `fiberFunction`, which is stored on the component we are going to render. The calls to `useState` are defined in the `fiberFunction`. That means that all `useState` calls of a component are executed before `prepareToUseHooks` is called for another component. Thus, the global variables are needed only for a really short time. They allow us to access what was passed to `prepareToUseHooks` inside `useState`, without having to pass those values directly to the `useState` call.

Next, we assign the constant `state`. For that, we check whether a value inside our `capturedStates` array exists at the index of `captuedStateIndex`. Remember that `capturedStates` is actually just a reference to the `memorizedStates` array, which belongs to the Fiber for which we define the state. If no value at `capturedStateIndex` exists in the `capturedStates` array, we use the `initialValue`, which was passed to the `useState` function.

After having retrieved the current state, we define our `setState` function (also called a closure). It takes one parameter `newValue`. Inside the function body of `setState` we *capture* the variables `capturedStates`, `capturedStateIndex` and `capturedRenderer`. This means that if we will later execute the `setState` function, the values will still be available inside `setState`, even though this will be *after* the `useState` function has been executed, and thus those variables would normally no longer exist. If you want to read more on closures and capturing variables inside closures, you might find [this page](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures) interesting.

Following the definition of our `setState` closure, we increment `stateIndex`. With that, it will be possible to later read out the current *state* value from the `capturedStates` array. This is possible because all `useState` calls defined in a component will always be called in the same order, thus when a component is re-rendered, `useState` will be called as many times at it has been called when it was rendered the previous time. And remember that inside `prepareToUseHooks`, we then reset `stateIndex` to `0`, to make sure that counting up is starting again from `0` for the next component that will be rendered.

Ultimately, we return `state` and `setState` in an array. Usually, we use a [destructuring assignment](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment) to set the returned values of `useState` to some constants, like we did with `text` and `setText` or `count` and `setCount` in the example we've looked at in the beginning of this level.

If we later call the closure defined in `setState` (which we called `setText` and `setCount` in the example), what is passed as `newValue` will be inserted into `capturedStates` (which still points at the same `memorizedStates` array inside the `FunctionalFiber`) at `capturedStateIndex`. As the state has changed, we should now trigger a re-rendering of the component. For that, we call the `capturedRerender` function.

Remember that we initially set what's now stored in `capturedRerender` inside `unwrapFunctionalFiber`, when we called `prepareToUseHooks`. If we go back there, we can see that what is going to be executed is `rerenderFunctionalFiber(fiber, container)`.


### Re-Rendering Fibers

So it would be good to also look at the implementation of `rerenderFunctionalFiber` at this point, to understand what actually happens when `capturedRerender` is executed.

```typescript
export function rerenderFunctionalFiber(fiber: FunctionalFiber, container: HTMLElement) {
    // The previous version is just a copy of the functionalFiber, which should be re-rendered.
    // This copy contains all expanded static fibers with their children -
    // the whole fiber tree below this functional fiber.
    // While rendering, the functional fiber will recompute all its children with the fiberFunction.
    // By providing this copy, the previous versions children are still retained and
    // can be compared to the new children generated by the fiberFunction.
    const previousVersion = { ...fiber }
    renderFiber(fiber, container, previousVersion)
}
```

As you can see, it's actually just two lines of code, but several lines of comments explaining the first line, in which the `previousVersion` is determined. If you read through them, it should be clear what is happening. Note that we use the [spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax), to make sure `previousVersion` is a *new* object, and not just a reference to `fiber`. This would be pointless, as `previousVersion` and `fiber` would contain a reference to the same object, which would not help to solve the problem that `previousVersion` solves.

You might remember that `previousVersion` was a parameter for a lot of functions (`renderFiber`, `expandChildFibers`), we looked at, but we never really used it so far. This will change now. As we have a copy of how the fiber and its children looked like, we can start a re-rendering and compare the newly created fibers (which will probably look different as the state has changed) with the old fibers. We will then only apply the changes to the DOM, instead of removing all contents and adding everything again from scratch.

Now, we will go through the most important functions in the rendering process and see what has to be changed, to work with this new parameter `previousVersion`. We start with the function `renderFiber` which is called on the last line of `rerenderFunctionalFiber`.


### Revisiting the `renderFiber` Function

```ts
function renderFiber(fiber: Fiber, container: HTMLElement, previousVersion?: Fiber, nextSibling?: Fiber) {
    // If the component is a functional fiber, execute its fiberFunction
    // to get the unwrapped StaticFiber properties merged into the same object.
    if (isFunctionalFiber(fiber)) unwrapFunctionalFiber(fiber, container, previousVersion)

    // After unwrapping, the fiber must contain all properties of a static fiber.
    if (!isStaticFiber(fiber)) throw new Error('Fiber did not contain all StaticFiber properties after unwrapping.')

    // highlight-start
    // Determines if the new fiber still has the same type as the old fiber.
    const areSameType = fiber && previousVersion && fiber.type === previousVersion.type

    // Got a fiber with the same type in the tree, so just update the contents of the DOM node.
    if (areSameType) updateFiberInDom(fiber, container, previousVersion, nextSibling)
    // The types did not match, create new DOM node and remove previous DOM node.
    else replaceFiberInDom(fiber, container, previousVersion, nextSibling)
    // highlight-end

    expandChildFibers(fiber, previousVersion)
}
```

You're looking at the almost complete implementation of the function `renderFiber`. In this version, we compare the `type`s of the `previousVersion` and the current `fiber`. If the `type`s match, we actually don't have to remove the old element from the DOM and insert the new element; we can just update its properties. 

> This is exactly what happens e.g., with the heading in the example. The `previousVersion` and the current `fiber` both have the same `type` (`h1`), so we just update their properties.

However, if the `type`s do not match, we have to remove the old fiber from the DOM and insert the new one. For this we call the function `replaceFiberInDom` which we already looked at in first level. If the `type`s match, we call the function `updateFiberInDom`, at which we're going to take a look now.

### The `updateFiberInDom` function
```ts
function updateFiberInDom(fiber: StaticFiber, container: HTMLElement, previousVersion: Fiber, nextSibling?: Fiber) {
    // Get DOM node from previous version
    const domNode = previousVersion.domNode
    if (!domNode) throw new Error('Could not update fiber, previous domNode was not set.')
    fiber.domNode = domNode

    // Update all props on DOM node
    updateDomNode(domNode, previousVersion?.props, fiber.props)

    // If the order has changed, the element has to be reinserted at correct position.
    // Note that insertBefore takes care of removing the element from the DOM before
    // re-inserting it, so it's not needed to remove it manually.
    if (nextSibling && domNode.nextSibling !== nextSibling?.domNode) {
        container.insertBefore(domNode, nextSibling?.domNode ?? null)
    }
}
```

What happens first, is that the reference to the `domNode` of the `previousVersion` is copied to the new `fiber`. If the `previousVersion` does not have a `domNode`, something went terribly wrong as this should never happen, so we just throw an error.

Next, we call the function `updateDomNode`, which we also took a look at in the first level. It will remove all properties from the `previousVersion` and set all properties of the current `fiber` on the `domNode`.

The last lines make sure, that the `domNode` is still at the correct position. Normally, we don't have to call `container.insertBefore` again, as the `domNode` is already rendered in the DOM. But if the order of the elements has changed, we sometimes have to call it again, to ensure to correct order. Note that `insertBefore` will automatically remove the element from the DOM in case it's already present, and then insert it again at the correct positon.


### Revisiting the `expandChildFibers` Function

Returning to the last line of `renderFiber`, we see that the call to the function `expandChildFibers` still stays the same. The only change is that the `previousVersion` is now no longer `undefined`. So let's take a look at the updated implementation of `expandChildFibers`.

```ts
function expandChildFibers(fiber: StaticFiber, previousVersion?: Fiber) {
    const currentChildren = fiber.children
    // highlight-next-line
    const previousChildren = previousVersion?.children ?? new Map<string, Fiber>()

    // If the domNode of the container is not a HTMLElement, no children can be added to it.
    const container = fiber.domNode
    if (!container || !isHTMLElement(container)) return

    // highlight-start
    // First, remove all previousChildren from the DOM, which don't exist in the currentChildren.
    previousChildren.forEach((previousChild, key) => {
        if (currentChildren.get(key) === undefined) previousChild.domNode?.remove()
    })
    // highlight-end

    // Go through all currentChildren and render them to the DOM.
    // highlight-next-line
    // The previous version is passed to determine the differences between the two versions.
    // The nextChildSibling is used to enforce the correct order in the DOM.
    // The order is reversed, to determine the nextChildSibling easily (to use insertBefore API).
    let nextChildSibling: Fiber | undefined
    const reversedChildren = Array.from(currentChildren.entries()).reverse()
    reversedChildren.forEach(([key, currentChild]) => {
        // highlight-start
        const previousChild = previousChildren.get(key)
        renderFiber(currentChild, container, previousChild, nextChildSibling)
        // highlight-end
        nextChildSibling = currentChild
    })
}
```

This function tries to find the correct children from the `previousVersion` and match them with the children of the current `fiber`. The children of a fiber are matched via their key in the `children` map. If no `key` was explicitly set in the props, the framework just assigns the keys in the order they were in the SJDON array.

First, we go through all the `previousVersion`'s children which don't have a match in the current `fiber`. This happens with the condition `currentChildren.get(key) === undefined`. Those children are directly removed from the DOM. 

> E.g., this would happen when the `previousVersion`s SJDON structure looked something like `['div', ['p', 'first'], ['p', 'second']]` and the current version is `['div', ['p', 'first']]`. The `['p', 'second']` element does not have a match and is directly removed from the DOM.

In the loop at the end of the function, we go through the `children` of the `currentFiber` and recursively call the `renderFiber` function. But first we try to find the child with the same key from the `previousVersion`. If it exists, it is passed as the third parameter, otherwise it is `undefined`.

> If the SJDON structure of `previousVersion` was `['div', ['p', 'first']]` and the current version is `['div', ['p', 'FIRST'], ['p', 'SECOND']]` the following would happen: For the child `['p', 'FIRST']` there is a match in the `previousVersion`, namely `['p', 'first']`, which will be passed as the `previousVersion` to the `renderFiber` function. For the child `['p', 'SECOND']` there is no match, so `undefined` is passed as the parameter `previousVersion` (because `previousChild.get(key)` returns `undefined`).

That's it, we've discussed the whole re-rendering process of the `useState` hook. Feel free to go through the steps again, as it was a lot: From the `setState` function which calls `rerenderFunctionalFiber`. There, we make use of the parameter `previousVersion` of the `renderFiber` function. We're comparing the versions and calling `replaceFiberInDom` or `updateFiberInDom` depending on the case. Afterwards, we recursively go through all the children with `expandChildFibers`.

## The `useEffect` Hook

With that, we can now look into the implementation of the second hook available in SuiWeb, which is `useEffect`.

```typescript
export function useEffect(action: () => void, dependencies?: unknown[]) {
    let shouldCallAction = false

    if (dependencies !== undefined) {
        // The state at the current index indicates, whether the first render has
        // happend. If this is the first render, the effect should be executed.
        const isFirstRender = states[stateIndex] !== true
        if (isFirstRender) {
            shouldCallAction = true
            // `true` indicates, that the first render has happened
            states[stateIndex] = true
        }
        // After the first-render-check, go to the next state-index
        stateIndex++
    } else {
        // There are no dependencies, so the action is called on every render
        shouldCallAction = true
    }

    dependencies?.forEach(dependency => {
        // Check whether the captured value in the hook is different
        // from the current value in the dependencies
        if (dependency !== states[stateIndex]) {
            shouldCallAction = true
        }
        states[stateIndex] = dependency
        stateIndex++
    })

    // If any criteria for a re-render is met, run `action`
    if (shouldCallAction) setTimeout(action)
}
```

For our `useEffect` hook, we create just one local variable `shouldCallAction`, with an initial value of `false`.

Then, we will check if there is something defined for the parameter `dependencies` (this could also be an empty array `[]`), to get the intended functionality as described in the [Using Hooks](#using-hooks) section of this level. If we have some value assigned for `dependencies`, we check whether the component has already been rendered once. To do so, we check if the current *state* (retrieved by accessing the global `states` array at `stateIndex`) is not equal to `true`. In that case, we set `shouldCallAction` to `true`, as this matches the criteria that the action of an effect should always be called for the first render. Additionally, we set the `states[stateIndex]` to `true`, such that `isFirstRender` will be `false` when this hook is executed in the next rendering cycle. Then, we increment `stateIndex`, as we inserted an extra item in our `states` array which stores whether the component has already been rendered.

If we haven't defined any dependencies when calling `useEffect`, `shouldCallAction` will always be `true`, and it's therefore also not needed to insert an extra value into `states` to indicate whether the first rendering of the component has already been done.

Now, we go through all values in `dependencies` and check, whether their value has changed to what is stored in `states[stateIndex]`. If this is the case, we set `shouldCallAction` to `true`, as if one of its dependency has changed, the action of an effect should be called. Then, we set the value of the current `dependency` in the loop to our `states[stateIndex]`, which allows detecting if the value of the `dependency` has changed on subsequent calls to `useEffect` and increment `stateIndex`.

In the last line of `useEffect`, we check if for all the conditions which were checked in the previous lines of the function, `shouldCallAction` has been set to `true` anywhere. In that case, `action` will be executed. Note that we use `setTimeout(action)` to make sure that `action` is executed *after* the component has been rendered, as `setTimeout` without specifying a delay, will run the function on the next event cycle. This is needed as per definition, the actions of an effect should be called *after* rendering of a component has finished.


## Review

With that, we finished the level on hooks, and you should now know how to use them, as well as how they work internally. Hooks are probably one of the most important concepts of React, that make it very powerful.

In the [next level](../5-parsing-jsx/README.md), we will look at how we can define our components using `JSX`, the syntax that is also used by React to define components. 
