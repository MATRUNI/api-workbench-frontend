# API-OS Frontend

A highly interactive, real-time API workbench and team collaboration platform. Designed with a sleek, terminal-inspired "operator" aesthetic, this application goes beyond simple API testing by integrating real-time team communication, WebRTC voice channels, and instant API configuration sharing.

> **Note:** This repository contains only the frontend application. It relies on a separate backend server to function completely.
> 🔗 **Backend Repository**: [MATRUNI/node-express-api](https://github.com/MATRUNI/node-express-api)

## 🚀 Key Features

### 1. API Execution & Library
*   **Request Builder (Endpoints)**: Construct RESTful HTTP requests (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`). Supports dynamic JSON/text bodies, query parameters, and custom headers.
*   **Response Viewer**: Rich visualization using CodeMirror for syntax-highlighted JSON/XML. Tracks latency metrics, response sizes, and exact HTTP status codes.
*   **Fetch (API Library)**: A centralized library containing free APIs (like JSON Placeholder). Select an endpoint, fill in your desired parameters, configure the request, and fire it instantly.
*   **Console History**: Automatically logs your past API requests for easy retrieval and re-execution.
*   **Docs**: Placeholder for upcoming comprehensive interactive documentation.

### 2. Real-Time Collaboration & Comm Matrix
*   **Live Config Sharing**: Ditch the copy-pasting. Click the "Config Share" button to instantly beam your entire API setup (URL, headers, body) to another online operator's Shared Inbox via WebSockets.
*   **SHELL_STREAM Chat**: A terminal-styled live chat interface. Includes built-in system commands (`/help`, `/clear`, `/status`) and monitors network latency and active relays in real-time.
*   **WebRTC Voice Room**: Built-in peer-to-peer voice calling. Features an active operator roster, incoming call alerts, mute/deafen controls, and a detailed call event log.

### 3. Security & Identity
*   **Secure Authentication**: Terminal-themed registration and login panel featuring mandatory **Email OTP (One-Time Password) Verification** to ensure identity security.
*   **Operator Profiles**: Manage your personal API libraries, review your execution history, and handle incoming configuration shares from your teammates.

## 🛠️ Tech Stack

*   **Framework**: React 19 + Vite (Fast HMR & Optimized Builds)
*   **Routing**: React Router DOM v7
*   **Real-time Protocol**: Socket.IO Client (Signaling & Chat)
*   **Peer-to-Peer Audio**: WebRTC (Custom `useWebRtc` hook for voice streams)
*   **Code Editor**: CodeMirror 6 (JSON/XML syntax highlighting)
*   **Animations & Icons**: Framer Motion & Lucide React
*   **Code Quality**: ESLint 10 & Prettier

## 📂 Project Structure

```text
src/
├── components/
│   ├── request-panel/      # API Builder tabs, Body panels, Key-Value inputs
│   ├── socket/             # ChatComponent, VoiceCallRoom (WebRTC), CommMatrixShell
│   └── utility_Components/ # Loaders, Toasts, KeyValue lists
├── context/                # React Contexts (Socket, User, Request, Share, Library)
├── hooks/                  # Custom hooks (e.g., useWebRtc for audio peering)
├── services/               # Backend API call wrappers and OTP auth services
├── style/                  # Modular CSS heavily styled with terminal aesthetics
└── utils/                  # Formatters and helper functions
```

## ⚙️ Getting Started

### Prerequisites
You must first have the backend server running to handle API requests, sockets, and WebRTC signaling.
1. Start the backend: [MATRUNI/node-express-api](https://github.com/MATRUNI/node-express-api).
2. Ensure you have Node.js (v18+) and npm/yarn installed.

### Installation & Setup

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd API-FrontEnd
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Configure Environment Variables (`.env` file):
    ```env
    # URL to your running node-express-api backend instance
    VITE_BACKEND_URL=http://localhost:5000/api 
    # API key for secure communication with the backend
    VITE_BACKEND_KEY=your_backend_api_key_here
    # Current version of the frontend application
    VITE_VERSION=1.4
    ```

4.  Start the development server:
    ```bash
    npm run dev
    ```

---
*Built with React, Vite, and WebRTC for high performance and seamless developer experience.*