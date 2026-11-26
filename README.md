# Moldins ERP - Frontend

Frontend web application for **Moldins ERP** (Factory & Construction Site Management).

Built with **Next.js 14 (App Router)**, **TypeScript**, and **Tailwind CSS**.

---

## Features

- **Factory Operations**:
  - Mix Design & Production logging (Tiles, Precast Blocks, Kerbstones)
  - Raw Material Inventory & Vendor tracking
  - Daily Production & Mold Breakage tracking
  - Delivery Challans & Gate Passes

- **Construction Site Management**:
  - Site Master & BOQ / Tender analysis
  - Material Requisitions & Site Purchase Challans
  - Contractor Measurement Book (M-Book)
  - Running Account (RA) Billing & Wage payments

- **UX / Accessibility**:
  - Bilingual Support (Hindi + English toggle)
  - Mobile-First responsive interface with large touch targets
  - Live calculated fields (AUTO badges)
  - Camera & GPS geotagging for site receipts
  - Indian localization (₹ Lakh/Crore format, DD/MM/YYYY dates)

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env.local` and set the backend API URL:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm start
```
