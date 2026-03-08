export const state = {
  nextCardId: 0,
  ttsEnabled: true,
  voiceEnabled: false,
  voices: [],
  selectedVoice: null,
  recognition: null,
  listening: false,
  config: {
    vehicles: [],
    vehiclesById: {},
    vehiclesByName: {},
    keywords: {},
    presets: {}
  },
  constants: {
    timerDefaultSeconds: 90,
    timerMinSeconds: 0,
    timerMaxSeconds: 120,
    timerStepSeconds: 5
  }
};
