# Team Asterix Website — Official BAJA SAEINDIA Portal

This project is the official website for our college **BAJA SAEINDIA** team (**Team Asterix**).

---

## 🚀 Features & Aesthetic Design

### 1. Floating & Hanging Baja Car (Background Layer)
- **Asset**: [`src/assets/baja_car_float.png`](./src/assets/baja_car_float.png) — Clean, high-resolution transparent render generated from the team's actual buggy image (cyan blue tubular rollcage chassis, white rims, Fox racing shocks).
- **Behavior**:
  - Floats persistently in the background at a dynamic tilted angle (`-12°`).
  - Implements a continuous, organic "hanging sway" suspension animation (`animate-car-hanging`).
  - Reacts smoothly to user scrolling with parallax depth and tilt adjustments, staying visible all the way to the footer.

### 2. Interactive Swimming Golden Fish
- **Asset**: [`src/assets/golden_fish.png`](./src/assets/golden_fish.png) — Glowing Japanese koi / goldfish with translucent flowing fins and luminous golden aura.
- **Scroll Movement**:
  - Traverses an organic curved swimming trajectory across the viewport driven directly by scroll position.
  - Dynamically rotates its heading angle to face its swim vector and flips direction when scrolling up or down.
  - Features continuous tail and fin swimming micro-animations (`animate-fish-swim`).

### 3. Blue & White Atmospheric Theme & Typography
- **Palette**: Deep oceanic blues (`#030b17`, `#0a192f`), electric cyan (`#38bdf8`), pure crisp whites, and warm golden accents.
- **Typography**: Google Fonts [`Plus Jakarta Sans`](https://fonts.google.com/specimen/Plus+Jakarta+Sans) for sleek headings and body text, paired with [`Space Grotesk`](https://fonts.google.com/specimen/Space+Grotesk) for motorsport telemetry tags.
- **Content Integrity**: All existing section texts, names, roles, and structures have been strictly preserved.

---

## 🛠️ How to Run Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

3. **Build for production**:
   ```bash
   npm run build
   ```



