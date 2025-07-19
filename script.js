const clientId = '45f2da97267d44bcb687ef81ba36986a';
const redirectUri = 'https://ryansarbello.github.io/spotify-playlist-generator/';

function getAccessToken() {
  const hash = window.location.hash;
  if (hash) {
    const params = new URLSearchParams(hash.slice(1));
    return params.get('access_token');
  }
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=playlist-modify-private playlist-modify-public user-read-private`;
  window.location.href = authUrl;
}

async function fetchWebApi(endpoint, method, token, body) {
  const res = await fetch(`https://api.spotify.com/${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : null
  });

  return await res.json();
}

document.getElementById('createPlaylist').onclick = async () => {
  const token = getAccessToken();
  if (!token) return;

  const rawInput = document.getElementById('trackIds').value.trim();
  const trackUris = rawInput
    .split(/\s+/)
    .map(id => id.includes('spotify:track:') ? id : `spotify:track:${id}`);

  const user = await fetchWebApi('v1/me', 'GET', token);
  const playlist = await fetchWebApi(`v1/users/${user.id}/playlists`, 'POST', token, {
    name: 'Generated Playlist',
    description: 'Created from pasted track IDs',
    public: false
  });

  await fetchWebApi(`v1/playlists/${playlist.id}/tracks`, 'POST', token, {
    uris: trackUris
  });

  alert(`Playlist "${playlist.name}" created!`);
};
