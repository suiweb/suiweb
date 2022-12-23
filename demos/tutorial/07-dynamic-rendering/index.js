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
