# Repository Guidelines

## Project Structure & Module Organization
Source logic lives in `content.js`, which injects the navigator UI and sticky topic bar into chatgpt.com. Styling is kept in `style.css`, and `manifest.json` wires both files into a Manifest V3 content script. Images and promotional assets sit under `imgs/`, while `README.md` and the Superstyle notes document intended UX. Keep new modules flat at the repo root unless they are large enough to deserve a dedicated folder.

## Build, Test, and Development Commands
No bundler is used—load the extension unpacked via Chrome or Edge: `chrome://extensions` → Enable Developer Mode → **Load unpacked** → select this folder. Before sharing a build, archive the root (e.g. `zip -r chatgpt-question-navigator.zip . -x "*.git*"`). After edits, reload the extension from the extensions page to pick up changes.

## Coding Style & Naming Conventions
JavaScript files follow a two-space indent, prefer `const`/`let` over `var`, and use camelCase for variables (`currentNavigator`). Favour small, pure helper functions and early returns; include inline comments only when DOM heuristics are non-obvious. CSS classes are lowercase with hyphens (`question-item`, `navigator-minimap`), and shared utility classes start with a double underscore prefix when they patch ChatGPT defaults (see `__ben-cust`).

## Testing Guidelines
Manual verification is required: open a multi-question ChatGPT conversation, confirm the topic bar renders, ensure minimap rows stay synced while scrolling, and validate navigator clicks scroll the correct prompt into view. Test the sidebar highlighting by switching threads and reloading. For regressions, check both light/dark themes and narrow viewports; note any limitations in the PR description.

## Commit & Pull Request Guidelines
Follow the existing commit prefix format (`Add:`, `fix:`, `fixed:`) and keep messages concise, optionally pairing English verbs with brief Chinese context when helpful. PRs should describe the change, mention manual test scenarios run, and include screenshots or short clips when UI shifts (reuse `chatgpt_feature_overview.png` style framing). Link related issues if available and request a quick sanity check before merging.
