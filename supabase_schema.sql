-- ====================================================================
-- ScanServe SaaS Database Schema
-- Compatible with PostgreSQL / Supabase
-- Contains: tables, indexes, RLS policies, and dynamic order triggers.
--
-- IMPORTANT RUNNING INSTRUCTIONS:
-- Some third-party SQL editors (e.g., DBeaver, TablePlus, or custom client tools) 
-- split SQL files into separate statements using the semicolon (;) character.
-- Because PL/pgSQL functions contain internal semicolons, naive splitting will 
-- break the CREATE FUNCTION statement into invalid pieces, causing errors like:
-- "syntax error at or near 'END'".
--
-- TO RESOLVE THIS:
-- 1. If using Supabase SQL Editor: Paste the entire script and click "Run".
--    The official Supabase Dashboard handles PL/pgSQL blocks perfectly.
-- 2. If using DBeaver/TablePlus: Highlight the CREATE FUNCTION block fully
--    (lines 88 to 123) and use "Execute as single query / block" (or hit Cmd+Enter/Ctrl+Enter).
-- ====================================================================

-- ====================================================================
-- MIGRATION SCRIPTS FOR EXISTING DATABASES
-- Run the following queries to add the gstin column to your existing tables:
--
-- ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS gstin TEXT DEFAULT NULL;
-- ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS gstin TEXT DEFAULT NULL;
-- ====================================================================

-- 1. EXTENSIONS & UTILITIES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CUSTOMERS TABLE (Loyalty Profiles & CRM)
CREATE TABLE IF NOT EXISTS public.customers (
    phone TEXT NOT NULL,
    name TEXT NOT NULL,
    order_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    loyal_vip BOOLEAN DEFAULT false,
    discount BIGINT DEFAULT NULL,
    gstin TEXT DEFAULT NULL,
    CONSTRAINT customers_pkey PRIMARY KEY (phone)
);

-- Index to optimize name searching
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers (lower(name));

-- 3. MENU ITEMS TABLE (Digital Catalog)
CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    discount_price NUMERIC(10, 2) DEFAULT NULL,
    category TEXT NOT NULL,
    image TEXT,
    is_sold_out BOOLEAN DEFAULT false NOT NULL,
    CONSTRAINT menu_items_pkey PRIMARY KEY (id)
);

-- Index for category-wise quick querying
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON public.menu_items (category);

-- 4. ORDERS TABLE (Contactless Table / Walk-in Orders)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    token TEXT NOT NULL,
    status TEXT DEFAULT 'pending'::text NOT NULL,
    total NUMERIC(10, 2) NOT NULL,
    items JSONB DEFAULT '[]'::jsonb NOT NULL,
    customer_name TEXT,
    customer_phone TEXT,
    table_id TEXT,
    gstin TEXT DEFAULT NULL,
    CONSTRAINT orders_pkey PRIMARY KEY (id)
);

-- Index to query orders by customer phone/name and status for active dashboard loads
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders (customer_phone) WHERE customer_phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc ON public.orders (created_at DESC);


-- ====================================================================
-- AUTOMATION TRIGGER: Automatic Customer CRM Upkeep
-- Whenever an order is created or updated, automatically insert/upsert
-- the customer details into public.customers and sync order counts.
-- ====================================================================

CREATE OR REPLACE FUNCTION public.sync_customer_from_order()
RETURNS TRIGGER AS $$
DECLARE
    cleaned_phone TEXT;
    completed_orders_count INTEGER;
BEGIN
    -- Normalize and clean the phone number if present
    IF NEW.customer_phone IS NOT NULL AND NEW.customer_phone <> '' THEN
        cleaned_phone := NEW.customer_phone;
        
        -- Calculate the count of completed, non-cancelled orders for this phone number
        SELECT COUNT(*)::INTEGER
        INTO completed_orders_count
        FROM public.orders
        WHERE customer_phone = cleaned_phone 
          AND status = 'completed';

        -- Upsert customer profile
        INSERT INTO public.customers (phone, name, order_count, created_at)
        VALUES (
            cleaned_phone,
            COALESCE(NEW.customer_name, 'Guest'),
            completed_orders_count,
            COALESCE(NEW.created_at, now())
        )
        ON CONFLICT (phone) DO UPDATE
        SET 
            name = EXCLUDED.name,
            -- Update the order count from the verified orders query
            order_count = completed_orders_count;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on INSERT or UPDATE of orders to maintain the customers table automatically
DROP TRIGGER IF EXISTS trg_sync_customer_from_order ON public.orders;
CREATE TRIGGER trg_sync_customer_from_order
AFTER INSERT OR UPDATE OF status, customer_name, customer_phone ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.sync_customer_from_order();


-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES (Supabase Security Best Practices)
-- ====================================================================

-- Enable RLS on all tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 1. Customers Table Policies
CREATE POLICY "Allow public read and write access to customers"
ON public.customers FOR ALL
USING (true)
WITH CHECK (true);

-- 2. Menu Items Table Policies
CREATE POLICY "Allow public read-only access to menu items"
ON public.menu_items FOR SELECT
USING (true);

CREATE POLICY "Allow staff write access to menu items"
ON public.menu_items FOR ALL
USING (true)
WITH CHECK (true);

-- 3. Orders Table Policies
CREATE POLICY "Allow public read and insert access to orders"
ON public.orders FOR SELECT
USING (true);

CREATE POLICY "Allow public insert to orders"
ON public.orders FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow staff update access to orders"
ON public.orders FOR UPDATE
USING (true)
WITH CHECK (true);
