# Deployment Checklist

## Web

- This build is static and has no backend
- Users must enter their own OpenAI API key in Settings before using AI features
- Build the site with:

```bash
npm run build:pages
```

- Deploy the generated `dist` folder to GitHub Pages

## Environment

Optional app env example:

```text
EXPO_PUBLIC_APP_ENV=production
GH_PAGES_BASE_PATH=/PinAI/
```

## GitHub Pages

- `build:pages` rewrites the exported asset URLs for GitHub Pages repo hosting
- By default it uses the current folder name as the base path, so this repo builds for `/PinAI/`
- Set `GH_PAGES_BASE_PATH` if your repo or custom Pages path is different
- Test refresh/navigation on the deployed site because static hosts can fail on deep links without the right fallback

## AI

- The OpenAI API key is stored locally on the user device
- The app sends selected AI requests directly from the client to OpenAI
- This means each user is responsible for their own API usage and billing

## Before publishing

- Test the exported web build locally
- Verify AI features fail cleanly when no API key is saved
- Verify export/import and SQLite persistence in the browser you plan to support
- Add your privacy policy, terms, disclaimer, and support contact
