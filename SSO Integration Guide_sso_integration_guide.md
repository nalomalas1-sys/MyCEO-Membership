# **Please let me know how else I can help you with the SSO Integration Guide** document. For example, I can summarize a specific section, answer questions about the flow, or generate content related to the architecture.

# **Engineering Guide: Main Portal to AI Tools SSO Integration**

**Status:** Draft **Target Audience:** Backend & Frontend Developers **System:** My-CEO EdTech Platform

## **1\. High-Level Flow (Overview)**

We are building a bridge to let users jump from the **Main Portal** (our central hub) to the **AI Tools App** (a separate application) without logging in again.  
Here is the simple journey:

1. **User clicks "Open AI Tools"** inside the Main Portal.  
2. **Main Portal Backend** generates a secure, temporary "entry ticket" (a random string).  
3. **Browser redirects** the user to the AI Tools website, carrying this ticket in the URL.  
4. **AI Tools Backend** sees the ticket, grabs it, and asks the Main Portal (via API) "Is this valid?"  
5. If valid, AI Tools issues a **Session JWT** to the user.  
6. The user is now logged in and can start using the tools.

## **2\. User Types & Actors**

We have three specific types of users who will use this flow.

### **A. Parent**

* **Login Method:** Email & Password on Main Portal.  
* **Role:** Account owner, manages subscription.  
* **SSO Goal:** Logs into AI Tools to view dashboards or settings.

### **B. Admin**

* **Login Method:** Email & Password on Main Portal.  
* **Role:** System administrator.  
* **SSO Goal:** Logs into AI Tools with elevated permissions for support/management.

### **C. Child (The Student)**

* **Login Method:** Magic Code (on Portal) OR Parent clicks "Launch as Child".  
* **Constraint:** **Children do not have email addresses.**  
* **SSO Goal:** Must be logged into AI Tools as *themselves* (with their own progress/save data), but the authentication authority is the Parent account or the Magic Code session.

## **3\. The One-Time Login Ticket (SSO Token)**

We **never** pass a JWT (JSON Web Token) directly in the URL query parameters. URL history is often logged by browsers, proxies, and firewalls. If a JWT is in the URL, anyone reading the logs could steal the user's session.  
Instead, we use a **One-Time Ticket**.

* **What is it?** A random alphanumeric string (e.g., sso\_tk\_7a8b9c...).  
* **Lifespan:** Very short (e.g., 30 seconds).  
* **Usage:** Can be used exactly **once**.  
* **Data:** The ticket itself contains no user data; it is just a reference key pointing to data in our database.

## **4\. Backend API: Create Login Ticket**

**Service:** Main Portal Backend **Trigger:** User clicks "Open AI Tools" on the frontend.

### **Endpoint Definition**

POST /api/internal/auth/sso/ticket  
**Who can call this?** Only authenticated users (Parent, Admin) or the Portal Frontend on behalf of a logged-in Child.  
**Request Payload:**  
`{`  
  `"target_actor_type": "child", // or "parent", "admin"`  
  `"target_actor_id": "child_12345",`  
  `"parent_id": "parent_98765" // Optional: required if actor is a child`  
`}`

**Backend Logic:**

1. Verify the current user has permission to generate this ticket (e.g., Is this parent actually the parent of child\_12345?).  
2. Generate a random string (Ticket ID).  
3. Store record in Redis/DB with:  
   * Key: ticket\_id  
   * Value: { user\_id, role, parent\_id, scope }  
   * Expiry: 30 seconds.  
4. Return the Ticket ID.

## **5\. Redirect Flow**

Once the Main Portal Frontend receives the ticket from the API above, it performs a browser redirect.  
**URL Construction:**  
`[https://ai-tools.my-ceo.com/auth/callback?ticket=sso_tk_7a8b9c](https://ai-tools.my-ceo.com/auth/callback?ticket=sso_tk_7a8b9c)...`

**Frontend Action:** The Main Portal immediately redirects the browser window to this URL.

## **6\. Backend API: Exchange Ticket for JWT**

**Service:** AI Tools Backend **Trigger:** AI Tools Frontend loads the /auth/callback page and sends the ticket to its own backend.

### **Endpoint Definition**

POST /api/auth/exchange-ticket  
**Request Payload:**  
`{`  
  `"ticket": "sso_tk_7a8b9c..."`  
`}`

**Backend Logic:**

1. **Lookup:** Check the database/cache for this ticket string.  
2. **Validate:**  
   * Does it exist?  
   * Has it expired?  
3. **Invalidate:** **Immediately delete** the ticket from the database so it cannot be used again.  
4. **Generate Session:** Create a standard JWT for the AI Tools app based on the data found in the ticket.  
5. **Response:** Return the JWT to the AI Tools Frontend.

## **7\. JWT Claims Structure**

The JWT issued by AI Tools determines what the user can do. Here are the required payloads.

### **Scenario A: Child Login**

*Note: sub (Subject) is the Child's ID, not the Parent's.*  
`{`  
  `"sub": "child_12345",          // Unique ID of the child`  
  `"actor_type": "child",         // Role for permissions`  
  `"parent_id": "parent_98765",   // Link to billing/owner account`  
  `"plan": "premium_tier_1",      // Feature flags`  
  `"iat": 1715000000,`  
  `"exp": 1715003600`  
`}`

### **Scenario B: Parent Login**

`{`  
  `"sub": "parent_98765",`  
  `"actor_type": "parent",`  
  `"email": "mom@example.com",`  
  `"plan": "premium_tier_1",`  
  `"iat": 1715000000,`  
  `"exp": 1715003600`  
`}`

### **Scenario C: Admin Login**

`{`  
  `"sub": "admin_555",`  
  `"actor_type": "admin",`  
  `"scope": ["read:all", "write:all"],`  
  `"iat": 1715000000,`  
  `"exp": 1715003600`  
`}`

## **8\. Security Rules (Critical)**

1. **Single Use Only:** The moment the ticket is exchanged, it must be deleted. If a user tries to refresh the page or hit "Back", the exchange must fail.  
2. **Short Time-To-Live (TTL):** Tickets should expire in **30 to 60 seconds**. This is just enough time for a browser redirect. Do not make them last hours.  
3. **Cross-Origin Security (CORS):** Ensure the Main Portal backend allows the AI Tools domain to make requests (if the exchange happens server-to-server) or ensure the Redirect URL is strictly whitelisted.  
4. **No PII in URL:** Never include names, emails, or IDs in the query parameters during the redirect. Only the random ticket string.

## **9\. Responsibilities Split**

### **Main Portal Team**

* **Auth Authority:** Verifies the user's identity initially (Login screen, Magic code).  
* **Ticket Generator:** Implements the POST /ticket endpoint.  
* **Redirector:** Handles the frontend redirect logic.

### **AI Tools Team**

* **Ticket Consumer:** Implements the POST /exchange-ticket endpoint.  
* **Session Manager:** Issues the final JWT for the AI Tools app.  
* **Guard:** Protects AI Tool routes; if a user has no JWT, redirects them back to the Main Portal login page.