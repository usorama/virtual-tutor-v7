#!/usr/bin/env python3

import argparse
import re
import sys
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Tuple, List

# Optional OCR deps
try:
    import pytesseract  # type: ignore
    from pdf2image import convert_from_path  # type: ignore
except Exception:  # pragma: no cover
    pytesseract = None  # type: ignore
    convert_from_path = None  # type: ignore

# Try pypdf first (modern), fall back to PyPDF2 if unavailable
try:
    from pypdf import PdfReader  # type: ignore
except Exception:  # pragma: no cover
    try:
        from PyPDF2 import PdfReader  # type: ignore
    except Exception:  # pragma: no cover
        print(
            "ERROR: Neither pypdf nor PyPDF2 is installed. "
            "Please install one of them:",
            file=sys.stderr,
        )
        print("  python3 -m pip install pypdf", file=sys.stderr)
        sys.exit(1)


@dataclass
class DetectedChapter:
    chapter_number: int
    chapter_title: str


CHAPTER_PATTERNS: Tuple[re.Pattern, ...] = (
    re.compile(r"\bChapter\s+(\d+)\s*[:\-–—\.]?\s*(.+)", re.IGNORECASE),
    re.compile(r"\bLesson\s+(\d+)\s*[:\-–—\.]?\s*(.+)", re.IGNORECASE),
    re.compile(r"\bUnit\s+(\d+)\s*[:\-–—\.]?\s*(.+)", re.IGNORECASE),
    re.compile(r"\bCh\.?\s*(\d+)\s*[:\-–—\.]?\s*(.+)", re.IGNORECASE),
)

# Some NCERT books present as "CHAPTER ONE"; map words to numbers as fallback
WORD_NUMBERS = {
    "one": 1,
    "two": 2,
    "three": 3,
    "four": 4,
    "five": 5,
    "six": 6,
    "seven": 7,
    "eight": 8,
    "nine": 9,
    "ten": 10,
    "eleven": 11,
    "twelve": 12,
    "thirteen": 13,
    "fourteen": 14,
    "fifteen": 15,
    "sixteen": 16,
}

CHAPTER_WORD_PATTERN = re.compile(
    (
        r"\bChapter\s+"
        r"(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|"
        r"thirteen|fourteen|fifteen|sixteen)\b\s*(.+)?"
    ),
    re.IGNORECASE,
)

INVALID_FILENAME_CHARS = re.compile(r"[\\/:*?\"<>|]")
MULTI_SPACE = re.compile(r"\s+")

# Heuristic tokens to ignore when probing titles
SKIP_TITLE_TOKENS = re.compile(
    r"^(contents|index|copyright|ncert|government of|acknowledg|preface|"
    r"foreword)\b",
    re.IGNORECASE,
)


def normalize_text(text: str) -> str:
    # Normalize unicode and collapse spaces
    normalized = unicodedata.normalize("NFKC", text)
    normalized = normalized.replace("\u00ad", "")  # soft hyphen
    normalized = MULTI_SPACE.sub(" ", normalized)
    return normalized.strip()


def sanitize_filename_component(name: str, max_len: int = 100) -> str:
    name = normalize_text(name)
    name = INVALID_FILENAME_CHARS.sub(" ", name)
    name = name.replace("\n", " ").replace("\r", " ")
    name = MULTI_SPACE.sub(" ", name).strip()
    if len(name) > max_len:
        name = name[:max_len].rstrip()
    return name


def extract_text_from_pages(
    pdf_path: Path,
    max_pages: int = 10,
) -> List[str]:
    reader = PdfReader(str(pdf_path))
    num_pages = min(len(reader.pages), max_pages)
    lines: List[str] = []
    for i in range(num_pages):
        try:
            page = reader.pages[i]
            text = page.extract_text() or ""
            if not isinstance(text, str):
                text = str(text)
            for raw_line in text.splitlines():
                line = normalize_text(raw_line)
                if line:
                    lines.append(line)
        except Exception:
            continue
    return lines


def extract_text_with_ocr(
    pdf_path: Path,
    max_pages: int = 5,
    dpi: int = 200,
) -> List[str]:
    if pytesseract is None or convert_from_path is None:
        return []
    try:
        images = convert_from_path(
            str(pdf_path),
            dpi=dpi,
            first_page=1,
            last_page=max_pages,
        )
    except Exception:
        return []

    lines: List[str] = []
    for img in images:
        try:
            text = pytesseract.image_to_string(img, lang="eng")
        except Exception:
            continue
        for raw_line in text.splitlines():
            line = normalize_text(raw_line)
            if line:
                lines.append(line)
    return lines


def detect_uppercase_title(lines: List[str]) -> Optional[str]:
    # Look for strong title candidates near top of the document
    candidates: List[str] = []
    for idx, line in enumerate(lines[:100]):
        if len(line) < 5 or len(line) > 100:
            continue
        if SKIP_TITLE_TOKENS.search(line):
            continue
        # All uppercase or Title Case words
        has_letters = re.search(r"[A-Za-z]", line) is not None
        if not has_letters:
            continue
        if line.isupper():
            candidates.append(line)
            continue
        # Title Case heuristic: many words start with uppercase
        words = [w for w in re.split(r"\s+", line) if w]
        if not words:
            continue
        upper_initials = sum(1 for w in words if w[:1].isupper())
        if upper_initials >= max(2, int(0.6 * len(words))):
            candidates.append(line)
    if candidates:
        # Return the first strong candidate
        return candidates[0]
    return None


def try_detect_chapter(lines: List[str]) -> Optional[DetectedChapter]:
    buffered_lines = list(lines)

    # Pass 1: Direct regex patterns with number + trailing title
    for line in buffered_lines:
        for pattern in CHAPTER_PATTERNS:
            match = pattern.search(line)
            if not match:
                continue
            try:
                chapter_number = int(match.group(1))
            except Exception:
                continue
            title = (
                match.group(2).strip()
                if match.lastindex and match.lastindex >= 2
                else ""
            )
            if not title:
                continue
            if len(title) < 3:
                continue
            return DetectedChapter(
                chapter_number=chapter_number, chapter_title=title
            )

    # Pass 2: Pattern where title is on the next line(s)
    for idx, line in enumerate(buffered_lines):
        for pattern in CHAPTER_PATTERNS:
            match = pattern.search(line)
            if not match:
                continue
            try:
                chapter_number = int(match.group(1))
            except Exception:
                continue
            for look_ahead in range(1, 5):
                if idx + look_ahead >= len(buffered_lines):
                    break
                candidate = buffered_lines[idx + look_ahead].strip()
                if not candidate:
                    continue
                if SKIP_TITLE_TOKENS.search(candidate):
                    continue
                if re.fullmatch(r"\d+", candidate):
                    continue
                if len(candidate) < 5:
                    continue
                return DetectedChapter(
                    chapter_number=chapter_number, chapter_title=candidate
                )

    # Pass 3: Word-number chapter detection like "CHAPTER NINE"
    for idx, line in enumerate(buffered_lines):
        match = CHAPTER_WORD_PATTERN.search(line)
        if not match:
            continue
        word = (match.group(1) or "").lower()
        chapter_number = WORD_NUMBERS.get(word)
        if not chapter_number:
            continue
        remainder = (match.group(2) or "").strip()
        if remainder and len(remainder) > 3:
            return DetectedChapter(
                chapter_number=chapter_number, chapter_title=remainder
            )
        for look_ahead in range(1, 5):
            if idx + look_ahead >= len(buffered_lines):
                break
            candidate = buffered_lines[idx + look_ahead].strip()
            if not candidate or len(candidate) < 5:
                continue
            if re.fullmatch(r"\d+", candidate):
                continue
            return DetectedChapter(
                chapter_number=chapter_number, chapter_title=candidate
            )

    # Pass 4: Uppercase/title-case heuristic for title only
    title_only = detect_uppercase_title(buffered_lines)
    if title_only:
        return DetectedChapter(chapter_number=0, chapter_title=title_only)

    return None


def derive_subject_from_path(pdf_path: Path, base_dir: Path) -> str:
    # Use immediate directory as subject context. Fallback to first level
    try:
        relative = pdf_path.relative_to(base_dir)
        parts = relative.parts
        if len(parts) >= 2:
            subject_dir = parts[0]
        else:
            subject_dir = pdf_path.parent.name
    except Exception:
        subject_dir = pdf_path.parent.name
    return sanitize_filename_component(subject_dir, max_len=80)


def should_skip_path(pdf_path: Path) -> bool:
    # Skip Mathematics as per user instruction
    for part in pdf_path.parts:
        if "Mathematics" in part:
            return True
    return False


def build_new_filename(
    pdf_path: Path, base_dir: Path, detected: DetectedChapter
) -> str:
    subject = derive_subject_from_path(pdf_path, base_dir)
    title = sanitize_filename_component(detected.chapter_title, max_len=80)
    number = (
        f"{detected.chapter_number:02d}"
        if detected.chapter_number > 0
        else "00"
    )
    new_name = f"{subject} - Ch {number} - {title}.pdf"
    return new_name


def propose_rename(pdf_path: Path, base_dir: Path) -> Optional[str]:
    if should_skip_path(pdf_path):
        return None
    try:
        text_lines = extract_text_from_pages(pdf_path, max_pages=10)
        detected = try_detect_chapter(text_lines)
        if not detected:
            # Low text? try OCR fallback
            if len(text_lines) < 10:
                ocr_lines = extract_text_with_ocr(
                    pdf_path,
                    max_pages=5,
                    dpi=200,
                )
                if ocr_lines:
                    detected = try_detect_chapter(ocr_lines)
        if not detected:
            return None
        return build_new_filename(pdf_path, base_dir, detected)
    except Exception:
        return None


def ensure_unique_path(target_dir: Path, proposed_name: str) -> Path:
    candidate = target_dir / proposed_name
    if not candidate.exists():
        return candidate
    stem = candidate.stem
    suffix = candidate.suffix
    counter = 2
    while True:
        alt = target_dir / f"{stem} ({counter}){suffix}"
        if not alt.exists():
            return alt
        counter += 1


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Rename textbook PDFs based on detected chapter titles."
        )
    )
    parser.add_argument(
        "base_dir",
        type=str,
        help=(
            "Base directory containing textbooks (e.g., /path/to/text-books)"
        ),
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Apply changes (otherwise dry-run)",
    )
    parser.add_argument(
        "--max",
        type=int,
        default=0,
        help="Limit number of files to process (0 = no limit)",
    )
    args = parser.parse_args()

    base_dir = Path(args.base_dir).expanduser().resolve()
    if not base_dir.exists() or not base_dir.is_dir():
        print(f"ERROR: Base directory not found: {base_dir}", file=sys.stderr)
        return 2

    processed = 0
    renamed = 0
    skipped = 0

    pdf_files = sorted(base_dir.rglob("*.pdf"))
    for pdf_path in pdf_files:
        if args.max and processed >= args.max:
            break
        processed += 1

        if should_skip_path(pdf_path):
            print(f"SKIP [Mathematics]: {pdf_path}")
            skipped += 1
            continue

        proposed_name = propose_rename(pdf_path, base_dir)
        if not proposed_name:
            print(f"SKIP [No chapter detected]: {pdf_path}")
            skipped += 1
            continue

        target_path = ensure_unique_path(pdf_path.parent, proposed_name)
        if target_path.name == pdf_path.name:
            print(f"OK [Already named]: {pdf_path.name}")
            continue

        action = "RENAME" if args.apply else "DRY-RUN"
        print(f"{action}: {pdf_path.name} -> {target_path.name}")

        if args.apply:
            try:
                pdf_path.rename(target_path)
                renamed += 1
            except Exception as ex:
                print(f"ERROR renaming '{pdf_path}': {ex}", file=sys.stderr)

    print(
        f"\nSummary: processed={processed}, renamed={renamed}, "
        f"skipped={skipped}, apply={args.apply}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
