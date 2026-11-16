// Đóng gói Sổ Trọ thành 2 tệp HTML độc lập, không cần thư viện cài thêm.
//   node build.mjs
// Kết quả:
//   dist/sotro-artifact.html  bản để đăng lên Claude (artifact): chưa có <!doctype>, <head>, <body>
//   index.html                bản chạy trực tiếp trên trình duyệt hoặc GitHub Pages, dữ liệu lưu trong trình duyệt
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const read = p => readFileSync(join(root, p), 'utf8');

const shell = read('src/shell.html');
const css = read('src/styles.css');
// Mã Google Apps Script cho sao lưu Google Drive được nhúng vào app dưới dạng chuỗi.
const js = read('src/app.js').replace("'@DRIVE_SCRIPT@'", () => JSON.stringify(read('src/drive-script.gs')));
if (js.includes('@DRIVE_SCRIPT@')) throw new Error('src/app.js thiếu chỗ chèn mã sao lưu Google Drive');

if (!shell.includes('/*@STYLES@*/') || !shell.includes('//@APP@')) {
  throw new Error('src/shell.html thiếu chỗ chèn /*@STYLES@*/ hoặc //@APP@');
}
// Dùng hàm thay thế để ký tự "$" trong mã không bị hiểu là mẫu thay thế.
const artifact = shell.replace('/*@STYLES@*/', () => css.trimEnd()).replace('//@APP@', () => js.trimEnd());

mkdirSync(join(root, 'dist'), {recursive: true});
writeFileSync(join(root, 'dist/sotro-artifact.html'), artifact);

// Bản độc lập: phần trước <div id="app"> đưa vào <head>, phần còn lại vào <body>.
const cut = artifact.indexOf('<div id="app">');
const head = artifact.slice(0, cut).trim();
const body = artifact.slice(cut).trim();
const reset = ':root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px/1.4 system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}';
const standalone = `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0E6B5F">
<style>${reset}</style>
${head}
</head>
<body>
${body}
</body>
</html>
`;
writeFileSync(join(root, 'index.html'), standalone);

console.log(`Đã đóng gói: dist/sotro-artifact.html (${(artifact.length / 1024).toFixed(0)} KB), index.html (${(standalone.length / 1024).toFixed(0)} KB)`);
