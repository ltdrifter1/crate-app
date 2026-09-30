# Broadcast Glass — chassis `broadcast-glass-20260930`

**Brief:** make the app feel like a modern, premium MP3 player with MTV vibes.

**Idea:** a premium player is *one flat surface with big art and big type*. MTV is carried by
**type and broadcast graphics**, not by more bezels. So: deeper black, flat soft-filled controls,
one bright thing per deck (the pearl play disc), and MTV's on-screen vocabulary — condensed caps,
a lower-third ID with a red rule, a hard-edged channel bug, a crawl.

## What changed

| Area | Before | Now |
|---|---|---|
| Canvas | slate `#1C222B` | deep cool charcoal `#12161C` (inside the audit's `#121417–#1A1D22` band) |
| Controls | bevel + gradient + inner shadow on every key/pill | flat `rgba(255,255,255,.06–.10)` fills, hairline border |
| Selected chip / tab | glowing ring | **solid pearl plate, dark ink** (`glassPill({ active })`) |
| Play | dark hardware key with a pip | **solid pearl disc**, dark glyph — the one bright control |
| Seek | recessed well, ticks, bar thumb | thin flat groove, round pearl thumb |
| Art | jewel-case bevel, 6px radius | hairline edge, 10–16px radius, soft float shadow; tinted glow when playing |
| Home / Immersive ID | boxed LCD panel | **lower-third**: 4px red rule, condensed-caps title, artist, mono meta |
| Channel bug | silver plate | white sticker plate + outlined slug (hard 2px corners) |
| Crawl | grey 13px text | condensed caps, red `■` separators |
| Dock | heavy chip per tab | flat tabs, selected = soft plate + 3px pearl tick |

The one hot colour is broadcast red (`mtv.hot`, = `color.alert`). It marks **live / now playing only**.
Album art still supplies all other hue.

## Tokens to tune (all in `src/theme.js`)

- `color.canvas` — the page black. One value (plus the boot HTML) if it should be lighter again.
- `color.ink` — pearl white, also the selected-chip fill and play-disc colour.
- `mtv.*` — red, sticker plate, caps tracking.
- `hardware.*`, `glassPill`, `chromeIconButton`, `glassStage`, `artShadow`, `artFrameStyle`, `radio.lcd*`.

## Fixed along the way (were already broken)

- **Barlow Condensed never rendered on a first visit.** `font-display: optional` skips a face that isn't
  ready at first paint and only Outfit was preloaded. Now preloaded (`public/index.html`).
- **Desktop mini-player was a light silver slab with light text** (`lib/dockTint.js`, light-steel leftover).
  Now a dark plate with a soft wash of the track colour.
- **Desktop Immersive sleeve overflowed the header/deck** at ≤800px tall. Square art is now also capped by viewport height.
- **Club member-number plate** was light text on a light plate.
- Phone Home: play was hidden behind the dock on load. "Up next" moved under the transport.

## Not covered / follow-ups

- Not redesigned: Charts board internals, Club/billing cards, Auth/Landing, Set Builder, station chat, Admin.
  They inherit the new tokens and were spot-checked on the dev previews (`#site-preview`, `#set-preview`), nothing more.
- ~150 translucent `rgba(58,66,80,…)` literals from the light-steel era remain (mostly shadows/scrims). Harmless on dark,
  but should become `SHADE` shadows in a cleanup pass. Opaque ones were repointed to the canvas.
- `_headers` sets no cache policy for `/fonts/*`. With `font-display: optional`, revalidating fonts can still skip on repeat visits.
- Unrelated and pre-existing: `HomeBroadcast.test.js` › "signed-in empty personal shelf offers Discover" is intermittent — it failed once in a full parallel run on the untouched baseline, and passes in isolation (a 40ms wait on a post-paint shelf). Worth de-flaking.
