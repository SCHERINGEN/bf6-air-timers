import { state } from './state.js';
import { speak } from './tts.js';

function formatMMSS(totalSeconds) {
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const ss = String(totalSeconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

export function isTimerInactive(timerEl) {
  const display = timerEl?.style?.display;
  return display === 'none' || display === '' || display == null;
}

export function startTimer(seconds, vehicleName, elements) {
  const {
    card,
    killBtn,
    timer,
    controls,
    imgWrap,
    minus,
    plus
  } = elements;

  let remaining = seconds;

  killBtn.style.display = 'none';
  timer.style.display = 'block';
  controls.style.display = 'flex';
  imgWrap.classList.add('dead');

  const update = () => {
    timer.textContent = formatMMSS(remaining);
    timer.classList.remove('warning', 'danger');

    if (remaining <= 15) {
      timer.classList.add('danger');
    } else if (remaining <= 30) {
      timer.classList.add('warning');
    }

    minus.disabled = remaining <= state.constants.timerStepSeconds;
  };

  minus.onclick = () => {
    if (remaining > state.constants.timerStepSeconds) {
      remaining = Math.max(state.constants.timerMinSeconds, remaining - state.constants.timerStepSeconds);
      update();
    }
  };

  plus.onclick = () => {
    remaining = Math.min(state.constants.timerMaxSeconds, remaining + state.constants.timerStepSeconds);
    update();
  };

  update();

  const intervalId = window.setInterval(() => {
    remaining -= 1;

    if (remaining < 0) {
      window.clearInterval(intervalId);
      delete card.dataset.interval;

      timer.style.display = 'none';
      controls.style.display = 'none';
      killBtn.style.display = 'block';
      imgWrap.classList.remove('dead');

      card.classList.add('pulse');
      speak(`Enemy ${vehicleName} spawned`);
      window.setTimeout(() => card.classList.remove('pulse'), 700);
      return;
    }

    update();
  }, 1000);

  card.dataset.interval = String(intervalId);
}
