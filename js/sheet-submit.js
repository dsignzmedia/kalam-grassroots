/* Shared helper for sending form data to the Google Apps Script backend, and for
   collecting a <form>'s fields (including small files, base64-encoded) into a
   plain object. See js/cfp-config.js for window.CFP_SHEET_API. */
window.CFP = window.CFP || {};

CFP.send = function (formName, data) {
  if (!window.CFP_SHEET_API) return Promise.resolve();
  return fetch(window.CFP_SHEET_API, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }, /* avoids CORS preflight; Apps Script doesn't handle OPTIONS */
    body: JSON.stringify({ form: formName, data: data })
  });
};

/* Like CFP.send, but resolves only when the Apps Script confirms the row was written
   ({ ok: true }). Rejects on a network error, a non-200 reply or { ok: false }, so a page
   can show an error instead of a false "thank you". */
CFP.sendChecked = function (formName, data) {
  if (!window.CFP_SHEET_API) return Promise.reject(new Error('sheet API not configured'));
  return CFP.send(formName, data).then(function (res) {
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }).then(function (json) {
    if (!json || json.ok !== true) throw new Error((json && json.error) || 'not saved');
    return json;
  });
};

/* Collects a form's fields into a plain object. File inputs (small files only —
   resumes/photos, not large attachments) are base64-encoded as
   { filename, mimeType, base64 } so they can be forwarded as JSON. */
CFP.collectFormData = function (form) {
  var data = {}, fileFields = [];
  var fd = new FormData(form);
  fd.forEach(function (v, k) {
    if (v instanceof File && v.size > 0) fileFields.push([k, v]);
    else if (!(v instanceof File)) data[k] = v;
  });
  if (!fileFields.length) return Promise.resolve(data);
  return Promise.all(fileFields.map(function (pair) {
    return CFP.fileToBase64(pair[1]).then(function (b64) {
      data[pair[0]] = { filename: pair[1].name, mimeType: pair[1].type, base64: b64 };
    });
  })).then(function () { return data; });
};

CFP.fileToBase64 = function (file) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader();
    reader.onload = function () { resolve(String(reader.result).split(',')[1] || ''); };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
