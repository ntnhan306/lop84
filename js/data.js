
const API_ENDPOINT_BASE = "https://lop84.nhanns23062012.workers.dev";

const getInitialData = () => {
    // Tiêu đề cột đơn giản của v4.0
    const initialHeaders = [
        { label: 'STT', key: 'stt' },
        { label: 'Họ và Tên', key: 'name' },
        { label: 'Tên đăng nhập', key: 'username' },
        { label: 'Mật khẩu', key: 'password' },
        { label: 'Ghi chú', key: 'note' }
    ];

    // Dữ liệu học sinh dạng phẳng (Key-Value)
    const initialStudents = [
        {
            id: 's1',
            stt: '1',
            name: 'Nguyễn Văn A',
            username: 'vana84',
            password: '123456',
            note: 'Lớp trưởng'
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
        return "";
    }
}

export async function fetchAppData() {
    try {
        const response = await fetch(`${API_ENDPOINT_BASE}/data`, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Lỗi ${response.status}`);
        const data = await response.json();
        // Kiểm tra nếu dữ liệu cũ/mới tương thích, nếu không reset về mẫu
        return (data && data.students && typeof data.students[0]?.cells === 'undefined') ? data : getInitialData();
    } catch (error) {
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
