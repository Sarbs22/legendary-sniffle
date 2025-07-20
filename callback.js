const redirectUri = 'https://sarbs22.github.io/legendary-sniffle/callback.html';

(async () => {
  const queryString = new URLSearchParams(window.location.search);
  const code = queryString.get('code');
  if (!code) return;

  const codeVerifier = localStorage.getItem('code_verifier');
  const clientId = localStorage.getItem('client_id');

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: codeVerifier
  });

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  const data = await res.json();
  localStorage.setItem('access_token', data.access_token);
  window.location.href = 'index.html';
})();
