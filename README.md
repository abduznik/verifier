# Captcha Channels

A web game made of CAPTCHA-style mini-games. The home screen is a channel menu:
a grid of glossy TV-screen tiles, a rounded bar at the bottom with Random and
Rushdown, and one dashed tile for your own level.

**Play:** https://abduznik.github.io/verifier/

Inspired by the feel of a console menu. No Nintendo names, logos or assets.

## Stack

Plain HTML, CSS and JS in one file (`site/index.html`). No build step, no
framework, no bundler. Nunito from Google Fonts is the only external request.

## Levels

Eleven, all playable: Crosswalks, Wonky Text, Slide Puzzle, Spin the Duck,
Traffic Lights, Odd One Out, Click the Bus, Sum It Up, Hold Steady, Pick Pairs,
Trace the Line.

## Adding a level

A level is one entry in the `LEVELS` array:

```js
{ id: 'crosswalks', name: 'Crosswalks',
  mount(container, api) {
    // build the game inside `container`
    // call api.complete() when solved
    // return a cleanup function (remove listeners and timers)
  } }
```

- `api.complete()` — normal mode shows "Level cleared!" and returns to the menu.
  In Rushdown it advances to the next level.
- Always return a cleanup function if you set timers or global listeners.
  The shell calls it on Back and when switching levels.
- Keep it keyboard accessible and usable at phone width.

Open a PR titled `[level] your_level_id`. CI checks the shell still has eleven
registered levels, unique ids, no stubs, and no external script tags.

## Modes

- **Normal** — click a tile, it grows into the level.
- **Random** — a roll across the tiles that slows down and lands on one.
- **Rushdown** — every level once, in random order, with queue badges and
  `n / N` progress. The button becomes **Stop** while running.

## Layout

```
site/index.html            the game (single file, deployed as-is)
.github/workflows/         site check + Pages deploy
worker/                    optional Cloudflare Worker for anonymous submissions
levels_src/, build_levels.py   legacy Python level pipeline (not wired into the site)
```

## Legacy

`levels_src/` and `build_levels.py` are the earlier experiment: contributing a
Python file that CI compiles into a text captcha. The site no longer reads them.
They are kept for reference only.
