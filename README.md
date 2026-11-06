# agent_script_video_make

由 AI 编写脚本、HyperFrames 合成的视频制作公共框架。各系列、各部片在此之上做自己的视觉方案与内容。

## 目录

```
agent_script_video_make/
├─ spec/        框架指导文档：制作 CheckList、创作原则、风格规范、工程约定、技术选型
├─ projects/    视频项目（入库），各自管理文档与代码；单片一级、系列两级
├─ shared/      跨片复用：fonts/ 字体、vendor/ 第三方库、py/ Python 公共模块（文本表与音效、Manim 适配、空间校验、循环音乐）、js/ 校验骨架与 Three.js 通用小工具
├─ tools/       new-project.cmd / .sh（新建项目）、link-shared.cmd（建 assets/shared 联接）、manim.cmd（Manim 启动）
├─ .kiro/skills/  与 HyperFrames 同版本的 agent skills
├─ Temp/        临时文件：草稿、日志、中间态（不入库）
├─ package.json / package-lock.json        锁定 HyperFrames
└─ pyproject.toml / uv.lock / .python-version  锁定 Python 与 Manim
```

- 不入库：`Temp/`、渲染与生成产物（`renders/`、`assets/gen/`、脚本生成的音轨）、`node_modules/`、`.venv/`
- 所有临时操作放 `Temp/`，不用系统临时目录
- Git LFS：字体、音视频、位图素材
- 系列专用的配色、字体、目录约定写在该系列自己的规范里，不改本框架的通用文档

## 文档

做片前先读：

- [工程约定](spec/工程约定.md)：目录、临时文件、工具调用、已验证做法、已知问题、文本与多语言
- [GateFlow 与 SignOff 记录模板](spec/视频制作GateFlow与SignOff记录模板.md)：每部片复制为 `GATES.md`，逐 Gate 达成、签字
- [制作 CheckList](spec/制作CheckList.md)：各阶段打分细则、画面口述
- [创作原则](spec/创作原则.md)：讲述、画面、文字、声音，剧情片与科普片各自的方向
- [风格规范](spec/风格规范.md)：对比度、字号、线宽、版式、动效、阅读时长、响度的通用数值底线
- [技术选型](spec/技术选型.md)：各层工具、音效来源、画质与输出规格
- 做 projects 下某个项目/系列时加读该 project 自己的相关文档

## 环境基线

目标：在同级 GPU、同软件版本下复现出片。

| 项 | 基线 | 锁定方式 |
|---|---|---|
| 系统 | Windows 11 x64 | 记录 |
| GPU | 桌面独显，D3D12 下可创建 WebGPU 硬件 device（非回退 adapter）；参考档位 NVIDIA Ada（RTX 40 系），驱动 621.01 | 记录 |
| Node.js | 22.x | 记录 |
| HyperFrames | 0.9.19；agent skills 取同版本 tag | `package-lock.json`、`.kiro/skills/` |
| GSAP | 3.14.2，本地文件，不走 CDN | `package-lock.json`、`shared/vendor/gsap/` |
| KaTeX / Three.js | 0.19.1 / 0.186.1，本地文件 | `package-lock.json`、`shared/vendor/katex/`、`shared/vendor/three/` |
| 渲染浏览器 | chrome-headless-shell 152.0.7977.30（版本写死在 HyperFrames 内，系统 Chrome 不参与出片） | `npx hyperframes browser ensure` |
| FFmpeg | 9.0.2（gyan.dev full build） | 记录 |
| Python / Manim CE | 3.12 / 0.22.1；包镜像见 `pyproject.toml` | `uv.lock` |
| LaTeX | MiKTeX 25.12（xelatex + ctex，缺包自动安装） | 记录 |

复现等级：

- 同 GPU 架构 + 同驱动 + 同软件版本：期望逐帧一致（实测：WebGPU 合成同机渲染两次，MP4 字节一致）
- 跨 GPU 或驱动：只保证视觉一致，光栅化与 WebGPU 输出可能有像素级差异
- 升级任一「记录」项须同步改本表；Docker / Lambda 无 GPU，不用于含 WebGPU 的镜头

## 环境复现

1. 安装系统级工具：Node.js 22、FFmpeg（`winget install --id Gyan.FFmpeg -e`）、MiKTeX（开启缺包自动安装）、uv
2. 在本目录执行：
   - `npm ci`
   - `npx hyperframes browser ensure`：下载 HyperFrames 指定版本的 headless shell
   - `uv sync`
   - 每个 HyperFrames 项目执行一次 `tools\link-shared.cmd <项目目录>`：在 `<项目>/assets/shared` 建目录联接指向 `shared/`（联接不入库）
   - `npx hyperframes telemetry disable`
3. 自检：`npx hyperframes doctor`（Docker 一项可忽略）

## 约定、已知问题与升级

见[工程约定](spec/工程约定.md)。
