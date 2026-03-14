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
    designation TEXT,
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
    phone_number TEXT,
    phone_is_primary BOOLEAN DEFAULT FALSE,
    email TEXT,
    email_is_primary BOOLEAN DEFAULT FALSE,
    media_consent BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,

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
    is_profile_picture BOOLEAN DEFAULT FALSE,
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

-- ==========================================
-- 19) NOTIFICATIONS TABLE
-- ==========================================
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries since we will often filter by employee_id and sort by date
CREATE INDEX idx_notifications_employee_id ON notifications(employee_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ========================================
-- 20) Default Data, Admin User & Permissions
-- ========================================

-- Insert Base Role and Type (Forcing IDs to 1 to ensure safe foreign keys)
INSERT INTO roles (id, name, description) VALUES (1, 'admin', 'System Administrator') ON CONFLICT DO NOTHING;
INSERT INTO employee_types (id, name) VALUES (1, 'permanent') ON CONFLICT DO NOTHING;

-- Insert ALL System Permissions
INSERT INTO permissions (code, description) VALUES 
    ('view_customers', 'View Customers'),
    ('add_customers', 'Add Customers'),
    ('edit_customers', 'Edit Customers'),
    ('delete_customers', 'Delete Customers'),
    ('view_appointments', 'View Appointments'),
    ('add_appointments', 'Add Appointments'),
    ('edit_appointments', 'Edit Appointments'),
    ('cancel_appointments', 'Cancel Appointments'),
    ('view_services', 'View Services'),
    ('add_services', 'Add Services'),
    ('edit_services', 'Edit Services'),
    ('delete_services', 'Delete Services'),
    ('view_invoices', 'View Invoices'),
    ('create_invoices', 'Create Invoices'),
    ('view_ledger', 'View Ledger'),
    ('view_payslips', 'View & Manage Payslips'),
    ('view_employees', 'View Employees'),
    ('add_employees', 'Add Employees'),
    ('edit_employees', 'Edit Employees'),
    ('manage_roles', 'Manage Roles & Permissions'),
    ('view_dashboard', 'View Dashboard Stats'),
    ('view_reports', 'View Analytics & Reports'),
    ('manage_gallery', 'Manage Gallery')
ON CONFLICT (code) DO NOTHING;

-- Map ALL Permissions to the Admin Role (role_id = 1)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions
ON CONFLICT DO NOTHING;

-- Create the Default Admin User
-- Password is 'admin123'
INSERT INTO employees (
    id, full_name, designation, username, password, role_id, type_id, specialties, 
    id_card_number, email, mobile_number, telephone_number, 
    address_line, city, province, postal_code, country, salary, is_active
) VALUES (
    1, 'Sanaa Ali Awan', 'CEO / Founder', 'Sanaa', '$2b$12$1ZtAH3EH8qQYLYFuN4KNgOtWOOAbdC06AMvk4dF.L9zUJKDjh/qe2', 
    1, 1, 'Curly Hair', '42201-3513619-2', 'sanaa@kimkhwab.net', '03212201251', 
    NULL, 'House 196-A, Street 22, F-11/2', 'Islamabad', 'Capital', '44000', 'Pakistan', NULL, TRUE
) ON CONFLICT DO NOTHING;

-- Adjust the sequences so new records don't conflict with these hardcoded IDs
SELECT setval('roles_id_seq', (SELECT MAX(id) FROM roles));
SELECT setval('employee_types_id_seq', (SELECT MAX(id) FROM employee_types));
SELECT setval('employees_id_seq', (SELECT MAX(id) FROM employees));
SELECT setval('permissions_id_seq', (SELECT MAX(id) FROM permissions));

-- ========================================
-- 21) System Settings (Key-Value Store)
-- ========================================
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) NOT NULL UNIQUE,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert some default blank keys so the frontend has them ready
INSERT INTO system_settings (key, value, description) VALUES 
    ('smtp_host', '', 'Email SMTP Host'),
    ('smtp_port', '587', 'Email SMTP Port'),
    ('smtp_user', '', 'Email SMTP Username'),
    ('smtp_pass', '', 'Email SMTP Password'),
    ('smtp_from_email', '', 'System From Email Address'),
    ('whatsapp_api_token', '', 'Meta WhatsApp Cloud API Token'),
    ('whatsapp_phone_number_id', '', 'Meta WhatsApp Phone Number ID')
ON CONFLICT (key) DO NOTHING;