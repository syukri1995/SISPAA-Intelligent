-- TiDB (MySQL-compatible) schema (prototype)

CREATE TABLE IF NOT EXISTS complaints (
  id CHAR(36) PRIMARY KEY,
  complaint_text TEXT NOT NULL,
  location_text TEXT NULL,
  image_url TEXT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'RECEIVED',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS classifications (
  id CHAR(36) PRIMARY KEY,
  complaint_id CHAR(36) NOT NULL,
  category VARCHAR(64) NOT NULL,
  agency VARCHAR(64) NOT NULL,
  confidence DOUBLE NOT NULL,
  raw_json JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_classifications_complaint FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS work_orders (
  id CHAR(36) PRIMARY KEY,
  complaint_id CHAR(36) NOT NULL,
  agency VARCHAR(64) NOT NULL,
  priority VARCHAR(16) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'CREATED',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_work_orders_complaint FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id CHAR(36) PRIMARY KEY,
  complaint_id CHAR(36) NULL,
  event_type VARCHAR(64) NOT NULL,
  message TEXT NOT NULL,
  payload JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_work_orders_created_at ON work_orders(created_at);
CREATE INDEX idx_complaints_created_at ON complaints(created_at);

