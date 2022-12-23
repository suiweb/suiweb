# Level 2: Parsing Fibers from SJDON Notation

## Introduction

After we have seen how fibers can be created using the [`createElement`](/docs/api/internal/modules/fiber#createelement) function and then rendered to the DOM by calling the [`render`](/docs/api/internal/modules/render#render) function, we will now look at a way to define the structure of our fibers with less boilerplate.


## Goal

- [Demo](https://suiweb.github.io/demos/tutorial/02-parsing-sjdon/index.html)
- [Source Code](https://github.com/suiweb/suiweb/tree/main/demos/tutorial/02-parsing-sjdon)

Do you remember the slightly more complex example from the previous level, where we always had to call `createElement` for every `Fiber` we wanted to create? By using the `parseSjdon` function, which we will explore in this level, we can write the same thing a bit more universally, by defining the structure in the SJDON notation and parsing it afterwards.

For that, look at the `index.js` file for this tutorial. Note that the `index.html` is the same as in the previous level.


### `index.js`

```javascript
import { createElement } from '../../lib/js/fiber.js'
import { parseSjdon } from '../../lib/js/sjdon.js'
import { render } from '../../lib/js/render.js'

const sjdon = [
    'div',
    { style: {
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    } },
    [
        'main',
        { style: {
            textAlign: 'center',
            padding: '2rem'
        } },
        [
            'h1', 
            { style: { color: 'Salmon' } }, 
            'Hello World'
        ],
        [
            'h2', 
            { style: { color: 'Turquoise' } }, 
            'This is a Subtitle'
        ],
        [
            'p', 
            null, 
            'And here follows a paragraph which contains some normal text.'
        ]
    ]
]

render(
    // highlight-next-line
    parseSjdon(sjdon, createElement),
    document.getElementById('app')
)
```

The goal for this level is to know the structure of SJDON and to understand how `parseSjdon` works internally.


## Structure of SJDON

Let's consider the following JavaScript array:

```javascript
const sjdon = [
    'div',
    { className: 'container' },
    [ 'h1', { 'id': 'page-title' }, 'Welcome to SJDON' ],
    [ 'p', 'SJDON stands for Simple JavaScript DOM Notation.' ]
]
```

The array is following the rules of a notation called [SJDON](https://github.com/gburkert/sjdon), which is an acronym for Simple JavaScript DOM Notation.

If you look at the following HTML code, you might be able to recognize that this is the representation of the SJDON code you've seen above.

```html
<div class="container">
    <h1 id="page-title">Welcome to SJDON</h1>
    <p>SJDON stands for Simple JavaScript DOM Notation.</p>
</div>
```

The formal definition of SJDON is as follows:

- A text node is simply the string containing the text.
- An element node is an array that first contains the element name as a string and then the child elements (text or element nodes, in the desired order) and attribute descriptions for the element node.
- Attribute descriptions are objects whose attributes and values correspond directly to the attributes and values of the HTML element. All attributes of the element can be combined in one object or distributed among several objects.


## The `parseSjdon` Function

This transformation of the SJDON array to its HTML representation is achieved with the function `parseSjdon`, at which we are going to have a closer look in this level.

```typescript
export function parseSjdon<T>([type, ...rest]: SjdonElement, create: CreateElementFunction<T>): T {
    const propsArray = rest.filter(isSjdonProps)
    const props: Props = Object.assign({}, ...propsArray)
    const children = rest.filter(isSjdonChild)
    const parsedChildren = children.map(child => (isSjdonElement(child) ? parseSjdon(child, create) : child))
    return create(type, props, ...parsedChildren)
}
```

We can see that `parseSjdon` expects two parameters:

First, an array, which follows the requirements of `SjdownElement`:

```typescript
export type SjdonElement = [SjdonElementType, ...(SjdonElementOrPrimitive | Props)[]]
```

As its first entry, the array must contain an element of type `SjdonElementType`. Looking at this definition, we find out that this means it either has to be a string which is a valid HTML tag name (as we've seen in the previous chapter already), or some property of type `SjdonElementFunction`. For now, we'll focus on the first case only.

```typescript
export type SjdonElementType = keyof HTMLElementTagNameMap | SjdonElementFunction
```

The following entries of the `SjdonElement` array can either be another `SjdonElement`, a `Primitive` or `Props` (which we have also already seen in the first level).

We will not look in detail into all the type definitions here, as they are quite straight-forward, but if you're interested, you can of course always look them up in the source code of SuiWeb.

The second parameter of the `parseSjdon` function, named `create` needs to be of type `CreateElementFunction`. In the first level, we've looked at such a function, the `createElement` function. For this tutorial, we are actually going to use exactly that function. It would, however, be possible to use another function which satisfies the `CreateElementFunction` type, e.g. the `React.createElement` function to use SJDON with React. 

Looking at the actual implementation of `parseSjdon`, we can see that the elements of the `rest` array are filtered into `propsArray` and `children`, using the functions `isSjdonProps` and `isSjdonChild`. These are so called type-checker functions which determine if a given object satisfies the requirements of a specific type. You can see the implementation of the two functions below.

```typescript
function isSjdonProps(object: unknown): object is Props {
    return typeof object === 'object' && !Array.isArray(object)
}
```

```typescript
function isSjdonChild(object: unknown): object is SjdonElementOrPrimitive {
    return isPrimitive(object) || isSjdonElement(object)
}
```

The `propsArray` is then merged into the object `props`.

> Note: You might be wondering why we are using `Object.assign({}, ...propsArray)` to create our `props` object, instead of the spread operator. The reason is that the spread operator is only working if we want to spread properties of another *object* into a new object. In this case, however, our properties are stored in an *array*. That's why we have to use `Object.assign()` with a new empty object (`{}`) as the target, which allows us to do the same thing.


In the next step, all children which are `SjdonElement`s have to be recursively parsed. However, if the child is a `Primitive`, nothing has to be done. We use the `isSjdonElement` function, which is another type-checker function, to check whether a child is an `SjdonElement`.

That's it, we now have the `type` of the element, the `props` and the `parsedChildren`, which is everything we need to call the `create` function. In our case we're calling `createElement(type, props, ...parsedChildren)`.

## Review

In this level, we have discovered how we can define static elements with the SJDON notation and then use the `parseSjdon` function, introduced in this level, together with the `createElement` function, introduced in the previous level, to create fibers, which can then be rendered to the DOM using the `render` function.

With that, you are ready for [level 3](../3-components/README.md), where we'll explore how our fibers can contain dynamic contents using functions.
