# Simple React App

A simple React application built with Vite, ready for deployment on free hosting platforms.

## Features

- ⚡ Fast development with Vite
- 🎨 Modern, responsive design
- 🚀 Ready for deployment on Netlify, Vercel, or GitHub Pages
- 💾 No build configuration needed

## Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn/pnpm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:3000`

### Building for Production

```bash
# Build the app
npm run build

# Preview production build
npm run preview
```

## Deployment

### Option 1: Netlify (Easiest)

1. Run `npm run build`
2. Go to [netlify.com](https://netlify.com) and sign up/login
3. Drag and drop the `dist` folder into the "Sites" area
4. Your site will be live instantly!

### Option 2: Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign up/login
3. Click "New Project" and import your GitHub repository
4. Vercel will automatically detect the Vite configuration
5. Click "Deploy" - your site will be live in seconds!

### Option 3: GitHub Pages

1. Update `package.json`:
   - Change `homepage` to your GitHub Pages URL: `"https://your-username.github.io/your-repo-name/"`
   - Update `vite.config.js`: Change `base: '/'` to `base: '/your-repo-name/'`

2. Install gh-pages and deploy:
```bash
npm install
npm run build
npm run deploy:github
```

3. Enable GitHub Pages in your repository settings:
   - Go to Settings → Pages
   - Select `gh-pages` branch as the source

## Customization

### Modify the App

Edit `src/App.jsx` to change the content and functionality.

### Change Styling

- Global styles: `src/index.css`
- Component styles: `src/App.css`

### Add New Components

Create new `.jsx` files in the `src/` directory and import them in `App.jsx`.

## Project Structure

```
.
├── index.html          # HTML entry point
├── package.json        # Dependencies and scripts
├── vite.config.js      # Vite configuration
├── netlify.toml        # Netlify deployment config
├── vercel.json         # Vercel deployment config
├── src/
│   ├── main.jsx        # React entry point
│   ├── App.jsx         # Main component
│   ├── App.css         # Component styles
│   └── index.css       # Global styles
└── dist/               # Build output (generated)
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run deploy:github` - Deploy to GitHub Pages

## License

MIT
