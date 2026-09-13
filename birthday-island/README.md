# Our Little Island

A small, walkable Three.js celebration island derived from the painterly, procedural spirit of Hoshi-no-Tani. It uses no image, model, or audio assets: the island, ocean, plants, gifts, particles, and ambient sound are generated in code.

## Run it

From this directory:

```sh
npm start
```

Then open <http://localhost:4173>. An internet connection is currently required for the Three.js CDN import.

## Controls

- WASD to walk, Shift to walk faster, mouse to look
- E to collect a nearby gift or blow out the cake candles
- F to launch fireworks
- 1/2/3 to select day, sunset, or night
- `/` to open the island command bar
- M to toggle sound

The dedication and gift messages are collected in `main.js` under `CONFIG`, so they can be personalized without touching the scene code.

## Meadow and lighting

The landscape uses the reference's teal-to-green grass palette, curved tapered
blades, traveling wind, translucent tips, and colored shadows. Each blade is a
quadratic Bezier that already arches at rest and is then laid further over by
gravity and wind, with the curve rescaled back to its own length — so a longer
blade reaches outward rather than upward, and the sward stays dense without
becoming a picket fence across the view. Blades comb downwind, and the sunlit
face of one laid over by a gust flashes, which makes a gust legible as a pale
band crossing the meadow. Grass is drawn in two layers: a far field of roughly
12 blades/m², plus a much denser mat of shorter, broader blades at about
72 blades/m² drawn only in the tiles nearest you. That near mat exists to close
the floor — at a walker's eye height a thin sward lets you see bare ground
between the blades, which is what breaks the spell. Each near blade retires at
its own distance between 9 and 27 m rather than all of them fading across one
band, because a shared threshold draws a visible ring on the ground around you. Trees sway on the same gust field: the trunk leans and rings at its own
low resonant frequency, each canopy clump swings on its own phase, and the
leaves flutter around their clump.
A shared mask clears the party garden and bench and softens the walking route.
Grass, ground, and foliage share the sun direction, shadow map, cloud shade, and
atmosphere. Day, sunset, and moonlight now light the whole scene.

Trees now use the reference’s swept, branching trunks and displaced canopy
clumps, scaled to the island. `reference-trees.js` carries the original geometry
and `reference-noise.js` its procedural texture functions. The foliage shader
uses its four-green mosaic, grain along light/shadow boundaries, colored shadow
bands, and backlit rims. Four instanced archetypes preserve variation, and the
depth pass uses the same clump-aware sway as the visible trees.

`painted-sky.js` draws 22 flat cloud cards from six 256×128 paintings baked
once at load. Connected low banks, off-centre crowns, and twin crowns avoid
floating caps; gentle edge variation keeps the silhouettes soft. The baked
normal and form channels retain directional painted shading without volume
sampling. Mirroring also flips the baked normals correctly. Slow continuous
angular drift moves the clouds without wrapping jumps. Whole clouds fade before
entering the sun or moon halo, leaving that part of the sky open.
Stars cover the full hemisphere with varied sizes and gentle twinkling.
Stars render before clouds, so cloud coverage softly obscures them.

`fireworks.js` adds rising shells, round blooms, rings, falling gold trails, and
late sparkles. Spark trajectories are frame-rate independent; expired particles
are removed and their geometry and materials disposed.

The scene
renders into a 4x multisampled target — the renderer's own antialiasing does not
apply when drawing into a target, and without it every blade edge is a hard step,
which is what makes a dense sward read as noise instead of grass. A
quarter-resolution, two-pass bloom gives lights a soft edge. The final print
curve preserves color instead of washing greens out.

`meadow-life.js` scatters 260 short petalled flowers in small, loose drifts
throughout the island, with 36 low mushrooms spread independently. Flowers have
bare arched stems and gently tilted heads, bending in the grass's gust field.
The shadow pass follows that bend. Planting stays off the path and clearing.

The original broad insect distribution is restored: 22 butterflies roam the
island, and 400 fireflies loosely follow scattered flowers or wander the open
meadow. Use `/?inspect&view=flowers` for a close view of the shorter flowers.

Cleared ground — the walking route and the apron around the bench — swaps to a
sand palette rather than being tinted toward one. Multiplying a sand vertex
colour into a green ramp only ever yields olive, so the ground shader carries an
`aSand` channel that replaces the palette stops outright.

## Quiet birthday clearing and soft meadow

The clearing keeps the cake, a small woven rug, two low cushions, five approach
stones, and a sparse string of lights. Balloons, flower pots, the ring of stones,
and all lanterns in the clearing have been removed. Four softly lit lanterns
remain at widely separated spots elsewhere on the island. Hanging bulbs have
small warm halos. Ribbon-free gifts emit their own soft colored local light on
props and painted terrain; collecting a gift removes its light as well.

The route curves continuously into the cake clearing. Its entrance narrows and
fades into meadow over about 13 m, with gently uneven shoulders. The worn core excludes grass
entirely, with an allowance for blades leaning in from the edges. Sparse single pebbles
or pairs sit along alternating left and right shoulders, about 3–4 m apart;
the middle remains smooth. The pine
beside the bench has moved farther right beyond the rock to clear the seat.

The cake has scalloped icing, piped borders, and a few berry accents. Its tabletop
uses a generated, low-contrast contour-line texture. Invisible warm fill lights
gently brighten the cake and seating at night, with a matching local fill in the
ground and grass shaders. Use `/?inspect&view=cake` for a close view.

Grass shading follows the reference's distance-based reduction of fine detail,
with a stronger painterly blend at this island's scale. Blades and their ground
share a broad pigment field, so distant blades merge into the meadow rather
than appearing as separate bright strokes. The blend tops out at 60% by day and 70% at night, reached gradually over
roughly 6–30 m and 4–24 m respectively, keeping blade definition in the far
field. Nighttime sheen and transmission remain suppressed. Near grass retains shape without a dark edge treatment. A small masked colour
blend in the final pass softens grass edges while leaving props, trees, and sky
sharp; its mask is carried in the HDR scene target alpha.

Use `/?inspect&view=celebration` for the clearing and `&view=meadow` for the
near-to-far grass transition. Grass coordinates remain clamped before fractional
powers to prevent invalid values at multisampled edges.

## Water

The sky's colour is a shared `skyDome()` function, so the ocean reflects the
actual sky rather than tinting toward one horizon colour. Long swells are carried
by the mesh; four finer ripples exist only in the surface normal, because at
~3.5 m per quad the geometry cannot hold them. Their amplitudes are chosen for
SLOPE rather than height — a wave that displaces the surface but barely tilts it
leaves water looking like tinted glass. A noise gate breaks the specular into
separate sparks, which is what a sun path on water actually looks like, and the
shore foam is scalloped by noise so it reads as a breaking edge, not a ring.

### Laptop rendering budget

- 61,462 grass instances in bounded 8 m tiles, with automatic frustum culling.
- Three blade segments (five triangles), instead of four (seven triangles).
- Complete trees rendered in four instanced archetype batches; 22 lightweight flat cloud cards sharing six baked textures.
- 1024² shadow map refreshed at most 15 times per second.
- Scene target capped at 1.6 million pixels, with 2× MSAA and adaptive resolution
  down to 70% of the base dimensions if GPU time stays above 18 ms. Where
  GPU timers are unavailable, a focused-page frame/CPU-time fallback is used.
- Display pixel ratio capped at 1.25; animation capped at 60 fps and paused while
  the document is hidden. Bloom runs at one-quarter width and height.

These are performance budgets, not a guarantee of a particular device's FPS.
To inspect frame timing, resolution and draw counts, open `/?inspect=1`.
Reproducible inspection cameras: append `&view=meadow`, `&view=shore`,
`&view=garden`, `&view=gift`, `&view=trees`, `&view=clouds`,
`&view=zenith`, `&view=path`, or `&view=fireworks`. These tools appear only with `inspect` enabled.

### Verification of this lighting pass

Checked the initial meadow, ocean sunset, night, and close garden views in the
local browser preview. Gift collection and dismissal and the candle interaction
still work. The browser preview reported 30–60 fps across checks at 1172 × 943. This is
preview-host frame cadence, not a sustained M4 MacBook Air hardware benchmark.
The diagnostic also reports GPU time when the browser exposes timer queries,
so browser scheduling limits do not automatically reduce image quality. The close
garden view reported about 1.6–1.7 ms GPU time on this host. HDR samples are
sanitized before bloom to prevent non-finite pixels from spreading into blocks. No new shader compilation
or runtime errors appeared after the final changes. Module syntax checks use `node --input-type=module --check < main.js`.

Night is the default starting mood while the celebration lighting is being refined.
The clearing receives a broad warm ground-shader lift with a level centre and
soft falloff into nearby grass, independent of visible fixtures or shadow maps.

Candle extinguishing keeps the five point lights registered and fades their
intensity to zero over 160 ms, avoiding a light-count shader recompilation.
`candle-smoke.js` prepares one small ribbon batch at startup; five thin curls
rise from the wicks and dissipate over about four seconds. Inspection mode logs
transition frame timing and shader-program changes; `&smokePreview` holds the
smoke at 1.25 seconds after blowing for visual checks only.


### Sculpted character hair

The character uses `assets/sculpted-hair.js`, a single indexed static mesh
(about 19,000 triangles) exported from Blender. It adds one hair draw call and
no per-frame mesh generation. The current size, outfit, face and walking rig
remain in `character.js`.

`assets/sculpted-hair.blend` contains the fused mesh and a hidden collection of
editable source sections. `modeling/build-hair.py` regenerates the sculpt and
runtime mesh using Blender in background mode. The source models use Three.js
coordinates and convert to Blender coordinates for modeling.

`modeling/hair-preview.html` provides a close front, three-quarter and back
study under neutral lights for checking seams and head clearance.

The hair is now constructed exclusively from overlapping crown-to-tip locks.
There is no central shell beneath decorative strands: paired roots meet at
the part, spread over the crown, and curve outward toward the ends.

The latest hair reference uses a dark brown side part, broad swept front
sections with molded channels, and smaller curls framing the cheeks. The
front sections use paired inner and outer contours to control the hairline
and avoid the former tubular arches.

### Birthday centrepiece

The cake is modeled in Blender in `assets/birthday-cake.blend`, with a portable
`assets/birthday-cake.glb` export. Regenerate it using Blender's background mode
with `modeling/build-cake.py`. The island loads `assets/birthday-cake.js`, a baked
mesh grouped into five materials, through `birthday-centrepiece.js`. This also
adds two party hats and the “Happy Birthday, Moshiee!” board. Candles, blowing,
smoke, and the tabletop stay controlled by the existing party code in `main.js`.

The celebration now sits on a 12 cm-high circular oak platform generated by
`celebration-stage.js`. Its height is shared with the table and player footing. The cushions have been removed. The wooden birthday sign stands just inside the grass beside the front
left light pole, facing the approach, instead of beside the cake.


### Money gifts and ocean scenery

Ten regular gifts total ₹20,000: two small ₹500 gifts, six medium ₹1,500 gifts,
and two large ₹5,000 gifts. Sizes, wrapping colors, amount plaques and coin seals
identify the tiers. A small gift welcomes players near the approach; larger
rewards sit on the outer island circuit. Collection updates the reward amount
and HUD total. As before, exploration progress is session-only.
`money-gifts.js` reserves another ₹4,000 as two unplaced ₹2,000 legendary gifts;
these do not spawn or count toward completion until hiding places are selected.
The amounts are gift promises displayed by the experience, not a payment integration.

`ocean-life.js` adds three bobbing buoys and one distant cruise ship on the southwest
water, away from the moon, aurora and northeast fireplace. Sixteen reused steam
sprites make a short, fading plume, with no additional lights or shadow maps.


### Dandelions and cruise route

Twelve dandelions are scattered through the meadow. Walking close or pressing E
releases their seeds; a breeze also releases one occasionally. Seeds drift for
about six seconds, then their heads gradually regrow, ready again after 21 seconds.
The entire seed effect uses 336 reusable points plus fine stem fibers.

The cruise ship has a fixed sideways, receding southwest route (`cruise-route.js`).
It does not loop toward the island or use an opacity fade. After a minimum
150-second voyage it can restart only after BOTH the departing ship and the
restart location have remained outside the camera frustum for five seconds.
If watched continuously it keeps receding, with the ordinary distance haze.

The cruise now starts farther offshore, is 18% larger, and follows a broader
side-on heading through gentle distance haze. `ship-steam.js` uses four baked
puff profiles and a fixed pool of expanding, wind-drifting chuffs inspired by
the reference train. No volumetric pass or extra lights are used.

Gift wrapping has deeper jade, sapphire and berry colors with a restrained
colored emission, beveled edges and a clear-coated finish. `gift-finish.js`
bakes one shared reflection at startup for broad highlights; it does not
capture reflections each frame or change the island lighting.

Each uncollected gift also has a softly feathered horizontal ring of warm light
(`gift-aura.js`), sized with its reward tier and gently pulsing. The ring uses a
shared baked texture, dims during the day, and disappears with the gift; it
adds no real lights or shadow maps.

### Waiting companion and ocean clarity

A second Lego-style character waits beside the cake in a teal top, navy trousers
and simple short brown hair. Blowing the candles triggers two celebratory hops,
then he follows the player with eased movement and roughly 3.1–3.35 metres of space.
`companion.js` keeps him on island terrain, follows the stage height, and routes
around the cake table. The existing player avatar and first-person default are
preserved. `?inspect&view=companion` frames him beside the candle interaction.

Daytime ocean colors are deeper blue with less warm sky wash. Fine wave normals
are filtered by their screen footprint and fade with distance; warped ripple
phases break up straight bands. Static uncorrelated dither replaces the regular
diagonal screen pattern without removing the scene's soft grain.

The waiting companion is now 36% taller for a face height closer to the first-
person camera. Press E beside either table hat to put both hats on: teal for
him and rose for the player avatar. They leave the table, stay attached during
walking/jumping, and the player hat inherits first-person avatar visibility.
Use `?inspect&view=hats&thirdPerson` to inspect both hats without changing the
normal first-person default. Hat and candle state remain session-only.

`distant-island.js` adds a quiet low island beneath the moon's compass bearing,
255 metres offshore. It uses a single colored land mesh and one instanced batch
of nine treetops, ordinary atmospheric fog, and no shadow maps or extra lights.

The distant island uses muted blue-green pigment and extra horizon-colored haze
to reduce its nighttime silhouette contrast without changing nearby lighting.

The companion now has independent eased head movement, occasional short glances,
and small resting arm movements. Nearby uncollected gifts prompt a brief point
and alternating gift/player looks. Actual firework burst positions override his
attention for a few seconds, then he returns to the player. Following clearance
and the candle celebration remain intact. Hair and worn hats follow the head
pivot. Both character heads use a rounded lathed profile at the upper and lower
rims, preserving the printed face and Lego proportions.

Two smaller neighbouring islands sit farther offshore, around 333 and 427 metres
from the center, on widely separated east-northeast and south-southwest bearings. They sit
outside the celebration/moon view and away from the main scenery directions. They share the original island geometry/materials, with distinct
scales and rotations, retaining the same subdued blue-green atmospheric haze.

The companion waves once as you approach within 14 metres, rearming after you
walk away beyond 18 metres. Nearby, E offers hand holding when another object
is not taking priority; H can hold hands or let go while interacting with the
cake or gifts. He follows at roughly 1.65 metres while matching your pace, independently of
camera direction. His hand rests around waist height; an elongated player
forearm reaches from the body to meet it in world space, so looking down toward him reveals the clasp.
The retained third-person avatar also reaches for his hand. Release restores ordinary
following distance. Candle celebration releases the hands, and shoreline/cake
clearance remains part of his following movement.

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
