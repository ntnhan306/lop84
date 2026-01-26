
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
 * Worker sẽ tổng hợp dữ liệu từ D1 và KV.
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
    // Validate the structure of the fetched data. If anything is missing, return initial data.
    if (!data || !data.students || !data.schedule || !data.media || !data.studentColumns ||
        !Array.isArray(data.students) || !Array.isArray(data.media) || !Array.isArray(data.studentColumns)) 
    {
        console.warn('Dữ liệu từ Worker không hợp lệ hoặc trống. Trả về cấu trúc mặc định.');
        return getInitialData();
    }
    return data;
  } catch (error) {
    // Re-throw network hoặc parsing errors để lớp giao diện có thể xử lý chúng.
    throw error;
  }
}

/**
 * Gửi dữ liệu ứng dụng đến Cloudflare Worker để lưu.
 * Worker sẽ phân tách dữ liệu và lưu vào D1 và KV tương ứng.
 * @param {object} data - Đối tượng dữ liệu ứng dụng cần lưu.
 * @param {string} authToken - Token xác thực phiên nhận được sau khi đăng nhập thành công.
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function saveAppData(data, authToken) {
     try {
        const response = await fetch(`${API_ENDPOINT_BASE}/data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ authToken, payload: data }),
        });

        const result = await response.json();

        if (!response.ok) {
           throw new Error(result.message || `Máy chủ phản hồi lỗi HTTP ${response.status}`);
        }
        
        return { success: true, message: result.message };

    } catch (error) {
        console.error('Lỗi khi lưu dữ liệu:', error);
        return { success: false, message: `Lỗi khi đồng bộ: ${error.message}` };
    }
}

/**
 * Gửi mật khẩu thô đến server để xác thực.
 * @param {string} password - Mật khẩu người dùng nhập vào.
 * @returns {Promise<{success: boolean, token: string|null, message: string}>}
 */
export async function authenticate(password) {
    try {
        const response = await fetch(`${API_ENDPOINT_BASE}/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || `Lỗi HTTP ${response.status}`);
        }
        return { success: true, token: result.token, message: result.message };
    } catch (error) {
        console.error("Lỗi xác thực:", error);
        return { success: false, token: null, message: error.message };
    }
}


/**
 * Gửi yêu cầu thay đổi mật khẩu đến server.
 * @param {{currentPassword: string, newPassword: string, authToken: string}} passwordData
 * @returns {Promise<{success: boolean, newToken: string|null, message: string}>}
 */
export async function updatePassword({ currentPassword, newPassword, authToken }) {
    try {
        const response = await fetch(`${API_ENDPOINT_BASE}/password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword, newPassword, authToken }),
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || `Lỗi HTTP ${response.status}`);
        }
        return { success: true, newToken: result.newToken, message: result.message };
    } catch (error) {
        console.error("Lỗi khi cập nhật mật khẩu:", error);
        return { success: false, newToken: null, message: error.message };
    }
}

/**
 * Lấy dữ liệu ứng dụng từ localStorage của trình duyệt. Dùng cho trang chỉnh sửa.
 */
export function getAppDataFromStorage() {
  try {
    const item = window.localStorage.getItem(APP_DATA_KEY);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Lỗi khi đọc từ localStorage', error);
    return null;
  }
}

/**
 * Lưu dữ liệu ứng dụng vào localStorage của trình duyệt. Dùng cho trang chỉnh sửa.
 */
export function saveAppDataToStorage(data) {
  try {
    window.localStorage.setItem(APP_DATA_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Lỗi khi ghi vào localStorage', error);
  }
}
