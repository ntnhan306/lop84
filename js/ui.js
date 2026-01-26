
export const icons = {
    pencil: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    trash: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    plus: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4.5v15m7.5-7.5h-15" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    merge: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M8 8h8v8H8zM4 4h4v4H4zm12 0h4v4h-4zM4 16h4v4H4zm12 0h4v4h-4z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    split: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 12h16M12 4v16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    gallery: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>`,
    users: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-4.663M5.5 13.5A3.5 3.5 0 019 10h.001c0 .98.39 1.85.98 2.5H9a4.5 4.5 0 01-4.5-4.5V7.5A3.5 3.5 0 019 4h6.001c0 .98.39 1.85.98 2.5H15A4.5 4.5 0 0110.5 11v2.5a3.5 3.5 0 01-5 0z" /></svg>`,
    calendar: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>`,
};

let noImageBase64 = '';
export function setNoImageBase64(data) { noImageBase64 = data; }

export function renderGallery(media, { isEditing = false } = {}) {
    if (!media || media.length === 0) return `<p class="text-center py-10 text-gray-500">Thư viện trống</p>`;

    const items = media.map(item => {
        const mediaHtml = item.type === 'video' 
            ? `<video src="${item.url}" class="w-full h-full object-cover" controls></video>`
            : `
                <div class="relative w-full h-full bg-gray-200 flex items-center justify-center overflow-hidden group">
                    <img src="${noImageBase64}" class="absolute w-full h-full object-cover img-pulse z-0" alt="Loading...">
                    <img src="${item.url}" 
                         class="absolute w-full h-full object-cover z-10 opacity-0 transition-opacity duration-500"
                         onload="this.style.opacity='1'; this.previousElementSibling.style.display='none'"
                         onerror="this.style.display='none'; this.previousElementSibling.classList.remove('img-pulse'); this.previousElementSibling.style.opacity='0.5'"
                         onclick="${!isEditing ? `openLightbox('${item.url}')` : ''}">
                    ${isEditing ? `
                        <div class="absolute top-2 right-2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button data-action="delete-media" data-id="${item.id}" class="p-1 bg-red-500 text-white rounded">${icons.trash}</button>
                        </div>
                    ` : ''}
                </div>
            `;

        return `<div class="aspect-square rounded-lg overflow-hidden shadow-sm border border-gray-200">${mediaHtml}</div>`;
    }).join('');

    return `<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">${items}</div>`;
}

export function openLightbox(src) {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 cursor-pointer';
    overlay.innerHTML = `<img src="${src}" class="max-w-full max-h-full object-contain">`;
    overlay.onclick = () => overlay.remove();
    document.body.appendChild(overlay);
}

// Render Table với gộp ô và tiêu đề đa tầng
export function renderClassList(students, headers, { isEditing = false, selectedCells = [] } = {}) {
    // Thu thập tất cả keys từ tầng cuối của headers
    const getLeafKeys = (hRows) => {
        const keys = [];
        const lastRow = hRows[hRows.length - 1];
        lastRow.forEach(h => keys.push(h.key));
        return keys;
    };
    const leafKeys = getLeafKeys(headers);

    const headerHtml = headers.map(row => `
        <tr>
            ${row.map(h => `
                <th rowspan="${h.rowSpan || 1}" colspan="${h.colSpan || 1}" class="border border-gray-300 bg-gray-100 px-3 py-2 text-sm font-bold text-gray-700">
                    ${h.label}
                </th>
            `).join('')}
        </tr>
    `).join('');

    const bodyHtml = students.map((s, rIdx) => `
        <tr>
            ${leafKeys.map((key, cIdx) => {
                const cell = s.cells[key] || { value: '', rowSpan: 1, colSpan: 1 };
                if (cell.hidden) return ''; // Bỏ qua ô bị gộp
                
                const isSelected = selectedCells.some(c => c.r === rIdx && c.c === cIdx);
                const cellId = `cell-${rIdx}-${cIdx}`;
                
                return `
                    <td id="${cellId}" 
                        rowspan="${cell.rowSpan || 1}" 
                        colspan="${cell.colSpan || 1}" 
                        data-r="${rIdx}" data-c="${cIdx}" data-key="${key}"
                        class="border border-gray-300 px-3 py-2 text-sm ${isSelected ? 'bg-indigo-100 ring-2 ring-indigo-400 ring-inset' : 'bg-white'} transition-all cursor-cell">
                        ${isEditing ? 
                            `<input type="text" value="${cell.value}" data-action="edit-cell" data-r="${rIdx}" data-key="${key}" class="w-full bg-transparent border-none focus:outline-none">` 
                            : cell.value}
                    </td>
                `;
            }).join('')}
        </tr>
    `).join('');

    return `
        <div class="flex flex-col gap-4">
            ${isEditing ? `
                <div class="flex flex-wrap gap-2 items-center bg-white p-2 rounded-lg border shadow-sm">
                    <button data-action="add-student" class="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-sm">
                        ${icons.plus} Thêm dòng
                    </button>
                    <div class="h-6 w-px bg-gray-200 mx-2"></div>
                    <button data-action="merge-cells" class="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm ${selectedCells.length < 2 ? 'opacity-50 cursor-not-allowed' : ''}">
                        ${icons.merge} Gộp ô
                    </button>
                    <button data-action="unmerge-cells" class="flex items-center gap-1 px-3 py-1.5 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm ${selectedCells.length !== 1 ? 'opacity-50 cursor-not-allowed' : ''}">
                        ${icons.split} Tách ô
                    </button>
                    <span class="text-xs text-gray-500 ml-auto">Click để chọn ô, giữ Ctrl để chọn nhiều</span>
                </div>
            ` : ''}
            <div class="overflow-x-auto rounded-lg border border-gray-300 shadow-sm">
                <table class="w-full border-collapse">
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
        <div class="overflow-x-auto rounded-lg border shadow-sm">
            <table class="w-full border-collapse text-center">
                <thead class="bg-indigo-600 text-white text-sm">
                    <tr>
                        <th class="border p-2 w-16">Tiết</th>
                        ${days.map(d => `<th class="border p-2">${d}</th>`).join('')}
                    </tr>
                </thead>
                <tbody class="text-sm">
                    ${sessions.map(s => `
                        <tr class="bg-gray-50 font-bold"><td colspan="7" class="border p-1 uppercase text-xs">${s === 'morning' ? 'Sáng' : 'Chiều'}</td></tr>
                        ${[0,1,2,3,4].map(i => `
                            <tr>
                                <td class="border p-2 bg-gray-100 font-medium">${i + 1}</td>
                                ${days.map(d => {
                                    const val = schedule[d]?.[s]?.[i]?.subject || '';
                                    return `
                                        <td class="border p-1">
                                            ${isEditing ? 
                                                `<textarea data-action="edit-schedule" data-day="${d}" data-session="${s}" data-index="${i}" class="w-full h-10 p-1 bg-transparent border-none text-center focus:ring-1 focus:ring-indigo-300 rounded resize-none">${val}</textarea>` 
                                                : `<div class="min-h-[2.5rem] flex items-center justify-center p-1">${val}</div>`}
                                        </td>
                                    `;
                                }).join('')}
                            </tr>
                        `).join('')}
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}
