import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth, Button, Input, color, font, space, shadow } from '@trello/ui';
import { api } from '../lib/api';
import { AuthShell } from '../components/AuthShell';

export function Register() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
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
      await api.post('/auth/register', { email, password, name });
      await login(email, password);
      navigate('/', { replace: true });
    } catch {
      setError('Could not create account. Email may be taken.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Create your account">
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
        <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <div style={{ color: color.danger, fontSize: 14 }}>{error}</div>}
        <Button type="submit" disabled={busy} style={{ boxShadow: shadow.base }}>
          {busy ? 'Creating…' : 'Sign up'}
        </Button>
      </form>
      <p style={{ fontFamily: font.text, fontSize: 14, color: color.navyLight, marginTop: space.base }}>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </AuthShell>
  );
}
