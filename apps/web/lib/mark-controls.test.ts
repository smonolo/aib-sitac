import type { SitacFeature } from '@aib-sitac/core'
import {
  canBeginMove,
  canBeginTextEdit,
  canConfirmTextEdit,
  canDeleteSelected,
  canMutateMarks,
  canShowSelectedMarkActions,
  canShowTextEditAction,
  textEditDraftFromFeature,
  textEditUpsertPayload,
} from './mark-controls'

const textFeature: SitacFeature = {
  id: 'note-1',
  geometry: { type: 'Point', coordinates: [9, 45] },
  properties: {
    symbolId: 'note',
    geometryKind: 'text',
    label: '  Vecchio  ',
    note: 'Vecchio',
    color: '#111111',
  },
  updatedAt: '2026-10-26T10:00:00.000Z',
}

const pointFeature: SitacFeature = {
  id: 'p1',
  geometry: { type: 'Point', coordinates: [9, 45] },
  properties: {
    symbolId: 'hotspot',
    geometryKind: 'point',
    color: '#AF2525',
  },
  updatedAt: '2026-10-26T10:00:00.000Z',
}

describe('canMutateMarks', () => {
  test('requires unlocked live room', () => {
    expect(canMutateMarks({ locked: false, live: true })).toBe(true)
    expect(canMutateMarks({ locked: true, live: true })).toBe(false)
    expect(canMutateMarks({ locked: false, live: false })).toBe(false)
  })
})

describe('selected mark actions', () => {
  test('canShowSelectedMarkActions needs selection outside move mode', () => {
    expect(
      canShowSelectedMarkActions({
        selectMode: true,
        selectedId: 'x',
        moveMode: false,
      })
    ).toBe(true)
    expect(
      canShowSelectedMarkActions({
        selectMode: true,
        selectedId: null,
        moveMode: false,
      })
    ).toBe(false)
    expect(
      canShowSelectedMarkActions({
        selectMode: false,
        selectedId: 'x',
        moveMode: false,
      })
    ).toBe(false)
    expect(
      canShowSelectedMarkActions({
        selectMode: true,
        selectedId: 'x',
        moveMode: true,
      })
    ).toBe(false)
  })

  test('canShowTextEditAction only for text geometry', () => {
    expect(
      canShowTextEditAction({
        selectMode: true,
        selectedId: 'note-1',
        moveMode: false,
        geometryKind: 'text',
      })
    ).toBe(true)
    expect(
      canShowTextEditAction({
        selectMode: true,
        selectedId: 'p1',
        moveMode: false,
        geometryKind: 'point',
      })
    ).toBe(false)
  })
})

describe('canBeginTextEdit', () => {
  test('allows live unlocked text feature', () => {
    expect(
      canBeginTextEdit({
        locked: false,
        live: true,
        moveMode: false,
        textEditBusy: false,
        feature: textFeature,
      })
    ).toBe(true)
  })

  test('blocks scrubbing, lock, move, busy, non-text, missing feature', () => {
    expect(
      canBeginTextEdit({
        locked: false,
        live: false,
        moveMode: false,
        textEditBusy: false,
        feature: textFeature,
      })
    ).toBe(false)
    expect(
      canBeginTextEdit({
        locked: true,
        live: true,
        moveMode: false,
        textEditBusy: false,
        feature: textFeature,
      })
    ).toBe(false)
    expect(
      canBeginTextEdit({
        locked: false,
        live: true,
        moveMode: true,
        textEditBusy: false,
        feature: textFeature,
      })
    ).toBe(false)
    expect(
      canBeginTextEdit({
        locked: false,
        live: true,
        moveMode: false,
        textEditBusy: true,
        feature: textFeature,
      })
    ).toBe(false)
    expect(
      canBeginTextEdit({
        locked: false,
        live: true,
        moveMode: false,
        textEditBusy: false,
        feature: pointFeature,
      })
    ).toBe(false)
    expect(
      canBeginTextEdit({
        locked: false,
        live: true,
        moveMode: false,
        textEditBusy: false,
        feature: null,
      })
    ).toBe(false)
  })
})

describe('canConfirmTextEdit', () => {
  test('requires non-empty draft on a text feature', () => {
    expect(
      canConfirmTextEdit({
        textEditBusy: false,
        draft: 'ok',
        feature: textFeature,
      })
    ).toBe(true)
    expect(
      canConfirmTextEdit({
        textEditBusy: false,
        draft: '   ',
        feature: textFeature,
      })
    ).toBe(false)
    expect(
      canConfirmTextEdit({
        textEditBusy: true,
        draft: 'ok',
        feature: textFeature,
      })
    ).toBe(false)
    expect(
      canConfirmTextEdit({
        textEditBusy: false,
        draft: 'ok',
        feature: pointFeature,
      })
    ).toBe(false)
  })
})

describe('delete and move gates', () => {
  test('canDeleteSelected', () => {
    expect(
      canDeleteSelected({
        locked: false,
        live: true,
        selectedId: 'x',
        deleteBusy: false,
        moveMode: false,
      })
    ).toBe(true)
    expect(
      canDeleteSelected({
        locked: false,
        live: true,
        selectedId: 'x',
        deleteBusy: true,
        moveMode: false,
      })
    ).toBe(false)
    expect(
      canDeleteSelected({
        locked: false,
        live: false,
        selectedId: 'x',
        deleteBusy: false,
        moveMode: false,
      })
    ).toBe(false)
  })

  test('canBeginMove', () => {
    expect(
      canBeginMove({
        locked: false,
        live: true,
        selectedId: 'x',
        moveBusy: false,
        moveMode: false,
      })
    ).toBe(true)
    expect(
      canBeginMove({
        locked: false,
        live: true,
        selectedId: 'x',
        moveBusy: true,
        moveMode: false,
      })
    ).toBe(false)
    expect(
      canBeginMove({
        locked: false,
        live: true,
        selectedId: null,
        moveBusy: false,
        moveMode: false,
      })
    ).toBe(false)
  })
})

describe('text edit payload helpers', () => {
  test('textEditDraftFromFeature reads trimmed label', () => {
    expect(textEditDraftFromFeature(textFeature)).toBe('Vecchio')
    expect(textEditDraftFromFeature(pointFeature)).toBe('')
    expect(textEditDraftFromFeature(null)).toBe('')
  })

  test('textEditUpsertPayload builds upsert for text marks', () => {
    expect(textEditUpsertPayload(textFeature, '  Nuovo  ')).toEqual({
      featureId: 'note-1',
      geometry: textFeature.geometry,
      properties: {
        ...textFeature.properties,
        label: 'Nuovo',
        note: 'Nuovo',
      },
    })
    expect(textEditUpsertPayload(textFeature, '   ')).toBe(null)
    expect(textEditUpsertPayload(pointFeature, 'x')).toBe(null)
  })
})
