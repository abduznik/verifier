# Captcha Channels

A web game made of CAPTCHA-style mini-games. Every channel is contributed by
someone in this repo — **one small Python file per level**.

**Play:** https://abduznik.github.io/verifier/

The home screen is a channel menu: glossy TV-screen tiles, a pinned bar with
Random and Rushdown, and a dashed tile where the next community level goes.
Inspired by the feel of a console menu. No Nintendo names, logos or assets.

**You do not need JavaScript to add a level.** Write a Python function that
returns an answer, and it becomes a playable channel.

---

## Contents

- [Add a level in 60 seconds](#add-a-level-in-60-seconds)
- [The file format](#the-file-format)
- [Examples](#examples)
- [How it becomes a playable level](#how-it-becomes-a-playable-level)
- [Rules for a good level](#rules-for-a-good-level)
- [Submission checklist](#submission-checklist)
- [Good first issues](#good-first-issues)
- [Running it locally](#running-it-locally)
- [Layout](#layout)
- [FAQ](#faq)

---

## Add a level in 60 seconds

Three ways in. Pick whichever is least friction for you.

### A. Paste it on the site — no GitHub account

1. Open https://abduznik.github.io/verifier/
2. **Contribute** (bottom left) → **Submit a level**
3. Fill in id, title, description, prompt and your `solve()` function
4. Submit — it files an issue automatically

A maintainer picks it up from there.

### B. Open a pull request

1. Fork this repo
2. Add one file to `levels_src/`, e.g. `levels_src/power_of_two.py`
3. Open a PR titled `[level] power_of_two`
4. Wait for CI — about 30 seconds

### C. Just file an issue

Paste the whole file into an issue in a code block. Someone else will add it.

---

## The file format

A level is **one Python file: a comment header plus one function.**

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

### Header fields

- `level` — required. Unique id: lowercase letters, digits, underscores. Must not already exist.
- `title` — required. Channel name on the tile. Keep it under ~20 characters.
- `desc` — required. One line of instruction, shown above the input box.
- `prompt` — required. The text the player sees — the "captcha". Under 60 characters.
- `answer` — recommended. The expected answer, for reviewers. Not trusted; see below.

### The function

```python
def solve(prompt):
    ...
```

- Takes the **prompt as a string**.
- Returns the **answer** — a string, or anything that stringifies.
- Runs **once at build time**, never in the browser.
- Must be **pure**: no network, no files, no `random`, no `time`, no `input()`.

The answer is produced by actually running your function, so your code is the
single source of truth. If `answer:` disagrees with what `solve()` returns, the
build fails and tells you which is which.

---

## Examples

Copy one, change the strings.

### Arithmetic — the token gate

```python
# level: math_gate
# title: Math Gate
# desc: Not a calculator. Prove it.
# prompt: 17 * 3
# answer: 51

def solve(prompt):
    a, op, b = prompt.split()
    if op == "*":
        return str(int(a) * int(b))
    if op == "+":
        return str(int(a) + int(b))
    return str(int(a) - int(b))
```

### Reverse the text

```python
# level: backwards
# title: Backwards Check
# desc: Human? Then you can read it the other way round.
# prompt: dlrow olleh
# answer: hello world

def solve(prompt):
    return prompt[::-1]
```

### Numbers as words

```python
# level: number_words
# title: Number Words
# desc: Write this number in English, lowercase, hyphen between tens and units.
# prompt: 42
# answer: forty-two

ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven",
        "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen",
        "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"]
TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy",
        "eighty", "ninety"]

def solve(prompt):
    n = int(prompt)
    if n < 20:
        return ONES[n]
    tens, ones = divmod(n, 10)
    return TENS[tens] + ("" if ones == 0 else "-" + ONES[ones])
```

### Binary

```python
# level: bit_reader
# title: Bit Reader
# desc: Type this number in binary. No spaces, no 0b.
# prompt: 202
# answer: 11001010

def solve(prompt):
    return format(int(prompt), "b")
```

### Counting

```python
# level: vowel_count
# title: Vowel Count
# desc: How many vowels are in this word? Answer with a single digit.
# prompt: extraordinary
# answer: 5

def solve(prompt):
    return str(sum(c in "aeiou" for c in prompt.lower()))
```

### Roman numerals

```python
# level: roman
# title: Roman
# desc: Answer in uppercase Roman numerals.
# prompt: 1987
# answer: MCMLXXXVII

VALS = [(1000, "M"), (900, "CM"), (500, "D"), (400, "CD"), (100, "C"),
        (90, "XC"), (50, "L"), (40, "XL"), (10, "X"), (9, "IX"), (5, "V"),
        (4, "IV"), (1, "I")]

def solve(prompt):
    n, out = int(prompt), ""
    for v, s in VALS:
        while n >= v:
            out += s
            n -= v
    return out
```

---

## How it becomes a playable level

```
levels_src/power_of_two.py
        │
        │  python build_levels.py      (runs on every push)
        ▼
solve("512") → "9"  →  SHA-256  →  site/levels.json
        │
        ▼
https://abduznik.github.io/verifier/
   fetches levels.json, appends a tile, shows the prompt, compares hashes
```

Only this much reaches the browser:

```json
{
  "id": "power_of_two",
  "title": "Power of Two",
  "desc": "What power of two is this? Answer with the exponent.",
  "prompt": "512",
  "answer_sha": "9c1b9f0d...",
  "answer_len": 1,
  "source": "power_of_two.py"
}
```

**The answer itself is never sent.** The player types, the browser hashes what
they typed, and compares hashes. Reading the page source tells you nothing.

Comparison is forgiving on purpose: leading and trailing spaces are trimmed,
internal runs of whitespace collapse to one space, and case is ignored. So
`Hello  World` and `hello world` both pass.

---

## Rules for a good level

**Do**

- Keep `solve()` under ~30 lines and readable in one screen.
- Make the answer short — one word or one number. Long answers are miserable on a phone.
- Choose prompts that need a *human* to parse: scrambled text, ambiguous phrasing, quick counting.
- Say the exact format in `desc`: case, spacing, units.
- One level per PR.

**Don't**

- Use `random`, `time`, `datetime`, network or files — the build must be reproducible.
- Let `solve()` read anything outside its `prompt` argument.
- Return an answer the player cannot derive from `prompt` alone.
- Reuse an existing level id — CI rejects it.
- Add a timing or drag game. The runner is text-in, answer-out; that works on phones.

### Security note

The build imports every file in `levels_src/`, so a human reviewer is the trust
boundary — the code runs during CI, never in a player's browser or on a
server. Keep it to pure computation. The submission endpoint already blocks
`os`, `subprocess`, `eval`, `exec` and `open`, and reviewers should reject
anything that reaches outside a pure calculation.

---

## Submission checklist

- [ ] File lives in `levels_src/` and ends in `.py`
- [ ] Header has `level`, `title`, `desc`, `prompt` (and ideally `answer`)
- [ ] `level` id is new — `grep -r "level:" levels_src/` finds no match
- [ ] `solve()` returns the same as `answer:` when run
- [ ] `python build_levels.py` succeeds locally
- [ ] `node scripts/check_site.js` prints `OK`
- [ ] Prompt is under 60 characters so it fits the tile preview
- [ ] `desc` says exactly what format to type

---

## Good first issues

New here? These are sized for a first contribution. Each is a complete,
working level shape — change the strings and the body of `solve()`.

- **`[level] number_words`** — spell out a two-digit number in English. (Example above.)
- **`[level] vowel_count`** — count vowels in a word.
- **`[level] rot13`** — decode a rot13 string.
- **`[level] roman`** — convert a number to Roman numerals.
- **`[level] hex_reader`** — convert a number to lowercase hex.
- **`[level] caesar`** — shift a word by three letters.
- **`[level] anagram`** — sort the letters of a word alphabetically.
- **`[level] is_prime`** — answer `yes` or `no` for a small number.
- **`[level] pig_latin`** — translate one simple word to pig latin.
- **`[level] sum_digits`** — add the digits of a number together.

Pick one, copy the closest example, change the strings, open the PR. If you get
stuck, comment on the issue — nobody here is precious about it.

---

## Running it locally

```bash
git clone https://github.com/abduznik/verifier
cd verifier

python build_levels.py      # compiles levels_src/*.py into site/levels.json
node scripts/check_site.js  # validates the shell — prints OK

python -m http.server 8000 --directory site
# open http://localhost:8000
```

Python 3.9+ and Node 18+ (Node only for the checker). Nothing else to install.

---

## Layout

```
levels_src/            one .py per level — add yours here
site/index.html        the whole game: menu, tiles, animations, level runner
site/levels.json       generated by the build — do not edit
build_levels.py        compiles levels_src/ into levels.json
scripts/check_site.js  CI validator for the shell
worker/                Cloudflare Worker behind the on-site submission form
.github/workflows/     Site Check (push/PR) and Deploy (Pages)
```

`site/levels.json` is generated. Hand edits get overwritten on the next build.

### Built-in game levels

Five channels are hand-written in `site/index.html` and show live previews:
**Wonky Text**, **Slide Puzzle** (shuffled by legal moves, always solvable),
**Odd One Out**, **Sum It Up**, **Pick Pairs**. Everything after those is
compiled from `levels_src/`.

### Modes

- **Normal** — click a tile, it grows into the level.
- **Random** — a roll across the tiles that slows and lands on one.
- **Rushdown** — every level once, in random order, with queue badges and
  `n / N` progress. The button becomes **Stop** while running.

### Mobile

`#app` is the only scroll container and `#bar` is `position: fixed`, so the bar
stays pinned on phones instead of scrolling away with the grid.

---

## FAQ

**Do I need to know JavaScript?**
No. Levels are Python. The runner that shows your prompt and checks the answer
is already written and shared by every channel.

**Can my level have a timer or drag interaction?**
Not yet. Text-in, answer-out is what works on phones, which is most of the
traffic. Game-like levels are a later problem.

**Can the answer be flexible about capitalisation?**
Case and whitespace are ignored; punctuation is not. Spell out the format in
`desc` — `lowercase, hyphen between tens and units` beats `write it out`.

**Why doesn't my level appear?**
Deploy runs on push to `main`. Give it a minute, then hard-refresh — Pages
caches for a few minutes. Locally, run `python build_levels.py` first.

**Can I change an existing level?**
Yes. Edit its file and open a PR. If you change the answer, say why.

**Why is the answer hashed?**
So page source can't give it away. Plain answers turn every channel into a
one-click solve.

**Is this related to Bitbox?**
Same idea — small contributions, one file, automated checks — applied to a
different problem. Bitbox grows a Python tool library; this grows a game.
