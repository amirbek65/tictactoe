import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Board from '../components/Board';
import { createAIGame, makeAIMove } from '../api';
import './Play.css';

const RESULT_MAP = {
  player_wins: { label: '🏆 Вы победили!', cls: 'result-win' },
  ai_wins: { label: '🤖 AI победил', cls: 'result-lose' },
  draw: { label: '🤝 Ничья!', cls: 'result-draw' },
};

function getWinLine(board) {
  const combos = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for (const [a,b,c] of combos) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return [a,b,c];
  }
  return [];
}

export default function Play() {
  const [mode, setMode] = useState(null); // 'ai' | 'multi'
  const [difficulty, setDifficulty] = useState('medium');
  const [playerSymbol, setPlayerSymbol] = useState('X');
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiThinking, setAiThinking] = useState(false);
  const nav = useNavigate();

  const startAIGame = async () => {
    setLoading(true); setError('');
    try {
      const res = await createAIGame(difficulty, playerSymbol);
      setGame(res.data);
    } catch {
      setError('Не удалось начать игру.');
    } finally { setLoading(false); }
  };

  const handleCellClick = async (pos) => {
    if (!game || game.status !== 'active') return;
    if (game.current_turn !== game.player_symbol) return;
    if (game.board[pos]) return;

    setAiThinking(true);
    try {
      const res = await makeAIMove(game.id, pos);
      setGame(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка хода.');
    } finally { setAiThinking(false); }
  };

  const resetGame = () => { setGame(null); setError(''); };

  const isMyTurn = game && game.current_turn === game.player_symbol && game.status === 'active';
  const winLine = game ? getWinLine(game.board) : [];
  const resultInfo = game?.result ? RESULT_MAP[game.result] : null;

  if (!mode) {
    return (
      <div className="play-page">
        <div className="mode-select">
          <h1 className="page-title">Выберите режим</h1>
          <div className="mode-cards">
            <button className="mode-card" onClick={() => setMode('ai')}>
              <div className="mode-icon">🤖</div>
              <h3>Vs AI</h3>
              <p>Играй против компьютера. Выбери уровень сложности.</p>
            </button>
            <button className="mode-card" onClick={() => nav('/lobby')}>
              <div className="mode-icon">⚔️</div>
              <h3>Мультиплеер</h3>
              <p>Найди соперника в открытом лобби или создай свою игру.</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'ai' && !game) {
    return (
      <div className="play-page">
        <div className="setup-card card">
          <h2 className="setup-title">Настройки игры с AI</h2>
          {error && <div className="error-msg">{error}</div>}
          <div className="input-group">
            <label>Сложность</label>
            <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
              <option value="easy">Лёгкий 😊</option>
              <option value="medium">Средний 🤔</option>
              <option value="hard">Сложный 💀</option>
            </select>
          </div>
          <div className="input-group">
            <label>Играть за</label>
            <div className="symbol-choose">
              <button
                className={`symbol-btn ${playerSymbol === 'X' ? 'active-x' : ''}`}
                onClick={() => setPlayerSymbol('X')}
              >✕ Крестики (ходят первые)</button>
              <button
                className={`symbol-btn ${playerSymbol === 'O' ? 'active-o' : ''}`}
                onClick={() => setPlayerSymbol('O')}
              >○ Нолики (ходят вторые)</button>
            </div>
          </div>
          <div className="setup-actions">
            <button className="btn btn-primary" onClick={startAIGame} disabled={loading}>
              {loading ? 'Запуск...' : '⚔ Начать игру'}
            </button>
            <button className="btn btn-ghost" onClick={() => setMode(null)}>← Назад</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="play-page">
      <div className="game-area">
        <div className="game-header">
          <div className="game-info">
            <span className="badge badge-purple">VS AI · {difficulty === 'easy' ? 'Лёгкий' : difficulty === 'medium' ? 'Средний' : 'Сложный'}</span>
            <span className="badge badge-cyan">Вы: {game?.player_symbol === 'X' ? '✕' : '○'}</span>
          </div>
          <h2 className="game-status">
            {resultInfo ? (
              <span className={resultInfo.cls}>{resultInfo.label}</span>
            ) : aiThinking ? (
              <span className="status-thinking">🤖 AI думает...</span>
            ) : isMyTurn ? (
              <span className="status-your-turn">Ваш ход!</span>
            ) : (
              <span className="status-wait">Ожидание...</span>
            )}
          </h2>
        </div>

        <Board
          board={game?.board}
          onCellClick={handleCellClick}
          disabled={!isMyTurn || aiThinking}
          winLine={winLine}
          playerSymbol={game?.player_symbol}
        />

        {resultInfo && (
          <div className="game-actions">
            <button className="btn btn-primary" onClick={startAIGame}>🔄 Ещё раз</button>
            <button className="btn btn-ghost" onClick={resetGame}>Сменить настройки</button>
          </div>
        )}

        <div className="turn-indicator">
          <div className={`turn-x ${game?.current_turn === 'X' && game?.status === 'active' ? 'active' : ''}`}>
            ✕
          </div>
          <span className="turn-vs">vs</span>
          <div className={`turn-o ${game?.current_turn === 'O' && game?.status === 'active' ? 'active' : ''}`}>
            ○
          </div>
        </div>
      </div>
    </div>
  );
}
