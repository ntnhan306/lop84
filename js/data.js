
const API_ENDPOINT_BASE = "https://lop84.nhanns23062012.workers.dev";

const getInitialData = () => {
    return {
        students: [{ id: 's1', stt: '1', name: '', username: '', password: '', note: '' }],
        studentColumns: [
            { key: 'stt', label: 'STT' },
            { key: 'name', label: 'Họ và Tên' },
            { key: 'username', label: 'Tên đăng nhập' },
            { key: 'password', label: 'Mật khẩu' },
            { key: 'note', label: 'Ghi chú' }
        ],
        // Metadata cho gộp ô và phân tầng (Không ảnh hưởng cấu trúc cũ)
        merges: [], 
        hierarchies: {}, 
        schedule: ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'].reduce((acc, day) => {
            acc[day] = { morning: Array(5).fill({ subject: '' }), afternoon: Array(5).fill({ subject: '' }) };
            return acc;
        }, {}),
        media: [],
    };
};

export async function fetchNoImage() {
    try {
        const response = await fetch('../data/no_image.txt');
        return await response.text();
    } catch (e) { return ""; }
}

export async function fetchAppData() {
    try {
        const response = await fetch(`${API_ENDPOINT_BASE}/data`, { cache: 'no-store' });
        if (!response.ok) throw new Error("Lỗi kết nối");
        const data = await response.json();
        
        // Đảm bảo các field metadata luôn tồn tại
        if (data) {
            data.merges = data.merges || [];
            data.hierarchies = data.hierarchies || {};
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
