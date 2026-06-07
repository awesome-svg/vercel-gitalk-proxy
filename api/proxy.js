module.exports = async (req, res) => {
  // 1. 设置 CORS 头部，明确允许的来源（此处允许 localhost:4000 和你的博客域名）
  const allowedOrigins = ['http://localhost:4000', 'https://personyzh.com']; // 替换为你的实际博客域名
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // 如果不想允许所有来源，可以返回 403 或默认不设置头部
    // 但为了调试方便，开发阶段可以临时允许所有来源：
    // res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  // 2. 允许的请求方法
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  // 3. 允许的请求头
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  // 4. 允许携带凭证（如 cookies）
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  // 5. 预检请求缓存时间（秒）
  res.setHeader('Access-Control-Max-Age', '86400'); // 24小时

  // 6. 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    // 对于 OPTIONS 请求，直接返回 204 No Content
    return res.status(204).end();
  }

  // 7. 处理实际的 POST 请求（你的代理逻辑）
  if (req.method === 'POST') {
    try {
      const { code } = req.body;
      // ... 你的代理逻辑，向 GitHub 请求 access_token ...
      // 确保在返回响应时，CORS 头部已经设置
      return res.status(200).json({ access_token: '...' });
    } catch (error) {
      console.error('Proxy error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // 8. 其他请求方法返回 405
  return res.status(405).json({ error: 'Method Not Allowed' });
};
