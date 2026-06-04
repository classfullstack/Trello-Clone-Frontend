import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, Button, Input, Card, color, space, font } from '@trello/ui';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password, otp || undefined);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message ?? 'Login failed. Check your credentials or 2FA code.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: color.navyDeep, fontFamily: font.text,
    }}>
      <Card style={{ width: 380, padding: space.xl }}>
        <h1 style={{ fontFamily: font.display, fontSize: 24, fontWeight: 600, color: color.navyDeep, marginTop: 0 }}>
          Admin sign in
        </h1>
        <p style={{ color: color.navyLight, fontSize: 14, marginTop: 0 }}>
          Restricted to system administrators.
        </p>
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: space.base, marginTop: space.base }}>
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Input type="text" inputMode="numeric" placeholder="2FA code (if enabled)" value={otp} onChange={(e) => setOtp(e.target.value)} />
          {error && <div style={{ color: color.danger, fontSize: 13 }}>{error}</div>}
          <Button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
        </form>
      </Card>
    </div>
  );
}
