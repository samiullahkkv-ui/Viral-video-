const { env, parseCookies, unsign, db, encrypt } = require('../../lib/server');

module.exports = async function handler(req, res) {
  const base = (process.env.APP_URL || '').replace(/\\/$/, '');
  const redirect = (path) => res.redirect(302, base + path);
  try {
    if (req.query.error) return redirect('/?oauth_error=' + encodeURIComponent(String(req.query.error)));
    const cookie = parseCookies(req).sxm_oauth;
    const data = unsign(cookie);
    const state = String(req.query.state || '');
    const code = String(req.query.code || '');
    res.setHeader('Set-Cookie', 'sxm_oauth=; HttpOnly; Secure; SameSite=Lax; Path=/api/oauth; Max-Age=0');
    if (!data || !state || state !== data.state || !code || Date.now() - data.createdAt > 600000) {
      return redirect('/?oauth_error=invalid_state');
    }
    const form = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: env('X_REDIRECT_URI'),
      code_verifier: data.verifier,
      client_id: env('X_CLIENT_ID')
    });
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
    if (process.env.X_CLIENT_SECRET) {
      headers.Authorization = 'Basic ' + Buffer.from(env('X_CLIENT_ID') + ':' + env('X_CLIENT_SECRET')).toString('base64');
    }
    const tokenResponse = await fetch('https://api.x.com/2/oauth2/token', { method: 'POST', headers, body: form });
    const token = await tokenResponse.json();
    if (!tokenResponse.ok || !token.access_token) throw new Error(token.error_description || token.error || 'X token exchange failed.');
    const meResponse = await fetch('https://api.x.com/2/users/me?user.fields=profile_image_url,name,username', {
      headers: { Authorization: 'Bearer ' + token.access_token }
    });
    const me = await meResponse.json();
    if (!meResponse.ok || !me.data) throw new Error('Could not read the authorized X profile.');
    const u = me.data;
    await db('x_accounts?on_conflict=user_id,x_user_id', {
      method: 'POST',
      prefer: 'resolution=merge-duplicates,return=minimal',
      body: [{
        user_id: data.userId,
        x_user_id: u.id,
        username: u.username,
        display_name: u.name || null,
        avatar_url: u.profile_image_url || null,
        access_token_enc: encrypt(token.access_token),
        refresh_token_enc: token.refresh_token ? encrypt(token.refresh_token) : null,
        token_expires_at: token.expires_in ? new Date(Date.now() + token.expires_in * 1000).toISOString() : null,
        scopes: String(token.scope || '').split(' ').filter(Boolean),
        updated_at: new Date().toISOString()
      }]
    });
    return redirect('/?connected=1');
  } catch (error) {
    return redirect('/?oauth_error=' + encodeURIComponent(error.message || 'callback_failed'));
  }
};
