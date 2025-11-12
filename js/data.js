// URL cơ sở của Cloudflare Worker
const API_ENDPOINT_BASE = "https://lop84.nhanns23062012.workers.dev";

const APP_DATA_KEY = 'lop84_app_data_local_edit';

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
        students: [],
        schedule: initialSchedule,
        media: [],
    };
};

/**
 * Lấy dữ liệu ứng dụng mới nhất từ Cloudflare Worker (đọc từ KV).
 */
export async function fetchAppData() {
  try {
    const response = await fetch(`${API_ENDPOINT_BASE}/data`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Không thể đọc nội dung lỗi.');
        console.error(`Lỗi HTTP ${response.status} khi lấy dữ liệu từ Worker. Phản hồi: ${errorText}`);
        alert(`Không thể tải dữ liệu của lớp (Lỗi: ${response.status}). Vui lòng thử lại sau. Kiểm tra console (F12) để biết thêm chi tiết.`);
        return getInitialData();
    }
    const data = await response.json();
    if (!data.students || !data.schedule || !data.media) {
        console.warn('Dữ liệu từ Worker thiếu các trường cần thiết. Sử dụng dữ liệu ban đầu.');
        return getInitialData();
    }
    return data;
  } catch (error) {
    console.error('Lỗi mạng hoặc lỗi parse JSON khi lấy dữ liệu:', error);
    alert('Có lỗi mạng xảy ra khi tải dữ liệu của lớp. Vui lòng kiểm tra kết nối internet.');
    return getInitialData();
  }
}

/**
 * Gửi dữ liệu ứng dụng đến Cloudflare Worker để lưu vào KV.
 * @param {object} data - Đối tượng dữ liệu ứng dụng cần lưu.
 * @param {string} authToken - Password hash đã được xác thực để chứng minh quyền ghi.
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function saveAppDataToKV(data, authToken) {
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
        console.error('Lỗi khi lưu dữ liệu vào KV:', error);
        return { success: false, message: `Lỗi khi đồng bộ: ${error.message}` };
    }
}

/**
 * Lấy password hash từ server. Server sẽ tự tạo hash mặc định nếu chưa tồn tại.
 * @returns {Promise<string|null>}
 */
export async function fetchPasswordHash() {
    try {
        const response = await fetch(`${API_ENDPOINT_BASE}/password`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Lỗi máy chủ: ${response.status} - ${errorText}`);
        }
        const { hash } = await response.json();
        return hash;
    } catch (error) {
        console.error("Không thể lấy password hash:", error);
        alert(`Không thể kết nối đến máy chủ xác thực: ${error.message}`);
        return null;
    }
}

/**
 * Gửi yêu cầu thay đổi mật khẩu đến server.
 * @param {{currentPasswordHash: string, newPasswordHash: string}} passwordData
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function updatePasswordOnKV({ currentPasswordHash, newPasswordHash }) {
    try {
        const response = await fetch(`${API_ENDPOINT_BASE}/password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPasswordHash, newPasswordHash }),
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || `Lỗi HTTP ${response.status}`);
        }
        return { success: true, message: result.message };
    } catch (error) {
        console.error("Lỗi khi cập nhật mật khẩu:", error);
        return { success: false, message: error.message };
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