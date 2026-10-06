document.addEventListener('DOMContentLoaded', () => {
  let notes = [];
  let editingIndex = null;
  let toastTimer = null;

  const listActive = document.getElementById('list-active');
  const listDone = document.getElementById('list-done');
  const countActive = document.getElementById('count-active');
  const countDone = document.getElementById('count-done');
  const summary = document.getElementById('summary');
  const inputNew = document.getElementById('new-note-input');
  const btnAdd = document.getElementById('btn-add');
  const btnExport = document.getElementById('btn-export');
  const statusMsg = document.getElementById('status-message');

  const svg = (inner, sw = 2) =>
    `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

  const icons = {
    edit: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>'),
    check: svg('<polyline points="20 6 9 17 4 12"/>', 2.5),
    undo: svg('<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>'),
    delete: svg('<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>'),
    close: svg('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'),
    inbox: svg('<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>', 1.5),
    done: svg('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>', 1.5)
  };

  function showStatus(text, isError = false) {
    statusMsg.textContent = text;
    statusMsg.className = 'toast ' + (isError ? 'error' : 'success');
    statusMsg.style.display = 'block';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      statusMsg.style.display = 'none';
    }, 3000);
  }

  // Gestion des onglets
  document.querySelectorAll('.seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.note-list').forEach(l => l.classList.remove('active'));

      btn.classList.add('active');
      const tabName = btn.getAttribute('data-tab');
      if (tabName === 'active') listActive.classList.add('active');
      if (tabName === 'done') listDone.classList.add('active');
    });
  });

  // Charger depuis chrome.storage.local
  chrome.storage.local.get(['fnote_data'], (result) => {
    if (result && result.fnote_data) {
      parseJsonl(result.fnote_data, false);
    } else {
      render(false);
    }
  });

  function nowString() {
    const now = new Date();
    return now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0') + ' ' +
      String(now.getHours()).padStart(2, '0') + ':' +
      String(now.getMinutes()).padStart(2, '0');
  }

  function parseJsonl(text, shouldSave = true) {
    const newNotes = [];
    const lines = text.split(/\r?\n/);

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      let isDone = false;
      let jsonStr = trimmed;

      if (trimmed.startsWith('#')) {
        isDone = true;
        jsonStr = trimmed.substring(1).trim();
      }

      try {
        const obj = JSON.parse(jsonStr);
        if (obj && (obj.note !== undefined || obj.text !== undefined)) {
          newNotes.push({
            date: obj.date || nowString(),
            note: obj.note || obj.text || '',
            done: isDone
          });
        }
      } catch (e) {
        newNotes.push({
          date: nowString(),
          note: trimmed.startsWith('#') ? trimmed.substring(1).trim() : trimmed,
          done: trimmed.startsWith('#')
        });
      }
    });

    notes = newNotes;
    render(shouldSave);
  }

  // Couleur automatique : le même tag donne toujours la même teinte
  // (insensible à la casse et aux espaces autour du tag).
  function tagHue(tag) {
    const key = tag.trim().toLowerCase();
    let h = 2166136261; // hash FNV-1a
    for (let i = 0; i < key.length; i++) {
      h ^= key.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0) % 360;
  }

  function emptyState(kind) {
    const isActive = kind === 'active';
    return `
      <div class="empty">
        ${isActive ? icons.inbox : icons.done}
        <strong>${isActive ? 'Aucune note en cours' : 'Rien de traité pour le moment'}</strong>
        <span>${isActive ? 'Ajoutez votre première note ci-dessus.' : 'Les notes terminées apparaîtront ici.'}</span>
      </div>`;
  }

  function render(shouldSave = true) {
    listActive.innerHTML = '';
    listDone.innerHTML = '';

    let activeCount = 0;
    let doneCount = 0;

    notes.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'note-item' + (item.done ? ' is-done' : '');

      if (editingIndex === index) {
        div.innerHTML = `
          <div class="note-content">
            <input type="text" class="edit-input" id="edit-input-${index}" value="${escapeHtml(item.note)}" />
            <div class="note-date">${escapeHtml(item.date)}</div>
          </div>
          <div class="note-actions" style="opacity:1">
            <button class="action-btn check" title="Valider les modifications" data-action="save-edit" data-index="${index}">
              ${icons.check}
            </button>
            <button class="action-btn delete" title="Annuler" data-action="cancel-edit">
              ${icons.close}
            </button>
          </div>
        `;
      } else {
        let formattedText = escapeHtml(item.note);
        formattedText = formattedText.replace(/\[([^\]]+)\]/g,
          (m, tag) => `<span class="note-tag" style="--h:${tagHue(tag)}">${tag}</span>`);

        div.innerHTML = `
          <div class="note-content">
            <div class="note-text-display" data-action="start-edit" data-index="${index}">${formattedText}</div>
            <div class="note-date">${escapeHtml(item.date)}</div>
          </div>
          <div class="note-actions">
            <button class="action-btn edit" title="Éditer la note" data-action="start-edit" data-index="${index}">
              ${icons.edit}
            </button>
            <button class="action-btn check" title="${item.done ? 'Remettre en cours' : 'Marquer comme traité'}" data-action="toggle" data-index="${index}">
              ${item.done ? icons.undo : icons.check}
            </button>
            <button class="action-btn delete" title="Supprimer" data-action="delete" data-index="${index}">
              ${icons.delete}
            </button>
          </div>
        `;
      }

      if (item.done) {
        doneCount++;
        listDone.appendChild(div);
      } else {
        activeCount++;
        listActive.appendChild(div);
      }
    });

    if (activeCount === 0) listActive.innerHTML = emptyState('active');
    if (doneCount === 0) listDone.innerHTML = emptyState('done');

    countActive.textContent = activeCount;
    countDone.textContent = doneCount;
    summary.textContent = notes.length === 0
      ? 'Aucune note'
      : `${notes.length} note${notes.length > 1 ? 's' : ''} · ${activeCount} en cours`;

    if (editingIndex !== null) {
      const editInput = document.getElementById(`edit-input-${editingIndex}`);
      if (editInput) {
        editInput.focus();
        editInput.setSelectionRange(editInput.value.length, editInput.value.length);
        editInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') saveEdit(editingIndex);
          if (e.key === 'Escape') cancelEdit();
        });
      }
    }

    if (shouldSave) {
      saveToStorage();
    }
  }

  function serialize() {
    return notes.map(item => {
      const jsonLine = JSON.stringify({ date: item.date, note: item.note });
      return item.done ? '#' + jsonLine : jsonLine;
    }).join('\n');
  }

  function saveToStorage() {
    chrome.storage.local.set({ fnote_data: serialize() });
  }

  function saveEdit(index) {
    const input = document.getElementById(`edit-input-${index}`);
    if (input) {
      const newText = input.value.trim();
      if (newText) {
        notes[index].note = newText;
      }
    }
    editingIndex = null;
    render(true);
  }

  function cancelEdit() {
    editingIndex = null;
    render(false);
  }

  document.addEventListener('click', (e) => {
    const actionTarget = e.target.closest('[data-action]');
    if (!actionTarget) return;

    const action = actionTarget.getAttribute('data-action');
    const index = parseInt(actionTarget.getAttribute('data-index'), 10);

    if (action === 'start-edit') {
      editingIndex = index;
      render(false);
    } else if (action === 'save-edit') {
      saveEdit(index);
    } else if (action === 'cancel-edit') {
      cancelEdit();
    } else if (action === 'toggle') {
      notes[index].done = !notes[index].done;
      render(true);
    } else if (action === 'delete') {
      notes.splice(index, 1);
      render(true);
    }
  });

  function addNote() {
    const text = inputNew.value.trim();
    if (!text) return;

    notes.unshift({
      date: nowString(),
      note: text,
      done: false
    });

    inputNew.value = '';
    render(true);
  }

  btnAdd.addEventListener('click', addNote);
  inputNew.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addNote();
  });

  btnExport.addEventListener('click', () => {
    if (notes.length === 0) {
      showStatus('Aucune note à exporter', true);
      return;
    }

    const blob = new Blob([serialize()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dump.jsonl';
    a.click();
    URL.revokeObjectURL(url);
    showStatus('Exportation réussie !');
  });

  function escapeHtml(str) {
    return String(str).replace(/[&<>'"]/g,
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }
});
