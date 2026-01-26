
// v4.9 - Added Hierarchical Headers & Cell Merging (Ctrl + Selection)
import { fetchAppData, getAppDataFromStorage, saveAppDataToStorage, saveAppData, authenticate, updatePassword, fetchNoImage } from './data.js';
import { renderGallery, renderClassList, renderSchedule, icons, setNoImageBase64 } from './ui.js';

// --- Global State ---
let appData = null;
let sessionAuthToken = null;
let isDirty = false;
let isSyncing = false;

// --- Section States ---
let classListEditMode = false;
let scheduleEditMode = false;

// --- Drag & Drop State ---
let draggedRowElement = null;
let draggedRowIndex = null;

// --- Merging State ---
let isSelectingCells = false;
let selectionStart = null; // {r, c}
let selectionEnd = null;   // {r, c}

// --- UI State ---
let isSelectionMode = false;
let selectedMediaIds = new Set();
let openAccordionId = 'gallery-section';

// --- DOM Element Cache ---
const dom = {
    authContainer: null,
    editContainer: null,
    modalContainer: null,
};

// --- RENDER FUNCTIONS --- //

function renderAuthForm() {
    dom.authContainer.innerHTML = `
        <div class="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
            <div class="max-w-md w-full bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 space-y-6">
                <div class="text-center">
                    <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white">Trang Chỉnh sửa (v4.0)</h2>
                    <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Vui lòng nhập mật khẩu để tiếp tục.</p>
                </div>
                <form id="auth-form" class="space-y-6">
                    <div>
                        <input id="password" name="password" type="password" required class="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Mật khẩu">
                    </div>
                    <p id="auth-error" class="text-red-500 text-sm text-center min-h-[20px]"></p>
                    <button type="submit" class="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">Đăng nhập</button>
                </form>
            </div>
        </div>
    `;
    document.getElementById('auth-form').addEventListener('submit', handleLogin);
}

function renderEditPage() {
    if (!appData) return;
    const sections = [
        { id: 'gallery-section', title: 'Quản lý Thư viện', icon: icons.gallery },
        { id: 'classlist-section', title: 'Quản lý Danh sách Lớp', icon: icons.users },
        { id: 'schedule-section', title: 'Quản lý Thời khóa biểu', icon: icons.calendar }
    ];
    const accordionHTML = sections.map(section => `
        <div class="accordion-item bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-800">
            <h2 id="${section.id}-header">
                <button type="button" data-action="toggle-accordion" data-accordion-id="${section.id}" class="accordion-header flex items-center justify-between w-full p-5 font-medium text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none">
                    <span class="flex items-center gap-3 text-xl font-bold">${section.icon} ${section.title}</span>
                    <span class="accordion-icon">${icons.chevronDown}</span>
                </button>
            </h2>
            <div id="${section.id}-content" class="accordion-content">
                <div class="p-6 space-y-4"></div>
            </div>
        </div>`).join('');

    dom.editContainer.innerHTML = `
        <div class="min-h-screen bg-gray-50 dark:bg-gray-800 p-4 sm:p-6 lg:p-8">
            <div class="max-w-7xl mx-auto">
                <header class="flex flex-wrap justify-between items-center gap-4 mb-8 pb-4 border-b-2 border-indigo-500">
                    <div>
                        <h1 class="text-4xl font-bold text-indigo-600 dark:text-indigo-400">Quản trị Lớp 8/4</h1>
                    </div>
                    <div class="flex items-center gap-2">
                        <button data-action="change-password" class="px-4 py-2 bg-yellow-500 text-white rounded-lg shadow-md hover:bg-yellow-600">${icons.key}<span>Đổi MK</span></button>
                        <a href="../view/" class="px-4 py-2 bg-gray-600 text-white rounded-lg shadow-md">${icons.gallery}<span>Xem trang</span></a>
                    </div>
                </header>
                <main id="edit-main" class="space-y-8">
                    <section id="sync-section">
                        <div id="sync-wrapper" class="flex items-center gap-4 p-4 rounded-lg border-l-4 shadow-sm">
                            <div id="sync-icon"></div>
                            <div class="flex-grow">
                                <p id="sync-title" class="font-bold"></p>
                                <p id="sync-message" class="text-sm"></p>
                            </div>
                            <button id="sync-btn" data-action="sync" class="px-6 py-2 bg-indigo-500 text-white font-bold rounded-lg"></button>
                        </div>
                    </section>
                    <div class="grid gap-6">${accordionHTML}</div>
                </main>
            </div>
        </div>`;
    renderAllSections();
    if (openAccordionId) toggleAccordion(openAccordionId, true);
    updateSyncState({ status: 'synced' });
}

function renderAllSections() {
    renderGallerySection();
    renderClassListSection();
    renderScheduleSection();
}

function renderGallerySection() {
    const contentWrapper = document.querySelector('#gallery-section-content > div');
    if (!contentWrapper) return;
    contentWrapper.innerHTML = `
        <div id="gallery-alerts"></div>
        <div id="gallery-actions" class="flex flex-wrap items-center gap-4 mb-6"></div>
        <div id="upload-progress-container" class="hidden"></div>
        <div id="gallery-container"></div>`;
    const actionsContainer = document.getElementById('gallery-actions');
    const container = document.getElementById('gallery-container');
    actionsContainer.innerHTML = `
        <label class="px-4 py-2 bg-teal-500 text-white font-semibold rounded-lg cursor-pointer">${icons.plus}<span>Tải lên</span><input type="file" multiple class="hidden" data-action="upload-media"></label>
        <button data-action="add-media-url" class="px-4 py-2 bg-gray-200 dark:bg-gray-700">${icons.plus}<span>Thêm URL</span></button>
        <button data-action="toggle-select-mode" class="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg">${icons.checkbox}<span>Chọn mục</span></button>
    `;
    container.innerHTML = renderGallery(appData.media, { isEditing: true, isSelectionMode, selectedIds: selectedMediaIds });
}

function renderClassListSection() {
    const contentWrapper = document.querySelector('#classlist-section-content > div');
    if (!contentWrapper) return;
    contentWrapper.innerHTML = renderClassList(appData.students, appData.studentColumns, { 
        isEditing: true, 
        directEditMode: classListEditMode,
        merges: appData.merges || []
    });
}

function renderScheduleSection() {
    const contentWrapper = document.querySelector('#schedule-section-content > div');
    if (!contentWrapper) return;
    contentWrapper.innerHTML = renderSchedule(appData.schedule, { isEditing: true, directEditMode: scheduleEditMode });
}

// --- LOGIC GỘP Ô --- //

function handleTableMouseDown(e) {
    if (!e.ctrlKey || !classListEditMode) return;
    const cell = e.target.closest('.table-cell-interactive');
    if (!cell) return;

    isSelectingCells = true;
    selectionStart = { r: parseInt(cell.dataset.row), c: parseInt(cell.dataset.col) };
    selectionEnd = { ...selectionStart };
    updateSelectionHighlight();
}

function handleTableMouseEnter(e) {
    if (!isSelectingCells) return;
    const cell = e.target.closest('.table-cell-interactive');
    if (!cell) return;

    selectionEnd = { r: parseInt(cell.dataset.row), c: parseInt(cell.dataset.col) };
    updateSelectionHighlight();
}

function updateSelectionHighlight() {
    document.querySelectorAll('.table-cell-interactive').forEach(el => {
        const r = parseInt(el.dataset.row);
        const c = parseInt(el.dataset.col);
        const minR = Math.min(selectionStart.r, selectionEnd.r);
        const maxR = Math.max(selectionStart.r, selectionEnd.r);
        const minC = Math.min(selectionStart.c, selectionEnd.c);
        const maxC = Math.max(selectionStart.c, selectionEnd.c);

        if (r >= minR && r <= maxR && c >= minC && c <= maxC) {
            el.classList.add('bg-indigo-200', 'dark:bg-indigo-900/40');
        } else {
            el.classList.remove('bg-indigo-200', 'dark:bg-indigo-900/40');
        }
    });
}

function finishCellMerging() {
    if (!isSelectingCells) return;
    isSelectingCells = false;

    if (selectionStart.r === selectionEnd.r && selectionStart.c === selectionEnd.c) {
        // Nếu chỉ chọn 1 ô, kiểm tra xem ô đó có đang bị gộp không để bỏ gộp
        const currentMergeIndex = appData.merges.findIndex(m => 
            selectionStart.r >= m.sR && selectionStart.r <= m.eR &&
            selectionStart.c >= m.sC && selectionStart.c <= m.eC
        );
        if (currentMergeIndex !== -1) {
            appData.merges.splice(currentMergeIndex, 1);
            markAsDirty();
            renderClassListSection();
        }
        return;
    }

    const minR = Math.min(selectionStart.r, selectionEnd.r);
    const maxR = Math.max(selectionStart.r, selectionEnd.r);
    const minC = Math.min(selectionStart.c, selectionEnd.c);
    const maxC = Math.max(selectionStart.c, selectionEnd.c);

    // Xóa các vùng gộp cũ bị chồng lấn
    appData.merges = appData.merges.filter(m => {
        return !(m.sR <= maxR && m.eR >= minR && m.sC <= maxC && m.eC >= minC);
    });

    appData.merges.push({ sR: minR, sC: minC, eR: maxR, eC: maxC });
    markAsDirty();
    renderClassListSection();
}

// --- LOGIC PHÂN TẦNG TIÊU ĐỀ --- //

function handleHeaderContextMenu(e) {
    if (!classListEditMode) return;
    const header = e.target.closest('.header-cell');
    if (!header) return;
    e.preventDefault();

    const colIndex = parseInt(header.dataset.columnIndex);
    const currentParent = appData.studentColumns[colIndex].parent || '';
    
    const newParent = prompt("Nhập tên nhóm tiêu đề (để trống để bỏ phân tầng):", currentParent);
    if (newParent !== null) {
        appData.studentColumns[colIndex].parent = newParent.trim();
        markAsDirty();
        renderClassListSection();
    }
}

// --- ĐIỀU KHIỂN ĐỒNG BỘ --- //

function markAsDirty() {
    isDirty = true;
    updateSyncState({ status: 'dirty' });
}

function updateSyncState({ status, message = '' }) {
    const wrapper = document.getElementById('sync-wrapper');
    if (!wrapper) return;
    const iconEl = document.getElementById('sync-icon');
    const titleEl = document.getElementById('sync-title');
    const messageEl = document.getElementById('sync-message');
    const button = document.getElementById('sync-btn');
    
    wrapper.className = 'flex items-center gap-4 p-4 rounded-lg border-l-4 shadow-sm';
    if (status === 'dirty') {
        wrapper.classList.add('bg-yellow-50', 'border-yellow-400');
        iconEl.innerHTML = icons.warning;
        titleEl.textContent = 'Có thay đổi chưa lưu';
        button.disabled = false; button.innerHTML = `<span>Lưu dữ liệu</span>`;
    } else if (status === 'synced') {
        wrapper.classList.add('bg-green-50', 'border-green-400');
        iconEl.innerHTML = icons.check;
        titleEl.textContent = 'Dữ liệu đã an toàn';
        button.disabled = true; button.innerHTML = `<span>Đã lưu</span>`;
        isDirty = false;
    }
}

async function handleSync() {
    if (isSyncing) return;
    isSyncing = true;
    updateSyncState({ status: 'syncing', message: 'Đang lưu...' });
    const result = await saveAppData(appData, sessionAuthToken);
    if (result.success) {
        saveAppDataToStorage(appData);
        updateSyncState({ status: 'synced' });
    }
    isSyncing = false;
}

// --- KHỞI TẠO & SỰ KIỆN --- //

async function handleLogin(e) {
    e.preventDefault();
    const result = await authenticate(e.target.password.value);
    if (result.success) {
        sessionAuthToken = result.token;
        appData = await fetchAppData();
        if (!appData.merges) appData.merges = [];
        dom.authContainer.classList.add('hidden');
        dom.editContainer.classList.remove('hidden');
        renderEditPage();
    }
}

function setupEventListeners() {
    window.addEventListener('keyup', e => {
        if (e.key === 'Control' && isSelectingCells) finishCellMerging();
    });

    dom.editContainer.addEventListener('contextmenu', e => {
        if (e.target.closest('.header-cell')) handleHeaderContextMenu(e);
    });

    dom.editContainer.addEventListener('mousedown', e => {
        if (e.ctrlKey) handleTableMouseDown(e);
    });

    dom.editContainer.addEventListener('mouseenter', e => {
        handleTableMouseEnter(e);
    }, true);

    dom.editContainer.addEventListener('mouseup', () => {
        // Nếu nhả chuột mà không giữ Ctrl nữa thì cũng kết thúc vùng chọn
        if (isSelectingCells) finishCellMerging();
    });

    dom.editContainer.addEventListener('click', e => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.dataset.action;
        
        if (action === 'sync') handleSync();
        else if (action === 'toggle-accordion') toggleAccordion(btn.dataset.accordionId);
        else if (action === 'toggle-section-edit') {
            const section = btn.dataset.section;
            if (section === 'classlist') { classListEditMode = btn.checked; renderClassListSection(); }
            else if (section === 'schedule') { scheduleEditMode = btn.checked; renderScheduleSection(); }
        }
        else if (action === 'add-row-end') {
            const newRow = { id: crypto.randomUUID(), name: '' };
            appData.studentColumns.forEach(c => newRow[c.key] = '');
            appData.students.push(newRow);
            markAsDirty(); renderClassListSection();
        }
        else if (action === 'remove-row') {
            appData.students.splice(parseInt(btn.dataset.rowIndex), 1);
            markAsDirty(); renderClassListSection();
        }
    });

    dom.editContainer.addEventListener('input', e => {
        const action = e.target.dataset.action;
        if (action === 'update-cell') {
            appData.students[e.target.dataset.rowIndex][e.target.dataset.columnKey] = e.target.value;
            markAsDirty();
        } else if (action === 'update-column-label') {
            appData.studentColumns[e.target.dataset.columnIndex].label = e.target.value;
            markAsDirty();
        }
    });
}

function toggleAccordion(id, force = false) {
    const content = document.getElementById(`${id}-content`);
    const header = document.querySelector(`[data-accordion-id="${id}"]`);
    if (force || !header.classList.contains('open')) {
        header.classList.add('open');
        content.classList.add('open');
    } else {
        header.classList.remove('open');
        content.classList.remove('open');
    }
}

async function init() {
    dom.authContainer = document.getElementById('auth-container');
    dom.editContainer = document.getElementById('edit-container');
    const noImg = await fetchNoImage();
    setNoImageBase64(noImg);
    setupEventListeners();
    renderAuthForm();
}

document.addEventListener('DOMContentLoaded', init);
