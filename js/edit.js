
import { fetchAppData, saveAppData, authenticate, updatePassword, fetchNoImage, saveAppDataToStorage } from './data.js';
import { renderGallery, renderClassList, renderSchedule, icons, setNoImageBase64 } from './ui.js';

let appData = null;
let authToken = null;
let selectedCells = []; // { r, c, key }

async function init() {
    const noImg = await fetchNoImage();
    setNoImageBase64(noImg);
    renderAuth();
}

function renderAuth() {
    document.getElementById('auth-container').innerHTML = `
        <div class="min-h-screen flex items-center justify-center bg-indigo-50">
            <div class="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
                <h2 class="text-2xl font-bold mb-6 text-indigo-700">Quản trị Lớp 8/4</h2>
                <input type="password" id="pass-input" placeholder="Mật khẩu" class="w-full p-3 border rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500 outline-none">
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
        } else {
            alert("Sai mật khẩu!");
        }
    };
}

function renderEditor() {
    const container = document.getElementById('edit-container');
    container.innerHTML = `
        <div class="max-w-6xl mx-auto p-4">
            <header class="flex justify-between items-center mb-8 border-b pb-4">
                <h1 class="text-3xl font-bold text-indigo-800">Cập nhật Lớp 8/4</h1>
                <div class="flex gap-2">
                    <button id="save-btn" class="bg-green-600 text-white px-6 py-2 rounded-lg font-bold shadow-md flex items-center gap-2 hover:bg-green-700">
                        Lưu Thay Đổi
                    </button>
                    <a href="../view/" class="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-bold hover:bg-gray-300">Xem Trang</a>
                </div>
            </header>

            <section class="mb-12">
                <h2 class="text-xl font-bold mb-4 flex items-center gap-2">${icons.gallery} Thư viện Media</h2>
                <div class="bg-white p-4 rounded-xl border mb-4">
                    <input type="file" id="file-input" multiple class="hidden" accept="image/*,video/*">
                    <button onclick="document.getElementById('file-input').click()" class="bg-indigo-100 text-indigo-700 px-4 py-2 rounded font-bold hover:bg-indigo-200">
                        + Chọn ảnh/video từ máy
                    </button>
                </div>
                <div id="gallery-edit"></div>
            </section>

            <section class="mb-12">
                <h2 class="text-xl font-bold mb-4 flex items-center gap-2">${icons.users} Danh sách Lớp</h2>
                <div id="classlist-edit"></div>
            </section>

            <section class="mb-12">
                <h2 class="text-xl font-bold mb-4 flex items-center gap-2">${icons.calendar} Thời khóa biểu</h2>
                <div id="schedule-edit"></div>
            </section>
        </div>
    `;

    document.getElementById('save-btn').onclick = async () => {
        const btn = document.getElementById('save-btn');
        btn.disabled = true;
        btn.innerText = "Đang lưu...";
        const res = await saveAppData(appData, authToken);
        alert(res.message);
        btn.disabled = false;
        btn.innerText = "Lưu Thay Đổi";
    };

    document.getElementById('file-input').onchange = async (e) => {
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
            appData.media = appData.media.filter(m => m.id != btn.dataset.id);
            renderSections();
        };
    });

    // Cell Interaction
    const cells = document.querySelectorAll('#classlist-body td');
    cells.forEach(cell => {
        cell.onclick = (e) => {
            const r = parseInt(cell.dataset.r);
            const c = parseInt(cell.dataset.c);
            const key = cell.dataset.key;

            if (e.ctrlKey || e.metaKey) {
                const idx = selectedCells.findIndex(sc => sc.r === r && sc.c === c);
                if (idx > -1) selectedCells.splice(idx, 1);
                else selectedCells.push({ r, c, key });
            } else {
                selectedCells = [{ r, c, key }];
            }
            renderSections();
        };
    });

    // Merge Logic
    const mergeBtn = document.querySelector('[data-action="merge-cells"]');
    if (mergeBtn) mergeBtn.onclick = () => {
        if (selectedCells.length < 2) return;
        
        const rMin = Math.min(...selectedCells.map(c => c.r));
        const rMax = Math.max(...selectedCells.map(c => c.r));
        const cMin = Math.min(...selectedCells.map(c => c.c));
        const cMax = Math.max(...selectedCells.map(c => c.c));

        // Xác định các keys bị ảnh hưởng
        const getLeafKeys = (hRows) => {
            const lastRow = hRows[hRows.length - 1];
            return lastRow.map(h => h.key);
        };
        const leafKeys = getLeafKeys(appData.headers);
        const affectedKeys = leafKeys.slice(cMin, cMax + 1);

        // Ô gốc (top-left)
        const rootKey = leafKeys[cMin];
        const rootCell = appData.students[rMin].cells[rootKey];
        rootCell.rowSpan = rMax - rMin + 1;
        rootCell.colSpan = cMax - cMin + 1;

        // Ẩn các ô khác trong vùng gộp
        for (let r = rMin; r <= rMax; r++) {
            for (let k of affectedKeys) {
                if (r === rMin && k === rootKey) continue;
                if (!appData.students[r].cells[k]) appData.students[r].cells[k] = { value: '' };
                appData.students[r].cells[k].hidden = true;
            }
        }
        selectedCells = [];
        renderSections();
    };

    // Unmerge Logic
    const unmergeBtn = document.querySelector('[data-action="unmerge-cells"]');
    if (unmergeBtn) unmergeBtn.onclick = () => {
        if (selectedCells.length !== 1) return;
        const { r, key } = selectedCells[0];
        const cell = appData.students[r].cells[key];
        
        const rowSpan = cell.rowSpan || 1;
        const colSpan = cell.colSpan || 1;
        
        const leafKeys = appData.headers[appData.headers.length - 1].map(h => h.key);
        const startC = leafKeys.indexOf(key);
        const affectedKeys = leafKeys.slice(startC, startC + colSpan);

        for (let ri = r; ri < r + rowSpan; ri++) {
            for (let k of affectedKeys) {
                appData.students[ri].cells[k].hidden = false;
                if (ri === r && k === key) {
                    appData.students[ri].cells[k].rowSpan = 1;
                    appData.students[ri].cells[k].colSpan = 1;
                }
            }
        }
        selectedCells = [];
        renderSections();
    };

    // Row Logic
    const addStudentBtn = document.querySelector('[data-action="add-student"]');
    if (addStudentBtn) addStudentBtn.onclick = () => {
        const leafKeys = appData.headers[appData.headers.length - 1].map(h => h.key);
        const newCells = {};
        leafKeys.forEach(k => newCells[k] = { value: '', rowSpan: 1, colSpan: 1 });
        appData.students.push({ id: Date.now(), cells: newCells });
        renderSections();
    };

    // Inputs
    document.querySelectorAll('[data-action="edit-cell"]').forEach(input => {
        input.onchange = () => {
            const { r, key } = input.dataset;
            appData.students[r].cells[key].value = input.value;
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
