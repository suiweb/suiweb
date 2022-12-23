import { Fiber, FunctionalFiber } from './fiber';
/**
 * Renders the given fiber and its children to the DOM in the given container.
 * Note that all children of the container will be removed from
 * the DOM, before the fiber and its children are rendered.
 * @param fiber - The fiber which should be rendered.
 * @param container - The container in which the fiber should be rendered.
 *
 * @public
 */
export declare function render(fiber: Fiber, container: HTMLElement): void;
/**
 * Re-renders the given {@link FunctionalFiber} inside the given container.
 * This will create a copy of the fiber tree, re-evaluate the fiber's `fiberFunction`
 * and compare the newly generated fiber tree to the old one, applying all changes to the DOM.
 * @param fiber - The fiber which should be re-rendered.
 * @param container - The container to render the fiber in.
 */
export declare function rerenderFunctionalFiber(fiber: FunctionalFiber, container: HTMLElement): void;
