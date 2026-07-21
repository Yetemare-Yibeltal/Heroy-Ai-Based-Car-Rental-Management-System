'use client';

import { useState } from 'react';
import { Loader2, Check } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { apiClient, ApiError } from '@/lib/api-client';

export default function ProfilePage() {
  const { user, fetchCurrentUser } = useAuthStore();

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [phone, setPhone] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileError(null);
    setProfileSaved(false);

    try {
      await apiClient.patch('/users/me', { firstName, lastName, phone: phone || undefined });
      await fetchCurrentUser();
      setProfileSaved(true);
    } catch (err) {
      setProfileError(err instanceof ApiError ? err.message : 'Could not update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSavingPassword(true);
    setPasswordError(null);
    setPasswordSaved(false);

    try {
      await apiClient.post('/auth/change-password', { currentPassword, newPassword });
      setPasswordSaved(true);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : 'Could not change password.');
    } finally {
      setIsSavingPassword(false);
    }
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="mb-8 font-display text-2xl font-bold sm:text-3xl">Profile Settings</h1>

      <GlassPanel className="mb-6 p-6">
        <h2 className="mb-4 font-display text-lg font-semibold">Personal Information</h2>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">First name</span>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Last name</span>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Phone</span>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xx xx xx xx" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Email</span>
            <Input value={user.email} disabled className="opacity-60" />
          </label>

          {profileError && <p className="text-sm text-destructive">{profileError}</p>}

          <Button type="submit" disabled={isSavingProfile}>
            {isSavingProfile && <Loader2 size={15} className="animate-spin" />}
            {profileSaved && <Check size={15} />}
            Save Changes
          </Button>
        </form>
      </GlassPanel>

      <GlassPanel className="p-6">
        <h2 className="mb-4 font-display text-lg font-semibold">Change Password</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Current password</span>
            <Input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">New password</span>
            <Input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </label>

          {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}

          <Button type="submit" variant="glass" disabled={isSavingPassword}>
            {isSavingPassword && <Loader2 size={15} className="animate-spin" />}
            {passwordSaved && <Check size={15} />}
            Update Password
          </Button>
        </form>
      </GlassPanel>
    </div>
  );
}