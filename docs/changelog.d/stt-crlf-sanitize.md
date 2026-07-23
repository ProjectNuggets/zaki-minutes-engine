- **STT egress hardened against CRLF injection in form values.** The Whisper transcription client
  now strips CR/LF from every text `multipart/form-data` value (`language`, `prompt`, `model`, …),
  so a value carried from a direct `POST /bots` request can no longer forge a part boundary or
  header and corrupt the STT request framing.
