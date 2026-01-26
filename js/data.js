
const API_ENDPOINT_BASE = "https://lop84.nhanns23062012.workers.dev";
const APP_DATA_KEY = 'lop84_app_data_v5_stable';

const getInitialData = () => {
    // Cấu trúc tiêu đề 2 tầng mặc định
    const initialHeaders = [
        [
            { label: 'STT', rowSpan: 2, colSpan: 1, key: 'stt' },
            { label: 'Họ và Tên', rowSpan: 2, colSpan: 1, key: 'name' },
            { label: 'Tài khoản', rowSpan: 1, colSpan: 2, key: 'account_group' },
            { label: 'Ghi chú', rowSpan: 2, colSpan: 1, key: 'note' }
        ],
        [
            { label: 'Tên đăng nhập', key: 'username' },
            { label: 'Mật khẩu', key: 'password' }
        ]
    ];

    // Dữ liệu học sinh dạng ô (cells) để hỗ trợ rowSpan/colSpan
    const initialStudents = [
        {
            id: 's1',
            cells: {
                stt: { value: '1' },
                name: { value: 'Nguyễn Văn A' },
                username: { value: 'vana84' },
                password: { value: '123456' },
                note: { value: 'Lớp trưởng' }
            }
        }
    ];

    const initialSchedule = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'].reduce((acc, day) => {
        acc[day] = {
            morning: Array(5).fill({ subject: '' }),
            afternoon: Array(5).fill({ subject: '' }),
        };
        return acc;
    }, {});

    return {
        students: initialStudents,
        headers: initialHeaders,
        schedule: initialSchedule,
        media: [],
    };
};

export async function fetchNoImage() {
    try {
        const response = await fetch('../data/no_image.txt');
        const text = await response.text();
        return text.trim();
    } catch (e) {
        console.error("Lỗi đọc no_image.txt:", e);
        return "";
    }
}

export async function fetchAppData() {
    try {
        const response = await fetch(`${API_ENDPOINT_BASE}/data`, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Lỗi ${response.status}`);
        const data = await response.json();
        return data && data.headers ? data : getInitialData();
    } catch (error) {
        console.warn("Dùng dữ liệu mẫu");
        return getInitialData();
    }
}

export async function saveAppData(data, authToken) {
    try {
        const response = await fetch(`${API_ENDPOINT_BASE}/data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ authToken, payload: data }),
        });
        return await response.json();
    } catch (error) {
        return { success: false, message: error.message };
    }
}

export async function authenticate(password) {
    const response = await fetch(`${API_ENDPOINT_BASE}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
    });
    return await response.json();
}

export async function updatePassword(payload) {
    const response = await fetch(`${API_ENDPOINT_BASE}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return await response.json();
}

export function saveAppDataToStorage(data) {
    window.localStorage.setItem(APP_DATA_KEY, JSON.stringify(data));
}
