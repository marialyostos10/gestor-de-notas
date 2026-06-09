// Estado
let state = {
    folders: [],
    notes: {},
    currentFolderId: null,
    editingFolderId: null,
    editingNoteId: null
};

// Elementos del DOM
const foldersList = document.getElementById('foldersList');
const notesList = document.getElementById('notesList');
const addFolderBtn = document.getElementById('addFolderBtn');
const addNoteBtn = document.getElementById('addNoteBtn');
const themeToggle = document.getElementById('themeToggle');
const currentFolderName = document.getElementById('currentFolderName');
const noteCount = document.getElementById('noteCount');

// Modales
const folderModal = document.getElementById('folderModal');
const noteModal = document.getElementById('noteModal');
const folderNameInput = document.getElementById('folderNameInput');
const noteTitleInput = document.getElementById('noteTitleInput');
const noteContentInput = document.getElementById('noteContentInput');
const saveFolderBtn = document.getElementById('saveFolderBtn');
const saveNoteBtn = document.getElementById('saveNoteBtn');
const cancelFolderBtn = document.getElementById('cancelFolderBtn');
const cancelNoteBtn = document.getElementById('cancelNoteBtn');
const folderModalTitle = document.getElementById('folderModalTitle');
const noteModalTitle = document.getElementById('noteModalTitle');

// Cerrar modales
document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', closeAllModals);
});

cancelFolderBtn.addEventListener('click', closeAllModals);
cancelNoteBtn.addEventListener('click', closeAllModals);

// Cerrar modales al clickear fuera
document.getElementById('folderModal').addEventListener('click', (e) => {
    if (e.target === folderModal) closeAllModals();
});

document.getElementById('noteModal').addEventListener('click', (e) => {
    if (e.target === noteModal) closeAllModals();
});

// Event Listeners
addFolderBtn.addEventListener('click', openNewFolderModal);
addNoteBtn.addEventListener('click', openNewNoteModal);
saveFolderBtn.addEventListener('click', saveFolder);
saveNoteBtn.addEventListener('click', saveNote);
themeToggle.addEventListener('click', toggleTheme);

// Inicializar
init();

function init() {
    loadFromStorage();
    loadTheme();
    renderFolders();
    renderNotes();
}

// ==================== Gestión de Temas ====================
function toggleTheme() {
    document.documentElement.classList.toggle('dark-theme');
    const isDarkTheme = document.documentElement.classList.contains('dark-theme');
    localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
    updateThemeIcon();
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark-theme');
    }
    updateThemeIcon();
}

function updateThemeIcon() {
    const isDark = document.documentElement.classList.contains('dark-theme');
    themeToggle.textContent = isDark ? '☀️' : '🌙';
}

// ==================== Gestión de Carpetas ====================
function openNewFolderModal() {
    state.editingFolderId = null;
    folderModalTitle.textContent = 'Nueva Carpeta';
    folderNameInput.value = '';
    folderModal.classList.add('active');
    folderNameInput.focus();
}

function saveFolder() {
    const name = folderNameInput.value.trim();
    if (!name) {
        alert('Por favor ingresa un nombre para la carpeta');
        return;
    }

    if (state.editingFolderId) {
        // Editar carpeta
        const folder = state.folders.find(f => f.id === state.editingFolderId);
        if (folder) {
            folder.name = name;
        }
    } else {
        // Nueva carpeta
        const newFolder = {
            id: Date.now(),
            name: name,
            createdAt: new Date().toLocaleString('es-ES')
        };
        state.folders.push(newFolder);
        state.notes[newFolder.id] = [];
    }

    saveToStorage();
    renderFolders();
    closeAllModals();
}

function deleteFolder(folderId) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta carpeta? Se eliminarán todas las notas dentro.')) {
        return;
    }
    
    state.folders = state.folders.filter(f => f.id !== folderId);
    delete state.notes[folderId];
    
    if (state.currentFolderId === folderId) {
        state.currentFolderId = null;
    }
    
    saveToStorage();
    renderFolders();
    renderNotes();
}

function selectFolder(folderId) {
    state.currentFolderId = folderId;
    renderFolders();
    renderNotes();
}

function editFolder(folderId, event) {
    event.stopPropagation();
    const folder = state.folders.find(f => f.id === folderId);
    if (folder) {
        state.editingFolderId = folderId;
        folderModalTitle.textContent = 'Editar Carpeta';
        folderNameInput.value = folder.name;
        folderModal.classList.add('active');
        folderNameInput.focus();
    }
}

function renderFolders() {
    foldersList.innerHTML = '';

    if (state.folders.length === 0) {
        foldersList.innerHTML = '<p style="color: #999; font-size: 0.9rem;">No hay carpetas</p>';
        return;
    }

    state.folders.forEach(folder => {
        const folderItem = document.createElement('div');
        folderItem.className = `folder-item ${state.currentFolderId === folder.id ? 'active' : ''}`;
        
        folderItem.innerHTML = `
            <div class="folder-name" onclick="selectFolder(${folder.id})">
                <span>📁</span>
                <span>${escapeHtml(folder.name)}</span>
            </div>
            <div class="folder-actions">
                <button class="btn-icon" onclick="editFolder(${folder.id}, event)" title="Editar">✏️</button>
                <button class="btn-icon" onclick="deleteFolder(${folder.id})" title="Eliminar">🗑️</button>
            </div>
        `;
        
        foldersList.appendChild(folderItem);
    });
}

// ==================== Gestión de Notas ====================
function openNewNoteModal() {
    if (!state.currentFolderId) {
        alert('Por favor selecciona una carpeta primero');
        return;
    }

    state.editingNoteId = null;
    noteModalTitle.textContent = 'Nueva Nota';
    noteTitleInput.value = '';
    noteContentInput.value = '';
    noteModal.classList.add('active');
    noteTitleInput.focus();
}

function saveNote() {
    const title = noteTitleInput.value.trim();
    const content = noteContentInput.value.trim();

    if (!title || !content) {
        alert('Por favor completa el título y contenido de la nota');
        return;
    }

    if (!state.currentFolderId) {
        alert('Por favor selecciona una carpeta primero');
        return;
    }

    if (state.editingNoteId) {
        // Editar nota
        const notes = state.notes[state.currentFolderId];
        const note = notes.find(n => n.id === state.editingNoteId);
        if (note) {
            note.title = title;
            note.content = content;
            note.updatedAt = new Date().toLocaleString('es-ES');
        }
    } else {
        // Nueva nota
        const newNote = {
            id: Date.now(),
            title: title,
            content: content,
            createdAt: new Date().toLocaleString('es-ES'),
            updatedAt: new Date().toLocaleString('es-ES')
        };
        
        if (!state.notes[state.currentFolderId]) {
            state.notes[state.currentFolderId] = [];
        }
        state.notes[state.currentFolderId].push(newNote);
    }

    saveToStorage();
    renderNotes();
    closeAllModals();
}

function deleteNote(noteId) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta nota?')) {
        return;
    }

    const notes = state.notes[state.currentFolderId];
    state.notes[state.currentFolderId] = notes.filter(n => n.id !== noteId);
    saveToStorage();
    renderNotes();
}

function editNote(noteId) {
    const notes = state.notes[state.currentFolderId];
    const note = notes.find(n => n.id === noteId);
    
    if (note) {
        state.editingNoteId = noteId;
        noteModalTitle.textContent = 'Editar Nota';
        noteTitleInput.value = note.title;
        noteContentInput.value = note.content;
        noteModal.classList.add('active');
        noteTitleInput.focus();
    }
}

function renderNotes() {
    notesList.innerHTML = '';

    // Si no hay carpeta seleccionada
    if (!state.currentFolderId) {
        addNoteBtn.disabled = true;
        currentFolderName.textContent = 'Selecciona una carpeta';
        noteCount.textContent = '';
        notesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📁</div>
                <div class="empty-state-text">Por favor selecciona una carpeta para ver las notas</div>
            </div>
        `;
        return;
    }

    addNoteBtn.disabled = false;
    const folder = state.folders.find(f => f.id === state.currentFolderId);
    currentFolderName.textContent = folder ? folder.name : 'Carpeta desconocida';

    const notes = state.notes[state.currentFolderId] || [];
    const notesCount = notes.length;
    noteCount.textContent = `${notesCount} nota${notesCount !== 1 ? 's' : ''}`;

    if (notes.length === 0) {
        notesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <div class="empty-state-text">No hay notas en esta carpeta. ¡Crea una nueva!</div>
            </div>
        `;
        return;
    }

    notes.forEach(note => {
        const noteCard = document.createElement('div');
        noteCard.className = 'note-card';
        
        noteCard.innerHTML = `
            <div class="note-title">${escapeHtml(note.title)}</div>
            <div class="note-content">${escapeHtml(note.content)}</div>
            <div class="note-date">Última actualización: ${note.updatedAt}</div>
            <div class="note-actions">
                <button class="btn-edit" onclick="editNote(${note.id})" title="Editar">✏️</button>
                <button class="btn-delete" onclick="deleteNote(${note.id})" title="Eliminar">🗑️</button>
            </div>
        `;
        
        notesList.appendChild(noteCard);
    });
}

// ==================== Utilidades ====================
function closeAllModals() {
    folderModal.classList.remove('active');
    noteModal.classList.remove('active');
    state.editingFolderId = null;
    state.editingNoteId = null;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== Almacenamiento Local ====================
function saveToStorage() {
    const data = {
        folders: state.folders,
        notes: state.notes
    };
    localStorage.setItem('notesAppData', JSON.stringify(data));
}

function loadFromStorage() {
    const saved = localStorage.getItem('notesAppData');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            state.folders = data.folders || [];
            state.notes = data.notes || {};
            
            // Inicializar notes para cada carpeta
            state.folders.forEach(folder => {
                if (!state.notes[folder.id]) {
                    state.notes[folder.id] = [];
                }
            });
        } catch (error) {
            console.error('Error cargando datos:', error);
        }
    }
}

// Permitir presionar Enter en inputs
folderNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') saveFolder();
});

noteTitleInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') noteContentInput.focus();
});

// Prevenir que el modal se cierre al presionar Escape pero limpiar los estados
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeAllModals();
    }
});
