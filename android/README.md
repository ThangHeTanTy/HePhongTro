# Sổ Trọ cho Android

App Android chạy đúng bản web của Sổ Trọ (`index.html`) bên trong một WebView, nên mọi tính năng và giao diện giống bản trên iPhone. Sửa app ở `src/` là cả hai bản cùng đổi.

## Tải và cài

1. Trên điện thoại Android, mở: <https://github.com/ThangHeTanTy/HePhongTro/releases/latest/download/SoTro.apk>
2. Mở tệp `SoTro.apk` vừa tải. Nếu máy hỏi, cho phép trình duyệt (hoặc ứng dụng Tệp) **cài ứng dụng không rõ nguồn gốc**.
3. **Cập nhật ngay trong app** (giống HeDeck): khi mở, app tự hỏi GitHub xem có bản mới không (tối đa 12 giờ một lần), hoặc vào **Thiết lập › Kiểm tra cập nhật**. Bấm **Cập nhật**: app tải APK, kiểm mã SHA-256, mở trình cài đặt của Android, bạn bấm **Cài đặt**. Lần đầu Android hỏi cho phép Sổ Trọ cài ứng dụng: bật lên rồi bấm quay lại là cài tiếp. Dữ liệu giữ nguyên. **Đừng gỡ app trước khi cài**, gỡ app sẽ xóa dữ liệu.

   Bộ cập nhật có từ bản này trở đi; ai đang dùng bản cũ hơn (1.0.9 trở về trước) thì tải và cài đè bằng link ở bước 1 một lần.

Bản phát hành chỉ được tạo khi mã nằm trên nhánh `main`: thẻ `android-v1.0.N` với N là `versionCode` của APK, kèm danh sách thay đổi kể từ bản trước (app hiện danh sách này khi báo có bản mới). Ở các nhánh khác, APK nằm trong mục **Artifacts** của lần chạy *Android APK* (tab Actions trên GitHub, cần đăng nhập).

Cần Android 8.0 trở lên.

## Khác với bản web

| | Android | Web trên iPhone |
|---|---|---|
| Lưu dữ liệu | Trong app trên máy đó | Trong Safari trên máy đó |
| Xuất Excel, ảnh hóa đơn, Word, sao lưu | Lưu vào **Tải xuống › SoTro**, có nút **Chia sẻ** (gửi Zalo, Messenger…) và **Mở** | Tải về qua Safari |
| Ảnh đồng hồ | Nút ảnh trên từng dòng cho chọn Máy ảnh hoặc ảnh có sẵn; *Chốt số bằng ảnh* chọn được nhiều ảnh một lúc | Giống vậy (Chụp ảnh hoặc Thư viện ảnh) |
| Sao lưu kèm ảnh (.zip) | Có | Có |
| Tự sao lưu Google Drive | Có | Có |
| Tự lưu bản sao mỗi ngày vào máy | Có, *Tải xuống › SoTro › SaoLuuTuDong*, còn lại sau khi gỡ app | Không |
| Không có mạng | Vẫn chạy: thư viện 3D, Excel, Word, mã QR và phông chữ có sẵn trong app | Cần mạng lần đầu để tải thư viện |
| Nút Quay lại | Đóng màn hình đang mở, rồi về Trang chủ, rồi thoát | — |

Dữ liệu của app Android và của Safari là hai nơi riêng. Muốn chuyển sổ từ iPhone sang Android: trên iPhone vào **Thiết lập › Sao lưu ra tệp** để lưu tệp `.json`, gửi tệp sang điện thoại Android, rồi trong app Android vào **Thiết lập › Khôi phục từ tệp** và chọn tệp đó.

## Cấu trúc

```
android/
  app/build.gradle.kts      Cấu hình app; tác vụ prepareWebAssets chép index.html và tải sẵn thư viện, phông chữ
  app/src/main/java/.../
    MainActivity.kt         WebView, chọn tệp, chụp ảnh, nút Quay lại, mở liên kết ngoài (Google Calendar…)
    AndroidBridge.kt        window.SoTroAndroid: lưu tệp vào Tải xuống, chia sẻ, chép chữ
    AppUpdater.kt           Cập nhật từ GitHub Releases: kiểm tra, tải APK, mở trình cài đặt
    OfflineLibs.kt          Trả bản tải sẵn khi trang xin thư viện từ cdnjs hoặc Google Fonts
  keystore/sotro-chung.jks  Khóa ký chung (xem dưới)
.github/workflows/android.yml  Đóng gói APK trên GitHub Actions
```

Phía web, phần dành cho Android nằm cuối `src/app.js` (mục "app Android"): chỉ chạy khi có `window.SoTroAndroid`, nên bản web và bản Claude không bị ảnh hưởng.

## Tự đóng gói trên máy

Cần JDK 17 và Android SDK (cài Android Studio là có đủ).

```bash
node build.mjs
```

```bash
cd android && ./gradlew assembleRelease
```

APK nằm ở `android/app/build/outputs/apk/release/app-release.apk`. Hoặc mở thư mục `android/` bằng Android Studio và bấm Run.

## Khóa ký

Android chỉ cho cài đè bản mới khi APK được ký bằng cùng một khóa. Hiện app ký bằng khóa chung `keystore/sotro-chung.jks` (mật khẩu `sotro-chung`), nằm công khai trong kho này. Khóa này đủ để cài và cập nhật app cho riêng mình, nhưng ai có kho cũng ký được APK trùng chữ ký, nên chỉ cài APK tải từ đúng trang Releases ở trên.

Muốn dùng khóa riêng: tạo khóa bằng `keytool`, rồi trong GitHub vào **Settings › Secrets and variables › Actions** thêm `SOTRO_KEYSTORE_BASE64` (nội dung tệp khóa mã hóa base64), `SOTRO_KEYSTORE_PASSWORD`, `SOTRO_KEY_ALIAS`, `SOTRO_KEY_PASSWORD`. Đổi khóa thì bản mới không cài đè được lên bản cũ: sao lưu dữ liệu, gỡ app, cài bản mới, rồi khôi phục.
