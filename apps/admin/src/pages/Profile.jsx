import { useState, useRef } from 'react';
import axios from 'axios';
import {
  useAuth, Card, Button, Input, Avatar, useToast,
  color, space, font,
} from '@trello/ui';
import { UploadCloud } from 'lucide-react';
import { api } from '../lib/api';
import { PageHeader } from '../components/Layout';

function SectionTitle({ children }) {
  return (
    <h2 style={{ fontFamily: font.display, fontSize: 18, fontWeight: 700, color: color.text, margin: `0 0 ${space.base}` }}>
      {children}
    </h2>
  );
}

export function ProfilePage() {
  const { user, refresh } = useAuth();
  const toast = useToast();
  const fileRef = useRef(null);

  const [name, setName] = useState(user?.name ?? '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwErrors, setPwErrors] = useState({});
  const [changingPw, setChangingPw] = useState(false);

  const saveProfile = async () => {
    if (!name.trim()) { toast.error('Name is required.'); return; }
    setSavingProfile(true);
    try {
      await api.patch('/me', { name: name.trim() });
      await refresh();
      toast.success('Profile updated.');
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const onPickAvatar = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please choose an image file.'); return; }
    setUploading(true);
    try {
      const { data } = await api.post('/me/avatar', { filename: file.name, contentType: file.type });
      await axios.put(data.uploadUrl, file, { headers: { 'Content-Type': file.type } });
      await api.patch('/me', { avatarUrl: data.fileUrl });
      await refresh();
      toast.success('Avatar updated.');
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Avatar upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const changePassword = async () => {
    const e = {};
    if (!currentPassword) e.currentPassword = 'Required.';
    if (!newPassword) e.newPassword = 'Required.';
    else if (newPassword.length < 8) e.newPassword = 'Min 8 characters.';
    if (newPassword !== confirmPassword) e.confirmPassword = 'Passwords do not match.';
    setPwErrors(e);
    if (Object.keys(e).length) return;

    setChangingPw(true);
    try {
      await api.post('/me/change-password', { currentPassword, newPassword });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      toast.success('Password changed.');
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to change password.');
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <div>
      <PageHeader title="Profile" subtitle="Manage your account details" breadcrumb={['Admin', 'Profile']} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: space.lg, maxWidth: 640 }}>
        <Card>
          <SectionTitle>Avatar</SectionTitle>
          <div style={{ display: 'flex', alignItems: 'center', gap: space.lg }}>
            <Avatar name={user?.name} email={user?.email} src={user?.avatarUrl} size={72} />
            <div>
              <Button
                variant="secondary"
                loading={uploading}
                leftIcon={<UploadCloud size={16} />}
                onClick={() => fileRef.current?.click()}
              >
                Upload new avatar
              </Button>
              <input ref={fileRef} type="file" accept="image/*" onChange={onPickAvatar} style={{ display: 'none' }} />
              <p style={{ color: color.textMuted, fontSize: 12, margin: `${space.sm} 0 0` }}>
                JPG, PNG or GIF. Square images work best.
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <SectionTitle>Details</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: space.base }}>
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            <Input label="Email" value={user?.email ?? ''} disabled helper="Email cannot be changed." />
            <div>
              <Button loading={savingProfile} onClick={saveProfile}>Save changes</Button>
            </div>
          </div>
        </Card>

        <Card>
          <SectionTitle>Change password</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: space.base }}>
            <Input
              label="Current password" type="password" autoComplete="current-password"
              value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} error={pwErrors.currentPassword}
            />
            <Input
              label="New password" type="password" autoComplete="new-password"
              value={newPassword} onChange={(e) => setNewPassword(e.target.value)} error={pwErrors.newPassword}
              helper="At least 8 characters."
            />
            <Input
              label="Confirm new password" type="password" autoComplete="new-password"
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} error={pwErrors.confirmPassword}
            />
            <div>
              <Button loading={changingPw} onClick={changePassword}>Update password</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
