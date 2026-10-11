/**
 * Public static assets for dRAGn demo documents.
 *
 * Only intentionally public demo files belong here.
 * Never add user-uploaded or private document URLs.
 */
export const DEMO_DOCUMENT_ASSETS = {
  "employee-handbook.pdf": "/demo-documents/employee-handbook.pdf",
  "health-insurance-policy.pdf":
    "/demo-documents/health-insurance-policy.pdf",
  "software-documentation.pdf":
    "/demo-documents/software-documentation.pdf",
  "fitness-program-guide.pdf":
    "/demo-documents/fitness-program-guide.pdf",
  "cgrc-exam-notification-2026.pdf":
    "/demo-documents/cgrc-exam-notification-2026.pdf",
  "azure.md": "/demo-documents/azure.md",
} as const satisfies Record<string, string>;