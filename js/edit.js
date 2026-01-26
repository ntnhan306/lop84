
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
    const authContainer = document.getElementById('auth-container');
    authContainer.innerHTML = `
        <div class="min-h-screen flex items-center justify-center bg-indigo-600 px-4">
            <div class="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center transform transition-all scale-100">
                <div class="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <h2 class="text-2xl font-bold mb-2 text-gray-800">Quản trị Lớp 8/4</h2>
                <p class="text-gray-500 text-sm mb-6">Vui lòng nhập mật khẩu để tiếp tục</p>
                <input type="password" id="pass-input" placeholder="Mật khẩu" class="w-full p-4 border-2 border-gray-100 rounded-xl mb-4 outline-none focus:border-indigo-500 transition-all text-center text-lg tracking-widest">
                <button id="login-btn" class="w-full bg-indigo-600 text-white p-4 rounded-xl font-bold hover:bg-indigo-700 shadow-lg active:scale-95 transition-all">ĐĂNG NHẬP</button>
            </div>
        </div>
    `;
    const input = document.getElementById('pass-input');
    const btn = document.getElementById('login-btn');

    btn.onclick = async () => {
        const pass = input.value;
        const res = await authenticate(pass);
        if (res.success) {
            authToken = res.token;
            appData = await fetchAppData();
            authContainer.classList.add('hidden');
            document.getElementById('edit-container').classList.remove('hidden');
            renderEditor();
        } else {
            input.classList.add('border-red-500', 'shake');
            setTimeout(() => input.classList.remove('shake'), 500);
            alert("Mật khẩu không chính xác!");
        }
    };
}

function renderEditor() {
    const container = document.getElementById('edit-container');
    container.innerHTML = `
        <div class="max-w-5xl mx-auto p-4 sm:p-8">
            <header class="flex flex-col sm:flex-row justify-between items-center gap-6 mb-10">
                <div>
                    <h1 class="text-4xl font-black text-indigo-600 tracking-tight">CẬP NHẬT DỮ LIỆU</h1>
                    <p class="text-gray-400 font-bold uppercase tracking-widest text-xs mt-1">Phiên bản 4.0 Indigo Classic</p>
                </div>
                <div class="flex gap-3">
                    <button id="save-btn" class="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-xl hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2">LƯU THAY ĐỔI</button>
                    <a href="../view/" class="bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border dark:border-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all">XEM TRANG</a>
                </div>
            </header>

            <div class="space-y-4" id="accordion-editor">
                <!-- Section 1: Media -->
                <div class="accordion-item bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 shadow-sm overflow-hidden">
                    <button class="accordion-header w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors" data-section="media">
                        <div class="flex items-center gap-4">
                            <div class="p-3 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 rounded-xl">${icons.gallery}</div>
                            <span class="text-xl font-bold">Thư viện Ảnh & Video</span>
                        </div>
                        ${icons.chevron}
                    </button>
                    <div class="accordion-content p-6 border-t dark:border-gray-700 hidden" id="section-media">
                        <div class="mb-6">
                            <input type="file" id="file-input" multiple class="hidden" accept="image/*,video/*">
                            <button onclick="document.getElementById('file-input').click()" class="px-6 py-2 border-2 border-dashed border-indigo-200 text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-all w-full">+ Tải media lên</button>
                        </div>
                        <div id="media-list"></div>
                    </div>
                </div>

                <!-- Section 2: Students -->
                <div class="accordion-item bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 shadow-sm overflow-hidden">
                    <button class="accordion-header w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors" data-section="classlist">
                        <div class="flex items-center gap-4">
                            <div class="p-3 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 rounded-xl">${icons.users}</div>
                            <span class="text-xl font-bold">Danh sách Lớp</span>
                        </div>
                        ${icons.chevron}
                    </button>
                    <div class="accordion-content p-6 border-t dark:border-gray-700 hidden" id="section-classlist">
                        <div id="classlist-table"></div>
                    </div>
                </div>

                <!-- Section 3: Schedule -->
                <div class="accordion-item bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 shadow-sm overflow-hidden">
                    <button class="accordion-header w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors" data-section="schedule">
                        <div class="flex items-center gap-4">
                            <div class="p-3 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 rounded-xl">${icons.calendar}</div>
                            <span class="text-xl font-bold">Thời khóa biểu</span>
                        </div>
                        ${icons.chevron}
                    </button>
                    <div class="accordion-content p-6 border-t dark:border-gray-700 hidden" id="section-schedule">
                        <div id="schedule-table"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Accordion Logic
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.onclick = () => {
            const content = document.getElementById(`section-${header.dataset.section}`);
            const isOpen = !content.classList.contains('hidden');
            
            // Close others
            document.querySelectorAll('.accordion-content').forEach(c => c.classList.add('hidden'));
            document.querySelectorAll('.accordion-header').forEach(h => h.classList.remove('open'));
            
            if (!isOpen) {
                content.classList.remove('hidden');
                header.classList.add('open');
            }
        };
    });

    // Save Button
    document.getElementById('save-btn').onclick = async () => {
        const btn = document.getElementById('save-btn');
        btn.disabled = true; btn.innerText = "ĐANG LƯU...";
        const res = await saveAppData(appData, authToken);
        alert(res.message);
        btn.disabled = false; btn.innerText = "LƯU THAY ĐỔI";
    };

    // File Upload
    document.getElementById('file-input').onchange = (e) => {
        const files = e.target.files;
        for (let file of files) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                appData.media.push({
                    id: Date.now() + Math.random(),
                    type: file.type.startsWith('video') ? 'video' : 'image',
                    url: ev.target.result
                });
                renderSections();
            };
            reader.readAsDataURL(file);
        }
    };

    renderSections();
}

function renderSections() {
    document.getElementById('media-list').innerHTML = renderGallery(appData.media, { isEditing: true });
    document.getElementById('classlist-table').innerHTML = renderClassList(appData.students, appData.headers, { isEditing: true });
    document.getElementById('schedule-table').innerHTML = renderSchedule(appData.schedule, { isEditing: true });
    attachListeners();
}

function attachListeners() {
    // Delete Media
    document.querySelectorAll('[data-action="delete-media"]').forEach(btn => {
        btn.onclick = () => {
            appData.media = appData.media.filter(m => String(m.id) !== String(btn.dataset.id));
            renderSections();
        };
    });

    // Add Student
    const addBtn = document.querySelector('[data-action="add-student"]');
    if (addBtn) addBtn.onclick = () => {
        const newStudent = { id: Date.now() };
        appData.headers.forEach(h => newStudent[h.key] = '');
        appData.students.push(newStudent);
        renderSections();
    };

    // Delete Student
    document.querySelectorAll('[data-action="delete-student"]').forEach(btn => {
        btn.onclick = () => {
            if (confirm("Xóa dòng này?")) {
                appData.students = appData.students.filter(s => String(s.id) !== String(btn.dataset.id));
                renderSections();
            }
        };
    });

    // Edit Cell
    document.querySelectorAll('input[data-field]').forEach(input => {
        input.oninput = () => {
            const student = appData.students.find(s => String(s.id) === String(input.dataset.id));
            if (student) student[input.dataset.field] = input.value;
        };
    });

    // Edit Schedule
    document.querySelectorAll('textarea[data-day]').forEach(area => {
        area.oninput = () => {
            const { day, session, index } = area.dataset;
            appData.schedule[day][session][index].subject = area.value;
        };
    });
}

document.addEventListener('DOMContentLoaded', init);
