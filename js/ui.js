const PencilIcon = () => `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>`;
const TrashIcon = () => `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>`;

export function renderGallery(media, isEditing = false) {
    if (media.length === 0) {
        return `<p class="text-gray-500 dark:text-gray-400">Chưa có ảnh hoặc video nào.</p>`;
    }
    const items = media.map(item => `
        <div key="${item.id}" class="group relative overflow-hidden rounded-lg shadow-lg">
            ${item.type === 'image' ? 
                `<img src="${item.url}" alt="${item.caption || 'Gallery image'}" class="w-full h-56 object-cover transform group-hover:scale-110 transition-transform duration-300" />` :
                `<div class="w-full h-56 bg-black flex items-center justify-center">
                    <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="text-white text-center p-2 hover:underline">Video: ${item.caption || 'Xem video'}</a>
                 </div>`
            }
            <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex flex-col justify-end p-4">
                <p class="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">${item.caption || ''}</p>
                ${isEditing ? `
                    <div class="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button data-action="edit-media" data-id="${item.id}" class="p-2 bg-blue-500 rounded-full text-white hover:bg-blue-600">${PencilIcon()}</button>
                        <button data-action="delete-media" data-id="${item.id}" class="p-2 bg-red-500 rounded-full text-white hover:bg-red-600">${TrashIcon()}</button>
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
    return `<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">${items}</div>`;
}

export function renderClassList(students, isEditing = false) {
    const headers = ['STT', 'Họ và Tên', 'Mã học sinh', 'Ngày sinh', 'Số điện thoại', 'Ghi chú'];
    if (isEditing) headers.push('Hành động');

    const headerHtml = headers.map(h => `<th scope="col" class="px-6 py-3">${h}</th>`).join('');
    
    let bodyHtml;
    if (students.length === 0) {
        bodyHtml = `<tr><td colspan="${headers.length}" class="text-center py-4">Chưa có thông tin học sinh.</td></tr>`;
    } else {
        bodyHtml = students.map((student, index) => `
            <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                <td class="px-6 py-4">${index + 1}</td>
                <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">${student.name}</td>
                <td class="px-6 py-4">${student.studentId}</td>
                <td class="px-6 py-4">${student.dob}</td>
                <td class="px-6 py-4">${student.phone}</td>
                <td class="px-6 py-4">${student.notes || ''}</td>
                ${isEditing ? `
                    <td class="px-6 py-4 flex space-x-2">
                        <button data-action="edit-student" data-id="${student.id}" class="font-medium text-blue-600 dark:text-blue-500 hover:underline">Sửa</button>
                        <button data-action="delete-student" data-id="${student.id}" class="font-medium text-red-600 dark:text-red-500 hover:underline">Xóa</button>
                    </td>` : ''
                }
            </tr>
        `).join('');
    }

    return `
        <div class="overflow-x-auto">
            <table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>${headerHtml}</tr>
                </thead>
                <tbody>${bodyHtml}</tbody>
            </table>
        </div>`;
}

export function renderSchedule(schedule, isEditing = false) {
    const daysOfWeek = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const sessions = [{name: 'Sáng', key: 'morning'}, {name: 'Chiều', key: 'afternoon'}];
    const periods = [1, 2, 3, 4, 5];

    let tableHtml = `
    <div class="overflow-x-auto">
      <table class="w-full border-collapse border border-gray-300 dark:border-gray-600">
        <thead>
          <tr class="bg-gray-100 dark:bg-gray-700">
            <th class="border p-2 dark:border-gray-600" colspan="2">Buổi / Tiết</th>
            ${daysOfWeek.map(day => `<th class="border p-2 dark:border-gray-600 font-semibold">${day}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
    `;

    sessions.forEach(session => {
        periods.forEach((period, periodIndex) => {
            tableHtml += `<tr class="text-center even:bg-gray-50 dark:even:bg-gray-800">`;
            if (periodIndex === 0) {
                tableHtml += `<td rowspan="5" class="border p-2 dark:border-gray-600 font-medium align-middle w-16">${session.name}</td>`;
            }
            tableHtml += `<td class="border p-2 dark:border-gray-600 font-medium w-16">Tiết ${period}</td>`;
            
            daysOfWeek.forEach(day => {
                const subject = schedule[day]?.[session.key]?.[periodIndex]?.subject || '';
                tableHtml += `<td class="border p-1 dark:border-gray-600 h-16">`;
                if (isEditing) {
                    tableHtml += `<input
                        type="text"
                        value="${subject}"
                        data-day="${day}"
                        data-session="${session.key}"
                        data-period="${periodIndex}"
                        class="w-full h-full text-center bg-transparent focus:bg-white dark:focus:bg-gray-700 outline-none rounded-md"
                    />`;
                } else {
                    tableHtml += `<span class="p-2 block">${subject}</span>`;
                }
                tableHtml += `</td>`;
            });
            tableHtml += `</tr>`;
        });
    });

    tableHtml += `</tbody></table></div>`;
    return tableHtml;
}