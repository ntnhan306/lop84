import { fetchAppData } from './data.js';
import { renderGallery, renderClassList, renderSchedule, icons, openLightbox } from './ui.js';

// --- State Management ---
let appData = null;
let currentView = null; // 'gallery', 'classlist', or 'schedule'
const POLLING_INTERVAL = 100; // Fetch new data every 100ms

// --- DOM Elements ---
const navButtons = document.querySelectorAll('.nav-button');
const placeholder = document.getElementById('placeholder');
const sections = {
    gallery: document.getElementById('gallery-section'),
    classlist: document.getElementById('classlist-section'),
    schedule: document.getElementById('schedule-section'),
};
const containers = {
    gallery: document.getElementById('gallery-container'),
    classlist: document.getElementById('classlist-container'),
    schedule: document.getElementById('schedule-container'),
};
const sectionIcons = {
    gallery: document.getElementById('gallery-icon'),
    classlist: document.getElementById('classlist-icon'),
    schedule: document.getElementById('schedule-icon'),
}

/**
 * Renders the content for the currently active view.
 * Only updates the DOM for the visible section to improve performance.
 */
function renderActiveView() {
    if (!appData || !currentView) {
        return;
    }

    // Only render the active container
    switch (currentView) {
        case 'gallery':
            containers.gallery.innerHTML = renderGallery(appData.media, false);
            break;
        case 'classlist':
            containers.classlist.innerHTML = renderClassList(appData.students, false);
            break;
        case 'schedule':
            containers.schedule.innerHTML = renderSchedule(appData.schedule, false);
            break;
    }
}

/**
 * Sets the active view, updates UI (buttons, sections), and triggers an initial render.
 * @param {string} viewName - The name of the view to activate.
 */
function setActiveView(viewName) {
    if (currentView === viewName) return; // Do nothing if view is already active

    currentView = viewName;

    // Update button styles
    navButtons.forEach(button => {
        if (button.dataset.view === viewName) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });

    // Hide placeholder and show the correct section
    placeholder.classList.add('hidden');
    Object.values(sections).forEach(section => section.classList.add('hidden'));
    if (sections[viewName]) {
        sections[viewName].classList.remove('hidden');
    }

    // Render the new view immediately with existing data
    renderActiveView();
}

/**
 * Starts polling the server for new data at a regular interval.
 */
function startDataPolling() {
    setInterval(async () => {
        try {
            // Fetch the latest data from the server
            const newData = await fetchAppData();
            // Simple deep comparison to avoid unnecessary re-renders if data is the same
            if (JSON.stringify(newData) !== JSON.stringify(appData)) {
                appData = newData;
                // Re-render only the currently visible section with the new data
                renderActiveView();
            }
        } catch (error) {
            console.error("Failed to poll for new data:", error);
        }
    }, POLLING_INTERVAL);
}


/**
 * Initializes the application: attaches event listeners and starts the data polling.
 */
async function init() {
    // Inject icons into buttons and sections
    document.querySelector('[data-view="gallery"]').prepend(new DOMParser().parseFromString(icons.gallery, 'image/svg+xml').documentElement);
    document.querySelector('[data-view="classlist"]').prepend(new DOMParser().parseFromString(icons.users, 'image/svg+xml').documentElement);
    document.querySelector('[data-view="schedule"]').prepend(new DOMParser().parseFromString(icons.calendar, 'image/svg+xml').documentElement);
    document.getElementById('edit-link').prepend(new DOMParser().parseFromString(icons.edit, 'image/svg+xml').documentElement);
    sectionIcons.gallery.innerHTML = icons.gallery;
    sectionIcons.classlist.innerHTML = icons.users;
    sectionIcons.schedule.innerHTML = icons.calendar;
    placeholder.innerHTML = `
        <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
        </div>
        <h2 class="mt-6 text-2xl font-semibold text-gray-700 dark:text-gray-300">Chào mừng bạn!</h2>
        <p class="mt-2 text-gray-500 dark:text-gray-400">Vui lòng chọn một mục từ thanh điều hướng ở trên để xem thông tin.</p>
    `;


    // Attach click handlers to navigation buttons
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            setActiveView(button.dataset.view);
        });
    });

    // Event delegation for opening the lightbox
    document.addEventListener('click', (e) => {
        const lightboxTrigger = e.target.closest('[data-lightbox-item="true"]');
        if (lightboxTrigger) {
            const src = lightboxTrigger.dataset.src;
            if (src) {
                e.preventDefault();
                openLightbox(src);
            }
        }
    });


    // Show initial loading message
    Object.values(containers).forEach(container => {
        container.innerHTML = `<p class="text-gray-500 dark:text-gray-400 text-center py-8">Đang tải dữ liệu...</p>`;
    });

    // Perform the first data fetch immediately
    try {
        appData = await fetchAppData();
        if (currentView) {
            renderActiveView();
        }
    } catch (error) {
        console.error("Initial data fetch failed:", error);
        Object.values(containers).forEach(container => {
            container.innerHTML = `<p class="text-red-500 dark:text-red-400 text-center py-8">Không thể tải dữ liệu.</p>`;
        });
    }

    // Start the continuous polling for updates
    startDataPolling();
}

// --- App Entry Point ---
document.addEventListener('DOMContentLoaded', init);