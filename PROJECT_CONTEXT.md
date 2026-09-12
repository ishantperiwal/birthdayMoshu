# Project Context and Architecture Handoff

This document is written for a new chat or a differently capable coding model. Read it completely before changing the project.

## 1. What this workspace contains

There are two related projects in this folder:

1. `src/index.html` is the **reference experience**, named **Hoshi-no-Tani — The Valley of Stars**. It is an approximately 6,100-line, highly engineered procedural Three.js scene exported from CodePen.
2. `birthday-island/` is the **new derivative experience**, named **Our Little Island**. It is a smaller walkable celebration island built for the user's long-distance girlfriend.

The reference is not disposable example code. It defines the expected visual quality, rendering philosophy, color language, density, softness, and atmosphere of the new island.

The original reference must remain untouched. Make changes inside `birthday-island/` unless the user explicitly asks otherwise.

## 2. User intent

The desired experience is a soothing private 3D place for a long-distance couple. It should contain:

- A small island that can be explored on foot.
- Daytime, sunset, and night environments.
- Dense, pleasant grass and a soft storybook atmosphere.
- Butterflies and other small signs of life.
- Hidden collectible gifts spread around the island.
- One gift that represents money/cash so she can choose something herself.
- An ocean-facing bench or quiet lookout for watching the sunset.
- A party area with a cake.
- Candles that can be blown out through an interaction.
- Fireworks triggered by a key or typed command.
- No player characters yet.
- An architecture that can later support third-person, Lego-like characters representing both partners.

The user explicitly rejected a generic low-poly reconstruction. Their strongest visual requirement is: **use the established style and technical ideas from the supplied reference code.**

## 3. Why the reference code is significant

The reference's appearance is not produced by a single shader or a few hex colors. It comes from several systems designed to work together:

- One centralized palette governs sky, haze, grass, water, terrain, stone, trees, buildings, light, and shadows.
- The sky uses a multi-stop painted wash with warm/cool azimuthal asymmetry, a broad sun halo, an oversized painted sun disc, and procedural cirrus.
- Grass is treated as the primary visual subject. Blades are tapered multi-segment Bézier forms, not stock rectangular planes.
- Grass density, blade width, height, tint, wind response, view-facing behavior, and distance transitions are coordinated.
- Wind is a spatial field rather than a global `sin(time)` animation.
- Terrain masks, meadow variation, and grass visibility are derived from shared data.
- Shadows change hue instead of becoming black.
- Distant objects are pushed through aerial perspective and painterly softening.
- A final film-print pass pushes shadows toward violet, highlights toward cream, lifts blacks, adds a gentle S-curve, paper tooth, vignette, and dithering.
- The original contains explicit performance architecture: instancing, LOD rings, shuffled instance prefixes, depth prepasses, render-target passes, alternating auxiliary passes, and auto-quality.

Therefore, matching the reference requires preserving the relationships between these systems. Copying only a green color or adding a bloom effect is not sufficient.

### Important reference sections

All of these are inside `src/index.html`:

| Approximate line | Section | Why it matters |
| --- | --- | --- |
| 175 | Configuration | World scale, camera, light, shadow, wind, and quality assumptions. |
| 259 | Palette | The canonical color language of the supplied artwork. |
| 307 | Math and noise | Seeded randomness, gradient noise, FBM, ridged noise, and billow noise. |
| 361 | GLSL library | Shared hashing, noise, lighting, fog, shadow, sky, and terrain functions. |
| 751 | Terrain | Height/data baking and procedural geometry. |
| 1351 | Sky and cumulus | Painted sky and procedurally assembled billboard clouds. |
| 1598 | Wind | Spatial wind field and gust behavior. |
| 1832 | Grass | Blade geometry, instance distribution, wind response, LOD, and painterly grass shading. |
| 2420 | River | Water geometry, flow, reflections, and glints. |
| 2622 | Trees | Procedural trunk, branch, and canopy construction. |
| 4272 | Film-print post pass | FXAA, watercolor softening, bloom composition, print curve, grain, vignette, and dither. |
| 4464 | Camera and gait | First-person motion and walking feel. |
| 4620 | Audio | Entirely synthesized ambient sound and music. |
| 4975 | Boot and main loop | Renderer construction, render targets, update order, and performance scheduling. |

Read the relevant original section before replacing or extending an equivalent island subsystem.

## 4. Current island file map

### `birthday-island/index.html`

The document shell and interface markup. It contains:

- Three.js import map, currently using Three.js 0.180.0 from jsDelivr.
- Fullscreen WebGL mount point.
- Welcome/loading screen.
- Gift counter.
- Day/sunset/night controls.
- Interaction prompt and reticle.
- Command input.
- Gift-note modal.
- All-gifts-collected finale.

It intentionally contains no inline scene implementation.

### `birthday-island/style.css`

The complete DOM interface presentation:

- Warm serif typography and restrained uppercase UI labels.
- Welcome veil.
- Glass HUD cards.
- Mood controls.
- Command palette.
- Gift-letter paper modal.
- Finale modal.
- Small-screen layout adjustments.

This file styles only the interface. The rendered world is controlled from `main.js`.

### `birthday-island/main.js`

The current scene implementation, approximately 1,000 lines. Major sections:

- `CONFIG`: personalization, movement values, starting mood, and all ten gift definitions.
- `P`: colors copied from the reference palette.
- Utility functions and seeded randomness.
- Renderer, scene, lights, sky, sun, stars, and fog.
- Procedural island terrain and ocean shader.
- Procedural trees, rocks, grass, flowers, butterflies, clouds, and fireflies.
- Ocean-view bench.
- Party area, string lights, cake, candles, and candle interaction.
- Collectible gifts and modal messages.
- Firework particle bursts.
- Synthesized audio.
- Player rig, pointer-lock controls, interaction resolution, and typed commands.
- Adapted film-print post-processing.
- Main animation loop and loading/entry sequence.

### `birthday-island/package.json`

Metadata, Three.js dependency declaration, and a minimal local-server command. The actual browser import currently comes from the import map in `index.html`.

### `birthday-island/README.md`

Short player controls and personalization notes.

## 5. Current runtime architecture

```text
index.html
  ├── DOM overlays and HUD
  ├── style.css
  └── main.js
       ├── CONFIG and shared palette
       ├── scene graph
       │    ├── sky, sun, stars and clouds
       │    ├── terrain and ocean
       │    ├── grass, trees, rocks and flowers
       │    ├── butterflies and fireflies
       │    ├── bench and party garden
       │    ├── gifts
       │    └── fireworks
       ├── playerRig
       │    └── cameraPivot
       │         └── camera
       ├── interaction registry
       ├── synthesized audio service
       ├── scene render target
       └── film-print fullscreen composite
```

### Frame flow

```text
input state
   ↓
move player and sample terrain height
   ↓
find nearest interaction
   ↓
interpolate mood and lighting
   ↓
animate grass, gifts, candles, butterflies, clouds and fireworks
   ↓
render world into a half-float render target
   ↓
apply film-print composite
   ↓
render final image to the browser
```

## 6. Systems already adapted from the reference

The first island implementation did not reuse enough of the supplied visual system and was rejected by the user. It was subsequently revised.

The current island now includes:

- The reference palette as `P`, copied from the original palette section.
- Tapered, four-segment instanced blade geometry adapted from `buildBladeGeometry`.
- Two grass layers instead of the earlier 5,200 rectangular planes: a far field
  at ~12 blades/m², plus a near-field mat at ~72 blades/m² whose tiles are culled
  by distance from the player. The near mat uses shorter, broader blades because
  its job is to close the floor, not to add silhouette, and each of its blades
  retires at its own distance (9-27 m, jittered per blade) — a shared fade
  threshold makes the whole mat vanish across one band, which reads as a ring on
  the ground centred on the player. Building both layers costs ~270 ms at load.
- The reference's blade model: a quadratic Bezier from root through a derived
  mid control point to a tip that already arches at rest and is then laid over
  by gravity and wind, with the whole curve rescaled back to the blade's own
  length. A longer blade therefore reaches outward instead of upward.
- Blades comb downwind, carry a rolled cross-section normal rather than a flat
  one, darken toward the sward floor, and flash where a gust lays them over.
- Tree sway adapted from the reference's `TREE_VS`: trunk lean plus a low
  resonant mode, per-clump secondary swing, and leaf flutter, all driven by the
  same gust field the grass uses. Trunks and canopy are separate instanced
  batches sharing one per-tree sway record, and both carry a matching
  `customDepthMaterial` so their shadows sway with them.
- Root-to-tip grass colors based on `gBase`, `gLow`, `gMid`, `gUpper`, `gTip`, and `gDry`.
- Distance-facing blades inspired by the reference's grass vertex shader.
- Per-blade scale, phase, color, and wind variation.
- The reference sky's four-stop vertical wash and warm/cool azimuthal asymmetry.
- A broad sun halo and painted sun disc based on the reference sky shader.
- An adapted film-print pass with violet shadow push, cream highlight push, lifted blacks, S-curve, saturation shaping, paper-like grain, vignette, and ordered dither.

These are adaptations, not complete transplants. The island does **not yet** contain the reference's full wind render target, grass LOD rings, cloud atlas, cloud-shadow pass, depth prepass, bloom pyramid, watercolor blur chain, or custom tree generator.

## 7. Player and future third-person design

The hierarchy is intentionally:

```text
playerRig → cameraPivot → camera
```

Movement and world position belong to `playerRig`. Vertical looking belongs to `cameraPivot`. The camera is only the view device.

For future third-person support:

1. Attach a character model or procedural Lego-like avatar to `playerRig`.
2. Move the camera backward and upward from the pivot.
3. Add camera collision and orbit limits.
4. Keep interaction distance measured from `playerRig`, not from the camera.
5. Do not rewrite terrain-following movement merely to introduce a visible avatar.

No character should be added until the user supplies or approves the intended appearance.

## 8. Interaction architecture

Interactive world objects are registered in the shared `interactive` array. Each item has:

- `type`
- `object`
- `reach`
- `prompt`
- `action`

Gifts additionally contain `found`, `data`, and their collection state. Every frame, the player code finds the closest eligible item within its reach and updates the `E` prompt.

Current special interactions:

- Gift: collect it and open its personal note.
- Cake: blow out the candles, play a descending chime, and trigger fireworks.
- Bench: switch to sunset and show a message.

Typed commands currently include:

- `/fireworks`
- `/day`
- `/sunset`
- `/night`
- `/gifts`
- `/blow`
- `/help`

## 9. Personalization

Personal content belongs near the beginning of `birthday-island/main.js` in `CONFIG`.

- `herName` and `fromName` are optional and currently blank.
- Ten gift positions, titles, icons, colors, and messages are in `CONFIG.gifts`.
- The cash present is represented by **A little envelope** and intentionally avoids hard-coding an amount.

Do not invent private names, relationship details, dates, or a cash amount. Ask the user or leave tasteful placeholders.

## 10. Current limitations and technical debt

- `main.js` is still monolithic. A major extension should split it into modules such as `world`, `moods`, `interactions`, `audio`, `player`, and `post`.
- The current grass shader is a smaller adaptation. It does not match the reference's multi-ring density or physically richer wind system.
- Clouds are simplified soft sprites rather than the reference's atlas-driven procedural cumulus.
- Trees are simplified smooth procedural clumps rather than the reference's branch-and-clump generator, though they now sway on the reference's wind model.
- The post pass has the print curve and a two-pass bloom but not the reference's
  watercolor-softening chain. Edge smoothing comes from 4x MSAA on the scene
  target instead (`samples: 4`) — the renderer's `antialias` flag does nothing
  when rendering into a target, which is worth remembering before reaching for a
  blur pass.
- The ocean reflects the sky through a shared `skyDome()` function, but it has no
  screen-space reflection of the island itself, so the shoreline is not mirrored.
- There is no saved progress. Reloading resets collected gifts and candle state.
- Props do not currently block player movement.
- Keyboard and mouse are supported; touch movement controls are not implemented.
- The page needs a network connection to obtain Three.js from jsDelivr unless the dependency is bundled locally.
- Firework scheduling uses short `setTimeout` calls; changing scenes or pausing does not currently cancel queued bursts.

## 11. Non-negotiable implementation guidance

1. Do not replace the existing visual systems with generic Three.js primitives and flat colors.
2. Do not treat the reference as a loose mood board. Inspect and reuse its actual algorithms, palette relationships, and shader ideas.
3. Preserve the original `src/` and `dist/` files.
4. Keep the island procedurally generated and asset-light unless the user explicitly approves external models, textures, recordings, or generated images.
5. Maintain the quiet, affectionate tone. Avoid turning it into a loud arcade collectible game.
6. Keep the world small enough to explore comfortably.
7. Hide gifts thoughtfully, but do not make completion frustrating.
8. Preserve the first-person rig's ability to evolve into third-person later.
9. Check the result visually in day, sunset, and night modes. A syntax check alone is insufficient for rendering work.
10. When improving visual fidelity, prioritize grass, sky, composition, lighting, ocean, and post-processing before adding more props.

## 12. Recommended next improvements

In priority order:

1. ~~Port the reference's fuller grass lighting and wind response.~~ Done. What is still missing is the reference's wind render target and meadow texture: the island's gust field is the analytic two-sine function shared by grass and trees, not a simulated one.
2. Port its procedural puff atlas and billboard cloud shading at a scale appropriate to the island.
3. Add the reference bloom and watercolor-softening render passes.
4. Replace simplified trees with an island-scaled version of the reference tree generator.
5. Improve shoreline foam and sun reflection using ideas from the reference river shader.
6. Add a subtle path network so gifts and celebration areas feel intentionally composed.
7. Add `localStorage` progress with a visible reset option.
8. Add touch controls only if mobile delivery is required.
9. Split `main.js` after the visual direction is stable, not during a major look-development pass.

## 13. Running and verifying

From the workspace root:

```bash
cd birthday-island
python3 -m http.server 4173
```

Then open:

```text
http://127.0.0.1:4173/
```

Basic source validation:

```bash
node --input-type=module --check < birthday-island/main.js
```

Use the module form. Plain `node --check main.js` parses the file as a script and
silently accepts at least one construct the browser rejects (a unary minus
directly before `**`), so it can pass on a file that will not load.

Inspection views (`?inspect`, plus
`&view=shore|garden|meadow|gift|bench|cake|hills|antisun`)
park the camera at a fixed spot and show a render-stats overlay. `?inspect` also
exposes `window.__step()`, which renders exactly one frame. Headless and
offscreen browsers never fire `requestAnimationFrame` and report
`document.hidden`, so without `__step()` the canvas stays black and the scene
cannot be captured there at all. Note that mood transitions and wind are driven
by real elapsed time, so stepping in a tight loop will not advance them — sleep
between steps when capturing sunset or night.

Manual acceptance pass:

- Enter the island and confirm pointer-lock movement.
- Walk in all directions and confirm the player stays on land.
- Inspect near and distant grass for obvious rectangular strips, gaps, or black blades.
- Switch repeatedly between day, sunset, and night.
- Confirm butterflies remain colored from both sides.
- Find and collect a gift; close its note and resume movement.
- Visit the bench and trigger sunset.
- Visit the cake and blow out the candles.
- Trigger fireworks with `F` and `/fireworks` while facing different directions.
- Verify the finale after all gifts are collected.
- Look up at the sky while facing AWAY from the sun (`view=antisun`). Sky shader
  math degenerates along the anti-sun meridian, and no other check looks there:
  a `pow()` whose base rounded a hair below zero put a vertical line of black
  NaN specks up the sky for months of headings without anything else noticing.
- Inspect the browser console and the onscreen `#error` overlay.

## 14. Definition of success

The experience is successful when it feels like a small, personal continuation of the supplied valley—not a separate generic low-poly demo—and when the romantic interactions feel integrated into the landscape rather than placed on top of it.
