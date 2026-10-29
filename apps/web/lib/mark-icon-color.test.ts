import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { markGlyphColor } from './mark-icon-color'

describe('markGlyphColor', () => {
  test('uses dark glyph on light badges', () => {
    assert.equal(markGlyphColor('#ffffff'), '#171717')
    assert.equal(markGlyphColor('#A3A3A3'), '#171717')
  })

  test('uses white glyph on dark badges', () => {
    assert.equal(markGlyphColor('#171717'), '#ffffff')
    assert.equal(markGlyphColor('#AF2525'), '#ffffff')
    assert.equal(markGlyphColor('#264653'), '#ffffff')
  })
})
