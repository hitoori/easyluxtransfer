"""Build local WebP images and a responsive manifest. Requires Pillow."""
from pathlib import Path
from PIL import Image, ImageOps
import json, shutil

root = Path(__file__).resolve().parents[1]
public = root / 'public'
archive = root / 'assets/source-images'
manifest = {}
renames = {
 'from-the-airport': 'airport-arrivals-sign',
 'to-the-airport': 'airport-departures-sign',
 'address-to-address': 'chauffeur-loading-luggage',
 'venice-airport-change': 'airport-terminal-sign',
 'arriving-wide-map': 'venice-water-taxi-arrival-route',
 'leaving-wide-map': 'venice-water-taxi-departure-route',
 'arriving-mobile-map-v2': 'venice-water-taxi-arrival-route-mobile',
 'leaving-mobile-map-v2': 'venice-water-taxi-departure-route-mobile',
}
# Preserve originals outside the published directory; re-runs use the archive.
for source in (public / 'images').rglob('*'):
 if source.suffix.lower() not in {'.jpg', '.jpeg', '.png'} or source.name == 'powered_by_google_on_white.png': continue
 rel = source.relative_to(public)
 dest = archive / rel
 if not dest.exists():
  dest.parent.mkdir(parents=True, exist_ok=True)
  shutil.copy2(source, dest)
 if 'brand' not in rel.parts: source.unlink()
original_total = optimized_total = 0
for source in archive.rglob('*'):
 if source.suffix.lower() not in {'.jpg', '.jpeg', '.png'}: continue
 rel = source.relative_to(archive)
 out = rel.with_name(renames.get(source.stem, source.stem) + '.webp')
 (public / out).parent.mkdir(parents=True, exist_ok=True)
 with Image.open(source) as opened:
  image = ImageOps.exif_transpose(opened).convert('RGBA' if 'A' in opened.getbands() else 'RGB')
  brand = 'brand' in rel.parts
  diagram = 'map' in source.stem
  image.thumbnail((192, 192) if brand else (1920, 1920), Image.Resampling.LANCZOS)
  image.save(public / out, 'WEBP', quality=92 if diagram else 82, method=6, lossless=brand)
  variants = []
  if not brand:
   for width in (640, 960, 1280):
    if width >= image.width: continue
    small = image.resize((width, round(image.height * width / image.width)), Image.Resampling.LANCZOS)
    variant = out.with_name(f'{out.stem}-{width}w.webp')
    small.save(public / variant, 'WEBP', quality=90 if diagram else 78, method=6)
    variants.append({'src': str(variant), 'width': width})
  variants.append({'src': str(out), 'width': image.width})
  manifest[str(rel)] = {'src': str(out), 'width': image.width, 'height': image.height, 'variants': variants}
  original_total += source.stat().st_size
  optimized_total += (public / out).stat().st_size
  if brand:
   # Keep PNG URLs used by the favicon and email adapter valid.
   png = image.copy()
   if source.stem == 'easy-lux-favicon-round': png.thumbnail((96, 96), Image.Resampling.LANCZOS)
   elif source.stem.endswith('icon'): png.thumbnail((64, 64), Image.Resampling.LANCZOS)
   png.save(public / rel, 'PNG', optimize=True)
(root / 'src/config/image-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(f'{len(manifest)} images: {original_total/1024/1024:.2f} MiB -> {optimized_total/1024/1024:.2f} MiB (main WebP variants; {100*(1-optimized_total/original_total):.1f}% smaller)')
