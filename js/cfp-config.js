/* Central config for the Google Apps Script backend that stores form submissions
   and (for WTL lookups) reads WTL registrations. Fill in SHEET_API after deploying
   the Apps Script as a Web App (Deploy > New deployment > Web app > Execute as: Me,
   Who has access: Anyone). Paste the resulting /exec URL below. */
window.CFP_SHEET_API = 'https://script.google.com/macros/s/AKfycbzPkcXtPdoPWmJsvFhyx68qwuCLPT-xKkpUtbb8RlkhZRuZqg_F_Bw9z2DOVBAWwsnBsQ/exec';

/* WTL ID check: js/waitlist-wtl.js and js/visit-request.js call POST /api/verify-memberid (worker.js).
   Leave CFP_WTL_API empty to use that; set it only to point at a different endpoint. */
window.CFP_WTL_API = '';
