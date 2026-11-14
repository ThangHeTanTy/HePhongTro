# Sổ Trọ

Ứng dụng quản lý phòng trọ cho thuê, dùng trên điện thoại. Một chủ trọ quản lý được nhiều khu trọ, mỗi khu có bảng giá và mẫu phòng riêng.

- **iPhone:** mở bản web (GitHub Pages) bằng Safari, chọn Chia sẻ › Thêm vào màn hình chính.
- **Android:** cài app [SoTro.apk](https://github.com/ThangHeTanTy/HePhongTro/releases/latest/download/SoTro.apk). Xem [android/README.md](android/README.md).

## Tính năng

- **Nhiều khu trọ:** tạo khu, tự đánh số phòng theo tầng (101, 102, 201…) hoặc liên tiếp (1, 2, 3…).
- **Mô hình 3D phòng:** nhập rộng, dài, cao trần, cửa ra vào (trái, giữa, phải hoặc cửa cuốn kiot), gác lửng, cầu thang (có hoặc không lan can), nhà vệ sinh (vị trí và hướng cửa), cửa sổ tầng dưới và trên gác (chọn tường), bàn bếp (dài, rộng, cao, tường đặt), máy lạnh (tầng, tường, công suất). Mô hình vẽ lại ngay khi chỉnh, khung 3D được ghim khi cuộn. App cảnh báo khi các thứ chồng lên nhau, chắn lối đi hoặc quá thấp.
- **Thiết kế dùng chung:** ngoài *Mẫu chung*, tạo thêm thiết kế có tên (vd. *Kiot mặt tiền*), chọn nhiều phòng để dùng chung; sửa thiết kế thì các phòng đó đổi theo. Phòng vẫn có thể có kích thước riêng.
- **Sơ đồ dãy trọ 3D:** dựng cả khu từ các phòng: chọn phòng kiot quay mặt ra đường; kiểu *một dãy* (lối đi và cửa các phòng phía sau nằm bên trái hoặc bên phải kiot) hoặc *hai dãy* quay cửa vào nhau với hành lang giữa; độ rộng lối đi; phòng tầng trên xếp chồng lên. Có mặt tiền, chiều sâu tổng.
- **Người thuê:** họ tên, ngày dọn vào, số người, người ở cùng, chỉ số điện và nước lúc vào, tiền cọc, ngày trả phòng (cảnh báo khi sắp tới hạn).
- **Tính tiền hàng tháng:** chốt số điện, nước giếng, nước máy; tiền rác, wifi, phí khác; nợ chuyển kỳ; tính tiền phòng theo ngày ở tháng đầu.
- **Tính lại hóa đơn** theo từng phòng hoặc cả khu khi đổi giá, có xem trước chênh lệch.
- **Ảnh đồng hồ điện, nước:** chụp ảnh hoặc chọn ảnh có sẵn trong máy cho từng đồng hồ. Ảnh được lưu làm bằng chứng, kèm trong ảnh hóa đơn, xem, lưu về máy hoặc xóa được.
- **Chốt số bằng ảnh:** đi lần lượt từng phòng (chụp, kiểm số, *Lưu, tiếp*), hoặc chọn một lúc nhiều ảnh đã chụp sẵn để app gán lần lượt theo thứ tự phòng.
- **Tự đọc số trên ảnh** và điền sẵn vào ô *Chỉ số mới*, bạn so với ảnh rồi bấm lưu. Cách đọc (Thiết lập › Đọc số trên ảnh):
  - trong app Claude: Claude đọc;
  - nếu đã nhập khóa Claude API: gọi Claude (`claude-opus-5-5`) thẳng từ trình duyệt, chính xác, có tính phí theo tài khoản Anthropic;
  - còn lại: bộ đọc chữ [Tesseract.js](https://github.com/naptha/tesseract.js) chạy trên máy, miễn phí, chọn số hợp lý theo số cũ và mức dùng trung bình, cần so kỹ.
- **Xuất Excel** tiền điện, tiền nước, tổng hợp và thu chi; **ảnh hóa đơn** có mã VietQR cho từng phòng; ảnh sao kê công nợ.
- **Trang người thuê** (khi chạy trên Claude): người thuê nhập mã phòng để xem hóa đơn, mã QR và báo hỏng hóc.
- **Giấy tờ (.docx):** hợp đồng thuê phòng, tờ khai thay đổi thông tin cư trú (mẫu CT01, Thông tư 53/2025/TT-BCA), biên bản bàn giao phòng.
- **Thu chi:** chi phí, lãi tạm tính, biểu đồ 6 tháng, đối chiếu đồng hồ điện, nước tổng với tổng các phòng để phát hiện hao hụt; báo phòng dùng điện bất thường.
- **Nhắc việc:** ngày chốt số, hạn thu tiền, hết hạn hợp đồng; thêm vào Google Calendar.

## Cấu trúc

```
src/shell.html    Khung trang: tiêu đề, phông chữ, các vùng hiển thị
src/styles.css    Giao diện (sáng và tối)
src/app.js        Toàn bộ logic: dữ liệu, tính tiền, 3D, xuất tệp, trang người thuê
build.mjs         Gộp src/ thành tệp HTML hoàn chỉnh
index.html        Bản đã đóng gói, chạy trực tiếp trên trình duyệt (tạo bởi build.mjs)
dist/sotro-artifact.html  Bản đã đóng gói để đăng lên Claude (tạo bởi build.mjs)
docs/nhac-viec.md Nội dung tác vụ nhắc việc hằng ngày trên Claude
android/          App Android: WebView chạy index.html, đóng gói APK bằng GitHub Actions
```

Thư viện tải từ cdnjs khi cần: three.js r128 (3D), SheetJS 0.18.5 (Excel), JSZip 3.10.1 (tệp nén, .docx), qrcode-generator 1.4.4 (VietQR). Từ jsDelivr khi tự đọc số ngoài Claude: Tesseract.js 7.0.0 (cùng tesseract.js-core 7.0.0 và dữ liệu chữ `@tesseract.js-data/eng` 1.0.0), `@anthropic-ai/sdk` 1.3.0 (chỉ khi có khóa API).

## Chạy

Cần Node.js 18 trở lên để đóng gói (không cần `npm install`).

```bash
node build.mjs
```

Sau đó mở `index.html` bằng trình duyệt, hoặc bật GitHub Pages cho nhánh `main` để dùng trên điện thoại (Thêm vào màn hình chính).

### Hai cách chạy

| | Trên Claude (artifact) | Trình duyệt / GitHub Pages |
|---|---|---|
| Lưu dữ liệu | Theo tài khoản Claude, mở máy khác vẫn thấy | Trong trình duyệt của máy đó, nên sao lưu ra tệp định kỳ (*Sao lưu kèm ảnh đồng hồ* để giữ cả ảnh) |
| Chụp, tải ảnh đồng hồ | Có, ảnh lưu theo tài khoản Claude | Có, ảnh lưu trên máy đó (IndexedDB) |
| Tự đọc số trên ảnh đồng hồ | Có (Claude) | Có: bộ đọc trên máy (miễn phí), hoặc Claude API nếu nhập khóa |
| Trang người thuê, báo hỏng | Có | Không |
| Nhắc qua thông báo điện thoại | Có (tác vụ hằng ngày) | Dùng nút thêm vào Google Calendar |
| Mô hình 3D, tính tiền, Excel, ảnh hóa đơn, giấy tờ, thu chi | Có | Có |

Khi chạy trên Claude, app dùng các khả năng `db`, `user`, `downloads`, `sample` (đọc ảnh) và `assets` (lưu ảnh) qua `window.claude.use(...)`. Ngoài Claude các khả năng này không có, app tự chuyển sang lưu trong trình duyệt và tải tệp trực tiếp.

## Cập nhật bản trên Claude

Sửa trong `src/`, chạy `node build.mjs`, rồi đăng lại `dist/sotro-artifact.html` lên đúng artifact cũ để giữ link và dữ liệu. Khai báo khả năng khi đăng:

```json
{
  "db": {"rules": [
    {"path": "portal", "read": "view", "write": "owner"},
    {"path": "reports", "read": "owner", "write": "owner"},
    {"path": "reports/{self}", "read": "interact", "write": "interact"}
  ]},
  "user": {}, "downloads": true, "sample": {"images": true}, "assets": {}
}
```

## Lưu ý

- Mẫu hợp đồng chỉ để tham khảo, không thay cho tư vấn pháp lý. Tờ khai CT01 nên đối chiếu với mẫu tại nơi nộp trước khi in.
- Quét thử mã VietQR bằng app ngân hàng trước khi gửi hóa đơn cho người thuê.
- Mô hình 3D là mô hình khối để hình dung bố trí, không thay bản vẽ thi công.
- Trên iPhone, hãy dùng app từ biểu tượng ngoài màn hình chính (Thêm vào màn hình chính). Nếu chỉ mở trong tab Safari, Safari có thể xóa dữ liệu và ảnh của trang sau 7 ngày không mở.
