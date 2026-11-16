// Sổ Trọ – tự sao lưu lên Google Drive của bạn.
//
// Đoạn mã này chạy trong tài khoản Google của chính bạn (script.google.com) và chỉ ghi vào
// một thư mục "Sổ Trọ - Sao lưu" trong Drive của bạn. Dữ liệu không đi qua máy chủ nào khác.
// KEY là mật mã riêng do app Sổ Trọ tạo: chỉ ai biết mật mã này mới đọc, ghi được bản sao lưu.
// Đừng chia sẻ đoạn mã này hay đường link triển khai cho người khác.

var KEY = '__KEY__';
var FOLDER = 'Sổ Trọ - Sao lưu';
var KEEP_LATEST = 20;   // luôn giữ 20 bản mới nhất
var KEEP_DAYS = 90;     // và mỗi ngày một bản trong 90 ngày gần đây

function doPost(e) {
  var req;
  try { req = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false, error: 'bad_request' }); }
  if (!req || req.key !== KEY) return out_({ ok: false, error: 'bad_key' });
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return out_({ ok: false, error: 'busy' });
  try {
    var root = folder_();
    switch (req.action) {
      case 'ping':
        return out_({ ok: true, folder: root.getUrl(), email: Session.getEffectiveUser().getEmail() });
      case 'save': {
        if (!/^SoTro_[\w-]+\.json$/.test(req.name || '')) return out_({ ok: false, error: 'bad_name' });
        var f = root.createFile(Utilities.newBlob(req.json, 'application/json', req.name));
        prune_(root);
        return out_({ ok: true, id: f.getId(), size: f.getSize() });
      }
      case 'list': {
        var list = backups_(root).map(function (x) {
          return { id: x.getId(), name: x.getName(), size: x.getSize(), time: x.getDateCreated().getTime() };
        });
        return out_({ ok: true, files: list });
      }
      case 'get': {
        var file = DriveApp.getFileById(req.id);
        if (!inFolder_(file, root)) return out_({ ok: false, error: 'not_found' });
        return out_({ ok: true, json: file.getBlob().getDataAsString('UTF-8') });
      }
      case 'photos': {
        var names = [], it = photoFolder_(root).getFiles();
        while (it.hasNext()) names.push(it.next().getName());
        return out_({ ok: true, names: names });
      }
      case 'putPhoto': {
        if (!/^l_[\w]+\.jpg$/.test(req.name || '')) return out_({ ok: false, error: 'bad_name' });
        var pf = photoFolder_(root);
        if (!pf.getFilesByName(req.name).hasNext()) {
          pf.createFile(Utilities.newBlob(Utilities.base64Decode(req.data), req.type || 'image/jpeg', req.name));
        }
        return out_({ ok: true });
      }
      case 'getPhoto': {
        var pit = photoFolder_(root).getFilesByName(req.name || '');
        if (!pit.hasNext()) return out_({ ok: false, error: 'not_found' });
        var blob = pit.next().getBlob();
        return out_({ ok: true, type: blob.getContentType(), data: Utilities.base64Encode(blob.getBytes()) });
      }
      default:
        return out_({ ok: false, error: 'bad_action' });
    }
  } catch (err) {
    return out_({ ok: false, error: 'server', message: String(err && err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

// Mở đường link bằng trình duyệt chỉ để kiểm tra đã triển khai đúng.
function doGet() {
  return ContentService.createTextOutput('Sổ Trọ: sao lưu Google Drive đã sẵn sàng. Dán đường link này vào app.');
}

function folder_() {
  var it = DriveApp.getFoldersByName(FOLDER);
  return it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER);
}

function photoFolder_(root) {
  var it = root.getFoldersByName('anh');
  return it.hasNext() ? it.next() : root.createFolder('anh');
}

function backups_(root) {
  var files = [], it = root.getFiles();
  while (it.hasNext()) {
    var f = it.next();
    if (/^SoTro_.*\.json$/.test(f.getName())) files.push(f);
  }
  files.sort(function (a, b) { return b.getDateCreated().getTime() - a.getDateCreated().getTime(); });
  return files;
}

function inFolder_(file, root) {
  var ps = file.getParents();
  while (ps.hasNext()) if (ps.next().getId() === root.getId()) return true;
  return false;
}

// Giữ KEEP_LATEST bản mới nhất, cộng bản mới nhất của mỗi ngày trong KEEP_DAYS ngày; còn lại cho vào thùng rác.
function prune_(root) {
  var files = backups_(root), seenDay = {}, now = Date.now();
  files.forEach(function (f, i) {
    var t = f.getDateCreated().getTime();
    var day = Utilities.formatDate(f.getDateCreated(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    var keep = i < KEEP_LATEST || (!seenDay[day] && now - t < KEEP_DAYS * 86400000);
    seenDay[day] = true;
    if (!keep) f.setTrashed(true);
  });
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
