
// URL cơ sở của Cloudflare Worker
const API_ENDPOINT_BASE = "https://lop84.nhanns23062012.workers.dev";

const APP_DATA_KEY = 'lop84_app_data_local_edit_v3';

// Cấu trúc dữ liệu ban đầu, dùng như một phương án dự phòng an toàn
const getInitialData = () => {
    const initialSchedule = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'].reduce((acc, day) => {
        acc[day] = {
            morning: Array(5).fill({ subject: '' }),
            afternoon: Array(5).fill({ subject: '' }),
        };
        return acc;
    }, {});
    return {
        students: [{ id: 'sample-1', stt: '1', name: 'Nguyễn Văn A' }],
        studentColumns: [
            { key: 'stt', label: 'STT' },
            { key: 'name', label: 'Họ và Tên' }
        ],
        merges: [], // Lưu trữ mảng các vùng gộp: {sR, sC, eR, eC}
        schedule: initialSchedule,
        media: [],
    };
};

/**
 * Lấy chuỗi base64 cho ảnh placeholder
 */
export async function fetchNoImage() {
    try {
        const response = await fetch('../data/no_image.txt');
        return await response.text();
    } catch (e) {
        console.error("Could not load no_image.txt", e);
        return "";
    }
}

/**
 * Lấy dữ liệu ứng dụng mới nhất từ Cloudflare Worker.
 */
export async function fetchAppData() {
  try {
    const response = await fetch(`${API_ENDPOINT_BASE}/data`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => `Máy chủ phản hồi với mã lỗi ${response.status}`);
        throw new Error(`Lỗi HTTP ${response.status}: ${errorText}`);
    }
    const data = await response.json();
    if (!data || !data.students || !data.schedule || !data.media || !data.studentColumns) {
        return getInitialData();
    }
    if (!data.merges) data.merges = [];
    return data;
  } catch (error) {
    throw error;
  }
}

export async function saveAppData(data, authToken) {
     try {
        const response = await fetch(`${API_ENDPOINT_BASE}/data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ authToken, payload: data }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message || `Lỗi HTTP ${response.status}`);
        return { success: true, message: result.message };
    } catch (error) {
        console.error('Lỗi khi lưu dữ liệu:', error);
        return { success: false, message: `Lỗi khi đồng bộ: ${error.message}` };
    }
}

export async function authenticate(password) {
    try {
        const response = await fetch(`${API_ENDPOINT_BASE}/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || `Lỗi HTTP ${response.status}`);
        return { success: true, token: result.token, message: result.message };
    } catch (error) {
        return { success: false, token: null, message: error.message };
    }
}

export async function updatePassword({ currentPassword, newPassword, authToken }) {
    try {
        const response = await fetch(`${API_ENDPOINT_BASE}/password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword, newPassword, authToken }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || `Lỗi HTTP ${response.status}`);
        return { success: true, newToken: result.newToken, message: result.message };
    } catch (error) {
        return { success: false, newToken: null, message: error.message };
    }
}

export function getAppDataFromStorage() {
  try {
    const item = window.localStorage.getItem(APP_DATA_KEY);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    return null;
  }
}

export function saveAppDataToStorage(data) {
  try {
    window.localStorage.setItem(APP_DATA_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Lỗi khi ghi vào localStorage', error);
  }
}
