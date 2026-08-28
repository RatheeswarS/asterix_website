# Regenerates the intro scroll sequence in public/intro from the source clip.
#
# Requires ffmpeg on PATH (winget install Gyan.FFmpeg) and the source video at
# media/intro-turntable.mp4. The video itself is not committed -- it is large,
# and the extracted frames are the artefact the site actually ships. Ask the
# team for the source clip if you need to re-run this.
#
# Source: 1280x720, 24fps, 240 frames, 10s turntable.
#
#   - Every third frame is kept (80 frames). That is ample density for a
#     scrubbed turntable and keeps the payload small enough to preload before
#     the intro is reachable.
#   - The right 160px are cropped away: the clip carries a generator watermark
#     in the bottom-right corner. The vehicle sits well inside what remains.
#   - WebP rather than JPEG, roughly 40% of the bytes at equivalent quality.
#   - Two tiers so phones do not download the full-resolution sequence.
#
# Keep FRAME_COUNT in src/components/IntroScrollSequence.jsx in sync with the
# frame count reported at the end of this script.

$ErrorActionPreference = 'Stop'

$repo = Split-Path -Parent $PSScriptRoot
$src = Join-Path $repo 'media\intro-turntable.mp4'
$root = Join-Path $repo 'public\intro'

if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
    throw 'ffmpeg not found on PATH. Install it with: winget install Gyan.FFmpeg'
}
if (-not (Test-Path $src)) {
    throw "Source clip not found at $src"
}

foreach ($tier in @('desktop', 'mobile')) {
    $dir = Join-Path $root $tier
    if (Test-Path $dir) { Remove-Item $dir -Recurse -Force }
    New-Item -ItemType Directory -Force $dir | Out-Null
}

# Desktop: cropped 1120x720.
ffmpeg -hide_banner -loglevel error -i $src `
    -vf "crop=1120:720:0:0,select='not(mod(n\,3))'" -fps_mode passthrough `
    -c:v libwebp -quality 74 -compression_level 6 "$root\desktop\frame_%03d.webp"

# Mobile: same crop at half linear resolution.
ffmpeg -hide_banner -loglevel error -i $src `
    -vf "crop=1120:720:0:0,select='not(mod(n\,3))',scale=560:360" -fps_mode passthrough `
    -c:v libwebp -quality 72 -compression_level 6 "$root\mobile\frame_%03d.webp"

foreach ($tier in @('desktop', 'mobile')) {
    $dir = Join-Path $root $tier
    $files = Get-ChildItem $dir -Filter *.webp
    $total = ($files | Measure-Object Length -Sum).Sum
    $avg = if ($files.Count) { [math]::Round($total / $files.Count / 1KB, 1) } else { 0 }
    "{0,-8} frames={1,-5} total={2} MB  avg={3} KB" -f $tier, $files.Count, [math]::Round($total / 1MB, 2), $avg
}
