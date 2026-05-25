import { createFileRoute } from '@tanstack/react-router';
import { PageHeader } from '@/components/Layout';

export const Route = createFileRoute('/media')({
  component: () => (
    <>
      <PageHeader title="Media library" subtitle="Cloudflare R2 · drag to reorder, set hero" />
      <div className="p-8 card">
        <p className="font-quote italic text-ink-2 text-lg">
          Per-destination image grid · drag-reorder · set hero · delete.
          Uploads via S3 presigned URL endpoint.
        </p>
      </div>
    </>
  ),
});
