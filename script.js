window.onload = async () => {
  const token = sessionStorage.getItem('access_token');
  if (!token) return;

  document.getElementById('createPlaylistBtn').disabled = false;
  const headers = { Authorization: `Bearer ${token}` };

  const user = await fetch('https://api.spotify.com/v1/me', { headers }).then(r => r.json());
  const playlists = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', { headers })
    .then(r => r.json());

  const select = document.getElementById('playlistSelect');
  playlists.items.forEach(pl => {
    const opt = document.createElement('option');
    opt.value = pl.id;
    opt.textContent = pl.name;
    select.appendChild(opt);
  });

  document.getElementById('createPlaylistBtn').addEventListener('click', async () => {
    const raw = document.getElementById('trackIds').value;
    const uris = raw
      .split(/\s+/)
      .filter(Boolean)
      .map(id => id.includes(':') ? id : `spotify:track:${id}`);

    let playlistId, playlistName;
    if (select.value === 'new') {
      const name = document.getElementById('newPlaylistName').value || 'New Playlist';
      const pl = await fetch(`https://api.spotify.com/v1/users/${user.id}/playlists`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, public: false })
      }).then(r => r.json());
      playlistId = pl.id;
      playlistName = pl.name;
    } else {
      playlistId = select.value;
      playlistName = select.options[select.selectedIndex].text;
    }

    for (let i = 0; i < uris.length; i += 100) {
      const batch = uris.slice(i, i + 100);
      await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ uris: batch })
      });
    }

    alert(`Added ${uris.length} tracks to "${playlistName}"`);
  });
};
