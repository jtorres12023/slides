# Scripture Lesson Slides

Static scripture lesson presentations designed for local use and GitHub Pages.

## Published Site

After the GitHub Pages workflow completes:

- `https://jtorres12023.github.io/slides/`
- June 21 deck: `https://jtorres12023.github.io/slides/?deck=june21`

This slideshow tool is split into:

- `server.js`: Node static server and clean route entrypoints
- `index.html`: GitHub Pages entrypoint
- `slideshow.html`: shell/layout only
- `assets/presentation.css`: styles
- `assets/presentation.js`: app behavior (navigation, progress, spinner, rendering)
- `assets/decks/index.js`: deck controller manifest
- `assets/decks/*.js`: slide deck content + backgrounds

## Run

```bash
npm start
```

Then open:

- `http://localhost:3000/`
- `http://localhost:3000/slideshow`
- `http://localhost:3000/deck/noah-grace`

## Phone Remote

Run the local server on the presentation computer. Put the computer and phone on the same Wi-Fi network.

1. Open the slideshow on the computer using the local server URL.
2. Look in the server terminal for the printed `Phone remote` URL.
3. Open that URL on the phone.
4. Use Previous, Next, First, Last, or jump to a slide number.

The remote is intentionally simple and has no authentication. It is available only from the local Node server, not the GitHub Pages site.

GitHub Pages uses query-string deck links rather than the local server's short `/deck/...` routes.

## Switch Decks

The app reads the deck id from the URL query string:

- Default: `welcome`
- Example: `http://localhost:3000/slideshow?deck=welcome`
- Noah deck example: `http://localhost:3000/slideshow?deck=noah-grace`

The Node server also supports short deck URLs, such as `http://localhost:3000/deck/march15`.

You can also use the deck controller in the top-left corner of the presentation to switch decks or copy a direct link to the current deck.

## Create a New Deck

1. Copy `assets/decks/deck-template.js` to a new file, for example `assets/decks/web-security.js`.
2. Change `id` to your new deck id.
3. Change `title`.
4. Update `backgroundImages` (or keep existing).
5. Replace `slidesHtml` with your slide markup (`<div class="slide">...</div>` blocks).
6. Add the deck to `assets/decks/index.js` so it appears in the controller.
7. Open with `?deck=your-deck-id` or select it from the controller.

## Notes

- Keep slide numbers out of markup; `presentation.js` assigns them automatically.
- `backgroundImages` are applied in order and repeat when a deck has more slides than images.
- Existing keyboard navigation, touch swipe, image-only mode, jump-to-slide, and random spinner behavior are preserved.
