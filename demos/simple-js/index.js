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
