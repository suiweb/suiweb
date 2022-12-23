import { isPrimitive } from './utils.js';
/**
 * Checks if the given object is of type {@link Props}.
 * It is only checked, if the object is of type `object`,
 * but the properties of the object are not type-checked.
 * @param object - The object to check.
 * @returns `true` if the given object is of type {@link Props}.
 */
function isSjdonProps(object) {
    return typeof object === 'object' && !Array.isArray(object);
}
/**
 * Check if the given object is of type {@link SjdonElement}.
 * @param object - The object to check.
 * @returns `true` if the given object is of type {@link SjdonElement}.
 */
function isSjdonElement(object) {
    return Array.isArray(object) && object.length != 0 && ['string', 'function'].includes(typeof object[0]);
}
/**
 * Check if the given object is of type {@link SjdonElementOrPrimitive}.
 * This means that it can be used as a child in a {@link SjdonElement}.
 * @param object - The object to check.
 * @returns `true` if the given object is of type {@link SjdonElement}.
 */
function isSjdonChild(object) {
    return isPrimitive(object) || isSjdonElement(object);
}
/**
 * Parses a {@link SjdonElement} with all its children and creates a fiber tree.
 * Uses the {@link createElement} function to create all fibers.
 * @param param0 - The {@link SjdonElement} which should be parsed.
 * @param create - The function which is used to create the elements.
 * It works properly with the SuiWeb implementation {@link createElement},
 * but also other implementations, like `React.createElement`, could be used.
 * Note, however, that this is only partially supported, as the typing don't match and the
 * props are not fully compatible.
 * @returns The root element of the tree containing all children.
 *
 * @public
 */
export function parseSjdon([type, ...rest], create) {
    const propsArray = rest.filter(isSjdonProps);
    const props = Object.assign({}, ...propsArray);
    const children = rest.filter(isSjdonChild);
    if (typeof type == 'string') {
        const parsedChildren = children.map(child => (isSjdonElement(child) ? parseSjdon(child, create) : child));
        return create(type, props, ...parsedChildren);
    }
    else {
        const fiberFunction = (props) => parseSjdon(type({ ...props, children }), create);
        return create(fiberFunction, props);
    }
}
