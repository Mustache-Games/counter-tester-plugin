# Counter Tester – Interactive Simple Counter API Debugger for Super Productivity

[![Super Productivity Plugin](https://img.shields.io/badge/Super_Productivity-Plugin-blue.svg?logo=data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCA2NCA2NCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNIDAuNjU1MzcwNDYsMzQuNTgyNzg3IDMyLjQ1MjI2Nyw2My44NTUzMDEgNjMuNzkxNTQ4LDAuOTQzNTY0MjIgMzAuMjIyNjQ0LDQ3LjcyMjAyMyBaIiBmaWxsPSJibGFjayIgZmlsbC1vcGFjaXR5PSIxIi8+PC9zdmc+)](https://super-productivity.com/)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-F16061.svg?logo=ko-fi&logoColor=white)](https://ko-fi.com/mustachedev0)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy_Me_a_Coffee-FFDD00.svg?logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/MustacheGames)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![StandWithPalestine](https://raw.githubusercontent.com/TheBSD/StandWithPalestine/main/badges/StandWithPalestine.svg)](https://github.com/TheBSD/StandWithPalestine/blob/main/docs/README.md)

**Counter Tester** is the ultimate real-time debugging console for Super Productivity’s **Simple Counters** system. Built specifically to verify the new counter API methods added in the pending [PR #5459](https://github.com/johannesjo/super-productivity/pull/5459) (fixing [#5398](https://github.com/johannesjo/super-productivity/issues/5398)), it gives developers and power users a floating, touch-friendly playground to exercise **every** counter method with zero setup.

- Flat key shortcuts (`setCounter`, `inc/dec`)  
- Full entity CRUD (`updateSimpleCounter`, `setSimpleCounterDate`, `toggleSimpleCounter`…)  
- **Type-aware everything** – ClickCounter uses numbers, StopWatch & RepeatedCountdown use `1h 30m 15s` parsing, streak min formatted as time  
- Live history tables, streak badges with weekday count, JSON previews, enabled/on status  
- **Draggable & touch-ready** console (mouse + Android WebView)  
- **Advanced streak editor** – per-weekday checkboxes (Sun–Sat) that auto-show when “Track Streaks” is enabled  
- One-click type-tailored test suite (creates → edits → deletes)  
- Copyable logs + Material snacks  

[![Stand With Palestine](https://raw.githubusercontent.com/TheBSD/StandWithPalestine/main/banner-no-action.svg)](https://thebsd.github.io/StandWithPalestine)

**Important**: This plugin only works with the changes from the pending PR #5459.  
To test it now, either:
- Clone and build Super Productivity from the fork: https://github.com/Mustache-Games/super-productivity/tree/master  
- Or manually apply the PR changes to your local build  

Once #5459 is merged, it will work in the official release without any extra steps.

## Feature Highlights

- **Floating Draggable Console** – Dark-theme, resizable, fully draggable with mouse or finger, persists position/visibility  
- **Smart Counter Browser** – Dropdown with type badges, today’s value (formatted as time for StopWatch), disabled grayed out  
- **Type-Specific Inputs** – Numbers for ClickCounter, human-readable `1h 30m 15s` parsing for StopWatch/RepeatedCountdown  
- **Rich Details** – Collapsible JSON, sorted history table (recent first), streak info with formatted time and weekday count (e.g., `Streak Min: 2h 15m (Days: 5/7)`)  
- **Partial Edit Modal** – Title, streak min (time-aware for StopWatch), duration (time-aware), track streaks toggle + **dynamic weekday grid**  
- **Action Hook Logger** – Real-time NgRx `SimpleCounter` action capture with payload snippets  
- **Copyable Logs** – 📋 button on every line (primary + fallback)  
- **Automated Suite** – “Full Type-Tailored Tests” runs a complete create → edit → delete cycle tailored to the selected counter type  

## Usage

1. Enable the plugin (Settings → Plugins → **Counter Tester** → Enable + Debug Mode)  
2. Click the **clock icon** in the header (“Toggle Tester”)  
3. Drag the console anywhere (mouse or finger)  
4. Pick a counter → type-aware fields light up automatically  
5. Hammer the buttons:  
   - **Get All Full** – refresh everything  
   - **Set Today** – uses value or time input (required for StopWatch)  
   - **Set Date** – `YYYY-MM-DD` + value/time  
   - **Partial Edit** – full streak weekday editor with dynamic checkboxes  
   - **Full Suite** – destructive demo (deletes at end)  

All changes instantly reflect in **Settings → Simple Counters**.

## Permissions (manifest.json)

```json
"permissions": [
  "getAllCounters", "getCounter", "setCounter", "incrementCounter", "decrementCounter",
  "getAllSimpleCounters", "getSimpleCounter", "updateSimpleCounter",
  "toggleSimpleCounter", "setSimpleCounterEnabled", "deleteSimpleCounter",
  "setSimpleCounterToday", "setSimpleCounterDate",
  "registerHeaderButton", "uiInteraction", "showSnack"
]
```

## Related Links

- Issue: [#5398 – Add simple counter methods to PluginAPI](https://github.com/johannesjo/super-productivity/issues/5398)  
- PR (pending merge): [#5459 – feat(plugin-api): simple counters + full CRUD](https://github.com/johannesjo/super-productivity/pull/5459)  

## Contributing

Found something off? Want CSV export or counter creation UI?  
→ Open an issue or PR – especially welcome while the PR is under review!

## License

MIT © Mustache Dev – use, modify, ship it!

---

**Happy testing!** This console survived hundreds of runs during #5398 development and is now the fastest way to confirm everything works before merge. Touch-friendly, streak-smart, and zero setup. Enjoy! 🚀

---

> As a game developer, I lack deep TypeScript/JavaScript expertise in this codebase.
> As a student, I have limited time to properly learn new technologies.
> This implementation was created with AI assistance to bridge these constraints.
