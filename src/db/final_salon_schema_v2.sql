BEGIN;

-- ========================================
-- 1) Service Categories (with styling for FullCalendar)
-- ========================================
CREATE TABLE service_categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    background_color TEXT DEFAULT '#3788d8', -- Default FullCalendar blue
    text_color TEXT DEFAULT '#ffffff',
    calendar_class TEXT                     -- Optional class like 'fc-event-haircut'
);

-- ========================================
-- 2) Services (fixed price, active flag)
-- ========================================
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,             -- fixed price owned by the service
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES service_categories(id)
);

-- ========================================
-- 3) Appointment Sources (e.g., walk-in, online, phone, whatsapp)
-- ========================================
CREATE TABLE appointment_sources (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- ========================================
-- 4) Employee Types (e.g., permanent, freelancer, part-time)
-- ========================================
CREATE TABLE employee_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- ========================================
-- 5) Roles (RBAC)  <-- moved up to satisfy FK in employees
-- ========================================
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,           -- e.g. admin, stylist, cashier
    description TEXT
);

-- ========================================
-- 6) Employees (type via FK to employee_types; role_id FK to roles)
-- ========================================
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    full_name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,            -- login username
    password TEXT NOT NULL,                   -- store hashed in backend
    role_id INTEGER REFERENCES roles(id),
    type_id INTEGER NOT NULL REFERENCES employee_types(id),
    specialties TEXT,
    profile_image_path TEXT,
    id_card_number TEXT UNIQUE,               -- e.g. 12345-1234567-1
    email TEXT,
    mobile_number TEXT,
    telephone_number TEXT,
    address_line TEXT,
    city TEXT,
    province TEXT,
    postal_code TEXT,
    country TEXT,
    salary INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 7) Referral Sources (e.g., Instagram, Walk-in, Friend)
-- ========================================
CREATE TABLE referral_sources (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- ========================================
-- 8) Customers (fixed WhatsApp/Mobile/Email + primary flags)
-- ========================================
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    full_name TEXT NOT NULL,
    instagram_handle TEXT,
    preferred_employee_id INTEGER,          -- optional link to favorite stylist
    date_of_birth DATE,
    referral_source_id INTEGER,
    profile_image_url TEXT,                 -- customer profile picture path/URL

    -- Fixed primary contact fields
    whatsapp_number TEXT,
    whatsapp_is_primary BOOLEAN DEFAULT FALSE,
    mobile_number TEXT,
    mobile_is_primary BOOLEAN DEFAULT FALSE,
    email TEXT,
    email_is_primary BOOLEAN DEFAULT FALSE,
    media_permission BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (preferred_employee_id) REFERENCES employees(id),
    FOREIGN KEY (referral_source_id) REFERENCES referral_sources(id)
);

-- ========================================
-- 9) Customer Profiles (Bio / Preferences)
-- ========================================
CREATE TABLE customer_profiles (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    preferences TEXT,                          -- e.g., color ratios/notes
    notes TEXT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- ========================================
-- 10) Appointments (category-only; styling via service_categories; source via appointment_sources)
-- ========================================
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER,                        -- NULL if walk-in
    employee_id INTEGER NOT NULL,
    service_category_id INTEGER NOT NULL,       -- category only
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status TEXT DEFAULT 'booked' CHECK (status IN ('booked', 'completed', 'cancelled', 'no_show')),
    source_id INTEGER,                          -- FK to appointment_sources
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (service_category_id) REFERENCES service_categories(id),
    FOREIGN KEY (source_id) REFERENCES appointment_sources(id)
);

-- ========================================
-- 11) Invoices (optional link back to appointment)
-- ========================================
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    employee_id INTEGER,
    appointment_id INTEGER,                 -- nullable: walk-in invoices won’t have this
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    paid BOOLEAN DEFAULT FALSE,
    snapshot JSONB,                         -- JSON snapshot of the final invoice
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);

-- ========================================
-- 12) Invoice Items (require service_id; store price snapshot)
-- ========================================
CREATE TABLE invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,              -- required (no ad-hoc lines)
    unit_price DECIMAL(10,2) NOT NULL,        -- snapshot of services.price at sale time
    quantity INTEGER NOT NULL DEFAULT 1,      -- handy for bundles
    employee_id INTEGER,                      -- stylist who performed this line
    FOREIGN KEY (invoice_id) REFERENCES invoices(id),
    FOREIGN KEY (service_id) REFERENCES services(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- ========================================
-- 13) Service History (link to service; snapshot name + price)
-- ========================================
CREATE TABLE service_history (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,              -- required
    service_name TEXT NOT NULL,               -- snapshot of name (in case renamed later)
    price DECIMAL(10, 2) NOT NULL,            -- snapshot of price charged
    performed_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    employee_id INTEGER,
    notes TEXT,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (service_id) REFERENCES services(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- ========================================
-- 14) Permissions (RBAC)  <-- before role_permissions
-- ========================================
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,           -- e.g. can_create_invoice, can_view_ledger
    description TEXT
);

-- ========================================
-- 15) Role-Permissions Mapping (Many-to-Many)
-- ========================================
CREATE TABLE role_permissions (
    role_id INTEGER NOT NULL,
    permission_id INTEGER NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (permission_id) REFERENCES permissions(id)
);

-- (Optional) If/when you add a users table, link it to roles like so:
-- ALTER TABLE users ADD COLUMN role_id INTEGER REFERENCES roles(id);

-- ========================================
-- 16) Gallery Images (customer-tagged photos)
-- ========================================
CREATE TABLE gallery_images (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER,                    -- optional tag to customer
    employee_id INTEGER,                    -- optional: who performed/uploaded
    file_path TEXT,                         -- path or URL to storage
    taken_at TIMESTAMP,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

COMMIT;

-- ========================================
-- 17) Ledger Entries (income & expenses)
--    - Links to invoices (income) when applicable
--    - Can also record manual income/expense entries
--    - Can tie an expense to an employee (e.g., salary)
-- ========================================
CREATE TABLE ledger_entries (
    id SERIAL PRIMARY KEY,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    type TEXT NOT NULL CHECK (type IN ('income','expense')), -- simple two-type ledger
    amount NUMERIC(12,2) NOT NULL,                           -- positive value; type decides sign
    currency TEXT DEFAULT 'PKR',                              -- adjust if needed
    description TEXT,                                         -- free text memo
    category TEXT,                                            -- e.g., 'service_sale','salary','rent','supplies'
    invoice_id INTEGER,                                       -- income from invoice (optional)
    customer_id INTEGER,                                      -- income/customer context (optional)
    employee_id INTEGER,                                      -- expense/income related to employee (e.g., salary, bonus)
	is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (invoice_id) REFERENCES invoices(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- ========================================
-- 18) Employee Payslips (stored snapshot)
--    - JSONB snapshot of computed payslip/statement
--    - Optionally link back to a ledger entry that recorded the salary expense
-- ========================================
CREATE TABLE employee_payslips (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    snapshot JSONB NOT NULL,                       -- full computed payslip (gross, deductions, net, notes)
    ledger_entry_id INTEGER,                       -- optional link to the expense in ledger_entries
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (ledger_entry_id) REFERENCES ledger_entries(id)
);
