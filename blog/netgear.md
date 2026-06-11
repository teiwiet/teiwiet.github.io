---
title: Firmware Command Injection Writeup

---

# Firmware Analysis: Command Injection Case Study
*11/10/2025 • Thời gian đọc: ~16 phút*
## Mở đầu 
Tiếp tục công cuộc học security của mình thì gần đây mình bắt đầu tìm hiểu sâu hơn về bảo mật firmware của các thiết bị embedded, chủ yếu để hiểu rõ hơn cách các thiết bị IoT thực sự vận hành bên trong. Sau 1 hồi lướt Bugcrowd với search qua thì mình quyết định chọn một firmware của Netgear làm đối tượng nghiên cứu, tại sao lại là Netgear á thì nhìn đống này đi. Số lượng CVE của Netgear được tìm thấy ở cve.org phải gấp đôi so với Dlink biết đâu ăn may lại tìm thấy lỗ hổng.

![image](https://hackmd.io/_uploads/Hy-2IXjtWe.png)

Sau khi xem qua một vài firmware khác nhau, mình quyết định chọn WNAP320 vì đây là một model access point khá cũ của Netgear. Những thiết bị legacy như vậy thường có codebase lâu đời, ít được cập nhật và extract cũng đơn giản hơn, nên khả năng xuất hiện các bug thú vị cũng cao hơn, nó giống như mấy con Tplink ở Việt Nam vậy. Link firmware: https://www.downloads.netgear.com/files/GDC/WNAP320/WNAP320_V3.7.4.0.zip

Sau khi giải nén firmware thì bên trong xuất hiện một vài file khá quen thuộc đối với firmware của các thiết bị: 
![image](https://hackmd.io/_uploads/rk1627sKbe.png)
Nhìn sơ qua thì có thể đoán được vai trò của từng file. vmlinux.gz.uImage là Linux kernel image được đóng gói theo định dạng uImage thường thấy trên các thiết bị sử dụng bootloader U-Boot. Hai file *.md5 chỉ đơn giản là checksum để firmware verify tính toàn vẹn khi update.

Phần thú vị nhất ở đây là file rootfs.squashfs. Đây là filesystem chính của thiết bị, nơi chứa toàn bộ binary, script và web interface của router. Trong hầu hết các trường hợp khi phân tích firmware router thì phần lớn bug cũng sẽ nằm ở đây. Chạy thử file bin/busybox để check kiến trúc thì ra:
*bin/busybox: ELF 32-bit MSB executable, MIPS, MIPS32 version 1 (SYSV), dynamically linked, interpreter /lib/ld-uClibc.so.0, stripped*

Sau khi extract ***"binwalk -e rootfs.squashfs"*** xong thì một thư mục squashfs-root sẽ xuất hiện. Bên trong là một filesystem Linux thu nhỏ với các thư mục quen thuộc như /bin, /sbin, /etc, /usr.
![image](https://hackmd.io/_uploads/BJt3aXsYWl.png)

Lúc này mình bắt đầu chuyển sang bước quen thuộc trong firmware analysis: tìm các binary liên quan đến web interface, vì đây thường là nơi xuất hiện nhiều lỗ hổng nhất. Lọ mọ 1 hồi thì cũng tìm được là nó dùng lighttpd cùng với đống web interface ở **/home/www:**
![image](https://hackmd.io/_uploads/ryPR1NjYWl.png)

Sau khi vào thư mục **/home/www** thì có thể thấy khá nhiều file PHP dùng để xử lý các chức năng của router. Nhìn qua tên file cũng có thể đoán được một số chức năng như BackupConfig.php, packetCapture.php, downloadFile.php, login.php, v.v. Đây đều là những endpoint được gọi trực tiếp từ web interface.

Sau khi tìm kiếm trong filesystem, mình phát hiện một vài thứ khá hay ho. Cụ thể, firmware này chứa một private key được sử dụng bởi dropbear – SSH server thường được dùng trên các thiết bị embedded. Ngoài ra trong firmware cũng xuất hiện một RSA private key được lưu trực tiếp dưới dạng file.
*./etc/server.pem*
![image](https://hackmd.io/_uploads/Skxb2uiFbx.png)
*/etc/dropbear*
![image](https://hackmd.io/_uploads/BybdausK-x.png)

Quay lại phần web interface thì các router thường phải thực hiện nhiều thao tác hệ thống như restart wifi, thay đổi cấu hình hoặc backup settings. Vì vậy backend của web interface thường build command rồi gọi shell để thực thi. Nếu input từ người dùng không được kiểm soát chặt, điều này rất dễ dẫn tới các bug kiểu command injection.

Tuy nhiên chỉ đọc code thì khá khó để xác định luồng thực thi thực sự của chương trình, nên mình quyết định mô phỏng lại môi trường của firmware để quan sát hành vi của nó rõ hơn.

Một thành phần quan trọng của hệ thống là busybox, vì hầu hết các lệnh hệ thống trên router đều được implement thông qua nó. Do đó bước đầu tiên là thử chạy busybox bằng qemu-mips để kiểm tra xem các binary MIPS trong firmware có hoạt động trong môi trường giả lập hay không. Và khá may mắn là mình có thể chạy **bin/busybox** và ta sẽ có một shell trong firmware:
![Untitled-2026-03-09-0611](https://hackmd.io/_uploads/ry9MVFiK-l.png)

Việc tiếp theo là mở cái webserver lên thôi: 
***# sbin/lighttpd -f etc/lighttpd.conf***
![image](https://hackmd.io/_uploads/SycpDtjt-x.png)
