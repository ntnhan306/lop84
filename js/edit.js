
import { fetchAppData, saveAppData, authenticate, fetchNoImage, saveAppDataToStorage } from './data.js';
import { renderGallery, renderClassList, renderSchedule, icons, setNoImageBase64 } from './ui.js';

let appData = null;
let authToken = null;
let selectedCells = []; // { r, key, c }

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
                <input type="password" id="pass-input" placeholder="Mật khẩu" class="w-full p-3 border dark:border-gray-700 rounded-lg mb-4 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-indigo-500">
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
                    <p class="text-sm opacity-60 uppercase font-bold tracking-widest mt-1">Lớp 8/4 - v5.0 Stable</p>
                </div>
                <div class="flex gap-2">
                    <button id="save-btn" class="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg hover:bg-indigo-700 flex items-center gap-2 transition-all">Lưu dữ liệu</button>
                    <a href="../view/" class="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-6 py-2 rounded-lg font-bold hover:bg-gray-300 transition-all">Xem trang</a>
                </div>
            </header>

            <div class="grid gap-8">
                <section class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
                    <h2 class="text-xl font-bold mb-6 flex items-center gap-2 text-indigo-600">${icons.gallery} Media</h2>
                    <div class="mb-4">
                        <input type="file" id="file-input" multiple class="hidden" accept="image/*,video/*">
                        <button onclick="document.getElementById('file-input').click()" class="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 px-4 py-2 rounded font-bold hover:bg-indigo-100 transition-colors">+ Thêm ảnh/video</button>
                    </div>
                    <div id="gallery-edit"></div>
                </section>

                <section class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
                    <h2 class="text-xl font-bold mb-6 flex items-center gap-2 text-indigo-600">${icons.users} Danh sách Lớp</h2>
                    <div id="classlist-edit"></div>
                </section>

                <section class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
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
    document.getElementById('classlist-edit').innerHTML = renderClassList(appData.students, appData.headers, { isEditing: true, selectedCells });
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

    // Cell Selection (Sheet style)
    document.querySelectorAll('#classlist-body td').forEach(td => {
        td.onclick = (e) => {
            const r = parseInt(td.dataset.r);
            const key = td.dataset.key;
            const c = parseInt(td.dataset.c);
            
            if (e.ctrlKey || e.metaKey) {
                const idx = selectedCells.findIndex(s => s.r === r && s.key === key);
                if (idx > -1) selectedCells.splice(idx, 1);
                else selectedCells.push({ r, key, c });
            } else {
                selectedCells = [{ r, key, c }];
            }
            renderSections();
        };
    });

    // Merge Cells Logic
    const mergeBtn = document.querySelector('[data-action="merge-cells"]');
    if (mergeBtn) mergeBtn.onclick = () => {
        if (selectedCells.length < 2) return;
        const rMin = Math.min(...selectedCells.map(s => s.r));
        const rMax = Math.max(...selectedCells.map(s => s.r));
        const cMin = Math.min(...selectedCells.map(s => s.c));
        const cMax = Math.max(...selectedCells.map(s => s.c));

        const leafKeys = appData.headers[appData.headers.length - 1].map(h => h.key);
        const rootKey = leafKeys[cMin];
        const affectedKeys = leafKeys.slice(cMin, cMax + 1);

        // Ô gốc nhận rowSpan/colSpan
        const rootCell = appData.students[rMin].cells[rootKey];
        rootCell.rowSpan = rMax - rMin + 1;
        rootCell.colSpan = cMax - cMin + 1;

        // Ẩn các ô khác trong vùng gộp
        for (let r = rMin; r <= rMax; r++) {
            affectedKeys.forEach(k => {
                if (r === rMin && k === rootKey) return;
                if (!appData.students[r].cells[k]) appData.students[r].cells[k] = { value: '' };
                appData.students[r].cells[k].hidden = true;
            });
        }
        selectedCells = [];
        renderSections();
    };

    // Unmerge Cells Logic
    const unmergeBtn = document.querySelector('[data-action="unmerge-cells"]');
    if (unmergeBtn) unmergeBtn.onclick = () => {
        if (selectedCells.length !== 1) return;
        const { r, key, c } = selectedCells[0];
        const cell = appData.students[r].cells[key];
        const rs = cell.rowSpan || 1;
        const cs = cell.colSpan || 1;

        const leafKeys = appData.headers[appData.headers.length - 1].map(h => h.key);
        const affectedKeys = leafKeys.slice(c, c + cs);

        for (let ri = r; ri < r + rs; ri++) {
            affectedKeys.forEach(k => {
                if (ri === r && k === key) {
                    cell.rowSpan = 1; cell.colSpan = 1;
                }
                if (appData.students[ri].cells[k]) {
                    appData.students[ri].cells[k].hidden = false;
                }
            });
        }
        selectedCells = [];
        renderSections();
    };

    // Row Logic
    const addBtn = document.querySelector('[data-action="add-student"]');
    if (addBtn) addBtn.onclick = () => {
        const leafKeys = appData.headers[appData.headers.length - 1].map(h => h.key);
        const newCells = {};
        leafKeys.forEach(k => newCells[k] = { value: '', rowSpan: 1, colSpan: 1 });
        appData.students.push({ id: Date.now(), cells: newCells });
        renderSections();
    };

    // Inputs
    document.querySelectorAll('[data-action="edit-cell"]').forEach(input => {
        input.onchange = () => {
            appData.students[input.dataset.r].cells[input.dataset.key].value = input.value;
        };
    });

    document.querySelectorAll('[data-action="edit-schedule"]').forEach(area => {
        area.onchange = () => {
            const { day, session, index } = area.dataset;
            appData.schedule[day][session][index].subject = area.value;
        };
    });
}

document.addEventListener('DOMContentLoaded', init);
