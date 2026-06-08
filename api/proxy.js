// api/proxy.js

module.exports = async (req, res) => {
  // 1. 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 2. 处理预检请求 (OPTIONS)
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // 3. 只允许 POST 请求
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    // 4. 获取环境变量
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('Missing GitHub OAuth env vars');
      res.status(500).json({ error: 'Server Configuration Error' });
      return;
    }

    // 5. 解析请求体 (Gitalk 发送的是 form-urlencoded)
    // Vercel 的 req.body 在某些情况下可能是 Buffer 或 String，需统一处理
    let bodyStr = '';
    
    // 监听数据流以获取完整 body
    await new Promise((resolve, reject) => {
      req.on('data', (chunk) => {
        bodyStr += chunk;
      });
      req.on('end', () => {
        resolve();
      });
      req.on('error', (err) => {
        reject(err);
      });
    });

    const params = new URLSearchParams(bodyStr);
    const code = params.get('code');

    if (!code) {
      res.status(400).json({ error: 'Missing code parameter' });
      return;
    }

    // 6. 向 GitHub 发起请求
    const githubRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
      }).toString(),
    });

    const data = await githubRes.json();

    // 7. 返回结果
    res.status(githubRes.status).json(data);

  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
