import type { CreateElementFunction, Props } from './fiber';
import { Primitive } from './utils';
/**
 * The type of a {@link SjdonElement}, which is specified in the first element of the array.
 * It can either be a HTML tag or a {@link SjdonElementFunction}.
 */
export type SjdonElementType = keyof HTMLElementTagNameMap | SjdonElementFunction;
/**
 * A `SjdonElementFunction` takes in props as a parameter and returns a {@link SjdonElement}.
 * @param props The props of the element. Children are automatically passed via the reserved `children` property.
 */
export type SjdonElementFunction<T = Record<string, unknown>> = (props?: T & {
    /**
     * The children of this functional element are automatically passed via this property.
     */
    children?: SjdonElementOrPrimitive[];
}) => SjdonElement;
/**
 * A `SjdonElementOrPrimitive` is either a {@link SjdonElement} or a {@link Primitive}.
 */
export type SjdonElementOrPrimitive = SjdonElement | Primitive;
/**
 * A `SjdonElement` is an array containing at least one element.
 * The first element is of type {@link SjdonElementType} and specifies the type of the `SjdonElement`.
 * The other elements are either children or props of the element.
 * Chidren can be either a complete `SjdonElement` or a {@link Primitive}.
 * Props are always an object of type {@link Props}.
 * @example
 * ```typescript
 * // a heading 1 with no content
 * const minimalElement: SjdonElement = ['h1']
 * // a div containing a text and a paragraph
 * const elementWithChildren: SjdonElement = ['div', 'Test', ['p', 'Hello World!']]
 * // a button with specified onclick props and a text child.
 * const elementWithProps: SjdonElement = [
 *   'button',
 *   { onclick: () => console.log('Button clicked!') },
 *   'Click me!'
 * ]
 * ```
 */
export type SjdonElement = [SjdonElementType, ...(SjdonElementOrPrimitive | Props)[]];
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
export declare function parseSjdon<T>([type, ...rest]: SjdonElement, create: CreateElementFunction<T>): T;
