import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const handleLogout = async () => {
    await logout();
    nav('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        <span className="logo-x">✕</span>
        <span className="logo-text">TicTacToe</span>
        <span className="logo-o">○</span>
      </Link>
      <div className="navbar-links">
        {user ? (
          <>
            <Link to="/play" className="nav-link">Играть</Link>
            <Link to="/lobby" className="nav-link">Лобби</Link>
            <Link to="/leaderboard" className="nav-link">Рейтинг</Link>
            <Link to="/profile" className="nav-link nav-link-user">
              <span className="user-dot" />
              {user.username}
            </Link>
            <button onClick={handleLogout} className="btn btn-ghost btn-sm">Выйти</button>
          </>
        ) : (
          <>
            <Link to="/leaderboard" className="nav-link">Рейтинг</Link>
            <Link to="/login" className="btn btn-ghost btn-sm">Войти</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Регистрация</Link>
          </>
        )}
      </div>
    </nav>
  );
}
