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

That's the thing that pushed me to start building [redoCebiv](https://tally.so/forms/Me5690/share). I wanted to be able to pick a use case — "user logs in," "task gets added" — and immediately see which files are involved and how the flow works, without asking the AI five questions first. Not a replacement for AI tools, but the context layer they're missing.

If that sounds like a problem you have, the waitlist is open.


## Wrapping up the series

Three posts. The fear of touching your own app. The tricks that help you navigate it. The shift from asking the AI to fix things to asking it to teach you.

None of this requires you to become a developer. You don't need to understand every line. You just need a map — something that gives you enough orientation to move with confidence instead of fear.

I'm curious what your experience has been. If you're working inside an AI-generated codebase, what's your process? What do you do when you're stuck? Drop a comment — I'd genuinely like to know.

---

*[redoCebiv](https://tally.so/forms/Me5690/share) — understand your app feature by feature, not file by file. Waitlist open.*
