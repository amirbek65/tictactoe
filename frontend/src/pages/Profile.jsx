import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getLeaderboard } from '../api';
import './Profile.css';

export function Profile() {
  const { user } = useAuth();

  if (!user) return (
    <div className="profile-page">
      <div className="card" style={{maxWidth:400,margin:'0 auto',textAlign:'center'}}>
        <p>Войдите, чтобы увидеть профиль</p>
      </div>
    </div>
  );

  return (
    <div className="profile-page">
      <div className="profile-card card">
        <div className="profile-top">
          <div className="profile-avatar">
            {user.username[0].toUpperCase()}
          </div>
          <div>
            <h1 className="profile-name">{user.username}</h1>
            <div className="profile-badges">
              {user.is_verified && <span className="badge badge-cyan">✓ Верифицирован</span>}
              {user.telegram_username && (
                <span className="badge badge-purple">@{user.telegram_username}</span>
              )}
            </div>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-box">
            <div className="stat-value">{user.games_played}</div>
            <div className="stat-label">Игр сыграно</div>
          </div>
          <div className="stat-box stat-win">
            <div className="stat-value">{user.games_won}</div>
            <div className="stat-label">Побед</div>
          </div>
          <div className="stat-box stat-lose">
            <div className="stat-value">{user.games_lost}</div>
            <div className="stat-label">Поражений</div>
          </div>
          <div className="stat-box stat-draw">
            <div className="stat-value">{user.games_draw}</div>
            <div className="stat-label">Ничьих</div>
          </div>
        </div>

        <div className="winrate-bar-wrap">
          <div className="winrate-label">
            <span>Win Rate</span>
            <span className="winrate-val">{user.win_rate}%</span>
          </div>
          <div className="winrate-bar">
            <div className="winrate-fill" style={{width: `${user.win_rate}%`}} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    getLeaderboard()
      .then(r => setLeaders(r.data))
      .finally(() => setLoading(false));
  }, []);

  const medalMap = ['🥇','🥈','🥉'];

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-content">
        <h1 className="page-title">🏆 Таблица лидеров</h1>
        {loading ? (
          <div className="loading-center"><div className="spinner"/></div>
        ) : leaders.length === 0 ? (
          <div className="empty-state card">
            <p>Пока никто не сыграл ни одной игры. Будьте первым!</p>
          </div>
        ) : (
          <div className="leaders-list">
            <div className="leaders-header">
              <span>#</span>
              <span>Игрок</span>
              <span>Игр</span>
              <span>Побед</span>
              <span>Win Rate</span>
            </div>
            {leaders.map((p, i) => (
              <div key={p.username} className={`leader-row ${p.username === user?.username ? 'leader-me' : ''}`}>
                <span className="leader-rank">{medalMap[i] || i + 1}</span>
                <span className="leader-name">
                  {p.username}
                  {p.username === user?.username && <span className="badge badge-cyan" style={{marginLeft:8}}>вы</span>}
                </span>
                <span className="leader-stat">{p.games_played}</span>
                <span className="leader-stat text-win">{p.games_won}</span>
                <span className="leader-winrate">{p.win_rate}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
