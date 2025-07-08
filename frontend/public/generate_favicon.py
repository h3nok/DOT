#!/usr/bin/env python3
"""
Favicon Generator Script
Converts SVG to ICO format for the DOT logo favicon
"""

import subprocess
import os
from pathlib import Path

def generate_favicon():
    """Generate favicon.ico from SVG using system tools"""
    
    # Paths
    script_dir = Path(__file__).parent
    svg_path = script_dir / "favicon.svg"
    ico_path = script_dir / "favicon.ico"
    
    if not svg_path.exists():
        print(f"Error: SVG file not found at {svg_path}")
        return False
    
    try:
        # Try using ImageMagick (convert command)
        subprocess.run([
            "convert", 
            str(svg_path),
            "-resize", "16x16,32x32,48x48",
            str(ico_path)
        ], check=True)
        print(f"✅ Successfully generated favicon.ico using ImageMagick")
        return True
        
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("⚠️  ImageMagick not found, trying alternative method...")
        
    try:
        # Try using inkscape
        subprocess.run([
            "inkscape",
            str(svg_path),
            "--export-type=png",
            "--export-filename=temp_favicon.png",
            "--export-width=32",
            "--export-height=32"
        ], check=True)
        
        # Convert PNG to ICO
        subprocess.run([
            "convert",
            "temp_favicon.png",
            str(ico_path)
        ], check=True)
        
        # Clean up
        os.remove("temp_favicon.png")
        print(f"✅ Successfully generated favicon.ico using Inkscape")
        return True
        
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("⚠️  Inkscape not found, creating simple ICO...")
        
    # Manual creation using Python if tools aren't available
    try:
        from PIL import Image, ImageDraw, ImageFont
        
        # Create a 32x32 image
        img = Image.new('RGBA', (32, 32), (255, 255, 255, 255))
        draw = ImageDraw.Draw(img)
        
        # Draw background
        draw.rectangle([0, 0, 32, 32], fill=(248, 249, 250, 255))
        
        # Draw red dot in center
        center = (16, 16)
        draw.ellipse([center[0]-8, center[1]-8, center[0]+8, center[1]+8], 
                     fill=(255, 68, 68, 255))
        draw.ellipse([center[0]-6, center[1]-6, center[0]+6, center[1]+6], 
                     fill=(220, 38, 38, 255))
        draw.ellipse([center[0]-2, center[1]-2, center[0]+2, center[1]+2], 
                     fill=(255, 255, 255, 200))
        
        # Try to draw text (D and T)
        try:
            font = ImageFont.truetype("Arial", 14)
        except:
            font = ImageFont.load_default()
            
        draw.text((3, 6), "D", fill=(37, 99, 235, 255), font=font)
        draw.text((21, 6), "T", fill=(37, 99, 235, 255), font=font)
        
        # Save as ICO
        img.save(str(ico_path), format='ICO', sizes=[(32, 32), (16, 16)])
        print(f"✅ Successfully generated favicon.ico using PIL")
        return True
        
    except ImportError:
        print("❌ PIL not available. Please install Pillow: pip install Pillow")
        return False
    except Exception as e:
        print(f"❌ Error generating favicon: {e}")
        return False

if __name__ == "__main__":
    print("🔨 Generating DOT favicon...")
    success = generate_favicon()
    if success:
        print("🎉 Favicon generation complete!")
    else:
        print("💡 You may need to install ImageMagick, Inkscape, or Pillow")
        print("   - macOS: brew install imagemagick inkscape")
        print("   - Ubuntu: sudo apt install imagemagick inkscape")
        print("   - Python: pip install Pillow")
