import { createElement } from '../../lib/js/fiber.js'
import { parseSjdon } from '../../lib/js/sjdon.js'
import { render } from '../../lib/js/render.js'

function DateComponent({ size }) {
    const date = new Date().toUTCString()
    const style = { 
        fontWeight: 'bold',
        fontSize: size == 'big' ? '18px' : 'inherit'
    }
  
    return [ 
        'p',
        'The current date is: ', 
        [ 'span', { style }, date ]
    ]
}

const sjdon = [
    'div',
    { className: 'container' },
    [ 'h1', { 'id': 'page-title' }, 'Welcome to SJDON' ],
    [ 'p', 'SJDON stands for Simple JavaScript DOM Notation.' ],
    [ DateComponent, { size: 'big' } ]
]

render(
    parseSjdon(sjdon, createElement),
    document.getElementById('app')
)
