/** Meeting-language options for the bot-start language picker. `""` (Auto-detect) is the default —
 *  callers OMIT `language` from the request body for that case; Whisper auto-detects. Free-form ISO
 *  codes — the backend has no enum, this is a curated list of common Whisper languages. */
export const LANGUAGE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Auto-detect" },
  { value: "en", label: "English" },
  { value: "ar", label: "Arabic" },
  { value: "de", label: "German" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "it", label: "Italian" },
  { value: "pt", label: "Portuguese" },
  { value: "nl", label: "Dutch" },
  { value: "ru", label: "Russian" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "tr", label: "Turkish" },
  { value: "hi", label: "Hindi" },
  { value: "pl", label: "Polish" },
  { value: "uk", label: "Ukrainian" },
];
