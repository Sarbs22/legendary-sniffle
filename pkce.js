function generateCodeVerifier(length = 128) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let verifier = '';
  for (let i = 0; i < length; i++) {
    verifier += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return verifier;
}

async function generateCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

document.getElementById('loginBtn').addEventListener('click', async () => {
  // Read from dedicated input instead of prompt
  const clientId = document.getElementById('clientIdInput').value.trim();
  if (!clientId) {
    alert('Client ID is required');
    return;
  }
  localStorage.setItem('client_id', clientId);

  const verifier = generateCodeVerifier();
  localStorage.setItem('code_verifier', verifier);

  const challenge = await generateCodeChallenge(verifier);
  const redirectUri = 'https://sarbs22.github.io/legendary-sniffle/callback.html';
  const scope = 'playlist-modify-private playlist-modify-public playlist-read-private';

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: scope,
    redirect_uri: redirectUri,
    code_challenge_method: 'S256',
    code_challenge: challenge
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
});
