import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card, Button, Input, EmptyState, useToast, color, space, font, radius,
} from '@trello/ui';
import { KeyRound, CalendarClock, History, CheckCircle2, XCircle, Loader2, AlertTriangle, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { PageHeader } from '../components/Layout';
import { FormSkeleton } from '../components/PageSkeleton';

function Toggle({ checked, onChange, label }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: space.base,
      padding: '10px 12px', borderRadius: radius.base, border: `1px solid ${color.border}`,
      background: color.surface, cursor: 'pointer',
    }}>
      <span style={{ fontSize: 14, color: color.text, fontWeight: 500 }}>{label}</span>
      <span onClick={(e) => { e.preventDefault(); onChange(!checked); }} style={{
        width: 40, height: 22, borderRadius: 999, flexShrink: 0, position: 'relative',
        background: checked ? color.blue : color.lightGray, transition: 'background .15s', cursor: 'pointer',
      }}>
        <span style={{
          position: 'absolute', top: 2, left: checked ? 20 : 2, width: 18, height: 18, borderRadius: '50%',
          background: '#FFFFFF', transition: 'left .15s', boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
        }} />
      </span>
    </label>
  );
}

function SectionCard({ Icon, title, description, children, action }) {
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: space.sm, marginBottom: space.base }}>
        <span style={{
          width: 34, height: 34, borderRadius: radius.large, flexShrink: 0,
          background: 'rgba(24,104,219,0.12)', color: color.blue,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}><Icon size={17} /></span>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontFamily: font.display, fontSize: 16, fontWeight: 700, color: color.text, margin: 0 }}>{title}</h2>
          {description && <p style={{ color: color.textMuted, fontSize: 13, margin: '2px 0 0' }}>{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

const STATUS = {
  success: { Icon: CheckCircle2, c: color.green ?? '#22a06b', t: 'Success' },
  failed: { Icon: XCircle, c: color.red ?? '#e2483d', t: 'Failed' },
  running: { Icon: Loader2, c: color.blue, t: 'Running' },
  pending: { Icon: Loader2, c: color.textMuted, t: 'Pending' },
};

const fmtSize = (b) => {
  if (!b) return '-';
  const u = ['B', 'KB', 'MB', 'GB']; let i = 0; let n = b;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(1)} ${u[i]}`;
};
const fmtDate = (s) => (s ? new Date(s).toLocaleString() : '-');

export function BackupPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [creds, setCreds] = useState({ clientId: '', clientSecret: '' });

  const settings = useQuery({
    queryKey: ['admin', 'backup', 'settings'],
    queryFn: async () => (await api.get('/admin/backup/settings')).data,
  });
  useEffect(() => { if (settings.data) setForm(settings.data); }, [settings.data]);

  const runs = useQuery({
    queryKey: ['admin', 'backup', 'runs'],
    queryFn: async () => (await api.get('/admin/backup/runs', { params: { limit: 10 } })).data,
    refetchInterval: (q) => (q.state.data?.some((r) => ['pending', 'running'].includes(r.status)) ? 4000 : false),
  });

  const save = useMutation({
    mutationFn: (patch) => api.put('/admin/backup/settings', patch),
    onSuccess: (res) => { qc.setQueryData(['admin', 'backup', 'settings'], res.data); toast.success('Settings saved.'); },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Failed to save.'),
  });

  const saveCreds = useMutation({
    mutationFn: () => api.put('/admin/backup/gdrive/creds', creds),
    onSuccess: (res) => { qc.setQueryData(['admin', 'backup', 'settings'], res.data); setCreds({ clientId: '', clientSecret: '' }); toast.success('Credentials saved. Now connect Google.'); },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Failed to save credentials.'),
  });

  const disconnect = useMutation({
    mutationFn: () => api.post('/admin/backup/gdrive/disconnect'),
    onSuccess: (res) => { qc.setQueryData(['admin', 'backup', 'settings'], res.data); toast.success('Disconnected.'); },
  });

  const runNow = useMutation({
    mutationFn: () => api.post('/admin/backup/run'),
    onSuccess: () => { toast.success('Backup started.'); qc.invalidateQueries({ queryKey: ['admin', 'backup', 'runs'] }); },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Could not start backup.'),
  });

  const delRun = useMutation({
    mutationFn: (id) => api.delete(`/admin/backup/runs/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'backup', 'runs'] }),
  });

  const connect = async () => {
    try {
      const { data } = await api.get('/admin/backup/gdrive/oauth/start');
      const w = 560, h = 720;
      const x = window.screen.width / 2 - w / 2, y = window.screen.height / 2 - h / 2;
      window.open(data.authUrl, 'gdrive-oauth', `width=${w},height=${h},left=${x},top=${y}`);
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Set Client ID/Secret first.');
    }
  };

  useEffect(() => {
    const onMsg = (e) => {
      if (e.data?.type !== 'backup-oauth-result') return;
      if (e.data.ok) toast.success(`Connected: ${e.data.msg}`); else toast.error(e.data.msg);
      qc.invalidateQueries({ queryKey: ['admin', 'backup', 'settings'] });
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [qc, toast]);

  if (settings.isLoading || (settings.data && !form)) {
    return (<div><PageHeader title="Backup" subtitle="Scheduled backups to Google Drive" breadcrumb={['Admin', 'Backup']} /><FormSkeleton blocks={3} /></div>);
  }
  if (settings.isError || !form) {
    return (<div><PageHeader title="Backup" subtitle="Scheduled backups to Google Drive" breadcrumb={['Admin', 'Backup']} /><Card><EmptyState icon={<AlertTriangle size={36} />} title="Could not load backup settings" description="The backup endpoint may not be deployed yet." /></Card></div>);
  }

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const list = runs.data ?? [];

  return (
    <div>
      <PageHeader
        title="Backup"
        subtitle="Scheduled backups to Google Drive"
        breadcrumb={['Admin', 'Backup']}
        action={<Button loading={runNow.isPending} disabled={!form.connected} onClick={() => runNow.mutate()}>Backup now</Button>}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: space.lg, maxWidth: 760 }}>
        {/* Connection */}
        <SectionCard
          Icon={KeyRound}
          title="Google Drive connection"
          description="Paste OAuth Client ID + Secret from Google Cloud, then connect."
          action={form.connected
            ? <Button variant="secondary" loading={disconnect.isPending} onClick={() => disconnect.mutate()}>Disconnect</Button>
            : null}
        >
          {form.connected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: space.sm, fontSize: 14, color: color.text }}>
              <CheckCircle2 size={18} color={color.green ?? '#22a06b'} />
              Connected as <strong>{form.gdriveAccountEmail}</strong>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: space.base }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: space.base }}>
                <Input label="Client ID" value={creds.clientId} onChange={(e) => setCreds((c) => ({ ...c, clientId: e.target.value }))} placeholder="...apps.googleusercontent.com" />
                <Input label="Client Secret" type="password" value={creds.clientSecret} onChange={(e) => setCreds((c) => ({ ...c, clientSecret: e.target.value }))} placeholder="GOCSPX-..." />
              </div>
              <div style={{ display: 'flex', gap: space.sm }}>
                <Button variant="secondary" loading={saveCreds.isPending} disabled={!creds.clientId || !creds.clientSecret} onClick={() => saveCreds.mutate()}>Save credentials</Button>
                <Button onClick={connect}>Connect Google</Button>
              </div>
              <p style={{ fontSize: 12, color: color.textMuted, margin: 0 }}>
                Redirect URI to register in Google Cloud:&nbsp;
                <code>{`${window.location.origin.replace(/\/$/, '')}`}/api/backup/oauth/callback</code>
              </p>
            </div>
          )}
        </SectionCard>

        {/* Schedule + scope */}
        <SectionCard
          Icon={CalendarClock}
          title="Schedule & scope"
          description="Cron schedule (server timezone Asia/Ho_Chi_Minh) and what to include."
          action={<Button loading={save.isPending} onClick={() => save.mutate({
            enabled: form.enabled, cronExpr: form.cronExpr, retentionCount: Number(form.retentionCount),
            scopeDb: form.scopeDb, scopeUploads: form.scopeUploads, scopeConfigs: form.scopeConfigs,
            remoteFolder: form.remoteFolder,
          })}>Save</Button>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: space.sm }}>
            <Toggle label="Enable scheduled backups" checked={!!form.enabled} onChange={(v) => set('enabled', v)} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: space.base }}>
              <Input label="Cron expression" value={form.cronExpr ?? ''} onChange={(e) => set('cronExpr', e.target.value)} placeholder="0 2 * * *" />
              <Input label="Keep last N backups" type="number" min="1" value={form.retentionCount ?? ''} onChange={(e) => set('retentionCount', e.target.value)} />
              <Input label="Drive folder" value={form.remoteFolder ?? ''} onChange={(e) => set('remoteFolder', e.target.value)} />
            </div>
            <Toggle label="Database (pg_dump)" checked={!!form.scopeDb} onChange={(v) => set('scopeDb', v)} />
            <Toggle label="Uploads (MinIO files)" checked={!!form.scopeUploads} onChange={(v) => set('scopeUploads', v)} />
            <Toggle label="App config (settings table)" checked={!!form.scopeConfigs} onChange={(v) => set('scopeConfigs', v)} />
          </div>
        </SectionCard>

        {/* History */}
        <SectionCard Icon={History} title="Backup history" description="Last 10 runs.">
          {list.length === 0 ? (
            <p style={{ fontSize: 13, color: color.textMuted, margin: 0 }}>No backups yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {list.map((r) => {
                const st = STATUS[r.status] ?? STATUS.pending;
                return (
                  <div key={r.id} style={{
                    display: 'flex', alignItems: 'center', gap: space.sm, padding: '8px 12px',
                    border: `1px solid ${color.border}`, borderRadius: radius.base, background: color.surface,
                  }}>
                    <st.Icon size={16} color={st.c} style={r.status === 'running' || r.status === 'pending' ? { animation: 'spin 1s linear infinite' } : undefined} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: st.c, width: 64 }}>{st.t}</span>
                    <span style={{ fontSize: 13, color: color.text, flex: 1 }}>{fmtDate(r.startedAt)} · {r.kind}</span>
                    <span style={{ fontSize: 12, color: color.textMuted }}>{fmtSize(r.sizeBytes)}</span>
                    {r.error ? <span title={r.error} style={{ fontSize: 12, color: color.red ?? '#e2483d', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.error}</span> : null}
                    <button onClick={() => delRun.mutate(r.id)} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: color.textMuted, display: 'inline-flex' }}><Trash2 size={15} /></button>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
