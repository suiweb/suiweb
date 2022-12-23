true&&(function polyfill() {
    const relList = document.createElement('link').relList;
    if (relList && relList.supports && relList.supports('modulepreload')) {
        return;
    }
    for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
        processPreload(link);
    }
    new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type !== 'childList') {
                continue;
            }
            for (const node of mutation.addedNodes) {
                if (node.tagName === 'LINK' && node.rel === 'modulepreload')
                    processPreload(node);
            }
        }
    }).observe(document, { childList: true, subtree: true });
    function getFetchOpts(script) {
        const fetchOpts = {};
        if (script.integrity)
            fetchOpts.integrity = script.integrity;
        if (script.referrerpolicy)
            fetchOpts.referrerPolicy = script.referrerpolicy;
        if (script.crossorigin === 'use-credentials')
            fetchOpts.credentials = 'include';
        else if (script.crossorigin === 'anonymous')
            fetchOpts.credentials = 'omit';
        else
            fetchOpts.credentials = 'same-origin';
        return fetchOpts;
    }
    function processPreload(link) {
        if (link.ep)
            // ep marker = processed
            return;
        link.ep = true;
        // prepopulate the load record
        const fetchOpts = getFetchOpts(link);
        fetch(link.href, fetchOpts);
    }
}());

/**
 * Checks whether the `primitive` passed is of a primitive type.
 * @param primitive - The value to check.
 * @returns `true` if `primitive` is of any primitive type.
 */
function isPrimitive(primitive) {
    return (primitive === null ||
        primitive === undefined ||
        ['string', 'number', 'bigint', 'boolean', 'symbol'].includes(typeof primitive));
}
/**
 * Checks whether the `element` passed is a HTMLElement.
 * @param element - The element to check.
 * @returns `true` if `element` is an instance of HTMLElement
 */
function isHTMLElement(element) {
    return element instanceof HTMLElement;
}
/**
 * Checks whether the `element` passed is a Text.
 * @param element - The element to check.
 * @returns `true` is `element` is an instance of Text
 */
function isText(element) {
    return element instanceof Text;
}

/**
 * Determines if an object is of type {@link StaticFiber}.
 * @param object - The object to check.
 * @returns `true` if the object is of type {@link StaticFiber}.
 */
function isStaticFiber(object) {
    const testElement = object;
    return (testElement &&
        typeof testElement.type === 'string' &&
        typeof testElement.props === 'object' &&
        testElement.children instanceof Map);
}
/**
 * Determines if an object is of type {@link FunctionalFiber}.
 * @param object - The object to check.
 * @returns `true` if the object is of type {@link FunctionalFiber}.
 */
function isFunctionalFiber(object) {
    const testElement = object;
    return (testElement &&
        testElement.fiberFunction instanceof Function &&
        typeof testElement.functionProps === 'object' &&
        Array.isArray(testElement.memorizedStates));
}
/**
 * Determines if the given `propName` is a normal prop which should be directly added to
 * the DOM node, or if it serves a custom purpose.
 * Currently there are three special props, namely `children`, `style` and `key`.
 * @param propName - The name of the prop to check.
 * @returns `true` if the given prop is a normal prop.
 */
function isNormalProp(propName) {
    return propName !== 'style' && propName !== 'key';
}
/**
 * The SuiWeb implementation of the generic {@link CreateElementFunction}, which creates a {@link Fiber}.
 * @param type - If the type is a HTML tag, a {@link StaticFiber} is created. If it's a function, a {@link FunctionalFiber} is created.
 * @param props - The props of the element.
 * @param children - The children of the element.
 * @returns The created {@link Fiber}, either a {@link StaticFiber} or a {@link FunctionalFiber}.
 *
 * @public
 */
const createElement = (type, props, ...children) => {
    const mappedChildren = mapChildren(children);
    const safeProps = props ?? {};
    // If the type is a function, create a functional fiber.
    if (type instanceof Function) {
        // A functional element can not have direct children, it is a function,
        // which can take in children as a prop and return a static element with children.
        if (mappedChildren.size > 0)
            throw new Error('A functional element can not have children.');
        return {
            fiberFunction: type,
            functionProps: safeProps,
            memorizedStates: [],
        };
    }
    // Otherwise create a static fiber.
    else
        return { type, props: safeProps, children: mappedChildren };
};
/**
 * Maps the children of an element into a `Map`. If they don't have an explicit
 * `key` set in their `props`, a default key is used to insert the object into the Map.
 * Primitive values are wrapped into {@link StaticFiber}s by {@link createPlaceholderFiber}
 * and {@link createTextFiber}, respectively.
 * @param childrenRaw - The children to map.
 * @returns The Map containing the mapped children.
 */
function mapChildren(childrenRaw) {
    const children = childrenRaw.map(child => {
        if (child == null || child === false)
            return createPlaceholderFiber();
        else if (isPrimitive(child))
            return createTextFiber(child);
        else
            return child;
    });
    // Use a Map to store children in, as this allows to set a custom key,
    // while also guaranteeing to preserve the order of insertion (unlike object).
    const childrenMap = new Map();
    let defaultKey = 0;
    children.forEach(child => {
        const childProps = isFunctionalFiber(child) ? child.functionProps : child.props;
        // Keys are prefixed e-(xplicit) or d-(efault), so a custom key can never
        // accidentally match a generated key.
        const key = childProps?.key ? `e-${childProps?.key}` : `d-${defaultKey++}`;
        childrenMap.set(key, child);
    });
    return childrenMap;
}
/**
 * Creates a `TextFiber` wrapper element for a primitive value.
 * This allows for treating this element specially when rendering the Fibers
 * to the DOM.
 * @param text - The primitive value which should be wrapped.
 * @returns A {@link StaticFiber} with the special `type` `TEXT_NODE`.
 */
function createTextFiber(text) {
    return {
        type: 'TEXT_NODE',
        props: {
            nodeValue: text.toString(),
        },
        children: new Map(),
    };
}
/**
 * Creates a placeholder fiber, which represents a child of values `undefined`, `null` or `false`.
 * Placeholder fibers are never rendered to the DOM, but used to preserve
 * the correct amount of elements in a hierarchy. This is needed, for example, when components are
 * rendered conditionally.
 * @returns A {@link StaticFiber} with the special `type` `PLACEHOLDER_NODE`.
 */
function createPlaceholderFiber() {
    return {
        type: 'PLACEHOLDER_NODE',
        props: {},
        children: new Map(),
    };
}

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
function prepareToUseHooks(memorizedStates, rerenderFunction) {
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
function useState(initialValue) {
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
function useEffect(action, dependencies) {
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

/**
 * Creates a new DOM node for the fiber.
 * - For normal elements a {@link HTMLElement} with the `type` of the fiber is created.
 * - For a `TEXT_NODE` a {@link Text} is created.
 * - For a `PLACEHOLDER_NODE` the function throws, as it is not possible to create a DOM node for it.
 * @param fiber - The fiber to create a DOM element for.
 * @returns The created DOM node, either a {@link Text} or a {@link HTMLElement}.
 */
function createDomNode(fiber) {
    if (fiber.type === 'PLACEHOLDER_NODE')
        throw new Error('Could not create a DOM node for the type PLACEHOLDER_NODE.');
    // The elements are created "empty", without any props. These will be assigned in updateDomNode (e.g. nodeValue of a Text).
    const domNode = fiber.type === 'TEXT_NODE' ? document.createTextNode('') : document.createElement(fiber.type);
    // Set to props of the fiber.
    updateDomNode(domNode, undefined, fiber.props);
    return domNode;
}
/**
 * Updates the given DOM node with the provided props. The `previousProps` are removed from the node
 * and the `currentProps` are added to it. All properties starting with `on` are treated as event
 * listeners and are added and removed automatically. To support JSX, events are also
 * converted to lowercase e.g., (`onClick` -> `onclick`), such that they match the vanilla JS notation.
 * If the given `domNode` is a Text element, the only updated property is `nodeValue`.
 * @param domNode - The DOM node whose property should be updated.
 * @param previousProps - The props of the previous version. These will be removed.
 * @param currentProps - The props of the current version. These will be added.
 */
function updateDomNode(domNode, previousProps = {}, currentProps = {}) {
    if (isText(domNode)) {
        domNode.nodeValue = currentProps.nodeValue ?? '';
        return;
    }
    const isEvent = (key) => key.startsWith('on');
    // Remove old event-listeners
    Object.keys(previousProps)
        .filter(isEvent)
        .forEach(name => {
        const eventType = name.toLowerCase().substring(2);
        const event = previousProps[name];
        domNode.removeEventListener(eventType, event);
    });
    // Add new event-listeners
    Object.keys(currentProps)
        .filter(isEvent)
        .forEach(name => {
        const eventType = name.toLowerCase().substring(2);
        const event = currentProps[name];
        domNode?.addEventListener(eventType, event);
    });
    // Remove old properties
    Object.keys(previousProps)
        .filter(isNormalProp)
        .forEach(name => {
        domNode.removeAttribute(name);
    });
    // Set new properties
    Object.keys(currentProps)
        .filter(isNormalProp)
        .forEach(name => {
        const value = currentProps[name]?.toString();
        if (value)
            domNode.setAttribute(name, value);
    });
    // Upate special style prop
    updateStyleAttribute(domNode, currentProps.style);
}
/**
 * Updates the style attribute of the HTML element with the supported formats of {@link StyleProp}.
 * Before appyling the styles, the current styles of the HTML element are reset.
 * @param htmlElement - The HTML element whose style should be updated.
 * @param styles - The new styles which should applied to the HTML element.
 */
function updateStyleAttribute(htmlElement, styles = {}) {
    const updateObjStyles = (styleObj) => Object.entries(styleObj).forEach(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ([key, value]) => (htmlElement.style[key] = value?.toString() ?? null));
    // Reset the current style of the element.
    htmlElement.removeAttribute('style');
    // Set the new styles of the element.
    if (typeof styles === 'string') {
        htmlElement.style.cssText = styles;
    }
    else if (Array.isArray(styles)) {
        styles.forEach(objStyles => updateObjStyles(objStyles));
    }
    else if (typeof styles === 'object') {
        updateObjStyles(styles);
    }
}

/**
 * Renders the given fiber and its children to the DOM in the given container.
 * Note that all children of the container will be removed from
 * the DOM, before the fiber and its children are rendered.
 * @param fiber - The fiber which should be rendered.
 * @param container - The container in which the fiber should be rendered.
 *
 * @public
 */
function render(fiber, container) {
    while (container.firstChild)
        container.firstChild?.remove();
    // No previous version is specified, as it is the first render.
    renderFiber(fiber, container);
}
/**
 * Re-renders the given {@link FunctionalFiber} inside the given container.
 * This will create a copy of the fiber tree, re-evaluate the fiber's `fiberFunction`
 * and compare the newly generated fiber tree to the old one, applying all changes to the DOM.
 * @param fiber - The fiber which should be re-rendered.
 * @param container - The container to render the fiber in.
 */
function rerenderFunctionalFiber(fiber, container) {
    // The previous version is just a copy of the functionalFiber, which should be re-rendered.
    // This copy contains all expanded static fibers with their children -
    // the whole fiber tree below this functional fiber.
    // While rendering, the functional fiber will recompute all its children with the fiberFunction.
    // By providing this copy, the previous versions children are still retained and
    // can be compared to the new children generated by the fiberFunction.
    const previousVersion = { ...fiber };
    renderFiber(fiber, container, previousVersion);
}
/**
 * Renders the fiber and its children to the DOM. If a `previousVersion` is
 * specified, the old and the new fiber-tree are compared and only the differences
 * between the two trees are changed in the DOM.
 * @param fiber - The fiber which should be rendered.
 * @param container - The container in which the fiber should be rendered.
 * @param previousVersion - The version of the fiber before the current render.
 * Is compared to `fiber` and only the differences between the two are changed in the DOM.
 * @param nextSibling - The next sibling in the container, to keep track of the correct order inside the DOM.
 */
function renderFiber(fiber, container, previousVersion, nextSibling) {
    // If the component is a functional fiber, execute its fiberFunction
    // to get the unwrapped StaticFiber properties merged into the same object.
    if (isFunctionalFiber(fiber))
        unwrapFunctionalFiber(fiber, container, previousVersion);
    // After unwrapping, the fiber must contain all properties of a static fiber.
    if (!isStaticFiber(fiber))
        throw new Error('Fiber did not contain all StaticFiber properties after unwrapping.');
    // If the fiber is a placeholder, just remove the previous version, if exists.
    if (fiber.type === 'PLACEHOLDER_NODE') {
        fiber.domNode = undefined;
        previousVersion?.domNode?.remove();
        return;
    }
    // Determines if the new fiber still has the same type as the old fiber.
    const areSameType = fiber && previousVersion && fiber.type === previousVersion.type;
    // Got a fiber with the same type in the tree, so just update the contents of the DOM node.
    if (areSameType)
        updateFiberInDom(fiber, container, previousVersion, nextSibling);
    // The types did not match, create new DOM node and remove previous DOM node.
    else
        replaceFiberInDom(fiber, container, previousVersion, nextSibling);
    expandChildFibers(fiber, previousVersion);
}
/**
 * Goes through all children of the `previousVersion` and the `fiber`.
 * If a child only exists in the `previousVersion`, it is removed from the DOM.
 * Otherwise, it calls {@link renderFiber} for every child and passes its previous version,
 * so that they can be compared and the correct adjustments in the DOM can be made.
 * @param fiber - The current version of the fiber, whose children should be expaneded.
 * @param previousVersion - The previous version of the fiber used for comparison.
 */
function expandChildFibers(fiber, previousVersion) {
    const currentChildren = fiber.children;
    const previousChildren = previousVersion?.children ?? new Map();
    // If the domNode of the container is not a HTMLElement, no children can be added to it.
    const container = fiber.domNode;
    if (!container || !isHTMLElement(container))
        return;
    // First, remove all previousChildren from the DOM, which don't exist in the currentChildren.
    previousChildren.forEach((previousChild, key) => {
        if (currentChildren.get(key) === undefined)
            previousChild.domNode?.remove();
    });
    // Go through all currentChildren and render them to the DOM.
    // The previous version is passed to determine the differences between the two versions.
    // The nextChildSibling is used to enforce the correct order in the DOM.
    // The order is reversed, to determine the nextChildSibling easily (to use insertBefore API).
    let nextChildSibling;
    const reversedChildren = Array.from(currentChildren.entries()).reverse();
    reversedChildren.forEach(([key, currentChild]) => {
        const previousChild = previousChildren.get(key);
        renderFiber(currentChild, container, previousChild, nextChildSibling);
        // Placeholder nodes are not rendered, so they are not used for the order inside the container
        if (currentChild.type !== 'PLACEHOLDER_NODE')
            nextChildSibling = currentChild;
    });
}
/**
 * Before unwrapping, a {@link FunctionalFiber} does not contain the
 * properties of a {@link StaticFiber} like `type`, `props` or `chidren`.
 * These will be only availble after unwrapping. To unwrap a {@link FunctionalFiber}
 * its `fiberFunction` is called. This process is repeated until a {@link StaticFiber}
 * is returned from the `fiberFunction`. The properties of the {@link StaticFiber} are
 * merged into the same reference of the {@link FunctionalFiber}.
 *
 * #### Hooks
 * To make the hooks work, {@link prepareToUseHooks} is called, before the `fiberFunction`
 * is executed. Additionally the `memorizedStates` array is copied from the `previousVersion`
 * so the state will not get lost.
 * @see {@link prepareToUseHooks}
 * @param fiber - The functional fiber which is unwrapped.
 * @param container - The container this fiber will be rendered in.
 * @param previousVersion - The previous version of the fiber, used to copy the `memorizedStates`.
 */
function unwrapFunctionalFiber(fiber, container, previousVersion) {
    // Copy memorizedStates from previousStates, or assign an empty array in case there is none
    fiber.memorizedStates = previousVersion?.memorizedStates ?? [];
    // Make fiber ready for hook calls.
    prepareToUseHooks(fiber.memorizedStates, () => rerenderFunctionalFiber(fiber, container));
    // Unwrap fibers until the fiberFunction returns a StaticFiber.
    let unwrappedFiber = fiber.fiberFunction(fiber.functionProps);
    while (isFunctionalFiber(unwrappedFiber))
        unwrappedFiber = unwrappedFiber.fiberFunction(unwrappedFiber.functionProps);
    // Merge all properties of the unwrappedFiber into the functional fiber.
    Object.assign(fiber, unwrappedFiber);
}
/**
 * Updates the DOM node of the `previousVersion` with the props of the new `fiber`.
 * If the order in the `container` has changed, the DOM node is reinserted at the correct position.
 */
function updateFiberInDom(fiber, container, previousVersion, nextSibling) {
    // Get DOM node from previous version
    const domNode = previousVersion.domNode;
    if (!domNode)
        throw new Error('Could not update fiber, previous domNode was not set.');
    fiber.domNode = domNode;
    // Update all props on DOM node
    updateDomNode(domNode, previousVersion?.props, fiber.props);
    // If the order has changed, the element has to be reinserted at correct position.
    // Note that insertBefore takes care of removing the element from the DOM before
    // re-inserting it, so it's not needed to remove it manually.
    if (nextSibling && domNode.nextSibling !== nextSibling?.domNode) {
        container.insertBefore(domNode, nextSibling?.domNode ?? null);
    }
}
/**
 * Creates a new DOM node for the `fiber` and inserts it at the correct position in the `container`.
 * Removes the DOM node of the `previousVersion` from the DOM.
 */
function replaceFiberInDom(fiber, container, previousVersion, nextSibling) {
    // Remove DOM node of the previous version from the DOM
    previousVersion?.domNode?.remove();
    // Create DOM node for new fiber
    const newDomNode = createDomNode(fiber);
    fiber.domNode = newDomNode;
    container.insertBefore(newDomNode, nextSibling?.domNode ?? null);
}

const App = () => {
  const [text, setText] = useState("SuiWeb App");
  const [count, setCount] = useState(0);
  useEffect(
    () => console.log("First render done"),
    []
  );
  useEffect(
    () => console.log(`The value of text has changed: ${text}`),
    [text]
  );
  useEffect(
    () => console.log("Component was re-rendered")
  );
  return /* @__PURE__ */ createElement("div", null, /* @__PURE__ */ createElement("h1", null, text), /* @__PURE__ */ createElement(TextField, { text, setText }), /* @__PURE__ */ createElement(Counter, { count, setCount }));
};
const TextField = ({ text, setText }) => {
  return /* @__PURE__ */ createElement("div", null, /* @__PURE__ */ createElement(
    "input",
    {
      value: text,
      oninput: (event) => setText(event.target.value)
    }
  ));
};
const Counter = ({ count, setCount }) => {
  return /* @__PURE__ */ createElement("button", { onclick: () => setCount(count + 1) }, `Clicked ${count} times`);
};
render(
  /* @__PURE__ */ createElement(App, null),
  document.getElementById("app")
);
