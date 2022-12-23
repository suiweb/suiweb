import { createElement } from '../../lib/js/fiber.js'
import { useEffect, useState } from '../../lib/js/hooks.js'
import { render } from '../../lib/js/render.js'

/** @jsx createElement */

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

    return (
        <div>
            <h1>{text}</h1>
            <TextField text={text} setText={setText} />
            <Counter count={count} setCount={setCount} />
        </div>
    )
}

const TextField = ({text, setText}) => {
    return (
        <div>
            <input 
                value={text} 
                oninput={event => setText(event.target.value)} 
            />
        </div>
    )
}

const Counter = ({count, setCount}) => {
    return (
        <button onclick={() => setCount(count + 1)}>
            {`Clicked ${count} times`}
        </button>
    )
}

render(
    <App />, 
    document.getElementById('app')
)
