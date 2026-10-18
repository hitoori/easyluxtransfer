"""Build AVIF alternatives for the two initial hero photos; retain WebP fallbacks."""
from pathlib import Path
import json
from PIL import Image, ImageOps, features

if not features.check('avif'):
    raise SystemExit('Pillow with AVIF support is required.')

root = Path(__file__).resolve().parents[1]
manifest_path = root / 'src/config/image-manifest.json'
manifest = json.loads(manifest_path.read_text())
sources = [
    'images/home/hero/venice-canal-boats.jpg',
    'images/services/water-taxi/venice-lagoon-water-taxi.jpg',
]

for source in sources:
    record = manifest[source]
    with Image.open(root / 'assets/source-images' / source) as original:
        image = ImageOps.exif_transpose(original).convert('RGB')
        image.thumbnail((record['width'], record['height']), Image.Resampling.LANCZOS)
        alternatives = []
        for variant in record['variants']:
            width = variant['width']
            resized = image.resize((width, round(image.height * width / image.width)), Image.Resampling.LANCZOS)
            target = Path(variant['src']).with_suffix('.avif')
            resized.save(root / 'public' / target, 'AVIF', quality=50, speed=6)
            alternatives.append({'src': str(target), 'width': width})
        record['avifVariants'] = alternatives
        mobile_webp = root / 'public' / next(item['src'] for item in record['variants'] if item['width'] == 960)
        mobile_avif = root / 'public' / next(item['src'] for item in alternatives if item['width'] == 960)
        print(f'{source}: 960px WebP {mobile_webp.stat().st_size:,} B; AVIF {mobile_avif.stat().st_size:,} B')

manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
