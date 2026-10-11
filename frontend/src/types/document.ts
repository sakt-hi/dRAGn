
export interface DocumentItem {
  id: string;
  filename: string;
  title: string;
  description: string | null;
  document_type: string;
  source_type: string;
  page_count: number | null;
  chunk_count: number | null;
  status: string;
}
