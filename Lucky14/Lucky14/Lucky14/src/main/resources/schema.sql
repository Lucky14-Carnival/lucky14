CREATE TABLE IF NOT EXISTS branches (
    id BIGINT NOT NULL AUTO_INCREMENT,
    is_active BIT,
    barangay VARCHAR(255),
    created_at DATETIME(6),
    landmark VARCHAR(255),
    municipality VARCHAR(255),
    province VARCHAR(255),
    PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    is_active BIT,
    password VARCHAR(255),
    role ENUM ('ADMIN','SUPER_ADMIN','USER'),
    username VARCHAR(255),
    branch_id BIGINT,
    PRIMARY KEY (id),
    CONSTRAINT fk_users_branch
        FOREIGN KEY (branch_id)
        REFERENCES branches (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS attractions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    is_active BIT,
    budget DECIMAL(38,2),
    spent_budget DECIMAL(38,2),
    created_at DATETIME(6),
    name VARCHAR(255),
    updated_at DATETIME(6),
    branch_id BIGINT,
    PRIMARY KEY (id),
    CONSTRAINT fk_attractions_branch
        FOREIGN KEY (branch_id)
        REFERENCES branches (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS contact_info (
    id BIGINT NOT NULL AUTO_INCREMENT,
    type ENUM ('email','phone'),
    value VARCHAR(255),
    user_id BIGINT,
    PRIMARY KEY (id),
    CONSTRAINT fk_contact_info_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS otp_verification (
    id BIGINT NOT NULL AUTO_INCREMENT,
    created_at DATETIME(6),
    expiry_time DATETIME(6),
    is_used BIT,
    otp_code VARCHAR(255),
    purpose ENUM ('change_password','password_reset'),
    user_id BIGINT NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_otp_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reports (
    id BIGINT NOT NULL AUTO_INCREMENT,
    date DATE,
    is_finalized BIT NOT NULL,
    generated_at DATETIME(6),
    profit DECIMAL(38,2) NOT NULL,
    total_borrowed_funds DECIMAL(38,2) NOT NULL,
    total_expenses DECIMAL(38,2) NOT NULL,
    total_revenue DECIMAL(38,2) NOT NULL,
    branch_id BIGINT,
    user_id BIGINT,
    PRIMARY KEY (id),
    CONSTRAINT fk_reports_branch
        FOREIGN KEY (branch_id)
        REFERENCES branches (id),
    CONSTRAINT fk_reports_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS transactions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    amount DECIMAL(38,2),
    date DATETIME(6),
    has_receipt BIT,
    approved BIT,
    remarks VARCHAR(255),
    type VARCHAR(255),
    attraction_id BIGINT,
    user_id BIGINT,
    PRIMARY KEY (id),
    CONSTRAINT fk_transactions_attraction
        FOREIGN KEY (attraction_id)
        REFERENCES attractions (id),
    CONSTRAINT fk_transactions_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
) ENGINE=InnoDB;
