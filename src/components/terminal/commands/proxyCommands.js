/**
 * Sankram (संक्रम) C Reverse Proxy command reference & daemon status
 * Dynamically adapts syntax to client OS (Windows PowerShell/CMD vs. Linux/macOS Bash/Zsh)
 */

function resolveOS(subArgs = []) {
  const allArgs = subArgs.join(' ').toLowerCase();
  if (allArgs.includes('win')) return 'windows';
  if (allArgs.includes('mac') || allArgs.includes('darwin')) return 'macos';
  if (allArgs.includes('linux') || allArgs.includes('unix')) return 'linux';

  if (typeof window !== 'undefined') {
    const ua = (window.navigator?.userAgent || '').toLowerCase();
    const platform = (window.navigator?.platform || '').toLowerCase();
    if (ua.includes('win') || platform.includes('win')) return 'windows';
    if (ua.includes('mac') || platform.includes('mac')) return 'macos';
  }
  return 'linux';
}

function getSankramManual(os) {
  const isWindows = os === 'windows';
  const bin = isWindows ? '.\\sankram.exe' : './sankram';
  const platformLabel = isWindows ? 'Windows (PowerShell / Command Prompt)' : os === 'macos' ? 'macOS (Zsh / Terminal)' : 'Linux (Bash / Zsh)';
  const altBin = isWindows ? './sankram' : '.\\sankram.exe';
  const altOsName = isWindows ? 'Linux / macOS' : 'Windows';
  const altArg = isWindows ? 'unix' : 'win';

  return [
    '==============================================================================',
    '  SANKRAM (संक्रम) — High-Performance C Reverse Proxy & Dynamic Edge Gateway  ',
    '                      ⚡ Powered by Multi-Reactor Engine                      ',
    '==============================================================================',
    `  Active Platform:    ${platformLabel}`,
    `  Executable Syntax:  ${bin} [OPTIONS]`,
    '',
    'CORE DAEMON OPTIONS:',
    '  -p, --port <port>        Port to listen on (default: 17777)',
    '  -b, --bind <ip>          IP address to bind to (default: 127.0.0.1)',
    '  -t, --threads <n>        Worker reactor threads (default: CPU cores)',
    '  -m, --mode <mode>        Runtime mode: server | stress | logs | help',
    '  -l, --log-level <lvl>    Log level: debug | info | warn | error (default: info)',
    '  -v, --verbose            Shortcut for verbose debug logging (-l debug)',
    '  --spawn-config           Auto-generate template proxy.conf configuration file',
    '  -h, --help               Display Sankram C usage manual',
    '',
    'NATIVE C STRESS ENGINE (-m stress):',
    '  -u, --url <url>          Target URL to benchmark (supports ?url= routing)',
    '  -c, --concurrent <n>     Number of parallel persistent connections (default: 50)',
    '  -n, --requests <n>       Total number of HTTP requests to execute (default: 10000)',
    '  -X, --method <METHOD>    HTTP method: GET | POST | PUT | DELETE (default: GET)',
    '  -d, --data <payload>     HTTP request payload string / JSON',
    '',
    `CLI EXAMPLES (${platformLabel}):`,
    `  # Start reverse proxy daemon on port 17777 with 8 worker threads:`,
    `  ${bin} -p 17777 -t 8`,
    '',
    `  # Run with real-time debug socket tracing:`,
    `  ${bin} -v`,
    '',
    `  # Stream live color-coded runtime access logs:`,
    `  ${bin} -m logs`,
    '',
    `  # Multi-threaded benchmark (20k requests, 100 connections, 4 threads):`,
    `  ${bin} -m stress -u "http://127.0.0.1:17777/?url=https://httpbin.org/get" -c 100 -n 20000 -t 4`,
    '',
    `  # Custom POST benchmark with JSON payload:`,
    `  ${bin} -m stress -u "http://127.0.0.1:9099/test" -c 50 -n 10000 -X POST -d '{"speed":"c"}'`,
    '',
    `ALTERNATIVE PLATFORM SYNTAX:`,
    `  On ${altOsName}: ${altBin} -p 17777`,
    `  Tip: Type "sankram help ${altArg}" to switch OS manual view.`,
    '=============================================================================='
  ].join('\n');
}

export async function handleProxyCommand(subArgs = [], context = {}) {
  const { 
    isProxyRunning, 
    proxyPort, 
    setIsProxyModalOpen,
    checkProxyHealth,
    lastPingMs
  } = context;

  const subAction = subArgs[0]?.toLowerCase();

  // 1. SETUP / DOWNLOAD MODAL
  if (subAction === 'setup' || subAction === 'download' || subAction === 'install' || subAction === 'dl') {
    if (typeof setIsProxyModalOpen === 'function') {
      setIsProxyModalOpen(true);
    }
    return {
      type: 'success',
      text: [
        'Opening Sankram binary setup and download dialog...',
        'GitHub repository: https://github.com/MATRUNI/sankram',
        'Official v1.2.0 archives: Linux (.tar.gz), macOS (.tar.gz), Windows (.zip)'
      ].join('\n')
    };
  }

  // 2. STATUS AUDIT
  if (subAction === 'status' || subAction === 'ping' || subAction === 'health') {
    const port = proxyPort || 17777;
    const clientOs = resolveOS(subArgs);
    const runCmd = clientOs === 'windows' ? `.\\sankram.exe -p ${port}` : `./sankram -p ${port}`;

    let alive = isProxyRunning;
    if (typeof checkProxyHealth === 'function') {
      alive = await checkProxyHealth(port);
    }

    return {
      type: alive ? 'success' : 'warning',
      text: [
        '=======================================================',
        '        SANKRAM (संक्रम) C PROXY DAEMON STATUS         ',
        '             ⚡ Powered by Sankram Engine              ',
        '=======================================================',
        `  Daemon State:     ${alive ? '● ONLINE' : '○ OFFLINE'}`,
        `  Listening Socket: http://127.0.0.1:${port}/`,
        `  Loopback Ping:    ${alive ? (lastPingMs ? `${lastPingMs} ms` : '< 1 ms') : 'Unreachable'}`,
        `  Client Platform:  ${clientOs === 'windows' ? 'Windows' : clientOs === 'macos' ? 'macOS' : 'Linux'}`,
        '-------------------------------------------------------',
        alive 
          ? '  Status: High-performance C multi-reactor proxy is running.'
          : `  Daemon offline. Run in terminal: ${runCmd}`,
        '  Run "sankram help" to view full CLI flags and usage.',
        '======================================================='
      ].join('\n')
    };
  }

  // 3. DEFAULT OR HELP: DYNAMIC SANKRAM CLI COMMANDS
  const clientOs = resolveOS(subArgs);
  return {
    type: 'suggestion',
    text: getSankramManual(clientOs)
  };
}
