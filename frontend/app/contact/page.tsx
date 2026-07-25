'use client';

import { useState } from 'react';
import { Loader2, CheckCircle2, Mail, Phone, MapPin } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GradientText } from '@/components/ui/GradientText';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiClient, ApiError } from '@/lib/api-client';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await apiClient.post('/contact', { name, email, subject, message }, { skipAuth: true });
      setIsSent(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send your message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <GradientText as="h1" className="text-3xl sm:text-4xl">
          Get in touch
        </GradientText>
        <p className="mt-3 text-muted-foreground">
          Questions about a booking, a vehicle, or anything else - we're here to help.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-4">
          <GlassPanel className="flex items-center gap-3 p-4">
            <Phone size={18} className="text-primary" />
            <span className="text-sm">+251 11 555 0142</span>
          </GlassPanel>
          <GlassPanel className="flex items-center gap-3 p-4">
            <Mail size={18} className="text-primary" />
            <span className="text-sm">support@heroy.example</span>
          </GlassPanel>
          <GlassPanel className="flex items-center gap-3 p-4">
            <MapPin size={18} className="text-primary" />
            <span className="text-sm">Addis Ababa, Ethiopia</span>
          </GlassPanel>
        </div>

        <GlassPanel intensity="strong" className="p-6">
          {isSent ? (
            <div className="flex flex-col items-center py-10 text-center">
              <CheckCircle2 size={40} className="mb-3 text-success" />
              <p className="font-semibold">Message sent</p>
              <p className="mt-1 text-sm text-muted-foreground">
                We'll get back to you as soon as possible.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Your name" required value={name} onChange={(e) => setName(e.target.value)} />
                <Input
                  type="email"
                  placeholder="Your email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Input
                placeholder="Subject"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
              <textarea
                required
                minLength={10}
                rows={5}
                placeholder="Your message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" variant="gradient" disabled={isSubmitting} className="w-full">
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                Send Message
              </Button>
            </form>
          )}
        </GlassPanel>
      </div>
    </div>
  );
}