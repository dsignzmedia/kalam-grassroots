// === CONFIG ===
/* Uploaded files (resume, cover letter ...) are stored in this Drive folder (the ID is the part after /folders/ in its URL).
   Leave it '' to auto-create one folder per form named "<form> Documents" instead. */
var DOCS_FOLDER_ID = '1SME8gYgg2znnAut8nR9Q0wOrFonKR5ea';
var MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB, same limit as the page
var ALLOWED_FILE_EXT = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];
var FILE_FIELDS = ['resume', 'cover_letter']; // columns that hold an uploaded file; shows "Not provided" when empty
var WTL_SHEET_ID = '1JMy2TEWa57odJrfr0MWyjKhz7M8UwRcZMO_BzEKOwso'; // a DIFFERENT spreadsheet than the one this script is bound to
var WTL_TAB_NAME = 'Registrations'; // tab with header row: WTL ID | Name | Mobile | State | Constituency | District

/* Forms that must carry consent = 'Agreed' (the privacy-notice tick box). A row without it is refused. */
var CONSENT_REQUIRED_FORMS = ['Visit Requests', 'Waitlist Assessment'];

/* GET  <exec>                      -> health check, shows {"ok":true,...}
   GET  <exec>?action=lookupWTL&id= -> old WTL lookup from the Registrations sheet (kept for compatibility) */
function doGet(e) {
  var action = String((e && e.parameter && e.parameter.action) || 'ping');
  if (action === 'lookupWTL') {
    var id = String(e.parameter.id || '').toUpperCase().trim();
    var rec = null;
    try { rec = findWTL(id); } catch (err) { return jsonOut({ found: false, error: String(err) }); }
    return jsonOut(rec ? Object.assign({ found: true }, rec) : { found: false });
  }
  if (action === 'ping') return jsonOut({ ok: true, service: 'kalam-grassroots form storage' });
  return jsonOut({ error: 'unknown action' });
}

/* POST { form: "<tab name>", data: { field: value, ... } } -> one new row in that tab */
function doPost(e) {
  var body = {};
  try { body = JSON.parse(e.postData.contents); } catch (err) { return jsonOut({ ok: false, error: 'bad json' }); }
  var formName = String(body.form || e.parameter.form || 'Untitled').replace(/[^a-zA-Z0-9 _-]/g, '').slice(0, 90);
  if (CONSENT_REQUIRED_FORMS.indexOf(formName) !== -1 && (!body.data || body.data.consent !== 'Agreed')) {
    return jsonOut({ ok: false, error: 'consent required' });
  }
  /* one write at a time, so two simultaneous submissions can't clash over the header row */
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    appendRow(formName, body.data || {});
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
  return jsonOut({ ok: true });
}

function appendRow(formName, data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  /* Save uploaded files FIRST. If any file is refused or fails, this throws and NO row is written,
     so a submission is never recorded with a missing document. */
  var fileLinks = {};
  Object.keys(data).forEach(function (k) {
    var v = data[k];
    if (v && typeof v === 'object' && v.base64) fileLinks[k] = saveFileToDrive(v, k, formName, data);
  });

  var sheet = ss.getSheetByName(formName);
  if (!sheet) { sheet = ss.insertSheet(formName); sheet.appendRow(['Timestamp']); }
  var header = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
  Object.keys(data).forEach(function (k) {
    if (header.indexOf(k) === -1) { header.push(k); sheet.getRange(1, header.length).setValue(k); }
  });
  var row = header.map(function (h) {
    if (h === 'Timestamp') return new Date();
    if (fileLinks[h]) return fileLinks[h];
    var v = data[h];
    if (v === undefined || v === '' || v === null) return FILE_FIELDS.indexOf(h) !== -1 ? 'Not provided' : '';
    return safeCell(v);
  });
  sheet.appendRow(row);
}

/* Text that starts with = + - @ would be run as a formula by Sheets (and could be abused);
   a leading apostrophe stores it as plain text instead. */
function safeCell(v) {
  if (typeof v === 'string' && /^[=+\-@]/.test(v)) return "'" + v;
  return v;
}

function cleanPart(v, fallback) {
  var t = String(v || '').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);
  return t || fallback;
}

function docsFolder(formName) {
  if (DOCS_FOLDER_ID) return DriveApp.getFolderById(DOCS_FOLDER_ID);
  var name = formName + ' Documents';
  var it = DriveApp.getFoldersByName(name);
  return it.hasNext() ? it.next() : DriveApp.createFolder(name);
}

/* Validates the file (type and size are checked here, not only in the browser), stores it in the
   documents folder as  <Form>_<WTL ID>_<Name>_<field>.<ext>  and returns its Drive link. */
function saveFileToDrive(fileObj, field, formName, data) {
  var original = String(fileObj.filename || 'upload');
  var ext = (original.split('.').pop() || '').toLowerCase();
  if (ALLOWED_FILE_EXT.indexOf(ext) === -1) throw new Error('File type not allowed for ' + field + ' (use PDF, DOC, DOCX, JPG or PNG)');
  var bytes = Utilities.base64Decode(fileObj.base64);
  if (bytes.length > MAX_FILE_BYTES) throw new Error('File too large for ' + field + ' (max 5 MB)');
  var name = cleanPart(formName, 'form') + '_' + cleanPart(data.wtl_id, 'no-id') + '_' + cleanPart(data.name, 'unknown') + '_' + field + '.' + ext;
  var blob = Utilities.newBlob(bytes, fileObj.mimeType || 'application/octet-stream', name);
  return docsFolder(formName).createFile(blob).getUrl();
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
