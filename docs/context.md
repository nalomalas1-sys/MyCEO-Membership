# LMS for Parents — App Flow & Features

> **Purpose:** A parent-focused LMS subscription platform where parents subscribe (via Stripe), add children, and track their kids' progress learning money and entrepreneurship. Kids access content through a child code, complete modules, create a virtual company, and earn achievements. Admins manage content and monitor system-wide metrics.

---

### Tech Stack
Frontend: React, TailWindCSS
Backend/Storage: SUPABASE
Payment: Stripe

---

## 📋 Table of Contents

1. [Overview & Goals](#1-overview--goals)
2. [User Roles & Permissions](#2-user-roles--permissions)
3. [Screens & User Flows](#3-screens--user-flows)
   - [Landing Page (Parent)](#31-landing-page-parent)
   - [Plan Selection & Subscription Flow](#32-plan-selection--subscription-flow-parent)
   - [Parent Dashboard](#33-parent-dashboard-after-login)
   - [Child Dashboard](#34-child-dashboard-access-via-code)
   - [Admin Dashboard](#35-admin-dashboard)
4. [Data Model (Entities)](#4-data-model-entities)
5. [API Surface / Endpoints](#5-api-surface--endpoints-suggested)
6. [Stripe Integration & Billing Flow](#6-stripe-integration--billing-flow)
7. [Authentication & Security](#7-authentication--security)
8. [UI/UX Notes & Wireframe Guidance](#8-uiux-notes--wireframe-guidance)
9. [Achievements, Progress & Scoring](#9-achievements-progress--scoring)
10. [Notifications & Emails](#10-notifications--emails)
11. [Error States & Edge Cases](#11-error-states--edge-cases)
12. [Acceptance Criteria / Test Cases](#12-acceptance-criteria--test-cases-example)
13. [MVP vs Later Phases](#13-mvp-vs-later-phases)
14. [Suggested Tech Stack & Infra](#14-suggested-tech-stack--infra)
15. [Analytics & KPIs](#15-analytics--kpis)
16. [Appendix](#appendix-small-examples)

---

## 1. Overview & Goals

### Target Audience
**Parents** paying for a subscription so their **children (age 6–16)** can learn money skills and entrepreneurship.

### Core Value Proposition
- ✅ Simple parental onboarding and subscription management
- ✅ Clear child access via unique code
- ✅ Structured learning modules with progress tracking
- ✅ Gamified achievements and virtual company builder

### Non-Functional Requirements
- 🚀 **Scalability:** Easy to scale as user base grows
- 🔒 **Security:** Secure payment handling via Stripe
- 👶 **Compliance:** GDPR and child-data best practices
- 📱 **Responsive:** Mobile-friendly UX across devices

---

## 2. User Roles & Permissions

### Roles Overview

| Role | Description | Access Level |
|------|-------------|--------------|
| **👨‍👩‍👧‍👦 Parent** | Primary account holder who manages subscriptions and children | Subscription & child management |
| **👶 Child** | End-user learner who accesses content via code | Learning content & company builder |
| **⚙️ Admin** | Platform administrator with full CMS access | Full system management |

### Permissions Matrix

| Capability | Parent | Child | Admin |
|-----------|:------:|:-----:|:-----:|
| **Account Management** |
| Create/manage subscription | ✅ | ❌ | ✅ |
| Manage billing & payments | ✅ | ❌ | ✅ |
| Add/edit/remove children | ✅ | ❌ | ✅ |
| Generate child access codes | ✅ | ❌ | ✅ |
| **Content Access** |
| View/complete learning modules | ❌ | ✅ | ✅ |
| Create/modify virtual company | ❌ | ✅ | ✅ |
| View achievements & progress | ✅ (own children) | ✅ (own) | ✅ (all) |
| **Content Management** |
| Create/edit modules | ❌ | ❌ | ✅ |
| Publish/unpublish content | ❌ | ❌ | ✅ |
| **Analytics & Reports** |
| View child progress | ✅ (own children) | ❌ | ✅ (all) |
| Access system analytics | ❌ | ❌ | ✅ |
| Export data/reports | ✅ (limited) | ❌ | ✅ |
| Issue refunds | ❌ | ❌ | ✅ |

---

## 3. Screens & User Flows

### 3.1 Landing Page (Parent)

#### Page Elements

| Section | Components |
|---------|-----------|
| **Header** | Logo, Navigation (Features, Pricing, FAQ, Login) |
| **Hero** | Value proposition, CTA buttons: `Login` \| `Start free trial` |
| **Features** | Learning path, Company builder, Tracks, Achievements |
| **Pricing** | 3 subscription plans (Basic / Standard / Premium) |
| **Footer** | Contact, Terms, Privacy, Support links |

#### User Flow

```
User arrives → Landing page
  ├─ Click "Login" → Parent login page (email/password or SSO)
  └─ Click "Start free trial" → Plan selection page (3 plans)
```

### 3.2 Plan Selection & Subscription Flow (Parent)

#### Subscription Flow

```
Plan selection
  ↓
User clicks "Choose plan"
  ↓
Sign-up form (if not logged in)
  ├─ Parent name
  ├─ Email
  ├─ Password (or Social OAuth)
  └─ Accept T&Cs and child-data policy
  ↓
Payment configuration (Stripe)
  ├─ Card details
  └─ Billing information
  ↓
Stripe subscription creation
  └─ Apply trial period if applicable
  ↓
Success → Redirect to Parent Dashboard
```

#### Plan Display Requirements

Each plan tile should display:
- **Plan name** (Basic / Standard / Premium)
- **Child limit** (Basic: 1 child, Standard: 5 children, Premium: 99+ unlimited)
- **Pricing** (monthly/annual toggle)
- **Feature list** (bullet points)
- **Trial period length** (e.g., "30-day free trial")
- **CTA button** (`Choose plan`)

#### Subscription Plan Limits

| Plan | Child Limit | Monthly Price | Annual Price |
|------|-------------|---------------|--------------|
| **Basic** | 1 child | $9.99 | $99.99 |
| **Standard** | 5 children | $19.99 | $199.99 |
| **Premium** | 99+ children (unlimited) | $29.99 | $299.99 |

#### Technical Implementation

| Component | Implementation |
|-----------|---------------|
| **Payment UI** | Stripe Checkout or Stripe Elements |
| **Server endpoint** | `POST /api/billing/create-checkout-session` |
| **Database records** | Plan type, `stripeSubscriptionId`, trial end date, billing status |

> ⚠️ **Important:** All payment processing must happen server-side. Never expose Stripe secret keys client-side.

### 3.3 Parent Dashboard (After Login)

#### Dashboard Layout

**Header Navigation:**
```
[Logo] | [Parent Name] | [Billing Status Badge] | [+ Add Child] | [Manage Subscription] | [Logout]
```

#### Main Dashboard Sections

##### 1. Subscription Summary Card
| Field | Description |
|-------|-------------|
| **Plan** | Current subscription tier (Basic/Standard/Premium) |
| **Billing** | Next billing date or trial end date |
| **Children** | Number of active children |

##### 2. Children Management

**Children List View:**

Each child card displays:
- Profile picture (optional)
- Name, age, gender
- Unique access code (e.g., `ABC123`)
- Subscription status (inherited from parent)
- Progress percentage (e.g., "47% complete")
- Recent activity summary

**Actions:**
- `View Details` → Child detail page
- `Edit` → Update child information
- `Remove` → Deactivate child access

##### 3. Child Detail View

| Section | Content |
|---------|---------|
| **Progress Timeline** | Visual timeline of completed modules |
| **Completed Modules** | List with completion dates |
| **Achievements** | Badges and awards earned |
| **Company Snapshot** | Virtual company stats (name, revenue, products) |
| **Export** | Download progress report (PDF) |

##### 4. Billing & Subscription Management

**Available Actions:**
- Change subscription plan (upgrade/downgrade)
- Cancel subscription
- View invoice history (from Stripe)
- Update payment method (Stripe portal link)

##### 5. Settings

- Parent account details
- Notification preferences
- Privacy settings

---

#### Add Child Flow

```
Click "Add Child" button
  ↓
Modal/Page with form
  ├─ Child name (required)
  ├─ Age (required)
  ├─ Gender (male/female/other/prefer not to say)
  └─ Profile picture (optional upload)
  ↓
Submit form
  ↓
Backend creates child record
  ├─ Link to parent account
  ├─ Generate unique access code
  └─ Inherit subscription coverage
  ↓
Show success screen
  ├─ Display access code (large, copy button)
  ├─ Display QR code
  ├─ Show validity dates
  └─ Provide setup instructions
```

#### Child Access Code Specification

| Property | Value |
|----------|-------|
| **Length** | 6-8 characters |
| **Character set** | `A-Z0-9` (uppercase letters + numbers) |
| **Randomness** | Cryptographically random |
| **Uniqueness** | Guaranteed unique across all children |
| **Expiration** | Only when parent removes child OR subscription lapses |
| **Display format** | Groups of 3 (e.g., `ABC-123` for readability) |

> 💡 **Best Practice:** Avoid ambiguous characters like `O` (letter) vs `0` (zero), `I` (letter) vs `1` (one).

### 3.4 Child Dashboard (Access via Code)

#### Entry Flow

```
Child visits app
  ↓
Click "Enter with code"
  ↓
Input 6-8 character access code
  ↓
Validate code (rate-limited)
  ├─ Valid → Continue
  └─ Invalid → Show error, retry (max 5 attempts)
  ↓
Optional: Set nickname/avatar
  ↓
Enter child dashboard
```

#### Child Dashboard Layout

**Navigation:**
```
[Company Icon] | [Modules] | [Achievements] | [Profile] | [Logout]
```

---

#### Main Features

##### 1. 🏢 Company Builder (Virtual Simulation)

Interactive mini-simulator where children create and manage a virtual company.

**Setup Phase:**
- Company name
- Product/service selection
- Logo creator (simple drawing tool or templates)
- Starting capital (virtual currency)

**Operations:**
| Action | Description | Impact |
|--------|-------------|---------|
| **Launch Product** | Release company's first product | Unlock revenue tracking |
| **Set Pricing** | Define product pricing | Affects sales simulation |
| **Mini-Sales** | Complete sales challenges | Earn virtual revenue |
| **Expenses** | Manage operational costs | Track profit/loss |
| **Expand** | Unlock new features as progress | Gamified growth |

**Company Dashboard Displays:**
- Current capital
- Total revenue
- Expenses
- Profit/loss chart
- Product catalog

##### 2. 📚 Learning Modules

**Module Organization:**
- Organized by learning tracks (e.g., "Money Basics", "Entrepreneurship 101")
- Sequential unlocking (prerequisites required)
- Clear progress indicators

**Module Structure:**

Each module contains:
```
1. Introduction (overview, learning objectives)
   ↓
2. Lessons (mix of):
   - Video content
   - Text/reading material
   - Interactive activities
   ↓
3. Practical Activity
   - Real-world application (e.g., set a price, create a logo)
   ↓
4. Knowledge Check (quiz)
   - Multiple choice questions
   - Immediate feedback
   ↓
5. Module Completion
   - Award XP and points
   - Unlock badge
   - Unlock next module
```

**Module Display Card:**
- Module title and description
- Duration estimate
- XP reward
- Status badge (locked/in-progress/completed)
- Progress bar (if started)

##### 3. 🏆 Achievements & Progress

**Progress Tracking:**
- Overall completion percentage
- Modules completed count
- Current streak (consecutive days active)
- Total XP accumulated
- Next recommended module

**Achievement Categories:**
- **Milestones:** First Module, 10 Modules, 50 Modules
- **Performance:** Perfect Quiz, Speed Learner
- **Company:** First Sale, $1000 Revenue, Product Launch
- **Engagement:** 7-Day Streak, 30-Day Streak

**Achievement Display:**
- Badge icon
- Achievement name
- Description
- Date earned
- Rarity indicator

##### 4. 👤 Profile

**Profile Information:**
- Child name/nickname
- Avatar/profile picture
- Total XP and level
- Member since date
- Subscription validity (read-only, inherited from parent)

**Profile Tabs:**
- Overview
- Achievements gallery
- Company snapshot
- Learning history

**Actions:**
- Edit nickname
- Change avatar
- View subscription details
- Logout

---

#### Module Completion Flow

```
Start Module
  ↓
Watch/Read Introduction
  ↓
Complete Lessons (1-N)
  ├─ Video lessons (track watch time)
  ├─ Text lessons (mark as read)
  └─ Interactive activities (complete tasks)
  ↓
Practical Activity
  └─ Apply learning (e.g., pricing exercise)
  ↓
Knowledge Check (Quiz)
  ├─ Answer questions
  ├─ Immediate feedback
  └─ Pass threshold: 70%+
  ↓
Module Complete! 🎉
  ├─ Mark module as completed
  ├─ Award XP (e.g., 100 XP)
  ├─ Unlock achievement badge
  ├─ Update company resources (if applicable)
  ├─ Unlock next module
  └─ Show celebration animation
```

> 🎮 **Gamification Note:** Use animations, sound effects, and visual rewards to make completion satisfying for children.

### 3.5 Admin Dashboard

#### Dashboard Navigation

```
[Admin Panel] | [Modules] | [Users] | [Analytics] | [Billing] | [Settings] | [Logout]
```

#### Core Capabilities

##### 1. 📖 Module Management

**Module CRUD Operations:**

| Action | Description | Features |
|--------|-------------|----------|
| **Create** | Add new learning module | Title, description, track, difficulty, XP value |
| **Edit** | Modify existing module | Update content, reorder lessons, change prerequisites |
| **Reorder** | Adjust module sequence | Drag-and-drop interface |
| **Publish/Unpublish** | Control visibility | Draft → Published workflow |
| **Delete** | Remove module | Soft delete with archive |
| **Schedule** | Plan future releases | Set publish date/time |

**Module Editor Interface:**

```
Module Details
  ├─ Basic Information
  │  ├─ Title
  │  ├─ Description
  │  ├─ Learning track
  │  ├─ Order/sequence number
  │  └─ Difficulty level
  │
  ├─ Content
  │  ├─ Lessons (1-N)
  │  │  ├─ Lesson type (video/text/quiz)
  │  │  ├─ Content URL or body
  │  │  ├─ Duration estimate
  │  │  └─ Order
  │  │
  │  ├─ Practical Activities
  │  └─ Quiz Questions
  │
  ├─ Gamification
  │  ├─ XP award value
  │  ├─ Achievement unlocks
  │  └─ Company resource rewards
  │
  ├─ Prerequisites
  │  └─ Required modules (select)
  │
  └─ Resources
     ├─ Video URLs (YouTube, Vimeo)
     ├─ PDF uploads
     └─ External links
```

**Publishing Workflow:**
```
Draft → Review → Schedule → Published → Analytics
```

##### 2. 👥 User Management

**Parent Management:**

| Action | Details |
|--------|---------|
| **Search** | By email, name, subscription status |
| **View** | Parent details, subscription info, children list |
| **Edit** | Update account details |
| **Subscription** | View/modify plan, extend trial, cancel |
| **Support** | Add notes, flag issues |

**Child Management:**

| Action | Details |
|--------|---------|
| **Search** | By name, code, parent email |
| **View** | Progress, completed modules, achievements |
| **Access Control** | Revoke child code, reset progress |
| **Export** | Download progress report |

**User List Filters:**
- Active/Inactive subscriptions
- Trial vs Paid
- Plan type (Basic/Standard/Premium)
- Registration date range
- Children count

##### 3. 💰 Billing & Revenue

**Revenue Dashboard:**

**Key Metrics:**
- Monthly Recurring Revenue (MRR)
- Total active subscriptions
- Trial → Paid conversion rate
- Churn rate
- Average Revenue Per User (ARPU)

**Subscription Management:**

| Feature | Description |
|---------|-------------|
| **View Subscriptions** | List all active/canceled subscriptions |
| **Stripe Integration** | Direct links to Stripe dashboard |
| **Refunds** | Issue refunds (via Stripe) |
| **Invoice Export** | Download invoices (CSV/PDF) |
| **Failed Payments** | Track and retry failed charges |

##### 4. 📊 Analytics & Reports

**Module Analytics:**

- Completion rates per module
- Average time to complete
- Quiz performance statistics
- Most/least popular modules
- Drop-off points

**User Analytics:**

- Daily Active Users (DAU)
- Weekly Active Users (WAU)
- Monthly Active Users (MAU)
- User retention (7/30/90 day)
- Average progress per child
- Session duration

**Engagement Metrics:**

- Modules completed per week
- Average streak length
- Achievement unlock rates
- Company builder usage

**Export Options:**
- CSV downloads
- PDF reports
- Scheduled email reports
- Dashboard embeds

##### 5. ⚙️ System Settings

**Configuration:**
- Platform settings
- Email templates
- Notification rules
- Feature flags
- API keys management

**Content Settings:**
- Default XP values
- Achievement definitions
- Virtual economy rules

---

#### Admin Workflows

**Workflow 1: Creating a New Module**
```
Navigate to Modules → Create New
  ↓
Enter module details
  ↓
Add lessons (video/text/quiz)
  ↓
Upload resources
  ↓
Set XP and prerequisites
  ↓
Save as Draft
  ↓
Preview module
  ↓
Publish (immediately or scheduled)
  ↓
Monitor analytics
```

**Workflow 2: Handling Support Issue**
```
User reports issue
  ↓
Search for parent account
  ↓
View subscription & child details
  ↓
Take action (extend trial, refund, reset child code)
  ↓
Add support notes
  ↓
Send notification to parent
```

---

## 4. Data Model (Entities)

### Entity Relationship Overview

```
User ──→ Parent ──→ Child ──→ Activity
                │           └─→ Company
                │           └─→ ChildAchievement ←─ Achievement
                │
                └─→ Subscription (Stripe)

Module ──→ Lesson
  │
  └─→ Activity
```

### Core Entities

#### 1. User

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | UUID | Primary key | PK, Auto-generated |
| `email` | String | User email address | Unique, Indexed, Not Null |
| `passwordHash` | String | Hashed password (bcrypt/argon2) | Not Null |
| `role` | Enum | User role | `parent` \| `admin` |
| `createdAt` | Timestamp | Account creation date | Auto-set |
| `lastLogin` | Timestamp | Last login timestamp | Nullable |
| `emailVerified` | Boolean | Email verification status | Default: false |

#### 2. Parent

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | UUID | Primary key | PK, Auto-generated |
| `userId` | UUID | Reference to User | FK → User.id, Unique |
| `stripeCustomerId` | String | Stripe customer ID | Indexed, Nullable |
| `subscriptionId` | UUID | Reference to active subscription | FK → Subscription.id, Nullable |
| `plan` | Enum | Current plan | `basic` \| `standard` \| `premium` |
| `trialEnd` | Timestamp | Trial expiration date | Nullable |
| `billingStatus` | Enum | Billing status | `active` \| `trial` \| `past_due` \| `canceled` |
| `createdAt` | Timestamp | Account creation | Auto-set |

#### 3. Child

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | UUID | Primary key | PK, Auto-generated |
| `parentId` | UUID | Reference to Parent | FK → Parent.id, Not Null |
| `name` | String | Child's name | Not Null |
| `age` | Integer | Child's age | Min: 6, Max: 16 |
| `gender` | Enum | Gender | `male` \| `female` \| `other` \| `prefer_not_to_say` |
| `profilePicUrl` | String | Profile picture URL | Nullable |
| `code` | String | Unique access code | **Unique, Indexed**, 6-8 chars |
| `createdAt` | Timestamp | Child account creation | Auto-set |
| `active` | Boolean | Account active status | Default: true |

#### 4. Module

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | UUID | Primary key | PK, Auto-generated |
| `title` | String | Module title | Not Null |
| `description` | Text | Module description | Nullable |
| `track` | String | Learning track name | Not Null |
| `order` | Integer | Sequence order | Not Null, Indexed |
| `xp` | Integer | XP reward for completion | Default: 100 |
| `difficulty` | Enum | Difficulty level | `beginner` \| `intermediate` \| `advanced` |
| `prerequisites` | UUID[] | Required module IDs | Array of FK → Module.id |
| `published` | Boolean | Published status | Default: false |
| `publishedAt` | Timestamp | Publication date | Nullable |
| `createdAt` | Timestamp | Creation date | Auto-set |
| `updatedAt` | Timestamp | Last update | Auto-update |

#### 5. Lesson

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | UUID | Primary key | PK, Auto-generated |
| `moduleId` | UUID | Reference to Module | FK → Module.id, Not Null |
| `title` | String | Lesson title | Not Null |
| `type` | Enum | Lesson type | `video` \| `text` \| `quiz` \| `activity` |
| `contentUrl` | String | URL to content | Nullable |
| `content` | Text | Text content (if type=text) | Nullable |
| `duration` | Integer | Estimated duration (minutes) | Nullable |
| `order` | Integer | Lesson order within module | Not Null |
| `createdAt` | Timestamp | Creation date | Auto-set |

#### 6. Activity

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | UUID | Primary key | PK, Auto-generated |
| `childId` | UUID | Reference to Child | FK → Child.id, Not Null, Indexed |
| `moduleId` | UUID | Reference to Module | FK → Module.id, Nullable |
| `lessonId` | UUID | Reference to Lesson | FK → Lesson.id, Nullable |
| `type` | Enum | Activity type | `module_start` \| `lesson_complete` \| `quiz_attempt` \| `module_complete` |
| `payload` | JSON | Activity-specific data | Nullable |
| `result` | JSON | Result data (e.g., quiz score) | Nullable |
| `points` | Integer | Points earned | Default: 0 |
| `completedAt` | Timestamp | Completion timestamp | Auto-set |

#### 7. Company

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | UUID | Primary key | PK, Auto-generated |
| `childId` | UUID | Reference to Child | FK → Child.id, Unique |
| `name` | String | Company name | Not Null |
| `product` | String | Main product/service | Nullable |
| `logoUrl` | String | Company logo URL | Nullable |
| `capital` | Decimal | Current capital (virtual) | Default: 1000.00 |
| `revenue` | Decimal | Total revenue earned | Default: 0.00 |
| `expenses` | Decimal | Total expenses | Default: 0.00 |
| `createdAt` | Timestamp | Company creation date | Auto-set |
| `updatedAt` | Timestamp | Last update | Auto-update |

#### 8. Achievement

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | UUID | Primary key | PK, Auto-generated |
| `name` | String | Achievement name | Not Null, Unique |
| `description` | Text | Achievement description | Not Null |
| `category` | Enum | Category | `milestone` \| `performance` \| `company` \| `engagement` |
| `criteria` | JSON | Unlock criteria | Not Null |
| `iconUrl` | String | Badge icon URL | Nullable |
| `rarity` | Enum | Rarity level | `common` \| `rare` \| `epic` \| `legendary` |
| `xpBonus` | Integer | Bonus XP when earned | Default: 0 |
| `createdAt` | Timestamp | Creation date | Auto-set |

#### 9. ChildAchievement

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | UUID | Primary key | PK, Auto-generated |
| `childId` | UUID | Reference to Child | FK → Child.id, Indexed |
| `achievementId` | UUID | Reference to Achievement | FK → Achievement.id |
| `awardedAt` | Timestamp | Date awarded | Auto-set |

**Unique Constraint:** `(childId, achievementId)` — prevent duplicate awards

#### 10. Subscription

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | UUID | Primary key | PK, Auto-generated |
| `parentId` | UUID | Reference to Parent | FK → Parent.id, Not Null |
| `plan` | Enum | Subscription plan | `basic` \| `standard` \| `premium` |
| `stripeSubscriptionId` | String | Stripe subscription ID | Unique, Indexed |
| `status` | Enum | Subscription status | `trialing` \| `active` \| `past_due` \| `canceled` \| `incomplete` |
| `currentPeriodStart` | Timestamp | Current billing period start | Not Null |
| `currentPeriodEnd` | Timestamp | Current billing period end | Not Null |
| `cancelAtPeriodEnd` | Boolean | Cancel at end flag | Default: false |
| `createdAt` | Timestamp | Subscription creation | Auto-set |
| `updatedAt` | Timestamp | Last update | Auto-update |

---

### Indexes & Relationships

#### Critical Indexes

```sql
-- Fast child code lookup
CREATE UNIQUE INDEX idx_child_code ON Child(code);

-- Fast user email lookup
CREATE UNIQUE INDEX idx_user_email ON User(email);

-- Parent subscription queries
CREATE INDEX idx_parent_billing_status ON Parent(billingStatus);

-- Activity queries by child
CREATE INDEX idx_activity_child_id ON Activity(childId, completedAt);

-- Module ordering
CREATE INDEX idx_module_order ON Module(order, published);
```

#### Key Relationships

| Relationship | Type | Notes |
|--------------|------|-------|
| User → Parent | One-to-One | Each parent has exactly one user account |
| Parent → Child | One-to-Many | Parent can have multiple children |
| Parent → Subscription | One-to-Many | Track subscription history |
| Child → Company | One-to-One | Each child has one virtual company |
| Child → Activity | One-to-Many | Track all child activities |
| Module → Lesson | One-to-Many | Modules contain multiple lessons |
| Child → ChildAchievement | One-to-Many | Children earn multiple achievements |
| Achievement → ChildAchievement | One-to-Many | Same achievement earned by multiple children |

---

## 5. API Surface / Endpoints (Suggested)

### Authentication & Accounts

| Method | Endpoint | Description | Auth Required | Request Body | Response |
|--------|----------|-------------|---------------|--------------|----------|
| `POST` | `/api/auth/signup` | Parent registration | No | `{ email, password, name }` | `{ user, token }` |
| `POST` | `/api/auth/login` | Parent login | No | `{ email, password }` | `{ user, token }` |
| `POST` | `/api/auth/logout` | Logout (invalidate token) | Yes (Parent) | — | `{ success: true }` |
| `POST` | `/api/auth/verify-email` | Verify email address | No | `{ token }` | `{ success: true }` |
| `POST` | `/api/auth/forgot-password` | Request password reset | No | `{ email }` | `{ success: true }` |
| `POST` | `/api/auth/reset-password` | Reset password | No | `{ token, newPassword }` | `{ success: true }` |

---

### Parent / Child Management

| Method | Endpoint | Description | Auth Required | Request Body | Response |
|--------|----------|-------------|---------------|--------------|----------|
| `GET` | `/api/parent/me` | Get parent profile | Yes (Parent) | — | `{ parent, subscription, children }` |
| `PUT` | `/api/parent/me` | Update parent profile | Yes (Parent) | `{ name, email, notificationPrefs }` | `{ parent }` |
| `POST` | `/api/parent/children` | Add new child | Yes (Parent) | `{ name, age, gender, profilePic? }` | `{ child, code }` |
| `GET` | `/api/parent/children` | List all children | Yes (Parent) | — | `{ children[] }` |
| `GET` | `/api/parent/children/:childId` | Get child details | Yes (Parent) | — | `{ child, progress, company, achievements }` |
| `PUT` | `/api/parent/children/:childId` | Update child info | Yes (Parent) | `{ name?, age?, gender?, profilePic? }` | `{ child }` |
| `DELETE` | `/api/parent/children/:childId` | Remove child | Yes (Parent) | — | `{ success: true }` |
| `GET` | `/api/parent/children/:childId/progress` | Get detailed progress | Yes (Parent) | — | `{ modules[], activities[], stats }` |
| `GET` | `/api/parent/children/:childId/export` | Export progress PDF | Yes (Parent) | — | PDF file download |

---

### Child Access & Learning

| Method | Endpoint | Description | Auth Required | Request Body | Response |
|--------|----------|-------------|---------------|--------------|----------|
| `POST` | `/api/child/enter` | Child login with code | No | `{ code }` | `{ child, token }` (child-scoped JWT) |
| `GET` | `/api/child/:childId/modules` | List available modules | Yes (Child) | — | `{ modules[] }` (with locked status) |
| `GET` | `/api/child/:childId/modules/:moduleId` | Get module details | Yes (Child) | — | `{ module, lessons[], progress }` |
| `POST` | `/api/child/:childId/modules/:moduleId/start` | Start a module | Yes (Child) | — | `{ activity }` |
| `POST` | `/api/child/:childId/lessons/:lessonId/complete` | Mark lesson complete | Yes (Child) | `{ result?, timeSpent? }` | `{ activity, xp }` |
| `POST` | `/api/child/:childId/modules/:moduleId/complete` | Complete module | Yes (Child) | `{ quizScore }` | `{ xp, achievements[], nextModules[] }` |
| `GET` | `/api/child/:childId/achievements` | Get all achievements | Yes (Child) | — | `{ achievements[], earned[], progress }` |
| `GET` | `/api/child/:childId/profile` | Get child profile | Yes (Child) | — | `{ child, stats, subscription }` |
| `PUT` | `/api/child/:childId/profile` | Update child profile | Yes (Child) | `{ nickname?, avatar? }` | `{ child }` |

---

### Company Builder (Child)

| Method | Endpoint | Description | Auth Required | Request Body | Response |
|--------|----------|-------------|---------------|--------------|----------|
| `POST` | `/api/child/:childId/company` | Create/init company | Yes (Child) | `{ name, product, logo? }` | `{ company }` |
| `GET` | `/api/child/:childId/company` | Get company details | Yes (Child) | — | `{ company, transactions[] }` |
| `PUT` | `/api/child/:childId/company` | Update company | Yes (Child) | `{ name?, product?, logo? }` | `{ company }` |
| `POST` | `/api/child/:childId/company/transactions` | Record transaction | Yes (Child) | `{ type, amount, description }` | `{ transaction, company }` |

---

### Modules & Content (Public & Admin)

| Method | Endpoint | Description | Auth Required | Request Body | Response |
|--------|----------|-------------|---------------|--------------|----------|
| `GET` | `/api/modules` | List published modules | Yes | — | `{ modules[] }` |
| `GET` | `/api/modules/:id` | Get module by ID | Yes | — | `{ module, lessons[] }` |
| `POST` | `/api/admin/modules` | Create new module | Yes (Admin) | `{ title, description, track, xp, ... }` | `{ module }` |
| `PUT` | `/api/admin/modules/:id` | Update module | Yes (Admin) | `{ title?, description?, ... }` | `{ module }` |
| `DELETE` | `/api/admin/modules/:id` | Delete module | Yes (Admin) | — | `{ success: true }` |
| `POST` | `/api/admin/modules/:id/publish` | Publish module | Yes (Admin) | — | `{ module }` |
| `POST` | `/api/admin/modules/:id/unpublish` | Unpublish module | Yes (Admin) | — | `{ module }` |
| `POST` | `/api/admin/modules/:id/lessons` | Add lesson to module | Yes (Admin) | `{ title, type, content, ... }` | `{ lesson }` |
| `PUT` | `/api/admin/lessons/:id` | Update lesson | Yes (Admin) | `{ title?, content?, ... }` | `{ lesson }` |
| `DELETE` | `/api/admin/lessons/:id` | Delete lesson | Yes (Admin) | — | `{ success: true }` |

---

### Billing & Subscriptions

| Method | Endpoint | Description | Auth Required | Request Body | Response |
|--------|----------|-------------|---------------|--------------|----------|
| `POST` | `/api/billing/create-checkout-session` | Create Stripe checkout | Yes (Parent) | `{ plan, successUrl, cancelUrl }` | `{ sessionId, url }` |
| `POST` | `/api/billing/create-subscription` | Create subscription | Yes (Parent) | `{ plan, paymentMethodId }` | `{ subscription }` |
| `GET` | `/api/billing/subscription` | Get current subscription | Yes (Parent) | — | `{ subscription }` |
| `POST` | `/api/billing/change-plan` | Change subscription plan | Yes (Parent) | `{ newPlan }` | `{ subscription }` |
| `POST` | `/api/billing/cancel` | Cancel subscription | Yes (Parent) | `{ immediate: boolean }` | `{ subscription }` |
| `POST` | `/api/billing/resume` | Resume canceled subscription | Yes (Parent) | — | `{ subscription }` |
| `GET` | `/api/billing/invoices` | List invoices | Yes (Parent) | — | `{ invoices[] }` |
| `GET` | `/api/billing/portal-session` | Create Stripe portal session | Yes (Parent) | — | `{ url }` |

---

### Stripe Webhooks

| Method | Endpoint | Description | Auth Required | Request Body | Response |
|--------|----------|-------------|---------------|--------------|----------|
| `POST` | `/api/webhooks/stripe` | Handle Stripe events | No (Stripe signature) | Stripe event payload | `{ received: true }` |

**Handled events:**
- `invoice.payment_succeeded` → Update subscription status to active
- `invoice.payment_failed` → Mark subscription as past_due, notify parent
- `customer.subscription.updated` → Sync subscription changes
- `customer.subscription.deleted` → Mark subscription canceled
- `checkout.session.completed` → Process new subscription

---

### Analytics & Admin

| Method | Endpoint | Description | Auth Required | Request Body | Response |
|--------|----------|-------------|---------------|--------------|----------|
| `GET` | `/api/admin/metrics` | Get platform metrics | Yes (Admin) | — | `{ revenue, users, engagement }` |
| `GET` | `/api/admin/users` | List all users | Yes (Admin) | `?page&limit&filter` | `{ users[], total, page }` |
| `GET` | `/api/admin/users/:userId` | Get user details | Yes (Admin) | — | `{ user, parent, children, subscription }` |
| `PUT` | `/api/admin/users/:userId` | Update user (support) | Yes (Admin) | `{ ... }` | `{ user }` |
| `POST` | `/api/admin/users/:userId/extend-trial` | Extend trial period | Yes (Admin) | `{ days }` | `{ parent }` |
| `GET` | `/api/admin/analytics/modules` | Module analytics | Yes (Admin) | — | `{ modules[], stats }` |
| `GET` | `/api/admin/analytics/revenue` | Revenue analytics | Yes (Admin) | `?startDate&endDate` | `{ mrr, churn, ... }` |
| `POST` | `/api/admin/refund` | Issue refund | Yes (Admin) | `{ subscriptionId, amount?, reason? }` | `{ refund }` |

---

### Rate Limiting & Security

| Endpoint Pattern | Rate Limit | Notes |
|------------------|------------|-------|
| `/api/auth/login` | 5 req/min per IP | Prevent brute force |
| `/api/child/enter` | 10 req/min per IP | Prevent code guessing |
| `/api/auth/signup` | 3 req/hour per IP | Prevent spam |
| All other endpoints | 100 req/min per user | General protection |
| `/api/webhooks/*` | No limit | But verify signatures |

---

### Common Response Codes

| Code | Meaning | Usage |
|------|---------|-------|
| `200` | OK | Successful GET, PUT, DELETE |
| `201` | Created | Successful POST (resource created) |
| `400` | Bad Request | Invalid input/validation error |
| `401` | Unauthorized | Missing or invalid auth token |
| `403` | Forbidden | Valid auth but insufficient permissions |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Duplicate resource (e.g., email exists) |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Server-side error |

---

## 6. Stripe Integration & Billing Flow

### Integration Approach

Choose one of two Stripe integration methods:

| Approach | Pros | Cons | Best For |
|----------|------|------|----------|
| **Stripe Checkout** | ✅ Fast implementation<br>✅ PCI compliant out-of-box<br>✅ Mobile optimized | ❌ Less customization<br>❌ Redirect required | MVP, quick launch |
| **Stripe Elements + API** | ✅ Full UI control<br>✅ On-site experience<br>✅ Custom branding | ❌ More code required<br>❌ PCI compliance responsibility | Custom branding, enterprise |

> 💡 **Recommendation:** Start with Stripe Checkout for MVP, migrate to Elements later if needed.

---

### Server-Side Implementation

#### Core Responsibilities

```
1. Customer Management
   ├─ Create Stripe Customer on first purchase
   ├─ Store stripeCustomerId in database
   └─ Link to parent account

2. Subscription Creation
   ├─ Create subscription with trial period
   ├─ Set trial_end timestamp
   ├─ Store subscription ID and metadata
   └─ Return success/failure

3. Webhook Processing
   ├─ Verify webhook signatures
   ├─ Handle subscription events
   ├─ Update database state
   └─ Trigger notifications

4. State Synchronization
   ├─ Keep DB in sync with Stripe
   ├─ Handle edge cases (failed payments, cancellations)
   └─ Implement grace periods
```

#### Critical Data to Store

| Field | Source | Purpose |
|-------|--------|---------|
| `stripeCustomerId` | Stripe Customer object | Link to Stripe account |
| `stripeSubscriptionId` | Stripe Subscription object | Track active subscription |
| `currentPeriodStart` | Subscription `current_period_start` | Billing period tracking |
| `currentPeriodEnd` | Subscription `current_period_end` | Renewal date, access control |
| `status` | Subscription `status` | Subscription state machine |
| `plan` | Subscription item price | Which plan user has |
| `trialEnd` | Subscription `trial_end` | Trial expiration |

---

### Subscription Creation Flow

#### Option 1: Stripe Checkout (Recommended for MVP)

```
Parent selects plan
  ↓
Frontend: POST /api/billing/create-checkout-session
  ├─ plan: "basic" | "standard" | "premium"
  ├─ successUrl: "/parent/dashboard?session_id={CHECKOUT_SESSION_ID}"
  └─ cancelUrl: "/pricing"
  ↓
Backend:
  ├─ Create/retrieve Stripe Customer
  ├─ Create Checkout Session
  │  ├─ mode: "subscription"
  │  ├─ line_items: [{ price: "price_xxx", quantity: 1 }]
  │  ├─ subscription_data: { trial_period_days: 30 }
  │  └─ customer: stripeCustomerId
  ↓
Return: { sessionId, url }
  ↓
Frontend: Redirect to Stripe Checkout URL
  ↓
User completes payment
  ↓
Stripe webhook: checkout.session.completed
  ↓
Backend:
  ├─ Retrieve session and subscription
  ├─ Save subscription to database
  ├─ Update parent billing status
  └─ Send welcome email
  ↓
Redirect to success_url → Parent dashboard
```

#### Option 2: Stripe Elements (Custom UI)

```
Parent selects plan
  ↓
Frontend: Collect payment method with Stripe Elements
  ↓
Frontend: Create PaymentMethod
  ↓
Frontend: POST /api/billing/create-subscription
  ├─ plan: "basic" | "standard" | "premium"
  └─ paymentMethodId: "pm_xxx"
  ↓
Backend:
  ├─ Attach PaymentMethod to Customer
  ├─ Create Subscription
  │  ├─ customer: stripeCustomerId
  │  ├─ items: [{ price: "price_xxx" }]
  │  ├─ trial_period_days: 30
  │  ├─ default_payment_method: paymentMethodId
  │  └─ expand: ["latest_invoice.payment_intent"]
  ↓
Handle subscription status:
  ├─ "active" or "trialing" → Success!
  ├─ "incomplete" → Requires action (3D Secure)
  │  └─ Return payment_intent client_secret
  └─ "incomplete_expired" → Failed, retry
```

---

### Webhook Implementation

#### Required Webhook Events

| Event | Action | Database Updates |
|-------|--------|------------------|
| `checkout.session.completed` | New subscription created | Create Subscription record, update Parent |
| `invoice.payment_succeeded` | Payment successful | Set status: `active`, extend `currentPeriodEnd` |
| `invoice.payment_failed` | Payment failed | Set status: `past_due`, notify parent |
| `customer.subscription.updated` | Subscription changed | Update plan, status, period dates |
| `customer.subscription.deleted` | Subscription canceled | Set status: `canceled`, schedule access removal |
| `customer.subscription.trial_will_end` | Trial ending soon (3 days) | Send reminder email to parent |

#### Webhook Handler Pseudocode

```javascript
POST /api/webhooks/stripe

1. Verify webhook signature
   └─ Use stripe.webhooks.constructEvent()
   
2. Handle event by type
   switch (event.type) {
     case 'invoice.payment_succeeded':
       ├─ Find subscription in DB
       ├─ Update status to 'active'
       ├─ Update currentPeriodEnd
       └─ Send receipt email
       
     case 'invoice.payment_failed':
       ├─ Find subscription in DB
       ├─ Update status to 'past_due'
       ├─ Increment failure count
       ├─ If failures < 3: Schedule retry (Stripe auto-retries)
       ├─ If failures >= 3: Set grace period (7 days)
       └─ Send payment failure email
       
     case 'customer.subscription.deleted':
       ├─ Find subscription in DB
       ├─ Update status to 'canceled'
       ├─ Set cancellation date
       ├─ Deactivate child access codes
       └─ Send cancellation confirmation
       
     case 'customer.subscription.updated':
       ├─ Sync all subscription fields
       ├─ Detect plan changes (upgrade/downgrade)
       └─ Update access levels if needed
   }
   
3. Return 200 OK immediately
   └─ Process asynchronously to avoid timeouts
```

---

### Billing Management UI

#### Parent Dashboard - Manage Billing

**Option A: Stripe Customer Portal (Recommended)**

```javascript
// Create portal session
POST /api/billing/portal-session
→ Returns: { url: "https://billing.stripe.com/session/xxx" }

// Redirect parent to portal
window.location.href = portalUrl;

// Portal allows:
- Update payment method
- View invoices
- Cancel subscription
- Update billing email
```

**Option B: Custom Billing UI**

Implement custom pages for:
- View current plan
- Change plan (upgrade/downgrade)
- Update payment method (Stripe Elements)
- Cancel subscription
- View invoice history
- Download invoices (PDF)

---

### Payment Failure & Grace Period

```
Payment attempt fails
  ↓
Stripe auto-retries (Smart Retries enabled)
  ├─ Attempt 2: After 3 days
  ├─ Attempt 3: After 5 days
  └─ Attempt 4: After 7 days
  ↓
If all retries fail:
  ├─ Webhook: invoice.payment_failed
  ├─ DB: Set status = 'past_due'
  ├─ Email: Payment failed notification
  └─ Grace period: 7 days
      ├─ Day 1: Email reminder
      ├─ Day 3: Email warning
      ├─ Day 7: Final notice
      └─ Day 8: Revoke child access, cancel subscription
```

#### Grace Period Implementation

| Days Since Failure | Action | Child Access |
|-------------------|--------|--------------|
| 0-3 | Gentle reminder emails | ✅ Full access |
| 4-7 | Warning emails + dashboard banner | ✅ Full access |
| 7+ | Access revoked, subscription canceled | ❌ No access |

---

### Plan Changes (Upgrade/Downgrade)

```
Parent initiates plan change
  ↓
POST /api/billing/change-plan
  └─ { newPlan: "premium" }
  ↓
Backend: stripe.subscriptions.update()
  ├─ items: [{ id: subItemId, price: newPriceId }]
  ├─ proration_behavior: "create_prorations" (default)
  └─ billing_cycle_anchor: "unchanged"
  ↓
Stripe calculates proration:
  ├─ Upgrade: Charge difference immediately
  └─ Downgrade: Credit applied to next invoice
  ↓
Webhook: customer.subscription.updated
  ↓
Update DB with new plan
  ↓
Show success message to parent
```

---

### Testing Checklist

- [ ] Test trial subscription creation
- [ ] Test successful payment
- [ ] Test failed payment (use test card `4000000000000341`)
- [ ] Test subscription cancellation
- [ ] Test plan upgrade (proration)
- [ ] Test plan downgrade (proration)
- [ ] Test webhook signature verification
- [ ] Test grace period flow
- [ ] Test trial expiration
- [ ] Test 3D Secure authentication (card `4000002500003155`)

> 🔗 **Stripe Test Cards:** https://stripe.com/docs/testing

---

## 7. Authentication & Security

### Authentication Strategy

#### JWT Token-Based Auth

| Token Type | Issued To | Expiry | Scope | Refresh |
|------------|-----------|--------|-------|---------|
| **Parent Token** | Parent users | 1 hour | Full parent access + child management | Yes (7 days) |
| **Child Token** | Child users | 24 hours | Single child access only | No |
| **Admin Token** | Admin users | 1 hour | Full platform access | Yes (7 days) |

#### Token Payload Structure

```javascript
// Parent JWT
{
  userId: "uuid",
  parentId: "uuid",
  role: "parent",
  email: "parent@example.com",
  iat: 1234567890,
  exp: 1234571490  // 1 hour later
}

// Child JWT
{
  childId: "uuid",
  parentId: "uuid",
  role: "child",
  code: "ABC123",
  iat: 1234567890,
  exp: 1234654290  // 24 hours later
}
```

---

### Password Security

| Aspect | Implementation |
|--------|---------------|
| **Hashing Algorithm** | bcrypt (cost factor 12) or Argon2id |
| **Salt** | Auto-generated per password |
| **Min Length** | 8 characters |
| **Complexity** | Require mix of uppercase, lowercase, numbers |
| **Storage** | Never store plaintext, only hash |

```javascript
// Password hashing example
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12;

// Hash on signup/password change
const passwordHash = await bcrypt.hash(plainPassword, SALT_ROUNDS);

// Verify on login
const isValid = await bcrypt.compare(plainPassword, storedHash);
```

---

### Email Verification

```
User signs up
  ↓
Generate verification token (UUID or JWT)
  ↓
Store token in database (with expiry: 24 hours)
  ↓
Send verification email with link:
  https://app.com/verify-email?token=xxx
  ↓
User clicks link
  ↓
Validate token (check expiry)
  ↓
Mark email as verified
  ↓
Delete used token
  ↓
Redirect to dashboard
```

**Requirements:**
- ✅ Require email verification before first subscription
- ✅ Re-send option (max 3 times per hour)
- ✅ Token expires after 24 hours

---

### Rate Limiting

| Endpoint | Limit | Window | Purpose |
|----------|-------|--------|---------|
| `/api/auth/login` | 5 attempts | 15 min per IP | Prevent brute force |
| `/api/child/enter` | 10 attempts | 15 min per IP | Prevent code guessing |
| `/api/auth/signup` | 3 signups | 1 hour per IP | Prevent spam accounts |
| `/api/auth/forgot-password` | 3 requests | 1 hour per email | Prevent email bombing |
| All API endpoints | 100 requests | 15 min per user | General protection |

**Implementation:**
- Use Redis for distributed rate limiting
- Return `429 Too Many Requests` with `Retry-After` header
- Consider IP + user combination for authenticated requests

---

### Authorization Middleware

```javascript
// Role-based access control
function requireRole(allowedRoles) {
  return (req, res, next) => {
    const { role } = req.user; // From JWT
    
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    next();
  };
}

// Resource ownership check
function requireParentOwnsChild(req, res, next) {
  const { parentId } = req.user;
  const { childId } = req.params;
  
  // Check if child belongs to parent
  const child = await Child.findOne({ id: childId, parentId });
  
  if (!child) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  next();
}

// Usage
app.get('/api/parent/children/:childId', 
  authenticate,
  requireRole(['parent']),
  requireParentOwnsChild,
  getChildDetails
);
```

---

### Child Code Security

#### Generation

```javascript
// Secure child code generation
function generateChildCode() {
  // Use characters that avoid ambiguity
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  // Remove: O, I, 0, 1 (ambiguous)
  
  let code;
  let exists = true;
  
  while (exists) {
    code = Array.from(
      { length: 6 },
      () => charset[crypto.randomInt(0, charset.length)]
    ).join('');
    
    // Ensure uniqueness
    exists = await Child.exists({ code });
  }
  
  return code;
}
```

#### Validation & Rate Limiting

- ✅ Max 10 failed attempts per IP per 15 minutes
- ✅ Temporary lockout after 5 consecutive failures
- ✅ Log suspicious activity (many different codes tried)
- ✅ CAPTCHA after 3 failures (optional)

---

### File Upload Security

#### Profile Pictures

| Security Measure | Implementation |
|------------------|----------------|
| **File Type Validation** | Only allow: `jpg`, `jpeg`, `png`, `webp` |
| **File Size Limit** | Max 5 MB |
| **Content Type Check** | Verify MIME type matches extension |
| **Magic Number Validation** | Check file headers (prevent disguised files) |
| **Filename Sanitization** | Use UUID + extension, discard original name |
| **Storage** | Private S3 bucket with signed URLs |
| **Virus Scanning** | Optional: ClamAV or AWS Macie |

```javascript
// File upload validation
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

function validateUpload(file) {
  // Check size
  if (file.size > MAX_SIZE) {
    throw new Error('File too large');
  }
  
  // Check MIME type
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    throw new Error('Invalid file type');
  }
  
  // Generate safe filename
  const ext = path.extname(file.originalname);
  const filename = `${uuidv4()}${ext}`;
  
  return filename;
}
```

---

### GDPR & Child Data Protection

#### Principles

| Principle | Implementation |
|-----------|----------------|
| **Data Minimization** | Collect only essential child data (name, age, progress) |
| **Parental Consent** | Parent explicitly consents when adding child |
| **Right to Deletion** | Provide child removal with data deletion |
| **Data Portability** | Export child progress in PDF/JSON format |
| **Transparency** | Clear privacy policy explaining child data use |
| **Retention Limits** | Auto-delete inactive child accounts after 2 years |

#### Child PII Policy

**Collect:**
- ✅ Name (first name only, no surname)
- ✅ Age (not date of birth)
- ✅ Gender (optional)
- ✅ Learning progress (anonymized in analytics)

**Never Collect:**
- ❌ Email address
- ❌ Phone number
- ❌ Full date of birth
- ❌ Physical address
- ❌ Social security number

#### Data Deletion Flow

```
Parent requests child removal
  ↓
Soft delete (mark as inactive)
  ↓
Grace period: 30 days (allow recovery)
  ↓
After 30 days:
  ├─ Delete child record
  ├─ Anonymize progress data (keep for analytics)
  ├─ Delete profile picture from S3
  ├─ Delete company data
  └─ Remove child achievements (keep achievement stats)
```

---

### HTTPS & Transport Security

- ✅ **Enforce HTTPS** for all traffic (redirect HTTP → HTTPS)
- ✅ **TLS 1.3** minimum version
- ✅ **HSTS Header** with max-age=31536000
- ✅ **Secure Cookies** with `Secure`, `HttpOnly`, `SameSite=Strict` flags

```javascript
// Cookie settings
res.cookie('token', jwt, {
  httpOnly: true,      // Not accessible via JavaScript
  secure: true,        // HTTPS only
  sameSite: 'strict',  // CSRF protection
  maxAge: 3600000      // 1 hour
});
```

---

### Security Headers

```javascript
// Helmet.js configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://js.stripe.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.stripe.com"],
      frameSrc: ["https://js.stripe.com"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

---

### Security Checklist

- [ ] Passwords hashed with bcrypt/Argon2
- [ ] Email verification enforced
- [ ] JWT tokens with short expiry
- [ ] Refresh token rotation
- [ ] Rate limiting on auth endpoints
- [ ] Child code brute-force protection
- [ ] File upload validation
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] GDPR compliance for child data
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (input sanitization)
- [ ] CSRF protection (tokens or SameSite cookies)
- [ ] Dependency vulnerability scanning
- [ ] Regular security audits

---

## 8. UI/UX Notes & Wireframe Guidance

### Design Principles by User Type

#### Parent UI (Ages 25-45)

| Principle | Implementation |
|-----------|----------------|
| **Professional & Clean** | Minimal design, lots of whitespace |
| **Clear Information Hierarchy** | Dashboard cards, clear CTAs |
| **Billing Transparency** | Always visible subscription status |
| **Trust Signals** | Security badges, testimonials |
| **Efficiency** | Quick access to common actions |

**Design Elements:**
- Clean sans-serif fonts (Inter, Roboto, Open Sans)
- Neutral color palette with accent color
- Card-based layouts
- Clear data visualization (charts for progress)
- Responsive for mobile and desktop

#### Child UI (Ages 6-16)

| Principle | Implementation |
|-----------|----------------|
| **Bright & Playful** | Vibrant colors, illustrations, animations |
| **Large Touch Targets** | Min 44x44px buttons for mobile |
| **Minimal Text** | Icons, images, short sentences |
| **Audio Support** | Voice narration for younger children |
| **Gamification** | Progress bars, badges, celebrations |
| **Safe Environment** | No external links, kid-safe content |

**Design Elements:**
- Rounded corners and friendly shapes
- Large, readable fonts (min 16px)
- Colorful iconography
- Animated feedback (confetti, stars, celebrations)
- Progress indicators everywhere
- Audio narration toggle

---

### Accessibility Requirements

#### WCAG 2.1 Level AA Compliance

| Area | Requirements |
|------|-------------|
| **Color Contrast** | Minimum 4.5:1 for text, 3:1 for UI components |
| **Keyboard Navigation** | Full site navigable with Tab, Enter, Escape |
| **Screen Readers** | ARIA labels, semantic HTML, alt text for all images |
| **Text Resize** | Support up to 200% zoom without breaking layout |
| **Focus Indicators** | Clear visual focus states for all interactive elements |
| **Form Labels** | All inputs have associated labels |

#### Additional Considerations

- ✅ Captions for video content
- ✅ Text alternatives for audio narration
- ✅ No flashing content (epilepsy risk)
- ✅ Simple language (Flesch-Kincaid grade 6-8 for child content)
- ✅ Dyslexia-friendly fonts available

---

### Micro-Interactions & Animations

#### Module Completion

```
User completes final quiz question
  ↓
Success checkmark animation (0.3s)
  ↓
Modal slides up from bottom (0.4s)
  ├─ "Module Complete!" header
  ├─ XP counter animates up (1s)
  ├─ Badge icon scales in (0.5s)
  └─ Confetti particle effect (2s)
  ↓
Haptic feedback (mobile)
  ↓
"Continue" button appears with bounce (0.3s)
```

#### Progress Bar

- Smooth transitions (0.5s ease-out)
- Color change at milestones (50%, 100%)
- Celebration at 100%

#### Button States

```css
/* Normal state */
background: primary-color;

/* Hover */
background: darken(primary-color, 10%);
transform: translateY(-2px);
box-shadow: 0 4px 12px rgba(0,0,0,0.15);

/* Active/Click */
transform: translateY(0);
box-shadow: 0 2px 6px rgba(0,0,0,0.1);
```

---

### Color Palette Suggestions

#### Parent UI

| Color | Hex | Usage |
|-------|-----|-------|
| **Primary** | `#4F46E5` (Indigo) | CTAs, links, accents |
| **Success** | `#10B981` (Green) | Active subscriptions, confirmations |
| **Warning** | `#F59E0B` (Amber) | Trial ending, payment issues |
| **Danger** | `#EF4444` (Red) | Cancellations, errors |
| **Neutral** | `#6B7280` (Gray) | Text, borders |
| **Background** | `#F9FAFB` (Light Gray) | Page background |

#### Child UI

| Color | Hex | Usage |
|-------|-----|-------|
| **Primary** | `#8B5CF6` (Purple) | Main actions |
| **Secondary** | `#EC4899` (Pink) | Badges, celebrations |
| **Success** | `#34D399` (Mint Green) | Completions |
| **Info** | `#60A5FA` (Blue) | Information |
| **XP Gold** | `#FBBF24` (Gold) | XP points, rewards |
| **Background** | `#FEF3C7` (Warm Cream) | Page background |

---

### Wireframe Screens (Priority Order)

#### Essential Screens (MVP)

1. **Landing Page / Pricing**
   - Hero with value proposition
   - 3-column pricing comparison
   - Feature highlights
   - Social proof (testimonials)
   - FAQ accordion
   - Footer with links

2. **Parent Signup & Plan Selection**
   - Email/password form
   - Social auth buttons (Google, Apple)
   - Plan selection cards
   - Terms checkbox
   - CTA button

3. **Payment Flow (Stripe Checkout)**
   - Redirect to Stripe hosted page
   - Success redirect to dashboard
   - Cancel redirect back to pricing

4. **Parent Dashboard**
   ```
   [Header: Logo | Name | Billing Badge | + Add Child | Settings | Logout]
   
   [Subscription Summary Card]
   - Plan: Standard
   - Next billing: Jan 15, 2025
   - Children: 2/5
   
   [Children Grid (Cards)]
   - Child 1 Card
     - Photo
     - Name, Age
     - Code: ABC123 (copy button)
     - Progress: 47%
     - [View Details] button
   
   - Child 2 Card ...
   
   - [+ Add Child] card
   ```

5. **Add Child Modal**
   ```
   [Modal Overlay]
   
   Add Child
   ──────────────
   Child Name: [        ]
   Age: [  ] years old
   Gender: ( ) Male ( ) Female ( ) Other ( ) Prefer not to say
   
   Profile Picture (optional):
   [Upload button]
   
   [Cancel]  [Add Child →]
   ```

6. **Child Code Entry Screen**
   ```
   [Child-friendly logo]
   
   Enter Your Code
   
   [A] [B] [C] [1] [2] [3]
   (Large input boxes)
   
   [Enter →]
   
   (Illustration of happy children)
   ```

7. **Child Home (Dashboard)**
   ```
   [Navigation: 🏢 Company | 📚 Modules | 🏆 Achievements | 👤 Profile]
   
   Welcome back, Alex!
   
   [Your Company Card]
   - Company Name
   - Revenue: $5,420
   - [Manage Company →]
   
   [Continue Learning]
   - Next Module: "Setting Prices"
   - 23% complete
   - [Continue →]
   
   [Recent Achievements]
   - Badge1, Badge2, Badge3
   ```

8. **Module Page**
   ```
   [Progress: Lesson 3 of 5]
   ████████░░░░░░░░░░ 60%
   
   [Video Player]
   or
   [Text Content]
   or
   [Quiz Question]
   
   [← Back]  [Continue →]
   ```

9. **Admin Module Editor**
   ```
   [Admin Navigation]
   
   Create Module
   
   [Tabs: Details | Lessons | Settings]
   
   Details Tab:
   - Title: [                    ]
   - Description: [              ]
   - Track: [dropdown            ]
   - XP Reward: [100             ]
   - Prerequisites: [multi-select]
   
   [Draft]  [Publish →]
   ```

---

### Responsive Design Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| **Mobile** | < 640px | Single column, stacked cards, hamburger menu |
| **Tablet** | 640px - 1024px | 2-column grid, side drawer menu |
| **Desktop** | > 1024px | 3-column grid, full navigation |

---

### Loading States

- **Skeleton screens** for content loading (better than spinners)
- **Progress indicators** for multi-step processes
- **Optimistic UI** where possible (show action before confirmation)
- **Toast notifications** for background actions

---

### Empty States

Design friendly empty states with:
- Illustration or icon
- Helpful message
- Clear CTA to resolve

**Example - No Children Yet:**
```
[Illustration of parent and child]

No children added yet

Add your first child to get started with their learning journey!

[+ Add Child]
```

---

## 9. Achievements, Progress & Scoring

### XP (Experience Points) System

#### XP Sources

| Activity | XP Awarded | Notes |
|----------|------------|-------|
| **Complete Module** | 100-500 XP | Based on difficulty (beginner/intermediate/advanced) |
| **Perfect Quiz** | +50 XP bonus | Score 100% on quiz |
| **Daily Streak** | +10 XP/day | Consecutive days active |
| **First Module** | +100 XP bonus | One-time achievement |
| **Company Milestone** | 50-200 XP | Revenue milestones |

#### XP Levels

| Level | Total XP Required | Title |
|-------|-------------------|-------|
| 1 | 0 | Beginner Entrepreneur |
| 2 | 500 | Junior Business Owner |
| 3 | 1,500 | Business Builder |
| 4 | 3,000 | Money Master |
| 5 | 5,000 | Young CEO |
| 6 | 10,000 | Startup Star |
| 7 | 20,000 | Business Expert |
| 8 | 50,000 | Entrepreneurship Legend |

---

### Progress Calculation

#### Overall Progress

```javascript
// Formula
overallProgress = (completedModules / totalPublishedModules) * 100

// Example
completedModules = 12
totalPublishedModules = 25
overallProgress = (12 / 25) * 100 = 48%
```

#### Track Progress

```javascript
// Progress per learning track
trackProgress = (completedModulesInTrack / totalModulesInTrack) * 100

// Tracks
- Money Basics (10 modules)
- Entrepreneurship 101 (15 modules)
- Advanced Business (20 modules)
```

---

### Achievement System

#### Achievement Categories

##### 1. Milestone Achievements

| Achievement | Criteria | Rarity | XP Bonus |
|-------------|----------|--------|----------|
| First Steps | Complete first module | Common | +100 |
| Getting Started | Complete 5 modules | Common | +200 |
| Dedicated Learner | Complete 10 modules | Rare | +500 |
| Knowledge Seeker | Complete 25 modules | Rare | +1,000 |
| Master Student | Complete 50 modules | Epic | +2,500 |
| Learning Legend | Complete all modules | Legendary | +5,000 |

##### 2. Performance Achievements

| Achievement | Criteria | Rarity | XP Bonus |
|-------------|----------|--------|----------|
| Perfect Score | Score 100% on any quiz | Common | +50 |
| Quiz Master | Score 100% on 10 quizzes | Rare | +500 |
| Speed Learner | Complete module in < 10 minutes | Rare | +300 |
| Perfectionist | Score 100% on 25 quizzes | Epic | +1,500 |

##### 3. Company Achievements

| Achievement | Criteria | Rarity | XP Bonus |
|-------------|----------|--------|----------|
| First Sale | Make first virtual sale | Common | +100 |
| Profit Maker | Reach $1,000 revenue | Common | +250 |
| Business Growth | Reach $5,000 revenue | Rare | +750 |
| Money Maker | Reach $10,000 revenue | Epic | +2,000 |
| Tycoon | Reach $50,000 revenue | Legendary | +5,000 |

##### 4. Engagement Achievements

| Achievement | Criteria | Rarity | XP Bonus |
|-------------|----------|--------|----------|
| Committed | 7-day learning streak | Common | +200 |
| Dedicated | 14-day learning streak | Rare | +500 |
| Persistent | 30-day learning streak | Epic | +1,500 |
| Unstoppable | 60-day learning streak | Legendary | +3,000 |

---

### Streak System

#### Daily Streaks

```
Day 1: Login/activity → Start streak (1 day)
Day 2: Login/activity → Increment streak (2 days)
Day 3: No activity → Streak resets to 0
Day 4: Login/activity → Start new streak (1 day)
```

**Streak Rules:**
- ✅ Activity counted: Complete lesson, quiz attempt, company update
- ✅ Streak preserved if activity within 24 hours
- ✅ Grace period: 1 "freeze" per week (miss one day without breaking streak)
- ✅ Streak display: 🔥 icon with day count

**Streak Rewards:**

| Milestone | Reward |
|-----------|--------|
| 7 days | +200 XP + "Committed" badge |
| 14 days | +500 XP + "Dedicated" badge |
| 30 days | +1,500 XP + "Persistent" badge |
| 60 days | +3,000 XP + "Unstoppable" badge |

---

### Progress Tracking Data Flow

```
Child completes quiz (final step of module)
  ↓
1. Validate quiz submission
   └─ Check answers, calculate score
  ↓
2. Create Activity record
   ├─ type: "module_complete"
   ├─ moduleId
   ├─ result: { quizScore: 95 }
   ├─ points: baseXP + bonuses
   └─ completedAt: timestamp
  ↓
3. Award XP
   ├─ Base: 100 XP (module base)
   ├─ Bonus: +50 XP (quiz score 100%)
   ├─ Streak: +10 XP (3-day streak)
   └─ Total: 160 XP
  ↓
4. Update child's total XP
   └─ Check if level up → Show level up animation
  ↓
5. Check achievement criteria
   ├─ "10 Modules Completed" → Unlocked!
   ├─ "Perfect Score" → Already earned
   └─ "7-Day Streak" → Not yet
  ↓
6. Award new achievements
   └─ Create ChildAchievement record
  ↓
7. Update company resources (if applicable)
   └─ Award virtual currency based on module
  ↓
8. Unlock next modules
   └─ Check prerequisites satisfied
  ↓
9. Notify child (UI)
   ├─ Show celebration modal
   ├─ Display XP earned
   ├─ Show new badges
   └─ Confetti animation
  ↓
10. Notify parent (optional)
    └─ Email digest: "Alex completed Module 5!"
  ↓
11. Update progress calculations
    ├─ Overall progress: 48% → 52%
    └─ Track progress updates
```

---

### Progress Visualization

#### For Children

```
Main Dashboard:
  XP: 1,250 / 1,500 (Level 2 → Level 3)
  ████████████░░░░ 83%
  
  Progress: 12 / 25 modules (48%)
  ██████████░░░░░░░░░░░░ 48%
  
  Streak: 🔥 5 days
```

#### For Parents

```
Child Detail View:
  
  [Progress Timeline]
  ━━━━━━━●━━━━━━━━━━━━ 48%
  
  Completed Modules:
  ✅ Module 1 (Jan 5)
  ✅ Module 2 (Jan 7)
  ✅ Module 3 (Jan 9)
  ...
  
  Recent Activity:
  - Completed "Money Basics" (2 hours ago)
  - Earned "Perfect Score" badge (Yesterday)
  - 5-day streak! (Today)
```

---

### Virtual Economy (Company Builder)

#### Currency System

| Currency | Earned From | Used For |
|----------|-------------|----------|
| **Capital** | Starting amount, module rewards | Company expenses, investments |
| **Revenue** | Virtual sales from mini-games | Track business growth |
| **XP** | Module completion, achievements | Level progression only |

**Note:** Virtual currency is separate from XP and only used within company builder.

---

### Leaderboards (Phase 2 - Optional)

#### Anonymous Leaderboards

**Privacy-Safe Design:**
- Display child by nickname only (not real name)
- No photos or personal information
- Parent opt-in required
- Can toggle visibility on/off

**Leaderboard Types:**
- Top XP earners (this month)
- Longest streaks (current)
- Most modules completed (all-time)

```
Top Learners This Month
1. 🥇 Business_Star_2024 - 2,450 XP
2. 🥈 MoneyKid47 - 2,320 XP
3. 🥉 YoungCEO - 2,180 XP
...
15. You (SuperKid123) - 1,850 XP
```

---

## 10. Notifications & Emails

### Email Events (Parents)

| Event | Trigger | Subject Line | Priority |
|-------|---------|--------------|----------|
| **Welcome** | Account creation | "Welcome to [Platform]!" | High |
| **Email Verification** | Signup | "Verify your email address" | High |
| **Subscription Started** | First payment success | "Your subscription is active!" | High |
| **Trial Ending** | 3 days before trial ends | "Your trial ends in 3 days" | High |
| **Payment Succeeded** | Monthly/annual charge | "Receipt for your subscription" | Medium |
| **Payment Failed** | Payment declined | "⚠️ Payment failed - Action required" | High |
| **Subscription Canceled** | Cancellation confirmed | "Subscription canceled" | Medium |
| **Child Added** | New child created | "Child added successfully" | Medium |
| **Weekly Digest** | Every Monday (opt-in) | "Your child's weekly progress" | Low |
| **Child Achievement** | Badge earned (opt-in) | "🎉 [Child] earned a new badge!" | Low |
| **Password Reset** | Forgot password | "Reset your password" | High |

---

### In-App Notifications (Children)

| Event | Message | Style |
|-------|---------|-------|
| **Module Unlocked** | "New module unlocked: [Module Name]!" | Success toast |
| **Badge Awarded** | "Achievement unlocked: [Badge Name]!" | Modal with animation |
| **Level Up** | "Level up! You're now Level [N]" | Celebration modal |
| **Streak Milestone** | "🔥 [N] day streak! Keep it up!" | Toast notification |
| **Next Module** | "Ready for your next challenge?" | Gentle prompt |

---

### In-App Notifications (Parents)

| Event | Message | Style |
|-------|---------|-------|
| **Child Progress** | "[Child] completed [Module]" | Info toast |
| **Subscription Warning** | "Trial ends in [N] days" | Warning banner |
| **Payment Issue** | "Payment failed - Update payment method" | Error banner |
| **Child Achievement** | "[Child] earned [Badge]!" | Success toast |

---

### Email Templates

#### 1. Welcome Email

```
Subject: Welcome to [Platform]! 🎉

Hi [Parent Name],

Welcome to [Platform]! We're excited to help your children learn about money and entrepreneurship.

Here's what to do next:

1. ✅ Verify your email (click button below)
2. 👶 Add your first child
3. 📝 Get their unique access code
4. 🚀 Start learning!

[Verify Email] button

Need help? Reply to this email or visit our Help Center.

Cheers,
The [Platform] Team
```

#### 2. Payment Failed Email

```
Subject: ⚠️ Payment failed - Action required

Hi [Parent Name],

We couldn't process your payment for [Platform].

Amount: $[amount]
Payment method: Card ending in [last4]
Reason: [reason]

What you need to do:
• Update your payment method
• Make sure your card has sufficient funds

[Update Payment Method] button

Your subscription is still active for [N] days while we retry.

Questions? Contact us at support@example.com

Best regards,
The [Platform] Team
```

#### 3. Weekly Progress Digest (Optional)

```
Subject: [Child]'s weekly progress update 📊

Hi [Parent Name],

Here's what [Child] accomplished this week:

✅ Modules Completed: 3
🏆 Badges Earned: 2
🔥 Current Streak: 5 days
📈 Progress: 45% → 53%

Recent achievements:
• Completed "Money Basics" module
• Earned "Perfect Score" badge
• Company reached $2,500 revenue

[View Full Progress] button

Keep encouraging [Child] to continue learning!

Cheers,
The [Platform] Team
```

---

### Email Service Provider

#### Recommended Options

| Provider | Pros | Pricing | Best For |
|----------|------|---------|----------|
| **SendGrid** | High deliverability, good templates | Free up to 100/day, then $15/mo | Startups |
| **Postmark** | Excellent deliverability, fast | $10/mo for 10K emails | Transactional |
| **AWS SES** | Very cheap, scalable | $0.10 per 1K emails | High volume |
| **Resend** | Modern API, great DX | Free up to 3K/mo | Developers |

---

### Email Best Practices

#### Technical Setup

- ✅ **SPF, DKIM, DMARC** configured for domain
- ✅ **Dedicated sending domain** (emails@platform.com)
- ✅ **Warm up IP** gradually (if self-hosted)
- ✅ **Bounce handling** (remove invalid emails)
- ✅ **Unsubscribe link** in all marketing emails
- ✅ **List-Unsubscribe header** for one-click unsub

#### Content Guidelines

- ✅ Clear, actionable subject lines (< 50 characters)
- ✅ Personalization (use recipient name)
- ✅ Mobile-responsive templates
- ✅ Plain text alternative (for accessibility)
- ✅ Clear CTA buttons
- ✅ Company branding consistent

---

### Notification Preferences

#### Parent Settings

```
Email Preferences
─────────────────

Essential (cannot disable):
☑ Payment confirmations
☑ Payment failures
☑ Security alerts
☑ Account changes

Optional:
☑ Child achievements
☑ Weekly progress digest
☐ Product updates
☐ Tips and resources

[Save Preferences]
```

#### Notification Frequency

| Type | Max Frequency |
|------|---------------|
| **Achievement emails** | 1 per day (batched) |
| **Progress digest** | Weekly (Monday) |
| **Payment reminders** | 3 reminders over 7 days |
| **Marketing emails** | Max 1 per week |

---

### Push Notifications (Phase 2 - Mobile App)

If building mobile app:

| Event | Notification | Timing |
|-------|--------------|--------|
| **Daily Reminder** | "Ready to learn? [Child] is waiting!" | 4PM local time |
| **Streak Risk** | "Don't break your streak! Quick lesson?" | 8PM if no activity today |
| **New Module** | "New adventure unlocked!" | Immediately |
| **Badge Earned** | "🎉 New badge: [Name]" | Immediately |

**Settings:**
- Allow parents to control notification times
- Quiet hours (e.g., 9PM - 8AM)
- Opt-out available

---

## 11. Error States & Edge Cases

### Payment & Billing Edge Cases

| Scenario | Handling | User Experience |
|----------|----------|-----------------|
| **Payment Declined** | 1. Mark as `past_due`<br>2. Stripe auto-retries (3 attempts)<br>3. Grace period: 7 days<br>4. Email notifications | - Show banner: "Payment failed"<br>- Button: "Update payment method"<br>- Children keep access during grace period |
| **Card Expired** | Detect expiring cards 30 days before | Email: "Your card expires soon"<br>Dashboard notice |
| **Insufficient Funds** | Stripe retry logic | Email with retry schedule |
| **Subscription Canceled** | 1. Cancel at period end (default)<br>2. Access until `currentPeriodEnd` | Dashboard: "Canceled, active until [date]"<br>Option to reactivate |
| **Downgrade Mid-Cycle** | Apply at period end | "Plan change effective [date]"<br>Prorated credit applied |
| **Upgrade Mid-Cycle** | Apply immediately | Charge prorated difference<br>Immediate access to features |
| **Refund Issued** | Revoke access immediately | Email confirmation<br>Child codes deactivated |

---

### Child Code Edge Cases

| Scenario | Handling | User Experience |
|----------|----------|-----------------|
| **Code Collision** | Regenerate on conflict (before saving) | Never exposed to user |
| **Code Entry - Too Many Failures** | Rate limit: 10 attempts per 15 min | "Too many attempts. Try again in 15 minutes" |
| **Invalid Code** | Check DB, return generic error | "Invalid code. Please check and try again" |
| **Expired Code** | Parent deleted child or subscription lapsed | "This code is no longer valid. Contact your parent" |
| **Code Already Used** | Same child logging in again | Allow login (same child) |
| **Multiple Devices** | Allow (child can use multiple devices) | Sync progress across devices |

---

### Child Data Management

| Scenario | Handling | Data Retention |
|----------|----------|----------------|
| **Parent Deletes Child** | 1. Soft delete (mark `active: false`)<br>2. Code becomes invalid<br>3. Archive for 30 days<br>4. Hard delete after 30 days | **30-day grace period:**<br>- Parent can restore<br>- Data retained<br><br>**After 30 days:**<br>- Delete child record<br>- Delete profile picture<br>- Delete company<br>- Anonymize progress (keep stats) |
| **Parent Cancels Subscription** | Children keep access until period end | **On period end:**<br>- Deactivate all child codes<br>- Show "subscription expired" screen |
| **Account Dormant (2 years)** | Auto-delete inactive children | Email warning at 18 months |

---

### Module Progress Edge Cases

| Scenario | Handling | User Experience |
|----------|----------|-----------------|
| **Partial Module Completion** | Auto-save progress after each lesson | Resume from last completed lesson |
| **Quiz Failed (< 70%)** | Allow retry unlimited times | "Try again" button<br>Show correct answers option |
| **Module Accessed Without Prerequisites** | Block access | "Complete [Module X] first" message |
| **Module Unpublished Mid-Progress** | Allow completion if started | New children can't start<br>In-progress children can finish |
| **Content Updated Mid-Progress** | Show new content on next visit | No disruption to current progress |
| **Simultaneous Completions** | Use DB transactions | Prevent duplicate XP/achievements |

---

### Subscription Access Edge Cases

| Scenario | Handling | UI State |
|----------|----------|----------|
| **Child Tries to Access After Subscription Ends** | Check `currentPeriodEnd` on every request | **Blocked Screen:**<br>"⚠️ Subscription Expired"<br>"Ask your parent to renew"<br>[Contact Parent] button |
| **Trial Ends, No Payment Method** | Block access immediately | "Trial ended - Please subscribe" |
| **Payment Failed, Grace Period** | Allow access with warning | Yellow banner: "Payment issue - Update soon" |
| **Plan Limit Exceeded** | Block adding more children | "Upgrade plan to add more children" |

---

### Network & System Errors

| Error Type | Status Code | User Message | Technical Action |
|------------|-------------|--------------|------------------|
| **Network Timeout** | 504 | "Slow connection. Please wait..." | Auto-retry 3 times |
| **Server Error** | 500 | "Something went wrong. We're fixing it!" | Log error, alert team |
| **Not Found** | 404 | "Content not found" | Log, offer navigation |
| **Unauthorized** | 401 | "Session expired. Please log in again" | Clear token, redirect to login |
| **Forbidden** | 403 | "You don't have permission" | Log access attempt |
| **Rate Limited** | 429 | "Too many requests. Please slow down" | Show retry timer |

---

### Data Consistency Edge Cases

| Scenario | Prevention | Recovery |
|----------|-----------|----------|
| **Duplicate Achievement Award** | Unique constraint `(childId, achievementId)` | Database constraint prevents |
| **Negative Virtual Currency** | Validation before transactions | Rollback transaction |
| **XP Overflow** | Set max XP limit (e.g., 1 million) | Cap at maximum |
| **Orphaned Records** | Foreign key constraints with `ON DELETE CASCADE` | Database enforces |
| **Concurrent Updates** | Optimistic locking or transactions | Last write wins or retry |

---

### Error Messages Best Practices

#### For Parents (Professional Tone)

```
❌ BAD: "Error 500"
✅ GOOD: "We're experiencing technical difficulties. Please try again in a few minutes."

❌ BAD: "Payment failed"
✅ GOOD: "We couldn't process your payment. Please update your payment method to continue."

❌ BAD: "Invalid input"
✅ GOOD: "Please enter a valid email address (e.g., parent@example.com)"
```

#### For Children (Friendly Tone)

```
❌ BAD: "Access denied"
✅ GOOD: "Oops! You need to finish Module 1 first 🎯"

❌ BAD: "Error loading content"
✅ GOOD: "Having trouble loading? Let's try that again! 🔄"

❌ BAD: "Invalid code"
✅ GOOD: "Hmm, that code doesn't look right. Check with your parent! 🔍"
```

---

### Fallback Strategies

| Feature | Primary Method | Fallback |
|---------|----------------|----------|
| **Video Lessons** | Embedded player (YouTube/Vimeo) | Text transcript + images |
| **Profile Pictures** | S3 upload | Default avatar (initials) |
| **Progress Charts** | Interactive charts (Chart.js) | Simple progress bars |
| **Animations** | CSS animations | Static images |
| **Audio Narration** | Audio files | Text only |

---

### Monitoring & Alerts

#### Critical Errors (Page Team Immediately)

- Payment webhook failures
- Database connection failures
- Authentication system down
- Stripe API errors

#### Warning Errors (Email Alert)

- High rate of payment failures
- Unusual child code attempts
- Slow API response times
- Email delivery failures

#### Info Logs (Monitor Dashboard)

- User signups
- Module completions
- Subscription changes
- Feature usage stats

---

## 12. Acceptance Criteria / Test Cases (Example)

### Parent Signup & Billing

| Test Case | Given | When | Then | Priority |
|-----------|-------|------|------|----------|
| **TC-001** | New parent visits landing page | They click "Start free trial" and complete signup | - Account created<br>- Email verification sent<br>- Redirected to plan selection | Critical |
| **TC-002** | Parent selects a plan | They enter payment details and submit | - Stripe subscription created with trial<br>- Parent redirected to dashboard<br>- Welcome email sent | Critical |
| **TC-003** | Payment method declined | Stripe returns payment failure | - Parent shown error message<br>- Prompted to update payment<br>- Subscription not created | Critical |
| **TC-004** | Active subscription | Stripe webhook `invoice.payment_succeeded` received | - Subscription status updated to `active`<br>- Receipt email sent<br>- `currentPeriodEnd` updated | Critical |
| **TC-005** | Payment fails | Stripe webhook `invoice.payment_failed` received | - Status updated to `past_due`<br>- Parent receives email<br>- Dashboard shows warning<br>- Children keep access (grace period) | Critical |

---

### Child Onboarding

| Test Case | Given | When | Then | Priority |
|-----------|-------|------|------|----------|
| **TC-010** | Parent logged in | They click "Add Child" and fill form | - Child record created<br>- Unique 6-char code generated<br>- Code displayed with QR<br>- Child inherits subscription | Critical |
| **TC-011** | Child has valid code | They enter code on child login page | - Code validated<br>- Child JWT token issued<br>- Redirected to child dashboard | Critical |
| **TC-012** | Child enters invalid code | They submit incorrect code | - Error message shown<br>- No authentication<br>- Rate limit applied | High |
| **TC-013** | Parent deletes child | They click delete and confirm | - Child marked inactive<br>- Code invalidated<br>- 30-day soft delete period starts | High |

---

### Module Learning & Progress

| Test Case | Given | When | Then | Priority |
|-----------|-------|------|------|----------|
| **TC-020** | Child starts a module | They click "Start Module" | - Activity record created<br>- First lesson displayed<br>- Progress bar shows 0% | Critical |
| **TC-021** | Child completes all lessons | They finish quiz with 70%+ score | - Module marked complete<br>- XP awarded<br>- Achievement checked and awarded<br>- Next module unlocked<br>- Celebration shown | Critical |
| **TC-022** | Child fails quiz (< 70%) | They submit quiz answers | - Quiz not passed<br>- "Try again" option shown<br>- No XP awarded<br>- Module not completed | High |
| **TC-023** | Child tries locked module | They click module without prerequisites | - Access blocked<br>- Message: "Complete [X] first"<br>- Prerequisite highlighted | High |
| **TC-024** | Child partially completes module | They complete 2 of 5 lessons and logout | - Progress auto-saved<br>- On return, resume from lesson 3 | Medium |

---

### Achievement System

| Test Case | Given | When | Then | Priority |
|-----------|-------|------|------|----------|
| **TC-030** | Child completes first module | Module completion triggers | - "First Steps" achievement unlocked<br>- Badge displayed<br>- XP bonus awarded<br>- Parent notified (if opted in) | High |
| **TC-031** | Child earns duplicate achievement | Same achievement triggered again | - Database constraint prevents duplicate<br>- No error shown to user | Medium |
| **TC-032** | Child reaches 7-day streak | They complete activity on 7th consecutive day | - "Committed" badge awarded<br>- Streak milestone celebration<br>- XP bonus granted | Medium |

---

### Admin Module Management

| Test Case | Given | When | Then | Priority |
|-----------|-------|------|------|----------|
| **TC-040** | Admin creates new module | They fill form and save as draft | - Module created with `published: false`<br>- Not visible to children<br>- Visible in admin panel | High |
| **TC-041** | Admin publishes module | They click "Publish" on draft | - `published: true`<br>- `publishedAt` timestamp set<br>- Module appears for children (if prerequisites met) | High |
| **TC-042** | Admin edits published module | They update content and save | - Content updated in database<br>- Children see new content on refresh<br>- In-progress children not disrupted | High |
| **TC-043** | Admin deletes module | They delete module with children in progress | - Soft delete (archiving)<br>- Children in progress can finish<br>- New children can't start | Medium |

---

### Subscription Management

| Test Case | Given | When | Then | Priority |
|-----------|-------|------|------|----------|
| **TC-050** | Parent upgrades plan | They select higher tier | - Stripe subscription updated<br>- Prorated charge applied<br>- Plan updated immediately<br>- Confirmation shown | High |
| **TC-051** | Parent cancels subscription | They click cancel and confirm | - `cancelAtPeriodEnd: true`<br>- Access until `currentPeriodEnd`<br>- Cancellation email sent<br>- Option to reactivate shown | High |
| **TC-052** | Subscription period ends | `currentPeriodEnd` date reached | - If canceled: deactivate child codes<br>- If active: renew subscription<br>- Invoice generated | Critical |
| **TC-053** | Trial ends without payment | 14-day trial expires | - Access blocked<br>- Parent shown subscribe prompt<br>- Children shown "expired" screen | Critical |

---

### Security Tests

| Test Case | Given | When | Then | Priority |
|-----------|-------|------|------|----------|
| **TC-060** | Attacker tries SQL injection | They enter `' OR '1'='1` in login | - Input sanitized/parameterized<br>- Login fails<br>- No database compromise | Critical |
| **TC-061** | Attacker brute forces child code | They try 20 codes in 5 minutes | - Rate limit triggered after 10<br>- IP temporarily blocked<br>- Error: "Too many attempts" | Critical |
| **TC-062** | Parent tries to access another's child | They modify childId in URL | - Authorization check fails<br>- 403 Forbidden returned<br>- Access denied | Critical |
| **TC-063** | XSS attempt in child name | Parent enters `<script>alert('xss')</script>` | - Input sanitized on save<br>- Rendered safely (escaped)<br>- No script execution | Critical |

---

### Testing Checklist

#### Unit Tests

- [ ] Password hashing and verification
- [ ] Child code generation uniqueness
- [ ] XP calculation logic
- [ ] Achievement criteria evaluation
- [ ] Progress percentage calculation
- [ ] Virtual currency transactions

#### Integration Tests

- [ ] Full signup → subscription → add child flow
- [ ] Module completion → XP award → achievement unlock
- [ ] Payment failure → webhook → status update
- [ ] Stripe subscription lifecycle
- [ ] Email sending for all events

#### End-to-End Tests

- [ ] Parent journey: signup → subscribe → add child → view progress
- [ ] Child journey: login → complete module → earn badge
- [ ] Admin journey: create module → publish → view analytics
- [ ] Payment failure → retry → success flow
- [ ] Subscription cancellation → access revocation

#### Performance Tests

- [ ] API response time < 200ms (p95)
- [ ] Module loading time < 1s
- [ ] Dashboard load time < 2s
- [ ] Handle 100 concurrent users
- [ ] Database query optimization

#### Security Tests

- [ ] Penetration testing (OWASP Top 10)
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Authentication bypass attempts
- [ ] Authorization escalation attempts

#### Accessibility Tests

- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Color contrast (WCAG AA)
- [ ] Text resize to 200%
- [ ] Focus indicators visible

#### Browser/Device Tests

- [ ] Chrome (latest 2 versions)
- [ ] Firefox (latest 2 versions)
- [ ] Safari (latest 2 versions)
- [ ] Edge (latest version)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## 13. MVP vs Later Phases

### MVP (Phase 1) — Must-Haves

> **Timeline:** 8-12 weeks | **Goal:** Validate concept, acquire first 100 users

#### Core Features

| Feature | Description | Estimated Effort |
|---------|-------------|------------------|
| **Parent Authentication** | Email/password signup, login, password reset | 1 week |
| **Stripe Subscription** | Checkout integration, 3 plans, trial period | 2 weeks |
| **Child Management** | Add/edit/delete children, generate access codes | 1 week |
| **Child Authentication** | Code-based login, JWT tokens | 1 week |
| **Module System** | Display modules, lessons (text/video), basic quiz | 2 weeks |
| **Progress Tracking** | Track module completion, calculate progress % | 1 week |
| **Admin CMS** | Create/edit/publish modules and lessons | 2 weeks |
| **Stripe Webhooks** | Handle payment events, sync subscription status | 1 week |
| **Basic UI** | Responsive design, parent + child dashboards | 2 weeks |

**MVP Scope Limitations:**
- ❌ No company builder (Phase 2)
- ❌ No achievements/badges (Phase 2)
- ❌ No email notifications (basic only)
- ❌ No advanced analytics (basic metrics only)
- ❌ No leaderboards
- ❌ No mobile app (web only)

**Success Metrics:**
- 100 parent signups
- 50 active subscriptions
- 10% trial → paid conversion
- 5+ modules completed per child (average)

---

### Phase 2 — Enhanced Experience

> **Timeline:** 8-10 weeks | **Goal:** Increase engagement, reduce churn

#### Additional Features

| Feature | Description | Value |
|---------|-------------|-------|
| **Achievement System** | Badges, XP, levels, streaks | Gamification → +30% engagement |
| **Company Builder** | Virtual company simulator, revenue tracking | Practical application of learning |
| **Email Notifications** | Weekly digest, achievement emails | Keep parents engaged |
| **Progress Export** | PDF reports for parents | Parent value-add |
| **Advanced Admin** | Analytics dashboard, user management | Better operations |
| **Audio Narration** | Voice-over for younger children | Accessibility improvement |
| **Quiz Improvements** | Multiple question types, explanations | Better learning outcomes |

**Phase 2 Goals:**
- Increase child engagement from 2 → 4 sessions/week
- Reduce churn from 10% → 5%
- Increase module completion rate by 40%

---

### Phase 3 — Scale & Expand

> **Timeline:** 12-16 weeks | **Goal:** Scale to 10K users, international expansion

#### Advanced Features

| Feature | Description | Impact |
|---------|-------------|--------|
| **Mobile Apps** | iOS + Android native apps | Wider accessibility |
| **Multi-language** | Spanish, French, German support | International markets |
| **Offline Mode** | Download lessons for offline access | Emerging markets |
| **Social Features** | Anonymous leaderboards, challenges | Community engagement |
| **Advanced Company Builder** | Marketplace, trading, competitions | Deep engagement |
| **Live Classes** | Optional live webinars with instructors | Premium tier feature |
| **API & Integrations** | Zapier, webhooks for schools | B2B opportunity |
| **White-Label** | Rebrand for schools/organizations | B2B revenue stream |

**Phase 3 Goals:**
- 10,000 active subscriptions
- Expand to 3 countries
- Launch B2B offering for schools
- $50K+ MRR

---

### Feature Prioritization Matrix

| Feature | User Value | Business Value | Effort | Priority |
|---------|------------|----------------|--------|----------|
| **Stripe subscription** | High | Critical | Medium | MVP |
| **Child code login** | High | Critical | Low | MVP |
| **Module completion** | High | High | Medium | MVP |
| **Admin CMS** | Medium | Critical | High | MVP |
| **Achievement system** | High | High | Medium | Phase 2 |
| **Company builder** | High | Medium | High | Phase 2 |
| **Email notifications** | Medium | Medium | Low | Phase 2 |
| **PDF export** | Medium | Low | Low | Phase 2 |
| **Mobile apps** | High | High | Very High | Phase 3 |
| **Multi-language** | Medium | High | High | Phase 3 |
| **Leaderboards** | Medium | Medium | Medium | Phase 3 |
| **Offline mode** | Medium | Medium | High | Phase 3 |

---

### MVP Launch Checklist

#### Pre-Launch

- [ ] **Content Ready:** Minimum 10 modules created
- [ ] **Pricing Set:** 3 tier pricing finalized
- [ ] **Payment Tested:** Stripe test mode working
- [ ] **Legal Docs:** Terms, Privacy Policy, COPPA compliance
- [ ] **Email Setup:** Transactional emails configured
- [ ] **Domain:** Purchase and configure
- [ ] **Hosting:** Deploy to production environment
- [ ] **SSL:** HTTPS enabled
- [ ] **Analytics:** Google Analytics / Mixpanel setup
- [ ] **Error Tracking:** Sentry or similar configured
- [ ] **Backup:** Database backup strategy
- [ ] **Monitoring:** Uptime monitoring (Pingdom/UptimeRobot)

#### Launch Week

- [ ] **Beta Users:** 10-20 beta testers invited
- [ ] **Bug Fixes:** All critical bugs resolved
- [ ] **Performance:** Load testing completed
- [ ] **Security:** Vulnerability scan completed
- [ ] **Documentation:** Help docs and FAQs published
- [ ] **Support:** Support email setup (help@platform.com)
- [ ] **Announcement:** Landing page live
- [ ] **Social Media:** Accounts created and branded

#### Post-Launch (First Month)

- [ ] **User Feedback:** Collect and analyze feedback
- [ ] **Metrics Review:** Daily active users, conversions
- [ ] **Bug Fixes:** Address reported issues
- [ ] **Content:** Add 5 more modules
- [ ] **Marketing:** Begin content marketing
- [ ] **Pricing Optimization:** A/B test pricing if needed

---

### Technical Debt & Future Refactoring

| Item | Current State | Future State | Phase |
|------|---------------|--------------|-------|
| **Auth System** | Custom JWT | Consider Auth0/Clerk | Phase 2 |
| **File Storage** | Basic S3 | Add CDN (CloudFront) | Phase 2 |
| **Database** | PostgreSQL single instance | Read replicas, connection pooling | Phase 3 |
| **Caching** | None | Redis for sessions & queries | Phase 2 |
| **Search** | SQL LIKE queries | Elasticsearch/Algolia | Phase 3 |
| **Video Hosting** | YouTube embeds | Self-hosted or Vimeo Pro | Phase 3 |
| **Email** | Basic SendGrid | Advanced templates, personalization | Phase 2 |

---

## 14. Suggested Tech Stack & Infrastructure

### Frontend Stack

| Layer | Technology | Justification | Alternatives |
|-------|------------|---------------|--------------|
| **Framework** | **React 18+** with TypeScript | - Most popular<br>- Great ecosystem<br>- Type safety<br>- Excellent tooling | Next.js (if SSR needed), Vue, Svelte |
| **Styling** | **Tailwind CSS** | - Utility-first<br>- Fast development<br>- Small bundle size<br>- Great DX | CSS Modules, Styled Components |
| **Component Library** | **shadcn/ui** or **Radix UI** | - Accessible by default<br>- Customizable<br>- Unstyled primitives | MUI, Chakra UI, Ant Design |
| **State Management** | **Zustand** or **React Query** | - Simple API<br>- Less boilerplate than Redux<br>- Server state caching (React Query) | Redux Toolkit, Jotai, Recoil |
| **Forms** | **React Hook Form** + **Zod** | - Performant<br>- Type-safe validation<br>- Great DX | Formik, Final Form |
| **Routing** | **React Router v6** | - Industry standard<br>- Full-featured | TanStack Router |
| **Build Tool** | **Vite** | - Lightning fast<br>- Modern<br>- Great HMR | Create React App (deprecated), webpack |
| **Testing** | **Vitest** + **Testing Library** | - Fast unit tests<br>- React-friendly | Jest, Cypress (E2E) |

**Package Manager:** pnpm (faster than npm/yarn)

---

### Backend Stack

#### Option 1: Node.js (Recommended for Full-Stack JS)

| Layer | Technology | Justification |
|-------|------------|---------------|
| **Runtime** | **Node.js 20 LTS** | Latest stable, modern features |
| **Framework** | **Express.js** or **Fastify** | - Express: battle-tested<br>- Fastify: faster, modern |
| **Language** | **TypeScript** | Type safety, better DX |
| **ORM** | **Prisma** or **Drizzle** | - Type-safe queries<br>- Migrations<br>- Great DX |
| **Validation** | **Zod** | - Type-safe schemas<br>- Shared with frontend |
| **Authentication** | **jsonwebtoken** | JWT generation/verification |
| **File Upload** | **multer** + **sharp** | File handling + image processing |

#### Option 2: Python (Alternative)

| Layer | Technology | Justification |
|-------|------------|---------------|
| **Framework** | **FastAPI** | - Fast<br>- Auto docs<br>- Type hints<br>- Async support |
| **ORM** | **SQLAlchemy** or **Tortoise ORM** | - Mature<br>- Full-featured |
| **Validation** | **Pydantic** | - Built into FastAPI<br>- Type-safe |

> 💡 **Recommendation:** Use Node.js + TypeScript for code sharing between frontend and backend (types, validation schemas).

---

### Database & Storage

| Component | Technology | Configuration | Justification |
|-----------|------------|---------------|---------------|
| **Primary Database** | **PostgreSQL 15+** | - Connection pooling (PgBouncer)<br>- Regular backups<br>- Point-in-time recovery | - Reliable<br>- ACID compliant<br>- JSON support<br>- Great for relational data |
| **Caching** | **Redis 7+** | - Session storage<br>- Rate limiting<br>- Job queues | - In-memory speed<br>- Pub/sub support<br>- Persistence option |
| **Object Storage** | **AWS S3** | - Private bucket<br>- Signed URLs<br>- CloudFront CDN (Phase 2) | - Scalable<br>- Cheap<br>- Industry standard |
| **Search** (Phase 3) | **Elasticsearch** or **Typesense** | Full-text search for modules | Better search UX |

**Database Hosting Options:**
- **Neon** (Serverless Postgres, free tier)
- **Supabase** (Postgres + auth + storage)
- **AWS RDS** (Managed PostgreSQL)
- **Railway** (Simple, developer-friendly)

---

### Third-Party Services

| Service | Provider | Purpose | Pricing |
|---------|----------|---------|---------|
| **Payments** | **Stripe** | Subscriptions, checkout, webhooks | 2.9% + $0.30 per transaction |
| **Email** | **Resend** or **SendGrid** | Transactional emails | Free tier available |
| **Auth** (Optional) | **Clerk** or **Auth0** | Managed authentication | Free tier: 10K MAU |
| **Error Tracking** | **Sentry** | Error monitoring, alerts | Free tier: 5K events/mo |
| **Analytics** | **Posthog** or **Mixpanel** | Product analytics | Free tier available |
| **Monitoring** | **Betterstack** or **Datadog** | Uptime, logs, APM | Varies |
| **CDN** | **Cloudflare** or **CloudFront** | Static asset delivery | Cloudflare: Free tier |

---

### Hosting & Deployment

#### Frontend Hosting

| Provider | Pros | Cons | Pricing |
|----------|------|------|---------|
| **Vercel** | - Zero config<br>- Automatic previews<br>- Edge functions | - Expensive at scale | Free tier generous |
| **Netlify** | - Similar to Vercel<br>- Great DX | - Bandwidth costs | Free tier available |
| **Cloudflare Pages** | - Free unlimited bandwidth<br>- Fast edge network | - Less features | Free |

> 💡 **Recommendation:** Vercel for MVP, consider Cloudflare Pages for cost optimization later.

#### Backend Hosting

| Provider | Pros | Cons | Pricing |
|----------|------|------|---------|
| **Railway** | - Simple<br>- Great DX<br>- Postgres included | - Pricier than AWS | $5/mo start |
| **Render** | - Easy to use<br>- Free tier<br>- Managed services | - Slower cold starts (free tier) | Free tier available |
| **Fly.io** | - Edge deployment<br>- Global<br>- Low latency | - Steeper learning curve | Free tier limited |
| **AWS (ECS/Fargate)** | - Full control<br>- Scalable<br>- Lots of services | - Complex setup<br>- Requires DevOps knowledge | Pay-as-you-go |
| **DigitalOcean** | - Simple<br>- Predictable pricing<br>- Good docs | - Less features than AWS | $6/mo droplets |

> 💡 **Recommendation:** Railway or Render for MVP, migrate to AWS/GCP for Phase 3 scale.

---

### Development Tools

| Tool | Purpose | Recommendation |
|------|---------|----------------|
| **Version Control** | Git + GitHub/GitLab | GitHub (better Actions) |
| **CI/CD** | Automated testing & deployment | GitHub Actions |
| **Code Quality** | Linting, formatting | ESLint + Prettier |
| **Git Hooks** | Pre-commit checks | Husky + lint-staged |
| **API Testing** | Test API endpoints | Postman or Insomnia |
| **Database GUI** | Manage database | Postico (Mac), DBeaver (cross-platform) |
| **API Documentation** | Generate API docs | Swagger/OpenAPI |

---

### Security Tools

| Tool | Purpose | Cost |
|------|---------|------|
| **Snyk** | Dependency vulnerability scanning | Free for open source |
| **Helmet.js** | Security headers (Express) | Free |
| **bcrypt** | Password hashing | Free |
| **express-rate-limit** | Rate limiting | Free |
| **OWASP ZAP** | Penetration testing | Free |

---

### Infrastructure Diagram (MVP)

```
┌─────────────────────────────────────────────────────┐
│                   USERS (Web)                       │
└────────────────────┬────────────────────────────────┘
                     │
                     │ HTTPS
                     │
         ┌───────────▼──────────┐
         │   Cloudflare CDN     │  (Optional)
         └───────────┬──────────┘
                     │
      ┌──────────────┼──────────────┐
      │              │              │
      ▼              ▼              ▼
┌──────────┐   ┌──────────┐   ┌──────────┐
│ Vercel   │   │ Railway  │   │  Stripe  │
│(Frontend)│   │(Backend) │   │   API    │
└──────────┘   └────┬─────┘   └──────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
  ┌──────────┐ ┌────────┐ ┌────────┐
  │PostgreSQL│ │ Redis  │ │  AWS   │
  │  (Neon)  │ │(Upstash)│ │  S3    │
  └──────────┘ └────────┘ └────────┘
        │
        └──────────┐
                   ▼
            ┌──────────────┐
            │   SendGrid   │  (Email)
            └──────────────┘
```

---

### Estimated Infrastructure Costs (MVP)

| Service | Tier | Monthly Cost |
|---------|------|--------------|
| **Vercel** | Hobby (upgraded) | $20 |
| **Railway** | Starter + Postgres | $20 |
| **Neon** (or included in Railway) | Free / $19 | $0-19 |
| **Redis (Upstash)** | Free tier | $0 |
| **AWS S3** | < 50GB storage | $1-5 |
| **Stripe** | Transaction fees only | Variable (2.9%) |
| **SendGrid** | Free tier | $0 |
| **Cloudflare** | Free tier | $0 |
| **Domain** | Annual | $15/year (~$1.25/mo) |
| **Sentry** | Free tier | $0 |
| **Total (MVP)** | | **~$45-75/mo** |

**At Scale (1,000 users, $20K MRR):**
- Infrastructure: ~$200-500/mo
- Stripe fees: ~$580/mo (2.9% of $20K)
- **Total:** ~$780-1,080/mo (~4-5% of revenue)

---

## 15. Analytics & KPIs

### Key Performance Indicators (KPIs)

#### Revenue Metrics

| Metric | Definition | Target (MVP) | Target (Growth) | Tracking |
|--------|------------|--------------|-----------------|----------|
| **MRR** | Monthly Recurring Revenue | $5,000 | $50,000 | Stripe + database |
| **ARR** | Annual Recurring Revenue | $60,000 | $600,000 | MRR × 12 |
| **ARPU** | Average Revenue Per User | $20 | $25 | Total revenue / active subs |
| **LTV** | Lifetime Value | $240 | $400 | ARPU / churn rate |
| **CAC** | Customer Acquisition Cost | < $50 | < $80 | Marketing spend / new users |
| **LTV:CAC Ratio** | LTV divided by CAC | > 3:1 | > 5:1 | LTV / CAC |

---

#### Conversion Metrics

| Metric | Definition | Target | Formula |
|--------|------------|--------|---------|
| **Trial → Paid** | % of trial users who convert | 15-25% | Paid subs / trial starts |
| **Signup → Trial** | % of signups who start trial | 80%+ | Trial starts / signups |
| **Landing → Signup** | Landing page conversion | 5-10% | Signups / unique visitors |
| **Upgrade Rate** | % users who upgrade plan | 10-15% | Upgrades / total users |

**Conversion Funnel:**
```
1000 visitors
  ↓ 5% conversion
50 signups
  ↓ 80% trial start
40 trial starts
  ↓ 20% paid conversion
8 paid subscribers (MRR: $160)
```

---

#### Retention Metrics

| Metric | Definition | Target | Calculation |
|--------|------------|--------|-------------|
| **Monthly Churn** | % subs who cancel per month | < 5% | Cancellations / total subs |
| **Retention (30-day)** | % users active after 30 days | > 60% | Active D30 / signups |
| **Retention (90-day)** | % users active after 90 days | > 40% | Active D90 / signups |
| **Net Revenue Retention** | Revenue retention + expansion | > 100% | (MRR + expansion - churn) / previous MRR |

**Cohort Retention Table:**

| Cohort (Month) | Month 0 | Month 1 | Month 2 | Month 3 | Month 6 |
|----------------|---------|---------|---------|---------|---------|
| Jan 2025 | 100% | 85% | 75% | 65% | 50% |
| Feb 2025 | 100% | 88% | 78% | 68% | — |
| Mar 2025 | 100% | 90% | 80% | — | — |

---

#### Engagement Metrics

| Metric | Definition | Target | Importance |
|--------|------------|--------|------------|
| **DAU** | Daily Active Users (children) | 50+ | Daily engagement level |
| **WAU** | Weekly Active Users | 200+ | Weekly engagement |
| **MAU** | Monthly Active Users | 500+ | Overall platform health |
| **DAU/MAU Ratio** | Stickiness metric | > 30% | Higher = more engaged users |
| **Modules Completed/Week** | Avg per child | 2-3 | Learning velocity |
| **Session Duration** | Average time per session | 15-20 min | Quality of engagement |
| **Sessions/Week** | Avg sessions per child | 3-4 | Frequency |
| **Streak Length** | Average active streak | 5+ days | Habit formation |

---

#### Product Metrics

| Metric | Definition | Target | Why It Matters |
|--------|------------|--------|----------------|
| **Module Completion Rate** | % modules started that finish | > 70% | Content quality |
| **Quiz Pass Rate** | % quizzes passed first try | 60-80% | Difficulty balance |
| **Achievement Unlock Rate** | Avg achievements per child | 10+ | Gamification success |
| **Time to First Module** | Hours from signup to first module | < 24 hours | Activation speed |
| **Children per Parent** | Average children added | 1.5-2 | Platform value |

---

#### Business Health Dashboard

**Weekly Review Metrics:**

```
┌─────────────────────────────────────────┐
│ MRR: $8,450 (+12% WoW)                  │
│ Churn: 4.2% (-0.5% vs last month)      │
│ New Trials: 45 this week                │
│ Trial → Paid: 18% (8 conversions)      │
│ Active Children: 156 (DAU: 62)          │
│ Modules Completed: 234 this week        │
└─────────────────────────────────────────┘
```

---

### Analytics Implementation

#### Events to Track

##### Parent Events

| Event Name | Properties | Trigger |
|------------|-----------|---------|
| `parent_signup` | `plan_selected`, `referral_source` | Account created |
| `trial_started` | `plan`, `trial_days` | Trial initiated |
| `subscription_created` | `plan`, `amount`, `interval` | Payment successful |
| `child_added` | `child_age`, `child_gender` | Child created |
| `subscription_canceled` | `reason`, `tenure_days` | Cancellation |
| `plan_changed` | `old_plan`, `new_plan`, `change_type` | Upgrade/downgrade |
| `payment_failed` | `reason`, `attempt_number` | Payment error |

##### Child Events

| Event Name | Properties | Trigger |
|------------|-----------|---------|
| `child_login` | `child_age`, `device_type` | Code entered |
| `module_started` | `module_id`, `module_name` | Module begun |
| `lesson_completed` | `module_id`, `lesson_id`, `time_spent` | Lesson finished |
| `quiz_completed` | `module_id`, `score`, `attempts` | Quiz submitted |
| `module_completed` | `module_id`, `xp_earned`, `time_total` | Module finished |
| `achievement_unlocked` | `achievement_id`, `achievement_name` | Badge earned |
| `company_created` | `company_name` | Company initialized |
| `streak_milestone` | `streak_days` | Streak achievement |

##### Admin Events

| Event Name | Properties | Trigger |
|------------|-----------|---------|
| `module_published` | `module_id`, `module_name` | Content published |
| `module_edited` | `module_id`, `changes` | Content updated |
| `user_impersonated` | `user_id`, `reason` | Support action |

---

#### Analytics Tools Setup

**Recommended Stack:**

| Tool | Purpose | Implementation |
|------|---------|----------------|
| **Posthog** or **Mixpanel** | Product analytics | Event tracking, funnels, cohorts |
| **Stripe Dashboard** | Revenue analytics | Built-in MRR, churn, revenue charts |
| **Custom Dashboard** | Business KPIs | Build with Prisma + Chart.js / Recharts |
| **Google Analytics 4** | Marketing attribution | Landing page tracking |

**Sample Posthog Event:**

```javascript
// Track module completion
posthog.capture('module_completed', {
  module_id: 'mod_123',
  module_name: 'Money Basics',
  xp_earned: 150,
  time_spent_seconds: 680,
  quiz_score: 95,
  child_age: 10,
  subscription_plan: 'standard'
});
```

---

### Reports & Dashboards

#### Weekly Business Review (Auto-Generated)

```markdown
## Week of Nov 5, 2025

### 📈 Growth
- New signups: 52 (+8% WoW)
- Trial starts: 45 (-3% WoW)
- Paid conversions: 9 (20% conversion rate)
- Churn: 3 users (4.5%)

### 💰 Revenue
- MRR: $8,640 (+$450 from last week)
- New MRR: $720
- Churned MRR: ($270)
- Net New MRR: $450

### 👥 Engagement
- DAU: 68 children (32% of total)
- Modules completed: 245 (+12%)
- Avg session time: 18 minutes
- Top module: "Starting a Business" (45 completions)

### 🚨 Alerts
- Payment failure rate: 8% (above 5% target)
- Quiz completion rate: 62% (below 70% target)
```

---

#### Monthly Executive Summary

| Category | This Month | Last Month | Change |
|----------|------------|------------|--------|
| **Revenue** |
| MRR | $35,420 | $31,200 | +13.5% |
| New MRR | $6,840 | $5,200 | +31.5% |
| Churned MRR | ($2,620) | ($1,980) | +32.3% ⚠️ |
| **Users** |
| Total subs | 1,771 | 1,560 | +13.5% |
| Trial users | 180 | 165 | +9.1% |
| Active children | 2,650 | 2,340 | +13.2% |
| **Engagement** |
| Modules completed | 3,420 | 2,980 | +14.8% |
| Avg modules/child | 2.3 | 2.1 | +9.5% |
| DAU/MAU | 34% | 32% | +2pp |

---

### A/B Testing Framework

#### Tests to Run

| Test | Variants | Metric | Expected Impact |
|------|----------|--------|-----------------|
| **Pricing page** | 3-plan vs 2-plan layout | Conversion rate | +10-15% |
| **Trial length** | 7-day vs 14-day vs 30-day | Trial→Paid rate | Find optimal |
| **Email timing** | Send digest Mon vs Fri | Email open rate | +5-10% |
| **Quiz difficulty** | Easy vs Medium vs Hard | Completion rate | Optimize learning |
| **Badge design** | Realistic vs Cartoon | Achievement clicks | Engagement |

**Sample A/B Test Results:**

```
Test: 14-day vs 30-day trial
Control (14-day): 18% conversion, n=200
Variant (30-day): 15% conversion, n=200
Result: Keep 14-day trial (higher conversion)
```

---

### Success Criteria by Phase

#### MVP Success (3 months)

- [ ] 100+ parent signups
- [ ] 50+ paid subscriptions
- [ ] $1,000+ MRR
- [ ] 15%+ trial→paid conversion
- [ ] < 10% monthly churn
- [ ] 5+ modules completed per child (avg)
- [ ] 60%+ retention at 30 days

#### Growth Success (12 months)

- [ ] 1,000+ paid subscriptions
- [ ] $20,000+ MRR
- [ ] 20%+ trial→paid conversion
- [ ] < 5% monthly churn
- [ ] 10+ modules completed per child (avg)
- [ ] 70%+ retention at 30 days
- [ ] 3:1 LTV:CAC ratio

---

## Appendix: Code Examples & References

### Child Code Generation

```javascript
/**
 * Generate a unique, collision-free child access code
 * - 6 characters long
 * - Avoids ambiguous characters (O/0, I/1)
 * - Cryptographically random
 * - Checks for uniqueness in database
 */
const crypto = require('crypto');

async function generateChildCode() {
  // Character set without ambiguous chars
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  // Removed: O, I, 0, 1
  
  let code;
  let isUnique = false;
  let attempts = 0;
  const MAX_ATTEMPTS = 10;
  
  while (!isUnique && attempts < MAX_ATTEMPTS) {
    // Generate random code
    code = Array.from(
      { length: 6 },
      () => charset[crypto.randomInt(0, charset.length)]
    ).join('');
    
    // Check uniqueness in database
    const existingChild = await db.child.findUnique({
      where: { code }
    });
    
    isUnique = !existingChild;
    attempts++;
  }
  
  if (!isUnique) {
    throw new Error('Unable to generate unique code');
  }
  
  return code;
}

// Example usage
const childCode = await generateChildCode();
// Returns: "A3K7N2"
```

---

### Stripe Webhook Handler

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Handle Stripe webhook events
 * Verify signature and process subscription lifecycle events
 */
app.post('/api/webhooks/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  
  try {
    // 1. Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // 2. Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
        
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    // 3. Return success immediately (process async)
    res.json({ received: true });
    
  } catch (err) {
    console.error('Webhook handler error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Handler functions
async function handlePaymentSucceeded(invoice) {
  const subscription = await stripe.subscriptions.retrieve(
    invoice.subscription
  );
  
  await db.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: 'active',
      currentPeriodEnd: new Date(subscription.current_period_end * 1000)
    }
  });
  
  // Send receipt email
  await sendEmail({
    to: invoice.customer_email,
    template: 'payment_receipt',
    data: { amount: invoice.amount_paid / 100 }
  });
}

async function handlePaymentFailed(invoice) {
  await db.subscription.update({
    where: { stripeSubscriptionId: invoice.subscription },
    data: { status: 'past_due' }
  });
  
  // Send payment failed email
  await sendEmail({
    to: invoice.customer_email,
    template: 'payment_failed',
    data: { reason: invoice.last_finalization_error?.message }
  });
}

async function handleSubscriptionDeleted(subscription) {
  // Mark subscription as canceled
  await db.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: 'canceled',
      canceledAt: new Date()
    }
  });
  
  // Deactivate all child codes for this parent
  const parent = await db.parent.findFirst({
    where: { stripeCustomerId: subscription.customer },
    include: { children: true }
  });
  
  if (parent) {
    await db.child.updateMany({
      where: { parentId: parent.id },
      data: { active: false }
    });
  }
}
```

---

### XP Calculation & Achievement Check

```javascript
/**
 * Award XP and check achievements when module completed
 */
async function completeModule(childId, moduleId, quizScore) {
  const child = await db.child.findUnique({
    where: { id: childId },
    include: { activities: true, achievements: true }
  });
  
  const module = await db.module.findUnique({
    where: { id: moduleId }
  });
  
  // 1. Calculate XP
  let xpEarned = module.xp; // Base XP (e.g., 100)
  
  // Bonus: Perfect quiz score
  if (quizScore === 100) {
    xpEarned += 50;
  }
  
  // Bonus: Current streak
  const streak = await getCurrentStreak(childId);
  xpEarned += streak * 10; // +10 XP per streak day
  
  // 2. Record activity
  await db.activity.create({
    data: {
      childId,
      moduleId,
      type: 'module_complete',
      result: { quizScore },
      points: xpEarned,
      completedAt: new Date()
    }
  });
  
  // 3. Update total XP and check level-up
  const newTotalXP = child.totalXP + xpEarned;
  const oldLevel = calculateLevel(child.totalXP);
  const newLevel = calculateLevel(newTotalXP);
  const leveledUp = newLevel > oldLevel;
  
  await db.child.update({
    where: { id: childId },
    data: { totalXP: newTotalXP }
  });
  
  // 4. Check and award achievements
  const newAchievements = [];
  
  // Check "First Module" achievement
  const moduleCount = child.activities.filter(
    a => a.type === 'module_complete'
  ).length + 1;
  
  if (moduleCount === 1) {
    await awardAchievement(childId, 'first_steps');
    newAchievements.push('first_steps');
  }
  
  if (moduleCount === 10) {
    await awardAchievement(childId, 'dedicated_learner');
    newAchievements.push('dedicated_learner');
  }
  
  // Check "Perfect Score" achievement
  if (quizScore === 100) {
    await awardAchievement(childId, 'perfect_score');
    newAchievements.push('perfect_score');
  }
  
  // 5. Return completion data
  return {
    xpEarned,
    totalXP: newTotalXP,
    leveledUp,
    newLevel: leveledUp ? newLevel : null,
    newAchievements,
    nextModules: await getUnlockedModules(childId)
  };
}

function calculateLevel(totalXP) {
  const levels = [
    { level: 1, xp: 0 },
    { level: 2, xp: 500 },
    { level: 3, xp: 1500 },
    { level: 4, xp: 3000 },
    { level: 5, xp: 5000 },
    { level: 6, xp: 10000 },
    { level: 7, xp: 20000 },
    { level: 8, xp: 50000 }
  ];
  
  for (let i = levels.length - 1; i >= 0; i--) {
    if (totalXP >= levels[i].xp) {
      return levels[i].level;
    }
  }
  
  return 1;
}
```

---

### Progress Calculation

```javascript
/**
 * Calculate child's overall learning progress
 */
async function calculateProgress(childId) {
  // Get all published modules
  const totalModules = await db.module.count({
    where: { published: true }
  });
  
  // Get completed modules for this child
  const completedModules = await db.activity.count({
    where: {
      childId,
      type: 'module_complete'
    }
  });
  
  // Calculate percentage
  const progressPercentage = totalModules > 0
    ? Math.round((completedModules / totalModules) * 100)
    : 0;
  
  // Get progress by track
  const tracks = await db.module.groupBy({
    by: ['track'],
    where: { published: true },
    _count: { id: true }
  });
  
  const trackProgress = await Promise.all(
    tracks.map(async (track) => {
      const completedInTrack = await db.activity.count({
        where: {
          childId,
          type: 'module_complete',
          module: { track: track.track }
        }
      });
      
      return {
        track: track.track,
        total: track._count.id,
        completed: completedInTrack,
        percentage: Math.round((completedInTrack / track._count.id) * 100)
      };
    })
  );
  
  return {
    overall: {
      completed: completedModules,
      total: totalModules,
      percentage: progressPercentage
    },
    byTrack: trackProgress
  };
}
```

---

### Database Migration (Prisma)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String
  role          Role      @default(PARENT)
  emailVerified Boolean   @default(false)
  createdAt     DateTime  @default(now())
  lastLogin     DateTime?
  
  parent        Parent?
  
  @@index([email])
}

enum Role {
  PARENT
  ADMIN
}

model Parent {
  id               String    @id @default(uuid())
  userId           String    @unique
  stripeCustomerId String?   @unique
  plan             Plan      @default(BASIC)
  billingStatus    BillingStatus @default(TRIAL)
  trialEnd         DateTime?
  createdAt        DateTime  @default(now())
  
  user             User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  children         Child[]
  subscriptions    Subscription[]
  
  @@index([billingStatus])
}

enum Plan {
  BASIC
  STANDARD
  PREMIUM
}

enum BillingStatus {
  TRIAL
  ACTIVE
  PAST_DUE
  CANCELED
}

model Child {
  id              String    @id @default(uuid())
  parentId        String
  name            String
  age             Int
  gender          Gender?
  profilePicUrl   String?
  code            String    @unique
  active          Boolean   @default(true)
  totalXP         Int       @default(0)
  createdAt       DateTime  @default(now())
  
  parent          Parent    @relation(fields: [parentId], references: [id], onDelete: Cascade)
  activities      Activity[]
  company         Company?
  achievements    ChildAchievement[]
  
  @@index([code])
  @@index([parentId])
}

enum Gender {
  MALE
  FEMALE
  OTHER
  PREFER_NOT_TO_SAY
}

model Module {
  id            String    @id @default(uuid())
  title         String
  description   String?
  track         String
  order         Int
  xp            Int       @default(100)
  difficulty    Difficulty @default(BEGINNER)
  prerequisites String[]  // Array of module IDs
  published     Boolean   @default(false)
  publishedAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  lessons       Lesson[]
  activities    Activity[]
  
  @@index([order, published])
}

enum Difficulty {
  BEGINNER
  INTERMEDIATE
  ADVANCED
}

model Lesson {
  id          String    @id @default(uuid())
  moduleId    String
  title       String
  type        LessonType
  contentUrl  String?
  content     String?   @db.Text
  duration    Int?
  order       Int
  createdAt   DateTime  @default(now())
  
  module      Module    @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  activities  Activity[]
}

enum LessonType {
  VIDEO
  TEXT
  QUIZ
  ACTIVITY
}

model Activity {
  id          String    @id @default(uuid())
  childId     String
  moduleId    String?
  lessonId    String?
  type        ActivityType
  payload     Json?
  result      Json?
  points      Int       @default(0)
  completedAt DateTime  @default(now())
  
  child       Child     @relation(fields: [childId], references: [id], onDelete: Cascade)
  module      Module?   @relation(fields: [moduleId], references: [id])
  lesson      Lesson?   @relation(fields: [lessonId], references: [id])
  
  @@index([childId, completedAt])
}

enum ActivityType {
  MODULE_START
  LESSON_COMPLETE
  QUIZ_ATTEMPT
  MODULE_COMPLETE
}

model Company {
  id        String    @id @default(uuid())
  childId   String    @unique
  name      String
  product   String?
  logoUrl   String?
  capital   Decimal   @default(1000.00) @db.Decimal(10, 2)
  revenue   Decimal   @default(0.00) @db.Decimal(10, 2)
  expenses  Decimal   @default(0.00) @db.Decimal(10, 2)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  
  child     Child     @relation(fields: [childId], references: [id], onDelete: Cascade)
}

model Achievement {
  id          String    @id @default(uuid())
  name        String    @unique
  description String
  category    AchievementCategory
  criteria    Json
  iconUrl     String?
  rarity      Rarity    @default(COMMON)
  xpBonus     Int       @default(0)
  createdAt   DateTime  @default(now())
  
  childAchievements ChildAchievement[]
}

enum AchievementCategory {
  MILESTONE
  PERFORMANCE
  COMPANY
  ENGAGEMENT
}

enum Rarity {
  COMMON
  RARE
  EPIC
  LEGENDARY
}

model ChildAchievement {
  id            String    @id @default(uuid())
  childId       String
  achievementId String
  awardedAt     DateTime  @default(now())
  
  child         Child     @relation(fields: [childId], references: [id], onDelete: Cascade)
  achievement   Achievement @relation(fields: [achievementId], references: [id])
  
  @@unique([childId, achievementId])
  @@index([childId])
}

model Subscription {
  id                    String    @id @default(uuid())
  parentId              String
  plan                  Plan
  stripeSubscriptionId  String    @unique
  status                SubscriptionStatus
  currentPeriodStart    DateTime
  currentPeriodEnd      DateTime
  cancelAtPeriodEnd     Boolean   @default(false)
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  parent                Parent    @relation(fields: [parentId], references: [id], onDelete: Cascade)
  
  @@index([stripeSubscriptionId])
}

enum SubscriptionStatus {
  TRIALING
  ACTIVE
  PAST_DUE
  CANCELED
  INCOMPLETE
}
```

---

## Final Notes & Recommendations

### Key Principles

1. **Start Simple** — Build a tight MVP with core features only. Don't over-engineer.
2. **Iterate Fast** — Launch quickly, gather feedback, iterate based on real user data.
3. **Child Safety First** — Minimal PII, parental consent, COPPA/GDPR compliance.
4. **Modularity** — Design for easy content updates by admins without code changes.
5. **Measure Everything** — Track KPIs from day one to guide product decisions.

### Pre-Launch Checklist

- [ ] **Legal** — Terms of Service, Privacy Policy, COPPA compliance reviewed
- [ ] **Content** — Minimum 10 quality modules created and tested
- [ ] **Pricing** — Plans finalized and tested in Stripe
- [ ] **Security** — Vulnerability scan passed, security headers configured
- [ ] **Performance** — Load testing completed, < 2s page load
- [ ] **Monitoring** — Error tracking, uptime monitoring, analytics set up
- [ ] **Support** — Help docs, FAQs, support email configured
- [ ] **Backups** — Automated database backups configured

### Next Steps

1. **Validate Concept** — Survey target parents, validate willingness to pay
2. **Create Prototype** — Build clickable Figma prototype for user testing
3. **Develop MVP** — Focus on Phase 1 features only (8-12 weeks)
4. **Beta Test** — 10-20 parents, gather feedback, iterate
5. **Launch** — Public launch with marketing campaign
6. **Iterate** — Monitor metrics, fix issues, add Phase 2 features

---

**Questions or need clarification? This document should serve as your complete blueprint for building the LMS platform. Good luck! 🚀**
