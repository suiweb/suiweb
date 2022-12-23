import { createElement } from '../../lib/js/fiber.js'
import { useState } from '../../lib/js/hooks.js'
import { render } from '../../lib/js/render.js'

/** @jsx createElement */

const App = () => {
    const [show , setShow] = useState(false)
    
    return (
        <div>
            <button onclick={() => setShow(!show)}>
                {`${ show ? 'Hide' : 'Show' } Text 1`}
            </button>
            {show && <TextField name="Text 1" />}
            <TextField name="Text 2" />
        </div>
    )
}

const TextField = props => {
    const [text, setText] = useState(props?.initialValue ?? '')
    return (
        <div>
            <label>
                {props.name}
                <input 
                    value={text} 
                    oninput={event => setText(event.target.value)} 
                />
            </label>
        </div>
    )
}

render(
    <App />,
    document.getElementById('app')
)
