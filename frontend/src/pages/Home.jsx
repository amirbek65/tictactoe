import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Home.css';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="home">
      <div className="home-hero">
        <div className="hero-glyph">
          <div className="glyph-grid">
            {['✕','○','✕','○','✕','○','✕','○','✕'].map((s, i) => (
              <span key={i} className={`glyph-cell glyph-${s === '✕' ? 'x' : 'o'}`}>{s}</span>
            ))}
          </div>
        </div>
        <div className="hero-content">
          <p className="hero-subtitle">MULTI &amp; SINGLE PLAYER</p>
          <h1 className="hero-title">
            <span className="title-x">TIC</span>
            <span className="title-sep"> · </span>
            <span className="title-o">TAC</span>
            <span className="title-sep"> · </span>
            <span className="title-p">TOE</span>
          </h1>
          <p className="hero-desc">
            Крестики-нолики нового поколения. Играй против AI или против живых игроков. 
            Регистрируйся через Telegram и отслеживай свой прогресс.
          </p>
          <div className="hero-actions">
            {user ? (
              <>
                <Link to="/play" className="btn btn-primary">⚔ Играть сейчас</Link>
                <Link to="/lobby" className="btn btn-ghost">🌐 Лобби</Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary">Начать играть</Link>
                <Link to="/login" className="btn btn-ghost">Войти</Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="home-features">
        <div className="feature-card">
          <div className="feature-icon">🤖</div>
          <h3>Игра с AI</h3>
          <p>Три уровня сложности: лёгкий, средний и сложный. Minimax алгоритм не даст пощады.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">⚔️</div>
          <h3>Мультиплеер</h3>
          <p>Открытое лобби для поиска соперников. Играй в реальном времени против живых игроков.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🔐</div>
          <h3>Telegram Auth</h3>
          <p>Безопасная двухфакторная авторизация через Telegram бот. Никакого лишнего спама.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📊</div>
          <h3>Рейтинг</h3>
          <p>Таблица лидеров с Win Rate. Соревнуйся с другими игроками за первое место.</p>
        </div>
      </div>
    </div>
  );
}
