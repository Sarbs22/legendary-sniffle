const clientId = '45f2da97267d44bcb687ef81ba36986a'; // Replace this
const redirectUri = 'https://sarbs22.github.io/legendary-sniffle/callback.html';
let accessToken = null;

document.getElementById('loginBtn').onclick = async () => {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  localStorage.setItem('code_verifier', codeVerifier);

  const scope = 'playlist-modify-private playlist-modify-public user-read-private playlist-read-private';
  const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(redirectUri)}&code_challenge_method=S256&code_challenge=${codeChallenge}`;

  window.location = authUrl;
};

document.getElementById('createPlaylistBtn').onclick = async () => {
  const raw = document.getElementById('trackIds').value.trim();
  const uris = raw
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(id => id.includes(':') ? id : `spotify:track:${id}`);

  const userRes = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const user = await userRes.json();

  const playlistSelect = document.getElementById('playlistSelect');
  let playlistId;
  let playlistName;

  if (playlistSelect.value === 'new') {
    const name = document.getElementById('newPlaylistName').value || 'Generated Playlist';
    const playlistRes = await fetch(`https://api.spotify.com/v1/users/${user.id}/playlists`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: name,
        description: 'Created using PKCE playlist generator',
        public: false
      })
    });
    const playlist = await playlistRes.json();
    playlistId = playlist.id;
    playlistName = playlist.name;
  } else {
    playlistId = playlistSelect.value;
    playlistName = playlistSelect.options[playlistSelect.selectedIndex].text;
  }

  const chunkSize = 100;
  for (let i = 0; i < uris.length; i += chunkSize) {
    const chunk = uris.slice(i, i + chunkSize);
    await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ uris: chunk })
    });
  }

  alert(`✅ Added ${uris.length} tracks to "${playlistName}"`);
};

window.onload = async () => {
  const stored = sessionStorage.getItem('access_token');
  if (!stored) return;

  accessToken = stored;
  document.getElementById('createPlaylistBtn').disabled = false;

  try {
    const res = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const data = await res.json();

    if (!data.items) {
      console.error('No playlists found or token not authorized');
      return;
    }

    const select = document.getElementById('playlistSelect');

    data.items.forEach(pl => {
      const opt = document.createElement('option');
      opt.value = pl.id;
      opt.textContent = pl.name;
      select.appendChild(opt);
    });

    console.log(`✅ Loaded ${data.items.length} playlists into dropdown`);

  } catch (err) {
    console.error('🚨 Failed to fetch playlists:', err);
  }
};
