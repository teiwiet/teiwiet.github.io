# Firmware Analysis: Stack-Based Buffer Overflow trên Tenda Router
*[13/6/2026] • Thời gian đọc: ~18 phút*

---

## Mở đầu

Series tìm hiểu firmware security lần này chúng rẽ sang một dòng thiết bị mà chắc ai ở Việt Nam cũng từng thấy qua: router Tenda.

Lý do chọn thì chẳng có gì cao siêu. Tenda phổ biến, nhà nào lắp gói mạng giá rẻ gần như cũng có một con. Lịch sử CVE của hãng thì khỏi bàn, search sơ sơ đã ra một danh sách khá dài.

![image_cve_count](/pictures/WriteUp/Tenda/AC10/image_cve_count.png)

Thế là lại có dịp ra chợ đồ cũ gần trường và nhặt về ba con, mỗi con 1 hãng mặc cả mãi bà chị mới mới đồng giá 90k/con, tôi không giỏi mặc cả lắm. Về nhà cắm vào thì lạy chúa nó boot lên được, nhưng cái màn hình đăng nhập hiện ra thì toàn chữ Trung. Một trong ba con hóa ra là Tenda AC10 V4.0 chạy firmware nội địa Trung, khả năng cao là hàng song song hoặc bị đem về rồi bán lại, còn mấy con kia chắc sắp tới lại có writeup tiếp.

---

## Mở Vỏ và Kết Nối UART

Thay vì tải firmware về rồi binwalk như bài các lần trước, lần này có đồ thật mình muốn thử tiếp cận theo hướng khác hơn một chút — cụ thể là kết nối UART để đọc boot log trực tiếp từ thiết bị. UART là một giao thức serial cực kỳ phổ biến trên embedded device, và hầu hết các router đều có debug port này để nhà sản xuất dùng trong quá trình phát triển. Mọi người sẽ cần 1 cái usb to ttl để đọc uart, link: https://shopee.vn/USB-TO-TTL-Chip-CP2102-UART-i.23934243.3506694423

![image_pcb](/pictures/WriteUp/Tenda/AC10/image_pcb.png)

Bên trong PCB khá thoáng, và thứ mình quan tâm nhất là cụm 4 chân pinout nằm gần cạnh board — đây gần như luôn là UART header. Bốn chân này thường là VCC, GND, TX, RX, cám ơn nhà sản xuất đã in sẵn nên đỡ phải dò từng chân là gì, mỗi tội in bị lệch :-)), phần đấu nối thì chỉ cần ba dây: 
USB-TTL   <->   Router
GND       <->     GND
RX        <->     TX
TX        <->     RX

![image_pcb](/pictures/WriteUp/Tenda/AC10/image_uart_connect.png)

Cắm vào máy trên Linux nó hiện ra dưới dạng `/dev/ttyUSB0` . Và test những **baud rate** phổ biến, baud sai thì log ra sẽ toàn ký tự rác kiểu `����`, cứ thử lần lượt 115200, 57600, 9600 đến khi log đổ ra chữ đọc được, trong trường hợp của mình là 115200. Đọc qua thì có vài thông tin thú vị thôi:

```
Board: MIPS sfa18 A28 MPW0 ac28
DRAM:  64 MiB
SF: Detected BY25Q64AS ... total 8 MiB
[    0.000000] Linux version 4.14.90 ... (OpenWrt GCC 7.4.0)
[    0.000000] MIPS: machine is sf19a28-ac28s
```

Vậy là biết được con này chạy **SoC Siflower SF19A28** (MIPS, 4 nhân), **64MB RAM**, **8MB SPI NOR**, kernel **Linux 4.14.90** dựng trên nền OpenWrt/SDK Siflower. Bootlog còn khai luôn bảng phân vùng flash, tiện cho việc dump sau này:

```
Creating 8 MTD partitions on "spi2.0":
0x000000000000-0x000000008000 : "spl-loader"
0x000000008000-0x00000006f000 : "u-boot"
0x00000006f000-0x000000070000 : "u-boot-env"
0x000000070000-0x000000080000 : "factory"
0x000000080000-0x0000007d0000 : "firmware"    (kernel + rootfs squashfs)
```

Thôi đây mình đi hướng gọn hơn: **tải thẳng firmware từ trang public rồi bung ra đọc.**

## Lấy firmware từ nguồn public

Không phải lúc nào cũng cần đục UART hay xì flash ra để có được rootfs — với mấy hãng consumer như Tenda thì firmware nằm sẵn trên trang download chính thức. Vào trang support của Tenda, tìm đúng model (AC10) rồi tải file firmware về : https://www.tendacn.com/material/show/104560

