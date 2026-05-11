// simple in-memory token cache
let storedToken = null;
let tokenExpiry = 0;

function saveToken(token, expiresAt) {
  storedToken = token;
  tokenExpiry = expiresAt;
}

function getToken() {
  // expiresAt from the API is a unix timestamp in seconds
  if (!storedToken || Date.now() / 1000 >= tokenExpiry - 30) {
    return null;
  }
  return storedToken;
}

module.exports = { saveToken, getToken };
