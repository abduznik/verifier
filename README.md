# Verifier

A captcha game built entirely from community pull requests. Every level is one
small Python file. GitHub Actions compiles it into the site.

**Play:** https://abduznik.github.io/verifier/

## How a level works

A level is a Python file in `levels_src/`. It has a header comment block and one
function, `solve(prompt)`, that returns the correct answer as a string.

```python
# level: backwards
# title: Backwards Check
# desc: Human? Then you can read it the other way round.
# prompt: dlrow olleh
# answer: hello world

def solve(prompt):
    return prompt[::-1]
```

`answer:` is a human-readable comment for reviewers only. The real answer is
produced by **running** `solve(prompt)` at build time, so the level can never
drift from the code. Only a SHA-256 of the answer ships to the browser — the
plain answer never reaches the page, and it is not in the repo's build output.

## Adding a level

1. Copy any file in `levels_src/`.
2. Give it a unique `level:` id (used as the filename stem too).
3. Make `prompt` something a human can solve by looking at it.
4. Make `solve(prompt)` return the answer.
5. Open a PR titled `[level] your_level_id`.

CI compiles every level and rejects the PR if compilation fails, if an answer is
empty, or if a raw answer field appears in `levels.json`.

## Rules

- **Stdlib only.** No pip installs. Levels run inside CI.
- **`solve` must return a `str`.**
- **Deterministic.** Same prompt in, same answer out, every time.
- **No network, no file writes, no `eval`.** This is a captcha, not a sandbox.
- **Human-solvable.** The prompt has to be readable on a phone screen. A level
  nobody can answer is a broken level.
- **Original.** Don't re-implement an existing level.

## Layout

```
levels_src/*.py     level sources (what contributors write)
build_levels.py     compiler: source -> levels.json
levels.json         generated — never edit by hand
index.html/app.js   the game
.github/workflows/  CI compile gate + Pages deploy
```

The site redeploys on every push to `main` and rebuilds daily, so anything
merged shows up without touching the frontend.
