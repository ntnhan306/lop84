
export const icons = {
    pencil: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>`,
    trash: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>`,
    plus: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.5v15m7.5-7.5h-15" /></svg>`,
    gallery: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>`,
    users: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-4.663M5.5 13.5A3.5 3.5 0 019 10h.001c0 .98.39 1.85.98 2.5H9a4.5 4.5 0 01-4.5-4.5V7.5A3.5 3.5 0 019 4h6.001c0 .98.39 1.85.98 2.5H15A4.5 4.5 0 0110.5 11v2.5a3.5 3.5 0 01-5 0z" /></svg>`,
    calendar: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>`,
    merge: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" /></svg>`,
    unmerge: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>`
};

let noImageBase64 = '';
export function setNoImageBase64(data) { noImageBase64 = data; }

function renderEmptyState(icon, title, desc) {
    return `<div class="text-center py-10 opacity-60">${icon}<h3 class="font-bold mt-2">${title}</h3><p class="text-sm">${desc}</p></div>`;
}

export function renderGallery(media, { isEditing = false } = {}) {
    if (!media || media.length === 0) return renderEmptyState(icons.gallery, "Thư viện trống", "Chưa có media nào.");
    
    const items = media.map(item => {
        let mediaHtml;
        if (item.type === 'video') {
            mediaHtml = `<video src="${item.url}" class="w-full h-full object-cover" preload="metadata"></video>`;
        } else {
            mediaHtml = `
                <div class="relative w-full h-full bg-gray-200 overflow-hidden">
                    <img src="${noImageBase64}" class="absolute w-full h-full object-cover img-pulse" alt="Loading">
                    <img src="${item.url}" class="absolute w-full h-full object-cover opacity-0 transition-opacity" 
                         onload="this.classList.remove('opacity-0'); this.previousElementSibling.style.display='none'"
                         onerror="this.previousElementSibling.classList.remove('img-pulse'); this.previousElementSibling.style.opacity='0.4'">
                </div>
            `;
        }
        return `
            <div class="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm group">
                ${mediaHtml}
                ${isEditing ? `
                    <button data-action="delete-media" data-id="${item.id}" class="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        ${icons.trash}
                    </button>
                ` : `<div class="absolute inset-0 cursor-pointer" onclick="openLightbox('${item.url}')"></div>`}
            </div>
        `;
    }).join('');

    return `<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">${items}</div>`;
}

export function openLightbox(src) {
    const div = document.createElement('div');
    div.className = "fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 cursor-pointer";
    div.innerHTML = `<img src="${src}" class="max-w-full max-h-full object-contain shadow-2xl">`;
    div.onclick = () => div.remove();
    document.body.appendChild(div);
}

export function renderClassList(students, headers, { isEditing = false, selectedCells = [] } = {}) {
    const leafKeys = headers[headers.length - 1].map(h => h.key);

    const headerHtml = headers.map(row => `
        <tr>
            ${row.map(h => `<th rowspan="${h.rowSpan || 1}" colspan="${h.colSpan || 1}" class="border border-gray-300 bg-gray-100 dark:bg-gray-800 p-2 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase">${h.label}</th>`).join('')}
        </tr>
    `).join('');

    const bodyHtml = students.map((s, rIdx) => `
        <tr>
            ${leafKeys.map((key, cIdx) => {
                const cell = s.cells[key] || { value: '', rowSpan: 1, colSpan: 1 };
                if (cell.hidden) return '';
                const isSelected = selectedCells.some(sel => sel.r === rIdx && sel.key === key);
                return `
                    <td rowspan="${cell.rowSpan || 1}" colspan="${cell.colSpan || 1}" 
                        data-r="${rIdx}" data-key="${key}" data-c="${cIdx}"
                        class="border border-gray-300 p-2 text-sm transition-all ${isSelected ? 'bg-indigo-100 ring-2 ring-indigo-500 inset-0' : 'bg-white dark:bg-gray-900'}">
                        ${isEditing ? 
                            `<input type="text" value="${cell.value}" data-action="edit-cell" data-r="${rIdx}" data-key="${key}" class="w-full bg-transparent outline-none">` 
                            : cell.value}
                    </td>
                `;
            }).join('')}
        </tr>
    `).join('');

    return `
        <div class="flex flex-col gap-3">
            ${isEditing ? `
                <div class="flex flex-wrap gap-2 items-center bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border dark:border-gray-700 shadow-sm">
                    <button data-action="add-student" class="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700">${icons.plus} Thêm dòng</button>
                    <div class="w-px h-6 bg-gray-300 mx-2"></div>
                    <button data-action="merge-cells" class="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700 disabled:opacity-40" ${selectedCells.length < 2 ? 'disabled' : ''}>${icons.merge} Gộp ô</button>
                    <button data-action="unmerge-cells" class="flex items-center gap-1 px-3 py-1.5 bg-orange-500 text-white rounded text-xs font-bold hover:bg-orange-600 disabled:opacity-40" ${selectedCells.length !== 1 ? 'disabled' : ''}>${icons.unmerge} Tách ô</button>
                    <span class="ml-auto text-[10px] uppercase opacity-50 font-bold">Giữ Ctrl để chọn nhiều ô</span>
                </div>
            ` : ''}
            <div class="overflow-x-auto rounded-lg border border-gray-300 dark:border-gray-700 shadow-sm">
                <table class="w-full border-collapse text-left">
                    <thead>${headerHtml}</thead>
                    <tbody id="classlist-body">${bodyHtml}</tbody>
                </table>
            </div>
        </div>
    `;
}

export function renderSchedule(schedule, { isEditing = false } = {}) {
    const days = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const sessions = ['morning', 'afternoon'];
    return `
        <div class="overflow-x-auto rounded-lg border dark:border-gray-700 shadow-sm">
            <table class="w-full border-collapse text-center text-sm">
                <thead class="bg-indigo-600 text-white">
                    <tr><th class="border dark:border-gray-700 p-2">Tiết</th>${days.map(d => `<th class="border dark:border-gray-700 p-2">${d}</th>`).join('')}</tr>
                </thead>
                <tbody>
                    ${sessions.map(s => `
                        <tr class="bg-gray-50 dark:bg-gray-800 font-bold"><td colspan="7" class="border dark:border-gray-700 p-1 text-xs uppercase">${s === 'morning' ? 'Sáng' : 'Chiều'}</td></tr>
                        ${[0,1,2,3,4].map(i => `
                            <tr>
                                <td class="border dark:border-gray-700 p-2 bg-gray-100 dark:bg-gray-700 font-medium">${i+1}</td>
                                ${days.map(d => {
                                    const val = schedule[d]?.[s]?.[i]?.subject || '';
                                    return `<td class="border dark:border-gray-700 p-1">
                                        ${isEditing ? `<textarea data-action="edit-schedule" data-day="${d}" data-session="${s}" data-index="${i}" class="w-full h-10 p-1 bg-transparent border-none text-center focus:ring-1 focus:ring-indigo-300 rounded resize-none">${val}</textarea>` 
                                        : `<div class="min-h-[2.5rem] flex items-center justify-center p-1">${val}</div>`}
                                    </td>`;
                                }).join('')}
                            </tr>
                        `).join('')}
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}
