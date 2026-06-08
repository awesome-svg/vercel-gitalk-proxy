module.exports = async (req, res) => {
  // 1. 设置 CORS 头，允许任何域名访问（因为 Gitalk 可能部署在任何地方）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 2. 处理预检请求 (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 3. 只处理 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { code, state } = req.body;

    // 4. 验证必要参数
    if (!code) {
      return res.status(400).json({ error: 'Missing code parameter' });
    }

    // 5. 从环境变量获取 GitHub 配置
    const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
    const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.error('Missing env vars');
      return res.status(500).json({ error: 'Server Configuration Error' });
    }

    // 6. 向 GitHub 交换 Access Token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: code,
        state: state,
      }),
    });

    const tokenData = await tokenResponse.json();

    // 7. 如果 GitHub 返回错误，转发错误
    if (tokenData.error) {
      return res.status(400).json(tokenData);
    }

    // 8. 返回 Access Token 给前端
    return res.status(200).json({
      access_token: tokenData.access_token,
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
