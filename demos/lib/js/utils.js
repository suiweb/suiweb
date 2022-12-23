/**
 * Checks whether the `primitive` passed is of a primitive type.
 * @param primitive - The value to check.
 * @returns `true` if `primitive` is of any primitive type.
 */
export function isPrimitive(primitive) {
    return (primitive === null ||
        primitive === undefined ||
        ['string', 'number', 'bigint', 'boolean', 'symbol'].includes(typeof primitive));
}
/**
 * Checks whether the `object` passed is nullish i.e., `null` or `undefined`.
 * @param object - The object to check.
 * @returns `true` if `object` is not nullish.
 */
export function notNullish(object) {
    return object !== null && object !== undefined;
}
/**
 * Checks whether the `element` passed is a HTMLElement.
 * @param element - The element to check.
 * @returns `true` if `element` is an instance of HTMLElement
 */
export function isHTMLElement(element) {
    return element instanceof HTMLElement;
}
/**
 * Checks whether the `element` passed is a Text.
 * @param element - The element to check.
 * @returns `true` is `element` is an instance of Text
 */
export function isText(element) {
    return element instanceof Text;
}
