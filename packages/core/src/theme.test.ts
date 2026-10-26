import assert from 'node:assert/strict'
import { test } from 'node:test'
import { brand, colorsFor, palette, radii } from './theme'

test('brand matches AIB Camera red', () => {
  assert.equal(brand, '#AF2525')
  assert.equal(palette.light.brand, brand)
  assert.equal(palette.dark.brand, brand)
})

test('palette matches Camera canvas tokens', () => {
  assert.equal(palette.light.canvas, '#F5F5F5')
  assert.equal(palette.dark.canvas, '#111111')
  assert.equal(palette.light.fg, '#171717')
  assert.equal(palette.dark.fg, '#FAFAFA')
  assert.equal(palette.light.surface, '#FFFFFF')
  assert.equal(palette.dark.surface, '#1A1A1A')
})

test('colorsFor switches schemes', () => {
  assert.equal(colorsFor('light').canvas, palette.light.canvas)
  assert.equal(colorsFor('dark').canvas, palette.dark.canvas)
})

test('radii match Camera sheet language', () => {
  assert.equal(radii.sm, 12)
  assert.equal(radii.md, 16)
})
