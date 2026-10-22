
"""Compose the Twemoji peach onto the XPeach app tile and emit every icon size."""
import sys
from PIL import Image, ImageDraw

S = 4096
SRC = '/tmp/twemoji-peach.webp'
OUT = sys.argv[1]

peach = Image.open(SRC).convert('RGBA')
# trim to the visible mark so the tile padding is even on all sides
box = peach.getbbox()
if box is not None:
    peach = peach.crop(box)
side = max(peach.size)
square = Image.new('RGBA', (side, side), (0, 0, 0, 0))
square.paste(peach, ((side - peach.width) // 2, (side - peach.height) // 2), peach)
peach = square

# ---- rounded tile ----
img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
pad, radius = int(S * 0.055), int(S * 0.225)
grad = Image.new('RGBA', (1, S))
gd = ImageDraw.Draw(grad)
top, bot = (255, 249, 243), (255, 226, 206)
for y in range(S):
    t = y / (S - 1)
    gd.point((0, y), tuple(int(top[i] + (bot[i] - top[i]) * t) for i in range(3)) + (255,))
mask = Image.new('L', (S, S), 0)
ImageDraw.Draw(mask).rounded_rectangle([pad, pad, S - pad, S - pad], radius=radius, fill=255)
img.paste(grad.resize((S, S)), (0, 0), mask)

# ---- place the peach, optically centred ----
target = int(S * 0.630)
peach = peach.resize((target, target), Image.LANCZOS)
x = (S - target) // 2
y = int((S - target) // 2 + S * 0.012)
img.alpha_composite(peach, (x, y))

img = img.resize((1024, 1024), Image.LANCZOS)
img.save(OUT, 'PNG')
print('wrote', OUT, img.size)
