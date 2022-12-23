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
