import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

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
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });

    const systemContext = `
        You are a helpful gaming assistant who knows the user's Steam library.
        Here are all their games and playtime:
        ${games.map(game => {
            const hours = Math.floor(game.playtime_forever / 60);
            return `- ${game.name}: ${hours} hours played`
        }).join('\n')};
        
        Answer questions about their library conversationally.
        You can make recommendations, find patterns in what they play, calculate stats,
        and suggest what to play next.
        Keep responses concise and friendly.
    `

    const history = messages.slice(0, -1).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
    }));

    const chat = model.startChat({
        history: [
            {
                role: 'user',
                parts: [{ text: systemContext }]
            },
            {
                role: 'model',
                parts: [{ text: 'Got it! I can see your Steam library. What would you like to know?' }],
            },
            ...history
        ]
    });

    const lastMessage = messages[messages.length - 1]
    const result = await chat.sendMessage(lastMessage.content);
    return result.response.text();
}