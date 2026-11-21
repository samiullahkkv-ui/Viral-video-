const { json, requireUser, db, decrypt } = require('../lib/server');
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  try {
    const user = await requireUser(req);
    const { accountId, text } = req.body || {};
    if (!accountId || typeof text !== 'string' || !text.trim() || text.length > 280) {
      return json(res, 400, { error: 'Choose an account and enter a post of 1–280 characters.' });
    }
    const rows = await db('x_accounts?user_id=eq.' + encodeURIComponent(user.id) + '&id=eq.' + encodeURIComponent(accountId) + '&select=id,access_token_enc,token_expires_at');
    const account = rows[0];
    if (!account) return json(res, 404, { error: 'Connected account not found.' });
    if (account.token_expires_at && new Date(account.token_expires_at) <= new Date()) {
      return json(res, 401, { error: 'X authorization expired. Reconnect this account in Accounts.' });
    }
    const token = decrypt(account.access_token_enc);
    const response = await fetch('https://api.x.com/2/tweets', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.trim() })
    });
    const result = await response.json();
    if (!response.ok || !result.data?.id) {
      return json(res, response.status || 502, { error: result.detail || result.title || result.errors?.[0]?.message || 'X API could not publish this post.' });
    }
    await db('published_posts', {
      method: 'POST',
      body: [{ user_id: user.id, account_id: account.id, x_post_id: result.data.id, text: text.trim() }]
    });
    return json(res, 200, { ok: true, postId: result.data.id });
  } catch (error) {
    return json(res, 400, { error: error.message || 'Publishing failed.' });
  }
};
