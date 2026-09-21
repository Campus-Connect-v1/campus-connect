# Operator console

Admin web app for managing Campus Connect data — universities, departments,
buildings, facilities, users, events, study groups, posts and operator
accounts — so none of it has to be inserted into the database by hand.

## Running

The Express server in `../server` serves the built bundle at `/admin`, so in
production there is nothing separate to deploy.

```bash
# production bundle (what the server serves)
npm install
npm run build

# local development
npm run dev     # http://localhost:5174/admin/
```

`npm run dev` proxies `/api` to `http://localhost:8000`, so it needs a server
running locally (`cd ../server && npm run dev`). Without one, every request
fails with `ECONNREFUSED` and the login screen cannot submit.

To work on the UI without running a server, point the proxy at the deployed
API instead:

```bash
VITE_API_PROXY=https://campus-connect-api-o0xt.onrender.com npm run dev
```

**Be aware which database you are hitting.** `server/.env` points at the
production Hostinger database, so a locally-run server reads and writes live
data — it is not a separate dev database. Either way, edits made from the dev
UI are real.

## First sign-in

There is no sign-up. Create the first account from the server directory:

```bash
cd ../server
node scripts/createOperator.js
```

The first account created is always an `owner`.

## Roles

| Role | Read | Create / edit / delete | Manage operators |
|------|------|------------------------|------------------|
| `owner`   | yes | yes | yes |
| `admin`   | yes | yes | no  |
| `support` | yes | no  | no  |

Enforced server-side in `server/middleware/adminAuth.js`; the UI only hides
what the role cannot use.
