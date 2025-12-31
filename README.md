# 💰 Quản Lý Vay Tiền

[![PHP Version](https://img.shields.io/badge/PHP-7.0+-blue.svg)](https://www.php.net/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8.svg)](https://tailwindcss.com/)

Ứng dụng web quản lý danh sách những người đã mượn tiền của bạn. Được xây dựng với HTML, CSS, JavaScript và PHP, sử dụng thiết kế hiện đại với tone màu Cloudflare.

## 📋 Mục lục

- [Tính năng](#-tính-năng)
- [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
- [Cài đặt](#-cài-đặt)
- [Sử dụng](#-sử-dụng)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Bảo mật](#-bảo-mật)
- [Đóng góp](#-đóng-góp)
- [License](#-license)
- [Tác giả](#-tác-giả)

## ✨ Tính năng

### Tính năng chính

- ✅ **Quản lý người mượn**: Thêm, sửa, xóa thông tin người mượn tiền
- ✅ **Theo dõi thanh toán**: Đánh dấu trạng thái đã trả/chưa trả với hỗ trợ thanh toán từng phần
- ✅ **Lịch sử giao dịch**: Theo dõi lịch sử mượn và trả tiền chi tiết
- ✅ **Format tự động**: Format số tiền theo chuẩn Việt Nam (1.000.000 VNĐ)
- ✅ **Date Picker**: Chọn ngày với widget calendar hiện đại
- ✅ **Thống kê**: Hiển thị tổng số tiền, số người mượn, tiền đã trả/chưa trả
- ✅ **Lưu trữ**: Lưu trữ dữ liệu vào file JSON với backup LocalStorage
- ✅ **Export/Import**: Xuất và nhập dữ liệu JSON để backup/restore
- ✅ **Responsive Design**: Tối ưu cho mobile, tablet và desktop
- ✅ **Giao diện đẹp**: Thiết kế hiện đại với tone màu Cloudflare

### Tính năng nâng cao

- 🔄 **Cộng dồn**: Tự động phát hiện và cộng dồn số tiền cho người mượn đã tồn tại
- 📊 **Progress Bar**: Hiển thị tiến độ thanh toán trực quan
- 🎨 **Collapse/Expand**: Thu gọn/mở rộng chi tiết từng người mượn
- 💾 **Dual Storage**: Lưu trữ kép (JSON file + LocalStorage) để đảm bảo không mất dữ liệu

## 📁 Cấu trúc thư mục

```
vaytien/
├── index.html                  # Trang chủ
├── README.md                   # Tài liệu hướng dẫn
├── .htaccess                   # Cấu hình Apache (root)
├── .gitignore                  # Git ignore rules
│
├── assets/                     # Tài nguyên tĩnh
│   ├── fonts/                  # Font chữ
│   │   └── UTM Avo.ttf         # Font UTM Avo
│   └── images/                 # Hình ảnh
│       └── favicon.svg         # Favicon SVG
│
├── js/                         # JavaScript
│   └── app.js                  # File JavaScript chính
│
├── api/                        # API Backend
│   └── api.php                 # API xử lý JSON (GET/POST)
│
├── data/                       # Dữ liệu
│   ├── .htaccess               # Bảo vệ thư mục
│   └── data.json               # File lưu trữ dữ liệu (auto-generated)
│
└── config/                     # Cấu hình
    └── .htaccess               # Bảo vệ thư mục
```

## 💻 Yêu cầu hệ thống

### Server

- **PHP**: 7.0 trở lên
- **Web Server**: Apache/Nginx hoặc PHP built-in server
- **Quyền ghi**: Thư mục `data/` phải có quyền ghi

### Client

- **Trình duyệt**: Chrome, Firefox, Edge, Safari (phiên bản mới nhất)
- **JavaScript**: Phải được bật
- **Kết nối Internet**: Để tải các thư viện CDN (Tailwind CSS, Font Awesome, SweetAlert2, Flatpickr)

## 🚀 Cài đặt

### Cách 1: Sử dụng PHP built-in server (Khuyến nghị cho development)

```bash
# Di chuyển vào thư mục project
cd vaytien

# Chạy server
php -S localhost:8000
```

Sau đó truy cập: **http://localhost:8000**

### Cách 2: Sử dụng XAMPP/WAMP/MAMP

1. Copy thư mục `vaytien` vào:
   - **XAMPP**: `C:\xampp\htdocs\`
   - **WAMP**: `C:\wamp64\www\`
   - **MAMP**: `/Applications/MAMP/htdocs/`

2. Khởi động Apache trong XAMPP/WAMP/MAMP

3. Truy cập: **http://localhost/vaytien**

### Cách 3: Sử dụng hosting/VPS

1. Upload toàn bộ thư mục lên hosting qua FTP/SFTP
2. Đảm bảo PHP được bật trên server
3. Cấp quyền ghi cho thư mục `data/`:
   ```bash
   chmod 755 data/
   chmod 644 data/data.json
   ```
4. Truy cập domain của bạn

### Cách 4: Sử dụng Docker (Tùy chọn)

```bash
# Tạo Dockerfile (nếu cần)
# Chạy container
docker run -d -p 8000:80 -v $(pwd):/var/www/html php:7.4-apache
```

## 📖 Sử dụng

### Thêm người mượn tiền

1. Điền thông tin vào form:
   - **Tên người mượn**: Tên người cần mượn tiền
   - **Số tiền**: Nhập số tiền (tự động format: 1.000.000)
   - **Ngày cho mượn**: Chọn ngày từ calendar widget
   - **Ghi chú**: Thông tin bổ sung (tùy chọn)

2. Nhấn nút **"Thêm Vào Danh Sách"**

3. Nếu tên đã tồn tại, hệ thống sẽ hỏi bạn muốn:
   - **Cộng dồn**: Thêm số tiền mới vào tổng số tiền hiện có
   - **Tạo mới**: Tạo bản ghi mới với tên tương tự

### Quản lý người mượn

- **Xem chi tiết**: Click vào icon mũi tên để mở/đóng chi tiết
- **Đánh dấu đã trả**: Click nút **"Đã trả"** và nhập số tiền đã trả (hỗ trợ thanh toán từng phần)
- **Chỉnh sửa**: Click nút **"Sửa"** để cập nhật thông tin
- **Xóa**: Click nút **"Xóa"** để xóa bản ghi (có xác nhận)

### Export/Import dữ liệu

- **Xuất JSON**: Click **"Xuất JSON"** để tải file backup về máy
- **Nhập JSON**: Click **"Nhập JSON"** để import dữ liệu từ file (có xác nhận)

### Thống kê

Ứng dụng tự động hiển thị:
- Tổng số người mượn
- Tổng số tiền đã cho mượn
- Số người chưa trả
- Tổng tiền chưa trả
- Tổng tiền đã trả

## 🛠️ Công nghệ sử dụng

### Frontend

- **HTML5**: Cấu trúc semantic
- **CSS3**: Styling hiện đại
- **JavaScript (ES6+)**: Logic xử lý
- **Tailwind CSS**: CSS framework utility-first
- **Font Awesome 6.4.0**: Icon library
- **SweetAlert2**: Beautiful alerts và dialogs
- **Flatpickr**: Date picker widget
- **UTM Avo Font**: Custom font chữ

### Backend

- **PHP 7.0+**: Server-side processing
- **JSON**: Data storage format

### Storage

- **JSON File**: Server-side persistent storage
- **LocalStorage**: Client-side backup storage

## 🔒 Bảo mật

### Các biện pháp bảo mật đã triển khai

- ✅ **Bảo vệ thư mục**: File `.htaccess` ngăn truy cập trực tiếp vào `data/` và `config/`
- ✅ **API Validation**: Dữ liệu được validate trước khi lưu vào file JSON
- ✅ **Input Sanitization**: Làm sạch dữ liệu đầu vào
- ✅ **CORS Headers**: Cấu hình CORS trong API
- ✅ **Error Handling**: Xử lý lỗi an toàn, không tiết lộ thông tin nhạy cảm

### Khuyến nghị bảo mật

- 🔐 Sử dụng HTTPS trong môi trường production
- 🔐 Đặt quyền file phù hợp (644 cho file, 755 cho thư mục)
- 🔐 Backup dữ liệu định kỳ
- 🔐 Không commit file `data.json` vào Git (đã có trong `.gitignore`)

## 🤝 Đóng góp

Đóng góp luôn được chào đón! Nếu bạn muốn đóng góp cho dự án:

1. **Fork** repository này
2. Tạo **branch** mới (`git checkout -b feature/AmazingFeature`)
3. **Commit** các thay đổi (`git commit -m 'Add some AmazingFeature'`)
4. **Push** lên branch (`git push origin feature/AmazingFeature`)
5. Mở **Pull Request**

### Quy tắc đóng góp

- Tuân thủ code style hiện tại
- Thêm comments cho code phức tạp
- Cập nhật README.md nếu cần
- Test kỹ trước khi commit

## 📄 License

Dự án này được phân phối dưới giấy phép MIT. Xem file `LICENSE` để biết thêm chi tiết.

```
MIT License

Copyright (c) 2024 Mạc Quân

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 👨‍💻 Tác giả

**Mạc Quân**

- GitHub: [@macquan](https://github.com/qu4nc0d3r)
- Email: [Liên hệ qua GitHub](https://github.com/macquan)

---

## 📝 Changelog

### Version 1.0.0 (2024)

- ✨ Tính năng cơ bản: Thêm, sửa, xóa người mượn
- ✨ Hỗ trợ thanh toán từng phần
- ✨ Lịch sử giao dịch chi tiết
- ✨ Export/Import JSON
- ✨ Responsive design
- ✨ Thiết kế với tone màu Cloudflare
- ✨ Date picker với Flatpickr
- ✨ Format số tiền tự động

---

## ⚠️ Lưu ý

- Đảm bảo quyền ghi cho thư mục `data/` trên server để ứng dụng hoạt động đúng
- File `data.json` sẽ được tạo tự động khi lần đầu sử dụng
- Dữ liệu được lưu kép (JSON file + LocalStorage) để đảm bảo không mất dữ liệu
- Nên backup dữ liệu định kỳ bằng tính năng Export JSON

---

<div align="center">

**Được phát triển với ❤️ bởi Mạc Quân**

⭐ Nếu dự án này hữu ích, hãy cho một star!

</div>
