# Local Vendor Management App - Implementation Plan

> **Purpose**: This document is the complete implementation guide for the Local Vendor Management App. Updated to reflect actual implementation decisions and features.

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
14. [Key Decisions & Changes](#14-key-decisions--changes)

---

## 1. Tech Stack & Tools

### Core Stack

| Technology | Purpose |
|------------|---------|
| **Bun/npm** | Package manager and local runtime |
| **Next.js 14+** | Full-stack React framework (App Router) |
| **TypeScript** | Type safety |
| **Supabase** | PostgreSQL database, Storage, Row Level Security |
| **Vercel** | Deployment and hosting |

### Key Libraries Installed

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
```

---

## 2. Project Setup

### Initialize Project

```bash
bunx create-next-app@latest kuberbook --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd kuberbook
```

### Commands

Use `bun` or `npm`:
- `npm install` - Install dependencies
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm add <package>` - Add dependency

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

The app follows Claude AI / Anthropic's interface style:
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
}
```

### Mobile-First Principles

1. **Touch Targets**: All interactive elements minimum 48x48px
2. **Font Size**: Never below 14px, inputs always 16px (prevents iOS zoom)
3. **Spacing**: Generous padding, at least 16px on sides
4. **Bottom Navigation**: Fixed, always accessible with thumb
5. **Safe Areas**: Respect notch and home indicator on iOS
6. **Thumb Zone**: Place primary actions in bottom half of screen

---

## 4. Database Schema & Migrations

### Overview

All tables use UUID primary keys. Every table (except `vendors`) has a `vendor_id` foreign key for multi-tenancy. Row Level Security (RLS) ensures data isolation.

### Key Tables

The database includes:
- `vendors` - Vendor accounts with authentication
- `accounts` - Money tracking (Cash, Bank, UPI, etc.)
- `customers` - Customer information
- `inventory_categories` - Product categories
- `inventory_items` - Products/services
- `sales` - Sale records
- `sale_items` - Line items with **warranty and maintenance tracking**
- `expense_categories` - Expense categories
- `expenses` - Expense records
- `income` - Non-sale income
- `scheduled_messages` - **Reminders/maintenance alerts**
- `message_logs` - Message history
- `vendor_sessions` - Authentication sessions
- `bill_sequences` - Bill number generation

### Warranty & Maintenance Tracking (Added)

The `sale_items` table includes:
```sql
warranty_months INTEGER,           -- Warranty period in months
maintenance_interval_months INTEGER -- Service interval in months
```

The `scheduled_messages` table was enhanced for reminders:
```sql
reminder_type VARCHAR(50),         -- 'maintenance', 'warranty', 'follow_up', 'custom'
sent_count INTEGER DEFAULT 0,      -- Number of times reminder was sent
item_name VARCHAR(255),            -- Equipment/product name
time_slot VARCHAR(50),             -- Preferred time slot
last_sent_at TIMESTAMPTZ,          -- Last time reminder was sent
completed_at TIMESTAMPTZ,          -- When service was completed
related_sale_id UUID,              -- Link to original sale
related_sale_item_id UUID          -- Link to specific item
```

---

## 5. Authentication System

### Overview

Custom authentication system (no Supabase Auth):
- Admin creates vendors with username and 5-digit PIN
- Vendor logs in with username + PIN
- Session token stored in HTTP-only cookie
- PIN is hashed with bcrypt before storage
- Session expires on browser close

### Auth Flow

```
1. Login Page
   - User enters username + PIN
   - POST /api/auth/login
   - Validate credentials
   - Create session token
   - Store in vendor_sessions table
   - Set HTTP-only cookie
   - Redirect to dashboard

2. Protected Routes
   - Middleware checks for session cookie
   - Validates token against vendor_sessions
   - Sets vendor context for RLS
   - If invalid, redirect to login

3. Logout
   - POST /api/auth/logout
   - Delete session from database
   - Clear cookie
   - Redirect to login
```

---

## 6. Project Structure

```
kuberbook/
├── src/
│   ├── app/
│   │   ├── (auth)/login/
│   │   ├── (vendor)/
│   │   │   ├── dashboard/
│   │   │   ├── inventory/
│   │   │   ├── sales/
│   │   │   ├── customers/
│   │   │   ├── expenses/
│   │   │   ├── reminders/          # Changed from messages/
│   │   │   ├── settings/
│   │   │   └── layout.tsx
│   │   ├── (admin)/admin/
│   │   ├── bill/[billId]/
│   │   └── api/
│   │       ├── auth/
│   │       ├── customers/
│   │       ├── inventory/
│   │       ├── sales/
│   │       ├── expenses/
│   │       ├── accounts/
│   │       ├── reminders/          # Reminder management
│   │       ├── dashboard/
│   │       ├── bills/
│   │       └── settings/
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── forms/
│   │   └── features/
│   ├── lib/
│   │   ├── supabase/
│   │   └── utils/
│   │       └── whatsapp.ts         # WhatsApp deep link utilities
│   ├── hooks/
│   └── types/
├── public/
├── supabase/
│   └── migrations/
└── package.json
```

---

## 7. Core Features Implementation

### 7.1 Dashboard

**Route**: `/dashboard`

**Data Displayed**:
- Today's sales total
- Today's expenses total
- Net profit/loss
- This month's summary
- Low stock alerts
- Recent 5 sales
- Quick action buttons

### 7.2 Inventory Management

**Routes**:
- `/inventory` - List all items
- `/inventory/new` - Add new item
- `/inventory/[id]` - Edit item

**Features**:
- List view with search/filter
- Category filter
- Low stock indicator
- Add/edit/delete items
- Total inventory value display

### 7.3 New Sale Flow with Warranty Tracking

**Route**: `/sales/new`

**Flow Steps**:

1. **Customer Selection** (Optional)
   - Text input with autocomplete
   - Option to create new customer with phone
   - Can skip (walk-in sale)

2. **Item Selection**
   - Search/browse inventory items
   - Tap to add to cart
   - Adjust quantity in cart

3. **Warranty & Maintenance (Per Item)**
   - **Expandable section per cart item**
   - Warranty input: value + unit selector (months/years)
   - Service interval dropdown: 1, 2, 3, 6, 12 months
   - Auto-schedules maintenance reminder on sale completion

4. **Cart Review**
   - List of items with quantities
   - Discount input
   - Total display

5. **Payment & Completion**
   - Select account
   - On success:
     - Create sale record with warranty info
     - Auto-schedule maintenance reminders
     - Show success with bill link

### 7.4 Customer Management

**Routes**:
- `/customers` - List all customers
- `/customers/[id]` - Customer detail with items & warranty status

**Detail View Includes**:
- Customer info (name, phone)
- Total purchases and total spent
- **Items & Warranty Section** - Shows all purchased items with warranty status (Active/Expired)
- Purchase history

### 7.5 Reminders Page (Replaces Messages)

**Route**: `/reminders`

**Tabs**:
- **Overdue** - Past due reminders (red highlighting)
- **Today** - Reminders for today
- **Upcoming** - Future reminders
- **Done** - Completed reminders

**Reminder Card Shows**:
- Item/equipment name
- Customer name
- Scheduled date
- Sent count (how many times reminder was sent)
- Status badge

**Actions**:
- **Send WhatsApp** - Opens wa.me deep link with formatted message
- **Mark as Done** - Mark service as completed
- **Reschedule** - Change reminder date
- **Delete** - Remove reminder

**Add Reminder Feature**:
- Add button in header
- Modal with:
  - Customer search or new customer entry
  - Item/equipment name
  - Warranty (optional)
  - Service interval
  - Reminder date
  - Notes

### 7.6 WhatsApp Integration (Manual via Deep Links)

**Decision**: Dropped WhatsApp Cloud API / AiSensy in favor of manual WhatsApp sending via deep links.

**Reason**: Vendor doesn't want a separate WhatsApp business number. Manual approach uses their existing personal/business WhatsApp.

**Implementation** (`/src/lib/utils/whatsapp.ts`):

```typescript
// Creates wa.me deep link with URL-encoded message
export function createWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  const fullPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
}
```

**Message Types**:

1. **Maintenance Reminder** (Health/urgency focused for water purifier business):
```
Hi *CustomerName*,

*MAINTENANCE ALERT*

*Date:* January 15, 2025
*Time:* Morning

Your *RO Water Purifier* needs servicing to keep your drinking water safe.

Skipping maintenance can lead to:
- Impure water
- Bacterial growth
- Filter damage

Let's keep your family healthy!

*Reply 1 to Confirm*
*Reply 2 to Reschedule*

_Business Name_
```

2. **Follow-up Reminder** (For overdue items):
```
Hi *CustomerName*,

We noticed your *RO Water Purifier* service is still pending.

Regular maintenance is important for clean, healthy drinking water.

Please let us know a convenient time to schedule your service.

*Reply 1 to Schedule Now*

_Business Name_
```

3. **Bill Share** (No link, just details):
```
Thank you for your purchase!

*Bill Details*
Date: January 15, 2025
Bill No: INV-000123

*Items:*
- RO Water Purifier x 1 = Rs.15,000

*Total: Rs.15,000*

_Business Name_
```

**Important Notes**:
- No emojis in messages (they show as `?` in deep links)
- Use `Rs.` instead of `₹` symbol
- Use `*text*` for bold formatting
- Use `_text_` for italic formatting
- Actual newlines, not `\n` or `<br>`

### 7.7 Settings Page

**Route**: `/settings`

**Sections**:
1. **Profile** - View/edit vendor name, business name, phone
2. **Security** - Change PIN
3. **Accounts** - Manage payment accounts (Cash, Bank, UPI)
4. **Logout**

---

## 8. API Routes

### Reminders API (New)

```
GET /api/reminders
Query: ?status=pending|sent|completed
Response: { success: true, data: Reminder[] }

POST /api/reminders
Request: {
  customerId?: string,
  customerName?: string,      // Creates new customer if no customerId
  customerPhone?: string,
  itemName: string,
  scheduledDate: string,
  warrantyMonths?: number,
  maintenanceIntervalMonths?: number,
  notes?: string
}
Response: { success: true, data: Reminder }

PATCH /api/reminders/[id]
Request: {
  action: 'mark_sent' | 'mark_completed' | 'reschedule',
  scheduled_date?: string     // Required for reschedule
}
Response: { success: true, data: Reminder }

DELETE /api/reminders/[id]
Response: { success: true }
```

### Other APIs

Standard CRUD APIs for:
- `/api/customers` - Customer management with search
- `/api/inventory` - Inventory management
- `/api/sales` - Sales with warranty/maintenance scheduling
- `/api/expenses` - Expense tracking
- `/api/accounts` - Payment account management
- `/api/bills/[billId]` - Public bill viewing
- `/api/dashboard` - Dashboard statistics

---

## 9. UI Components

### Base Components

- **Button** - Primary, secondary, ghost, danger variants
- **Input** - Text, number, tel, search, textarea
- **Card** - Default and interactive variants
- **Modal** - Bottom sheet on mobile, centered on desktop, **scrollable content**
- **Select** - Native select with custom styling
- **Badge** - Status indicators
- **Loading** - Spinners and skeletons
- **EmptyState** - For empty lists
- **Toast** - Success/error notifications

### Layout Components

- **BottomNav** - 5 tabs: Dashboard, Inventory, New Sale, Customers, Reminders
- **PageHeader** - Page titles with optional actions
- **SafeArea** - Mobile safe area handling

---

## 10. PWA Configuration

### Manifest

```json
{
  "name": "Kuberbook",
  "short_name": "Kuberbook",
  "description": "Manage your business inventory, sales, and customers",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#FAF9F7",
  "theme_color": "#D97757"
}
```

---

## 11. Supabase Configuration

### Client Setup

Three Supabase clients:
- **Browser Client** - For client components (anon key)
- **Server Client** - For server components and API routes
- **Admin Client** - For admin operations (service role key, bypasses RLS)

---

## 12. Build Phases

### Phase 1: Foundation & Core Features (Completed)

- Project setup with Next.js, TypeScript, Tailwind
- Supabase integration
- Authentication system
- Layout & navigation
- Inventory management
- Accounts management
- Basic sales flow
- Bill viewing

### Phase 2: Complete Vendor Experience (Completed)

- Customer management
- Enhanced sales flow with warranty tracking
- Expense tracking
- Dashboard
- Bill PDF generation
- Settings page with PIN change
- PWA setup

### Phase 3: Admin & Multi-Tenancy (Completed)

- Admin authentication and dashboard
- Vendor management (create, edit, activate/deactivate)
- Multi-tenancy with RLS
- Performance optimization

### Phase 4: WhatsApp & Reminders (Completed - Modified Approach)

**Original Plan**: WhatsApp Cloud API via AiSensy with scheduled automated sending

**Actual Implementation**: Manual WhatsApp via deep links with reminder management

**Why Changed**:
- Vendor doesn't want a separate WhatsApp business number
- Manual approach uses their existing WhatsApp
- No API costs or template approval delays
- More personal touch for customer relationships

**What Was Built**:
- Reminders page with tabs (Overdue, Today, Upcoming, Done)
- Manual WhatsApp sending via wa.me deep links
- Health-focused maintenance messages for water purifier business
- Add reminder feature for existing/old customers
- Reminder tracking (sent count, last sent, completed)
- Auto-schedule reminders when selling items with service intervals

---

## 13. Important Notes

### WhatsApp Deep Link Limitations

1. **No Emojis** - They show as `?` when URL encoded
2. **Use Text Alternatives** - `Rs.` instead of `₹`, etc.
3. **Manual Sending** - User must tap send in WhatsApp
4. **No Delivery Tracking** - Can't track if message was delivered
5. **Phone Format** - Must be in international format (91XXXXXXXXXX)

### Currency Formatting

- Currency: INR
- Format: Rs.1,234 (use `Rs.` in WhatsApp messages)
- Display: Use `₹` symbol in the app UI

### Mobile UX

1. **Bottom Sheet Modals** - Slide up from bottom on mobile
2. **Scrollable Modals** - Fixed header, scrollable content
3. **Touch Targets** - Minimum 48px for all interactive elements
4. **Safe Areas** - Respect notch and home indicator

---

## 14. Key Decisions & Changes

### WhatsApp Strategy Change

| Original Plan | Actual Implementation |
|---------------|----------------------|
| WhatsApp Cloud API via AiSensy | Manual WhatsApp via wa.me deep links |
| Automated scheduled sending | Manual send with reminder dashboard |
| Separate business number required | Uses vendor's existing WhatsApp |
| API costs per message | Free |
| Template approval required | No approval needed |
| Delivery tracking available | No tracking |

**Reason**: Vendor doesn't want to manage a separate WhatsApp business number. The manual approach is simpler and more personal.

### Warranty & Maintenance Tracking

Added per-item warranty and service interval tracking:
- Warranty period (months/years)
- Maintenance interval (1, 2, 3, 6, 12 months)
- Auto-schedule reminders on sale
- Track warranty status (Active/Expired)

### Message Content Changes

- **Removed emojis** - They don't encode properly in URLs
- **Removed bill links** - Keep messages simple
- **Added reply instructions** - "Reply 1 to Confirm / Reply 2 to Reschedule"
- **Health/urgency focus** - Water purifier-specific messaging about health risks

### Navigation Change

- **Messages tab renamed to Reminders** - Better reflects the manual workflow
- **Reminders page** - Dashboard-style with tabs instead of message list

### Modal UI Fix

- **Added scrollable content** - Modal content now scrolls properly for long forms
- **Fixed header** - Title stays visible while scrolling

---

## Quick Reference

### Key Files

| File | Purpose |
|------|---------|
| `/src/lib/utils/whatsapp.ts` | WhatsApp deep link generation & message templates |
| `/src/app/(vendor)/reminders/page.tsx` | Reminders dashboard with tabs |
| `/src/app/api/reminders/route.ts` | Reminders API (GET, POST) |
| `/src/app/api/reminders/[id]/route.ts` | Single reminder API (PATCH, DELETE) |
| `/src/components/ui/modal.tsx` | Scrollable modal component |
| `/src/app/(vendor)/sales/new/page.tsx` | Sale flow with warranty inputs |
| `/src/app/(vendor)/customers/[id]/page.tsx` | Customer profile with items & warranty |

### WhatsApp Message Functions

```typescript
import {
  createWhatsAppLink,
  generateMaintenanceReminderMessage,
  generateFollowUpReminderMessage,
  generateBillMessage,
  formatItemsForBill
} from '@/lib/utils/whatsapp';

// Generate maintenance reminder
const message = generateMaintenanceReminderMessage({
  customerName: 'John',
  itemName: 'RO Water Purifier',
  scheduledDate: 'January 15, 2025',
  timeSlot: 'Morning',
  businessName: 'My Business'
});

// Create WhatsApp link
const link = createWhatsAppLink('9876543210', message);
window.open(link, '_blank');
```

---

**End of Implementation Plan**

*Last Updated: January 2025*
*Reflects actual implementation with WhatsApp deep links and reminder management system*
