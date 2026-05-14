const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

interface Game {
    name: string,
    playtime_forever: number
}

interface Message {
    role: 'user' | 'assistant'
    content: string,
}

export async function chatWithLibrary(
    games: Game[],
    messages: Message[]
) {
    const response = await fetch(`${SERVER_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ games, messages })
    });
    const data = await response.json();
    return data.reply;
}