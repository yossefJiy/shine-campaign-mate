-- Add iCount sync columns to invoices table
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS icount_doc_id TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS icount_synced_at TIMESTAMPTZ;

-- Add iCount sync columns to quotes table
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS icount_doc_id TEXT;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS icount_synced_at TIMESTAMPTZ;

-- Add index for faster lookups on synced documents
CREATE INDEX IF NOT EXISTS idx_invoices_icount_doc_id ON public.invoices(icount_doc_id) WHERE icount_doc_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quotes_icount_doc_id ON public.quotes(icount_doc_id) WHERE icount_doc_id IS NOT NULL;