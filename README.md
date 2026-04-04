# 📊 Financial Health

A personal finance dashboard built with vanilla JavaScript. Tracks investments, real estate, emergency funds, and pension savings — all stored locally in the browser, no backend required.

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

### Pension Funds
- Track retirement savings across multiple funds or providers
- Currency-agnostic: enter balances in any of the 10 supported currencies
- Totals and equivalents auto-converted to your configured primary currency
- Designed for worldwide use — a description field replaces any country-specific fields

### Net Worth
- Aggregates data from all modules — no manual input required
- Assets: investment portfolio (latest snapshot per fund), pension fund balances, property market value
- Property value uses latest m² price × area when available, falls back to UF purchase price
- Liabilities: outstanding mortgage debt per property (French amortization formula)
- All amounts converted to your primary currency; adapts automatically when data is missing

### Settings
- Monthly salary and budget split (needs / wants / savings)
- Property admin commission rate
- Primary display currency (used across all modules for converted totals)
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

| Key | Contents |
|---|---|
| `sfv1:config` | Salary, budget percentages, primary currency |
| `sfv1:investments` | Fund definitions and monthly snapshots |
| `sfv1:properties` | Property details and mortgage data |
| `sfv1:rents` | Rental income history |
| `sfv1:m2` | m² value history per property |
| `sfv1:emergency` | Emergency fund goals |
| `sfv1:pension` | Pension fund balances |
| *(net worth)* | *No storage — computed on demand from other modules* |
| `sfv1:cache:market` | Cached exchange rates (UF, USD, EUR, BTC) |
