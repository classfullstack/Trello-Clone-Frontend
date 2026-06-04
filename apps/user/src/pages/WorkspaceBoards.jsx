import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Spinner, color, font, space, shadow, radius } from '@trello/ui';
import { api } from '../lib/api';

const BOARD_GRADIENTS = [
  `linear-gradient(135deg, ${color.blue}, ${color.blueDark})`,
  `linear-gradient(135deg, ${color.purple}, ${color.blue})`,
  `linear-gradient(135deg, ${color.cyan}, ${color.blue})`,
  `linear-gradient(135deg, ${color.navyMedium}, ${color.navyDeep})`,
];

async function fetchBoards(workspaceId) {
  const res = await api.get('/boards', { params: { workspaceId } });
  return Array.isArray(res.data) ? res.data : res.data?.items ?? [];
}

export function WorkspaceBoards() {
  const { workspaceId = '' } = useParams();
  const qc = useQueryClient();
  const [name, setName] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['boards', workspaceId],
    queryFn: () => fetchBoards(workspaceId),
    enabled: !!workspaceId,
  });

  const create = useMutation({
    mutationFn: (n) => api.post('/boards', { workspaceId, name: n }),
    onSuccess: () => {
      setName('');
      qc.invalidateQueries({ queryKey: ['boards', workspaceId] });
    },
  });

  const onSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) create.mutate(name.trim());
  };

  const boards = data ?? [];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: space.xl }}>
      <Link to="/" style={{ fontSize: 14, color: color.navyLight }}>← Workspaces</Link>
      <h1 style={{ fontFamily: font.display, fontSize: 24, fontWeight: 500, color: color.navyDeep }}>Boards</h1>

      <form onSubmit={onSubmit} style={{ display: 'flex', gap: space.sm, maxWidth: 480, marginBottom: space.xl }}>
        <Input placeholder="New board name" value={name} onChange={(e) => setName(e.target.value)} />
        <Button type="submit" disabled={create.isPending} style={{ whiteSpace: 'nowrap' }}>Create</Button>
      </form>

      {isLoading && <Spinner />}
      {isError && <div style={{ color: color.navyLight, padding: space.xl }}>Could not load boards.</div>}
      {!isLoading && !isError && boards.length === 0 && (
        <div style={{ color: color.navyLight, padding: space.xl }}>No boards yet. Create one above.</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: space.base }}>
        {boards.map((b, i) => (
          <Link key={b.id} to={`/b/${b.id}`} style={{ textDecoration: 'none' }}>
            <div
              style={{
                height: 100,
                borderRadius: radius.large,
                background: b.background || BOARD_GRADIENTS[i % BOARD_GRADIENTS.length],
                boxShadow: shadow.base,
                padding: space.base,
                color: color.white,
                fontFamily: font.display,
                fontSize: 18,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'flex-end',
              }}
            >
              {b.name}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
