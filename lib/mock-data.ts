import type { AIUpdate } from "@/lib/types";

const today = "2026-06-27";

export const mockUpdates = [
  {
    id: "text-to-video-demos",
    title: "Text-to-video tools are turning short prompts into product demos",
    toolName: "Runway, Veo, Pika",
    category: "Video AI",
    summary:
      "New video models make it realistic for students and founders to create 10-second product shots without a camera crew.",
    longExplanation:
      "Text-to-video tools can now produce short, coherent clips from a prompt, image, or reference frame. The output is still inconsistent for exact product UI, but it is already strong for mood reels, ad concepts, social teasers, and quick pitch visuals.",
    whyItMatters:
      "You can prototype a launch video before you have a finished product, which makes early testing and portfolio storytelling much faster.",
    tags: ["video", "marketing", "portfolio", "free tools", "creative"],
    date: today,
    hypeScore: 9,
    usefulScore: 7,
    studentRelevanceScore: 8,
    difficulty: "Beginner",
    bestFor: ["Product demos", "Pitch decks", "Social video"],
    access: {
      freeTier: true,
      studentDiscount: "Unknown",
      openSource: false,
      trialCredits: "Yes",
      apiAvailable: true,
      noCodeFriendly: true,
      waitlistRequired: false,
      paidOnly: false,
    },
    perks: ["Fast visual prototyping", "Great portfolio artifact", "No filming setup needed"],
    limitations: ["Limited credits", "May distort text", "Watermarks on free plans"],
    tutorial: {
      title: "Make a 10-second AI product ad",
      goal: "Turn a raw app idea into a short launch teaser.",
      estimatedTime: "25 min",
      difficulty: "Beginner",
      toolsNeeded: ["Runway or Pika", "One product screenshot", "A short value prop"],
      steps: [
        "Write one sentence describing the product, audience, and mood.",
        "Generate three 5-second variations with different camera directions.",
        "Pick the clearest clip and add a simple caption in your editor.",
        "Export it as a vertical reel and save the prompt for your portfolio notes.",
      ],
      prompt:
        "Create a 10-second vertical product teaser for a student productivity app. Show a clean phone UI, fast note organization, energetic pacing, soft neon lighting, and a final frame that says: Turn messy notes into study plans.",
      expectedOutput: "A short video concept you can attach to a pitch deck or LinkedIn post.",
      commonMistakes: ["Asking for too many scenes", "Expecting exact UI text", "Skipping reference images"],
      nextStep: "A/B test two captions and track which one gets clearer reactions.",
    },
    promptPack: {
      student:
        "Make a 20-second study app video concept for stressed university students, with three shots and captions.",
      coding:
        "Write a prompt for a vertical video demo that explains a developer tool in one visual metaphor.",
      marketing:
        "Generate five hook ideas for an AI product ad that can be produced with text-to-video tools.",
      design:
        "Create an art direction prompt for a clean, futuristic SaaS launch video with readable UI moments.",
      research:
        "Compare three AI video tools for quality, free credits, watermark rules, and student use cases.",
      career:
        "Turn my project description into a short portfolio video script that highlights problem, process, and result.",
    },
    miniProject: {
      title: "10-second AI product ad",
      difficulty: "Beginner",
      estimatedTime: "45 min",
      toolsNeeded: ["AI video tool", "Canva or CapCut", "Project screenshot"],
      skillsLearned: ["Prompt direction", "Video storyboarding", "Product positioning"],
      portfolioValue: "High",
      steps: [
        "Choose a product or class project.",
        "Write one clear target user and pain point.",
        "Generate three video concepts.",
        "Edit the best concept into one vertical ad.",
        "Write a 100-word process note.",
      ],
      output: "A shareable vertical product ad plus a short case-study caption.",
    },
    sourceType: "Mock",
    isSaved: false,
    isFeatured: true,
  },
  {
    id: "ai-slide-tools",
    title: "AI slide tools can now turn research into a deck outline",
    toolName: "Gamma, Tome, Canva, Plus AI",
    category: "Productivity",
    summary:
      "Presentation assistants are improving at converting notes, PDFs, and bullet points into usable slide structures.",
    longExplanation:
      "AI slide tools are not a replacement for taste or argument structure, but they are now useful for generating first drafts, visual hierarchy, and speaker notes from messy source material.",
    whyItMatters:
      "Students can spend less time staring at blank slides and more time improving the actual argument.",
    tags: ["presentations", "student", "research", "free tools", "business"],
    date: today,
    hypeScore: 7,
    usefulScore: 9,
    studentRelevanceScore: 10,
    difficulty: "Beginner",
    bestFor: ["Class presentations", "Pitch decks", "Research summaries"],
    access: {
      freeTier: true,
      studentDiscount: "Unknown",
      openSource: false,
      trialCredits: "Yes",
      apiAvailable: false,
      noCodeFriendly: true,
      waitlistRequired: false,
      paidOnly: false,
    },
    perks: ["Cuts blank-page time", "Good templates", "Easy to export"],
    limitations: ["Generic design if unedited", "Free exports may be limited", "Needs fact checking"],
    tutorial: {
      title: "Convert a paper into a 5-slide deck",
      goal: "Summarize one article into a presentation you can actually deliver.",
      estimatedTime: "30 min",
      difficulty: "Beginner",
      toolsNeeded: ["Gamma or Canva", "A research article", "Your course rubric"],
      steps: [
        "Paste the abstract and main findings into the AI slide tool.",
        "Ask for exactly five slides: problem, method, insight, implication, discussion.",
        "Rewrite each title as a claim, not a label.",
        "Add speaker notes with one example per slide.",
      ],
      prompt:
        "Turn this research summary into a 5-slide student presentation. Use claim-style slide titles, one key visual idea per slide, and speaker notes that explain the idea in simple language.",
      expectedOutput: "A deck outline with usable slide titles, notes, and visual suggestions.",
      commonMistakes: ["Too many bullet points", "No central claim", "Skipping citations"],
      nextStep: "Replace one generic visual with a diagram you draw yourself.",
    },
    promptPack: {
      student:
        "Turn these class notes into a five-slide presentation with claim-style titles and simple speaker notes.",
      coding:
        "Create a technical demo deck outline for a beginner coding project, including architecture and result slides.",
      marketing:
        "Draft a pitch deck for this student startup idea with problem, insight, solution, proof, and ask.",
      design:
        "Suggest a slide design system for an AI presentation: colors, type scale, charts, and image style.",
      research:
        "Summarize this paper into slide titles, evidence bullets, and one discussion question per slide.",
      career:
        "Turn my project experience into a portfolio presentation for a recruiter interview.",
    },
    miniProject: {
      title: "5-slide AI pitch deck",
      difficulty: "Beginner",
      estimatedTime: "1 hour",
      toolsNeeded: ["Gamma or Canva", "One idea", "Export to PDF"],
      skillsLearned: ["Story structure", "Visual hierarchy", "Pitch clarity"],
      portfolioValue: "High",
      steps: [
        "Pick one product idea.",
        "Generate a five-slide deck.",
        "Improve the slide titles into claims.",
        "Add one metric or user quote.",
        "Export and write a short reflection.",
      ],
      output: "A polished mini pitch deck ready for a portfolio or hackathon demo.",
    },
    sourceType: "Mock",
    isSaved: false,
    isFeatured: false,
  },
  {
    id: "coding-copilots-beginners",
    title: "Coding copilots are becoming beginner-friendly project coaches",
    toolName: "Cursor, Codex, Replit Agent",
    category: "Coding",
    summary:
      "AI coding assistants are shifting from autocomplete into guided project planning, debugging, and code review.",
    longExplanation:
      "Modern coding assistants can read a codebase, explain errors, suggest focused changes, and run verification loops. They still need guardrails, but they reduce the distance between idea and working prototype.",
    whyItMatters:
      "A beginner can build a real project faster if they learn to ask for small, testable changes instead of giant one-shot prompts.",
    tags: ["coding", "agents", "student", "portfolio", "tutorial"],
    date: today,
    hypeScore: 8,
    usefulScore: 9,
    studentRelevanceScore: 10,
    difficulty: "Beginner",
    bestFor: ["Learning code", "Debugging", "Hackathon prototypes"],
    access: {
      freeTier: true,
      studentDiscount: "Yes",
      openSource: false,
      trialCredits: "Yes",
      apiAvailable: true,
      noCodeFriendly: false,
      waitlistRequired: false,
      paidOnly: false,
    },
    perks: ["Explains errors", "Speeds up prototyping", "Great for code review practice"],
    limitations: ["Can introduce bugs", "Requires verification", "May overbuild simple tasks"],
    tutorial: {
      title: "Build with an AI coding assistant without losing the plot",
      goal: "Use an assistant to make one small feature and verify it.",
      estimatedTime: "35 min",
      difficulty: "Beginner",
      toolsNeeded: ["Cursor or Codex", "A small repo", "Terminal"],
      steps: [
        "Ask the assistant to inspect the repo before coding.",
        "Define one tiny feature and one success check.",
        "Let it implement, then run tests or the app.",
        "Ask for a short explanation of what changed.",
      ],
      prompt:
        "Inspect this project first, then add one small feature: [feature]. Keep the change minimal, follow existing patterns, and run the relevant verification command before summarizing.",
      expectedOutput: "A working feature plus a clear change summary.",
      commonMistakes: ["Skipping repo inspection", "Asking for five features at once", "Not running the app"],
      nextStep: "Commit the feature and write what you learned in the README.",
    },
    promptPack: {
      student:
        "Explain this error like I know basic programming, then suggest the smallest safe fix.",
      coding:
        "Read this repo and propose a minimal implementation plan for [feature], including files to touch and tests to run.",
      marketing:
        "Turn this coding project into a simple product story for a hackathon demo.",
      design:
        "Review this app screen for UX issues and suggest three low-risk UI improvements.",
      research:
        "Compare three coding assistants for a beginner building a web app this weekend.",
      career:
        "Rewrite my project README so it highlights technical decisions, tradeoffs, and proof of work.",
    },
    miniProject: {
      title: "AI-assisted bug fix log",
      difficulty: "Beginner",
      estimatedTime: "50 min",
      toolsNeeded: ["AI coding assistant", "GitHub repo"],
      skillsLearned: ["Debugging", "Prompting", "Verification"],
      portfolioValue: "High",
      steps: [
        "Find a small broken behavior.",
        "Ask the assistant to diagnose it.",
        "Apply the smallest fix.",
        "Run the app or tests.",
        "Document before, after, and lesson learned.",
      ],
      output: "A README section showing a bug, fix, verification, and reflection.",
    },
    sourceType: "Mock",
    isSaved: false,
    isFeatured: false,
  },
  {
    id: "research-paper-simplifiers",
    title: "Research-paper simplifiers are getting better at practical takeaways",
    toolName: "Elicit, SciSpace, NotebookLM",
    category: "Research",
    summary:
      "AI research tools can extract methods, claims, limitations, and simple explanations from dense papers.",
    longExplanation:
      "The most useful research assistants do not just summarize. They help compare papers, identify assumptions, explain methods, and turn academic language into plain decisions.",
    whyItMatters:
      "Students can move from passive reading to active synthesis: what does this paper let me build, test, or question?",
    tags: ["research", "student", "summarizer", "presentations"],
    date: today,
    hypeScore: 6,
    usefulScore: 9,
    studentRelevanceScore: 10,
    difficulty: "Beginner",
    bestFor: ["Literature reviews", "Class readings", "Paper-to-slides workflows"],
    access: {
      freeTier: true,
      studentDiscount: "Unknown",
      openSource: false,
      trialCredits: "Yes",
      apiAvailable: false,
      noCodeFriendly: true,
      waitlistRequired: false,
      paidOnly: false,
    },
    perks: ["Plain-language summaries", "Citation-aware workflows", "Great for first-pass reading"],
    limitations: ["May miss nuance", "Needs source checking", "PDF parsing can fail"],
    tutorial: {
      title: "Extract a useful paper summary",
      goal: "Turn one paper into an action-focused summary.",
      estimatedTime: "30 min",
      difficulty: "Beginner",
      toolsNeeded: ["Research assistant", "PDF", "Notes app"],
      steps: [
        "Upload the paper and ask for the main claim.",
        "Ask what a student could build or test from the paper.",
        "Extract limitations and assumptions.",
        "Write three practical takeaways in your own words.",
      ],
      prompt:
        "Summarize this paper for a smart student builder. Include the main claim, why it matters, limitations, and three mini project ideas inspired by the paper.",
      expectedOutput: "A practical paper brief with buildable ideas.",
      commonMistakes: ["Trusting uncited claims", "Only reading the summary", "Ignoring limitations"],
      nextStep: "Convert the best takeaway into a small experiment or slide deck.",
    },
    promptPack: {
      student:
        "Explain this paper in simple language and list what I should remember for class discussion.",
      coding:
        "Turn this research method into pseudocode and describe the data needed to test it.",
      marketing:
        "Translate this research insight into a customer problem and product opportunity.",
      design:
        "Suggest a diagram that explains this paper's core mechanism to non-experts.",
      research:
        "Extract claim, evidence, method, limitations, and follow-up questions from this paper.",
      career:
        "Turn this paper summary into a LinkedIn post that sounds thoughtful, not hypey.",
    },
    miniProject: {
      title: "Paper-to-slides summary",
      difficulty: "Beginner",
      estimatedTime: "1 hour",
      toolsNeeded: ["Research assistant", "Slide tool", "PDF"],
      skillsLearned: ["Synthesis", "Critical reading", "Presentation design"],
      portfolioValue: "Medium",
      steps: [
        "Pick one AI paper.",
        "Extract the claim and limitations.",
        "Create five slides.",
        "Add one original diagram.",
        "Record a two-minute walkthrough.",
      ],
      output: "A concise slide deck explaining a research idea in plain language.",
    },
    sourceType: "Mock",
    isSaved: false,
    isFeatured: false,
  },
  {
    id: "campaign-visual-image-ai",
    title: "Image AI is useful for campaign visuals when you define a system",
    toolName: "Adobe Firefly, Ideogram, Midjourney",
    category: "Design",
    summary:
      "Image generation works best for campaigns when prompts include audience, format, color rules, and repeatable composition.",
    longExplanation:
      "The leap is not just prettier images. The practical win is generating a consistent set of visuals for ads, posts, mockups, and moodboards without needing a full shoot.",
    whyItMatters:
      "Students can present a complete brand campaign concept even if they do not have a design team.",
    tags: ["image generation", "design", "marketing", "portfolio"],
    date: today,
    hypeScore: 8,
    usefulScore: 8,
    studentRelevanceScore: 8,
    difficulty: "Intermediate",
    bestFor: ["Campaign concepts", "Moodboards", "Social assets"],
    access: {
      freeTier: true,
      studentDiscount: "Yes",
      openSource: false,
      trialCredits: "Yes",
      apiAvailable: true,
      noCodeFriendly: true,
      waitlistRequired: false,
      paidOnly: false,
    },
    perks: ["Fast concept exploration", "Strong visual polish", "Useful for mockups"],
    limitations: ["Brand consistency takes work", "Text can fail", "Licensing varies by tool"],
    tutorial: {
      title: "Create a three-image campaign system",
      goal: "Generate a consistent campaign concept with repeatable rules.",
      estimatedTime: "40 min",
      difficulty: "Intermediate",
      toolsNeeded: ["Image AI tool", "Moodboard references", "Brand prompt"],
      steps: [
        "Define audience, tone, color, and composition rules.",
        "Generate one hero visual, one product visual, and one social post visual.",
        "Refine prompts until the style feels consistent.",
        "Place the images in a one-page campaign board.",
      ],
      prompt:
        "Create a campaign visual for an AI study planner for university students. Style: clean cyber campus, electric cyan and warm pink accents, realistic product lifestyle, no readable text, optimistic, premium but student-friendly.",
      expectedOutput: "Three related visuals that feel like one campaign.",
      commonMistakes: ["Changing style every prompt", "Using unreadable text", "Ignoring target audience"],
      nextStep: "Add copy and turn the campaign into a portfolio case study.",
    },
    promptPack: {
      student:
        "Create a moodboard prompt for a student club campaign that feels modern, inclusive, and practical.",
      coding:
        "Generate app store screenshot background concepts for a productivity app without adding text.",
      marketing:
        "Write five image prompts for one campaign across hero, ad, social, poster, and email formats.",
      design:
        "Define a reusable visual system prompt with palette, lighting, camera, texture, and composition rules.",
      research:
        "Compare image AI tools for campaign visuals, including licensing, consistency, and text handling.",
      career:
        "Turn my campaign mockups into portfolio case-study bullets with problem, approach, and result.",
    },
    miniProject: {
      title: "AI brand-campaign concept",
      difficulty: "Intermediate",
      estimatedTime: "90 min",
      toolsNeeded: ["Image AI tool", "Figma or Canva"],
      skillsLearned: ["Art direction", "Campaign systems", "Brand storytelling"],
      portfolioValue: "High",
      steps: [
        "Choose a product or cause.",
        "Define audience and campaign promise.",
        "Generate a visual system.",
        "Create three campaign assets.",
        "Write the rationale.",
      ],
      output: "A one-page campaign board with three AI-generated assets and rationale.",
    },
    sourceType: "Mock",
    isSaved: false,
    isFeatured: false,
  },
  {
    id: "ai-agents-workflows",
    title: "AI agents are moving from demos into useful workflow helpers",
    toolName: "Zapier Agents, Lindy, Relevance AI",
    category: "Agents",
    summary:
      "Agent platforms can monitor inputs, call tools, and complete repeatable tasks with human review points.",
    longExplanation:
      "The practical version of agents is not a fully autonomous coworker. It is a narrow helper that watches for a trigger, gathers context, proposes an action, and lets you approve risky steps.",
    whyItMatters:
      "A student or solo builder can automate admin tasks without writing a full backend.",
    tags: ["agents", "workflow automation", "business", "no-code"],
    date: today,
    hypeScore: 9,
    usefulScore: 7,
    studentRelevanceScore: 7,
    difficulty: "Intermediate",
    bestFor: ["Operations", "Lead triage", "Research workflows"],
    access: {
      freeTier: true,
      studentDiscount: "Unknown",
      openSource: false,
      trialCredits: "Yes",
      apiAvailable: true,
      noCodeFriendly: true,
      waitlistRequired: false,
      paidOnly: false,
    },
    perks: ["Automates boring tasks", "Connects multiple apps", "Good demo value"],
    limitations: ["Can be brittle", "Needs clear guardrails", "Expensive at scale"],
    tutorial: {
      title: "Design a safe no-code AI agent",
      goal: "Create an agent that drafts actions but asks before sending.",
      estimatedTime: "45 min",
      difficulty: "Intermediate",
      toolsNeeded: ["Agent builder", "Google Sheets or Gmail", "Sample data"],
      steps: [
        "Choose one repeatable task.",
        "Define trigger, inputs, allowed actions, and approval step.",
        "Test with sample data.",
        "Add a clear log of what the agent did.",
      ],
      prompt:
        "You are an assistant for a student project team. When a new sponsor email arrives, summarize the ask, draft a reply, list missing information, and wait for approval before sending anything.",
      expectedOutput: "A controlled workflow that drafts useful work without risky autonomy.",
      commonMistakes: ["Letting the agent send without approval", "Vague task scope", "No error handling"],
      nextStep: "Add a weekly summary so the workflow becomes a portfolio demo.",
    },
    promptPack: {
      student:
        "Design a simple AI agent that helps a student team track deadlines and draft reminders.",
      coding:
        "Write a safe agent spec with trigger, tools, state, approval gates, and failure cases.",
      marketing:
        "Create an agent workflow that turns new leads into a draft follow-up email and CRM note.",
      design:
        "Map this agent workflow into a simple user journey with trigger, review, and completion states.",
      research:
        "Compare no-code agent platforms by integrations, pricing, approval controls, and logging.",
      career:
        "Explain my AI workflow project as a proof-of-work bullet for operations or product roles.",
    },
    miniProject: {
      title: "No-code sponsor email agent",
      difficulty: "Intermediate",
      estimatedTime: "2 hours",
      toolsNeeded: ["Agent builder", "Email sample", "Spreadsheet"],
      skillsLearned: ["Automation design", "Guardrails", "Workflow testing"],
      portfolioValue: "High",
      steps: [
        "Define one inbox trigger.",
        "Create summary and draft reply steps.",
        "Require manual approval.",
        "Log outputs in a sheet.",
        "Record a demo walkthrough.",
      ],
      output: "A safe agent workflow demo with logs and before/after screenshots.",
    },
    sourceType: "Mock",
    isSaved: false,
    isFeatured: false,
  },
  {
    id: "resume-cover-letter-tools",
    title: "Resume and cover-letter AI works best as a matching engine",
    toolName: "Teal, Huntr, ChatGPT",
    category: "Student Tool",
    summary:
      "The practical use is comparing your experience against a job description, not generating generic career fluff.",
    longExplanation:
      "Career AI tools are useful when they map evidence from your real projects to the language in a role. They become risky when they invent experience or produce generic polished paragraphs.",
    whyItMatters:
      "Students can turn class projects into stronger applications by showing specific proof, tools, and outcomes.",
    tags: ["career", "resume", "student", "job"],
    date: today,
    hypeScore: 6,
    usefulScore: 8,
    studentRelevanceScore: 10,
    difficulty: "Beginner",
    bestFor: ["Internship applications", "Portfolio bullets", "Cover letters"],
    access: {
      freeTier: true,
      studentDiscount: "Unknown",
      openSource: false,
      trialCredits: "Unknown",
      apiAvailable: false,
      noCodeFriendly: true,
      waitlistRequired: false,
      paidOnly: false,
    },
    perks: ["Better keyword matching", "Turns projects into bullets", "Useful for first drafts"],
    limitations: ["Can sound generic", "May overstate experience", "Needs human review"],
    tutorial: {
      title: "Match one project to one job post",
      goal: "Create honest, specific application bullets.",
      estimatedTime: "25 min",
      difficulty: "Beginner",
      toolsNeeded: ["Resume", "Job description", "AI writing tool"],
      steps: [
        "Paste the job description and your project notes.",
        "Ask for matched skills with evidence only.",
        "Rewrite three bullets with action, tool, and result.",
        "Check every claim against your real work.",
      ],
      prompt:
        "Compare this job description with my project notes. Create resume bullets only from evidence I provide. Use action, tool, result, and do not invent metrics.",
      expectedOutput: "Three honest resume bullets tailored to the role.",
      commonMistakes: ["Inventing impact", "Using vague verbs", "Ignoring the job criteria"],
      nextStep: "Attach a GitHub README or portfolio link as proof.",
    },
    promptPack: {
      student:
        "Turn this class project into resume bullets for an internship, using only evidence I provide.",
      coding:
        "Rewrite my developer project bullet to show stack, problem, implementation, and verification.",
      marketing:
        "Tailor this campaign project to a marketing internship without exaggerating results.",
      design:
        "Convert this design project into portfolio case-study bullets with user problem and decisions.",
      research:
        "Extract the top skills from this job description and match them to my provided experience.",
      career:
        "Draft a concise cover letter that connects my real projects to this role in a specific way.",
    },
    miniProject: {
      title: "AI job-application tracker",
      difficulty: "Beginner",
      estimatedTime: "1 hour",
      toolsNeeded: ["Spreadsheet", "AI writing tool", "Job posts"],
      skillsLearned: ["Career positioning", "Evidence mapping", "Workflow design"],
      portfolioValue: "Medium",
      steps: [
        "Create columns for role, skills, evidence, status, and follow-up.",
        "Paste three target roles.",
        "Use AI to extract matched evidence.",
        "Write one tailored bullet per role.",
        "Track next action dates.",
      ],
      output: "A reusable application tracker with tailored project evidence.",
    },
    sourceType: "Mock",
    isSaved: false,
    isFeatured: false,
  },
  {
    id: "open-source-llms",
    title: "Open-source LLMs are good enough for private class projects",
    toolName: "Llama, Qwen, Mistral, Ollama",
    category: "Open Source",
    summary:
      "Local and open-weight models are increasingly practical for summarization, drafts, and offline experiments.",
    longExplanation:
      "Open-source LLMs are not always the best raw model, but they offer privacy, customization, and cost control. For student projects, they are excellent for learning how AI systems really work.",
    whyItMatters:
      "You can build AI features without sending every note or dataset to a hosted API.",
    tags: ["open-source", "llm", "coding", "research"],
    date: today,
    hypeScore: 7,
    usefulScore: 8,
    studentRelevanceScore: 8,
    difficulty: "Intermediate",
    bestFor: ["Privacy-sensitive prototypes", "Offline demos", "Learning AI infrastructure"],
    access: {
      freeTier: true,
      studentDiscount: "No",
      openSource: true,
      trialCredits: "No",
      apiAvailable: true,
      noCodeFriendly: false,
      waitlistRequired: false,
      paidOnly: false,
    },
    perks: ["Runs locally", "Lower variable cost", "Great learning value"],
    limitations: ["Needs setup", "Hardware constraints", "Quality varies by task"],
    tutorial: {
      title: "Run a local study-note summarizer",
      goal: "Use an open model to summarize notes locally.",
      estimatedTime: "45 min",
      difficulty: "Intermediate",
      toolsNeeded: ["Ollama", "A small open model", "Markdown notes"],
      steps: [
        "Install a local model runner.",
        "Download a small instruction model.",
        "Paste a class note and ask for summary, flashcards, and questions.",
        "Compare the output with a hosted model.",
      ],
      prompt:
        "Summarize these class notes into five key ideas, five flashcards, and three likely exam questions. Keep the language simple and flag anything uncertain.",
      expectedOutput: "A local AI-generated study pack.",
      commonMistakes: ["Using a model too large for the laptop", "Skipping uncertainty checks", "Expecting perfect citations"],
      nextStep: "Wrap the prompt in a tiny command-line script.",
    },
    promptPack: {
      student:
        "Create flashcards from these notes using a local model, and flag unclear concepts.",
      coding:
        "Write a minimal Node script that sends a prompt to a local LLM endpoint and prints the response.",
      marketing:
        "Brainstorm privacy-friendly AI product ideas that can run locally or on-device.",
      design:
        "Design a simple UI for a local AI note assistant with privacy as the main value prop.",
      research:
        "Compare open-source LLM options for local summarization by size, license, and hardware needs.",
      career:
        "Explain my local LLM project in resume bullets for an AI builder internship.",
    },
    miniProject: {
      title: "Private local notes assistant",
      difficulty: "Intermediate",
      estimatedTime: "2 hours",
      toolsNeeded: ["Ollama", "Node or Python", "Markdown notes"],
      skillsLearned: ["Local inference", "Prompt design", "Privacy tradeoffs"],
      portfolioValue: "High",
      steps: [
        "Install a local model.",
        "Create a summarization prompt.",
        "Build a small CLI or page.",
        "Test on two note files.",
        "Document privacy and limitations.",
      ],
      output: "A local notes assistant demo with README and screenshots.",
    },
    sourceType: "Mock",
    isSaved: false,
    isFeatured: false,
  },
  {
    id: "voice-narration-ai",
    title: "Voice AI makes narration and roleplay practice easy to prototype",
    toolName: "ElevenLabs, PlayAI, OpenAI audio",
    category: "Voice",
    summary:
      "Voice tools can create narration, language practice, customer roleplays, and accessible audio versions of content.",
    longExplanation:
      "The strongest use case for students is turning written work into audio practice or simulated conversation. Consent, voice rights, and disclosure matter, especially for cloned voices.",
    whyItMatters:
      "You can make a project feel much more real with a short narrated walkthrough or mock customer conversation.",
    tags: ["voice", "presentation", "accessibility", "student"],
    date: today,
    hypeScore: 7,
    usefulScore: 8,
    studentRelevanceScore: 7,
    difficulty: "Beginner",
    bestFor: ["Narrated demos", "Language practice", "Roleplay training"],
    access: {
      freeTier: true,
      studentDiscount: "Unknown",
      openSource: false,
      trialCredits: "Yes",
      apiAvailable: true,
      noCodeFriendly: true,
      waitlistRequired: false,
      paidOnly: false,
    },
    perks: ["Adds polish quickly", "Great for accessibility", "Useful for practice scenarios"],
    limitations: ["Voice rights matter", "Free minutes are limited", "May sound too polished"],
    tutorial: {
      title: "Add narration to a project demo",
      goal: "Create a voiceover that explains a prototype clearly.",
      estimatedTime: "20 min",
      difficulty: "Beginner",
      toolsNeeded: ["Voice AI tool", "Demo script", "Video editor"],
      steps: [
        "Write a 90-word demo script.",
        "Generate two voice variations.",
        "Choose the clearer version, not the flashiest.",
        "Sync the audio with your screen recording.",
      ],
      prompt:
        "Write a calm 90-word voiceover for this student project demo. Explain the problem, what the prototype does, and what the viewer should notice.",
      expectedOutput: "A natural demo narration track.",
      commonMistakes: ["Using too much jargon", "Choosing a voice without consent", "Speaking faster than the visuals"],
      nextStep: "Add captions and export the demo as a portfolio video.",
    },
    promptPack: {
      student:
        "Turn this class presentation into a clear 60-second narration script for audio practice.",
      coding:
        "Write a voiceover script that explains my app architecture to a non-technical judge.",
      marketing:
        "Create three voice ad scripts for this product: friendly, urgent, and premium.",
      design:
        "Suggest tone, pacing, and voice direction for an accessible product walkthrough.",
      research:
        "Compare voice AI tools for narration quality, free minutes, API access, and consent controls.",
      career:
        "Write a concise spoken intro for my portfolio demo video.",
    },
    miniProject: {
      title: "Narrated portfolio walkthrough",
      difficulty: "Beginner",
      estimatedTime: "45 min",
      toolsNeeded: ["Voice AI", "Screen recorder", "Video editor"],
      skillsLearned: ["Demo scripting", "Audio polish", "Storytelling"],
      portfolioValue: "Medium",
      steps: [
        "Pick one project.",
        "Write a 60-second script.",
        "Generate narration.",
        "Record the screen walkthrough.",
        "Export with captions.",
      ],
      output: "A narrated project walkthrough video.",
    },
    sourceType: "Mock",
    isSaved: false,
    isFeatured: false,
  },
  {
    id: "no-code-ai-workflows",
    title: "No-code AI workflows are becoming realistic mini backends",
    toolName: "n8n, Make, Zapier",
    category: "Workflow Automation",
    summary:
      "No-code automation tools can connect forms, AI calls, spreadsheets, and notifications into useful product workflows.",
    longExplanation:
      "For an MVP, a no-code workflow can behave like a small backend: take an input, enrich it with AI, store the result, and notify a user. It is less scalable than custom code but much faster to demo.",
    whyItMatters:
      "A solo student can ship a working automation without spending the whole hackathon on infrastructure.",
    tags: ["no-code", "automation", "business", "free tools"],
    date: today,
    hypeScore: 6,
    usefulScore: 9,
    studentRelevanceScore: 8,
    difficulty: "Beginner",
    bestFor: ["MVP workflows", "Ops dashboards", "Notification systems"],
    access: {
      freeTier: true,
      studentDiscount: "Unknown",
      openSource: true,
      trialCredits: "Yes",
      apiAvailable: true,
      noCodeFriendly: true,
      waitlistRequired: false,
      paidOnly: false,
    },
    perks: ["Fast to ship", "Connects many apps", "Visual debugging"],
    limitations: ["Rate limits", "Complex flows get messy", "Secrets need care"],
    tutorial: {
      title: "Build an AI form-to-summary workflow",
      goal: "Collect responses and generate useful summaries automatically.",
      estimatedTime: "40 min",
      difficulty: "Beginner",
      toolsNeeded: ["n8n or Make", "Google Form", "Spreadsheet", "AI API key"],
      steps: [
        "Create a form with one long-answer field.",
        "Trigger a workflow when a new row appears.",
        "Ask AI to summarize, tag, and suggest a next action.",
        "Write the result back to the sheet.",
      ],
      prompt:
        "Summarize this student feedback in one sentence, tag the main issue, and recommend one concrete next action. Return JSON with summary, tag, and action.",
      expectedOutput: "A spreadsheet that fills with AI summaries and next actions.",
      commonMistakes: ["Forgetting API key security", "No retry path", "Unclear output schema"],
      nextStep: "Add a notification when a high-priority tag appears.",
    },
    promptPack: {
      student:
        "Design a no-code workflow that turns survey responses into summaries and action items.",
      coding:
        "Translate this no-code workflow into API steps, data schema, and failure handling.",
      marketing:
        "Create an AI workflow that turns customer feedback into themes and campaign ideas.",
      design:
        "Map a simple workflow UI with input, processing, review, and output states.",
      research:
        "Compare n8n, Make, and Zapier for student AI workflow projects.",
      career:
        "Write a README section that explains my no-code AI automation as an operations project.",
    },
    miniProject: {
      title: "Feedback-to-action workflow",
      difficulty: "Beginner",
      estimatedTime: "90 min",
      toolsNeeded: ["Form", "Spreadsheet", "Automation tool", "AI API"],
      skillsLearned: ["Automation", "Data flow", "Prompted classification"],
      portfolioValue: "High",
      steps: [
        "Collect sample feedback.",
        "Build a trigger from the sheet.",
        "Generate summary, tag, and action.",
        "Store the result.",
        "Document the workflow with screenshots.",
      ],
      output: "A working no-code AI workflow and case-study README.",
    },
    sourceType: "Mock",
    isSaved: false,
    isFeatured: false,
  },
  {
    id: "ai-mockup-design-assistants",
    title: "AI design assistants are strongest at rough mockups and critique",
    toolName: "Figma AI, Uizard, Galileo",
    category: "Design",
    summary:
      "Design AI can speed up first drafts, UX critique, and component ideas, but still needs human product judgment.",
    longExplanation:
      "The best workflow is to use AI for divergent options, then refine one direction manually. It is especially useful for turning a text product idea into a first clickable screen.",
    whyItMatters:
      "Non-designers can get from idea to usable mockup fast enough to test the concept with real people.",
    tags: ["design", "mockups", "student", "portfolio"],
    date: today,
    hypeScore: 7,
    usefulScore: 8,
    studentRelevanceScore: 9,
    difficulty: "Beginner",
    bestFor: ["App mockups", "UX critique", "Hackathon demos"],
    access: {
      freeTier: true,
      studentDiscount: "Yes",
      openSource: false,
      trialCredits: "Yes",
      apiAvailable: false,
      noCodeFriendly: true,
      waitlistRequired: false,
      paidOnly: false,
    },
    perks: ["Fast first screens", "Useful critique", "Good for non-designers"],
    limitations: ["Generic components", "Can ignore edge cases", "Needs accessibility checks"],
    tutorial: {
      title: "Turn a feature idea into a mockup",
      goal: "Create a first screen you can test with users.",
      estimatedTime: "35 min",
      difficulty: "Beginner",
      toolsNeeded: ["Figma or Uizard", "Feature description", "Two user needs"],
      steps: [
        "Describe the user, task, and must-have controls.",
        "Generate two layout options.",
        "Pick the clearer one and simplify labels.",
        "Ask AI for three UX risks and fix one.",
      ],
      prompt:
        "Create a mobile app screen for a student AI Radar feed. Include category filters, a featured update, score bars, and action buttons. Prioritize scanability and thumb-friendly controls.",
      expectedOutput: "A rough mobile mockup ready for critique.",
      commonMistakes: ["Optimizing for beauty before clarity", "Too much copy", "No empty or loading state"],
      nextStep: "Test the mockup with one user and record what confused them.",
    },
    promptPack: {
      student:
        "Generate a simple mobile screen for this student app idea, with clear labels and one main action.",
      coding:
        "Turn this mockup into a component breakdown with props, state, and edge cases.",
      marketing:
        "Suggest landing-page sections for this app idea based on the mockup and target audience.",
      design:
        "Critique this screen for hierarchy, spacing, accessibility, and action clarity.",
      research:
        "List five user-testing questions for this AI-generated mockup.",
      career:
        "Describe this design process as a portfolio case study with problem, exploration, and decision.",
    },
    miniProject: {
      title: "AI mockup critique loop",
      difficulty: "Beginner",
      estimatedTime: "1 hour",
      toolsNeeded: ["Design AI", "Figma", "One user tester"],
      skillsLearned: ["UX critique", "Prototyping", "User testing"],
      portfolioValue: "Medium",
      steps: [
        "Generate two mockups.",
        "Pick one and critique it.",
        "Fix the top usability issue.",
        "Test with one user.",
        "Write what changed.",
      ],
      output: "Before/after mockups plus a short UX reflection.",
    },
    sourceType: "Mock",
    isSaved: false,
    isFeatured: false,
  },
  {
    id: "ai-analytics-business",
    title: "AI analytics tools can explain business data in plain English",
    toolName: "Julius, ChatGPT, Rows AI",
    category: "Business",
    summary:
      "Analytics assistants can turn CSVs into charts, plain-language insights, and next-step questions.",
    longExplanation:
      "AI analytics is strongest when the dataset is clean, the question is narrow, and outputs are checked. It can help students turn small datasets into business recommendations quickly.",
    whyItMatters:
      "You can produce a useful business insight report without being a data science expert.",
    tags: ["analytics", "business", "student", "spreadsheet"],
    date: today,
    hypeScore: 6,
    usefulScore: 9,
    studentRelevanceScore: 8,
    difficulty: "Beginner",
    bestFor: ["Class reports", "Startup metrics", "Market analysis"],
    access: {
      freeTier: true,
      studentDiscount: "Unknown",
      openSource: false,
      trialCredits: "Yes",
      apiAvailable: true,
      noCodeFriendly: true,
      waitlistRequired: false,
      paidOnly: false,
    },
    perks: ["Explains charts", "Finds patterns", "Good for business reports"],
    limitations: ["Bad data creates bad insights", "Can overclaim causality", "Needs manual checking"],
    tutorial: {
      title: "Analyze a small CSV with AI",
      goal: "Turn raw rows into three business insights.",
      estimatedTime: "30 min",
      difficulty: "Beginner",
      toolsNeeded: ["CSV", "AI analytics tool", "Spreadsheet"],
      steps: [
        "Upload a small dataset.",
        "Ask for data quality issues first.",
        "Generate three charts and explain each one.",
        "Write one recommended action per insight.",
      ],
      prompt:
        "Analyze this CSV for a business student. First flag data quality issues. Then produce three plain-language insights, one simple chart idea for each, and one recommended action.",
      expectedOutput: "A concise insight report with chart ideas and actions.",
      commonMistakes: ["Skipping data cleaning", "Confusing correlation with cause", "Using too many charts"],
      nextStep: "Add one slide that explains what decision the data supports.",
    },
    promptPack: {
      student:
        "Explain this dataset like I am preparing a class presentation, with three insights and one caveat.",
      coding:
        "Write Python or SQL steps to reproduce these AI-generated data insights.",
      marketing:
        "Turn these customer metrics into campaign recommendations and risks.",
      design:
        "Suggest the clearest chart type for each insight and explain why.",
      research:
        "List data quality checks I should run before trusting this analysis.",
      career:
        "Rewrite this analytics project as resume bullets for a business analyst internship.",
    },
    miniProject: {
      title: "AI mini analytics report",
      difficulty: "Beginner",
      estimatedTime: "1 hour",
      toolsNeeded: ["CSV", "AI analytics tool", "Slides"],
      skillsLearned: ["Data questioning", "Business insight", "Chart selection"],
      portfolioValue: "High",
      steps: [
        "Choose a small public dataset.",
        "Ask for quality checks.",
        "Generate three insights.",
        "Create three charts.",
        "Write a one-page recommendation.",
      ],
      output: "A mini analytics report with charts and recommendations.",
    },
    sourceType: "Mock",
    isSaved: false,
    isFeatured: false,
  },
  {
    id: "prompt-packs-practical",
    title: "Prompt packs are more useful when tied to a repeatable workflow",
    toolName: "ChatGPT, Claude, Gemini",
    category: "Productivity",
    summary:
      "Reusable prompt packs save time when they include role, input format, output format, and quality checks.",
    longExplanation:
      "The difference between a cute prompt and a useful prompt pack is repeatability. Good packs define the input, constrain the output, and include a check or next action.",
    whyItMatters:
      "Students can build a personal operating system for studying, career prep, writing, and projects.",
    tags: ["prompt packs", "student", "productivity", "free tools"],
    date: today,
    hypeScore: 5,
    usefulScore: 8,
    studentRelevanceScore: 9,
    difficulty: "Beginner",
    bestFor: ["Study workflows", "Writing", "Career prep"],
    access: {
      freeTier: true,
      studentDiscount: "Unknown",
      openSource: false,
      trialCredits: "Unknown",
      apiAvailable: true,
      noCodeFriendly: true,
      waitlistRequired: false,
      paidOnly: false,
    },
    perks: ["Easy to reuse", "Works across tools", "Great for habits"],
    limitations: ["Quality depends on inputs", "Can become generic", "Needs updating"],
    tutorial: {
      title: "Create your own six-prompt study pack",
      goal: "Build a reusable pack for one class or project.",
      estimatedTime: "25 min",
      difficulty: "Beginner",
      toolsNeeded: ["Any chat AI", "Class notes", "One target workflow"],
      steps: [
        "Pick one repeated task.",
        "Define the input and desired output.",
        "Write six prompts for different angles.",
        "Test on real notes and revise the weak prompts.",
      ],
      prompt:
        "Create a reusable prompt pack for [workflow]. Each prompt should specify the role, input format, output format, and one quality check.",
      expectedOutput: "A six-prompt pack you can reuse weekly.",
      commonMistakes: ["Vague inputs", "No output format", "Not testing on real material"],
      nextStep: "Save the best prompt in your notes app with a real example.",
    },
    promptPack: {
      student:
        "Turn this lecture into a study pack: summary, flashcards, practice questions, confusing points, memory hooks, and next actions.",
      coding:
        "Create a prompt pack for debugging: reproduce, diagnose, fix, test, explain, and document.",
      marketing:
        "Create a prompt pack for launching a student project across audience, positioning, hooks, content, objections, and metrics.",
      design:
        "Create a prompt pack for UI critique across hierarchy, clarity, accessibility, copy, spacing, and edge states.",
      research:
        "Create a prompt pack for reading papers across claim, method, limitations, comparison, questions, and project ideas.",
      career:
        "Create a prompt pack for job applications across role match, resume bullets, cover letter, recruiter message, interview stories, and follow-up.",
    },
    miniProject: {
      title: "Personal AI prompt operating system",
      difficulty: "Beginner",
      estimatedTime: "1 hour",
      toolsNeeded: ["Notes app", "Any chat AI"],
      skillsLearned: ["Workflow design", "Prompt testing", "Knowledge management"],
      portfolioValue: "Medium",
      steps: [
        "Choose one weekly task.",
        "Write six reusable prompts.",
        "Test each prompt.",
        "Create a small prompt library page.",
        "Share the workflow with a short explanation.",
      ],
      output: "A reusable prompt library with examples and quality checks.",
    },
    sourceType: "Mock",
    isSaved: false,
    isFeatured: false,
  },
] satisfies AIUpdate[];

export function getMockUpdates() {
  return mockUpdates.map((item) => ({ ...item, sourceType: "Mock" as const }));
}
