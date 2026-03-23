# コンテンツカレンダー — スレッド・単発ポスト・投稿スケジュール

投稿頻度: 1〜2投稿/日
言語比率: 英語70% / 日本語30%
自動化: Make + Buffer + Claude API

---

# PART 1: スレッド

---

## スレッド① 【マニフェスト・固定ツイート用】

```
1/
AIでiOSアプリを4つ出した。Cursor、v0、Claudeを使って。全部App Storeに並んでる。

でもある日気づいた。自分のアプリのコードが、自分のものじゃない。

機能を追加しようとファイルを開いた。何がどこにあるのかわからなかった。
```

```
2/
ChatGPTに聞いた。「このプロジェクトの構造を教えて」
でも、何を聞けばいいかがわからない。

Cursorに聞いた。「この機能はどこにある？」
でも、「この機能」が何かを言語化できない。

問題は「AIが賢くない」ことじゃなかった。
「自分が何を知らないか」がわからないことだった。
```

```
3/
だからredoCebivを作った。
（vibeCoder を逆さから読んでみて）

ZIPをアップロードする。
AIが「このアプリにはこういう機能がある」と一覧で出す。
機能を選ぶと、関連ファイルと処理の流れが表示される。

質問を考える必要がない。最初の一歩を、ツールが用意する。
```

```
4/
CursorもClaude Codeも「質問すれば答えてくれる」。
でもバイブコーダーの本当の壁は「質問が作れない」こと。

redoCebivは、その壁を壊すために作った。
機能から入って、コードを理解する。ファイルツリーの考古学はもう終わり。
```

```
5/
バイブコーディングの次のステップは「もっと速く作る」じゃない。
「作ったものを、自分のものにする」。

ベータ準備中。ウェイトリスト受付中。
quiet-tools.jp/redoCebiv

#VibeCoding #バイブコーディング #buildinpublic
```

---

## スレッド② 【競合分析・知見共有】

Zenn/Dev.to記事の公開日に投稿し、最後のツイートに記事リンクを貼る。

```
1/
バイブコーダーが「自分のコードがわからない」とき、使える選択肢を全部調べた。

結論：「何を聞けばいいかわからない人」向けのツールは、まだ存在しない。

以下、カテゴリ別に整理する。
```

```
2/
【プロ向けツール】
・Sourcegraph Cody — リポジトリ全体をAIが理解。強力。ただしIDE統合+セットアップ必須。エンタープライズ向け
・Greptile — $180M評価。コードグラフ構築+PRレビュー。GitHub連携前提
・Swimm — コードドキュメントの自動同期。チームのオンボーディング用

共通点：全部「プロ開発者」「チーム」が前提。バイブコーダーが使うにはハードルが高すぎる。
```

```
3/
【身近な代替手段】
・Denigma — コードを貼ると平易な英語で説明してくれる。ただしスニペット単位
・ChatGPT/Claudeに「説明して」— 最も手軽。ただしファイル単位。プロジェクト全体は無理
・CodeVisualizer（VS Code拡張）— フローチャート生成。ただしVS Code必須

共通の限界：全部「どのファイルを見るか」を自分で選ぶ前提。バイブコーダーはそこが一番わからない。
```

```
4/
【最大の潜在脅威】
・Cursorの内蔵理解機能 — すでにプロジェクト構造を把握してる。質問すれば答える
・Claude Code — プロジェクトを読ませて説明させられる

ただし両方「質問ドリブン」。何を聞くかは自分で考える。
「機能一覧を自動抽出→逆引き」はどちらもやってない。
```

```
5/
まとめると：

「コードを理解する」ツールは大量にある。
「何を聞けばいいかわからない人のための、最初の一歩」を提供するツールはゼロ。

redoCebivはここに立つ。
ZIPを送る→機能一覧が出る→選ぶと中身がわかる。

quiet-tools.jp/redoCebiv

#VibeCoding #バイブコーディング #buildinpublic
```

---

# PART 2: 単発ポスト（日替わり用・10本）

2週間分のストック。

---

### ポスト①（共感・体験）
```
バイブコーディング、最初の1週間：「俺、天才かもしれない」
2週間後にバグ修正：「……どのファイルを開けばいいんだ」

この落差が、redoCebivを作った原点。
#バイブコーディング
```

### ポスト②（競合との差を端的に）
```
ChatGPTに「このプロジェクト説明して」→「Next.jsのアプリです」（知ってる）

redoCebivに同じZIPを渡す→「7つの機能があります。①ログイン ②タスク追加 ③通知設定…」

違いは「質問が要らない」こと。
```

### ポスト③（Karpathyの文脈に乗る）
```
Karpathyが2026年に提唱した「agentic engineering」。
バイブコーディングの次は「品質を妥協しないAI活用」。

でも品質を担保するには、まず自分のコードを理解する必要がある。
その最初の一歩が、redoCebiv。
#VibeCoding
```

### ポスト④（データ引用・権威）
```
CodeRabbitの分析：AI生成コードは人間のコードの1.7倍の問題を含む。
Veracodeの調査：AI生成コードの45%にセキュリティ脆弱性。

修正するにも、まず「何がどこにあるか」がわからないと始まらない。
redoCebivは「まず全体を見渡す」ためのツール。
```

### ポスト⑤（Build in Public）
```
redoCebiv開発メモ：
Swiftプロジェクトの機能抽出精度を上げてる。
ViewControllerに処理が密集してると、機能の境界が見つけにくい。

これ、まさにバイブコーダーが直面する「なぜここにこのコードがあるの」問題。
#buildinpublic
```

### ポスト⑥（O'Reilly本の文脈）
```
O'Reilly Japan『バイブコーディングを超えて』第5章：
「生成されたコードを理解する：レビュー、改良、所有」

この章が手動プロセスとして書いていることを、ツールで自動化した。
それがredoCebiv。
```

### ポスト⑦（問いかけ型・エンゲージメント）
```
バイブコーダーに聞きたい。

AIで作ったアプリ、最初のバグ修正のとき何した？
① Cursorに「直して」と丸投げ
② ChatGPTにエラー貼り付け
③ 自分でファイルを1個ずつ開いた
④ 諦めて作り直した

#バイブコーディング
```

### ポスト⑧（逆張りポジション）
```
バイブコーディングツールは全員「もっと速く作る」レースをしてる。
Cursor、Bolt、Lovable、Claude Code——同じ方向。

redoCebivだけ逆を向いてる。「作った後に、理解する」。

ニッチに見える？
でも全バイブコーダーが遅かれ早かれ直面する問題。
```

### ポスト⑨（英語・グローバルリーチ）
```
Every vibe coding tool helps you build faster.
None of them help you understand what you built.

redoCebiv: Upload a ZIP. Get a feature map. Trace the code.
No questions needed. The tool asks them for you.

quiet-tools.jp/redoCebiv
#vibecoding #buildinpublic
```

### ポスト⑩（哲学・ブランド）
```
「静かなツール」とは、使っているのを忘れるツールのこと。

でも開発者にとって「静か」とは、コードが理解できている状態のことだと思う。
理解できていないコードはずっとノイズを出し続ける。

redoCebivは、そのノイズを止めるためのツール。
```

---

# PART 3: 投稿スケジュール

---

## 推奨発信順序

| 順番 | コンテンツ | プラットフォーム | 目的 |
|------|-----------|----------------|------|
| 1 | マニフェストスレッド① | X @Redo_C_ebiV | 旗を立てる。固定ツイート化 |
| 2 | Dev.to記事 Part 4（競合調査編） | dev.to/redo_c_ebiv | 既存Part 1〜3の続編。英語圏リーチ |
| 3 | Zenn記事（全部入り版） | zenn.dev/redocebiv | 日本語圏での権威確立 |
| 4 | 競合分析スレッド② | X @Redo_C_ebiV | Zenn/Dev.to記事へのトラフィック誘導 |
| 5 | 単発ポスト①〜⑩ | X @Redo_C_ebiV | 日替わりで1日1本。2週間分のストック |

---

## 記事とXの連動

- 記事公開日にXでスレッド②を投稿し、最後のツイートに記事リンクを貼る
- 単発ポストの中で記事の一部を引用して「詳しくはこちら→」で誘導
- 記事内の比較マトリクスを画像化してXに投稿（視覚的に映える）

---

## 投稿タイミング

| 言語 | 時間帯（JST） | 曜日 |
|---|---|---|
| 日本語 | 7:00〜8:00 / 12:00〜13:00 | 平日（技術系は火〜木が反応良い） |
| 英語 | 22:00〜24:00 | 月〜水（Dev.to記事公開も同様） |

---

# PART 4: 曜日テーマ（継続のための仕組み）

| 曜日 | テーマ | 内容例 |
|------|--------|--------|
| 月 | **#QuietMonday** | 今週「削ったもの」「シンプルにしたこと」の報告 |
| 水 | **Vibe Coder Wednesday** | バイブコーダー向けTips、ツール紹介（自社以外も） |
| 金 | **Build Friday** | redoCebiv開発の進捗、設計判断の共有 |

---

# PART 5: スプレッドシートのテーマ文字列（B列）

Make → Claude API に渡す文字列。これをB列に入力する。

## 英語テーマ

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
| Quiet Monday | EN quiet monday: what I removed or simplified this week, less is more |
| Vibe Coder Wednesday | EN vibe coder wednesday: practical tip for reading AI-generated code |
| Build Friday | EN build friday: weekly progress update on redoCebiv, honest and brief |

## 日本語テーマ（JP:プレフィックスで識別）

| テーマ名 | B列入力文字列 |
|---|---|
| 共感（ファイル迷子） | JP 共感ツイート: Cursorで作ったがボタンのテキスト変えるのにどのファイルか分からない |
| Tip（読み方） | JP Tipツイート: React初心者がAI生成コードで最初に読むべきファイル順 |
| デモ紹介 | JP デモツイート: redoCebivのZIPアップロード→機能選択→関連ファイル表示の流れ |
| 感情ツイート | JP 感情ツイート: プログラミングを学びたいんじゃなく自分のアプリを直したいだけという声 |
| Quiet Monday | JP QuietMonday: 今週削ったもの・シンプルにしたことの報告 |
| 問いかけ | JP 問いかけツイート: AIで作ったアプリの最初のバグ修正で何をしたか選択肢付き投票 |
