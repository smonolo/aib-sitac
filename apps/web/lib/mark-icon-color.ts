function parseHex(badgeHex: string): [number, number, number] | null {
  const hex = badgeHex.replace('#', '')
  if (hex.length !== 6) return null
  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
  ]
}

function relativeLuminance(badgeHex: string): number {
  const rgb = parseHex(badgeHex)
  if (!rgb) return 0
  const channel = (value: number) => {
    const c = value / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return (
    0.2126 * channel(rgb[0]) +
    0.7152 * channel(rgb[1]) +
    0.0722 * channel(rgb[2])
  )
}

export function markGlyphColor(badgeHex: string): '#171717' | '#ffffff' {
  return relativeLuminance(badgeHex) > 0.35 ? '#171717' : '#ffffff'
}
