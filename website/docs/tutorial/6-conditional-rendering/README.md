# Level 6: Conditionally Showing Elements

## Introduction

Until now, the components we defined always returned the same sub elements, so it was not possible, for example, to return a part of a component only if a certain condition is met. In this level, we will look at the additions that are needed to allow exactly this.


## Goal

- [Demo](https://suiweb.github.io/demos/tutorial/06-conditional-rendering/index.html)
- [Source Code](https://github.com/suiweb/suiweb/tree/main/demos/tutorial/06-conditional-rendering)

Below you can see the source code for the demo of this level. The `index.html` file will be the same again as in levels 1-4.


### `index.js`

```javascript
import { createElement } from '../../lib/js/fiber.js'
import { useState } from '../../lib/js/hooks.js'
import { render } from '../../lib/js/render.js'
import { parseSjdon } from '../../lib/js/sjdon.js'


const App = () => {
    const [show , setShow] = useState(false)
    
    return [
        'div',
        [
            'button', 
            `${ show ? 'Hide' : 'Show' } Text 1`, 
            { onclick: () => setShow(!show) }
        ],
        show && [TextField, { name: 'Text 1' }],
        [TextField , { name: 'Text 2' }]
    ]
}

const TextField = props => {
    const [text, setText] = useState(props?.initialValue ?? '')
    return [
        'div',
        ['label', `${props?.name}: `,
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

If we render the component, we can see a button and a text field with a label "Text 2". If we click the button, a second text field with a label "Text 1" is inserted *before* the other text field. When we enter text into a text field, it will be shown below the text field, prefixed with the text "Value: ". Note that the value of the second text field will remain, even if the first text field is hidden and shown again. It will just change its position.

We will not look in detail at the implementation of the `TextField` function, as it's a quite basic functional component using state, like we have already seen in previous demos.

We will, however, look into the implementation of the `App` component. In there, we can see that first, a button is defined, that has a different text depending on whether `show` is `true` or `false`. Then, we set an action for the `onclick` event of the button, in which we call `setShow(!show)`, which means that the value of `show` will be inverted on every button click.

In the following line, we can see some interesting syntax: `show && [TextField, { name: 'Text 1' }]`. This pattern is actually used quite frequently in JavaScript. If you are not yet familiar with it, it will basically just equal `false` in case of any value being *falsy* in the chain, or the last value otherwise. In other words, if we assigned this statement to a variable `const value = show && [TextField, { name: 'Text 1' }]`, `value` would be `false` if `show == false` and `[TextField, { name: 'Text 1' }]` otherwise. Note that nothing is rendered to the DOM if the value is `false`, meaning the text field is only shown if `show` is *truthy*.

In the last line, another `TextField` is added to the component, without any conditions.


## What Makes Conditional Rendering Difficult

What might feel quite natural when using, is actually a bit more complicated once you think about what is needed to make this work under the hood.

You might remember that, in order to retain the `memorizedStates` array of fibers between renderings, it is copied over from the previous version of that fiber. For that, we create a copy of the fiber inside `rerenderFunctionalFiber` and use it as the previous version. Then, we also need to go through the previous versions of all children of that fiber, which we do in `expandChildFibers`, as we can see in the excerpt of that function below.

```typescript
const reversedChildren = Array.from(currentChildren.entries()).reverse()
reversedChildren.forEach(([key, currentChild]) => {
    const previousChild = previousChildren.get(key)
    renderFiber(currentChild, container, previousChild, nextChildSibling)
})
```

To determine the previous child which matches the `currentChild`, we use the `key` at which the child is stored inside the `currentChildren` `Map`. Remember that this key is determined automatically (if not defined explicitly) based on the order at which the child was added to its parent.

This means that in our example, the button would have the key `d-0` (the `d-` is prefixed to prevent overlap of explicit and default keys; explicit keys will be prefixed with `e-`), and the first text field that is shown `d-1`. If there was a second text field, it would have the key `d-2`. 

Maybe you can already see the problem which will now arise: Because the first text field is only shown under certain conditions, the key of the second text field would actually be different, depending on whether the first is shown or not (`d-1` if the first text field is hidden, `d-2` if the first text field is shown). With that, matching of the current and previous version would no longer work. It would actually just copy over the `memorizedStates` into the *first* text field, as it receives the `d-1` key. The state of the *second* text field would be lost (moved to the first), because it receives the key `d-2` which does not match with anything from the previous version.

But as you have seen, the problem described here does not actually occur in SuiWeb, so we will look how this is made possible in the following section.


## The Idea of Placeholders

You might remember from the example in the beginning of this level, we don't render anything if an entry inside an SJDON array is `false`. This does not mean, however, that this element is not *seen* by the `createElement` function.

The idea behind conditional rendering is that we create a special placeholder fiber in case that an element is `undefined`, `null` or `false`. We will then not render this placeholder fiber to the DOM, but keep its representation like every other fiber in our fiber tree. With that, we make sure that also placeholders will get a key, thus the count of elements will always be constant, which ensures that default keys remain the same between rendering cycles, even if some components are not always shown.

Now, let's look at the actual implementation of what we just described.


### Creating Placeholder Fibers

To see where those placeholder fibers are created, we need to revisit the `mapChildren` function, at which we already looked at partly in [level 1](../1-static-rendering/README.md#mapping-children). The line that has been added is highlighted in the source code below.

```typescript
function mapChildren(childrenRaw: (Fiber | Primitive)[]): Map<string, Fiber> {
    const children = childrenRaw.map(child => {
        // highlight-next-line
        if (child == null || child === false) return createPlaceholderFiber()
        else if (isPrimitive(child)) return createTextFiber(child)
        else return child
    })

    // Use a Map to store children in, as this allows to set a custom key,
    // while also guaranteeing to preserve the order of insertion (unlike object).
    const childrenMap: Map<string, Fiber> = new Map()
    let defaultKey = 0
    children.forEach(child => {
        const childProps = isFunctionalFiber(child) ? child.functionProps : child.props
        // Keys are prefixed e-(xplicit) or d-(efault), so a custom key can never
        // accidentally match a generated key.
        const key = childProps?.key ? `e-${childProps?.key}` : `d-${defaultKey++}`
        childrenMap.set(key, child)
    })

    return childrenMap
}
```

If the current `child` in the loop is either `null`, `undefined` or `false`, a placeholder fiber will be created using the `createPlaceholderFiber` function.

```typescript
function createPlaceholderFiber(): StaticFiber {
    return {
        type: 'PLACEHOLDER_NODE',
        props: {},
        children: new Map(),
    }
}
```

The function, that is quite similar to `createTextFiber`, returns an object of type `StaticFiber`, which has a type of `PLACEHOLDER_NODE`, an empty `props` object and an empty `Map` of `children`. 


### Revisiting the `renderFiber` function

Now that we have seen how and when placeholder fibers are created, we'll also look at the full implementation of `renderFiber`, to see what we do with placeholder fibers there. The parts that are added are again highlighted in the code below.

```typescript
function renderFiber(fiber: Fiber, container: HTMLElement, previousVersion?: Fiber, nextSibling?: Fiber) {
    // If the component is a functional fiber, execute its fiberFunction
    // to get the unwrapped StaticFiber properties merged into the same object.
    if (isFunctionalFiber(fiber)) unwrapFunctionalFiber(fiber, container, previousVersion)

    // After unwrapping, the fiber must contain all properties of a static fiber.
    if (!isStaticFiber(fiber)) throw new Error('Fiber did not contain all StaticFiber properties after unwrapping.')

    // highlight-start
    // If the fiber is a placeholder, just remove the previous version, if exists.
    if (fiber.type === 'PLACEHOLDER_NODE') {
        fiber.domNode = undefined
        previousVersion?.domNode?.remove()
        return
    }
    // highlight-end

    // Determines if the new fiber still has the same type as the old fiber.
    const areSameType = fiber && previousVersion && fiber.type === previousVersion.type

    // Got a fiber with the same type in the tree, so just update the contents of the DOM node.
    if (areSameType) updateFiberInDom(fiber, container, previousVersion, nextSibling)
    // The types did not match, create new DOM node and remove previous DOM node.
    else replaceFiberInDom(fiber, container, previousVersion, nextSibling)

    expandChildFibers(fiber, previousVersion)
}
```

As you can see, if the `fiber`'s `type` equals `PLACEHOLDER_NODE`, its `domNode` property is set to `undefined` and the `domNode` of the `previousVersion` will be removed, in case it exists. 

This case will apply in the example shown in the beginning of this tutorial when the first text field is shown, and then removed. In the rendering phase in which the text field is removed, its type will be `PLACEHOLDER_NODE`, as we pass `false` instead of the text field. Thus, the HTML `input` element, that has been added to the DOM during the previous rendering phase, needs to be removed from the DOM now.


## Conditional Rendering in JSX

Now that we have seen how conditional rendering works in SJDON, we will also have a brief look at how the concept works in JSX.

For that, let's look at the following example, which represents the component we've looked at in the beginning of this level, just in JSX.

```jsx
import { createElement } from '../../lib/js/fiber.js'
import { useState } from '../../lib/js/hooks.js'
import { render } from '../../lib/js/render.js'

/** @jsx createElement */

const App = () => {
    const [show , setShow] = useState(false)
    
    return (
        <div>
            <button onclick={() => setShow(!show)}>
                {`${ show ? 'Hide' : 'Show' } Text 1`}
            </button>
            // highlight-next-line
            {show && <TextField name="Text 1" />}
            <TextField name="Text 2" />
        </div>
    )
}

const TextField = props => {
    const [text, setText] = useState(props?.initialValue ?? '')
    return (
        <div>
            <label>
                {props.name}
                <input 
                    value={text} 
                    oninput={event => setText(event.target.value)} 
                />
            </label>
        </div>
    )
}

render(
    <App />,
    document.getElementById('app')
)
```

As you can see, the syntax works quite similar to SJDON. We also use the `&&` to either return `false` or the `TextField` component. Note that we need to wrap the statement in curly braces `{ ... }`, as the code would otherwise not be valid JSX.


## Review

With that, we have looked at everything that is needed to render (or not render) elements based on simple conditions. There might, however, be cases where it will not be enough to have simple `if` conditions that decide on whether an element will be rendered or not. Think of examples that render a dynamic amount of elements, that could change based on certain criteria. For that, we need a more advanced technique to identify individual components. This is what we are going to look at in the [next level](../7-dynamic-rendering/README.md).
