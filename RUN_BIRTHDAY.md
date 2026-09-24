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

| Key | Action |
| --- | --- |
| WASD | Walk |
| Mouse | Look around |
| Shift | Walk faster |
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

Stone skipping: find the pebble bowl on the eastern shore. Look at the bowl and press **E** to pick up one pebble. Aim over the sea, hold **Space**, and release inside the pale timing band for cleaner skips. The short dots show direction; a distance label follows your pebble. Pick up another with **E** after the round. If he has followed you to the shore and is nearby with his hands free, he takes an animated turn after yours. Alone, you can simply pick up another pebble. Press **Q** to leave. Best distances last until refresh.

Stargazing: find the woven violet carpet in the western meadow (x=-12, z=12)
and press **E** to lie down, or use **/stargaze**. You immediately look up at the
stars, with no menus or alternate views. Move the mouse freely to look around,
You remain in her POV: look left toward him, or down toward your own pink outfit. Mouse look also works if the browser declines capture.
Hold the left mouse button and move to write with glitter; release to look around.
**Cmd/Ctrl+Z** undoes a stroke, **C** clears writing, and **Q** or **Esc** gets up.
A gentle handheld drift accompanies looking; it pauses while drawing and respects
reduced-motion preferences. Each part of the trail waits 850 ms from when it was drawn, then fades over 550 ms,
even while you keep drawing. Glitter eases in gently with slow, shallow twinkling and a soft fade.
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
