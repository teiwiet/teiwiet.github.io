# Firmware Analysis: Stack-Based Buffer Overflow trên Tenda Router
*[Ngày tháng] • Thời gian đọc: ~18 phút*

---

## Mở đầu

Series tìm hiểu firmware security của mình lần này rẽ sang một dòng thiết bị mà chắc ai ở Việt Nam cũng từng thấy qua: router Tenda.

Lý do chọn thì chẳng có gì cao siêu. Tenda phổ biến, nhà nào lắp gói mạng giá rẻ gần như cũng có một con. Lịch sử CVE của hãng thì khỏi bàn, search sơ sơ đã ra một danh sách khá dài.

![image_cve_count](/pictures/Writeup/Tenda/AC10/image_cve_count.png)

Thế là lại có dịp ra chợ đồ cũ gần trường và nhặt về ba con, mỗi con 1 hãng mặc cả mãi bà chị mới mới đồng giá 90k/con, tôi không giỏi mặc cả lắm. Về nhà cắm vào thì lạy chúa nó boot lên được, nhưng cái màn hình đăng nhập hiện ra thì toàn chữ Trung. Một trong ba con hóa ra là Tenda AC10 V5.0 chạy firmware nội địa Trung, khả năng cao là hàng song song hoặc bị đem về rồi bán lại, còn mấy con kia chắc sắp tới lại có writeup tiếp.

---

## Mở Vỏ và Kết Nối UART

Thay vì tải firmware về rồi binwalk như bài các lần trước, lần này có đồ thật mình muốn thử tiếp cận theo hướng khác hơn một chút — cụ thể là kết nối UART để đọc boot log trực tiếp từ thiết bị. UART là một giao thức serial cực kỳ phổ biến trên embedded device, và hầu hết các router đều có debug port này để nhà sản xuất dùng trong quá trình phát triển. Mọi người sẽ cần 1 cái usb to ttl để đọc uart, link: https://shopee.vn/USB-TO-TTL-Chip-CP2102-UART-i.23934243.3506694423

![image_pcb]()


