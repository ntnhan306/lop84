const APP_DATA_KEY = 'lop84_app_data';

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

export function getAppData() {
  try {
    const item = window.localStorage.getItem(APP_DATA_KEY);
    if (item) {
        const data = JSON.parse(item);
        // Ensure schedule is always fully formed to prevent errors
        if (!data.schedule || Object.keys(data.schedule).length < 6) {
            data.schedule = initialSchedule;
        }
        return data;
    }
    return getInitialData();
  } catch (error) {
    console.error('Error reading from localStorage', error);
    return getInitialData();
  }
}

export function saveAppData(data) {
  try {
    window.localStorage.setItem(APP_DATA_KEY, JSON.stringify(data));
  } catch (error)
 {
    console.error('Error writing to localStorage', error);
  }
}