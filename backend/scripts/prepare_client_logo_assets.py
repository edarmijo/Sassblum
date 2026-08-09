"""Create non-destructive transparent versions of supplied client logo files.

Usage:
    python scripts/prepare_client_logo_assets.py --input-dir "C:\\Users\\me\\Downloads"

The script only removes the connected, flat outer background. It never redraws
or generates a third-party mark, preserving its original pixels and geometry.
"""

from __future__ import annotations

import argparse
from collections import deque
from pathlib import Path

from PIL import Image


ASSETS = {
    "aceria-xinlong.png": ("Acer*.png", 8),
    "la-sevillana.png": ("La Sevillana.jpg", 8),
    "velazquez-velazquez-abogados.png": ("Vel*.jpg", 24),
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input-dir", required=True, type=Path)
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path(__file__).resolve().parents[2] / "frontend" / "public" / "client-logos" / "manual",
    )
    return parser.parse_args()


def safe_child(directory: Path, candidate: Path) -> Path:
    """Resolve a constructed path and reject paths outside its declared directory."""
    resolved_directory = directory.resolve(strict=True)
    resolved_candidate = candidate.resolve(strict=True)
    if not resolved_candidate.is_relative_to(resolved_directory):
        raise ValueError(f"Path outside the declared directory: {candidate}")
    return resolved_candidate


def safe_output(directory: Path, filename: str) -> Path:
    """Return a validated output path that cannot escape the output directory."""
    resolved_directory = directory.resolve()
    output = (resolved_directory / filename).resolve()
    if not output.is_relative_to(resolved_directory):
        raise ValueError(f"Invalid output filename: {filename}")
    return output


def within_tolerance(pixel: tuple[int, int, int, int], background: tuple[int, int, int, int], tolerance: int) -> bool:
    return max(abs(pixel[index] - background[index]) for index in range(3)) <= tolerance


def remove_connected_background(image: Image.Image, tolerance: int) -> Image.Image:
    """Set only background pixels connected to an image edge to transparent."""
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    background = pixels[0, 0]
    queue: deque[tuple[int, int]] = deque()
    visited: set[tuple[int, int]] = set()

    for x in range(width):
        queue.extend(((x, 0), (x, height - 1)))
    for y in range(height):
        queue.extend(((0, y), (width - 1, y)))

    while queue:
        x, y = queue.popleft()
        if (x, y) in visited:
            continue
        visited.add((x, y))
        if not within_tolerance(pixels[x, y], background, tolerance):
            continue
        pixels[x, y] = (*pixels[x, y][:3], 0)
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in visited:
                queue.append((nx, ny))
    return rgba


def main() -> int:
    args = parse_args()
    input_dir = args.input_dir.resolve(strict=True)
    if not input_dir.is_dir():
        raise NotADirectoryError(f"Input directory not found: {args.input_dir}")
    output_dir = args.output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    for output_name, (pattern, tolerance) in ASSETS.items():
        matches = sorted(input_dir.glob(pattern))
        if len(matches) != 1:
            raise FileNotFoundError(f"Expected exactly one source for {output_name}: {pattern}")
        source = safe_child(input_dir, matches[0])
        output = safe_output(output_dir, output_name)
        transparent = remove_connected_background(Image.open(source), tolerance)
        transparent.save(output, "PNG")
        print(f"Wrote {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
