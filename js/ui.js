
export const icons = {
    pencil: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>`,
    trash: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>`,
    plus: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.5v15m7.5-7.5h-15" /></svg>`,
    gallery: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>`,
    users: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-4.663M5.5 13.5A3.5 3.5 0 019 10h.001c0 .98.39 1.85.98 2.5H9a4.5 4.5 0 01-4.5-4.5V7.5A3.5 3.5 0 019 4h6.001c0 .98.39 1.85.98 2.5H15A4.5 4.5 0 0110.5 11v2.5a3.5 3.5 0 01-5 0z" /></svg>`,
    calendar: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>`,
    edit: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>`,
    error: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
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
                ` : `<div class="absolute inset-0 cursor-pointer" data-lightbox-item="true" data-src="${item.url}"></div>`}
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

export function renderClassList(students, headers, { isEditing = false } = {}) {
    if (!headers || headers.length === 0) return '';
    const headerHtml = `
        <tr class="bg-gray-100 dark:bg-gray-800">
            ${headers.map(h => `<th class="border border-gray-300 dark:border-gray-700 p-3 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase text-center">${h.label}</th>`).join('')}
            ${isEditing ? `<th class="border border-gray-300 dark:border-gray-700 p-3 w-10"></th>` : ''}
        </tr>
    `;

    const bodyHtml = students.map((s, idx) => `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            ${headers.map(h => `
                <td class="border border-gray-300 dark:border-gray-700 p-2 text-sm text-center">
                    ${isEditing ? 
                        `<input type="text" value="${s[h.key] || ''}" data-student-id="${s.id}" data-field="${h.key}" class="w-full bg-transparent outline-none text-center focus:ring-1 focus:ring-indigo-300 rounded">` 
                        : (s[h.key] || '')}
                </td>
            `).join('')}
            ${isEditing ? `
                <td class="border border-gray-300 dark:border-gray-700 p-2 text-center">
                    <button data-action="delete-student" data-id="${s.id}" class="text-red-500 hover:text-red-700 transition-colors">${icons.trash}</button>
                </td>
            ` : ''}
        </tr>
    `).join('');

    return `
        <div class="flex flex-col gap-4">
            ${isEditing ? `
                <div class="flex justify-end">
                    <button data-action="add-student" class="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm">
                        ${icons.plus} Thêm học sinh
                    </button>
                </div>
            ` : ''}
            <div class="overflow-x-auto rounded-xl border border-gray-300 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900">
                <table class="w-full border-collapse">
                    <thead>${headerHtml}</thead>
                    <tbody>${bodyHtml || `<tr><td colspan="${headers.length + (isEditing?1:0)}" class="p-8 text-center text-gray-400">Chưa có dữ liệu học sinh</td></tr>`}</tbody>
                </table>
            </div>
        </div>
    `;
}

export function renderSchedule(schedule, { isEditing = false } = {}) {
    const days = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const sessions = ['morning', 'afternoon'];
    return `
        <div class="overflow-x-auto rounded-xl border border-gray-300 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900">
            <table class="w-full border-collapse text-center text-sm">
                <thead class="bg-indigo-600 text-white">
                    <tr><th class="border dark:border-gray-700 p-3">Tiết</th>${days.map(d => `<th class="border dark:border-gray-700 p-3 font-bold">${d}</th>`).join('')}</tr>
                </thead>
                <tbody>
                    ${sessions.map(s => `
                        <tr class="bg-gray-100 dark:bg-gray-800 font-bold"><td colspan="7" class="border dark:border-gray-700 p-2 text-xs uppercase tracking-wider">${s === 'morning' ? 'Buổi Sáng' : 'Buổi Chiều'}</td></tr>
                        ${[0,1,2,3,4].map(i => `
                            <tr>
                                <td class="border dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-700 font-bold text-indigo-600 dark:text-indigo-400">${i+1}</td>
                                ${days.map(d => {
                                    const val = schedule[d]?.[s]?.[i]?.subject || '';
                                    return `<td class="border dark:border-gray-700 p-1">
                                        ${isEditing ? `<textarea data-day="${d}" data-session="${s}" data-index="${i}" class="schedule-input w-full h-12 p-2 bg-transparent border-none text-center focus:ring-2 focus:ring-indigo-300 rounded-lg resize-none text-sm">${val}</textarea>` 
                                        : `<div class="min-h-[3rem] flex items-center justify-center p-2 font-medium">${val}</div>`}
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
