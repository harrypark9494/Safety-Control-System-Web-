ALTER TABLE worker_registrations
    DROP CONSTRAINT IF EXISTS chk_worker_registrations_work_type;

CREATE TABLE work_types (
    label VARCHAR(40) NOT NULL,
    enabled BOOLEAN NOT NULL,
    payroll_documents_required BOOLEAN NOT NULL,
    sort_order INTEGER NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT pk_work_types PRIMARY KEY (label)
);

INSERT INTO work_types (label, enabled, payroll_documents_required, sort_order, updated_at)
VALUES
    ('직접 고용', TRUE, TRUE, 10, CURRENT_TIMESTAMP),
    ('외부 고용', TRUE, FALSE, 20, CURRENT_TIMESTAMP);
