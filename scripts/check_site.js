// Validates the channel shell. Runs in CI, no dependencies.
const fs = require("fs");

const html = fs.readFileSync("site/index.html", "utf8");
const fail = (m) => { console.error("FAIL: " + m); process.exit(1); };

if (!html.includes("<title>Captcha Channels</title>")) fail("missing title");

const repo = html.match(/const REPO = '([^']+)'/);
if (!repo) fail("REPO not set");
if (repo[1].includes("your-name")) fail("REPO still points at the placeholder");

const levels = html.match(/\{ id:'[^']+',\s*name:'[^']+',\s*preview:[^,]+,\s*mount:/g) || [];
if (levels.length < 5) fail("expected at least 5 built-in levels, found " + levels.length);

if (/\bstub\s*\(/.test(html)) fail("a stub level is still registered");
if (/TODO|FIXME/.test(html)) fail("unfinished marker left in the shell");
if (/blobSvg|class="blob"/.test(html)) fail("the blob placeholder is still in the shell");
if (!html.includes("position:fixed")) fail("bottom bar is not pinned");
if (/<script src=/.test(html)) fail("external script tag found");

// Contributor-supplied prompts are rendered into the tile and the level, so
// they must go through esc() rather than raw interpolation.
if (!/const esc = s =>/.test(html)) fail("esc() helper missing");
if (/'<div class="prompt">' \+ esc\(lvl\.prompt\)/.test(html) === false) fail("prompt is not escaped");

const ids = [...html.matchAll(/\{ id:'([^']+)'/g)].map((m) => m[1]);
const dupes = ids.filter((x, i) => ids.indexOf(x) !== i);
if (dupes.length) fail("duplicate level id(s): " + dupes.join(", "));

console.log("OK: " + levels.length + " built-in levels, REPO " + repo[1]);
