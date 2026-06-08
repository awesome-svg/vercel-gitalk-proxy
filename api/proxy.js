module.exports = async (req, res) => {
  // 1. 设置 CORS 头，允许跨域
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');

  // 2. 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 3. 只处理 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 4. 解析 application/x-www-form-urlencoded 格式的请求体
    const rawBody = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', chunk => data += chunk);
      req.on('end', () => resolve(data));
      req.on('error', reject);
    });

    const params = new URLSearchParams(rawBody);
    const code = params.get('code');
    const state = params.get('state');

    // 5. 验证必要参数
    if (!code) {
      return res.status(400).json({ 
        error: 'Missing code parameter',
        received_body: rawBody // 用于调试
      });
    }

    // 6. 从环境变量获取 GitHub 配置
    const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
    const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.error('Missing GitHub OAuth environment variables');
      return res.status(500).json({ 
        error: 'Server configuration error: Missing OAuth credentials' 
      });
    }

    // 7. 向 GitHub 请求 access_token
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: code,
        ...(state && { state: state }) // 可选参数
      }).toString()
    });

    const result = await response.json();

    // 8. 将 GitHub 的响应原样返回给前端
    return res.status(response.status).json(result);

  } catch (error) {
    console.error('Proxy server error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};
