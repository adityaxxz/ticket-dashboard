### Auth 
- Request OTP: `POST /auth/request-otp` { email }
- Verify OTP: `POST /auth/verify-otp` { email, code } → returns Bearer token

### Endpoints
- `GET /api/projects`
- `POST /api/projects` { name }
- `GET /api/projects/{id}` → project + tickets
- `POST /api/tickets` { project_id, description }
- `PATCH /api/tickets/{id}` { description?, status? }
- `GET /api/super-toggle` → { enabled }
- `POST /api/super-toggle` { enable, password } (default pwd : `admin123` or set env `SUPER_TOGGLE_PWD`)