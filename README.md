# 📊 Financial Health

A personal finance dashboard built with vanilla JavaScript. Tracks investments, real estate, and emergency funds — all stored locally in the browser, no backend required.

## Features

### Investments
- Monthly snapshots across multiple funds and brokers
- Supports 10 currencies (CLP, USD, EUR, and more)
- Auto-calculates monthly returns and portfolio allocation
- Historical performance charts per fund

### Properties
- Real estate portfolio with full mortgage details (UF-based)
- Tracks purchase price, loan amount, monthly fee, paid/remaining installments
- Rental income tracking: rent, commissions, expenses, and net flow
- m² value history for appreciation monitoring
- Paid installments auto-increment when you log rent with a dividend

### Emergency Funds
- Links to tracked investment funds for real-time balance
- Flexible goal types: months of salary, needs, wants, rental dividends, or a fixed amount
- Progress tracking with shortfall/surplus calculation

### Settings
- Monthly salary and budget split (needs / wants / savings)
- Property admin commission rate
- Primary display currency
- Full data export and import as JSON

## Tech

- Vanilla JS — no build step, no framework
- All data in `localStorage` under the `sfv1:` namespace
- Live market data: UF, USD/CLP, EUR/CLP, BTC (cached for instant load)
- Chart.js v4.4.0 for charts
- Bilingual UI: Spanish / English

## Getting Started

Just open `index.html` in a browser. No installation or server needed.

For a local server (avoids some browser restrictions):

```bash
npx serve .
# or
python3 -m http.server
```

## Data

All data lives in your browser's localStorage. Use **Settings → Export** to back it up as a dated JSON file, and **Import** to restore it.
