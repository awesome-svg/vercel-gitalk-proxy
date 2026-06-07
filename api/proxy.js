/**
 * Gitalk Proxy for Vercel
 * 路径: /api/proxy
 * 方法: POST (实际请求), OPTIONS (预检请求)
 */

module.exports = async (req, res) => {
  // 1. 设置 CORS 头部 (必须放在最前面)
  // 允许所有来源跨域，生产环境建议改为你的博客域名，例如: 'https://yourblog.com'
  const allowedOrigin = req.headers.origin || '*';
  
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400'); // 预检请求缓存 24 小时

  // 2. 处理 OPTIONS 预检请求 (解决 CORS 404/403 的关键)
  if (req.method === 'OPTIONS') {
    return res.status(204).end(); // 返回 204 No Content，告诉浏览器预检通过
  }

  // 3. 仅允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 4. 从环境变量获取 GitHub OAuth 配置
    // ⚠️ 必须在 Vercel 后台设置 GITHUB_CLIENT_ID 和 GITHUB_CLIENT_SECRET
    const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
    const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

    // 检查环境变量是否存在
    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.error('❌ Missing Environment Variables: GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET');
      return res.status(500).json({ error: 'Server Configuration Error: Missing Credentials' });
    }

    // 5. 解析前端传来的 JSON 数据
    // Vercel Node.js 环境通常会自动解析 body，但为了保险起见，我们手动处理
    let body = '';
    
    // 如果 req.body 已经存在（某些中间件处理后），直接使用
    let code;
    if (req.body && req.body.code) {
      code = req.body.code;
    } else {
      // 否则手动读取流
      await new Promise((resolve, reject) => {
        req.on('data', (chunk) => { body += chunk; });
        req.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            code = parsed.code;
            resolve();
          } catch (e) {
            reject(e);
          }
        });
        req.on('error', (err) => reject(err));
      });
    }

    if (!code) {
      return res.status(400).json({ error: 'Missing "code" parameter' });
    }

    // 6. 向 GitHub 发起请求交换 Access Token
    const githubResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: code,
      }),
    });

    const data = await githubResponse.json();

    // 7. 将 GitHub 的响应原样返回给前端
    // 注意：GitHub 可能返回 error 字段，我们直接透传，让前端 Gitalk 库去处理
    return res.status(githubResponse.status).json(data);

  } catch (error) {
    console.error('💥 Proxy Error:', error.message);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};
