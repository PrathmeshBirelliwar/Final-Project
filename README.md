# 📚 Smart Library Management System

A full-stack **Library Management System** developed to digitize and simplify day-to-day library operations.

The project provides separate interfaces for **Admin, Librarian, and Member**, with all three roles connected to a shared **Node.js/Express + MySQL backend**.

---

## 🌟 Overview

The Smart Library Management System is designed to provide a centralized platform for managing:

- 📚 Books
- 👨‍🎓 Members
- 👨‍💼 Librarians
- 🔄 Book Issue & Return
- 🔁 Book Renewal
- 📌 Book Reservations
- 💰 Fine Management
- 🔔 Notifications
- 📊 Reports & Statistics
- 💾 Database Backups
- ⚙️ Library Settings

The system replaces separate manual processes with a connected web-based solution.

---

## 👥 User Roles

### 👨‍💼 Admin

The Admin has system-level access and can:

- Manage librarians
- Manage members
- Manage books
- View library statistics
- Generate reports
- View fine collection
- Create and manage database backups

### 📖 Librarian

The Librarian handles daily library operations such as:

- View dashboard statistics
- Manage books
- Issue books
- Return books
- Renew books
- Manage students/members
- Manage fines
- View reports
- Manage library settings

### 👨‍🎓 Member

Members can:

- Log in to their account
- Browse available books
- Search books
- View book details
- Borrow books
- Return books
- Renew books
- Reserve books
- View borrowed books
- View borrowing history
- View fines
- Receive notifications
- Manage their profile
- Change their password
- Access the digital library

---

## 🛠️ Tech Stack

### Frontend

- HTML5
- CSS3
- JavaScript
- Bootstrap
- Font Awesome
- Google Fonts

### Backend

- Node.js
- Express.js
- JWT
- bcrypt.js
- Express Validator
- CORS
- Morgan
- dotenv

### Database

- MySQL / MariaDB
- MySQL2

---

## 🏗️ Project Structure

```text
Library Hub/
│
├── frontend/
│   │
│   ├── Landing Page/
│   │
│   ├── Admin Dashboard/
│   │
│   ├── Librarian Dashboard/
│   │
│   └── Member Dashboard/
│
├── backend/
│   │
│   ├── config/
│   ├── middleware/
│   ├── routes/
│   ├── backups_files/
│   ├── schema.sql
│   ├── seed.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
└── README.md
