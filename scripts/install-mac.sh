#!/usr/bin/env bash
set -euo pipefail

APP_PATH="$(find dist -name 'Scratchpad.app' -type d | head -1)"

if [[ -z "$APP_PATH" ]]; then
  echo "Scratchpad.app not found under dist/. Run npm run dist first."
  exit 1
fi

INSTALL_PATH="/Applications/Scratchpad.app"
LSREGISTER="/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister"

echo "Installing $APP_PATH to $INSTALL_PATH"
rm -rf "$INSTALL_PATH"
ditto "$APP_PATH" "$INSTALL_PATH"

# Unsigned electron-builder bundles need ad-hoc signing for macOS to index them as apps.
codesign --force --deep --sign - "$INSTALL_PATH"

"$LSREGISTER" -f -R "$INSTALL_PATH"

# Nudge Spotlight; indexing can lag a few seconds after install.
mdimport "$INSTALL_PATH" 2>/dev/null || true

echo "Done."
echo "Open once if Spotlight has not updated yet: open -a Scratchpad"
echo "Or find it in /Applications/Scratchpad.app"
