module.exports = async (req, res) => {
  // 1. 严格 CORS 控制：只允许你的博客域名
  const allowedOrigins = [
    'https://personyzh.cn', // 替换为你的博客域名
    'http://localhost:4000'  // 本地调试用
  ];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // 生产环境建议直接返回 403，调试时可临时放开
    // res.setHeader('Access-Control-Allow-Origin', '*'); 
    return res.status(403).json({ error: 'Forbidden Origin' });
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 2. 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 3. 从环境变量读取密钥（绝对不在代码中硬编码）
    const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
    const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.error('Missing Env Vars');
      return res.status(500).json({ error: 'Server Config Error' });
    }

    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Missing Code' });

    // 4. 服务器端向 GitHub 交换 Token
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
    return res.status(response.status).json(data);

  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
