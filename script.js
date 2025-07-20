window.onload = async () => {
  // 1) Grab the stored token
  const token = sessionStorage.getItem('access_token');
  if (!token) return;                    // not logged in yet

  // 2) Enable the button
  document.getElementById('createPlaylistBtn').disabled = false;
  const headers = { Authorization: `Bearer ${token}` };

  // 3) Fetch current user
  const user = await fetch('https://api.spotify.com/v1/me', { headers }).then(r => r.json());

  // 4) Fetch and populate your existing playlists
  const playlistsData = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', { headers })
    .then(r => r.json());
  const select = document.getElementById('playlistSelect');

  // Clear any old options except “new”
  select.querySelectorAll('option:not([value="new"])').forEach(o => o.remove());

  playlistsData.items.forEach(pl => {
    const opt = document.createElement('option');
    opt.value = pl.id;
    opt.textContent = pl.name;
    select.appendChild(opt);
  });

  // 5) Handle Create/Add button
  document.getElementById('createPlaylistBtn').onclick = async () => {
    // Parse track URIs (unlimited, batched in 100s)
    const raw = document.getElementById('trackIds').value;
    const uris = raw
      .split(/\s+/)
      .filter(Boolean)
      .map(id => id.includes(':') ? id : `spotify:track:${id}`);

    let playlistId, playlistName;

    if (select.value === 'new') {
      // Create new if “new” selected
      const name = document.getElementById('newPlaylistName').value || 'New Playlist';
      const pl = await fetch(`https://api.spotify.com/v1/users/${user.id}/playlists`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, public: false })
      }).then(r => r.json());
      playlistId = pl.id;
      playlistName = pl.name;
    } else {
      // Otherwise use selected playlist
      playlistId = select.value;
      playlistName = select.options[select.selectedIndex].text;
    }

    // Batch-add in groups of 100
    for (let i = 0; i < uris.length; i += 100) {
      const batch = uris.slice(i, i + 100);
      await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ uris: batch })
      });
    }

    alert(`✅ Added ${uris.length} tracks to "${playlistName}"`);
  };
};
