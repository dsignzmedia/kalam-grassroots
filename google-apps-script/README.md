# Google Apps Script backend — setup

This backend stores form submissions from the site into a Google Sheet, and
(for WTL ID lookups) reads a separate WTL registrations sheet. It is not part
of the website build — it is deployed separately, by hand, into the site
owner's Google account.

## 1. Create the script bound to the submissions sheet

Open the submissions spreadsheet:
https://docs.google.com/spreadsheets/d/1JMy2TEWa57odJrfr0MWyjKhz7M8UwRcZMO_BzEKOwso/edit

Go to **Extensions > Apps Script**. This creates a script bound to that
spreadsheet, so `SpreadsheetApp.getActiveSpreadsheet()` in the code targets it
automatically. Delete the default `Code.gs` contents and paste in the
contents of `Code.gs` from this folder.

## 2. Point it at the WTL registrations sheet

At the top of `Code.gs`:

```js
var WTL_SHEET_ID = 'PUT_WTL_REGISTRATIONS_SPREADSHEET_ID_HERE';
var WTL_TAB_NAME = 'Registrations';
```

Set `WTL_SHEET_ID` to the ID of the **separate** spreadsheet that holds WTL
registrations (the long ID in its URL, between `/d/` and `/edit`). That sheet
needs a tab named per `WTL_TAB_NAME` (default `Registrations`) with a header
row:

```
WTL ID | Name | Mobile | State | Constituency | District
```

## 3. Deploy as a Web App

**Deploy > New deployment**, type **Web app**:
- Execute as: **Me**
- Who has access: **Anyone**

Click **Deploy**, authorize the script when prompted, and copy the resulting
`.../exec` URL.

## 4. Wire the site to it

In `js/cfp-config.js`:

```js
window.CFP_SHEET_API = '<the exec URL>';
window.CFP_WTL_API = '<the exec URL>?action=lookupWTL&id=';
window.CFP_VISIT_API = '<the exec URL>?form=Visit%20Requests';
```

- `CFP_SHEET_API` is used by all the generic form submissions and by the
  newsletter and waitlist-assessment handlers.
- `CFP_WTL_API` is used by `js/waitlist-wtl.js` (waiting-list.html) and by
  `js/visit-request.js` (visit-request.html) for the WTL ID lookup step.
- `CFP_VISIT_API` is used by `js/visit-request.js` to submit visit requests.
  Wiring up `visit-request.html` itself is out of scope here (it's being
  handled separately) — this note is just so the same backend can serve it
  once that's ready.

No manual sheet-tab setup is needed for form submissions: each new tab is
created automatically on first submission, named after the `data-sheet-form`
value used in the page's HTML (e.g. "Contact", "Nominations"). The only sheet
that needs manual setup is the separate WTL registrations sheet described in
step 2.
