import { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth, Button, Input, color, font, space, shadow } from '@trello/ui';
import { AuthShell } from '../components/AuthShell';

export function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
      const to = location.state?.from?.pathname ?? '/';
      navigate(to, { replace: true });
    } catch {
      setError('Invalid email or password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Log in to continue">
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <div style={{ color: color.danger, fontSize: 14 }}>{error}</div>}
        <Button type="submit" disabled={busy} style={{ boxShadow: shadow.base }}>
          {busy ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
      <p style={{ fontFamily: font.text, fontSize: 14, color: color.navyLight, marginTop: space.base }}>
        No account? <Link to="/register">Sign up</Link>
      </p>
    </AuthShell>
  );
}
