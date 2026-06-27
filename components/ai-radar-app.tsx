"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeCheck,
  Bell,
  Bookmark,
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
import { useCallback, useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import type { AIUpdate, ProjectStatus, RadarResponse, TabId, UserPreferences } from "@/lib/types";
import {
  buildGithubReadme,
  buildLinkedInPost,
  filterChips,
  filterItems,
  formatDate,
  getAccessBadgeText,
  getProgressTotals,
  popularSearches,
  searchItems,
} from "@/lib/radar-utils";

const storageKeys = {
  clientId: "ai-radar.clientId",
  preferences: "ai-radar.preferences",
  savedIds: "ai-radar.savedIds",
  savedItems: "ai-radar.savedItems",
  projectStatuses: "ai-radar.projectStatuses",
  promptsCopied: "ai-radar.promptsCopied",
  streakDates: "ai-radar.streakDates",
};

const tabItems: Array<{ id: TabId; label: string; icon: LucideIcon }> = [
  { id: "radar", label: "Radar", icon: Radar },
  { id: "search", label: "Search", icon: Search },
  { id: "saved", label: "Saved", icon: Bookmark },
  { id: "build", label: "Launchpad", icon: Hammer },
  { id: "preferences", label: "Preferences", icon: Sparkles },
];

const defaultPreferences: UserPreferences = {
  audience: "Student",
  interests: ["coding", "productivity", "portfolio"],
  difficulty: "Any",
  access: "Any",
};

const preferenceInterestOptions = [
  "coding",
  "ui/ux",
  "design",
  "research",
  "presentations",
  "video",
  "marketing",
  "automation",
  "portfolio",
  "free tools",
];

const launchpadStatuses: ProjectStatus[] = [
  "Not signed up",
  "Trial started",
  "Tried",
  "Locked",
  "Save for later",
  "In Progress",
  "Completed",
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

function getOrCreateClientId() {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem(storageKeys.clientId);
  if (existing) return existing;

  const id =
    typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem(storageKeys.clientId, id);
  return id;
}

function mergeItems(...groups: AIUpdate[][]) {
  const map = new Map<string, AIUpdate>();
  groups.flat().forEach((item) => map.set(item.id, item));
  return Array.from(map.values());
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function RadarLogo() {
  return (
    <div className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-600/30">
      <svg viewBox="0 0 40 40" className="h-6 w-6" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="17" stroke="white" strokeWidth="2" strokeOpacity="0.3" />
        <circle cx="20" cy="20" r="11" stroke="white" strokeWidth="2" strokeOpacity="0.55" />
        <circle cx="20" cy="20" r="4.5" fill="white" />
        <line x1="20" y1="20" x2="32.5" y2="8.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function SourcePill({ source }: { source: "live" | "mock" }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]",
        source === "live"
          ? "border-violet-400/40 bg-violet-400/15 text-violet-200"
          : "border-indigo-400/30 bg-indigo-400/10 text-indigo-300",
      )}
    >
      <span className={cx("h-1.5 w-1.5 rounded-full", source === "live" ? "bg-violet-400" : "bg-indigo-400")} />
      {source === "live" ? "Live / Stored" : "No live data"}
    </span>
  );
}

function SourceLink({ item }: { item: AIUpdate }) {
  if (!item.sourceUrl) return null;

  return (
    <a
      href={item.sourceUrl}
      target="_blank"
      rel="noreferrer"
      className="inline-flex min-w-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-bold text-violet-100 transition hover:border-violet-300/40 hover:bg-violet-500/15"
    >
      <span className="truncate">Original source</span>
      <ChevronRight className="h-3.5 w-3.5 shrink-0" />
    </a>
  );
}

function accessLabel(item: AIUpdate) {
  if (item.access.waitlistRequired) return "Waitlist";
  if (item.access.paidOnly) return "Paid / Pro-only";
  if (item.access.freeTier) return "Free tier";
  if (item.access.trialCredits === "Yes") return "Trial credits";
  if (item.access.apiAvailable && !item.access.noCodeFriendly) return "API setup";
  return "Access unclear";
}

function Toast({ message }: { message: string | null }) {
  return (
    <AnimatePresence>
      {message ? (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-6 left-1/2 z-50 w-[min(440px,calc(100vw-32px))] -translate-x-1/2 rounded-2xl border border-violet-400/20 bg-[#0d0b1e]/95 px-4 py-3 text-sm font-medium text-white shadow-2xl shadow-violet-950/50 backdrop-blur-xl"
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
      <Icon className="h-3.5 w-3.5 text-violet-300" />
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
    <div className="flex flex-wrap gap-2 pb-1">
      {filterChips.map((chip) => (
        <button
          key={chip}
          type="button"
          onClick={() => onSelect(chip)}
          className={cx(
            "h-10 shrink-0 rounded-full border px-4 text-sm font-semibold transition",
            active === chip
              ? "border-violet-400/50 bg-violet-500 text-white shadow-lg shadow-violet-500/25"
              : "border-white/10 bg-white/[0.06] text-slate-200 hover:border-white/25 hover:bg-white/[0.1]",
          )}
        >
          {chip}
        </button>
      ))}
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
          ? "border-violet-400/50 bg-violet-500 text-white shadow-md shadow-violet-500/20"
          : "border-white/10 bg-white/[0.06] text-slate-100 hover:border-violet-400/30 hover:bg-white/[0.1]",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{children}</span>
    </button>
  );
}

function RadarCard({
  item,
  saved,
  onSave,
  onTutorial,
  onCopyPrompt,
  onShare,
  onDetails,
}: {
  item: AIUpdate;
  saved: boolean;
  onSave: (item: AIUpdate) => void;
  onTutorial: (item: AIUpdate) => void;
  onCopyPrompt: (text: string, message?: string, postId?: string) => void;
  onShare: (item: AIUpdate) => void;
  onDetails: (item: AIUpdate) => void;
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-[18px] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/25 backdrop-blur-xl"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/60 to-transparent" />
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-white shadow-sm shadow-violet-500/30">
              {item.category}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] font-semibold text-slate-300">
              {item.sourceType}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] font-semibold text-slate-300">
              {item.difficulty}
            </span>
            <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-100">
              {accessLabel(item)}
            </span>
          </div>
          <SourceLink item={item} />
        </div>

        <div>
          <p className="text-sm font-bold text-violet-200">{item.toolName}</p>
          <h3 className="mt-2 text-2xl font-black leading-tight text-white">{item.title}</h3>
          <p className="mt-3 text-base leading-7 text-slate-200">{item.summary}</p>
        </div>

        <section className="rounded-2xl border border-white/10 bg-[#0b0917]/35 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-black text-white">
            <Sparkles className="h-4 w-4 text-violet-300" />
            What is new
          </div>
          <p className="text-sm leading-6 text-slate-300">{item.longExplanation}</p>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <h4 className="text-sm font-black text-white">Why students/builders should care</h4>
            <p className="mt-2 text-sm leading-6 text-slate-300">{item.whyItMatters}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <h4 className="text-sm font-black text-white">Try this in {item.tutorial.estimatedTime}</h4>
            <p className="mt-2 text-sm leading-6 text-slate-300">{item.tutorial.goal}</p>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">Actually useful</p>
            <p className="mt-1 text-2xl font-black text-white">{item.usefulScore}/10</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">Student fit</p>
            <p className="mt-1 text-2xl font-black text-white">{item.studentRelevanceScore}/10</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">Access</p>
            <p className="mt-1 text-sm font-black leading-6 text-white">{accessLabel(item)}</p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <h4 className="text-sm font-black text-white">Quick setup path</h4>
          <ol className="mt-3 space-y-2">
            {item.tutorial.steps.slice(0, 4).map((step, index) => (
              <li key={step} className="flex gap-3 text-sm leading-6 text-slate-300">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-violet-500 text-xs font-black text-white">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </section>

        <div className="flex flex-wrap gap-1.5">
          {item.tags.slice(0, 6).map((tag) => (
            <span key={tag} className="rounded-full bg-white/[0.06] px-2 py-1 text-[11px] font-medium text-slate-400">
              #{tag}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
          <ActionButton icon={Eye} onClick={() => onDetails(item)}>
            Read Details
          </ActionButton>
          <ActionButton icon={Play} onClick={() => onTutorial(item)}>
            Try Tutorial
          </ActionButton>
          <ActionButton icon={Copy} onClick={() => onCopyPrompt(item.tutorial.prompt, "Starter prompt copied", item.id)}>
            Copy Prompt
          </ActionButton>
          <ActionButton icon={Bookmark} onClick={() => onSave(item)} active={saved}>
            {saved ? "Unsave" : "Launchpad"}
          </ActionButton>
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
      className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-violet-300">{item.category}</p>
          <h3 className="mt-1 text-lg font-black leading-tight text-white">{item.toolName}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">{item.summary}</p>
        </div>
        <span className="rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
          {item.studentRelevanceScore}/10
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <IconBadge icon={Zap}>{item.difficulty}</IconBadge>
        <IconBadge icon={Star}>{item.access.openSource ? "OSS" : item.access.freeTier ? "Free tier" : "Paid"}</IconBadge>
      </div>

      <div className="mt-3 rounded-2xl border border-white/10 bg-[#0b0917]/40 p-3">
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
          {saved ? "Unsave" : "Launchpad"}
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
        className="fixed inset-0 z-40 flex items-end justify-center bg-black/75 px-3 pb-3 backdrop-blur-sm sm:items-center sm:py-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          onClick={(event) => event.stopPropagation()}
          className="max-h-[88vh] w-full max-w-3xl overflow-hidden rounded-[28px] border border-violet-400/15 bg-[#0d0b1e]/97 shadow-2xl shadow-black/60 backdrop-blur-2xl"
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
  alternatives,
  onClose,
  onTutorial,
}: {
  item: AIUpdate;
  alternatives: AIUpdate[];
  onClose: () => void;
  onTutorial: (item: AIUpdate) => void;
}) {
  return (
    <ModalShell title={item.toolName} onClose={onClose}>
      <div className="space-y-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="rounded-full bg-violet-500 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em] text-white">
              {item.category}
            </p>
            <SourceLink item={item} />
          </div>
          <h3 className="mt-2 text-2xl font-black leading-tight text-white">{item.title}</h3>
          <p className="mt-3 text-base leading-7 text-slate-200">{item.summary}</p>
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
          <h4 className="text-sm font-black text-white">What happened</h4>
          <p className="mt-2 text-sm leading-6 text-slate-300">{item.longExplanation}</p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
          <h4 className="text-sm font-black text-white">In simple terms</h4>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {item.toolName} is worth tracking because it may change how you study, build, research, or ship small
            projects. You do not need to understand every technical detail first. Start by learning what problem it
            solves, what input it needs, what output it gives you, and where it can fail.
          </p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
          <h4 className="text-sm font-black text-white">Why it matters</h4>
          <p className="mt-2 text-sm leading-6 text-slate-300">{item.whyItMatters}</p>
        </section>

        <section className="rounded-2xl border border-violet-400/20 bg-violet-500/10 p-4">
          <h4 className="text-sm font-black text-white">{item.tutorial.title}</h4>
          <p className="mt-2 text-sm leading-6 text-violet-100">{item.tutorial.goal}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <IconBadge icon={Zap}>{item.tutorial.estimatedTime}</IconBadge>
            <IconBadge icon={BadgeCheck}>{item.tutorial.difficulty}</IconBadge>
          </div>
          <ol className="mt-4 space-y-3">
            {item.tutorial.steps.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm leading-6 text-slate-200">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-violet-500 text-xs font-black text-white">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
          <h4 className="text-sm font-black text-white">Before you try it</h4>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">Best for</p>
              <p className="mt-1 text-sm leading-6 text-slate-300">{item.bestFor.join(", ")}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">Tools needed</p>
              <p className="mt-1 text-sm leading-6 text-slate-300">{item.tutorial.toolsNeeded.join(", ")}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">Expected output</p>
              <p className="mt-1 text-sm leading-6 text-slate-300">{item.tutorial.expectedOutput}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">Next step</p>
              <p className="mt-1 text-sm leading-6 text-slate-300">{item.tutorial.nextStep}</p>
            </div>
          </div>
        </section>

        {(item.access.paidOnly || item.access.waitlistRequired) && alternatives.length ? (
          <section className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4">
            <h4 className="text-sm font-black text-white">Free or easier alternatives</h4>
            <div className="mt-3 grid gap-3">
              {alternatives.slice(0, 3).map((alternative) => (
                <article key={alternative.id} className="rounded-2xl border border-white/10 bg-[#0b0917]/50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h5 className="font-black text-white">{alternative.toolName}</h5>
                    <span className="rounded-full bg-emerald-300 px-2 py-1 text-[11px] font-black text-slate-950">
                      {alternative.access.openSource ? "Open source" : "Free tier"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{alternative.summary}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
          <h4 className="text-sm font-black text-white">Starter prompt or checklist</h4>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">{item.tutorial.prompt}</p>
        </section>

        <section className="space-y-2">
          <h4 className="text-sm font-black text-white">Useful parts</h4>
          <div className="flex flex-wrap gap-2">
            {item.perks.map((perk) => (
              <span key={perk} className="rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-200">
                {perk}
              </span>
            ))}
          </div>
          <PerkBadges item={item} />
        </section>
        <section className="space-y-2">
          <h4 className="text-sm font-black text-white">Common mistakes and limitations</h4>
          <ul className="space-y-2">
            {item.tutorial.commonMistakes.map((mistake) => (
              <li key={mistake} className="flex gap-2 text-sm leading-6 text-slate-300">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-300" />
                {mistake}
              </li>
            ))}
            {item.limitations.map((limitation) => (
              <li key={limitation} className="flex gap-2 text-sm leading-6 text-slate-300">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                {limitation}
              </li>
            ))}
          </ul>
        </section>
        <div className="grid grid-cols-1 gap-2">
          <ActionButton icon={Play} onClick={() => onTutorial(item)}>
            Open Tutorial
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
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-black text-white">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </section>
        <section className="rounded-2xl border border-violet-400/20 bg-violet-500/10 p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h4 className="text-sm font-black text-white">Copyable prompt</h4>
            <button
              type="button"
              onClick={() => onCopy(item.tutorial.prompt)}
              className="inline-flex h-9 items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-indigo-600 px-3 text-xs font-black text-white shadow-md shadow-violet-500/25"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy
            </button>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-6 text-violet-100">{item.tutorial.prompt}</p>
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

function MiniProjectCard({
  item,
  status,
  onStart,
  onComplete,
  onExport,
  onRemove,
  onStatus,
}: {
  item: AIUpdate;
  status: ProjectStatus;
  onStart: (item: AIUpdate) => void;
  onComplete: (item: AIUpdate) => void;
  onExport: (item: AIUpdate, type: "linkedin" | "readme") => void;
  onRemove: (item: AIUpdate) => void;
  onStatus: (item: AIUpdate, status: ProjectStatus) => void;
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-violet-300">{item.category}</p>
          <h3 className="mt-1 text-lg font-black leading-tight text-white">{item.miniProject.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">{item.miniProject.output}</p>
        </div>
        <span
          className={cx(
            "shrink-0 rounded-full px-2.5 py-1 text-xs font-bold",
            status === "Completed"
              ? "bg-emerald-400 text-slate-950"
              : status === "In Progress"
                ? "bg-violet-500 text-white"
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
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/[0.08] text-[11px] font-bold text-violet-200">
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
        <div className="col-span-2">
          <ActionButton icon={X} onClick={() => onRemove(item)}>
            Remove from Launchpad
          </ActionButton>
        </div>
      </div>
      <div className="mt-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-slate-400">Launchpad status</p>
        <div className="flex flex-wrap gap-2">
          {launchpadStatuses.map((nextStatus) => (
            <button
              key={nextStatus}
              type="button"
              onClick={() => onStatus(item, nextStatus)}
              className={cx(
                "rounded-full border px-3 py-1.5 text-xs font-bold transition",
                status === nextStatus
                  ? "border-violet-400/50 bg-violet-500 text-white"
                  : "border-white/10 bg-white/[0.05] text-slate-300 hover:bg-white/[0.09]",
              )}
            >
              {nextStatus}
            </button>
          ))}
        </div>
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
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-600 px-4 text-sm font-black text-white shadow-lg shadow-violet-500/25"
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
              <span className="rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 px-2 py-1 text-xs font-black text-white">
                {item.studentRelevanceScore}/10
              </span>
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
            <p className="mt-4 rounded-2xl border border-white/10 bg-[#0b0917]/40 p-3 text-sm leading-6 text-slate-300">
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
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-600 px-4 text-sm font-black text-white shadow-lg shadow-violet-500/25"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Ask
        </button>
        {answer ? (
          <p className="whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-slate-200">{answer}</p>
        ) : null}
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
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-400 via-blue-400 to-emerald-400"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  icon: Icon,
  tone = "violet",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "violet" | "blue" | "emerald" | "amber";
}) {
  const toneClass = {
    violet: "bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-violet-500/20",
    blue: "bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-blue-500/20",
    emerald: "bg-emerald-400 text-slate-950 shadow-emerald-500/20",
    amber: "bg-amber-200 text-slate-950 shadow-amber-500/20",
  }[tone];

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.065] p-4 shadow-xl shadow-black/10 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-2xl font-black text-white">{value}</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.1em] text-slate-400">{label}</p>
        </div>
        <div className={cx("grid h-11 w-11 shrink-0 place-items-center rounded-2xl shadow-lg", toneClass)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function WebsiteNav({
  activeTab,
  onTabChange,
  onAsk,
  feedSource,
}: {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onAsk: () => void;
  feedSource: "live" | "mock";
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b0917]/80 backdrop-blur-2xl">
      <div className="mx-auto flex min-h-20 w-full max-w-7xl flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <button type="button" onClick={() => onTabChange("radar")} className="flex w-fit items-center gap-3 text-left">
          <RadarLogo />
          <div>
            <p className="text-xl font-black leading-none text-white">AI Radar</p>
            <p className="mt-1 text-sm text-slate-400">Turn AI news into proof of work</p>
          </div>
        </button>

        <nav className="flex flex-wrap items-center gap-2">
          {tabItems.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={cx(
                  "inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-black transition",
                  active
                    ? "border-violet-400/50 bg-violet-500 text-white shadow-lg shadow-violet-500/20"
                    : "border-white/10 bg-white/[0.06] text-slate-200 hover:border-white/20 hover:bg-white/[0.1]",
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="flex flex-wrap items-center gap-3">
          <SourcePill source={feedSource} />
          <button
            type="button"
            onClick={onAsk}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-4 text-sm font-black text-white shadow-lg shadow-indigo-500/25 transition hover:from-blue-400 hover:to-indigo-500"
          >
            <MessageCircle className="h-4 w-4" />
            Ask Radar
          </button>
        </div>
      </div>
    </header>
  );
}

export default function AIRadarApp() {
  const [activeTab, setActiveTab] = useState<TabId>("radar");
  const [items, setItems] = useState<AIUpdate[]>([]);
  const [feedSource, setFeedSource] = useState<"live" | "mock">("live");
  const [feedMessage, setFeedMessage] = useState("Loading stored Radar posts...");
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [radarFilter, setRadarFilter] = useState("All");
  const [searchFilter, setSearchFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AIUpdate[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState("Search stored Radar posts; live crawling refreshes in the background.");
  const [searchRefreshTick, setSearchRefreshTick] = useState(0);
  const [searchAutoRefreshes, setSearchAutoRefreshes] = useState(0);
  const [crawlUrl, setCrawlUrl] = useState("");
  const [crawling, setCrawling] = useState(false);
  const [visibleRadarCount, setVisibleRadarCount] = useState(5);
  const [loadingMoreRadar, setLoadingMoreRadar] = useState(false);
  const [hasMoreRadar, setHasMoreRadar] = useState(true);
  const [clientId, setClientId] = useState("");
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [savedItems, setSavedItems] = useState<Record<string, AIUpdate>>({});
  const [projectStatuses, setProjectStatuses] = useState<Record<string, ProjectStatus>>({});
  const [promptsCopied, setPromptsCopied] = useState(0);
  const [streakDates, setStreakDates] = useState<string[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [detailsItem, setDetailsItem] = useState<AIUpdate | null>(null);
  const [tutorialItem, setTutorialItem] = useState<AIUpdate | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [exportData, setExportData] = useState<{ title: string; content: string } | null>(null);
  const [health, setHealth] = useState<{
    database?: { ok?: boolean };
    exa?: { ok?: boolean };
    openai?: { ok?: boolean };
  } | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setSavedIds(readStorage<string[]>(storageKeys.savedIds, []));
      setSavedItems(readStorage<Record<string, AIUpdate>>(storageKeys.savedItems, {}));
      setProjectStatuses(readStorage<Record<string, ProjectStatus>>(storageKeys.projectStatuses, {}));
      setPromptsCopied(readStorage<number>(storageKeys.promptsCopied, 0));
      setStreakDates(readStorage<string[]>(storageKeys.streakDates, []));
      setPreferences(readStorage<UserPreferences>(storageKeys.preferences, defaultPreferences));
      setClientId(getOrCreateClientId());
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!clientId) return;

    const controller = new AbortController();
    async function loadSavedFromDatabase() {
      try {
        const response = await fetch(`/api/saved?clientId=${encodeURIComponent(clientId)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) return;

        const data = (await response.json()) as { items?: AIUpdate[] };
        if (!data.items?.length) return;

        setSavedItems((current) => ({
          ...current,
          ...Object.fromEntries(data.items!.map((item) => [item.id, item])),
        }));
        setSavedIds((current) => Array.from(new Set([...current, ...data.items!.map((item) => item.id)])));
      } catch {
        // Local storage remains the fallback for saved posts.
      }
    }

    void loadSavedFromDatabase();
    return () => controller.abort();
  }, [clientId]);

  useEffect(() => {
    if (!clientId) return;

    const controller = new AbortController();
    async function loadPreferencesFromDatabase() {
      try {
        const response = await fetch(`/api/preferences?clientId=${encodeURIComponent(clientId)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data = (await response.json()) as { preferences?: UserPreferences | null };
        if (data.preferences) {
          setPreferences(data.preferences);
          writeStorage(storageKeys.preferences, data.preferences);
        }
      } catch {
        // Local preferences remain active.
      }
    }

    void loadPreferencesFromDatabase();
    return () => controller.abort();
  }, [clientId]);

  useEffect(() => {
    if (!clientId) return;

    const controller = new AbortController();
    async function loadLaunchpadFromDatabase() {
      try {
        const response = await fetch(`/api/launchpad?clientId=${encodeURIComponent(clientId)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data = (await response.json()) as { statuses?: Record<string, ProjectStatus> };
        if (data.statuses && Object.keys(data.statuses).length) {
          setProjectStatuses((current) => ({ ...current, ...data.statuses }));
        }
      } catch {
        // Local Launchpad status remains active.
      }
    }

    void loadLaunchpadFromDatabase();
    return () => controller.abort();
  }, [clientId]);

  useEffect(() => {
    let cancelled = false;
    async function loadFeed() {
      setLoadingFeed(true);
      try {
        const params = new URLSearchParams({
          limit: "8",
          offset: "0",
          filter: radarFilter,
        });
        if (clientId) params.set("clientId", clientId);
        const response = await fetch(`/api/radar?${params.toString()}`, { cache: "no-store" });
        const data = (await response.json()) as RadarResponse;
        if (!cancelled) {
          setItems(data.items);
          setFeedSource(data.source);
          setFeedMessage(data.message);
          setHasMoreRadar(data.hasMore ?? data.items.length >= 8);
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
    return () => { cancelled = true; };
  }, [clientId, radarFilter]);

  useEffect(() => writeStorage(storageKeys.savedIds, savedIds), [savedIds]);
  useEffect(() => writeStorage(storageKeys.savedItems, savedItems), [savedItems]);
  useEffect(() => writeStorage(storageKeys.projectStatuses, projectStatuses), [projectStatuses]);
  useEffect(() => writeStorage(storageKeys.promptsCopied, promptsCopied), [promptsCopied]);
  useEffect(() => writeStorage(storageKeys.streakDates, streakDates), [streakDates]);
  useEffect(() => writeStorage(storageKeys.preferences, preferences), [preferences]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({ q: query, limit: "12", offset: "0" });
        if (clientId) params.set("clientId", clientId);
        const response = await fetch(`/api/search?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = (await response.json()) as RadarResponse;
        setSearchResults(data.items);
        setSearchMessage(data.message);
      } catch {
        if (!controller.signal.aborted) {
          setSearchResults(searchItems(items, query));
          setSearchMessage("Could not reach live search. Showing stored local matches only.");
        }
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 360);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [clientId, items, searchQuery, searchRefreshTick]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2 || searching || (searchResults && searchResults.length > 0)) return;
    if (!searchMessage.toLowerCase().includes("background")) return;
    if (searchAutoRefreshes >= 2) return;

    const timeout = window.setTimeout(() => {
      setSearchAutoRefreshes((count) => count + 1);
      setSearchRefreshTick((tick) => tick + 1);
    }, 7000);
    return () => window.clearTimeout(timeout);
  }, [searchAutoRefreshes, searchMessage, searchQuery, searchResults, searching]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    let cancelled = false;
    async function loadHealth() {
      try {
        const response = await fetch("/api/health", { cache: "no-store" });
        const data = (await response.json()) as typeof health;
        if (!cancelled) setHealth(data);
      } catch {
        if (!cancelled) setHealth(null);
      }
    }
    void loadHealth();
    const interval = window.setInterval(loadHealth, 60000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const allItems = useMemo(() => mergeItems(items, searchResults ?? [], Object.values(savedItems)), [items, savedItems, searchResults]);
  const itemMap = useMemo(() => new Map(allItems.map((item) => [item.id, item])), [allItems]);
  const filteredRadarItems = useMemo(() => filterItems(items, radarFilter), [items, radarFilter]);
  const visibleRadarItems = filteredRadarItems.slice(0, visibleRadarCount);
  const featuredItem = filteredRadarItems.find((item) => item.isFeatured) ?? filteredRadarItems[0];
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
  const detailAlternatives = useMemo(() => {
    if (!detailsItem) return [];
    return allItems.filter(
      (item) =>
        item.id !== detailsItem.id &&
        (item.category === detailsItem.category || item.tags.some((tag) => detailsItem.tags.includes(tag))) &&
        (item.access.freeTier || item.access.openSource),
    );
  }, [allItems, detailsItem]);

  function showToast(message: string) { setToast(message); }
  function rememberItem(item: AIUpdate) { setSavedItems((c) => ({ ...c, [item.id]: item })); }

  const loadMoreRadar = useCallback(async () => {
    if (loadingMoreRadar) return;

    if (visibleRadarCount < filteredRadarItems.length) {
      setVisibleRadarCount((count) => count + 6);
      return;
    }

    if (!hasMoreRadar) return;

    setLoadingMoreRadar(true);
    try {
      const response = await fetch(`/api/radar?offset=${items.length}&limit=8`, { cache: "no-store" });
      const data = (await response.json()) as RadarResponse;
      setItems((current) => mergeItems(current, data.items));
      setFeedSource(data.source);
      setFeedMessage(data.message);
      setHasMoreRadar(data.hasMore ?? data.items.length >= 8);
      setVisibleRadarCount((count) => count + 6);
    } catch {
      setVisibleRadarCount((count) => count + 6);
      setToast("Could not fetch more live posts. Showing loaded posts.");
    } finally {
      setLoadingMoreRadar(false);
    }
  }, [filteredRadarItems.length, hasMoreRadar, items.length, loadingMoreRadar, visibleRadarCount]);

  useEffect(() => {
    if (activeTab !== "radar") return;

    function onScroll() {
      const remaining = document.documentElement.scrollHeight - window.scrollY - window.innerHeight;
      if (remaining < 720) void loadMoreRadar();
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [activeTab, filteredRadarItems.length, loadingMoreRadar, loadMoreRadar, visibleRadarCount]);

  async function unsaveItem(item: AIUpdate) {
    setSavedIds((current) => current.filter((id) => id !== item.id));
    setSavedItems((current) => {
      const next = { ...current };
      delete next[item.id];
      return next;
    });
    setProjectStatuses((current) => {
      const next = { ...current };
      delete next[item.id];
      return next;
    });
    showToast("Removed from Launchpad");

    if (!clientId) return;
    try {
      await fetch("/api/saved", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, postId: item.id }),
      });
    } catch {
      showToast("Removed locally. Database sync will retry later.");
    }
  }

  async function toggleSavedItem(item: AIUpdate) {
    if (savedIds.includes(item.id)) {
      await unsaveItem(item);
      return;
    }

    rememberItem(item);
    setSavedIds((c) => (c.includes(item.id) ? c : [...c, item.id]));
    showToast("Saved to Launchpad");
    if (!clientId) return;

    try {
      await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, item }),
      });
    } catch {
      showToast("Saved locally. Database save will retry when available.");
    }
  }

  async function copyText(text: string, message = "Prompt copied", postId?: string) {
    try {
      await navigator.clipboard.writeText(text);
      setPromptsCopied((n) => n + 1);
      showToast(message);
      if (clientId) {
        void fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId, postId, promptType: "starter" }),
        }).catch(() => {});
      }
    } catch {
      showToast("Copy failed. Select the text manually.");
    }
  }

  function setLaunchpadStatus(item: AIUpdate, status: ProjectStatus) {
    rememberItem(item);
    setSavedIds((current) => (current.includes(item.id) ? current : [...current, item.id]));
    setProjectStatuses((c) => ({ ...c, [item.id]: status }));
    if (clientId) {
      void fetch("/api/launchpad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, postId: item.id, status }),
      }).catch(() => {});
    }
  }

  function startProject(item: AIUpdate) {
    setLaunchpadStatus(item, "In Progress");
    setActiveTab("build");
    showToast("Mini project started");
  }

  function completeProject(item: AIUpdate) {
    const today = new Date().toISOString().slice(0, 10);
    setLaunchpadStatus(item, "Completed");
    setStreakDates((c) => (c.includes(today) ? c : [...c, today].slice(-7)));
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
    setCompareIds((c) => (c.includes(item.id) ? c.filter((id) => id !== item.id) : [...c, item.id].slice(-4)));
  }

  function openCompare() {
    if (compareItems.length < 2) { showToast("Select at least two items to compare"); return; }
    setCompareOpen(true);
  }

  function openExport(item: AIUpdate, type: "linkedin" | "readme") {
    rememberItem(item);
    const status = projectStatuses[item.id] ?? "Not Started";
    const content = type === "linkedin" ? buildLinkedInPost(item) : buildGithubReadme(item, status);
    setExportData({ title: type === "linkedin" ? "LinkedIn Post" : "GitHub README", content });
    if (clientId) {
      void fetch("/api/exports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, postId: item.id, exportType: type, content }),
      }).catch(() => {});
    }
  }

  function exportFromBuild(type: "linkedin" | "readme") {
    const completed = buildItems.find((item) => projectStatuses[item.id] === "Completed");
    const fallback = buildItems[0] ?? featuredItem ?? items[0];
    if (!fallback) { showToast("Save or start a project first"); return; }
    if (!completed) showToast("Using your first saved item. Complete a project for a stronger export.");
    openExport(completed ?? fallback, type);
  }

  function handleSearchInput(value: string) {
    setSearchQuery(value);
    setSearchAutoRefreshes(0);
    if (value.trim().length < 2) { setSearchResults(null); setSearching(false); }
  }

  function handleRadarFilter(filter: string) {
    setRadarFilter(filter);
    setVisibleRadarCount(5);
  }

  function updatePreferences(next: UserPreferences) {
    setPreferences(next);
    writeStorage(storageKeys.preferences, next);
  }

  function togglePreferenceInterest(interest: string) {
    const interests = preferences.interests.includes(interest)
      ? preferences.interests.filter((item) => item !== interest)
      : [...preferences.interests, interest];
    updatePreferences({ ...preferences, interests });
  }

  async function saveUserPreferences() {
    writeStorage(storageKeys.preferences, preferences);
    if (!clientId) {
      showToast("Preferences saved on this device");
      return;
    }

    try {
      await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, preferences }),
      });
      showToast("Preferences saved");
      setItems([]);
      setVisibleRadarCount(5);
      setHasMoreRadar(true);
      void refreshFeed();
    } catch {
      showToast("Preferences saved locally");
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
      setHasMoreRadar(data.hasMore ?? data.items.length >= 8);
      setVisibleRadarCount(5);
      showToast("Radar refreshed");
    } catch {
      showToast("Feed refresh failed");
    } finally {
      setLoadingFeed(false);
    }
  }

  async function generateFromUrl() {
    const url = crawlUrl.trim();
    if (!url) {
      showToast("Paste a source URL first");
      return;
    }

    setCrawling(true);
    try {
      const response = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          query:
            "Explain this AI update for students, software engineers, creators, and builders. Include what changed, access situation, setup steps, starter prompt, and what to try first.",
        }),
      });
      const data = (await response.json()) as RadarResponse;
      if (data.items.length) {
        setItems((current) => mergeItems(data.items, current));
        setFeedSource(data.source);
        setFeedMessage(data.message);
        setCrawlUrl("");
        setVisibleRadarCount((count) => Math.max(count, 6));
        showToast("Generated Radar post from source URL");
      } else {
        showToast(data.message || "No usable crawl content found");
      }
    } catch {
      showToast("Could not generate from that URL");
    } finally {
      setCrawling(false);
    }
  }

  function refreshSearch() {
    const query = searchQuery.trim();
    if (query.length < 2) {
      showToast("Type at least two characters to search");
      return;
    }
    setSearchResults(null);
    setSearchAutoRefreshes(0);
    setSearchRefreshTick((tick) => tick + 1);
  }

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[radial-gradient(ellipse_at_15%_0%,rgba(139,111,255,0.22),transparent_32%),radial-gradient(ellipse_at_85%_10%,rgba(79,123,255,0.16),transparent_34%),radial-gradient(ellipse_at_50%_80%,rgba(99,71,220,0.10),transparent_40%),linear-gradient(160deg,#0b0917_0%,#0d0a1e_50%,#0f0c26_100%)] text-white">
      <WebsiteNav activeTab={activeTab} onTabChange={setActiveTab} onAsk={() => setAskOpen(true)} feedSource={feedSource} />

      <main className="mx-auto w-full max-w-7xl px-5 py-8 lg:px-8 lg:py-10">
        {activeTab === "radar" ? (
          <section className="space-y-8">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.9fr)]">
              <header className="relative overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl lg:p-8">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/60 to-transparent" />
                <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-violet-600/10 blur-3xl" />
                <div className="flex flex-wrap items-center gap-3">
                  <p className="rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-sm font-bold text-violet-200">
                    {formatDate(new Date().toISOString().slice(0, 10))}
                  </p>
                  <SourcePill source={feedSource} />
                </div>
                <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight text-white lg:text-6xl">
                  Today&apos;s AI Radar
                </h1>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
                  Fresh AI updates turned into access notes, tutorials, prompts, and Launchpad next steps.
                </p>
                <p className="mt-4 max-w-2xl text-base font-semibold text-violet-200">
                  Stop doomscrolling AI news. Start building with it.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={refreshFeed}
                    className="inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-indigo-600 px-5 text-sm font-black text-white shadow-lg shadow-violet-500/25 transition hover:from-violet-400 hover:to-indigo-500"
                  >
                    {loadingFeed ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Refresh Radar
                  </button>
                  <button
                    type="button"
                    onClick={() => showToast("Daily radar notifications are ready for the Zo scheduler stretch.")}
                    className="inline-flex h-12 items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-5 text-sm font-bold text-slate-100 transition hover:bg-white/[0.1]"
                  >
                    <Bell className="h-4 w-4" />
                    Daily briefing
                  </button>
                </div>
              </header>

              <aside className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <StatTile label="Updates loaded" value={filteredRadarItems.length || items.length} icon={Radar} tone="violet" />
                <StatTile label="Saved tools" value={progress.savedTools} icon={Bookmark} tone="blue" />
                <StatTile label="Completed projects" value={progress.completedProjects} icon={Trophy} tone="emerald" />
                <div className="rounded-3xl border border-white/10 bg-white/[0.065] p-4 backdrop-blur-xl sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-sm font-black uppercase tracking-[0.1em] text-white">Live pipeline</h2>
                    <button
                      type="button"
                      title="Refresh feed"
                      onClick={refreshFeed}
                      className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.07] text-slate-200 transition hover:border-violet-400/30 hover:text-violet-200"
                    >
                      {loadingFeed ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{feedMessage}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.065] p-4 backdrop-blur-xl sm:col-span-2 lg:col-span-1">
                  <h2 className="text-sm font-black uppercase tracking-[0.1em] text-white">System status</h2>
                  <div className="mt-3 grid gap-2">
                    {[
                      ["Database", health?.database?.ok],
                      ["Exa", health?.exa?.ok],
                      ["OpenAI", health?.openai?.ok],
                    ].map(([label, ok]) => (
                      <div key={String(label)} className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0b0917]/40 px-3 py-2 text-sm">
                        <span className="font-bold text-slate-200">{label}</span>
                        <span className={cx("rounded-full px-2 py-1 text-[11px] font-black", ok ? "bg-emerald-300 text-slate-950" : "bg-amber-300 text-slate-950")}>
                          {ok ? "Ready" : "Check"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.055] p-4 backdrop-blur-xl">
              <div className="mb-4 rounded-2xl border border-violet-400/20 bg-violet-500/10 p-4">
                <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
                  <label className="flex min-h-12 items-center gap-3 rounded-xl border border-white/10 bg-[#0b0917]/50 px-4">
                    <Search className="h-4 w-4 shrink-0 text-violet-200" />
                    <input
                      value={crawlUrl}
                      onChange={(event) => setCrawlUrl(event.target.value)}
                      placeholder="Paste an AI update/tool URL to turn it into a Radar post"
                      className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={generateFromUrl}
                    disabled={crawling}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-4 text-sm font-black text-white disabled:cursor-wait disabled:opacity-70"
                  >
                    {crawling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Generate from URL
                  </button>
                </div>
              </div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-black uppercase tracking-[0.1em] text-slate-300">Radar filters</h2>
                <span className="text-sm text-slate-400">{filteredRadarItems.length} matching updates</span>
              </div>
              <FilterChips active={radarFilter} onSelect={handleRadarFilter} />
            </div>

            {loadingFeed && items.length === 0 ? (
              <div className="grid min-h-[380px] place-items-center rounded-[28px] border border-white/10 bg-white/[0.05]">
                <Loader2 className="h-9 w-9 animate-spin text-violet-300" />
              </div>
            ) : visibleRadarItems.length ? (
              <div className="grid w-full gap-5">
                {visibleRadarItems.map((item) => (
                  <RadarCard
                    key={item.id}
                    item={item}
                    saved={savedIds.includes(item.id)}
                    onSave={toggleSavedItem}
                    onTutorial={setTutorialItem}
                    onCopyPrompt={copyText}
                    onShare={shareItem}
                    onDetails={setDetailsItem}
                  />
                ))}
                <div className="grid min-h-20 place-items-center rounded-[18px] border border-white/10 bg-white/[0.04] text-sm text-slate-400">
                  {loadingMoreRadar ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-violet-300" />
                      Loading more Radar posts
                    </span>
                  ) : (
                    <span>{hasMoreRadar ? "Scroll further to fetch more posts" : "You are caught up for now"}</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-8 text-center text-sm text-slate-300">
                No matching updates for this filter yet.
              </div>
            )}
          </section>
        ) : null}

        {activeTab === "search" ? (
          <section className="space-y-7">
            <header className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.12em] text-violet-300">Semantic discovery</p>
                <h1 className="mt-2 text-4xl font-black tracking-tight lg:text-5xl">Search AI Radar</h1>
                <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
                  Find AI tools, updates, tutorials, prompts, and student-friendly perks.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={refreshSearch}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-5 text-sm font-black text-white transition hover:border-violet-400/30 hover:bg-white/[0.1]"
                >
                  {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Refresh live search
                </button>
                <button
                  type="button"
                  onClick={openCompare}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-5 text-sm font-black text-white transition hover:border-violet-400/30 hover:bg-white/[0.1]"
                >
                  <GitCompare className="h-4 w-4" />
                  Compare {compareIds.length ? `(${compareIds.length})` : ""}
                </button>
              </div>
            </header>

            <div className="rounded-[32px] border border-white/10 bg-white/[0.065] p-5 backdrop-blur-xl">
              <label className="flex h-16 items-center gap-4 rounded-2xl border border-white/10 bg-[#0b0917]/40 px-5">
                <Search className="h-5 w-5 shrink-0 text-violet-300" />
                <input
                  value={searchQuery}
                  onChange={(event) => handleSearchInput(event.target.value)}
                  placeholder="Search presentations, coding, video, free tools..."
                  className="min-w-0 flex-1 bg-transparent text-lg text-white outline-none placeholder:text-slate-500"
                />
                {searching ? <Loader2 className="h-5 w-5 animate-spin text-violet-300" /> : null}
              </label>
              <div className="mt-4 flex flex-wrap gap-2">
                {popularSearches.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleSearchInput(chip)}
                    className="h-9 rounded-full border border-white/10 bg-white/[0.06] px-3 text-xs font-bold text-slate-200 transition hover:border-violet-400/30 hover:bg-white/[0.1]"
                  >
                    {chip}
                  </button>
                ))}
              </div>
              <div className="mt-5 border-t border-white/10 pt-4">
                <FilterChips active={searchFilter} onSelect={setSearchFilter} />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-400">{visibleSearchResults.length} results</p>
              <p className="text-sm text-slate-500">{searchMessage}</p>
            </div>

            {visibleSearchResults.length ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {visibleSearchResults.map((item) => (
                  <SearchResultCard
                    key={item.id}
                    item={item}
                    saved={savedIds.includes(item.id)}
                    compared={compareIds.includes(item.id)}
                    onDetails={setDetailsItem}
                    onTutorial={setTutorialItem}
                    onSave={toggleSavedItem}
                    onCompare={toggleCompare}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-10 text-center">
                <Search className="mx-auto h-9 w-9 text-violet-300" />
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  No matching AI updates found. Try searching for &quot;presentation&quot;, &quot;coding&quot;, &quot;video&quot;, or
                  &quot;free tools&quot;.
                </p>
              </div>
            )}
          </section>
        ) : null}

        {activeTab === "saved" ? (
          <section className="space-y-7">
            <header className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.12em] text-violet-300">Reading list</p>
                <h1 className="mt-2 text-4xl font-black tracking-tight lg:text-5xl">Saved Radar</h1>
                <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
                  Posts you saved from Radar and Search, with the original source link kept for deeper reading.
                </p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-sm font-bold text-slate-200">
                {savedTutorials.length} saved
              </span>
            </header>

            {savedTutorials.length ? (
              <div className="grid w-full gap-5">
                {savedTutorials.map((item) => (
                  <RadarCard
                    key={item.id}
                    item={item}
                    saved
                    onSave={toggleSavedItem}
                    onTutorial={setTutorialItem}
                    onCopyPrompt={copyText}
                    onShare={shareItem}
                    onDetails={setDetailsItem}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-8 text-center">
                <Bookmark className="mx-auto h-9 w-9 text-violet-300" />
                <h2 className="mt-4 text-xl font-black text-white">No saved posts yet</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Save useful Radar posts and they will appear here as your personal AI reading list.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("radar")}
                  className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-indigo-600 px-4 text-sm font-black text-white"
                >
                  Browse Radar
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </section>
        ) : null}

        {activeTab === "build" ? (
          <section className="space-y-7">
            <header className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.12em] text-violet-300">Tool access hub</p>
                <h1 className="mt-2 text-4xl font-black tracking-tight lg:text-5xl">Launchpad</h1>
                <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
                  Track saved AI tools, access limits, setup steps, and what to try next.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => exportFromBuild("linkedin")}
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-indigo-600 px-5 text-sm font-black text-white shadow-lg shadow-violet-500/20"
                >
                  <Send className="h-4 w-4" />
                  LinkedIn post
                </button>
                <button
                  type="button"
                  onClick={() => exportFromBuild("readme")}
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-5 text-sm font-bold text-white transition hover:bg-white/[0.1]"
                >
                  <FileText className="h-4 w-4" />
                  GitHub README
                </button>
              </div>
            </header>

            <div className="grid gap-4 md:grid-cols-4">
              <StatTile label="Projects completed" value={progress.completedProjects} icon={Trophy} tone="emerald" />
              <StatTile label="Tutorials completed" value={progress.tutorialsCompleted} icon={CheckCircle2} tone="violet" />
              <StatTile label="Prompts copied" value={progress.promptsCopied} icon={Copy} tone="blue" />
              <StatTile label="Saved tools" value={progress.savedTools} icon={Bookmark} tone="amber" />
            </div>

            <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
              <aside className="space-y-5">
                <section className="rounded-[28px] border border-white/10 bg-white/[0.07] p-5 backdrop-blur-xl">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-black text-white">Portfolio Progress</h2>
                      <p className="mt-1 text-sm text-slate-400">Every saved update can become a visible artifact.</p>
                    </div>
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/25">
                      <Trophy className="h-7 w-7" />
                    </div>
                  </div>
                  <div className="mt-5 space-y-4">
                    <ProgressBar label="Portfolio readiness" value={progress.portfolioScore} />
                    <ProgressBar label="Weekly progress" value={progress.weeklyProgress} />
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <IconBadge icon={Zap}>{streak || 0} day streak</IconBadge>
                    <IconBadge icon={Check}>{progress.activeProjects} active projects</IconBadge>
                  </div>
                </section>

                <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5">
                  <h2 className="text-lg font-black text-white">Saved Tutorials</h2>
                  {savedTutorials.length ? (
                    <div className="mt-4 space-y-3">
                      {savedTutorials.map((item) => (
                        <article key={item.id} className="rounded-2xl border border-white/10 bg-[#0b0917]/40 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-[0.1em] text-violet-300">{item.category}</p>
                              <h3 className="mt-1 text-sm font-black leading-tight text-white">{item.tutorial.title}</h3>
                              <p className="mt-2 text-xs text-slate-400">
                                {item.difficulty} · {item.tutorial.estimatedTime}
                              </p>
                            </div>
                            <span className="rounded-full bg-white/[0.08] px-2 py-1 text-[11px] font-bold text-slate-200">
                              {projectStatuses[item.id] ?? "Saved"}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setTutorialItem(item)}
                            className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.07] text-xs font-bold text-white transition hover:border-violet-400/30 hover:bg-white/[0.1]"
                          >
                            Continue
                            <ChevronRight className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void unsaveItem(item)}
                            className="mt-2 inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-red-300/20 bg-red-500/10 text-xs font-bold text-red-100 transition hover:bg-red-500/20"
                          >
                            Remove from Launchpad
                          </button>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 rounded-2xl border border-white/10 bg-[#0b0917]/40 p-4 text-sm leading-6 text-slate-300">
                      Save a Radar card or Search result and it will appear here.
                    </p>
                  )}
                </section>
              </aside>

              <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black text-white">Mini Projects</h2>
                    <p className="mt-1 text-sm text-slate-400">Start, complete, and export work from your saved AI updates.</p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-sm font-bold text-slate-200">
                    {buildItems.length} projects
                  </span>
                </div>
                {buildItems.length ? (
                  <div className="grid gap-5 xl:grid-cols-2">
                    {buildItems.map((item) => (
                      <MiniProjectCard
                        key={item.id}
                        item={item}
                        status={projectStatuses[item.id] ?? "Not Started"}
                        onStart={startProject}
                        onComplete={completeProject}
                        onExport={openExport}
                        onRemove={unsaveItem}
                        onStatus={setLaunchpadStatus}
                      />
                    ))}
                  </div>
                ) : (
                  <article className="rounded-[28px] border border-violet-400/20 bg-violet-500/10 p-6">
                    <div className="flex items-center gap-3">
                      <Rocket className="h-6 w-6 text-violet-200" />
                      <h3 className="font-black text-white">Weekly Challenge</h3>
                    </div>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200">
                      Save today&apos;s pick, start the mini project, and export the README after you complete it.
                    </p>
                  </article>
                )}
              </section>
            </div>
          </section>
        ) : null}

        {activeTab === "preferences" ? (
          <section className="space-y-7">
            <header>
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-violet-300">Personalization</p>
              <h1 className="mt-2 text-4xl font-black tracking-tight lg:text-5xl">Radar Preferences</h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
                Tune Radar and Search so crawled AI updates match your role, interests, access needs, and skill level.
              </p>
            </header>

            <div className="grid gap-5 lg:grid-cols-2">
              <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5">
                <h2 className="text-lg font-black text-white">Who are you?</h2>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {(["Student", "Software Engineer", "UI/UX Designer", "Creator", "Marketer", "Founder", "General"] as const).map((audience) => (
                    <button
                      key={audience}
                      type="button"
                      onClick={() => updatePreferences({ ...preferences, audience })}
                      className={cx(
                        "rounded-2xl border px-4 py-3 text-left text-sm font-bold transition",
                        preferences.audience === audience
                          ? "border-violet-400/50 bg-violet-500 text-white"
                          : "border-white/10 bg-white/[0.05] text-slate-200 hover:bg-white/[0.09]",
                      )}
                    >
                      {audience}
                    </button>
                  ))}
                </div>
              </section>

              <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5">
                <h2 className="text-lg font-black text-white">Access and difficulty</h2>
                <div className="mt-4 grid gap-3">
                  <label className="space-y-2">
                    <span className="text-sm font-bold text-slate-300">Preferred access</span>
                    <select
                      value={preferences.access}
                      onChange={(event) => updatePreferences({ ...preferences, access: event.target.value as UserPreferences["access"] })}
                      className="h-12 w-full rounded-2xl border border-white/10 bg-[#0b0917] px-4 text-sm font-bold text-white outline-none"
                    >
                      {(["Any", "Free", "Freemium", "Trial", "Paid", "Open Source"] as const).map((access) => (
                        <option key={access}>{access}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-bold text-slate-300">Difficulty</span>
                    <select
                      value={preferences.difficulty}
                      onChange={(event) =>
                        updatePreferences({ ...preferences, difficulty: event.target.value as UserPreferences["difficulty"] })
                      }
                      className="h-12 w-full rounded-2xl border border-white/10 bg-[#0b0917] px-4 text-sm font-bold text-white outline-none"
                    >
                      {(["Any", "Beginner", "Intermediate", "Advanced"] as const).map((difficulty) => (
                        <option key={difficulty}>{difficulty}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </section>

              <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 lg:col-span-2">
                <h2 className="text-lg font-black text-white">What should Radar crawl for you?</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {preferenceInterestOptions.map((interest) => {
                    const active = preferences.interests.includes(interest);
                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => togglePreferenceInterest(interest)}
                        className={cx(
                          "rounded-full border px-4 py-2 text-sm font-bold transition",
                          active
                            ? "border-violet-400/50 bg-violet-500 text-white"
                            : "border-white/10 bg-white/[0.05] text-slate-200 hover:bg-white/[0.09]",
                        )}
                      >
                        {interest}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={saveUserPreferences}
                  className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-indigo-600 px-5 text-sm font-black text-white"
                >
                  <Sparkles className="h-4 w-4" />
                  Save preferences and refresh Radar
                </button>
              </section>
            </div>
          </section>
        ) : null}
      </main>

      <Toast message={toast} />

      {detailsItem ? (
        <DetailsModal
          item={detailsItem}
          alternatives={detailAlternatives}
          onClose={() => setDetailsItem(null)}
          onTutorial={(item) => { setDetailsItem(null); setTutorialItem(item); }}
        />
      ) : null}

      {tutorialItem ? (
        <TutorialModal item={tutorialItem} onClose={() => setTutorialItem(null)} onCopy={(text) => copyText(text, "Prompt copied", tutorialItem.id)} />
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
