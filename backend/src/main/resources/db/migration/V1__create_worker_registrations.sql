CREATE TABLE worker_registrations (
    uid VARCHAR(36) NOT NULL,
    name VARCHAR(80) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(120),
    verification_code VARCHAR(40),
    work_type VARCHAR(30) NOT NULL,
    team VARCHAR(80) NOT NULL,
    supervisor VARCHAR(80) NOT NULL,
    registration_status VARCHAR(20) NOT NULL,
    payroll_document_status VARCHAR(20) NOT NULL,
    registered_at TIMESTAMP WITH TIME ZONE NOT NULL,
    onboarded_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT pk_worker_registrations PRIMARY KEY (uid),
    CONSTRAINT uk_worker_registrations_phone UNIQUE (phone),
    CONSTRAINT chk_worker_registrations_work_type CHECK (work_type IN ('직접 고용', '외부 고용')),
    CONSTRAINT chk_worker_registrations_status CHECK (registration_status IN ('registered', 'onboarded')),
    CONSTRAINT chk_worker_registrations_payroll_status CHECK (payroll_document_status IN ('missing', 'submitted', 'reviewing', 'approved', 'rejected'))
);

CREATE INDEX idx_worker_registrations_registered_at
    ON worker_registrations (registered_at DESC);
