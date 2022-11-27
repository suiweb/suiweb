import type { FunctionalFiber } from './fiber'
import { rerenderFunctionalFiber } from './render'

let fiber: FunctionalFiber
let fiberContainer: HTMLElement
let stateIndex = 0

/**
 * This function should be called before a {@link FunctionalFiber} executes its `fiberFunction`.
 * It will set a reference to the given fiber and container inside the `hooks` module,
 * so those values can then be captured inside the corresponding functions when the {@link useState}
 * and {@link useEffect} hooks are called in the `fiberFunction`.
 * @param functionalFiber - The `FunctionalFiber`, whose `fiberFunction` will be executed.
 * @param container - The conatiner, inside of which the `funtionalFiber` will be rendered.
 */
export function prepareToUseHooks(functionalFiber: FunctionalFiber, container: HTMLElement) {
    fiber = functionalFiber
    fiberContainer = container
    stateIndex = 0
}

/**
 * The function `useState` can be used inside a functional component to capture
 * state between re-rerenders. State values should never be mutated directly,
 * but always updated via the returned `setState` function (2nd element in the array).
 * This will trigger a re-render of the `FunctionalFiber` and its subtree (children).
 * @param initialValue - The initial value the state should have.
 * @returns An array containing the `state` as the first element and
 * the `setState` function as the second element.
 * @example
 * ```tsx
 * const Counter = () => {
 *     const [count, setCount] = useState(0)
 *     return <button onClick={() => setCount(count + 1)}>{`Count: ${count}`}</button>
 * }
 * ```
 *
 * @public
 */
export function useState<T>(initialValue: T): [T, (newValue: T) => void] {
    // By assining these variables inside this function, their references are captured.
    // This means that when setState is called later, e.g., the capturedStates array
    // still has the same reference as it had at the time this function (useState) was called.
    const capturedFiber = fiber
    const capturedStates = fiber.memorizedStates
    const capturedFiberContainer = fiberContainer
    const capturedStateIndex = stateIndex

    // The current value of the state
    const state = (capturedStates[capturedStateIndex] ?? initialValue) as T

    // This function updates the values of the states and triggers a re-render of the component.
    const setState = (newValue: T) => {
        capturedStates[capturedStateIndex] = newValue
        rerenderFunctionalFiber(capturedFiber, capturedFiberContainer)
    }

    // The state index is incremented, so the correct element from the array is taken as the state value.
    stateIndex++

    return [state, setState]
}

/**
 * The function `useEffect` can be used in a functional component to execute an action,
 * after a component has been rendered. By specifying `dependencies`, calling the function
 * can be further restricted, to only call `action` under specific contidtions.
 * @param action - The action to execute after rendering the component.
 * @param dependencies - Defines the dependencies that decide on execution of `action`.
 * `action` will only be called if any of the value in the dependencies has changed
 * since the last render of the component.
 * Pass an empty array (`[]`) to only run `action` on the first render.
 * Pass `undefined` (or leave away the parameter) to run `action` on every render.
 * @example
 * ```tsx
 * const Counter = () => {
 *     const [count, setCount] = useState(0)
 *
 *     // `action` is called after every render.
 *     useEffect(() => console.log('Counter changed.')) // no dependencies defined
 *
 *     // `action` is called after every render, if the value of `count`
 *     // changed since the last render.
 *     useEffect(() => console.log('Counter changed.'), [count]) // specific dependency defined
 *
 *     // `action` is called only after the first render.
 *     useEffect(() => console.log('Counter changed.'), []) // empty array dependency
 *
 *     return <button onClick={() => setCount(count + 1)}>{`Count: ${count}`}</button>
 * }
 * ```
 *
 * @public
 */
export function useEffect(action: () => (() => void) | void, dependencies?: unknown[]) {
    const capturedStates = fiber.memorizedStates
    let shouldCallAction = false

    if (dependencies !== undefined) {
        // If dependencies is an empty array, and the effect has never
        // been called, the action should be called (initial render)
        const isFirstRender = capturedStates[stateIndex] !== true
        if (isFirstRender) {
            shouldCallAction = true
            capturedStates[stateIndex] = true
        }
        // Increment the state by 1 to indicatate that there is a dependency
        // array defined (which might be empty)
        stateIndex++
    } else {
        // There are no dependencies, so the action is called on every render
        shouldCallAction = true
    }

    dependencies?.forEach(dependency => {
        // Check whether the captured value in the hook is different from
        // the current value
        if (dependency !== capturedStates[stateIndex]) {
            shouldCallAction = true
        }
        capturedStates[stateIndex] = dependency
        stateIndex++
    })

    // If any criteria for a re-render is met, run `action`
    if (shouldCallAction) action()
}
