#!/usr/bin/env bash
#
# convert-images.sh
#
# Recursively converts all JPG/JPEG/PNG images in a directory tree to WebP,
# constrains the longest edge to a max of 1920px (never upscales), and renames
# each file after its parent folder in camelCase + a zero-padded index, e.g.
#   my-photo folder/IMG_2931.JPG  ->  myPhotoFolder-001.webp
#
# Originals are deleted after a successful conversion.
#
# Usage:
#   ./scripts/convert-images.sh <directory> [--dry-run] [--quality N] [--max N]
#
# Options:
#   --dry-run      Show what would happen without touching any files.
#   --quality N    WebP quality (1-100). Default: 82
#   --max N        Max longest-edge resolution in px. Default: 1920
#
# Requires ImageMagick (the `magick` or `convert` command).

set -euo pipefail

# ---- defaults --------------------------------------------------------------
QUALITY=82
MAX_EDGE=1920
DRY_RUN=0
TARGET=""

# ---- parse args ------------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=1; shift ;;
    --quality) QUALITY="$2"; shift 2 ;;
    --max)     MAX_EDGE="$2"; shift 2 ;;
    -h|--help)
      sed -n '2,25p' "$0"; exit 0 ;;
    *)
      if [[ -z "$TARGET" ]]; then TARGET="$1"; shift
      else echo "Unknown argument: $1" >&2; exit 1; fi ;;
  esac
done

if [[ -z "$TARGET" ]]; then
  echo "Error: no directory given." >&2
  echo "Usage: $0 <directory> [--dry-run] [--quality N] [--max N]" >&2
  exit 1
fi

if [[ ! -d "$TARGET" ]]; then
  echo "Error: '$TARGET' is not a directory." >&2
  exit 1
fi

# ---- pick imagemagick binary ----------------------------------------------
if command -v magick >/dev/null 2>&1; then
  IM=(magick)
elif command -v convert >/dev/null 2>&1; then
  IM=(convert)
else
  echo "Error: ImageMagick not found. Install it (e.g. 'brew install imagemagick')." >&2
  exit 1
fi

# ---- helper: convert a folder name to camelCase ----------------------------
# "My Žižkov-Café_name" -> "myZizkovCafeName"
# Diacritics are transliterated to plain ASCII so filenames stay portable.
to_camel_case() {
  local name="$1"
  # 1. Decompose accented letters (é -> e + accent) and drop the accents.
  #    Unicode::Normalize is a core Perl module, so this needs no installs.
  name="$(printf '%s' "$name" | perl -CSD -MUnicode::Normalize -pe '$_ = NFD($_); s/\p{NonspacingMark}//g')"
  # 2. Map common letters that don't decompose under NFD.
  name="$(printf '%s' "$name" | sed -e 's/ł/l/g; s/Ł/L/g; s/ø/o/g; s/Ø/O/g; s/đ/d/g; s/Đ/D/g; s/æ/ae/g; s/Æ/AE/g; s/œ/oe/g; s/Œ/OE/g; s/ß/ss/g')"
  # 3. Replace any remaining non-alphanumeric run (incl. leftover non-ASCII
  #    such as CJK that has no ASCII form) with a single space. LC_ALL=C makes
  #    [:alnum:] strictly ASCII so no stray UTF-8 bytes reach the filename.
  name="$(printf '%s' "$name" | LC_ALL=C sed -E 's/[^[:alnum:]]+/ /g')"
  # 4. split into words, lowercase the first, capitalize the rest
  LC_ALL=C awk '{
    out=""
    for (i=1; i<=NF; i++) {
      w=$i
      if (i==1) {
        out = tolower(w)
      } else {
        out = out toupper(substr(w,1,1)) tolower(substr(w,2))
      }
    }
    print out
  }' <<< "$name"
}

# ---- main: walk every directory that contains images -----------------------
total_converted=0

# Find directories (null-delimited) so spaces in paths are safe.
while IFS= read -r -d '' dir; do
  # Gather images in THIS directory only (not recursing here; find already
  # visits every dir). Match jpg/jpeg/png case-insensitively, sorted for
  # stable numbering. Built with a null-delimited read loop so it works on the
  # bash 3.2 that ships with macOS (no mapfile dependency).
  images=()
  while IFS= read -r -d '' img; do
    images+=("$img")
  done < <(
    find "$dir" -maxdepth 1 -type f \
      \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \) \
      -print0 | sort -z
  )

  [[ ${#images[@]} -eq 0 ]] && continue

  folder_name="$(basename "$dir")"
  camel="$(to_camel_case "$folder_name")"
  [[ -z "$camel" ]] && camel="image"

  echo "📁 $dir  ->  ${camel}-NNN.webp  (${#images[@]} image(s))"

  idx=0
  for src in "${images[@]}"; do
    idx=$((idx + 1))
    num="$(printf '%03d' "$idx")"
    dest="$dir/${camel}-${num}.webp"

    if [[ "$DRY_RUN" -eq 1 ]]; then
      echo "   [dry-run] $(basename "$src")  ->  $(basename "$dest")"
      continue
    fi

    # Convert: shrink so the longest edge <= MAX_EDGE (the '>' flag prevents
    # upscaling), strip metadata, write webp.
    if "${IM[@]}" "$src" \
         -auto-orient \
         -resize "${MAX_EDGE}x${MAX_EDGE}>" \
         -strip \
         -quality "$QUALITY" \
         "$dest"; then
      echo "   ✓ $(basename "$src")  ->  $(basename "$dest")"
      # Remove original unless the source WAS the destination (can't happen
      # here since dest is always .webp and src is jpg/png).
      rm -f "$src"
      total_converted=$((total_converted + 1))
    else
      echo "   ✗ FAILED: $(basename "$src") (original kept)" >&2
    fi
  done
done < <(find "$TARGET" -type d -print0)

echo
if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "Dry run complete. No files were changed."
else
  echo "Done. Converted $total_converted image(s) to WebP."
fi
