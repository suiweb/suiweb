let states;
let rerender;
let stateIndex = 0;
/**
 * This function should be called before a `FunctionalFiber` executes its `fiberFunction`.
 * It will set a reference to the given memorizedStates and the function used to re-render this fiber,
 * so those values can then be captured inside the corresponding functions when the {@link useState}
 * and {@link useEffect} hooks are called in the `fiberFunction`.
 * @param memorizedStates - The `memorizedStates`, of the `FunctionalFiber` which this state belongs to.
 * @param rerenderFunction - The function which will re-render the fiber which this state belongs to.
 */
export function prepareToUseHooks(memorizedStates, rerenderFunction) {
    states = memorizedStates;
    rerender = rerenderFunction;
    stateIndex = 0;
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
export function useState(initialValue) {
    // By assining these variables inside this function, their references are captured.
    // This means that when setState is called later, e.g., the capturedStates array
    // still has the same reference as it had at the time this function (useState) was called.
    const capturedStates = states;
    const capturedRerender = rerender;
    const capturedStateIndex = stateIndex;
    // The current value of the state
    const state = (capturedStates[capturedStateIndex] ?? initialValue);
    // This function updates the values of the states and triggers a re-render of the component.
    const setState = (newValue) => {
        capturedStates[capturedStateIndex] = newValue;
        capturedRerender();
    };
    // The state index is incremented, so the correct element from the array is taken as the state value.
    stateIndex++;
    return [state, setState];
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
export function useEffect(action, dependencies) {
    let shouldCallAction = false;
    if (dependencies !== undefined) {
        // The state at the current index indicates, whether the first render has
        // happend. If this is the first render, the effect should be executed.
        const isFirstRender = states[stateIndex] !== true;
        if (isFirstRender) {
            shouldCallAction = true;
            // `true` indicates, that the first render has happened
            states[stateIndex] = true;
        }
        // After the first-render-check, go to the next state-index
        stateIndex++;
    }
    else {
        // There are no dependencies, so the action is called on every render
        shouldCallAction = true;
    }
    dependencies?.forEach(dependency => {
        // Check whether the captured value in the hook is different
        // from the current value in the dependencies
        if (dependency !== states[stateIndex]) {
            shouldCallAction = true;
        }
        states[stateIndex] = dependency;
        stateIndex++;
    });
    // If any criteria for a re-render is met, run `action`
    if (shouldCallAction)
        setTimeout(action);
}
