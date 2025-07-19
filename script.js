const clientId = '45f2da97267d44bcb687ef81ba36986a'; // Replace with your actual Client ID
const redirectUri = 'https://sarbs22.github.io/legendary-sniffle/callback.html';
let accessToken = null;

document.getElementById('loginBtn').onclick = async () => {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  localStorage.setItem('code_verifier', codeVerifier);

  const scope = 'playlist-modify-public playlist-modify-private user-read-private';
  const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(redirectUri)}&code_challenge_method=S256&code_challenge=${codeChallenge}`;

  window.location = authUrl;
};

document.getElementById('createPlaylistBtn').onclick = async () => {
  const raw = document.getElementById('trackIds').value.trim();
  const uris = raw.split(/\s+/).map(id => id.includes(':') ? id : `spotify:track:${id}`);

  const userRes = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const user = await userRes.json();

  const playlistRes = await fetch(`https://api.spotify.com/v1/users/${user.id}/playlists`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'PKCE Playlist',
      description: 'Made via PKCE Flow',
      public: false
    })
  });
  const playlist = await playlistRes.json();

  await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ uris })
  });

  alert(`Playlist "${playlist.name}" created!`);
};

// Load access token from sessionStorage
window.onload = () => {
  const stored = sessionStorage.getItem('access_token');
  if (stored) {
    accessToken = stored;
    document.getElementById('createPlaylistBtn').disabled = false;
  }
};
