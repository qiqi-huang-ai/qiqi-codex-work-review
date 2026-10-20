import {createHash} from 'node:crypto';
import {homedir} from 'node:os';
import {readFile, readdir, stat} from 'node:fs/promises';
import path from 'node:path';

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_MESSAGE_LENGTH = 5000;

export function assertDate(value) {
  if (!DAY_PATTERN.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
    throw new Error(`日期格式无效：${value}`);
  }
}

export function datesBetween(start, end) {
  assertDate(start);
  assertDate(end);
  const first = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  if (first > last) throw new Error('开始日期不能晚于结束日期');
  const result = [];
  for (let cursor = first; cursor <= last; cursor = new Date(cursor.getTime() + 86400000)) {
    result.push(cursor.toISOString().slice(0, 10));
  }
  if (result.length > 93) throw new Error('单次采集最多支持 93 天');
  return result;
}

function codexRoot() {
  return process.env.CODEX_HOME || path.join(homedir(), '.codex');
}

async function loadTitleIndex(root) {
  const indexPath = path.join(root, 'session_index.jsonl');
  try {
    const text = await readFile(indexPath, 'utf8');
    const map = new Map();
    for (const line of text.split('\n')) {
      if (!line.trim()) continue;
      try {
        const entry = JSON.parse(line);
        const previous = map.get(entry.id);
        if (!previous || String(entry.updated_at) >= String(previous.updated_at)) map.set(entry.id, entry);
      } catch {
        // A damaged index row should not make all source records unavailable.
      }
    }
    return map;
  } catch {
    return new Map();
  }
}

function textFromContent(content, limit = MAX_MESSAGE_LENGTH) {
  if (!Array.isArray(content)) return '';
  const text = content
    .filter((item) => item?.type === 'input_text' || item?.type === 'output_text')
    .map((item) => item.text || '')
    .join('\n')
    .trim();
  return limit ? text.slice(0, limit) : text;
}

function isInjectedContext(role, text) {
  if (role !== 'user') return false;
  return text.startsWith('# AGENTS.md instructions')
    || text.startsWith('<external_codex_apps_open_page>')
    || text.startsWith('<environment_context>');
}

function boundedMessages(messages) {
  if (messages.length <= 60) return messages;
  return [...messages.slice(0, 15), ...messages.slice(-45)];
}

function parseSession(text, sourcePath, titles) {
  let meta = null;
  const messages = [];
  const toolCallMap = new Map();
  const searchEntries = [];
  let firstTimestamp = null;
  let lastTimestamp = null;

  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    let item;
    try {
      item = JSON.parse(line);
    } catch {
      continue;
    }
    if (item.timestamp) {
      firstTimestamp ||= item.timestamp;
      lastTimestamp = item.timestamp;
    }
    if (item.type === 'session_meta') meta = item.payload;
    if (item.type !== 'response_item') continue;
    if (item.payload?.type === 'message' && ['user', 'assistant'].includes(item.payload.role)) {
      const fullContent = textFromContent(item.payload.content, 0);
      if (fullContent && !isInjectedContext(item.payload.role, fullContent)) {
        messages.push({role: item.payload.role, text: fullContent.slice(0, MAX_MESSAGE_LENGTH), timestamp: item.timestamp || null});
        searchEntries.push({role: item.payload.role, text: fullContent});
      }
    }
    if (['custom_tool_call', 'function_call'].includes(item.payload?.type)) {
      const name = item.payload.name || 'unknown';
      const current = toolCallMap.get(name) || {name, count: 0, firstTimestamp: item.timestamp || null, lastTimestamp: null};
      current.count += 1;
      current.lastTimestamp = item.timestamp || current.lastTimestamp;
      toolCallMap.set(name, current);
    }
  }

  const id = meta?.session_id || meta?.id || path.basename(sourcePath, '.jsonl');
  const titleEntry = titles.get(id);
  const session = {
    id,
    title: titleEntry?.thread_name || '未命名 Codex 会话',
    cwd: meta?.cwd || null,
    firstTimestamp,
    lastTimestamp,
    messages: boundedMessages(messages),
    toolCalls: [...toolCallMap.values()],
    sourceRef: path.basename(sourcePath),
    sourceHash: createHash('sha256').update(text).digest('hex').slice(0, 16),
  };
  Object.defineProperty(session, 'searchEntries', {value: searchEntries, enumerable: false});
  return session;
}

async function filesForDate(root, date) {
  const [year, month, day] = date.split('-');
  const directory = path.join(root, 'sessions', year, month, day);
  try {
    return (await readdir(directory))
      .filter((name) => name.endsWith('.jsonl'))
      .map((name) => path.join(directory, name));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

export async function inspectCodexSource() {
  const root = codexRoot();
  const sessions = path.join(root, 'sessions');
  const index = path.join(root, 'session_index.jsonl');
  const result = {root, sessionsReadable: false, indexReadable: false};
  try {
    result.sessionsReadable = (await stat(sessions)).isDirectory();
  } catch {}
  try {
    result.indexReadable = (await stat(index)).isFile();
  } catch {}
  return result;
}

export async function collectCodexRange(start, end) {
  const root = codexRoot();
  const dates = datesBetween(start, end);
  const titles = await loadTitleIndex(root);
  const coverage = [];
  const sessions = [];

  for (const date of dates) {
    let files;
    try {
      files = await filesForDate(root, date);
      coverage.push({date, status: files.length ? '已读取' : '无匹配记录', fileCount: files.length});
    } catch (error) {
      coverage.push({date, status: '不可用', fileCount: 0, reason: error.message});
      continue;
    }
    for (const file of files) {
      try {
        const text = await readFile(file, 'utf8');
        const session = parseSession(text, file, titles);
        if (session.messages.length || session.toolCalls.length) sessions.push(session);
      } catch (error) {
        coverage.push({date, status: '部分可用', fileCount: files.length, reason: `有文件读取失败：${error.message}`});
      }
    }
  }

  return {
    source: 'Codex 本地会话',
    sourceMode: 'read-only',
    collectedAt: new Date().toISOString(),
    range: {start, end},
    coverage,
    sessions,
    limitations: [
      '会话所在日期用于确定采集范围，不把文件修改时间当作工作发生时间。',
      '助手自称完成和工具调用只构成线索，不自动代表验收完成。',
      '当前采集不等于全部个人工作历史。',
      '单个超长会话保留开头 15 条与末尾 45 条有效消息，中段需回到原始会话复核。',
    ],
  };
}
