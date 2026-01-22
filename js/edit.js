
// v4.3 - Refined Class List Spreadsheet Logic
import { fetchAppData, getAppDataFromStorage, saveAppDataToStorage, saveAppData, authenticate, updatePassword } from './data.js';
import { renderGallery, renderClassList, renderSchedule, icons } from './ui.js';

// --- Global State ---
let appData = null;
let sessionAuthToken = null;
let isDirty = false; // Tracks if there are unsaved changes
let isSyncing = false;
let handsontableInstance = null; // To hold the table instance

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
        <div id="gallery-alerts"></div>
        <div id="gallery-actions" class="flex flex-wrap items-center gap-4 mb-6"></div>
        <div id="upload-progress-container" class="hidden"></div>
        <div id="gallery-container"></div>`;
    const actionsContainer = document.getElementById('gallery-actions');
    const container = document.getElementById('gallery-container');
    let actionsHTML = `
        <label class="inline-flex items-center gap-2 px-4 py-2 bg-teal-500 text-white font-semibold rounded-lg shadow-md hover:bg-teal-600 cursor-pointer transition-all">
            ${icons.plus}<span>Tải lên Tệp</span>
            <input type="file" multiple class="hidden" data-action="upload-media" accept="image/*,video/*,audio/*">
        </label>
        <button data-action="add-media-url" class="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 font-semibold rounded-lg shadow-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-all">${icons.plus}<span>Thêm từ URL</span></button>
        <button data-action="toggle-select-mode" class="inline-flex items-center gap-2 px-4 py-2 ${isSelectionMode ? 'bg-indigo-600' : 'bg-blue-500'} text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition-all">
            ${isSelectionMode ? icons.check : icons.checkbox}<span>${isSelectionMode ? 'Hoàn tất chọn' : 'Chọn mục'}</span>
        </button>`;
    if (isSelectionMode) {
        const allSelected = appData.media.length > 0 && selectedMediaIds.size === appData.media.length;
        actionsHTML += `<button data-action="${allSelected ? 'deselect-all-media' : 'select-all-media'}" class="inline-flex items-center gap-2 px-4 py-2 bg-gray-500 text-white font-semibold rounded-lg shadow-md hover:bg-gray-600 transition-all">${icons.checkboxChecked}<span>${allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}</span></button>`;
    }
    if (isSelectionMode && selectedMediaIds.size > 0) {
        actionsHTML += `<div class="flex items-center gap-4 ml-auto"><span class="font-medium text-gray-700 dark:text-gray-300">Đã chọn: ${selectedMediaIds.size}</span><button data-action="delete-selected-media" class="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-all">${icons.trash}<span>Xóa mục đã chọn</span></button></div>`;
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
    const result = await saveAppData(appData, sessionAuthToken);
    if (result.success) {
        saveAppDataToStorage(appData);
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
    dom.authContainer.innerHTML = `<div class="flex flex-col items-center justify-center h-screen space-y-4">
        <svg class="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        <span>Đang tải dữ liệu từ máy chủ...</span>
    </div>`;
    try {
        appData = await fetchAppData();
        saveAppDataToStorage(appData);
        dom.authContainer.classList.add('hidden');
        dom.editContainer.classList.remove('hidden');
        renderEditPage();
    } catch (error) {
        dom.authContainer.innerHTML = `<div class="flex items-center justify-center h-screen text-red-500 p-4 text-center">Không thể tải dữ liệu từ máy chủ. Vui lòng kiểm tra kết nối và thử lại. <br/><small class="block mt-2 font-mono text-xs opacity-70">${error.message}</small></div>`;
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

function displayAlert(containerId, message, type = 'error') {
    const container = document.getElementById(containerId);
    if (!container) return;

    let bgColor, textColor, icon;
    if (type === 'error') {
        bgColor = 'bg-red-100 dark:bg-red-900/30 border-red-500';
        textColor = 'text-red-700 dark:text-red-300';
        icon = icons.error;
    } else {
        bgColor = 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500';
        textColor = 'text-yellow-700 dark:text-yellow-300';
        icon = icons.warning;
    }

    const alertHTML = `
        <div class="alert-item flex items-start gap-4 p-4 rounded-lg border-l-4 ${bgColor} ${textColor} my-4">
            <div>${icon}</div>
            <div class="flex-grow text-sm">${message}</div>
            <button type="button" class="ml-auto -mx-1.5 -my-1.5" onclick="this.parentElement.remove()">
                <span class="sr-only">Dismiss</span>
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
            </button>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', alertHTML);
}

async function handleFileUploads(files) {
    const progressContainer = document.getElementById('upload-progress-container');
    if (!progressContainer) return;

    progressContainer.innerHTML = `
        <div class="mt-4 p-4 bg-white dark:bg-gray-700 rounded-lg shadow-inner space-y-2">
            <p id="progress-text" class="text-sm font-medium text-gray-700 dark:text-gray-300"></p>
            <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-600">
                <div id="progress-bar" class="bg-teal-500 h-2.5 rounded-full transition-all duration-300" style="width: 0%"></div>
            </div>
        </div>`;
    progressContainer.classList.remove('hidden');

    const progressText = document.getElementById('progress-text');
    const progressBar = document.getElementById('progress-bar');
    const MAX_FILE_SIZE_MB = 10;
    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
    let filesProcessed = 0;
    const failedFiles = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        progressText.textContent = `Đang xử lý ${i + 1}/${files.length}: ${file.name}...`;
        progressBar.style.width = `${(i / files.length) * 100}%`;

        if (file.size > MAX_FILE_SIZE_BYTES) {
            failedFiles.push({ name: file.name, reason: `Vượt quá giới hạn ${MAX_FILE_SIZE_MB}MB` });
            continue;
        }

        try {
            const url = await readFileAsDataURL(file);
            const type = file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'audio';
            appData.media.push({ id: crypto.randomUUID(), type, url, caption: file.name });
            filesProcessed++;
        } catch (error) {
            failedFiles.push({ name: file.name, reason: 'Lỗi khi đọc tệp' });
        }
    }

    progressBar.style.width = `100%`;
    if (filesProcessed > 0) markAsDirty();

    if (failedFiles.length > 0) {
        displayAlert('gallery-alerts', `<strong>Không thể xử lý ${failedFiles.length} tệp:</strong> <br>${failedFiles.map(f => `- ${f.name}: ${f.reason}`).join('<br>')}`, 'error');
    }

    progressText.textContent = `Hoàn tất! Đã thêm ${filesProcessed} tệp. Nhấn "Lưu và Đồng bộ" để cập nhật trang.`;
    setTimeout(() => { progressContainer.classList.add('hidden'); }, 5000);
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
            <div id="modal-box" class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full ${size} max-h-[90vh] flex flex-col transform scale-95 transition-all duration-300 ease-in-out opacity-0 overflow-hidden">
                <div class="flex justify-between items-center p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800 z-10">
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
        if (onOpened) onOpened();
    });
}

function closeModal() {
    if (handsontableInstance) {
        handsontableInstance.destroy();
        handsontableInstance = null;
    }
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
            <p class="text-xs text-gray-500 mr-auto self-center italic">Chuột phải để thêm cột mới vào cuối. STT tự động điền.</p>
            <button type="button" data-action="modal-cancel" class="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500 transition-colors">Hủy</button>
            <button type="button" data-action="modal-save" class="px-4 py-2 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-600 transition-colors">Lưu và Đóng</button>
        </div>`;

    openModal({ title: 'Chỉnh sửa Danh sách Lớp', size: 'max-w-7xl', contentHTML, onOpened: () => {
        const spreadsheetEl = document.getElementById('spreadsheet-container');
        if (!spreadsheetEl) return;

        // Đảm bảo luôn có ít nhất 2 cột: STT và Họ và Tên
        let colHeaders = appData.studentColumns.map(c => c.label);
        if (colHeaders.length === 0) {
            colHeaders = ['STT', 'Họ và Tên'];
        } else {
            if (!colHeaders.some(h => h.toUpperCase() === 'STT')) colHeaders.unshift('STT');
            if (!colHeaders.some(h => h.toUpperCase() === 'HỌ VÀ TÊN')) colHeaders.push('Họ và Tên');
        }

        // Tạo dữ liệu 2D cho Handsontable
        const data = appData.students.length > 0 
            ? appData.students.map((student, idx) => {
                return colHeaders.map(label => {
                    if (label.toUpperCase() === 'STT') return (idx + 1).toString();
                    const colConfig = appData.studentColumns.find(c => c.label === label);
                    if (colConfig) return student[colConfig.key] || '';
                    if (label.toUpperCase() === 'HỌ VÀ TÊN') return student.name || '';
                    return '';
                });
            })
            : [['1', '']]; // Mặc định 1 dòng trống nếu dữ liệu rỗng

        if (document.documentElement.classList.contains('dark')) spreadsheetEl.classList.add('htDark');

        handsontableInstance = new Handsontable(spreadsheetEl, {
            data: data,
            colHeaders: colHeaders,
            rowHeaders: true,
            minSpareRows: 1, // Luôn để 1 dòng trống ở cuối
            contextMenu: {
                items: {
                    "row_above": { name: "Thêm hàng phía trên" },
                    "row_below": { name: "Thêm hàng phía dưới" },
                    "remove_row": { name: "Xóa hàng" },
                    "hsep1": "---------",
                    "col_left": { name: "Thêm cột bên trái" },
                    "col_right": { name: "Thêm cột bên phải" },
                    "remove_col": { name: "Xóa cột" },
                    "hsep2": "---------",
                    "add_column_end": {
                        name: 'Thêm cột mới vào cuối bảng',
                        callback: function() {
                            const colCount = this.countCols();
                            this.alter('insert_col', colCount);
                            const currentHeaders = this.getColHeader();
                            const newLabel = prompt("Nhập tên cho cột mới:", `Cột ${colCount + 1}`);
                            currentHeaders[colCount] = newLabel || `Cột ${colCount + 1}`;
                            this.updateSettings({ colHeaders: currentHeaders });
                        }
                    },
                    "rename_column": {
                        name: 'Đổi tên cột này',
                        callback: function(key, selection) {
                            const colIdx = selection[0].start.col;
                            const oldLabel = this.getColHeader(colIdx);
                            const newLabel = prompt("Nhập tên mới cho cột:", oldLabel);
                            if (newLabel !== null && newLabel.trim() !== "") {
                                const currentHeaders = [...this.getColHeader()];
                                currentHeaders[colIdx] = newLabel.trim();
                                this.updateSettings({ colHeaders: currentHeaders });
                            }
                        }
                    }
                }
            },
            // Logic tự điền STT theo hàng
            afterChange: function(changes, source) {
                if (source === 'loadData' || source === 'auto') return;
                const sttColIdx = this.getColHeader().findIndex(h => h.toUpperCase() === 'STT');
                if (sttColIdx === -1) return;

                changes.forEach(([row, prop]) => {
                    // Nếu sửa bất kỳ ô nào không phải STT, đảm bảo STT hàng đó đúng
                    if (prop !== sttColIdx) {
                        this.setDataAtCell(row, sttColIdx, (row + 1).toString(), 'auto');
                    }
                });
            },
            afterCreateRow: function(index, amount) {
                const sttColIdx = this.getColHeader().findIndex(h => h.toUpperCase() === 'STT');
                if (sttColIdx !== -1) {
                    // Khi thêm hàng, cập nhật lại toàn bộ STT từ vị trí đó đến cuối để đảm bảo thứ tự
                    for (let i = index; i < this.countRows(); i++) {
                        this.setDataAtCell(i, sttColIdx, (i + 1).toString(), 'auto');
                    }
                }
            },
            manualColumnMove: true,
            manualColumnResize: true,
            width: '100%',
            height: '100%',
            licenseKey: 'non-commercial-and-evaluation'
        });

        dom.modalContainer.querySelector('[data-action="modal-save"]').onclick = () => {
            const currentHeaders = handsontableInstance.getColHeader();
            const rawData = handsontableInstance.getData();

            // Lọc bỏ các dòng hoàn toàn trống
            const filteredData = rawData.filter(row => row.some(cell => cell !== null && String(cell).trim() !== ''));

            // Tái cấu trúc studentColumns
            appData.studentColumns = currentHeaders.map((label, idx) => {
                let key = `col_${idx}_${Date.now()}`;
                if (label.toUpperCase() === 'STT') key = 'stt';
                else if (label.toUpperCase() === 'HỌ VÀ TÊN') key = 'name';
                return { key, label };
            });

            // Tái cấu trúc students
            appData.students = filteredData.map(row => {
                const student = { id: crypto.randomUUID() };
                row.forEach((cell, colIdx) => {
                    const key = appData.studentColumns[colIdx].key;
                    student[key] = cell || '';
                });
                return student;
            });

            markAsDirty(); 
            renderClassListSection(); 
            closeModal();
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
        const sessions = [{name: 'Sáng', key: 'morning'}, {name: 'Chiều', key: 'afternoon'}];
        const data = [];
        
        sessions.forEach(session => {
            for (let i = 0; i < 5; i++) {
                const row = { session: session.name, period: `Tiết ${i + 1}` };
                days.forEach(day => { row[day] = appData.schedule[day]?.[session.key]?.[i]?.subject || ''; });
                data.push(row);
            }
        });

        if (document.documentElement.classList.contains('dark')) spreadsheetEl.classList.add('htDark');

        handsontableInstance = new Handsontable(spreadsheetEl, {
            data: data,
            rowHeaders: true,
            colHeaders: ['Buổi', 'Tiết', ...days],
            columns: [
                { data: 'session', readOnly: true },
                { data: 'period', readOnly: true },
                ...days.map(day => ({ data: day, wordWrap: true })) // Bật wordWrap để nhập được nhiều dòng
            ],
            mergeCells: [ { row: 0, col: 0, rowspan: 5, colspan: 1 }, { row: 5, col: 0, rowspan: 5, colspan: 1 } ],
            autoRowSize: true, // Tự động điều chỉnh kích thước hàng khi có nhiều dòng văn bản
            width: '100%',
            height: '100%',
            licenseKey: 'non-commercial-and-evaluation'
        });

        dom.modalContainer.querySelector('[data-action="modal-save"]').onclick = () => {
            const updatedData = handsontableInstance.getSourceData();
            sessions.forEach((session, sIdx) => {
                for (let i = 0; i < 5; i++) {
                     const rIdx = sIdx * 5 + i;
                     days.forEach(day => {
                         if (!appData.schedule[day]) appData.schedule[day] = { morning: [], afternoon: [] };
                         if (!appData.schedule[day][session.key]) appData.schedule[day][session.key] = Array(5).fill({ subject: '' });
                         appData.schedule[day][session.key][i] = { subject: updatedData[rIdx][day] };
                     });
                }
            });
            markAsDirty(); renderScheduleSection(); closeModal();
        };
    }});
}

async function showMediaForm(mediaId = null) {
    const media = mediaId ? appData.media.find(m => m.id === mediaId) : { type: 'image', url: '', caption: '' };
    const contentHTML = `
        <form id="media-form" data-id="${mediaId || ''}" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Loại Media</label>
                <select name="type" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 p-2">
                    <option value="image" ${media.type === 'image' ? 'selected' : ''}>Hình ảnh</option>
                    <option value="video" ${media.type === 'video' ? 'selected' : ''}>Video</option>
                    <option value="audio" ${media.type === 'audio' ? 'selected' : ''}>Âm thanh</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">URL</label>
                <input type="text" name="url" value="${media.url}" required class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 p-2">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Mô tả / Chú thích</label>
                <textarea name="caption" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 p-2">${media.caption || ''}</textarea>
            </div>
            <div class="flex justify-end gap-3 mt-6">
                <button type="button" data-action="modal-cancel" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-100">Hủy</button>
                <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Lưu lại</button>
            </div>
        </form>`;
    openModal({ title: mediaId ? 'Sửa Media' : 'Thêm Media từ URL', contentHTML });
}

async function showChangePasswordForm() {
    const contentHTML = `
        <form id="change-password-form" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Mật khẩu hiện tại</label>
                <input type="password" name="currentPassword" required class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 p-2">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Mật khẩu mới</label>
                <input type="password" name="newPassword" required minlength="6" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 p-2">
            </div>
            <p id="password-error" class="text-red-500 text-sm"></p>
            <div class="flex justify-end gap-3 mt-6">
                <button type="button" data-action="modal-cancel" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg dark:bg-gray-600 dark:text-gray-100">Hủy</button>
                <button type="submit" class="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">Cập nhật</button>
            </div>
        </form>`;
    openModal({ title: 'Đổi mật khẩu truy cập', contentHTML, size: 'max-w-md' });
}

async function handleChangePassword(form) {
    const currentPassword = form.currentPassword.value;
    const newPassword = form.newPassword.value;
    const errorEl = document.getElementById('password-error');
    errorEl.textContent = 'Đang xử lý...';
    const result = await updatePassword({ currentPassword, newPassword, authToken: sessionAuthToken });
    if (result.success) {
        sessionAuthToken = result.newToken;
        alert('Đổi mật khẩu thành công!'); closeModal();
    } else {
        errorEl.textContent = result.message;
    }
}

// --- EVENT LISTENERS --- //

function setupEventListeners() {
    dom.editContainer.addEventListener('change', e => {
        if (e.target.dataset.action === 'upload-media') handleFileUploads(e.target.files);
    });

    dom.editContainer.addEventListener('click', e => {
        const button = e.target.closest('button, [data-action], [data-accordion-id]');
        if (!button) return;
        const { action, accordionId } = button.dataset;
        const id = e.target.closest('[data-id]')?.dataset.id;
        
        if (action === 'sync') handleSync();
        else if (action === 'toggle-accordion') toggleAccordion(accordionId);
        else if (action === 'edit-classlist-spreadsheet') showClassListSpreadsheet();
        else if (action === 'edit-schedule-spreadsheet') showScheduleSpreadsheet();
        else if (action === 'add-media-url') showMediaForm();
        else if (action === 'edit-media') showMediaForm(id);
        else if (action === 'delete-media') {
            if (confirm('Bạn có chắc muốn xóa mục này?')) { appData.media = appData.media.filter(m => m.id !== id); markAsDirty(); renderGallerySection(); }
        } else if (action === 'toggle-select-mode') { isSelectionMode = !isSelectionMode; if (!isSelectionMode) selectedMediaIds.clear(); renderGallerySection(); }
        else if (action === 'toggle-select-media' && id) { selectedMediaIds.has(id) ? selectedMediaIds.delete(id) : selectedMediaIds.add(id); renderGallerySection(); }
        else if (action === 'select-all-media') { appData.media.forEach(m => selectedMediaIds.add(m.id)); renderGallerySection(); }
        else if (action === 'deselect-all-media') { selectedMediaIds.clear(); renderGallerySection(); }
        else if (action === 'delete-selected-media') {
            if (confirm(`Xóa ${selectedMediaIds.size} mục đã chọn?`)) {
                appData.media = appData.media.filter(m => !selectedMediaIds.has(m.id));
                selectedMediaIds.clear(); isSelectionMode = false; markAsDirty(); renderGallerySection();
            }
        } else if (action === 'change-password') showChangePasswordForm();
    });

    dom.modalContainer.addEventListener('click', e => {
        const action = e.target.closest('[data-action]')?.dataset.action;
        if (e.target.id === 'modal-backdrop' || action === 'modal-close' || action === 'modal-cancel') closeModal();
    });

    dom.modalContainer.addEventListener('submit', async e => {
        e.preventDefault();
        const form = e.target;
        if (form.id === 'media-form') {
            const id = form.dataset.id;
            const updated = { id: id || crypto.randomUUID(), type: form.type.value, url: form.url.value, caption: form.caption.value };
            if (id) appData.media = appData.media.map(m => m.id === id ? updated : m); else appData.media.push(updated);
            markAsDirty(); renderGallerySection(); closeModal();
        } else if (form.id === 'change-password-form') handleChangePassword(form);
    });
}

// --- INITIALIZATION --- //

async function init() {
    dom.authContainer = document.getElementById('auth-container');
    dom.editContainer = document.getElementById('edit-container');
    dom.modalContainer = document.getElementById('modal-container');
    setupEventListeners();
    renderAuthForm();
}

document.addEventListener('DOMContentLoaded', init);
