-- GigShield Final Schema: PHASE 3.3 (ZERO-TRUST & DYNAMIC SECURITY)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Cleanup
DROP TABLE IF EXISTS danger_zones CASCADE;
DROP TABLE IF EXISTS zones CASCADE;
DROP TABLE IF EXISTS zone_weather CASCADE;
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
    upi_id VARCHAR(100),
    device_fingerprint TEXT, 
    ip_address VARCHAR(45),
    coords GEOGRAPHY(Point, 4326), 
    zone VARCHAR(100), 
    gps_consent BOOLEAN DEFAULT FALSE,
    upi_consent BOOLEAN DEFAULT FALSE,
    platform_data_consent BOOLEAN DEFAULT FALSE,
    days_worked_count INTEGER DEFAULT 0,
    platform_mode VARCHAR(20) CHECK (platform_mode IN ('single', 'multi')),
    ss_eligible BOOLEAN DEFAULT FALSE,
    is_flagged BOOLEAN DEFAULT FALSE,
    suspicion_reason TEXT, 
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. ZONES TABLE (Center points for Zero-Trust verification)
CREATE TABLE zones (
    id SERIAL PRIMARY KEY,
    zone_name VARCHAR(100) UNIQUE,
    center_lat DECIMAL(10, 8),
    center_lon DECIMAL(11, 8)
);

-- 3. DANGER ZONES (Polygons for Samridhi's risk corridors)
CREATE TABLE danger_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_name VARCHAR(100),
    risk_type VARCHAR(50), 
    geom GEOMETRY(Polygon, 4326),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. POLICIES & CLAIMS
CREATE TABLE policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID REFERENCES policies(id),
    user_id UUID REFERENCES users(id),
    trigger_type VARCHAR(50),
    payout_amount NUMERIC DEFAULT 0.0,
    status VARCHAR(20) DEFAULT 'processed'
);

-- Indexes
CREATE INDEX user_coords_idx ON users USING GIST (coords);
CREATE INDEX danger_zones_geom_idx ON danger_zones USING GIST (geom);