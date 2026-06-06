CREATE TABLE IF NOT EXISTS school_onboarding_acceptances (
  id INT NOT NULL AUTO_INCREMENT,
  school_id INT NOT NULL,
  user_id INT NOT NULL,
  plan_id INT NOT NULL,
  billing_interval ENUM('monthly','yearly') NOT NULL DEFAULT 'monthly',
  terms_version VARCHAR(50) DEFAULT NULL,
  ip_address VARCHAR(64) DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  accepted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_school_onboarding_school (school_id),
  KEY idx_school_onboarding_user (user_id),
  KEY idx_school_onboarding_plan (plan_id),
  CONSTRAINT fk_school_onboarding_school
    FOREIGN KEY (school_id) REFERENCES schools(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_school_onboarding_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_school_onboarding_plan
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
    ON DELETE RESTRICT
);
