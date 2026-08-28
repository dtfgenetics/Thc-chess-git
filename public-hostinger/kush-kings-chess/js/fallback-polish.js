(() => {
  const fromInput = document.querySelector('input[name="from_sq"]');
  const toInput = document.querySelector('input[name="to_sq"]');
  const moveForm = fromInput?.closest('form');
  const saveButton = moveForm?.querySelector('button[type="submit"], button:not([type])');
  const squares = [...document.querySelectorAll('.square[title]')];

  function clearSquareState() {
    squares.forEach((square) => square.classList.remove('selected', 'target-selected'));
  }

  function syncSquareState() {
    clearSquareState();
    if (fromInput?.value) {
      document.querySelector(`.square[title="${fromInput.value.toLowerCase()}"]`)?.classList.add('selected');
    }
    if (toInput?.value) {
      document.querySelector(`.square[title="${toInput.value.toLowerCase()}"]`)?.classList.add('target-selected');
    }
  }

  if (fromInput && toInput && squares.length) {
    squares.forEach((square) => {
      const coordinate = (square.getAttribute('title') || '').toLowerCase();
      square.setAttribute('role', 'button');
      square.setAttribute('tabindex', '0');
      square.setAttribute('aria-label', `${coordinate}${square.textContent?.trim() ? `, ${square.textContent.trim()}` : ', empty square'}`);

      const chooseSquare = () => {
        if (!fromInput.value || toInput.value) {
          fromInput.value = coordinate;
          toInput.value = '';
        } else if (coordinate === fromInput.value.toLowerCase()) {
          fromInput.value = '';
        } else {
          toInput.value = coordinate;
          saveButton?.focus({ preventScroll: true });
        }
        syncSquareState();
      };

      square.addEventListener('click', chooseSquare);
      square.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          chooseSquare();
        }
      });
    });

    fromInput.addEventListener('input', syncSquareState);
    toInput.addEventListener('input', syncSquareState);
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      fromInput.value = '';
      toInput.value = '';
      clearSquareState();
      fromInput.focus({ preventScroll: true });
    });
    syncSquareState();
  }

  const inviteNote = [...document.querySelectorAll('.small-note')]
    .find((node) => node.textContent?.trim().startsWith('Invite:'));

  if (inviteNote) {
    const inviteUrl = inviteNote.textContent.replace(/^\s*Invite:\s*/, '').trim();
    const copyButton = document.createElement('button');
    copyButton.type = 'button';
    copyButton.className = 'copy-invite-button';
    copyButton.textContent = 'Copy Invite';

    const status = document.createElement('span');
    status.className = 'copy-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');

    copyButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(inviteUrl);
        status.textContent = ' Invite copied.';
      } catch {
        status.textContent = ' Copy blocked—select the invite link manually.';
      }
    });

    inviteNote.insertAdjacentElement('afterend', copyButton);
    copyButton.insertAdjacentElement('afterend', status);
  }
})();
