// api/proxy.js

export default async function handler(req, res) {
  // 1. 设置 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 2. 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // 3. 仅允许 POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 4. 获取环境变量
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('Missing env vars');
      return res.status(500).json({ error: 'Configuration Error' });
    }

    // 5. 解析 Gitalk 发送的 form-data
    // 注意：Gitalk 发送的是 URLSearchParams 格式，不是 JSON
    const body = await req.text(); 
    const params = new URLSearchParams(body);
    const code = params.get('code');

    if (!code) {
      return res.status(400).json({ error: 'Missing code' });
    }

    // 6. 转发给 GitHub
    const response = await fetch('https://github.com/login/oauth/access_token', {
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

    const data = await response.json();
    return res.status(response.status).json(data);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
