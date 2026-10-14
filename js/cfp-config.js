/* Central config for the Google Apps Script backend that stores form submissions
   and (for WTL lookups) reads WTL registrations. Fill in SHEET_API after deploying
   the Apps Script as a Web App (Deploy > New deployment > Web app > Execute as: Me,
   Who has access: Anyone). Paste the resulting /exec URL below. */
window.CFP_SHEET_API = 'https://script.google.com/macros/s/AKfycbzPkcXtPdoPWmJsvFhyx68qwuCLPT-xKkpUtbb8RlkhZRuZqg_F_Bw9z2DOVBAWwsnBsQ/exec';

/* Used by js/waitlist-wtl.js and js/visit-request.js for the WTL ID lookup.
   Set to '<exec url>?action=lookupWTL&id=' once the Apps Script is deployed. */
window.CFP_WTL_API = '';

/* Used by js/visit-request.js to submit visit requests.
   Set to '<exec url>?form=Visit%20Requests' once the Apps Script is deployed. */
window.CFP_VISIT_API = '';
