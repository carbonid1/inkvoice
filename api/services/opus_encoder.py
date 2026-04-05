import subprocess


def encode_wav_to_opus(wav_bytes: bytes, bitrate: str = "48k") -> bytes:
    """Encode WAV audio bytes to OGG/Opus using ffmpeg."""
    result = subprocess.run(
        [
            "ffmpeg",
            "-loglevel", "error",
            "-i", "pipe:0",
            "-c:a", "libopus",
            "-b:a", bitrate,
            "-f", "ogg",
            "pipe:1",
        ],
        input=wav_bytes,
        capture_output=True,
        timeout=30,
    )
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg opus encoding failed: {result.stderr.decode()}")
    return result.stdout
