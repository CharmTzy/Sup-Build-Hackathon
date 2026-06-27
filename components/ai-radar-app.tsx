"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  Bookmark,
  CheckCircle2,
  ChevronRight,
  Copy,
  Eye,
  FileText,
  GitCompare,
  Hammer,
  LogIn,
  LogOut,
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
  UserRound,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import type { AIUpdate, ProjectStatus, RadarResponse, TabId, UserAccount, UserPreferences } from "@/lib/types";
import {
  buildGithubReadme,
  buildLinkedInPost,
  filterChips,
  filterItems,
  formatDate,
  getAccessBadgeText,
  getProgressTotals,
  popularSearches,
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

const SEARCH_PAGE_SIZE = 24;

type AuthMode = "login" | "register";
type AuthForm = {
  email: string;
  password: string;
  name: string;
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

function SourcePill({ source }: { source: "live" }) {
  return (
    <span
      title={`Source: ${source}`}
      className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-violet-400/40 bg-violet-400/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-violet-200"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
      Live / Stored
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
    <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
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
          <h3 className="mt-2 text-xl font-black leading-tight text-white sm:text-2xl">{item.title}</h3>
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

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
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

function LatestRadarPreview({
  item,
  saved,
  onSave,
  onTutorial,
  onCopyPrompt,
  onDetails,
}: {
  item: AIUpdate;
  saved: boolean;
  onSave: (item: AIUpdate) => void;
  onTutorial: (item: AIUpdate) => void;
  onCopyPrompt: (text: string, message?: string, postId?: string) => void;
  onDetails: (item: AIUpdate) => void;
}) {
  return (
    <section className="mt-8 rounded-[26px] border border-white/10 bg-[#0b0917]/40 p-5">
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

      <p className="mt-5 text-sm font-bold text-violet-200">{item.toolName}</p>
      <h2 className="mt-2 text-2xl font-black leading-tight text-white lg:text-3xl">{item.title}</h2>
      <p className="mt-3 max-w-4xl text-base leading-7 text-slate-200">{item.summary}</p>
      <p className="mt-4 max-w-4xl text-sm leading-6 text-slate-300">{item.longExplanation}</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">Actually useful</p>
          <p className="mt-1 text-2xl font-black text-white">{item.usefulScore}/10</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">Student fit</p>
          <p className="mt-1 text-2xl font-black text-white">{item.studentRelevanceScore}/10</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">Try time</p>
          <p className="mt-1 text-sm font-black leading-6 text-white">{item.tutorial.estimatedTime}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.75fr)]">
        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <h3 className="text-sm font-black text-white">Quick setup path</h3>
          <ol className="mt-3 space-y-2">
            {item.tutorial.steps.slice(0, 3).map((step, index) => (
              <li key={step} className="flex gap-3 text-sm leading-6 text-slate-300">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-violet-500 text-xs font-black text-white">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <h3 className="text-sm font-black text-white">Why it matters</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">{item.whyItMatters}</p>
        </section>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
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
      </div>
    </section>
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
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <IconBadge icon={Zap}>{item.difficulty}</IconBadge>
        <IconBadge icon={Star}>{item.access.openSource ? "OSS" : item.access.freeTier ? "Free tier" : "Paid"}</IconBadge>
      </div>

      <div className="mt-3 rounded-2xl border border-white/10 bg-[#0b0917]/40 p-3">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">Best for</p>
        <p className="mt-1 text-sm text-slate-200">{item.bestFor.join(", ")}</p>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
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
          className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-[22px] border border-violet-400/15 bg-[#0d0b1e]/97 shadow-2xl shadow-black/60 backdrop-blur-2xl sm:max-h-[88vh] sm:rounded-[28px]"
        >
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-5">
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
          <div className="max-h-[calc(92vh-72px)] overflow-y-auto px-4 py-4 sm:max-h-[calc(88vh-72px)] sm:px-5 sm:py-5">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ArticlePage({
  item,
  alternatives,
  saved,
  onBack,
  onSave,
  onTutorial,
  onCopyPrompt,
}: {
  item: AIUpdate;
  alternatives: AIUpdate[];
  saved: boolean;
  onBack: () => void;
  onSave: (item: AIUpdate) => void;
  onTutorial: (item: AIUpdate) => void;
  onCopyPrompt: (text: string, message?: string, postId?: string) => void;
}) {
  return (
    <article className="mx-auto max-w-3xl pb-16">
      <button
        type="button"
        onClick={onBack}
        className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-violet-200 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Radar
      </button>

      <header className="border-b border-white/10 pb-8">
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
          <span className="font-black uppercase tracking-[0.1em] text-violet-200">{item.category}</span>
          <span>{formatDate(item.date)}</span>
          <span>{item.difficulty}</span>
          <SourceLink item={item} />
        </div>
        <p className="mt-6 text-sm font-bold text-violet-200">{item.toolName}</p>
        <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">{item.title}</h1>
        <p className="mt-6 text-lg leading-8 text-slate-200 sm:text-xl sm:leading-9">{item.summary}</p>
        <div className="mt-6 flex flex-wrap gap-4 text-sm font-bold text-slate-300">
          <span>Useful: {item.usefulScore}/10</span>
          <span>Student fit: {item.studentRelevanceScore}/10</span>
          <span>Access: {accessLabel(item)}</span>
        </div>
      </header>

      <div className="mt-8 space-y-8 text-sm leading-7 text-slate-200 sm:mt-10 sm:space-y-10 sm:text-base sm:leading-8">
        <section className="space-y-4">
          <p>{item.longExplanation}</p>
          <p>{item.whyItMatters}</p>
          <p>
            In practical terms, treat this as something to evaluate through one small task first. Look at what input it
            needs, what output it gives, whether the result saves time, and whether the access model fits your budget or
            school project timeline.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-white">Who this is useful for</h2>
          <p>
            This is best for {item.bestFor.join(", ").toLowerCase()}. The strongest reasons to try it are{" "}
            {item.perks.join(", ").toLowerCase()}. If you are learning, use it as a guided experiment instead of trying
            to master the whole product in one sitting.
          </p>
          <PerkBadges item={item} />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-white">{item.tutorial.title}</h2>
          <p>
            Goal: {item.tutorial.goal} Plan around {item.tutorial.estimatedTime.toLowerCase()} and keep the output
            small enough that you can judge it honestly.
          </p>
          <ol className="ml-5 list-decimal space-y-3 marker:font-black marker:text-violet-300">
            {item.tutorial.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p>
            Expected output: {item.tutorial.expectedOutput} After that, the useful next move is:{" "}
            {item.tutorial.nextStep}
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-white">Starter prompt</h2>
          <p className="whitespace-pre-wrap text-slate-300">{item.tutorial.prompt}</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-white">Before you spend time on it</h2>
          <p>
            You will need {item.tutorial.toolsNeeded.join(", ").toLowerCase()}. Watch out for{" "}
            {[...item.tutorial.commonMistakes, ...item.limitations].join(", ").toLowerCase()}. These are not reasons to
            skip it automatically, but they are the checks that stop a quick experiment from becoming wasted time.
          </p>
        </section>

        {(item.access.paidOnly || item.access.waitlistRequired) && alternatives.length ? (
          <section className="space-y-4">
            <h2 className="text-2xl font-black text-white">Easier alternatives</h2>
            <p>
              If this is paid, invite-only, or too advanced right now, compare it with{" "}
              {alternatives
                .slice(0, 3)
                .map((alternative) => alternative.toolName)
                .join(", ")}
              . Pick the option that lets you test the same idea fastest, even if it is less powerful.
            </p>
          </section>
        ) : null}

        <footer className="border-t border-white/10 pt-8">
          <div className="flex flex-wrap gap-2">
            <ActionButton icon={Play} onClick={() => onTutorial(item)}>
              Open Tutorial
            </ActionButton>
            <ActionButton icon={Copy} onClick={() => onCopyPrompt(item.tutorial.prompt, "Starter prompt copied", item.id)}>
              Copy Prompt
            </ActionButton>
            <ActionButton icon={Bookmark} onClick={() => onSave(item)} active={saved}>
              {saved ? "Unsave" : "Save"}
            </ActionButton>
          </div>
          {item.sourceUrl ? (
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex text-sm font-bold text-violet-200 transition hover:text-white"
            >
              Read the original crawl source
            </a>
          ) : null}
        </footer>
      </div>
    </article>
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
          <h3 className="text-xl font-black leading-tight text-white sm:text-2xl">{item.tutorial.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">{item.tutorial.goal}</p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
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
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
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
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
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
        <div className="sm:col-span-2">
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
            <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
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
      const data = (await response.json()) as { answer?: string; source?: "live" };
      setAnswer(data.answer ?? "Radar could not answer that yet.");
      onToast(data.source === "live" ? "Ask Radar used live Radar data" : "Ask Radar could not use live data");
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

function AuthModal({
  mode,
  error,
  loading,
  onClose,
  onModeChange,
  onSubmit,
}: {
  mode: AuthMode;
  error: string;
  loading: boolean;
  onClose: () => void;
  onModeChange: (mode: AuthMode) => void;
  onSubmit: (form: AuthForm) => Promise<void>;
}) {
  const [form, setForm] = useState<AuthForm>({ email: "", password: "", name: "" });
  const isRegister = mode === "register";

  return (
    <ModalShell title={isRegister ? "Create Account" : "Log In"} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit(form);
        }}
      >
        {isRegister ? (
          <label className="block space-y-2">
            <span className="text-sm font-bold text-slate-300">Name</span>
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="h-12 w-full rounded-2xl border border-white/10 bg-[#0b0917]/70 px-4 text-sm font-bold text-white outline-none placeholder:text-slate-500"
              placeholder="Your name"
              autoComplete="name"
            />
          </label>
        ) : null}

        <label className="block space-y-2">
          <span className="text-sm font-bold text-slate-300">Email</span>
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            className="h-12 w-full rounded-2xl border border-white/10 bg-[#0b0917]/70 px-4 text-sm font-bold text-white outline-none placeholder:text-slate-500"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-bold text-slate-300">Password</span>
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            className="h-12 w-full rounded-2xl border border-white/10 bg-[#0b0917]/70 px-4 text-sm font-bold text-white outline-none placeholder:text-slate-500"
            placeholder={isRegister ? "At least 8 characters" : "Your password"}
            autoComplete={isRegister ? "new-password" : "current-password"}
            required
            minLength={isRegister ? 8 : undefined}
          />
        </label>

        {error ? (
          <p className="rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-100">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-600 px-4 text-sm font-black text-white shadow-lg shadow-violet-500/25 disabled:cursor-wait disabled:opacity-70"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : isRegister ? <UserRound className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
          {isRegister ? "Create account" : "Log in"}
        </button>

        <button
          type="button"
          onClick={() => onModeChange(isRegister ? "login" : "register")}
          className="inline-flex h-10 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-sm font-bold text-slate-200 transition hover:bg-white/[0.1]"
        >
          {isRegister ? "Use an existing account" : "Create a new account"}
        </button>
      </form>
    </ModalShell>
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
  authUser,
  onLogin,
  onLogout,
}: {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onAsk: () => void;
  feedSource: "live";
  authUser: UserAccount | null;
  onLogin: () => void;
  onLogout: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b0917]/80 backdrop-blur-2xl">
      <div className="mx-auto grid min-h-20 w-full max-w-[1800px] gap-4 px-4 py-4 sm:px-5 lg:grid-cols-[minmax(210px,280px)_minmax(0,1fr)_auto] lg:items-center lg:gap-5 lg:px-8">
        <button type="button" onClick={() => onTabChange("radar")} className="flex min-w-0 w-fit items-center gap-3 text-left lg:w-auto">
          <RadarLogo />
          <div className="min-w-0">
            <p className="text-xl font-black leading-none text-white">AI Radar</p>
            <p className="mt-1 text-sm text-slate-400 lg:max-w-44 xl:max-w-none">Turn AI news into proof of work</p>
          </div>
        </button>

        <nav className="scrollbar-none flex min-w-0 flex-nowrap items-center gap-2 overflow-x-auto">
          {tabItems.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={cx(
                  "inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3 text-xs font-black transition xl:h-11 xl:px-4 xl:text-sm",
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

        <div className="scrollbar-none flex max-w-full shrink-0 flex-nowrap items-center gap-2 overflow-x-auto xl:gap-3">
          <SourcePill source={feedSource} />
          {authUser ? (
            <div className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] py-1 pl-3 pr-1">
              <UserRound className="h-4 w-4 text-violet-200" />
              <span className="max-w-24 truncate text-sm font-bold text-slate-200 xl:max-w-40">{authUser.name || authUser.email}</span>
              <button
                type="button"
                title="Log out"
                onClick={onLogout}
                className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.07] text-slate-200 transition hover:border-red-300/30 hover:bg-red-500/10 hover:text-red-100"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onLogin}
              className="inline-flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-white/[0.07] px-4 text-sm font-black text-white transition hover:border-violet-400/30 hover:bg-white/[0.1]"
            >
              <LogIn className="h-4 w-4" />
              Log in
            </button>
          )}
          <button
            type="button"
            onClick={onAsk}
            className="inline-flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-4 text-sm font-black text-white shadow-lg shadow-indigo-500/25 transition hover:from-blue-400 hover:to-indigo-500"
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
  const [feedSource, setFeedSource] = useState<"live">("live");
  const [feedMessage, setFeedMessage] = useState("Loading stored Radar posts...");
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [radarFilter, setRadarFilter] = useState("All");
  const [searchFilter, setSearchFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AIUpdate[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchHasMore, setSearchHasMore] = useState(false);
  const [loadingMoreSearch, setLoadingMoreSearch] = useState(false);
  const [searchMessage, setSearchMessage] = useState("Search stored Radar posts; live crawling refreshes in the background.");
  const [searchRefreshTick, setSearchRefreshTick] = useState(0);
  const [searchAutoRefreshes, setSearchAutoRefreshes] = useState(0);
  const [crawlUrl, setCrawlUrl] = useState("");
  const [crawling, setCrawling] = useState(false);
  const [visibleRadarCount, setVisibleRadarCount] = useState(5);
  const [loadingMoreRadar, setLoadingMoreRadar] = useState(false);
  const [loadingLiveRadar, setLoadingLiveRadar] = useState(false);
  const [radarDiscoveryPage, setRadarDiscoveryPage] = useState(0);
  const [emptyRadarFetches, setEmptyRadarFetches] = useState(0);
  const [clientId, setClientId] = useState("");
  const [authUser, setAuthUser] = useState<UserAccount | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
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
  const loadingSearchPageRef = useRef(false);
  const authCheckedRef = useRef(false);

  const handleTabChange = useCallback((tab: TabId) => {
    setDetailsItem(null);
    setActiveTab(tab);
  }, []);

  useEffect(() => {
    if (!detailsItem) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [detailsItem]);

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
    if (!clientId || authCheckedRef.current) return;
    authCheckedRef.current = true;

    let cancelled = false;
    async function loadAccountSession() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { user?: UserAccount | null };
        if (!cancelled && data.user) {
          setAuthUser(data.user);
          setClientId(data.user.clientId);
        }
      } catch {
        // Anonymous local mode remains available.
      }
    }

    void loadAccountSession();
    return () => {
      cancelled = true;
    };
  }, [clientId]);

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
    if (activeTab !== "search" && !query) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setSearching(true);
      setSearchHasMore(false);
      try {
        const params = new URLSearchParams({
          limit: String(SEARCH_PAGE_SIZE),
          offset: "0",
        });
        if (query) params.set("q", query);
        if (clientId) params.set("clientId", clientId);
        const response = await fetch(`/api/search?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = (await response.json()) as RadarResponse;
        setSearchResults(data.items);
        setSearchMessage(data.message);
        setSearchHasMore(Boolean(data.hasMore));
      } catch {
        if (!controller.signal.aborted) {
          setSearchResults([]);
          setSearchHasMore(false);
          setSearchMessage("Could not reach live search. Try refreshing Search again.");
        }
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, query ? 360 : 0);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [activeTab, clientId, searchQuery, searchRefreshTick]);

  useEffect(() => {
    if (!searchHasMore || searching || !searchResults?.length || loadingSearchPageRef.current) return;

    const query = searchQuery.trim();
    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      loadingSearchPageRef.current = true;
      setLoadingMoreSearch(true);
      try {
        const params = new URLSearchParams({
          limit: String(SEARCH_PAGE_SIZE),
          offset: String(searchResults.length),
        });
        if (query) params.set("q", query);
        if (clientId) params.set("clientId", clientId);

        const response = await fetch(`/api/search?${params.toString()}`, { cache: "no-store" });
        const data = (await response.json()) as RadarResponse;
        if (cancelled) return;

        setSearchResults((current) => mergeItems(current ?? [], data.items));
        setSearchHasMore(Boolean(data.hasMore && data.items.length > 0));
        setSearchMessage(data.message);
      } catch {
        if (!cancelled) {
          setSearchHasMore(false);
          setSearchMessage("Search loaded the first results. Try Refresh live search for more.");
        }
      } finally {
        loadingSearchPageRef.current = false;
        if (!cancelled) setLoadingMoreSearch(false);
      }
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [clientId, searchHasMore, searchQuery, searchResults, searching]);

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

  const allItems = useMemo(() => mergeItems(items, searchResults ?? [], Object.values(savedItems)), [items, savedItems, searchResults]);
  const itemMap = useMemo(() => new Map(allItems.map((item) => [item.id, item])), [allItems]);
  const filteredRadarItems = useMemo(() => filterItems(items, radarFilter), [items, radarFilter]);
  const visibleRadarItems = filteredRadarItems.slice(0, visibleRadarCount);
  const newestRadarItem = useMemo(() => {
    const timestamp = (item: AIUpdate) => {
      const time = Date.parse(item.date);
      return Number.isFinite(time) ? time : 0;
    };
    return [...filteredRadarItems].sort((a, b) => timestamp(b) - timestamp(a))[0] ?? items[0];
  }, [filteredRadarItems, items]);
  const featuredItem = filteredRadarItems.find((item) => item.isFeatured) ?? filteredRadarItems[0];
  const visibleSearchResults = useMemo(() => {
    const base = searchResults ?? [];
    return filterItems(base, searchFilter);
  }, [searchFilter, searchResults]);
  const savedTutorials = savedIds.map((id) => itemMap.get(id)).filter((item): item is AIUpdate => Boolean(item));
  const projectItems = Object.keys(projectStatuses)
    .map((id) => itemMap.get(id))
    .filter((item): item is AIUpdate => Boolean(item));
  const buildItems = mergeItems(savedTutorials, projectItems);
  const compareItems = compareIds.map((id) => itemMap.get(id)).filter((item): item is AIUpdate => Boolean(item));
  const progress = getProgressTotals(allItems, savedIds, projectStatuses, promptsCopied);
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
    if (loadingMoreRadar || loadingLiveRadar) return;

    if (visibleRadarCount < filteredRadarItems.length) {
      setVisibleRadarCount((count) => count + 6);
      return;
    }

    setLoadingMoreRadar(true);
    try {
      const params = new URLSearchParams({
        offset: String(items.length),
        limit: "8",
        filter: radarFilter,
      });
      if (clientId) params.set("clientId", clientId);
      const response = await fetch(`/api/radar?${params.toString()}`, { cache: "no-store" });
      const data = (await response.json()) as RadarResponse;
      let addedCount = 0;
      setItems((current) => {
        const merged = mergeItems(current, data.items);
        addedCount = merged.length - current.length;
        return merged;
      });
      setFeedSource(data.source);
      setFeedMessage(data.message);
      setEmptyRadarFetches((count) => (addedCount <= 0 ? count + 1 : 0));
      setVisibleRadarCount((count) => count + 6);
    } catch {
      setVisibleRadarCount((count) => count + 6);
      setEmptyRadarFetches((count) => count + 1);
    } finally {
      setLoadingMoreRadar(false);
    }
  }, [
    clientId,
    filteredRadarItems.length,
    items.length,
    loadingLiveRadar,
    loadingMoreRadar,
    radarFilter,
    visibleRadarCount,
  ]);

  const loadMoreLiveRadar = useCallback(async () => {
    if (loadingLiveRadar) return;

    const discoveryQueries = [
      `${preferences.audience} AI tools ${preferences.interests.join(" ")} setup tutorial`,
      `new AI tools for ${preferences.interests.join(" ")} ${preferences.access} ${preferences.difficulty}`,
      `latest AI workflows for ${preferences.audience} launchpad starter prompts`,
      `AI tools worth trying for ${preferences.audience} ${preferences.interests.join(" ")}`,
    ];
    const discoveryQuery = discoveryQueries[radarDiscoveryPage % discoveryQueries.length];
    setLoadingLiveRadar(true);
    try {
      const params = new URLSearchParams({
        live: "1",
        limit: "6",
        filter: radarFilter,
        q: discoveryQuery,
      });
      if (clientId) params.set("clientId", clientId);
      const response = await fetch(`/api/radar?${params.toString()}`, { cache: "no-store" });
      const data = (await response.json()) as RadarResponse;
      let addedCount = 0;
      setItems((current) => {
        const merged = mergeItems(current, data.items);
        addedCount = merged.length - current.length;
        return merged;
      });
      setFeedSource(data.source);
      setFeedMessage(data.message);
      setRadarDiscoveryPage((page) => page + 1);
      setEmptyRadarFetches((count) => (addedCount <= 0 ? count + 1 : 0));
      setVisibleRadarCount((count) => count + Math.max(6, data.items.length));
      if (addedCount <= 0) {
        setToast("No fresh posts returned yet. Try another preference or source URL.");
      }
    } catch {
      setToast("Could not load fresh live posts yet.");
    } finally {
      setLoadingLiveRadar(false);
    }
  }, [
    clientId,
    loadingLiveRadar,
    preferences,
    radarDiscoveryPage,
    radarFilter,
  ]);

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
    setSearchResults(null);
    setSearchHasMore(false);
    loadingSearchPageRef.current = false;
    setLoadingMoreSearch(false);
    setSearchAutoRefreshes(0);
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
    setSearchResults(null);
    setSearchHasMore(false);
    loadingSearchPageRef.current = false;
    setLoadingMoreSearch(false);
    setSearchAutoRefreshes(0);
    setSearchRefreshTick((tick) => tick + 1);
  }

  function openAuth(mode: AuthMode = "login") {
    setAuthMode(mode);
    setAuthError("");
    setAuthOpen(true);
  }

  async function submitAuth(form: AuthForm) {
    setAuthLoading(true);
    setAuthError("");
    try {
      const response = await fetch(`/api/auth/${authMode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          clientId,
        }),
      });
      const data = (await response.json()) as { user?: UserAccount | null; message?: string };
      if (!response.ok || !data.user) {
        throw new Error(data.message || "Account request failed.");
      }

      setAuthUser(data.user);
      setClientId(data.user.clientId);
      setAuthOpen(false);
      showToast(authMode === "register" ? "Account created and Launchpad connected" : "Logged in and Launchpad connected");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Account request failed.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setAuthUser(null);
      setClientId(getOrCreateClientId());
      showToast("Logged out");
    }
  }

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[radial-gradient(ellipse_at_15%_0%,rgba(139,111,255,0.22),transparent_32%),radial-gradient(ellipse_at_85%_10%,rgba(79,123,255,0.16),transparent_34%),radial-gradient(ellipse_at_50%_80%,rgba(99,71,220,0.10),transparent_40%),linear-gradient(160deg,#0b0917_0%,#0d0a1e_50%,#0f0c26_100%)] text-white">
      <WebsiteNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onAsk={() => setAskOpen(true)}
        feedSource={feedSource}
        authUser={authUser}
        onLogin={() => openAuth("login")}
        onLogout={() => void logout()}
      />

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-5 sm:py-8 lg:px-8 lg:py-10">
        {detailsItem ? (
          <ArticlePage
            item={detailsItem}
            alternatives={detailAlternatives}
            saved={savedIds.includes(detailsItem.id)}
            onBack={() => setDetailsItem(null)}
            onSave={toggleSavedItem}
            onTutorial={setTutorialItem}
            onCopyPrompt={copyText}
          />
        ) : (
          <>
        {activeTab === "radar" ? (
          <section className="space-y-8">
            <header className="relative overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/30 backdrop-blur-xl sm:rounded-[34px] sm:p-6 lg:p-8">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/60 to-transparent" />
              <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-violet-600/10 blur-3xl" />
              <div className="flex flex-wrap items-center gap-3">
                <p className="rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-sm font-bold text-violet-200">
                  {formatDate(new Date().toISOString().slice(0, 10))}
                </p>
                <SourcePill source={feedSource} />
              </div>
              <h1 className="mt-6 max-w-4xl text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-6xl">
                Today&apos;s AI Radar
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
                The newest crawled AI update, rewritten into a practical student-friendly walkthrough.
              </p>
              {newestRadarItem ? (
                <LatestRadarPreview
                  item={newestRadarItem}
                  saved={savedIds.includes(newestRadarItem.id)}
                  onSave={toggleSavedItem}
                  onTutorial={setTutorialItem}
                  onCopyPrompt={copyText}
                  onDetails={setDetailsItem}
                />
              ) : (
                <div className="mt-8 grid min-h-48 place-items-center rounded-[26px] border border-white/10 bg-[#0b0917]/40 text-sm font-bold text-slate-300">
                  {loadingFeed ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-violet-300" />
                      Loading latest crawl
                    </span>
                  ) : (
                    feedMessage
                  )}
                </div>
              )}
            </header>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.055] p-3 backdrop-blur-xl sm:rounded-[28px] sm:p-4">
              <div className="mb-4 rounded-2xl border border-violet-400/20 bg-violet-500/10 p-4">
                <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
                  <label className="flex min-h-12 items-center gap-3 rounded-xl border border-white/10 bg-[#0b0917]/50 px-3 sm:px-4">
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
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-4 text-sm font-black text-white disabled:cursor-wait disabled:opacity-70 lg:w-auto"
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
                  {loadingMoreRadar || loadingLiveRadar ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-violet-300" />
                      {loadingLiveRadar ? "Crawling fresh live posts" : "Loading more stored posts"}
                    </span>
                  ) : (
                    <div className="flex flex-wrap items-center justify-center gap-2 p-3">
                      <button
                        type="button"
                        onClick={loadMoreRadar}
                        className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-4 text-sm font-black text-white transition hover:border-violet-400/30 hover:bg-white/[0.12]"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Load more
                      </button>
                      {emptyRadarFetches > 0 ? (
                        <button
                          type="button"
                          onClick={loadMoreLiveRadar}
                          className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-indigo-600 px-4 text-sm font-black text-white"
                        >
                          <Sparkles className="h-4 w-4" />
                          Crawl fresh posts
                        </button>
                      ) : (
                        <span className="text-sm text-slate-400">Scroll or tap to continue</span>
                      )}
                    </div>
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
                <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">Search AI Radar</h1>
                <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
                  Find AI tools, updates, tutorials, prompts, and student-friendly perks.
                </p>
              </div>
              <div className="grid gap-2 sm:flex sm:flex-wrap">
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
                  Compare
                </button>
              </div>
            </header>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.065] p-3 backdrop-blur-xl sm:rounded-[32px] sm:p-5">
              <label className="flex h-14 items-center gap-3 rounded-2xl border border-white/10 bg-[#0b0917]/40 px-4 sm:h-16 sm:gap-4 sm:px-5">
                <Search className="h-5 w-5 shrink-0 text-violet-300" />
                <input
                  value={searchQuery}
                  onChange={(event) => handleSearchInput(event.target.value)}
                  placeholder="Search presentations, coding, video, free tools..."
                  className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-slate-500 sm:text-lg"
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

            <div className="flex flex-wrap items-center justify-end gap-3">
              <p className="text-sm text-slate-500">{searchMessage}</p>
            </div>

            {searching && !searchResults ? (
              <div className="grid min-h-[320px] place-items-center rounded-[28px] border border-white/10 bg-white/[0.06]">
                <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-300">
                  <Loader2 className="h-5 w-5 animate-spin text-violet-300" />
                  Loading live search
                </span>
              </div>
            ) : visibleSearchResults.length ? (
              <>
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
                {loadingMoreSearch ? (
                  <div className="grid min-h-16 place-items-center rounded-[18px] border border-white/10 bg-white/[0.04] text-sm font-bold text-slate-300">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-violet-300" />
                      Loading more live results
                    </span>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="rounded-[24px] border border-white/10 bg-white/[0.06] p-6 text-center sm:rounded-[28px] sm:p-10">
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
                <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">Saved Radar</h1>
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
                <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">Launchpad</h1>
                <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
                  Track saved AI tools, access limits, setup steps, and what to try next.
                </p>
              </div>
              <div className="grid gap-2 sm:flex sm:flex-wrap">
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

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatTile label="Projects completed" value={progress.completedProjects} icon={Trophy} tone="emerald" />
              <StatTile label="Tutorials completed" value={progress.tutorialsCompleted} icon={CheckCircle2} tone="violet" />
              <StatTile label="Prompts copied" value={progress.promptsCopied} icon={Copy} tone="blue" />
              <StatTile label="Saved tools" value={progress.savedTools} icon={Bookmark} tone="amber" />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-white/10 bg-white/[0.055] px-4 py-4 sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-violet-500/20 text-violet-100">
                  <UserRound className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-white">
                    {authUser ? `Launchpad connected to ${authUser.name || authUser.email}` : "Launchpad is saved on this browser"}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    {authUser ? "Your saved tools and project statuses sync through Neon." : "Log in to sync this Launchpad across devices."}
                  </p>
                </div>
              </div>
              {authUser ? null : (
                <button
                  type="button"
                  onClick={() => openAuth("login")}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-indigo-600 px-4 text-sm font-black text-white sm:w-auto"
                >
                  <LogIn className="h-4 w-4" />
                  Log in
                </button>
              )}
            </div>

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
          </section>
        ) : null}

        {activeTab === "preferences" ? (
          <section className="space-y-7">
            <header>
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-violet-300">Personalization</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">Radar Preferences</h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
                Tune Radar and Search so crawled AI updates match your role, interests, access needs, and skill level.
              </p>
            </header>

            <div className="grid gap-5 lg:grid-cols-2">
              <section className="rounded-[24px] border border-white/10 bg-white/[0.06] p-4 sm:rounded-[28px] sm:p-5">
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

              <section className="rounded-[24px] border border-white/10 bg-white/[0.06] p-4 sm:rounded-[28px] sm:p-5">
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

              <section className="rounded-[24px] border border-white/10 bg-white/[0.06] p-4 sm:rounded-[28px] sm:p-5 lg:col-span-2">
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
                  className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-indigo-600 px-5 text-sm font-black text-white sm:w-auto"
                >
                  <Sparkles className="h-4 w-4" />
                  Save preferences and refresh Radar
                </button>
              </section>
            </div>
          </section>
        ) : null}
          </>
        )}
      </main>

      <Toast message={toast} />

      {authOpen ? (
        <AuthModal
          mode={authMode}
          error={authError}
          loading={authLoading}
          onClose={() => setAuthOpen(false)}
          onModeChange={(nextMode) => {
            setAuthMode(nextMode);
            setAuthError("");
          }}
          onSubmit={submitAuth}
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
