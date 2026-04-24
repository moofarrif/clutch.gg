# Design System: The Kinetic Pro Standard

## 1. Overview & Creative North Star
**Creative North Star: "Precision Velocity"**

This design system is engineered to move away from the static, boxy layouts of traditional sports apps. Instead, we embrace a "Precision Velocity" aesthetic—where the UI feels like a high-performance heads-up display (HUD). We achieve this through **Intentional Asymmetry**, **Kinetic Layering**, and **Data-First Editorializing**.

The interface shouldn't just display information; it should feel like a live broadcast environment. We break the "template" look by using exaggerated typographic scales, overlapping card elements that break the container bounds, and a strictly enforced "No-Line" philosophy that uses tonal depth to create structure.

## 2. Colors & Surface Architecture
Our palette is rooted in the high-contrast tension between a deep, void-like background and "Electric Lime" (`primary`) and "Vibrant Cyan" (`secondary`).

### The "No-Line" Rule
**Borders are forbidden for sectioning.** To define boundaries, you must use background color shifts. A `surface-container-low` card sitting on a `surface` background provides enough contrast for the eye without the "clutter" of a 1px stroke. This keeps the UI feeling like a seamless, integrated piece of hardware.

### Surface Hierarchy & Nesting
Treat the UI as physical layers of tech-glass. 
- **Base Layer:** `surface` (#0e0e10) — The stadium floor.
- **Section Layer:** `surface-container` (#19191c) — Grouping large content areas.
- **Interactive Layer:** `surface-container-highest` (#262528) — Cards, buttons, and "active" modules.

### The Glass & Gradient Rule
To achieve a "Pro Analytics" feel, use **Glassmorphism** for floating elements (like match-find overlays or navigation bars). Use `surface-container-high` at 70% opacity with a `24px` backdrop blur. 
**Signature Texture:** Use a linear gradient for Primary CTAs: `primary` (#f3ffca) to `primary-container` (#cafd00) at a 135-degree angle. This adds a "weighted" feel to the lime color, preventing it from looking flat.

---

## 3. Typography: The Athletic Editorial
We utilize a tri-font system to balance technical precision with aggressive energy.

*   **Display & Headlines (Space Grotesk):** This is our "Athletic" voice. Use `display-lg` for match scores and rank-up moments. The wide apertures and geometric construction feel like modern stadium signage.
*   **Titles & Body (Manrope):** Our "Technical" voice. Manrope provides the high-readability required for dense stats and player rosters.
*   **Labels (Lexend):** Our "Data" voice. Used for micro-copy and player attributes. Lexend’s hyper-legibility ensures that even at `label-sm`, data is instantly digestible.

**Editorial Rule:** Use `headline-lg` in all-caps with `-2%` letter spacing for section headers to create a "locked-in" competitive feel.

---

## 4. Elevation & Depth
In this design system, elevation is a product of light and tone, not shadows.

*   **The Layering Principle:** To lift a "Diamond Rank" player card, do not add a shadow. Instead, place a `surface-container-highest` card on top of a `surface-container-low` background. 
*   **Ambient Shadows:** If a component *must* float (e.g., a modal), use a custom shadow: `0px 24px 48px rgba(0, 244, 254, 0.08)`. Note the tint—we use the `secondary` color in the shadow to simulate the glow of a high-end monitor.
*   **The "Ghost Border":** For accessibility in forms, use `outline-variant` at **15% opacity**. It should be felt, not seen.

---

## 5. Components & Rank-Based Styling

### Rank-Based Styling (The "Prestige" System)
Ranks are the soul of the app. Instead of just icons, use color-flooding for card headers:
- **Bronze/Silver:** Neutral `surface-variant` accents.
- **Gold:** `tertiary` (#ffe792) accents with a subtle metallic noise texture.
- **Platinum/Diamond:** `secondary` (#00f4fe) gradients with a `primary` (Lime) "glint" on the top-right corner.

### Buttons
*   **Primary:** Gradient fill (`primary` to `primary-container`), `on-primary` text, `full` roundedness. 
*   **Secondary (The Pro-Look):** No fill. Use a "Ghost Border" of `secondary` at 20% and `secondary` text.
*   **State:** On hover/active, increase the `backdrop-blur` of the button or shift the gradient intensity.

### Cards & Lists
*   **Forbid Divider Lines.** To separate players in a lobby list, use a 12px vertical gap and alternate between `surface-container-low` and `surface-container-highest`.
*   **Data Visualization:** Incorporate small sparklines using `secondary` (Cyan) for performance trends.

### Matchmaking Chips
*   **Selection Chips:** Use `surface-bright` with `label-md` text. When selected, "pop" the chip to `primary` (Lime) with `on-primary-fixed` text.

---

## 6. Do’s and Don'ts

### Do:
*   **Asymmetry:** Place your headline on the left and a supporting stat on the far right with nothing in between. Embrace the "void."
*   **Micro-Interactions:** Use 200ms "Spring" easings for card expansions to mimic the tactile feel of sports equipment.
*   **Color as Data:** Use `error` (#ff7351) sparingly—only for "Defeat" or "Critical Connection" issues.

### Don’t:
*   **No "Standard" Cards:** Never use a white card with a black drop shadow. It breaks the immersive dark-mode ecosystem.
*   **No Rounded Rectangles:** Avoid the `lg` (0.5rem) or `xl` (0.75rem) roundedness for large containers. Stick to `sm` (0.125rem) or `md` (0.375rem) to maintain a "sharp," aggressive edge. Reserve `full` only for interactive buttons.
*   **No Clutter:** If a stat isn't vital to the "Clutch" moment, move it to a secondary `surface-container` or hide it behind a progressive disclosure interaction.