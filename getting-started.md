# Getting Started

The following page will give you some indications on what is needed to get started with SuiWeb. It's possible that you are already familiar with some of the steps below. In that case, feel free to read through them a bit quicker or skip them.


## Setting Up a Local Web Server

Throughout this documentation, we will include SuiWeb as a [JavaScript (or ECMAScript) Module](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) directly in our document. This is very convenient, as there is no additional step needed to process your code any further with a tool such as Webpack or Vite before running it. The downside is, that it's not possible to include a module in a document loaded via the `file://` scheme (this what happens when you open an `html`-File directly with your web browser). For that, we need a simple local web server, such that our script is loaded from the `http://` (or `https://`) scheme, which is allowed for modules.

One possibility is to use the [serve](https://www.npmjs.com/package/serve) npm package. To proceed with this method, make sure that node.js is installed on your computer e.g., by running `node --version` from your terminal. If node.js is not installed, install it from [https://nodejs.org](https://nodejs.org). Then, pick a directory where you want to create your project. Navigate to this directory with your terminal and run `npx serve` (you don't need to execute `npm install ...` first, just running `npx serve` is enough). This should start a local web server and print out the URL to access it in your terminal. With that, you are ready to set up your project.

Of course, it's also possible to use any other local web server if you prefer something else.


## Setting Up Your Editor

Once you have a local web server up and running, you are ready to set up your code editor. If you do not yet have a preferred editor for web development, we recommend to use [VS Code](https://code.visualstudio.com/), a free and open source code editor, offering great support for JavaScript (and TypeScript). If you happen to already use (and love) any other editor for web development (like WebStorm), that will pretty likely work as well. However, for best experience, we recommend that you check that [it supports TypeScript](https://github.com/Microsoft/TypeScript/wiki/TypeScript-Editor-Support) (e.g., via some plugin). This will make your life a lot easier due to code completion and stuff like that. If you go for VS Code, there is no additional plugin to install or anything to set up, as it comes with TypeScript (and JavaScript) support built in.


## Setting Up Your Project

The source code for this example is available [here](https://github.com/suiweb/suiweb/tree/main/demos/simple-js). If you want to see this demo in action, you can find it [here](https://suiweb.github.io/demos/simple-js/index.html).


### Create Entry Point Files

Once you've gone through the previous two steps, you're now ready to really get started.

Open the directory in which you want to create your project in your editor. Then create a file `index.html`. This will be the entry point when you open your directory from your local web server. Add the following contents to it:

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

Note that we include a script called `index.js` in the last line of the `head` in the snippet above. This script is where the actual entry point of our application will be. So, let's create the file and add the following contents to it:

```javascript
import { createElement } from '../lib/js/fiber.js'
import { useState } from '../lib/js/hooks.js'
import { render } from '../lib/js/render.js'
import { parseSjdon } from '../lib/js/sjdon.js'


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

const App = () => {
    const [text, setText] = useState('SuiWeb App')

    return [
        'div',
        ['h1', text],
        [TextField, {text, setText}]
    ]
}

render(
    parseSjdon([App], createElement), 
    document.getElementById('app')
)
```


### Download SuiWeb

This script above contains a little application which renders with SuiWeb. If you look at the first couple of lines, you see that some `import` statements, which are needed to load SuiWeb. You can get these files from the [latest release at GitHub](https://github.com/suiweb/suiweb/releases). There, download the `suiweb.zip` file, found in the "Assets" section of the newest release. In this archive, you can find a directory `dist` (besides others) and inside it two more directories called `js` and `min.js`. 

Now, it's up to you to decide in which form you want to use SuiWeb: The directory `js` contains nicely readable JavaScript code (transformed from the TypeScript source code), split up into multiple files. Use the files in this directory if you'd like to look at the JavaScript source code directly from within your project. 

If you prefer to look at the original *TypeScript* source code instead, you should download and open the source code of SuiWeb in another window in your code editor, or just look at it at [GitHub](https://github.com/suiweb/suiweb/tree/main/suiweb). In that case, you can go with the files in `min.js`. It contains the minified version of SuiWeb, so it's not that nicely readable for humans, as everything has been merged into a single file, variable names have been shortened and things like comments and function documentation have been removed. 

If you are unsure, go for the directory `js`, this might be a bit more intuitive at the beginning. And you can change anytime to the minified version later, with little effort.


### Copy SuiWeb to Your Project

Now, copy all the files in either `js` or `min.js` into a directory called `lib` inside your project. Note that you might have to adapt the `import`-statements in the examples that you see, as they include the framework from one global directory, which is above the directory of the corresponding demo.

If you decided to go for `min.js`, you can remove the `import`-statements from your `index.js` and replace them with the following line instead:

```javascript
import { createElement, parseSjdon, render, useState } from '../lib/min.js/suiweb.min.js'
```


## Verify Your Setup

Now, you have everything set up, so you can verify your setup. For that, open the URL of your local web server (e.g., `http://localhost:3000`, if you chose to go for `npx serve`) in your web browser. You should now see a title saying "SuiWeb App" and a text field. If you change the text in the text field, the title should update in real time. If this works, congratulations!

In case you just see blank white page, open the developer options of your web browser and see if you can find any errors there, which might indicate what went wrong.
