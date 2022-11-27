import { parseSjdon } from './sjdon'
import { createElement } from './fiber'
import { render } from './render'
import { useState, useEffect } from './hooks'

/**
 * This file is used as the entry point when framework is packaged into
 * a single file (module). In that case, only methods defined in the export
 * below will be exported publicly. All other exported methods from other modules
 * will no longer be available publicly.
 */

export { parseSjdon, createElement, render, useState, useEffect }
