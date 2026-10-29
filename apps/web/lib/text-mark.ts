type TextProps = {
  label?: string
  note?: string
}

export function applyTextMarkLabel<T extends object>(
  properties: T,
  text: string
): T & TextProps {
  const label = text.trim()
  if (!label) {
    return { ...properties, label: undefined, note: undefined }
  }
  return { ...properties, label, note: label }
}

export function readTextMarkLabel(properties: TextProps): string {
  return properties.label?.trim() || properties.note?.trim() || ''
}

export function isTextMark(properties: { geometryKind?: string }): boolean {
  return properties.geometryKind === 'text'
}
