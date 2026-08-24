# Claude Code Candidate — Independent Design Direction (FROZEN before studying existing UI)

> Formed from the written pillar, the source video premise, and rendered study of the four
> reference classrooms (motionsites.ai primary). The existing deployed app's visuals were NOT
> opened before this was written. From here, the repo is used only for data / ranking / room sync
> / persistence / tests — never for visual inspiration.

## The read
A family birthday experience for ranking 155 Walt Disney World attractions into a personal Top 33,
then merging everyone's rankings. It must feel *magical and worthy of a Disney birthday trip* —
image-rich, colorful, cinematic — while remaining clearly UNOFFICIAL (no Disney logos, characters,
wordmarks, or official layouts) and beautiful on phones and tablets.

## Techniques extracted from the references (reused, not copied)
- **motionsites.ai** — animated gradient/particle backgrounds; 3D/immersive tilt cards; liquid-glass
  panels; big editorial display type over depth; cinematic section transitions; curated gallery rhythm.
- **refero.design** — proven product patterns: clear list/detail, sticky rank rails, honest empty states.
- **styles.refero.design** — art-direction: confident type scale, restrained accent, strong image hierarchy.
- **aura.build** — premium gallery composition, generous rhythm, one focal object per beat.

## The original visual language (no Disney IP)
- **Three-circle "ear" motif** — an abstract mouse-ear glyph (one big + two small circles) used as
  the rank medallion, the loader, and the section marker. Original geometry, not a logo.
- **Character-inspired PALETTE families** (color language only, never characters): "Firework Night"
  (indigo→magenta→gold), "Enchanted Forest" (deep green→teal→gold), "Sunrise Kingdom" (coral→amber),
  "Deep Sea" (navy→cyan). One palette locked per app theme; the birthday theme = Firework Night.
- **Storybook / ticket / passport details** — ranked picks styled as collectible ride "tickets";
  the Top 33 as a passport being stamped; Family Results as a firework finale.
- **Cinematic but purposeful motion** — animated night-sky/firework background (canvas), tilt-on-hover
  ride cards, a Top-33 medallion that fills as you rank. All gated behind prefers-reduced-motion.

## The five surfaces and their moment
1. **Room join** — a "gates open" moment; test mode unmistakably marked (a persistent striped banner
   + watermark) so the real family room never looks like test mode.
2. **Discover (155 rides)** — image-rich card grid, park/area filters, search; each card a ride ticket.
3. **My Top 33** — a passport/medallion rail; every pick row shows thumbnail, name, park/area, and a
   large 44px+ "Watch this pick at [timestamp]" button opening the correct YouTube deep link safely.
4. **Family Results** — the firework finale: combined ranking, per-member contribution, celebration.
5. **Throughout** — keyboard + button ranking alternatives, honest unofficial notice, no clipped text.

## Non-negotiables carried from the pillar
- 155-item source order, ranking model, room sync, persistence, privacy — all preserved.
- Top 33 timestamp-link fix + automated coverage + mobile QA.
- Structural redesign, not a palette swap. Accessibility real, not decorative.
- Clearly unofficial. No implied affiliation.
