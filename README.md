# ScriptServer API System

A production-grade, highly stable backend API designed for Lua script hosting and delivery.

## 🚀 Deployment Instructions (Railway)

To deploy this backend to [Railway](https://railway.app):

1. **Connect GitHub:** Push this repository to a GitHub account.
2. **Create New Project:** On Railway, click "New Project" -> "Deploy from GitHub repo".
3. **Automatic Detection:** Railway will detect the Node.js environment and the `package.json`.
4. **Environment Variables:**
   - No strictly required variables are needed to start, as it defaults to port 3000 and uses memory storage.
   - If you want to use a specific port, Railway automatically sets the `PORT` variable.
5. **Start Command:** Ensure the "Start Command" is set to `npm start` (which runs `tsx server.ts`).

---

## 💻 Frontend Integration (React/Vercel)

Use the following example to interact with the API from your frontend:

```typescript
const createScript = async (luaCode: string) => {
  try {
    const response = await fetch('https://your-railway-url.app/api/create-script', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code: luaCode })
    });

    if (!response.ok) throw new Error('Failed to create script');
    
    const data = await response.json();
    console.log('Script ID:', data.id);
    console.log('Loader URL:', data.loaderUrl);
    
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
};
```

---

## 🛡️ Security Features

- **User-Agent Filtering:** Blocks automated tools like `curl` and `Postman` to prevent basic scraping.
- **Rate Limiting:** Restricted to 30 requests per minute per IP address.
- **Anti-Replay (Nonce):** The `/loader` endpoint can optionally validate `ts` (timestamp) and `nonce` parameters to prevent replaying intercepted requests.
- **Lua Compatibility:** Returns exact `text/plain` content, making it compatible with `game:HttpGet` in Roblox.

---

## 🛠️ API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/create-script` | Stores Lua code and returns a unique ID. |
| `GET` | `/loader?id=...` | Retrieves the stored Lua code. |
| `GET` | `/api/health` | Returns system health status. |
