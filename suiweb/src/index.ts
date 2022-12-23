import { createElement } from './fiber'
import { useEffect, useState } from './hooks'
import { render } from './render'
import { parseSjdon } from './sjdon'

/*
 * This file is used as the entry point when framework is packaged into
 * a single file (module). In that case, only methods defined in the export
 * below will be exported publicly. All other exported methods from other modules
 * will no longer be available publicly.
 */

export { parseSjdon, createElement, render, useState, useEffect }

/*
 * All types of the framework are also exported, so they can be used when working with TypeScript.
 */

import type {
    CreateElementFunction,
    Fiber,
    FiberFunction,
    FunctionalFiber,
    Props,
    StaticFiber,
    StaticFiberType,
    StyleProp,
} from './fiber'
import type { SjdonElement, SjdonElementFunction, SjdonElementOrPrimitive, SjdonElementType } from './sjdon'
import type { Primitive } from './utils'

export type {
    CreateElementFunction,
    Fiber,
    FiberFunction,
    FunctionalFiber,
    Primitive,
    Props,
    SjdonElement,
    SjdonElementFunction,
    SjdonElementOrPrimitive,
    SjdonElementType,
    StaticFiber,
    StaticFiberType,
    StyleProp,
}
