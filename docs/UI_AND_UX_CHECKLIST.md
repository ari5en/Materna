# Materna UI, UX & Feature Polish Checklist

This checklist tracks the UI/UX refinements and functional improvements to complete next, listed in priority order.

---

## 1. Top Navigation Bar (`Navbar.tsx`) Cleanup (Completed)
- [ ] **Remove left-most emoji avatar (`🤱`):** Remove the circular `🤱` emoji avatar badge on the far left of [`components/shared/Navbar.tsx`](../components/shared/Navbar.tsx#L140-L148) so the header starts cleanly with the official Materna brand mark and title.
- [ ] **Remove right-most settings button (`SlidersHorizontal`):** Remove the redundant `/profile` sliders icon button on the far right of [`components/shared/Navbar.tsx`](../components/shared/Navbar.tsx#L208-L214) (since `Profile` is already in the navigation bar), leaving **Ask AI** and **Notifications (`Bell`)** on the right.
- [ ] **Clean up Profile header avatar:** Replace the `🤱` emoji in [`app/(dashboard)/profile/page.tsx`](../app/(dashboard)/profile/page.tsx#L82-L84) with the official Materna logo or mother's initial badge for visual consistency.

---

## 2. Default & Prioritize Metric Units (`cm / kg`) Across the App (Completed)
- [ ] **Hero 52-Week Explorer (`HeroGreeting.tsx`):**
  - [ ] Change default `unitSystem` state from `'imperial'` to `'metric'` (`cm / kg`) in [`components/shared/HeroGreeting.tsx`](../components/shared/HeroGreeting.tsx#L36).
  - [ ] Place the **`cm / kg`** toggle button first (on the left) and **`in / lbs`** second (on the right) in the unit switcher pill.
- [ ] **Newborn Growth & Milestones Card (`NewbornGrowthMilestones.tsx`):**
  - [ ] Add a `cm / kg` (default) vs `in / lbs` unit toggle in [`components/postpartum/NewbornGrowthMilestones.tsx`](../components/postpartum/NewbornGrowthMilestones.tsx).
  - [ ] Display Weight in **`kg`** (`weightKg`), Length in **`cm`** (`lengthCm`), and Head Circumference in **`cm`** (`headCircCm`) by default, and allow logging measurements in `kg / cm` (automatically converting and syncing with Supabase).
  - [ ] Format the Growth Log History drawer in `kg / cm` when metric is active.

---

## 3. Serenity Audio Player — Real Audible Music & Soundscape Output (`SerenityAudioPlayer.tsx`) (Completed)
- [ ] **Diagnose & fix silent/faint Web Audio output:**
  - Currently [`components/postpartum/SerenityAudioPlayer.tsx`](../components/postpartum/SerenityAudioPlayer.tsx#L100-L170) initializes the `AudioContext` inside a `useEffect` (which browsers often block or suspend because it isn't called directly inside the user's click event handler) and sets `padGain` / `masterGain` very low (`0.08` / `0.14`), making it nearly inaudible on many speakers.
- [ ] **Resume & start `AudioContext` directly on user click:** Initialize and `.resume()` the `AudioContext` synchronously inside the Play button / Track click handlers to guarantee browser autoplay compliance.
- [ ] **Upgrade the synthesizer into rich, musical ambient soundscapes:**
  - Build distinct, clearly audible sound engines for each of the 5 tracks:
    1. **Harmonious Wind (`t-1`):** Warm womb/wind LFO-swept pink noise + soothing low harmonic chord.
    2. **Silent Streams (`t-2`):** Babbling brook filtered water texture + gentle pentatonic chime arpeggios.
    3. **Celestial Calm (`t-3`):** Lush warm ambient pad chord progression + soft shimmer for newborn sleep.
    4. **Piano Instrument (`t-4`):** Gentle synthesized electric-piano / lullaby melody notes with warm reverb-like decay.
    5. **Peaceful Rain (`t-5`):** Realistic raindrop noise patter + warm low-pass thunder/drone warmth.
  - Add an interactive **Volume slider / mute control** on the player card so mothers can adjust output volume comfortably.

---

## 4. Official Materna Logo Replacement (`LotusIcon.tsx` & Brand Assets)
- [ ] **Replace `LotusIcon` with the new official Materna logo:**
  - Update [`components/shared/LotusIcon.tsx`](../components/shared/LotusIcon.tsx) (or replace with custom SVG / image asset in `public/`) so every place that renders the brand emblem (`Navbar`, `HeroGreeting`, `Login`, `Onboarding`, `Profile`, `Recovery`, `Mood`, `AiAssistantModal`, `FloatingAiButton`, and app favicon/icon) automatically displays the new official Materna logo.

