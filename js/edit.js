import { getAppData, saveAppData } from './data.js';
import { getPasswordHash, setPasswordHash, hashPassword } from './auth.js';
import { renderGallery, renderClassList, renderSchedule } from './ui.js';

let appData = getAppData();

const authContainer = document.getElementById('auth-container');
const editContainer = document.getElementById('edit-container');
const modalContainer = document.getElementById('modal-container');

function renderAuthForm(type) {
    const isSettingPassword = type === 'set';
    const title = isSettingPassword ? 'Thiết lập Mật khẩu' : 'Đăng nhập';
    const description = isSettingPassword 
        ? 'Đây là lần đầu tiên bạn truy cập trang chỉnh sửa. Vui lòng tạo một mật khẩu để bảo vệ dữ liệu.' 
        : 'Vui lòng nhập mật khẩu để truy cập trang chỉnh sửa.';
    const buttonText = isSettingPassword ? 'Lưu Mật khẩu' : 'Đăng nhập';

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
                    ${isSettingPassword ? `
                    <div>
                        <label for="confirm-password" class="sr-only">Xác nhận Mật khẩu</label>
                        <input id="confirm-password" name="confirm-password" type="password" required class="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Xác nhận Mật khẩu">
                    </div>
                    ` : ''}
                    <p id="auth-error" class="text-red-500 text-sm text-center"></p>
                    <div>
                        <button type="submit" class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400">
                            ${buttonText}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('auth-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = e.target.password.value;
        const errorEl = document.getElementById('auth-error');
        errorEl.textContent = '';

        if (isSettingPassword) {
            const confirmPassword = e.target['confirm-password'].value;
            if (password !== confirmPassword) {
                errorEl.textContent = 'Mật khẩu không khớp.';
                return;
            }
            if (password.length < 6) {
                errorEl.textContent = 'Mật khẩu phải có ít nhất 6 ký tự.';
                return;
            }
            const newHash = await hashPassword(password);
            setPasswordHash(newHash);
            showEditPage();
        } else {
            const storedHash = getPasswordHash();
            const inputHash = await hashPassword(password);
            if (inputHash === storedHash) {
                showEditPage();
            } else {
                errorEl.textContent = 'Mật khẩu không đúng. Vui lòng thử lại.';
            }
        }
    });
}

function renderEditPage() {
    editContainer.innerHTML = `
        <div class="min-h-screen bg-gray-50 dark:bg-gray-800 p-4 sm:p-6 lg:p-8">
            <div class="max-w-7xl mx-auto">
                <header class="flex justify-between items-center mb-8 pb-4 border-b-2 border-teal-500">
                    <div>
                        <h1 class="text-4xl font-bold text-teal-600 dark:text-teal-400">Chỉnh sửa thông tin Lớp 8/4</h1>
                        <p class="text-lg text-gray-600 dark:text-gray-300 mt-1">Thêm, sửa, xóa dữ liệu</p>
                    </div>
                    <a href="../view/" class="px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg shadow-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-75 transition-colors">
                        Xem trang
                    </a>
                </header>
                <main id="edit-main" class="space-y-12">
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
                    <p>&copy; 2024 Lớp 8/4. Chế độ chỉnh sửa.</p>
                </footer>
            </div>
        </div>
    `;
    document.getElementById('gallery-container').innerHTML = renderGallery(appData.media, true);
    document.getElementById('classlist-container').innerHTML = renderClassList(appData.students, true);
    document.getElementById('schedule-container').innerHTML = renderSchedule(appData.schedule, true);
}

function showEditPage() {
    authContainer.classList.add('hidden');
    editContainer.classList.remove('hidden');
    renderEditPage();
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
            <input type="text" name="name" value="${student.name}" placeholder="Họ và Tên" required class="block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
            <input type="text" name="studentId" value="${student.studentId}" placeholder="Mã học sinh" required class="block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
            <input type="date" name="dob" value="${student.dob}" placeholder="Ngày sinh" required class="block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
            <input type="tel" name="phone" value="${student.phone}" placeholder="Số điện thoại" required class="block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
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
                <input type="text" name="url" value="${item.url}" required class="mt-1 block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" placeholder="https://..."/>
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

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    if (getPasswordHash()) {
        renderAuthForm('login');
    } else {
        renderAuthForm('set');
    }
});

editContainer.addEventListener('input', (e) => {
    const target = e.target;
    if (target.matches('#schedule-container input')) {
        const { day, session, period } = target.dataset;
        appData.schedule[day][session][parseInt(period)].subject = target.value;
        saveAppData(appData);
    }
});

editContainer.addEventListener('click', (e) => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (!action) return;
    
    const id = e.target.closest('[data-id]')?.dataset.id;

    switch (action) {
        case 'add-student':
            showStudentForm();
            break;
        case 'edit-student':
            showStudentForm(id);
            break;
        case 'delete-student':
            if (confirm('Bạn có chắc muốn xóa học sinh này?')) {
                appData.students = appData.students.filter(s => s.id !== id);
                saveAppData(appData);
                document.getElementById('classlist-container').innerHTML = renderClassList(appData.students, true);
            }
            break;
        case 'add-media':
            showMediaForm();
            break;
        case 'edit-media':
            showMediaForm(id);
            break;
        case 'delete-media':
            if (confirm('Bạn có chắc muốn xóa mục này?')) {
                appData.media = appData.media.filter(m => m.id !== id);
                saveAppData(appData);
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

modalContainer.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    const id = form.dataset.id;

    if (form.id === 'student-form') {
        const updatedStudent = {
            id: id || crypto.randomUUID(),
            name: form.name.value,
            studentId: form.studentId.value,
            dob: form.dob.value,
            phone: form.phone.value,
            notes: form.notes.value,
        };
        if (id) {
            appData.students = appData.students.map(s => s.id === id ? updatedStudent : s);
        } else {
            appData.students.push(updatedStudent);
        }
        saveAppData(appData);
        document.getElementById('classlist-container').innerHTML = renderClassList(appData.students, true);
    } else if (form.id === 'media-form') {
        const updatedMedia = {
            id: id || crypto.randomUUID(),
            type: form.type.value,
            url: form.url.value,
            caption: form.caption.value,
        };
        if (id) {
            appData.media = appData.media.map(m => m.id === id ? updatedMedia : m);
        } else {
            appData.media.push(updatedMedia);
        }
        saveAppData(appData);
        document.getElementById('gallery-container').innerHTML = renderGallery(appData.media, true);
    }
    
    closeModal();
});