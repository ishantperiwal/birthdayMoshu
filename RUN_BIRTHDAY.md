# Run Our Little Island

## 1. Start the local server

Open Terminal and paste:

```bash
cd /Users/ishant.p/Downloads/claude-opus-5-ghibli/birthday-island
python3 -m http.server 4173
```

If you moved the project folder, replace the first line with its new path.
Keep this Terminal window open while playing.

## 2. Open the island

Open **http://127.0.0.1:4173/** in Chrome, then click **ENTER OUR ISLAND**.
Click the scene to capture the mouse if needed.

### Compare GitHub and local versions

- GitHub Pages (published `main`): https://ishantperiwal.github.io/birthdayMoshu/birthday-island/
- Current local edits (server running): http://127.0.0.1:4173/

For the same shore viewpoint, append `?inspect&view=shore` to either URL.
GitHub Pages updates when changes are pushed to `main`; local edits appear only
in the local preview until pushed.

You need Python 3 and internet access for Three.js. No npm install, build step,
or Blender is needed. Open the HTTP link above, not `index.html` directly.

## Controls

Hold the **right mouse button** to open the gesture wheel. Move toward **Say hi, Happy, Surprised, Sad, Celebrate, or Normal**, then release to perform the highlighted action. Release in the **None** center, or press Escape, to cancel. The camera stays still while choosing. The wheel controls your current character, including the local **V** perspective switch. Arm gestures require free hands; expressions remain available while carrying items. Online wave and celebration events require the updated multiplayer Worker to be deployed.

Open chat with **/** or the chat button. The bottom row selects **Normal, Happy, Surprised, or Sad** without sending a message or clearing your draft. Each reaction lasts four seconds, then returns to Normal with natural blinking. A circular ring around the selected emoji counts down; clicking it again restarts the reaction. The matching emoji appears briefly above the character and fades like chat. Normal remains indefinitely and does not produce a reaction bubble. Local chat previews the other character. Online, each player controls their own face; shared expiry times keep reconnects and ordinary room snapshots from restarting reactions. This online feature requires the updated multiplayer server and client to be deployed. Existing face artwork is reused by the shader, with no extra face meshes or expression texture downloads.

Hand holding uses **H only**, both to hold and let go. **E** remains for other nearby objects. The hand-holding prompt is hidden while either character has a bouquet or is handling a pebble; new hand holding is blocked until their hands are free.

### Bouquet surprise

In the local preview, click **Reveal bouquet** or press **B** to bring him in
front of her and replay his behind-the-back flower reveal. Click **His POV**
or press **V** to switch between her view and his. Once he presents it, click
**Receive bouquet** or press **R**: she lifts the flowers facing her. **Put away**
lowers them out of view (or reverses his reveal if she hasn't received them).
Receiving in her POV resumes normal exploration with the flowers still in her
hand: click the world and use WASD. From his POV, **V**, **End preview**, or
**Esc** returns to her view and keeps the received bouquet. Only the staged
reveal and his camera preview pause walking. **Put away** stores the flowers.

Online, **ISHIEE** has the bouquet button and **B** toggles reveal/put away.
**MOSHIEE** can receive it when both are upright and within 3.7 units, then use
**Put away**. He cannot reclaim it while she is holding it; after she stores it,
he can offer it again. Both clients receive the shared ownership state,
including on reconnect. The six-flower bouquet mixes pink and orange tulips,
a sunflower, and white, purple and peach daisies in a folded coral-and-ivory wrap.
It has broad, gently tilted petals, smooth tulip cups, plain centers, and five
thin leaves. It uses about 13,400 triangles with shared geometry; the colored flowers and
leaves are batched into one mesh. A close-up is at `/modeling/bouquet-preview.html`. This
requires deploying the updated client and multiplayer server; the local-only
POV switch is not shown online.

| Key | Action |
| --- | --- |
| WASD | Walk |
| Mouse | Look around |
| Shift | Walk faster |
| Space | Jump during free roam; hold to charge a throw while playing with pebbles |
| E | Interact with a nearby gift, hat, candles, radio, or dandelion |
| F | Launch fireworks |
| 1 / 2 / 3 | Day / sunset / night |
| M | Toggle sound |
| / | Open commands |
| P | Show cloud IDs and copy your exact viewpoint (also `/context`) |
| Esc | Release the mouse |

Walk close to an object and follow the E prompt. Taking a party hat equips both
characters. Blowing the candles makes your companion celebrate and follow you.

For scene feedback, look toward the area and press **P**. Click a cloud label
to include its ID, or leave them unselected for general location feedback.
Click **Copy context**, then paste it with your request. The note includes your
position, camera direction, sky mood and cloud animation time. Cloud IDs stay
consistent across reloads of the current seeded layout. Close with **Esc**, then
click the scene to resume looking around.

Fish occasionally jump offshore near the pebble stand and sunset bench, with a 12–26 second interval per area. Four palettes and sizes from 50–145% share pooled meshes. `FISH_AREAS` in `birthday-island/jumping-fish.js` controls the roaming areas; launch paths are checked against the terrain. Takeoff and landing disturb the ocean's reflection normals and emit a few pooled droplets, without painted ripple planes. Preview with `?inspect&view=fish` or `?inspect&view=benchfish`.

Music and fireworks are fully synthesised in `birthday-island/soundscape.js`
(no audio files). A soft music-box Happy Birthday loops from the moment you
enter, alternating with a rounder bell verse. After the candles are blown it
fades out, and once the fireworks settle a very quiet, low, slow song drifts in
(nothing above A4). Fireworks have a mortar tock and rising whoosh (sometimes a
whistle), then a delayed boom based on distance, panned to where they burst,
with a far-shore echo and a small tuned shimmer. Set `musicVolume` in `CONFIG`
(0 turns the songs off); **M** mutes everything.

### Campfire radio

The radio by the campfire plays a YouTube playlist of romantic songs, starting
with Lauv's "Steal The Show". It is full volume beside the fire and fades to
silence about 17 m away; the island music dips while you are near it. A small
"On the radio" card shows the song while it is within earshot. Press **E** at
the radio for the next song. Songs crossfade, and one that will not play is
skipped. Edit `RADIO_PLAYLIST` in `birthday-island/radio-player.js` to change
the songs.

Online, both players hear the same song, though not at the same second. The
server stores only the song number. When a song ends on either screen, or
someone presses **E**, that browser asks for the next song; the server accepts
one change per song, and both screens crossfade to it.

Music labels block embeds on `127.0.0.1`, so preview the radio locally at
**http://localhost:4173/**. YouTube may play an ad before a song. The shared
song needs the updated multiplayer server deployed.

The stargazing carpet is at `x=-12, z=12`. Use **E** near the carpet or
`/stargaze` to lie down together; **Q** gets you up.

## Stop or restart

Press **Control+C** in the server Terminal to stop it. Run the same command again
to restart. Reloading the browser resets gifts, candles, hats and companion state.

## If it does not open

- **“Address already in use”**: try the link first; a server may already be running.
  If needed, use `python3 -m http.server 4174` and open http://127.0.0.1:4174/.
- **Folder listing instead of the island**: stop the server and run it from the
  `birthday-island` folder using the commands above.
- **`python3` not found**: install Python 3 from https://www.python.org/downloads/.
- **Loading gets stuck**: check your internet connection, then reload.
- **An old version appears**: hard-refresh Chrome with **Command+Shift+R**.

Near your companion, press **E** when “hold hands” appears, or **H** to hold hands.
Press **H** again to let go. Other nearby objects retain their E interactions.

Stone skipping: find the pebble bowl on the eastern shore. Look at the bowl and **left-click** to pick up one pebble and start a three-round target game. Each round has a 6.4-metre hoop over open water. Aim slightly above the water, **hold left-click** to charge, and release when the small predicted landing dot is inside the hoop (it turns pale green). Only the final water contact counts: earlier bounces through the hoop, landing ashore, and expired flights do not win. Misses retain the same target; a win lights the hoop and plays a chime. Click the bowl for the next round or, after three wins, to play again. The pickup click never throws. **E** to pick up and **Space** to charge/release also work. He can still take a nearby companion turn after a miss; it does not change your score. **Q**, **Escape**, or walking away ends the game; losing focus or mouse capture cancels a charge. Round progress is local to this player; online stone throws remain visible to the other player. Target generation and the landing marker use the existing throw physics, with prediction refreshed at most ten times per second.

Stargazing: find the woven violet carpet in the western meadow (x=-12, z=12)
and press **E** to lie down, or use **/stargaze**. You immediately look up at the
stars, with no menus or alternate views. Move the mouse freely to look around,
You remain in her POV: look left toward him, or down toward your own pink outfit. Mouse look also works if the browser declines capture.
Click once to freeze the camera and release the cursor, then click-drag anywhere to write with glitter. Releasing the button ends a stroke but keeps the view still.
**Esc** exits drawing and resumes looking; **Q** gets up (or **Esc** while looking). **Cmd/Ctrl+Z** undoes a stroke and **C** clears writing locally. Ink segments are shared at their 3D sky positions, so the other player's perspective is naturally slightly different.
A gentle handheld drift accompanies looking; it pauses while drawing and respects
reduced-motion preferences. The entire phrase stays visible until three seconds without new ink; it then fades in writing order over roughly 2–5 seconds. New writing resets the pause for the remaining marks, including received multiplayer ink.
Glitter is soft and gently twinkles; the lettering drifts subtly together, with that drift disabled for reduced-motion preferences.
Mouse look is limited to about 75° left or right, with a shallow torso view and
a small upward tilt; it cannot turn underneath your body or flip overhead.
Shooting stars have long tapered trails and a soft head shine, lasting 2.2–2.8 seconds.
They appear every 26–48 seconds at night, or 14–26 seconds while stargazing.
During stargazing, meteor trails are 20% longer and 15% wider, and star twinkling
is gentler and slower. Release the left mouse button to resume looking; Q or Esc gets up.

Whenever stars are visible, occasional existing stars brighten into a cross-shaped glow
on independent timers, even when the mouse is still. Normal play uses the normal
twinkle pace; stargazing keeps its gentler, slower pace with a more noticeable handheld drift.

## Private multiplayer

The Cloudflare version uses two private invite links: `?user=ISHIEE` and
`?user=MOSHIEE`, each followed by its own `#invite=...` token. Share MOSHIEE's full
link with her; keep ISHIEE's full link for yourself. No character picker or password
form is needed. Each role can be open in one tab at a time.

ISHIEE now joins the male companion's **view**, while his movement stays on the
original autopilot. He waits at the table, celebrates, follows her, holds hands,
and participates in activities as before, whether the viewer is online or not.
MOSHIEE's browser owns that movement, so it renders smoothly on her screen.

ISHIEE's controls:

- **Mouse**: look freely up/down/left/right and turn around.
- **Hold R**: point in the direction you are looking.
- **Space**: do a cheerful jump (two small hops).
- **M**: toggle your sound. **Esc**: release your mouse.

Walking keys and world-changing interactions are disabled for ISHIEE in this
mode. MOSHIEE keeps her usual controls, including **H** for hand holding and
**E** / `/stargaze` to lie down together; **Q** gets her up and brings the companion
with her. ISHIEE's camera follows his position while he can keep looking around.
Her gifts, candles, hats, sky, and progress remain shared and saved.

This is a reversible mode switch in `birthday-island/control-mode.js`; the prior
manual multiplayer movement implementation is retained. Both players should
refresh their existing invite links after a mode change.

The existing Python preview remains solo. For local multiplayer testing and
Cloudflare deployment instructions, see `birthday-island/server/README.md`.


### Nearby chat (local implementation)
Press `/` to type a message, then Enter to send. Press `/` again while the empty
chat input is open (`//`) for island commands; Esc closes the input. Both players,
including ISHIEE in companion mode, can chat. Bubbles face each viewer, type in,
remain for about 5.5 seconds after typing, then fade. They fade with distance from
9 to 13 metres. Messages are temporary, capped at 140 characters, and use the
existing sound toggle. Test multiplayer on the local server at port 8787 with
the private invite fragments; the static 4173 preview is solo only. This update
has not been deployed to Cloudflare.
