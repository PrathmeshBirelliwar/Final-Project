# Library Hub — Setup Guide

This project now has a **real backend** (Node.js/Express + MySQL) shared by
all three frontends: the Admin dashboard, the Librarian dashboard, and the
Member dashboard. Previously each dashboard stored its data separately in
the browser's `localStorage` and didn't check real passwords — that's been
replaced with one MySQL database and real authentication.

Everything below has been built **and live-tested** in a sandboxed
environment against a real MariaDB instance (login for all 3 roles, book
CRUD, borrow/return with automatic fines, fine payment, reservations,
notifications, member registration/profile/password-change, admin & librarian
stats) — not just written and assumed to work.

---

## 1. Requirements

- Node.js 18+ 
- MySQL 8+ or MariaDB 10.6+
- Any static file server (or just open the HTML files directly — see step 4)

---

## 2. Set up the database

```bash
cd backend
mysql -u root -p
```

```sql
CREATE USER IF NOT EXISTS 'library_admin'@'localhost' IDENTIFIED BY 'Krish@2007';
CREATE USER IF NOT EXISTS 'library_admin'@'127.0.0.1' IDENTIFIED BY 'Krish@2007';
GRANT ALL PRIVILEGES ON library_hub.* TO 'library_admin'@'localhost';
GRANT ALL PRIVILEGES ON library_hub.* TO 'library_admin'@'127.0.0.1';
FLUSH PRIVILEGES;
EXIT;
```

```bash
mysql -u root -p < schema.sql
```

This creates the `library_hub` database, all tables, and seeds 14 starter
books plus one demo account per role.

---

## 3. Start the backend

```bash
cd backend
npm install
node seed.js      # sets real bcrypt password hashes for the demo accounts
npm start
```

The API runs on **http://localhost:5000**. Check it's alive:

```bash
curl http://localhost:5000/api/health
```

The `.env` file is already configured with `DB_PASSWORD=Krish@2007` as
requested. Change `JWT_SECRET` in `.env` before deploying anywhere public.

### Demo logins

| Role      | Login                 | Password       |
|-----------|------------------------|----------------|
| Admin     | `admin`                | `admin123`     |
| Librarian | `soham@library.com`    | `librarian123` |
| Member    | `rahul@gmail.com`      | `member123`    |

---

## 4. Open the frontends

The backend has CORS enabled, so you can open the HTML files straight from
disk, or serve them with any static server. From the `frontend/` folder:

```bash
cd frontend
python3 -m http.server 8000
```

Then visit:
- Admin: `http://localhost:8000/Admin Dashboard(Siddhesh,Soham)/Final Project (Siddhesh & Soham)/login.html`
- Librarian: `http://localhost:8000/librarian Dashboard(Sid)/librarian/login.html`
- Member: `http://localhost:8000/Member Dashboard(Abhishek)/login.html`
- Landing page: `http://localhost:8000/Landing Page(PB)/index.html`

All three dashboards call `http://localhost:5000/api` by default. If you
serve the API from a different host/port, set `window.LIBRARY_API_BASE`
in a small `<script>` tag before each dashboard's first JS file loads, e.g.:

```html
<script>window.LIBRARY_API_BASE = "https://your-api-host/api";</script>
```

---

## 5. What changed from the original project

The original project was three separate student sub-projects glued
together — none of them shared data, and none of them checked real
credentials:

- **Admin dashboard** stored everything in `localStorage` (its own fake
  "database").
- **Librarian dashboard** had a **hardcoded login** (`admin` / `admin123`)
  completely disconnected from any real librarian account, and its own
  separate `localStorage` data.
- **Member dashboard** had a **fake login that accepted any non-empty
  email/password**, a hardcoded book catalog, and pointed at a Spring Boot
  API (`localhost:8080`) that didn't exist and was never actually called.

All three now authenticate against, and read/write, the same real MySQL
database through the backend in `backend/`.

### Other bugs fixed along the way
- Librarian `return-book.js` referenced `totalPendingCount` while the HTML
  element was `totalpendingCount` — the casing mismatch silently broke the
  rest of that page's script.
- Librarian `issue-book.html` loaded its script as `js\issue-book.js`
  (backslash) instead of `js/issue-book.js`.
- Librarian `students.html` had an email field that was never read or saved.
- Librarian book form's ISBN field was collected but never saved.
- Member `books.js` category filter buttons never matched the book data's
  category field.
- Backend `librarians.js`: an added `/me` route was declared after
  `/:id`, which would have made Express treat `"me"` as an `:id` — moved it
  before.

### Known limitations (by design, given scope)
- **Password reset by email** isn't available (no email service is
  configured) — the UI says so honestly instead of pretending it works.
  Admins/librarians can reset a user's password by re-adding them or through
  a direct database update; members can use "Change Password" if logged in.
- **Restoring a database backup** is logged for audit purposes but doesn't
  automatically re-import data (deliberately — letting an admin-panel file
  upload run arbitrary SQL against the live database is a real risk). A real
  restore should be a manual `mysql < backup.sql` by an administrator.
- **Book IDs can't be renamed** after creation through the UI (title,
  author, etc. can still be edited freely).
- The **Digital Library** page (e-books/journals) in the Member dashboard is
  still static sample content — it was never tied to real book records in
  the original design.
- Librarian **Settings** (loan period / fine rate fields) are a local
  display preference; the live system enforces a 15-day loan period and
  ₹5/day fine for everyone, set in `backend/utils/helpers.js`.

---

## 6. Project structure

```
backend/          Real Node/Express + MySQL API (see backend/README.md)
frontend/
  Admin Dashboard(Siddhesh,Soham)/
  librarian Dashboard(Sid)/
  Member Dashboard(Abhishek)/
  Landing Page(PB)/
```
