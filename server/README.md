示例后端（Node + Express）

先决条件：已安装 Node.js

1) 进入 server 目录并安装依赖：

```powershell
cd server
npm install
```


2) DeepSeek（必须配置）

   本示例后端已被配置为仅使用 DeepSeek。请确保在启动服务器前设置以下环境变量：

```powershell
# DeepSeek（必需）
$env:DEEPSEEK_API_URL = 'https://api.deepseek.example/v1/query'  # 替换为 DeepSeek 实际 API URL
$env:DEEPSEEK_API_KEY = '你的_deepseek_key'
# 如果 DeepSeek 的认证不是使用 Authorization: Bearer <key>，可以设置自定义 header 名称：
$env:DEEPSEEK_API_KEY_HEADER = 'X-API-KEY'  # 可选，默认使用 Authorization

npm start
```

3) 启动后，打开浏览器访问 http://localhost:3000/ai.html 即可使用在线问答。

注意：如果 DeepSeek 的实际 API 请求/响应格式与示例不同，请提供 DeepSeek API 文档或示例请求/响应，我会据此调整 `server/index.js` 的实现。
