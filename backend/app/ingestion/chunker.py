import re

from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.core.config import CHUNK_SIZE, CHUNK_OVERLAP


def chunk_document(pages: list[dict], source: str):
    """
    Chunk page-aware document content.

    Each input item contains:

        {
            "page": int | None,
            "text": str
        }

    PDF chunks preserve their page number.

    Markdown/TXT chunks have page=None.
    """

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=[
            "\n# ",
            "\n## ",
            "\n### ",
            "\n\n",
            "\n",
            ". ",
            " ",
        ],
    )

    result = []

    chunk_id = 0

    for page_data in pages:
        page_number = page_data["page"]
        text = page_data["text"]

        if not text.strip():
            continue

        chunks = splitter.split_text(text)

        current_section = "Unknown"

        for chunk in chunks:

            headings = re.findall(
                r"(?m)^#{1,3}\s+(.+)$",
                chunk,
            )

            if headings:
                current_section = headings[-1].strip()

            result.append(
                {
                    "chunk_id": chunk_id,
                    "text": chunk,
                    "source": source,
                    "page": page_number,
                    "section": current_section,
                    "chunking_strategy": "recursive",
                    "character_count": len(chunk),
                }
            )

            chunk_id += 1

    return result