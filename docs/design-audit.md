# Design audit — www.neutralpolitics.in

Captured on production before the redesign, at 1440×1000, 1920×1080, and 390×844. Pages: home (EN and HI), article (EN and HI), sports category, search, fact-check, corrections, report-error, contribute, about, header, More menu, footer.

Screenshots: `/opt/cursor/artifacts/before/`.

## Problems

1. **Width.** `--max` is 1200px. At 1440 the side margins are already wide; at 1920 they dominate. The column never reaches the 1280–1320 range the masthead can support.
2. **Lead image field.** Desktop lead figures are a flex box capped at 32rem with a `#f4f4f4` mat and `width: auto`. Portrait posters sit inside a gray block instead of filling the column. The same gray mat is on cards, thumbs, and search results.
3. **Vertical rhythm.** Section gaps, the newsletter band, strips, and the closing homepage callout stack large empty bands between story groups. Card padding and the 18px body size make the home page feel sparse rather than packed.
4. **Homepage contributor banner.** “Got a video? Send it.” / “Anyone can be a journalist.” is a full-width box at the bottom of the home body. Header and footer already link to `/contribute`.
5. **Hit areas.** On lead, secondary, grid, latest, related, fact-check, and search, only the headline is a link. Images, dek, and timestamps do not open the story. Search thumbs are outside the anchor.
6. **Type and chrome.** Headlines are strong, but the scale is loose (lead up to 2.7rem, cards 1.15rem) and spacing is not a 4/8 system. Buttons and inputs are square, unrefined, and the red button’s focus ring is red on red. The More menu shadow is heavier than the rest of the page. No breadcrumbs; the article kicker is the only wayfinding.
7. **Mobile header.** The masthead logo, tagline, and a wrapping section list push the story down. Nav links are 44px, which is right, but the stack is tall. Top-bar links are small text without a guaranteed 44px target.
8. **Horizontal overflow.** `/contribute` scroll width was 1924px at a 1440 viewport and 630px at 390. Cause: file inputs use `.sr-only`, but `.form input { width: 100% }` overrides that, and with no positioned parent the control is 100% of the viewport starting mid-form.
9. **Hindi.** Devanagari correctly drops uppercase and tracking, and body line-height is 1.65. Card titles at 1.35 still feel tight for Devanagari, and Hindi pages inherit the same loose grid and gray image mats.
10. **Rails.** Latest and trending are text-only. Related stories are text-only. The article rail repeats the large contributor callout. Empty gray and the narrow measure on static pages (about, corrections, fact-check, report-error) leave unused space to the right of a 42rem column — that measure should stay; the home and category grids should not.

## Leave as-is

White page, ink text, `#B3121B` as the only accent, SF Pro / system stack, Noto Sans Devanagari, no serif, `object-fit: contain` (do not crop), EN/HI toggle, admin, report-error, contributor form, newsletter, canonical `www.neutralpolitics.in`, IST timestamps, corrections address.
