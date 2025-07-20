window.onload = async () => {
  const accessToken = localStorage.getItem('access_token');
  const clientIdInput = document.getElementById('clientIdInput');
  const storedClientId = localStorage.getItem('client_id');

  if (storedClientId) clientIdInput.value = storedClientId;
  if (!accessToken) return;

  document.getElementById('createPlaylistBtn').disabled = false;

  const user = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${accessToken}` }
  }).then(res => res.json());

  const playlists = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
    headers: { Authorization: `Bearer ${accessToken}` }
  }).then(res => res.json());

  const select = document.getElementById('playlistSelect');
  playlists.items.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name;
    select.appendChild(opt);
  });

  document.getElementById('createPlaylistBtn').onclick = async () => {
    let playlistId, playlistName;
    const trackInput = document.getElementById('trackIds').value;
    const trackUris = trackInput
      .split(/\s+/)
      .map(id => id.trim())
      .filter(Boolean)
      .map(id => id.includes(':') ? id : `spotify:track:${id}`);

    if (select.value === 'new') {
      const name = document.getElementById('newPlaylistName').value || 'New Playlist';
      const playlist = await fetch(`https://api.spotify.com/v1/users/${user.id}/playlists`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          description: 'Created with PKCE',
          public: false
        })
      }).then(res => res.json());
      playlistId = playlist.id;
      playlistName = playlist.name;
    } else {
      playlistId = select.value;
      playlistName = select.options[select.selectedIndex].text;
    }

    for (let i = 0; i < trackUris.length; i += 100) {
      const batch = trackUris.slice(i, i + 100);
      await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ uris: batch })
      });
    }

    alert(`Added ${trackUris.length} tracks to "${playlistName}"`);
  };
};
