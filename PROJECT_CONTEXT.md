# Project Context and Architecture Handoff

Last updated: 13 September 2026.

This is the current architecture and design handoff. For simple launch instructions, see [RUN_BIRTHDAY.md](RUN_BIRTHDAY.md).

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
- Ten money gifts with three reward tiers, plus a separate legendary reserve.
- An ocean-facing bench or quiet lookout for watching the sunset.
- A party area with a cake.
- Candles that can be blown out through an interaction.
- Fireworks triggered by a key or typed command.
- A first-person player with a retained female Lego avatar for third-person viewing.
- A male Lego companion who waits at the cake, celebrates, and follows the player.

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

## 4. Running the current project

See [RUN_BIRTHDAY.md](RUN_BIRTHDAY.md). Serve `birthday-island/` over HTTP:

```bash
cd /Users/ishant.p/Downloads/claude-opus-5-ghibli/birthday-island
python3 -m http.server 4173
```

Open http://127.0.0.1:4173/ in Chrome. No build or npm install is required for this
workflow. Three.js 0.180.0 is loaded through the import map from jsDelivr, so the
browser needs internet access. Keep the server terminal open. Do not open the
HTML through `file://`.

## 5. Current defaults and visual direction

- First person is the default (`CONFIG.thirdPerson = false`); the avatar is retained.
- Night is the starting mood. Day and sunset remain available with keys 1/2/3.
- Keep the soft anime/watercolor direction: readable grass, gentle edges, rich
  colors, restrained bloom, atmospheric depth, and quiet decoration.
- Avoid overcrowding. Balloons, pots, cushions, excessive lamps, and ribbon knots
  were rejected. Ribbon bands on the gifts were restored intentionally.
- Celebration flooring is a slightly raised circular wooden stage, not a carpet.
- The user repeatedly rejected elaborate procedural hair experiments. Preserve
  the existing female hair asset and keep the male hairstyle simple.
- The source palette and rendering relationships remain the reference, but the
  new island has its own deliberately darker night and bluer daytime ocean.

## 6. File and subsystem map

All paths below are relative to `birthday-island/`.

| File | Responsibility |
| --- | --- |
| `index.html`, `style.css` | Entry screen, HUD, mood buttons, commands, gift/finale modals |
| `main.js` | Configuration, terrain, ocean shader, lights, grass, player movement, interaction registry, mood interpolation, postprocessing, orchestration |
| `reference-trees.js`, `reference-noise.js` | Reference-derived tree geometry and noise utilities |
| `painted-sky.js`, `aurora.js`, `shooting-stars.js` | Stars, flat painted clouds, compact aurora opposite the moon, sparse shooting stars |
| `celebration.js`, `celebration-stage.js` | Celebration ground treatment and circular wooden platform; shared stage dimensions |
| `birthday-centrepiece.js`, `cake-details.js` | Cake mesh assembly, two transferable party hats, wooden birthday board, table texture/material |
| `candle-smoke.js`, `fireworks.js` | Candle smoke and rocket/burst effects; bursts notify companion attention |
| `character.js` | Shared Lego body, printed face, rounded head, head pivot, hair, hats and limb animation |
| `companion.js`, `hand-pose.js` | Greeting wave, hand holding, celebration hops, following, cake avoidance, head attention and gift gestures |
| `money-gifts.js`, `gift-finish.js`, `gift-aura.js` | Reward tiers, labels/seals, polished wrapping, soft glowing rings |
| `meadow-life.js`, `dandelions.js` | Meadow plants and reusable drifting/regrowing dandelion seeds |
| `fireside.js` | Fireplace, more defined stones, two benches and radio |
| `ocean-life.js`, `cruise-route.js`, `ship-steam.js` | Buoys, departing cruise ship, safe offscreen reset and pooled billowy steam |
| `distant-island.js` | Three static distant islands, blue-green pigment and extra horizon haze |
| `assets/`, `modeling/` | Editable Blender sources, model-building scripts and exported meshes |
| `README.md` | Controls and feature notes |

The scene is primarily procedural, but is **not asset-free**: the cake and female
hair have Blender sources and exported JavaScript mesh data. The cake also has a
GLB export. Runtime cake geometry comes from `assets/birthday-cake.js`.

## 7. Rendering and environment

- Terrain and grass share path/meadow masks. Paths have soft entry falloff and
  very sparse pebbles near their edges; avoid repopulating the paved center.
- Grass uses instanced tapered curved blades, near/far distribution, wind and
  distance-dependent painterly softening. Preserve definition without noisy
  distant strand highlights.
- Tree meshes and shadow geometry share wind animation.
- Ground shadows use filtered depth comparisons; the directional shadow map is
  up to 4096 pixels and updates at approximately 15 Hz. Preserve bias settings
  that avoid acne and repeated bands.
- The film-print pass includes bloom, hue-aware compression, an S-curve,
  watercolor treatment for meadow pixels, subtle grain and uncorrelated dither.
- Ocean normals are filtered by screen footprint and distance. Warped ripple
  phases reduce straight bands. Regular diagonal screen dithering was removed
  after a report of faint blinds-like striping. Daytime body colors are bluer
  with less warm reflection/haze wash. Water keeps animated swells and glints.
- Clouds are inexpensive flat painted cards with soft profiles and slow drift,
  not volumetric clouds. The aurora is compact and restrained, opposite the moon.
- Offshore scenery includes three buoys, a cruise ship, and three low distant islands: the original
  on the moon bearing and two smaller neighbours farther offshore on widely separated east-northeast and
  south-southwest bearings, outside the celebration view. The ship travels sideways while receding, without a visible
  opacity fade. It resets only after both its old and start bounds have stayed
  out of view for five seconds, after at least 150 seconds of travel.
- Ship steam uses 16 reusable puffs with four baked profiles, expansion, cooling
  buoyancy and wind drift. No volumetric pass or extra lights.
- The distant island has blue-green colors, low emissive fill and additional
  sky-horizon haze to avoid a dark, attention-grabbing nighttime silhouette.

## 8. Celebration and characters

The celebration is centered at world `(-8, -10)`. The circular stage has radius
3.02 and height 0.12; player and companion ground height both account for it.
The table has radius 1.30. The cake has sculpted icing, strawberries and candles.
The wooden “Happy Birthday, Moshiee!” board sits at the grassy entry edge, facing
the approach. Keep hanging bulb halos and the central artificial light wash
restrained. Cushions were removed.

Player hierarchy remains `playerRig → cameraPivot → camera`; the female avatar
is attached to the rig and hidden in first person. `?inspect&thirdPerson` enables
a temporary third-person inspection without changing the normal default.

The male companion:

- Waves when approached within 14 metres; walking beyond 18 metres rearms it.
- Offers E to hold hands nearby (H also works, including when another interaction
  takes priority). H or E on the companion releases. While holding, he eases into
  closer following at roughly 1.65 metres, matching player pace without following
  camera yaw. Joined hands rest at his waist, with an elongated player forearm in
  first person and an arm pose in third person.
  Release restores following. Candle celebration releases hands automatically.

- Starts beside the cake at approximately `(-5.9, -10.1)`.
- Uses a teal top, navy trousers, light shoes and simple short brown hair.
- Has root scale 1.06, increased from 0.78 for first-person proportions.
- Does two happy hops after candles are blown, then follows with eased movement.
- Maintains roughly 3.1–3.35 metres of following space, stays on island terrain,
  and routes around the cake table. There is no general obstacle/navigation mesh.
- Usually looks at the player, occasionally glances around, and alternates looks
  between a nearby uncollected gift and the player, with brief pointing gestures.
- Looks toward actual firework burst positions, temporarily overriding gift attention.

The shared character head has rounded upper/lower rims and a pivot that moves the
face, hair and worn hat together. Pressing E near either table hat equips both:
teal for the male and rose for the player. The hats leave the table. The player
hat inherits avatar visibility and remains visible in third person.

Blowing candles is one-shot per session. Candle lights stay in the scene while
fading to zero to avoid shader recompilation; flames hide and smoke appears.
Preserve this behavior when extending candle reactions.

## 9. Gifts and interactions

Ten regular gifts total **₹20,000**:

- Two small gifts × ₹500.
- Six medium gifts × ₹1,500.
- Two large gifts × ₹5,000.

A separate **₹4,000 legendary reserve** contains two unplaced ₹2,000 gifts. They
are not spawned or included in the collection count until the user chooses
hiding places. Amounts are promises displayed in the scene, not payment processing.

Gifts have distinct sizes and jade/sapphire/berry wrapping, crossed ribbon bands,
amount plaques, coin seals, polished beveled boxes and a gently pulsing warm ring.
They also contribute restrained local light. Collection removes the gift and its
light, updates the count/rupee total, and opens the personal note.

Interactive objects register `type`, `object`, `reach`, `prompt`, and `action` in
`interactive`. The nearest eligible item within reach wins. Collected/equipped
items use `found` to leave selection. Hat selection can take precedence over the
cake when close to a hat; after equipping, the candle prompt returns.

Other interactions include the sunset bench, fireplace radio, and dandelions.
Dandelions release seeds by proximity, E, or occasional breeze; they regrow after
about 21 seconds. Keep plant/insect distribution scattered and restrained.

## 10. Personalization and limitations

- Personal gift titles, notes, positions and general configuration live in
  `main.js` under `CONFIG`; tier values live in `money-gifts.js`.
- The birthday board text lives in `birthday-centrepiece.js`.
- Radio music can be supplied later through `CONFIG.radioMusicUrl`.
- Reloading resets gifts, candles, hats and companion state. There is no saved
  progress, backend or real money transfer.
- Desktop keyboard/mouse controls are supported; touch movement is not implemented.
- Props generally do not block player movement. Companion avoidance handles the
  cake table, not all rocks, trees, benches or structures.
- Ocean reflects the procedural sky, not island geometry via screen-space reflection.
- Three.js requires CDN access unless it is bundled locally in future.
- No Blender installation or model rebuild is required simply to run the project.

## 11. Verification and working guidance

Preserve the reference `src/` and `dist/`. Edit the island and its documentation
within the user's requested scope. Avoid replacing its visual systems with
unrelated stock low-poly geometry. Keep new scenery cheap and quiet.

Syntax-check changed JavaScript as ES modules:

```bash
node --input-type=module --check < birthday-island/main.js
```

Check changed imported modules too. For graphics, visually inspect day, sunset
and night, inspect the console, and use the scene's stats overlay. Past previews
held around 60 fps at 1280×720; this is an observation, not a hardware guarantee.

Useful inspection URLs append `?inspect&view=...`:

- `companion`: rounded head, idle attention and nearby candle interaction.
- `hats`: table hat interaction; add `&thirdPerson` to inspect both worn hats.
- `cake`, `celebration`, `shadows`: centerpiece, flooring and ground shadows.
- `money`: the small ₹500 gift near the entrance.
- `moonisland`, `boat`, `aurora`, `zenith`: distant scenery and sky.
- `meadow`, `flowers`, `dandelions`, `path`, `pathstart`, `fireside`, `bench`.

For interaction changes, check that hats transfer once, candle celebration stays
smooth, following distance is preserved, found gifts stop attracting attention,
and fireworks override the companion gaze. Do not rely on syntax checks alone.
Several imports and the main script use cache-busting query versions; update
those when needed so browser previews actually load changed code.

## 12. Definition of success

A quiet, affectionate, personal island with the visual language of the reference:
rich but soft, readable without clutter, with restrained interactions and a
companion who feels present without crowding the camera.

Held hands use full circular toy-hand rings interlocking at right angles along the straight arm axis. The player’s
extra reach is carried by the sleeve, with only a short exposed wrist; the sleeves
carry the reach without elongated bare skin. Normal unheld hands retain their original open shape.

Character torsos, waist blocks, trousers and shoes have small smooth fillets
from `rounded-toy-box.js`, preserving centered symmetry and soft edge highlights.
The male companion has shorter dark navy shoes (.10 high) and longer trousers
(.55 high), keeping his feet and overall height unchanged.

Sleeve rims use `rounded-sleeve.js` on both characters and the first-person
held arm. The companion’s held sleeve retains approximately its normal .35
length, with a short wrist and the existing perpendicular chain-link clasp.

The male held sleeve is fixed at .38 through the entire holding/release
transition. Hand movement follows a constant-radius arc rather than a linear
path that shortens the arm before the normal pose returns.

Insect distance thinning (`insect-density.js`) preserves full firefly density
within 10 metres and butterfly density within 12 metres of the camera. Stable
per-insect ranks fade most out by 40/46 metres respectively, leaving roughly
15–20% visible in the distance. Firefly ground pools follow the same fade.
Nearby populations and flight paths are unchanged; selection never rerolls.

The male companion now tries the supplied `assets/hairCheck.glb` hairstyle in
soft black. `modeling/import-hair-check.py` extracts its single 3,306-triangle
mesh into `assets/male-hair.js`; the original GLB is preserved. Character code
turns the +X face opening forward, fits it to the head, and attaches it to the
existing head pivot. Female hair is unchanged.

Firefly sprite size additionally tapers from full size within 8 metres to 35%
at 36 metres, on top of perspective attenuation and distance density thinning.

The fireplace clearing now has a 3.1-metre bare center feathering into grass
by 4.5 metres, with benches set slightly farther out. The three added lamps are now spread into
unlit north, east and southwest meadow areas at (-3,-33), (39,3), and (-12,27). Its existing warm light and
painted ground fill are stronger and wider; six reused low-opacity smoke
sprites drift gently above the fire without additional shadow lights.

The male companion has returned to short hair, now a single smooth molded
mesh from `short-hair.js`: swept crown, shallow side part, rounded hairline
and fitted nape in a near-black brown. The supplied long-hair GLB and extracted
module remain preserved as unused alternatives. Female hair is unchanged.

Grass has broad, irregular moss and cooler sage-green washes shared between
blades and underlying terrain, with smooth boundaries and no extra per-blade
noise. The path and bare celebration/fireplace surfaces keep their own colors.

Moss/sage grass accents are now anchored to actual `flowerSpots` using one
baked 512px tint map. Each flower has a softly feathered 1.7–2.15m patch;
overlapping flowers blend into larger washes. Empty meadow has no added tint.

### Meadow wind and quieter insects (13 September)
- `CONFIG.flowerGrassTints = false` disables the flower-linked moss/sage tint non-destructively. Its baked field and palette remain available by setting this back to true.
- Grass now uses a shared analytic travelling gust for blade bending and a matching soft meadow highlight, following the reference's near/far treatment. Warped fronts move at roughly 3.7 m/s; nighttime highlights are restrained. No additional draw calls or simulation textures.
- Butterfly scales are now .16–.31 (previously .26–.40), with stable random size variation. Firefly point size is .16 (previously .20). Existing distance thinning and distant sprite shrinking remain enabled.

### Love-letter flypast
`love-plane.js` adds a small red-and-cream propeller plane towing an “I love you” cloth banner over the northern sea. It travels broadside at 49 m altitude, z=-155, on a 220-second loop, resetting beyond the camera far plane. The first pass is near the celebration view. A low-resolution segmented banner ripples through vertex updates; no shadows, lights or particle systems are added. Inspect with `?inspect&view=plane`.

Mushroom caps now alternate rose, lavender, honey-gold and seafoam, with cream stems/flecks and slightly satin roughness (.66). Their 36 placements and alternating sizes remain unchanged; four instanced color species replace two brown species.

### Trail arrival and crest
Default arrival starts at z=27 with x from `celebrationPathX`, just before the grassy entrance finishes fading into the clear trail at z=25, facing along its first bend. Explicit inspector views still override spawn. The experimental crest lift was reverted at the user’s request; terrain heights use the original profile.

### Bench ground contact
The ocean bench now has both rear legs beneath its back posts. All four feet extend individually to the sampled terrain (with 2.5 cm overlap); the jar and its flowers also follow their own ground height. Reduced directional normal bias from .02 to .008 and custom ground shadow comparison offset from .00020 to .00006 to tighten contact shadows. Verified the bench preview without rendering errors.

### Rock collision
All 34 scenery boulders now register horizontal circular hitboxes measured from their transformed vertices. Player movement uses `rock-collision.js` with a .24 m body radius, 10 cm movement substeps and boundary projection for sliding. No physics engine or per-frame mesh intersection tests. Small path pebbles remain walkable. Applies to player movement in either camera mode; companion navigation is unchanged.

### Stone skipping
`stone-skipping.js` places a pebble bowl and small sign at (50,17) on the eastern shore with a soft cleared patch. E starts, hold/release Space charges/throws, Q or Escape leaves; walking beyond 6 m exits too. Each player throw is followed by an automated opponent throw. Session-only best distances and skip counts appear in a compact HUD. Reused pebble/ripple meshes animate a shore-to-water arc and diminishing skips; no physics engine. The opponent currently has an automated turn, without a dedicated companion throwing animation or multiplayer networking. Inspect via `?inspect&view=skipping`. Browser-checked a complete player/opponent round with scores and no console errors.

### Stone-skipping shore polish
- The shore clearing is now a softly edged ellipse (~8 × 9 m); lanterns at (48,12.6) and (51,21.2) share the island's existing warm fixture, glow and grass illumination system.
- Polished ivory, sea-glass, pale blue and peach pebbles sit in a rimmed wooden tray beside a framed sign.
- The dedicated shore card uses a continuously oscillating power meter while Space is held. Shared pure math in `skipping-physics.js` drives the guide dots, flight, impact locations and distance estimate. Scores now measure total horizontal distance from the shore, including the initial arc.
- A projected distance label follows the airborne pebble. Every water contact (including initial touch and final settle) produces a ripple; rings conform to the ocean's three swell functions so they do not disappear under waves. Early contacts emit a small pooled splash of droplets. All crossed impact times are processed, even in a long frame.
- UI is built once and updated in place. Guide dots are instanced; rings and droplets are reused. Tested power cycling, complete impact sequences at long timesteps, exact flight/guide contacts and a full browser round without console errors. `view=skippingshore` previews the decorations; `view=skipping` previews play.

### Pick-up-and-throw revision
The skipping terrace is flattened to 1.55 m with a smooth elliptical blend into the existing coast; the board, bowl and both lantern bases are on its level core, above the ocean swell. E now requires looking at the nearby bowl and equips one visible pebble in a simple first-person Lego hand. No automatic re-equip: pick up another after the opponent's turn. The compact timing meter appears only while Space is held; a broad pale band around 70% rewards clean skips. Maximum power is deliberately worse than a well-timed release. The guide is now only 12 short direction dots from the POV; actual throws launch from the held pebble and follow the camera's horizontal aim over the eastern water. Looking toward land or sharply down prevents release. Tested skill curve, custom launch origins, bounce locations, pickup HUD and held mesh without browser errors.

### Free-aim pebble physics
Replaced the authored skipping path with gravity-driven velocity integration (substeps ≤8 ms). The full camera direction, including pitch, determines the throw. Vertical tosses return nearby, shallow fast water contacts can skip with energy loss, steep water contacts sink, and land contacts settle without water ripples. The short guide samples the same initial ballistic velocity. Timing quality affects retained skip energy; maximum force still throws faster but does not guarantee the best skip result. The held hand now uses the normal character's exact open C-tip dimensions and opening rotation, with a smaller pebble nestled inside. Tested up/side/shallow/down throws and a browser ground toss, with no console errors.

The thrown pebble now has a restrained pale trail: one pooled 18-vertex line showing its last 0.20 seconds, fading after landing and resetting per throw. Browser-tested player/opponent throws without shader errors. The skipping shore keeps only the seaward lantern at (51,21.2); the other added lamp at (48,12.6) was removed from the shared fixture/lighting list.

### Visible throws and present-only companion turns
First-person pickup shows only the pebble (hand/sleeve hidden). Releasing plays a 0.24 s pebble motion, then launches the world projectile from its release position with the captured aiming direction. His turn is scheduled only when he is within 6 m of the player and 9 m of the shore spot, following and not holding hands. His character faces the water, winds up, releases from the actual hand at 0.42 s and returns to rest by 0.95 s. Nearby presence is rechecked at release; no remote/phantom throws. `skipPartner` is an inspector-only fixture for placing a following companion at the shore.

### Future multiplayer — documented only
The user plans to join the same server later. Each participant should have the same first-person pebble pickup/aim/throw experience as the current local player. Other participants see a single third-person throw animation; release spawns a shared world-space pebble with position, aim, power and timing quality. Multiplayer transport, server synchronization and ownership have intentionally not been implemented. Preserve this as later work, not authorization to build networking now.

### Raised bowl and richer fireworks
The pebble bowl, rim and pebbles are raised 0.85 m on a three-legged wooden stand. Pickup gaze follows the bowl's new world height; the skipping inspector looks down less.
Firework sequences are clamped to 6–7 staggered shells (candle celebration now requests 7). Targets lie 100–118 m ahead at 44–63 m altitude. Rocket particles remain dark below 12 m and reveal through 21 m; alternate rockets have intermittent glitter. Burst particles are brighter and live slightly longer, with tip/tail sparkle using existing vertices rather than added particle clouds. One shared shadowless PointLight creates a brief warm colored flash near viewers on each burst. No permanent ambient/exposure changes. Repeated-key firing is suppressed and queued/active sequences are bounded. Inspected overlapping blooms via `fireworkStill` and checked browser console without rendering errors.
