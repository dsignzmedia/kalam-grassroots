/* Serves the static site and one server-side route (currently redirecting everything, see REDIRECT_ALL_TO):
   POST /api/verify-memberid  { member_id: "<digits after WTL-26->" }
   It proxies to the Catalyst user_add_api /verify-memberid endpoint (same one the
   We The Leaders site uses). The API key can touch real member records, so it only
   ever lives here, as the Cloudflare secret CATALYST_USER_API_KEY — never in browser JS. */
/* SITE MOVED: while this is set, EVERY request to kalamgrassroots.org / www.kalamgrassroots.org (any page, file or API
   call) is redirected to this address. Set it to '' to serve this site (and the API route below) again.
   302 = temporary, so browsers do not remember it forever; switch to 301 once the move is final. */
const REDIRECT_ALL_TO = 'https://www.wetheleader.org/kalam/';
const REDIRECT_STATUS = 302;

const CATALYST_USER_API_BASE = 'https://annaapp-60073936101.catalystserverless.in/server/user_add_api';

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

async function verifyMemberId(request, env) {
  if (!env.CATALYST_USER_API_KEY) return json({ success: false, message: 'WTL ID check is not configured yet' }, 500);
  var body = {};
  try { body = await request.json(); } catch (err) {}
  /* the API only accepts the bare number — "WTL-26-1939356" comes back "Invalid member_id." */
  var memberId = String(body.member_id || '').trim().replace(/^WTL-?(26)?-?/i, '');
  if (!/^\d{1,12}$/.test(memberId)) return json({ success: false, message: 'Enter the digits of your WTL ID' }, 400);
  try {
    var res = await fetch(CATALYST_USER_API_BASE + '/verify-memberid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': env.CATALYST_USER_API_KEY },
      body: JSON.stringify({ member_id: memberId })
    });
    var data = await res.json();
    if (data && 'success' in data) return json(data, res.status);
  } catch (err) {}
  return json({ success: false, message: 'Could not check this WTL ID, please try again.' }, 502);
}

export default {
  async fetch(request, env) {
    var url = new URL(request.url);
    if (REDIRECT_ALL_TO) {
      return new Response(null, { status: REDIRECT_STATUS, headers: { Location: REDIRECT_ALL_TO, 'Cache-Control': 'no-store' } });
    }
    if (url.pathname === '/api/verify-memberid') {
      if (request.method !== 'POST') return json({ success: false, message: 'Method not allowed' }, 405);
      return verifyMemberId(request, env);
    }
    return env.ASSETS.fetch(request);
  }
};
