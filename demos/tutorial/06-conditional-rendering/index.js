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
