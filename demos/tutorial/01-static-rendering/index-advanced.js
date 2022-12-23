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
