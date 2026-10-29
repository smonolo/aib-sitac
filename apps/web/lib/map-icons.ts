import { createElement, type ReactElement } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { SymbolId } from '@aib-sitac/core'
import { markGlyphColor } from '@/lib/mark-icon-color'
import { SYMBOL_ICONS } from '@/lib/symbol-icons'

const SIZE = 64
const GLYPH_PAD = 12
const GLYPH_SIZE = SIZE - GLYPH_PAD * 2
const LUCIDE_VIEW = 24

type IconNode = readonly (readonly [string, Record<string, string>])[]

function lucideIconNode(Icon: LucideIcon): IconNode {
  const element = createElement(Icon, {}) as ReactElement
  const type = element.type as unknown as {
    render: (
      props: object,
      ref: null
    ) => ReactElement<{ icon: { node: IconNode } }>
  }
  return type.render(element.props as object, null).props.icon.node
}

function iconNodeToSvg(node: IconNode): string {
  return node
    .map(([tag, attrs]) => {
      const attrStr = Object.entries(attrs)
        .filter(([key]) => key !== 'key')
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ')
      return `<${tag} ${attrStr}/>`
    })
    .join('')
}

function badgeSvg(color: string, glyph: string): string {
  const stroke = markGlyphColor(color)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" rx="12" ry="12" fill="${color}"/>
  <svg x="${GLYPH_PAD}" y="${GLYPH_PAD}" width="${GLYPH_SIZE}" height="${GLYPH_SIZE}" viewBox="0 0 ${LUCIDE_VIEW} ${LUCIDE_VIEW}" fill="none" stroke="${stroke}" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">${glyph}</svg>
</svg>`
}

export const ARROW_HEAD_IMAGE_ID = 'sitac-arrow-head'

function iconImageId(symbolId: string): string {
  return `sitac-icon-${symbolId}`
}

export function symbolIconSvg(id: SymbolId, color: string): string {
  const glyph = iconNodeToSvg(lucideIconNode(SYMBOL_ICONS[id]))
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
