import { fetchAppData } from './data.js';
import { renderGallery, renderClassList, renderSchedule, icons, openLightbox } from './ui.js';

// --- State Management ---
let appData = null;
let currentView = null;
const POLLING_INTERVAL = 2000; // Fetch new data every 2 seconds
let pollTimeoutId = null;
let isFirstLoad = true;
let lastConnectionStatus = '';

// --- DOM Elements ---
const navButtons = document.querySelectorAll('.nav-button');
const placeholder = document.getElementById('placeholder');
const connectionStatusEl = document.getElementById('connection-status');
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
 * Updates the connection status indicator in the header.
 * @param {'loading'|'connected'|'disconnected'} status - The current connection status.
 */
function updateConnectionStatus(status) {
    if (!connectionStatusEl || lastConnectionStatus === status) return;
    lastConnectionStatus = status;

    let icon = '';
    let text = '';
    let colorClass = '';

    switch (status) {
        case 'loading':
            icon = `<svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
            text = 'Đang tải...';
            colorClass = 'text-gray-500 dark:text-gray-400';
            break;
        case 'connected':
            icon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>`;
            text = 'Đã kết nối';
            colorClass = 'text-green-500 dark:text-green-400';
            break;
        case 'disconnected':
            icon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>`;
            text = 'Mất kết nối. Đang thử lại...';
            colorClass = 'text-red-500 dark:text-red-400';
            break;
    }

    connectionStatusEl.innerHTML = `${icon}<span>${text}</span>`;
    connectionStatusEl.className = `flex items-center gap-2 text-sm ${colorClass}`;
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
            containers.gallery.innerHTML = renderGallery(appData.media, { isEditing: false });
            break;
        case 'classlist':
            containers.classlist.innerHTML = renderClassList(appData.students, appData.studentColumns, { isEditing: false });
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
 * Fetches data from the server and schedules the next fetch.
 * This is a self-correcting loop using setTimeout.
 */
async function pollForData() {
    if (pollTimeoutId) clearTimeout(pollTimeoutId);

    try {
        if (isFirstLoad) {
            updateConnectionStatus('loading');
        }

        const newData = await fetchAppData();
        updateConnectionStatus('connected');

        if (JSON.stringify(newData) !== JSON.stringify(appData)) {
            appData = newData;
            // For both initial load and subsequent updates, render the active view.
            renderActiveView();
        }
        
        if (isFirstLoad) {
            isFirstLoad = false;
        }
        
    } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
        updateConnectionStatus('disconnected');
        if (isFirstLoad) {
            isFirstLoad = false;
            // On first load failure, update the placeholder to show a persistent error.
            placeholder.innerHTML = `
                <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400">
                    ${icons.error.replace('w-5 h-5', 'w-8 h-8')}
                </div>
                <h2 class="mt-6 text-2xl font-semibold text-gray-700 dark:text-gray-300">Không thể tải dữ liệu</h2>
                <p class="mt-2 text-gray-500 dark:text-gray-400">Đã xảy ra lỗi khi kết nối đến máy chủ. Trang sẽ tự động thử lại.</p>
            `;
        }
    } finally {
        // Schedule the next poll regardless of the outcome.
        pollTimeoutId = setTimeout(pollForData, POLLING_INTERVAL);
    }
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
    
    // Set initial placeholder text
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

    // Start the data polling loop.
    pollForData();
}

// --- App Entry Point ---
document.addEventListener('DOMContentLoaded', init);