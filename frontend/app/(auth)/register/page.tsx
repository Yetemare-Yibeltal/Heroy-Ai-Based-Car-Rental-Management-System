'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, Lock, User } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GradientText } from '@/components/ui/GradientText';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { ApiError } from '@/lib/api-client';

function getPasswordIssues(password: string): string[] {
  const issues: string[] = [];
  if (password.length < 8) issues.push('at least 8 characters');
  if (!/[a-z]/.test(password)) issues.push('a lowercase letter');
  if (!/[A-Z]/.test(password)) issues.push('an uppercase letter');
  if (!/\d/.test(password)) issues.push('a number');
  return issues;
}

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordIssues = password ? getPasswordIssues(password) : [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (passwordIssues.length > 0) {
      setError('Please choose a stronger password.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await register({ firstName, lastName, email, phone: phone || undefined, password });
      router.push('/dashboard');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Registration failed. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-16">
      <GlassPanel intensity="strong" className="w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <GradientText as="h1" className="text-2xl">
            Create your account
          </GradientText>
          <p className="mt-1 text-sm text-muted-foreground">Book your first vehicle in minutes</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">First name</span>
              <Input required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Last name</span>
              <Input required value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Email</span>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="pl-9"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Phone <span className="text-muted-foreground/60">(optional)</span>
            </span>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09xx xx xx xx"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Password</span>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-9"
              />
            </div>
            {password && passwordIssues.length > 0 && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                Needs: {passwordIssues.join(', ')}
              </p>
            )}
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" variant="gradient" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            Create Account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log In
          </Link>
        </p>
      </GlassPanel>
    </div>
  );
}