# Level 3: Splitting Code Into Components

## Introduction

Now that we are able to define elements in SJDON, it's a good moment to think about organizing the code of our elements.

Imagine defining the whole structure of a website inside a single, static SJDON array. As you can imagine, this array will soon become quite big and messy. Also, we might need the same functionality multiple times on a page, so it would be nice if we could re-use those elements. This is where **Components** come in.

First, let's start with a simple example of something we could call a **Static Component**.

```javascript
const reusableParagraph = [
  'p', 
  'This paragraph is so nice, we want to reuse it' 
]

const sjdon = [
    'div',
    { className: 'container' },
    [ 'h1', { 'id': 'page-title' }, 'Welcome to SJDON' ],
    [ 'p', 'SJDON stands for Simple JavaScript DOM Notation.' ],
    reusableParagraph
]
```

Here, we can basically just define an SJDON structure in an array, and then insert this into another SJDON array, wherever we want to include the component. But as you can imagine, the use of this is quite limited, because it might not happen that often that you want to include *exactly the same* element multiple times.

So it would be useful if we could have some logic inside our components. This is where **Functional Components** come in. A functional component is actually just a JavaScript function which returns data in a specific way, in this case SJDON. This means that instead of defining the structure of an element from scratch every time we use it, we put the functionality inside a function and return the code for the element from there instead. This makes it easier to keep some order inside our code base, as we no longer have to define everything inside one huge array, but instead our definitions spread across multiple cohesive functions. More importantly, this also allows for easy re-use of elements, without defining them every time separately.


## Goal

- [Demo](https://suiweb.github.io/demos/tutorial/03-components/index.html)
- [Source Code](https://github.com/suiweb/suiweb/tree/main/demos/tutorial/03-components)

Let's look at the `index.js` file of the demo for this level.


### `index.js`

```javascript
import { createElement } from '../../lib/js/fiber.js'
import { parseSjdon } from '../../lib/js/sjdon.js'
import { render } from '../../lib/js/render.js'

function DateComponent({ size }) {
    const date = new Date().toUTCString()
    const style = { 
        fontWeight: 'bold',
        fontSize: size == 'big' ? '18px' : 'inherit'
    }
  
    return [ 
        'p',
        'The current date is: ', 
        [ 'span', { style }, date ]
    ]
}

const sjdon = [
    'div',
    { className: 'container' },
    [ 'h1', { 'id': 'page-title' }, 'Welcome to SJDON' ],
    [ 'p', 'SJDON stands for Simple JavaScript DOM Notation.' ],
    // highlight-next-line
    [ DateComponent, { size: 'big' } ]
]

render(
    parseSjdon(sjdon, createElement),
    document.getElementById('app')
)
```

We call this `DateComponent` function a functional component (or also functional element). Functional components are powerful as they're configurable via props, similar to static elements. The difference is that the props are not directly assigned to the HTML element, but passed as the first parameter to the function.

> If you're confused with the syntax `{ size }` which is used as the function parameter, this is called parameter destructuring. The first parameter is expected to be an object and its property `size` is directly accessed. It would be the same thing to have one parameter `props` and accessing `size` via `props.size`, it's just more convenient the other way.

If we look at the return value of `DateComponent`, we see that it returns an array with the structure of SJDON. If we would now like to use this component inside our SJDON structure, we can do so by using the SJDON element `[ DateComponent ]`. As with static elements, we can also define props and children on functional components. They are passed to the function as the first argument. In this example we assign the props `{ size: big }`. If we add children to the array, like `[ DateComponente, 'child']`, they are passed inside the props with the key `children`.

When the `DateComponent` is rendered, it will result in the function call `DateComponent({ size: 'big' })`. This will then display an HTML paragraph saying "The current date is: **Sun, 11 Dec 2022 13:12:56 GMT**", where the date, printed in bold, corresponds to the current date when the function `DateComponent` was executed. Depending on the value of `size` the font size would be set to `24px` or kept the same with `inherit`. 

## Revisiting the `parseSjdon` Function

As seen in the example, we encounter a new type of element `[ DateComponent ]`. In this case, the first item of the SJDON array is a function, not just a string like it was before. We have to update the `parseSjdon` function to make this work.

```typescript
export function parseSjdon<T>([type, ...rest]: SjdonElement, create: CreateElementFunction<T>): T {
    const propsArray = rest.filter(isSjdonProps)
    const props: Props = Object.assign({}, ...propsArray)
    const children = rest.filter(isSjdonChild)

    // highlight-next-line
    if (typeof type == 'string') {
        const parsedChildren = children.map(child => (isSjdonElement(child) ? parseSjdon(child, create) : child))
        return create(type, props, ...parsedChildren)
    // highlight-start
    } else {
        const fiberFunction = (props?: Record<string, unknown>) => parseSjdon(type({ ...props, children }), create)
        return create(fiberFunction, props)
    }
    // highlight-end
}
```

To handle the new functional elements, we have to distinguish between two cases. If the `type`, the first entry in the SJDON array, is a string, the same logic as before applies. However, if the `type` is a function, we can't just simply parse the `SjdonElement`. We have to "wait" until the function is executed and returns the generated SJDON array. To achieve that, we create a wrapper function, which executes the `type` function and calls `parseSjdon` with its return value. This wrapper function is called `fiberFunction` and passed as the first argument to the `create` function. You can also see that, as explained in the example, the props and the children are passed to the `type` function, so they're available to use inside the functional component.

## Revisiting the `createElement` Function

As seen in the `parseSjdon` function, we now call `createElement` with a function as the first parameter `type` if the SJDON element happens to be a functional component. In the first level, `type` could only be a valid HTML tag. That is why, in this level, we are going to revisit the `createElement` function in its full functionality, which allows us to not only use strings for the `type` parameter, but also functions.

Below, you can find the full implementation of `createElement`. As you can see, there is an additional part, starting at the line `if (type instanceof Function) {`, which adds some logic in case of the parameter `type` being an instance of a `Function`.

```typescript
export const createElement: CreateElementFunction<Fiber> = (type, props, ...children) => {
    const mappedChildren = mapChildren(children)
    const safeProps = props ?? {}

    // highlight-start
    // If the type is a function, create a functional fiber.
    if (type instanceof Function) {
        // A functional element can not have direct children, it is a function,
        // which can take in children as a prop and return a static element with children.
        if (mappedChildren.size > 0) throw new Error('A functional element can not have children.')

        return {
            fiberFunction: type,
            functionProps: safeProps,
            memorizedStates: [],
        }
    }
    // highlight-end
    // Otherwise create a static fiber.
    else return { type, props: safeProps, children: mappedChildren }
}
```

As it is invalid for a `Fiber` with a `type` of `Function` to have children at this level of the rendering cycle, an error will be thrown in that case. Otherwise, an object is returned, which satisfies the `FunctionalFiber` type.

> If you're confused why there can't be any children (at this stage) inside a `FunctionalFiber`, take a look again at the updated `parseSjdon` function. As the children are still in the SJDON format, the `FunctionalFiber` never really sees them. They are actually never passed to the `createElement` function, but rather directly passed to the functional component, so it can use it somewhere in its SJDON structure. 

Next, let's take a look at the type definition of `FuntionalFiber`.

```typescript
export type FunctionalFiber = {
    /**
     * The `fiberFunction` contains the information to generate the fiber.
     * It takes the `functionProps` as an argument, calls hooks and returns the generated `Fiber`.
     */
    fiberFunction: FiberFunction
    /**
     * The `functionProps` are the props which are passed to the `fiberFunction`. Differently to the
     * normal `props`, these are not added to the DOM and only used inside of the `fiberFunction`.
     * The normal `props` will be defined by the `StaticFiber`, which will be returned from executing
     * the `fiberFunction`.
     * These will be the `props` that will be added to the DOM node.
     * @see {@link StaticFiber}
     */
    functionProps: Readonly<Props>
    /**
     * The `memorizedStates` array contains all stored values of the component's hooks.
     */
    memorizedStates: unknown[]
} & Partial<StaticFiber>
```

As you can see in the last line of the type definition of `FunctionalFiber`, objects of this type can optionally contain all properties of a `StaticFiber`, indicated by `& Partial<StaticFiber>`. Additionally, there are three new properties, namely `fiberFunction`, `functionProps` and `memorizedStates`, which are specific to the type `FunctionalFiber`.

When we look again at the return statement of `createElement` for Functional Fibers, we see that we set the  parameter `type` as the property `fiberFunction` of the `FunctionalFiber`. Additionally, we assign `safeProps` to the property `functionProps`. When we later execute the function stored in `fiberFunction`, we will pass it the parameters stored in `functionProps`. Lastly, we initialize `memorizedStates` as an empty array. We will explore the use of `memorizedStates` in the next level, for now we just notice it is there.


## Revisiting the `renderFiber` Function

Now that we have looked at the properties of a Functional Fiber, we will explore how Functional Fibers are rendered to the DOM.

For that, we look at an updated implementation of `renderFiber`, which we have also only explored partially in the [first level](../1-static-rendering/README.md#the-renderfiber-function) of this tutorial.

```typescript
function renderFiber(fiber: Fiber, container: HTMLElement, previousVersion?: Fiber, nextSibling?: Fiber) {
    // If the component is a functional fiber, execute its fiberFunction
    // to get the unwrapped StaticFiber properties merged into the same object.
    // highlight-next-line
    if (isFunctionalFiber(fiber)) unwrapFunctionalFiber(fiber, container, previousVersion)

    // After unwrapping, the fiber must contain all properties of a static fiber.
    if (!isStaticFiber(fiber)) throw new Error('Fiber did not contain all StaticFiber properties after unwrapping.')

    replaceFiberInDom(fiber, container, previousVersion, nextSibling)

    expandChildFibers(fiber, previousVersion)
}
```

We detect that the first line of the function has been added since the last time. It checks whether the `fiber` that was passed is of type `FunctionalFiber`. In that case, we *unwrap* the `FunctionalFiber` using the `unwrapFunctionalFiber` function, which basically means that we execute the function stored in `fiberFuntion`, which should then return a `StaticFiber`. Now, you might also better understand why we have the check in the following line, whether the `fiber` is now a `StaticFiber`, as this should be the case after unwrapping the `FunctionalFiber`. If that is not the case, we ran into some unexpected state that should actually never occur, so we'll throw an error.


### Unwrapping Functional Fibers

To understand what's exactly happening when unwrapping a `FunctionalFiber`, we are going to have a closer look at a slightly simplified implementation of `unwrapFunctionalFiber` now.

```typescript
function unwrapFunctionalFiber(fiber: FunctionalFiber, container: HTMLElement, previousVersion?: Fiber) {
    // Unwrap fibers until the fiberFunction returns a StaticFiber.
    let unwrappedFiber = fiber.fiberFunction(fiber.functionProps)
    while (isFunctionalFiber(unwrappedFiber))
        unwrappedFiber = unwrappedFiber.fiberFunction(unwrappedFiber.functionProps)

    // Merge all properties of the unwrappedFiber into the functional fiber.
    Object.assign(fiber, unwrappedFiber)
}
```

We can see that we execute the `fiberFunction` of the `fiber`, pass it `functionProps` as its argument and assign it to `unwrappedFiber`.

In the following line, we check if `unwrappedFiber` is still a `FunctionalFiber`, which could happen, as a `FunctionalFiber` could in theory return another `FunctionalFiber`. We repeat the action of executing the `fiberFunction` so many times, until `unwrappedFiber` is no longer a `FunctionalFiber`, meaning it's now of type `StaticFiber`.

What happens then might actually be a bit confusing at first sight. We use `Object.assign` to copy all properties of `unwrappedFiber` into our original `fiber`. This means that `fiber` is now actually *both* a `StaticFiber` and a `FunctionalFiber`.

At the moment, you might not understand why we do this, instead of just returning the `unwrappedFiber`. However, it will become quite important later, when we look at how components can be re-rendered, if their *state* changes. For the moment, you should just understand *what* is happening, and we'll explain *why* it's happening in the following level.

Note that since we are assigning the properties of `unwrappedFiber` to the same `fiber` we passed to the function, we don't need to return anything, as we have a *reference* to this object already where we called `unwrapFunctionalFiber`, just with the difference that the `fiber` now contains some more properties.


## Review

Except of unwrapping Functional Fibers in `renderFiber`, there is no additional functionality needed for supporting Functional Fibers in the form we have looked at so far, since our Functional Fibers become Static Fibers as well. Thus, rendering works almost the same as for *normal* Static Fibers, which we have already covered in the first level.

The next big enhancement will be the introduction of *state* in fibers using hooks. And this is exactly what we are going to look at in the [next level](../4-hooks/README.md).
