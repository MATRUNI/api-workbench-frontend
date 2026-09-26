# ⚡ Stress Testing Engine

The **Stress Testing Engine** is a high-throughput, memory-safe load generation and telemetry system built directly into API.OS. It empowers developers and QA engineers to benchmark API resilience, analyze response latency distributions, uncover concurrency bottlenecks, and detect server-side rate limits under parallel or serial traffic—all from within the browser.

---

## 1. Overview & Architecture

Traditional browser-based load generation tools suffer from three catastrophic design flaws:
1. **Main-Thread Freezing:** Firing thousands of requests and updating React state on every single resolution overwhelms the DOM and crashes the browser tab.
2. **Memory Leaks from Response Accumulation:** Buffering response payloads into JavaScript heap memory exhausts RAM within seconds when executing thousands of requests.
3. **Artificial Browser Concurrency Throttles:** Browsers limit parallel HTTP/1.1 connections to [~6 sockets per origin (RFC 7230)](https://datatracker.ietf.org/doc/html/rfc7230#section-6.4), artificially stalling tests without the user's knowledge.

The API.OS Stress Engine was engineered specifically to solve all three problems through **zero-allocation stream handling**, a **dynamic parallel worker pool**, **uniform reservoir sampling**, and an optional **compiled local proxy agent**.

---

## 2. Complete Terminologies Glossary

Understanding performance benchmarking requires clarity on core networking and statistical terms:

### Workload & Throughput Terms
* **Total Requests ($N$):** The total count of HTTP requests scheduled for execution in a single test run (e.g., 25 probes up to 250,000 high-scale requests).
* **Throughput / RPS (Requests Per Second):** The rate at which the server successfully processes and completes requests per second:

  $$
  \text{Throughput (RPS)} = \frac{\text{Completed Requests}}{\text{Total Elapsed Time (seconds)}}
  $$

  High throughput indicates that both the network pipeline and server event loops are operating efficiently.
* **Concurrency ($c$):** The number of simultaneous worker threads/connections actively flying over the wire at any given instant.
* **In-Flight Requests:** The exact count of requests currently waiting for server headers or bytes on the network wire. At any moment:

  $$
  \text{In-Flight} \le c
  $$
* **Serial Execution ($c = 1$):** Requests are executed strictly one after another in sequential order. Request $N+1$ is never dispatched until Request $N$ has completely finished. Ideal for measuring baseline latency without socket contention.
* **Parallel Execution ($c > 1$):** Requests are dispatched simultaneously across a worker pool (e.g., 5x, 15x, 50x, 100x).

### Latency & Timing Terms
* **Round-Trip Time (RTT):** The total duration elapsed from the instant the first byte leaves the client socket until the first response header byte is received by the client.
* **Client-Perceived Latency vs. Server Processing Time:** Client latency encompasses DNS lookup + TCP handshake + TLS negotiation + network transit + server processing time + response return transit. In contrast, server-side logs only record the time spent inside the backend handler.
* **Jitter:** The statistical variance or fluctuation in latency between consecutive requests over the network.
* **Timeout ($T_{\text{out}}$):** The maximum threshold in milliseconds (e.g., 5,000ms to 60,000ms) the client waits before forcefully aborting an unfulfilled request with a synthetic `TIMEOUT` status.
* **Delay / Inter-Request Pacing:** An intentional pause inserted between request dispatches. "Blast Mode" sets this to 0ms for maximum stress, while pacing (e.g., 50ms, 100ms) simulates sustained organic user traffic.

### Telemetry & Memory Terms
* **Reservoir Sampling ([Vitter's Algorithm R](https://en.wikipedia.org/wiki/Reservoir_sampling)):** An algorithm that selects a statistically unbiased sample of $k$ items from a stream of unknown or massive length $n$ in a single pass.
* **Zero-Allocation Stream Cancelling:** Immediately closing incoming response body streams via `res.body.cancel()` as soon as status headers arrive, keeping browser RAM usage completely flat.
* **Sample Window:** A small, controlled buffer (up to 250 responses) retained by the engine to allow the operator to inspect payload contents and headers in the UI without memory penalties.

### HTTP & Status Categorization
* **2xx (Success):** The server successfully received, understood, and accepted the request (e.g., `200 OK`, `201 Created`, `204 No Content`).
* **3xx (Redirection):** Further action is needed to fulfill the request (e.g., `301 Moved Permanently`, `304 Not Modified`).
* **4xx (Client Errors):** The request contains invalid syntax, missing authentication, or points to non-existent resources (e.g., `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `422 Unprocessable Entity`).
* **429 (Too Many Requests / Rate Limiting):** The server's rate-limiting policy was triggered ([RFC 6585](https://datatracker.ietf.org/doc/html/rfc6585#section-4)). Often accompanied by `Retry-After`, `X-RateLimit-Limit`, and `X-RateLimit-Remaining` headers. Learn more about the [Token Bucket Algorithm](https://en.wikipedia.org/wiki/Token_bucket).
* **5xx (Server Errors):** The server encountered an internal failure or gateway timeout (e.g., `500 Internal Server Error`, `502 Bad Gateway`, `503 Service Unavailable`, `504 Gateway Timeout`).
* **Synthetic Statuses:**
  * `NETWORK_ERROR`: The connection was dropped by the host, DNS failed, or the browser blocked the request due to [CORS violations](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS).
  * `TIMEOUT`: The request exceeded the configured millisecond timeout threshold.
  * `ABORTED`: The request was cancelled midway by user interaction via the Stop button.

---

## 3. Demystifying Latency & All Percentiles ("All p")

Relying solely on **Average (Mean) Latency** is one of the most dangerous anti-patterns in software benchmarking. The arithmetic mean hides extreme outliers, server hiccups, garbage collection spikes, and connection queues.

If 99 users experience a lightning-fast latency of **10ms**, but 1 user suffers a **10,000ms (10s)** database lock timeout, the mathematical average is:

$$
\bar{x} = \frac{\sum_{i=1}^{N} x_i}{N} = \frac{(99 \times 10\text{ ms}) + 10{,}000\text{ ms}}{100} = \mathbf{109.9\text{ ms}}
$$

Looking only at $\bar{x} \approx 110\text{ ms}$ creates the illusion of acceptable performance, masking the fact that **1% of your user base suffered a catastrophic 10-second freeze**.

### Detailed Breakdown of Every Percentile ("All p")

Percentiles rank every single measured latency from lowest to highest. A percentile $pX$ means that $X\%$ of all requests completed in that duration or faster:

$$pX \implies P(\text{Latency} \le L) = \frac{X}{100}$$

| Percentile | Name | Real-World Meaning & Interpretation | SLA & Operational Significance |
| :--- | :--- | :--- | :--- |
| **Min** | Absolute Minimum | The fastest response observed across the entire benchmark run. | Represents the theoretical best-case speed (e.g., edge CDN cache hit, warm memory lookup, minimal network hop). |
| **p50** | 50th Percentile (Median) | Exactly **50%** of requests were faster, and 50% were slower. | **The True Baseline Experience.** Unlike the mean, the median is immune to extreme outliers. This is what the typical, ordinary user experiences. |
| **p75** | 75th Percentile (Upper Quartile) | **75%** of requests completed within this time; 25% were slower. | Early warning indicator. If $p75$ begins diverging significantly from $p50$, thread pools or database connection pools are starting to queue. |
| **p90** | 90th Percentile | **90%** of requests were faster; **1 in 10** requests took longer. | Indicates noticeable latency degradation for a substantial fraction of users. |
| **p95** | 95th Percentile | **95%** of requests completed faster; **1 in 20** experienced this delay. | **Standard Production SLA Metric.** Most commercial web APIs define their Service Level Agreements around $p95$ ([Google SRE Book: Service Level Objectives](https://sre.google/sre-book/service-level-objectives/)). |
| **p99** | 99th Percentile | **99%** of requests completed faster; **1 in 100** suffered this latency. | **Tail Latency Benchmark.** Exposes database query index misses, backend garbage collection (GC) pauses, cold starts, and lock contention. |
| **p99.9** | 99.9th Percentile ("Three Nines") | **99.9%** were faster; **1 in 1,000** suffered this latency. | **Microservice Fan-Out Risk.** In microservice architectures where a single frontend action triggers 20 parallel downstream RPCs, a high $p99.9$ means that 1 in every 50 user clicks will stall (see [The Tail at Scale (Google Research)](https://research.google/pubs/pub40801/)). |
| **Max** | Absolute Maximum | The single slowest response recorded during the entire benchmark test. | Identifies worst-case spikes, extreme TCP retransmissions, or requests that almost hit the timeout ceiling. |

### What Causes Tail Latency ($p90$, $p95$, $p99$) to Spike?
When $p50$ is low (e.g., 40ms) but $p99$ is high (e.g., 1,800ms), look for:
1. **Garbage Collection (GC) Freezes:** Backend runtimes (Node.js, Java, Go) stopping execution to reclaim heap memory.
2. **Database Connection Pool Saturation:** Incoming queries waiting in queue because all available database sockets are busy.
3. **CPU Throttling & Burst Exhaustion:** Cloud VMs or serverless containers consuming their burst credit allowance.
4. **TCP Head-of-Line Blocking & Packet Loss:** Lost packets over WAN connections requiring TCP retransmission cycles.

---

## 4. How Everything Works Under the Hood

```
   ┌──────────────────────────────────────────────────────────────┐
   │                       API.OS UI                              │
   │  [Method] [URL] [Total Requests: 50,000] [Concurrency: 50x]  │
   └──────────────────────────────┬───────────────────────────────┘
                                  │ Starts Runner
                                  ▼
   ┌──────────────────────────────────────────────────────────────┐
   │                  Stress Engine Dispatcher                    │
   │           Next Request Index (Atomic Pull Queue)             │
   └───────────────┬──────────────────────────────┬───────────────┘
                   │                              │
         ┌─────────┴─────────┐          ┌─────────┴─────────┐
         ▼                   ▼          ▼                   ▼
   ┌───────────┐       ┌───────────┐  ┌───────────┐   ┌───────────┐
   │ Worker 1  │       │ Worker 2  │  │ Worker 3  │...│ Worker 50 │
   └─────┬─────┘       └─────┬─────┘  └─────┬─────┘   └─────┬─────┘
         │                   │              │               │
         ▼                   ▼              ▼               ▼
   ┌──────────────────────────────────────────────────────────────┐
   │      Routing: Direct Browser Fetch OR Vlang Local Proxy      │
   └──────────────────────────────┬───────────────────────────────┘
                                  │ High-Speed Telemetry (<35ms throttle)
                                  ▼
   ┌──────────────────────────────────────────────────────────────┐
   │               Telemetry & Telemetry Collectors               │
   │  * Running RPS        * Running Min/Max/Avg                  │
   │  * Status Counts      * Reservoir Sample (50k Max Samples)   │
   │  * Stream Cancel      * Throttled UI Render Loop (30 FPS)    │
   └──────────────────────────────────────────────────────────────┘
```

### 1. Dynamic Worker Pool & Work-Stealing Loop
When you launch a parallel benchmark with concurrency $c$ and total requests $N$:
* The engine creates $c$ asynchronous worker promises.
* A shared, constant-time atomic counter `nextRequestIndex` dispenses the next request index.
* When a worker completes request $i$, it immediately pulls index $i+1$ without delay or memory reallocation.
* When all $N$ requests are distributed, workers terminate cleanly and settle `Promise.all()`.

### 2. High-Precision Timing with `performance.now()`
Network durations are clocked using browser hardware timestamps (`performance.now()`), delivering sub-millisecond precision accurate down to microseconds, completely decoupled from system wall-clock adjustments.

### 3. Memory Safety via Stream Cancellation
When firing 100,000 requests, storing 100,000 JSON payloads (even 10 KB each) would consume **1 GB of RAM**, crashing the browser tab. The Stress Engine executes:
```javascript
// Instant cancel after response headers arrive
if (res && res.body && typeof res.body.cancel === 'function') {
  res.body.cancel().catch(() => {});
}
```
This frees system socket buffers immediately while preserving status code, headers, and exact response timing.

### 4. Bounded Percentiles with Reservoir Sampling
To calculate $p50$, $p90$, $p95$, and $p99$ accurately without maintaining arrays of 250,000 numbers in memory, the engine implements [Vitter's Algorithm R](https://en.wikipedia.org/wiki/Reservoir_sampling) capped at 50,000 data points ($k = 50{,}000$):
* For the first $k$ requests, every latency value is recorded into the reservoir.
* For every request $i > k$, a random integer $r \in [0, i]$ is generated.
* If $r < k$, the sample at position $r$ is replaced with the new latency:
  $$P(\text{Item } i \text{ retained}) = \frac{k}{i}$$
* **Mathematical Guarantee:** At the end of the run, every request has an equal $\frac{k}{N} = \frac{50{,}000}{N}$ probability of remaining in the sample, ensuring unbiased percentile calculations with zero memory bloat.

### 5. Render Throttling (30 FPS Telemetry Loop)
Dispatching 4,000 requests per second into standard React state triggers 4,000 re-renders per second, instantly locking the UI. The Stress Engine buffers telemetry in lightweight internal variables and throttles broadcasts to React to **35ms intervals (~30 frames per second)**. The UI remains butter-smooth even under brutal load.

---

## 5. What the User Should Expect (Step-by-Step Experience)

### Phase 1: Pre-Flight Configuration
Before pressing **Start Stress Test**, configure your parameters in the **Stress Controls** toolbar:
1. **Target URL & Method:** Set your endpoint (GET, POST, PUT, DELETE, PATCH). If you configured query params, auth tokens, or headers in the Request Builder, the engine inherits them automatically.
2. **Workload Presets:** Choose from preset volumes (`25`, `100`, `500`, `1,000`, `10,000`, `50,000`) or type a custom number.
3. **Concurrency Level:**
   * `Serial (1)`: Measures true single-thread baseline latency and database consistency.
   * `5x - 15x`: Standard web browser parallelism simulation.
   * `50x - 100x+`: High-concurrency stress testing to identify server thread exhaustion.
4. **Advanced Options (Collapsible):**
   * **Request Timeout:** Defaults to `15,000ms` (15s). Configurable up to `60,000ms`.
   * **Delay Between Requests:** Defaults to `0ms (Blast)`. Add pacing if testing production APIs to prevent IP blacklisting.
   * **Proxy Toggle:** Enable to route via the local compiled Vlang agent (`:17777`) to bypass CORS and browser connection caps.

### Phase 2: During the Benchmark Run
Once started, the view auto-scrolls to the live Telemetry Dashboard:
* **Status Pill:** Displays a pulsing green `RUNNING BENCHMARK` badge with a live elapsed timer.
* **Hero Metric Cards:**
  * **Throughput:** Live updating `req/sec` gauge.
  * **Duration:** Millisecond timer.
  * **Concurrency:** Shows active in-flight connections (e.g., `48 / 50 active workers`).
  * **Last / Average Latency:** Real-time pulse of server response speed.
* **Progress Bar:** Multi-colored segmented bar tracking completion:
  * 🟩 **Green segment:** Successful responses (2xx / 3xx).
  * 🟨 **Amber segment:** Client error responses (4xx, including 429 rate limits).
  * 🟥 **Red segment:** Server errors (5xx, timeouts, network drops).
* **Live Latency Sparkline:** A visual oscilloscope displaying latency waves for the last 25 requests to spot transient jitter in real time.
* **Immediate Stop Button:** Clicking **Stop** triggers an instant `AbortController` cascade across all active workers, halting the test within milliseconds without hanging sockets.

### Phase 3: Post-Run Report & Analysis
When the benchmark completes (or is stopped), the dashboard presents a comprehensive report:
1. **Completed Badge:** Displays `BENCHMARK COMPLETED` or `BENCHMARK ABORTED`.
2. **Latency Distribution Grid:** Clear boxes for **Min**, **p50 (Median)**, **p90**, **p95**, **p99**, and **Max**.
3. **Captured Sample Response:** Inspect formatted payload previews directly, or click **Inspect Full Body** to open the response in the integrated CodeMirror editor.
4. **Status Code Breakdown:** Percentage and count breakdown of every received HTTP status.
5. **Errors Viewer:** If network drops, timeouts, or 5xx errors occurred, switch to the **Errors Tab** to inspect categorized error messages.
6. **Export Report Button:** One-click copy of the entire benchmark telemetry as a clean JSON document for Jira, GitHub issues, or benchmark archives.

---

## 6. Real-World Benchmarks & Comparisons

### Case Study: Public REST Endpoint (JSONPlaceholder)

The following benchmark demonstrates the dramatic speedup gained by shifting from serial baseline testing to parallel worker pooling over a public internet WAN:

| Benchmark Dimension | Serial Baseline ($c = 1$) | Parallel Worker Pool ($c = 15$) | Measured Impact |
| :--- | :--- | :--- | :--- |
| **Workload Executed** | 25 requests | 100 requests | **4x greater volume** |
| **Total Duration** | 6.32 seconds | 2.79 seconds | **56% faster completion** |
| **Throughput (RPS)** | **4.0 req/sec** | **35.8 req/sec** | **🚀 8.9x Speedup** |
| **Average Latency** | 252 ms | 316 ms | Normal connection queueing |
| **Median Latency (p50)** | 190 ms | 206 ms | Highly consistent latency |
| **95th Percentile (p95)** | 559.2 ms | 634.2 ms | Tail latency managed smoothly |
| **Success Rate** | 100% (25 / 25) | 100% (100 / 100) | Zero dropped connections |

### High-Volume Memory Scale Benchmarks

To verify client-side memory safety, the engine was benchmarked under massive volume:

| Total Workload | Concurrency | Total Duration | Throughput | Success Rate | Browser Memory Overhead |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **10,000 Requests** | 50 workers | **3.21 seconds** | **3,121.1 req/sec** | 100% | ~33 MB |
| **50,000 Requests** | 100 workers | **13.99 seconds** | **3,575.5 req/sec** | 100% | ~28 MB |
| **100,000 Requests** | 150 workers | **31.42 seconds** | **3,183.6 req/sec** | 100% | ~99 MB |

> [!NOTE]
> Even across 100,000 consecutive requests, memory consumption remains under 100 MB and the user interface stays completely fluid.

---

## 7. Direct Browser Mode vs. Vlang Local Proxy

When testing real-world APIs, browser security restrictions impose strict limitations:

| Feature / Bottleneck | Direct Browser Engine | Vlang Local Proxy Agent (`:17777`) |
| :--- | :--- | :--- |
| **CORS Policy** | Blocked on 95% of real-world public APIs | **Universal 100% Bypass** |
| **Preflight (OPTIONS) Tax** | Remote WAN round-trip for each origin | **Local loopback (< 0.2ms)**; zero WAN preflight tax |
| **Browser Socket Cap** | Hard limit of **~6 sockets per host** ([RFC 7230](https://datatracker.ietf.org/doc/html/rfc7230#section-6.4)) | **Native OS socket pooling** (50 to 100+ sockets) |
| **Restricted Headers** | Browser blocks `Cookie`, `User-Agent`, etc. | **Full control** over any custom header |
| **Latency Penalty** | 0 ms (direct connection) | Minimal loopback overhead (< 0.3 ms) |
| **Target Reachability** | Only public APIs with CORS enabled | Any public, private, or local network endpoint |
| **Recommended Concurrency** | 1 to 6 workers | **10 to 100+ workers** |

> [!IMPORTANT]
> **Understanding the Preflight (OPTIONS) Tax**
> When you benchmark an authenticated API directly from the browser with 5,000 requests, the browser emits an automatic `OPTIONS` preflight for each request ([MDN Preflight Details](https://developer.mozilla.org/en-US/docs/Glossary/Preflight_request)), generating **10,000 total requests** over the internet and halving your true throughput. With the Vlang proxy enabled, the preflight is answered immediately on `127.0.0.1` in 0.2ms, and only true requests reach your remote server.

---

## 8. Diagnostic & Troubleshooting Playbook

### Problem 1: High p99 Latency despite low p50
* **Symptoms:** $p50$ is 45ms, but $p95$ is 400ms and $p99$ is 2,200ms.
* **Diagnosis:** Your server handles ordinary load well, but suffers from tail latency under concurrent spikes.
* **Checklist:**
  1. Inspect database connection pool limits. Are incoming queries waiting for an open connection?
  2. Check for missing database indexes on filter/sort fields.
  3. Inspect server runtime Garbage Collection (GC) pauses.
  4. Check if backend container CPU is being throttled.

### Problem 2: Sudden 429 Too Many Requests
* **Symptoms:** Progress bar shows a surge of amber (4xx) responses; rate limit alert appears.
* **Diagnosis:** The server or API gateway (Cloudflare, AWS WAF, Kong) has triggered IP rate limiting.
* **Action:**
  1. Inspect the captured response headers for `Retry-After` or `X-RateLimit-Reset`.
  2. Increase the **Delay Between Requests** in Advanced Settings (e.g., from 0ms to 50ms or 100ms) to pace the workload.
  3. Lower the **Concurrency** worker count.

### Problem 3: Requests Fail with `NETWORK_ERROR`
* **Symptoms:** All requests instantly fail; 0ms latency recorded.
* **Diagnosis:** The remote server does not emit CORS headers (`Access-Control-Allow-Origin: *`), or the server is down.
* **Action:** Enable the **Vlang Local Proxy** toggle (`isProxyEnable: true`). Ensure the local proxy agent is running on port 17777.

### Problem 4: Concurrency above 6 doesn't increase throughput in Direct Mode
* **Symptoms:** Setting concurrency to 50x produces the exact same RPS as 6x.
* **Diagnosis:** You have hit the browser's hardcoded HTTP/1.1 socket ceiling (~6 TCP connections per domain).
* **Action:** Switch to the Vlang Local Proxy to unlock native OS socket pooling.
