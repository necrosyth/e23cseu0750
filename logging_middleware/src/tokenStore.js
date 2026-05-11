let store = null;

function saveToken(token, expiresAt) {
  store = { token, expiresAt };
}

function getToken() {
  if (!store) return null;
  if (Date.now() >= store.expiresAt) {
    store = null;
    return null;
  }
  return store.token;
}

module.exports = { saveToken, getToken };
