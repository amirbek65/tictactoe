import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginStep1, loginStep2 } from '../api';
import { useAuth } from '../hooks/useAuth';
import './Auth.css';

export default function Login() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ username: '', password: '' });
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const nav = useNavigate();

  const handleStep1 = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await loginStep1(form);
      setSuccess('Код для входа отправлен в ваш Telegram!');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Неверный логин или пароль.');
    } finally { setLoading(false); }
  };

  const handleStep2 = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await loginStep2({ username: form.username, code });
      setUser(res.data.user);
      nav('/play');
    } catch (err) {
      setError(err.response?.data?.error || 'Неверный код.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-header">
          <h1 className="auth-title">
            {step === 1 ? 'Вход' : 'Подтверждение'}
          </h1>
          <p className="auth-sub">
            {step === 1 ? 'Войдите в свой аккаунт' : 'Введите код из Telegram'}
          </p>
        </div>

        {error && <div className="error-msg">⚠ {error}</div>}
        {success && <div className="success-msg">✓ {success}</div>}

        {step === 1 ? (
          <form onSubmit={handleStep1}>
            <div className="input-group">
              <label>Имя пользователя</label>
              <input
                type="text"
                placeholder="username"
                value={form.username}
                onChange={e => setForm(f => ({...f, username: e.target.value}))}
                required
              />
            </div>
            <div className="input-group">
              <label>Пароль</label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({...f, password: e.target.value}))}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Проверка...' : 'Отправить код в Telegram →'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleStep2}>
            <div className="tg-code-hint">
              <div className="tg-icon">✈️</div>
              <div>
                <strong>Бот прислал код входа</strong>
                <p>Проверьте Telegram и введите код</p>
              </div>
            </div>
            <div className="input-group">
              <label>Код из Telegram</label>
              <input
                type="text"
                placeholder="_ _ _ _ _ _"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required maxLength={6}
                className="code-input"
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading || code.length < 6}>
              {loading ? 'Вход...' : 'Войти'}
            </button>
            <button type="button" className="btn btn-ghost btn-full mt-8" onClick={() => { setStep(1); setError(''); setSuccess(''); }}>
              ← Назад
            </button>
          </form>
        )}

        <p className="auth-footer">
          Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  );
}
