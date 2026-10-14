// === CONFIG ===
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
  var sheet = ss.getSheetByName(formName);
  if (!sheet) { sheet = ss.insertSheet(formName); sheet.appendRow(['Timestamp']); }
  var header = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
  Object.keys(data).forEach(function (k) {
    if (header.indexOf(k) === -1) { header.push(k); sheet.getRange(1, header.length).setValue(k); }
  });
  var row = header.map(function (h) {
    if (h === 'Timestamp') return new Date();
    var v = data[h];
    if (v && typeof v === 'object' && v.base64) {
      try { return saveFileToDrive(v); } catch (err) { return 'upload failed: ' + err; }
    }
    return v !== undefined ? safeCell(v) : '';
  });
  sheet.appendRow(row);
}

/* Text that starts with = + - @ would be run as a formula by Sheets (and could be abused);
   a leading apostrophe stores it as plain text instead. */
function safeCell(v) {
  if (typeof v === 'string' && /^[=+\-@]/.test(v)) return "'" + v;
  return v;
}

function saveFileToDrive(fileObj) {
  var bytes = Utilities.base64Decode(fileObj.base64);
  var blob = Utilities.newBlob(bytes, fileObj.mimeType || 'application/octet-stream', fileObj.filename || 'upload');
  var folder = DriveApp.getRootFolder(); // consider creating/using a dedicated folder by ID instead
  var file = folder.createFile(blob);
  return file.getUrl();
}

function findWTL(id) {
  var ss = SpreadsheetApp.openById(WTL_SHEET_ID);
  var sheet = ss.getSheetByName(WTL_TAB_NAME);
  if (!sheet) return null; // no Registrations tab: report "not found" instead of crashing
  var values = sheet.getDataRange().getValues();
  var header = values[0].map(function (h) { return String(h).trim().toLowerCase(); });
  var idCol = header.indexOf('wtl id');
  if (idCol === -1) return null;
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][idCol]).toUpperCase().trim() === id) {
      return {
        name: values[i][header.indexOf('name')],
        mobile: values[i][header.indexOf('mobile')],
        state: values[i][header.indexOf('state')],
        constituency: values[i][header.indexOf('constituency')],
        district: values[i][header.indexOf('district')]
      };
    }
  }
  return null;
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
