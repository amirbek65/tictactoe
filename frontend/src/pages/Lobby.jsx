import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Board from '../components/Board';
import { createGame, listGames, joinGame, makeMove, getGame } from '../api';
import { useAuth } from '../hooks/useAuth';
import './Lobby.css';

const WIN_COMBOS = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

function getWinLine(board) {
  for (const [a,b,c] of WIN_COMBOS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return [a,b,c];
  }
  return [];
}

const RESULT_LABELS = {
  x_wins: '✕ Победили крестики!',
  o_wins: '○ Победили нолики!',
  draw: '🤝 Ничья!',
  abandoned: '⚠ Игра прервана',
};

export default function Lobby() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [games, setGames] = useState([]);
  const [activeGame, setActiveGame] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [polling, setPolling] = useState(null);

  const fetchGames = useCallback(async () => {
    try {
      const res = await listGames();
      setGames(res.data);
    } catch {}
  }, []);

  const fetchActiveGame = useCallback(async (id) => {
    try {
      const res = await getGame(id);
      setActiveGame(res.data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchGames();
    const interval = setInterval(fetchGames, 5000);
    return () => clearInterval(interval);
  }, [fetchGames]);

  useEffect(() => {
    if (activeGame?.id && (activeGame.status === 'waiting' || activeGame.status === 'active')) {
      const interval = setInterval(() => fetchActiveGame(activeGame.id), 2000);
      return () => clearInterval(interval);
    }
  }, [activeGame?.id, activeGame?.status, fetchActiveGame]);

  const handleCreate = async () => {
    if (!user) return nav('/login');
    setLoading(true); setError('');
    try {
      const res = await createGame();
      setActiveGame(res.data);
    } catch { setError('Не удалось создать игру.'); }
    finally { setLoading(false); }
  };

  const handleJoin = async (gameId) => {
    if (!user) return nav('/login');
    setLoading(true); setError('');
    try {
      const res = await joinGame(gameId);
      setActiveGame(res.data);
    } catch { setError('Не удалось присоединиться.'); }
    finally { setLoading(false); }
  };

  const handleMove = async (pos) => {
    if (!activeGame) return;
    try {
      const res = await makeMove(activeGame.id, pos);
      setActiveGame(res.data);
    } catch (err) { setError(err.response?.data?.error || 'Ошибка хода.'); }
  };

  const leaveGame = () => { setActiveGame(null); fetchGames(); };

  if (activeGame) {
    const mySymbol = activeGame.player_x?.id === user?.id ? 'X' : 'O';
    const isMyTurn = activeGame.current_turn === mySymbol && activeGame.status === 'active';
    const opponent = mySymbol === 'X' ? activeGame.player_o : activeGame.player_x;
    const winLine = getWinLine(activeGame.board);
    const resultLabel = activeGame.result ? RESULT_LABELS[activeGame.result] : null;
    const iWon = (activeGame.result === 'x_wins' && mySymbol === 'X') ||
                 (activeGame.result === 'o_wins' && mySymbol === 'O');

    return (
      <div className="lobby-page">
        <div className="active-game">
          <div className="active-header">
            <div className="players-row">
              <div className={`player-chip ${mySymbol === 'X' ? 'chip-x' : 'chip-o'}`}>
                <span className="chip-symbol">{mySymbol === 'X' ? '✕' : '○'}</span>
                <span>{user?.username} (вы)</span>
              </div>
              <span className="vs-text">VS</span>
              <div className={`player-chip ${mySymbol === 'X' ? 'chip-o' : 'chip-x'}`}>
                <span className="chip-symbol">{mySymbol === 'X' ? '○' : '✕'}</span>
                <span>{opponent?.username || '⌛ Ждём...'}</span>
              </div>
            </div>
          </div>

          {error && <div className="error-msg">{error}</div>}

          {activeGame.status === 'waiting' ? (
            <div className="waiting-box">
              <div className="spinner" style={{margin: '0 auto 16px'}} />
              <p>Ожидание соперника...</p>
              <p className="game-id-hint">ID игры: <code>{activeGame.id}</code></p>
            </div>
          ) : (
            <>
              <div className="game-status-bar">
                {resultLabel ? (
                  <span className={iWon ? 'result-win' : activeGame.result === 'draw' ? 'result-draw' : 'result-lose'}>
                    {iWon ? '🏆 Вы победили!' : resultLabel}
                  </span>
                ) : isMyTurn ? (
                  <span className="status-your-turn">⚡ Ваш ход!</span>
                ) : (
                  <span className="status-wait">⌛ Ход соперника...</span>
                )}
              </div>
              <Board
                board={activeGame.board}
                onCellClick={handleMove}
                disabled={!isMyTurn}
                winLine={winLine}
                playerSymbol={mySymbol}
              />
            </>
          )}

          <div className="active-footer">
            {activeGame.status === 'finished' && (
              <button className="btn btn-primary" onClick={() => { leaveGame(); handleCreate(); }}>
                🔄 Новая игра
              </button>
            )}
            <button className="btn btn-ghost" onClick={leaveGame}>← Лобби</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lobby-page">
      <div className="lobby-content">
        <div className="lobby-header">
          <h1 className="page-title">Лобби</h1>
          <button className="btn btn-primary" onClick={handleCreate} disabled={loading}>
            {loading ? 'Создание...' : '+ Создать игру'}
          </button>
        </div>

        {error && <div className="error-msg">{error}</div>}

        {!user && (
          <div className="success-msg">
            🔐 <a href="/login" style={{color:'var(--accent)'}}>Войдите</a>, чтобы играть с другими игроками
          </div>
        )}

        <div className="games-list">
          <h3 className="list-title">Открытые игры ({games.length})</h3>
          {games.length === 0 ? (
            <div className="empty-state">
              <p>Нет открытых игр. Создайте свою!</p>
            </div>
          ) : (
            games.map(g => (
              <div key={g.id} className="game-row">
                <div className="game-row-info">
                  <span className="game-row-player">✕ {g.player_x?.username}</span>
                  <span className="badge badge-gray">vs</span>
                  <span className="game-row-player text-dim">○ Ожидание...</span>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => handleJoin(g.id)}
                  disabled={!user || loading || g.player_x?.id === user?.id}
                >
                  {g.player_x?.id === user?.id ? 'Ваша игра' : 'Присоединиться'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
