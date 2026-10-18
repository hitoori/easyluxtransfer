import type { ImgHTMLAttributes } from 'react'
import { imageAttributes, imageAvifSource } from '../lib/publicAsset'

/** Local responsive images, with a safe fallback for non-catalogue assets. */
export default function OptimizedImage({ src, loading, fetchPriority, decoding = 'async', sizes, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const avif = imageAvifSource(src ?? '', sizes)
  const image = <img
    {...imageAttributes(src ?? '', sizes)}
    {...props}
    loading={loading ?? (fetchPriority === 'high' ? 'eager' : 'lazy')}
    decoding={decoding}
    fetchPriority={fetchPriority}
  />
  return avif ? <picture className="contents"><source type="image/avif" {...avif} />{image}</picture> : image
}
