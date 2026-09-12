# 04 — Implementation Examples

Slides 18–22 of the deck. Five mock slides/pages, one per Bioculture, each shown as a 16:9 layout with a small pattern-and-palette swatch at bottom-left and thin annotation lines pointing to each component. Only slide 22 (Toad) carries the annotation labels, which apply to all five.

Slide 22 title: **Using textile-inspired patterns and color systems**

---

## Annotated components (from slide 22)

| Label | What it points to | Rule it implies |
|---|---|---|
| **TEXTILE-INSPIRED PATTERN** — "Horizontal blend from common thread to Toad pattern" | The left panel background | The content panel sits on the Bioculture pattern, blended from the common thread. |
| **HIGHLIGHTS** | The narrow vertical bar between panel and photo | The five highlight colors, stacked, act as a spine/accent stripe. |
| **TERRITORY AND MEDICINE IMAGES** | The large photo and the inset landscape | Photos of the medicine and its territory, full color. |
| **MEDIUM COLORS FOR GRAPHIC** | Cards, stat numbers, quote block | Mid-tone colors are used for graphic elements and data callouts. |

Recurring structure across all five examples:

```
┌─────────────────────────────────────────────────────────────┐
│ [mark + stacked wordmark, white]                            │
│                                                             │
│  Bioculture name (light serif, large, white)      ▌  PHOTO │
│  Body copy (sans, small, white/light grey)        ▌  (hero │
│                                                   ▌  image)│
│  [graphic row: numbered cards / stat / quote / inset photo] │
└─────────────────────────────────────────────────────────────┘
   ▌ = highlight stripe (5 stacked colors or a 2–3 color subset)
```

- Left ~55%: content panel on the blended Bioculture pattern.
- Right ~45%: full-bleed hero photo, either a medicine close-up, a territory, or a portrait.
- The highlight stripe sits at the seam between panel and photo.
- Body text is placeholder ("Lorem ipsum") in all five examples; only the Bioculture names are real.

---

## Example by example

### Slide 18 — Ayahuasca
- **Pattern:** angular maze motif, dark green.
- **Stripe:** yellow `#edcc24` over lime `#85c418`, a partial bar spanning the upper half only.
- **Hero photo:** scarlet macaw in flight against rainforest green (right two-thirds of the slide).
- **Graphic row:** three numbered cards (1, 2, 3) in a mid-tone blue (`#31679e`), white numerals, short body text in each. Cards overlap the bottom edge of the panel and photo.
- **Swatch at bottom-left:** 5×3 palette (highlights, mid, dark) plus a pattern tile.
- **Reusable pattern:** *numbered process/steps row.*

### Slide 19 — Iboga
- **Pattern:** horizontal beaded bands, near-black with orange-red lines.
- **Stripe:** short green bar (`#65a11d` over `#6a7d46`) near the top of the seam.
- **Hero photo:** hands scraping iboga root bark on a wooden board (top right).
- **Graphic row:** a large statistic card in burnt orange `#993300` ("89%" with two lines of label), a square photo of bundled root bark, and a wide aerial rainforest photo.
- **Reusable pattern:** *big-number stat card + photo grid.*

### Slide 20 — Mushrooms
- **Pattern:** mycelium/circuit lines, dark blue-green.
- **Stripe:** magenta `#b7205a` over red `#a71822`, partial bar.
- **Hero photo:** three brown-capped mushrooms among clover (right half).
- **Graphic row (stacked at top-centre):** a waterfall/forest photo above a green quote card (`#437820`) containing a quotation and attribution ("Varius Accumsan" placeholder).
- **Reusable pattern:** *pull-quote card with attribution, paired with a supporting photo.*

### Slide 21 — Peyote
- **Pattern:** diamond lattice, dark olive.
- **Stripe:** turquoise `#32a5a5` in two segments, a darker teal `#136367` between.
- **Hero photo:** portrait of an elder woman with grey hair, beaded star earrings and a pink/blue woven garment (right half).
- **Graphic:** the quotation sits directly on the pattern panel (no card), in white sans, above the Bioculture name.
- **Reusable pattern:** *portrait-led testimonial.*

### Slide 22 — Toad
- **Pattern:** ogee/scale motif, deep navy.
- **Stripe:** lavender `#bbaccc`, periwinkle `#8793dd` and blue `#6e92c5` segments.
- **Hero photo:** Sonoran desert toad on gravel (right half).
- **Graphic row:** a portrait-format photo of a saguaro-lined desert wash next to a large statistic in green (`#7d9e4c`, "1.27M") with descriptive text below.
- **Reusable pattern:** *territory photo + statistic.*

---

## Component inventory for the redesign

Derived from the five examples. These are the building blocks the deck expects any new IMC Fund page or slide to be assembled from.

| Component | Where it appears | Colors |
|---|---|---|
| Blended pattern panel | All five | Bioculture dark base + pattern |
| Highlight spine (vertical stripe) | All five | 2–5 highlight colors, stacked |
| Hero photograph | All five | Full color, unedited |
| Bioculture title | All five | White, light serif, ~48–64px equivalent |
| Body copy | All five | White/light grey, sans, ~12–14px equivalent |
| Numbered step cards | Ayahuasca | Mid-tone fill, white numeral |
| Big-number stat card | Iboga | Mid-tone fill (burnt orange), white text |
| Big-number stat, no card | Toad | Highlight-green text on pattern |
| Quote card | Mushrooms | Mid-tone green fill, white text |
| Quote on pattern | Peyote | White text, no fill |
| Inset photo (square or portrait) | Iboga, Mushrooms, Toad | Full color |
| Palette + pattern swatch | All five (as a legend) | The Bioculture's 15 swatches |

## Typography as observed

- **Bioculture names:** light-weight serif with high contrast and slightly calligraphic terminals (Cormorant Garamond or similar).
- **Body, labels, stats:** geometric sans with a slightly condensed feel (Barlow or similar). Large numerals in the same family, bold.
- **Wordmark:** wide-tracked uppercase geometric sans.
- **Section titles on system slides:** medium-weight sans, white.
- **Discovery slides:** Open Sans-like humanist sans in black on white (inherited from Phase 1).
