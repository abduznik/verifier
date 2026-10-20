# Captcha Channels

A web game made of CAPTCHA-style mini-games. The home screen is a channel menu:
glossy TV-screen tiles, a pinned bar at the bottom with Random and Rushdown, and
one dashed tile where the next community level goes.

**Play:** https://abduznik.github.io/verifier/

Inspired by the feel of a console menu. No Nintendo names, logos or assets.

## Stack

Plain HTML, CSS and JS in one file (`site/index.html`). No build step, no
framework, no bundler. Nunito from Google Fonts is the only external request.

## Levels

Five, each showing a live preview inside its tile:

- **Wonky Text** — type the distorted word.
- **Slide Puzzle** — 3×3, shuffled by legal moves so it is always solvable.
- **Odd One Out** — one shape differs; find it.
- **Sum It Up** — arithmetic.
- **Pick Pairs** — memory match.

The rest of the original eleven were cut: timing- and drag-based levels
(Crosswalks, Spin the Duck, Traffic Lights, Hold Steady, Trace the Line) and
Click the Bus were unreliable on phones. Add them back as contributions, with
the kinks worked out.

## Adding a level

A level is one entry in `LEVELS`:

```js
{ id: 'wonky-text', name: 'Wonky Text',
  preview: PREVIEW.wonky,      // small HTML shown in the tile
  mount(container, api) {
    // build the game inside `container`
    // call api.complete() when solved
    // return a cleanup function (remove listeners and timers)
  } }
```

- `api.complete()` — normal mode shows "Level cleared!" and returns to the menu.
  Rushdown advances to the next level.
- Return a cleanup function if you set timers or global listeners. The shell
  calls it on Back and when switching levels.
- Keep it keyboard accessible and usable at 390px width.

Open a PR titled `[level] your_level_id`. CI checks five levels, unique ids, no
stubs, a non-placeholder REPO, and that the bottom bar is pinned.

## Modes

- **Normal** — click a tile, it grows into the level.
- **Random** — a roll across the tiles that slows down and lands on one.
- **Rushdown** — every level once, in random order, with queue badges and
  `n / N` progress. The button becomes **Stop** while running.

## Layout

```
site/index.html      the game (single file, deployed as-is)
scripts/check_site.js  CI validation of the shell
.github/workflows/   site check + Pages deploy
worker/              Cloudflare Worker for anonymous level submissions
```

## Notes

`#app` is the only scroll container and `#bar` is `position: fixed`, so the bar
stays pinned on phones instead of scrolling away with the grid.
