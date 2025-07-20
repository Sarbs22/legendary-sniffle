window.onload = async () => {
  // 1) Populate Client ID input if we saved it before
  const clientIdInput = document.getElementById('clientIdInput');
  const savedClient = localStorage.getItem('client_id');
  if (savedClient) {
    clientIdInput.value = savedClient;
  }

  // 2) Check for access token
  const token = sessionStorage.getItem('access_token');
  if (!token) return;  // Not logged in yet

  document.getElementById('createPlaylistBtn').disabled = false;
  const headers = { Authorization: `Bearer ${token}` };

  // 3) Get current user
  const user = await fetch('https://api.spotify.com/v1/me', { headers }).then(r => r.json());

  // 4) Fetch & populate existing playlists
  const data = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', { headers })
    .then(r => r.json());
  const select = document.getElementById('playlistSelect');

  // remove old options (except “new”)
  select.querySelectorAll('option:not([value="new"])').forEach(o => o.remove());

  data.items.forEach(pl => {
    const opt = document.createElement('option');
    opt.value = pl.id;
    opt.textContent = pl.name;
    select.appendChild(opt);
  });

  // 5) Handle Create/Add button
  document.getElementById('createPlaylistBtn').addEventListener('click', async () => {
    // parse URIs, any length, chunk in 100s
    const raw = document.getElementById('trackIds').value;
    const uris = raw.split(/\s+/).filter(Boolean).map(id =>
      id.includes(':') ? id : `spotify:track:${id}`
    );

    let playlistId, playlistName;
    if (select.value === 'new') {
      // create new
      const name = document.getElementById('newPlaylistName').value || 'New Playlist';
      const pl = await fetch(`https://api.spotify.com/v1/users/${user.id}/playlists`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, public: false })
      }).then(r => r.json());
      playlistId = pl.id;
      playlistName = pl.name;
    } else {
      // use existing
      playlistId = select.value;
      playlistName = select.options[select.selectedIndex].text;
    }

    // batch-add
    for (let i = 0; i < uris.length; i += 100) {
      const batch = uris.slice(i, i + 100);
      await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ uris: batch })
      });
    }

    alert(`✅ Added ${uris.length} tracks to "${playlistName}"`);
  });
};
