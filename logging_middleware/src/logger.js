const { saveToken, getToken } = require("./tokenStore");

const LEVELS = new Set(["debug", "info", "warn", "error", "fatal"]);
const STACKS = new Set(["backend", "frontend"]);
const PACKAGES = new Set([
  "cache", "controller", "cron_job", "db", "domain", "handler", "repository", "route", "service",
  "auth", "config", "middleware", "utils", "api", "component", "hook", "page", "state", "style"
]);

const { BASE_URL, CLIENT_ID, CLIENT_SECRET, EMAIL, NAME, ROLL_NO, ACCESS_CODE } = process.env;

async function fetchFreshToken() {
  const url = `${BASE_URL}/auth`;
  const body = {
    email: EMAIL,
    name: NAME,
    rollNo: ROLL_NO,
    accessCode: ACCESS_CODE,
    clientID: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.text();
    throw new Error(`Auth failed (${res.status}): ${data}`);
  }

  const data = await res.json();
  const token = data.access_token;
  const expiresAt = Date.now() + Number(data.expires_in || 0) * 1000;

  saveToken(token, expiresAt);
  return token;
}

async function log(stack, level, pkg, message) {
  try {
    if (!STACKS.has(stack) || !LEVELS.has(level) || !PACKAGES.has(pkg)) {
      console.warn("Invalid log payload", { stack, level, package: pkg, message });
      return;
    }

    let token = getToken();
    if (!token) token = await fetchFreshToken();

    const url = `${BASE_URL}/logs`;
    const body = { stack, level, package: pkg, message };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (res.status !== 200) {
      const data = await res.text();
      console.warn(`Log failed (${res.status})`, data);
    }
  } catch (err) {
    console.warn("Logging middleware failed", err && err.message ? err.message : err);
  }
}

module.exports = { log, fetchFreshToken };
