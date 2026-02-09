export interface Language {
  code: string;
  name: string;
  flag: string;
  speechCode: string; // BCP 47 for SpeechSynthesis
  recognitionCode: string; // BCP 47 for SpeechRecognition
}

export const languages: Language[] = [
  { code: "es", name: "Spanish", flag: "🇪🇸", speechCode: "es-ES", recognitionCode: "es-ES" },
  { code: "fr", name: "French", flag: "🇫🇷", speechCode: "fr-FR", recognitionCode: "fr-FR" },
  { code: "zh", name: "Mandarin", flag: "🇨🇳", speechCode: "zh-CN", recognitionCode: "zh-CN" },
  { code: "ja", name: "Japanese", flag: "🇯🇵", speechCode: "ja-JP", recognitionCode: "ja-JP" },
  { code: "de", name: "German", flag: "🇩🇪", speechCode: "de-DE", recognitionCode: "de-DE" },
  { code: "it", name: "Italian", flag: "🇮🇹", speechCode: "it-IT", recognitionCode: "it-IT" },
  { code: "pt", name: "Portuguese", flag: "🇧🇷", speechCode: "pt-BR", recognitionCode: "pt-BR" },
  { code: "ko", name: "Korean", flag: "🇰🇷", speechCode: "ko-KR", recognitionCode: "ko-KR" },
];
