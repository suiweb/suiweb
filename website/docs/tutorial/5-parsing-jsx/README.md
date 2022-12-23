# Level 5: Defining Components the React-Way with JSX

## Introduction

Now that we've discussed the most important concepts to bring actual logic to our components, we'll go a step back in this level and look at an alternative to SJDON to define our components. This alternative is called [JSX](https://reactjs.org/docs/introducing-jsx.html), and is the recommended notation to define components when using React.

JSX is a syntax extension to JavaScript. As browsers are not capable to render JSX directly, we first need to transform our code to regular JavaScript, which can be done with a tool such as [Babel](https://babeljs.io/) or [esbuild](https://esbuild.github.io/).

As usual, we will first look at demo of the goal for this level, then have a first look at the basic syntax and structure of JSX and will finally we will show how code written in JSX can be rendered with SuiWeb.


## Goal

- [Demo](https://suiweb.github.io/demos/tutorial/05-parsing-jsx/dist/index.html)
- [Source Code](https://github.com/suiweb/suiweb/tree/main/demos/tutorial/05-parsing-jsx)

Let's take the example we have created for the previous level, which displays a `h1` title, a text field and a counter button. We will recreate this example, but this time using JSX instead of SJDON.

Because we're using JSX, the extension of our JavaScript file will no longer be `.js`, but `.jsx` instead. Using this dedicated extension allows tools such as Babel or esbuild to know that JSX transformation should be performed on those files. First, we need to update our `index.html` file to include `index.jsx` (instead of `index.js`):


### `index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SuiWeb App</title>
    // highlight-next-line
    <script type="module" src="./index.jsx"></script>
</head>
<body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="app"></div>
</body>
</html>

```

Now, let's look at our `index.jsx` file:


### `index.jsx`

```jsx
import { createElement } from '../../lib/js/fiber.js'
import { useEffect, useState } from '../../lib/js/hooks.js'
import { render } from '../../lib/js/render.js'

// highlight-next-line
/** @jsx createElement */

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

    // highlight-start
    return (
        <div>
            <h1>{text}</h1>
            <TextField text={text} setText={setText} />
            <Counter count={count} setCount={setCount} />
        </div>
    )
    // highlight-end
}

const TextField = ({text, setText}) => {
    // highlight-start
    return (
        <div>
            <input 
                value={text} 
                oninput={event => setText(event.target.value)} 
            />
        </div>
    )
    // highlight-end
}

const Counter = ({count, setCount}) => {
    // highlight-start
    return (
        <button onclick={() => setCount(count + 1)}>
            {`Clicked ${count} times`}
        </button>
    )
    // highlight-end
}

render(
    // highlight-next-line
    <App />, 
    document.getElementById('app')
)
```

All the lines which are different from [`index.js` of level 4](../4-hooks/README.md#indexjs) are highlighted in the code snippet above. As you can see, the changes include a special annotation, all the return statements and small change in the `render` function.

To then transform our JSX into regular JavaScript, we need a tool which does that transformation. We use [vite](https://vitejs.dev/), which comes with [esbuild](https://esbuild.github.io/), in this tutorial. But you could also use some other tools such as [webpack](https://webpack.js.org/) together with [Babel](https://babeljs.io/).

To use our project with vite, we create a [npm](https://www.npmjs.com/) project, which installs vite together with its dependencies inside our project. You could either run `npm create vite@latest` to initialize a vite project from scratch, or just copy the `package.json` file shown below.


### `package.json`

```json
{
  "name": "05-hooks",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "vite": "^4.0.2"
  }
}
```

We then install the dependencies by running `npm install` inside our project's directory.

Then, we need to configure vite, which we do with the file `vite.config.js`, that needs to be placed in the root of our project.


### `vite.config.js`

```javascript
import { defineConfig } from 'vite'

export default defineConfig({
    base: '',
    build: {
        target: 'esnext',
        minify: false,
        outDir: 'dist',
        emptyOutDir: true,
    },
})
```

> Note that for this simple example, it would probably not even be needed to create a config file for vite, as we could also just use the default configuration. In the config above, we have changed some default settings, such as `minify: false`, so that the code which is produced by vite is a bit more readable, so that we can better see what is happening.

Once that is set up, you can run `npm run dev` to run vite in development mode, which should output a URL such as `http://localhost:5173/`, at which you can see your built project. 

> Note that it's now no longer needed to run a local web server using `npx serve`, as running vite in development mode takes care of this.

To understand how JSX will be rendered using SuiWeb, let's first have a look at how Fibers are created from JSX code.


## Creating Fibers from JSX

As mentioned already, our code contains the annotation `/** @jsx createElement */`, which tells esbuild (that is run as part of vite) to use the `createElement` function of SuiWeb to transform from JSX to JS.

This basically replaces what `parseSjdon` did, when we used it to convert our SJDON arrays into calls of `createElement`.

The difference is that now, the transformation to `createElement` calls happens as a **build step** of our app (which is performed by vite, previously to actually running our app), and not during runtime (which is the case for `parseSjdon`).

If you run `npm run build`, you can see the code that is created by vite inside the directory `dist/assets` in a file that is called something like `index.0a9bd48a.js`. You can also see that the import statement of the `index.html` file, which is placed in `dist`, has been updated to reflect the correct path of our *bundled* JS file. This code contains basically all functions that are needed from SuiWeb, as well as the components we defined in our `index.jsx` file, in plain JavaScript code which uses `createElement` calls.

For example, our `Counter` function looks now something like this:

```javascript
const Counter = ({ count, setCount }) => {
  return /* @__PURE__ */ createElement("button", { onclick: () => setCount(count + 1) }, `Clicked ${count} times`);
};
```

With that, you should now have an understanding on *how* vite transforms our code from JSX to plain JavaScript. Next, we are going to have a look at the syntax of JSX.


## Syntax of JSX

If you have some basic knowledge of HTML (which you most probably have when working through this tutorial), you might have realized immediately that JSX looks a lot like HTML (or XML). The extension JSX actually also stands for "JavaScript XML", as JSX enriches the syntax of JavaScript to tags that are inspired by XML.


### Static and Functional Fibers

Basically, JSX has the following conventions for tag names:

- Whenever the tag name of an element starts with a lowercase letter, it will be treated as a string.
- If the tag name of an element starts with a capital letter, it will be treated as a function that needs to be defined in the same file (or imported).

> Note: A tag name is what is written in between the `<>`, e.g., the tag name of `<div>` is "div".

We can see this in the example above: Our component `App` returns a structure which contains both lowercase (e.g., `<div>` or `h1`) and capitalized (e.g., `<TextField>` or `<Counter>`) tags. For lowercase tags, regular HTML elements will be created. For capitalized tags, the corresponding function will be executed when the component is rendered.

This is basically the same behavior which we had in SJDON, except that we did an explicit differentiation between strings and functions, as we only use the regular JavaScript syntax for SJDON.

With the explanation of this differentiation between lowercase and capitalized tag names, it should be quite obvious that lowercase letter tags will call `createElement` with a string as the first argument, which produces a `StaticFiber`, while capitalized tag names call `createElement` with a function as the first parameter, what produces a `FunctionalFiber`.


### Passing Props

Another thing that changes with JSX as compared to SJDON is how we pass props for a component (the object which we pass as the parameter of a component function).

While in SJDON, we could just pass one or multiple objects at any position (except the first), we do this a little different in JSX.

Like attributes which you might know from HTML (such as the `value` attribute on an `input`), we use the same (or similar) syntax in JSX. We define the name of the property and then the value, which could either be a string, or some JavaScript code. Note that if it's just a string, you would have to use quotation marks (as in regular HTML), and if you want to pass some JavaScript code, such as a variable, you would wrap your JS code with curly braces `{ ... }`.

In the transformation, all attributes of a JSX element will then be passed in an object as the second parameter to our `createElement` function (which you can also see in the example of the "compiled" `Counter` function).


### Limitations of JSX in SuiWeb

Note that SuiWeb currently does not include support for [Fragments](https://reactjs.org/docs/fragments.html). Due to this, the syntax to create a fragment using the syntax `<> ... </>` is not supported when using JSX with SuiWeb. It would, however, be possible to add support and register the function to create a fragment using the annotation `/** @jsxFrag createFragment */`, similar to the annotation we use to register our `createElement` function. For now, we decided to not include it in order to keep down the complexity of SuiWeb.


## Review

With that, you should now understand how you can use JSX instead of SJDON to define your components. Using JSX might feel a bit more natural, as its syntax feels similar to that of HTML. The "downside" is, however, that JSX code needs to be transformed with a tool such as esbuild or Babel, which might not be possible in some cases. For most applications we develop nowadays, however, we use tools such as vite or webpack anyway, to bundle many individual files and their dependencies into a single file (or multiple chunks). So that additional build step might often not be a problem.

In the [next level](../6-conditional-rendering/README.md), we will go back to actual SuiWeb logic, and see how we can conditionally render components or parts of components, depending on some conditions.
