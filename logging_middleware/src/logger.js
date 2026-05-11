const { saveToken, getToken } = require('./tokenStore');
require('dotenv').config();

const BASE_URL = process.env.BASE_URL;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const EMAIL = process.env.EMAIL;
const ROLL_NO = process.env.ROLL_NO;
const ACCESS_CODE = process.env.ACCESS_CODE;
const NAME = process.env.NAME;

// fetches a fresh auth token from the test server
async function fetchToken() {
  const res = await fetch(`${BASE_URL}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: EMAIL,
      name: NAME,
      rollNo: ROLL_NO,
      accessCode: ACCESS_CODE,
      clientID: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
    }),
  });

  const data = await res.json();
  saveToken(data.access_token, data.expires_in);
  return data.access_token;
}

async function log(stack, level, pkg, message) {
  try {
    let token = getToken();
    if (!token) {
      token = await fetchToken();
    }

    await fetch(`${BASE_URL}/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        stack: stack,
        level: level,
        package: pkg,
        message: message,
      }),
    });
  } catch (err) {
    // if logging itself fails, just warn never crash the app because of a log call
    console.warn('logging failed:', err.message);
  }
}

module.exports = { log };
