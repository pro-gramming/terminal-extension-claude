import { exec } from 'child_process';
import { promisify } from 'util';
import { OsInfo } from './types';
import { logger } from './logger';

const execAsync = promisify(exec);

const SYSTEM_PROMPT = `You are a shell command generator.
Given a natural language instruction and the user's OS/shell info, respond with ONLY the shell command — no explanation, no markdown, no code blocks.
If the task cannot be expressed as a single command, use pipes or && to chain commands on one line.`;

export async function generateCommand(instruction: string, osInfo: OsInfo): Promise<string> {
  const platformLabel =
    osInfo.platform === 'win32' ? 'Windows' : osInfo.platform === 'darwin' ? 'macOS' : 'Linux';

  const prompt = `${SYSTEM_PROMPT}\n\nOS: ${platformLabel}\nShell: ${osInfo.shell}\n\nInstruction: ${instruction}`;

  // Use single-quoted here-string via login shell to avoid escaping issues
  const loginShell = process.env.SHELL || '/bin/zsh';

  // Redirect stdin from /dev/null so claude doesn't wait for piped input
  const claudeCmd = `claude -p ${JSON.stringify(prompt)} < /dev/null`;
  const fullCmd = `${loginShell} -l -c ${JSON.stringify(claudeCmd)}`;

  logger.info(`Invoking claude via: ${loginShell} -l -c claude -p "<prompt>"`);
  logger.info(`Instruction: ${instruction}`);
  logger.info(`Platform: ${platformLabel}, Shell: ${osInfo.shell}`);

  const { stdout, stderr } = await execAsync(fullCmd, { timeout: 60_000 });

  if (stderr) {
    logger.warn(`claude stderr: ${stderr.trim()}`);
  }

  if (!stdout && stderr) {
    throw new Error(stderr.trim());
  }

  const result = stdout.trim();
  logger.info(`Generated command: ${result}`);
  return result;
}
