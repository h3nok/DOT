# DOT - Digital Organism Technology

## 🚀 Deployment

This project is set up for automated deployment to GitHub Pages.

### GitHub Pages Setup

To enable GitHub Pages deployment:

1. Go to your repository on GitHub: https://github.com/h3nok/DOT
2. Click on **Settings** tab
3. Scroll down to **Pages** section in the left sidebar
4. Under **Source**, select **GitHub Actions**
5. The deployment will start automatically on the next push to main

### Deployment Status

- **Local Development**: `pnpm dev` (http://localhost:5173)
- **Production Preview**: `pnpm preview` (http://localhost:4173/DOT/)
- **GitHub Pages**: https://h3nok.github.io/DOT/ (after setup)

### Manual Deployment

You can also deploy manually using:

```bash
cd frontend
pnpm deploy:github
```

### Features

✅ **Automated GitHub Actions deployment**  
✅ **DOT logo with animated organism**  
✅ **Theme-aware navigation**  
✅ **Responsive design**  
✅ **Code splitting and optimization**  

## Development

```bash
# Install dependencies
cd frontend
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```
