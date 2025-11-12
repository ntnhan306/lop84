import { fetchAppData } from './data.js';
import { renderGallery, renderClassList, renderSchedule } from './ui.js';

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
            appData = await fetchAppData();
            // Re-render only the currently visible section with the new data
            renderActiveView();
        } catch (error) {
            console.error("Failed to poll for new data:", error);
            // Optionally, display an error indicator to the user
        }
    }, POLLING_INTERVAL);
}


/**
 * Initializes the application: attaches event listeners and starts the data polling.
 */
async function init() {
    // Attach click handlers to navigation buttons
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            setActiveView(button.dataset.view);
        });
    });

    // Show initial loading message in containers
    Object.values(containers).forEach(container => {
        container.innerHTML = `<p class="text-gray-500 dark:text-gray-400">Đang tải dữ liệu...</p>`;
    });

    // Perform the first data fetch immediately
    try {
        appData = await fetchAppData();
        // If a view is already selected, render it. Otherwise, user will see the placeholder.
        if (currentView) {
            renderActiveView();
        }
    } catch (error) {
        console.error("Initial data fetch failed:", error);
        Object.values(containers).forEach(container => {
            container.innerHTML = `<p class="text-red-500 dark:text-red-400">Không thể tải dữ liệu.</p>`;
        });
    }

    // Start the continuous polling for updates
    startDataPolling();
}

// --- App Entry Point ---
document.addEventListener('DOMContentLoaded', init);
