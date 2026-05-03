console.log('Smart Notes Popup Script Loaded');

document.addEventListener('DOMContentLoaded', () => {
  const noteInput = document.getElementById('note-input');
  const saveBtn = document.getElementById('save-btn');
  const notesList = document.getElementById('notes-list');
  const searchInput = document.getElementById('search-input');
  const themeToggle = document.getElementById('theme-toggle');
  const sunIcon = document.getElementById('sun-icon');
  const moonIcon = document.getElementById('moon-icon');
  const exportBtn = document.getElementById('export-btn');

  let notes = [];

  // 1. Environment Check
  if (typeof chrome === 'undefined' || !chrome.storage) {
    console.error("Not running in a Chrome Extension environment.");
    document.body.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: sans-serif;">
        <h2 style="color: #ef4444;">Error</h2>
        <p>This is a Chrome Extension. You must load it via <b>chrome://extensions</b> to use it.</p>
        <p>It will not work if opened directly in a tab.</p>
      </div>
    `;
    return;
  }

  // 2. Load initial data
  chrome.storage.local.get(['notes', 'darkMode'], (result) => {
    console.log('Initial data loaded:', result);
    if (result.notes) {
      notes = result.notes;
      renderNotes();
    }
    if (result.darkMode) {
      document.body.classList.add('dark-mode');
      sunIcon.classList.add('hidden');
      moonIcon.classList.remove('hidden');
    }
  });

  // 3. Theme Toggle Logic
  themeToggle.addEventListener('click', () => {
    const isDarkMode = document.body.classList.toggle('dark-mode');
    sunIcon.classList.toggle('hidden');
    moonIcon.classList.toggle('hidden');
    chrome.storage.local.set({ darkMode: isDarkMode });
  });

  // 4. Save Note Logic
  saveBtn.addEventListener('click', () => {
    const text = noteInput.value.trim();
    if (text) {
      const newNote = {
        id: Date.now(),
        text: text,
        timestamp: new Date().toLocaleString()
      };
      notes.unshift(newNote);
      saveNotes();
      noteInput.value = '';
      renderNotes();
    }
  });

  // 5. Search Logic
  searchInput.addEventListener('input', () => {
    renderNotes(searchInput.value.toLowerCase());
  });

  // 6. Export Logic
  exportBtn.addEventListener('click', () => {
    if (notes.length === 0) return;
    
    const content = notes.map(n => `[${n.timestamp}]\n${n.text}\n${'-'.repeat(20)}`).join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'smart-notes-export.txt';
    a.click();
    URL.revokeObjectURL(url);
  });

  function saveNotes() {
    chrome.storage.local.set({ notes: notes }, () => {
      console.log('Notes saved to storage');
    });
  }

  function deleteNote(id) {
    notes = notes.filter(note => note.id !== id);
    saveNotes();
    renderNotes(searchInput.value.toLowerCase());
  }

  function renderNotes(filter = '') {
    notesList.innerHTML = '';
    const filteredNotes = notes.filter(n => n.text.toLowerCase().includes(filter));

    if (filteredNotes.length === 0) {
      notesList.innerHTML = `
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.2; margin-bottom: 12px;"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>
          <p>${filter ? 'No matching notes found.' : 'No notes yet. Add your first note!'}</p>
        </div>
      `;
      return;
    }

    filteredNotes.forEach(note => {
      const noteCard = document.createElement('div');
      noteCard.className = 'note-card';
      
      noteCard.innerHTML = `
        <div class="note-text">${escapeHtml(note.text)}</div>
        <div class="note-footer">
          <span class="note-time">${note.timestamp}</span>
          <button class="delete-btn" data-id="${note.id}" title="Delete Note">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </div>
      `;

      noteCard.querySelector('.delete-btn').addEventListener('click', () => {
        deleteNote(note.id);
      });

      notesList.appendChild(noteCard);
    });
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
});
