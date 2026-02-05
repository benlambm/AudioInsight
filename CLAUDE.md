# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AudioInsight is a React + TypeScript SPA that analyzes uploaded audio files using Google's Gemini 3 API. It generates TL;DRs, semantic summaries, sentiment analysis, topic extraction, and memorable quotes from audio content.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server on localhost:3000 (all interfaces via 0.0.0.0)
npm run build        # Production build to dist/
npm run preview      # Preview production build
```

No test framework, linter, or formatter is configured.

## Architecture

**Data flow:** FileUpload → App.handleFileSelected() → gemini.analyzeAudio() → Gemini API → AnalysisResult display

**Key layers:**
- **App.tsx** — Root component, manages all state via `useState` hooks and an `AnalysisStatus` enum (IDLE → PROCESSING → COMPLETED/ERROR)
- **components/** — UI components: `FileUpload.tsx` (drag-and-drop with validation), `AudioPlayer.tsx` (HTML5 audio from File blob), `AnalysisResult.tsx` (multi-section results display)
- **services/gemini.ts** — Gemini API integration: uploads audio via File API with polling (max 60 attempts, 2s intervals), then sends to `gemini-3-pro-preview` with JSON schema enforcement and 1024-token thinking budget
- **types.ts** — `AudioAnalysis` interface and `AnalysisStatus` enum shared across app

**Environment:** `GEMINI_API_KEY` must be set in `.env.local`. Vite injects it at build time via `process.env.API_KEY` and `process.env.GEMINI_API_KEY`.

**Styling:** Tailwind CSS via CDN (not installed as a package). Dark theme (slate-950). All styling is utility classes inline.

**Path alias:** `@/*` maps to project root in both tsconfig.json and vite.config.ts.
