import { state } from './state.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => root.querySelectorAll(selector);

export function populateSelect(select, items, placeholder, valueKey = 'id', labelKey = 'label') {
  select.innerHTML = '';
  const firstOption = document.createElement('option');
  firstOption.value = '';
  firstOption.textContent = placeholder;
  select.appendChild(firstOption);

  items.forEach(item => {
    const option = document.createElement('option');
    option.value = item[valueKey];
    option.textContent = item[labelKey];
    select.appendChild(option);
  });
}

export function buildReplaceOptions() {
  return state.config.vehicles
    .map(vehicle => `<option value="${vehicle.name}">${vehicle.label}</option>`)
    .join('');
}

export function updateClearButton() {
  const clearBtn = $('#clear-btn');
  const hasCards = Boolean($('.card'));
  clearBtn.style.display = hasCards ? 'block' : 'none';
}

export function updateCardLabelsVisibility() {
  const show = state.voiceEnabled;
  $$('.card .card-label').forEach(label => {
    label.style.display = show ? 'block' : 'none';
  });
}

export function openInfoModal() {
  $('#info-modal').style.display = 'flex';
}

export function closeInfoModal(event) {
  if (!event || event.target.id === 'info-modal') {
    $('#info-modal').style.display = 'none';
  }
}

export function setupModalInteractions() {
  $('#info-btn').addEventListener('click', openInfoModal);
  $('#modal-close').addEventListener('click', closeInfoModal);
  $('#info-modal').addEventListener('click', closeInfoModal);

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeInfoModal();
    }
  });
}

export function closeAllReplaceMenus() {
  $$('.replace-select').forEach(select => {
    select.style.display = 'none';
  });
}

export { $, $$ };
