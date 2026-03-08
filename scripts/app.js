import { loadConfig } from './configLoader.js';
import { state } from './state.js';
import { wireTtsVoices } from './tts.js';
import { addSelectedCard, clearAllCards, updatePreset } from './cards.js';
import { $, $$, populateSelect, setupModalInteractions, updateCardLabelsVisibility, closeAllReplaceMenus } from './ui.js';
import { toggleVoiceRecognition } from './voiceCommands.js';

async function init() {
  await loadConfig();

  populateSelect($('#map-select'), state.config.presets.maps, 'Select Map');
  populateSelect($('#mode-select'), state.config.presets.modes, 'Select Mode');
  populateSelect($('#add-select'), state.config.vehicles, 'Add Vehicle');

  $('#map-select').addEventListener('change', updatePreset);
  $('#mode-select').addEventListener('change', updatePreset);
  $('#add-select').addEventListener('change', addSelectedCard);
  $('#clear-btn').addEventListener('click', clearAllCards);

  $('#tts-toggle').addEventListener('change', event => {
    state.ttsEnabled = event.target.checked;
  });

  $('#voice-toggle').addEventListener('change', event => {
    state.voiceEnabled = event.target.checked;
    toggleVoiceRecognition();
    updateCardLabelsVisibility();
  });

  document.addEventListener('click', event => {
    const withinCardActions = event.target.closest('.card-actions') || event.target.closest('.replace-select');
    if (!withinCardActions) {
      closeAllReplaceMenus();
    }
  });

  setupModalInteractions();
  wireTtsVoices();
  updateCardLabelsVisibility();
}

init().catch(error => {
  console.error('App initialization failed:', error);
  const cards = $('#cards');
  if (cards) {
    cards.innerHTML = '<p style="color:white;">Failed to load app configuration.</p>';
  }
});
