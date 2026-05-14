import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

import { GoogleGenerativeAI } from '@google/generative-ai';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/games/:steamId', async (req, res) => {
  const { steamId } = req.params;
  const response = await axios.get(
    `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/`,
    { params: {
      key: process.env.STEAM_API_KEY,
      steamid: steamId,
      include_appinfo: true,
      include_played_free_games: true,
      format: 'json',
    }}
  );
  res.json(response.data)
});

app.post('/api/chat', async (req, res) => {
  console.log(req.body);
  const { games, messages } = req.body;

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

  const lastMessage = messages[messages.length - 1];
  const result = await chat.sendMessage(lastMessage.content);
  res.json({ reply: result.response.text() });
})
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));