import { type Props, type StaticFiber } from './fiber';
/**
 * Creates a new DOM node for the fiber.
 * - For normal elements a {@link HTMLElement} with the `type` of the fiber is created.
 * - For a `TEXT_NODE` a {@link Text} is created.
 * - For a `PLACEHOLDER_NODE` the function throws, as it is not possible to create a DOM node for it.
 * @param fiber - The fiber to create a DOM element for.
 * @returns The created DOM node, either a {@link Text} or a {@link HTMLElement}.
 */
export declare function createDomNode(fiber: StaticFiber): Text | HTMLElement;
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
export declare function updateDomNode(domNode: HTMLElement | Text, previousProps?: Props, currentProps?: Props): void;
