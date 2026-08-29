"""Regenerates the intro scroll sequence in public/intro from the source clip.

Requires opencv-python and Pillow, plus the source video at
media/intro-turntable.mp4. The video itself is not committed -- it is large, and
the extracted frames are the artefact the site actually ships. Ask the team for
the source clip if you need to re-run this.

    python scripts/extract-intro-frames.py

Source: 1280x720, 24fps, 240 frames, 10s turntable.

The clip orbits the buggy from a front-three-quarter view, past the side, all
the way round to the rear at source frame ~184, and then continues on to a
front-three-quarter view from the opposite side at the last frame.

Only the tail of that orbit ships. The intro opens on the buggy's rear and
turns it to face the reader, landing on the pose the live 3D scene is posed to
match, so the cross-dissolve at the end of the section has nothing to correct:

  - Source frames 184..239 inclusive. 184 is the dead-rear view; 239 is the
    closing three-quarter that Car3DCanvas's `matchPose` was authored against.
  - Every frame is kept, not every third. The old sequence sampled 8fps across
    the whole 290-degree orbit, which meant ~3.6 degrees between frames and a
    visibly steppy scrub. Keeping all 56 frames of a 145-degree arc more than
    halves that to ~2.6 degrees, and the component cross-fades between adjacent
    frames on top, so the turn reads as continuous motion.
  - The right 160px are cropped away: the clip carries a generator watermark in
    the bottom-right corner. The vehicle sits well inside what remains.
  - WebP, at a higher quality than the old sequence. The shorter arc left room
    in the budget, and per-frame compression noise is itself visible as a
    flicker while scrubbing.
  - Two tiers so phones do not download the full-resolution sequence.

Keep FRAME_COUNT in src/components/IntroScrollSequence.jsx in sync with the
frame count reported at the end of this script.
"""

import shutil
import sys
from pathlib import Path

import cv2
from PIL import Image

# Inclusive source frame range: dead rear through to the closing three-quarter.
FIRST_SOURCE_FRAME = 184
LAST_SOURCE_FRAME = 239

# The watermark lives in the right-hand strip of the 1280px source.
CROP_WIDTH = 1120

TIERS = {
    # name:     (width, height, webp quality)
    "desktop": (1120, 720, 82),
    "mobile": (560, 360, 80),
}

REPO = Path(__file__).resolve().parent.parent
SRC = REPO / "media" / "intro-turntable.mp4"
ROOT = REPO / "public" / "intro"


def main() -> int:
    if not SRC.exists():
        print(f"Source clip not found at {SRC}", file=sys.stderr)
        return 1

    capture = cv2.VideoCapture(str(SRC))
    if not capture.isOpened():
        print(f"Could not open {SRC}", file=sys.stderr)
        return 1

    for tier in TIERS:
        directory = ROOT / tier
        if directory.exists():
            shutil.rmtree(directory)
        directory.mkdir(parents=True)

    written = 0
    source_index = 0
    while True:
        ok, frame = capture.read()
        if not ok:
            break
        if FIRST_SOURCE_FRAME <= source_index <= LAST_SOURCE_FRAME:
            written += 1
            image = Image.fromarray(
                cv2.cvtColor(frame[:, :CROP_WIDTH], cv2.COLOR_BGR2RGB)
            )
            for tier, (width, height, quality) in TIERS.items():
                resized = (
                    image
                    if image.size == (width, height)
                    else image.resize((width, height), Image.LANCZOS)
                )
                resized.save(
                    ROOT / tier / f"frame_{written:03d}.webp",
                    "WEBP",
                    quality=quality,
                    method=6,
                )
        source_index += 1
    capture.release()

    expected = LAST_SOURCE_FRAME - FIRST_SOURCE_FRAME + 1
    if written != expected:
        print(f"Expected {expected} frames, wrote {written}", file=sys.stderr)
        return 1

    for tier in TIERS:
        files = sorted((ROOT / tier).glob("*.webp"))
        total = sum(path.stat().st_size for path in files)
        average = total / len(files) / 1024
        print(
            f"{tier:<8} frames={len(files):<5} "
            f"total={total / 1024 / 1024:.2f} MB  avg={average:.1f} KB"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
