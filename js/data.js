const APP_DATA_KEY = 'lop84_app_data_local_edit'; // Changed key to avoid conflicts
const DATA_FILE_PATH = '../data/data.json';

// Initial structure, used as a fallback
const initialSchedule = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'].reduce((acc, day) => {
    acc[day] = {
        morning: Array(5).fill({ subject: '' }),
        afternoon: Array(5).fill({ subject: '' }),
    };
    return acc;
}, {});

const getInitialData = () => ({
  students: [],
  schedule: initialSchedule,
  media: [],
});

/**
 * Fetches the shared application data from the data.json file.
 */
export async function fetchAppData() {
  try {
    // Add a cache-busting query parameter to ensure the latest version is fetched
    const response = await fetch(`${DATA_FILE_PATH}?cachebust=${new Date().getTime()}`);
    if (!response.ok) {
        console.error('Failed to fetch data.json, server responded with:', response.status);
        alert('Không thể tải dữ liệu của lớp. Vui lòng thử lại sau.');
        return getInitialData();
    }
    const data = await response.json();
    // Basic validation to ensure the data has the expected structure
    if (!data.students || !data.schedule || !data.media) {
        console.warn('Fetched data is missing required fields. Using initial data.');
        return getInitialData();
    }
    return data;
  } catch (error) {
    console.error('Error fetching or parsing data.json:', error);
    alert('Có lỗi xảy ra khi tải dữ liệu của lớp.');
    return getInitialData(); // Return default data on error
  }
}

/**
 * Gets the app data from the browser's localStorage. Used for the edit page.
 */
export function getAppDataFromStorage() {
  try {
    const item = window.localStorage.getItem(APP_DATA_KEY);
    return item ? JSON.parse(item) : null; // Return null if nothing is stored
  } catch (error) {
    console.error('Error reading from localStorage', error);
    return null;
  }
}

/**
 * Saves the app data to the browser's localStorage. Used for the edit page.
 */
export function saveAppDataToStorage(data) {
  try {
    window.localStorage.setItem(APP_DATA_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error writing to localStorage', error);
  }
}
