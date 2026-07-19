/**
 * Chinese Text-to-Speech Hook
 * Uses Web Speech API for Chinese pronunciation
 */

export interface ChineseTTSHook {
  speak: (text: string, rate?: number) => void;
  isSupported: boolean;
  isSpeaking: boolean;
  cancel: () => void;
}

/**
 * Hook for Chinese TTS using Web Speech API
 * @param lang - Language code (default: 'zh-CN')
 */
export function useChineseTTS(lang: string = 'zh-CN'): ChineseTTSHook {
  const isSupported = 'speechSynthesis' in window;
  let utterance: SpeechSynthesisUtterance | null = null;

  const speak = (text: string, rate: number = 0.8) => {
    if (!isSupported) {
      console.warn('Speech synthesis not supported');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate; // Slower for learners (default 0.8)
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Optional: Select Chinese voice if available
    const voices = window.speechSynthesis.getVoices();
    const chineseVoice = voices.find(
      (voice) => voice.lang.startsWith('zh') && voice.localService
    );
    if (chineseVoice) {
      utterance.voice = chineseVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  const cancel = () => {
    if (isSupported) {
      window.speechSynthesis.cancel();
    }
  };

  const isSpeaking = () => {
    return isSupported ? window.speechSynthesis.speaking : false;
  };

  return {
    speak,
    isSupported,
    isSpeaking: isSpeaking(),
    cancel,
  };
}

/**
 * Alternative: Google TTS URL-based fallback
 * Note: This is for reference only, may have CORS issues
 */
export function getGoogleTTSUrl(text: string, lang: string = 'zh-CN'): string {
  return `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(text)}`;
}

/**
 * Pinyin tone marks for reference
 */
export const TONE_MARKS = {
  ā: 'a1',
  á: 'a2',
  ǎ: 'a3',
  à: 'a4',
  ē: 'e1',
  é: 'e2',
  ě: 'e3',
  è: 'e4',
  ī: 'i1',
  í: 'i2',
  ǐ: 'i3',
  ì: 'i4',
  ō: 'o1',
  ó: 'o2',
  ǒ: 'o3',
  ò: 'o4',
  ū: 'u1',
  ú: 'u2',
  ǔ: 'u3',
  ù: 'u4',
  ǖ: 'v1',
  ǘ: 'v2',
  ǚ: 'v3',
  ǜ: 'v4',
};
