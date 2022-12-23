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
    parseSjdon(sjdon, createElement),
    document.getElementById('app')
)
