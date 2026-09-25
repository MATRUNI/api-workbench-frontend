import {
  parseWithClauses,
  getHelpMatrix,
  handleTimingCommand,
  handleDatabaseStatsCommand,
  handleHistoryCommand,
  handleNavigationCommand,
  handleTabCommand,
  handleLibraryCommand,
  handleHttpDispatch
} from './commands';

export { parseWithClauses };

export async function executeTerminalCommand(rawCmd, context) {
  const cmd = rawCmd?.trim();
  if (!cmd) return null;

  const lower = cmd.toLowerCase();

  if (lower === 'help' || lower === '?') {
    return getHelpMatrix();
  }

  if (lower === 'clear') {
    return { type: 'clear' };
  }

  if (lower === 'timing' || lower === 'waterfall' || lower === 'latency') {
    return handleTimingCommand(context);
  }

  if (lower === 'db' || lower.startsWith('db ') || lower === 'tables') {
    return await handleDatabaseStatsCommand();
  }

  if (lower === 'history' || lower.startsWith('history ')) {
    return await handleHistoryCommand(cmd);
  }

  if (/^nav\b/i.test(cmd)) {
    return handleNavigationCommand(cmd, context);
  }

  if (/^tab\b/i.test(cmd)) {
    return handleTabCommand(cmd, context);
  }

  if (/^library\b/i.test(cmd)) {
    return handleLibraryCommand(cmd, context);
  }

  const isHttpVerb = /^(send|get|post|put|delete|patch|head|options)\b/i.test(cmd);
  const isCurl = /^curl\b/i.test(cmd);
  if (isHttpVerb || isCurl) {
    return await handleHttpDispatch(cmd, context);
  }

  return {
    type: 'echo',
    text: `Command not recognized: "${cmd}". Type "help" to view syntax matrix.`
  };
}
