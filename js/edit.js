
import { fetchAppData, saveAppData, authenticate, fetchNoImage } from './data.js';
import { renderGallery, renderClassList, renderSchedule, icons, setNoImageBase64 } from './ui.js';

let appData = null;
let authToken = null;
let selectedCells = []; // { rIdx, colKey }

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
                <input type="password" id="pass-input" placeholder="Mật khẩu" class="w-full p-4 border-2 border-gray-100 rounded-xl mb-4 outline-none focus:border-indigo-500 transition-all text-center text-lg tracking-widest bg-white">
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
                    <p class="text-gray-400 font-bold uppercase tracking-widest text-xs mt-1">Phiên bản 4.1 Indigo Classic</p>
                </div>
                <div class="flex gap-3">
                    <button id="save-btn" class="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-xl hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2">LƯU THAY ĐỔI</button>
                    <a href="../view/" class="bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border dark:border-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all">XEM TRANG</a>
                </div>
            </header>

            <div class="space-y-4" id="accordion-editor">
                <!-- Media Section -->
                <div class="accordion-item bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 shadow-sm overflow-hidden">
                    <button class="accordion-header w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors" data-section="media">
                        <div class="flex items-center gap-4">
                            <div class="p-3 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 rounded-xl">${icons.gallery}</div>
                            <span class="text-xl font-bold text-gray-800 dark:text-gray-100">Thư viện Ảnh & Video</span>
                        </div>
                        ${icons.chevron}
                    </button>
                    <div class="accordion-content hidden p-6 border-t dark:border-gray-700" id="section-media">
                        <div class="mb-6">
                            <input type="file" id="file-input" multiple class="hidden" accept="image/*,video/*">
                            <button onclick="document.getElementById('file-input').click()" class="px-6 py-2 border-2 border-dashed border-indigo-200 text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-all w-full">+ Tải media lên</button>
                        </div>
                        <div id="media-list"></div>
                    </div>
                </div>

                <!-- Classlist Section -->
                <div class="accordion-item bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 shadow-sm overflow-hidden">
                    <button class="accordion-header w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors open" data-section="classlist">
                        <div class="flex items-center gap-4">
                            <div class="p-3 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 rounded-xl">${icons.users}</div>
                            <span class="text-xl font-bold text-gray-800 dark:text-gray-100">Danh sách Lớp</span>
                        </div>
                        ${icons.chevron}
                    </button>
                    <div class="accordion-content p-6 border-t dark:border-gray-700" id="section-classlist">
                        <div id="classlist-table"></div>
                    </div>
                </div>

                <!-- Schedule Section -->
                <div class="accordion-item bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 shadow-sm overflow-hidden">
                    <button class="accordion-header w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors" data-section="schedule">
                        <div class="flex items-center gap-4">
                            <div class="p-3 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 rounded-xl">${icons.calendar}</div>
                            <span class="text-xl font-bold text-gray-800 dark:text-gray-100">Thời khóa biểu</span>
                        </div>
                        ${icons.chevron}
                    </button>
                    <div class="accordion-content hidden p-6 border-t dark:border-gray-700" id="section-schedule">
                        <div id="schedule-table"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Accordion click handling
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.onclick = () => {
            const section = header.dataset.section;
            const content = document.getElementById(`section-${section}`);
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

    document.getElementById('save-btn').onclick = async () => {
        const btn = document.getElementById('save-btn');
        btn.disabled = true; btn.innerText = "ĐANG LƯU...";
        const res = await saveAppData(appData, authToken);
        alert(res.message || "Đã lưu thành công!");
        btn.disabled = false; btn.innerText = "LƯU THAY ĐỔI";
    };

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
    document.getElementById('classlist-table').innerHTML = renderClassList(appData.students, appData.headers, { isEditing: true, selectedCells });
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

    // Cell Selection Logic for Merge
    document.querySelectorAll('td[data-cell-row]').forEach(td => {
        td.onclick = (e) => {
            if (e.target.tagName === 'TEXTAREA') return; 
            const rIdx = parseInt(td.dataset.cellRow);
            const colKey = td.dataset.cellKey;
            
            if (e.ctrlKey || e.metaKey) {
                const existing = selectedCells.findIndex(c => c.rIdx === rIdx && c.colKey === colKey);
                if (existing > -1) selectedCells.splice(existing, 1);
                else selectedCells.push({ rIdx, colKey });
            } else {
                selectedCells = [{ rIdx, colKey }];
            }
            renderSections();
        };
    });

    // Add row
    const addBtn = document.querySelector('[data-action="add-student"]');
    if (addBtn) addBtn.onclick = () => {
        const newStudent = { id: Date.now() };
        appData.headers.forEach(h => {
            newStudent[h.key] = { text: '', rowSpan: 1, colSpan: 1, hidden: false };
        });
        appData.students.push(newStudent);
        renderSections();
    };

    // Merge logic
    const mergeBtn = document.querySelector('[data-action="merge-cells"]');
    if (mergeBtn) mergeBtn.onclick = () => {
        if (selectedCells.length < 2) return;
        
        const colIndices = appData.headers.map(h => h.key);
        const rIndices = selectedCells.map(c => c.rIdx);
        const cIndices = selectedCells.map(c => colIndices.indexOf(c.colKey));
        
        const minR = Math.min(...rIndices);
        const maxR = Math.max(...rIndices);
        const minC = Math.min(...cIndices);
        const maxC = Math.max(...cIndices);
        
        const mainCell = appData.students[minR][colIndices[minC]];
        mainCell.rowSpan = maxR - minR + 1;
        mainCell.colSpan = maxC - minC + 1;
        
        for (let r = minR; r <= maxR; r++) {
            for (let c = minC; c <= maxC; c++) {
                if (r === minR && c === minC) continue;
                appData.students[r][colIndices[c]].hidden = true;
            }
        }
        
        selectedCells = [];
        renderSections();
    };

    // Split logic
    const splitBtn = document.querySelector('[data-action="split-cells"]');
    if (splitBtn) splitBtn.onclick = () => {
        selectedCells.forEach(cell => {
            const rIdx = cell.rIdx;
            const colKey = cell.colKey;
            const cIdx = appData.headers.findIndex(h => h.key === colKey);
            const targetCell = appData.students[rIdx][colKey];
            
            const rSpan = targetCell.rowSpan || 1;
            const cSpan = targetCell.colSpan || 1;
            
            for (let r = rIdx; r < rIdx + rSpan; r++) {
                for (let c = cIdx; c < cIdx + cSpan; c++) {
                    const s = appData.students[r][appData.headers[c].key];
                    s.rowSpan = 1;
                    s.colSpan = 1;
                    s.hidden = false;
                }
            }
        });
        selectedCells = [];
        renderSections();
    };

    // Row deletion
    document.querySelectorAll('[data-action="delete-student"]').forEach(btn => {
        btn.onclick = () => {
            if (confirm("Xóa dòng này?")) {
                appData.students = appData.students.filter(s => String(s.id) !== String(btn.dataset.id));
                renderSections();
            }
        };
    });

    // Content input handling
    document.querySelectorAll('textarea[data-field]').forEach(area => {
        area.oninput = () => {
            const student = appData.students.find(s => String(s.id) === String(area.dataset.id));
            if (student) student[area.dataset.field].text = area.value;
        };
    });

    // Schedule input handling
    document.querySelectorAll('textarea[data-day]').forEach(area => {
        area.oninput = () => {
            const { day, session, index } = area.dataset;
            appData.schedule[day][session][index].subject = area.value;
        };
    });
}

document.addEventListener('DOMContentLoaded', init);
