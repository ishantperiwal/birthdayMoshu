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

`painted-sky.js` draws fifteen individually generated flat cloud paintings with
feathered silhouettes and a simple vertical color wash. Clouds use no volumetric
lighting or stacked puff geometry. Stars cover the full hemisphere, including
the zenith, with varied sizes, warm/cool colors, and slow independent twinkling.
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
- Complete trees rendered in four instanced archetype batches; fifteen lightweight flat cloud cards.
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
