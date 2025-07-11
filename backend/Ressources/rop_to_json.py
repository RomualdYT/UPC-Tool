#!/usr/bin/env python3
"""
rop_to_json.py  — v2 (2025‑07‑11)

Convert the Unified Patent Court Rules of Procedure PDF to structured JSON for interactive
web use.

New in **v2**
-------------
* Detects and exports the **PREAMBLE** and **APPLICATION AND INTERPRETATION OF THE RULES**
  blocks that precede PART I of the RoP.  They are emitted as dedicated top‑level keys
  (`preamble` and `application_and_interpretation`) so that a front‑end can render them
  separately from the numbered Parts/Chapters/Rules hierarchy.
* Refactored the parser to return a single dict rather than just an array.  Existing code
  that expected `data["content"]` continues to work; the new keys are optional extras.

JSON layout emitted
-------------------
```
{
  "source_file": "/abs/path/rop.pdf",
  "export_date": "2025‑07‑11T12:34:56Z",
  "preamble": ["Paragraph 1", "Paragraph 2", …],
  "application_and_interpretation": ["Paragraph 1", "Paragraph 2", …],
  "content": [ { «Part objects just like before» } ]
}
```

Usage (unchanged):
    python rop_to_json.py --input RoP.pdf --output rop.json

Dependencies:
    pip install pdfplumber
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

try:
    import pdfplumber
except ImportError:  # pragma: no cover
    sys.stderr.write("pdfplumber is required. Install it with 'pip install pdfplumber'\n")
    sys.exit(1)

# ----------------------------------------------------------------------------
# Regular‑expression patterns for structural markers
# ----------------------------------------------------------------------------
PART_RE = re.compile(r"^PART\s+(\d+)\s+[–-]\s+(.*)$", re.IGNORECASE)
CHAPTER_RE = re.compile(r"^CHAPTER\s+([IVXLCDM\d]+)\s+[–-]\s+(.*)$", re.IGNORECASE)
SECTION_RE = re.compile(r"^SECTION\s+([IVXLCDM\d]+)\s+[–-]\s+(.*)$", re.IGNORECASE)
RULE_RE = re.compile(r"^Rule\s+([0-9A-Z]+)\s+[–-]\s+(.*)$", re.IGNORECASE)
PREAMBLE_RE = re.compile(r"^PREAMBLE$", re.IGNORECASE)
APPLICATION_RE = re.compile(r"^APPLICATION AND INTERPRETATION OF THE RULES$", re.IGNORECASE)

# ----------------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------------

def _norm(text: str) -> str:
    """Collapse runs of whitespace and trim."""
    return " ".join(text.strip().split())

# ----------------------------------------------------------------------------
# PDF parsing core
# ----------------------------------------------------------------------------

def parse_pdf(path: str | Path) -> Dict[str, Any]:
    """Parse the RoP PDF and return a structured dict ready for JSON export."""

    structure: List[Dict[str, Any]] = []  # the traditional Parts list
    preamble: List[str] = []
    application: List[str] = []

    cur_part = cur_chapter = cur_section = None  # type: ignore

    # Tracks where free‑floating paragraph text should be appended.
    current_paragraph_sink: List[str] | None = None

    with pdfplumber.open(str(path)) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            for raw in text.splitlines():
                line = _norm(raw)
                if not line:
                    continue

                # -----------------------------------------------------------------
                # Top‑level special blocks
                # -----------------------------------------------------------------
                if PREAMBLE_RE.match(line):
                    current_paragraph_sink = preamble
                    continue
                if APPLICATION_RE.match(line):
                    current_paragraph_sink = application
                    continue

                # -----------------------------------------------------------------
                # Hierarchy detection (Part/Chapter/Section/Rule)
                # -----------------------------------------------------------------
                if (m := PART_RE.match(line)):
                    cur_part = {
                        "part_number": m.group(1),
                        "part_title": m.group(2),
                        "chapters": [],
                    }
                    structure.append(cur_part)
                    cur_chapter = cur_section = None
                    current_paragraph_sink = None  # now we’re inside the tree
                    continue

                if (m := CHAPTER_RE.match(line)) and cur_part is not None:
                    cur_chapter = {
                        "chapter_number": m.group(1),
                        "chapter_title": m.group(2),
                        "sections": [],
                    }
                    cur_part["chapters"].append(cur_chapter)
                    cur_section = None
                    current_paragraph_sink = None
                    continue

                if (m := SECTION_RE.match(line)) and cur_chapter is not None:
                    cur_section = {
                        "section_number": m.group(1),
                        "section_title": m.group(2),
                        "rules": [],
                    }
                    cur_chapter["sections"].append(cur_section)
                    current_paragraph_sink = None
                    continue

                if (m := RULE_RE.match(line)) and cur_section is not None:
                    rule_obj = {
                        "rule_number": m.group(1),
                        "rule_title": m.group(2),
                        "paragraphs": [],
                    }
                    cur_section["rules"].append(rule_obj)
                    # subsequent free‑running lines are rule paragraphs
                    current_paragraph_sink = rule_obj["paragraphs"]
                    continue

                # -----------------------------------------------------------------
                # Paragraph aggregation
                # -----------------------------------------------------------------
                if current_paragraph_sink is not None:
                    current_paragraph_sink.append(line)
                # else: we’re between logical blocks (e.g. running headers) – ignore

    return {
        "preamble": preamble,
        "application_and_interpretation": application,
        "content": structure,
    }

# ----------------------------------------------------------------------------
# CLI wrapper
# ----------------------------------------------------------------------------

def main() -> None:  # pragma: no cover
    parser = argparse.ArgumentParser(
        description="Export UPC Rules of Procedure PDF to a clean JSON representation for web apps.")
    parser.add_argument("--input", required=True, help="Path to the RoP PDF file")
    parser.add_argument("--output", required=True, help="Destination path for JSON export")
    args = parser.parse_args()

    result = {
        "source_file": os.path.abspath(args.input),
        "export_date": datetime.utcnow().replace(microsecond=0).isoformat() + "Z",
        **parse_pdf(args.input),
    }

    with open(args.output, "w", encoding="utf-8") as fp:
        json.dump(result, fp, ensure_ascii=False, indent=2)

    print(f"✔️  Export complete → {args.output}")

if __name__ == "__main__":
    main()
