// !!! CÀI ĐẶT QUAN TRỌNG !!!
// Phương pháp đồng bộ đã được thay đổi để tăng cường bảo mật.
// Thay vì lưu token trên trình duyệt, chúng ta sẽ gọi một serverless function trung gian.

// 1. URL của Serverless Function (ví dụ: Cloudflare Worker, Vercel Function).
//    Function này sẽ nhận yêu cầu từ trang web và kích hoạt GitHub Action một cách an toàn.
//    Bạn cần triển khai function này và đặt GITHUB_TOKEN làm biến môi trường trên đó.
//    Xem ví dụ về mã nguồn serverless function trong tài liệu hoặc comment của dự án.
const SERVERLESS_ENDPOINT = "https://lop84.nhanns23062012.workers.dev/";

/**
 * Kích hoạt một quy trình (workflow) trên GitHub Actions để cập nhật file data.json.
 * @param {object} data - Dữ liệu ứng dụng sẽ được lưu.
 * @returns {Promise<{success: boolean, message: string}>} - Kết quả của hoạt động.
 */
export async function updateFileOnGitHub(data) {
    if (!SERVERLESS_ENDPOINT) {
        const message = 'Cấu hình Serverless Endpoint chưa được thiết lập. Vui lòng mở file `js/github.js`, điền URL của serverless function bạn đã triển khai, sau đó thử lại.';
        alert(message);
        return { success: false, message };
    }

    try {
        const content = JSON.stringify(data, null, 2);

        // Gọi đến serverless function. Function này sẽ trigger workflow_dispatch trên GitHub.
        const response = await fetch(SERVERLESS_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // Gửi toàn bộ nội dung file mới trong body để workflow xử lý
            body: JSON.stringify({
                file_content: content,
            }),
        });
        
        if (!response.ok) {
            // Cố gắng đọc lỗi từ serverless function để debug
            const errorText = await response.text();
            throw new Error(`Lỗi từ serverless function: ${response.status} ${response.statusText}. Chi tiết: ${errorText}`);
        }

        // workflow_dispatch API trả về 204 No Content khi thành công.
        // Điều này chỉ có nghĩa là workflow đã được kích hoạt, không có nghĩa là nó đã chạy xong.
        return { success: true, message: 'Yêu cầu đồng bộ đã được gửi thành công! Dữ liệu sẽ được cập nhật trên trang công khai sau khoảng 1-2 phút.' };

    } catch (error) {
        console.error('Lỗi khi kích hoạt GitHub Action:', error);
        
        let detailedMessage = `Đã xảy ra lỗi khi gửi yêu cầu cập nhật: ${error.message}.`;
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            detailedMessage += ' Lỗi này thường xảy ra do sự cố mạng hoặc do chính sách CORS của máy chủ không cho phép yêu cầu từ trang này. Vui lòng kiểm tra kết nối mạng của bạn. Nếu sự cố vẫn tiếp diễn, có thể cần phải cấu hình lại máy chủ trung gian (serverless function) để cho phép các yêu cầu từ tên miền của bạn.';
        }
        
        return { success: false, message: detailedMessage };
    }
}