import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { SYMBOL_IDS } from '@aib-sitac/core'
import {
  ARROW_HEAD_IMAGE_ID,
  symbolIconDataUrl,
  symbolIconSvg,
} from './map-icons'

describe('symbol icons', () => {
  test('every catalog symbol produces svg and data url', () => {
    for (const id of SYMBOL_IDS) {
      const svg = symbolIconSvg(id, '#AF2525')
      assert.match(svg, /^<svg /)
      assert.match(svg, /#AF2525/)
      assert.match(svg, /xmlns="http:\/\/www.w3.org\/2000\/svg"/)
      assert.match(svg, /rx="12"/)
      assert.match(svg, /rx="11"/)

      const url = symbolIconDataUrl(id, '#AF2525')
      assert.match(url, /^data:image\/svg\+xml;charset=utf-8,/)
      assert.ok(url.length > 40)
    }
  })

  test('arrow head image id is stable', () => {
    assert.equal(ARROW_HEAD_IMAGE_ID, 'sitac-arrow-head')
  })
})
