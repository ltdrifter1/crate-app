#!/usr/bin/env python3
"""Render original Channel Surfing pictograms with Pillow.

Bold filled silhouettes on coloured studio plates — genre-icon sheet
energy, Planet MP3 colour (Aqua, silver, culture hues), not B&W wheatpaste.
"""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "src" / "assets" / "channels"
SRC = 2048  # draw large, downscale to 1024
OUT = 1024
S = SRC / 512  # viewBox scale (512-unit design grid)


def T(x, y=None):
    if y is None:
        return int(round(x * S))
    return int(round(x * S)), int(round(y * S))


PALETTE = {
    "y2k-dance": ("#E21B7A", "#FFF4E8", "#1E6FE8"),
    "psychedelic-rock": ("#5B2480", "#D6F25A", "#FF7AD9"),
    "variety-mix": ("#1A2030", "#F4F6F8", "#1E6FE8"),
    "local-pnw": ("#1B4638", "#F3F0E6", "#8EC8B8"),
    "house": ("#E85A1A", "#FFF4E8", "#F5C542"),
    "techno": ("#10141C", "#C5CAD3", "#1E6FE8"),
    "uk-garage": ("#F5C400", "#161208", "#111111"),
    "dubstep": ("#34186A", "#F4EFE6", "#B89BFF"),
    "drum-and-bass": ("#16341A", "#B8F04A", "#F4EFE6"),
    "shoegaze": ("#3A2748", "#E8C4D6", "#8E7CA8"),
    "metal": ("#160E10", "#F4EFE6", "#E0314A"),
    "punk": ("#111111", "#FF3D8A", "#F5C400"),
    "country-folk": ("#B56A1C", "#F8EED8", "#2A1A0C"),
    "downtempo": ("#1A2748", "#C5D4F0", "#8FA8E8"),
}


def canvas(bg):
    im = Image.new("RGB", (SRC, SRC), bg)
    return im, ImageDraw.Draw(im)


def star_pts(cx, cy, n, r_out, r_in, rot=-90):
    pts = []
    rot = math.radians(rot)
    for i in range(n * 2):
        r = r_out if i % 2 == 0 else r_in
        a = rot + i * math.pi / n
        pts.append(T(cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def spark(d, cx, cy, r, fill):
    d.polygon(star_pts(cx, cy, 8, r, r * 0.38), fill=fill)


def rr(d, x, y, w, h, r, fill=None, outline=None, width=0):
    d.rounded_rectangle([T(x, y), T(x + w, y + h)], radius=T(r), fill=fill, outline=outline, width=T(width) if width else 0)


def ellipse(d, cx, cy, rx, ry, fill=None, outline=None, width=0):
    d.ellipse([T(cx - rx, cy - ry), T(cx + rx, cy + ry)], fill=fill, outline=outline, width=T(width) if width else 0)


def circle_ring(d, cx, cy, r, stroke, sw, bg):
    ellipse(d, cx, cy, r, r, fill=stroke)
    inner = r - sw
    if inner > 0:
        ellipse(d, cx, cy, inner, inner, fill=bg)


def poly(d, pts, fill):
    d.polygon([T(x, y) for x, y in pts], fill=fill)


def finish(im, name):
    out = im.resize((OUT, OUT), Image.Resampling.LANCZOS)
    dest = OUT_DIR / f"{name}.png"
    dest.parent.mkdir(parents=True, exist_ok=True)
    out.save(dest, format="PNG", optimize=True)
    print(f"wrote {dest.relative_to(ROOT)}")


def y2k_dance():
    bg, ink, accent = PALETTE["y2k-dance"]
    im, d = canvas(bg)
    spark(d, 412, 108, 28, accent)
    d.polygon(star_pts(186, 200, 5, 88, 36), fill=ink)
    # eighth note — head sits on the stem
    d.ellipse([T(214, 318), T(348, 412)], fill=ink)
    rr(d, 312, 148, 30, 214, 12, fill=ink)
    poly(d, [(342, 148), (438, 176), (430, 236), (342, 196)], fill=ink)
    finish(im, "y2k-dance")


def psychedelic_rock():
    bg, ink, accent = PALETTE["psychedelic-rock"]
    im, d = canvas(bg)
    spark(d, 92, 112, 26, accent)
    for r, sw in ((168, 22), (118, 22), (70, 22)):
        circle_ring(d, 228, 278, r, ink, sw, bg)
    ellipse(d, 228, 278, 28, 28, fill=ink)
    # neck
    rr(d, 212, 64, 32, 200, 12, fill=ink)
    ellipse(d, 228, 330, 96, 82, fill=ink)
    # fret dots
    for y in (88, 114, 140):
        rr(d, 218, y, 20, 12, 4, fill=bg)
    ellipse(d, 206, 324, 10, 10, fill=bg)
    ellipse(d, 250, 324, 10, 10, fill=bg)
    # bolt
    poly(d, [(378, 86), (430, 148), (404, 154), (450, 218), (390, 196), (416, 252), (340, 164), (368, 158), (324, 100)], fill=ink)
    finish(im, "psychedelic-rock")


def variety_mix():
    bg, ink, accent = PALETTE["variety-mix"]
    im, d = canvas(bg)
    spark(d, 412, 100, 26, ink)
    discs = [(168, 286, "#FF6B4A"), (256, 230, "#F5C542"), (344, 286, accent)]
    for cx, cy, fill in discs:
        ellipse(d, cx, cy, 96, 96, fill=fill)
    for cx, cy, _ in discs:
        ellipse(d, cx, cy, 28, 28, fill=bg)
        ellipse(d, cx, cy, 11, 11, fill=ink)
    finish(im, "variety-mix")


def local_pnw():
    bg, ink, accent = PALETTE["local-pnw"]
    im, d = canvas(bg)
    spark(d, 412, 96, 24, accent)
    # evergreens — side, not fused to the shaft
    poly(d, [(72, 430), (132, 250), (192, 430)], fill=accent)
    poly(d, [(320, 430), (380, 250), (440, 430)], fill=accent)
    poly(d, [(96, 430), (132, 310), (168, 430)], fill=ink)
    poly(d, [(344, 430), (380, 310), (416, 430)], fill=ink)
    # needle tower
    poly(d, [(176, 430), (336, 430), (292, 176), (220, 176)], fill=ink)
    rr(d, 236, 176, 40, 40, 4, fill=ink)
    ellipse(d, 256, 142, 70, 56, fill=ink)
    ellipse(d, 256, 142, 30, 24, fill=bg)
    ellipse(d, 256, 74, 16, 16, fill=ink)
    finish(im, "local-pnw")


def house():
    bg, ink, accent = PALETTE["house"]
    im, d = canvas(bg)
    coords = [(112, 112), (276, 112), (112, 276), (276, 276)]
    for i, (x, y) in enumerate(coords):
        if i == 3:
            rr(d, x, y, 124, 124, 28, fill=accent)
            ellipse(d, x + 62, y + 62, 30, 30, fill=bg)
        else:
            rr(d, x, y, 124, 124, 28, fill=ink)
            rr(d, x + 28, y + 28, 68, 68, 16, fill=bg)
    finish(im, "house")


def techno():
    bg, ink, accent = PALETTE["techno"]
    im, d = canvas(bg)
    pattern = [
        accent, None, ink,
        None, accent, None,
        ink, None, accent,
    ]
    i = 0
    for row in range(3):
        for col in range(3):
            x, y = 90 + col * 114, 90 + row * 114
            fill = pattern[i]
            i += 1
            if fill is None:
                rr(d, x, y, 96, 96, 22, fill=ink)
                rr(d, x + 22, y + 22, 52, 52, 12, fill=bg)
            else:
                rr(d, x, y, 96, 96, 22, fill=fill)
    finish(im, "techno")


def uk_garage():
    bg, ink, accent = PALETTE["uk-garage"]
    im, d = canvas(bg)
    spark(d, 404, 108, 26, accent)
    rr(d, 84, 168, 214, 128, 56, fill=ink)
    rr(d, 164, 248, 254, 122, 56, fill=ink)
    ellipse(d, 246, 156, 54, 54, fill=ink)
    rr(d, 226, 124, 40, 76, 20, fill=bg)
    rr(d, 238, 196, 16, 34, 5, fill=ink)
    finish(im, "uk-garage")


def dubstep():
    bg, ink, accent = PALETTE["dubstep"]
    im, d = canvas(bg)
    for i, y in enumerate((92, 208, 324)):
        rr(d, 116, y, 280, 96, 28, fill=ink)
        ellipse(d, 256, y + 48, 30, 30, fill=bg)
        ellipse(d, 256, y + 48, 12, 12, fill=accent if i == 1 else ink)
    finish(im, "dubstep")


def drum_and_bass():
    bg, ink, accent = PALETTE["drum-and-bass"]
    im, d = canvas(bg)
    spark(d, 96, 100, 26, accent)
    circle_ring(d, 256, 272, 150, ink, 36, bg)
    ellipse(d, 256, 272, 48, 48, fill=ink)
    poly(
        d,
        [
            (286, 78),
            (338, 78),
            (276, 230),
            (318, 230),
            (214, 448),
            (248, 268),
            (208, 268),
        ],
        ink,
    )
    finish(im, "drum-and-bass")


def shoegaze():
    bg, ink, accent = PALETTE["shoegaze"]
    im, d = canvas(bg)
    spark(d, 404, 104, 22, accent)
    ellipse(d, 256, 168, 156, 72, fill=ink)
    ellipse(d, 146, 188, 74, 56, fill=ink)
    ellipse(d, 366, 188, 74, 56, fill=ink)
    rr(d, 236, 218, 40, 50, 8, fill=ink)
    ellipse(d, 256, 340, 94, 110, fill=ink)
    ellipse(d, 256, 352, 28, 28, fill=bg)
    finish(im, "shoegaze")


def metal():
    bg, ink, accent = PALETTE["metal"]
    im, d = canvas(bg)
    spark(d, 412, 88, 24, accent)
    rr(d, 168, 70, 62, 220, 31, fill=ink)
    rr(d, 322, 70, 62, 220, 31, fill=ink)
    rr(d, 230, 176, 92, 96, 30, fill=ink)
    rr(d, 148, 244, 256, 200, 58, fill=ink)
    rr(d, 78, 262, 96, 62, 31, fill=ink)
    poly(d, [(64, 64), (128, 160), (98, 160), (152, 262), (78, 176), (110, 176)], fill=accent)
    finish(im, "metal")


def punk():
    bg, ink, accent = PALETTE["punk"]
    im, d = canvas(bg)
    spark(d, 84, 100, 24, accent)
    spikes = [(198, 62), (238, 40), (282, 32), (324, 46), (360, 74), (386, 110)]
    for x, y in spikes:
        poly(d, [(x, y), (x - 32, y + 130), (x + 32, y + 130)], fill=ink)
    ellipse(d, 268, 286, 122, 132, fill=ink)
    poly(d, [(214, 380), (248, 472), (318, 472), (308, 380)], fill=ink)
    ellipse(d, 214, 262, 18, 22, fill=bg)
    circle_ring(d, 138, 378, 44, accent, 16, bg)
    ellipse(d, 108, 354, 13, 13, fill=accent)
    ellipse(d, 168, 402, 13, 13, fill=accent)
    finish(im, "punk")


def country_folk():
    bg, ink, accent = PALETTE["country-folk"]
    im, d = canvas(bg)
    spark(d, 412, 96, 24, accent)
    ellipse(d, 248, 312, 140, 140, fill=ink)
    ellipse(d, 248, 312, 52, 52, fill=bg)
    ellipse(d, 248, 312, 22, 22, fill=ink)
    rr(d, 232, 70, 34, 168, 12, fill=ink)
    rr(d, 214, 54, 86, 40, 12, fill=ink)
    for y in (88, 110, 132):
        rr(d, 250, y, 14, 12, 3, fill=bg)
    finish(im, "country-folk")


def downtempo():
    bg, ink, accent = PALETTE["downtempo"]
    im, d = canvas(bg)
    spark(d, 412, 88, 24, accent)
    # headphone band (top arc)
    circle_ring(d, 256, 268, 176, ink, 30, bg)
    d.rectangle([T(70, 268), T(442, 460)], fill=bg)
    # crescent
    ellipse(d, 268, 286, 132, 132, fill=ink)
    ellipse(d, 318, 270, 102, 102, fill=bg)
    # cups
    rr(d, 78, 250, 84, 116, 42, fill=ink)
    rr(d, 350, 250, 84, 116, 42, fill=ink)
    finish(im, "downtempo")


def main():
    y2k_dance()
    psychedelic_rock()
    variety_mix()
    local_pnw()
    house()
    techno()
    uk_garage()
    dubstep()
    drum_and_bass()
    shoegaze()
    metal()
    punk()
    country_folk()
    downtempo()


if __name__ == "__main__":
    main()
