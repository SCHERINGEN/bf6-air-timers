import { state } from './state.js';

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`);
  }
  return response.json();
}

export async function loadConfig() {
  const [vehicles, keywords, presets] = await Promise.all([
    loadJson(new URL('../data/vehicles.json', import.meta.url)),
    loadJson(new URL('../data/keywords.json', import.meta.url)),
    loadJson(new URL('../data/presets.json', import.meta.url))
  ]);

  state.config.vehicles = vehicles;
  state.config.keywords = keywords;
  state.config.presets = presets;
  state.config.vehiclesById = Object.fromEntries(vehicles.map(vehicle => [vehicle.id, vehicle]));
  state.config.vehiclesByName = Object.fromEntries(vehicles.map(vehicle => [vehicle.name.toLowerCase(), vehicle]));

  return state.config;
}
