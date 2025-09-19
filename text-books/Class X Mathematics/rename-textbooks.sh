#!/bin/bash

# Class X Mathematics Textbook Chapter Renaming Script
# This script renames the PDF files to have meaningful names with proper numbering

echo "📚 Renaming Class X Mathematics Textbook PDFs..."
echo "============================================"

# Create a backup directory
backup_dir="backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$backup_dir"
echo "📁 Created backup directory: $backup_dir"
echo ""

# Function to rename a file
rename_file() {
    old_name="$1"
    new_name="$2"
    
    if [ -f "$old_name" ]; then
        # Copy to backup first
        cp "$old_name" "$backup_dir/"
        # Rename the file
        mv "$old_name" "$new_name"
        echo "✅ Renamed: $old_name → $new_name"
    else
        echo "⚠️  File not found: $old_name"
    fi
}

# Rename each file
rename_file "jemh1ps.pdf" "000-prelims-and-contents.pdf"
rename_file "jemh101.pdf" "001-real-numbers.pdf"
rename_file "jemh102.pdf" "002-polynomials.pdf"
rename_file "jemh103.pdf" "003-pair-of-linear-equations-in-two-variables.pdf"
rename_file "jemh104.pdf" "004-quadratic-equations.pdf"
rename_file "jemh105.pdf" "005-arithmetic-progressions.pdf"
rename_file "jemh106.pdf" "006-triangles.pdf"
rename_file "jemh107.pdf" "007-coordinate-geometry.pdf"
rename_file "jemh108.pdf" "008-introduction-to-trigonometry.pdf"
rename_file "jemh109.pdf" "009-some-applications-of-trigonometry.pdf"
rename_file "jemh110.pdf" "010-circles.pdf"
rename_file "jemh111.pdf" "011-areas-related-to-circles.pdf"
rename_file "jemh112.pdf" "012-surface-areas-and-volumes.pdf"
rename_file "jemh113.pdf" "013-statistics.pdf"
rename_file "jemh114.pdf" "014-probability.pdf"
rename_file "jemh1a1.pdf" "015-appendix-1-proofs-in-mathematics.pdf"
rename_file "jemh1a2.pdf" "016-appendix-2-mathematical-modelling.pdf"
rename_file "jemh1an.pdf" "017-answers.pdf"

echo ""
echo "✨ Renaming complete!"
echo "📋 Backup of original files saved in: $backup_dir"
echo ""
echo "📖 Chapter List:"
echo "----------------"
ls -1 *.pdf | grep -E "^[0-9]{3}-" | sort