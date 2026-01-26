
// v4.12 - Fixed Media Resizing, Modal Edit, and Original Password Flow
import { fetchAppData, saveAppDataToStorage, saveAppData, authenticate, updatePassword, fetchNoImage } from './data.js';
import { renderGallery, renderClassList, renderSchedule, icons, setNoImageBase64, renderMediaEditModal } from './ui.js';

// --- Global State ---
let appData = null;
let sessionAuthToken = null;
let isDirty = false;
let isSyncing = false;

// --- Section States ---
let classListEditMode = false;
let scheduleEditMode = false;

// --- Merging State ---
let isSelectingCells = false;
let selectionStart = null; 
let selectionEnd = null;   

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

// --- RENDER FUNCTIONS ---

function renderAuthForm() {
    dom.authContainer.innerHTML = `
        <div class="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
            <div class="max-w-md w-full bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 space-y-6">
                <div class="text-center">
                    <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white">Trang Chỉnh sửa (v4.0)</h2>
                    <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Vui lòng nhập mật khẩu để tiếp tục quản lý dữ liệu.</p>
                </div>
                <form id="auth-form" class="space-y-6">
                    <div>
                        <input id="password" name="password" type="password" required class="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Mật khẩu truy cập">
                    </div>
                    <p id="auth-error" class="text-red-500 text-sm text-center min-h-[20px]"></p>
                    <button type="submit" class="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">Đăng nhập</button>
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
                    <span class="accordion-icon transition-transform duration-300">${icons.chevronDown}</span>
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
                        <p class="text-sm text-gray-500 mt-1 italic">Mẹo: Giữ Ctrl + Di chuột để gộp ô bảng điểm</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <button data-action="change-password" class="px-4 py-2 bg-yellow-500 text-white rounded-lg shadow-md hover:bg-yellow-600 flex items-center gap-2">${icons.key}<span>Đổi mật khẩu</span></button>
                        <a href="../view/" class="px-4 py-2 bg-gray-600 text-white rounded-lg shadow-md flex items-center gap-2">${icons.gallery}<span>Xem trang chủ</span></a>
                    </div>
                </header>
                <main id="edit-main" class="space-y-8">
                    <section id="sync-section">
                        <div id="sync-wrapper" class="flex items-center gap-4 p-4 rounded-lg border-l-4 shadow-sm transition-all duration-300">
                            <div id="sync-icon"></div>
                            <div class="flex-grow">
                                <p id="sync-title" class="font-bold"></p>
                                <p id="sync-message" class="text-sm"></p>
                            </div>
                            <button id="sync-btn" data-action="sync" class="px-6 py-2 bg-indigo-500 text-white font-bold rounded-lg shadow hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"></button>
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
        <div id="upload-progress-container" class="hidden w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-4">
            <div id="upload-progress-bar" class="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" style="width: 0%"></div>
        </div>
        <div id="gallery-container"></div>`;
    
    const actionsContainer = document.getElementById('gallery-actions');
    const container = document.getElementById('gallery-container');

    if (isSelectionMode) {
        actionsContainer.innerHTML = `
            <span class="text-sm font-medium text-gray-500">Đã chọn ${selectedMediaIds.size} mục</span>
            <button data-action="delete-selected-media" class="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 flex items-center gap-2">${icons.trash}<span>Xóa mục đã chọn</span></button>
            <button data-action="toggle-select-mode" class="px-4 py-2 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600">Hủy chọn</button>
        `;
    } else {
        actionsContainer.innerHTML = `
            <label class="px-4 py-2 bg-teal-500 text-white font-semibold rounded-lg cursor-pointer hover:bg-teal-600 flex items-center gap-2">
                ${icons.plus}<span>Tải lên từ thiết bị</span>
                <input type="file" multiple class="hidden" data-action="upload-media" accept="image/*,video/*,audio/*">
            </label>
            <button data-action="add-media-url" class="px-4 py-2 bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-600 flex items-center gap-2">${icons.plus}<span>Thêm bằng Link (URL)</span></button>
            <button data-action="toggle-select-mode" class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center gap-2">
                ${icons.checkbox}<span>Chọn nhiều mục</span>
            </button>
        `;
    }
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

// --- MEDIA LOGIC (RESIZING + MODALS) ---

async function handleUploadMedia(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const progressContainer = document.getElementById('upload-progress-container');
    const progressBar = document.getElementById('upload-progress-bar');
    progressContainer.classList.remove('hidden');

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const type = file.type.startsWith('video/') ? 'video' : (file.type.startsWith('audio/') ? 'audio' : 'image');
        
        try {
            const base64Data = await readFileAsBase64(file, type === 'image');
            const newMedia = {
                id: crypto.randomUUID(),
                type,
                url: base64Data,
                caption: file.name.split('.').slice(0, -1).join('.')
            };
            appData.media.unshift(newMedia);
            
            const percent = Math.round(((i + 1) / files.length) * 100);
            progressBar.style.width = `${percent}%`;
        } catch (err) {
            console.error('Lỗi khi đọc file:', err);
        }
    }

    setTimeout(() => {
        progressContainer.classList.add('hidden');
        progressBar.style.width = '0%';
        markAsDirty();
        renderGallerySection();
    }, 500);
}

function readFileAsBase64(file, resize = false) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
            if (resize) {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const max = 1200;
                    if (width > height && width > max) { height *= max / width; width = max; }
                    else if (height > max) { width *= max / height; height = max; }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.8));
                };
                img.src = reader.result;
            } else {
                resolve(reader.result);
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function handleEditMedia(id) {
    const item = appData.media.find(m => m.id === id);
    if (!item) return;
    dom.modalContainer.innerHTML = renderMediaEditModal(item);
}

function saveMediaEdit(id) {
    const captionInput = document.getElementById('edit-media-caption-input');
    const item = appData.media.find(m => m.id === id);
    if (item && captionInput) {
        item.caption = captionInput.value;
        markAsDirty();
        closeModal();
        renderGallerySection();
    }
}

function handleDeleteMedia(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa mục này?')) return;
    appData.media = appData.media.filter(m => m.id !== id);
    markAsDirty();
    renderGallerySection();
}

function handleDeleteSelectedMedia() {
    if (!selectedMediaIds.size) return;
    if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedMediaIds.size} mục đã chọn?`)) return;
    appData.media = appData.media.filter(m => !selectedMediaIds.has(m.id));
    selectedMediaIds.clear();
    isSelectionMode = false;
    markAsDirty();
    renderGallerySection();
}

// --- TABLE LOGIC (MERGING & HEADERS) ---

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
            el.classList.add('bg-indigo-200', 'dark:bg-indigo-900/40', 'ring-2', 'ring-indigo-500');
        } else {
            el.classList.remove('bg-indigo-200', 'dark:bg-indigo-900/40', 'ring-2', 'ring-indigo-500');
        }
    });
}

function finishCellMerging() {
    if (!isSelectingCells) return;
    isSelectingCells = false;

    if (selectionStart.r === selectionEnd.r && selectionStart.c === selectionEnd.c) {
        const r = selectionStart.r;
        const c = selectionStart.c;
        const currentMergeIndex = appData.merges.findIndex(m => 
            r >= m.sR && r <= m.eR && c >= m.sC && c <= m.eC
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

    appData.merges = appData.merges.filter(m => {
        return !(m.sR <= maxR && m.eR >= minR && m.sC <= maxC && m.eC >= minC);
    });

    appData.merges.push({ sR: minR, sC: minC, eR: maxR, eC: maxC });
    markAsDirty();
    renderClassListSection();
}

function handleHeaderContextMenu(e) {
    if (!classListEditMode) return;
    const header = e.target.closest('.header-cell');
    if (!header) return;
    e.preventDefault();

    const colIndex = parseInt(header.dataset.columnIndex);
    const currentParent = appData.studentColumns[colIndex].parent || '';
    
    const newParent = prompt("Nhập tên Nhóm Tiêu Đề (để trống để xóa nhóm):", currentParent);
    if (newParent !== null) {
        appData.studentColumns[colIndex].parent = newParent.trim();
        markAsDirty();
        renderClassListSection();
    }
}

// --- AUTH & SYNC LOGIC ---

async function handleLogin(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const errEl = document.getElementById('auth-error');
    const pwd = e.target.password.value;
    
    btn.disabled = true;
    btn.textContent = 'Đang xác thực...';
    errEl.textContent = '';

    const result = await authenticate(pwd);
    if (result.success) {
        sessionAuthToken = result.token;
        appData = await fetchAppData();
        if (!appData.merges) appData.merges = [];
        dom.authContainer.classList.add('hidden');
        dom.editContainer.classList.remove('hidden');
        renderEditPage();
    } else {
        errEl.textContent = 'Mật khẩu không đúng. Vui lòng thử lại.';
        btn.disabled = false;
        btn.textContent = 'Đăng nhập';
    }
}

function markAsDirty() {
    isDirty = true;
    updateSyncState({ status: 'dirty' });
}

function updateSyncState({ status }) {
    const wrapper = document.getElementById('sync-wrapper');
    if (!wrapper) return;
    const iconEl = document.getElementById('sync-icon');
    const titleEl = document.getElementById('sync-title');
    const messageEl = document.getElementById('sync-message');
    const button = document.getElementById('sync-btn');
    
    wrapper.className = 'flex items-center gap-4 p-4 rounded-lg border-l-4 shadow-sm transition-all duration-300';
    
    if (status === 'dirty') {
        wrapper.classList.add('bg-yellow-50', 'border-yellow-400', 'dark:bg-yellow-900/20');
        iconEl.innerHTML = icons.warning;
        titleEl.textContent = 'Dữ liệu đã thay đổi';
        messageEl.textContent = 'Nhấn "Lưu lại" để đồng bộ lên máy chủ.';
        button.disabled = false;
        button.innerHTML = `${icons.sync}<span>Lưu dữ liệu</span>`;
    } else if (status === 'synced') {
        wrapper.classList.add('bg-green-50', 'border-green-400', 'dark:bg-green-900/20');
        iconEl.innerHTML = icons.check;
        titleEl.textContent = 'Đã đồng bộ';
        messageEl.textContent = 'Mọi thay đổi đã được lưu an toàn.';
        button.disabled = true;
        button.innerHTML = `${icons.check}<span>Đã lưu</span>`;
        isDirty = false;
    } else if (status === 'syncing') {
        wrapper.classList.add('bg-blue-50', 'border-blue-400', 'dark:bg-blue-900/20');
        iconEl.innerHTML = `<div class="animate-spin">${icons.sync}</div>`;
        titleEl.textContent = 'Đang lưu...';
        messageEl.textContent = 'Vui lòng không tắt trình duyệt.';
        button.disabled = true;
    }
}

async function handleSync() {
    if (isSyncing) return;
    isSyncing = true;
    updateSyncState({ status: 'syncing' });
    const result = await saveAppData(appData, sessionAuthToken);
    if (result.success) {
        saveAppDataToStorage(appData);
        updateSyncState({ status: 'synced' });
    } else {
        alert('Lỗi khi lưu: ' + result.message);
        updateSyncState({ status: 'dirty' });
    }
    isSyncing = false;
}

function handleChangePassword() {
    const currentPassword = prompt('Nhập mật khẩu HIỆN TẠI:');
    if (!currentPassword) return;
    const newPassword = prompt('Nhập mật khẩu MỚI:');
    if (!newPassword) return;
    if (newPassword.length < 4) return alert('Mật khẩu mới quá ngắn!');

    const confirmPwd = prompt('Xác nhận mật khẩu MỚI:');
    if (newPassword !== confirmPwd) return alert('Xác nhận mật khẩu không khớp!');

    updatePassword({ currentPassword, newPassword, authToken: sessionAuthToken })
        .then(res => {
            if (res.success) {
                sessionAuthToken = res.newToken;
                alert('Đổi mật khẩu thành công!');
            } else {
                alert('Lỗi: ' + res.message);
            }
        });
}

function closeModal() {
    dom.modalContainer.innerHTML = '';
}

// --- EVENT LISTENERS ---

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
        else if (action === 'add-column-end') {
            const label = prompt('Nhập tên cột mới:');
            if (label) {
                const key = 'col_' + Date.now();
                appData.studentColumns.push({ key, label });
                appData.students.forEach(s => s[key] = '');
                markAsDirty(); renderClassListSection();
            }
        }
        else if (action === 'remove-column') {
            const idx = parseInt(btn.dataset.columnIndex);
            if (confirm(`Xóa cột "${appData.studentColumns[idx].label}"?`)) {
                appData.studentColumns.splice(idx, 1);
                markAsDirty(); renderClassListSection();
            }
        }
        else if (action === 'upload-media') handleUploadMedia(e);
        else if (action === 'delete-media') handleDeleteMedia(btn.dataset.id);
        else if (action === 'edit-media') handleEditMedia(btn.dataset.id);
        else if (action === 'toggle-select-mode') { 
            isSelectionMode = !isSelectionMode; 
            selectedMediaIds.clear(); 
            renderGallerySection(); 
        }
        else if (action === 'toggle-select-media') {
            const id = btn.dataset.id;
            if (selectedMediaIds.has(id)) selectedMediaIds.delete(id);
            else selectedMediaIds.add(id);
            renderGallerySection();
        }
        else if (action === 'delete-selected-media') handleDeleteSelectedMedia();
        else if (action === 'change-password') handleChangePassword();
        else if (action === 'close-modal') closeModal();
        else if (action === 'save-media-edit-confirm') saveMediaEdit(btn.dataset.id);
        else if (action === 'add-media-url') {
            const url = prompt('Nhập URL Media (Ảnh/Video/Audio):');
            if (url) {
                const type = (url.includes('.mp4') || url.includes('youtube')) ? 'video' : 'image';
                appData.media.unshift({ id: crypto.randomUUID(), type, url, caption: 'Link Media' });
                markAsDirty(); renderGallerySection();
            }
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
        } else if (action === 'update-schedule-cell') {
            const { day, sessionKey, periodIndex } = e.target.dataset;
            appData.schedule[day][sessionKey][parseInt(periodIndex)] = { subject: e.target.value };
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
        openAccordionId = id;
    } else {
        header.classList.remove('open');
        content.classList.remove('open');
    }
}

async function init() {
    dom.authContainer = document.getElementById('auth-container');
    dom.editContainer = document.getElementById('edit-container');
    dom.modalContainer = document.getElementById('modal-container');
    const noImg = await fetchNoImage();
    setNoImageBase64(noImg);
    setupEventListeners();
    renderAuthForm();
}

document.addEventListener('DOMContentLoaded', init);
