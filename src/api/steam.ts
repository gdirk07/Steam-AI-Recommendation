const SERVER_URL = 'http://localhost:3001';

export async function getGameLibrary(steamId: string) {
    const response = await fetch(`${SERVER_URL}/api/games/${steamId}`);
    if (!response.ok) {
        throw new Error('Failed to fetch games');
    }

    const data = await response.json();
    return data.response.games;
}