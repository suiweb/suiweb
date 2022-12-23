# Level 7: Rendering a Dynamic Amount of Elements

## Introduction

In the previous level we have seen a possibility to only show a component if a certain condition is met. But what if we need some more flexibility on which items are displayed, by using a function such as `map` to render each item of a dataset as a component. And what if the items or the order of the items in the dataset changes? It becomes clear that the current way to identify items just with the order in which they have been added will no longer work after a change in the dataset. That's why we need a more advanced way to identify our items, even if the underlying dataset has changed. For that, we look at the possibility to define a `key` for elements, which will be necessary to solve problems like the one described before.


## Goal

- [Demo](https://suiweb.github.io/demos/tutorial/07-dynamic-rendering/index.html)
- [Source Code](https://github.com/suiweb/suiweb/tree/main/demos/tutorial/07-dynamic-rendering)

Let's look at the demo we have set up for this level. We try to recreate a situation similar to the one described in the introduction.

We have two arrays of objects, `primary` and `alternate`, which represent our changing dataset. The objects in the dataset contain two properties `key` and `name`. Additionally, we have a button, that changes the state of `toggle` on every click. Based on the value of `toggle`, the value of `mapped` is assigned: If toggle is `true`, we create a `TextField` component for every item in `primary`, else we create a `TextField` for every item in `alternate`. In the return statement of the function, we spread all items of `mapped`, so they will be added as children to the `div` wrapping the items.

You can see the source code of this demo below.


### `index.js`

```javascript
import { createElement } from '../../lib/js/fiber.js'
import { useState } from '../../lib/js/hooks.js'
import { render } from '../../lib/js/render.js'
import { parseSjdon } from '../../lib/js/sjdon.js'


const App = () => {
    const [toggle, setToggle] = useState(true)

    const primary = [
        { key: 'first', name: 'First (primary)' },
        { key: 'second', name: 'Second (primary)' },
        { key: 'third', name: 'Third (primary)' },
        { key: 'fourth', name: 'Fourth (primary)' },
        { key: 'fifth', name: 'Fifth (primary)' },
        { key: 'sixth', name: 'Sixth (primary)' },
    ]
    const alternate = [
        { key: 'third', name: 'Third (alternate)' },
        { key: 'fourth', name: 'Fourth (alternate)' },
        { key: 'second', name: 'Second (alternate)' },
    ]

    const mapped = toggle
        ? primary.map((item, idx) => [TextField, { name: item.name, key: item.key }])
        : alternate.map((item, idx) => [TextField, { name: item.name, key: item.key }])

    return [
        'div',
        ['button', { onclick: () => setToggle(!toggle) }, `Toggled:${toggle}`],
        ...mapped,
    ]
}

const TextField = props => {
    const [text, setText] = useState(props?.initialValue ?? '')
    return [
        'div',
        ['label', `Key: ${props?.key}, Name: ${props?.name} `,
            [
                'input',
                {
                    value: text,
                    oninput: event => setText(event.target.value),
                },
            ],
        ],
        ['p', 'Value: ', ['strong', text]],
    ]
}

render(
    parseSjdon([App], createElement), 
    document.getElementById('app')
)
```

If we render this app and enter some values into the text fields and then click the toggle button, we realize that some text fields will disappear, some change their position and others are added. You should understand what changes happen when you compare `primary` and `alternate` in the example above. If we think back to the [previous level](../6-conditional-rendering/README.md), you might realize that something like this would not have been possible using the conditional rendering we've looked at so far, as SuiWeb now seems to recognize that something is the same item, even though the order has changed. The reason why this is possible now, is that we assigned an explicit `key` to our items. You can see inside the assignment of `mapped`, where we create a `TextField` for every item, that we set the property `key` of the `TextField` component to the value of `item.key`.


## Implementation in `mapChildren`

Below, we can see an excerpt of the `mapChildren` function, at which we already looked in previous levels. The highlighted lines show that we insert a child fiber with the key `e-${childProps?.key}` into the `childrenMap` on its parent fiber, in case `childProps` contains the property `key`. This is the case in the example of this level, as we passed a property `key` in the props of the component. Otherwise, the default key `d-${defaultKey++}` would be used, what we have already seen in the [previous level](../6-conditional-rendering/README.md). 

```typescript
const childrenMap: Map<string, Fiber> = new Map()
let defaultKey = 0
children.forEach(child => {
    const childProps = isFunctionalFiber(child) ? child.functionProps : child.props
    // Keys are prefixed e-(xplicit) or d-(efault), so a custom key can never
    // accidentally match a generated key.
    // highlight-start
    const key = childProps?.key ? `e-${childProps?.key}` : `d-${defaultKey++}`
    childrenMap.set(key, child)
    // highlight-end
})
```

> Note that by prefixing our keys with either `e` (for **e**xplicit) or `d` (for **d**efault), we make sure that we never accidentally assign an explicit key that is identical to a default key.

As we now have a unique key to differentiate all the sibling elements (in the example the `TextField`s), the function `expandChildFibers`, which we looked at in the previous levels, does not have any problem finding the correct child elements in the `previousVersion`, even if the order of the children has completely changed. By setting the `key` manually, the order is now completely irrelevant (in contrast to default keys, where the keys are created incrementally in the order of the children).

## Review

This has already been it for this level. As you have seen, assigning explicit keys internally works almost the same as generating a default key. The only difference is that if we want to use an explicit key, we need to pass it via the props of the component.

With this level, you should also understand why it's required in some cases to assign an explicit key, while we can omit it in other cases, because we can do some internal *tricks*, such as using placeholder fibers.

By the way: In React, about the same rules apply on when a key can be generated automatically, and when one needs to be set explicitly.

Now, we have completed basically all the functionality of SuiWeb. In the [next level](../8-wrap-up/README.md), we are going to wrap everything up, by looking at the full chain of function calls that occur if we render an app with SuiWeb.
