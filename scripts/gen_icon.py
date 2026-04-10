"""
Generates icon.png (128x128) for the Terminal AI VS Code extension.
Design: dark rounded-square background, ">_" prompt in electric blue,
        three AI-spark dots in the top-right corner.
No external dependencies — uses only Python builtins (struct, zlib).
"""
import struct
import zlib
import math

SIZE = 128
TRANSPARENT = (0, 0, 0, 0)
BG    = (13,  17,  23,  255)   # #0d1117  dark navy
FG    = (56,  189, 248, 255)   # #38bdf8  sky-blue  (">_" strokes)
SPARK = (139, 92,  246, 255)   # #8b5cf6  violet    (AI dots)

pixels: list[list[tuple[int,int,int,int]]] = [[TRANSPARENT] * SIZE for _ in range(SIZE)]


# ── helpers ──────────────────────────────────────────────────────────────────

def blend(dst, src, alpha: float):
    """Alpha-composite src over dst with extra alpha multiplier."""
    a = alpha * (src[3] / 255)
    return (
        int(dst[0] * (1 - a) + src[0] * a),
        int(dst[1] * (1 - a) + src[1] * a),
        int(dst[2] * (1 - a) + src[2] * a),
        min(255, int(dst[3] + 255 * a * (1 - dst[3] / 255))),
    )

def put(x, y, color, alpha=1.0):
    if 0 <= x < SIZE and 0 <= y < SIZE:
        pixels[y][x] = blend(pixels[y][x], color, alpha)

def fill_rect(x, y, w, h, color):
    for dy in range(h):
        for dx in range(w):
            put(x + dx, y + dy, color)

def fill_rounded_rect(x, y, w, h, r, color):
    """Solid rounded rectangle with anti-aliased corners."""
    # interior
    fill_rect(x + r, y,     w - 2*r, h,       color)
    fill_rect(x,     y + r, r,       h - 2*r, color)
    fill_rect(x+w-r, y + r, r,       h - 2*r, color)
    # corners
    for cy in range(r):
        for cx in range(r):
            dist = math.hypot(cx - r + 0.5, cy - r + 0.5)
            a = max(0.0, min(1.0, r - dist))
            # top-left
            put(x + cx,         y + cy,         color, a)
            # top-right
            put(x + w - 1 - cx, y + cy,         color, a)
            # bottom-left
            put(x + cx,         y + h - 1 - cy, color, a)
            # bottom-right
            put(x + w - 1 - cx, y + h - 1 - cy, color, a)

def thick_line(x0, y0, x1, y1, thickness, color):
    """Wu-style anti-aliased thick line."""
    dx, dy = x1 - x0, y1 - y0
    length = math.hypot(dx, dy)
    if length == 0:
        return
    ux, uy = dx / length, dy / length          # unit along line
    px, py = -uy, ux                            # unit perpendicular
    half = thickness / 2.0
    steps = max(int(length) + 1, 2)
    perp_range = int(half) + 2
    for i in range(steps):
        t = i / (steps - 1)
        cx = x0 + ux * length * t
        cy = y0 + uy * length * t
        for p in range(-perp_range, perp_range + 1):
            nx = cx + px * p
            ny = cy + py * p
            dist = abs(p) - half + 0.5
            a = max(0.0, min(1.0, 1.0 - dist))
            put(round(nx), round(ny), color, a)

def filled_circle(cx, cy, r, color):
    for y in range(int(cy - r) - 1, int(cy + r) + 2):
        for x in range(int(cx - r) - 1, int(cx + r) + 2):
            dist = math.hypot(x - cx, y - cy)
            a = max(0.0, min(1.0, r - dist + 0.5))
            put(x, y, color, a)


# ── background ───────────────────────────────────────────────────────────────

fill_rounded_rect(0, 0, SIZE, SIZE, 22, BG)


# ── ">" chevron ──────────────────────────────────────────────────────────────
# Two arms meeting at a rightward point.
# Coordinate frame: icon is 128×128.
# Tip at (79, 55), arms spread back to x=35, top y=22, bottom y=88.

TIP_X, TIP_Y = 68, 56
ARM_X = 26
ARM_TOP_Y  = 24
ARM_BOT_Y  = 88
STROKE = 9.5

thick_line(ARM_X, ARM_TOP_Y, TIP_X, TIP_Y, STROKE, FG)
thick_line(ARM_X, ARM_BOT_Y, TIP_X, TIP_Y, STROKE, FG)


# ── "_" cursor bar ───────────────────────────────────────────────────────────
# Inline after the ">" tip, same vertical mid-line — reads as ">_"

BAR_X, BAR_Y = 78, 68
BAR_W, BAR_H = 32, 9

fill_rounded_rect(BAR_X, BAR_Y, BAR_W, BAR_H, 4, FG)


# ── AI spark dots (top-right) ─────────────────────────────────────────────────
# Three small circles arranged in an L, hinting at AI / sparkle.

DOT_R = 4.5
for (dx, dy) in [(95, 18), (108, 18), (108, 31)]:
    filled_circle(dx, dy, DOT_R, SPARK)


# ── PNG encoder ──────────────────────────────────────────────────────────────

def make_png(px):
    def chunk(tag: bytes, data: bytes) -> bytes:
        crc = zlib.crc32(tag + data) & 0xFFFFFFFF
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', crc)

    sig  = b'\x89PNG\r\n\x1a\n'
    ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', SIZE, SIZE, 8, 6, 0, 0, 0))

    raw = b''.join(
        b'\x00' + b''.join(bytes(p) for p in row)
        for row in px
    )
    idat = chunk(b'IDAT', zlib.compress(raw, 9))
    iend = chunk(b'IEND', b'')
    return sig + ihdr + idat + iend


import os
out = os.path.join(os.path.dirname(__file__), '..', 'icon.png')
with open(out, 'wb') as f:
    f.write(make_png(pixels))

print(f"icon.png written ({SIZE}x{SIZE})")
