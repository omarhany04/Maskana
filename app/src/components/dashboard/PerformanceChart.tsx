"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { DashboardStats } from "@real-estate-crm/shared";

import { formatCurrency } from "@/lib/utils";

export function PerformanceChart({ stats }: { stats: DashboardStats }) {
  return (
    <div className="glass-panel fade-up stagger-2 p-6">
      <p className="text-xs font-bold uppercase text-sea-700">Performance graph</p>
      <h3 className="mt-2 text-2xl font-bold text-ink">Agent close rate and commission</h3>
      <div className="mt-6 h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.agentPerformance}>
            <defs>
              <linearGradient id="conversionGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#20C9AE" />
                <stop offset="100%" stopColor="#0D7F75" />
              </linearGradient>
              <linearGradient id="commissionGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#F8D766" />
                <stop offset="100%" stopColor="#D6A21F" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="rgba(148, 163, 184, 0.24)" />
            <XAxis dataKey="agentName" tick={{ fill: "#475569", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#475569", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: "rgba(20, 184, 166, 0.08)" }}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid rgba(226, 232, 240, 0.9)",
                boxShadow: "0 20px 44px -24px rgba(15, 23, 42, 0.34)",
              }}
              formatter={(value: number, name: string) =>
                name === "totalCommission" ? formatCurrency(value) : value.toFixed(1)
              }
            />
            <Bar dataKey="conversionRate" name="conversionRate" fill="url(#conversionGradient)" radius={[8, 8, 0, 0]} />
            <Bar dataKey="totalCommission" name="totalCommission" fill="url(#commissionGradient)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
