export type Primitive = string | number | bigint | boolean | symbol | null | undefined;
/**
 * Checks whether the `primitive` passed is of a primitive type.
 * @param primitive - The value to check.
 * @returns `true` if `primitive` is of any primitive type.
 */
export declare function isPrimitive(primitive: unknown): primitive is Primitive;
/**
 * Checks whether the `object` passed is nullish i.e., `null` or `undefined`.
 * @param object - The object to check.
 * @returns `true` if `object` is not nullish.
 */
export declare function notNullish<T>(object: T): object is NonNullable<T>;
/**
 * Checks whether the `element` passed is a HTMLElement.
 * @param element - The element to check.
 * @returns `true` if `element` is an instance of HTMLElement
 */
export declare function isHTMLElement(element: unknown): element is HTMLElement;
/**
 * Checks whether the `element` passed is a Text.
 * @param element - The element to check.
 * @returns `true` is `element` is an instance of Text
 */
export declare function isText(element: unknown): element is Text;
