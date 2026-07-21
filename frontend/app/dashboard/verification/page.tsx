'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, ShieldCheck, ShieldAlert, ShieldQuestion, Upload } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { apiClient, ApiError } from '@/lib/api-client';

interface VerificationDoc {
  id: string;
  documentType: string;
  documentUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

const DOCUMENT_TYPES = [
  { value: 'DRIVERS_LICENSE', label: "Driver's License" },
  { value: 'NATIONAL_ID', label: 'National ID' },
  { value: 'PASSPORT', label: 'Passport' },
];

const STATUS_META = {
  APPROVED: { icon: ShieldCheck, color: 'text-success', variant: 'success' as const },
  PENDING: { icon: ShieldQuestion, color: 'text-primary', variant: 'pending' as const },
  REJECTED: { icon: ShieldAlert, color: 'text-destructive', variant: 'destructive' as const },
};

export default function VerificationPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const [documentType, setDocumentType] = useState('DRIVERS_LICENSE');
  const [documentUrl, setDocumentUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: documents, isLoading } = useQuery({
    queryKey: ['my-verifications'],
    queryFn: () => apiClient.get<VerificationDoc[]>('/verification/me'),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await apiClient.post('/verification', { documentType, documentUrl });
      setDocumentUrl('');
      queryClient.invalidateQueries({ queryKey: ['my-verifications'] });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not submit document.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const hasPending = documents?.some((d) => d.status === 'PENDING');

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="mb-2 font-display text-2xl font-bold sm:text-3xl">Driver Verification</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Current status:{' '}
        <Badge variant={STATUS_META[user?.verificationStatus as keyof typeof STATUS_META]?.variant ?? 'secondary'}>
          {user?.verificationStatus ?? 'PENDING'}
        </Badge>
      </p>

      {!hasPending && (
        <GlassPanel className="mb-8 p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
            <Upload size={17} className="text-primary" /> Submit a document
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Document type</span>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Document image URL
              </span>
              <Input
                type="url"
                required
                value={documentUrl}
                onChange={(e) => setDocumentUrl(e.target.value)}
                placeholder="https://..."
              />
              <span className="mt-1 block text-xs text-muted-foreground">
                Upload your document to any image host and paste the link here.
              </span>
            </label>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 size={15} className="animate-spin" />}
              Submit for review
            </Button>
          </form>
        </GlassPanel>
      )}

      <h2 className="mb-4 font-display text-lg font-semibold">Submission history</h2>

      {isLoading && (
        <div className="flex justify-center py-8 text-muted-foreground">
          <Loader2 className="animate-spin" size={22} />
        </div>
      )}

      {!isLoading && (!documents || documents.length === 0) && (
        <p className="text-sm text-muted-foreground">No documents submitted yet.</p>
      )}

      <div className="space-y-3">
        {documents?.map((doc) => {
          const meta = STATUS_META[doc.status];
          const Icon = meta.icon;
          return (
            <GlassPanel key={doc.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Icon size={18} className={meta.color} />
                <div>
                  <p className="text-sm font-medium">{doc.documentType.replace('_', ' ')}</p>
                  <p className="text-xs text-muted-foreground">
                    Submitted {new Date(doc.createdAt).toDateString()}
                  </p>
                </div>
              </div>
              <Badge variant={meta.variant}>{doc.status}</Badge>
            </GlassPanel>
          );
        })}
      </div>
    </div>
  );
}