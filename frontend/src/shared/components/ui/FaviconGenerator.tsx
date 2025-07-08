import React from 'react';

interface FaviconGeneratorProps {
  size?: number;
  format?: 'svg' | 'dataurl';
}

export const generateDOTFavicon = (size: number = 32): string => {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#f8f9fa;stop-opacity:1" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="${size * 0.06}" result="coloredBlur"/>
        <feMerge> 
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    <!-- Background with subtle gradient and rounded corners -->
    <rect width="${size}" height="${size}" fill="url(#bgGrad)" rx="${size * 0.1}"/>
    
    <!-- D -->
    <text x="${size * 0.06}" y="${size * 0.72}" font-family="'Segoe UI', Arial, sans-serif" font-size="${size * 0.56}" font-weight="600" fill="#2563eb">D</text>
    
    <!-- Blue dot (O) with glow effect -->
    <circle cx="${size * 0.5}" cy="${size * 0.5}" r="${size * 0.22}" fill="#3b82f6" filter="url(#glow)"/>
    <circle cx="${size * 0.5}" cy="${size * 0.5}" r="${size * 0.16}" fill="#2563eb"/>
    <circle cx="${size * 0.5}" cy="${size * 0.5}" r="${size * 0.06}" fill="#ffffff" opacity="0.9"/>
    
    <!-- T -->
    <text x="${size * 0.69}" y="${size * 0.72}" font-family="'Segoe UI', Arial, sans-serif" font-size="${size * 0.56}" font-weight="600" fill="#2563eb">T</text>
  </svg>`;
};

const FaviconGenerator: React.FC<FaviconGeneratorProps> = ({ size = 32 }) => {
  const svgString = generateDOTFavicon(size);
  
  const downloadFavicon = (format: 'svg' | 'png') => {
    if (format === 'svg') {
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dot-favicon-${size}x${size}.svg`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      // Convert SVG to PNG
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      canvas.width = size;
      canvas.height = size;
      
      img.onload = function() {
        ctx!.drawImage(img, 0, 0);
        const link = document.createElement('a');
        link.download = `dot-favicon-${size}x${size}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgString);
    }
  };

  return (
    <div className="p-6 bg-card rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">DOT Favicon Generator ({size}x{size})</h3>
      
      <div className="mb-4 p-4 bg-background rounded border-2 border-dashed border-muted-foreground/20 inline-block">
        <div dangerouslySetInnerHTML={{ __html: svgString }} />
      </div>
      
      <div className="flex gap-2">
        <button 
          onClick={() => downloadFavicon('svg')}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          Download SVG
        </button>
        <button 
          onClick={() => downloadFavicon('png')}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
        >
          Download PNG
        </button>
      </div>
    </div>
  );
};

export default FaviconGenerator;
