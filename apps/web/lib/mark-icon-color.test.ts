import { markGlyphColor } from './mark-icon-color'

describe('markGlyphColor', () => {
  test('uses dark glyph on light badges', () => {
    expect(markGlyphColor('#ffffff')).toBe('#171717')
    expect(markGlyphColor('#A3A3A3')).toBe('#171717')
  })

  test('uses white glyph on dark badges', () => {
    expect(markGlyphColor('#171717')).toBe('#ffffff')
    expect(markGlyphColor('#AF2525')).toBe('#ffffff')
    expect(markGlyphColor('#264653')).toBe('#ffffff')
  })
})
