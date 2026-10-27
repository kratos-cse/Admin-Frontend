# Standalone Symposium Championship Leaderboard

A clean, standalone, high-performance Leaderboard website for college symposiums.

## Highlights
- **NO Navbars / NO Footers / NO Extra Pages**: Purely focused on the symposium leaderboard.
- **Top 3 Championship Podium**:
  - 🥇 **1st Rank (Gold Champion)**: Center elevated card with shimmering golden styling, trophy, crown, championship points, and medal breakdown.
  - 🥈 **2nd Rank (Silver Runner-up)**: Left podium card with metallic silver accents.
  - 🥉 **3rd Rank (Bronze Runner-up)**: Right podium card with bronze metallic styling.
- **Standings Table (#4 and below)**: Ranks, college name, medals tally (🥇 Gold, 🥈 Silver, 🥉 Bronze), points, and relative score progress bars.
- **Projector Mode**: Fullscreen mode for auditorium stage projection during prize distribution.
- **CSV Export**: Download complete score reports.
- **Backend Sync**: Built-in config modal to connect directly to your backend endpoint (persists in `localStorage`).

---

## Files in this Folder

1. **`index.html`** — The complete standalone webpage. Double-click to open in any web browser!
2. **`style.css`** — All styling, podium layout, and responsive rules.
3. **`app.js`** — Complete data handling, backend API integration, search filter, and CSV exporter.
4. **`LeaderboardComponent.tsx`** & **`LeaderboardComponent.module.css`** — Portable React/Next.js component if you want to drop it directly into your `Admin-Frontend` codebase later.

---

## How to Run

### Option 1: Instant Browser View (Zero dependencies)
Simply double-click `index.html` or open it in Chrome/Edge:
```
C:\Users\nalan\Downloads\symposium-leaderboard\index.html
```

### Option 2: Live Server (Python or Node)
From this directory:
```bash
# Python
python -m http.server 8080

# Or npx
npx serve .
```

### Option 3: Use in your Admin-Frontend
Copy `LeaderboardComponent.tsx` and `LeaderboardComponent.module.css` into your admin project, and import it:
```tsx
import LeaderboardComponent from "./LeaderboardComponent";

export default function MyPage() {
  return <LeaderboardComponent apiEndpoint="/api/v1/admin/leaderboard" />;
}
```
