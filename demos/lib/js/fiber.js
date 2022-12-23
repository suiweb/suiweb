import { isPrimitive } from './utils.js';
/**
 * Determines if an object is of type {@link StaticFiber}.
 * @param object - The object to check.
 * @returns `true` if the object is of type {@link StaticFiber}.
 */
export function isStaticFiber(object) {
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
export function isFunctionalFiber(object) {
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
export function isNormalProp(propName) {
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
export const createElement = (type, props, ...children) => {
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
