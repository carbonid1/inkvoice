---
description: Quick-build and reinstall the InkVoice Electron app (skips DMG for speed)
disable-model-invocation: true
---

Quick-build and reinstall the InkVoice Electron app (skips DMG for speed):

1. Quit any running InkVoice instance (`pkill -f InkVoice`)
2. Run `./scripts/build-electron.sh --no-dmg`
3. Run `rm -rf ~/Applications/InkVoice.app && cp -R dist/mac-arm64/InkVoice.app ~/Applications/`
4. Run `open ~/Applications/InkVoice.app`

`~/Applications/` is the per-user folder — no admin prompt required, unlike `/Applications/`.
