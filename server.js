import express from 'express'
import cors from 'cors'
import axios from 'axios'
import dotenv from 'dotenv'
dotenv.config()

const app = express()
app.use(cors())

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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));