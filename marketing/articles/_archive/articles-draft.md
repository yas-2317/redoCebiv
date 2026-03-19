=== dev.to #1 ===

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

I built a small SaaS — a task management tool with Stripe integration, user auth, the whole thing. Used Cursor with Claude under the hood and scaffolded the UI in v0. The stack was Next.js, Tailwind, Supabase. I didn't pick any of that. The AI did.

And honestly, watching it come together was a rush. I'd type a sentence describing what I wanted, and ten seconds later there'd be a working component on screen. A pricing table. A dashboard layout. A sign-up flow. I felt like I'd unlocked a cheat code. I texted a friend "I just built a SaaS" at 11pm on a Saturday with zero irony.

Then Sunday morning, I wanted to change the heading on the landing page. "Transform Your Workflow" — it was generic, and I had something better in mind.

I opened the project. Forty-something files. Folders inside folders. I clicked `page.tsx`. Wrong one — that was the dashboard. Tried `layout.tsx`. That seemed to wrap everything but didn't have the text I was looking for. Opened `globals.css` hoping for a clue. Nothing useful.

I found the right file eventually. It was inside `app/(marketing)/page.tsx`, which makes sense in hindsight but made zero sense to me at the time. By then I'd opened and closed probably fifteen files, and each one made me a little less confident that I should be touching anything at all.


## The problem wasn't skill

AI tools are incredible at generating working code. They're just not great at leaving you a map of what they built. You end up with an app that runs, but the internal structure is a mystery — and the moment you want to change anything, you realize you're navigating without street signs.

This isn't a knowledge gap you need to fill by learning to code. It's more like needing to learn how to orient yourself inside a project. Think of it less like "I need to become a developer" and more like "I need to know which drawer the forks are in."

The scary part wasn't that I couldn't read code. It was that I had no visibility:

- Which file controls which part of the screen?
- If I change this, what else breaks?
- If I break it, can I undo it?

Zero visibility. That's what made it feel risky.


## When I asked the AI to fix it, something else broke

So I did what anyone would do. I went back to Cursor and told it: "Change the hero heading to 'Ship Faster, Together'."

It changed the heading. It also edited a shared component that was used in three other places. The navbar started showing the wrong title. A card on the pricing page duplicated itself somehow. I still don't fully understand how that happened.

I asked it to fix the navbar. It created a second navbar component instead of editing the existing one. Now I had two, and the app was rendering both of them on mobile.

For a copy change.


## "Build" and "maintain" are different skills

I built the app in twenty minutes. Then I spent fifteen minutes on forensic work just to move one section.

That gap — between building and maintaining — is the thing that actually trips people up. The AI tools that helped you create your app weren't really designed to help you understand what they created, or to make ongoing changes feel easy.

Building is instant now. That part is solved, or close to it. But living inside what you built — understanding the shape of it, knowing where to go when something needs to change — that hasn't caught up. The tools that create the app don't stick around to help you take care of it.

I think this is the gap that nobody's really talking about. Not "can AI write code" but "can you maintain what AI wrote." The answer, right now, is "barely."

In the next post, I'll show what's actually inside one of these AI-generated apps — and the one trick that makes finding any file take about thirty seconds.


## What's next

In the next post, I'll show you what's actually inside an AI-generated app — and the one trick that makes finding any file take about thirty seconds.

---

*I'm building [redoCebiv](https://tally.so/forms/Me5690/share) to make this easier — a visual map of your AI-generated app so you can find and change things without the detective work. Waitlist open if you're curious.*


=== dev.to #2 ===

---
title: "What vibe-coded apps actually look like on the inside"
published: false
description: You built an app with Cursor, v0, or Lovable. Now you want to change something. Here's how to find your way.
tags: webdev, beginners, ai, productivity
series: "Living inside an AI-generated app"
series_number: 2
---

Last time I wrote about the moment it got scary — the moment I realized I'd built something I couldn't navigate. This time, I want to talk about what actually works when you need to find and change things.


## Right-click is your best friend

Open your app in the browser. Find the thing you want to change — the button, the text, the card, whatever. Right-click it and hit "Inspect" (or "Inspect Element" depending on your browser).

A panel opens with a bunch of highlighted code. Ignore most of it. What you're looking for are recognizable words — the actual text on the button, a class name that sounds descriptive like `pricing-card` or `hero-section`, anything that connects what you see on screen to something searchable.

Copy one of those words. You just found your clue.


## Now search your project

Open your project in VS Code or whatever editor you're using. Hit `Cmd+Shift+F` on Mac or `Ctrl+Shift+F` on Windows. Paste what you copied.

You'll get a short list of files that contain that word. Usually two or three. One of them is the file you're looking for.

That's genuinely the whole method. Search for what you can see. I still do this daily, and I've been doing this for a while now. It's not a beginner shortcut — it's just how people find things in codebases.

I used to feel embarrassed about this. Like a "real" developer would just know which file to open. But from what I can tell, most developers spend a decent chunk of their day searching through their own projects. Nobody memorizes the whole tree. The codebase is too large, the context switches too often. Global search is the universal coping mechanism.


## The only mental model you need

Most AI-generated apps have two kinds of files that matter in your day-to-day editing. Pages and components.

Pages are tied to URLs. If your app has a `/pricing` page, there's probably a file called `pricing.tsx` or a `page.tsx` inside a `/pricing` folder. Change that file, and you change that one page.

Components are reusable pieces — a navbar, a footer, a card that shows up in multiple places. They usually live in a `/components` folder. Change a component, and it changes everywhere that component appears. Knowing just this one distinction saves you from a lot of "wait, why did that change over there too?" moments.

You don't need to understand anything else about the architecture. Seriously. Pages and components. That's your map.


## Ask your AI better questions

When you do go back to your AI tool for help, the quality of your prompt makes a massive difference. Instead of "fix the pricing page," try something like:

"Which file in my project controls the pricing section that users see at /pricing? Give me the file path and explain what each part does in simple terms."

Specificity is everything. Tell it what you see, where you see it, what you want to change. The less it has to guess, the less likely it is to edit the wrong file or create some weird duplicate.

Here are two more prompts I use constantly:

"I want to change the call-to-action button text on the landing page from 'Get Started' to 'Try Free.' Which file should I edit, and are there any other files that reference this button?"

"I changed something in `components/PricingCard.tsx` and now the layout looks broken on the /dashboard page. Can you explain the relationship between these two files and what might have gone wrong?"

The pattern is always the same: say exactly what you see, say exactly where you see it, ask for the connection between files. The AI becomes dramatically more useful when you stop treating it like a fix-it button and start treating it like someone who knows the codebase better than you do.

One thing worth knowing: these detailed prompts eat through tokens faster than short ones. If you're on a usage-capped plan, it adds up. I've found it's worth it — one good prompt that gets it right costs less overall than five vague ones that each make things worse.


## What this still doesn't solve

These tricks work. I use them all the time. But here's the thing — every single change starts with the same detective routine. Right-click, inspect, search, cross-reference. It's not hard, but it's tedious, and it adds friction to what should be quick edits.

I started wanting something that just shows me the whole picture. A visual map of the app where I can see which files control which parts of the screen without going through the investigation each time. That's the thing I'm building now — [redoCebiv](https://tally.so/forms/Me5690/share) — but more on that later.

Next time, I want to talk about a shift that changed my relationship with AI tools more than any tip or trick: I stopped asking the AI to fix things and started asking it to explain things.

---

*Building [redoCebiv](https://tally.so/forms/Me5690/share) to make this easier. Visual map of your AI-generated app — find and change things without the file-tree detective work.*


=== dev.to #3 ===

---
title: "Why I stopped asking AI to fix my code and started asking it to explain it"
published: false
description: One shift in how I talk to AI tools changed how much I actually understand my own app.
tags: webdev, beginners, ai, productivity
series: "Living inside an AI-generated app"
series_number: 3
---

I knew the tips. Inspect element, global search, pages vs. components. It all worked. But something still felt off — like I was navigating the app without ever actually understanding it.

The moment I realized what was wrong: I'd fixed the same pricing card three times in two weeks, and each time I had to start from scratch. I wasn't learning anything. I was just outsourcing.


## The loop I was stuck in

Something breaks. I paste the error into Cursor. It fixes it. Two days later, something else breaks — sometimes the same thing. I paste it again. It fixes it again.

On paper, the problem gets solved every time. But I started noticing that I couldn't explain any of the fixes. Not even vaguely. I had no idea why the pricing card kept breaking, what connected it to the layout file that kept changing, or whether the "fix" was actually making the architecture worse each time.

I was getting things done without gaining any experience. The AI was learning my codebase, in a sense — responding to it, navigating it — and I was just watching. That felt wrong. Not morally wrong, just fragile. Like the whole thing depended on me always having access to this tool and never needing to think for myself.

I started wondering: is the AI helping me build, or is it replacing the part of building where I actually learn something?


## The shift: ask it to explain, not fix

The turning point was small. I had a bug — the footer was overlapping the content on mobile. Normally I would have said "fix the footer overlap on mobile." This time, mostly out of frustration, I typed: "Why is the footer overlapping the content on mobile? Don't fix it. Just explain what's happening."

And the explanation was genuinely useful. It told me the footer had `position: fixed` but the main content didn't have enough bottom padding to account for it. It told me which file set the footer's position and which file controlled the content area's spacing. It told me these were two separate concerns that could be fixed independently.

I made the change myself. It took maybe two minutes. And for the first time, I felt like I understood a piece of my own app.

I didn't need to understand everything. I just needed enough orientation to know what I was doing and why. Not mastery — just direction. That was enough to make the whole thing feel less scary.


## What I actually ask now

My prompts look completely different these days. Here are the ones I use most:

"What does this file do, and what other files depend on it?"

"If I change the padding in this component, what other pages will be affected?"

"Why is this component re-rendering every time I navigate? Walk me through the data flow."

"I want to move the testimonials section above the pricing section on the landing page. What files are involved, what's the safest way to do it, and what could go wrong?"

"Are there any other approaches? What are the tradeoffs?"

That last one is key. I ask it constantly. The AI's first answer is usually fine, but it tends to give you the most straightforward solution, not necessarily the best one. Pushing back — "is there another way?", "what are you not considering?", "did you think about edge cases?" — gets you a much more complete picture.

Whether the AI acts as a teacher or a vending machine depends entirely on how you talk to it. Same tool, completely different outcomes.


## This still doesn't scale

Here's the honest part: even with better prompts, there are real limits.

Every explanation costs tokens. A detailed "walk me through" answer can eat through a meaningful chunk of your daily cap if you're on a free or mid-tier plan. I've hit that wall mid-afternoon more than once.

And the bigger issue: the AI can explain one file at a time, but it can't really show you the whole picture. When I ask about one component, I get a great answer about that component. But I can't see how it connects to the five other things that depend on it without asking five more questions. There's no bird's-eye view. No map.

That's the thing that pushed me to start building [redoCebiv](https://tally.so/forms/Me5690/share). I wanted a visual layer on top of my project — something that shows me the whole structure at once, so I know where things are and how they connect before I start asking questions or making changes. Not a replacement for AI tools, but the context layer they're missing.

If that sounds like a problem you have, the waitlist is open.


## Wrapping up the series

Three posts. The fear of touching your own app. The tricks that help you navigate it. The shift from asking the AI to fix things to asking it to teach you.

None of this requires you to become a developer. You don't need to understand every line. You just need a map — something that gives you enough orientation to move with confidence instead of fear.

I'm curious what your experience has been. If you're working inside an AI-generated codebase, what's your process? What do you do when you're stuck? Drop a comment — I'd genuinely like to know.

---

*[redoCebiv](https://tally.so/forms/Me5690/share) — a visual map of your AI-generated app. Waitlist open.*


=== Zenn #1 ===

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

ランディングページの見出し。「ワークフローを変革しよう」みたいな、よくある感じのやつ。もうちょっとマシなコピーにしたかった。

プロジェクトを開いた。ファイルが40個くらいある。`page.tsx`を開いたらダッシュボードだった。`layout.tsx`を開いたら全体のラッパーっぽくてテキストは見当たらない。`globals.css`にもヒントなし。結局、`app/(marketing)/page.tsx`の中に見つけた。15個くらいファイルを開いたり閉じたりした後で。

その時点でもう「これ以上触って壊したらどうしよう」って気持ちのほうが強くなっていて、見出しの変更はしたけど、他に気になってた部分は全部スルーした。コア体験じゃないし、まあいいか。…と自分に言い聞かせた。


## 怖さの正体は「スキル不足」じゃなかった

問題は「コードが読めないこと」じゃなかった。

どのファイルが何を担当しているか分からない。変えたら他のどこに飛び火するか分からない。壊したときに戻せるか分からない。

要するに、見通しがゼロの状態で手を動かすのが怖い。「どこに何があるか」「何を変えればどこが動くのか」がわかれば、怖くない。


## AIに頼んだら別の場所が壊れた

見出しを変えたくて、Cursorに「ヒーローの見出しを変えて」と頼んだ。変わった。でも、同じコンポーネントが他の場所でも使われていたらしく、ナビバーのタイトルまで変わった。

直してもらったら、今度はナビバーのコンポーネントがもう一個生まれた。モバイルで2つ重なって表示された。

見出しのコピーを1行変えたかっただけなのに。


## 「作る」と「育てる」は別のスキルだった

20分でAIが作ってくれたアプリを、ちょっと直すために15分かけて探し回る。動くけど、AIに経験を奪われてはいないだろうか、とは毎回思う。

「作る」は一瞬でできるようになったのに、「作ったものを自分で育てる」はまだ全然追いついていない。AI開発ツールが解決し残した部分が、ここなのかもしれない。

この感覚が一番リアルだったのは、日曜の夜、アプリはデプロイ済みで動いてるのに「自分のアプリなのに怖くて触れない」と思った瞬間だった。作れたのに、持てていない。そういう感じ。

次の記事では、AIが作ったアプリの中身が実際どうなっているかと、ファイルを30秒で見つける方法を書く。

---

[redoCebiv](https://tally.so/forms/Me5690/share) — AI生成アプリの中身を視覚的に見渡すツールを作っています。同じ課題を感じている人はウェイトリストを覗いてみてください。


=== Zenn #2 ===

---
title: "AIが作ったアプリの中身は、こうなっている"
emoji: "🔦"
type: "idea"
topics: ["AI", "初心者", "vibe-coding", "cursor", "v0"]
published: false
series: "AIが作ったアプリの中で生きる"
---

前回は「触るのが怖い」という話を書いた。今回はもう少し実用的な話。実際にどうやってファイルを見つけて、どう変更するか。


## 右クリック→検証→検索

ブラウザでアプリを開いて、変えたい箇所を右クリック→「検証」。コードがハイライトされるけど、読まなくていい。

探すのは、ボタンに書いてあるテキストそのものとか、`pricing-card`とか`hero-section`みたいな、意味がなんとなく推測できる名前。それをコピーして、VS Codeで`Cmd+Shift+F`（Windowsは`Ctrl+Shift+F`）に貼る。

ヒットするファイルが2〜3個出てくるので、それぞれ開いて該当箇所を見る。大体見つかる。

プロの開発者もだいたい同じようなことをやっている（んじゃないかな…精度や効率は格段に高いだろうし、もっといい方法を使っているのかもしれない）。
多分コード全体を頭に入れてる人なんてほぼいなくて、みんな都度検索して都度思い出してる。
なので「こんな原始的なやり方でいいのか」とか思わなくていい。断じて。


## ファイルの種類は2つだけ覚えればいい

AIが作るアプリのファイルは大量にあるけど、普段触るのはだいたい2種類。ページとコンポーネント。

ページはURLに対応している。`/pricing`というURLがあれば、`pricing.tsx`か、`/pricing`フォルダの中の`page.tsx`がある。そのファイルを変えれば、そのページだけが変わる。

コンポーネントは使い回しのパーツ。ナビバー、フッター、料金カードみたいなやつで、`/components`フォルダに入っていることが多い。コンポーネントを変えると、それを使っている全ページに影響が出る。

これが罠で、「料金カードのデザインをちょっと変えたい」と思ってコンポーネントを編集すると、ダッシュボードにも同じカードが使われていて、そっちも変わってしまう。「なんでこっちも変わったの？」の原因は、だいたいこれ。

ページとコンポーネント。この2つの区別だけで、アプリの中に地図ができる。


## AIへの聞き方を変えると、精度が上がる

ファイルを見つけたあとにAIに修正を頼むとき、「料金ページ直して」だとだいたい失敗する。AIが何をどう直すか推測するしかないから。

僕はよく「AのページのここをBに変えたいんだけど、そこを動かすために必要な箇所と変更方針、その変更を推す理由を教えて」とか聞いて、よく分からなければ深掘り質問をする（他に方法ないの？、とか、網羅的に考えた？とか）。

例えば：
「/pricingページに表示されている料金カードを制御しているファイルはどれ？ファイルパスを教えて、各部分が何をしているか簡単に説明して」

もう一個よく使うのはこれ：
「`components/PricingCard.tsx`を変更したら`/dashboard`ページのレイアウトが崩れた。この2つのファイルの関係を説明して、何が起きたか教えて」

詳しく聞くとトークンをかなり消費する。上限ありのプランだと午後には使い切ることもある。でも、雑に5回聞いて5回とも微妙な結果になるより、丁寧に1回聞いて一発で正解にたどり着くほうがトータルでは安い。


## それでも毎回この探偵作業はしんどい

Tip自体は使える。実際、僕は毎日やってる。でも、変更のたびに右クリック→検証→検索→クロスリファレンス、を繰り返すのはやっぱりしんどい。

ファイルの構造を一目で見渡せるものがほしい。どのファイルが画面のどこに対応しているか、パッと見てわかるもの。それが [redoCebiv](https://tally.so/forms/Me5690/share) を作り始めた理由なんだけど、その話はまた今度。

次回は、AIとの付き合い方で一番大きかった変化について書く。「直して」と頼むのをやめた話。

---

[redoCebiv](https://tally.so/forms/Me5690/share) — AI生成アプリの中身を視覚的に見渡すツール。ウェイトリスト受付中。


=== Zenn #3 ===

---
title: "AIに「直して」と頼むのをやめたら、開発が変わった"
emoji: "💬"
type: "idea"
topics: ["AI", "初心者", "vibe-coding", "cursor", "Claude"]
published: false
series: "AIが作ったアプリの中で生きる"
---

前回、ファイルの見つけ方とAIへの聞き方を書いた。でもあれを実践しても、なんか根本的に変わってない感覚が残っていた。

変わったのは、ある日「直して」って打とうとして手が止まった時だった。「これ、もう3回目だな」と気づいた。同じ料金カードが壊れて、同じようにAIに投げて、同じように直ってる。自分は何も覚えてない。


## 「直してもらう」ループの怖さ

壊れる。AIに投げる。直る。また壊れる。また投げる。また直る。

結果だけ見れば問題は毎回解決してる。でも僕の中には何も残ってない。なぜ壊れたのか、何が変わったのか、次に同じことが起きたらどうすればいいのか。全部AIが持っていって、僕の手元にはゼロ。

AIがいなくなったら何もできない自分がそこにいた。それは「便利」というより「依存」に近い気がした。AIに経験ごと奪われてるような感覚。大げさかもしれないけど、そう感じた。


## 「直して」をやめて「説明して」に変えた

きっかけは本当にしょうもなくて、フッターがモバイルでコンテンツに被さってるバグだった。いつもなら「モバイルでフッター被ってるの直して」って書くところを、その日はなんとなく「なんでフッターが被ってるのか教えて。直さなくていいから」と打った。

返ってきた説明が良かった。フッターに`position: fixed`がついてて、メインコンテンツの下に十分なpaddingがないからだと。フッターの位置を決めてるファイルと、コンテンツの余白を決めてるファイルは別で、それぞれ独立に直せるということ。

自分で直した。2分くらいで終わった。そしてはじめて、「自分のアプリの一部を理解した」という感覚があった。

全部わかる必要はない。方向感があればいい。どっちに進めばいいかがわかるだけで、怖さはかなり減る。


## 実際に使っているプロンプト

最近よく使うのはこんな感じ：

「このファイルは何をしてる？他のどのファイルがこれに依存してる？」

「このコンポーネントのpaddingを変えたら、他のどのページに影響が出る？」

「ランディングページのテスティモニアルセクションを料金セクションの上に移動したい。関連するファイルと、一番安全なやり方と、リスクを教えて」

「他のアプローチはある？それぞれのトレードオフは？」

「それ、網羅的に考えた？見落としてるケースない？」

最後の2つは特によく使う。AIの最初の回答はだいたい「一番素直な方法」で、必ずしもベストじゃない。「他には？」「本当に？」と突っ込むと、もっと良い選択肢が出てくることが多い。部下にやったらパワハラ待ったなしだけど、AIには遠慮なく聞ける。ここはAIの良いところ。


## それでも限界はある

「説明して」スタイルにしてから、アプリの理解度は確実に上がった。でも正直、限界もある。

まず、トークン消費がすごい。「このファイルの役割を詳しく説明して」を1日に10回やると、上限ありのプランでは結構きつい。

そして、1つのファイルの説明は良くても、アプリ全体の構造は見えない。「このコンポーネントはここで使われてる」はわかっても、「じゃあアプリ全体でどのファイルがどこに対応してるの」は聞いても答えきれない。コンテキストウィンドウの限界もある。

結局ほしいのは、アプリの構造を一目で見渡せるもの。どのファイルが画面のどこを担当していて、何が何に依存しているか。それをAIに1個ずつ聞くんじゃなくて、最初から視覚的に見えている状態。

[redoCebiv](https://tally.so/forms/Me5690/share) はそれを作ろうとしている。AI生成アプリの中身を視覚的にマッピングして、どこに何があるかをファイルツリーを掘らずに把握できるツール。AIツールの代わりじゃなくて、AIツールに足りていないコンテキストのレイヤー。

同じ課題を感じてる人がいたら、ウェイトリストを覗いてみてほしい。


## 3本書いて、気づいたこと

怖さの正体は「スキル不足」じゃなくて「見通しの無さ」だった。見つけ方を知ればだいぶ楽になるし、聞き方を変えればもっと楽になる。でも、地図そのものがあれば最初から怖くない。

完全に理解する必要はないと思う。地図さえあれば歩ける。

みんなはAIが作ったコードとどう付き合ってる？自分なりの工夫があったら、コメントで教えてほしい。

---

[redoCebiv](https://tally.so/forms/Me5690/share) — AI生成アプリの中身を視覚的に見渡すツール。ウェイトリスト受付中。
