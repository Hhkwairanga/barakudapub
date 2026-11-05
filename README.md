# Barakuda Pub menu

Responsive static menu with 74 dishes, generated illustrative thumbnails, dish selection, quantities, 7.5% VAT, printing, PNG export and WhatsApp sharing.

## Local preview

Run `python3 -m http.server 4173`, then open http://localhost:4173.
No build step or package installation is required.

## Deployment

GitHub Pages serves the repository root on the `main` branch. All application asset paths are relative and support a project Pages URL.

## Menu and assets

- `menu.js`: categories, names, prices and thumbnail mapping.
- `selection.js`: quantities, VAT, export and WhatsApp flow.
- `styles.css`: responsive and print styles.
- `assets/`: supplied menu and generated illustrative food photography.

Selections stay in the visitor's browser. WhatsApp sharing requires the visitor to complete sending in WhatsApp; file sharing depends on device/browser support. Google Fonts and the hero photograph require an internet connection.
