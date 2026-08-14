Put soundtrack files in this folder so they ship with the game.

Filename contract (only these play):

    Song-Name_Artist-Name.mp3

- Spaces become hyphens
- Each word is Title-Cased
- Example: `Blinding-Lights_The-Weeknd.mp3` shows as **Blinding Lights — The Weeknd**

Supported extensions: `.mp3`, `.ogg`, `.wav`

The game shuffles every matching file. After you add tracks, restart the dev server (or rebuild) so `tracks.json` picks them up.
