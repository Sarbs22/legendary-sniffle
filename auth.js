const redirectUri = 'https://sarbs22.github.io/legendary-sniffle/callback.html';
const scopes = 'playlist-modify-private playlist-modify-public playlist-read-private';

function generateCodeVerifier(length) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map(x => possible.charAt(x % possible.length))
    .join('');
}

function generateCodeChallenge(codeVerifier) {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier)).then(hash =>
    btoa(String.fromCharCode(...new Uint8Array(hash)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
  );
}

async function login() {
  const clientId = document.getElementById('clientIdInput').value;
  if (!clientId) {
    alert('Please enter your Client ID');
    return;
  }

  localStorage.setItem('client_id', clientId);

  const codeVerifier = generateCodeVerifier(128);
  localStorage.setItem('code_verifier', codeVerifier);

  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = btoa(crypto.getRandomValues(new Uint8Array(12)).join(''));

  const url = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}` +
    `&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${state}&code_challenge_method=S256&code_challenge=${codeChallenge}`;

  window.location = url;
}

document.getElementById('loginBtn').addEventListener('click', login);
