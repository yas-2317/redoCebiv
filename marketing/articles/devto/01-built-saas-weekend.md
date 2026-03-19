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

I built a small internal tool — a lightweight business OS for a co-founded startup. Deal tracking, task management, AI-assisted drafts. Used Cursor with Claude under the hood. The stack was Next.js, Prisma, Auth.js. I didn't pick any of that. The AI did.

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

---

*I'm building [redoCebiv](https://tally.so/forms/Me5690/share) to make this easier — pick a feature like "user logs in" or "task gets added," and it shows you which files are involved and how the flow works. Waitlist open if you're curious.*
