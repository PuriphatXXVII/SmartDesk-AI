"""Extract plain text from uploaded documents."""

from __future__ import annotations

import io


def parse_pdf(data: bytes) -> str:
    from pypdf import PdfReader

    reader = PdfReader(io.BytesIO(data))
    return "\n\n".join(page.extract_text() or "" for page in reader.pages)


def parse_docx(data: bytes) -> str:
    from docx import Document

    doc = Document(io.BytesIO(data))
    return "\n".join(p.text for p in doc.paragraphs if p.text)


def parse_text(data: bytes) -> str:
    return data.decode("utf-8", errors="replace")


def parse_html(data: bytes) -> str:
    from bs4 import BeautifulSoup

    soup = BeautifulSoup(data, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    return soup.get_text(separator="\n")


# Map content-type / extension -> parser
_PARSERS = {
    "application/pdf": parse_pdf,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": parse_docx,
    "text/plain": parse_text,
    "text/markdown": parse_text,
    "text/html": parse_html,
}

_EXT_PARSERS = {
    ".pdf": parse_pdf,
    ".docx": parse_docx,
    ".txt": parse_text,
    ".md": parse_text,
    ".markdown": parse_text,
    ".html": parse_html,
    ".htm": parse_html,
}


def extract_text(data: bytes, *, content_type: str | None = None, filename: str | None = None) -> str:
    """Best-effort text extraction from bytes using content-type or extension."""
    parser = None
    if content_type:
        parser = _PARSERS.get(content_type)
    if parser is None and filename:
        ext = filename[filename.rfind(".") :].lower() if "." in filename else ""
        parser = _EXT_PARSERS.get(ext)
    if parser is None:
        parser = parse_text  # last resort
    text = parser(data)
    return text.strip()
