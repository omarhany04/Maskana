"use client";

import { useState, useTransition } from "react";
import { Activity, BadgeDollarSign, Building2, Gauge, Sparkles, Target, TrendingUp, Users2 } from "lucide-react";

import type { AIAnalyzeResponse, AIChatResponse, DashboardStats, SessionUser } from "@real-estate-crm/shared";

import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { formatCurrency, formatPercent } from "@/lib/utils";

export function DashboardOverview({
  company,
  currentUser,
  stats,
}: {
  company: {
    id: string;
    name: string;
    slug: string;
    createdAt: Date | string;
    settings: unknown;
  };
  currentUser: SessionUser;
  stats: DashboardStats;
}) {
  const [analysisResult, setAnalysisResult] = useState<AIAnalyzeResponse | null>(null);
  const [chatResult, setChatResult] = useState<AIChatResponse | null>(null);
  const [semanticMatches, setSemanticMatches] = useState<Array<Record<string, unknown>>>([]);
  const [query, setQuery] = useState("Need a 3 bedroom apartment in downtown under 500k");
  const [chatMessage, setChatMessage] = useState("Show me strong matches for buyers interested in premium downtown apartments.");
  const [isPending, startTransition] = useTransition();
  const totalCommission = stats.agentPerformance.reduce((sum, agent) => sum + agent.totalCommission, 0);
  const strongestAgent = stats.agentPerformance.reduce(
    (best, agent) => (agent.conversionRate > best.conversionRate ? agent : best),
    stats.agentPerformance[0] ?? {
      userId: "none",
      agentName: "No agents yet",
      totalLeads: 0,
      closedLeads: 0,
      conversionRate: 0,
      totalCommission: 0,
    },
  );

  async function runAnalyze() {
    startTransition(async () => {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      setAnalysisResult(await response.json());
    });
  }

  async function runSemanticSearch() {
    startTransition(async () => {
      const response = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, limit: 5 }),
      });
      const data = await response.json();
      setSemanticMatches(data.matches ?? []);
    });
  }

  async function runChat() {
    startTransition(async () => {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: chatMessage }),
      });
      setChatResult(await response.json());
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={company.slug}
        title={`${company.name} command dashboard`}
        description={`Live tenant-scoped performance visibility for ${currentUser.role.toLowerCase()} operations.`}
        action={
          <div className="flex items-center gap-3 rounded-lg border border-slate-200/80 bg-white/[0.85] px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
            <Gauge className="h-4 w-4 text-sea-700" />
            {formatPercent(stats.conversionRate)} close rate
          </div>
        }
      />

      <section className="glass-panel fade-up stagger-1 overflow-hidden p-6">
        <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr] xl:items-center">
          <div>
            <p className="text-xs font-semibold uppercase text-sea-700">Executive pulse</p>
            <h3 className="mt-2 text-3xl font-bold text-ink">Revenue, demand, and team momentum in one view.</h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              The dashboard now surfaces the operating signals your team needs before jumping into leads or listings.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Commission", value: formatCurrency(totalCommission), icon: BadgeDollarSign },
                { label: "Top agent", value: strongestAgent.agentName, icon: TrendingUp },
                { label: "Scope", value: currentUser.role.toLowerCase(), icon: Users2 },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.label} className="rounded-lg border border-slate-200/80 bg-white/80 p-4 shadow-sm">
                    <Icon className="h-4 w-4 text-sea-700" />
                    <p className="mt-3 text-xs font-semibold uppercase text-slate-500">{item.label}</p>
                    <p className="mt-1 truncate text-lg font-bold text-ink">{item.value}</p>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200/80 bg-ink p-5 text-white shadow-lift">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-sea-100">Pipeline velocity</p>
              <StatusBadge value="ACTIVE" />
            </div>
            <div className="mt-5 space-y-4">
              {stats.pipeline.length > 0 ? (
                stats.pipeline.map((stage) => {
                  const width = stats.totalLeads === 0 ? 0 : Math.max(8, Math.round((stage.count / stats.totalLeads) * 100));

                  return (
                    <div key={stage.status}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-200">{stage.status.replaceAll("_", " ").toLowerCase()}</span>
                        <span className="font-semibold text-white">{stage.count}</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-gradient-to-r from-sea-300 via-signal-blue to-gold-300" style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-slate-300">Pipeline stages appear as leads enter the workspace.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        <StatCard
          icon={Target}
          label="Total leads"
          value={stats.totalLeads.toString()}
          detail="Qualified pipeline across your current tenant scope."
          accent="bg-sea-600"
        />
        <StatCard
          icon={Activity}
          label="Conversion rate"
          value={formatPercent(stats.conversionRate)}
          detail="Closed leads divided by total visible leads."
          accent="bg-ink"
        />
        <StatCard
          icon={Building2}
          label="Open properties"
          value={stats.openProperties.toString()}
          detail="Listings currently active and searchable."
          accent="bg-gold-500"
        />
        <StatCard
          icon={Users2}
          label="Active agents"
          value={stats.totalAgents.toString()}
          detail="Commission-eligible agents in this company."
          accent="bg-slate-700"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <PerformanceChart stats={stats} />

        <div className="glass-panel p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sea-700">Pipeline health</p>
          <h3 className="mt-2 text-2xl font-bold text-ink">Stage distribution</h3>
          <div className="mt-6 space-y-4">
            {stats.pipeline.map((stage) => (
              <div key={stage.status} className="rounded-2xl border border-slate-200/80 bg-white/80 p-4">
                <div className="flex items-center justify-between">
                  <StatusBadge value={stage.status} />
                  <span className="text-2xl font-bold text-ink">{stage.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="glass-panel p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sea-700">AI command suite</p>
              <h3 className="mt-2 text-2xl font-bold text-ink">Analyze, search, and respond</h3>
            </div>
            <div className="rounded-2xl bg-sea-100 p-3">
              <Sparkles className="h-5 w-5 text-sea-700" />
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <div className="rounded-3xl border border-slate-200/80 bg-slate-50/80 p-4">
              <label className="text-sm font-medium text-slate-700">Natural language query</label>
              <textarea
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="mt-3 min-h-28 w-full rounded-2xl border-slate-200 bg-white text-sm"
              />
              <div className="mt-4 flex flex-wrap gap-3">
                <Button onClick={runAnalyze} disabled={isPending}>
                  Analyze query
                </Button>
                <Button variant="secondary" onClick={runSemanticSearch} disabled={isPending}>
                  Semantic search
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Structured intent</p>
                {analysisResult ? (
                  <div className="mt-4 space-y-3 text-sm text-slate-700">
                    <div className="flex justify-between gap-3">
                      <span>Budget</span>
                      <span className="font-semibold">{analysisResult.budget ? formatCurrency(analysisResult.budget) : "N/A"}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span>Location</span>
                      <span className="font-semibold">{analysisResult.location ?? "N/A"}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span>Property type</span>
                      <span className="font-semibold">{analysisResult.propertyType ?? "N/A"}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span>Intent</span>
                      <StatusBadge value={analysisResult.intent} />
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">Run analysis to extract buyer intent and filters.</p>
                )}
              </div>

              <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Semantic matches</p>
                {semanticMatches.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {semanticMatches.map((match, index) => (
                      <div key={`${String(match.id)}-${index}`} className="rounded-2xl bg-slate-50 p-3">
                        <p className="font-semibold text-slate-700">{String(match.title ?? "Untitled")}</p>
                        <p className="mt-1 text-xs text-slate-500">{String(match.location ?? "Unknown location")}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">Search results from the FAISS-backed vector store appear here.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sea-700">Chat workflow</p>
          <h3 className="mt-2 text-2xl font-bold text-ink">RAG-ready assistant panel</h3>
          <textarea
            value={chatMessage}
            onChange={(event) => setChatMessage(event.target.value)}
            className="mt-5 min-h-32 w-full rounded-3xl border-slate-200 bg-white text-sm"
          />
          <div className="mt-4 flex justify-end">
            <Button onClick={runChat} disabled={isPending}>
              Generate response
            </Button>
          </div>

          {chatResult ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-3xl bg-ink p-5 text-sm leading-7 text-slate-100">{chatResult.answer}</div>
              <div className="space-y-3">
                {chatResult.references.map((reference) => (
                  <div key={reference.propertyId} className="rounded-2xl border border-slate-200/80 bg-white/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-700">{reference.title}</p>
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-sea-700">
                        {reference.score.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-6 text-sm text-slate-500">Responses and retrieval references appear after the first prompt.</p>
          )}
        </div>
      </section>
    </div>
  );
}
