/**
 * Vercel Serverless Function for Gitalk Proxy
 * 路径: /api/proxy
 * 方法: POST
 */

module.exports = async (req, res) => {
  // =================配置区域=================
  // 允许跨域的源列表 (生产环境建议只填你的博客域名)
  // 开发时保留 localhost，部署后添加 https://yourblog.com
  const ALLOWED_ORIGINS = [
    'http://localhost:4000', 
    'https://personyzh.cn', // 你的博客域名
    'null' // 某些本地文件访问可能产生 null origin
  ];

  // 获取请求来源
  const origin = req.headers.origin;
  
  // 动态设置 Access-Control-Allow-Origin
  // 如果来源在白名单中，则允许；否则不允许（或设置为 '*' 但无法携带 Cookie）
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // 调试阶段可以临时放开所有来源，生产环境建议注释掉下面这行
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  // 设置其他必要的 CORS 头部
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.setHeader('Access-Control-Max-Age', '86400'); // 预检请求缓存24小时
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // =================处理预检请求 (OPTIONS)=================
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // =================处理实际请求 (POST)=================
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 1. 从环境变量获取 GitHub OAuth 凭证
    const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
    const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.error('Missing Environment Variables');
      return res.status(500).json({ error: 'Server Configuration Error: Missing Credentials' });
    }

    // 2. 解析前端传来的 body
    // Gitalk 通常发送 JSON: { code: "authorization_code" }
    let body = {};
    try {
      if (typeof req.body === 'string') {
        body = JSON.parse(req.body);
      } else {
        body = req.body;
      }
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON Body' });
    }

    const { code } = body;

    if (!code) {
      return res.status(400).json({ error: 'Missing "code" parameter' });
    }

    // 3. 向 GitHub 发起请求交换 Access Token
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

    // 4. 获取 GitHub 的响应数据
    const data = await githubResponse.json();

    // 5. 将 GitHub 的响应原样返回给前端
    // 注意：GitHub 可能返回 error 字段，我们直接透传，让前端 Gitalk 库处理
    return res.status(githubResponse.status).json(data);

  } catch (error) {
    console.error('Proxy Internal Error:', error.message);
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
};
