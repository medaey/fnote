document.addEventListener('DOMContentLoaded', () => {
  let notes = [];
  let editingIndex = null;
  let toastTimer = null;
  let skipAnim = false;
  let dragged = null;
  let searchQuery = '';
  // Tags cochés (clés en minuscules), communs aux deux sections : une note passe
  // si elle a AU MOINS UN des tags cochés, qu'elle soit « En cours » ou « Traitée ».
  const tagFilters = new Set();
  let currentTab = 'active';
  let undoSnapshot = null;
  let undoTimer = null;

  const listActive = document.getElementById('list-active');
  const listDone = document.getElementById('list-done');
  const countActive = document.getElementById('count-active');
  const countDone = document.getElementById('count-done');
  const summary = document.getElementById('summary');
  const inputNew = document.getElementById('new-note-input');
  const btnAdd = document.getElementById('btn-add');
  const btnExport = document.getElementById('btn-export');
  const btnSettings = document.getElementById('btn-settings');
  const btnSettingsBack = document.getElementById('btn-settings-back');
  const viewMain = document.getElementById('view-main');
  const viewSettings = document.getElementById('view-settings');
  const exportCount = document.getElementById('export-count');
  const importFile = document.getElementById('import-file');
  const dropzone = document.getElementById('dropzone');
  const importPreview = document.getElementById('import-preview');
  const importSummary = document.getElementById('import-summary');
  const btnImportMerge = document.getElementById('btn-import-merge');
  const btnImportReplace = document.getElementById('btn-import-replace');
  const btnImportCancel = document.getElementById('btn-import-cancel');
  const btnOpenTab = document.getElementById('btn-open-tab');
  const appVersion = document.getElementById('app-version');
  let pendingImport = null;
  const statusMsg = document.getElementById('status-message');
  const searchInput = document.getElementById('search-input');
  const tagBar = document.getElementById('tag-bar');
  const tagChips = document.getElementById('tag-chips');
  const tagToggle = document.getElementById('tag-toggle');
  const tagClear = document.getElementById('tag-clear');
  let tagsExpanded = false;
  const undoBar = document.getElementById('undo-bar');
  const undoText = document.getElementById('undo-text');
  const undoBtn = document.getElementById('undo-btn');

  const svg = (inner, sw = 2) =>
    `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

  const icons = {
    edit: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>'),
    check: svg('<polyline points="20 6 9 17 4 12"/>', 2.5),
    undo: svg('<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>'),
    delete: svg('<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>'),
    close: svg('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'),
    inbox: svg('<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>', 1.5),
    done: svg('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>', 1.5),
    grip: svg('<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>', 2.5)
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

      currentTab = tabName;
      skipAnim = true;
      render(false);
      skipAnim = false;
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

  // Convertit un texte (JSONL fnote, ou tableau JSON) en liste de notes.
  function parseNotes(text) {
    const result = [];
    const clean = text.replace(/^\uFEFF/, '').trim();

    // Tolérance : un tableau JSON [{date, note, done?}, ...]
    if (clean.startsWith('[')) {
      try {
        const arr = JSON.parse(clean);
        if (Array.isArray(arr)) {
          arr.forEach(obj => {
            if (obj && (obj.note !== undefined || obj.text !== undefined)) {
              result.push({
                date: obj.date || nowString(),
                note: String(obj.note || obj.text || ''),
                done: !!obj.done
              });
            }
          });
          return result;
        }
      } catch (e) { /* on retombe sur le format JSONL */ }
    }

    clean.split(/\r?\n/).forEach(line => {
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
          result.push({
            date: obj.date || nowString(),
            note: String(obj.note || obj.text || ''),
            done: isDone || obj.done === true
          });
        }
      } catch (e) {
        result.push({
          date: nowString(),
          note: isDone ? jsonStr : trimmed,
          done: isDone
        });
      }
    });

    return result.filter(n => n.note.trim() !== '');
  }

  function parseJsonl(text, shouldSave = true) {
    notes = parseNotes(text);
    render(shouldSave);
  }

  // ---------- Recherche & filtre par tag ----------
  const fold = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  function noteTags(text) {
    const out = [];
    const re = /\[([^\]]+)\]/g;
    let m;
    while ((m = re.exec(text))) out.push(m[1].trim());
    return out;
  }

  function matchesSearch(n) {
    return !searchQuery || fold(n.note).includes(fold(searchQuery));
  }

  function matches(n) {
    if (tagFilters.size && !noteTags(n.note).some(t => tagFilters.has(t.toLowerCase()))) return false;
    return matchesSearch(n);
  }

  // Tags existants dans chaque section (clé -> libellé).
  function tagsByTab() {
    const exist = { active: new Map(), done: new Map() };
    notes.forEach(n => noteTags(n.note).forEach(t => {
      const k = t.toLowerCase();
      const m = exist[n.done ? 'done' : 'active'];
      if (k && !m.has(k)) m.set(k, t);
    }));
    return exist;
  }

  // Un tag coché qui n'existe plus dans aucune note (ni en cours, ni traitée) est décoché.
  function pruneTagFilters() {
    const exist = tagsByTab();
    [...tagFilters].forEach(k => {
      if (!exist.active.has(k) && !exist.done.has(k)) tagFilters.delete(k);
    });
    return exist;
  }

  function renderTagBar() {
    const exist = pruneTagFilters();
    const isDone = currentTab === 'done';
    const sel = tagFilters;

    // Les nouvelles notes sont ajoutées en tête du tableau : plus l'indice de la
    // DERNIÈRE note portant le tag est petit, plus le tag est récent.
    const created = new Map();
    notes.forEach((n, i) => noteTags(n.note).forEach(t => created.set(t.toLowerCase(), i)));

    // Seuls les tags ayant au moins une note dans la section affichée (et
    // correspondant à la recherche) sont proposés, sans tenir compte des tags
    // cochés, pour pouvoir en cocher plusieurs.
    const counts = new Map();
    notes.filter(n => n.done === isDone && matchesSearch(n)).forEach(n => {
      const seen = new Set();
      noteTags(n.note).forEach(t => {
        const k = t.toLowerCase();
        if (!k || seen.has(k)) return;
        seen.add(k);
        const e = counts.get(k);
        if (e) e.count++; else counts.set(k, { label: t, count: 1 });
      });
    });
    // Un tag coché reste affiché dans les deux sections (à 0 s'il n'a pas de note
    // dans celle-ci) : on voit le filtre actif et on peut le décocher.
    sel.forEach(k => {
      if (!counts.has(k)) counts.set(k, { label: exist.active.get(k) || exist.done.get(k), count: 0 });
    });

    if (counts.size === 0) {
      tagBar.hidden = true;
      tagChips.innerHTML = '';
      tagsExpanded = false;
      return;
    }

    // Les tags les plus récents d'abord ; cocher un tag ne le déplace jamais.
    const sorted = [...counts.entries()].sort((a, b) =>
      (created.get(a[0]) - created.get(b[0])) || a[1].label.localeCompare(b[1].label));

    tagBar.hidden = false;
    tagChips.innerHTML = sorted.map(([k, e]) =>
      `<button type="button" class="tag-chip${sel.has(k) ? ' active' : ''}" aria-pressed="${sel.has(k)}" style="--h:${tagHue(k)}" data-tag="${escapeHtml(k)}" title="${sel.has(k) ? 'Retirer' : 'Ajouter'} le filtre ${escapeHtml(e.label)}">${escapeHtml(e.label)}<span class="chip-count">${e.count}</span></button>`
    ).join('');

    // Repliée : une seule ligne ; le bouton « +N » indique les tags masqués.
    tagChips.classList.toggle('expanded', tagsExpanded);
    tagBar.classList.toggle('open', tagsExpanded);
    // Le bouton « Effacer » garde toujours sa place (visibilité seulement) :
    // la largeur de la ligne ne change donc pas quand on coche un tag.
    tagClear.style.visibility = sel.size ? 'visible' : 'hidden';
    tagClear.title = sel.size > 1
      ? `Effacer les ${sel.size} filtres`
      : 'Effacer le filtre';

    let hidden = 0;
    if (!tagsExpanded) {
      // On mesure avec le bouton « +N » déjà en place (il réduit la largeur disponible).
      tagToggle.hidden = false;
      tagToggle.textContent = '+0';
      const chips = [...tagChips.children];
      const top = chips[0].offsetTop;
      hidden = chips.filter(c => c.offsetTop > top + 2).length;
    }
    tagToggle.hidden = !(tagsExpanded || hidden > 0);
    tagToggle.textContent = tagsExpanded ? 'Réduire' : `+${hidden}`;
    tagToggle.title = tagsExpanded ? 'Réduire la liste des tags' : 'Afficher tous les tags';
  }

  tagClear.addEventListener('click', () => {
    tagFilters.clear();
    skipAnim = true;
    render(false);
    skipAnim = false;
  });

  tagToggle.addEventListener('click', () => {
    tagsExpanded = !tagsExpanded;
    renderTagBar();
  });

  function toggleTagFilter(key) {
    if (tagFilters.has(key)) tagFilters.delete(key); else tagFilters.add(key);
    skipAnim = true;
    render(false);
    skipAnim = false;
  }

  tagBar.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-tag]');
    if (chip) toggleTagFilter(chip.getAttribute('data-tag'));
  });

  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.trim();
    editingIndex = null;
    skipAnim = true;
    render(false);
    skipAnim = false;
  });
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchInput.value) {
      e.preventDefault();
      searchInput.value = '';
      searchQuery = '';
      skipAnim = true;
      render(false);
      skipAnim = false;
    }
  });

  function clearFilters() {
    searchQuery = '';
    tagFilters.clear();
    searchInput.value = '';
  }

  // ---------- Annuler ----------
  const snapshot = () => notes.map(n => ({ ...n }));

  function hideUndo() {
    clearTimeout(undoTimer);
    undoBar.hidden = true;
    document.body.classList.remove('has-undo');
    undoSnapshot = null;
  }

  function showUndo(text, snap) {
    undoSnapshot = snap;
    undoText.textContent = text;
    undoBar.hidden = false;
    document.body.classList.add('has-undo');
    clearTimeout(undoTimer);
    undoTimer = setTimeout(hideUndo, 7000);
  }

  undoBtn.addEventListener('click', () => {
    if (!undoSnapshot) return;
    notes = undoSnapshot;
    hideUndo();
    editingIndex = null;
    render(true);
    exportCount.textContent = notes.length ? `(${notes.length})` : '';
    showStatus('Action annulée');
  });

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

  function emptyState(kind, filtered = false) {
    const isActive = kind === 'active';
    if (filtered) {
      return `
      <div class="empty">
        ${icons.inbox}
        <strong>Aucun résultat</strong>
        <span>Essayez un autre mot-clé ou retirez le filtre.</span>
      </div>`;
    }
    return `
      <div class="empty">
        ${isActive ? icons.inbox : icons.done}
        <strong>${isActive ? 'Aucune note en cours' : 'Rien de traité pour le moment'}</strong>
        <span>${isActive ? 'Ajoutez votre première note ci-dessus.' : 'Les notes terminées apparaîtront ici.'}</span>
      </div>`;
  }

  function render(shouldSave = true) {
    pruneTagFilters();
    listActive.innerHTML = '';
    listDone.innerHTML = '';

    let activeCount = 0;
    let doneCount = 0;

    notes.forEach((item, index) => {
      if (!matches(item) && editingIndex !== index) return;
      const div = document.createElement('div');
      div.className = 'note-item' + (item.done ? ' is-done' : '') + (skipAnim ? ' no-anim' : '');
      div.dataset.index = index;

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
          (m, tag) => `<span class="note-tag" data-tag="${tag.trim().toLowerCase()}" title="Filtrer par ce tag" style="--h:${tagHue(tag)}">${tag}</span>`);

        div.innerHTML = `
          <button class="drag-handle" title="Glisser pour réorganiser (ou ↑ ↓ au clavier)" aria-label="Déplacer la note" data-index="${index}">${icons.grip}</button>
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

    const filtering = !!(tagFilters.size || searchQuery);
    if (activeCount === 0) listActive.innerHTML = emptyState('active', filtering && notes.length > 0);
    if (doneCount === 0) listDone.innerHTML = emptyState('done', filtering && notes.length > 0);

    countActive.textContent = activeCount;
    countDone.textContent = doneCount;

    const totalActive = notes.filter(n => !n.done).length;
    if (notes.length === 0) {
      summary.textContent = 'Aucune note';
    } else if (filtering) {
      const found = activeCount + doneCount;
      summary.textContent = `${found} résultat${found > 1 ? 's' : ''} sur ${notes.length}`;
    } else {
      summary.textContent = `${notes.length} note${notes.length > 1 ? 's' : ''} · ${totalActive} en cours`;
    }

    renderTagBar();

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
    const tagEl = e.target.closest('.note-item .note-tag[data-tag]');
    if (tagEl) {
      toggleTagFilter(tagEl.getAttribute('data-tag'));
      return;
    }

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
      const snap = snapshot();
      notes.splice(index, 1);
      render(true);
      showUndo('Note supprimée', snap);
    }
  });


  // ---------- Réorganisation des notes ----------
  // On réordonne uniquement les notes du même état (en cours / traitées) :
  // elles reprennent les "emplacements" qu'elles occupaient dans le tableau,
  // l'autre liste n'est pas touchée.
  function applyOrder(done, newIndexOrder) {
    // Les notes visibles reprennent, dans le nouvel ordre, les emplacements
    // qu'elles occupaient (les notes masquées par un filtre ne bougent pas).
    const slots = newIndexOrder.slice().sort((a, b) => a - b);
    const old = notes.slice();
    newIndexOrder.forEach((oldIdx, k) => { notes[slots[k]] = old[oldIdx]; });
  }

  function moveNote(index, dir) {
    const done = notes[index].done;
    let j = index + dir;
    while (j >= 0 && j < notes.length && (notes[j].done !== done || !matches(notes[j]))) j += dir;
    if (j < 0 || j >= notes.length) return;
    [notes[index], notes[j]] = [notes[j], notes[index]];
    editingIndex = null;
    skipAnim = true;
    render(true);
    skipAnim = false;
    const handle = document.querySelector(`.drag-handle[data-index="${j}"]`);
    if (handle) handle.focus();
  }

  const contentEl = document.querySelector('.content');

  // Le glisser n'est autorisé que depuis la poignée (le reste de la note
  // reste cliquable / sélectionnable pour l'édition).
  document.addEventListener('mousedown', (e) => {
    const handle = e.target.closest('.drag-handle');
    if (handle) handle.closest('.note-item').draggable = true;
  });
  document.addEventListener('mouseup', () => {
    document.querySelectorAll('.note-item[draggable="true"]').forEach(el => { el.draggable = false; });
  });

  document.addEventListener('keydown', (e) => {
    const handle = e.target.closest && e.target.closest('.drag-handle');
    if (!handle) return;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      moveNote(parseInt(handle.dataset.index, 10), e.key === 'ArrowUp' ? -1 : 1);
    }
  });

  document.addEventListener('dragstart', (e) => {
    const item = e.target.closest && e.target.closest('.note-item');
    if (!item || !item.draggable) return;
    dragged = item;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.dataset.index);
    e.dataTransfer.setDragImage(item, 20, 20);
    requestAnimationFrame(() => item.classList.add('dragging'));
  });

  contentEl.addEventListener('dragover', (e) => {
    if (!dragged) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const list = dragged.parentElement;

    // Défilement automatique près des bords
    const r = contentEl.getBoundingClientRect();
    if (e.clientY < r.top + 36) contentEl.scrollTop -= 10;
    else if (e.clientY > r.bottom - 36) contentEl.scrollTop += 10;

    // Trouver la note devant laquelle insérer
    const siblings = [...list.querySelectorAll('.note-item:not(.dragging)')];
    let before = null;
    for (const el of siblings) {
      const b = el.getBoundingClientRect();
      if (e.clientY < b.top + b.height / 2) { before = el; break; }
    }
    if (before) {
      if (dragged.nextElementSibling !== before) list.insertBefore(dragged, before);
    } else if (list.lastElementChild !== dragged) {
      list.appendChild(dragged);
    }
  });

  contentEl.addEventListener('drop', (e) => {
    if (dragged) e.preventDefault();
  });

  document.addEventListener('dragend', (e) => {
    if (!dragged) return;
    const item = dragged;
    dragged = null;
    item.draggable = false;
    item.classList.remove('dragging');

    const cancelled = e.dataTransfer && e.dataTransfer.dropEffect === 'none';
    const list = item.parentElement;
    const order = [...list.querySelectorAll('.note-item[data-index]')]
      .map(el => parseInt(el.dataset.index, 10));
    const changed = order.some((v, k) => k > 0 && v < order[k - 1]);

    skipAnim = true;
    if (cancelled || !changed) {
      render(false);
    } else {
      const done = notes[order[0]].done;
      applyOrder(done, order);
      editingIndex = null;
      render(true);
    }
    skipAnim = false;
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
    clearFilters();
    render(true);
  }

  btnAdd.addEventListener('click', addNote);
  inputNew.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addNote();
  });

  // ---------- Paramètres : navigation ----------
  function showSettings(show) {
    viewMain.hidden = show;
    viewSettings.hidden = !show;
    btnSettings.hidden = show;
    if (show) {
      exportCount.textContent = notes.length ? `(${notes.length})` : '';
      resetImport();
    } else {
      render(false);
    }
  }

  btnSettings.addEventListener('click', () => showSettings(true));
  btnSettingsBack.addEventListener('click', () => showSettings(false));

  appVersion.textContent = 'fnote v' + chrome.runtime.getManifest().version;

  // Si le sélecteur de fichier ferme la fenêtre de l'extension, on peut
  // faire l'import depuis un onglet complet.
  const isTab = new URLSearchParams(location.search).has('tab');
  if (isTab) {
    document.body.classList.add('in-tab');
    btnOpenTab.hidden = true;
    showSettings(true);
  }
  btnOpenTab.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('popup.html?tab=1') });
  });

  // ---------- Export ----------
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
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showStatus('Exportation réussie !');
  });

  // ---------- Import ----------
  const noteKey = (n) => n.date + '\u0000' + n.note;

  function resetImport() {
    pendingImport = null;
    importFile.value = '';
    importPreview.hidden = true;
    dropzone.hidden = false;
  }

  function handleFile(file) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showStatus('Fichier trop volumineux (max 10 Mo)', true);
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => showStatus('Lecture du fichier impossible', true);
    reader.onload = () => {
      const imported = parseNotes(String(reader.result));
      if (imported.length === 0) {
        showStatus('Aucune note valide dans ce fichier', true);
        resetImport();
        return;
      }

      const existing = new Set(notes.map(noteKey));
      const fresh = [];
      imported.forEach(n => {
        const k = noteKey(n);
        if (!existing.has(k)) { existing.add(k); fresh.push(n); }
      });

      pendingImport = { imported, fresh };
      const doneCount = imported.filter(n => n.done).length;
      importSummary.innerHTML =
        `<strong>${escapeHtml(file.name)}</strong><br>` +
        `${imported.length} note${imported.length > 1 ? 's' : ''} trouvée${imported.length > 1 ? 's' : ''} ` +
        `(${imported.length - doneCount} en cours, ${doneCount} traitée${doneCount > 1 ? 's' : ''})<br>` +
        `<span class="muted">${fresh.length} nouvelle${fresh.length > 1 ? 's' : ''}, ` +
        `${imported.length - fresh.length} déjà présente${imported.length - fresh.length > 1 ? 's' : ''}</span>`;
      btnImportMerge.textContent = `Fusionner (+${fresh.length})`;
      btnImportMerge.disabled = fresh.length === 0;
      btnImportReplace.textContent = `Remplacer tout (${notes.length} → ${imported.length})`;
      dropzone.hidden = true;
      importPreview.hidden = false;
    };
    reader.readAsText(file, 'utf-8');
  }

  // Dans la popup, le sélecteur de fichier lui fait perdre le focus et la
  // ferme avant la fin de l'import : on ouvre donc un onglet dédié, où
  // l'import fonctionne normalement.
  function openPicker() {
    if (!isTab) {
      chrome.tabs.create({ url: chrome.runtime.getURL('popup.html?tab=1&import=1') });
      window.close();
      return;
    }
    importFile.click();
  }

  if (!isTab) {
    const label = dropzone.querySelector('span');
    if (label) label.innerHTML = '<strong>Choisir un fichier</strong> (s\'ouvre dans un onglet)';
  }

  dropzone.addEventListener('click', openPicker);
  dropzone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPicker(); }
  });
  importFile.addEventListener('change', () => handleFile(importFile.files[0]));

  if (isTab) ['dragenter', 'dragover'].forEach(ev => dropzone.addEventListener(ev, (e) => {
    e.preventDefault();
    dropzone.classList.add('over');
  }));
  if (isTab) ['dragleave', 'drop'].forEach(ev => dropzone.addEventListener(ev, (e) => {
    e.preventDefault();
    dropzone.classList.remove('over');
  }));
  if (isTab) dropzone.addEventListener('drop', (e) => handleFile(e.dataTransfer.files[0]));

  btnImportMerge.addEventListener('click', () => {
    if (!pendingImport) return;
    const added = pendingImport.fresh.length;
    const snap = snapshot();
    notes = notes.concat(pendingImport.fresh);
    editingIndex = null;
    saveToStorage();
    exportCount.textContent = `(${notes.length})`;
    resetImport();
    showUndo(`${added} note${added > 1 ? 's' : ''} importée${added > 1 ? 's' : ''}`, snap);
  });

  btnImportReplace.addEventListener('click', () => {
    if (!pendingImport) return;
    const total = pendingImport.imported.length;
    const snap = snapshot();
    notes = pendingImport.imported.slice();
    editingIndex = null;
    saveToStorage();
    exportCount.textContent = `(${notes.length})`;
    resetImport();
    showUndo(`Données remplacées (${total} note${total > 1 ? 's' : ''})`, snap);
  });

  btnImportCancel.addEventListener('click', resetImport);

  // Arrivée depuis la popup : on tente d'ouvrir directement le sélecteur.
  // Chrome peut le refuser sans clic dans l'onglet ; la zone est alors
  // mise en évidence pour que l'utilisateur sache où cliquer.
  if (isTab && new URLSearchParams(location.search).has('import')) {
    dropzone.classList.add('over');
    try { importFile.click(); } catch (e) { /* bloqué : clic manuel */ }
    importFile.addEventListener('change', () => dropzone.classList.remove('over'), { once: true });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>'"]/g,
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }
});
