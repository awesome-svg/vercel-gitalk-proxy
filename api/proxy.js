module.exports = async (req, res) => {
  // 1. 设置 CORS 头，允许跨域访问
  // 生产环境建议将 '*' 替换为你的博客域名，如 'https://yourblog.com'
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 2. 处理预检请求 (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // 3. 仅允许 POST 请求 (根据实际需求修改，如 GET)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 4. 获取前端传来的参数
    const body = req.body;
    
    // 示例：针对 GitHub OAuth 交换 access_token
    // 如果是其他代理，请修改下方的 targetUrl 和请求体构造逻辑
    const targetUrl = 'https://github.com/login/oauth/access_token';
    
    // 从环境变量中获取敏感信息（推荐做法，避免硬编码）
    const client_id = process.env.GITHUB_CLIENT_ID;
    const client_secret = process.env.GITHUB_CLIENT_SECRET;

    if (!client_id || !client_secret) {
      return res.status(500).json({ error: 'Server configuration error: Missing env vars' });
    }

    // 5. 向后端目标服务器发起请求
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id,
        client_secret,
        code: body.code, // 前端传来的 authorization code
      }),
    });

    const data = await response.json();

    // 6. 将后端响应返回给前端
    return res.status(response.status).json(data);

  } catch (error) {
    console.error('Proxy Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
