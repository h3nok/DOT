#!/usr/bin/env python3
"""
DOT Favicon Generator
Creates a favicon with D-O-T where O is a red dot
"""

try:
    from PIL import Image, ImageDraw, ImageFont
    import os
except ImportError:
    print("Please install Pillow: pip install Pillow")
    exit(1)

def create_dot_favicon(size=32, output_path="favicon.ico"):
    """Create a DOT favicon with red dot in the middle"""
    
    # Create image with white background
    img = Image.new('RGBA', (size, size), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Try to use a system font, fallback to default
    try:
        if size >= 32:
            font_size = int(size * 0.56)
        else:
            font_size = int(size * 0.5)
            
        # Try different font paths for different systems
        font_paths = [
            "/System/Library/Fonts/Helvetica.ttc",  # macOS
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",  # Linux
            "C:\\Windows\\Fonts\\arial.ttf",  # Windows
        ]
        
        font = None
        for font_path in font_paths:
            if os.path.exists(font_path):
                font = ImageFont.truetype(font_path, font_size)
                break
        
        if font is None:
            font = ImageFont.load_default()
    except:
        font = ImageFont.load_default()
    
    # Colors
    text_color = (37, 99, 235)  # Blue color #2563eb
    red_outer = (255, 68, 68)   # #ff4444
    red_inner = (220, 38, 38)   # #dc2626
    white = (255, 255, 255)
    
    # Calculate positions
    center_x = size // 2
    center_y = size // 2
    
    # Draw red dot (O) in the center
    dot_radius = int(size * 0.22)
    inner_radius = int(size * 0.16)
    highlight_radius = int(size * 0.06)
    
    # Outer red circle
    draw.ellipse([
        center_x - dot_radius, center_y - dot_radius,
        center_x + dot_radius, center_y + dot_radius
    ], fill=red_outer)
    
    # Inner red circle
    draw.ellipse([
        center_x - inner_radius, center_y - inner_radius,
        center_x + inner_radius, center_y + inner_radius
    ], fill=red_inner)
    
    # White highlight
    draw.ellipse([
        center_x - highlight_radius, center_y - highlight_radius,
        center_x + highlight_radius, center_y + highlight_radius
    ], fill=white)
    
    # Draw D and T
    d_x = int(size * 0.06)
    t_x = int(size * 0.69)
    text_y = int(size * 0.72)
    
    # Draw D
    draw.text((d_x, text_y), "D", fill=text_color, font=font, anchor="lb")
    
    # Draw T
    draw.text((t_x, text_y), "T", fill=text_color, font=font, anchor="lb")
    
    return img

def main():
    """Generate multiple favicon sizes"""
    
    print("Generating DOT favicon...")
    
    # Create different sizes
    sizes = [16, 32, 48, 64]
    images = []
    
    for size in sizes:
        print(f"Creating {size}x{size} favicon...")
        img = create_dot_favicon(size)
        images.append(img)
        
        # Save individual PNG files for preview
        img.save(f"favicon-{size}x{size}.png")
    
    # Save as ICO file with multiple sizes
    print("Saving favicon.ico...")
    images[0].save(
        "favicon.ico",
        format='ICO',
        sizes=[(img.width, img.height) for img in images]
    )
    
    print("Favicon generation complete!")
    print("Files created:")
    for size in sizes:
        print(f"  - favicon-{size}x{size}.png")
    print("  - favicon.ico")

if __name__ == "__main__":
    main()
