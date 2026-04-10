import { exec } from 'child_process';
import { promisify } from 'util';
import * as vscode from 'vscode';
import { OsInfo } from './types';
import { logger } from './logger';
import { buildPrompt, parseClaudeOutput } from './promptUtils';

const execAsync = promisify(exec);

const DEFAULT_SYSTEM_PROMPT =
  `You are a shell command generator. ` +
  `Given a natural language instruction and the user's OS/shell info, respond with ONLY the shell command — ` +
  `no explanation, no markdown, no code blocks. ` +
  `If the task cannot be expressed as a single command, use pipes or && to chain commands on one line.`;

export async function generateCommand(
  instruction: string,
  osInfo: OsInfo,
  abortSignal?: AbortSignal,
): Promise<string> {
  if (osInfo.platform === 'win32') {
    throw new Error('Windows is not currently supported. Please use WSL or a POSIX shell.');
  }

  const config = vscode.workspace.getConfiguration('terminalAI');
  const systemPrompt = config.get<string>('systemPrompt') || DEFAULT_SYSTEM_PROMPT;
  const claudeBin   = config.get<string>('claudePath') || 'claude';
  const timeoutMs   = (config.get<number>('timeoutSeconds') ?? 30) * 1000;

  const prompt = buildPrompt(instruction, osInfo, systemPrompt);
  const claudeCmd = `${claudeBin} -p ${JSON.stringify(prompt)} < /dev/null`;
  const fullCmd = `${osInfo.loginShell} -l -c ${JSON.stringify(claudeCmd)}`;

  logger.info(`Invoking: ${osInfo.loginShell} -l -c ${claudeBin} -p "<prompt>"`);
  logger.info(`Instruction (${instruction.length} chars)`);

  const { stdout, stderr } = await execAsync(fullCmd, {
    timeout: timeoutMs,
    maxBuffer: 1024 * 512,
    signal: abortSignal,
  });

  if (stderr) {
    logger.warn(`claude stderr: ${stderr.trim()}`);
  }

  const { command, truncated } = parseClaudeOutput(stdout, stderr);

  if (truncated) {
    logger.warn('Claude returned multiple lines; only the first line was used to prevent unintended execution.');
  }

  logger.info(`Generated command (${command.length} chars): ${command.slice(0, 80)}${command.length > 80 ? '…' : ''}`);
  return command;
}
