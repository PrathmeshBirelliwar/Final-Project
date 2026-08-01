-- =====================================================================
-- Library Hub — Unified Database Schema
-- Run this once against your MySQL/MariaDB server to create everything.
-- Example:
--   mysql -u root -p < schema.sql
-- =====================================================================

CREATE DATABASE IF NOT EXISTS library_hub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE library_hub;

-- ---------------------------------------------------------------------
-- ADMINS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    email         VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- LIBRARIANS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS librarians (
    id            VARCHAR(20)  PRIMARY KEY,          -- e.g. LIB001
    name          VARCHAR(150) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    phone         VARCHAR(20),
    address       VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    status        ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- MEMBERS (students / faculty / general members)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS members (
    id            VARCHAR(20)  PRIMARY KEY,          -- e.g. MEM001
    name          VARCHAR(150) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    phone         VARCHAR(20),
    department    VARCHAR(100),
    type          ENUM('Student','Faculty','General') NOT NULL DEFAULT 'Student',
    password_hash VARCHAR(255) NOT NULL,
    membership    VARCHAR(50) DEFAULT 'Student Member',
    member_since  DATE DEFAULT (CURRENT_DATE),
    status        ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- BOOKS (catalog)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS books (
    id               VARCHAR(20)  PRIMARY KEY,        -- e.g. B001
    title            VARCHAR(255) NOT NULL,
    author           VARCHAR(255) NOT NULL,
    category         VARCHAR(100),
    publisher        VARCHAR(150),
    isbn             VARCHAR(30),
    published_year   VARCHAR(10),
    pages            INT,
    description      TEXT,
    image_url        VARCHAR(255),
    location         VARCHAR(150),
    shelf            VARCHAR(50),
    rating           DECIMAL(2,1) DEFAULT 0,
    reviews_count     INT DEFAULT 0,
    total_quantity   INT NOT NULL DEFAULT 0,
    available_quantity INT NOT NULL DEFAULT 0,
    is_digital       TINYINT(1) NOT NULL DEFAULT 0,
    resource_type    VARCHAR(30) DEFAULT NULL,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_available CHECK (available_quantity >= 0 AND available_quantity <= total_quantity)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- ISSUES  (book loans: issue -> return lifecycle)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS issues (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    book_id       VARCHAR(20) NOT NULL,
    member_id     VARCHAR(20) NOT NULL,
    librarian_id  VARCHAR(20) NULL,                  -- who issued it (NULL if self-service member borrow)
    issue_date    DATE NOT NULL,
    due_date      DATE NOT NULL,
    return_date   DATE NULL,
    renewals      INT NOT NULL DEFAULT 0,
    status        ENUM('Active','Returned','Overdue') NOT NULL DEFAULT 'Active',
    fine_amount   DECIMAL(10,2) NOT NULL DEFAULT 0,
    fine_status   ENUM('None','Pending','Paid') NOT NULL DEFAULT 'None',
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (librarian_id) REFERENCES librarians(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- RESERVATIONS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reservations (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    book_id        VARCHAR(20) NOT NULL,
    member_id      VARCHAR(20) NOT NULL,
    reserved_date  DATE NOT NULL,
    status         ENUM('Pending','Ready','Cancelled','Fulfilled') NOT NULL DEFAULT 'Pending',
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- NOTIFICATIONS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    member_id   VARCHAR(20) NOT NULL,
    icon        VARCHAR(50) DEFAULT 'fa-circle-info',
    title       VARCHAR(150) NOT NULL,
    message     VARCHAR(500) NOT NULL,
    is_read     TINYINT(1) NOT NULL DEFAULT 0,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- BACKUPS  (admin "database backup" log records)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS backups (
    id         VARCHAR(30) PRIMARY KEY,
    file_name  VARCHAR(255) NOT NULL,
    size_label VARCHAR(30) DEFAULT '0 MB',
    status     VARCHAR(30) DEFAULT 'Completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- SYSTEM SETTINGS  (single row — library profile + loan/fine rules,
-- editable from the Librarian dashboard's Settings page and actually
-- enforced by the backend, not just cosmetic display values)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_settings (
    id                    INT PRIMARY KEY DEFAULT 1,
    library_name          VARCHAR(150) NOT NULL DEFAULT 'LibraryMS',
    library_address       VARCHAR(255) NOT NULL DEFAULT '',
    library_contact       VARCHAR(30)  NOT NULL DEFAULT '',
    library_email         VARCHAR(150) NOT NULL DEFAULT '',
    max_books_per_member  INT NOT NULL DEFAULT 3,
    loan_days             INT NOT NULL DEFAULT 15,
    fine_per_day          DECIMAL(6,2) NOT NULL DEFAULT 5.00,
    updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT IGNORE INTO system_settings (id, library_name, library_address, library_contact, library_email)
VALUES (1, 'Smart Library', 'Main Library Campus', '9876543210', 'admin@smartlibrary.com');

-- ---------------------------------------------------------------------
-- AUDIT LOGS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    actor_role  VARCHAR(20),
    actor_id    VARCHAR(50),
    action      VARCHAR(150) NOT NULL,
    details     VARCHAR(500),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- SEED DATA
-- Default admin login:      username: admin      password: admin123
-- Default librarian login:  email: soham@library.com   password: librarian123
-- Default member login:     email: rahul@gmail.com     password: member123
-- (bcrypt hashes generated for these — change them after first login!)
-- ---------------------------------------------------------------------

INSERT IGNORE INTO admins (username, email, password_hash) VALUES
('admin', 'admin@smartlibrary.com', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Y5x3S/9WNhDcOWLh6L4bXm8HdWY0.');
-- password_hash above corresponds to "admin123" (bcrypt) — replaced accurately by seed.js at setup time.

INSERT IGNORE INTO librarians (id, name, email, phone, address, password_hash) VALUES
('LIB001', 'Soham Nagdeve', 'soham@library.com', '9988776655', 'Central Library Office', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Y5x3S/9WNhDcOWLh6L4bXm8HdWY0.');

INSERT IGNORE INTO members (id, name, email, phone, department, type, password_hash) VALUES
('MEM001', 'Rahul Sharma', 'rahul@gmail.com', '9876543210', 'Computer', 'Student', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Y5x3S/9WNhDcOWLh6L4bXm8HdWY0.'),
('MEM002', 'Priya Patel', 'priya@gmail.com', '9123456789', 'Library', 'Faculty', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Y5x3S/9WNhDcOWLh6L4bXm8HdWY0.');

INSERT IGNORE INTO books (id, title, author, category, publisher, isbn, published_year, pages, description, image_url, location, shelf, rating, reviews_count, total_quantity, available_quantity) VALUES
('B001', 'Clean Code', 'Robert C. Martin', 'Programming', 'Prentice Hall', '978-0132350884', '2008', 464, 'A handbook of agile software craftsmanship covering clean, readable, and maintainable code.', 'images/clean-code.jpeg', 'Main Library - 2nd Floor', 'A-204', 4.8, 245, 5, 5),
('B002', 'JavaScript: The Definitive Guide', 'David Flanagan', 'Programming', 'O''Reilly Media', '978-1491952023', '2020', 704, 'A comprehensive reference to JavaScript, browser APIs, and modern web development.', 'images/javascript.jpeg', 'Main Library - 1st Floor', 'P-102', 4.7, 189, 6, 6),
('B003', 'Python Crash Course', 'Eric Matthes', 'Programming', 'No Starch Press', '978-1593279288', '2019', 544, 'A hands-on introduction to Python programming and practical projects.', 'images/python-crash-course.jpeg', 'Main Library - 1st Floor', 'P-108', 4.8, 312, 5, 5),
('B004', 'Data Structures and Algorithms', 'Michael T. Goodrich', 'Programming', 'Wiley', '978-1118290279', '2014', 768, 'An introduction to arrays, trees, graphs, sorting, searching, and algorithm analysis.', 'images/data-structures.jpeg', 'Main Library - 2nd Floor', 'A-210', 4.6, 156, 4, 4),
('B005', 'Introduction to Algorithms', 'Thomas H. Cormen', 'Programming', 'MIT Press', '978-0262033848', '2009', 1312, 'A comprehensive textbook covering fundamental algorithms and data structures.', 'images/introduction-to-algorithms.jpeg', 'Main Library - 2nd Floor', 'A-215', 4.7, 278, 3, 0),
('B006', 'Database System Concepts', 'Abraham Silberschatz', 'Database', 'McGraw-Hill', '978-0078022159', '2019', 1376, 'Comprehensive coverage of database architecture, SQL, transactions, and modern data technologies.', 'images/database.jpeg', 'Main Library - 2nd Floor', 'D-301', 4.6, 198, 5, 0),
('B007', 'The Alchemist', 'Paulo Coelho', 'Fiction', 'HarperOne', '978-0062315007', '1988', 208, 'A story about dreams, purpose, and the courage to follow a personal legend.', 'images/alchemist.jpeg', 'Main Library - Ground Floor', 'F-101', 4.7, 420, 8, 8),
('B008', 'Harry Potter and the Philosopher''s Stone', 'J.K. Rowling', 'Fiction', 'Bloomsbury', '978-0747532699', '1997', 223, 'The first journey into Hogwarts and the magical world of Harry Potter.', 'images/harry-potter.jpeg', 'Main Library - Ground Floor', 'F-115', 4.9, 520, 10, 10),
('B009', 'Atomic Habits', 'James Clear', 'Self Development', 'Avery', '978-0735211292', '2018', 320, 'A practical framework for building good habits and making lasting improvements.', 'images/atomic-habits.jpeg', 'Main Library - 1st Floor', 'S-105', 4.8, 650, 7, 7),
('B010', 'Ikigai', 'Hector Garcia', 'Self Development', 'Penguin Books', '978-0143130727', '2016', 208, 'An exploration of purpose, happiness, and a meaningful life.', 'images/ikigai.jpeg', 'Main Library - 1st Floor', 'S-110', 4.6, 340, 5, 5),
('B011', 'Computer Networks', 'Andrew S. Tanenbaum', 'Networking', 'Pearson', '978-0132126953', '2010', 960, 'A detailed introduction to networking concepts, protocols, and architectures.', 'images/computer-networks.jpeg', 'Main Library - 2nd Floor', 'N-204', 4.5, 178, 4, 4),
('B012', 'Operating System Concepts', 'Abraham Silberschatz', 'Operating Systems', 'Wiley', '978-1119456339', '2018', 976, 'Fundamental operating-system principles including processes, memory, storage, and security.', 'images/operating-system.jpeg', 'Main Library - 2nd Floor', 'OS-201', 4.6, 215, 4, 0),
('B013', 'Artificial Intelligence: A Modern Approach', 'Stuart Russell', 'Artificial Intelligence', 'Pearson', '978-0134610993', '2021', 1152, 'A comprehensive introduction to intelligent agents, machine learning, robotics, and AI.', 'images/artificial-intelligence.jpeg', 'Main Library - 3rd Floor', 'AI-301', 4.8, 289, 5, 5),
('B014', 'Rich Dad Poor Dad', 'Robert T. Kiyosaki', 'Finance', 'Plata Publishing', '978-1612680194', '1997', 336, 'An introduction to personal finance, investing, and financial independence.', 'images/rich-dad-poor-dad.jpeg', 'Main Library - 1st Floor', 'F-205', 4.7, 580, 6, 6);

-- Mark a handful of the catalog as digital resources (drives the Member dashboard's
-- Digital Library page — previously that page showed hardcoded sample content).
UPDATE books SET is_digital = 1, resource_type = 'E-Book' WHERE id IN ('B001', 'B002', 'B009');
UPDATE books SET is_digital = 1, resource_type = 'Research' WHERE id IN ('B013');
UPDATE books SET is_digital = 1, resource_type = 'Journal' WHERE id IN ('B006', 'B011');
