# Endpoints & Execution Engine

The **Endpoints** module is a highly optimized, state-driven workbench designed for crafting, executing, and analyzing complex HTTP requests. It is divided into two primary interfaces: the Request Builder and the Response Viewer.

## 1. The Request Builder

The Request Builder allows for infinite customization of your HTTP parameters before execution.

### Protocol & Targeting
* **Method Selector:** Supports `GET`, `POST`, `PUT`, `PATCH`, and `DELETE` operations.
* **URL Pipeline:** Input your target address. Features a quick-clear (`X`) toggle.
* **Execution Lifecycle:** Hitting the **Send** button initiates a strict 4-phase execution pipeline (`Initializing` -> `Connecting` -> `Processing` -> `Parsing`) handled by the `api.js` core service.

### Configuration Tabs
* **BODY:** Powered by **CodeMirror 6**, this panel provides real-time syntax highlighting, bracket pairing, and format validation for `JSON` and `XML` payloads. 
* **HEADERS:** A dynamic Key-Value list to define request headers (e.g., `Authorization: Bearer <token>`).
* **QUERY PARAMETERS:** Inject URL query strings dynamically without cluttering the URL pipeline.

> [!TIP]
> **Live Config Sharing**
> If you are authenticated, you will see a glowing **CONFIG** button in the Request Builder. Clicking this allows you to bundle your entire current setup (URL, Method, Headers, Body, and Query Params) and instantly "beam" it to any registered operator via the Comm Matrix, even if they are offline.

---

## 2. The Local Proxy Agent

Browser-based web clients enforce strict Cross-Origin Resource Sharing (CORS) policies. To execute requests against any third-party API without failure, API.OS integrates a native TCP tunneling agent.

* **Agent Detection:** The application silently polls `127.0.0.1:17777` every 5 seconds. If the **Vlang Local Proxy Agent** is running, the Server icon in the NavBar will glow green.
* **Traffic Routing:** When active, all requests are automatically URL-encoded and routed through the proxy, stripping CORS headers and allowing for seamless binary data transfers.

---

## 3. The Response Viewer

Upon a successful (or failed) execution, the Response Viewer takes control of the payload.

### Telemetry & Metrics
The header bar instantly calculates three critical metrics:
* **Payload Length:** The exact size of the returned data body.
* **Status Badge:** Color-coded HTTP status indicators (`SUCCESS 2xx`, `WARNING 4xx`, `ERROR 5xx`).
* **Latency:** Total round-trip network time in milliseconds.

### Data Inspection Tabs
* **BODY:** The default view. Re-runs the data through CodeMirror for clean, syntax-highlighted JSON/XML reading. (If a binary asset is detected, it will prompt you to switch to Preview).
* **HEADERS:** A mapped list of all headers returned by the target server.
* **RAW:** The unparsed, raw string response.
* **PREVIEW:** An intelligent rendering engine that only appears when a supported media type is detected (`IMAGE`, `AUDIO`, `VIDEO`, `DOCUMENT`, `HTML`, `CSV`). It visually renders the blob data inline.

### Utility Actions
* **COPY:** Instantly copies the formatted response to your clipboard.
* **SAVE:** Downloads the payload directly to your machine as `response-[timestamp].[type]`.
* **EXPAND:** Maximizes the Response Viewer to fill the screen for large payloads.
* **CLEAR:** Purges the current response from memory.
