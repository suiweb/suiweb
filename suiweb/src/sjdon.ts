// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { createElement, CreateElementFunction, Props } from './fiber'
import { isPrimitive, Primitive } from './utils'

/**
 * The type of a {@link SjdonElement}, which is specified in the first element of the array.
 * It can either be a HTML tag or a {@link SjdonElementFunction}.
 */
export type SjdonElementType = keyof HTMLElementTagNameMap | SjdonElementFunction

/**
 * A `SjdonElementFunction` takes in props as a parameter and returns a {@link SjdonElement}.
 * @param props The props of the element. Children are automatically passed via the reserved `children` property.
 */
export type SjdonElementFunction<T = Record<string, unknown>> = (
    props?: T & {
        /**
         * The children of this functional element are automatically passed via this property.
         */
        children?: SjdonElementOrPrimitive[]
    }
) => SjdonElement

/**
 * A `SjdonElementOrPrimitive` is either a {@link SjdonElement} or a {@link Primitive}.
 */
export type SjdonElementOrPrimitive = SjdonElement | Primitive

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
export type SjdonElement = [SjdonElementType, ...(SjdonElementOrPrimitive | Props)[]]

/**
 * Checks if the given object is of type {@link Props}.
 * It is only checked, if the object is of type `object`,
 * but the properties of the object are not type-checked.
 * @param object - The object to check.
 * @returns `true` if the given object is of type {@link Props}.
 */
function isSjdonProps(object: unknown): object is Props {
    return typeof object === 'object' && !Array.isArray(object)
}

/**
 * Check if the given object is of type {@link SjdonElement}.
 * @param object - The object to check.
 * @returns `true` if the given object is of type {@link SjdonElement}.
 */
function isSjdonElement(object: unknown): object is SjdonElement {
    return Array.isArray(object) && object.length != 0 && ['string', 'function'].includes(typeof object[0])
}

/**
 * Check if the given object is of type {@link SjdonElementOrPrimitive}.
 * This means that it can be used as a child in a {@link SjdonElement}.
 * @param object - The object to check.
 * @returns `true` if the given object is of type {@link SjdonElement}.
 */
function isSjdonChild(object: unknown): object is SjdonElementOrPrimitive {
    return isPrimitive(object) || isSjdonElement(object)
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
export function parseSjdon<T>([type, ...rest]: SjdonElement, create: CreateElementFunction<T>): T {
    const propsArray = rest.filter(isSjdonProps)
    const props: Props = Object.assign({}, ...propsArray)
    const children = rest.filter(isSjdonChild)

    if (typeof type == 'string') {
        const parsedChildren = children.map(child => (isSjdonElement(child) ? parseSjdon(child, create) : child))
        return create(type, props, ...parsedChildren)
    } else {
        const fiberFunction = (props?: Record<string, unknown>) => parseSjdon(type({ ...props, children }), create)
        return create(fiberFunction, props)
    }
}
