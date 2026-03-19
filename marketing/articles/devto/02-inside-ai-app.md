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

I started wanting something that skips the detective work entirely. Pick a feature — "user logs in," "payment goes through" — and just see which files are involved, without having to hunt for them first.

Next time, I want to talk about a shift that changed my relationship with AI tools more than any tip or trick: I stopped asking the AI to fix things and started asking it to explain things.

---

*Building [redoCebiv](https://tally.so/forms/Me5690/share) to make this easier — understand your app feature by feature, not file by file. Waitlist open.*
