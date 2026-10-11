const groundingStatusLabels: Record<string, string> = {
  grounded: "Grounded",
  no_citations: "No verifiable citations",
  partially_grounded: "Partially grounded",
  poorly_grounded: "Poorly grounded",
};

export function formatGroundingStatus(status?: string): string {
  if (!status) return "Unknown";
  return (
    groundingStatusLabels[status] ??
    status.replaceAll("_", " ").replace(/^\w/, (letter) => letter.toUpperCase())
  );
}
