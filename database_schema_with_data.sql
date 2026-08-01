-- =================================================================================
-- DISCLAIMER: AWS CLOUD INTEGRATION
-- This project completely relies on a live Amazon Web Services (AWS RDS) 
-- PostgreSQL instance hosted in the eu-north-1 region as our primary database. 
-- This .sql file is provided purely for documentation and hackathon submission 
-- purposes to demonstrate the schema and data currently running live in the AWS cloud.
-- =================================================================================

CREATE TABLE IF NOT EXISTS repo_health_snapshots (
    id SERIAL PRIMARY KEY,
    repo_name VARCHAR(255) NOT NULL,
    score INTEGER NOT NULL,
    code_churn INTEGER NOT NULL,
    stagnation_risk INTEGER NOT NULL,
    burnout_risk DECIMAL(5,2) NOT NULL,
    bus_factor DECIMAL(5,2) NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_repo_name ON repo_health_snapshots(repo_name);
CREATE INDEX idx_generated_at ON repo_health_snapshots(generated_at);

-- Sample Data representing live telemetry synced from GitHub
INSERT INTO repo_health_snapshots (repo_name, score, code_churn, stagnation_risk, burnout_risk, bus_factor) 
VALUES ('Technova_StackAttack', 71, 7403, 0, 0.00, 0.45);

INSERT INTO repo_health_snapshots (repo_name, score, code_churn, stagnation_risk, burnout_risk, bus_factor) 
VALUES ('asanalmahathir/Music-Player', 50, 124, 218, 0.00, 1.00);

INSERT INTO repo_health_snapshots (repo_name, score, code_churn, stagnation_risk, burnout_risk, bus_factor) 
VALUES ('yashvanthkanna-s/SaaSVera', 81, 523, 10, 0.00, 0.71);
