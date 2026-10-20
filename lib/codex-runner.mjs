import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {existsSync} from 'node:fs';
import {readFile, unlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {PROJECT_ROOT} from './store.mjs';

const MAC_APP_CODEX = '/Applications/ChatGPT.app/Contents/Resources/codex-cli/CodexCLI.app/Contents/MacOS/codex';
const CODEX_BIN = process.env.CODEX_BIN || (existsSync(MAC_APP_CODEX) ? MAC_APP_CODEX : 'codex');

function runProcess(args, input = '', timeoutMs = 15 * 60 * 1000) {
  return new Promise((resolve, reject) => {
    const child = spawn(CODEX_BIN, args, {
      cwd: PROJECT_ROOT,
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error('Codex 生成超过 15 分钟，已停止本次运行'));
    }, timeoutMs);
    child.stdout.on('data', (chunk) => { stdout = `${stdout}${chunk}`.slice(-200_000); });
    child.stderr.on('data', (chunk) => { stderr = `${stderr}${chunk}`.slice(-20_000); });
    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve({stdout, stderr});
      else reject(new Error(`Codex 调用失败（${code}）：${stderr.trim().slice(-1200) || '没有错误详情'}`));
    });
    child.stdin.end(input);
  });
}

export async function inspectCodexCli() {
  try {
    const [{stdout: version}, {stdout: loginOut, stderr: loginErr}] = await Promise.all([
      runProcess(['--version'], '', 10_000),
      runProcess(['login', 'status'], '', 10_000),
    ]);
    return {status: '已接通', path: CODEX_BIN, version: version.trim(), authentication: (loginOut || loginErr).trim()};
  } catch (error) {
    return {status: '不可用', path: CODEX_BIN, error: error.message};
  }
}

export async function runCodexReview(prompt) {
  const outputPath = path.join(tmpdir(), `codex-work-review-${randomUUID()}.md`);
  const startedAt = Date.now();
  try {
    await runProcess([
      'exec',
      '--ephemeral',
      '--sandbox', 'read-only',
      '--skip-git-repo-check',
      '--color', 'never',
      '--cd', PROJECT_ROOT,
      '--output-last-message', outputPath,
      '-',
    ], prompt);
    const content = (await readFile(outputPath, 'utf8')).trim();
    if (!content) throw new Error('Codex 没有返回复盘正文');
    return {content, durationMs: Date.now() - startedAt};
  } finally {
    await unlink(outputPath).catch(() => {});
  }
}
