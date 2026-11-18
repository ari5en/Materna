<div align="center">
  <img src="public/images/materna-logo.png" alt="Materna Logo" width="128" height="128" />

  # Materna

  <p><strong>Serene Fourth-Trimester Maternal Sanctuary & Newborn Development Tracking</strong></p>
  <p><em>"From Newborn to One"</em> — Supporting maternal physical and emotional recovery alongside 52 weeks of infant developmental milestones.</p>

  <p>
    <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js 16" /></a>
    <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19-087EA4?style=for-the-badge&logo=react" alt="React 19" /></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript 5" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss" alt="Tailwind CSS v4" /></a>
    <a href="https://supabase.com/"><img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase" /></a>
    <a href="https://ai.google.dev/"><img src="https://img.shields.io/badge/Gemini_AI-3.8_Flash-8E75B2?style=for-the-badge&logo=google" alt="Gemini AI" /></a>
  </p>
</div>

---

## 🌸 Overview

Standard pregnancy applications frequently end at delivery, leaving new mothers facing the **"postpartum cliff"**—a critical period where healthcare attention abruptly shifts away from the mother just as physical trauma, hormonal fluctuations, sleep fragmentation, and round-the-clock infant care peak.

**Materna** bridges this care gap. Engineered with low cognitive friction and soothing, serene aesthetics, Materna is designed for **one-handed mobile use** during late-night nursing sessions. It unifies maternal recovery, emotional well-being, and infant developmental intelligence across the first 52 weeks of life.

---

## ✨ Key Capabilities

### 👶 1. 52-Week Infant Developmental Engine
* **Dynamic Age Engine**: Automatically computes infant age in weeks, days, and months from birth date.
* **52-Week Milestone Curriculum**: Detailed week-by-week guidance detailing motor, sensory, and cognitive milestones.
* **WHO Growth Tracking**: Compare infant weight and length against World Health Organization percentiles with instant **Metric (`kg / cm`)** and **Imperial (`lbs / in`)** switching.
* **Milestone Celebrations**: Encouraging micro-animations and confetti celebrations for accomplished milestones.

### 😴 2. Smart Wake Window & Automatic Sleep Tracker
* **Dynamic Wake-Window Calculator**: Automatically scales wake intervals based on age (from 45–60m for newborns up to 2.5–3h+ for older infants).
* **Live Start-to-Wake Nap Tracker**: Tap *"Baby Went to Sleep"* to activate live tracking; when baby wakes, tap *"Baby Just Woke Up"* to automatically log the exact elapsed duration.
* **Proactive Sleepy Cue Guidance**: Timely alerts before overtiredness sets in, highlighting subtle early cues like gaze aversion and facial redness.

### 🍼 3. One-Tap Newborn Care Intelligence
* **Quick-Log Summary**: One-tap logging for breast/bottle feeds, wet/dirty diapers, and sleep intervals.
* **Live Relative Timestamps**: At-a-glance status indicators (*"Fed 35m ago"*, *"Woke 15m ago"*) designed for sleep-deprived moments.
* **Timeline Activity Audit**: Review, update, and manage historical daily logs with local-first responsiveness.

### 🧘‍♀️ 4. Maternal Physical Recovery & Pelvic Health Hub
* **4-Stage 52-Week Recovery Stepper**: Guided progression through Acute Healing (Weeks 1–3), Tissue Remodeling (Weeks 4–7), Core & Pelvic Reintegration (Weeks 8–16), and Functional Stamina (Weeks 17–52+).
* **Pelvic Floor & Core Exercises**: Clinically aligned gentle breathwork and rehab check-offs with full historical compliance views.
* **Daily Hydration Monitor**: 8-glass visual hydration tracker calibrated for nursing and healing mothers.

### 🤍 5. Maternal Mental Wellness & Emotional Analytics
* **5-Point Serene Reflection**: Low-friction check-ins (*Depleted, Fragile, Balanced, Grounded, Joyful*).
* **Root-Cause Trigger Tagging**: Correlate emotional shifts with sleep deficit, feeding struggles, physical discomfort, and partner support.
* **7-Day Trend Visualizations**: Interactive mood distributions, weekly mindfulness averages, and sleep correlation charts.

### 🎧 6. Serenity Audio Sanctuary
* **Curated Ambient Soundscapes**: White noise, pink noise, heartbeat/womb rhythms, and soft acoustic melodies.
* **Full Audio Player Controls**: Loop controls, scrub bar, 15-second skip/rewind, and favorite track bookmarking.

### 🤖 7. Ask Materna AI Sanctuary Companion
* **24/7 Empathetic Support**: Powered by Google Gemini 3.8 Flash with strict clinical guardrails for evidence-based, compassionate care.
* **Context-Aware Assistance**: Automatically understands your baby's current age, wake windows, and recent feeding history to provide relevant, reassuring advice.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) | App Router, Server & Client Components, Partial Prerendering |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) | Strict type safety across database schemas, APIs, and components |
| **UI & Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | CSS Variables, custom Serenity color palette, organic radii |
| **Icons & Media** | [Lucide React](https://lucide.dev/) | Clean, accessible SVG iconography |
| **Database & Auth** | [Supabase](https://supabase.com/) | PostgreSQL, Row Level Security (RLS), SSR cookie auth |
| **AI Intelligence** | [Google Gemini API](https://ai.google.dev/) | `gemini-3.8-flash` with clinical guidance safety prompts |
| **State & Cache** | Local-First React Context | `localStorage` offline caching synchronized with Supabase cloud DB |
| **Visual Effects** | [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti) | Lightweight celebration animations |

---

## 📁 Repository Layout

```text
Materna/
├── app/
│   ├── (auth)/
│   │   ├── login/               # Email/Password & Google OAuth authentication
│   │   └── onboarding/          # 2-step setup: mother name, baby birth date, measurements
│   ├── (dashboard)/
│   │   ├── layout.tsx           # Responsive shell with page transitions & navigation
│   │   ├── page.tsx             # Main Sanctuary dashboard
│   │   ├── mood/                # Maternal mental wellness & emotional trends
│   │   ├── recovery/            # 4-stage maternal recovery & pelvic floor hub
│   │   └── profile/             # Profile management, units toggle, and data export
│   ├── api/
│   │   ├── ai/                  # Gemini AI companion streaming endpoint
│   │   └── user/
│   │       ├── stage/           # Stage validation and profile updates
│   │       ├── export/          # Encrypted JSON & CSV data export
│   │       └── delete/          # Account data deletion endpoint
│   ├── globals.css              # Serenity color tokens, smooth animations, scroll styling
│   └── layout.tsx               # Root layout & Playfair / Inter typography
├── components/
│   ├── postpartum/
│   │   ├── BabyQuickLogSummary.tsx     # One-tap feed, diaper, and sleep logger
│   │   ├── MaternalMoodReflection.tsx  # Mood scoring, donut chart, tag cloud
│   │   ├── NewbornGrowthMilestones.tsx # 52-week milestone cards & growth charts
│   │   ├── NextNapPredictor.tsx        # Automatic start-to-wake nap tracker
│   │   └── SerenityAudioPlayer.tsx     # Ambient audio soundscapes player
│   └── shared/
│       ├── AiAssistantModal.tsx        # Floating AI chat companion
│       ├── BottomNav.tsx               # Mobile navigation bar with micro-interactions
│       ├── HeroGreeting.tsx            # Stage banner & week milestone preview
│       ├── LotusIcon.tsx               # Brand logo component
│       ├── MobileFrame.tsx             # Responsive device preview container
│       └── Navbar.tsx                  # Top brand navigation & live alerts
├── lib/
│   ├── context/
│   │   └── MaternaContext.tsx          # Local-first state engine with Supabase sync
│   ├── data/
│   │   ├── babyMilestones52.ts         # 52 weeks of infant developmental milestones
│   │   └── maternalRecovery52.ts       # 52 weeks of maternal recovery protocols
│   ├── supabase/                       # Supabase browser, server, and middleware clients
│   └── utils.ts                        # Postpartum age engine, time formatting, unit converters
├── public/
│   ├── images/
│   │   ├── materna-logo.png            # Official Materna brand emblem
│   │   └── baby-illustration.png      # Development stage illustration
│   └── audio/                          # Serenity audio soundscape assets
├── supabase/
│   ├── migrations/                     # PostgreSQL schema with RLS security policies
│   └── seed.sql                        # Default development seed data
└── types/
    └── database.ts                     # TypeScript database types
```

---

## 🚀 Getting Started

### 1. Prerequisites
* [Node.js](https://nodejs.org/) (v20.x or higher)
* [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
* A [Supabase](https://supabase.com/) project (optional for cloud sync; local storage works out of the box)
* A [Google AI Studio](https://aistudio.google.com/) API Key (for the Sanctuary AI companion)

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/ari5en/Materna.git
cd Materna

# Install dependencies
npm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Google Gemini AI Companion
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.8-flash
```

### 4. Database Setup (Supabase)

If utilizing Supabase cloud storage, execute the migrations in your Supabase SQL Editor:
1. `supabase/migrations/20261101000000_postpartum_schema.sql`
2. `supabase/migrations/20261108000000_sync_growth_onboarding.sql`
3. `supabase/migrations/20261118000000_add_baby_sleeping_since.sql`

### 5. Running Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Production Build

```bash
# Build the optimized production bundle
npm run build

# Start the production server
npm run start
```

---

## 🔒 Security & Privacy

Postpartum health and infant logs are deeply sensitive. Materna is built privacy-first:

* **PostgreSQL Row Level Security (RLS)**: Strict user-level isolation guarantees users can only access their own logs (`auth.uid() = user_id`).
* **Local-First Resilience**: Full offline caching in `localStorage` ensures data is immediately accessible and never lost on network interruption.
* **Sanitized AI Interactions**: Maternal assistant prompts strip personal identifiable information (PII) before querying the Gemini API.
* **Data Portability**: Complete user data export capability (CSV and JSON) directly from the profile settings.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
