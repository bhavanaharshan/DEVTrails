-- GigShield Database Schema: PHASE 3.1 (SYBIL & SECURITY ENHANCED)
-- Purpose: DPDP Compliance, Risk Corridors, and Graph-based Fraud Detection

CREATE EXTENSION IF NOT EXISTS postgis;

-- Cleanup
DROP TABLE IF EXISTS danger_zones CASCADE;
DROP TABLE IF EXISTS zone_weather CASCADE;
DROP TABLE IF EXISTS claims CASCADE;
DROP TABLE IF EXISTS policies CASCADE;
DROP TABLE IF EXISTS premiums CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. USERS TABLE (Added Sybil Detection Fields)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100),
    mobile VARCHAR(20) UNIQUE,
    firebase_uid VARCHAR(100) UNIQUE,
    upi_id VARCHAR(100), -- Critical for Priya's Graph Edges
    
    -- SECURITY & FINGERPRINTING (Bhavana's Task)
    device_fingerprint TEXT, 
    ip_address VARCHAR(45),
    
    -- GEOSPATIAL
    coords GEOGRAPHY(Point, 4326), 
    zone VARCHAR(100), 
    
    -- DPDP COMPLIANCE
    gps_consent BOOLEAN DEFAULT FALSE,
    upi_consent BOOLEAN DEFAULT FALSE,
    platform_data_consent BOOLEAN DEFAULT FALSE,
    gps_consent_at TIMESTAMP,
    upi_consent_at TIMESTAMP,
    activity_consent_at TIMESTAMP,
    consent_timestamp TIMESTAMP DEFAULT NOW(),
    
    -- ELIGIBILITY & RISK
    days_worked_count INTEGER DEFAULT 0,
    platform_mode VARCHAR(20) CHECK (platform_mode IN ('single', 'multi')),
    ss_eligible BOOLEAN DEFAULT FALSE,
    is_flagged BOOLEAN DEFAULT FALSE,
    suspicion_reason TEXT, 
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. DANGER ZONES & WEATHER
CREATE TABLE danger_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_name VARCHAR(100),
    risk_type VARCHAR(50), 
    risk_score INTEGER CHECK (risk_score BETWEEN 0 AND 100),
    geom GEOMETRY(Polygon, 4326),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE zone_weather (
    id SERIAL PRIMARY KEY,
    zone VARCHAR(100),
    alert_level VARCHAR(20), 
    alert_time TIMESTAMP
);

-- 3. PREMIUMS, POLICIES & CLAIMS
CREATE TABLE premiums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    base_amount NUMERIC,
    risk_multiplier NUMERIC,
    final_amount NUMERIC CHECK (final_amount BETWEEN 29 AND 99),
    calculated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    premium_id UUID REFERENCES premiums(id),
    week_start DATE DEFAULT CURRENT_DATE,
    premium_paid_amount NUMERIC, 
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID REFERENCES policies(id),
    user_id UUID REFERENCES users(id),
    trigger_type VARCHAR(50),
    payout_amount NUMERIC DEFAULT 0.0,
    triggered_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'processed'
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX user_coords_idx ON users USING GIST (coords);
CREATE INDEX danger_zones_geom_idx ON danger_zones USING GIST (geom);
CREATE INDEX idx_user_upi ON users(upi_id);
CREATE INDEX idx_user_fingerprint ON users(device_fingerprint);