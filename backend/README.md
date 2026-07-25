# Library Hub — Backend API

A real Node.js/Express + MySQL backend for the Library Hub project, covering
Admin, Librarian, and Member dashboards with one shared database.

This has been built and **live-tested** end-to-end (login for all 3 roles,
book CRUD, borrow/return with fine calculation, fine payment, notifications,
member registration, admin stats) against a real MySQL/MariaDB instance.

---

## 1. Requirements

- Node.js 18+ (tested on Node 22)
- MySQL 8+ or MariaDB 10.6+

---

## 2. Set up the database

Log in to MySQL as root (or any admin user) and create the database + user.
The app is pre-configured to use the password `Krish@2007` as requested —
change it below if you'd rather use something else.

```sql
CREATE USER IF NOT EXISTS 'library_admin'@'localhost' IDENTIFIED BY 'Krish@2007';
CREATE USER IF NOT EXISTS 'library_admin'@'127.0.0.1' IDENTIFIED BY 'Krish@2007';
GRANT ALL PRIVILEGES ON library_hub.* TO 'library_admin'@'localhost';
GRANT ALL PRIVILEGES ON library_hub.* TO 'library_admin'@'127.0.0.1';
FLUSH PRIVILEGES;
```

Then load the schema (this also creates the `library_hub` database and seeds
some starter data — books, one demo admin, one demo librarian, two demo
members):

```bash
mysql -u root -p < schema.sql
```

---

## 3. Configure and install

The `.env` file is already set up to match the SQL steps above:

```
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=library_admin
DB_PASSWORD=Krish@2007
DB_NAME=library_hub
JWT_SECRET=change_this_to_a_long_random_secret_in_production
JWT_EXPIRES_IN=7d
```

Change `JWT_SECRET` to a real random string before deploying anywhere public.

Install dependencies:

```bash
npm install
```

---

## 4. Set real demo passwords

`schema.sql` inserts demo accounts with placeholder password hashes. Run this
once to set them to real, working bcrypt hashes:

```bash
node seed.js
```

This gives you:

| Role      | Login                     | Password       |
|-----------|----------------------------|----------------|
| Admin     | `admin`                    | `admin123`     |
| Librarian | `soham@library.com`        | `librarian123` |
| Member    | `rahul@gmail.com`          | `member123`    |

**Change these before putting the app in front of real users.**

---

## 5. Run the server

```bash
npm start
```

or, for auto-restart during development:

```bash
npm run dev
```

The API listens on `http://localhost:5000` by default. Health check:

```bash
curl http://localhost:5000/api/health
```

---

## 6. API overview

All routes are under `/api`. Protected routes require
`Authorization: Bearer <token>` (token comes back from `/api/auth/login`).

| Area | Routes |
|---|---|
| Auth | `POST /auth/login`, `POST /auth/register`, `GET /auth/me`, `POST /auth/change-password` |
| Books | `GET /books`, `GET /books/:id`, `POST /books` (Admin/Librarian), `PUT /books/:id`, `DELETE /books/:id` |
| Members | `GET /members` (Admin/Librarian), `POST /members`, `PUT /members/:id`, `DELETE /members/:id`, `GET/PUT /members/:id/profile` |
| Librarians | `GET/POST/PUT/DELETE /librarians` (Admin only) |
| Issues (loans) | `GET /issues`, `GET /issues/mine`, `GET /issues/history/mine`, `POST /issues`, `POST /issues/:id/return`, `POST /issues/:id/renew` |
| Fines | `GET /fines`, `GET /fines/mine`, `POST /fines/:issueId/pay` |
| Reservations | `GET /reservations`, `GET /reservations/mine`, `POST /reservations`, `PUT /reservations/:id/cancel`, `PUT /reservations/:id/ready` |
| Notifications | `GET /notifications/mine`, `PUT /notifications/mark-all-read`, `POST /notifications/broadcast` |
| Backups | `GET /backups`, `POST /backups` (runs real `mysqldump` if available), `GET /backups/:id/download` |
| Stats | `GET /stats/admin`, `GET /stats/librarian`, `GET /stats/member` |

Business rules already enforced server-side:
- A member can hold at most 3 active loans at once
- Can't double-borrow the same book
- Fine = ₹5/day overdue, calculated automatically on return
- Max 2 renewals per loan
- Book deletion blocked while it has active loans
- All password storage uses bcrypt; all sessions use signed JWTs

---

## 7. What's next

This backend is ready to be wired up to the three existing frontends
(Admin/Librarian/Member dashboards), which currently store everything in
`localStorage` and don't share data with each other or check real
credentials. That integration (replacing each dashboard's local mock
"database" with calls to this API) is the next step.
