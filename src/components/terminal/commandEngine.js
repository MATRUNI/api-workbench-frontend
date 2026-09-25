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
  const cmd = rawCmd?.trim().replace(/\s+/g,' ');
  if (!cmd) return null;
  const args = cmd.split(' ');
  const [arg1 , ...subArgs] = args;

  const action = arg1.toLowerCase()

  if (action === 'help' || action === '?') {
    return getHelpMatrix();
  }

  if (action === 'clear') {
    return { type: 'clear' };
  }

  if (action === 'timing' || action === 'waterfall' || action === 'latency') {
    return handleTimingCommand(context);
  }

  if (action === 'db' || action === 'tables') {
    return await handleDatabaseStatsCommand();
  }

  if (action === 'history') {
    return await handleHistoryCommand(subArgs);
  }

  if ( action==="nav") {
    return handleNavigationCommand(subArgs, context);
  }

  if ( action==="tab" ) {
    return handleTabCommand(subArgs, context);
  }

  if (action==="library") {
    return handleLibraryCommand(subArgs, context);
  }

  const HTTP_VERBS = new Set(['send', 'curl', 'get', 'post', 'put', 'delete', 'patch', 'head', 'options']);
  if (HTTP_VERBS.has(action) || action.startsWith('http://') || action.startsWith('https://')) {
    return await handleHttpDispatch(rawCmd?.trim(), context);
  }

  return {
    type: 'echo',
    text: `Command not recognized: "${rawCmd}". Type "help" to view syntax matrix.`
  };
}
