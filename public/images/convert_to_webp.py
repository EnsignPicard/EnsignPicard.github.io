#!/usr/bin/env python3
"""
convert_to_webp.py — convert and resize images to WebP for the portfolio.

This is the single biggest performance fix: it shrinks the huge .jpg files
(the cause of the 8.8s LCP and 16.5 MB payload) into small .webp files.

USAGE
    pip install Pillow
    python convert_to_webp.py                 # process .jpg/.jpeg/.png in current folder
    python convert_to_webp.py ./images        # process a specific folder
    python convert_to_webp.py ./images -o ./out -m 1600 -q 82

After running, copy the resulting .webp files into your Astro project's
  public/images/
folder. The site already references image_1.webp ... image_8.webp.
"""

import argparse
import os
import sys

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow is not installed. Run:  pip install Pillow")

EXTS = (".jpg", ".jpeg", ".png")


def human(n):
    for unit in ("B", "KB", "MB"):
        if n < 1024:
            return f"{n:.0f} {unit}"
        n /= 1024
    return f"{n:.1f} GB"


def convert(in_dir, out_dir, max_side, quality):
    os.makedirs(out_dir, exist_ok=True)
    files = sorted(f for f in os.listdir(in_dir) if f.lower().endswith(EXTS))
    if not files:
        print(f"No images ({', '.join(EXTS)}) found in {in_dir!r}.")
        return

    total_before = total_after = 0
    print(f"{'file':<22}{'before':>10}{'after':>10}{'dimensions':>16}")
    print("-" * 58)

    for name in files:
        src = os.path.join(in_dir, name)
        stem = os.path.splitext(name)[0]
        dst = os.path.join(out_dir, stem + ".webp")

        before = os.path.getsize(src)
        with Image.open(src) as img:
            # Flatten transparency onto a neutral background for consistent output
            if img.mode in ("RGBA", "P", "LA"):
                img = img.convert("RGBA")
            else:
                img = img.convert("RGB")

            # Resize so the longest side is at most max_side (keeps aspect ratio)
            w, h = img.size
            if max(w, h) > max_side:
                scale = max_side / max(w, h)
                img = img.resize((round(w * scale), round(h * scale)), Image.LANCZOS)

            fw, fh = img.size
            img.save(dst, "WEBP", quality=quality, method=6)

        after = os.path.getsize(dst)
        total_before += before
        total_after += after
        print(f"{stem + '.webp':<22}{human(before):>10}{human(after):>10}{f'{fw}x{fh}':>16}")

    print("-" * 58)
    saved = total_before - total_after
    pct = (saved / total_before * 100) if total_before else 0
    print(f"{'TOTAL':<22}{human(total_before):>10}{human(total_after):>10}")
    print(f"\nSaved {human(saved)} ({pct:.0f}% smaller). Copy the .webp files into public/images/.")


def main():
    ap = argparse.ArgumentParser(description="Convert/resize images to WebP.")
    ap.add_argument("input", nargs="?", default=".", help="input folder (default: current)")
    ap.add_argument("-o", "--output", default=None, help="output folder (default: same as input)")
    ap.add_argument("-m", "--max-side", type=int, default=1600,
                    help="max width/height in px; larger images are scaled down (default: 1600)")
    ap.add_argument("-q", "--quality", type=int, default=82, help="WebP quality 1-100 (default: 82)")
    args = ap.parse_args()
    convert(args.input, args.output or args.input, args.max_side, args.quality)


if __name__ == "__main__":
    main()
