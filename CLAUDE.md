- Use `react-hotkeys-hook` for keyboard shortcuts.

## Adding New Voices

Voices are stored in `data/voices/` with the following structure:

```
data/voices/
  voice-name/
    source.wav   # Reference audio for TTS cloning (required)
    sample.wav   # TTS-generated preview clip (optional)
```

To add a new voice:

1. Create a directory: `data/voices/{voice-name}/`
2. Add `source.wav` - the reference audio file for voice cloning (must be at least 5 seconds)
3. Generate `sample.wav` using the TTS API (see below)

### Generating Voice Samples

Use the standard sample text (Night's Watch Oath) for consistency:

> "Night gathers, and now my watch begins. It shall not end until my death. I shall take no wife, hold no lands, father no children. I shall wear no crowns and win no glory. I shall live and die at my post. I am the sword in the darkness. I am the watcher on the walls. I am the shield that guards the realms of men."

Generate a sample using curl:

```bash
curl -X POST "http://localhost:8880/tts" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Night gathers, and now my watch begins. It shall not end until my death. I shall take no wife, hold no lands, father no children. I shall wear no crowns and win no glory. I shall live and die at my post. I am the sword in the darkness. I am the watcher on the walls. I am the shield that guards the realms of men.",
    "voice": "voice-name"
  }' \
  --output data/voices/voice-name/sample.wav
```

Replace `voice-name` with the actual voice directory name.
