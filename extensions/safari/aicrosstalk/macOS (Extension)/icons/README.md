# Extension Icons

This directory should contain PNG icon files for the Safari extension.

## Required Files

- `icon-16.png` (16×16 pixels)
- `icon-32.png` (32×32 pixels)
- `icon-48.png` (48×48 pixels)
- `icon-128.png` (128×128 pixels)

## Quick Generation

### Using ImageMagick

```bash
# Create a simple circular icon with brand colors
convert -size 128x128 xc:none \
  -fill "#667eea" \
  -draw "circle 64,64 64,10" \
  icon-128.png

# Resize for other sizes
convert icon-128.png -resize 48x48 icon-48.png
convert icon-128.png -resize 32x32 icon-32.png
convert icon-128.png -resize 16x16 icon-16.png
```

### Using Design Tools

Create icons that represent AI communication:
- Two speech bubbles
- Connected nodes/circuits
- Robot faces talking to each other
- Arrow exchange symbol

**Brand colors:**
- Primary: `#667eea` (purple-blue)
- Secondary: `#764ba2` (purple)
- Accent: `#10b981` (green)

## Design Guidelines

- Use simple, recognizable shapes
- Ensure visibility at 16×16 size
- Use transparent background
- Consider both light and dark Safari themes
- Export as PNG with alpha channel

## Alternative: Use Emoji

For quick testing, you can use emoji as icons:

```bash
# macOS shortcut: Cmd+Ctrl+Space to open emoji picker
# Pick 🤖 or 🔄 and screenshot at different sizes
```

Note: Production extensions should use properly designed icons.
