# BTM Battery Advisor

A decision support tool for B2B energy sales teams to assess behind-the-meter battery opportunities in Belgium.

## Quick Deploy to Vercel

### Option A: Deploy from GitHub

1. Push this folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click "Add New Project"
4. Import your GitHub repository
5. Vercel auto-detects Vite — just click "Deploy"
6. Done! Your app is live.

### Option B: Deploy via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# In this directory, run:
vercel

# Follow the prompts
```

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
btm-advisor-app/
├── src/
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # React entry point
│   └── index.css        # Tailwind CSS imports
├── index.html           # HTML template
├── package.json         # Dependencies
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # Tailwind configuration
└── postcss.config.js    # PostCSS configuration
```

## Features

- **Region-aware**: Flanders (capacity tariff), Wallonia (ToU from 2026), Brussels
- **Smart recommendations**: Infers optimal ownership, operating model, and contract type
- **Capability flagging**: Shows what can be delivered directly vs. needs partnership
- **Risk visualization**: Customer vs. supplier risk spectrum
- **Actionable next steps**: Checklist for data gathering and follow-up
- **Copy to clipboard**: Export summary for CRM/email

## Customization

To modify the recommendation logic or add new options, edit the configuration objects at the top of `src/App.jsx`:

- `REGIONS` — Regional settings and primary value streams
- `VALUE_STREAMS` — Available value streams per region
- `CONTRACT_TYPES` — Contract options with key terms
- `generateRecommendation()` — Core logic function

---

Built for Belgian B2B energy suppliers.
