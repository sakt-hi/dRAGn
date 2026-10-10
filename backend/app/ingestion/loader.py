from pathlib import Path

from pypdf import PdfReader


def load_document(file_path: str) -> list[dict]:
    """
    Load a document into a normalized page-aware structure.

    PDF:
        [
            {"page": 1, "text": "..."},
            {"page": 2, "text": "..."}
        ]

    Markdown / TXT:
        [
            {"page": None, "text": "..."}
        ]
    """

    file_path = Path(file_path)

    suffix = file_path.suffix.lower()

    if suffix in [".md", ".txt"]:
        return [
            {
                "page": None,
                "text": file_path.read_text(encoding="utf-8"),
            }
        ]

    if suffix == ".pdf":
        reader = PdfReader(file_path)

        pages = []

        for page_number, page in enumerate(reader.pages, start=1):
            text = page.extract_text() or ""

            pages.append(
                {
                    "page": page_number,
                    "text": text.strip(),
                }
            )

        return pages

    raise ValueError(
        f"Unsupported file type: {file_path.suffix}"
    )