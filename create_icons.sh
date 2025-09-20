#!/bin/bash

# Create simple icon files for the extension
# This script creates basic PNG icons using ImageMagick convert command
# If ImageMagick is not available, you can replace these with proper icon files

# Check if convert command is available
if ! command -v convert &> /dev/null; then
    echo "ImageMagick not found. Creating placeholder icon files..."
    
    # Create placeholder files
    echo "Creating placeholder icon files..."
    touch icons/icon16.png
    touch icons/icon32.png
    touch icons/icon48.png
    touch icons/icon128.png
    
    echo "Placeholder icon files created. Please replace with proper icons."
    echo "Icons should be:"
    echo "- icon16.png: 16x16 pixels"
    echo "- icon32.png: 32x32 pixels" 
    echo "- icon48.png: 48x48 pixels"
    echo "- icon128.png: 128x128 pixels"
    
else
    echo "Creating icon files using ImageMagick..."
    
    # Create a simple dollar sign icon
    convert -size 128x128 xc:transparent \
        -fill "#667eea" -draw "circle 64,64 64,10" \
        -fill white -font Arial-Bold -pointsize 60 \
        -gravity center -annotate 0 "$" \
        icons/icon128.png
    
    # Resize for other sizes
    convert icons/icon128.png -resize 48x48 icons/icon48.png
    convert icons/icon128.png -resize 32x32 icons/icon32.png
    convert icons/icon128.png -resize 16x16 icons/icon16.png
    
    echo "Icon files created successfully!"
fi
