# **📄 Cal Templates – Requirements Specification (v1.0.3)**

---

## **1\. Overview**

**App Name: Cal Templates (Email Templates Paster)**  
 **Platform: Google Apps Script Web App, container-bound to a Google Spreadsheet**  
 **Purpose:**  
 **Help customer service agents copy premade, QA-compliant email templates. Admins manage templates and approve new users.**

---

## **2\. Functional Scope**

### **2.1 Core User Flows**

| Role | Capabilities |
| ----- | ----- |
| **Agent** | **Log in via EID, view/copy email templates** |
| **Admin** | **All agent capabilities \+ CRUD templates, approve/deny signups** |

### **2.2 Session Handling**

* **Login via Employee ID (EID).**

* **Session storage retains user name, role, and division locally.**

* **Session expiration: not enforced; logout is manual.**

  ---

  ## **3\. Spreadsheet Data Model**

  ### **3.1 `users` sheet**

| Column | Description |
| ----- | ----- |
| **A** | **`agent_eid` (Number, fixed-length; from config)** |
| **B** | **`agent_name` (Format: “Last, First”)** |
| **C** | **`agent_division`** |
| **D** | **`agent_role` (`agent` or `admin`)** |
| **E** | **`agent_email`** |

### **3.2 `signup` sheet**

| Column | Description |
| ----- | ----- |
| **A** | **`agent_eid`** |
| **B** | **`agent_name`** |
| **C** | **`agent_email`** |
| **D** | **`agent_division`** |
| **E** | **`agent_role`** |
| **F** | **`status` (`pending`, `approved`, `denied`)** |

### **3.3 `templates` sheet**

| Column | Description |
| ----- | ----- |
| **A** | **`template_id` (unique random ID)** |
| **B** | **`inquiry_reason`** |
| **C** | **`topic_name`** |
| **D** | **`case_name` (unique within topic)** |
| **E** | **`template_content`** |
| **F** | **`email_subject` (optional)** |
| **G** | **`backend_log` (optional)** |
| **H** | **`tasks` (optional, semicolon-separated plain text)** |

  ---

## **4\. Configuration (Code.gs)**

```js
const COMPANY_NAME = "Domain";
const DOMAIN_NAME = "domain.com";
const EID_LENGTH = 7;
const DEFAULT_AGENT_DIVISION = "Customer Specialist";
const DEFAULT_AGENT_ROLE = "agent";

```

  ---

## **5\. UI Architecture**

### **5.1 Rendering Strategy**

* **Single-page dynamic app (`index.html`)**

* **Show/hide `<div>` sections based on session context and user role**

* **Admin features rendered only if session role \=== 'admin'**

  ---

  ### **5.2 Main Interface (HTML Summary)**

```html
<body>
  <div id="login-section"> ... </div>
  <div id="dashboard">
    <header> ... </header>
    <main>
      <div class="sidebar" id="navigation-bar">...</div>
      <div class="content" id="main-board">
        <div class="welcome-message">...</div>
        <div id="prompt-area" hidden>...</div>
        <div id="admin-panel" hidden>...</div>
      </div>
    </main>
  </div>
</body>

```

  ---

## **6\. App Flow**

### **6.1 Login**

* **Agent enters EID (number only)**

* **EID is matched against `users` sheet**

  * **If matched:**

    * **Extract first name (e.g., `"Cortes, Fabian"` → `"Fabian"`)**

    * **Store name, division, role in session storage**

    * **Render dashboard**

  * **If not matched:**

    * **Show "EID not found. Click here to register."**

    * **Show sign-up form**

  ---

  ### **6.2 Signup**

* **New user form collects: email, name, EID, division**

* **Entry added to `signup` with status `pending`**

* **Admin can approve/deny via dashboard**

* **Upon approval, the user is added to `users` and notified via email**

  ---

  ### **6.3 Template Viewer (Agent Role)**

* **Sidebar is built recursively:**

  * **Inquiry Reason \> Topic \> Case**

* **Selecting a case:**

  * **Displays:**

    * **`email_subject` (+ copy button)**

    * **`backend_log` (+ copy button)**

    * **`template_content` (editable, copyable)**

    * **Task checklist (optional, visually-only)**

  ---

  ## **7\. Placeholder System**

  ### **7.1 Automatic**

* **Replaced on render:**

  * **`{{agent_name}}`**

  * **`{{agent_division}}`**

  ### **7.2 Manual**

* **Format: `xXSomePlaceholderXx`**

* **Rendered bold and highlighted**

* **Not replaced, only visually emphasized**

  ---

  ## **8\. Admin Panel (Role \=== 'admin')**

  ### **8.1 Admin Dashboard (`#admin-panel`)**

* **Section is visible only if session role is `admin`**

  #### **Components:**

* **Signup Management**

  * **List pending users with name, email, division**

  * **Toggle to approve (→ adds to users) or deny**

* **Template Management**

  * **Button: `[+] Create Template`**

    * **Opens empty Template Editor form**

  * **Edit Button next to Case titles (if admin)**

    * **Opens pre-filled Template Editor form**

  ---

  ### **8.2 Template Editor UI**

  #### **Fields:**

* **Inquiry Reason\* (text)**

* **Topic Name\* (text)**

* **Case Name\* (unique per topic)**

* **Template Content\* (textarea)**

* **Email Subject\* (text)**

* **Backend Log (optional)**

* **Task List (semicolon-separated)**

**`*` Required fields.**

#### **Behavior:**

* **If editing, template ID is shown but read-only**

* **If adding:**

  * **App checks for duplicate (same Inquiry, Topic, Case)**

  * **If found → disable submit \+ show error “This template already exists. Please choose a different Case name.”**

  ---

  ## **9\. Security**

* **Login is EID-based**

* **Role information is stored in sessionStorage**

* **No runtime role switching; users must logout and login to see updated privileges**

* **Admin-only operations are rendered client-side but validated server-side (backend gate required)**

  ---

  ## **10\. Output Behavior**

* **Copy-to-clipboard outputs raw plain text**

* **Automatic placeholders are substituted at render time**

* **Manual placeholders are shown highlighted for manual attention**

* **Preview is editable via `contenteditable="true"`**

  ---

  ## **11\. Code Structure**

| File | Responsibility |
| ----- | ----- |
| **`Code.gs`** | **Entry point (`doGet(e)`), config constants** |
| **`Auth.js`** | **EID login validation, role loading** |
| **`Users.js`** | **Read/write operations on `users` and `signup` sheets** |
| **`Templates.js`** | **CRUD logic for templates** |
| **`UI.js`** | **Optional: template building/rendering logic** |
| **`index.html`** | **HTML shell** |
| **`css.html`** | **Inline styles** |
| **`js.html`** | **Client-side JS (DOM interaction, UI logic)** |
