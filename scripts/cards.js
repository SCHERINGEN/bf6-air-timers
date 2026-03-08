import { state } from './state.js';
import { startTimer, isTimerInactive } from './timers.js';
import { speak } from './tts.js';
import { $, $$, buildReplaceOptions, updateCardLabelsVisibility, updateClearButton, closeAllReplaceMenus } from './ui.js';

function nextCardId() {
  state.nextCardId += 1;
  return `card-${state.nextCardId}`;
}

function getVehicleByName(vehicleName) {
  return state.config.vehiclesByName[String(vehicleName || '').toLowerCase()] || null;
}

function getCardElements(card) {
  return {
    card,
    killBtn: $('.kill-btn', card),
    timer: $('.timer', card),
    controls: $('.timer-controls', card),
    imgWrap: $('.card-image-container', card),
    minus: $('.minus', card),
    plus: $('.plus', card)
  };
}

function buildCardMarkup(cardId, vehicle, locked = false) {
  const primaryLabel = locked ? `🔒 "Activate ${vehicle.name}"` : `🕑 "Timer ${vehicle.name}"`;
  return `
    <div class="card ${locked ? 'locked' : ''}" id="${cardId}" data-vehicle="${vehicle.name}" data-vehicle-id="${vehicle.id}">
      <div class="card-image-container">
        <div class="card-holder">
          <div class="card-label">${primaryLabel}</div>
          <div class="card-label">🗑️ "Remove ${vehicle.name}"</div>
          <div class="card-label">💱 "Replace ${vehicle.name} ..."</div>
        </div>
        <div class="card-actions">
          <button class="action-btn delete" type="button" title="Delete">🗑️</button>
          <button class="action-btn replace" type="button" title="Replace">💱</button>
          <button class="action-btn lock" type="button" title="Lock">🔒</button>
        </div>
        <select class="replace-select">
          <option value="">Replace with…</option>
          ${buildReplaceOptions()}
        </select>
        <img src="${vehicle.image}" alt="${vehicle.label}">
        <button class="kill-btn" type="button">${locked ? 'Activate' : 'Unalive'}</button>
        <div class="timer"></div>
        <div class="timer-controls">
          <button class="time-btn minus" type="button">-5</button>
          <button class="time-btn plus" type="button">+5</button>
        </div>
      </div>
    </div>
  `;
}

function setupCard(card) {
  const vehicleName = card.dataset.vehicle;
  const elements = getCardElements(card);
  const { killBtn, timer, imgWrap } = elements;
  const replaceSelect = $('.replace-select', card);
  const deleteBtn = $('.action-btn.delete', card);
  const replaceBtn = $('.action-btn.replace', card);
  const lockBtn = $('.action-btn.lock', card);

  deleteBtn.addEventListener('click', () => removeCard(card.id));
  replaceBtn.addEventListener('click', () => toggleReplaceMenu(card.id));
  lockBtn.addEventListener('click', () => lockCard(card.id));
  replaceSelect.addEventListener('change', event => replaceCardFromDropdown(card.id, event.target.value));

  killBtn.addEventListener('click', () => {
    const label = $('.card-label', card);

    if (card.classList.contains('locked')) {
      card.classList.remove('locked');
      imgWrap.classList.remove('dead');
      killBtn.textContent = 'Unalive';
      if (label) {
        label.textContent = `🕑 "Timer ${vehicleName}"`;
      }
      return;
    }

    if (!isTimerInactive(timer)) {
      return;
    }

    startTimer(state.constants.timerDefaultSeconds, vehicleName, elements);
  });
}

export function addCardByVehicleId(vehicleId, locked = false, insertBeforeCard = null) {
  const vehicle = state.config.vehiclesById[vehicleId];
  if (!vehicle) {
    return null;
  }

  const cardId = nextCardId();
  const markup = buildCardMarkup(cardId, vehicle, locked);

  if (insertBeforeCard) {
    insertBeforeCard.insertAdjacentHTML('beforebegin', markup);
  } else {
    $('#cards').insertAdjacentHTML('beforeend', markup);
  }

  const card = document.getElementById(cardId);
  setupCard(card);
  updateCardLabelsVisibility();
  updateClearButton();
  return card;
}

export function addCardByName(vehicleName) {
  const vehicle = getVehicleByName(vehicleName);
  if (!vehicle) {
    return false;
  }

  addCardByVehicleId(vehicle.id, false);
  speak(`${vehicle.name} added`);
  return true;
}

export function removeCard(cardId) {
  const card = document.getElementById(cardId);
  if (card?.dataset.interval) {
    window.clearInterval(Number(card.dataset.interval));
  }
  card?.remove();
  updateClearButton();
}

export function clearAllCards() {
  speechSynthesis.cancel();

  $$('.card').forEach(card => {
    if (card.dataset.interval) {
      window.clearInterval(Number(card.dataset.interval));
    }
  });

  $('#cards').innerHTML = '';
  updateClearButton();
}

export function updatePreset() {
  const mapId = $('#map-select').value;
  const modeId = $('#mode-select').value;
  if (!mapId || !modeId) {
    return;
  }

  clearAllCards();

  const items = state.config.presets.presets[mapId]?.[modeId] || [];
  items.forEach(item => addCardByVehicleId(item.vehicleId, !item.unlocked));
}

export function addSelectedCard() {
  const select = $('#add-select');
  const vehicleId = select.value;
  if (!vehicleId) {
    return;
  }

  addCardByVehicleId(vehicleId, false);
  select.value = '';
}

export function findFirstAvailableCardByVehicleId(vehicleId) {
  return Array.from($$('.card')).find(card => {
    const timer = $('.timer', card);
    return (
      card.dataset.vehicleId === vehicleId &&
      isTimerInactive(timer) &&
      !card.classList.contains('locked')
    );
  }) || null;
}

export function findFirstRemovableCardByName(vehicleName) {
  const wanted = String(vehicleName).toLowerCase();
  return Array.from($$('.card')).find(card => {
    const timer = $('.timer', card);
    return String(card.dataset.vehicle).toLowerCase() === wanted && isTimerInactive(timer);
  }) || null;
}

export function handleVoiceTimerByVehicleName(vehicleName) {
  const vehicle = getVehicleByName(vehicleName);
  if (!vehicle) {
    return false;
  }

  const card = findFirstAvailableCardByVehicleId(vehicle.id);
  if (!card) {
    return false;
  }

  $('.kill-btn', card)?.click();
  speak(`Timer started for ${vehicle.name}`);
  return true;
}

export function removeCardByName(vehicleName) {
  const card = findFirstRemovableCardByName(vehicleName);
  if (!card) {
    return false;
  }

  removeCard(card.id);
  speak(`${vehicleName} removed`);
  return true;
}

export function unlockCardByName(vehicleName) {
  const wanted = String(vehicleName).toLowerCase();
  const card = Array.from($$('.card.locked')).find(item => String(item.dataset.vehicle).toLowerCase() === wanted);

  if (!card) {
    return false;
  }

  const { killBtn, imgWrap } = getCardElements(card);
  const label = $('.card-label', card);

  card.classList.remove('locked');
  killBtn.textContent = 'Unalive';
  imgWrap.classList.remove('dead');
  if (label) {
    label.textContent = `🕑 "Timer ${card.dataset.vehicle}"`;
  }

  speak(`${card.dataset.vehicle} activated`);
  return true;
}

export function lockCard(cardId) {
  const card = document.getElementById(cardId);
  if (!card) {
    return;
  }

  const { timer, controls, imgWrap, killBtn } = getCardElements(card);
  if (!isTimerInactive(timer)) {
    return;
  }

  const label = $('.card-label', card);
  imgWrap.classList.remove('dead');
  killBtn.style.display = 'block';
  killBtn.textContent = 'Activate';
  timer.style.display = 'none';
  controls.style.display = 'none';
  card.classList.add('locked');

  if (label) {
    label.textContent = `🔒 "Activate ${card.dataset.vehicle}"`;
  }
}

export function toggleReplaceMenu(cardId) {
  const card = document.getElementById(cardId);
  if (!card) {
    return;
  }

  const timer = $('.timer', card);
  if (!isTimerInactive(timer)) {
    return;
  }

  const select = $('.replace-select', card);
  const isOpen = select.style.display === 'block';
  closeAllReplaceMenus();
  select.style.display = isOpen ? 'none' : 'block';
  select.value = '';
}

export function replaceSpecificCard(oldCard, toVehicleName) {
  const timer = $('.timer', oldCard);
  if (!isTimerInactive(timer)) {
    return false;
  }

  const replacement = getVehicleByName(toVehicleName);
  if (!replacement) {
    return false;
  }

  const locked = oldCard.classList.contains('locked');
  addCardByVehicleId(replacement.id, locked, oldCard);
  removeCard(oldCard.id);
  updateCardLabelsVisibility();
  return true;
}

export function replaceCardFromDropdown(cardId, toVehicleName) {
  const card = document.getElementById(cardId);
  if (!card || !toVehicleName) {
    return false;
  }

  $('.replace-select', card).style.display = 'none';
  return replaceSpecificCard(card, toVehicleName);
}

export function replaceCardByNames(fromName, toName) {
  const oldCard = findFirstRemovableCardByName(fromName);
  if (!oldCard) {
    return false;
  }

  const replaced = replaceSpecificCard(oldCard, toName);
  if (replaced) {
    speak(`${fromName} replaced with ${toName}`);
  }
  return replaced;
}
