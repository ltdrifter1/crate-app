#!/usr/bin/env python3
"""Legacy Game Icons compositor.

Channel Surfing now ships PS1-style 256px plates in public/channels/.
Keep this script only as the previous steel-plate recipe.
"""

from __future__ import annotations

import io
import urllib.request
from pathlib import Path

import cairosvg
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "src" / "assets" / "channels"
HERO_OUT = ROOT / "src" / "assets" / "editorial" / "hero-idle.png"
CACHE = ROOT / "scripts" / ".icon-cache"
OUT = 512
UA = "PlanetMP3/1.0 (channel art compositor; CC-BY-3.0 Game Icons)"

# Steel family only — slight cool/warm shift per lane, never neon.
PLATES = {
    "y2k-dance": ("#D8DCE4", "#B8BFC9", "#3A414C"),
    "psychedelic-rock": ("#D2D6DE", "#9AA3B0", "#2C333D"),
    "variety-mix": ("#E2E5EB", "#C5CAD3", "#3A414C"),
    "local-pnw": ("#D5DAD8", "#A8B2AE", "#2E3538"),
    "house": ("#DDDCE0", "#B4B6BE", "#3A3E48"),
    "techno": ("#D0D4DC", "#8B939F", "#1C2028"),
    "uk-garage": ("#E0E1E4", "#B7BBC4", "#32363E"),
    "dubstep": ("#CED2DA", "#7A8290", "#1C2028"),
    "drum-and-bass": ("#D6D9E0", "#9AA1AB", "#2A2E38"),
    "shoegaze": ("#DDDCE2", "#B0B4BE", "#3A3E48"),
    "metal": ("#C8CCD4", "#6B7380", "#16181E"),
    "punk": ("#D4D6DC", "#8B909A", "#1A1D24"),
    "country-folk": ("#DEDCD8", "#B4AFA8", "#3A3834"),
    "downtempo": ("#D8DCE6", "#A8B0BE", "#2A3040"),
}

# Primary (+ optional secondary) Game Icons names.
SLOTS = {
    "y2k-dance": ("musical-notes", "sparkles"),
    "psychedelic-rock": ("guitar", "lightning-helix"),
    "variety-mix": ("compact-disc", "boombox"),
    "local-pnw": ("pine-tree", "radio-tower"),
    "house": ("house", None),
    "techno": ("cpu", "microchip"),
    "uk-garage": ("microphone", None),
    "dubstep": ("speaker", None),
    "drum-and-bass": ("drum-kit", None),
    "shoegaze": ("cloudy-fork", "guitar"),
    "metal": ("bull-horns", "skull-bolt"),
    "punk": ("safety-pin", "anarchy"),
    "country-folk": ("guitar", None),
    "downtempo": ("headphones", "moon"),
}


def fetch_icon(name: str, px: int, color: str) -> Image.Image:
    CACHE.mkdir(parents=True, exist_ok=True)
    hexcolor = color.lstrip("#")
    cache = CACHE / f"{name}-{px}-{hexcolor}.png"
    if not cache.exists():
        url = (
            f"https://api.iconify.design/game-icons/{name}.svg"
            f"?color=%23{hexcolor}&height={px}"
        )
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=30) as resp:
            svg = resp.read()
        if len(svg) < 40:
            raise RuntimeError(f"icon fetch failed: {name} ({len(svg)} bytes)")
        png = cairosvg.svg2png(bytestring=svg, output_width=px, output_height=px)
        cache.write_bytes(png)
    return Image.open(cache).convert("RGBA")


def brushed_plate(light: str, mid: str) -> Image.Image:
    im = Image.new("RGB", (OUT, OUT), mid)
    px = im.load()
    # Horizontal grain — aluminum extrusion, not a photo.
    for y in range(OUT):
        t = y / (OUT - 1)
        # slight banding
        band = 8 if (y // 3) % 2 == 0 else 0
        r0, g0, b0 = tuple(int(light[i : i + 2], 16) for i in (1, 3, 5))
        r1, g1, b1 = tuple(int(mid[i : i + 2], 16) for i in (1, 3, 5))
        r = int(r0 * (1 - t) + r1 * t) + band
        g = int(g0 * (1 - t) + g1 * t) + band
        b = int(b0 * (1 - t) + b1 * t) + band
        for x in range(OUT):
            n = ((x * 17 + y * 13) % 9) - 4
            px[x, y] = (
                max(0, min(255, r + n)),
                max(0, min(255, g + n)),
                max(0, min(255, b + n)),
            )
    # Specular wash top-left.
    overlay = Image.new("RGB", (OUT, OUT), (255, 255, 255))
    mask = Image.new("L", (OUT, OUT), 0)
    md = ImageDraw.Draw(mask)
    md.ellipse((-int(OUT * 0.2), -int(OUT * 0.35), int(OUT * 0.85), int(OUT * 0.55)), fill=48)
    mask = mask.filter(ImageFilter.GaussianBlur(48))
    im = Image.composite(overlay, im, mask)
    # Hairline frame.
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, OUT - 1, OUT - 1), outline=(255, 255, 255))
    d.rectangle((1, 1, OUT - 2, OUT - 2), outline=(160, 166, 176))
    return im.convert("RGBA")


def paste_center(base: Image.Image, icon: Image.Image, scale: float, dy: int = 0):
    w = int(OUT * scale)
    icon = icon.resize((w, w), Image.Resampling.LANCZOS)
    x = (OUT - w) // 2
    y = (OUT - w) // 2 + dy
    base.alpha_composite(icon, (x, y))


def compose(slot: str) -> Image.Image:
    light, mid, ink = PLATES[slot]
    primary, secondary = SLOTS[slot]
    plate = brushed_plate(light, mid)
    if secondary:
        a = fetch_icon(primary, 420, ink)
        b = fetch_icon(secondary, 220, ink)
        paste_center(plate, a, 0.58, dy=18)
        # secondary as a steel “bug” top-right, like a CH ident.
        bw = int(OUT * 0.28)
        b = b.resize((bw, bw), Image.Resampling.LANCZOS)
        plate.alpha_composite(b, (OUT - bw - 36, 32))
    else:
        paste_center(plate, fetch_icon(primary, 480, ink), 0.62)
    return plate.convert("RGB")


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    HERO_OUT.parent.mkdir(parents=True, exist_ok=True)
    for slot in SLOTS:
        im = compose(slot)
        path = OUT_DIR / f"{slot}.png"
        im.save(path, "PNG", optimize=True)
        print(f"wrote {path.relative_to(ROOT)} {path.stat().st_size}")
    # Idle hero — cassette drawing on a larger steel plate.
    hero = brushed_plate("#E8EAEE", "#C5CAD3")
    cass = fetch_icon("audio-cassette", 520, "#2C333D")
    paste_center(hero, cass, 0.7)
    hero.convert("RGB").save(HERO_OUT, "PNG", optimize=True)
    print(f"wrote {HERO_OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
