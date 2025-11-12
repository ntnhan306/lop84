// URL của Cloudflare Worker đóng vai trò là API endpoint
const API_ENDPOINT = "https://lop84.nhanns23062012.workers.dev/";

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
    const response = await fetch(API_ENDPOINT, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        // Thêm cache-busting để đảm bảo luôn lấy dữ liệu mới nhất
        cache: 'no-store'
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Không thể lấy dữ liệu từ Worker, lỗi:', response.status, errorText);
        alert(`Không thể tải dữ liệu của lớp (Lỗi: ${response.status}). Vui lòng thử lại sau.`);
        return getInitialData();
    }
    const data = await response.json();
    // Validate cơ bản để đảm bảo dữ liệu có cấu trúc đúng
    if (!data.students || !data.schedule || !data.media) {
        console.warn('Dữ liệu từ Worker thiếu các trường cần thiết. Sử dụng dữ liệu ban đầu.');
        return getInitialData();
    }
    return data;
  } catch (error) {
    console.error('Lỗi khi fetch hoặc parse dữ liệu từ Worker:', error);
    alert('Có lỗi xảy ra khi tải dữ liệu của lớp.');
    return getInitialData();
  }
}

/**
 * Gửi dữ liệu ứng dụng đến Cloudflare Worker để lưu vào KV.
 * @param {object} data - Đối tượng dữ liệu ứng dụng cần lưu.
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function saveAppDataToKV(data) {
     try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
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