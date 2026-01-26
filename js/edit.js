
import { fetchAppData, saveAppData, authenticate, fetchNoImage } from './data.js';
import { renderGallery, renderClassList, renderSchedule, icons, setNoImageBase64 } from './ui.js';

let appData = null;
let authToken = null;
let selectedCells = [];
let isCtrlPressed = false;

async function init() {
    const noImg = await fetchNoImage();
    setNoImageBase64(noImg);
    renderAuth();

    window.addEventListener('keydown', e => { if (e.key === 'Control') isCtrlPressed = true; });
    window.addEventListener('keyup', e => { 
        if (e.key === 'Control') {
            isCtrlPressed = false;
            handleAutoMerge();
        }
    });
}

function handleAutoMerge() {
    if (selectedCells.length < 2) {
        selectedCells = [];
        renderSections();
        return;
    }
    // Lọc theo cột: Chỉ gộp các ô trong cùng 1 cột
    const colKey = selectedCells[0].k;
    const rows = selectedCells.filter(c => c.k === colKey).map(c => c.r);
    if (rows.length < 2) {
        selectedCells = [];
        renderSections();
        return;
    }
    const r1 = Math.min(...rows);
    const r2 = Math.max(...rows);
    
    // Lưu metadata gộp (Xóa các gộp cũ chồng lấn nếu có)
    appData.merges = appData.merges.filter(m => !(m.colKey === colKey && ((r1 >= m.r1 && r1 <= m.r2) || (r2 >= m.r1 && r2 <= m.r2))));
    appData.merges.push({ colKey, r1, r2 });
    
    selectedCells = [];
    renderSections();
}

function renderAuth() {
    const container = document.getElementById('auth-container');
    container.innerHTML = `
        <div class="min-h-screen flex items-center justify-center bg-indigo-600 px-4">
            <div class="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center transform transition-all scale-100">
                <div class="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <h2 class="text-2xl font-bold mb-2 text-gray-800">Quản trị Lớp 8/4</h2>
                <p class="text-gray-500 text-sm mb-6">Vui lòng nhập mật khẩu để tiếp tục</p>
                <input type="password" id="pass-input" placeholder="Mật khẩu" class="w-full p-4 border-2 border-gray-100 rounded-xl mb-4 outline-none focus:border-indigo-500 transition-all text-center text-lg tracking-widest bg-white">
                <button id="login-btn" class="w-full bg-indigo-600 text-white p-4 rounded-xl font-bold hover:bg-indigo-700 shadow-lg active:scale-95 transition-all">ĐĂNG NHẬP</button>
            </div>
        </div>
    `;
    const input = document.getElementById('pass-input');
    const btn = document.getElementById('login-btn');
    btn.onclick = async () => {
        const res = await authenticate(input.value);
        if (res.success) {
            authToken = res.token;
            appData = await fetchAppData();
            container.classList.add('hidden');
            document.getElementById('edit-container').classList.remove('hidden');
            renderEditor();
        } else { alert("Mật khẩu không đúng"); }
    };
}

function renderEditor() {
    const container = document.getElementById('edit-container');
    container.innerHTML = `
        <div class="max-w-5xl mx-auto p-4 sm:p-8">
            <header class="flex flex-col sm:flex-row justify-between items-center gap-6 mb-10">
                <div>
                    <h1 class="text-4xl font-black text-indigo-600 tracking-tight">CẬP NHẬT DỮ LIỆU</h1>
                    <p class="text-gray-400 font-bold uppercase tracking-widest text-xs mt-1">Phiên bản 4.1 Indigo Merge-Plus</p>
                </div>
                <div class="flex gap-3">
                    <button id="save-btn" class="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-xl hover:bg-indigo-700 active:scale-95 transition-all">LƯU THAY ĐỔI</button>
                    <a href="../view/" class="bg-white text-gray-600 border px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all">XEM TRANG</a>
                </div>
            </header>

            <div class="space-y-4" id="accordion-editor">
                <!-- Section 1 -->
                <div class="bg-white rounded-2xl border shadow-sm overflow-hidden">
                    <button class="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors accordion-btn" data-target="sec-media">
                        <div class="flex items-center gap-4">
                            <div class="p-3 bg-indigo-100 text-indigo-600 rounded-xl">${icons.gallery}</div>
                            <span class="text-xl font-bold">Thư viện Media</span>
                        </div>
                        ${icons.chevron}
                    </button>
                    <div id="sec-media" class="accordion-content p-6 border-t hidden">
                        <input type="file" id="file-input" multiple class="hidden" accept="image/*,video/*">
                        <button onclick="document.getElementById('file-input').click()" class="w-full py-4 border-2 border-dashed border-indigo-200 rounded-xl text-indigo-600 font-bold hover:bg-indigo-50 mb-6">+ Tải lên tệp</button>
                        <div id="media-list"></div>
                    </div>
                </div>

                <!-- Section 2 -->
                <div class="bg-white rounded-2xl border shadow-sm overflow-hidden">
                    <button class="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors accordion-btn open" data-target="sec-students">
                        <div class="flex items-center gap-4">
                            <div class="p-3 bg-indigo-100 text-indigo-600 rounded-xl">${icons.users}</div>
                            <span class="text-xl font-bold">Danh sách Học sinh</span>
                        </div>
                        ${icons.chevron}
                    </button>
                    <div id="sec-students" class="accordion-content p-6 border-t">
                        <p class="text-[10px] text-gray-400 mb-2 italic">Mẹo: Giữ Ctrl + Click chọn ô cùng cột để tự động gộp. Chuột phải tiêu đề để phân tầng.</p>
                        <div id="classlist-container"></div>
                    </div>
                </div>

                <!-- Section 3 -->
                <div class="bg-white rounded-2xl border shadow-sm overflow-hidden">
                    <button class="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors accordion-btn" data-target="sec-schedule">
                        <div class="flex items-center gap-4">
                            <div class="p-3 bg-indigo-100 text-indigo-600 rounded-xl">${icons.calendar}</div>
                            <span class="text-xl font-bold">Thời khóa biểu</span>
                        </div>
                        ${icons.chevron}
                    </button>
                    <div id="sec-schedule" class="accordion-content p-6 border-t hidden">
                        <div id="schedule-container"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.querySelectorAll('.accordion-btn').forEach(btn => {
        btn.onclick = () => {
            const target = document.getElementById(btn.dataset.target);
            const isOpen = !target.classList.contains('hidden');
            document.querySelectorAll('.accordion-content').forEach(c => c.classList.add('hidden'));
            document.querySelectorAll('.accordion-btn').forEach(b => b.classList.remove('open'));
            if (!isOpen) { target.classList.remove('hidden'); btn.classList.add('open'); }
        };
    });

    document.getElementById('save-btn').onclick = async () => {
        const res = await saveAppData(appData, authToken);
        alert(res.message);
    };

    document.getElementById('file-input').onchange = (e) => {
        const files = e.target.files;
        for (let f of files) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                appData.media.push({ id: Date.now()+Math.random(), type: f.type.startsWith('video') ? 'video' : 'image', url: ev.target.result });
                renderSections();
            };
            reader.readAsDataURL(f);
        }
    };

    renderSections();
}

function renderSections() {
    document.getElementById('media-list').innerHTML = renderGallery(appData.media, { isEditing: true });
    document.getElementById('classlist-container').innerHTML = renderClassList(appData.students, appData.studentColumns, { 
        isEditing: true, 
        merges: appData.merges, 
        hierarchies: appData.hierarchies,
        selectedCells 
    });
    document.getElementById('schedule-container').innerHTML = renderSchedule(appData.schedule, { isEditing: true });
    attachListeners();
}

function attachListeners() {
    // Delete Media
    document.querySelectorAll('[data-action="delete-media"]').forEach(b => {
        b.onclick = () => { appData.media = appData.media.filter(m => String(m.id) !== String(b.dataset.id)); renderSections(); };
    });

    // Student Cell Click (Selection for Merge)
    document.querySelectorAll('td[data-row-idx]').forEach(td => {
        td.onclick = (e) => {
            if (e.target.tagName === 'TEXTAREA') return;
            const r = parseInt(td.dataset.rowIdx);
            const k = td.dataset.colKey;
            if (isCtrlPressed) {
                const exist = selectedCells.findIndex(c => c.r === r && c.k === k);
                if (exist > -1) selectedCells.splice(exist, 1);
                else selectedCells.push({ r, k });
                renderSections();
            }
        };
    });

    // Right click Header (Hierarchy)
    document.querySelectorAll('th[data-col-key]').forEach(th => {
        th.oncontextmenu = (e) => {
            e.preventDefault();
            const k = th.dataset.colKey;
            const label = prompt("Nhập tiêu đề phân tầng cho cột này:", appData.hierarchies[k] || "");
            if (label !== null) {
                if (label === "") delete appData.hierarchies[k];
                else appData.hierarchies[k] = label;
                renderSections();
            }
        };
    });

    // Add Student
    const addBtn = document.querySelector('[data-action="add-student"]');
    if (addBtn) addBtn.onclick = () => {
        const newRow = { id: Date.now() };
        appData.studentColumns.forEach(c => newRow[c.key] = '');
        appData.students.push(newRow);
        renderSections();
    };

    // Delete Student
    document.querySelectorAll('[data-action="delete-student"]').forEach(b => {
        b.onclick = () => {
            appData.students.splice(parseInt(b.dataset.rowIdx), 1);
            renderSections();
        };
    });

    // Edit Cell
    document.querySelectorAll('[data-action="edit-cell"]').forEach(area => {
        area.oninput = () => {
            appData.students[area.dataset.rowIdx][area.dataset.colKey] = area.value;
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
