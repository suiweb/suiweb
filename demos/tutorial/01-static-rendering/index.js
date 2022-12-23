import { createElement } from '../../lib/js/fiber.js'
import { render } from '../../lib/js/render.js'

const fiber = createElement('h1', { style: { color: 'Salmon' } }, 'Hello World')

render(
    fiber,
    document.getElementById('app')
)
