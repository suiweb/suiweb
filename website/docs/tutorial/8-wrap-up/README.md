# Level 8: Wrapping Everything Up

## Introduction

Now that we have looked at all the functionality SuiWeb provides, we are going to look at all the calls that happen when we render an app with SuiWeb. We will no longer look into the implementations of the functions, but just at the order, in which they are called.


## Goal

- [Demo](https://suiweb.github.io/demos/tutorial/08-wrap-up/index.html)
- [Source Code](https://github.com/suiweb/suiweb/tree/main/demos/tutorial/08-wrap-up)

The demo we set up for this level consists of three components, `App`, `DateComponent` and `Counter`. The component `App` returns a `h1` title, a `DateCompoennt` and a `Counter`, which are all wrapped in a `div`. The `DateCompoent` returns a string which contains a timestamp of the date when it was rendered. In the `Counter` component, we return another `DateComponent` and a `button` showing the amount of times it has been clicked. The `Counter` component is also wrapped in a `div`, which has a `backgroundColor` of `Aquamarine`. This helps us to better see what is contained inside this component.

If you click the button, you can see that its count is incremented. As this changes the state of the `Counter` component, it will be re-rendered and thus the `DateComponent` inside `Counter` will be re-executed, resulting in its timestamp being updated. If you look at the console, you can see that an effect is called every time the button is clicked, as the `count` constant changes.

As the other `DateComponent` is added inside the `App` component, it will *not* be re-rendered if the button is clicked, as the state of the button is not defined in `App`. This illustrates that only the components (and their subcomponents) are re-rendered that contain a state that has changed.

Below, you can see the source code of our `index.js`. Our `index.html` is again the same as in all other levels that used SJDON.


### `index.js`

```javascript
import { createElement } from '../../lib/js/fiber.js'
import { useEffect, useState } from '../../lib/js/hooks.js'
import { render } from '../../lib/js/render.js'
import { parseSjdon } from '../../lib/js/sjdon.js'


const App = () => {
    return [
        'div',
        ['h1', 'Wrap Up'],
        [DateComponent],
        [Counter]
    ]
}

const DateComponent = () => {
    return [
        'p', 
        'If value changed, the component was rerendered: ', ['strong', Date.now()],
    ]
}

const Counter = () => {
    const [count, setCount] = useState(0)

    useEffect(
        () => console.log(`The value of count has changed: ${count}`),
        [count]
    )

    return [
        'div', 
        { 
            style: {
                backgroundColor: 'Aquamarine',
                padding: '1rem'
            }
        },
        [
            'button', 
            { onclick: () => setCount(count + 1) }, 
            `Clicked ${count} times`
        ],
        [DateComponent]
    ]
}

const rootFiber = parseSjdon([App], createElement)

render(rootFiber, document.getElementById('app'))
```


## First Rendering of our App

We will create a list representing the order of functions that are called for all the calls that happen when rendering `App` the first time.


### Parsing SJDON

First, let's see the calls needed to parse our SJDON array into `Fiber`s.

- `const rootFiber = parseSjdon([App], createElement)` to create fibers from SJDON
  - If `typeof type == 'string'`, we call `createElement(type, props, ...parsedChildren`
  - Else we call `createElement(fiberFunction, props)`
  - **We do the same for all children of the fiber**


### Rendering the Root Fiber

We call `render(rootFiber, document.getElementById('app'))` using our now parsed root fiber and a reference to the container in which we want to render the root fiber. We will make sure in this function that all other elements contained inside our container will be removed. Then, we start with the actual rendering.

- `renderFiber(fiber, container)`
  - `unwrapFunctionalFiber(fiber, container)` if the fiber which we want to render is a `FunctionalFiber`
    - `prepareToUseHooks(fiber.memorizedStates, () => rerenderFunctionalFiber(fiber, container)` to setup hooks, register the re-render function for the component
    - `fiber.fiberFunction(fiber.functionProps)` to execute functional fibers
      - Calls to `useState` and `useEffect` of the that fiber are made
      - Actions of `useEffect` calls are scheduled for next event cycle using `setTimeout(action)`
    - `Object.assign(fiber, unwrappedFiber)` to merge the original functional fiber with its unwrapped version, while keeping the same object
  - `replaceFiberInDom(fiber, container)` as there is no previous version of our fiber, thus `areSameType` will always be false for the initial rendering
    - `createDomNode(fiber)` to create an HTML element from our fiber
    - `container.insertBefore(newDomNode, nextSibling?.domNode ?? null)` to add our HTML element to the DOM
  - `expandChildFibers(fiber)` to go through all the children of the fiber we pass
    - `renderFiber(currentChild, container, previousChild, nextChildSibling)` **for each child, repeat all the steps in this list**
- Actions of `useEffect` calls are executed when rendering has finished, as the next event cycle starts then


### Re-Rendering Due to a Change in a State

Imagine what happens now when we click the button inside our `Counter` component, which calls `setCount(count + 1)`, that corresponds to the `setState` function of our `counter` state.

- Set the new value passed to `setState` inside `capturedStates`
- `capturedRerender()` to execute the re-render function that was captured inside the `setState` closure before and registered using `prepareToUseHooks`
  - `rerenderFunctionalFiber(fiber, container)` is called, as this was stored inside the `capturedRerender` closure
    - `renderFiber(fiber, container, previousVersion)` to re-render the fiber
      - `unwrapFunctionalFiber(fiber, container, previousVersion)` 
        - Copy over the `memorizedStates` array of `previousVersion` to the new fiber 
        - Re-execute the fiber's `fiberFunction`
          - Calls to `useState` and `useEffect` of the that fiber are made (state now contains updated values)
          - Actions of `useEffect` calls are scheduled for next event cycle using `setTimeout(action)`, if one of the effects dependencies has changed
        - `Object.assign(fiber, unwrappedFiber)` to merge the original functional fiber with its unwrapped version, while keeping the same object
      - `const areSameType = fiber && previousVersion && fiber.type === previousVersion.type` to check whether the new fiber is of the same type as its previous version was
        - If `areSameType`, `updateFiberInDom(fiber, container, previousVersion, nextSibling)`
          - `updateDomNode(domNode, previousVersion?.props, fiber.props)` to update the HTML element that already exists on the DOM with its new props
          - If the order of the element has changed, re-insert the element in the DOM (which automatically removes the element at its other position in the DOM) by calling `container.insertBefore(domNode, nextSibling?.domNode ?? null)`
        - Else `replaceFiberInDom(fiber, container, previousVersion, nextSibling)`
          - `createDomNode(fiber)` to create an HTML element from our fiber
          - `container.insertBefore(newDomNode, nextSibling?.domNode ?? null)` to add our HTML element to the DOM
      - `expandChildFibers(fiber)` to go through all the children of the fiber we pass
    - `renderFiber(currentChild, container, previousChild, nextChildSibling)` **for each child, start again from `renderFiber(fiber, container, previousVersion)`**
- Actions of `useEffect` calls are executed when rendering has finished, as the next event cycle starts then


## Review

With that, the final level of this tutorial is coming to an end. The lists above, showing the order in which calls are made as part of rendering our fibers, might support you to get an idea how a whole rendering cycle works. It might be helpful to also look at the source code of SuiWeb, while going through the lists of calls that are made. We have realized ourselves that it's sometimes hard to understand which functions are called as part of a rendering cycle, when we analyzed the source code of React and [Build your own React](https://pomb.us/build-your-own-react/), so we hope that this list can give you at least *some* help to better understand this whole process.

We hope that this tutorial helped you to understand how you can use SuiWeb, but also how its functionality is achieved internally. If you like to build applications in that way, you might want to have a look at [React](https://reactjs.org/), the framework whose concepts we tried to explain with SuiWeb. React comes with a lot of additional functionality and performance optimization, which make it much better suited for production ready applications.

Thanks for working through our tutorial 🙂
