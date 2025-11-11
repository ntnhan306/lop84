import { getAppData } from './data.js';
import { renderGallery, renderClassList, renderSchedule } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    const data = getAppData();

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
});