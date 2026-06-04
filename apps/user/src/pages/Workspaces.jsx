import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Card, Spinner, color, font, space } from '@trello/ui';
import { api } from '../lib/api';

async function fetchWorkspaces() {
  const res = await api.get('/workspaces');
  return Array.isArray(res.data) ? res.data : res.data?.items ?? [];
}

export function Workspaces() {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const { data, isLoading, isError } = useQuery({ queryKey: ['workspaces'], queryFn: fetchWorkspaces });

  const create = useMutation({
    mutationFn: (n) => api.post('/workspaces', { name: n }),
    onSuccess: () => {
      setName('');
      qc.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });

  const onSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) create.mutate(name.trim());
  };

  const workspaces = data ?? [];

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: space.xl }}>
      <h1 style={{ fontFamily: font.display, fontSize: 24, fontWeight: 500, color: color.navyDeep }}>
        Your Workspaces
      </h1>

      <form onSubmit={onSubmit} style={{ display: 'flex', gap: space.sm, maxWidth: 480, marginBottom: space.xl }}>
        <Input placeholder="New workspace name" value={name} onChange={(e) => setName(e.target.value)} />
        <Button type="submit" disabled={create.isPending} style={{ whiteSpace: 'nowrap' }}>
          Create
        </Button>
      </form>

      {isLoading && <Spinner />}
      {isError && <EmptyState text="Could not load workspaces. Is the backend running?" />}
      {!isLoading && !isError && workspaces.length === 0 && (
        <EmptyState text="No workspaces yet. Create your first one above." />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: space.base }}>
        {workspaces.map((w) => (
          <Link key={w.id} to={`/w/${w.id}`} style={{ textDecoration: 'none' }}>
            <Card style={{ cursor: 'pointer' }}>
              <div style={{ fontFamily: font.display, fontSize: 18, fontWeight: 500, color: color.navyDeep }}>
                {w.name}
              </div>
              <div style={{ fontSize: 13, color: color.navyLight, marginTop: 4 }}>Open boards →</div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div style={{ padding: space.xl, color: color.navyLight, fontSize: 15, textAlign: 'center' }}>{text}</div>
  );
}
