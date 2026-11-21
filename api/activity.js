const { json, requireUser, db } = require('../lib/server');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });
  try {
    const user = await requireUser(req);
    const rows = await db(
      'published_posts?user_id=eq.' + encodeURIComponent(user.id) +
      '&select=id,account_id,x_post_id,text,published_at&order=published_at.desc&limit=50'
    );
    return json(res, 200, { posts: rows, total: rows.length });
  } catch (error) {
    return json(res, 401, { error: error.message || 'Could not load publishing activity.' });
  }
};
