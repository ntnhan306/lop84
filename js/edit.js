// v2.0 - UI Overhaul
import { fetchAppData, getAppDataFromStorage, saveAppDataToStorage, saveAppDataToKV, fetchPasswordHash, updatePasswordOnKV } from './data.js';
import { hashPassword } from './auth.js';
import { renderGallery, renderClassList, renderSchedule, icons } from './ui.js';

let appData = null;
let sessionAuthToken = null; // Stores the password hash after successful login

// Module-scoped DOM elements
let authContainer;
let editContainer;
let modalContainer;

function renderAuthForm(storedHash) {
    authContainer.innerHTML = `
        <div class="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
            <div class="max-w-md w-full bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 space-y-6">
                <div class="text-center">
                    <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white">Trang Chỉnh sửa</h2>
                    <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Vui lòng nhập mật khẩu để tiếp tục.<br>Nếu là lần đầu, mật khẩu mặc định là <strong>000000</strong>.</p>
                </div>
                <form id="auth-form" class="space-y-6">
                    <div>
                        <label for="password" class="sr-only">Mật khẩu</label>
                        <input id="password" name="password" type="password" required class="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Mật khẩu">
                    </div>
                    <p id="auth-error" class="text-red-500 text-sm text-center"></p>
                    <div>
                        <button type="submit" class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400">
                            Đăng nhập
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('auth-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const button = e.target.querySelector('button');
        button.disabled = true;
        button.textContent = 'Đang xử lý...';
        
        const password = e.target.password.value;
        const errorEl = document.getElementById('auth-error');
        errorEl.textContent = '';

        const inputHash = await hashPassword(password);
        if (inputHash === storedHash) {
            sessionAuthToken = inputHash;
            await showEditPage();
        } else {
            errorEl.textContent = 'Mật khẩu không đúng. Vui lòng thử lại.';
            button.disabled = false;
            button.textContent = 'Đăng nhập';
        }
    });
}

function updateSyncState({ status, message = '' }) {
    const wrapper = document.getElementById('sync-wrapper');
    const iconEl = document.getElementById('sync-icon');
    const titleEl = document.getElementById('sync-title');
    const messageEl = document.getElementById('sync-message');
    const button = document.getElementById('sync-kv-btn');
    if (!wrapper || !iconEl || !titleEl || !messageEl || !button) return;

    // Reset classes
    wrapper.className = 'flex items-center gap-4 p-4 rounded-lg border-l-4 transition-colors';
    
    switch(status) {
        case 'dirty':
            wrapper.classList.add('bg-yellow-50', 'dark:bg-yellow-900/20', 'border-yellow-400');
            iconEl.innerHTML = icons.warning;
            iconEl.className = 'text-yellow-500';
            titleEl.textContent = 'Có thay đổi chưa lưu';
            messageEl.textContent = message || 'Nhấn nút bên cạnh để lưu và đồng bộ dữ liệu.';
            button.disabled = false;
            button.innerHTML = `<span>Lưu và Đồng bộ</span>`;
            break;
        case 'syncing':
            wrapper.classList.add('bg-blue-50', 'dark:bg-blue-900/20', 'border-blue-400');
            iconEl.innerHTML = `<svg class="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
            iconEl.className = '';
            titleEl.textContent = 'Đang đồng bộ...';
            messageEl.textContent = 'Đang gửi dữ liệu đến máy chủ Cloudflare.';
            button.disabled = true;
            button.innerHTML = `<span>Đang xử lý...</span>`;
            break;
        case 'synced':
            wrapper.classList.add('bg-green-50', 'dark:bg-green-900/20', 'border-green-400');
            iconEl.innerHTML = icons.check;
            iconEl.className = 'text-green-500';
            titleEl.textContent = 'Đã đồng bộ';
            messageEl.textContent = message || 'Tất cả dữ liệu đã được cập nhật thành công.';
            button.disabled = true;
            button.innerHTML = `<span>Đã lưu</span>`;
            break;
        case 'error':
             wrapper.classList.add('bg-red-50', 'dark:bg-red-900/20', 'border-red-400');
            iconEl.innerHTML = icons.error;
            iconEl.className = 'text-red-500';
            titleEl.textContent = 'Đồng bộ thất bại';
            messageEl.textContent = message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
            button.disabled = false;
            button.innerHTML = `<span>Thử lại</span>`;
            break;
    }
}

function updateAndSaveChanges() {
    saveAppDataToStorage(appData);
    updateSyncState({ status: 'dirty' });
}

function renderEditPage() {
    if (!appData) return;

    editContainer.innerHTML = `
        <div class="min-h-screen bg-gray-50 dark:bg-gray-800 p-4 sm:p-6 lg:p-8">
            <div class="max-w-7xl mx-auto">
                <header class="flex flex-wrap justify-between items-center gap-4 mb-8 pb-4 border-b-2 border-teal-500">
                    <div>
                        <h1 class="text-4xl font-bold text-teal-600 dark:text-teal-400">Chỉnh sửa Lớp 8/4</h1>
                        <p class="text-lg text-gray-600 dark:text-gray-300 mt-1">Giao diện quản trị v2.0</p>
                    </div>
                    <div class="flex items-center flex-wrap gap-2">
                        <button id="change-password-btn" class="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-600 transition-colors">
                            ${icons.key}<span>Đổi Mật khẩu</span>
                        </button>
                        <a href="../view/" class="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 transition-colors">
                            ${icons.gallery}<span>Xem trang</span>
                        </a>
                    </div>
                </header>
                <main id="edit-main" class="space-y-12">
                    <section id="sync-section">
                        <div id="sync-wrapper">
                            <div id="sync-icon"></div>
                            <div class="flex-grow">
                                <p id="sync-title" class="font-semibold"></p>
                                <p id="sync-message" class="text-sm"></p>
                            </div>
                            <button id="sync-kv-btn" class="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-all"></button>
                        </div>
                    </section>
                    <section class="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6">
                        <div class="flex flex-wrap justify-between items-center gap-4 mb-6">
                           <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200">Quản lý Thư viện</h2>
                           <button data-action="add-media" class="inline-flex items-center gap-2 px-4 py-2 bg-teal-500 text-white font-semibold rounded-lg shadow-md hover:bg-teal-600">${icons.plus}<span>Thêm Media</span></button>
                        </div>
                        <div id="gallery-container"></div>
                    </section>
                    <section class="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6">
                         <div class="flex flex-wrap justify-between items-center gap-4 mb-6">
                           <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200">Quản lý Danh sách Lớp</h2>
                           <button data-action="add-student" class="inline-flex items-center gap-2 px-4 py-2 bg-teal-500 text-white font-semibold rounded-lg shadow-md hover:bg-teal-600">${icons.plus}<span>Thêm Học sinh</span></button>
                        </div>
                        <div id="classlist-container"></div>
                    </section>
                    <section class="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6">
                        <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">Quản lý Thời khóa biểu</h2>
                        <div id="schedule-container"></div>
                    </section>
                </main>
                <footer class="text-center mt-12 text-gray-500 dark:text-gray-400">
                    <p>&copy; ${new Date().getFullYear()} Lớp 8/4. Chế độ chỉnh sửa.</p>
                    <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">v2.0</p>
                </footer>
            </div>
        </div>
    `;
    document.getElementById('gallery-container').innerHTML = renderGallery(appData.media, true);
    document.getElementById('classlist-container').innerHTML = renderClassList(appData.students, true);
    document.getElementById('schedule-container').innerHTML = renderSchedule(appData.schedule, true);
    
    document.getElementById('sync-kv-btn').addEventListener('click', handleSyncToKV);
    document.getElementById('change-password-btn').addEventListener('click', showChangePasswordForm);
    
    updateSyncState({ status: 'synced', message: 'Dữ liệu đã được tải về và sẵn sàng để chỉnh sửa.' });
}

async function showEditPage() {
    authContainer.innerHTML = `<div class="flex items-center justify-center h-screen">Đang tải dữ liệu mới nhất...</div>`;
    appData = await fetchAppData();
    saveAppDataToStorage(appData);
    authContainer.classList.add('hidden');
    editContainer.classList.remove('hidden');
    renderEditPage();
}

async function handleSyncToKV() {
    updateSyncState({ status: 'syncing' });

    if (!sessionAuthToken) {
        updateSyncState({ status: 'error', message: 'Lỗi xác thực. Vui lòng đăng nhập lại.' });
        return;
    }

    const dataToSync = getAppDataFromStorage();
    if (!dataToSync) {
        updateSyncState({ status: 'error', message: 'Lỗi: Không tìm thấy dữ liệu để đồng bộ.' });
        return;
    }
    
    const result = await saveAppDataToKV(dataToSync, sessionAuthToken);

    if (result.success) {
        updateSyncState({ status: 'synced', message: result.message });
    } else {
        updateSyncState({ status: 'error', message: result.message });
    }
}

function openModal(title, contentHTML, size = 'max-w-lg') {
    modalContainer.innerHTML = `
        <div id="modal-backdrop" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity duration-300 ease-in-out" style="opacity: 0;">
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full ${size} max-h-full overflow-y-auto transform scale-95 transition-all duration-300 ease-in-out" style="opacity: 0;">
                <div class="flex justify-between items-center p-4 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white">${title}</h3>
                    <button id="modal-close-btn" class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                    </button>
                </div>
                <div class="p-6">${contentHTML}</div>
            </div>
        </div>`;

    // Trigger animations
    setTimeout(() => {
        const backdrop = document.getElementById('modal-backdrop');
        const modal = backdrop.querySelector(':scope > div');
        if(backdrop) backdrop.style.opacity = '1';
        if(modal) {
          modal.style.opacity = '1';
          modal.style.transform = 'scale(1)';
        }
    }, 10);
}

function closeModal() {
    const backdrop = document.getElementById('modal-backdrop');
    if (backdrop) {
        const modal = backdrop.querySelector(':scope > div');
        backdrop.style.opacity = '0';
        if (modal) {
            modal.style.opacity = '0';
            modal.style.transform = 'scale(0.95)';
        }
        setTimeout(() => { modalContainer.innerHTML = '' }, 300); // Remove from DOM after animation
    }
}

function showStudentForm(studentId = null) {
    const isEditing = studentId !== null;
    const student = isEditing ? appData.students.find(s => s.id === studentId) : {};
    const title = isEditing ? 'Sửa thông tin học sinh' : 'Thêm học sinh mới';

    const formHTML = `
        <form id="student-form" data-id="${studentId || ''}" class="space-y-4">
            <input type="text" name="name" value="${student.name || ''}" placeholder="Họ và Tên" required class="block w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"/>
            <input type="text" name="studentId" value="${student.studentId || ''}" placeholder="Mã học sinh" required class="block w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"/>
            <input type="date" name="dob" value="${student.dob || ''}" placeholder="Ngày sinh" required class="block w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"/>
            <input type="tel" name="phone" value="${student.phone || ''}" placeholder="Số điện thoại" required class="block w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"/>
            <textarea name="notes" placeholder="Ghi chú (nếu có)" class="block w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 h-24">${student.notes || ''}</textarea>
            <div class="flex justify-end space-x-3 pt-4">
                <button type="button" id="form-cancel-btn" class="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500 transition-colors">Hủy</button>
                <button type="submit" class="px-4 py-2 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-600 transition-colors">Lưu</button>
            </div>
        </form>
    `;
    openModal(title, formHTML);
}

function showMediaForm(mediaId = null) {
    const isEditing = mediaId !== null;
    const item = isEditing ? appData.media.find(m => m.id === mediaId) : { type: 'image' };
    const title = isEditing ? 'Sửa Media' : 'Thêm Media mới';

    const formHTML = `
        <form id="media-form" data-id="${mediaId || ''}" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Loại</label>
                <select name="type" class="block w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="image" ${item.type === 'image' ? 'selected' : ''}>Hình ảnh (URL)</option>
                    <option value="video" ${item.type === 'video' ? 'selected' : ''}>Video (URL)</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nguồn (URL)</label>
                <input type="text" name="url" value="${item.url || ''}" required class="block w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500" placeholder="https://..."/>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chú thích</label>
                <textarea name="caption" class="block w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 h-24" placeholder="Mô tả ngắn...">${item.caption || ''}</textarea>
            </div>
            <div class="flex justify-end space-x-3 pt-4">
                <button type="button" id="form-cancel-btn" class="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500 transition-colors">Hủy</button>
                <button type="submit" class="px-4 py-2 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-600 transition-colors">Lưu</button>
            </div>
        </form>
    `;
    openModal(title, formHTML);
}

function showChangePasswordForm() {
    const title = 'Đổi Mật khẩu';
    const formHTML = `
        <form id="change-password-form" class="space-y-4">
            <p id="change-pass-error" class="text-red-500 text-sm"></p>
            <p id="change-pass-success" class="text-green-500 text-sm"></p>
            <input type="password" name="currentPassword" placeholder="Mật khẩu hiện tại" required class="block w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"/>
            <input type="password" name="newPassword" placeholder="Mật khẩu mới (ít nhất 6 ký tự)" required class="block w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"/>
            <input type="password" name="confirmNewPassword" placeholder="Xác nhận mật khẩu mới" required class="block w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"/>
            <div class="flex justify-end space-x-3 pt-4">
                 <button type="button" id="form-cancel-btn" class="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500 transition-colors">Hủy</button>
                <button type="submit" class="px-4 py-2 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition-colors">Lưu thay đổi</button>
            </div>
        </form>
    `;
    openModal(title, formHTML);
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        authContainer = document.getElementById('auth-container');
        editContainer = document.getElementById('edit-container');
        modalContainer = document.getElementById('modal-container');

        if (!authContainer || !editContainer || !modalContainer) {
            throw new Error("Không thể khởi tạo giao diện. Một hoặc nhiều vùng chứa chính (container) không được tìm thấy trong DOM.");
        }

        editContainer.addEventListener('input', (e) => {
            const target = e.target;
            if (target.matches('#schedule-container input')) {
                const { day, session, period } = target.dataset;
                appData.schedule[day][session][parseInt(period)].subject = target.value;
                updateAndSaveChanges();
            }
        });

        editContainer.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]')?.dataset.action;
            if (!action) return;
            const id = e.target.closest('[data-id]')?.dataset.id;

            switch (action) {
                case 'add-student': showStudentForm(); break;
                case 'edit-student': showStudentForm(id); break;
                case 'delete-student':
                    if (confirm('Bạn có chắc muốn xóa học sinh này?')) {
                        appData.students = appData.students.filter(s => s.id !== id);
                        updateAndSaveChanges();
                        document.getElementById('classlist-container').innerHTML = renderClassList(appData.students, true);
                    }
                    break;
                case 'add-media': showMediaForm(); break;
                case 'edit-media': showMediaForm(id); break;
                case 'delete-media':
                    if (confirm('Bạn có chắc muốn xóa mục này?')) {
                        appData.media = appData.media.filter(m => m.id !== id);
                        updateAndSaveChanges();
                        document.getElementById('gallery-container').innerHTML = renderGallery(appData.media, true);
                    }
                    break;
            }
        });

        modalContainer.addEventListener('click', (e) => {
            if (e.target.id === 'modal-backdrop' || e.target.id === 'modal-close-btn' || e.target.closest('#modal-close-btn') || e.target.id === 'form-cancel-btn') {
                closeModal();
            }
        });

        modalContainer.addEventListener('submit', async (e) => {
            e.preventDefault();
            const form = e.target;
            const id = form.dataset.id;

            if (form.id === 'student-form') {
                const updatedStudent = { id: id || crypto.randomUUID(), name: form.name.value, studentId: form.studentId.value, dob: form.dob.value, phone: form.phone.value, notes: form.notes.value };
                if (id) { appData.students = appData.students.map(s => s.id === id ? updatedStudent : s); } else { appData.students.push(updatedStudent); }
                updateAndSaveChanges();
                document.getElementById('classlist-container').innerHTML = renderClassList(appData.students, true);
                closeModal();
            } else if (form.id === 'media-form') {
                const updatedMedia = { id: id || crypto.randomUUID(), type: form.type.value, url: form.url.value, caption: form.caption.value };
                if (id) { appData.media = appData.media.map(m => m.id === id ? updatedMedia : m); } else { appData.media.push(updatedMedia); }
                updateAndSaveChanges();
                document.getElementById('gallery-container').innerHTML = renderGallery(appData.media, true);
                closeModal();
            } else if (form.id === 'change-password-form') {
                const currentPassword = form.currentPassword.value;
                const newPassword = form.newPassword.value;
                const confirmNewPassword = form.confirmNewPassword.value;
                const errorEl = document.getElementById('change-pass-error');
                const successEl = document.getElementById('change-pass-success');
                const submitBtn = form.querySelector('button[type="submit"]');
                errorEl.textContent = ''; successEl.textContent = '';

                if (newPassword !== confirmNewPassword) { errorEl.textContent = 'Mật khẩu mới không khớp.'; return; }
                if (newPassword.length < 6) { errorEl.textContent = 'Mật khẩu mới phải có ít nhất 6 ký tự.'; return; }
                
                const currentPasswordHash = await hashPassword(currentPassword);
                if (currentPasswordHash !== sessionAuthToken) { errorEl.textContent = 'Mật khẩu hiện tại không đúng.'; return; }
                
                const newPasswordHash = await hashPassword(newPassword);
                submitBtn.disabled = true;
                submitBtn.textContent = 'Đang lưu...';

                const result = await updatePasswordOnKV({ currentPasswordHash, newPasswordHash });

                if (result.success) {
                    sessionAuthToken = newPasswordHash;
                    successEl.textContent = 'Mật khẩu đã được thay đổi! Cửa sổ sẽ đóng sau 3 giây.';
                    setTimeout(() => closeModal(), 3000);
                } else {
                    errorEl.textContent = `Lỗi: ${result.message}`;
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Lưu thay đổi';
                }
            }
        });

        authContainer.innerHTML = `<div class="flex items-center justify-center h-screen">Đang kết nối đến máy chủ xác thực...</div>`;
        const storedHash = await fetchPasswordHash();
        if (storedHash) {
            renderAuthForm(storedHash);
        } else {
            authContainer.innerHTML = `<div class="flex items-center justify-center h-screen text-red-500 p-4 text-center">Không thể lấy thông tin xác thực từ máy chủ. Vui lòng kiểm tra lại cấu hình Worker và kết nối mạng.</div>`;
        }

    } catch (error) {
        console.error("Lỗi nghiêm trọng khi khởi tạo trang chỉnh sửa:", error);
        document.body.innerHTML = `
            <div class="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4">
                <div class="max-w-lg w-full bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8">
                    <h1 class="text-2xl font-bold text-red-600 dark:text-red-400 text-center">Đã xảy ra lỗi nghiêm trọng</h1>
                    <p class="mt-2 text-center text-gray-600 dark:text-gray-300">Trang chỉnh sửa không thể tải. Vui lòng thử làm mới trang hoặc liên hệ quản trị viên.</p>
                    <div class="mt-4 text-left bg-gray-100 dark:bg-gray-900 p-4 rounded-md font-mono text-sm text-red-500 dark:text-red-300 overflow-auto">
                        <p class="font-semibold">Thông tin lỗi:</p>
                        <pre class="mt-1 whitespace-pre-wrap">${error.stack || error.message}</pre>
                    </div>
                </div>
            </div>
        `;
    }
});