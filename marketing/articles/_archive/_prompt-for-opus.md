# Opus への依頼プロンプト

---

## 依頼内容

下記の記事6本（dev.to連載3本 + Zenn連載3本）の草稿を完成させてほしい。
既存のテキストは活かしつつ、`- [ ]` の箇条書きになっているTODO部分を書き埋めてほしい。

---

## 書き手のプロフィール（一人称視点で書く）

- 日本人。非エンジニア〜エンジニア入門レベル
- Cursor / v0 などのAIコーディングツールを使って、週末でSaaSを作った
- 作った直後は感動したが、ちょっとした変更をしようとして詰まった
- どのファイルが何を制御しているか分からず、触るのが怖かった
- AIに「直して」と頼んだら別の場所が壊れた経験がある
- その経験をもとに **redoCebiv** というツールを作っている
  - AI生成アプリの中身を視覚的に見渡せるツール
  - ファイルツリーを掘り返さなくてもどこを触ればいいか分かるようにする
- β版のウェイトリスト: https://tally.so/forms/Me5690/share

---

## 文体のルール（厳守）

### やってはいけないこと

- `**太字強調**` は使わない（マークダウンのboldは一切禁止）
- `## Step 1:` `## Step 2:` のような番号付きステップ見出しは使わない
- `---` の水平線は文中で使わない（フロントマターとフッターのCTAの前後のみOK）
- 「まとめると」「最後に」「この記事では」「さっそく見ていきましょう」などのAI的フィラーは使わない
- 英語記事で "In conclusion", "Let's dive in", "In this post, I'll cover" は使わない
- AIっぽさが残るのは精度が低いことを露呈することを意味するので、考えて書くこと


### 目指すトーン

- 英語記事: 直接的・正直・自虐的なユーモアあり。salesy にならない。短い文で余白を作る
- 日本語記事: 話し言葉に近いカジュアルな文体。「〜だと思う」「〜な気がする」程度の不確かさを残す。ため口でOK
- 両方共通: 体験談ベース。感情の動きを具体的に書く。「一般論」より「自分はこうだった」

### リズムの例（英語）

❌ AI的: "There are several key things to understand about AI-generated codebases."
✅ 良い: "The app ran. I just had no idea what was inside it."

### リズムの例（日本語）

❌ AI的: 「AI生成コードを扱う上では、いくつかの重要なポイントを理解することが大切です。」
✅ 良い: 「動くけど、自分で触れない。それが一番しんどかった。」

---

## 出力フォーマット

6本の記事を順番に出力してほしい。各記事の前に以下を明記：

```
=== dev.to #1 ===
（本文）

=== dev.to #2 ===
（本文）

... 以下同様
```

既存のテキスト（TODOでない部分）はそのまま残すこと。
フロントマター（`---`で囲まれたメタ情報）もそのまま残すこと。
HTMLコメント（`<!-- ... -->`）は出力から除いてよい。

---

## 記事1: dev.to #1

```
---
title: "I built a SaaS in a weekend. Here's what broke first."
published: false
description: The build was easy. Everything after was the hard part.
tags: webdev, beginners, ai, productivity
series: "Living inside an AI-generated app"
series_number: 1
---

I remember the first time I wanted to change something small in an app I'd built with AI. I think it was a button color. Maybe the font on a heading. Something that should have taken thirty seconds.

I spent two hours.

Not because the change was hard. Because I couldn't find the right file. I had a folder full of stuff with names like `layout.tsx` and `globals.css` and `page.tsx` nested three levels deep, and I had no idea which one controlled the thing I was looking at in my browser. It felt like trying to find a light switch in someone else's house, in the dark, while wearing oven mitts.

If you've built something with Cursor, v0, Lovable, or any AI coding tool and then hit this exact wall — yeah. I get it. That frustration is real, and it doesn't mean you're doing anything wrong.


## What I expected vs. what actually happened

【TODO: ここを書く】
- 具体的に作ったもの（SaaSの種類・規模感）
- 使ったツール（Cursor, v0 など）
- テンションが上がった瞬間の描写
- 最初に詰まったシーン（具体的なもの：コピー変更、ボタン色など）
- ファイルを開いて閉じた瞬間の描写


## The problem wasn't skill

AI tools are incredible at generating working code. They're just not great at leaving you a map of what they built. You end up with an app that runs, but the internal structure is a mystery — and the moment you want to change anything, you realize you're navigating without street signs.

This isn't a knowledge gap you need to fill by learning to code. It's more like needing to learn how to orient yourself inside a project. Think of it less like "I need to become a developer" and more like "I need to know which drawer the forks are in."

The scary part wasn't that I couldn't read code. It was that I had no visibility:

- Which file controls which part of the screen?
- If I change this, what else breaks?
- If I break it, can I undo it?

Zero visibility. That's what made it feel risky.


## When I asked the AI to fix it, something else broke

【TODO: ここを書く】
- AIに「直して」と頼んだら別のファイルを編集された
- ナビゲーションが壊れた / 重複コンポーネントが生まれた など
- 「For a copy change.」的なリズムで締める（参考: "I asked the AI to fix it. It edited the wrong file and created a duplicate component that broke the nav. For a copy change."）


## "Build" and "maintain" are different skills

I built the app in twenty minutes. Then I spent fifteen minutes on forensic work just to move one section.

That gap — between building and maintaining — is the thing that actually trips people up. The AI tools that helped you create your app weren't really designed to help you understand what they created, or to make ongoing changes feel easy.

【TODO: ここを書く】
- 「作る」は一瞬でできるようになった、という気づきを自分の言葉で
- 「作ったものを自分で育てる」はまだ全然追いついていない、という感覚
- 解決策はまだ出さず、気づきで締める
- 次回予告を自然な1文で


## What's next

In the next post, I'll show you what's actually inside an AI-generated app — and the one trick that makes finding any file take about thirty seconds.

---

*I'm building [redoCebiv](https://tally.so/forms/Me5690/share) to make this easier — a visual map of your AI-generated app so you can find and change things without the detective work. Waitlist open if you're curious.*
```

---

## 記事2: dev.to #2

```
---
title: "What vibe-coded apps actually look like on the inside"
published: false
description: You built an app with Cursor, v0, or Lovable. Now you want to change something. Here's how to find your way.
tags: webdev, beginners, ai, productivity
series: "Living inside an AI-generated app"
series_number: 2
---

【TODO: #1からのブリッジ（1〜2文）。「前回は怖さの話をした。今回は実際にどう動かすか」という流れ】


## Right-click is your best friend

Open your app in the browser. Find the thing you want to change — the button, the text, the card, whatever. Right-click it and hit "Inspect" (or "Inspect Element" depending on your browser).

A panel opens with a bunch of highlighted code. Ignore most of it. What you're looking for are recognizable words — the actual text on the button, a class name that sounds descriptive like `pricing-card` or `hero-section`, anything that connects what you see on screen to something searchable.

Copy one of those words. You just found your clue.


## Now search your project

Open your project in VS Code or whatever editor you're using. Hit `Cmd+Shift+F` on Mac or `Ctrl+Shift+F` on Windows. Paste what you copied.

You'll get a short list of files that contain that word. Usually two or three. One of them is the file you're looking for.

That's genuinely the whole method. Search for what you can see. I still do this daily, and I've been doing this for a while now. It's not a beginner shortcut — it's just how people find things in codebases.

【TODO: 「これで本当にいいのか」という自問への答え。プロも都度検索しているニュアンス（断定しなくていい）】


## The only mental model you need

Most AI-generated apps have two kinds of files that matter in your day-to-day editing. Pages and components.

Pages are tied to URLs. If your app has a `/pricing` page, there's probably a file called `pricing.tsx` or a `page.tsx` inside a `/pricing` folder. Change that file, and you change that one page.

Components are reusable pieces — a navbar, a footer, a card that shows up in multiple places. They usually live in a `/components` folder. Change a component, and it changes everywhere that component appears. Knowing just this one distinction saves you from a lot of "wait, why did that change over there too?" moments.

You don't need to understand anything else about the architecture. Seriously. Pages and components. That's your map.


## Ask your AI better questions

When you do go back to your AI tool for help, the quality of your prompt makes a massive difference. Instead of "fix the pricing page," try something like:

"Which file in my project controls the pricing section that users see at /pricing? Give me the file path and explain what each part does in simple terms."

Specificity is everything. Tell it what you see, where you see it, what you want to change. The less it has to guess, the less likely it is to edit the wrong file or create some weird duplicate.

【TODO: 自分がよく使う具体的なプロンプトをもう1〜2個追加。深掘り質問のニュアンスも。トークン消費への現実的な一言があれば】


## What this still doesn't solve

【TODO: Tipは機能するが毎回やるのは変、という感覚。redoCebivを軽く言及（「これを解決したくてツールを作っている」程度）。#3への自然なブリッジ】

---

*Building [redoCebiv](https://tally.so/forms/Me5690/share) to make this easier. Visual map of your AI-generated app — find and change things without the file-tree detective work.*
```

---

## 記事3: dev.to #3

```
---
title: "Why I stopped asking AI to fix my code and started asking it to explain it"
published: false
description: One shift in how I talk to AI tools changed how much I actually understand my own app.
tags: webdev, beginners, ai, productivity
series: "Living inside an AI-generated app"
series_number: 3
---

【TODO: #2からのブリッジ（1〜2文）。「Tipを知っても、何かが変わっていない感覚があった」ターニングポイントとなった気づき or 出来事】


## The loop I was stuck in

【TODO: AIに頼む → 直る → また壊れる → また頼む のループ描写。自分が何も学んでいない感覚。「AIに経験を奪われてはいないか」という自問】


## The shift: ask it to explain, not fix

【TODO: 「直して」から「説明して」に変えたきっかけ。変える前と後の比較。「全部わかる必要はない、方向感があればいい」という安心感】


## What I actually ask now

【TODO: 実際のプロンプト例を3〜5個。「なぜ？」「他には？」「網羅的に考えた？」的な深掘り質問。「AIが教師か作業員かは質問の仕方で決まる」的な気づき】


## This still doesn't scale

【TODO: 工夫しても残る限界（トークン消費、アプリ全体の把握）。「視覚的に見渡せるツールがあれば」という自然な流れ。redoCebivを本格的に紹介してCTAへ】


## Wrapping up the series

【TODO: 連載3本の振り返り1〜2文。「完全に理解できなくていい。地図があればいい。」的な締め。読者への問いかけ（コメントで自分のやり方を教えてほしい）】

---

*[redoCebiv](https://tally.so/forms/Me5690/share) — a visual map of your AI-generated app. Waitlist open.*
```

---

## 記事4: Zenn #1

```
---
title: "週末でSaaSを作った。最初に詰まったのはこれだった。"
emoji: "🧱"
type: "idea"
topics: ["AI", "初心者", "vibe-coding", "cursor", "v0"]
published: false
series: "AIが作ったアプリの中で生きる"
---

VSCodeでWebアプリを作った時、中ではClaudeとCodexを動かしていたんだけど、AIにバーッと指示を出して、動くものが出てきて、「自分でもアプリって作れるんだ」とかなりテンションが上がったのをよく覚えてる。

で、出来上がったのを見て、ちょっと変えたくなった。

【TODO: 最初に詰まった具体的なシーン。どのファイルか分からなかった。「変なとこ触って壊したらどうしよう」で閉じた。「コア体験じゃないしな（言い聞かせ）」的な自虐で締める】


## 怖さの正体は「スキル不足」じゃなかった

問題は「コードが読めないこと」じゃなかった。

どのファイルが何を担当しているか分からない。変えたら他のどこに飛び火するか分からない。壊したときに戻せるか分からない。

要するに、見通しがゼロの状態で手を動かすのが怖い。「どこに何があるか」「何を変えればどこが動くのか」がわかれば、怖くない。


## AIに頼んだら別の場所が壊れた

【TODO: 具体的な失敗談。AIが間違ったファイルを編集したエピソード。オチになる1行（「コピー変更ひとつに、これだけかかった。」的なリズム）】


## 「作る」と「育てる」は別のスキルだった

20分でAIが作ってくれたアプリを、ちょっと直すために15分かけて探し回る。動くけど、AIに経験を奪われてはいないだろうか、とは毎回思う。

「作る」は一瞬でできるようになったのに、「作ったものを自分で育てる」はまだ全然追いついていない。AI開発ツールが解決し残した部分が、ここなのかもしれない。

【TODO: この気づきが自分にとってリアルだった感覚を1〜2文で。次回への自然なつながり（解決策は出さない）】

次の記事では、AIが作ったアプリの中身が実際どうなっているかと、ファイルを30秒で見つける方法を書く。

---

[redoCebiv](https://tally.so/forms/Me5690/share) — AI生成アプリの中身を視覚的に見渡すツールを作っています。同じ課題を感じている人はウェイトリストを覗いてみてください。
```

---

## 記事5: Zenn #2

```
---
title: "AIが作ったアプリの中身は、こうなっている"
emoji: "🔦"
type: "idea"
topics: ["AI", "初心者", "vibe-coding", "cursor", "v0"]
published: false
series: "AIが作ったアプリの中で生きる"
---

【TODO: #1からのブリッジ（1〜2文）。「前回は怖さの話をした。今回は実際にどう動かすか」という流れ】


## 右クリック→検証→検索

ブラウザでアプリを開いて、変えたい箇所を右クリック→「検証」。コードがハイライトされるけど、読まなくていい。

探すのは、ボタンに書いてあるテキストそのものとか、`pricing-card`とか`hero-section`みたいな、意味がなんとなく推測できる名前。それをコピーして、VS Codeで`Cmd+Shift+F`（Windowsは`Ctrl+Shift+F`）に貼る。

ヒットするファイルが2〜3個出てくるので、それぞれ開いて該当箇所を見る。大体見つかる。

プロの開発者もだいたい同じようなことをやっている（んじゃないかな…精度や効率は格段に高いだろうし、もっといい方法を使っているのかもしれない）。
多分コード全体を頭に入れてる人なんてほぼいなくて、みんな都度検索して都度思い出してる。
なので「こんな原始的なやり方でいいのか」とか思わなくていい。断じて。


## ファイルの種類は2つだけ覚えればいい

【TODO: pagesとcomponentsの説明（日本語で）。コンポーネントを変えると全箇所が変わる罠への言及。「この2つだけ知っていれば地図になる」という締め】


## AIへの聞き方を変えると、精度が上がる

ファイルを見つけたあとにAIに修正を頼むとき、「料金ページ直して」だとだいたい失敗する。AIが何をどう直すか推測するしかないから。

僕はよく「AのページのここをBに変えたいんだけど、そこを動かすために必要な箇所と変更方針、その変更を推す理由を教えて」とか聞いて、よく分からなければ深掘り質問をする（他に方法ないの？、とか、網羅的に考えた？とか）。

例えば：
「/pricingページに表示されている料金カードを制御しているファイルはどれ？ファイルパスを教えて、各部分が何をしているか簡単に説明して」

【TODO: 追加のプロンプト例を1〜2個。「かなりトークンを消費する」現実への一言（あれば）】


## それでも毎回この探偵作業はしんどい

【TODO: Tipは使えるけど毎回やるのは変という感覚。redoCebivの軽い言及。#3への自然なつながり】

---

[redoCebiv](https://tally.so/forms/Me5690/share) — AI生成アプリの中身を視覚的に見渡すツール。ウェイトリスト受付中。
```

---

## 記事6: Zenn #3

```
---
title: "AIに「直して」と頼むのをやめたら、開発が変わった"
emoji: "💬"
type: "idea"
topics: ["AI", "初心者", "vibe-coding", "cursor", "Claude"]
published: false
series: "AIが作ったアプリの中で生きる"
---

【TODO: #2からのブリッジ（1〜2文）。「Tipを知っても、何かが変わっていない感覚があった」ターニングポイントとなった気づき or 出来事】


## 「直してもらう」ループの怖さ

【TODO: AIに頼む → 直る → また壊れる → また頼む のループ描写。AIがいないと何もできない状態への違和感。「AIに経験を奪われてはいないか」という自問】


## 「直して」をやめて「説明して」に変えた

【TODO: きっかけ。変える前と後の比較。「全部わかる必要はない、方向感があればいい」という安心感】


## 実際に使っているプロンプト

【TODO: プロンプト例を3〜5個（日本語で）。深掘りに使う質問パターン。「部下にやったらパワハラ待ったなし」ニュアンスの一言】


## それでも限界はある

【TODO: トークン消費、全体把握の難しさ。redoCebivの本格的な紹介。CTAへの自然なつながり】


## 3本書いて、気づいたこと

【TODO: 連載の締めくくり（前向きな言葉で）。読者への問いかけ（コメントで教えてほしい）】

---

[redoCebiv](https://tally.so/forms/Me5690/share) — AI生成アプリの中身を視覚的に見渡すツール。ウェイトリスト受付中。
```
