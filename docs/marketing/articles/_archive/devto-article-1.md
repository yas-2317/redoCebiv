# dev.to 記事初稿

**Tags**: `vibecoding`, `react`, `nextjs`, `webdev`, `beginners`
**Canonical**: (Zenn日本語版と別内容)

---

## Title

> How to Read AI-Generated Code You Didn't Write

---

## Article

### The vibe coding wall

You shipped an app with Cursor. It works. You're proud.

Then you try to change one button label. You open the project, see 20+ files, and spend 40 minutes looking at code you don't recognize.

This is what I call the **vibe coding wall** — the gap between "I built it with AI" and "I can actually touch it."

It's not a skill issue. It's a missing step.

---

### Why reading AI-generated code feels different

When you write code yourself, you understand it because you made the decisions. When AI writes it, the decisions are already made — but your mental model is missing.

The traditional advice ("just read the code from top to bottom") doesn't work well here. AI-generated codebases tend to be:

- Larger than expected (AI is thorough)
- Well-structured but opaque (you didn't choose the structure)
- Full of patterns you didn't learn yet

You need a different entry point.

---

### Read features, not files

The shift that changes everything: **start with a feature you want to understand**, not a file you happen to open.

Ask yourself: "What happens when I click the Add button?"

Then trace it.

---

### Step 1: Find the event handler

Every feature starts with a user action. In React, that's an event handler.

```tsx
// Look for onClick, onSubmit, onChange
<button onClick={handleSubmit}>Add task</button>
```

You now know: `handleSubmit` is where this feature begins.

---

### Step 2: Follow the function

Find `handleSubmit` and read it.

```tsx
const handleSubmit = () => {
  if (text.trim() === '') return;  // validation
  addTask(text);                   // data update
  setText('');                     // reset
};
```

Three lines. You now know:
- There's a validation check (empty input)
- Something called `addTask` handles the actual logic
- The input resets after submission

---

### Step 3: Find where the data lives

`addTask` came from somewhere. Check the import or destructuring.

```tsx
const { addTask } = useTaskStore();
```

`useTaskStore` is your data layer. That's where tasks are stored and managed.

---

### What you now know (after 10 minutes)

- The Add button lives in `AddTaskForm.tsx`
- Validation is in `handleSubmit` (same file)
- Task data is managed by `useTaskStore`

If you want to:
- **Change the button label** → `AddTaskForm.tsx`, find the button
- **Change validation logic** → `handleSubmit` in `AddTaskForm.tsx`
- **Change how tasks are stored** → `useTaskStore`

You don't need to understand the whole codebase. You need to understand **this feature**.

---

### The three stages of vibe coder understanding

From my experience helping non-engineers work with their AI-generated code, there are three stages:

**1. Read** — You can identify which files are involved in a feature and follow the flow

**2. Predict** — Before you look, you can guess which file you'd need to change for a given requirement

**3. Edit** — You can make small, targeted changes without fear

Most people get stuck before Stage 1 and give up. But Stage 1 is reachable in an afternoon for most Next.js/React apps.

---

### The most common sticking points

**"There are too many files to know where to start"**

→ You don't need to start with a file. Start with a user action (`onClick`, `onSubmit`) and trace forward.

**"I don't know how far to trace before I understand it"**

→ Stop when you can answer: "If I want to change X, which file and which line?" That's enough.

**"I follow a function and it leads to another file, then another"**

→ This is normal. Most features touch 3-5 files. Keep a scratch note of which file does what as you go.

---

### A practical exercise

Pick any button in your AI-generated app. Answer these questions:

1. Which component file contains this button?
2. What's the name of its `onClick` handler?
3. What does that handler do? (One sentence)
4. Where does the data go when the button is pressed?

If you can answer all four, you understand that feature.

---

### What I'm building

I got tired of watching friends feel helpless in their own codebases.

[redoCebiv](https://redocebiv.app) automates this feature-tracing process. Upload your ZIP, pick a feature, and get the related files + flow mapped out automatically — plus mini challenges to lock in the understanding.

It's built specifically for vibe coders: people who shipped something with AI and want to actually understand what they built.

β waitlist is open if you're interested.

---

*If this was useful, follow [@redocebiv](https://twitter.com/redocebiv) for more vibe coding tips.*
