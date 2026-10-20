# Codex Review Workbench

一个只面向 Codex 的本地工作复盘台。它读取本机 Codex 对话，让你按任意时间段和关键词筛选记录，再由 Codex 生成一份时间段复盘。

数据默认不上传到第三方服务；只有你点击“生成复盘”时，应用才会调用已经登录的 Codex CLI。

## 安装为 Codex Skill

```bash
npx skills add qiqi-huang-ai/codex-work-review -g -y
```

安装后对 Codex 说：

> 打开 Codex 工作复盘台

Codex 会运行 Skill 自带的启动脚本并打开本地工作台。安装包不包含作者的对话、复盘或其他私人数据。

## 能做什么

- 只读浏览指定日期范围的 Codex 对话；
- 手动选择纳入复盘的对话；
- 使用内置、可审查的原创复盘规则；
- 通过临时、只读沙箱中的 Codex 生成复盘；
- 保存多次 AI 版本，并把用户修正独立保存；
- 将真实本地数据与脱敏演示数据分开。

## 要求

- Node.js 20 或更高版本；
- 已安装并登录 Codex CLI，或 macOS 上已安装 ChatGPT/Codex 桌面应用；
- 本机存在 Codex 会话记录（默认读取 `~/.codex`）。

## 从源码启动

```bash
git clone https://github.com/qiqi-huang-ai/codex-work-review.git
cd codex-review-workbench
npm start
```

打开 <http://127.0.0.1:4317>。也可以直接在当前源码目录运行 `npm start`。应用仅监听本机回环地址。

## 使用

1. 在“复盘工作台”选择日期范围。关键词留空时读取范围内全部对话。
2. 需要缩小范围时，输入关键词搜索完整对话正文。
3. 选择“使用全部匹配结果”，或者取消勾选无关对话后选择“仅使用已勾选对话”。
4. 补充原计划、验收标准等资料后手动生成这个时间段的复盘。
5. 结果会保存在本地；在详情中保存的个人修正不会被重新生成覆盖。

生成使用 `codex exec --ephemeral --sandbox read-only`。该分析会话不会写入 Codex 历史，也不能修改项目文件。

## 配置

| 环境变量 | 用途 | 默认值 |
| --- | --- | --- |
| `PORT` | 本地服务端口 | `4317` |
| `CODEX_HOME` | Codex 数据目录 | `~/.codex` |
| `CODEX_BIN` | Codex CLI 可执行文件 | macOS 应用内 CLI，找不到时使用 `codex` |
| `REVIEW_RULES_PATH` | 自定义复盘规则文件 | `rules/review-rules.md` |
| `REVIEW_DATA_HOME` | 派生数据目录 | Skill 启动时为 `~/.codex-review-workbench/data` |

## 本地数据

通过 Skill 启动时，应用只会向 `~/.codex-review-workbench/data/` 写入派生数据；从源码运行 `npm start` 时使用项目内的 `data/`：

- `sources/codex/`：采集批次元数据；
- `normalized/`：用于复盘的完整证据包；
- `reviews/`：Codex 生成的复盘版本；
- `corrections/`：用户个人修正；
- `rules/`：每次生成所用规则的版本信息；
- `logs/`：本地操作日志；
- `demo/`：可提交的脱敏演示数据。

真实数据目录已由 `.gitignore` 排除。备份时复制实际数据目录；恢复时停止应用后复制回原位置。应用不会修改 `~/.codex` 中的原始会话。

## 验证

```bash
npm run check
```

项目采用 [MIT License](LICENSE)。安全与隐私问题请参阅 [SECURITY.md](SECURITY.md)。
