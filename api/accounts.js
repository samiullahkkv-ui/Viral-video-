const { json, requireUser, db } = require('../lib/server');
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });
  try {
    const user = await requireUser(req);
    const rows = await db('x_accounts?user_id=eq.' + encodeURIComponent(user.id) + '&select=id,x_user_id,username,display_name,avatar_url,created_at&order=created_at.desc');
    return json(res, 200, { accounts: rows });
  } catch (error) {
    return json(res, 401, { error: error.message || 'Could not load accounts.' });
  }
};
