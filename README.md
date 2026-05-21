# Cash Tally React

Static React/Vite version of the Cash Tally app.

This version removes:

- Flask
- Python server
- EXE packaging
- certificate/signing workflow
- native printer backend

It keeps:

- multiple tally tabs
- local browser persistence
- receipt settings modal
- operator name
- delete confirmation modal
- print active tally
- print all tallies
- browser print dialog / print queue

## Folder structure

```txt
cash-tally-react/
├── package.json
├── vite.config.js
├── index.html
├── README.md
└── src/
    ├── main.jsx
    ├── App.jsx
    └── styles.css
```

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL Vite prints in the terminal.

## Build

```bash
npm run build
npm run preview
```

## Deploy to GitHub Pages

This project uses `base: './'` in `vite.config.js`, so the built files work under a GitHub Pages project path.

One simple deployment option:

```bash
npm install
npm run deploy
```

Then enable GitHub Pages for the `gh-pages` branch in the repository settings.

## Data persistence

Tallies and receipt settings are saved in `localStorage`:

- `cash_tally_state_v1`
- `cash_tally_receipt_settings_v1`

Browser data clearing will remove saved tallies/settings. Add export/import JSON later if backup matters.

## Print behavior

The app opens a temporary browser window, writes receipt HTML into it, and calls `window.print()`. Printer selection happens through the normal browser/Windows print dialog.
