--varchar stands for variable character and is used to store strings of varying lengths.

-- Users Table
-- Stores basic user information including email and name

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,                    -- Auto incrementing user ID
  email VARCHAR(255) NOT NULL UNIQUE,       -- User email (max 255 chars, must be unique)
  name VARCHAR(255) NOT NULL,               -- User's full name
  created_at TIMESTAMP DEFAULT now()        -- Account creation timestamp
);

-- Transactions Table
-- Stores payment/transaction records linked to users

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,                                           -- Unique transaction ID
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Links to user, cascade delete
  amount NUMERIC(14,2) NOT NULL,                                   -- Transaction amount (14 digits, 2 decimals)
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',                     -- Currency code (e.g., USD, EUR, NGN)
  status VARCHAR(32) NOT NULL DEFAULT 'pending',                   -- Transaction status (pending/completed/failed)
  reference VARCHAR(255) UNIQUE,                                   -- Unique transaction reference code
  created_at TIMESTAMP DEFAULT now()                               -- Transaction creation time
);

-- Indexes for Performance Optimization
-- Speed up queries that search by user_id or date


CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
