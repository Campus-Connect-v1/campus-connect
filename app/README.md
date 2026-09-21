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

# local development, with the API proxied from :8000
npm run dev     # http://localhost:5174/admin/
```

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
