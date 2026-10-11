# WealthFlowPro

React + Vite personal finance dashboard.

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

## GitHub Pages deployment

Pushing to `main` automatically builds and deploys `wealthflow/` to GitHub Pages
through `.github/workflows/deploy-pages.yml`. The workflow enables Pages when
the repository and account plan permit it. If Pages is not available, check
**Settings → Pages** and use **GitHub Actions** as the build and deployment
source.

The app stores editable assets in the current browser's local storage. They are
not uploaded or synchronized between devices.
