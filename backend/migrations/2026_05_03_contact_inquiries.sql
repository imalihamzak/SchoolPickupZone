CREATE TABLE IF NOT EXISTS contact_inquiries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NULL,
  user_id INT NULL,
  name VARCHAR(140) NOT NULL,
  email VARCHAR(180) NOT NULL,
  phone VARCHAR(40) NULL,
  subject VARCHAR(180) NULL,
  message TEXT NOT NULL,
  source VARCHAR(80) NULL,
  status ENUM('New', 'In Progress', 'Closed') NOT NULL DEFAULT 'New',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_contact_inquiries_status (status),
  INDEX idx_contact_inquiries_school (school_id),
  INDEX idx_contact_inquiries_created (created_at)
);
