# Local Vendor Management App - Implementation Plan

> **Purpose**: This document is the complete implementation guide for Claude Code to build the Local Vendor Management App. Follow this document section by section.

---

## Table of Contents

1. [Tech Stack & Tools](#1-tech-stack--tools)
2. [Project Setup](#2-project-setup)
3. [Design System](#3-design-system)
4. [Database Schema & Migrations](#4-database-schema--migrations)
5. [Authentication System](#5-authentication-system)
6. [Project Structure](#6-project-structure)
7. [Core Features Implementation](#7-core-features-implementation)
8. [API Routes](#8-api-routes)
9. [UI Components](#9-ui-components)
10. [PWA Configuration](#10-pwa-configuration)
11. [Supabase Configuration](#11-supabase-configuration)
12. [Build Phases](#12-build-phases)
13. [Important Notes](#13-important-notes)

---

## 1. Tech Stack & Tools

### Core Stack

| Technology | Purpose |
|------------|---------|
| **Bun** | Package manager and local runtime |
| **Next.js 14+** | Full-stack React framework (App Router) |
| **TypeScript** | Type safety |
| **Supabase** | PostgreSQL database, Storage, Row Level Security |
| **Vercel** | Deployment and hosting |

### Key Libraries to Install

```
# Core
next
react
react-dom
typescript
@types/react
@types/node

# Supabase
@supabase/supabase-js
@supabase/ssr

# UI & Styling
tailwindcss
postcss
autoprefixer
lucide-react (icons)
clsx (conditional classes)
tailwind-merge

# PDF Generation
@react-pdf/renderer (for on-demand PDF generation)

# QR Code
qrcode (for payment QR codes on bills)

# Date Handling
date-fns

# Form Handling
react-hook-form
zod (validation)

# PWA
next-pwa
```

### Environment Variables Required

```env
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# AiSensy (for WhatsApp - Phase 3)
AISENSY_API_KEY=your_aisensy_api_key
```

---

## 2. Project Setup

### Initialize Project

```bash
bunx create-next-app@latest vendor-app --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd vendor-app
```

### Bun Commands

Use `bun` instead of `npm`:
- `bun install` - Install dependencies
- `bun run dev` - Development server
- `bun run build` - Production build
- `bun add <package>` - Add dependency

### TypeScript Configuration

Enable strict mode in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true
  }
}
```

---

## 3. Design System

### Design Philosophy

The app should look and feel like Claude AI / Anthropic's interface:
- **Warm and calm** aesthetic
- **Minimal and clean** - no visual clutter
- **Generous whitespace** - content breathes
- **Soft, rounded** UI elements
- **Professional** but approachable

### Color Palette

```css
:root {
  /* Backgrounds */
  --bg-primary: #FAF9F7;      /* Warm off-white - main background */
  --bg-secondary: #F5F4F2;    /* Slightly darker - cards, sections */
  --bg-white: #FFFFFF;        /* Pure white - elevated cards */
  
  /* Brand / Accent */
  --accent-primary: #D97757;  /* Anthropic orange - primary actions */
  --accent-hover: #C4684A;    /* Darker orange - hover states */
  --accent-light: #FDF4F1;    /* Very light orange - subtle highlights */
  
  /* Text */
  --text-primary: #1A1A1A;    /* Near black - headings, important text */
  --text-secondary: #6B7280;  /* Muted gray - secondary text */
  --text-tertiary: #9CA3AF;   /* Light gray - placeholders, hints */
  
  /* Borders */
  --border-light: #E5E5E5;    /* Subtle borders */
  --border-medium: #D1D5DB;   /* More visible borders */
  
  /* Status Colors */
  --success: #059669;         /* Green - success, profit, in stock */
  --warning: #D97706;         /* Amber - warnings, low stock */
  --error: #DC2626;           /* Red - errors, out of stock, loss */
  --info: #2563EB;            /* Blue - informational */
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.05);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.08);
}
```

### Tailwind Config Extension

```javascript
// tailwind.config.ts
{
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FDF4F1',
          100: '#FAE5DE',
          200: '#F5C9BC',
          300: '#EDA390',
          400: '#E27D64',
          500: '#D97757',  // Primary
          600: '#C4684A',
          700: '#A3533B',
          800: '#854432',
          900: '#6E392A',
        },
        surface: {
          primary: '#FAF9F7',
          secondary: '#F5F4F2',
          white: '#FFFFFF',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      }
    }
  }
}
```

### Typography Scale

```css
/* Headings */
h1: text-2xl font-semibold text-gray-900     /* 24px - Page titles */
h2: text-xl font-semibold text-gray-900      /* 20px - Section headers */
h3: text-lg font-medium text-gray-900        /* 18px - Card titles */
h4: text-base font-medium text-gray-900      /* 16px - Subsections */

/* Body */
body: text-base text-gray-700                /* 16px - Primary content */
secondary: text-sm text-gray-500             /* 14px - Secondary info */
caption: text-xs text-gray-400               /* 12px - Hints, timestamps */

/* Numbers / Money */
amount: text-lg font-semibold tabular-nums   /* Financial figures */
```

### Component Styling Guidelines

#### Buttons

```
Primary Button:
- Background: var(--accent-primary)
- Text: white
- Padding: 12px 24px (mobile: 14px 28px for touch)
- Border radius: 12px
- Font weight: 500
- Hover: var(--accent-hover)
- Active: scale(0.98)
- Min height: 48px (mobile touch target)

Secondary Button:
- Background: transparent
- Border: 1px solid var(--border-medium)
- Text: var(--text-primary)
- Same sizing as primary
- Hover: var(--bg-secondary)

Ghost Button:
- Background: transparent
- No border
- Text: var(--text-secondary)
- Hover: var(--bg-secondary)
```

#### Cards

```
Card Container:
- Background: white
- Border radius: 16px
- Shadow: var(--shadow-sm)
- Border: 1px solid var(--border-light) (optional)
- Padding: 16px (mobile), 20px (desktop)

Card with hover (clickable):
- Transition: all 0.15s ease
- Hover: shadow-md, translateY(-1px)
```

#### Input Fields

```
Text Input:
- Background: white
- Border: 1px solid var(--border-light)
- Border radius: 12px
- Padding: 12px 16px
- Font size: 16px (prevents zoom on iOS)
- Focus: border-color var(--accent-primary), ring-2 ring-brand-100
- Placeholder: var(--text-tertiary)
- Min height: 48px
```

#### Navigation (Bottom Tab Bar)

```
Container:
- Fixed bottom
- Background: white
- Border top: 1px solid var(--border-light)
- Height: 64px + safe-area-inset-bottom
- Display: flex, justify-around

Tab Item:
- Flex direction: column
- Align items: center
- Gap: 4px
- Padding: 8px 12px
- Icon size: 24px
- Label: 12px

Active Tab:
- Icon color: var(--accent-primary)
- Label color: var(--accent-primary)
- Optional: dot indicator or background highlight

Inactive Tab:
- Icon color: var(--text-tertiary)
- Label color: var(--text-tertiary)
```

### Mobile-First Principles

1. **Touch Targets**: All interactive elements minimum 48x48px
2. **Font Size**: Never below 14px, inputs always 16px (prevents iOS zoom)
3. **Spacing**: Generous padding, at least 16px on sides
4. **Bottom Navigation**: Fixed, always accessible with thumb
5. **Pull to Refresh**: Consider for list pages
6. **No Hover Dependency**: All interactions must work on touch
7. **Safe Areas**: Respect notch and home indicator on iOS
8. **Thumb Zone**: Place primary actions in bottom half of screen

### Responsive Breakpoints

```
Mobile: default (0px+)
Tablet: sm (640px+) - Minor adjustments
Desktop: lg (1024px+) - Max-width container, side navigation option
```

Focus primarily on mobile. Desktop is secondary.

---

## 4. Database Schema & Migrations

### Overview

All tables use UUID primary keys. Every table (except `vendors`) has a `vendor_id` foreign key for multi-tenancy. Row Level Security (RLS) ensures data isolation.

### Migration SQL

Run this SQL in Supabase SQL Editor in order:

```sql
-- ============================================
-- MIGRATION 1: Enable UUID Extension
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- MIGRATION 2: Create Vendors Table
-- ============================================

CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  pin_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  business_name VARCHAR(255) NOT NULL,
  phone VARCHAR(15),
  business_logo TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for login
CREATE INDEX idx_vendors_username ON vendors(username);

-- ============================================
-- MIGRATION 3: Create Accounts Table
-- ============================================
-- Accounts for tracking money (Cash, Axis Bank, PhonePe, etc.)
-- Type is free-text - vendors can name it anything

CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(100) NOT NULL,  -- Free text: "Cash", "Axis Bank", "PhonePe Business", etc.
  balance DECIMAL(12, 2) DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_accounts_vendor ON accounts(vendor_id);

-- Ensure only one default account per vendor
CREATE UNIQUE INDEX idx_accounts_default ON accounts(vendor_id) WHERE is_default = TRUE;

-- ============================================
-- MIGRATION 4: Create Customers Table
-- ============================================

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(15),
  total_purchases INTEGER DEFAULT 0,
  total_spent DECIMAL(12, 2) DEFAULT 0,
  last_purchase_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast customer search by name
CREATE INDEX idx_customers_vendor ON customers(vendor_id);
CREATE INDEX idx_customers_name_search ON customers(vendor_id, LOWER(name));
CREATE INDEX idx_customers_phone ON customers(vendor_id, phone) WHERE phone IS NOT NULL;

-- ============================================
-- MIGRATION 5: Create Inventory Categories Table
-- ============================================

CREATE TABLE inventory_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventory_categories_vendor ON inventory_categories(vendor_id);

-- ============================================
-- MIGRATION 6: Create Inventory Items Table
-- ============================================

CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  category_id UUID REFERENCES inventory_categories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  current_stock DECIMAL(10, 2) DEFAULT 0,
  min_stock_alert DECIMAL(10, 2) DEFAULT 0,
  unit VARCHAR(50) DEFAULT 'pcs',
  unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  cost_price DECIMAL(10, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventory_vendor ON inventory_items(vendor_id);
CREATE INDEX idx_inventory_category ON inventory_items(category_id);
CREATE INDEX idx_inventory_low_stock ON inventory_items(vendor_id) 
  WHERE current_stock <= min_stock_alert AND is_active = TRUE;

-- ============================================
-- MIGRATION 7: Create Sales Table
-- ============================================

CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  account_id UUID NOT NULL REFERENCES accounts(id),
  bill_number VARCHAR(50) NOT NULL,
  bill_id VARCHAR(20) UNIQUE NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(12, 2) DEFAULT 0,
  discount_percent DECIMAL(5, 2) DEFAULT 0,
  tax_amount DECIMAL(12, 2) DEFAULT 0,
  total_amount DECIMAL(12, 2) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending', 'partial')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sales_vendor ON sales(vendor_id);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_date ON sales(vendor_id, created_at DESC);
CREATE INDEX idx_sales_bill_id ON sales(bill_id);

-- ============================================
-- MIGRATION 8: Create Sale Items Table
-- ============================================

CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
  item_name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_inventory ON sale_items(inventory_item_id);

-- ============================================
-- MIGRATION 9: Create Expenses Table
-- ============================================

CREATE TABLE expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id),
  category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
  category_name VARCHAR(100) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expenses_vendor ON expenses(vendor_id);
CREATE INDEX idx_expenses_date ON expenses(vendor_id, expense_date DESC);
CREATE INDEX idx_expenses_category ON expenses(category_id);

-- ============================================
-- MIGRATION 10: Create Income Table (Non-Sale Income)
-- ============================================

CREATE TABLE income (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id),
  sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT,
  income_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_income_vendor ON income(vendor_id);
CREATE INDEX idx_income_date ON income(vendor_id, income_date DESC);

-- ============================================
-- MIGRATION 11: Create Scheduled Messages Table
-- ============================================

CREATE TABLE scheduled_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('maintenance', 'reminder', 'promotional', 'custom')),
  message_text TEXT NOT NULL,
  scheduled_date TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  aisensy_message_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scheduled_messages_vendor ON scheduled_messages(vendor_id);
CREATE INDEX idx_scheduled_messages_pending ON scheduled_messages(scheduled_date, status) 
  WHERE status = 'pending';

-- ============================================
-- MIGRATION 12: Create Message Logs Table
-- ============================================

CREATE TABLE message_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  scheduled_message_id UUID REFERENCES scheduled_messages(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_phone VARCHAR(15) NOT NULL,
  message_type VARCHAR(50) NOT NULL,
  message_text TEXT,
  cost DECIMAL(6, 4) DEFAULT 0,
  channel VARCHAR(20) DEFAULT 'whatsapp',
  status VARCHAR(50) NOT NULL,
  external_id VARCHAR(255),
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_message_logs_vendor ON message_logs(vendor_id);
CREATE INDEX idx_message_logs_date ON message_logs(vendor_id, sent_at DESC);

-- ============================================
-- MIGRATION 13: Create Message Templates Table
-- ============================================

CREATE TABLE message_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  message_type VARCHAR(50) NOT NULL,
  template_text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_message_templates_vendor ON message_templates(vendor_id);

-- ============================================
-- MIGRATION 14: Create Vendor Sessions Table
-- ============================================
-- For authentication sessions

CREATE TABLE vendor_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vendor_sessions_token ON vendor_sessions(token);
CREATE INDEX idx_vendor_sessions_vendor ON vendor_sessions(vendor_id);

-- ============================================
-- MIGRATION 15: Updated At Trigger
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- MIGRATION 16: Bill Number Sequence
-- ============================================
-- Each vendor has their own bill number sequence

CREATE TABLE bill_sequences (
  vendor_id UUID PRIMARY KEY REFERENCES vendors(id) ON DELETE CASCADE,
  last_number INTEGER DEFAULT 0,
  prefix VARCHAR(10) DEFAULT 'INV'
);

-- Function to get next bill number
CREATE OR REPLACE FUNCTION get_next_bill_number(p_vendor_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_prefix VARCHAR(10);
  v_number INTEGER;
BEGIN
  -- Insert or update sequence
  INSERT INTO bill_sequences (vendor_id, last_number, prefix)
  VALUES (p_vendor_id, 1, 'INV')
  ON CONFLICT (vendor_id) 
  DO UPDATE SET last_number = bill_sequences.last_number + 1
  RETURNING prefix, last_number INTO v_prefix, v_number;
  
  RETURN v_prefix || '-' || LPAD(v_number::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- MIGRATION 17: Row Level Security (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE income ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_sequences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Note: These policies use a custom claim 'vendor_id' that should be set in the JWT
-- For service role, all access is granted automatically

-- Helper function to get current vendor_id from JWT or session
CREATE OR REPLACE FUNCTION auth.vendor_id() 
RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_vendor_id', TRUE), '')::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accounts policies
CREATE POLICY "Vendors can view own accounts" ON accounts
  FOR SELECT USING (vendor_id = auth.vendor_id());
CREATE POLICY "Vendors can insert own accounts" ON accounts
  FOR INSERT WITH CHECK (vendor_id = auth.vendor_id());
CREATE POLICY "Vendors can update own accounts" ON accounts
  FOR UPDATE USING (vendor_id = auth.vendor_id());
CREATE POLICY "Vendors can delete own accounts" ON accounts
  FOR DELETE USING (vendor_id = auth.vendor_id());

-- Customers policies
CREATE POLICY "Vendors can view own customers" ON customers
  FOR SELECT USING (vendor_id = auth.vendor_id());
CREATE POLICY "Vendors can insert own customers" ON customers
  FOR INSERT WITH CHECK (vendor_id = auth.vendor_id());
CREATE POLICY "Vendors can update own customers" ON customers
  FOR UPDATE USING (vendor_id = auth.vendor_id());
CREATE POLICY "Vendors can delete own customers" ON customers
  FOR DELETE USING (vendor_id = auth.vendor_id());

-- Apply same pattern to all other tables...
-- Inventory Categories
CREATE POLICY "Vendors can manage own inventory categories" ON inventory_categories
  FOR ALL USING (vendor_id = auth.vendor_id());

-- Inventory Items
CREATE POLICY "Vendors can manage own inventory" ON inventory_items
  FOR ALL USING (vendor_id = auth.vendor_id());

-- Sales
CREATE POLICY "Vendors can manage own sales" ON sales
  FOR ALL USING (vendor_id = auth.vendor_id());

-- Sale Items (needs join through sales)
CREATE POLICY "Vendors can manage own sale items" ON sale_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sales WHERE sales.id = sale_items.sale_id 
      AND sales.vendor_id = auth.vendor_id()
    )
  );

-- Expense Categories
CREATE POLICY "Vendors can manage own expense categories" ON expense_categories
  FOR ALL USING (vendor_id = auth.vendor_id());

-- Expenses
CREATE POLICY "Vendors can manage own expenses" ON expenses
  FOR ALL USING (vendor_id = auth.vendor_id());

-- Income
CREATE POLICY "Vendors can manage own income" ON income
  FOR ALL USING (vendor_id = auth.vendor_id());

-- Scheduled Messages
CREATE POLICY "Vendors can manage own messages" ON scheduled_messages
  FOR ALL USING (vendor_id = auth.vendor_id());

-- Message Logs
CREATE POLICY "Vendors can view own message logs" ON message_logs
  FOR SELECT USING (vendor_id = auth.vendor_id());

-- Message Templates
CREATE POLICY "Vendors can manage own templates" ON message_templates
  FOR ALL USING (vendor_id = auth.vendor_id());

-- Bill Sequences
CREATE POLICY "Vendors can manage own bill sequence" ON bill_sequences
  FOR ALL USING (vendor_id = auth.vendor_id());

-- ============================================
-- MIGRATION 18: Default Data Function
-- ============================================
-- Creates default accounts and categories for new vendor

CREATE OR REPLACE FUNCTION create_vendor_defaults(p_vendor_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Create default accounts (vendor can add more with any name/type)
  INSERT INTO accounts (vendor_id, name, type, is_default) VALUES
    (p_vendor_id, 'Cash', 'Cash', TRUE);
    
  -- Create default expense categories
  INSERT INTO expense_categories (vendor_id, name) VALUES
    (p_vendor_id, 'Rent'),
    (p_vendor_id, 'Electricity'),
    (p_vendor_id, 'Supplies'),
    (p_vendor_id, 'Salary'),
    (p_vendor_id, 'Transport'),
    (p_vendor_id, 'Other');
    
  -- Initialize bill sequence
  INSERT INTO bill_sequences (vendor_id, last_number, prefix)
  VALUES (p_vendor_id, 0, 'INV');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Storage Bucket Setup

Create a storage bucket in Supabase for vendor logos:

1. Go to Supabase Dashboard > Storage
2. Create bucket named `vendor-assets`
3. Set as public bucket (logos need to be publicly accessible)
4. Create folder structure: `logos/{vendor_id}/`

---

## 5. Authentication System

### Overview

Custom authentication system (no Supabase Auth):
- Admin creates vendors with username and 5-digit PIN
- Vendor logs in with username + PIN
- Session token stored in HTTP-only cookie
- PIN is hashed before storage
- Session expires on browser close

### Auth Flow

```
1. Login Page
   └── User enters username + PIN
   └── POST /api/auth/login
       └── Validate credentials
       └── Create session token
       └── Store in vendor_sessions table
       └── Set HTTP-only cookie
       └── Redirect to dashboard

2. Protected Routes
   └── Middleware checks for session cookie
   └── Validates token against vendor_sessions
   └── Sets vendor context for RLS
   └── If invalid, redirect to login

3. Logout
   └── POST /api/auth/logout
   └── Delete session from database
   └── Clear cookie
   └── Redirect to login
```

### PIN Hashing

Use `bcrypt` for PIN hashing:
```
bun add bcryptjs @types/bcryptjs
```

Hash PIN with salt rounds = 10.

### Session Token

Generate secure random tokens:
```typescript
import { randomBytes } from 'crypto';
const token = randomBytes(32).toString('hex');
```

### Middleware Implementation

Create middleware at `src/middleware.ts`:
- Check for session cookie on protected routes
- Validate session token
- Set vendor_id in request context
- Pass vendor_id to Supabase RLS via `set_config`

### Admin vs Vendor

Differentiate by `is_admin` column in vendors table:
- Admin: Can access `/admin/*` routes
- Vendor: Can only access vendor routes

Admin has access to:
- Create/edit/deactivate vendors
- View all vendors' stats
- Manage WhatsApp templates
- View message logs across vendors

---

## 6. Project Structure

```
vendor-app/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth group (no layout)
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (vendor)/                 # Vendor routes (with bottom nav)
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── inventory/
│   │   │   │   ├── page.tsx          # List
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx      # Add new
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx      # Edit
│   │   │   ├── sales/
│   │   │   │   ├── page.tsx          # Sales history
│   │   │   │   └── new/
│   │   │   │       └── page.tsx      # New sale
│   │   │   ├── customers/
│   │   │   │   ├── page.tsx          # List
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx      # Customer detail
│   │   │   ├── expenses/
│   │   │   │   ├── page.tsx          # List
│   │   │   │   └── new/
│   │   │   │       └── page.tsx      # Add expense
│   │   │   ├── messages/
│   │   │   │   ├── page.tsx          # List
│   │   │   │   └── schedule/
│   │   │   │       └── page.tsx      # Schedule message
│   │   │   ├── settings/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx            # Vendor layout with bottom nav
│   │   │
│   │   ├── (admin)/                  # Admin routes
│   │   │   ├── admin/
│   │   │   │   ├── page.tsx          # Admin dashboard
│   │   │   │   ├── vendors/
│   │   │   │   │   ├── page.tsx      # List vendors
│   │   │   │   │   ├── new/
│   │   │   │   │   │   └── page.tsx  # Create vendor
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx  # Edit vendor
│   │   │   │   └── messages/
│   │   │   │       └── page.tsx      # Global message logs
│   │   │   └── layout.tsx
│   │   │
│   │   ├── bill/                     # Public bill viewing
│   │   │   └── [billId]/
│   │   │       └── page.tsx
│   │   │
│   │   ├── api/                      # API Routes
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   │   └── route.ts
│   │   │   │   └── logout/
│   │   │   │       └── route.ts
│   │   │   ├── vendors/
│   │   │   │   └── [...]/route.ts
│   │   │   ├── customers/
│   │   │   │   ├── route.ts          # GET list, POST create
│   │   │   │   ├── search/
│   │   │   │   │   └── route.ts      # GET search
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts      # GET, PATCH, DELETE
│   │   │   ├── inventory/
│   │   │   │   └── [...]/route.ts
│   │   │   ├── sales/
│   │   │   │   └── [...]/route.ts
│   │   │   ├── expenses/
│   │   │   │   └── [...]/route.ts
│   │   │   ├── accounts/
│   │   │   │   └── [...]/route.ts
│   │   │   ├── messages/
│   │   │   │   └── [...]/route.ts
│   │   │   ├── dashboard/
│   │   │   │   └── route.ts
│   │   │   ├── bills/
│   │   │   │   └── [billId]/
│   │   │   │       ├── route.ts      # GET bill data
│   │   │   │       └── pdf/
│   │   │   │           └── route.ts  # GET PDF
│   │   │   └── cron/
│   │   │       └── send-messages/
│   │   │           └── route.ts
│   │   │
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Redirect to login or dashboard
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── ui/                       # Base UI components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── modal.tsx
│   │   │   ├── select.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── loading.tsx
│   │   │   ├── empty-state.tsx
│   │   │   └── toast.tsx
│   │   │
│   │   ├── layout/                   # Layout components
│   │   │   ├── bottom-nav.tsx
│   │   │   ├── header.tsx
│   │   │   ├── page-header.tsx
│   │   │   └── safe-area.tsx
│   │   │
│   │   ├── forms/                    # Form components
│   │   │   ├── customer-form.tsx
│   │   │   ├── inventory-form.tsx
│   │   │   ├── expense-form.tsx
│   │   │   └── sale-form.tsx
│   │   │
│   │   ├── features/                 # Feature-specific components
│   │   │   ├── dashboard/
│   │   │   │   ├── stats-card.tsx
│   │   │   │   ├── chart.tsx
│   │   │   │   └── low-stock-alert.tsx
│   │   │   ├── sales/
│   │   │   │   ├── cart-item.tsx
│   │   │   │   ├── customer-search.tsx
│   │   │   │   └── item-picker.tsx
│   │   │   ├── inventory/
│   │   │   │   ├── inventory-card.tsx
│   │   │   │   └── stock-badge.tsx
│   │   │   └── bills/
│   │   │       ├── bill-preview.tsx
│   │   │       └── bill-pdf.tsx
│   │   │
│   │   └── providers/                # Context providers
│   │       ├── auth-provider.tsx
│   │       └── toast-provider.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts             # Browser client
│   │   │   ├── server.ts             # Server client
│   │   │   └── admin.ts              # Service role client
│   │   │
│   │   ├── utils/
│   │   │   ├── cn.ts                 # className utility
│   │   │   ├── format.ts             # Number/date formatting
│   │   │   ├── currency.ts           # INR formatting
│   │   │   └── validators.ts         # Zod schemas
│   │   │
│   │   └── constants/
│   │       └── index.ts              # App constants
│   │
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   ├── use-toast.ts
│   │   ├── use-debounce.ts
│   │   └── use-local-storage.ts
│   │
│   └── types/
│       ├── database.ts               # Database types
│       └── index.ts                  # App types
│
├── public/
│   ├── icons/                        # PWA icons
│   │   ├── icon-192.png
│   │   ├── icon-512.png
│   │   └── apple-touch-icon.png
│   ├── manifest.json                 # PWA manifest
│   └── sw.js                         # Service worker (generated)
│
├── .env.local                        # Environment variables
├── next.config.js                    # Next.js config
├── tailwind.config.ts                # Tailwind config
├── tsconfig.json                     # TypeScript config
└── package.json
```

---

## 7. Core Features Implementation

### 7.1 Dashboard

**Route**: `/dashboard`

**Data to Display**:
- Today's sales total
- Today's expenses total
- Net profit/loss (sales - expenses)
- This month's summary
- Low stock alerts (items where current_stock <= min_stock_alert)
- Recent 5 sales
- Quick action buttons

**Charts** (use Recharts or Chart.js):
- Monthly income vs expenses (bar chart)
- Sales by category (pie chart - optional)

**API Needed**: `GET /api/dashboard`
- Aggregate sales for today, this week, this month
- Aggregate expenses for same periods
- Get items with low stock
- Get recent sales

### 7.2 Inventory Management

**Routes**:
- `/inventory` - List all items
- `/inventory/new` - Add new item
- `/inventory/[id]` - Edit item

**Features**:
- List view with search/filter
- Category filter
- Low stock indicator (red badge)
- Add new item form
- Edit item (including manual stock adjustment)
- Delete item (soft delete via is_active)
- Show inventory total value (sum of stock × unit_price)

**List Item Card Shows**:
- Item name
- Current stock with unit
- Unit price
- Low stock badge if applicable
- Category tag

**Form Fields**:
- Name (required)
- Category (select or create new)
- Current stock (number)
- Unit (pcs, kg, ltr, etc.)
- Unit price (required)
- Cost price (optional, for profit calculation)
- Minimum stock alert level

### 7.3 New Sale Flow

**Route**: `/sales/new`

This is the most important flow. Must be fast and easy.

**Flow Steps**:

1. **Customer Selection** (Optional)
   - Text input with autocomplete
   - Shows matching customers as user types
   - Shows customer's purchase history count
   - Option to create new customer
   - Can skip (walk-in sale)

2. **Item Selection**
   - Search/browse inventory items
   - Tap to add to cart
   - Adjust quantity in cart
   - Show running subtotal

3. **Cart Review**
   - List of items with quantities
   - Quantity +/- buttons
   - Remove item button
   - Subtotal display
   - Discount input (amount or %)
   - Tax input (optional)
   - Total display

4. **Payment**
   - Select account (default account pre-selected)
   - Confirm sale
   - On success:
     - Subtract items from inventory
     - Create sale record
     - Create income record
     - Update account balance
     - Update customer stats (if linked)
     - Show success with bill link

5. **Bill Generation**
   - Show bill preview
   - WhatsApp share button
   - Download PDF button
   - Copy link button
   - Done button (return to dashboard)

**API Sequence**:
1. `GET /api/customers/search?q={name}` - Customer autocomplete
2. `GET /api/inventory` - Load inventory items
3. `POST /api/sales` - Create sale (handles all the cascading updates)

### 7.4 Customer Management

**Routes**:
- `/customers` - List all customers
- `/customers/[id]` - Customer detail

**List View**:
- Search by name
- Sort by: name, last purchase, total spent
- Each card shows: name, phone (if exists), purchase count, total spent

**Detail View**:
- Customer info (name, phone)
- Edit phone number button (for adding WhatsApp)
- Total purchases and total spent
- Purchase history (list of sales)
- Schedule message button (if phone exists)

### 7.5 Expense Tracking

**Routes**:
- `/expenses` - List with filters
- `/expenses/new` - Add expense

**List View**:
- Date filter (today, this week, this month, custom range)
- Category filter
- Account filter
- Total for filtered period

**Add Expense Form**:
- Category (select from preset or create)
- Amount (required)
- Account (required)
- Description
- Date (defaults to today)

### 7.6 Settings Page

**Route**: `/settings`

**Sections**:

1. **Profile Section**
   - View vendor name, business name, phone
   - Edit profile button (opens form/modal)

2. **Security Section**
   - Change PIN button
   - Opens modal/form:
     - Current PIN input (5 digits)
     - New PIN input (5 digits)
     - Confirm new PIN input
     - Validation: all fields required, new PIN must match confirm, current PIN must be correct
   - Success message on change

3. **Accounts Section**
   - List all accounts with:
     - Account name
     - Account type (free text like "Axis Bank", "PhonePe", "Cash")
     - Current balance
     - Default badge (star icon) on default account
   - Tap account to edit (name, type)
   - Set as default button (for non-default accounts)
   - Delete account button (disabled if has transactions)
   - Add new account button:
     - Name input (e.g., "Business Account")
     - Type input (e.g., "HDFC Bank", "Google Pay", "Cash Counter")
     - Save button

4. **Logout Button**
   - Prominent logout at bottom
   - Confirm dialog before logout

**Account Type Examples** (shown as placeholder hints):
- "Cash", "Petty Cash", "Cash Counter"
- "Axis Bank", "SBI Savings", "HDFC Current"
- "PhonePe", "Google Pay", "Paytm Business"
- "Personal", "Business", "Emergency Fund"

### 7.7 Scheduled Messages (Phase 4)

**Routes**:
- `/messages` - List scheduled/sent messages
- `/messages/schedule` - Create new scheduled message

**List View**:
- Filter by status (pending, sent, failed)
- Show scheduled date, customer, message preview
- Cancel pending message option

**Schedule Form**:
- Select customer (only shows customers with phone)
- Select message type
- Select template or write custom
- Pick date and time
- Preview message
- Schedule button

### 7.8 Bill Viewing (Public)

**Route**: `/bill/[billId]`

Public page (no auth required) that shows:
- Vendor business name and logo
- Bill number and date
- Customer name (if linked)
- Line items with quantities and prices
- Subtotal, discount, tax, total
- QR code for payment (UPI if available)
- Download PDF button
- Print button

**API**: `GET /api/bills/[billId]` - Returns bill data
**PDF**: `GET /api/bills/[billId]/pdf` - Returns PDF stream

---

## 8. API Routes

### Authentication

```
POST /api/auth/login
Request: { username: string, pin: string }
Response: { success: true, vendor: {...} } or { error: string }
Side effect: Sets HTTP-only cookie

POST /api/auth/logout
Response: { success: true }
Side effect: Clears cookie
```

### Customers

```
GET /api/customers
Query: ?search=name&sort=name|spent|recent&limit=50
Response: { customers: Customer[] }

GET /api/customers/search
Query: ?q=searchTerm
Response: { customers: Customer[] } (max 5, for autocomplete)

POST /api/customers
Request: { name: string, phone?: string }
Response: { customer: Customer }

GET /api/customers/[id]
Response: { customer: Customer, recentSales: Sale[] }

PATCH /api/customers/[id]
Request: { name?: string, phone?: string }
Response: { customer: Customer }

DELETE /api/customers/[id]
Response: { success: true }
```

### Inventory

```
GET /api/inventory
Query: ?category=id&lowStock=true&search=term
Response: { items: InventoryItem[], totalValue: number }

GET /api/inventory/categories
Response: { categories: Category[] }

POST /api/inventory
Request: { 
  name: string, 
  categoryId?: string,
  currentStock: number,
  unit: string,
  unitPrice: number,
  costPrice?: number,
  minStockAlert: number
}
Response: { item: InventoryItem }

PATCH /api/inventory/[id]
Request: { ...partial fields }
Response: { item: InventoryItem }

DELETE /api/inventory/[id]
Response: { success: true }
(Soft delete - sets is_active = false)
```

### Sales

```
GET /api/sales
Query: ?from=date&to=date&customerId=id&limit=50
Response: { sales: Sale[], total: number }

POST /api/sales
Request: {
  customerId?: string,
  customerName?: string,  // Creates new customer if not found
  accountId: string,
  items: Array<{
    inventoryItemId: string,
    quantity: number,
    unitPrice: number
  }>,
  discountAmount?: number,
  discountPercent?: number,
  taxAmount?: number,
  notes?: string
}
Response: { sale: Sale, billUrl: string }

Side effects:
- Subtracts inventory quantities
- Creates income record
- Updates account balance
- Creates/updates customer stats if linked
- Generates bill_id

GET /api/sales/[id]
Response: { sale: Sale, items: SaleItem[] }
```

### Bills

```
GET /api/bills/[billId]
(Public - no auth)
Response: { 
  bill: {
    billNumber: string,
    date: string,
    vendor: { name, logo, phone },
    customer?: { name },
    items: Array<{ name, qty, price, subtotal }>,
    subtotal: number,
    discount: number,
    tax: number,
    total: number,
    paymentMethod: string
  }
}

GET /api/bills/[billId]/pdf
(Public - no auth)
Response: PDF file stream
Headers: Content-Type: application/pdf
```

### Expenses

```
GET /api/expenses
Query: ?from=date&to=date&categoryId=id&accountId=id
Response: { expenses: Expense[], total: number }

GET /api/expenses/categories
Response: { categories: Category[] }

POST /api/expenses
Request: {
  categoryId: string,
  accountId: string,
  amount: number,
  description?: string,
  expenseDate?: string
}
Response: { expense: Expense }
Side effect: Updates account balance (subtract)

DELETE /api/expenses/[id]
Response: { success: true }
Side effect: Reverses account balance
```

### Accounts

```
GET /api/accounts
Response: { accounts: Account[], defaultAccountId: string }

POST /api/accounts
Request: { name: string, type: string }
Response: { account: Account }

PATCH /api/accounts/[id]
Request: { name?: string, type?: string }
Response: { account: Account }

POST /api/accounts/[id]/set-default
Response: { success: true }
Side effect: Sets this account as default, removes default from others

DELETE /api/accounts/[id]
Response: { success: true }
Note: Cannot delete account with transactions or if it's the only account
```

### Vendor Settings

```
GET /api/settings
Response: { vendor: Vendor }

PATCH /api/settings
Request: { name?: string, businessName?: string, phone?: string }
Response: { vendor: Vendor }

POST /api/settings/change-pin
Request: { currentPin: string, newPin: string }
Response: { success: true }
Validation: 
- currentPin must match
- newPin must be exactly 5 digits
```

### Dashboard

```
GET /api/dashboard
Query: ?period=today|week|month|custom&from=date&to=date
Response: {
  summary: {
    totalSales: number,
    totalExpenses: number,
    netProfit: number,
    transactionCount: number
  },
  salesByDay: Array<{ date, amount }>,
  expensesByCategory: Array<{ category, amount }>,
  lowStockItems: InventoryItem[],
  recentSales: Sale[],
  topSellingItems: Array<{ item, quantity, revenue }>
}
```

### Messages

```
GET /api/messages
Query: ?status=pending|sent|failed
Response: { messages: ScheduledMessage[] }

POST /api/messages/schedule
Request: {
  customerId: string,
  messageType: string,
  messageText: string,
  scheduledDate: string (ISO)
}
Response: { message: ScheduledMessage }

DELETE /api/messages/[id]
(Only for pending messages)
Response: { success: true }

POST /api/messages/send-now
Request: { customerId: string, messageText: string }
Response: { success: true, messageId: string }
```

### Admin Routes

```
GET /api/admin/vendors
Response: { vendors: Vendor[] }

POST /api/admin/vendors
Request: { 
  username: string, 
  pin: string, 
  name: string, 
  businessName: string,
  phone?: string
}
Response: { vendor: Vendor }
Side effect: Calls create_vendor_defaults function

PATCH /api/admin/vendors/[id]
Request: { ...partial fields, resetPin?: string }
Response: { vendor: Vendor }

POST /api/admin/vendors/[id]/deactivate
Response: { success: true }
```

### Cron

```
POST /api/cron/send-messages
Headers: Authorization: Bearer {CRON_SECRET}
- Called by Vercel Cron every hour
- Finds pending messages where scheduled_date <= now
- Sends via AiSensy API
- Updates status to 'sent' or 'failed'
- Creates message_log entries
```

---

## 9. UI Components

### Base Components (src/components/ui/)

#### Button

```
Variants: primary, secondary, ghost, danger
Sizes: sm, md, lg
Props: loading, disabled, icon, fullWidth
Mobile: min-height 48px, touch-friendly
```

#### Input

```
Types: text, number, tel, search, textarea
Features: label, error message, helper text, prefix, suffix
Mobile: 16px font size, proper padding
```

#### Card

```
Variants: default, interactive (with hover)
Features: header, body, footer slots
```

#### Modal / Sheet

```
Mobile-first: slides up from bottom (bottom sheet style)
Desktop: centered modal
Features: header, close button, body, footer actions
Backdrop click to close
```

#### Select

```
Mobile: opens native select or custom bottom sheet
Options with icons support
Searchable for long lists
```

#### Badge

```
Variants: default, success, warning, error, info
Sizes: sm, md
```

#### Loading

```
Types: spinner, skeleton, full-page
```

#### Empty State

```
Props: icon, title, description, action button
Used when lists are empty
```

#### Toast

```
Types: success, error, info, warning
Position: bottom center (above bottom nav)
Auto-dismiss after 3-4 seconds
```

### Layout Components (src/components/layout/)

#### BottomNav

```
5 tabs: Dashboard, Inventory, New Sale, Customers, More
Fixed at bottom
Safe area padding for iOS
Active state highlighting
"New Sale" can be emphasized (larger, different color)
```

#### Header

```
Shows on vendor pages
Contains: page title, optional actions
Sticky at top
```

#### PageHeader

```
For pages with back navigation
Contains: back button, title, optional action
```

#### SafeArea

```
Wrapper that adds safe-area-inset padding
For bottom nav and full-screen modals
```

### Feature Components

#### CustomerSearch (for new sale)

```
Input with debounced search
Shows dropdown with matches
Each result shows: name, purchase count
"+ Create new" option at bottom
Clear button
```

#### ItemPicker (for new sale)

```
Grid or list of inventory items
Search/filter
Tap to add to cart
Shows stock level
Disabled if out of stock
```

#### CartItem

```
Shows: item name, quantity, price, subtotal
+/- quantity buttons
Remove button
Inline editing
```

#### StatsCard (dashboard)

```
Icon, label, value
Optional: comparison to previous period
Color coding (green for positive, red for negative)
```

#### InventoryCard

```
Item name, category tag
Stock level with unit
Price
Low stock badge
Tap to edit
```

#### StockBadge

```
Shows stock status: In Stock (green), Low Stock (yellow), Out of Stock (red)
```

---

## 10. PWA Configuration

### Manifest (public/manifest.json)

```json
{
  "name": "Vendor Manager",
  "short_name": "Vendor",
  "description": "Manage your business inventory, sales, and customers",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#FAF9F7",
  "theme_color": "#D97757",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### next.config.js with PWA

```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});

module.exports = withPWA({
  // other Next.js config
});
```

### App Icons Needed

Create these icons for PWA:
- `/public/icons/icon-192.png` (192x192)
- `/public/icons/icon-512.png` (512x512)
- `/public/icons/apple-touch-icon.png` (180x180)
- `/public/favicon.ico` (32x32)

Use the brand color (#D97757) as background with a simple vendor/shop icon.

### Root Layout Meta Tags

```tsx
// src/app/layout.tsx
export const metadata = {
  title: 'Vendor Manager',
  description: 'Manage your business inventory, sales, and customers',
  manifest: '/manifest.json',
  themeColor: '#D97757',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Vendor Manager',
  },
};
```

---

## 11. Supabase Configuration

### Client Setup

Create three Supabase clients for different contexts:

#### Browser Client (src/lib/supabase/client.ts)

```typescript
// For client components
// Uses anon key
// Create once, reuse
```

#### Server Client (src/lib/supabase/server.ts)

```typescript
// For server components and API routes
// Uses anon key with cookies for auth
// Creates per-request
// Sets vendor_id for RLS using set_config
```

#### Admin Client (src/lib/supabase/admin.ts)

```typescript
// For admin operations and cron jobs
// Uses service role key
// Bypasses RLS
// Only use in trusted server contexts
```

### RLS Setup for API Routes

In each API route, after validating the session:

```typescript
// Set the vendor_id for RLS policies
await supabase.rpc('set_config', {
  setting_name: 'app.current_vendor_id',
  setting_value: vendorId
});
```

Or use Supabase's built-in way if available.

### Storage Configuration

For vendor logos:
- Bucket: `vendor-assets`
- Path pattern: `logos/{vendor_id}/logo.{ext}`
- Public access for reading
- Authenticated access for writing

---

## 12. Build Phases

### Phase 1: Foundation & Core Features

**Goal**: Working app with inventory, sales, and bills

**Tasks**:

1. **Project Setup**
   - Initialize Next.js with TypeScript and Tailwind
   - Configure Supabase clients (browser, server, admin)
   - Set up project folder structure
   - Create base UI components (button, input, card, modal, select, badge, loading, toast)
   - Configure Tailwind with custom theme (Claude/Anthropic colors)

2. **Database Setup**
   - Run all migrations in Supabase SQL Editor
   - Set up RLS policies
   - Create storage bucket for vendor assets
   - Test RLS with sample data

3. **Authentication System**
   - Create login page (username + 5-digit PIN)
   - Implement login API route with PIN hashing (bcrypt)
   - Set up session management (vendor_sessions table)
   - Create middleware for protected routes
   - Implement logout functionality
   - Handle session validation and vendor context for RLS

4. **Layout & Navigation**
   - Create vendor layout with bottom navigation (5 tabs)
   - Create header component with page titles
   - Implement safe area handling for mobile
   - Create page transition patterns
   - Set up loading and error states

5. **Inventory Management**
   - Inventory list page with search functionality
   - Add new inventory item form/page
   - Edit inventory item page
   - Delete (soft delete via is_active flag)
   - Category management (create, list)
   - Low stock highlighting with visual indicators
   - Display total inventory value

6. **Accounts (Basic)**
   - List accounts API endpoint
   - Default "Cash" account created on vendor creation (via SQL function)
   - Display accounts list

7. **Sales Flow (Basic)**
   - New sale page with item selection
   - Cart functionality (add items, adjust quantity, remove items)
   - Account selection for payment (uses default account)
   - Discount input (amount or percentage)
   - Create sale API (handles: inventory deduction, income creation, account balance update)
   - Success screen with bill link

8. **Bill Viewing (Public)**
   - Public bill page at `/bill/[billId]`
   - Display: vendor info, bill number, date, items, totals
   - Basic responsive styling
   - Copy link functionality

**Deliverable**: Vendor can log in, manage inventory, create sales, and view/share bills

---

### Phase 2: Complete Vendor Experience

**Goal**: Full-featured single-vendor application

**Tasks**:

1. **Customer Management**
   - Customer list page with search
   - Customer search/autocomplete component for sales
   - Create customer during sale flow
   - Customer detail page showing purchase history
   - Add/edit customer phone number
   - Customer stats display (total purchases, total spent)

2. **Enhanced Sales Flow**
   - Integrate customer selection into sale flow
   - Update customer stats on sale completion
   - Show customer name on bills
   - Pre-select default account in payment step

3. **Expense Tracking**
   - Expense list page with filters (date, category, account)
   - Add expense form with category selection
   - Expense category management
   - Update account balance on expense creation
   - Delete expense (with balance reversal)

4. **Dashboard**
   - Stats cards (today's sales, today's expenses, net profit)
   - Period selector (today, this week, this month)
   - Simple bar chart (income vs expenses by month)
   - Low stock alerts list
   - Recent sales list (last 5)
   - Quick action buttons (New Sale, Add Expense)

5. **Bill PDF Generation**
   - Set up @react-pdf/renderer
   - Create PDF template matching bill design
   - Add QR code for UPI payments
   - On-demand PDF generation endpoint
   - WhatsApp share button (opens WhatsApp with bill URL)
   - Download PDF button

6. **Settings Page (Complete)**
   - **Profile Section**: View/edit vendor name, business name, phone
   - **Security Section**: 
     - Change PIN functionality
     - Current PIN validation
     - New PIN input (5 digits) with confirmation
     - Success/error feedback
   - **Accounts Section**:
     - List all accounts with name, type (free-text), balance
     - Default account indicator (star badge)
     - Add new account (name + type input)
     - Edit account (name, type)
     - Set account as default
     - Delete account (only if no transactions)
   - **Logout button** with confirmation dialog

7. **PWA Setup**
   - Configure next-pwa
   - Create manifest.json
   - Create app icons (192px, 512px, apple-touch)
   - Test installation on mobile devices

**Deliverable**: Complete vendor app with customers, expenses, dashboard, settings, and PWA

---

### Phase 3: Admin & Multi-Tenancy

**Goal**: Support multiple vendors with admin management

**Tasks**:

1. **Admin Authentication**
   - Admin login (same system, checks is_admin flag)
   - Redirect admin to `/admin` dashboard
   - Admin-specific middleware validation
   - Admin layout with different navigation

2. **Admin Dashboard**
   - Total vendors count (active/inactive)
   - Total sales across all vendors
   - Total messages sent (placeholder for Phase 4)
   - Platform revenue summary
   - Recent activity feed

3. **Vendor Management**
   - List all vendors with status
   - Create new vendor form:
     - Username (unique)
     - 5-digit PIN
     - Name, business name, phone
     - Auto-calls create_vendor_defaults function
   - Edit vendor details
   - Reset vendor PIN (admin sets new PIN)
   - Deactivate/reactivate vendor
   - View individual vendor stats

4. **Multi-Tenancy Testing**
   - Create multiple test vendor accounts
   - Verify RLS isolation works correctly
   - Test that no cross-vendor data access is possible
   - Test admin can view all vendors

5. **Performance & Polish**
   - Image optimization with Next.js Image
   - Implement proper error boundaries
   - Add loading skeletons for all lists
   - Create empty state components
   - Database query optimization review
   - Add any missing indexes

6. **Edge Cases & Error Handling**
   - Handle negative stock gracefully (allow with warning)
   - Handle deleted items in sales history
   - Consistent API error responses
   - User-friendly error messages
   - Form validation with Zod

7. **Mobile Testing & Fixes**
   - Test on various mobile devices (iOS, Android)
   - Fix any touch/scroll issues
   - Verify safe areas work correctly
   - Test on slow network connections

**Deliverable**: Production-ready multi-tenant platform with admin controls

---

### Phase 4: WhatsApp Integration

**Goal**: Complete messaging functionality

**Tasks**:

1. **AiSensy Setup**
   - Create AiSensy account
   - Get API credentials
   - Create and submit message templates for approval:
     - Maintenance reminder template
     - Service notification template
     - Promotional message template
   - Test API connectivity

2. **AiSensy API Client**
   - Create API client wrapper for AiSensy
   - Implement send message function
   - Handle API responses and errors
   - Log all API calls

3. **Message Scheduling**
   - Schedule message form/page
   - Customer selection (only customers with phone number)
   - Message type selection
   - Template selection or custom message input
   - Date/time picker for scheduling
   - Save to scheduled_messages table
   - Validation (customer has phone, date is future)

4. **Scheduled Messages Management**
   - List pending messages
   - List sent messages
   - List failed messages
   - Filter by status
   - Cancel pending message functionality
   - Retry failed message

5. **Message Templates (Vendor)**
   - List vendor's custom templates
   - Create new template
   - Edit existing template
   - Delete template
   - Use template when scheduling

6. **Cron Job Setup**
   - Create Vercel cron configuration (hourly)
   - Implement `/api/cron/send-messages` endpoint:
     - Find messages where scheduled_date <= now AND status = 'pending'
     - Send via AiSensy API
     - Update status to 'sent' or 'failed'
     - Store error message if failed
     - Create entry in message_logs
   - Add CRON_SECRET for security
   - Test cron job execution

7. **Message Logs**
   - Vendor: View their own message logs
   - Admin: View all message logs across vendors
   - Filter by vendor (admin), date, status
   - Cost tracking per message
   - Export functionality (optional)

8. **Testing & Refinement**
   - Test complete message scheduling flow
   - Test cron job sends messages correctly
   - Test failure handling and retry
   - Test with real WhatsApp numbers
   - Monitor delivery rates
   - Add retry logic with exponential backoff if needed

**Deliverable**: Complete WhatsApp messaging system with scheduling, templates, and delivery tracking

---

## Phase Summary

| Phase | Focus | Key Deliverables |
|-------|-------|------------------|
| **Phase 1** | Foundation | Auth, Inventory, Sales, Bills |
| **Phase 2** | Vendor Experience | Customers, Expenses, Dashboard, Settings (PIN + Accounts), PWA |
| **Phase 3** | Admin & Scale | Multi-tenancy, Admin panel, Polish, Testing |
| **Phase 4** | Messaging | WhatsApp integration via AiSensy, Scheduling, Templates |

---

## 13. Important Notes

### Security Considerations

1. **PIN Storage**: Always hash PINs with bcrypt before storing
2. **Session Tokens**: Use cryptographically random tokens, store hashed in DB
3. **RLS**: Never bypass RLS except in admin/cron contexts
4. **Input Validation**: Validate all inputs with Zod schemas
5. **SQL Injection**: Use Supabase client (parameterized queries)
6. **CORS**: Configure properly for API routes
7. **Rate Limiting**: Consider for login and public endpoints

### Performance Tips

1. **Database**:
   - Use indexes (already defined in migrations)
   - Limit query results
   - Use pagination for long lists

2. **Frontend**:
   - Lazy load non-critical components
   - Use React.memo for list items
   - Debounce search inputs (300ms)
   - Cache dashboard data briefly

3. **Images**:
   - Compress vendor logos on upload
   - Use Next.js Image component
   - Set proper cache headers

### Error Messages

Keep error messages user-friendly:
- "Something went wrong. Please try again."
- "Could not save. Check your connection."
- "Item not found."
- Never expose technical errors to users

### Date/Time Handling

- Store all dates in UTC (Supabase does this)
- Display in user's timezone (use browser locale)
- Use date-fns for formatting
- Format: "28 Dec 2025" or "Today, 3:45 PM"

### Currency Formatting

- Currency: INR (₹)
- Format: ₹1,234.00
- Use Intl.NumberFormat
- Round to 2 decimal places
- Consider: Should small vendors need paise? If not, round to whole numbers.

### Mobile UX Patterns

1. **Pull to Refresh**: Implement on list pages
2. **Infinite Scroll**: For long lists (customers, sales history)
3. **Swipe Actions**: Optional for delete/quick actions
4. **Bottom Sheet**: For filters, options, forms
5. **Haptic Feedback**: Optional for button presses
6. **Keyboard**: Close on outside tap, scroll into view

### Accessibility

1. Use semantic HTML
2. Proper heading hierarchy
3. Touch targets minimum 48px
4. Color contrast (already good with chosen palette)
5. Focus states for keyboard navigation
6. Screen reader labels for icons

### WhatsApp Integration Notes

1. Templates must be pre-approved in AiSensy dashboard
2. Template variables: {{1}}, {{2}}, etc.
3. Some message types require opt-in from customer
4. Costs vary by message category:
   - Marketing: ₹0.88
   - Utility: ₹0.125
   - Service: Free
5. Failed messages should retry with exponential backoff

### Testing Checklist

Before going live:
- [ ] Login/logout flow works
- [ ] Session expires correctly
- [ ] Inventory CRUD works
- [ ] Sales flow complete
- [ ] Bills generate correctly
- [ ] PDF download works
- [ ] Expenses track properly
- [ ] Account balances update
- [ ] Customer linking works
- [ ] Dashboard shows correct data
- [ ] Messages schedule and send
- [ ] Admin can create vendors
- [ ] RLS prevents cross-vendor access
- [ ] PWA installs correctly
- [ ] Works offline (shell)
- [ ] Works on slow networks

---

## Quick Reference

### Key Files to Create First

1. `src/lib/supabase/client.ts` - Supabase browser client
2. `src/lib/supabase/server.ts` - Supabase server client
3. `src/middleware.ts` - Auth middleware
4. `src/components/ui/button.tsx` - Primary UI component
5. `src/app/(auth)/login/page.tsx` - Login page
6. `src/app/(vendor)/layout.tsx` - Vendor layout with nav

### Environment Variables Needed

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
CRON_SECRET=
AISENSY_API_KEY=
```

### Vercel Configuration

Create `vercel.json` for cron:
```json
{
  "crons": [
    {
      "path": "/api/cron/send-messages",
      "schedule": "0 * * * *"
    }
  ]
}
```

---

**End of Implementation Plan**

This document should be given to Claude Code along with the original PRD for complete context. Follow the phases in order, and refer back to this document for specific implementation details.
