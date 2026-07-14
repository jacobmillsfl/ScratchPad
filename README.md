# Scratchpad

Ephemeral scratch notes with markdown preview and action tracking. Built on [vite-reactts-electron-starter](https://github.com/jacobmillsfl/vite-reactts-electron-starter).

## Features

- Tabbed notes — close a tab to delete the note
- Archive tabs to hide long-term notes from the tab bar
- Markdown editor with smart list continuation
- Split preview pane (toggle from header)
- Preview syntax highlighting for common languages (see below)
- Find and replace in the editor (`Cmd/Ctrl+F`, `Cmd/Ctrl+Alt+F`)
- **Make list** / **Make actions** — select lines, right-click or `Cmd/Ctrl+Shift+L` / `Cmd/Ctrl+Shift+A`
- Actions sidebar for `- [ ]` items in the active tab
- Toggle Actions / Preview panes from the header
- Toggle line numbers in the editor header
- Tab rename (right-click) and pin
- Session restore on relaunch (local only; no cloud sync)

## Requirements

- Node.js 18+ (20 LTS recommended)
- npm 9+

## Development

```bash
git clone <repo-url>
cd ScratchPad
npm install
npm run dev
```

Starts Vite on port 3000 and launches Electron. Use `npm run dev` (both processes). Do not run `dev:electron` alone unless Vite is already running.

**npm registry:** This project includes a `.npmrc` pointing at the public npm registry. If `npm install` hangs, your global npm may be routing through corporate Artifactory — rely on the project-local `.npmrc` or run `npm install --registry https://registry.npmjs.org`.

If Electron fails with "failed to install correctly", run:

```bash
node node_modules/electron/install.js
```

## Production build (local test)

```bash
npm run build
npm start
```

`start` builds the renderer and Electron main process, then launches the packaged file layout locally (no installer).

## Install on macOS

Build and install to `/Applications`:

```bash
npm run dist:install
```

`dist:install` builds the `.app` only (skips DMG) and copies to `/Applications`. Use `npm run dist:dmg` when you need a distributable DMG.

```bash
npm run dist:app   # .app only — fastest for local install
npm run dist:dmg   # DMG for distribution
bash scripts/install-mac.sh   # install an existing dist/mac-arm64/Scratchpad.app
```

Launch via Applications, Spotlight (`Cmd+Space` → Scratchpad), or:

```bash
open -a Scratchpad
```

**Spotlight not showing the app?** After `dist:install`, the install script ad-hoc signs the bundle and registers it with Launch Services. If it still does not appear immediately:

1. Run `open -a Scratchpad` once.
2. In Spotlight, check the **Applications** section (not only Documents).
3. Project folders also named `Scratchpad` (ie: this repo) may rank above the app in text search. Exclude dev folders from Spotlight indexing in **System Settings → Siri & Spotlight → Spotlight Privacy** if that gets in the way.

**First launch:** macOS may block unsigned apps. Use **System Settings → Privacy & Security → Open Anyway**, or right-click the app → **Open**.

**Session data:** `~/Library/Application Support/scratchpad/scratchpad-session.json`

## Install on Windows

Build an NSIS installer:

```bash
npm run dist:win
```

Output: `dist/Scratchpad Setup <version>.exe` (exact name varies). Run the installer and launch Scratchpad from the Start menu or desktop shortcut.

**Session data:** `%APPDATA%\scratchpad\scratchpad-session.json`

## Cross-platform notes

- Editor shortcuts use CodeMirror `Mod-` bindings (`Cmd` on macOS, `Ctrl` on Windows/Linux).
- New tab: `Cmd+T` (macOS) or `Ctrl+T` (Windows).
- `npm run dev` and `npm run start` work on macOS and Windows.
- `dist:install` is macOS-only. Use `dist:win` on Windows.

## Markdown preview

The preview pane renders GitHub-flavored markdown, including tables, blockquotes, and fenced code blocks with syntax highlighting. Use a language tag on fenced code blocks:

````markdown
```py
print("hello")
```
````

### Syntax highlighting languages

| Language | Tags |
|----------|------|
| HTML | `html`, `xml` |
| CSS | `css` |
| Python | `py`, `python` |
| JavaScript | `js`, `javascript` |
| TypeScript | `ts`, `typescript` |
| Java | `java` |
| Bash | `bash`, `sh` |
| C | `c` |
| C++ | `cpp`, `c++` |
| C# | `csharp`, `cs` |

Fenced blocks with an unrecognized tag (or no tag) render as plain monospace text.

## Project layout

```
electron/     → TypeScript sources; compiles to main/ (Electron main + preload)
src/          → Vite root (React app, index.html)
src/out/      → Vite production build output (generated; not committed)
main/         → Compiled Electron main process (generated; not committed)
resources/    → App icon for electron-builder
scripts/      → Platform install helpers
```

## Keyboard shortcuts

| Shortcut (macOS) | Shortcut (Windows) | Action |
|------------------|--------------------|--------|
| Cmd+T | Ctrl+T | New tab |
| Cmd+F | Ctrl+F | Find |
| Cmd+Option+F | Ctrl+Alt+F | Find and replace |
| Cmd+G | Ctrl+G | Find next |
| Cmd+Shift+G | Ctrl+Shift+G | Find previous |
| Cmd+B | Ctrl+B | Bold (selection) |
| Cmd+I | Ctrl+I | Italic (selection) |
| Cmd+` | Ctrl+` | Code (selection) |
| Cmd+Shift+L | Ctrl+Shift+L | Make list (selection) |
| Cmd+Shift+A | Ctrl+Shift+A | Make actions (selection) |
| Cmd+Shift+H | Ctrl+Shift+H | Make link (URL selection) |

## Security and data

- No API keys, tokens, or `.env` files are used by this app.
- Notes are stored locally in Electron `userData` as JSON.
- External links in preview open in the system browser, not inside the app.
