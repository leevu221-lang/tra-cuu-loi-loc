# HỆ THỐNG TRA CỨU GIÁ GÓI THAY LÕI LỌC NƯỚC (DỊCH VỤ THỢ ĐIỆN MÁY XANH)

Hệ thống chuyên dụng phục vụ kỹ thuật viên/thợ Điện Máy Xanh và nhân viên bán hàng tra cứu nhanh biểu giá gói thay lõi lọc nước (1 Năm, 2 Năm, 3 Năm, 4 Năm) bằng cách gõ mã sản phẩm hoặc quét mã vạch / QR trên tem máy lọc nước.

Dữ liệu được trích xuất từ Google Sheet và lưu trữ trực tuyến trên **Firebase Cloud Firestore**.

---

## 📌 Các Tính Năng Nổi Bật

1. **Tra cứu tức thì bằng Mã Sản Phẩm**:
   - Nhập 13 chữ số mã máy (EAN-13) hoặc tên model máy (hỗ trợ tìm kiếm tiếng Việt không dấu).
   - Tự động đối soát với cột `Mã sản phẩm` trong sheet `MÁY LỌC NƯỚC-GÓI THAY LLN` (222 Model máy).
2. **Quét Mã Vạch / QR bằng Camera & Tải ảnh**:
   - Sử dụng thư viện máy quét `html5-qrcode` tương thích trên cả điện thoại (iOS Safari, Android Chrome) và máy tính.
   - Nhận diện tem mã vạch (EAN-13, Code 128...) và mã QR, phát âm thanh báo nhận diện thành công.
3. **Hiển thị Biểu Giá Trọn Gói 4 Năm**:
   - Đối chiếu sang sheet `GÓI THAY LLN` và hiển thị chi tiết:
     - **Gói 1 Năm**: Số lượng lõi thay & Giá bán
     - **Gói 2 Năm**: Số lượng lõi thay & Giá bán (Gợi ý gói phổ biến)
     - **Gói 3 Năm**: Số lượng lõi thay & Giá bán (Tối ưu chu kỳ màng RO)
     - **Gói 4 Năm**: Số lượng lõi thay & Giá bán (Bảo vệ trọn đời máy)
4. **Chi tiết Lõi Lọc & Chu Kỳ Thay (Sheet `Thời gian thay lõi lọc`)**:
   - Hiển thị bảng chi tiết mã lõi, tên lõi, vị trí và lịch thay thế theo từng quý trong năm.
5. **Mẫu Tin Nhắn Tư Vấn Gửi Zalo/SMS**:
   - Tự động tạo sẵn đoạn văn bản báo giá chuẩn để gửi ngay cho khách hàng qua Zalo hoặc in ấn.
6. **Lưu trữ & Đồng bộ Trực tuyến với Firebase Cloud Firestore**:
   - Toàn bộ dữ liệu được lưu trên collection `tra_cuu_loi_loc` của Firebase project `crm-43751-71e4b`.
   - Có kịch bản tự động tải từ Google Sheet và đẩy lên Firebase chỉ trong vài giây.

---

## 🚀 Cách Mở & Sử Dụng

### Cách 1: Mở trực tiếp file HTML (Không cần cài đặt)
Nhấp đúp chuột hoặc mở đường dẫn sau trong trình duyệt Google Chrome, Edge hoặc Safari:
```text
file:///Users/linhvu/.gemini/antigravity-ide/scratch/tra-cuu-loi-loc/index.html
```

### Cách 2: Chạy Server Cục Bộ (Hỗ trợ máy ảnh camera tốt nhất)
Mở Terminal tại thư mục dự án và chạy:
```bash
npm start
# hoặc
python3 -m http.server 3030
```
Sau đó truy cập: [http://localhost:3030](http://localhost:3030)

---

## 🔄 Cách Đồng Bộ Lại Khi Google Sheet Có Dữ Liệu Mới

Khi có sản phẩm mới hoặc thay đổi giá trong Google Sheet [tại đây](https://docs.google.com/spreadsheets/d/1oDMEUk0xnP0nXHGxNJa8uLmcSOHsauaccEpp6EFcD7I/edit?usp=sharing), bạn chỉ cần chạy lệnh sau để tải và nạp tự động lên Firebase:

```bash
python3 /Users/linhvu/.gemini/antigravity-ide/scratch/tra-cuu-loi-loc/sync_sheet_to_firebase.py
```

Kịch bản sẽ:
1. Tải bản cập nhật mới nhất từ Google Sheet.
2. Trích xuất và chuẩn hóa 2 sheet `MÁY LỌC NƯỚC-GÓI THAY LLN` và `GÓI THAY LLN`.
3. Cập nhật `data.json` và `data.js` cục bộ.
4. Đẩy thẳng lên Firebase Cloud Firestore (`crm-43751-71e4b`).

---

## 📁 Cấu Trúc Thư Mục Dự Án

```text
tra-cuu-loi-loc/
├── index.html                   # Giao diện chính của ứng dụng
├── style.css                    # Thiết kế giao diện (Glassmorphism, Dark/Light mode)
├── app.js                       # Logic tra cứu, quét QR/Barcode & Firebase
├── data.json                    # Bản sao lưu dữ liệu dạng JSON
├── data.js                      # Dữ liệu nhúng trực tiếp (tương thích file://)
├── html5-qrcode.min.js          # Thư viện quét camera QR và mã vạch
├── sync_sheet_to_firebase.py    # Kịch bản tự động đồng bộ Google Sheet -> Firebase
├── upload_to_firebase.py        # Kịch bản tải dữ liệu lên Firebase
├── package.json                 # Cấu hình dự án & scripts
└── README.md                    # Tài liệu hướng dẫn sử dụng
```
