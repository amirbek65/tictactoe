import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerStep1, registerStep2 } from '../api';
import { useAuth } from '../hooks/useAuth';
import './Auth.css';

export default function Register() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ username: '', email: '', password: '', telegram_id: '' });
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
      await registerStep1(form);
      setSuccess('Код отправлен в Telegram! Введите его ниже.');
      setStep(2);
    } catch (err) {
      if (!err.response) {
        setError('Сервер недоступен. Убедитесь, что backend запущен на порту 8000.');
        return;
      }
      const data = err.response?.data;
      if (typeof data === 'string') {
        setError(`Ошибка сервера: ${err.response.status}`);
      } else if (data?.error) {
        setError(data.error);
      } else if (data && typeof data === 'object') {
        const msgs = Object.entries(data).map(([k, v]) =>
          `${k}: ${Array.isArray(v) ? v.join(', ') : v}`
        );
        setError(msgs.join(' | '));
      } else {
        setError(`Ошибка ${err.response?.status || ''}. Попробуйте снова.`);
      }
    } finally { setLoading(false); }
  };

  const handleStep2 = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await registerStep2({ username: form.username, code });
      setUser(res.data.user);
      nav('/play');
    } catch (err) {
      setError(err.response?.data?.error || 'Неверный код. Попробуйте снова.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-header">
          <h1 className="auth-title">
            {step === 1 ? 'Регистрация' : 'Подтверждение'}
          </h1>
          <p className="auth-sub">
            {step === 1
              ? 'Создайте аккаунт и начните играть'
              : `Введите код из Telegram бота`}
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
                required minLength={3}
              />
            </div>
            <div className="input-group">
              <label>Email (необязательно)</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(f => ({...f, email: e.target.value}))}
              />
            </div>
            <div className="input-group">
              <label>Пароль</label>
              <input
                type="password"
                placeholder="минимум 6 символов"
                value={form.password}
                onChange={e => setForm(f => ({...f, password: e.target.value}))}
                required minLength={6}
              />
            </div>
            <div className="input-group">
              <label>Telegram ID</label>
              <input
                type="text"
                placeholder="Ваш числовой Telegram ID"
                value={form.telegram_id}
                onChange={e => setForm(f => ({...f, telegram_id: e.target.value}))}
                required
              />
              <span className="input-hint">
                📱 Сначала напишите боту <a href="https://t.me/your_bot" target="_blank" rel="noreferrer" className="tg-link">/start</a>, 
                потом узнайте свой ID через <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="tg-link">@userinfobot</a>
              </span>
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Отправка...' : 'Отправить код в Telegram →'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleStep2}>
            <div className="tg-code-hint">
              <div className="tg-icon">✈️</div>
              <div>
                <strong>Бот прислал 6-значный код</strong>
                <p>Проверьте Telegram и введите код ниже</p>
              </div>
            </div>
            <div className="input-group">
              <label>Код подтверждения</label>
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
              {loading ? 'Проверка...' : 'Подтвердить и войти'}
            </button>
            <button type="button" className="btn btn-ghost btn-full mt-8" onClick={() => { setStep(1); setError(''); setSuccess(''); }}>
              ← Назад
            </button>
          </form>
        )}

        <p className="auth-footer">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </div>
    </div>
  );
}
