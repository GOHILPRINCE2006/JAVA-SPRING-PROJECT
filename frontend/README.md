# Lost & Found frontend

React + Vite + Tailwind CSS. See the root `README.md` for the full setup.

```powershell
copy .env.example .env.local
npm install
npm run dev        # http://localhost:5173
npm run build
npm run lint
npm test
```

- API base URL: `VITE_API_BASE_URL` (default `http://localhost:8080`). Only public values belong in `VITE_*` variables.
- Same-origin mode: set `VITE_API_BASE_URL=` (empty) and the dev server proxies `/api` to `VITE_PROXY_TARGET`.
- Structure: `src/api` (Axios client + one module per resource), `src/auth` (session context, route guards),
  `src/pages`, `src/pages/admin`, `src/components`, `src/layouts`, `src/utils`.
