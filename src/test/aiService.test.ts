import * as assert from 'assert';
import { buildPrompt, parseClaudeOutput } from '../promptUtils';
import { OsInfo } from '../types';

const macOsInfo: OsInfo = { platform: 'darwin', shell: '/bin/zsh', loginShell: '/bin/zsh' };
const linuxOsInfo: OsInfo = { platform: 'linux', shell: '/bin/bash', loginShell: '/bin/bash' };

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

  it('sets truncated=true when multiple lines are returned', () => {
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
});
