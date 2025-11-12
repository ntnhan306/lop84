// !!! CÀI ĐẶT QUAN TRỌNG !!!
// Phương pháp đồng bộ đã được thay đổi để tăng cường bảo mật và tốc độ.
// Chúng ta sẽ gọi một serverless function trung gian để cập nhật file trực tiếp trên GitHub.

// 1. URL của Serverless Function (ví dụ: Cloudflare Worker).
//    Function này sẽ nhận yêu cầu, lấy SHA của file cũ, và ghi đè nội dung mới.
//    Bạn cần triển khai function này và đặt các biến môi trường cần thiết (token, repo, origin...).
const SERVERLESS_ENDPOINT = "https://lop84.nhanns23062012.workers.dev/";

/**
 * Gửi dữ liệu đến serverless function để cập nhật file data.json trực tiếp trên GitHub.
 * @param {object} data - Dữ liệu ứng dụng sẽ được lưu.
 * @returns {Promise<{success: boolean, message: string}>} - Kết quả của hoạt động.
 */
export async function updateFileOnGitHub(data) {
    if (!SERVERLESS_ENDPOINT || !SERVERLESS_ENDPOINT.startsWith('https://')) {
        const message = 'Lỗi cấu hình: URL của Serverless Endpoint không hợp lệ. Vui lòng kiểm tra file `js/github.js`.';
        console.error(message);
        return { success: false, message };
    }

    try {
        const content = JSON.stringify(data, null, 2);

        // Gọi đến serverless function.
        const response = await fetch(SERVERLESS_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                file_content: content,
            }),
        });
        
        const responseText = await response.text();

        if (!response.ok) {
            let userMessage = `Máy chủ trung gian phản hồi lỗi (HTTP ${response.status}).`;
            
            // Cố gắng phân tích lỗi từ serverless function để debug
            switch (response.status) {
                case 403:
                    userMessage += "\nLỗi 403 (Forbidden): Tên miền của trang web này chưa được cho phép trong cấu hình Worker. Vui lòng kiểm tra biến môi trường `ALLOWED_ORIGIN` trên Cloudflare.";
                    break;
                case 404:
                    userMessage += "\nLỗi 404 (Not Found): URL của Serverless Endpoint không đúng hoặc Worker chưa được triển khai.";
                    break;
                case 500:
                    userMessage += `\nLỗi 500 (Internal Server Error): Có lỗi xảy ra bên trong Cloudflare Worker. Lỗi có thể do GITHUB_TOKEN không hợp lệ, sai tên repo, hoặc sự cố với GitHub API.`;
                    break;
            }
            // Thêm chi tiết từ server vào cuối
            userMessage += `\n\nChi tiết từ server: ${responseText}`;
            throw new Error(userMessage);
        }

        // Worker có thể trả về JSON hoặc text, xử lý cả hai
        try {
            const result = JSON.parse(responseText);
            return { success: true, message: result.message || 'Đồng bộ thành công! Dữ liệu đã được cập nhật. Bạn có thể cần tải lại trang xem để thấy thay đổi.' };
        } catch (e) {
             // Nếu không phải JSON, dùng text thuần
            return { success: true, message: responseText };
        }


    } catch (error) {
        console.error('Lỗi khi gửi yêu cầu đồng bộ:', error);
        
        let detailedMessage = `Đã xảy ra lỗi khi gửi yêu cầu cập nhật: ${error.message}.`;
        
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            detailedMessage = `**Lỗi mạng: Failed to fetch.** Lỗi này có thể do một trong các nguyên nhân sau:\n
1.  **Sự cố mạng:** Kiểm tra lại kết nối Internet của bạn.
2.  **Lỗi CORS:** Đây là nguyên nhân phổ biến nhất. Máy chủ trung gian (Cloudflare Worker) đã không trả về header 'Access-Control-Allow-Origin' đúng. Hãy đảm bảo bạn đã cấu hình `ALLOWED_ORIGIN` trên Worker chính xác là URL của trang web này.
3.  **URL Worker không đúng:** URL trong biến `SERVERLESS_ENDPOINT` có thể sai hoặc Worker chưa được triển khai.
4.  **Worker bị lỗi nặng:** Worker có thể bị crash và không thể xử lý yêu cầu (ví dụ: lỗi cú pháp trong code worker).

**Gợi ý:** Mở Developer Tools (F12), vào tab "Console" và "Network" để xem chi tiết lỗi.`;
        }
        
        return { success: false, message: detailedMessage };
    }
}