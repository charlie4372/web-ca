# Web CA

A self-hosted certificate authority manager for creating, managing, and renewing SSL/TLS certificates. Built with Vue 3 and TypeScript.

## Features

- **Certificate Authority Management** — Create root and intermediate CAs, or import existing ones (supports encrypted private keys)
- **Certificate Issuance** — Generate leaf certificates signed by your CAs with full multi-SAN support (DNS, IP, URI, Email)
- **Renewal** — Renew CAs and certificates with new expiry dates while preserving subject and SAN configuration
- **Download** — Export certificates, private keys, and full chain bundles as PEM files
- **User Management** — Role-based access control with admin and operator roles
- **Dashboard** — Overview of all certificates with expiry warnings

## Tech Stack

| Layer | Technology |
|---|---|
| UI | Vue 3, Naive UI, Pinia, Vue Router |
| API | Express 5, TypeScript |
| Database | SQLite (via Drizzle ORM) |
| Crypto | node-forge (X.509 v3) |
| Auth | Session-based (argon2, httpOnly cookies) |

## Quick Start

### Prerequisites

- Node.js 20.19+ or 22.12+

### Development

```bash
npm install

# Seed the database (creates admin user)
npm run db:seed

# Start API (port 3000) and UI (port 5173) in parallel
npm run dev
```

Open http://localhost:5173 and login with `admin` / `admin123`.

### Docker

```bash
docker build -t web-ca .

docker run -p 3000:3000 \
  -v webca-data:/data \
  -e SESSION_SECRET="$(openssl rand -hex 32)" \
  -e CERT_ENCRYPTION_KEY="$(openssl rand -hex 32)" \
  web-ca
```

Or with Docker Compose:

```bash
docker compose up -d
```

The app will be available at http://localhost:3000.

## Project Structure

```
packages/
├── shared/          Shared TypeScript types, Zod schemas, constants
├── api/             Express API
│   ├── src/config/      Environment and database configuration
│   ├── src/db/          Drizzle schema, migrations, seed
│   ├── src/middleware/  Auth, RBAC, validation, session store
│   ├── src/routes/      REST endpoints (auth, CAs, certificates, users)
│   ├── src/services/    Business logic (crypto, CA, certificate, user)
│   └── src/utils/       Logger, private key encryption
└── ui/              Vue 3 frontend
    ├── src/stores/      Pinia state management
    ├── src/pages/       Route pages (dashboard, CA, certificates, users)
    ├── src/components/  Reusable components (forms, tables, SAN editor)
    └── src/layouts/     Dashboard layout with sidebar navigation
```

## API Endpoints

All routes require authentication except `POST /api/v1/auth/login`.

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/auth/login` | Login |
| `POST` | `/api/v1/auth/logout` | Logout |
| `GET` | `/api/v1/auth/me` | Current user |
| `GET` | `/api/v1/cas` | List CAs |
| `POST` | `/api/v1/cas` | Create CA |
| `POST` | `/api/v1/cas/upload` | Upload existing CA |
| `GET` | `/api/v1/cas/:id` | Get CA detail |
| `POST` | `/api/v1/cas/:id/renew` | Renew CA |
| `DELETE` | `/api/v1/cas/:id` | Delete CA |
| `GET` | `/api/v1/cas/:id/download` | Download CA certificate |
| `GET` | `/api/v1/certificates` | List certificates |
| `POST` | `/api/v1/certificates` | Create certificate |
| `GET` | `/api/v1/certificates/:id` | Get certificate detail |
| `POST` | `/api/v1/certificates/:id/renew` | Renew certificate |
| `DELETE` | `/api/v1/certificates/:id` | Delete certificate |
| `GET` | `/api/v1/certificates/:id/download` | Download bundle (cert + key + chain) |
| `GET` | `/api/v1/certificates/:id/download/cert` | Download certificate only |
| `GET` | `/api/v1/certificates/:id/download/key` | Download private key only |
| `GET` | `/api/v1/users` | List users (admin) |
| `POST` | `/api/v1/users` | Create user (admin) |
| `PATCH` | `/api/v1/users/:id` | Update user (admin) |
| `PATCH` | `/api/v1/users/:id/password` | Change password (admin) |
| `DELETE` | `/api/v1/users/:id` | Delete user (admin) |

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | Environment mode |
| `PORT` | `3000` | API server port |
| `DATABASE_URL` | `./data/webca.db` | SQLite database path |
| `SESSION_SECRET` | dev default | Session signing key (min 32 chars) |
| `CERT_ENCRYPTION_KEY` | dev default | AES-256-GCM key for private key encryption at rest (min 32 chars) |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |
| `TRUST_PROXY` | `false` | Set `true` when behind a reverse proxy |
| `SECURE_COOKIES` | `auto` | Cookie secure flag: `auto`, `true`, or `false` |

+### Deploying to a Remote Docker Server                                                                                                                                                                                                                                            
Build locally and push the image directly to a remote server over SSH:                                                                                                                                                                                                             
                                                                                                                                                                                                                                                                            
```bash                                                                                                                                                                                                                                                                     
# Build the image    
docker build --platform linux/amd64 -t web-ca:latest .                                                                                                                                                                                                                                             
                                                                                                                                                                                                                                                                            
# Transfer to remote server (no registry needed)                                                                                                                                                                                                                            
docker save web-ca:latest | ssh user@remote-server docker load                                                                                                                                                                                                              
```                                                                                                                                                                                                                                                                         
                                                                                                                                                                                                                                                                            
Then deploy via Portainer or docker compose on the remote server.                                                                                                                                                                                                           

## Security

- All private keys are encrypted at rest with AES-256-GCM
- Passwords hashed with argon2
- Session cookies: httpOnly, sameSite=strict, 8-hour expiry
- Rate limiting on login endpoint
- Zod validation on all API inputs
- RBAC: admin role required for user management

## License

Private
