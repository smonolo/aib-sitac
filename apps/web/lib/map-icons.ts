import { type ReactElement, type ReactNode } from 'react'
import type { SymbolId } from '@aib-sitac/core'
import { markGlyphColor } from '@/lib/mark-icon-color'
import { solarIconChildren } from '@/lib/solar-icon'
import { SYMBOL_ICONS } from '@/lib/symbol-icons'

const SIZE = 64
const GLYPH_PAD = 12
const GLYPH_SIZE = SIZE - GLYPH_PAD * 2
const ICON_VIEW = 24

function attrName(key: string): string {
  if (key === 'className') return 'class'
  if (key === 'strokeWidth') return 'stroke-width'
  if (key === 'strokeLinecap') return 'stroke-linecap'
  if (key === 'strokeLinejoin') return 'stroke-linejoin'
  if (key === 'strokeDasharray') return 'stroke-dasharray'
  if (key === 'strokeDashoffset') return 'stroke-dashoffset'
  if (key === 'strokeMiterlimit') return 'stroke-miterlimit'
  if (key === 'fillRule') return 'fill-rule'
  if (key === 'clipRule') return 'clip-rule'
  if (key === 'clipPath') return 'clip-path'
  return key.replace(/([A-Z])/g, '-$1').toLowerCase()
}

function elementToSvg(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return ''
  if (Array.isArray(node)) return node.map(elementToSvg).join('')
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (typeof node !== 'object' || !('type' in node)) return ''
  const el = node as ReactElement<
    { children?: ReactNode } & Record<string, unknown>
  >
  if (typeof el.type !== 'string') return ''
  const { children, ...attrs } = el.props
  const attrStr = Object.entries(attrs)
    .filter(
      ([key, value]) =>
        key !== 'key' &&
        value != null &&
        typeof value !== 'function' &&
        typeof value !== 'object'
    )
    .map(([key, value]) => `${attrName(key)}="${String(value)}"`)
    .join(' ')
  const inner = elementToSvg(children)
  if (inner) {
    return attrStr
      ? `<${el.type} ${attrStr}>${inner}</${el.type}>`
      : `<${el.type}>${inner}</${el.type}>`
  }
  return attrStr ? `<${el.type} ${attrStr}/>` : `<${el.type}/>`
}

function badgeSvg(color: string, glyph: string): string {
  const stroke = markGlyphColor(color)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" rx="12" ry="12" fill="${color}"/>
  <svg x="${GLYPH_PAD}" y="${GLYPH_PAD}" width="${GLYPH_SIZE}" height="${GLYPH_SIZE}" viewBox="0 0 ${ICON_VIEW} ${ICON_VIEW}" fill="none" color="${stroke}" stroke="${stroke}" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">${glyph}</svg>
</svg>`
}

export const ARROW_HEAD_IMAGE_ID = 'sitac-arrow-head'

function iconImageId(symbolId: string): string {
  return `sitac-icon-${symbolId}`
}

export function symbolIconSvg(id: SymbolId, color: string): string {
  const glyph = elementToSvg(solarIconChildren(SYMBOL_ICONS[id]))
  return badgeSvg(color, glyph)
}

export function symbolIconDataUrl(id: SymbolId, color: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(symbolIconSvg(id, color))}`
}

async function decodeSvgDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  const image = new Image(SIZE, SIZE)
  image.decoding = 'async'
  image.src = dataUrl
  await image.decode()
  return image
}

export async function loadSymbolIcon(
  map: {
    hasImage: (id: string) => boolean
    addImage: (
      id: string,
      image: HTMLImageElement | ImageBitmap | ImageData,
      options?: { pixelRatio?: number; sdf?: boolean }
    ) => void
  },
  id: SymbolId,
  color: string
): Promise<void> {
  const imageId = iconImageId(id)
  if (map.hasImage(imageId)) return
  const image = await decodeSvgDataUrl(symbolIconDataUrl(id, color))
  map.addImage(imageId, image, { pixelRatio: 2 })
}

export async function loadArrowHeadIcon(map: {
  hasImage: (id: string) => boolean
  addImage: (
    id: string,
    image: HTMLImageElement | ImageBitmap | ImageData,
    options?: { pixelRatio?: number; sdf?: boolean }
  ) => void
}): Promise<void> {
  if (map.hasImage(ARROW_HEAD_IMAGE_ID)) return
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, SIZE, SIZE)
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.moveTo(32, 10)
  ctx.lineTo(54, 50)
  ctx.lineTo(32, 42)
  ctx.lineTo(10, 50)
  ctx.closePath()
  ctx.fill()
  map.addImage(ARROW_HEAD_IMAGE_ID, ctx.getImageData(0, 0, SIZE, SIZE), {
    pixelRatio: 2,
    sdf: true,
  })
}
