import { createElement } from '../../lib/js/fiber.js'
import { useEffect, useState } from '../../lib/js/hooks.js'
import { render } from '../../lib/js/render.js'
import { parseSjdon } from '../../lib/js/sjdon.js'


const App = () => {
    return [
        'div',
        ['h1', 'Wrap Up'],
        [DateComponent],
        [Counter]
    ]
}

const DateComponent = () => {
    return [
        'p', 
        'If value changed, the component was rerendered: ', ['strong', Date.now()],
    ]
}

const Counter = () => {
    const [count, setCount] = useState(0)

    useEffect(
        () => console.log(`The value of count has changed: ${count}`),
        [count]
    )

    return [
        'div', 
        { 
            style: {
                backgroundColor: 'Aquamarine',
                padding: '1rem'
            }
        },
        [
            'button', 
            { onclick: () => setCount(count + 1) }, 
            `Clicked ${count} times`
        ],
        [DateComponent]
    ]
}

const rootFiber = parseSjdon([App], createElement)

render(rootFiber, document.getElementById('app'))
