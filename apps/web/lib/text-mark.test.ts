import { applyTextMarkLabel, isTextMark, readTextMarkLabel } from './text-mark'

describe('applyTextMarkLabel', () => {
  test('sets trimmed label and note', () => {
    const props = {
      symbolId: 'note',
      geometryKind: 'text',
      color: '#111111',
    }
    expect(applyTextMarkLabel(props, '  Punto raccolta  ')).toEqual({
      symbolId: 'note',
      geometryKind: 'text',
      color: '#111111',
      label: 'Punto raccolta',
      note: 'Punto raccolta',
    })
  })

  test('clears blank text to undefined label/note', () => {
    const props = {
      symbolId: 'note',
      geometryKind: 'text',
      label: 'old',
      note: 'old',
    }
    expect(applyTextMarkLabel(props, '   ')).toEqual({
      symbolId: 'note',
      geometryKind: 'text',
      label: undefined,
      note: undefined,
    })
  })

  test('clears empty string the same as whitespace', () => {
    const props = { label: 'keep', note: 'keep' }
    expect(applyTextMarkLabel(props, '')).toEqual({
      label: undefined,
      note: undefined,
    })
  })

  test('preserves other properties when editing', () => {
    const props = {
      symbolId: 'note',
      geometryKind: 'text',
      color: '#AF2525',
      label: 'Vecchio',
      note: 'Vecchio',
    }
    const next = applyTextMarkLabel(props, 'Nuovo')
    expect(next.color).toBe('#AF2525')
    expect(next.label).toBe('Nuovo')
    expect(next.note).toBe('Nuovo')
  })

  test('keeps internal spaces but trims ends', () => {
    expect(applyTextMarkLabel({}, '  a   b  ').label).toBe('a   b')
  })

  test('accepts unicode and newlines then trims outer whitespace', () => {
    const next = applyTextMarkLabel({}, '  🔥 fronte\nord  ')
    expect(next.label).toBe('🔥 fronte\nord')
    expect(next.note).toBe('🔥 fronte\nord')
  })

  test('does not mutate the input object', () => {
    const props = { label: 'old', note: 'old', color: '#111111' }
    const next = applyTextMarkLabel(props, 'new')
    expect(props).toEqual({ label: 'old', note: 'old', color: '#111111' })
    expect(next).not.toBe(props)
  })
})

describe('readTextMarkLabel', () => {
  test('prefers label over note', () => {
    expect(readTextMarkLabel({ label: ' A ', note: ' B ' })).toBe('A')
  })

  test('falls back to note then empty', () => {
    expect(readTextMarkLabel({ note: '  Nota  ' })).toBe('Nota')
    expect(readTextMarkLabel({})).toBe('')
    expect(readTextMarkLabel({ label: '  ', note: '  ' })).toBe('')
  })

  test('ignores empty label and uses note', () => {
    expect(readTextMarkLabel({ label: '', note: 'Solo note' })).toBe(
      'Solo note'
    )
  })
})

describe('isTextMark', () => {
  test('true only for text geometry', () => {
    expect(isTextMark({ geometryKind: 'text' })).toBe(true)
    expect(isTextMark({ geometryKind: 'point' })).toBe(false)
    expect(isTextMark({ geometryKind: 'arrow' })).toBe(false)
    expect(isTextMark({ geometryKind: 'polygon' })).toBe(false)
    expect(isTextMark({})).toBe(false)
  })
})
