window.onload = () => {
  const token = sessionStorage.getItem('access_token');
  const btn = document.getElementById('exportBtn');
  const status = document.getElementById('status');
  const link = document.getElementById('downloadLink');

  if (!token) {
    status.textContent = '⚠️ Please log in first on the main page.';
    return;
  }
  btn.disabled = false;
  const headers = { Authorization: `Bearer ${token}` };

  btn.onclick = async () => {
    btn.disabled = true;
    status.textContent = 'Fetching playlist…';

    // 1) Extract playlist ID
    let raw = document.getElementById('playlistUri').value.trim();
    let match = raw.match(/playlist\/([a-zA-Z0-9]+)/);
    const playlistId = match ? match[1] : raw;

    // 2) Pull all tracks (paginated)
    let tracks = [];
    let url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;
    while (url) {
      const resp = await fetch(url, { headers });
      const data = await resp.json();
      data.items.forEach(item => { if (item.track) tracks.push(item.track); });
      url = data.next;
    }
    status.textContent = `Fetched ${tracks.length} tracks…`;

    // 3) Fetch audio features in batches of 100
    const audioMap = {};
    for (let i = 0; i < tracks.length; i += 100) {
      const batch = tracks.slice(i, i+100).map(t => t.id).join(',');
      const resp = await fetch(`https://api.spotify.com/v1/audio-features?ids=${batch}`, { headers });
      const json = await resp.json();
      json.audio_features.forEach(f => { if (f) audioMap[f.id] = f; });
    }

    // 4) Fetch artist genres in batches of 50
    const artistIds = [...new Set(tracks.flatMap(t => t.artists.map(a => a.id)))];
    const artistMap = {};
    for (let i = 0; i < artistIds.length; i += 50) {
      const batch = artistIds.slice(i, i+50).join(',');
      const resp = await fetch(`https://api.spotify.com/v1/artists?ids=${batch}`, { headers });
      const json = await resp.json();
      json.artists.forEach(a => { artistMap[a.id] = a.genres; });
    }

    // 5) Build rows
    const rows = tracks.map(t => {
      const artists = t.artists.map(a => a.name).join('; ');
      const genres = [...new Set(t.artists.flatMap(a => artistMap[a.id] || []))].join('; ');
      const af = audioMap[t.id] || {};
      return {
        'Track URI': t.uri,
        'Track Name': t.name,
        'Album Name': t.album.name,
        'Artist Name(s)': artists,
        'Release Date': t.album.release_date,
        'Popularity': t.popularity,
        'Genres': genres,
        'Danceability': af.danceability ?? '',
        'Energy': af.energy ?? '',
        'Key': af.key ?? '',
        'Loudness': af.loudness ?? '',
        'Speechiness': af.speechiness ?? '',
        'Acousticness': af.acousticness ?? '',
        'Instrumentalness': af.instrumentalness ?? '',
        'Liveness': af.liveness ?? '',
        'Valence': af.valence ?? '',
        'Tempo': af.tempo ?? ''
      };
    });

    // 6) Generate CSV text
    const headersArr = Object.keys(rows[0]);
    const csv = [
      headersArr.join(','),
      ...rows.map(r => headersArr.map(h => `"${(r[h]||'').toString().replace(/"/g,'""')}"`).join(','))
    ].join('\n');

    // 7) Offer download
    const blob = new Blob([csv], { type: 'text/csv' });
    const urlBlob = URL.createObjectURL(blob);
    link.href = urlBlob;
    link.download = `playlist_${playlistId}.csv`;
    link.textContent = '⬇️ Download CSV';
    link.style.display = 'block';
    status.textContent = 'Done!';
  };
};
