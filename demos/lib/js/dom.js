import { isNormalProp } from './fiber.js';
import { isText } from './utils.js';
/**
 * Creates a new DOM node for the fiber.
 * - For normal elements a {@link HTMLElement} with the `type` of the fiber is created.
 * - For a `TEXT_NODE` a {@link Text} is created.
 * - For a `PLACEHOLDER_NODE` the function throws, as it is not possible to create a DOM node for it.
 * @param fiber - The fiber to create a DOM element for.
 * @returns The created DOM node, either a {@link Text} or a {@link HTMLElement}.
 */
export function createDomNode(fiber) {
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
export function updateDomNode(domNode, previousProps = {}, currentProps = {}) {
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
