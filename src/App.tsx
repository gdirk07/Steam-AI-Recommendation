import { useState, useEffect } from 'react';
import { getGameLibrary } from './api/steam';
import { chatWithLibrary } from './api/gemini';

interface Game {
  appid: number,
  name: string,
  playtime_forever: number,
  img_icon_url: string,
}

interface Message {
  role: 'user' | 'assistant'
  content: string,
}

function App() {
  const [steamId, setSteamId] = useState('');
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);


  async function handleLoadLibrary() {
    setLoading(true);
    setError('');
    try {
      const library = await getGameLibrary(steamId);
      const sorted = library.sort((a: Game, b: Game) => (
        a.name > b.name ? 1 : -1
      ));
      setGames(sorted);
      setMessages([{
        role: 'assistant',
        content: `Library loaded! You have ${sorted.length} games, Ask me anything`,
      }]);
    } catch (err) {
      setError(`Failed to load Library: ${err}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendMessage() {
    if (!input.trim() || chatLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    const updateMessages = [...messages, userMessage];

    setMessages(updateMessages);
    setInput('');
    setChatLoading(true);

    try {
      const reply = await chatWithLibrary(games, updateMessages);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Something went wrong. Try again.',
      }]);
    } finally {
      setChatLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  function getGameIconUrl(appid: number, iconHash: string) {
    return `https://media.steampowered.com/steamcommunity/public/images/apps/${appid}/${iconHash}.jpg`;
  }

  useEffect(() => {
    if (import.meta.env.VITE_STEAM_ID) setSteamId(import.meta.env.VITE_STEAM_ID)
  }, [])

  return (
    <div style={{ maxWidth: '1000px', margin: '0', padding: '20px' }}>
      <h1>Steam AI Recommendation</h1>

      {/* Steam ID input */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>      
        <input
          value={steamId}
          onChange={e => setSteamId(e.target.value)}
          style={{ flex: 1, padding: '8px' }}
        />
        <button onClick={handleLoadLibrary} disabled={loading}>
          {loading ? 'loading...' : 'Load library'}
        </button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {games.length > 0 && (
        <div style={{ display: 'flex', gap: '20px'}}>

          {/* Game List */}
          <div style={{ flex: 1, maxHeight: '600px', overflowY: 'auto'}}>
            <p style={{ marginBottom: '12px' }}>
              {games.length} games
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {games.map(game => (
                <div
                  key={game.appid}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                >
                  {game.img_icon_url && (
                    <img
                      src={getGameIconUrl(game.appid, game.img_icon_url)}
                      alt={game.name}
                      width={32}
                      height={32}
                    />
                  )}
                  <span style={{ flex: 1 }}>{game.name}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Chat */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            height: '600px',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}>

            {/* Messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    background: msg.role === 'user' ? '$0070f3' : '$f0f0f0',
                    color: msg.role === 'user' ? 'white' : 'black',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    maxWidth: '80%',
                    fontSize: '14px',
                  }}
                >
                  {msg.content}
                </div>
              ))}
              {chatLoading && (
                <div style={{
                  alignSelf: 'flex-start',
                  color: '#666',
                  fontSize: '14px',
                  padding: '8px 12px',
                }}>
                  Thinking...
                </div>
              )}
            </div>

            {/* Input */}
            <div style={{
              display: 'flex',
              gap: '8px',
              padding: '12px',
              borderTop: '1px solid #ccc'
            }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What should I play next?"
                style={{ flex: 1, padding: '8px' }}
                disabled={chatLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={chatLoading || !input.trim()}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
