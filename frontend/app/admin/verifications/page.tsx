'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { apiClient, ApiError } from '@/lib/api-client';

interface VerificationDoc {
  id: string;
  userName: string;
  userEmail: string;
  documentType: string;
  documentUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export default function AdminVerificationsPage() {
  const queryClient = useQueryClient();

  const { data: docs, isLoading } = useQuery({
    queryKey: ['admin-verifications'],
    queryFn: () => apiClient.get<VerificationDoc[]>('/verification?status=PENDING&limit=50'),
  });

  async function handleReview(doc: VerificationDoc, status: 'APPROVED' | 'REJECTED') {
    try {
      await apiClient.patch(`/verification/${doc.id}/review`, { status });
      queryClient.invalidateQueries({ queryKey: ['admin-verifications'] });
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Could not review this document.');
    }
  }

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold">Driver Verifications</h1>

      {isLoading && (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="animate-spin" size={28} />
        </div>
      )}

      <div className="space-y-3">
        {docs?.map((doc) => (
          <GlassPanel key={doc.id} className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-4">
              <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={doc.documentUrl}
                  alt="Verification document"
                  className="h-14 w-20 rounded-md object-cover"
                />
              </a>
              <div>
                <p className="text-sm font-medium">{doc.userName}</p>
                <p className="text-xs text-muted-foreground">{doc.userEmail}</p>
                <p className="text-xs text-muted-foreground/70">{doc.documentType.replace('_', ' ')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="pending">{doc.status}</Badge>
              <Button size="sm" variant="ghost" onClick={() => handleReview(doc, 'APPROVED')}>
                <Check size={14} className="text-success" /> Approve
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleReview(doc, 'REJECTED')}>
                <X size={14} className="text-destructive" /> Reject
              </Button>
            </div>
          </GlassPanel>
        ))}
        {!isLoading && (!docs || docs.length === 0) && (
          <p className="py-8 text-center text-muted-foreground">No pending verifications.</p>
        )}
      </div>
    </div>
  );
}