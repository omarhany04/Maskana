"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { DashboardStats } from "@real-estate-crm/shared";

import { formatCurrency } from "@/lib/utils";

export function PerformanceChart({ stats }: { stats: DashboardStats }) {
  return (
    <div className="glass-panel p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sea-700">Performance graph</p>
      <h3 className="mt-2 text-2xl font-bold text-ink">Agent close rate and commission</h3>
      <div className="mt-6 h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.agentPerformance}>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
            <XAxis dataKey="agentName" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: "rgba(30, 147, 139, 0.08)" }}
              contentStyle={{
                borderRadius: "20px",
                border: "1px solid rgba(226, 232, 240, 0.9)",
                boxShadow: "0 20px 40px -20px rgba(16, 42, 67, 0.25)",
              }}
              formatter={(value: number, name: string) =>
                name === "totalCommission" ? formatCurrency(value) : value.toFixed(1)
              }
            />
            <Bar dataKey="conversionRate" name="conversionRate" fill="#1E938B" radius={[12, 12, 0, 0]} />
            <Bar dataKey="totalCommission" name="totalCommission" fill="#D4A72C" radius={[12, 12, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
