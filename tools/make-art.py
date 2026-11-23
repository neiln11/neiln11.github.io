#!/usr/bin/env python3
"""Build the nocturnal hero art from Neil's portrait sky illustration.

The source is a 415x739 illustration. The hero needs a 1920x1080 field, so the
portrait is kept sharp on the right and a soft, colour-matched extension is
built behind the words on the left. No content is invented: every pixel comes
from the supplied artwork. A cool nocturnal grade turns the daylight sky into
twilight; the page adds its own dark scrim over the calm side.
"""
from PIL import Image, ImageFilter, ImageEnhance, ImageDraw, ImageStat
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = Path("/Users/neilravinambissan/Desktop/images.jpeg")
HEADSHOT = Path("/Users/neilravinambissan/Desktop/prof photos/headshot.png")
OUT = ROOT / "assets" / "art"
OUT.mkdir(parents=True, exist_ok=True)

W, H = 1920, 1080
src = Image.open(SRC).convert("RGB")

# 1. Soft field: stretch the whole composition, blur it heavily so it reads as
#    out-of-focus weather rather than a stretched picture.
field = src.resize((W, H), Image.LANCZOS)
field = field.filter(ImageFilter.GaussianBlur(64))
field = ImageEnhance.Color(field).enhance(1.18)
field = ImageEnhance.Brightness(field).enhance(1.04)

# 2. A second, less blurred layer of the cloud band adds real cloud structure
#    across the centre without inventing shapes.
clouds = src.crop((0, 40, 415, 560)).resize((W, int(W * 520 / 415)), Image.LANCZOS)
clouds = clouds.crop((0, 0, W, H)).filter(ImageFilter.GaussianBlur(26))
clouds = ImageEnhance.Contrast(clouds).enhance(0.92)
field = Image.blend(field, clouds, 0.28)

# 3. The signature sits at the source's lower right. The sharp panel is cropped
#    just before it, so no retouching is needed and the cloud field stays intact.
sharp_src = src.crop((0, 0, 312, 739))

# 4. Keep the supplied illustration sharp, at the right edge, full height.
sharp_w = round(sharp_src.width * H / sharp_src.height)
sharp = sharp_src.resize((sharp_w, H), Image.LANCZOS)
sharp_x = W - sharp_w
# A wide, eased mask on the left edge lets it dissolve into the field instead of
# ending on a vertical seam.
mask = Image.new("L", (sharp_w, H), 255)
md = ImageDraw.Draw(mask)
fade = 420
for x in range(fade):
    t = x / fade
    md.line([(x, 0), (x, H)], fill=int(255 * (t * t * (3 - 2 * t))))
field.paste(sharp, (sharp_x, 0), mask)

# 5. Gentle vignette, then a fine grain to match print.
vignette = Image.new("L", (W, H), 0)
vd = ImageDraw.Draw(vignette)
for i in range(0, 240, 4):
    vd.rectangle([i, i, W - i, H - i], outline=int(90 * (1 - i / 240)))
vignette = vignette.filter(ImageFilter.GaussianBlur(80))
field = Image.composite(ImageEnhance.Brightness(field).enhance(0.86), field, vignette.point(lambda v: int(v * 0.55)))


def nocturnal(im, brightness=0.72):
    """A midnight grade: deep shadows, cool cyan cast, the pink shaft kept muted."""
    im = ImageEnhance.Brightness(im).enhance(brightness)
    im = ImageEnhance.Contrast(im).enhance(1.12)
    r, g, b = im.split()
    r = r.point(lambda v: min(255, int(v * 0.82)))
    g = g.point(lambda v: min(255, int(v * 0.97)))
    b = b.point(lambda v: min(255, int(v * 1.12 + 4)))
    return Image.merge("RGB", (r, g, b))


field = nocturnal(field)
field.save(OUT / "hero-sky.jpg", quality=88, optimize=True, progressive=True)

# 6. The supplied studio headshot, kept whole: no crop, only a cool grade and a smaller scale.
shot = Image.open(HEADSHOT).convert("RGB")
shot = shot.resize((640, round(640 * shot.height / shot.width)), Image.LANCZOS)
shot = ImageEnhance.Color(shot).enhance(0.84)
r, g, b = shot.split()
r = r.point(lambda v: min(255, int(v * 0.88)))
g = g.point(lambda v: min(255, int(v * 0.98)))
b = b.point(lambda v: min(255, int(v * 1.10)))
shot = Image.merge("RGB", (r, g, b))
shot.save(OUT / "neil-headshot.jpg", quality=90, optimize=True, progressive=True)
shot.resize((360, round(360 * shot.height / shot.width)), Image.LANCZOS).save(OUT / "neil-headshot-360.jpg", quality=84, optimize=True, progressive=True)

# 7. The share card follows the same night grade.
share = Path(ROOT) / "share.jpg"
if share.exists():
    s = Image.open(share).convert("RGB")
    nocturnal(s, brightness=0.78).save(share, quality=88, optimize=True, progressive=True)

print("wrote", [p.name for p in OUT.glob("*.jpg")])
