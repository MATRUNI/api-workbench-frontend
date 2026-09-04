# The Comm Matrix

API.OS isn't meant to be used in isolation. The **Comm Matrix** is a suite of real-time collaboration tools powered by a persistent `Socket.IO` connection and peer-to-peer WebRTC.

> [!WARNING]
> Access to the Comm Matrix requires an active, authenticated Operator Profile. Unauthenticated users cannot access chat, voice rooms, or receive configuration shares.

---

## 1. Terminal Chat (`SHELL_STREAM_v2`)

The Chat module acts as the central communications hub, styled as a hacker-inspired terminal interface (`stdout_stream`).

### Network HUD & Audit Buffer
The left sidebar provides real-time diagnostics on your connection:
* **STATE & RELAYS:** Monitors your socket connection status and displays the number of active operators currently connected to the matrix.
* **LATENCY:** A simulated ping response showing your current connection delay in milliseconds.
* **AUDIT_LOG_BUFFER:** A live feed of background system events (e.g., `RECV package`, `MEM_PURGE triggered`, `NODE_SWEEP done`).

### Shell Commands
The chat input doubles as a command-line interface. Commands are executed locally and are not broadcast to other users.

* `/help` - Prints the diagnostic operations guide.
* `/clear` - Purges your local message memory snapshot buffers.
* `/status` - Executes a trace route check, printing your current network metrics and operator identity to the feed.

---

## 2. Live Configuration Sharing

One of the most powerful features in API.OS is **Config Sharing**, allowing teams to bypass exporting JSON files or copying cURL strings.

### The Pipeline
1. Build a complex request in the **Endpoints** tab.
2. Click the **CONFIG** share button to open the dispatch modal.
3. Select any registered teammate from the active roster.
4. Hit Share!

The target Operator will instantly receive a notification on their `FloatingSharedIndicator`. The configuration payload (Method, URL, Headers, Body, and Params) is injected into their **Shared Inbox Modal**, where they can click "Load into Builder" to immediately execute it on their machine.

---

## 3. WebRTC Voice Rooms

Sometimes text isn't enough when debugging a complex backend issue.

> [!IMPORTANT]
> API.OS features built-in peer-to-peer Voice Calling powered by a custom WebRTC integration.

By toggling from `TEXT_STREAM` to `VOICE_ROOM` in the Comm Matrix shell:
* **Audio Handshake:** The system securely negotiates an audio stream (`/silence.wav` is played to unlock browser audio policies).
* **Peer-to-Peer:** The backend Socket server acts only as the signaling layer. The actual audio stream is a direct, encrypted, low-latency connection between you and your teammate.
* **Call Controls:** You can initiate calls, accept incoming alerts, mute your microphone, deafen incoming audio, and monitor a detailed local call event log.
