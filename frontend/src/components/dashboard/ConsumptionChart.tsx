import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const data = [
  { day: 'Mon', chemical: 45, steam: 120, fuel: 80 },
  { day: 'Tue', chemical: 52, steam: 115, fuel: 75 },
  { day: 'Wed', chemical: 48, steam: 130, fuel: 85 },
  { day: 'Thu', chemical: 61, steam: 125, fuel: 78 },
  { day: 'Fri', chemical: 55, steam: 118, fuel: 82 },
  { day: 'Sat', chemical: 42, steam: 105, fuel: 70 },
  { day: 'Sun', chemical: 38, steam: 95, fuel: 65 },
];

export function ConsumptionChart() {
  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Weekly Consumption</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorChemical" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(185, 70%, 40%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(185, 70%, 40%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorSteam" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(220, 60%, 25%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(220, 60%, 25%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorFuel" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 88%)" vertical={false} />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'hsl(220, 10%, 45%)' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'hsl(220, 10%, 45%)' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(0, 0%, 100%)',
                border: '1px solid hsl(220, 15%, 88%)',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px hsl(220, 30%, 10%, 0.1)',
              }}
            />
            <Area
              type="monotone"
              dataKey="chemical"
              stroke="hsl(185, 70%, 40%)"
              fillOpacity={1}
              fill="url(#colorChemical)"
              strokeWidth={2}
              name="Chemical (L)"
            />
            <Area
              type="monotone"
              dataKey="steam"
              stroke="hsl(220, 60%, 25%)"
              fillOpacity={1}
              fill="url(#colorSteam)"
              strokeWidth={2}
              name="Steam (kg)"
            />
            <Area
              type="monotone"
              dataKey="fuel"
              stroke="hsl(38, 92%, 50%)"
              fillOpacity={1}
              fill="url(#colorFuel)"
              strokeWidth={2}
              name="Fuel (kg)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-accent" />
          <span className="text-xs text-muted-foreground">Chemical</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span className="text-xs text-muted-foreground">Steam</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-warning" />
          <span className="text-xs text-muted-foreground">Fuel</span>
        </div>
      </div>
    </div>
  );
}
