-- GigShield Database Schema: API CONTRACT FREEZE VERSION (SPATIAL ENHANCED)
-- Purpose: DPDP Compliance, PostGIS Hyper-local Triggers, and Teammate Integration
-- Run: psql -U postgres -d gigshield -f schema.sql

-- 0. ENABLE SPATIAL ENGINE
CREATE EXTENSION IF NOT EXISTS postgis;

DROP TABLE IF EXISTS claims CASCADE;
DROP TABLE IF EXISTS policies CASCADE;
DROP TABLE IF EXISTS premiums CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. USERS TABLE: The core integration hub
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100),
    mobile VARCHAR(20) UNIQUE,
    firebase_uid VARCHAR(100) UNIQUE,
    
    -- GEOSPATIAL (PostGIS Upgrade for Hyper-local Accuracy)
    -- This replaces simple decimal lat/lng for high-accuracy geofencing
    coords GEOGRAPHY(Point, 4326), 
    zone VARCHAR(100), -- Municipal ward or region name
    
    -- DPDP ACT COMPLIANCE (Bhavana's Frontend sends these)
    gps_consent BOOLEAN DEFAULT FALSE,
    upi_consent BOOLEAN DEFAULT FALSE,
    platform_data_consent BOOLEAN DEFAULT FALSE,
    consent_timestamp TIMESTAMP DEFAULT NOW(),
    
    -- SOCIAL SECURITY TRACKING (Priya's Finance Logic)
    days_worked_count INTEGER DEFAULT 0,
    platform_mode VARCHAR(20) CHECK (platform_mode IN ('single', 'multi')), -- 'single' (90 days) or 'multi' (120 days)
    
    -- FRAUD & RISK (Priya's ML API outputs)
    is_flagged BOOLEAN DEFAULT FALSE,
    suspicion_reason TEXT, -- e.g., "Mock location detected" or "Frequency anomaly"
    
    -- UI & PROFILE
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Spatial Index for 100x faster location lookups
CREATE INDEX user_coords_idx ON users USING GIST (coords);

-- 2. PREMIUMS TABLE: (Bhavana's ML engine outputs)
CREATE TABLE premiums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    base_amount NUMERIC,
    risk_multiplier NUMERIC,
    final_amount NUMERIC CHECK (final_amount BETWEEN 29 AND 99),
    calculated_at TIMESTAMP DEFAULT NOW()
);

-- 3. POLICIES TABLE: (Your Backend Logic)
CREATE TABLE policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    premium_id UUID REFERENCES premiums(id),
    week_start DATE DEFAULT CURRENT_DATE,
    premium_paid_amount NUMERIC, 
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'lapsed', 'locked'
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. CLAIMS TABLE: (The Bridge for Samridhi)
CREATE TABLE claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID REFERENCES policies(id),
    user_id UUID REFERENCES users(id),
    trigger_type VARCHAR(50), -- 'heavy_rain', 'heatwave', 'aqi_alert'
    payout_amount NUMERIC DEFAULT 0.0,
    triggered_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'processed'
);