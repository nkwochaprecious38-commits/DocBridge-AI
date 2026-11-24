"use client";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const PALETTE = ["#2463EB", "#16A6A1", "#142B4A", "#75D5CF", "#5B8DEF", "#0E7C78", "#94A3B8"];

export function ActivityChart({ data }: { data: { day: string; Processed: number; Failed: number }[] }) {
  return (
    <div className="h-64 w-full" role="img" aria-label="Processing activity by day">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ left: -20, right: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#142B4A15" vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Processed" stackId="a" fill="#16A6A1" radius={[0, 0, 0, 0]} />
          <Bar dataKey="Failed" stackId="a" fill="#142B4A" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
export function CategoryChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <div className="h-64 w-full" role="img" aria-label="Documents by category">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
            {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
          </Pie>
          <Tooltip /><Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
export function SimpleBar({ data, color = "#2463EB", label }: { data: { name: string; value: number }[]; color?: string; label: string }) {
  return (
    <div className="h-64 w-full" role="img" aria-label={label}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ left: -20, right: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#142B4A15" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} interval={0} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip />
          <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
