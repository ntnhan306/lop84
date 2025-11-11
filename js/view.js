import { fetchAppData } from './data.js';
import { renderGallery, renderClassList, renderSchedule } from './ui.js';

function showLoading() {
    const containers = ['gallery-container', 'classlist-container', 'schedule-container'];
    containers.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = `<p class="text-gray-500 dark:text-gray-400">Đang tải dữ liệu...</p>`;
    });
}

function render(data) {
    const galleryContainer = document.getElementById('gallery-container');
    const classlistContainer = document.getElementById('classlist-container');
    const scheduleContainer = document.getElementById('schedule-container');

    if (galleryContainer) {
        galleryContainer.innerHTML = renderGallery(data.media, false);
    }
    if (classlistContainer) {
        classlistContainer.innerHTML = renderClassList(data.students, false);
    }
    if (scheduleContainer) {
        scheduleContainer.innerHTML = renderSchedule(data.schedule, false);
    }
}

async function main() {
    showLoading();
    const data = await fetchAppData();
    render(data);
}

document.addEventListener('DOMContentLoaded', main);
