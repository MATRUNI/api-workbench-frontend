# Getting Started

Welcome to the **API.OS Workbench**, a next-generation local API client that merges high-performance HTTP testing with real-time peer-to-peer collaboration. 

This isn't just an API tester—it's a **Comm Matrix**. API.OS allows teams to share configurations instantly, debug together via WebRTC voice channels, and execute complex networked workflows without leaving the interface.

---

## The Core Philosophy

Traditional API clients trap your configurations in local environments or require cumbersome export/import cycles. API.OS solves this by integrating:

1. **Robust HTTP Execution:** A powerful request engine supporting all standard methods (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) with dynamic headers and query parameter injection.
2. **The Shared Inbox:** A real-time WebSocket layer that allows you to instantly "beam" an entire request setup to any registered operator, regardless of whether they are currently online.
3. **The Comm Matrix:** Built-in terminal-styled team chat and secure P2P WebRTC audio rooms.

> [!TIP]
> **CORS Bypass via Local Agent**
> Browser-based clients inherently face Cross-Origin Resource Sharing (CORS) blocks. To bypass this, click the Server icon in the navigation bar to download the **Vlang Local Proxy Agent**. When active, API.OS automatically routes traffic through the agent to ensure 100% success rates on external endpoints.

---

## Exploring the Modules

API.OS is divided into several specialized modules accessible via the navigation bar.

### 1. Endpoints (The Builder)
This is your primary workspace. 

* **URL & Method:** Define your target and execution method.
* **Body Payloads:** Use the built-in CodeMirror editor to write syntax-highlighted JSON or XML payloads.
* **Headers & Params:** Add infinite key-value pairs.

**Example JSON Payload:**
```json
{
  "operator_id": "OP-7734",
  "directive": "EXECUTE_OVERRIDE",
  "payload": {
    "target": "db-cluster-alpha",
    "force": true
  }
}
```

> [!IMPORTANT]  
> When you hit **Send**, the workbench parses the response, calculates network latency in milliseconds, and measures exact payload size for performance profiling.

### 2. Console (Execution History)
Every request you make is silently logged to your local Console. 
If you need to reproduce a bug or re-run a specific workflow, simply open the Console, locate the timestamped log, and click it to instantly rehydrate the Request Builder with those exact parameters.

### 3. Fetch Library
Need data fast? The Fetch Library is a curated repository of pre-configured public APIs (like JSONPlaceholder) and proprietary company endpoints. 
Select an endpoint from the catalog, fill in any required template variables, and the workbench will automatically structure the underlying HTTP call for you.

---

## Real-time Collaboration

API.OS truly shines when used with a team. Once you authenticate, you unlock the Comm Matrix.

### Config Sharing
Instead of copying cURL commands into Slack:
1. Build your request in the **Endpoints** tab.
2. Click the **CONFIG** share button.
3. Select any registered teammate from the roster.
4. The exact configuration appears in their **Shared Inbox**, ready for immediate execution.

> [!WARNING]
> Only verified Operators have access to Config Sharing. Unauthenticated users operate in local-only Sandbox mode.

### Voice Room & Terminal Chat
Click on the **Chat** module to enter the Comm Matrix. Here you can execute shell commands (like `/help` or `/clear`), chat with teammates, and open a direct, end-to-end encrypted WebRTC audio channel for live debugging sessions.

---

## Next Steps

Ready to unlock the full potential of the workbench? Proceed to the **Authentication** guide to learn how to secure your Operator Profile and access restricted zones.
