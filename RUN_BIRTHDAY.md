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
| Esc | Release the mouse |

Walk close to an object and follow the E prompt. Taking a party hat equips both
characters. Blowing the candles makes your companion celebrate and follow you.

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
