const crypto = require('crypto');
const { json, env, requireUser, signed } = require('../../lib/server');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  try {
    const user = await requireUser(req);
    const state = crypto.randomBytes(24).toString('base64url');
    const verifier = crypto.randomBytes(48).toString('base64url');
    const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
    const payload = signed({ state, verifier, userId: user.id, createdAt: Date.now() });
    res.setHeader('Set-Cookie', 'sxm_oauth=' + encodeURIComponent(payload) + '; HttpOnly; Secure; SameSite=Lax; Path=/api/oauth; Max-Age=600');
    const url = new URL('https://twitter.com/i/oauth2/authorize');
    url.search = new URLSearchParams({
      response_type: 'code',
      client_id: env('X_CLIENT_ID'),
      redirect_uri: env('X_REDIRECT_URI'),
      scope: 'tweet.read tweet.write users.read offline.access',
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256'
    }).toString();
    return json(res, 200, { url: url.toString() });
  } catch (error) {
    return json(res, 400, { error: error.message || 'Could not start authorization.' });
  }
};
