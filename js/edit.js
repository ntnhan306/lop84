// v4.0 - Refactored for Stability
import { fetchAppData, getAppDataFromStorage, saveAppDataToStorage, saveAppData, authenticate, updatePassword } from './data.js';
import { renderGallery, renderClassList, renderSchedule, icons } from './ui.js';

// --- Global State ---
let appData = null;
let sessionAuthToken = null;
let isDirty = false; // Tracks if there are unsaved changes
let isSyncing = false;

// --- UI State ---
let isSelectionMode = false;
let selectedMediaIds = new Set();
let openAccordionId = 'gallery-section'; // First section is open by default

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
                    <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Vui lòng nhập mật khẩu để tiếp tục.<br>Nếu là lần đầu, mật khẩu mặc định là <strong>000000</strong>.</p>
                </div>
                <form id="auth-form" class="space-y-6">
                    <div>
                        <label for="password" class="sr-only">Mật khẩu</label>
                        <input id="password" name="password" type="password" required class="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Mật khẩu">
                    </div>
                    <p id="auth-error" class="text-red-500 text-sm text-center min-h-[20px]"></p>
                    <div>
                        <button type="submit" class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400">
                            Đăng nhập
                        </button>
                    </div>
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
        <div class="accordion-item bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden transition-all duration-300">
            <h2 id="${section.id}-header">
                <button type="button" data-action="toggle-accordion" data-accordion-id="${section.id}" class="accordion-header flex items-center justify-between w-full p-5 font-medium text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none">
                    <span class="flex items-center gap-3 text-xl">${section.icon} ${section.title}</span>
                    <span class="accordion-icon">${icons.chevronDown}</span>
                </button>
            </h2>
            <div id="${section.id}-content" class="accordion-content"><div class="p-6 border-t border-gray-200 dark:border-gray-700 space-y-4"></div></div>
        </div>`).join('');

    dom.editContainer.innerHTML = `
        <div class="min-h-screen bg-gray-50 dark:bg-gray-800 p-4 sm:p-6 lg:p-8">
            <div class="max-w-7xl mx-auto">
                <header class="flex flex-wrap justify-between items-center gap-4 mb-8 pb-4 border-b-2 border-teal-500">
                    <div>
                        <h1 class="text-4xl font-bold text-teal-600 dark:text-teal-400">Chỉnh sửa (v4.0)</h1>
                        <p class="text-lg text-gray-600 dark:text-gray-300 mt-1">Giao diện quản trị</p>
                    </div>
                    <div class="flex items-center flex-wrap gap-2">
                        <button data-action="change-password" class="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-600 transition-colors">${icons.key}<span>Đổi Mật khẩu</span></button>
                        <a href="../view/" class="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 transition-colors">${icons.gallery}<span>Xem trang</span></a>
                    </div>
                </header>
                <main id="edit-main" class="space-y-12">
                    <section id="sync-section">
                        <div id="sync-wrapper" class="flex items-center gap-4 p-4 rounded-lg border-l-4 transition-colors">
                            <div id="sync-icon"></div>
                            <div class="flex-grow">
                                <p id="sync-title" class="font-semibold"></p>
                                <p id="sync-message" class="text-sm"></p>
                            </div>
                            <button id="sync-btn" data-action="sync" class="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-all"></button>
                        </div>
                    </section>
                    <div class="space-y-4">${accordionHTML}</div>
                </main>
                <footer class="text-center mt-12 text-gray-500 dark:text-gray-400">
                    <p>&copy; ${new Date().getFullYear()} Lớp 8/4. Chế độ chỉnh sửa.</p>
                    <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">v4.0</p>
                </footer>
            </div>
        </div>`;
    renderAllSections();
    if (openAccordionId) toggleAccordion(openAccordionId, true);
    updateSyncState({ status: 'synced', message: 'Dữ liệu đã được tải về và sẵn sàng để chỉnh sửa.' });
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
        <div id="gallery-actions" class="flex flex-wrap items-center gap-4"></div>
        <div id="upload-progress-container" class="hidden"></div>
        <div id="gallery-container"></div>`;
    const actionsContainer = document.getElementById('gallery-actions');
    const container = document.getElementById('gallery-container');
    let actionsHTML = `
        <label class="inline-flex items-center gap-2 px-4 py-2 bg-teal-500 text-white font-semibold rounded-lg shadow-md hover:bg-teal-600 cursor-pointer">
            ${icons.plus}<span>Tải lên Tệp</span>
            <input type="file" multiple class="hidden" data-action="upload-media" accept="image/*,video/*,audio/*">
        </label>
        <button data-action="add-media-url" class="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 font-semibold rounded-lg shadow-md hover:bg-gray-300 dark:hover:bg-gray-600">${icons.plus}<span>Thêm từ URL</span></button>
        <button data-action="toggle-select-mode" class="inline-flex items-center gap-2 px-4 py-2 ${isSelectionMode ? 'bg-indigo-600' : 'bg-blue-500'} text-white font-semibold rounded-lg shadow-md hover:bg-blue-600">
            ${isSelectionMode ? icons.check : icons.checkbox}<span>${isSelectionMode ? 'Hoàn tất chọn' : 'Chọn mục'}</span>
        </button>`;
    if (isSelectionMode) {
        const allSelected = appData.media.length > 0 && selectedMediaIds.size === appData.media.length;
        actionsHTML += `<button data-action="${allSelected ? 'deselect-all-media' : 'select-all-media'}" class="inline-flex items-center gap-2 px-4 py-2 bg-gray-500 text-white font-semibold rounded-lg shadow-md hover:bg-gray-600">${icons.checkboxChecked}<span>${allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}</span></button>`;
    }
    if (isSelectionMode && selectedMediaIds.size > 0) {
        actionsHTML += `<div class="flex items-center gap-4 ml-auto"><span class="font-medium text-gray-700 dark:text-gray-300">Đã chọn: ${selectedMediaIds.size}</span><button data-action="delete-selected-media" class="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700">${icons.trash}<span>Xóa mục đã chọn</span></button></div>`;
    }
    actionsContainer.innerHTML = actionsHTML;
    container.innerHTML = renderGallery(appData.media, { isEditing: true, isSelectionMode, selectedIds: selectedMediaIds });
}

function renderClassListSection() {
    const contentWrapper = document.querySelector('#classlist-section-content > div');
    if (!contentWrapper) return;
    contentWrapper.innerHTML = renderClassList(appData.students, appData.studentColumns, { isEditing: true });
}

function renderScheduleSection() {
    const contentWrapper = document.querySelector('#schedule-section-content > div');
    if (!contentWrapper) return;
    contentWrapper.innerHTML = renderSchedule(appData.schedule, true);
}

// --- STATE & DATA HANDLING --- //

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
    wrapper.className = 'flex items-center gap-4 p-4 rounded-lg border-l-4 transition-colors';
    switch(status) {
        case 'dirty':
            wrapper.classList.add('bg-yellow-50', 'dark:bg-yellow-900/20', 'border-yellow-400');
            iconEl.innerHTML = icons.warning; iconEl.className = 'text-yellow-500';
            titleEl.textContent = 'Có thay đổi chưa lưu';
            messageEl.textContent = message || 'Nhấn nút bên cạnh để lưu và đồng bộ dữ liệu.';
            button.disabled = false; button.innerHTML = `${icons.sync}<span>Lưu và Đồng bộ</span>`;
            break;
        case 'syncing':
            wrapper.classList.add('bg-blue-50', 'dark:bg-blue-900/20', 'border-blue-400');
            iconEl.innerHTML = `<svg class="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
            titleEl.textContent = message || 'Đang đồng bộ...';
            messageEl.textContent = 'Đang gửi dữ liệu đến máy chủ Cloudflare.';
            button.disabled = true; button.innerHTML = `<span>Đang xử lý...</span>`;
            break;
        case 'synced':
            wrapper.classList.add('bg-green-50', 'dark:bg-green-900/20', 'border-green-400');
            iconEl.innerHTML = icons.check; iconEl.className = 'text-green-500';
            titleEl.textContent = 'Đã đồng bộ';
            messageEl.textContent = message || 'Tất cả dữ liệu đã được cập nhật thành công.';
            button.disabled = true; button.innerHTML = `${icons.check}<span>Đã lưu</span>`;
            isDirty = false;
            break;
        case 'error':
            wrapper.classList.add('bg-red-50', 'dark:bg-red-900/20', 'border-red-400');
            iconEl.innerHTML = icons.error; iconEl.className = 'text-red-500';
            titleEl.textContent = 'Đồng bộ thất bại';
            messageEl.textContent = message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
            button.disabled = false; button.innerHTML = `<span>Thử lại</span>`;
            isDirty = true;
            break;
    }
}

async function handleSync() {
    if (isSyncing) return;
    isSyncing = true;
    updateSyncState({ status: 'syncing' });
    if (!sessionAuthToken) {
        updateSyncState({ status: 'error', message: 'Lỗi xác thực. Vui lòng đăng nhập lại.' });
        isSyncing = false; return;
    }
    const dataToSync = getAppDataFromStorage();
    if (!dataToSync) {
        updateSyncState({ status: 'error', message: 'Lỗi: Không tìm thấy dữ liệu để đồng bộ.' });
        isSyncing = false; return;
    }
    const result = await saveAppData(dataToSync, sessionAuthToken);
    if (result.success) {
        updateSyncState({ status: 'synced', message: result.message });
    } else {
        updateSyncState({ status: 'error', message: result.message });
    }
    isSyncing = false;
}

// --- ASYNC LOGIC & HANDLERS --- //

async function handleLogin(e) {
    e.preventDefault();
    const form = e.target;
    const button = form.querySelector('button');
    const password = form.password.value;
    const errorEl = document.getElementById('auth-error');
    button.disabled = true;
    button.textContent = 'Đang xác thực...';
    errorEl.textContent = '';
    const result = await authenticate(password);
    if (result.success) {
        sessionAuthToken = result.token;
        await showEditPage();
    } else {
        errorEl.textContent = result.message || 'Lỗi không xác định.';
        button.disabled = false;
        button.textContent = 'Đăng nhập';
    }
}

async function showEditPage() {
    dom.authContainer.innerHTML = `<div class="flex items-center justify-center h-screen">Đang tải dữ liệu mới nhất...</div>`;
    try {
        appData = await fetchAppData();
        saveAppDataToStorage(appData);
        dom.authContainer.classList.add('hidden');
        dom.editContainer.classList.remove('hidden');
        renderEditPage();
    } catch (error) {
        dom.authContainer.innerHTML = `<div class="flex items-center justify-center h-screen text-red-500 p-4 text-center">Không thể tải dữ liệu từ máy chủ. Vui lòng kiểm tra kết nối và thử lại. <br/><small>${error.message}</small></div>`;
    }
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function handleFileUploads(files) {
    const progressContainer = document.getElementById('upload-progress-container');
    if (!progressContainer) return;

    progressContainer.innerHTML = `
        <div class="mt-4 space-y-2">
            <p id="progress-text" class="text-sm font-medium text-gray-700 dark:text-gray-300"></p>
            <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div id="progress-bar" class="bg-teal-500 h-2.5 rounded-full transition-all duration-300" style="width: 0%"></div>
            </div>
        </div>`;
    progressContainer.classList.remove('hidden');

    const progressText = document.getElementById('progress-text');
    const progressBar = document.getElementById('progress-bar');

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const currentFileText = `Đang xử lý tệp ${i + 1}/${files.length}: ${file.name}...`;
        progressText.textContent = currentFileText;
        progressBar.style.width = `${(i / files.length) * 100}%`;

        try {
            const url = await readFileAsDataURL(file);
            const type = file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'audio';
            const newMedia = { id: crypto.randomUUID(), type, url, caption: file.name };

            // Add to local state and save to storage
            appData.media.push(newMedia);
            saveAppDataToStorage(appData);
            
            // Re-render gallery to show new item immediately
            renderGallerySection();

            // Sync this single change to the server
            updateSyncState({ status: 'syncing', message: `Đang đồng bộ: ${file.name}` });
            const result = await saveAppData(appData, sessionAuthToken);

            if (!result.success) {
                // If sync fails, show an error and stop. The data is still saved locally.
                updateSyncState({ status: 'error', message: `Đồng bộ ${file.name} thất bại. Các tệp còn lại đã bị hủy. Vui lòng thử đồng bộ lại.` });
                isDirty = true; // Mark as dirty since the last operation failed
                progressContainer.classList.add('hidden');
                return; // Stop processing further files
            }

        } catch (error) {
            console.error(`Lỗi khi đọc tệp ${file.name}:`, error);
            updateSyncState({ status: 'error', message: `Lỗi đọc tệp ${file.name}. Đã bỏ qua.` });
        }
    }
    
    progressBar.style.width = '100%';
    progressText.textContent = `Hoàn tất! Đã tải lên và đồng bộ ${files.length} tệp.`;
    setTimeout(() => progressContainer.classList.add('hidden'), 2000);
    
    updateSyncState({ status: 'synced', message: `Đã đồng bộ thành công ${files.length} tệp.` });
    renderGallerySection();
}

// --- UI & MODAL LOGIC --- //

function toggleAccordion(sectionId, forceOpen = false) {
    const newHeader = document.querySelector(`.accordion-header[data-accordion-id="${sectionId}"]`);
    const newContent = document.getElementById(`${sectionId}-content`);
    if (!newHeader || !newContent) return;

    const currentlyOpen = newHeader.classList.contains('open');
    document.querySelectorAll('.accordion-header.open, .accordion-content.open').forEach(el => el.classList.remove('open'));
    
    if (forceOpen || !currentlyOpen) {
        newHeader.classList.add('open');
        newContent.classList.add('open');
        openAccordionId = sectionId;
    } else {
        openAccordionId = null;
    }
}

function openModal({ title, contentHTML, size = 'max-w-4xl', onOpened = null }) {
    dom.modalContainer.innerHTML = `
        <div id="modal-backdrop" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity duration-300 ease-in-out opacity-0">
            <div id="modal-box" class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full ${size} max-h-[90vh] flex flex-col transform scale-95 transition-all duration-300 ease-in-out opacity-0">
                <div class="flex justify-between items-center p-4 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white">${title}</h3>
                    <button data-action="modal-close" class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                    </button>
                </div>
                <div class="p-6 overflow-y-auto flex-grow">${contentHTML}</div>
            </div>
        </div>`;
    
    const backdrop = document.getElementById('modal-backdrop');
    const modalBox = document.getElementById('modal-box');
    
    requestAnimationFrame(() => {
        backdrop.style.opacity = '1';
        modalBox.style.opacity = '1';
        modalBox.style.transform = 'scale(1)';
        if (onOpened) {
            // Use another rAF to ensure the CSS transitions have started and the element is painted.
            requestAnimationFrame(() => requestAnimationFrame(onOpened));
        }
    });
}

function closeModal() {
    const backdrop = document.getElementById('modal-backdrop');
    if (backdrop) {
        backdrop.style.opacity = '0';
        backdrop.querySelector('#modal-box').style.transform = 'scale(0.95)';
        setTimeout(() => { dom.modalContainer.innerHTML = '' }, 300);
    }
}

function showClassListSpreadsheet() {
    const contentHTML = '<div id="spreadsheet-container" class="h-[65vh] w-full"></div>' +
        `<div class="p-4 border-t dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50">
            <button type="button" data-action="modal-cancel" class="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500 transition-colors">Hủy</button>
            <button type="button" data-action="modal-save" class="px-4 py-2 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-600 transition-colors">Lưu và Đóng</button>
        </div>`;
    openModal({ title: 'Chỉnh sửa Danh sách Lớp', size: 'max-w-7xl', contentHTML, onOpened: () => {
        const spreadsheetEl = document.getElementById('spreadsheet-container');
        if (!spreadsheetEl) return;
        const columns = appData.studentColumns.map(col => ({ type: 'text', title: col.label, width: col.key === 'name' ? 250 : 150, name: col.key, readOnly: col.readonly || false }));
        const data = appData.students.map(student => { const row = {}; appData.studentColumns.forEach(col => { row[col.key] = student[col.key] || ''; }); return row; });
        const spreadsheet = jspreadsheet(spreadsheetEl, { data, columns, allowInsertRow: true, allowInsertColumn: true, allowDeleteRow: true, allowDeleteColumn: true, allowRenameColumn: true, columnDrag: true, rowDrag: true, license: 'CE' });
        dom.modalContainer.querySelector('[data-action="modal-save"]').onclick = () => {
            const newData = spreadsheet.getData(false, true); // Get formatted data
            const newHeaders = spreadsheet.getHeaders(true);
            const originalKeys = spreadsheet.options.columns.map(c => c.name);
            appData.studentColumns = newHeaders.map((label, index) => ({ key: originalKeys[index], label }));
            appData.students = newData.map((row, rowIndex) => {
                const student = { id: appData.students[rowIndex]?.id || crypto.randomUUID() };
                appData.studentColumns.forEach(col => { student[col.key] = row[col.key]; });
                return student;
            });
            saveAppDataToStorage(appData); markAsDirty(); renderClassListSection(); closeModal();
        };
    }});
}

function showScheduleSpreadsheet() {
    const contentHTML = '<div id="spreadsheet-container" class="h-[65vh] w-full"></div>' +
        `<div class="p-4 border-t dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50">
            <button type="button" data-action="modal-cancel" class="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500 transition-colors">Hủy</button>
            <button type="button" data-action="modal-save" class="px-4 py-2 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-600 transition-colors">Lưu và Đóng</button>
        </div>`;
    openModal({ title: "Chỉnh sửa Thời khóa biểu", size: 'max-w-7xl', contentHTML, onOpened: () => {
        const spreadsheetEl = document.getElementById('spreadsheet-container');
        if (!spreadsheetEl) return;
        const days = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        const columns = [{ type: 'text', title: 'Buổi', width: 80, readOnly: true }, { type: 'text', title: 'Tiết', width: 80, readOnly: true }, ...days.map(day => ({ type: 'text', title: day, width: 150 }))];
        const data = [];
        const sessions = [{name: 'Sáng', key: 'morning'}, {name: 'Chiều', key: 'afternoon'}];
        sessions.forEach(session => {
            for (let i = 0; i < 5; i++) {
                const row = [session.name, `Tiết ${i + 1}`];
                days.forEach(day => { row.push(appData.schedule[day]?.[session.key]?.[i]?.subject || ''); });
                data.push(row);
            }
        });
        const spreadsheet = jspreadsheet(spreadsheetEl, { data, columns, license: 'CE' });
        dom.modalContainer.querySelector('[data-action="modal-save"]').onclick = () => {
            const rawData = spreadsheet.getData();
            sessions.forEach((session, sessionIndex) => {
                for (let i = 0; i < 5; i++) {
                     const rowIndex = sessionIndex * 5 + i;
                     days.forEach((day, dayIndex) => { appData.schedule[day][session.key][i].subject = rawData[rowIndex][dayIndex + 2]; });
                }
            });
            saveAppDataToStorage(appData); markAsDirty(); renderScheduleSection(); closeModal();
        };
    }});
}

// --- EVENT LISTENERS --- //

function setupEventListeners() {
    dom.editContainer.addEventListener('change', e => {
        const action = e.target.dataset.action;
        if (action === 'upload-media') handleFileUploads(e.target.files);
    });

    dom.editContainer.addEventListener('click', e => {
        const button = e.target.closest('button, [data-action]');
        if (!button) return;
        const { action, accordionId } = button.dataset;
        const id = e.target.closest('[data-id]')?.dataset.id;
        
        const actions = {
            'sync': () => handleSync(),
            'toggle-accordion': () => toggleAccordion(accordionId),
            'edit-classlist-spreadsheet': showClassListSpreadsheet,
            'edit-schedule-spreadsheet': showScheduleSpreadsheet,
            'add-media-url': () => showMediaForm(),
            'edit-media': () => showMediaForm(id),
            'delete-media': () => {
                if (confirm('Bạn có chắc muốn xóa mục này?')) {
                    appData.media = appData.media.filter(m => m.id !== id);
                    saveAppDataToStorage(appData); markAsDirty(); renderGallerySection();
                }
            },
            'toggle-select-mode': () => {
                isSelectionMode = !isSelectionMode;
                if (!isSelectionMode) selectedMediaIds.clear();
                renderGallerySection();
            },
            'toggle-select-media': () => {
                if (id) { selectedMediaIds.has(id) ? selectedMediaIds.delete(id) : selectedMediaIds.add(id); renderGallerySection(); }
            },
            'select-all-media': () => { appData.media.forEach(item => selectedMediaIds.add(item.id)); renderGallerySection(); },
            'deselect-all-media': () => { selectedMediaIds.clear(); renderGallerySection(); },
            'delete-selected-media': () => {
                if (confirm(`Bạn có chắc muốn xóa ${selectedMediaIds.size} mục đã chọn?`)) {
                    appData.media = appData.media.filter(m => !selectedMediaIds.has(m.id));
                    selectedMediaIds.clear(); isSelectionMode = false;
                    saveAppDataToStorage(appData); markAsDirty(); renderGallerySection();
                }
            },
            'change-password': () => showChangePasswordForm(),
        };
        actions[action]?.();
    });

    dom.modalContainer.addEventListener('click', e => {
        const action = e.target.closest('[data-action]')?.dataset.action;
        if (e.target.id === 'modal-backdrop' || action === 'modal-close' || action === 'modal-cancel') closeModal();
    });

    // Delegated form submissions from modal
    dom.modalContainer.addEventListener('submit', async e => {
        e.preventDefault();
        const form = e.target;
        if (form.id === 'media-form') {
            const id = form.dataset.id;
            const updatedMedia = { id: id || crypto.randomUUID(), type: form.type.value, url: form.url.value, caption: form.caption.value };
            if (id) { appData.media = appData.media.map(m => m.id === id ? updatedMedia : m); } else { appData.media.push(updatedMedia); }
            saveAppDataToStorage(appData); markAsDirty(); renderGallerySection(); closeModal();
        } else if (form.id === 'change-password-form') {
            await handleChangePassword(form);
        }
    });
}

// --- INITIALIZATION --- //

async function init() {
    dom.authContainer = document.getElementById('auth-container');
    dom.editContainer = document.getElementById('edit-container');
    dom.modalContainer = document.getElementById('modal-container');
    if (!dom.authContainer || !dom.editContainer || !dom.modalContainer) {
        throw new Error("DOM containers not found.");
    }
    setupEventListeners();
    dom.authContainer.innerHTML = `<div class="flex items-center justify-center h-screen">Đang khởi tạo...</div>`;
    renderAuthForm();
}

document.addEventListener('DOMContentLoaded', init);
// Placeholder for password change form logic
async function showChangePasswordForm() {}
async function handleChangePassword(form) {}
// Placeholder for media form logic
async function showMediaForm(mediaId = null) {}