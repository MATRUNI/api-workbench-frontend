# Authentication Gateway

Accessing restricted zones (like the Comm Matrix, Voice Rooms, and Shared Inbox) requires establishing a secure session. API.OS employs a strict, terminal-themed authentication pipeline (the `AUTH_MODULE_V1`) to verify Operator identities.

---

## 1. Establishing a Session (Login)

For returning Operators, establishing a session is straightforward:

1. Navigate to the **Login** panel.
2. Select **SIGN IN**.
3. Input your `EMAIL_ADDRESS` and your `ACCESS_KEY` (Password).
4. Click **ESTABLISH_SESSION**.

Behind the scenes, API.OS negotiates an encrypted connection with the `SECURE_NODE` and drops an HTTP-only JWT cookie to maintain your state.

---

## 2. Registering a New Operator (Sign Up)

Registering a new Operator profile is an interactive, multi-stage pipeline designed to prevent unauthorized or automated access. 

### Stage 1: Identity Declaration
You must first declare your target identity.
* **OPERATOR_ID:** A unique username (e.g., `ghost_protocol`).
* **EMAIL_ADDRESS:** A valid email format is required.

> [!TIP]
> The gateway actively monitors your input. Once a structurally valid email is detected, the **`[VERIFY_EMAIL]`** inline trigger will automatically reveal itself next to the label.

### Stage 2: The OTP Security Challenge
Clicking `[VERIFY_EMAIL]` dispatches a One-Time Password to your inbox and reveals the **`OTP_SECURITY_CHALLENGE`** layer.

* You must enter the 6-digit `######` code exactly as received.
* Click **CONFIRM** to authenticate the token against the backend registry.

> [!WARNING]
> **Threat Mitigation**
> The OTP node enforces strict rate limits. Entering invalid codes triggers `OTP_INCORRECT`. Repeated failures result in `TOO_MANY_ATTEMPTS`. If you wait too long, the gateway will return `OTP_EXPIRED` and you must request a new token.

### Stage 3: Credential Finalization
Only after the email is successfully verified (`VERIFIED` success tag appears) will the gateway unlock the final step:

* **ACCESS_KEY:** Define your secure password. 
* **Requirement:** Must pass the `PASS_MIN_6_CHAR` security check.

Once the `ACCESS_KEY` is set, click **REGISTER_OPERATOR** to finalize the deployment and instantly connect to the Comm Matrix.

---

## 3. Disconnecting

Your session is persistently managed via secure cookies. To sever the connection and clear local memory:
1. Click your `OPERATOR_ID` in the top right of the navigation bar.
2. This opens your **Operator Profile Manifest**.
3. Select **Disconnect**.
