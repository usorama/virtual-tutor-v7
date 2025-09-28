#!/usr/bin/env python3

import argparse
import re
import sys
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, List, Dict

import yaml  # type: ignore

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


# Acceptable number range to avoid picking page numbers
MIN_CHAPTER_NUMBER = 1
MAX_CHAPTER_NUMBER = 40

INVALID_FILENAME_CHARS = re.compile(r"[\\/:*?\"<>|]")
MULTI_SPACE = re.compile(r"\s+")

# Heuristic tokens to ignore when probing titles
SKIP_TITLE_TOKENS = re.compile(
    r"^(contents|index|ncert|government of|acknowledg|preface|"
    r"foreword|exercise|summary|glossary|workshop|comprehension|reading|"
    r"assignment|revision|note[s]?|poem|prose)\b",
    re.IGNORECASE,
)

BANNED_TITLES = {
    "BEFORE YOU READ",
    "FIRST EDITION",
}

NEGATIVE_STARTS = re.compile(
    r"^(find out|do you think|you may know|answer the following|discuss|"
    r"fill in|match the following|choose the correct|complete the|"
    r"true or false|pick out|make a list|work in pairs)\b",
    re.IGNORECASE,
)

ROMAN_LIST_ITEM = re.compile(r"^[IVXLCDM]{1,6}[\).]?\s+.+", re.IGNORECASE)


def normalize_text(text: str) -> str:
    normalized = unicodedata.normalize("NFKC", text)
    normalized = normalized.replace("\u00ad", "")
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


def extract_text_first_page(pdf_path: Path, dpi: int = 220) -> List[str]:
    if pytesseract is None or convert_from_path is None:
        return []
    try:
        images = convert_from_path(
            str(pdf_path),
            dpi=dpi,
            first_page=1,
            last_page=1,
        )
    except Exception:
        return []
    if not images:
        return []
    try:
        text = pytesseract.image_to_string(images[0], lang="eng")
    except Exception:
        return []
    lines = []
    for raw in text.splitlines():
        item = normalize_text(raw)
        if item:
            lines.append(item)
    return lines


def extract_text_from_pages(pdf_path: Path, max_pages: int = 3) -> List[str]:
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


def is_banned_title(line: str) -> bool:
    if "?" in line:
        return True
    if NEGATIVE_STARTS.search(line):
        return True
    if normalize_text(line).upper() in BANNED_TITLES:
        return True
    return False


def looks_like_title_fragment(line: str) -> bool:
    if not line or len(line) > 80:
        return False
    if SKIP_TITLE_TOKENS.search(line) or is_banned_title(line):
        return False
    if ROMAN_LIST_ITEM.match(line):
        return False
    words = [w for w in line.split() if w]
    if not words:
        return False
    upper_initials = sum(1 for w in words if w[:1].isupper())
    if line.isupper() or upper_initials >= max(2, int(0.6 * len(words))):
        return True
    return False


def combine_title_lines(lines: List[str], start_idx: int) -> Optional[str]:
    parts: List[str] = []
    for offset in range(0, 3):
        idx = start_idx + offset
        if idx >= len(lines):
            break
        candidate = lines[idx].strip()
        if not looks_like_title_fragment(candidate):
            break
        parts.append(candidate)
    if not parts:
        return None
    combined = " ".join(parts)
    return combined if 5 <= len(combined) <= 120 else None


def find_title_near_index(lines: List[str], index: int) -> Optional[str]:
    start = max(0, index - 3)
    end = min(len(lines), index + 8)
    window = lines[start:end]
    for i, line in enumerate(window):
        abs_idx = start + i
        if looks_like_title_fragment(line):
            combined = combine_title_lines(lines, abs_idx)
            if combined:
                return combined
    return None


def in_range(num: int) -> bool:
    return MIN_CHAPTER_NUMBER <= num <= MAX_CHAPTER_NUMBER


def load_rules(rules_dir: Path) -> List[Dict]:
    rules: List[Dict] = []
    if not rules_dir.exists():
        return rules
    for yfile in rules_dir.glob("*.yaml"):
        try:
            with yfile.open("r", encoding="utf-8") as f:
                doc = yaml.safe_load(f)
                if isinstance(doc, dict):
                    rules.append(doc)
        except Exception:
            continue
    return rules


def match_rule_for_folder(
    rules: List[Dict],
    folder_path: Path,
) -> Optional[Dict]:
    folder_name = folder_path.name
    for rule in rules:
        pattern = str(rule.get("folder_match", "")).strip()
        if not pattern:
            continue
        if pattern in folder_name:
            return rule
        try:
            if re.search(pattern, folder_name):
                return rule
        except re.error:
            continue
    return None


def match_chapter_from_keywords(
    text_lines: List[str],
    rule: Dict,
) -> Optional[DetectedChapter]:
    joined = "\n".join(text_lines).lower()
    best: Optional[DetectedChapter] = None
    best_hits = 0
    for ch in rule.get("chapters", []):
        title = str(ch.get("title", "")).strip()
        number = int(ch.get("number", 0))
        hits = 0
        for kw in ch.get("keywords", []):
            if kw.lower() in joined:
                hits += 1
        tokens = [
            t for t in re.split(r"\W+", title.lower()) if t and len(t) > 2
        ]
        token_hits = sum(1 for t in tokens if t in joined)
        score = hits * 2 + token_hits
        required = max(2, len(tokens) // 2)
        if score > best_hits and (hits > 0 or token_hits >= required):
            best_hits = score
            best = DetectedChapter(
                chapter_number=number,
                chapter_title=title,
            )
    return best


def try_detect_chapter_generic(lines: List[str]) -> Optional[DetectedChapter]:
    for idx, line in enumerate(lines[:50]):
        if re.fullmatch(r"\d{1,2}", line):
            num = int(line)
            if not in_range(num):
                continue
            near = find_title_near_index(lines, idx + 1)
            if near:
                return DetectedChapter(chapter_number=num, chapter_title=near)
    return None


def derive_subject_from_path(pdf_path: Path, base_dir: Path) -> str:
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


def propose_rename(
    pdf_path: Path,
    base_dir: Path,
    rules: List[Dict],
) -> Optional[str]:
    if should_skip_path(pdf_path):
        return None

    rule = match_rule_for_folder(rules, pdf_path.parent)
    if rule:
        first_page_lines = extract_text_first_page(pdf_path, dpi=260)
        detected = match_chapter_from_keywords(first_page_lines, rule)
        if not detected:
            lines = extract_text_from_pages(pdf_path, max_pages=2)
            detected = match_chapter_from_keywords(lines, rule)
        if detected:
            return build_new_filename(pdf_path, base_dir, detected)

    lines = extract_text_from_pages(pdf_path, max_pages=3)
    detected = try_detect_chapter_generic(lines)
    if detected:
        return build_new_filename(pdf_path, base_dir, detected)

    if len(lines) < 8:
        ocr_lines = extract_text_first_page(pdf_path, dpi=280)
        detected = try_detect_chapter_generic(ocr_lines)
        if detected:
            return build_new_filename(pdf_path, base_dir, detected)

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
            "Rename textbook PDFs based on rules and detected chapter titles."
        )
    )
    parser.add_argument(
        "base_dir",
        type=str,
        help=(
            "Base directory or specific folder (e.g., /path/to/text-books)"
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
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="Suppress per-file logs; only show summary",
    )
    args = parser.parse_args()

    base_dir = Path(args.base_dir).expanduser().resolve()
    if not base_dir.exists():
        print(f"ERROR: Base directory not found: {base_dir}", file=sys.stderr)
        return 2

    rules_dir = Path(__file__).parent / "rules"
    rules = load_rules(rules_dir)

    processed = 0
    renamed = 0
    skipped = 0

    targets: List[Path]
    if base_dir.is_file() and base_dir.suffix.lower() == ".pdf":
        targets = [base_dir]
        parent_for_subject = base_dir.parent
    else:
        targets = sorted(base_dir.rglob("*.pdf"))
        parent_for_subject = base_dir

    for pdf_path in targets:
        if args.max and processed >= args.max:
            break
        processed += 1

        proposed_name = propose_rename(
            pdf_path,
            parent_for_subject if parent_for_subject.is_dir() else base_dir.parent,
            rules,
        )
        if not proposed_name:
            if not args.quiet:
                print(f"SKIP [No chapter detected]: {pdf_path}")
            skipped += 1
            continue

        target_path = ensure_unique_path(pdf_path.parent, proposed_name)
        if target_path.name == pdf_path.name:
            if not args.quiet:
                print(f"OK [Already named]: {pdf_path.name}")
            continue

        action = "RENAME" if args.apply else "DRY-RUN"
        if not args.quiet:
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
