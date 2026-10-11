import { DEMO_DOCUMENT_ASSETS } from "@/config/demo-documents";
import type { DocumentItem } from "@/types/document";

export type DocumentPreviewFormat =
  | "pdf"
  | "markdown"
  | "text"
  | "unsupported";

export type DocumentPreviewSource = {
  type: "static" | "backend";
  url: string;
  format: Exclude<DocumentPreviewFormat, "unsupported">;
};

export function getDocumentPreviewFormat(
  filename: string,
): DocumentPreviewFormat {
  const normalizedFilename = filename.toLowerCase();

  if (normalizedFilename.endsWith(".pdf")) return "pdf";
  if (normalizedFilename.endsWith(".md")) return "markdown";

  if (
    normalizedFilename.endsWith(".txt") ||
    normalizedFilename.endsWith(".log") ||
    normalizedFilename.endsWith(".csv")
  ) {
    return "text";
  }

  return "unsupported";
}

export function getDocumentPreviewSource(
  document: DocumentItem,
): DocumentPreviewSource | null {
  const filename = document.filename.toLowerCase();
  const format = getDocumentPreviewFormat(filename);

  if (format === "unsupported") {
    return null;
  }

  if (document.source_type === "demo") {
    const url =
      DEMO_DOCUMENT_ASSETS[
        filename as keyof typeof DEMO_DOCUMENT_ASSETS
      ];

    if (!url) {
      return null;
    }

    return {
      type: "static",
      url,
      format,
    };
  }

  // Uploaded-document preview will be connected after
  // an authenticated backend file endpoint is implemented.
  return null;
}