-- GigShield Database Schema
-- Run this to reset the database: psql -U postgres -d gigshield -f schema.sql

DROP TABLE IF EXISTS claims;
DROP TABLE IF EXISTS policies;
DROP TABLE IF EXISTS premiums;
DROP TABLE IF EXISTS users;

-- USERS TABLE (Priya's Registration + Neema's Profile)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100),
  zone VARCHAR(100),
  platform VARCHAR(50),
  weekly_income NUMERIC,
  address TEXT,
  mobile VARCHAR(20),
  avatar_url TEXT,
  payout_qr TEXT, -- Stores base64 or URL of the QR
  firebase_uid VARCHAR(100) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- PREMIUMS TABLE (Bhavana's ML Outputs)
CREATE TABLE premiums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  base_amount NUMERIC,
  risk_multiplier NUMERIC,
  final_amount NUMERIC CHECK (final_amount BETWEEN 29 AND 99),
  zone_snapshot VARCHAR(100),
  calculated_at TIMESTAMP DEFAULT NOW()
);

-- POLICIES TABLE (Neema's Dashboard Core)
CREATE TABLE policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  premium_id UUID REFERENCES premiums(id),
  week_start DATE,
  coverage_tier VARCHAR(20),
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'pending_claim', 'paid'
  created_at TIMESTAMP DEFAULT NOW()
);

-- CLAIMS TABLE (Sam's Automated Trigger Results)
CREATE TABLE claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID REFERENCES policies(id),
  trigger_type VARCHAR(50), 
  payout_amount NUMERIC,
  triggered_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending'
);