# Info 文案 TXT 放置说明

请将以下 6 个 TXT 文件（UTF-8，无 BOM）放到本目录下的 `zh-TW` 子目录内：

- about.txt（關於我們 / 公司簡介）
- terms.txt（使用條款）
- privacy.txt（隱私條款）
- security.txt（交易/約會安全）
- help.txt（幫助中心）
- contact.txt（聯絡我們）

要求与约定：
- 繁体原文：请直接提供繁体（臺灣/香港/澳門皆可）版本作为來源稿。
- 段落分隔：使用空行（兩個換行）分段；單行換行將自動合併為同一段落內的空格。
- 文件编码：UTF-8。

构建流程：
- 运行 `npm run build:info -w apps/web` 会：
  1) 读取 `content/zh-TW/*.txt`（繁体原文）。
  2) 以 OpenCC 將繁體自動轉為簡體，寫入 `src/locales/zh-CN.json`。
  3) 直寫繁體到 `src/locales/zh-TW.json`。
  4) 若設置了翻譯 API Key（如 `DEEPL_API_KEY`），自動機翻並填充 `en/ja/ko` 的 `info.sections.*.content`；否則保留現有內容，不覆蓋。

可選翻譯提供者（需要自行配置環境變量）：
- DeepL API: 設置 `DEEPL_API_KEY` 即可啟用。

注意：
- 腳本僅覆蓋 `info.sections.{about|terms|privacy|security|help|contact}.content`，`title` 與其他鍵不動。
- 若某 TXT 缺失，將跳過對應章節，不報錯。
