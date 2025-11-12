// v1.33 - KV Password Storage
import { fetchAppData, getAppDataFromStorage, saveAppDataToStorage, saveAppDataToKV, fetchPasswordHash, updatePasswordOnKV } from './data.js';
import { hashPassword } from './auth.js';
import { renderGallery, renderClassList, renderSchedule } from './ui.js';

let appData = null;
let sessionAuthToken = null; // Lưu trữ hash mật khẩu sau khi đăng nhập thành công

// Khai báo các biến chứa phần tử DOM ở phạm vi module để các hàm có thể truy cập
let authContainer;
let editContainer;
let modalContainer;

function renderAuthForm(storedHash) {
    const title = 'Đăng nhập';
    const description = `Vui lòng nhập mật khẩu để tiếp tục.<br>Nếu là lần đầu mật khẩu có thể là <strong>000000</strong>.`;

    authContainer.innerHTML = `
        <div class="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
            <div class="max-w-md w-full bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 space-y-6">
                <div class="text-center">
                    <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white">${title}</h2>
                    <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">${description}</p>
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
            sessionAuthToken = inputHash; // Lưu hash vào session để sử dụng sau
            await showEditPage();
        } else {
            errorEl.textContent = 'Mật khẩu không đúng. Vui lòng thử lại.';
            button.disabled = false;
            button.textContent = 'Đăng nhập';
        }
    });
}

function updateSyncState(isDirty, message = '') {
    const button = document.getElementById('sync-kv-btn');
    const statusEl = document.getElementById('sync-status');
    if (!button || !statusEl) return;

    if (isDirty) {
        button.disabled = false;
        button.textContent = 'Lưu và Đồng bộ thay đổi';
        if (message) {
            statusEl.innerHTML = `<p class="text-sm mt-2 text-yellow-600 dark:text-yellow-400">${message}</p>`;
        } else {
            statusEl.innerHTML = `<p class="text-sm mt-2 text-yellow-600 dark:text-yellow-400">Bạn có thay đổi chưa được đồng bộ.</p>`;
        }
    } else {
        button.disabled = true;
        button.textContent = 'Đã đồng bộ';
         if (message) {
            statusEl.innerHTML = `
                <div class="mt-2 text-sm text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/20 border border-green-400 rounded-md p-3">
                    ${message}
                </div>
            `;
        } else {
            statusEl.innerHTML = `<p class="text-sm mt-2 text-green-600 dark:text-green-400">Dữ liệu đã được đồng bộ và cập nhật.</p>`;
        }
    }
}


function updateAndSaveChanges() {
    saveAppDataToStorage(appData);
    updateSyncState(true);
}


function renderEditPage() {
    if (!appData) return;

    editContainer.innerHTML = `
        <div class="min-h-screen bg-gray-50 dark:bg-gray-800 p-4 sm:p-6 lg:p-8">
            <div class="max-w-7xl mx-auto">
                <header class="flex flex-wrap justify-between items-center gap-4 mb-8 pb-4 border-b-2 border-teal-500">
                    <div>
                        <h1 class="text-4xl font-bold text-teal-600 dark:text-teal-400">Chỉnh sửa thông tin Lớp 8/4</h1>
                        <p class="text-lg text-gray-600 dark:text-gray-300 mt-1">Lưu trữ trên Cloudflare KV (v1.33)</p>
                    </div>
                    <div class="flex items-center space-x-4">
                        <button id="change-password-btn" class="px-4 py-2 bg-yellow-500 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-600 transition-colors">
                            Đổi Mật khẩu
                        </button>
                        <a href="../view/" class="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 transition-colors">
                            Xem trang
                        </a>
                    </div>
                </header>
                <main id="edit-main" class="space-y-12">
                     <section class="bg-blue-50 dark:bg-gray-800 border-l-4 border-blue-400 p-4 rounded-r-lg">
                        <h2 class="text-xl font-bold text-blue-800 dark:text-blue-300">Đồng bộ hóa Dữ liệu</h2>
                        <div class="mt-2 text-blue-700 dark:text-blue-200 space-y-2">
                            <p>Mọi thay đổi sẽ được lưu vào trình duyệt. Khi bạn sẵn sàng, hãy nhấn nút bên dưới để đồng bộ dữ liệu lên máy chủ Cloudflare.</p>
                            <div class="mt-4">
                                <button id="sync-kv-btn" class="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-all">
                                    Lưu và Đồng bộ thay đổi
                                </button>
                                <div id="sync-status" class="mt-2"></div>
                            </div>
                        </div>
                    </section>
                    <section class="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6">
                        <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6 border-l-4 border-teal-500 pl-4">Quản lý Thư viện Ảnh/Video</h2>
                        <div class="mb-4 text-right">
                          <button data-action="add-media" class="px-4 py-2 bg-teal-500 text-white font-semibold rounded-lg shadow-md hover:bg-teal-600">Thêm Ảnh/Video</button>
                        </div>
                        <div id="gallery-container"></div>
                    </section>
                    <section class="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6">
                        <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6 border-l-4 border-teal-500 pl-4">Quản lý Danh sách Lớp</h2>
                        <div class="mb-4 text-right">
                          <button data-action="add-student" class="px-4 py-2 bg-teal-500 text-white font-semibold rounded-lg shadow-md hover:bg-teal-600">Thêm Học sinh</button>
                        </div>
                        <div id="classlist-container"></div>
                    </section>
                    <section class="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6">
                        <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6 border-l-4 border-teal-500 pl-4">Quản lý Thời khóa biểu</h2>
                        <div id="schedule-container"></div>
                    </section>
                </main>
                <footer class="text-center mt-12 text-gray-500 dark:text-gray-400">
                    <p>&copy; ${new Date().getFullYear()} Lớp 8/4. Chế độ chỉnh sửa.</p>
                    <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">v1.33</p>
                </footer>
            </div>
        </div>
    `;
    document.getElementById('gallery-container').innerHTML = renderGallery(appData.media, true);
    document.getElementById('classlist-container').innerHTML = renderClassList(appData.students, true);
    document.getElementById('schedule-container').innerHTML = renderSchedule(appData.schedule, true);
    
    document.getElementById('sync-kv-btn').addEventListener('click', handleSyncToKV);
    document.getElementById('change-password-btn').addEventListener('click', showChangePasswordForm);
    
    updateSyncState(false, 'Dữ liệu đã được đồng bộ và cập nhật.');
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
    const button = document.getElementById('sync-kv-btn');
    const statusEl = document.getElementById('sync-status');
    
    button.disabled = true;
    button.textContent = 'Đang đồng bộ...';
    statusEl.innerHTML = `<p class="text-sm mt-2 text-blue-600 dark:text-blue-400">Đang gửi dữ liệu đến máy chủ Cloudflare...</p>`;

    if (!sessionAuthToken) {
        statusEl.innerHTML = `<p class="text-sm mt-2 text-red-600 dark:text-red-400">Lỗi xác thực nghiêm trọng. Vui lòng tải lại trang và đăng nhập lại.</p>`;
        return;
    }

    const dataToSync = getAppDataFromStorage();
    if (!dataToSync) {
        statusEl.innerHTML = `<p class="text-sm mt-2 text-red-600 dark:text-red-400">Lỗi: Không tìm thấy dữ liệu để đồng bộ.</p>`;
        button.disabled = false; 
        button.textContent = 'Thử lại Đồng bộ';
        return;
    }
    
    const result = await saveAppDataToKV(dataToSync, sessionAuthToken);

    if (result.success) {
        updateSyncState(false, result.message);
    } else {
        statusEl.innerHTML = `
             <div class="mt-2 text-sm text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/20 border border-red-400 rounded-md p-3">
                <strong>Đồng bộ thất bại:</strong>
                <p class="mt-1"><code>${result.message}</code></p>
            </div>
        `;
        button.disabled = false;
        button.textContent = 'Thử lại Đồng bộ';
    }
}

function openModal(title, contentHTML) {
    modalContainer.innerHTML = `
        <div id="modal-backdrop" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-full overflow-y-auto">
                <div class="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white">${title}</h3>
                    <button id="modal-close-btn" class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                    </button>
                </div>
                <div class="p-6">${contentHTML}</div>
            </div>
        </div>`;
}

function closeModal() {
    modalContainer.innerHTML = '';
}

function showStudentForm(studentId = null) {
    const isEditing = studentId !== null;
    const student = isEditing ? appData.students.find(s => s.id === studentId) : { name: '', studentId: '', dob: '', phone: '', notes: '' };
    const title = isEditing ? 'Sửa thông tin học sinh' : 'Thêm học sinh';

    const formHTML = `
        <form id="student-form" data-id="${studentId || ''}" class="space-y-4">
            <input type="text" name="name" value="${student.name || ''}" placeholder="Họ và Tên" required class="block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
            <input type="text" name="studentId" value="${student.studentId || ''}" placeholder="Mã học sinh" required class="block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
            <input type="date" name="dob" value="${student.dob || ''}" placeholder="Ngày sinh" required class="block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
            <input type="tel" name="phone" value="${student.phone || ''}" placeholder="Số điện thoại" required class="block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
            <textarea name="notes" placeholder="Ghi chú" class="block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">${student.notes || ''}</textarea>
            <div class="flex justify-end space-x-2">
                <button type="button" id="form-cancel-btn" class="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500">Hủy</button>
                <button type="submit" class="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600">Lưu</button>
            </div>
        </form>
    `;
    openModal(title, formHTML);
}

function showMediaForm(mediaId = null) {
    const isEditing = mediaId !== null;
    const item = isEditing ? appData.media.find(m => m.id === mediaId) : { type: 'image', url: '', caption: '' };
    const title = isEditing ? 'Sửa Ảnh/Video' : 'Thêm Ảnh/Video';

    const formHTML = `
        <form id="media-form" data-id="${mediaId || ''}" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Loại</label>
                <select name="type" class="mt-1 block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                    <option value="image" ${item.type === 'image' ? 'selected' : ''}>Hình ảnh</option>
                    <option value="video" ${item.type === 'video' ? 'selected' : ''}>Video (URL)</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">URL</label>
                <input type="text" name="url" value="${item.url || ''}" required class="mt-1 block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" placeholder="https://..."/>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Chú thích</label>
                <textarea name="caption" class="mt-1 block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">${item.caption || ''}</textarea>
            </div>
            <div class="flex justify-end space-x-2">
                <button type="button" id="form-cancel-btn" class="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500">Hủy</button>
                <button type="submit" class="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600">Lưu</button>
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
            <input type="password" name="currentPassword" placeholder="Mật khẩu hiện tại" required class="block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
            <input type="password" name="newPassword" placeholder="Mật khẩu mới (ít nhất 6 ký tự)" required class="block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
            <input type="password" name="confirmNewPassword" placeholder="Xác nhận mật khẩu mới" required class="block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
            <div class="flex justify-end space-x-2">
                <button type="button" id="form-cancel-btn" class="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500">Hủy</button>
                <button type="submit" class="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600">Lưu thay đổi</button>
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

        // --- Auth Flow ---
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