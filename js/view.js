import { fetchAppData } from './data.js';
import { renderGallery, renderClassList, renderSchedule, icons, openLightbox } from './ui.js';

// --- State Management ---
let appData = null;
let currentView = 'gallery'; // Default view
const POLLING_INTERVAL = 5000; // 5 seconds
const INACTIVE_POLLING_INTERVAL = 30000; // 30 seconds
let currentPollingInterval = POLLING_INTERVAL;
let pollTimeoutId = null;
let isFirstLoad = true;
let lastConnectionStatus = '';
let fetchFailures = 0;
const FAILURE_THRESHOLD = 2;

// --- DOM Elements ---
const navTabs = document.querySelectorAll('.nav-tab');
const viewContent = document.getElementById('view-content');
const connectionStatusEl = document.getElementById('connection-status');


function updateConnectionStatus(status) {
    if (!connectionStatusEl || lastConnectionStatus === status) return;
    lastConnectionStatus = status;

    let icon, text, colorClass;

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


function renderActiveView() {
    if (!appData || !currentView || !viewContent) {
        return;
    }
    
    let contentHTML = '';
    switch (currentView) {
        case 'gallery':
            contentHTML = renderGallery(appData.media, { isEditing: false });
            break;
        case 'classlist':
            contentHTML = renderClassList(appData.students, appData.studentColumns, { isEditing: false });
            break;
        case 'schedule':
            contentHTML = renderSchedule(appData.schedule, false);
            break;
    }
    viewContent.innerHTML = contentHTML;
}

function setActiveView(viewName) {
    if (currentView === viewName && !isFirstLoad) return;

    currentView = viewName;

    navTabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.view === viewName);
    });

    renderActiveView();
}

async function pollForData(force = false) {
    if (pollTimeoutId) clearTimeout(pollTimeoutId);
    
    // If the page is not visible and we are not forcing a poll, schedule the next one and exit
    if (document.hidden && !force) {
        pollTimeoutId = setTimeout(pollForData, currentPollingInterval);
        return;
    }

    try {
        if (isFirstLoad) {
            updateConnectionStatus('loading');
        }

        const newData = await fetchAppData();
        updateConnectionStatus('connected');
        fetchFailures = 0;

        if (JSON.stringify(newData) !== JSON.stringify(appData)) {
            appData = newData;
            renderActiveView();
        }
        
        if (isFirstLoad) {
            isFirstLoad = false;
        }
        
    } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
        fetchFailures++;
        if (fetchFailures >= FAILURE_THRESHOLD) {
            updateConnectionStatus('disconnected');
        }

        if (isFirstLoad) {
            isFirstLoad = false;
            viewContent.innerHTML = `
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 text-center">
                    <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400">
                        ${icons.error.replace('w-5 h-5', 'w-8 h-8')}
                    </div>
                    <h2 class="mt-6 text-2xl font-semibold text-gray-700 dark:text-gray-300">Không thể tải dữ liệu</h2>
                    <p class="mt-2 text-gray-500 dark:text-gray-400">Đã xảy ra lỗi khi kết nối đến máy chủ. Trang sẽ tự động thử lại.</p>
                </div>
            `;
        }
    } finally {
        pollTimeoutId = setTimeout(pollForData, currentPollingInterval);
    }
}


function handleVisibilityChange() {
    if (document.hidden) {
        // Tab is inactive, slow down polling
        currentPollingInterval = INACTIVE_POLLING_INTERVAL;
    } else {
        // Tab is active, speed up polling and poll immediately
        currentPollingInterval = POLLING_INTERVAL;
        pollForData(true); // Force an immediate poll
    }
}

async function init() {
    // Inject icons
    document.querySelector('[data-view="gallery"]').prepend(new DOMParser().parseFromString(icons.gallery, 'image/svg+xml').documentElement);
    document.querySelector('[data-view="classlist"]').prepend(new DOMParser().parseFromString(icons.users, 'image/svg+xml').documentElement);
    document.querySelector('[data-view="schedule"]').prepend(new DOMParser().parseFromString(icons.calendar, 'image/svg+xml').documentElement);
    document.getElementById('edit-link').prepend(new DOMParser().parseFromString(icons.edit, 'image/svg+xml').documentElement);
    
    // Initial placeholder
    viewContent.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 text-center">
            <h2 class="text-2xl font-semibold text-gray-700 dark:text-gray-300">Đang tải dữ liệu...</h2>
            <p class="mt-2 text-gray-500 dark:text-gray-400">Vui lòng đợi trong giây lát.</p>
        </div>
    `;

    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            setActiveView(tab.dataset.view);
        });
    });

    document.addEventListener('click', (e) => {
        const lightboxTrigger = e.target.closest('[data-lightbox-item="true"]');
        if (lightboxTrigger?.dataset.src) {
            e.preventDefault();
            openLightbox(lightboxTrigger.dataset.src);
        }
    });
    
    // Listen for tab visibility changes to optimize polling
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    setActiveView(currentView); // Set initial active tab style
    pollForData();
}

document.addEventListener('DOMContentLoaded', init);