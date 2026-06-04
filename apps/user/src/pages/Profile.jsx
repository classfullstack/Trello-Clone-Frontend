import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Trash2 } from 'lucide-react';
import {
  useAuth, Button, Input, Card, Avatar, useConfirm,
  color, font, space,
} from '@trello/ui';
import { meUser } from '../lib/me';
import {
  useUpdateProfile, useUploadAvatar, useChangePassword, useDeleteAccount,
} from '../lib/userData';

const sectionTitle = { fontFamily: font.display, fontSize: 18, fontWeight: 600, color: color.text, margin: 0 };

export function Profile() {
  const { user, refresh, logout } = useAuth();
  const me = meUser(user);
  const navigate = useNavigate();
  const confirm = useConfirm();
  const fileRef = useRef(null);

  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const changePassword = useChangePassword();
  const deleteAccount = useDeleteAccount();

  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => { setName(me?.name ?? ''); }, [me?.name]);

  const saveName = () => {
    const n = name.trim();
    if (!n || n === me?.name) return;
    updateProfile.mutate({ name: n }, { onSuccess: () => refresh() });
  };

  const onAvatarPick = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadAvatar.mutate(file, { onSuccess: () => refresh() });
    e.target.value = '';
  };

  const onChangePassword = (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    changePassword.mutate(
      { currentPassword, newPassword },
      { onSuccess: () => { setCurrentPassword(''); setNewPassword(''); } },
    );
  };

  const onDeleteAccount = async () => {
    const ok = await confirm({
      title: 'Delete account?',
      message: 'This permanently deactivates your account. This cannot be undone.',
      confirmText: 'Delete', danger: true,
    });
    if (!ok) return;
    deleteAccount.mutate(undefined, {
      onSuccess: async () => { await logout(); navigate('/login'); },
    });
  };

  if (!me) return null;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: `${space.xl} ${space.base}`, display: 'flex', flexDirection: 'column', gap: space.lg }}>
      <h1 style={{ fontFamily: font.display, fontSize: 28, fontWeight: 700, color: color.text, margin: 0 }}>Profile</h1>

      <Card style={{ display: 'flex', flexDirection: 'column', gap: space.base }}>
        <h2 style={sectionTitle}>Account</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: space.base }}>
          <Avatar name={me.name} email={me.email} src={me.avatarUrl} size={64} />
          <div style={{ display: 'flex', gap: space.sm }}>
            <input ref={fileRef} type="file" accept="image/*" onChange={onAvatarPick} style={{ display: 'none' }} />
            <Button variant="secondary" size="sm" leftIcon={<Upload size={15} />}
              loading={uploadAvatar.isPending} onClick={() => fileRef.current?.click()}>
              Upload avatar
            </Button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: space.sm, alignItems: 'flex-end' }}>
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} wrapStyle={{ flex: 1 }} />
          <Button onClick={saveName} loading={updateProfile.isPending} disabled={!name.trim() || name.trim() === me.name}>
            Save
          </Button>
        </div>

        <Input label="Email" value={me.email ?? ''} readOnly helper="Email cannot be changed." />
      </Card>

      <Card style={{ display: 'flex', flexDirection: 'column', gap: space.base }}>
        <h2 style={sectionTitle}>Change password</h2>
        <form onSubmit={onChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: space.base }}>
          <Input label="Current password" type="password" autoComplete="current-password"
            value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          <Input label="New password" type="password" autoComplete="new-password"
            value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <div>
            <Button type="submit" loading={changePassword.isPending} disabled={!currentPassword || !newPassword}>
              Update password
            </Button>
          </div>
        </form>
      </Card>

      <Card style={{ display: 'flex', flexDirection: 'column', gap: space.base, border: `1px solid ${color.danger}` }}>
        <h2 style={{ ...sectionTitle, color: color.danger }}>Danger zone</h2>
        <div style={{ fontFamily: font.text, fontSize: 14, color: color.textMuted }}>
          Deleting your account is permanent and cannot be undone.
        </div>
        <div>
          <Button variant="danger" leftIcon={<Trash2 size={15} />} loading={deleteAccount.isPending} onClick={onDeleteAccount}>
            Delete account
          </Button>
        </div>
      </Card>
    </div>
  );
}
