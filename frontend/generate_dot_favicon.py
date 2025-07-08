#!/usr/bin/env python3
"""
Generate favicon.ico with just the red dot (O) for DOT logo
"""

from PIL import Image, ImageDraw
import os

def create_dot_favicon():
    """Create a favicon with just the red dot"""
    
    # Create a 32x32 image with transparent background
    img = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw the main red dot (circle)
    center = (16, 16)
    radius = 12
    
    # Create gradient-like effect with multiple circles
    # Outer glow
    draw.ellipse([center[0]-radius, center[1]-radius, center[0]+radius, center[1]+radius], 
                 fill=(220, 38, 38, 200))
    
    # Main circle
    draw.ellipse([center[0]-radius+2, center[1]-radius+2, center[0]+radius-2, center[1]+radius-2], 
                 fill=(255, 68, 68, 255))
    
    # Inner highlight
    draw.ellipse([center[0]-radius+6, center[1]-radius+6, center[0]+radius-6, center[1]+radius-6], 
                 fill=(255, 100, 100, 255))
    
    # Core white center
    draw.ellipse([center[0]-3, center[1]-3, center[0]+3, center[1]+3], 
                 fill=(255, 255, 255, 230))
    
    # Save as ICO
    output_path = '/Users/hghebrechristos/Repo/DOT/frontend/public/favicon-dot.ico'
    img.save(output_path, format='ICO', sizes=[(32, 32), (16, 16)])
    
    print(f"✅ Created favicon-dot.ico at: {output_path}")
    
    # Create 16x16 version
    img_16 = img.resize((16, 16), Image.Resampling.LANCZOS)
    img_16.save('/Users/hghebrechristos/Repo/DOT/frontend/public/favicon-dot-16.ico', format='ICO')
    
    print("✅ Created favicon-dot-16.ico")

if __name__ == "__main__":
    create_dot_favicon()
