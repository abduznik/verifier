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

Two ways in, both ending as an issue a maintainer can merge.

**1. From the site (no GitHub account).** Contribute → Submit a level → fill the
form. It posts to the Worker, which files a labelled issue.

**2. As a file.** Drop a Python file in `levels_src/` and open a PR.

A compiled level is a header block plus `solve(prompt)`:

```python
# level: power_of_two
# title: Power of Two
# desc: What power of two is this? Answer with the exponent.
# prompt: 512
# answer: 9

def solve(prompt):
    n, e = int(prompt), 0
    while n > 1 and n % 2 == 0:
        n //= 2
        e += 1
    return str(e)
```

`build_levels.py` runs `solve(prompt)` at build time, so the answer can never
drift from the code. Only the SHA-256 of the answer reaches `levels.json` — the
plain answer never ships to the browser. `answer:` is a comment for reviewers.

The site fetches `levels.json` and appends each entry as a level: prompt on
screen, a text box, hash comparison on submit. No JavaScript required from the
contributor.


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
