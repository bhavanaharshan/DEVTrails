CREATE EXTENSION IF NOT EXISTS postgis;

-- Drop in dependency order
DROP TABLE IF EXISTS claims CASCADE;
DROP TABLE IF EXISTS policies CASCADE;
DROP TABLE IF EXISTS danger_zones CASCADE;
DROP TABLE IF EXISTS zones CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =========================================
-- 1. USERS TABLE
-- =========================================
CREATE TABLE users (
    -- Firebase UID
    id TEXT PRIMARY KEY,

    name VARCHAR(100),
    mobile VARCHAR(20) UNIQUE,
    upi_id VARCHAR(100),

    -- Optional device / audit info
    device_fingerprint TEXT,
    ip_address VARCHAR(45),

    -- Live / selected location
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    city VARCHAR(100),
    zone VARCHAR(100),

    -- PostGIS point from lng/lat
    coords GEOGRAPHY(Point, 4326),

    -- Consents
    gps_consent BOOLEAN DEFAULT FALSE,
    upi_consent BOOLEAN DEFAULT FALSE,
    platform_data_consent BOOLEAN DEFAULT FALSE,

    -- Eligibility / trust
    days_worked_count INTEGER DEFAULT 0,
    platform_mode VARCHAR(20) CHECK (platform_mode IN ('single', 'multi')),
    ss_eligible BOOLEAN DEFAULT FALSE,

    -- Security flags
    is_active BOOLEAN DEFAULT TRUE,
    is_flagged BOOLEAN DEFAULT FALSE,
    suspicion_reason TEXT,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =========================================
-- 2. ZONES TABLE
-- =========================================
CREATE TABLE zones (
    id SERIAL PRIMARY KEY,
    city VARCHAR(100) NOT NULL,
    zone_name VARCHAR(100) NOT NULL,
    coords GEOGRAPHY(Point, 4326),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================================
-- 3. DANGER ZONES TABLE
-- =========================================
CREATE TABLE danger_zones (
    id SERIAL PRIMARY KEY,
    zone_id INTEGER REFERENCES zones(id) ON DELETE CASCADE,
    risk_type VARCHAR(50),
    severity NUMERIC(5,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================================
-- 4. POLICIES TABLE
-- =========================================
CREATE TABLE policies (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    policy_type VARCHAR(50) DEFAULT 'gigshield_pro',
    premium_amount NUMERIC(10,2),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================================
-- 5. CLAIMS TABLE
-- =========================================
CREATE TABLE claims (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    policy_id INTEGER REFERENCES policies(id) ON DELETE SET NULL,
    zone VARCHAR(100),
    claim_type VARCHAR(50),
    payout_amount NUMERIC(10,2),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================================
-- INDEXES
-- =========================================
CREATE INDEX IF NOT EXISTS idx_users_coords ON users USING GIST (coords);
CREATE INDEX IF NOT EXISTS idx_zones_coords ON zones USING GIST (coords);