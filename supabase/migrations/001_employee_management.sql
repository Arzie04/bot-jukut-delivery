-- Employee Management System Tables

-- Employees
CREATE TABLE IF NOT EXISTS employees (
  id BIGSERIAL PRIMARY KEY,
  telegram_id TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  no_wa TEXT NOT NULL,
  rekening_info TEXT NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employees_telegram_id ON employees(telegram_id);
CREATE INDEX IF NOT EXISTS idx_employees_is_verified ON employees(is_verified);

-- Unified verification codes (driver | employee)
CREATE TABLE IF NOT EXISTS verification_codes (
  code TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('driver', 'employee')),
  is_used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_codes_type_used ON verification_codes(type, is_used);

-- Weekly schedules (2 rows per shift slot)
CREATE TABLE IF NOT EXISTS schedules (
  id BIGSERIAL PRIMARY KEY,
  tanggal DATE NOT NULL,
  shift TEXT NOT NULL CHECK (shift IN ('pagi', 'siang')),
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedules_tanggal_shift ON schedules(tanggal, shift);
CREATE INDEX IF NOT EXISTS idx_schedules_employee_id ON schedules(employee_id);

-- General cleaning participation logs
CREATE TABLE IF NOT EXISTS general_cleaning_logs (
  id BIGSERIAL PRIMARY KEY,
  tanggal DATE NOT NULL,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gc_logs_tanggal ON general_cleaning_logs(tanggal);
CREATE INDEX IF NOT EXISTS idx_gc_logs_employee_id ON general_cleaning_logs(employee_id);

-- Shift swap requests
CREATE TABLE IF NOT EXISTS swap_requests (
  id BIGSERIAL PRIMARY KEY,
  schedule_id BIGINT NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  requester_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_swap_requests_schedule_id ON swap_requests(schedule_id);
CREATE INDEX IF NOT EXISTS idx_swap_requests_status ON swap_requests(status);
