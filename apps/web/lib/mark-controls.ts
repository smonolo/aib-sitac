import type { SitacFeature, SitacGeometry } from '@aib-sitac/core'
import { applyTextMarkLabel, isTextMark, readTextMarkLabel } from './text-mark'

export function canMutateMarks(opts: {
  locked: boolean
  live: boolean
}): boolean {
  return !opts.locked && opts.live
}

export function canShowSelectedMarkActions(opts: {
  selectMode: boolean
  selectedId: string | null
  moveMode: boolean
}): boolean {
  return opts.selectMode && opts.selectedId != null && !opts.moveMode
}

export function canShowTextEditAction(opts: {
  selectMode: boolean
  selectedId: string | null
  moveMode: boolean
  geometryKind?: string
}): boolean {
  return (
    canShowSelectedMarkActions(opts) &&
    isTextMark({ geometryKind: opts.geometryKind })
  )
}

export function canBeginTextEdit(opts: {
  locked: boolean
  live: boolean
  moveMode: boolean
  textEditBusy: boolean
  feature: SitacFeature | null | undefined
}): boolean {
  return (
    canMutateMarks(opts) &&
    !opts.moveMode &&
    !opts.textEditBusy &&
    opts.feature != null &&
    isTextMark(opts.feature.properties)
  )
}

export function canConfirmTextEdit(opts: {
  textEditBusy: boolean
  draft: string
  feature: SitacFeature | null | undefined
}): boolean {
  return (
    !opts.textEditBusy &&
    Boolean(opts.draft.trim()) &&
    opts.feature != null &&
    isTextMark(opts.feature.properties)
  )
}

export function canDeleteSelected(opts: {
  locked: boolean
  live: boolean
  selectedId: string | null
  deleteBusy: boolean
  moveMode: boolean
}): boolean {
  return (
    canMutateMarks(opts) &&
    opts.selectedId != null &&
    !opts.deleteBusy &&
    !opts.moveMode
  )
}

export function canBeginMove(opts: {
  locked: boolean
  live: boolean
  selectedId: string | null
  moveBusy: boolean
  moveMode: boolean
}): boolean {
  return (
    canMutateMarks(opts) &&
    opts.selectedId != null &&
    !opts.moveBusy &&
    !opts.moveMode
  )
}

export function textEditDraftFromFeature(
  feature: SitacFeature | null | undefined
): string {
  if (!feature || !isTextMark(feature.properties)) return ''
  return readTextMarkLabel(feature.properties)
}

export function textEditUpsertPayload(
  feature: SitacFeature,
  draft: string
): {
  featureId: string
  geometry: SitacGeometry
  properties: SitacFeature['properties']
} | null {
  const label = draft.trim()
  if (!label || !isTextMark(feature.properties)) return null
  return {
    featureId: feature.id,
    geometry: feature.geometry,
    properties: applyTextMarkLabel(feature.properties, label),
  }
}
