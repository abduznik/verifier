/**
 * verifier-api — anonymous level submission for the Verifier captcha game.
 *
 * The browser never sees a GitHub token. This Worker holds one, validates the
 * submission, applies a rate limit, and opens an issue on the repo.
 *
 * Env:
 *   GITHUB_TOKEN  fine-grained PAT, issues:write on abduznik/verifier
 *   REPO          "abduznik/verifier"
 *   RATE          KV namespace (binding name RATE)
 *   ALLOWED_ORIGIN "https://abduznik.github.io"
 */

const MAX = { id: 40, title: 80, desc: 200, prompt: 300, solution: 4000 };
const PER_HOUR = 5;

const json = (body, status = 200, origin = "*") =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "POST, GET, OPTIONS",
      "access-control-allow-headers": "content-type",
      "cache-control": "no-store",
    },
  });

const str = (v) => (typeof v === "string" ? v.trim() : "");

function validate(d) {
  const errors = [];
  const level = str(d.level_id);
  const title = str(d.title);
  const desc = str(d.desc);
  const prompt = str(d.prompt);
  const solution = str(d.solution);

  if (!/^[a-z0-9_]{3,40}$/.test(level)) errors.push("level_id must be 3-40 chars: a-z 0-9 _");
  if (title.length < 3 || title.length > MAX.title) errors.push(`title must be 3-${MAX.title} chars`);
  if (desc.length < 3 || desc.length > MAX.desc) errors.push(`desc must be 3-${MAX.desc} chars`);
  if (prompt.length < 1 || prompt.length > MAX.prompt) errors.push(`prompt must be 1-${MAX.prompt} chars`);
  if (solution.length < 10 || solution.length > MAX.solution) errors.push("solution missing or too long");
  if (!/def\s+solve\s*\(\s*\w*\s*\)\s*:/.test(solution)) errors.push("solution must define solve(prompt)");
  // Levels run in CI on the repo's runners. These are the things that turn a
  // level into an incident, so they are refused at the edge, not reviewed later.
  if (/\b(import\s+(os|subprocess|socket|shutil|ctypes)|__import__|eval\s*\(|exec\s*\(|open\s*\()/.test(solution))
    errors.push("solution may not use os/subprocess/socket/eval/exec/open");

  return { errors, data: { level, title, desc, prompt, solution } };
}

async function rateLimited(env, ip) {
  const key = `rl:${ip}`;
  const now = Date.now();
  const raw = await env.RATE.get(key);
  const hits = raw ? JSON.parse(raw).filter((t) => now - t < 3600_000) : [];
  if (hits.length >= PER_HOUR) return true;
  hits.push(now);
  await env.RATE.put(key, JSON.stringify(hits), { expirationTtl: 3600 });
  return false;
}

function issueBody(d, ua) {
  return [
    "Submitted through the Verifier site. The submitter is anonymous to GitHub.",
    "",
    `**Level id:** \`${d.level}\``,
    `**Title:** ${d.title}`,
    `**Description:** ${d.desc}`,
    "",
    "**Prompt**",
    "```",
    d.prompt,
    "```",
    "",
    "**Solution**",
    "```python",
    d.solution,
    "```",
    "",
    `_via verifier-api · ${new Date().toISOString()} · ${ua.slice(0, 120)}_`,
  ].join("\n");
}

export default {
  async fetch(req, env) {
    const origin = env.ALLOWED_ORIGIN || "*";
    const url = new URL(req.url);

    if (req.method === "OPTIONS") return json({}, 204, origin);
    if (url.pathname === "/api/health") return json({ ok: true }, 200, origin);
    if (url.pathname !== "/api/submit") return json({ error: "not found" }, 404, origin);
    if (req.method !== "POST") return json({ error: "POST only" }, 405, origin);

    let payload;
    try {
      payload = await req.json();
    } catch {
      return json({ error: "invalid JSON" }, 400, origin);
    }

    // Honeypot: real users never fill a hidden field.
    if (str(payload.website)) return json({ ok: true }, 200, origin);

    const { errors, data } = validate(payload);
    if (errors.length) return json({ error: errors.join("; ") }, 422, origin);

    const ip = req.headers.get("cf-connecting-ip") || "unknown";
    if (await rateLimited(env, ip)) {
      return json({ error: "Too many submissions. Try again in an hour." }, 429, origin);
    }

    const res = await fetch(`https://api.github.com/repos/${env.REPO}/issues`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.GITHUB_TOKEN}`,
        accept: "application/vnd.github+json",
        "content-type": "application/json",
        "user-agent": "verifier-api",
      },
      body: JSON.stringify({
        title: `[level] ${data.level}`,
        body: issueBody(data, req.headers.get("user-agent") || "unknown"),
        labels: ["level request"],
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.log("github error", res.status, detail.slice(0, 300));
      return json({ error: "Could not file the submission. Try again later." }, 502, origin);
    }

    const issue = await res.json();
    return json({ ok: true, issue: issue.number, url: issue.html_url }, 200, origin);
  },
};
