import { state } from './state.js';

export function initVoices() {
  state.voices = speechSynthesis.getVoices();
  state.selectedVoice =
    state.voices.find(voice => {
      const name = voice.name || '';
      const lower = name.toLowerCase();
      return (
        lower.includes('female') ||
        lower.includes('woman') ||
        name.includes('Samantha') ||
        name.includes('Zira') ||
        name.includes('Google US')
      );
    }) ||
    state.voices.find(voice => String(voice.lang || '').startsWith('en-')) ||
    state.voices[0] ||
    null;
}

export function speak(text) {
  if (!state.ttsEnabled) {
    return;
  }

  if (state.voices.length === 0) {
    speechSynthesis.getVoices();
    initVoices();
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.volume = 0.8;
  utterance.rate = 1.2;
  utterance.pitch = 1.1;
  utterance.voice = state.selectedVoice;
  speechSynthesis.speak(utterance);
}

export function wireTtsVoices() {
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = initVoices;
  }
  initVoices();
}
