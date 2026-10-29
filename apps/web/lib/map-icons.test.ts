import { SYMBOL_IDS } from '@aib-sitac/core'
import {
  ARROW_HEAD_IMAGE_ID,
  symbolIconDataUrl,
  symbolIconSvg,
} from './map-icons'
import { SYMBOL_ICONS } from './symbol-icons'

describe('symbol icons', () => {
  test('every catalog symbol maps to a Lucide icon', () => {
    for (const id of SYMBOL_IDS) {
      expect(typeof SYMBOL_ICONS[id]).toBe('object')
      expect(SYMBOL_ICONS[id]).toBeTruthy()
    }
  })

  test('every catalog symbol produces lucide-backed svg and data url', () => {
    for (const id of SYMBOL_IDS) {
      const svg = symbolIconSvg(id, '#AF2525')
      expect(svg).toMatch(/^<svg /)
      expect(svg).toMatch(/#AF2525/)
      expect(svg).toMatch(/xmlns="http:\/\/www.w3.org\/2000\/svg"/)
      expect(svg).toMatch(/rx="12"/)
      expect(svg).not.toMatch(/fill="#ffffff"/)
      expect(svg).toMatch(/stroke="#(ffffff|171717)"/)
      expect(svg).toMatch(/viewBox="0 0 24 24"/)
      expect(svg).toMatch(/<path /)

      const url = symbolIconDataUrl(id, '#AF2525')
      expect(url).toMatch(/^data:image\/svg\+xml;charset=utf-8,/)
      expect(url.length > 40).toBeTruthy()
    }
  })

  test('arrow head image id is stable', () => {
    expect(ARROW_HEAD_IMAGE_ID).toBe('sitac-arrow-head')
  })
})
