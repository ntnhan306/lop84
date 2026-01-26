
import { fetchAppData, saveAppData, authenticate, fetchNoImage } from './data.js';
import { renderGallery, renderClassList, renderSchedule, icons, setNoImageBase64 } from './ui.js';

let appData = null;
let authToken = null;

async function init() {
    const noImg = await fetchNoImage();
    setNoImageBase64(noImg);
    renderAuth();
}

function renderAuth() {
    document.getElementById('auth-container').innerHTML = `
        <div class="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
            <div class="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
                <h2 class="text-2xl font-bold mb-6 text-indigo-600">Quản trị Lớp 8/4</h2>
                <input type="password" id="pass-input" placeholder="Mật khẩu" class="w-full p-3 border dark:border-gray-700 rounded-lg mb-4 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all">
                <button id="login-btn" class="w-full bg-indigo-600 text-white p-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors">Đăng nhập</button>
            </div>
        </div>
    `;
    document.getElementById('login-btn').onclick = async () => {
        const pass = document.getElementById('pass-input').value;
        const res = await authenticate(pass);
        if (res.success) {
            authToken = res.token;
            appData = await fetchAppData();
            document.getElementById('auth-container').classList.add('hidden');
            document.getElementById('edit-container').classList.remove('hidden');
            renderEditor();
        } else { alert("Sai mật khẩu!"); }
    };
}

function renderEditor() {
    const container = document.getElementById('edit-container');
    container.innerHTML = `
        <div class="max-w-7xl mx-auto p-4 sm:p-6">
            <header class="flex flex-wrap justify-between items-center gap-4 mb-8 border-b dark:border-gray-700 pb-4">
                <div>
                    <h1 class="text-3xl font-bold text-indigo-600">Hệ thống Cập nhật</h1>
                    <p class="text-sm opacity-60 uppercase font-bold tracking-widest mt-1">Lớp 8/4 - v4.0 Stable Classic</p>
                </div>
                <div class="flex gap-2">
                    <button id="save-btn" class="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg hover:bg-indigo-700 flex items-center gap-2 transition-all">Lưu dữ liệu</button>
                    <a href="../view/" class="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-6 py-2 rounded-lg font-bold hover:bg-gray-300 transition-all">Xem trang</a>
                </div>
            </header>

            <div class="grid gap-12">
                <section>
                    <h2 class="text-xl font-bold mb-6 flex items-center gap-2 text-indigo-600">${icons.gallery} Thư viện Media</h2>
                    <div class="mb-4">
                        <input type="file" id="file-input" multiple class="hidden" accept="image/*,video/*">
                        <button onclick="document.getElementById('file-input').click()" class="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 px-4 py-2 rounded-lg font-bold hover:bg-indigo-100 transition-colors">+ Thêm ảnh/video mới</button>
                    </div>
                    <div id="gallery-edit"></div>
                </section>

                <section>
                    <h2 class="text-xl font-bold mb-6 flex items-center gap-2 text-indigo-600">${icons.users} Danh sách Lớp Học</h2>
                    <div id="classlist-edit"></div>
                </section>

                <section>
                    <h2 class="text-xl font-bold mb-6 flex items-center gap-2 text-indigo-600">${icons.calendar} Thời khóa biểu</h2>
                    <div id="schedule-edit"></div>
                </section>
            </div>
        </div>
    `;

    document.getElementById('save-btn').onclick = async () => {
        const btn = document.getElementById('save-btn');
        btn.disabled = true; btn.innerText = "Đang lưu...";
        const res = await saveAppData(appData, authToken);
        alert(res.message);
        btn.disabled = false; btn.innerText = "Lưu dữ liệu";
    };

    document.getElementById('file-input').onchange = (e) => {
        const files = e.target.files;
        for (let file of files) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                appData.media.push({
                    id: Date.now() + Math.random(),
                    type: file.type.startsWith('video') ? 'video' : 'image',
                    url: ev.target.result,
                    caption: file.name
                });
                renderSections();
            };
            reader.readAsDataURL(file);
        }
    };

    renderSections();
}

function renderSections() {
    document.getElementById('gallery-edit').innerHTML = renderGallery(appData.media, { isEditing: true });
    document.getElementById('classlist-edit').innerHTML = renderClassList(appData.students, appData.headers, { isEditing: true });
    document.getElementById('schedule-edit').innerHTML = renderSchedule(appData.schedule, { isEditing: true });
    attachListeners();
}

function attachListeners() {
    // Media delete
    document.querySelectorAll('[data-action="delete-media"]').forEach(btn => {
        btn.onclick = () => {
            appData.media = appData.media.filter(m => String(m.id) !== String(btn.dataset.id));
            renderSections();
        };
    });

    // ClassList: Add row
    const addBtn = document.querySelector('[data-action="add-student"]');
    if (addBtn) addBtn.onclick = () => {
        const newStudent = { id: Date.now() };
        appData.headers.forEach(h => newStudent[h.key] = '');
        appData.students.push(newStudent);
        renderSections();
    };

    // ClassList: Delete row
    document.querySelectorAll('[data-action="delete-student"]').forEach(btn => {
        btn.onclick = () => {
            if (confirm("Xóa học sinh này?")) {
                appData.students = appData.students.filter(s => String(s.id) !== String(btn.dataset.id));
                renderSections();
            }
        };
    });

    // ClassList: Edit cell
    document.querySelectorAll('input[data-field]').forEach(input => {
        input.oninput = () => {
            const student = appData.students.find(s => String(s.id) === String(input.dataset.studentId));
            if (student) student[input.dataset.field] = input.value;
        };
    });

    // Schedule: Edit cell
    document.querySelectorAll('.schedule-input').forEach(area => {
        area.oninput = () => {
            const { day, session, index } = area.dataset;
            if (appData.schedule[day] && appData.schedule[day][session]) {
                appData.schedule[day][session][index].subject = area.value;
            }
        };
    });
}

document.addEventListener('DOMContentLoaded', init);
