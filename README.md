# Hora – Quotation Builder

A rule-based quotation builder. Add tables and product rows, pick HSN/SAC codes, and export a Word (.docx) quotation. Dealer price and margin are never included in the export.

Plain HTML, CSS and JavaScript. No build step.

## Run locally
Open `index.html` in a browser (internet needed for the Word library).

## Edit company details
Top of `app.js` (`COMPANY`). Logo is in `logo.js`.

## Data
HSN/SAC list in `hsn-data.js` (from the `hsn-code-package` npm package). GST rates there are chapter-level suggestions; verify before use.
