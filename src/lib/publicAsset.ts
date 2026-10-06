import imageManifest from '../config/image-manifest.json'

type ImageRecord = { src: string; width: number; height: number; variants: { src: string; width: number }[] }
type ResponsiveImageAttributes = { src: string; width?: number; height?: number; srcSet?: string; sizes?: string }
const images: Record<string, ImageRecord> = imageManifest
const byOptimizedPath = new Map(Object.values(images).map(image => [image.src, image]))
const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`

export function publicAsset(path: string): string {
  const clean = path.replace(/^\/+/, '')
  return assetUrl(images[clean]?.src ?? clean)
}

export function imageAttributes(source: string, sizes = '(max-width: 760px) 100vw, (max-width: 1280px) 90vw, 1340px'): ResponsiveImageAttributes {
  const path = source.startsWith(import.meta.env.BASE_URL) ? source.slice(import.meta.env.BASE_URL.length) : source
  const image = images[path] ?? byOptimizedPath.get(path)
  if (!image) return { src: source }
  return {
    src: assetUrl(image.src), width: image.width, height: image.height,
    ...(image.variants.length > 1 ? {
      srcSet: image.variants.map(variant => `${assetUrl(variant.src)} ${variant.width}w`).join(', '), sizes,
    } : {}),
  }
}
