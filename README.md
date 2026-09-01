## V38

本版本把单词题的中文意思改为真实释义，并用于选择题和答题反馈。

# 生活英语 — Elder English

一个给中文母语、零基础老人使用的 **完全免费** 生活英语网页 App。

## 第一版功能
- 中文打字 → 英文翻译（浏览器本地模型）
- 中文麦克风语音输入（浏览器支持时）
- 英文大声朗读，可选慢速
- 日常主题推荐：蔬菜、肉类、打招呼、求救、月份、四季、看医生、购物、吃饭、坐车问路等
- 保存“我的英语”
- 一题一屏练习，答对绿色 / 答错红色
- 多种练习：单词意思、中文→英文、听单词、排列句子、听句子、填空、英文→中文等
- 答错显示正确答案和中文，并可“再练一次”
- 退出练习自动保存，下次继续
- 大 / 特大字体
- Backup / Restore JSON
- 可添加到 iPhone 主屏幕

## 费用
**$0/月。** 没有服务器、没有 OpenAI API、没有信用卡、没有订阅。

翻译使用 Transformers.js + `Xenova/opus-mt-zh-en`，直接在设备浏览器里运行。第一次真正翻译时需要联网下载量化模型文件，大约 100MB+；之后浏览器通常会缓存。翻译库本身从 jsDelivr CDN 加载，模型从 Hugging Face 加载。

麦克风使用浏览器 Web Speech API；网页托管后英文朗读使用 eSpeak-NG + Web Audio，不需要付费 API。直接打开 `index.html` 测试时会使用浏览器语音作为临时测试后备。

## 放到 GitHub Pages
这个版本不需要 npm、Vite 或 build：

1. 新建一个 GitHub repository。
2. 把这里所有文件上传到 repository 根目录。
3. GitHub → **Settings → Pages**。
4. `Build and deployment` 选 **Deploy from a branch**。
5. Branch 选 **main**，Folder 选 **/(root)**，Save。
6. GitHub 会给你一个 Pages 链接。

以后更新就是：**改 GitHub 文件 → commit → GitHub Pages 自动更新。**

## iPhone 像 App 一样使用
Safari 打开 GitHub Pages 链接 → 分享 → **添加到主屏幕**。

第一次使用麦克风时允许麦克风权限。第一次翻译会明显比之后慢，因为需要下载本地翻译模型。

## 数据与更新
学习记录保存在浏览器 localStorage。正常更新网页代码不会主动删除这些记录，但 iPhone/Safari 仍可能在某些情况下清理网站数据，所以建议定期：

**设置 → Backup 备份**

备份包含：
- 我的英语
- 中文/英文句子
- 练习进度
- 答对 / 答错记录
- 字体和语速设置

换手机或数据丢失后用 **Restore 恢复**。

## 测试（可选，开发者用）
如果电脑有 Node.js：

```bash
npm test
```


## V3 senior UI changes
- Action buttons use text only for Listen, Save, and Practice Again.
- Recommended topics keep category icons for visual recognition.
- Categories are available from the bottom navigation and from a large “更多分类” button.
- Sentences now show individual English words with simple Chinese meanings and explanations.
- Practice feedback also includes word-by-word learning.
- Backup/Restore remains phone-friendly through the browser file picker.


## V4 UI fixes
- Home title/logo now routes only to Home.
- Bottom navigation is text-only: 翻译 / 分类 / 我的英语 / 练习 / 设置.
- Practice keeps only ✓ / ✕ feedback symbols; other decorative action icons are removed.
- Recommended topics keep category icons.
- Home includes a large “更多学习内容” entry leading to 20+ everyday categories.


## V6 learning update
- Practice now mixes whole-sentence questions with simple word-meaning questions.
- Practice shows each word as a large tappable card; tapping a word plays its pronunciation and shows a simple Chinese explanation.
- Added beginner word explanations for pronouns and everyday words such as I/me/my, you/your, he/him/his, she/her, it/its, we/us/our, they/them/their, this/that, here/there, go/come, do/have/want/need, and am/is/are.
- Each category now has a larger learning library with 10+ items.

## V24 — eSpeak-NG speech

V24 replaces the unreliable iPhone/Safari `speechSynthesis` playback path with the eSpeak-NG browser engine + Web Audio playback. The practice answer starts the audio request while the answer tap is still active, and newer speech requests replace older ones.

The app is **local-first**: if `lib/espeak/espeakng.worker.js` is present, it uses that worker and its matching `espeakng.worker.data` file. If those two binary files are missing from the project, V24 temporarily falls back to the public eSpeak-NG jsDelivr distribution so the app can still be tested without a paid API.

For a fully self-contained/offline deployment, put these three matching files into `lib/espeak/`:

- `espeakng.min.js`
- `espeakng.worker.js`
- `espeakng.worker.data`

The `.data` file is binary and should not be opened directly.

### eSpeak-NG license

eSpeak-NG's browser distribution is GPLv3. See `lib/espeak/GPL-3.txt` and `THIRD-PARTY-NOTICES.md` before redistributing a version that contains the engine files.

## V27 speech test behavior

- Opening `index.html` directly with `file://` uses the browser's immediate speech engine only as a local test fallback. This avoids browser restrictions that can prevent eSpeak-NG Web Workers from running from a `file://` page.
- When hosted over HTTP/HTTPS (including GitHub Pages), eSpeak-NG is the primary English speech engine.
- The remote-worker fallback now rewrites the worker's `REMOTE_PACKAGE_BASE` to the matching jsDelivr `.data` URL instead of relying on a relative URL from a Blob worker.
- A local eSpeak worker is considered usable only when both `espeakng.worker.js` and `espeakng.worker.data` exist.


## V28 — Practice redesign

练习区已重新设计：不再显示旧的“看看每个单词 / 简单解释”大区块。单词练习只显示**英文单词 + 中文意思/题目**，然后进入不同类型的练习。

新增/保留的练习类型：
- 单词 → 选择中文意思
- 中文 → 选择英文单词
- 听单词 → 选择意思
- 排列句子 → 把单词拖到正确顺序；手机也支持拖动/点按
- 英文句子 → 选择中文意思
- 听完整句子 → 选择中文意思
- 句子填空 → 选择缺少的单词
- 中文句子 → 选择正确英文句子

每个保存的句子都会产生多种练习，而且选择题在只有少量保存内容时也会自动补充简单干扰项。
