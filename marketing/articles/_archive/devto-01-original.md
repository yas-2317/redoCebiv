---
title: How to Find Which File Controls Any Feature in Your AI-Generated App
published: false
description: You built an app with Cursor, v0, or Lovable. Now you want to change something and have no idea where to look. Here's how to find your way.
tags: webdev, beginners, ai, productivity
---

I remember the first time I wanted to change something small in an app I'd built with AI. I think it was a button color. Maybe the font on a heading. Something that should have taken thirty seconds.

I spent two hours.

Not because the change was hard. Because I couldn't find the right file. I had a folder full of stuff with names like `layout.tsx` and `globals.css` and `page.tsx` nested three levels deep, and I had no idea which one controlled the thing I was looking at in my browser. It felt like trying to find a light switch in someone else's house, in the dark, while wearing oven mitts.

If you've built something with Cursor, v0, Lovable, or any AI coding tool and then hit this exact wall — yeah. I get it. That frustration is real, and it doesn't mean you're doing anything wrong.


## The map problem

AI tools are incredible at generating working code. They're just not great at leaving you a map of what they built. You end up with an app that runs, but the internal structure is a mystery — and the moment you want to change anything, you realize you're navigating without street signs.

This isn't a knowledge gap you need to fill by learning to code. It's more like needing to learn how to orient yourself inside a project. Think of it less like "I need to become a developer" and more like "I need to know which drawer the forks are in."

So here's what actually works.


## Right-click is your best friend

Open your app in the browser. Find the thing you want to change — the button, the text, the card, whatever. Right-click it and hit "Inspect" (or "Inspect Element" depending on your browser).

A panel opens with a bunch of highlighted code. Ignore most of it. What you're looking for are recognizable words — the actual text on the button, a class name that sounds descriptive like `pricing-card` or `hero-section`, anything that connects what you see on screen to something searchable.

Copy one of those words. You just found your clue.


## Now search your project

Open your project in VS Code or whatever editor you're using. Hit `Cmd+Shift+F` on Mac or `Ctrl+Shift+F` on Windows. Paste what you copied.

You'll get a short list of files that contain that word. Usually two or three. One of them is the file you're looking for.

That's genuinely the whole method. Search for what you can see. I still do this daily, and I've been doing this for a while now. It's not a beginner shortcut — it's just how people find things in codebases.


## The only mental model you need

Most AI-generated apps have two kinds of files that matter in your day-to-day editing. Pages and components.

Pages are tied to URLs. If your app has a `/pricing` page, there's probably a file called `pricing.tsx` or a `page.tsx` inside a `/pricing` folder. Change that file, and you change that one page.

Components are reusable pieces — a navbar, a footer, a card that shows up in multiple places. They usually live in a `/components` folder. Change a component, and it changes everywhere that component appears. Knowing just this one distinction saves you from a lot of "wait, why did that change over there too?" moments.

You don't need to understand anything else about the architecture. Seriously. Pages and components. That's your map.


## Ask your AI better questions

When you do go back to your AI tool for help, the quality of your prompt makes a massive difference. Instead of "fix the pricing page," try something like:

"Which file in my project controls the pricing section that users see at /pricing? Give me the file path and explain what each part does in simple terms."

Specificity is everything. Tell it what you see, where you see it, what you want to change. The less it has to guess, the less likely it is to edit the wrong file or create some weird duplicate.


## But also — this shouldn't be this hard

These tricks work. I use them. But every time I go through this little detective routine just to move a section or update some text, a part of me thinks: I built this app in twenty minutes with AI, and now I need fifteen minutes of forensic work to make a small edit?

That gap between building and maintaining is the thing that actually trips people up. The AI tools that helped you create your app weren't really designed to help you understand what they created, or to make ongoing changes feel easy.

That's the problem we're working on with redoCebiv — giving people who built with AI a clear, visual way to see what's in their app and change it without the file-tree detective work. If you've felt that "I built it but now I can't touch it" frustration, [come check out the waitlist](https://tally.so/forms/Me5690/share). We're building it for exactly this situation.

If you've got your own tricks for finding your way around AI-generated projects, I'd love to hear them in the comments. We're all figuring this out together.
