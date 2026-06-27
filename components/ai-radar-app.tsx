"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeCheck,
  Bell,
  Bookmark,
  Brain,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  Eye,
  FileText,
  GitCompare,
  Hammer,
  Loader2,
  MessageCircle,
  Play,
  Radar,
  RefreshCw,
  Rocket,
  Search,
  Send,
  Share2,
  Sparkles,
  Star,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import type { AIUpdate, ProjectStatus, RadarResponse, TabId } from "@/lib/types";
import {
  buildGithubReadme,
  buildLinkedInPost,
  filterChips,
  filterItems,
  formatDate,
  getAccessBadgeText,
  getHypeMessage,
  getProgressTotals,
  popularSearches,
  searchItems,
} from "@/lib/radar-utils";

const storageKeys = {
  savedIds: "ai-radar.savedIds",
  savedItems: "ai-radar.savedItems",
  projectStatuses: "ai-radar.projectStatuses",
  promptsCopied: "ai-radar.promptsCopied",
  streakDates: "ai-radar.streakDates",
};

const tabItems: Array<{ id: TabId; label: string; icon: LucideIcon }> = [
  { id: "radar", label: "Radar", icon: Radar },
  { id: "search", label: "Search", icon: Search },
  { id: "build", label: "Build", icon: Hammer },
];

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function mergeItems(...groups: AIUpdate[][]) {
  const map = new Map<string, AIUpdate>();
  groups.flat().forEach((item) => map.set(item.id, item));
  return Array.from(map.values());
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function SourcePill({ source }: { source: "live" | "mock" }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]",
        source === "live"
          ? "border-cyan-300/40 bg-cyan-300/15 text-cyan-100"
          : "border-fuchsia-300/30 bg-fuchsia-300/10 text-fuchsia-100",
      )}
    >
      <span className={cx("h-1.5 w-1.5 rounded-full", source === "live" ? "bg-cyan-300" : "bg-fuchsia-300")} />
      {source === "live" ? "Live Exa + OpenAI" : "Demo fallback"}
    </span>
  );
}

function Toast({ message }: { message: string | null }) {
  return (
    <AnimatePresence>
      {message ? (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-24 left-1/2 z-50 w-[min(390px,calc(100vw-32px))] -translate-x-1/2 rounded-2xl border border-white/15 bg-slate-950/90 px-4 py-3 text-sm font-medium text-white shadow-2xl shadow-cyan-950/40 backdrop-blur-xl"
        >
          {message}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function IconBadge({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.07] px-2.5 py-1 text-xs font-medium text-slate-200">
      <Icon className="h-3.5 w-3.5 text-cyan-200" />
      {children}
    </span>
  );
}

function FilterChips({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (filter: string) => void;
}) {
  return (
    <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 scrollbar-none">
      {filterChips.map((chip) => (
        <button
          key={chip}
          type="button"
          onClick={() => onSelect(chip)}
          className={cx(
            "h-10 shrink-0 rounded-full border px-4 text-sm font-semibold transition",
            active === chip
              ? "border-cyan-300/50 bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/25"
              : "border-white/10 bg-white/[0.06] text-slate-200 hover:border-white/25 hover:bg-white/[0.1]",
          )}
        >
          {chip}
        </button>
      ))}
    </div>
  );
}

function HypeScore({ item }: { item: AIUpdate }) {
  const scores = [
    { label: "Hype", value: item.hypeScore, color: "from-fuchsia-400 to-pink-400" },
    { label: "Useful", value: item.usefulScore, color: "from-cyan-300 to-blue-400" },
    { label: "Student", value: item.studentRelevanceScore, color: "from-lime-300 to-emerald-400" },
  ];

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/35 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Brain className="h-4 w-4 text-cyan-200" />
          Hype Filter
        </div>
        <span className="text-xs text-slate-400">{getHypeMessage(item)}</span>
      </div>
      <div className="space-y-2">
        {scores.map((score) => (
          <div key={score.label} className="grid grid-cols-[64px_1fr_34px] items-center gap-2 text-xs">
            <span className="font-medium text-slate-300">{score.label}</span>
            <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
              <div className={`h-full rounded-full bg-gradient-to-r ${score.color}`} style={{ width: `${score.value * 10}%` }} />
            </div>
            <span className="text-right font-bold text-white">{score.value}/10</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PerkBadges({ item, compact = false }: { item: AIUpdate; compact?: boolean }) {
  const badges = getAccessBadgeText(item);

  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.slice(0, compact ? 5 : badges.length).map((badge) => (
        <span
          key={badge.key}
          className={cx(
            "rounded-full border px-2 py-1 text-[11px] font-semibold",
            badge.active
              ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
              : "border-white/10 bg-white/[0.04] text-slate-400",
          )}
        >
          {badge.text}
        </span>
      ))}
    </div>
  );
}

function ActionButton({
  icon: Icon,
  children,
  onClick,
  active = false,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "flex h-10 min-w-0 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-bold transition",
        active
          ? "border-cyan-300/50 bg-cyan-300 text-slate-950"
          : "border-white/10 bg-white/[0.06] text-slate-100 hover:border-cyan-200/40 hover:bg-white/[0.1]",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{children}</span>
    </button>
  );
}

function RadarCard({
  item,
  featured = false,
  saved,
  onSave,
  onTutorial,
  onPromptPack,
  onProject,
  onShare,
  onDetails,
}: {
  item: AIUpdate;
  featured?: boolean;
  saved: boolean;
  onSave: (item: AIUpdate) => void;
  onTutorial: (item: AIUpdate) => void;
  onPromptPack: (item: AIUpdate) => void;
  onProject: (item: AIUpdate) => void;
  onShare: (item: AIUpdate) => void;
  onDetails: (item: AIUpdate) => void;
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      className={cx(
        "relative overflow-hidden rounded-[28px] border bg-white/[0.075] p-4 shadow-2xl shadow-black/25 backdrop-blur-xl",
        featured ? "border-cyan-200/30" : "border-white/10",
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/70 to-transparent" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-cyan-300 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-slate-950">
              {featured ? "Today's Pick" : item.category}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] font-semibold text-slate-300">
              {item.sourceType}
            </span>
          </div>
          <h3 className={cx("text-balance font-black leading-tight text-white", featured ? "text-2xl" : "text-xl")}>{item.title}</h3>
          <p className="text-sm leading-6 text-slate-300">{item.summary}</p>
        </div>
        <button
          type="button"
          title="View details"
          onClick={() => onDetails(item)}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-slate-200 transition hover:border-cyan-200/40 hover:text-white"
        >
          <Eye className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {item.tags.slice(0, 5).map((tag) => (
          <span key={tag} className="rounded-full bg-slate-950/40 px-2 py-1 text-[11px] font-medium text-slate-300">
            #{tag}
          </span>
        ))}
      </div>

      <div className="mt-4">
        <HypeScore item={item} />
      </div>

      <div className="mt-4 space-y-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
          <div className="mb-1 flex items-center gap-2 text-sm font-bold text-white">
            <Sparkles className="h-4 w-4 text-fuchsia-200" />
            Why it matters
          </div>
          <p className="text-sm leading-6 text-slate-300">{item.whyItMatters}</p>
        </div>
        <PerkBadges item={item} compact />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <ActionButton icon={Play} onClick={() => onTutorial(item)}>
          Try Tutorial
        </ActionButton>
        <ActionButton icon={Bookmark} onClick={() => onSave(item)} active={saved}>
          {saved ? "Saved" : "Save"}
        </ActionButton>
        <ActionButton icon={Copy} onClick={() => onPromptPack(item)}>
          Prompt Pack
        </ActionButton>
        <ActionButton icon={Rocket} onClick={() => onProject(item)}>
          Mini Project
        </ActionButton>
        <div className="col-span-2">
          <ActionButton icon={Share2} onClick={() => onShare(item)}>
            Share
          </ActionButton>
        </div>
      </div>
    </motion.article>
  );
}

function SearchResultCard({
  item,
  saved,
  compared,
  onDetails,
  onTutorial,
  onSave,
  onCompare,
}: {
  item: AIUpdate;
  saved: boolean;
  compared: boolean;
  onDetails: (item: AIUpdate) => void;
  onTutorial: (item: AIUpdate) => void;
  onSave: (item: AIUpdate) => void;
  onCompare: (item: AIUpdate) => void;
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-xl"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-cyan-200">{item.category}</p>
          <h3 className="mt-1 text-lg font-black leading-tight text-white">{item.toolName}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">{item.summary}</p>
        </div>
        <span className="rounded-full bg-white/[0.08] px-2.5 py-1 text-xs font-bold text-white">{item.studentRelevanceScore}/10</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <IconBadge icon={Zap}>{item.difficulty}</IconBadge>
        <IconBadge icon={Star}>{item.access.openSource ? "OSS" : item.access.freeTier ? "Free tier" : "Paid"}</IconBadge>
      </div>

      <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/30 p-3">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">Best for</p>
        <p className="mt-1 text-sm text-slate-200">{item.bestFor.join(", ")}</p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <ActionButton icon={Eye} onClick={() => onDetails(item)}>
          View Details
        </ActionButton>
        <ActionButton icon={Play} onClick={() => onTutorial(item)}>
          Tutorial
        </ActionButton>
        <ActionButton icon={Bookmark} onClick={() => onSave(item)} active={saved}>
          {saved ? "Saved" : "Save"}
        </ActionButton>
        <ActionButton icon={GitCompare} onClick={() => onCompare(item)} active={compared}>
          {compared ? "Selected" : "Compare"}
        </ActionButton>
      </div>
    </motion.article>
  );
}

function ModalShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 px-3 pb-3 backdrop-blur-sm sm:items-center sm:py-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          onClick={(event) => event.stopPropagation()}
          className="max-h-[88vh] w-full max-w-[430px] overflow-hidden rounded-[28px] border border-white/12 bg-slate-950/95 shadow-2xl shadow-black/50 backdrop-blur-2xl"
        >
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
            <h2 className="min-w-0 truncate text-lg font-black text-white">{title}</h2>
            <button
              type="button"
              title="Close"
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-slate-200 transition hover:bg-white/[0.12]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-[calc(88vh-72px)] overflow-y-auto px-5 py-5">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function DetailsModal({
  item,
  onClose,
  onTutorial,
  onPromptPack,
  onProject,
}: {
  item: AIUpdate;
  onClose: () => void;
  onTutorial: (item: AIUpdate) => void;
  onPromptPack: (item: AIUpdate) => void;
  onProject: (item: AIUpdate) => void;
}) {
  return (
    <ModalShell title={item.toolName} onClose={onClose}>
      <div className="space-y-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-cyan-200">{item.category}</p>
          <h3 className="mt-2 text-2xl font-black leading-tight text-white">{item.title}</h3>
          <p className="mt-3 text-sm leading-6 text-slate-300">{item.longExplanation}</p>
        </div>
        <HypeScore item={item} />
        <section className="space-y-2">
          <h4 className="text-sm font-black text-white">Perks</h4>
          <div className="flex flex-wrap gap-2">
            {item.perks.map((perk) => (
              <span key={perk} className="rounded-full border border-cyan-200/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                {perk}
              </span>
            ))}
          </div>
          <PerkBadges item={item} />
        </section>
        <section className="space-y-2">
          <h4 className="text-sm font-black text-white">Limitations</h4>
          <ul className="space-y-2">
            {item.limitations.map((limitation) => (
              <li key={limitation} className="flex gap-2 text-sm leading-6 text-slate-300">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-300" />
                {limitation}
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
          <h4 className="text-sm font-black text-white">{item.miniProject.title}</h4>
          <p className="mt-2 text-sm leading-6 text-slate-300">{item.miniProject.output}</p>
        </section>
        <div className="grid grid-cols-1 gap-2">
          <ActionButton icon={Play} onClick={() => onTutorial(item)}>
            Open Tutorial
          </ActionButton>
          <ActionButton icon={Copy} onClick={() => onPromptPack(item)}>
            Open Prompt Pack
          </ActionButton>
          <ActionButton icon={Rocket} onClick={() => onProject(item)}>
            Start Mini Project
          </ActionButton>
        </div>
      </div>
    </ModalShell>
  );
}

function TutorialModal({
  item,
  onClose,
  onCopy,
}: {
  item: AIUpdate;
  onClose: () => void;
  onCopy: (text: string) => void;
}) {
  return (
    <ModalShell title="Quick Tutorial" onClose={onClose}>
      <div className="space-y-5">
        <div>
          <h3 className="text-2xl font-black leading-tight text-white">{item.tutorial.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">{item.tutorial.goal}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <IconBadge icon={Zap}>{item.tutorial.estimatedTime}</IconBadge>
          <IconBadge icon={BadgeCheck}>{item.tutorial.difficulty}</IconBadge>
        </div>
        <section>
          <h4 className="mb-2 text-sm font-black text-white">Tools needed</h4>
          <div className="flex flex-wrap gap-2">
            {item.tutorial.toolsNeeded.map((tool) => (
              <span key={tool} className="rounded-full bg-white/[0.07] px-3 py-1 text-xs font-semibold text-slate-200">
                {tool}
              </span>
            ))}
          </div>
        </section>
        <section>
          <h4 className="mb-3 text-sm font-black text-white">Steps</h4>
          <ol className="space-y-3">
            {item.tutorial.steps.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm leading-6 text-slate-300">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-cyan-300 text-xs font-black text-slate-950">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </section>
        <section className="rounded-2xl border border-cyan-200/20 bg-cyan-300/10 p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h4 className="text-sm font-black text-white">Copyable prompt</h4>
            <button
              type="button"
              onClick={() => onCopy(item.tutorial.prompt)}
              className="inline-flex h-9 items-center gap-2 rounded-full bg-cyan-300 px-3 text-xs font-black text-slate-950"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy
            </button>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-6 text-cyan-50">{item.tutorial.prompt}</p>
        </section>
        <section className="space-y-2">
          <h4 className="text-sm font-black text-white">Expected output</h4>
          <p className="text-sm leading-6 text-slate-300">{item.tutorial.expectedOutput}</p>
        </section>
        <section className="space-y-2">
          <h4 className="text-sm font-black text-white">Common mistakes</h4>
          {item.tutorial.commonMistakes.map((mistake) => (
            <p key={mistake} className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-300">
              {mistake}
            </p>
          ))}
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
          <h4 className="text-sm font-black text-white">Next step</h4>
          <p className="mt-1 text-sm leading-6 text-slate-300">{item.tutorial.nextStep}</p>
        </section>
      </div>
    </ModalShell>
  );
}

function PromptPackModal({
  item,
  onClose,
  onCopy,
}: {
  item: AIUpdate;
  onClose: () => void;
  onCopy: (text: string) => void;
}) {
  const prompts = Object.entries(item.promptPack);

  return (
    <ModalShell title="Prompt Pack" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm leading-6 text-slate-300">Six reusable prompts for turning this update into actual work.</p>
        {prompts.map(([key, prompt]) => (
          <section key={key} className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="capitalize text-sm font-black text-white">{key}</h3>
              <button
                type="button"
                onClick={() => onCopy(prompt)}
                className="inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 text-xs font-bold text-white"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy
              </button>
            </div>
            <p className="text-sm leading-6 text-slate-300">{prompt}</p>
          </section>
        ))}
      </div>
    </ModalShell>
  );
}

function MiniProjectCard({
  item,
  status,
  onStart,
  onComplete,
  onExport,
}: {
  item: AIUpdate;
  status: ProjectStatus;
  onStart: (item: AIUpdate) => void;
  onComplete: (item: AIUpdate) => void;
  onExport: (item: AIUpdate, type: "linkedin" | "readme") => void;
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-cyan-200">{item.category}</p>
          <h3 className="mt-1 text-lg font-black leading-tight text-white">{item.miniProject.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">{item.miniProject.output}</p>
        </div>
        <span
          className={cx(
            "shrink-0 rounded-full px-2.5 py-1 text-xs font-bold",
            status === "Completed"
              ? "bg-emerald-300 text-slate-950"
              : status === "In Progress"
                ? "bg-cyan-300 text-slate-950"
                : "bg-white/[0.08] text-slate-200",
          )}
        >
          {status}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <IconBadge icon={Zap}>{item.miniProject.difficulty}</IconBadge>
        <IconBadge icon={Trophy}>{item.miniProject.portfolioValue} value</IconBadge>
      </div>
      <div className="mt-4 space-y-2">
        {item.miniProject.steps.slice(0, 3).map((step, index) => (
          <div key={step} className="flex gap-2 text-sm text-slate-300">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/[0.08] text-[11px] font-bold text-cyan-100">
              {index + 1}
            </span>
            {step}
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <ActionButton icon={Rocket} onClick={() => onStart(item)} active={status === "In Progress"}>
          {status === "Not Started" ? "Start Project" : "Continue"}
        </ActionButton>
        <ActionButton icon={CheckCircle2} onClick={() => onComplete(item)} active={status === "Completed"}>
          Mark Complete
        </ActionButton>
        <ActionButton icon={Send} onClick={() => onExport(item, "linkedin")}>
          LinkedIn
        </ActionButton>
        <ActionButton icon={FileText} onClick={() => onExport(item, "readme")}>
          README
        </ActionButton>
      </div>
    </article>
  );
}

function ExportModal({
  title,
  content,
  onClose,
  onCopy,
}: {
  title: string;
  content: string;
  onClose: () => void;
  onCopy: (text: string) => void;
}) {
  return (
    <ModalShell title={title} onClose={onClose}>
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => onCopy(content)}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-4 text-sm font-black text-slate-950"
        >
          <Copy className="h-4 w-4" />
          Copy Export
        </button>
        <pre className="max-h-[52vh] overflow-auto whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/40 p-4 text-sm leading-6 text-slate-200">
          {content}
        </pre>
      </div>
    </ModalShell>
  );
}

function CompareModal({
  items,
  onClose,
}: {
  items: AIUpdate[];
  onClose: () => void;
}) {
  return (
    <ModalShell title="Compare AI Updates" onClose={onClose}>
      <div className="space-y-4">
        {items.map((item) => (
          <article key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-black text-white">{item.toolName}</h3>
                <p className="mt-1 text-sm text-slate-300">{item.bestFor.join(", ")}</p>
              </div>
              <span className="rounded-full bg-cyan-300 px-2 py-1 text-xs font-black text-slate-950">{item.studentRelevanceScore}/10</span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">Free tier</dt>
                <dd className="mt-1 text-slate-200">{item.access.freeTier ? "Yes" : "No"}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">Difficulty</dt>
                <dd className="mt-1 text-slate-200">{item.difficulty}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">Main perk</dt>
                <dd className="mt-1 text-slate-200">{item.perks[0]}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">Limitation</dt>
                <dd className="mt-1 text-slate-200">{item.limitations[0]}</dd>
              </div>
            </dl>
            <p className="mt-4 rounded-2xl border border-white/10 bg-slate-950/30 p-3 text-sm leading-6 text-slate-300">
              Suggested use: {item.miniProject.title}
            </p>
          </article>
        ))}
      </div>
    </ModalShell>
  );
}

function AskModal({
  items,
  onClose,
  onToast,
}: {
  items: AIUpdate[];
  onClose: () => void;
  onToast: (message: string) => void;
}) {
  const [question, setQuestion] = useState("What should I try today as a student builder?");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function ask() {
    setLoading(true);
    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, items }),
      });
      const data = (await response.json()) as { answer?: string; source?: "live" | "mock" };
      setAnswer(data.answer ?? "Radar could not answer that yet.");
      onToast(data.source === "live" ? "Ask Radar used OpenAI" : "Ask Radar used local fallback");
    } catch {
      setAnswer("Radar could not connect. Try asking from the Search page results.");
      onToast("Ask Radar fallback shown");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalShell title="Ask Radar" onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-3">
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            rows={3}
            className="w-full resize-none bg-transparent text-sm leading-6 text-white outline-none placeholder:text-slate-500"
            placeholder="Ask about tools, projects, prompts, or what to try next..."
          />
        </div>
        <button
          type="button"
          onClick={ask}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-4 text-sm font-black text-slate-950"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Ask
        </button>
        {answer ? <p className="whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-slate-200">{answer}</p> : null}
      </div>
    </ModalShell>
  );
}

function ProgressBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-200">{label}</span>
        <span className="font-black text-white">{value}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-lime-300" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function AIRadarApp() {
  const [activeTab, setActiveTab] = useState<TabId>("radar");
  const [items, setItems] = useState<AIUpdate[]>([]);
  const [feedSource, setFeedSource] = useState<"live" | "mock">("mock");
  const [feedMessage, setFeedMessage] = useState("Loading AI Radar...");
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [radarFilter, setRadarFilter] = useState("All");
  const [searchFilter, setSearchFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AIUpdate[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [savedItems, setSavedItems] = useState<Record<string, AIUpdate>>({});
  const [projectStatuses, setProjectStatuses] = useState<Record<string, ProjectStatus>>({});
  const [promptsCopied, setPromptsCopied] = useState(0);
  const [streakDates, setStreakDates] = useState<string[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [detailsItem, setDetailsItem] = useState<AIUpdate | null>(null);
  const [tutorialItem, setTutorialItem] = useState<AIUpdate | null>(null);
  const [promptItem, setPromptItem] = useState<AIUpdate | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [exportData, setExportData] = useState<{ title: string; content: string } | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setSavedIds(readStorage<string[]>(storageKeys.savedIds, []));
      setSavedItems(readStorage<Record<string, AIUpdate>>(storageKeys.savedItems, {}));
      setProjectStatuses(readStorage<Record<string, ProjectStatus>>(storageKeys.projectStatuses, {}));
      setPromptsCopied(readStorage<number>(storageKeys.promptsCopied, 0));
      setStreakDates(readStorage<string[]>(storageKeys.streakDates, []));
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadFeed() {
      setLoadingFeed(true);
      try {
        const response = await fetch("/api/radar", { cache: "no-store" });
        const data = (await response.json()) as RadarResponse;
        if (!cancelled) {
          setItems(data.items);
          setFeedSource(data.source);
          setFeedMessage(data.message);
        }
      } catch {
        if (!cancelled) {
          setFeedMessage("Could not refresh the feed. Try again from the button below.");
        }
      } finally {
        if (!cancelled) setLoadingFeed(false);
      }
    }

    loadFeed();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => writeStorage(storageKeys.savedIds, savedIds), [savedIds]);
  useEffect(() => writeStorage(storageKeys.savedItems, savedItems), [savedItems]);
  useEffect(() => writeStorage(storageKeys.projectStatuses, projectStatuses), [projectStatuses]);
  useEffect(() => writeStorage(storageKeys.promptsCopied, promptsCopied), [promptsCopied]);
  useEffect(() => writeStorage(storageKeys.streakDates, streakDates), [streakDates]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = (await response.json()) as RadarResponse;
        setSearchResults(data.items);
      } catch {
        if (!controller.signal.aborted) {
          setSearchResults(searchItems(items, query));
        }
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 360);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [items, searchQuery]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const allItems = useMemo(() => mergeItems(items, searchResults ?? [], Object.values(savedItems)), [items, savedItems, searchResults]);
  const itemMap = useMemo(() => new Map(allItems.map((item) => [item.id, item])), [allItems]);
  const filteredRadarItems = useMemo(() => filterItems(items, radarFilter), [items, radarFilter]);
  const featuredItem = filteredRadarItems.find((item) => item.isFeatured) ?? filteredRadarItems[0];
  const feedItems = filteredRadarItems.filter((item) => item.id !== featuredItem?.id);
  const localSearchResults = useMemo(
    () => searchItems(filterItems(items, searchFilter), searchQuery),
    [items, searchFilter, searchQuery],
  );
  const visibleSearchResults = useMemo(() => {
    const base = searchQuery.trim().length >= 2 && searchResults ? searchResults : localSearchResults;
    return filterItems(base, searchFilter);
  }, [localSearchResults, searchFilter, searchQuery, searchResults]);
  const savedTutorials = savedIds.map((id) => itemMap.get(id)).filter((item): item is AIUpdate => Boolean(item));
  const projectItems = Object.keys(projectStatuses)
    .map((id) => itemMap.get(id))
    .filter((item): item is AIUpdate => Boolean(item));
  const buildItems = mergeItems(savedTutorials, projectItems);
  const compareItems = compareIds.map((id) => itemMap.get(id)).filter((item): item is AIUpdate => Boolean(item));
  const progress = getProgressTotals(allItems, savedIds, projectStatuses, promptsCopied);
  const streak = streakDates.length;

  function showToast(message: string) {
    setToast(message);
  }

  function rememberItem(item: AIUpdate) {
    setSavedItems((current) => ({ ...current, [item.id]: item }));
  }

  function saveItem(item: AIUpdate) {
    rememberItem(item);
    setSavedIds((current) => (current.includes(item.id) ? current : [...current, item.id]));
    showToast("Saved to Build");
  }

  async function copyText(text: string, message = "Prompt copied") {
    try {
      await navigator.clipboard.writeText(text);
      setPromptsCopied((count) => count + 1);
      showToast(message);
    } catch {
      showToast("Copy failed. Select the text manually.");
    }
  }

  function startProject(item: AIUpdate) {
    rememberItem(item);
    setProjectStatuses((current) => ({ ...current, [item.id]: "In Progress" }));
    setActiveTab("build");
    showToast("Mini project started");
  }

  function completeProject(item: AIUpdate) {
    rememberItem(item);
    const today = new Date().toISOString().slice(0, 10);
    setProjectStatuses((current) => ({ ...current, [item.id]: "Completed" }));
    setStreakDates((current) => (current.includes(today) ? current : [...current, today].slice(-7)));
    showToast("Project marked complete");
  }

  async function shareItem(item: AIUpdate) {
    const text = `${item.title}\n${item.whyItMatters}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: item.title, text, url: item.sourceUrl });
        showToast("Share sheet opened");
      } else {
        await navigator.clipboard.writeText(text);
        showToast("Share text copied");
      }
    } catch {
      showToast("Share cancelled");
    }
  }

  function toggleCompare(item: AIUpdate) {
    rememberItem(item);
    setCompareIds((current) => {
      if (current.includes(item.id)) return current.filter((id) => id !== item.id);
      return [...current, item.id].slice(-4);
    });
  }

  function openCompare() {
    if (compareItems.length < 2) {
      showToast("Select at least two items to compare");
      return;
    }
    setCompareOpen(true);
  }

  function openExport(item: AIUpdate, type: "linkedin" | "readme") {
    rememberItem(item);
    const status = projectStatuses[item.id] ?? "Not Started";
    const content = type === "linkedin" ? buildLinkedInPost(item) : buildGithubReadme(item, status);
    setExportData({
      title: type === "linkedin" ? "LinkedIn Post" : "GitHub README",
      content,
    });
  }

  function exportFromBuild(type: "linkedin" | "readme") {
    const completed = buildItems.find((item) => projectStatuses[item.id] === "Completed");
    const fallback = buildItems[0] ?? featuredItem ?? items[0];

    if (!fallback) {
      showToast("Save or start a project first");
      return;
    }

    if (!completed) showToast("Using your first saved item. Complete a project for a stronger export.");
    openExport(completed ?? fallback, type);
  }

  function handleSearchInput(value: string) {
    setSearchQuery(value);
    if (value.trim().length < 2) {
      setSearchResults(null);
      setSearching(false);
    }
  }

  async function refreshFeed() {
    setLoadingFeed(true);
    try {
      const response = await fetch("/api/radar", { cache: "no-store" });
      const data = (await response.json()) as RadarResponse;
      setItems(data.items);
      setFeedSource(data.source);
      setFeedMessage(data.message);
      showToast(data.source === "live" ? "Live radar refreshed" : "Demo radar refreshed");
    } catch {
      showToast("Feed refresh failed");
    } finally {
      setLoadingFeed(false);
    }
  }

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.2),transparent_30%),radial-gradient(circle_at_100%_15%,rgba(236,72,153,0.16),transparent_28%),linear-gradient(160deg,#020617_0%,#06071a_52%,#0f1028_100%)] text-white">
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col border-x border-white/10 bg-slate-950/30 shadow-2xl shadow-black/40">
        <main className="flex-1 px-5 pb-28 pt-5">
          {activeTab === "radar" ? (
            <section className="space-y-5">
              <header className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-cyan-200">{formatDate(new Date().toISOString().slice(0, 10))}</p>
                    <h1 className="mt-1 text-3xl font-black tracking-tight text-white">Today&apos;s AI Radar</h1>
                    <p className="mt-2 max-w-[21rem] text-sm leading-6 text-slate-300">
                      Fresh AI updates turned into tutorials, prompts, and mini projects.
                    </p>
                  </div>
                  <button
                    type="button"
                    title="Notifications"
                    onClick={() => showToast("Daily radar notifications are ready for the Zo scheduler stretch.")}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.07] text-cyan-100"
                  >
                    <Bell className="h-5 w-5" />
                  </button>
                </div>
                <div className="rounded-[28px] border border-white/10 bg-white/[0.065] p-4 backdrop-blur-xl">
                  <div className="flex items-center justify-between gap-3">
                    <SourcePill source={feedSource} />
                    <button
                      type="button"
                      title="Refresh feed"
                      onClick={refreshFeed}
                      className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.07] text-slate-200"
                    >
                      {loadingFeed ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{feedMessage}</p>
                  <p className="mt-3 text-sm font-semibold text-white">Stop doomscrolling AI news. Start building with it.</p>
                </div>
                <FilterChips active={radarFilter} onSelect={setRadarFilter} />
              </header>

              {loadingFeed && items.length === 0 ? (
                <div className="grid min-h-[320px] place-items-center rounded-[28px] border border-white/10 bg-white/[0.05]">
                  <Loader2 className="h-8 w-8 animate-spin text-cyan-200" />
                </div>
              ) : featuredItem ? (
                <div className="space-y-4">
                  <RadarCard
                    item={featuredItem}
                    featured
                    saved={savedIds.includes(featuredItem.id)}
                    onSave={saveItem}
                    onTutorial={setTutorialItem}
                    onPromptPack={setPromptItem}
                    onProject={startProject}
                    onShare={shareItem}
                    onDetails={setDetailsItem}
                  />
                  <div className="space-y-4">
                    {feedItems.map((item) => (
                      <RadarCard
                        key={item.id}
                        item={item}
                        saved={savedIds.includes(item.id)}
                        onSave={saveItem}
                        onTutorial={setTutorialItem}
                        onPromptPack={setPromptItem}
                        onProject={startProject}
                        onShare={shareItem}
                        onDetails={setDetailsItem}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6 text-center text-sm text-slate-300">
                  No matching updates for this filter yet.
                </div>
              )}
            </section>
          ) : null}

          {activeTab === "search" ? (
            <section className="space-y-5">
              <header className="space-y-4">
                <div>
                  <h1 className="text-3xl font-black tracking-tight">Search AI Radar</h1>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Find AI tools, updates, tutorials, prompts, and student-friendly perks.
                  </p>
                </div>
                <label className="flex h-14 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.075] px-4 backdrop-blur-xl">
                  <Search className="h-5 w-5 shrink-0 text-cyan-200" />
                  <input
                    value={searchQuery}
                    onChange={(event) => handleSearchInput(event.target.value)}
                    placeholder="Search presentations, coding, video, free tools..."
                    className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-slate-500"
                  />
                  {searching ? <Loader2 className="h-4 w-4 animate-spin text-cyan-200" /> : null}
                </label>
                <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 scrollbar-none">
                  {popularSearches.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setSearchQuery(chip)}
                      className="h-9 shrink-0 rounded-full border border-white/10 bg-white/[0.06] px-3 text-xs font-bold text-slate-200"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
                <FilterChips active={searchFilter} onSelect={setSearchFilter} />
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-400">{visibleSearchResults.length} results</p>
                  <button
                    type="button"
                    onClick={openCompare}
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-4 text-sm font-bold text-white"
                  >
                    <GitCompare className="h-4 w-4" />
                    Compare {compareIds.length ? `(${compareIds.length})` : ""}
                  </button>
                </div>
              </header>

              {visibleSearchResults.length ? (
                <div className="space-y-4">
                  {visibleSearchResults.map((item) => (
                    <SearchResultCard
                      key={item.id}
                      item={item}
                      saved={savedIds.includes(item.id)}
                      compared={compareIds.includes(item.id)}
                      onDetails={setDetailsItem}
                      onTutorial={setTutorialItem}
                      onSave={saveItem}
                      onCompare={toggleCompare}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6 text-center">
                  <Search className="mx-auto h-8 w-8 text-cyan-200" />
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    No matching AI updates found. Try searching for &quot;presentation&quot;, &quot;coding&quot;, &quot;video&quot;, or
                    &quot;free tools&quot;.
                  </p>
                </div>
              )}
            </section>
          ) : null}

          {activeTab === "build" ? (
            <section className="space-y-5">
              <header>
                <h1 className="text-3xl font-black tracking-tight">Build</h1>
                <p className="mt-2 text-sm leading-6 text-slate-300">Turn AI updates into proof of work.</p>
              </header>

              <section className="rounded-[28px] border border-white/10 bg-white/[0.07] p-4 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black text-white">Portfolio Progress</h2>
                    <p className="mt-1 text-sm text-slate-400">Every AI update becomes something you can try, build, and show.</p>
                  </div>
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-cyan-300 text-slate-950">
                    <Trophy className="h-7 w-7" />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {[
                    ["Projects", progress.completedProjects],
                    ["Tutorials", progress.tutorialsCompleted],
                    ["Prompts", progress.promptsCopied],
                    ["Saved", progress.savedTools],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/30 p-3">
                      <p className="text-2xl font-black text-white">{value}</p>
                      <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">{label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-4">
                  <ProgressBar label="Portfolio readiness" value={progress.portfolioScore} />
                  <ProgressBar label="Weekly progress" value={progress.weeklyProgress} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <IconBadge icon={Zap}>{streak || 0} day streak</IconBadge>
                  <IconBadge icon={Check}>{progress.activeProjects} active projects</IconBadge>
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-black text-white">Export Actions</h2>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <ActionButton icon={Send} onClick={() => exportFromBuild("linkedin")}>
                    Generate LinkedIn post
                  </ActionButton>
                  <ActionButton icon={FileText} onClick={() => exportFromBuild("readme")}>
                    Generate GitHub README
                  </ActionButton>
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-black text-white">Saved Tutorials</h2>
                {savedTutorials.length ? (
                  <div className="space-y-3">
                    {savedTutorials.map((item) => (
                      <article key={item.id} className="rounded-3xl border border-white/10 bg-white/[0.065] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.1em] text-cyan-200">{item.category}</p>
                            <h3 className="mt-1 font-black leading-tight text-white">{item.tutorial.title}</h3>
                            <p className="mt-2 text-sm text-slate-400">
                              {item.difficulty} · {item.tutorial.estimatedTime}
                            </p>
                          </div>
                          <span className="rounded-full bg-white/[0.08] px-2.5 py-1 text-xs font-bold text-slate-200">
                            {projectStatuses[item.id] ?? "Saved"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setTutorialItem(item)}
                          className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.07] text-sm font-bold text-white"
                        >
                          Continue
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 text-sm leading-6 text-slate-300">
                    Save a Radar card or Search result and it will appear here.
                  </div>
                )}
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-black text-white">Mini Projects</h2>
                {buildItems.length ? (
                  <div className="space-y-4">
                    {buildItems.map((item) => (
                      <MiniProjectCard
                        key={item.id}
                        item={item}
                        status={projectStatuses[item.id] ?? "Not Started"}
                        onStart={startProject}
                        onComplete={completeProject}
                        onExport={openExport}
                      />
                    ))}
                  </div>
                ) : (
                  <article className="rounded-[28px] border border-cyan-200/20 bg-cyan-300/10 p-5">
                    <div className="flex items-center gap-3">
                      <Rocket className="h-6 w-6 text-cyan-100" />
                      <h3 className="font-black text-white">Weekly Challenge</h3>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-200">
                      Save today&apos;s pick, start the mini project, and export the README after you complete it.
                    </p>
                  </article>
                )}
              </section>
            </section>
          ) : null}
        </main>

        <button
          type="button"
          title="Ask Radar"
          onClick={() => setAskOpen(true)}
          className="fixed bottom-24 left-[calc(50%+150px)] z-30 hidden h-12 w-12 -translate-x-1/2 place-items-center rounded-full bg-fuchsia-300 text-slate-950 shadow-xl shadow-fuchsia-950/40 sm:grid"
        >
          <MessageCircle className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => setAskOpen(true)}
          className="fixed bottom-24 right-4 z-30 grid h-12 w-12 place-items-center rounded-full bg-fuchsia-300 text-slate-950 shadow-xl shadow-fuchsia-950/40 sm:hidden"
          title="Ask Radar"
        >
          <MessageCircle className="h-5 w-5" />
        </button>

        <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2 border-t border-white/10 bg-slate-950/85 px-5 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 backdrop-blur-2xl">
          <div className="grid grid-cols-3 gap-2">
            {tabItems.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cx(
                    "flex h-14 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-black transition",
                    active ? "bg-cyan-300 text-slate-950" : "bg-white/[0.06] text-slate-300 hover:bg-white/[0.1]",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      <Toast message={toast} />

      {detailsItem ? (
        <DetailsModal
          item={detailsItem}
          onClose={() => setDetailsItem(null)}
          onTutorial={(item) => {
            setDetailsItem(null);
            setTutorialItem(item);
          }}
          onPromptPack={(item) => {
            setDetailsItem(null);
            setPromptItem(item);
          }}
          onProject={(item) => {
            setDetailsItem(null);
            startProject(item);
          }}
        />
      ) : null}

      {tutorialItem ? (
        <TutorialModal item={tutorialItem} onClose={() => setTutorialItem(null)} onCopy={(text) => copyText(text, "Prompt copied")} />
      ) : null}

      {promptItem ? (
        <PromptPackModal item={promptItem} onClose={() => setPromptItem(null)} onCopy={(text) => copyText(text, "Prompt copied")} />
      ) : null}

      {compareOpen ? <CompareModal items={compareItems} onClose={() => setCompareOpen(false)} /> : null}

      {askOpen ? <AskModal items={allItems} onClose={() => setAskOpen(false)} onToast={showToast} /> : null}

      {exportData ? (
        <ExportModal
          title={exportData.title}
          content={exportData.content}
          onClose={() => setExportData(null)}
          onCopy={(text) => copyText(text, "Export copied")}
        />
      ) : null}
    </div>
  );
}
