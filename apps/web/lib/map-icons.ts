import type { SymbolId } from '@aib-sitac/core'

const SIZE = 64

function svg(body: string, color: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <circle cx="32" cy="32" r="30" fill="${color}" stroke="#ffffff" stroke-width="3"/>
  ${body}
</svg>`
}

const ICON_BODY: Record<SymbolId, (color: string) => string> = {
  hotspot: c =>
    svg(
      `<path d="M32 14c0 0-10 12-10 20a10 10 0 0 0 20 0c0-8-10-20-10-20z" fill="#fff" opacity=".95"/>
       <path d="M32 28c0 0-5 6-5 10a5 5 0 0 0 10 0c0-4-5-10-5-10z" fill="${c}"/>`,
      c
    ),
  active_front: c =>
    svg(
      `<path d="M18 40 L32 16 L46 40 Z" fill="none" stroke="#fff" stroke-width="3.5" stroke-linejoin="round"/>
       <path d="M26 40 L32 28 L38 40" fill="none" stroke="#fff" stroke-width="2.5"/>`,
      c
    ),
  burned_area: c =>
    svg(
      `<path d="M18 38 L26 22 L34 34 L42 20 L46 38 Z" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>`,
      c
    ),
  water_point: c =>
    svg(
      `<path d="M32 16c0 0-12 14-12 22a12 12 0 0 0 24 0c0-8-12-22-12-22z" fill="#fff"/>`,
      c
    ),
  lookout: c =>
    svg(
      `<path d="M32 18 L46 42 H18 Z" fill="none" stroke="#fff" stroke-width="3.5" stroke-linejoin="round"/>
       <circle cx="32" cy="34" r="4" fill="#fff"/>`,
      c
    ),
  command_post: c =>
    svg(
      `<path d="M22 44 V18 H38 L32 26 L38 34 H22" fill="none" stroke="#fff" stroke-width="3.5" stroke-linejoin="round"/>`,
      c
    ),
  vehicle: c =>
    svg(
      `<rect x="16" y="28" width="32" height="14" rx="2" fill="none" stroke="#fff" stroke-width="3"/>
       <path d="M22 28 V24 H34 L40 28" fill="none" stroke="#fff" stroke-width="3"/>
       <circle cx="24" cy="42" r="3.5" fill="#fff"/>
       <circle cx="40" cy="42" r="3.5" fill="#fff"/>`,
      c
    ),
  squad: c =>
    svg(
      `<circle cx="24" cy="24" r="6" fill="#fff"/>
       <circle cx="40" cy="24" r="6" fill="#fff"/>
       <path d="M14 44c0-7 4.5-11 10-11s10 4 10 11" fill="none" stroke="#fff" stroke-width="3"/>
       <path d="M30 44c0-7 4.5-11 10-11s10 4 10 11" fill="none" stroke="#fff" stroke-width="3"/>`,
      c
    ),
  road_closed: c =>
    svg(
      `<path d="M16 32 H48" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
       <path d="M24 22 L40 42 M40 22 L24 42" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>`,
      c
    ),
  wind: c =>
    svg(
      `<path d="M14 32 H42" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>
       <path d="M34 22 L46 32 L34 42" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
       <path d="M14 24 H28 M14 40 H28" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".8"/>`,
      c
    ),
  note: c =>
    svg(
      `<rect x="20" y="16" width="24" height="30" rx="3" fill="#fff"/>
       <path d="M26 26 H38 M26 32 H38 M26 38 H34" stroke="${c}" stroke-width="2.5" stroke-linecap="round"/>`,
      c
    ),
}

function iconImageId(symbolId: string): string {
  return `sitac-icon-${symbolId}`
}

export function symbolIconSvg(id: SymbolId, color: string): string {
  return ICON_BODY[id](color)
}

export function symbolIconDataUrl(id: SymbolId, color: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(symbolIconSvg(id, color))}`
}

export async function loadSymbolIcon(
  map: {
    hasImage: (id: string) => boolean
    addImage: (
      id: string,
      image: HTMLImageElement | ImageBitmap | ImageData,
      options?: { pixelRatio?: number }
    ) => void
  },
  id: SymbolId,
  color: string
): Promise<void> {
  const imageId = iconImageId(id)
  if (map.hasImage(imageId)) return
  const image = new Image(SIZE, SIZE)
  image.decoding = 'async'
  image.src = symbolIconDataUrl(id, color)
  await image.decode()
  map.addImage(imageId, image, { pixelRatio: 2 })
}
