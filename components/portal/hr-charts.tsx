"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell
} from "recharts";

const palette = ["#ff2e7e", "#8a3ffc", "#002d9c", "#22c55e", "#f59e0b", "#ef4444"];

export function DistributionBarChart({
  data,
  title
}: {
  data: Record<string, number>;
  title: string;
}) {
  const rows = Object.entries(data).map(([name, value]) => ({ name, value }));

  return (
    <article className="glass rounded-2xl p-5">
      <h3 className="mb-4 text-sm font-medium text-foreground">{title}</h3>
      <div className="h-[240px] w-full">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={rows}>
            <CartesianGrid stroke="#e4e4e7" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "#71717a", fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fill: "#71717a", fontSize: 12 }} />
            <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: 12, color: "#18181b" }} />
            <Bar dataKey="value" fill="var(--tenant-accent, #ff2e7e)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

export function HeadcountLineChart({
  data,
  title
}: {
  data: Array<{ hired: number; month: string; resigned: number }>;
  title: string;
}) {
  return (
    <article className="glass rounded-2xl p-5">
      <h3 className="mb-4 text-sm font-medium text-foreground">{title}</h3>
      <div className="h-[260px] w-full">
        <ResponsiveContainer height="100%" width="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="#e4e4e7" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: "#71717a", fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fill: "#71717a", fontSize: 12 }} />
            <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: 12, color: "#18181b" }} />
            <Legend />
            <Line dataKey="hired" dot={false} name="Hired" stroke="#ff2e7e" strokeWidth={2} type="monotone" />
            <Line dataKey="resigned" dot={false} name="Resigned" stroke="#ef4444" strokeWidth={2} type="monotone" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

export function DistributionPieChart({
  data,
  title
}: {
  data: Record<string, number>;
  title: string;
}) {
  const rows = Object.entries(data).map(([name, value]) => ({ name, value }));

  return (
    <article className="glass rounded-2xl p-5">
      <h3 className="mb-4 text-sm font-medium text-foreground">{title}</h3>
      <div className="h-[260px] w-full">
        <ResponsiveContainer height="100%" width="100%">
          <PieChart>
            <Pie data={rows} dataKey="value" innerRadius={55} label nameKey="name" outerRadius={90}>
              {rows.map((_, index) => (
                <Cell fill={palette[index % palette.length]} key={index} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: 12, color: "#18181b" }} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}
