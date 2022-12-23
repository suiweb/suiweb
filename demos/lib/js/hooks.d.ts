/**
 * This function should be called before a `FunctionalFiber` executes its `fiberFunction`.
 * It will set a reference to the given memorizedStates and the function used to re-render this fiber,
 * so those values can then be captured inside the corresponding functions when the {@link useState}
 * and {@link useEffect} hooks are called in the `fiberFunction`.
 * @param memorizedStates - The `memorizedStates`, of the `FunctionalFiber` which this state belongs to.
 * @param rerenderFunction - The function which will re-render the fiber which this state belongs to.
 */
export declare function prepareToUseHooks(memorizedStates: unknown[], rerenderFunction: () => void): void;
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
export declare function useState<T>(initialValue: T): [T, (newValue: T) => void];
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
export declare function useEffect(action: () => void, dependencies?: unknown[]): void;
