# コンテンツカレンダー — Week 1〜4（英語メイン）

投稿頻度: 1〜2投稿/日
言語比率: 英語85% / 日本語15%（週1〜2本）
自動化: Make + Buffer + Claude API

---

## Week 1: 共感フェーズ（"You know this feeling"）

| 日 | 言語 | 本文 |
|---|---|---|
| Day 1 | EN | You vibed coded an app. It works. You're proud. Then you try to change one button label. 40 minutes later you've opened 12 files and still don't know where to look. |
| Day 2 | EN | "The AI fixed it. I have no idea why it works now." This is the vibe coding wall. Not a skill issue. A missing step. |
| Day 3 | EN | 3 reasons your vibe-coded app feels untouchable: 1. Too many files, no idea which one 2. Fear of breaking something you don't understand 3. No sense of progress All three are solvable. |
| Day 4 | JP | Cursorで作ったアプリ、ボタンのテキスト変えたいだけなのにどのファイルか分からない問題、全世界共通らしい |
| Day 5 | EN | Building a tool to help vibe coders understand their own code. Not rewrite it. Not explain all of it. Just: "here's exactly which file controls that feature and why." |
| Day 6 | EN | "I used v0/Lovable/Cursor and shipped an app. But I can't touch a single line of it." That's not embarrassing. That's a gap between 'build' and 'understand'. You just need the bridge. |
| Day 7 | EN | Week 1 in #buildinpublic: Started posting about the vibe coding wall. Turns out a lot of people hit it. Building something about it. More soon. |

---

## Week 2: 教育フェーズ（Tips that actually help）

| 日 | 言語 | 本文 |
|---|---|---|
| Day 8 | EN | How to read AI-generated React code (without reading all of it): 1. Find `page.tsx` or `App.tsx` — that's your entry 2. Look for `onClick` / `onSubmit` — that's where features start 3. Follow the function. Stop when you know what changes. You don't need to understand everything. |
| Day 9 | EN | Tip: when you want to change a button's behavior, search for `onClick` in that component first. 80% of the time, the answer is in the same file. The other 20% is one import away. |
| Day 10 | EN | Before: "This file looks important. I think. Maybe." After: "The add button lives in AddTaskForm.tsx line 18. If I want to disable it, I change this one prop." That shift is learnable. |
| Day 11 | JP | React初心者がAI生成コードで最初に読むべきファイル順。① page.tsx（入口）② components/配下（UI）③ hooks/（状態）この順だけで80%読める |
| Day 12 | EN | "My AI fix broke something else across the codebase" The root cause: you didn't know which files were connected. Before you change anything, map the blast radius. Which files call this function? That 5-minute check saves hours. |
| Day 13 | EN | If you want to add validation to a form, look for: 1. The form component (`Form.tsx` or similar) 2. The `disabled` prop on the submit button 3. The `onSubmit` handler These three spots cover 90% of validation changes in React. |
| Day 14 | EN | Wrote something: "How to read AI-generated code you didn't write" → [dev.to link] If you've ever vibed coded and felt lost in your own app, this is for you. |

---

## Week 3: デモフェーズ（Show the product）

※ アプリのスクリーンショット / GIF が必要

| 日 | 言語 | 本文 |
|---|---|---|
| Day 15 | EN | Here's redoCebiv in action. Upload your ZIP → pick a feature → see exactly which files are involved and why. [スクショ添付] |
| Day 16 | EN | "I want to disable the submit button when the input is empty" — type that into redoCebiv. It tells you: which file, which line, why that's the right place, and how hard it is. [スクショ] |
| Day 17 | EN | The growth tracker in redoCebiv: not points or streaks. Just three questions: Can you read the code? Can you predict where to change it? Can you actually change it? Real progress, not gamification. [スクショ] |
| Day 18 | JP | redoCebivのデモ。ZIPを投げると → 機能一覧が出る → どのファイルが動かしてるか分かる → 軽い課題が出る。「触れないコード」が少しずつ自分のコードになっていく感じ [スクショ] |
| Day 19 | EN | How redoCebiv differs from just asking Cursor/Claude: Cursor: "Fix this for me" → done, still don't understand redoCebiv: "Show me how this feature works" → now I understand it Tools for building. Tools for understanding. Both matter. |
| Day 20 | EN | 5-step walkthrough of redoCebiv: 1/ Upload your ZIP 2/ Pick a feature (e.g. "add task") 3/ See the related files and flow 4/ Try a mini challenge 5/ Track your understanding [スクショ each step] |
| Day 21 | EN | β waitlist is open. If you've built something with Cursor/v0/Lovable and want to actually understand it — this is for you. [URL] |

---

## Week 4: コミュニティ・転換フェーズ

| 日 | 言語 | 本文 |
|---|---|---|
| Day 22 | EN | "I don't want to learn programming. I just want to be able to fix my own app." This is the most common thing vibe coders tell me. redoCebiv is built for exactly this. β → [URL] |
| Day 23 | EN | Quick Next.js tip for vibe coders: `app/` folder breakdown: `page.tsx` = the screen `layout.tsx` = the wrapper `loading.tsx` = what shows while loading `error.tsx` = what shows on error Just these 4. That's your map. |
| Day 24 | EN | What's the hardest part of reading your vibe-coded app? (Building redoCebiv to solve whatever you say) |
| Day 25 | EN | New post: "The vibe coding wall — and how to break through it" → [dev.to link] |
| Day 26 | EN | #buildinpublic update: [N] people on the β waitlist. Working on: [feature in progress] Next milestone: [date/goal] Thanks for following along. |
| Day 27 | JP | 「プログラミングを学びたいんじゃない、自分のアプリを直したいだけ」— これを言ってくれた人が一番多かった。それに答えるものを作っています。 |
| Day 28 | EN | Month 1 wrap: [N] followers, [N] β signups. Top post: [quote] Month 2 goal: ship β. See you there. |

---

## スプレッドシートのテーマ文字列（B列）

Make → Claude API に渡す文字列。これをB列に入力する。

### 英語テーマ

| テーマ名 | B列入力文字列 |
|---|---|
| 共感（ファイル迷子） | EN empathy tweet: vibe coder opened 12 files just to change a button label |
| 共感（なぜ動くか） | EN empathy tweet: AI fixed the bug, no idea why it works now, vibe coding wall |
| 問題提起（3理由） | EN problem tweet: 3 reasons vibe-coded app feels untouchable, all solvable |
| buildinpublic進捗 | EN buildinpublic update: week progress, what I'm building, brief and honest |
| Tip（コードの読み方） | EN tip tweet: how to read AI-generated React code without reading all of it |
| Tip（onClick追跡） | EN tip tweet: find onClick first, 80% of button behavior is in the same file |
| Tip（Next.jsフォルダ） | EN tip tweet: Next.js app folder explained for vibe coders in 4 lines |
| ビフォーアフター | EN before/after tweet: knowing which file to touch vs being lost in 20 files |
| デモ紹介 | EN demo tweet: redoCebiv upload ZIP pick feature see which files and why |
| β登録CTA | EN beta CTA tweet: built for vibe coders who want to understand their own code |
| 質問投稿 | EN question tweet: what's the hardest part of reading your AI-generated code |

### 日本語テーマ（JP:プレフィックスで識別）

| テーマ名 | B列入力文字列 |
|---|---|
| 共感（ファイル迷子） | JP 共感ツイート: Cursorで作ったがボタンのテキスト変えるのにどのファイルか分からない |
| Tip（読み方） | JP Tipツイート: React初心者がAI生成コードで最初に読むべきファイル順 |
| デモ紹介 | JP デモツイート: redoCebivのZIPアップロード→機能選択→関連ファイル表示の流れ |
| 感情ツイート | JP 感情ツイート: プログラミングを学びたいんじゃなく自分のアプリを直したいだけという声 |
