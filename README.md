# Lost & Found Management System

A full-stack Lost & Found Management System with a **Spring Boot REST API** and a **React frontend**. Users can report lost or found items, browse reports, and submit claims. Administrative operations are protected by backend authorization.

## Technology Stack

| Layer | Technologies |
|---|---|
| Backend | Java 21, Spring Boot 4, Spring Security, Spring Data JPA, Maven |
| Frontend | React, JavaScript, Vite, Tailwind CSS, React Router, Axios |
| Database | MySQL 8 |
| Testing | JUnit, Spring Boot Test, Spring Security Test, H2, Vitest |

## Project Structure

```text
JAVA_PROJECT/
├── lostfound/                 # Spring Boot backend
│   ├── src/
│   ├── .mvn/
│   ├── mvnw
│   ├── mvnw.cmd
│   ├── .env.example
│   └── pom.xml
├── frontend/                  # React + Vite frontend
│   ├── src/
│   ├── public/
│   ├── .env.example
│   └── package.json
└── README.md
```

## Prerequisites

Install the following software:

- **JDK 21** (the version configured in `lostfound/pom.xml`).
- **Node.js 20.19+ or 22.12+** and npm. Node.js 24 is also suitable for the Vite 8 setup.
- **MySQL Server 8** running locally.
- IntelliJ IDEA or another Java IDE (optional).

Check your installations in PowerShell:

```powershell
java -version
node -v
npm -v
```

> The Maven Wrapper (`lostfound/mvnw.cmd`) is included, so a separate Maven installation is not required. Use JDK 21 to match the project's configured Java version. A newer JDK may work, but it is not the version this project is configured and documented for.

## 1. Clone the Repository

```powershell
git clone https://github.com/GOHILPRINCE2006/JAVA-SPRING-PROJECT.git
cd JAVA-SPRING-PROJECT
```

If you already downloaded the project as a ZIP, extract it and open the extracted project root folder.

## 2. Create the MySQL Database

Start your local MySQL Server. Connect using MySQL Workbench or another MySQL client, then execute:

```sql
CREATE DATABASE IF NOT EXISTS lostfound_db;
```

The application uses Spring Data JPA/Hibernate with:

```properties
spring.jpa.hibernate.ddl-auto=update
```

Hibernate creates or updates mapped tables when the backend starts. This setting does **not** automatically clear existing records.

## 3. Configure Backend Environment Variables

The backend reads its database settings from environment variables. Do not commit real passwords or secrets.

### Option A — Use a local `.env` file (recommended for local development)

In PowerShell, from the repository root:

```powershell
Copy-Item .\lostfound\.env.example .\lostfound\.env
notepad .\lostfound\.env
```

Edit the file with your actual local MySQL credentials:

```properties
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
```

Save the file. The backend's `application.properties` imports this `.env` file. The `.env` file is ignored by Git.

### Option B — Set variables in the current PowerShell window

```powershell
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = "your_mysql_password"
```

These variables apply only to that PowerShell session and its child processes.

### Optional backend settings

| Variable | Purpose | Default |
|---|---|---|
| `DB_URL` | JDBC connection URL | `jdbc:mysql://localhost:3306/lostfound_db` |
| `DB_USERNAME` | MySQL username | `root` |
| `DB_PASSWORD` | MySQL password | Required |
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowed frontend origins | `http://localhost:5173,http://localhost:4173` |
| `SESSION_COOKIE_SECURE` | Mark session cookie Secure (use HTTPS in production) | `false` |
| `SESSION_COOKIE_SAME_SITE` | SameSite cookie setting | `lax` |
| `SESSION_TIMEOUT` | Server session timeout | `8h` |

Never put database credentials, passwords, or private API keys in frontend `VITE_*` variables. Vite exposes those values to browser code.

## 4. Run the Backend

Open **Terminal 1** at the repository root:

```powershell
cd .\lostfound
.\mvnw.cmd spring-boot:run
```

The backend starts at:

- API base URL: <http://localhost:8080>

Keep this terminal open while using the application.

### Run the backend from IntelliJ IDEA

1. Open the repository root folder in IntelliJ IDEA.
2. Open `lostfound/pom.xml` as a Maven project if IntelliJ does not detect it automatically.
3. Set the Project SDK to JDK 21.
4. Ensure the `DB_USERNAME` and `DB_PASSWORD` environment variables are available to the run configuration, or use the `.env` file described above.
5. Open `lostfound/src/main/java/com/lostfound/lostfound/LostfoundApplication.java`.
6. Run `LostfoundApplication`.

If startup fails, inspect the Run console. Common causes include incorrect database credentials, MySQL not running, or the database not existing.

## 5. Run the Frontend

Open **Terminal 2** at the repository root (leave the backend running in Terminal 1):

```powershell
cd .\frontend
Copy-Item .env.example .env.local
npm install
npm run dev
```

Open the frontend:

- <http://localhost:5173>

Use `localhost` consistently for both frontend and backend. Do not mix `localhost` and `127.0.0.1` when testing session-cookie authentication.

### Frontend environment

The example frontend configuration uses:

```properties
VITE_API_BASE_URL=http://localhost:8080
```

Only public configuration belongs in `VITE_*` variables.

The Vite development server also has a proxy for `/api` requests. If you intentionally use same-origin proxy mode, set `VITE_API_BASE_URL=` (empty) in `.env.local`; optionally set `VITE_PROXY_TARGET` to the backend URL. Restart Vite after changing environment variables.

## 6. Create an Administrator Account

Public registration always creates a regular `USER` account. There is no public administrator registration.

1. Register a normal account through the application.
2. In MySQL Workbench, execute the following query, replacing the email with the account you registered:

```sql
USE lostfound_db;

UPDATE users
SET role = 'ADMIN'
WHERE email = 'your-email@example.com';
```

3. Sign out and sign in again so the new role is loaded into the session.

Only do this on a database you administer. Do not expose an administrator account or credentials publicly.

## 7. Tests and Production Build

### Backend tests

From the repository root:

```powershell
cd .\lostfound
.\mvnw.cmd test
```

The test configuration uses an in-memory H2 database, so the backend tests do not require your local MySQL database.

### Frontend checks

Open another terminal at the repository root:

```powershell
cd .\frontend
npm run lint
npm test
npm run build
```

The production frontend build is written to `frontend/dist/`.

## 8. Authentication and Security Overview

- **Authentication:** Spring Security uses a server-side HTTP session. The browser receives a `JSESSIONID` cookie configured as HttpOnly. The frontend does not store the user's password or a bearer token.
- **Current-user check:** On page load, the frontend requests `GET /api/users/profile/me`. A `401 Unauthorized` response is expected when no user is signed in; it should not be treated as a server-startup failure.
- **CSRF:** CSRF protection is enabled. The frontend obtains a token from `GET /api/auth/csrf` and sends the returned header name/token on state-changing requests.
- **CORS:** Credentialed requests are restricted to explicitly configured origins. Do not use `*` for allowed origins.
- **Authorization:** Backend security rules and service-level ownership checks enforce access. Frontend route guards are for navigation and are not a substitute for backend authorization.
- **Passwords:** Passwords are encoded with BCrypt. Public registration assigns the `USER` role; role changes are not exposed through the public API.
- **API responses:** User, item, and claim responses use DTOs rather than exposing JPA entities directly.

For production deployment, use HTTPS, set the session cookie's Secure option appropriately, configure exact production CORS origins, and store secrets in the hosting platform's secret/environment-variable manager.

## 9. API Overview

All API endpoints use the backend base URL `http://localhost:8080`.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/auth/csrf` | Public | Obtain CSRF token |
| `POST` | `/api/users/register` | Public | Register a regular user |
| `POST` | `/api/users/login` | Public | Sign in and create a session |
| `POST` | `/api/users/logout` | Authenticated session | Sign out and invalidate session |
| `GET` | `/api/users/profile/me` | Signed in | Get current user's profile |
| `GET` | `/api/users` | Admin | List users |
| `GET` | `/api/users/{id}` | Self or admin | Get user by ID |
| `PUT` | `/api/users/{id}` | Self | Update own profile |
| `DELETE` | `/api/users/{id}` | Admin | Delete a user (not the current admin) |
| `GET` | `/api/items` | Public | List items |
| `GET` | `/api/items/{id}` | Public | Get an item |
| `GET` | `/api/items/status?status=LOST` | Public | Filter items by status |
| `GET` | `/api/items/category/{categoryId}` | Public | Filter items by category |
| `GET` | `/api/items/user/me` | Signed in | List current user's reports |
| `GET` | `/api/items/user/{userId}` | Admin | List a user's reports |
| `POST` | `/api/items?categoryId={id}` | Signed in | Report an item |
| `DELETE` | `/api/items/{id}` | Reporter or admin | Delete an item |
| `GET` | `/api/categories` | Public | List categories |
| `GET` | `/api/categories/{id}` | Public | Get a category |
| `POST` | `/api/categories` | Admin | Create a category |
| `DELETE` | `/api/categories/{id}` | Admin | Delete an unused category |
| `POST` | `/api/claims?itemId={id}` | Signed in | Submit a claim |
| `GET` | `/api/claims/user/me` | Signed in | List current user's claims |
| `GET` | `/api/claims` | Admin | List all claims |
| `GET` | `/api/claims/item/{id}` | Admin | List claims for an item |
| `GET` | `/api/claims/user/{id}` | Admin | List claims for a user |
| `GET` | `/api/claims/{id}` | Claimant or admin | Get a claim |
| `PUT` | `/api/claims/{id}/status?status={status}` | Admin | Update claim status |
| `DELETE` | `/api/claims/{id}` | Claimant (pending only) or admin | Delete a claim |

### Request and response notes

- Registration request body: `{ "name": "...", "email": "...", "password": "..." }`.
- Login request body: `{ "email": "...", "password": "..." }`.
- Item creation request body: `{ "title": "...", "description": "...", "location": "...", "status": "LOST" }`, with `categoryId` as a query parameter.
- Claim creation request body: `{ "message": "..." }`, with `itemId` as a query parameter.
- Some endpoints return an `ApiResponse` wrapper; item and claim controller endpoints return their DTOs directly. Check the endpoint's response type rather than assuming every response has the same wrapper.
- Error responses handled by the common API exception/security handlers use a JSON shape similar to `{ "success": false, "message": "...", "data": null }`. Framework-generated errors may differ.

## 10. Important Credential Note

A previous version of this repository may have contained a database password in Git history. Removing a password from the latest file does not remove it from old commits.

If a real password was ever committed:
1. Change that password anywhere it is still in use.
2. Do not reuse it for other services.
3. Review repository history and access. If necessary, coordinate a history rewrite with collaborators.

Never commit `.env`, `.env.local`, or files containing real credentials.

---

## License

Add a license file if you intend to grant others permission to use, modify, or distribute this project. Until then, do not assume that the repository is open-source licensed.
