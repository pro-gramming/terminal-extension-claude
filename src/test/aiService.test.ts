import * as assert from 'assert';
import { buildPrompt, buildTerminalContext, parseClaudeOutput } from '../promptUtils';
import { OsInfo, TerminalExecution } from '../types';

const macOsInfo: OsInfo = { platform: 'darwin', shell: '/bin/zsh', loginShell: '/bin/zsh' };
const linuxOsInfo: OsInfo = { platform: 'linux', shell: '/bin/bash', loginShell: '/bin/bash' };

describe('buildTerminalContext', () => {
  it('returns empty string when no executions and no cwd', () => {
    assert.strictEqual(buildTerminalContext([], undefined), '');
  });

  it('includes cwd when provided', () => {
    assert.ok(buildTerminalContext([], '/home/user').includes('/home/user'));
  });

  it('includes command in output', () => {
    const execs: TerminalExecution[] = [{ command: 'git status', output: 'nothing to commit' }];
    const result = buildTerminalContext(execs, undefined);
    assert.ok(result.includes('git status'));
    assert.ok(result.includes('nothing to commit'));
  });

  it('truncates output at 500 chars', () => {
    const longOutput = 'x'.repeat(600);
    const execs: TerminalExecution[] = [{ command: 'cmd', output: longOutput }];
    const result = buildTerminalContext(execs, undefined);
    assert.ok(!result.includes('x'.repeat(501)));
  });

  it('includes cwd and commands together', () => {
    const execs: TerminalExecution[] = [{ command: 'ls', output: 'file.txt' }];
    const result = buildTerminalContext(execs, '/project');
    assert.ok(result.includes('/project'));
    assert.ok(result.includes('ls'));
  });
});

describe('buildPrompt', () => {
  it('places the instruction after the delimiter', () => {
    const result = buildPrompt('list files', macOsInfo, 'SYS');
    assert.ok(result.indexOf('---') < result.indexOf('list files'));
  });

  it('labels macOS correctly', () => {
    assert.ok(buildPrompt('test', macOsInfo, 'SYS').includes('macOS'));
  });

  it('labels Linux correctly', () => {
    assert.ok(buildPrompt('test', linuxOsInfo, 'SYS').includes('Linux'));
  });

  it('includes the shell path', () => {
    assert.ok(buildPrompt('test', macOsInfo, 'SYS').includes('/bin/zsh'));
  });

  it('uses the provided system prompt', () => {
    assert.ok(buildPrompt('test', macOsInfo, 'CUSTOM_SYS').startsWith('CUSTOM_SYS'));
  });

  it('includes terminal context when provided', () => {
    const result = buildPrompt('list files', macOsInfo, 'SYS', 'Current directory: /home/user');
    assert.ok(result.includes('Current directory: /home/user'));
    assert.ok(result.indexOf('TERMINAL CONTEXT') < result.indexOf('USER INSTRUCTION'));
  });

  it('omits terminal context section when not provided', () => {
    const result = buildPrompt('list files', macOsInfo, 'SYS');
    assert.ok(!result.includes('TERMINAL CONTEXT'));
  });
});

describe('parseClaudeOutput', () => {
  it('returns the first non-empty line', () => {
    const { command } = parseClaudeOutput('ls -la\nsome extra line', '');
    assert.strictEqual(command, 'ls -la');
  });

  it('trims whitespace from the result', () => {
    const { command } = parseClaudeOutput('  ls -la  \n', '');
    assert.strictEqual(command, 'ls -la');
  });

  it('sets truncated=true when multiple non-continuation lines are returned', () => {
    const { truncated } = parseClaudeOutput('ls -la\necho done', '');
    assert.strictEqual(truncated, true);
  });

  it('sets truncated=false for single-line output', () => {
    const { truncated } = parseClaudeOutput('ls -la', '');
    assert.strictEqual(truncated, false);
  });

  it('throws when stdout is empty and stderr has content', () => {
    assert.throws(() => parseClaudeOutput('', 'command not found'), /command not found/);
  });

  it('throws when output has no non-empty lines', () => {
    assert.throws(() => parseClaudeOutput('   \n  \n', ''), /empty response/);
  });

  it('skips leading blank lines', () => {
    const { command } = parseClaudeOutput('\n\nls -la', '');
    assert.strictEqual(command, 'ls -la');
  });

  it('returns full backslash continuation block', () => {
    const input = 'git add -A \\\ngit commit -m "init"';
    const { command, truncated } = parseClaudeOutput(input, '');
    assert.strictEqual(command, 'git add -A \\\ngit commit -m "init"');
    assert.strictEqual(truncated, false);
  });

  it('returns full three-line continuation block', () => {
    const input = 'curl \\\n  -X POST \\\n  https://example.com';
    const { command, truncated } = parseClaudeOutput(input, '');
    assert.strictEqual(command, 'curl \\\n-X POST \\\nhttps://example.com');
    assert.strictEqual(truncated, false);
  });

  it('treats double-backslash at end of line as non-continuation', () => {
    const input = 'echo hello\\\\\necho world';
    const { command, truncated } = parseClaudeOutput(input, '');
    assert.strictEqual(command, 'echo hello\\\\');
    assert.strictEqual(truncated, true);
  });

  it('returns heredoc as multi-line command', () => {
    const input = "cat > file.txt << 'EOF'\nline1\nline2\nEOF";
    const { command, truncated } = parseClaudeOutput(input, '');
    assert.ok(command.includes('line1'));
    assert.ok(command.includes('line2'));
    assert.ok(command.includes('EOF'));
    assert.strictEqual(truncated, false);
  });

  it('returns heredoc without quotes as multi-line command', () => {
    const input = 'cat > file.txt << EOF\nhello world\nEOF';
    const { command, truncated } = parseClaudeOutput(input, '');
    assert.ok(command.includes('hello world'));
    assert.strictEqual(truncated, false);
  });
});
