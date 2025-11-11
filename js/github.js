// !!! CÀI ĐẶT QUAN TRỌNG !!!
// Điền thông tin của bạn vào các biến dưới đây để tính năng đồng bộ hoạt động.

// 1. Tên người dùng hoặc tổ chức sở hữu repository trên GitHub.
// Ví dụ: "ntnhan306"
const REPO_OWNER = "ntnhan306"; 

// 2. Tên repository chứa dữ liệu của lớp học.
// Ví dụ: "lop84"
const REPO_NAME = "lop84";

// 3. GitHub Personal Access Token (PAT) có quyền ghi vào repository.
// Để tạo token:
// - Vào trang https://github.com/settings/tokens/new
// - Đặt tên cho token (ví dụ: "Lop84 App Sync").
// - Chọn thời hạn (Expiration).
// - Trong "Repository access", chọn "Only select repositories" và chọn repository của bạn.
// - Trong "Repository permissions", tìm và cấp quyền "Contents" (Read and write).
// - Nhấn "Generate token" và sao chép token vào đây.
// TUYỆT ĐỐI KHÔNG chia sẻ token này cho bất kỳ ai.
const GITHUB_TOKEN = ""; 

/**
 * Updates the data.json file in the specified GitHub repository.
 * @param {object} data - The application data to be saved.
 * @returns {Promise<{success: boolean, message: string}>} - The result of the operation.
 */
export async function updateFileOnGitHub(data) {
    if (!REPO_OWNER || !REPO_NAME || !GITHUB_TOKEN) {
        return { success: false, message: 'Cấu hình GitHub chưa được thiết lập. Vui lòng mở file `js/github.js` và điền đầy đủ thông tin.' };
    }

    const path = 'data/data.json';
    const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
    const headers = {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
    };

    try {
        // Step 1: Get the current file to get its SHA hash
        const getFileResponse = await fetch(apiUrl, { headers });
        if (!getFileResponse.ok) {
            if (getFileResponse.status === 404) {
                 return { success: false, message: `Lỗi: Không tìm thấy file tại đường dẫn ${REPO_OWNER}/${REPO_NAME}/${path}. Hãy chắc chắn file data.json tồn tại.` };
            }
            throw new Error(`Không thể lấy thông tin file. Status: ${getFileResponse.status}`);
        }
        const fileData = await getFileResponse.json();
        const sha = fileData.sha;

        // Step 2: Update the file
        const content = JSON.stringify(data, null, 2);
        // GitHub API requires content to be Base64 encoded.
        // btoa doesn't handle UTF-8 characters well, so we need a workaround.
        const encodedContent = btoa(unescape(encodeURIComponent(content)));

        const updateResponse = await fetch(apiUrl, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
                message: `Cập nhật dữ liệu lớp học - ${new Date().toISOString()}`,
                content: encodedContent,
                sha: sha,
            }),
        });

        if (!updateResponse.ok) {
            const errorData = await updateResponse.json();
            throw new Error(`Không thể cập nhật file. Status: ${updateResponse.status}. Message: ${errorData.message}`);
        }

        return { success: true, message: 'Dữ liệu đã được đồng bộ lên GitHub thành công!' };

    } catch (error) {
        console.error('GitHub API Error:', error);
        return { success: false, message: `Đã xảy ra lỗi: ${error.message}` };
    }
}
