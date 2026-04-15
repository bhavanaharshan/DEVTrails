-- GigShield Database Schema: PHASE 3 CONSOLIDATED VERSION
-- Purpose: DPDP Compliance, PostGIS Spatial Triggers, and Team Integration
-- Location: /neema-backend/db/schema.sql

-- 0. ENABLE SPATIAL ENGINE
CREATE EXTENSION IF NOT EXISTS postgis;

-- Cleanup for fresh start
DROP TABLE IF EXISTS claims CASCADE;
DROP TABLE IF EXISTS policies CASCADE;
DROP TABLE IF EXISTS premiums CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. USERS TABLE
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100),
    mobile VARCHAR(20) UNIQUE,
    firebase_uid VARCHAR(100) UNIQUE,
    
    -- GEOSPATIAL (PostGIS)
    coords GEOGRAPHY(Point, 4326), 
    zone VARCHAR(100), 
    
    -- DPDP ACT COMPLIANCE (Phase 3 Updates)
    gps_consent BOOLEAN DEFAULT FALSE,
    upi_consent BOOLEAN DEFAULT FALSE,
    platform_data_consent BOOLEAN DEFAULT FALSE,
    
    -- Exact Timestamp tracking for Consent
    gps_consent_at TIMESTAMP,
    upi_consent_at TIMESTAMP,
    activity_consent_at TIMESTAMP,
    consent_timestamp TIMESTAMP DEFAULT NOW(),
    
    -- SOCIAL SECURITY & ELIGIBILITY (Priya's Logic)
    days_worked_count INTEGER DEFAULT 0,
    platform_mode VARCHAR(20) CHECK (platform_mode IN ('single', 'multi')),
    ss_eligible BOOLEAN DEFAULT FALSE, -- Track if user qualifies for Social Security
    
    -- FRAUD & RISK (ML Logic)
    is_flagged BOOLEAN DEFAULT FALSE,
    suspicion_reason TEXT, 
    
    -- UI & PROFILE
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Spatial Index for high-speed location queries
CREATE INDEX user_coords_idx ON users USING GIST (coords);

-- 2. PREMIUMS TABLE
CREATE TABLE premiums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    base_amount NUMERIC,
    risk_multiplier NUMERIC,
    final_amount NUMERIC CHECK (final_amount BETWEEN 29 AND 99),
    calculated_at TIMESTAMP DEFAULT NOW()
);

-- 3. POLICIES TABLE
CREATE TABLE policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    premium_id UUID REFERENCES premiums(id),
    week_start DATE DEFAULT CURRENT_DATE,
    premium_paid_amount NUMERIC, 
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'lapsed', 'locked'
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. CLAIMS TABLE
CREATE TABLE claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID REFERENCES policies(id),
    user_id UUID REFERENCES users(id),
    trigger_type VARCHAR(50), -- 'heavy_rain', 'heatwave', 'aqi_alert'
    payout_amount NUMERIC DEFAULT 0.0,
    triggered_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'processed'
);