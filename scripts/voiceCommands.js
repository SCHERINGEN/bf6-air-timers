import { state } from './state.js';
import { updateCardLabelsVisibility } from './ui.js';
import { addCardByName, handleVoiceTimerByVehicleName, removeCardByName, replaceCardByNames, unlockCardByName } from './cards.js';

function getTranscript(event) {
  return event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
}

function hasKeyword(transcript, intent) {
  return (state.config.keywords[intent] || []).some(keyword => transcript.includes(keyword));
}

function startsWithKeyword(transcript, intent) {
  return (state.config.keywords[intent] || []).some(keyword => transcript.startsWith(`${keyword} `));
}

function getGroupsInTranscriptOrder(transcript) {
  const normalized = String(transcript || '').toLowerCase();
  const hits = [];

  state.config.vehicles.forEach(vehicle => {
    let bestIndex = Infinity;
    vehicle.aliases.forEach(alias => {
      const index = normalized.indexOf(alias);
      if (index !== -1) {
        bestIndex = Math.min(bestIndex, index);
      }
    });

    if (bestIndex !== Infinity) {
      hits.push({ vehicle, index: bestIndex });
    }
  });

  hits.sort((a, b) => a.index - b.index);
  return hits.map(hit => hit.vehicle);
}

function handleTranscript(transcript) {
  if (startsWithKeyword(transcript, 'add')) {
    const [vehicle] = getGroupsInTranscriptOrder(transcript);
    if (vehicle) {
      addCardByName(vehicle.name);
    }
    return;
  }

  if (startsWithKeyword(transcript, 'replace')) {
    const matches = getGroupsInTranscriptOrder(transcript);
    if (matches.length >= 2) {
      replaceCardByNames(matches[0].name, matches[1].name);
    }
    return;
  }

  const matches = getGroupsInTranscriptOrder(transcript);
  if (matches.length === 0) {
    return;
  }

  const vehicleName = matches[0].name;

  if (hasKeyword(transcript, 'remove')) {
    removeCardByName(vehicleName);
    return;
  }

  if (hasKeyword(transcript, 'activate')) {
    unlockCardByName(vehicleName);
    return;
  }

  if (hasKeyword(transcript, 'timer')) {
    handleVoiceTimerByVehicleName(vehicleName);
  }
}

export function toggleVoiceRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    return;
  }

  if (!state.recognition) {
    state.recognition = new SpeechRecognition();
    state.recognition.lang = 'en-US';
    state.recognition.continuous = true;
    state.recognition.interimResults = false;

    state.recognition.onresult = event => {
      if (!state.voiceEnabled) {
        return;
      }

      const transcript = getTranscript(event);
      handleTranscript(transcript);
    };

    state.recognition.onend = () => {
      if (state.voiceEnabled && state.listening) {
        state.recognition.start();
      }
    };
  }

  if (state.voiceEnabled && !state.listening) {
    state.recognition.start();
    state.listening = true;
    updateCardLabelsVisibility();
  } else if (!state.voiceEnabled && state.listening) {
    state.recognition.stop();
    state.listening = false;
    updateCardLabelsVisibility();
  }
}
