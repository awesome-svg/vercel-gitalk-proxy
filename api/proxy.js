module.exports = async (req, res) => {
  // 1. 设置 CORS 头部 (允许跨域)
  // 注意：生产环境建议将 '*' 替换为你的博客域名，如 'https://yourblog.com'
  // 为了调试方便，这里暂时使用 '*'，你可以稍后改为具体域名
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400'); // 预检请求缓存时间

  // 2. 处理 OPTIONS 预检请求 (解决 CORS 报错的关键)
  if (req.method === 'OPTIONS') {
    return res.status(204).end(); // 返回 204 No Content
  }

  // 3. 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 4. 从环境变量获取 GitHub OAuth 信息 (安全！不暴露在前端)
    const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
    const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.error('Missing Environment Variables');
      return res.status(500).json({ error: 'Server Configuration Error' });
    }

    // 5. 获取前端传来的 code
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Missing Code' });
    }

    // 6. 向 GitHub 发起请求交换 Access Token
    const response = await fetch('https://github.com/login/oauth/access_token', {
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

    const data = await response.json();

    // 7. 将 GitHub 的响应返回给前端
    return res.status(response.status).json(data);

  } catch (error) {
    console.error('Proxy Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
