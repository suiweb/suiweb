# Level 1: Rendering Static Elements

## Introduction

In the first level of the tutorial, we're going to have a look at the [`render`](/docs/api/internal/modules/render#render) and the [`createElement`](/docs/api/internal/modules/fiber#createelement) function of SuiWeb and see how they can be used to render a simple element to the DOM.


## Goal

- [Demo](https://suiweb.github.io/demos/tutorial/01-static-rendering/index.html)
- [Source Code](https://github.com/suiweb/suiweb/tree/main/demos/tutorial/01-static-rendering)

We will explore what a `Fiber` is, how it can be created and how it can then be rendered to the DOM. For that, we set up a project containing SuiWeb in a directory called `lib`, as explained in the [getting started guide](./../../getting-started.md).

Additionally, we'll have to create two files, `index.html` and `index.js`, as described below. Alternatively, you can also download the source code of this level with the link at the beginning of the section.


### `index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SuiWeb App</title>
    <script type="module" src="index.js"></script>
</head>
<body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="app"></div>
</body>
</html>
```

Unless stated differently in a level, the `index.html` file will be the same for all future demos, as it just contains some static structure which is needed such that a SuiWeb app can be rendered inside it.


### `index.js`

```javascript
import { createElement } from '../../lib/js/fiber.js'
import { render } from '../../lib/js/render.js'

const fiber = createElement('h1', { style: { color: 'Salmon' } }, 'Hello World')

render(
    fiber,
    document.getElementById('app')
)
```

The `index.js` file is where the actual logic happens, namely two calls to the functions `createElement` and `render`.

If we run a local web server containing the following files, we should see a page containing a `h1` title with the value "Hello World". If you think that it's pretty useless to render this simple HTML using some fancy JavaScript functions, and it would be much easier to just directly create this page in HTML, you're actually right. But it's important to understand how this works, because it will make it a lot easier to later understand how dynamic rendering works.

So, we'll now dive into the logic of those two functions and explore what happens under the hood.


## The `createElement` Function

To call the `render` function of SuiWeb, we need to pass it some object of type `Fiber`. A fiber is nothing more than a JavaScript object, which contains the necessary properties such that the render function can later create an HTML element from it and render it to the DOM. We call it `Fiber`, as this is the name that is also used in `React` for this type of objects.

When looking at the type definition of `Fiber`, we can see that it's actually just an alias to describe that the object is either of type `StaticFiber` or `FunctionalFiber`.

```typescript
export type Fiber = StaticFiber | FunctionalFiber
```

> For this level, we'll just look at `StaticFibers`, so you can consider `Fiber` and `StaticFiber` to be the same type for now.

To create a new `Fiber`, we utilize the `createElement` function of SuiWeb. Later, you would actually not call this method by yourself. Instead, this is the method that is called by a tool like [Babel](https://babeljs.io/) when transforming JSX to normal JavaScript, or the `parseSjdon` function of SuiWeb. But for now, we'll use it directly, as it helps to then also understand how the other methods described work.

If we look at the definition of `createElement`, we can see that it expects a variable amount of parameters, namely a `type`, `props` and a variable amount of `children`. Note that inside this function, some parts have been left away in this example, as they are not yet relevant.

```typescript
export const createElement: CreateElementFunction<Fiber> = (type, props, ...children) => {
    const mappedChildren = mapChildren(children)
    const safeProps = props ?? {}

    return { type, props: safeProps, children: mappedChildren }
}
```

> Note: If you're wondering why this function is defined using the `const` keyword, and not, like the other functions in this framework, using `function`, it's because this function will later be used in a context where it should be interchangeable, such that it had to be ensured that it satisfies the `CreateElementFunction<T>` type, which is only possible using this notation.

By looking at the type of `createElement`, named `CreateElementFunction<T>`, we can see the parameter `type` can either be a key of `HTMLElementTagNameMap` or some function. For now, we'll ignore the part that it could also be a function (`((props?: Record<string, unknown>) => T)`) and just focus on `HTMLElementTagNameMap`. If you have [enabled type checking](https://code.visualstudio.com/docs/nodejs/working-with-javascript#_type-checking-javascript) for your file or project, this will make sure that `type` is a string, which is a valid HTML tag name, such as `div`, `h1`, `p` or any other valid tag name. In case you entered an invalid string, such as `dif`, the type checker would detect that the value is invalid and thus help you identify this error.

```typescript
export type CreateElementFunction<T = Fiber> = (
    type: keyof HTMLElementTagNameMap | ((props?: Record<string, unknown>) => T),
    props: Props | null,
    ...children: (T | Primitive)[]
) => T
```

Next, we have the parameter `props` of type `Props`. For now, we'll not look more closely into the type definition of `Props`, but just say that it is some object which has some constraints on its properties.

As the last parameter, we have a variable amount of children, which are either of the generic type `T` (which is typically equal to `Fiber` in this context), or `Primitive`, which basically just means it's either of type `string`, `number`, `boolean`, `symbol`, `null` or `undefined`.


### Mapping Children

If we now go back to our `createElement` function, we see that the first call that is made goes to a function called `mapChildren`, which takes as its parameter the array of children that were passed to `createElement`.

```typescript
function mapChildren(childrenRaw: (Fiber | Primitive)[]): Map<string, Fiber> {
    const children = childrenRaw.map(child => {
        if (isPrimitive(child)) return createTextFiber(child)
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


### Handling of Text Nodes

Looking at the function definition of `mapChildren`, we can see that in case of a child being `Primitive` (as explained before), `createTextFiber` is called, which wraps the primitive value (named `text` in the function parameter), into a special kind of `Fiber` object, with the special type `TEXT_NODE`. We'll explore later why this is needed.

```typescript
function createTextFiber(text: NonNullable<Primitive>): StaticFiber {
    return {
        type: 'TEXT_NODE',
        props: {
            nodeValue: text.toString(),
        },
        children: new Map(),
    }
}
```

What happens next inside `mapChildren` is actually mostly about defining a unique key for each child element of a `Fiber`. The key can either be specified explicitly as part of the `props` object which is passed to the `createElement` function, or a default key will be generated, in case no explicit key is defined. The function will then return a `Map`, which contains all the children with their corresponding key.

Going back to where we are in our `createElement` function, we can see that an empty object is assigned to `safeProps`, in case of the parameter `props` being nullish. Then, a new object is returned, which contains the properties `type`, `props` and `children`, while some properties have been transformed as described. This object is actually of type `StaticFiber`. What we have not seen yet is the property `domNode`, which will be set later in the rendering process.

```typescript
/**
 * A `StaticFiber` represents a static element in the DOM. It does not contain
 * a function and thus can't use hooks, so it will never trigger a re-render.
 * It is completely defined by its `type`, `props` and `children`.
 * Its `domNode` will be assigned when it is rendered to the DOM.
 */
export type StaticFiber = {
    /**
     * The type of the static fiber.
     * It is either a html tag or a custom tag for text or placeholder nodes.
     */
    type: StaticFiberType
    /**
     * The props of the static fiber. These will be added to them DOM node when it is rendered.
     * There are special props like `key` which serve their custom purpose and are not added to the DOM node.
     * @see {@link isNormalProp}
     */
    props: Readonly<Props>
    /**
     * The children of the fiber are stored in a map where every child has a unique key.
     * If no `key` is provided in the `props` of the corresponding child, a default key is used.
     */
    children: Map<string, Fiber>
    /**
     * The reference to the DOM node which this fiber represents.
     * Is only set when the fiber is rendered.
     */
    domNode?: HTMLElement | Text | undefined
}
```

That's it, you now know what a basic `StaticFiber` looks like. 


## The `render` Function

Next, we'll have a look at how such a `Fiber` can now be rendered to the DOM.

For that, let's have a look at the definition of the `render` function:

```typescript
export function render(fiber: Fiber, container: HTMLElement) {
    while (container.firstChild) container.firstChild?.remove()
    // No previous version is specified, as it is the first render.
    renderFiber(fiber, container)
}
```

We can see that it expects two parameters. The first parameter named `fiber` is an object of type `Fiber`, which we have just explored. The second parameter `container` is of the type `HTMLElement`. Inside the container the newly created element will be rendered, meaning it's a reference to some HTML element that must already exist inside the DOM when we call the `render` function. In the example of `index.js` given at the beginning of this level, you can see that we can get such a reference for example by calling `document.getElementById('app')`.

In the first line of the `render` function, all elements that already exist inside `container` are first removed. With that, we make sure that only elements which are rendered by SuiWeb exist inside the container, which makes the result more predictable.

### The `renderFiber` Function

After this, the function `renderFiber` is called. This function is not publicly exported, meaning that unlike `render`, it does not have the `export` keyword before the function definition, and thus we can't call it directly.

For now, let's look at a simpler version of the `renderFiber` function, which contains just the elements we need in this level. Of course, you can also look at the *real* function definition in the source code of SuiWeb, but this will contain a lot more code which we will not *yet* explain in this level, so it might be a bit confusing for the moment.

```typescript
function renderFiber(fiber: Fiber, container: HTMLElement, previousVersion?: Fiber, nextSibling?: Fiber) {
    if (!isStaticFiber(fiber)) throw new Error('Fiber did not contain all StaticFiber properties after unwrapping.')

    replaceFiberInDom(fiber, container, previousVersion, nextSibling)

    expandChildFibers(fiber, previousVersion)
}
```

You can see that the function contains four parameters in total, of which the last two are optional. In our first call to `renderFiber` inside the `render` function, we omit those optional parameters, so you can assume that the parameters `previousVersion` and `nextSibling` are `undefined` in the snippet above.

In the first line, it is checked whether the parameter `fiber` satisfies the type `StaticFiber`, by calling `isStaticFiber(fiber)`. If this is not the case, an error will be thrown. For the moment, we will not go too deep into why this check is there, as it will only become really relevant when we also deal with Functional Fibers. 

Next, the execution will continue with a call to `replaceFiberInDom`.


### Creating DOM Nodes

```typescript
function replaceFiberInDom(fiber: StaticFiber, container: HTMLElement, previousVersion?: Fiber, nextSibling?: Fiber) {
    // Remove DOM node of the previous version from the DOM
    previousVersion?.domNode?.remove()

    // Create DOM node for new fiber
    const newDomNode = createDomNode(fiber)
    fiber.domNode = newDomNode
    container.insertBefore(newDomNode, nextSibling?.domNode ?? null)
}
```

As we have not passed anything for `previousVersion`, the first line does not do anything. It will become important later, when we deal with re-rendering. Next, a new DOM node is created, which is either an `HTMLElement` or a `Text` element. Those are built-in types of JavaScript which are used for elements inside an HTML page. 

On the last line, the created element is inserted into the DOM. As the `nextSibling` is currently `undefined`, it will just be added as the last child inside the `container`. Later, when rendering the children of this fiber, we will use the `nextSibling` to insert the element at the correct position in the `container` (before its next sibling).

If we look at the `createDomNode` function, we can see that here we make use of our special `Fiber` with type `TEXT_NODE`. If we detect a `Fiber` to be of this type, we will use `document.createTextNode('')` to create a new object of type `Text`, which can then be used for example as the text value of a `p` HTML tag. Note that we create a `Text` node with an empty value for now, as we'll update the text value in the next step anyway.

```typescript
export function createDomNode(fiber: StaticFiber): Text | HTMLElement {
    // The elements are created "empty", without any props. These will be assigned in updateDomNode (e.g. nodeValue of a Text).
    const domNode = fiber.type === 'TEXT_NODE' ? document.createTextNode('') : document.createElement(fiber.type)
    // Set to props of the fiber.
    updateDomNode(domNode, undefined, fiber.props)

    return domNode
}
```

In case of `type` being of any other value, we use `document.createElement(fiber.type)` to create a new HTML element with the type that is present in the `fiber`'s `type` property.


### Updating DOM Nodes

After we created our `domNode`, it's time to make sure that this node contains all it's required properties. For that, we call the function `updateDomNode`, and pass it our `domNode` and the `props` of our `fiber`. Note that `undefined` is passed for the second parameter (`previousProps`) as there are no previous props in case of creating a *new* DOM node. Previous props will become relevant later, when we *update* an existing DOM node.

```typescript
export function updateDomNode(domNode: HTMLElement | Text, previousProps: Props = {}, currentProps: Props = {}) {
    if (isText(domNode)) {
        domNode.nodeValue = currentProps.nodeValue ?? ''
        return
    }

    const isEvent = (key: string) => key.startsWith('on')

    // Remove old event-listeners
    Object.keys(previousProps)
        .filter(isEvent)
        .forEach(name => {
            const eventType = name.toLowerCase().substring(2)
            const event = previousProps[name] as EventListenerOrEventListenerObject
            domNode.removeEventListener(eventType, event)
        })

    // Add new event-listeners
    Object.keys(currentProps)
        .filter(isEvent)
        .forEach(name => {
            const eventType = name.toLowerCase().substring(2)
            const event = currentProps[name] as EventListenerOrEventListenerObject
            domNode?.addEventListener(eventType, event)
        })

    // Remove old properties
    Object.keys(previousProps)
        .filter(isNormalProp)
        .forEach(name => {
            domNode.removeAttribute(name)
        })

    // Set new properties
    Object.keys(currentProps)
        .filter(isNormalProp)
        .forEach(name => {
            const value = currentProps[name]?.toString()
            if (value) domNode.setAttribute(name, value)
        })

    // Upate special style prop
    updateStyleAttribute(domNode, currentProps.style)
}
```

The implementation of `updateDomNode` is actually quite straight forward and should be self-explanatory by looking at the code and the corresponding comments: We just loop through all `previousProps` and *remove* them from the node, and then through all `currentProps`, which we *add* to the node. This allows updating existing elements in the DOM, which we do not need now, but will be relevant later. For `Text` nodes, we can also see that their value is updated, by setting the `nodeValue` of the `domNode` to the value which is present in `currentProps`.

Lastly, style attributes are updated using the `updateStyleAttributes` function, of which the implementation is below.

```typescript
function updateStyleAttribute(htmlElement: HTMLElement, styles: StyleProp = {}) {
    const updateObjStyles = (styleObj: Partial<CSSStyleDeclaration>) =>
        Object.entries(styleObj).forEach(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ([key, value]) => ((htmlElement.style as any)[key] = value?.toString() ?? null)
        )

    // Reset the current style of the element.
    htmlElement.removeAttribute('style')

    // Set the new styles of the element.
    if (typeof styles === 'string') {
        htmlElement.style.cssText = styles
    } else if (Array.isArray(styles)) {
        styles.forEach(objStyles => updateObjStyles(objStyles))
    } else if (typeof styles === 'object') {
        updateObjStyles(styles)
    }
}
```

It's actually not that important that you understand every single detail of `updateDomNode` and `updateStyleAttributes`, you should just know that the functions are used to *apply* changes defined inside the `props` of a `fiber` to their corresponding node in the DOM.


### The `expandChildFibers` Function

Coming back to the last line of `renderFiber`, we see that after the *current* `fiber` has been placed in the DOM, we call `expandChildFibers`. Below you can see a simplified version of the implementation of `expandChildFibers`. You can ignore the parameter `previousVersion`, as it is not used for now.

```typescript
function expandChildFibers(fiber: StaticFiber, previousVersion?: Fiber) {
    const currentChildren = fiber.children

    // If the domNode of the container is not a HTMLElement, no children can be added to it.
    const container = fiber.domNode
    if (!container || !isHTMLElement(container)) return

    // Go through all currentChildren and render them to the DOM.
    // The nextChildSibling is used to enforce the correct order in the DOM.
    // The order is reversed, to determine the nextChildSibling easily (to use insertBefore API).
    let nextChildSibling: Fiber | undefined
    const reversedChildren = Array.from(currentChildren.entries()).reverse()
    reversedChildren.forEach(([key, currentChild]) => {
        renderFiber(currentChild, container, undefined, nextChildSibling)
        nextChildSibling = currentChild
    })
}
```

We can see that the `domNode` of the `fiber` we passed to the function is taken as our container, into which we're now going to render all its children.

Next, we create an array of all children of our `fiber`, and reverse it. In that way it is easier for us to determine the *next* sibling of the child. The explanation why we need the *next* sibling (and not the *previous*) is related to the JavaScript DOM API, as this contains only the function `Node.insertBefore(newNode, referenceNode)` (and nothing like `Node.insertAfter(newNode, referenceNode)`). We already used this function inside `replaceFiberInDom`.

Then, we loop through our `reversedChildren` array and call `renderFiber`, meaning all children of a `fiber` will be rendered recursively to the DOM.
## Review

Going back to our demo from the beginning of this level, you should now understand that we used the `createElement` function to create a `StaticFiber` of `type` `h1`, passed some props to define the styles of our `h1` element and added a single child with a *primitive* value, which was added as the text node of our `h1` element.

This `Fiber` was then transformed to an HTML element and rendered inside the `div` with the ID `app`.

```javascript
import { createElement } from '../../lib/js/fiber.js'
import { render } from '../../lib/js/render.js'

const fiber = createElement('h1', { style: { color: 'Salmon' } }, 'Hello World')

render(
    fiber,
    document.getElementById('app')
)
```

With that, you have almost finished the first chapter of this tutorial and should now understand what a `Fiber` (or more precisely, `StaticFiber`) is, and how its properties are used to render it to the DOM, using the `render` function and all the internal functions which are needed to make this work.


### More Advanced Example

In the example we have looked at so far, we have just rendered a single HTML element to the DOM. However, we could also use this approach to render a much more complex structure, with nested elements, advanced styling, etc.:

```javascript
import { createElement } from '../../lib/js/fiber.js'
import { render } from '../../lib/js/render.js'

const fiber = createElement(
    'div',
    { style: {
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    } },
    createElement(
        'main',
        { style: {
            textAlign: 'center',
            padding: '2rem'
        } },
        createElement(
            'h1', 
            { style: { color: 'Salmon' } }, 
            'Hello World'
        ),
        createElement(
            'h2', 
            { style: { color: 'DarkCyan' } }, 
            'This is a subtitle'
        ),
        createElement(
            'p', 
            null, 
            'And here follows a paragraph which contains some normal text.'
        )
    )
)

render(
    fiber,
    document.getElementById('app')
)
```

You might agree that this approach seems to contain quite a lot of boilerplate. Because of this, it's a good idea to look into the [second level](../2-parsing-sjdon/README.md), where we'll explore a more elegant way to define our fibers.
