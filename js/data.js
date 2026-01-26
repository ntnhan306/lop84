
const API_ENDPOINT_BASE = "https://lop84.nhanns23062012.workers.dev";

const getInitialData = () => {
    const initialHeaders = [
        { label: 'STT', key: 'stt' },
        { label: 'Họ và Tên', key: 'name' },
        { label: 'Tên đăng nhập', key: 'username' },
        { label: 'Mật khẩu', key: 'password' },
        { label: 'Ghi chú', key: 'note' }
    ];

    const createEmptyRow = (id, stt) => {
        const row = { id };
        initialHeaders.forEach(h => {
            row[h.key] = { text: h.key === 'stt' ? stt : '', rowSpan: 1, colSpan: 1, hidden: false };
        });
        return row;
    };

    return {
        students: [createEmptyRow('s1', '1')],
        headers: initialHeaders,
        schedule: ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'].reduce((acc, day) => {
            acc[day] = {
                morning: Array(5).fill({ subject: '' }),
                afternoon: Array(5).fill({ subject: '' }),
            };
            return acc;
        }, {}),
        media: [],
    };
};

export async function fetchNoImage() {
    try {
        const response = await fetch('../data/no_image.txt');
        const text = await response.text();
        return text.trim();
    } catch (e) { return ""; }
}

export async function fetchAppData() {
    try {
        const response = await fetch(`${API_ENDPOINT_BASE}/data`, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Lỗi ${response.status}`);
        const data = await response.json();
        
        if (data && data.students) {
            // Logic quan trọng: Chuyển đổi dữ liệu cũ (string) sang cấu trúc mới (object) để không mất dữ liệu
            data.students = data.students.map(s => {
                const newS = { id: s.id || Date.now() + Math.random() };
                data.headers.forEach(h => {
                    const oldVal = s[h.key];
                    if (oldVal && typeof oldVal === 'object' && oldVal.text !== undefined) {
                        newS[h.key] = oldVal;
                    } else {
                        // Nếu là dữ liệu cũ (string/number), bọc nó vào object
                        newS[h.key] = { text: String(oldVal || ''), rowSpan: 1, colSpan: 1, hidden: false };
                    }
                });
                return newS;
            });
        }

        return data || getInitialData();
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
