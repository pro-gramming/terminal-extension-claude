import { exec } from 'child_process';
import { promisify } from 'util';
import { OsInfo } from './types';

const execAsync = promisify(exec);

const SYSTEM_PROMPT = `You are a shell command generator.
Given a natural language instruction and the user's OS/shell info, respond with ONLY the shell command — no explanation, no markdown, no code blocks.
If the task cannot be expressed as a single command, use pipes or && to chain commands on one line.`;

export async function generateCommand(instruction: string, osInfo: OsInfo): Promise<string> {
  const platformLabel = osInfo.platform === 'win32' ? 'Windows' : osInfo.platform === 'darwin' ? 'macOS' : 'Linux';
  const prompt = `${SYSTEM_PROMPT}\n\nOS: ${platformLabel}\nShell: ${osInfo.shell}\n\nInstruction: ${instruction}`;

  // Escape double quotes in the prompt for shell safety
  const escaped = prompt.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

  const { stdout, stderr } = await execAsync(`claude -p "${escaped}"`);

  if (stderr && !stdout) {
    throw new Error(stderr.trim());
  }

  return stdout.trim();
}
