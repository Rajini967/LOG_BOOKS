import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Thermometer, Gauge, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Equipment {
  id: string;
  name: string;
  type: 'chiller' | 'boiler' | 'compressor';
  status: 'running' | 'idle' | 'alert';
  t1: number;
  t2: number;
  p1: number;
  p2: number;
}

// TODO: Replace with API call to fetch equipment status
const statusConfig = {
  running: { variant: 'success' as const, label: 'Running' },
  idle: { variant: 'secondary' as const, label: 'Idle' },
  alert: { variant: 'danger' as const, label: 'Alert' },
};

export function EquipmentStatus() {
  // TODO: Replace with API call to fetch equipment from backend
  const equipment: Equipment[] = [];
  
  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Equipment Status</h3>
      {equipment.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No equipment data available</p>
        </div>
      ) : (
        <div className="space-y-3">
          {equipment.map((eq) => (
            <div
              key={eq.id}
              className={cn(
                'p-4 rounded-lg border transition-all',
                eq.status === 'alert' ? 'border-danger/50 bg-danger/5' : 'border-border bg-muted/30'
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{eq.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{eq.id}</p>
                </div>
                <Badge variant={statusConfig[eq.status].variant}>
                  <Activity className={cn(
                    'w-3 h-3 mr-1',
                    eq.status === 'running' && 'animate-pulse'
                  )} />
                  {statusConfig[eq.status].label}
                </Badge>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div className="flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">T1:</span>
                  <span className="text-xs font-mono font-medium">{eq.t1}°C</span>
                </div>
                <div className="flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">T2:</span>
                  <span className="text-xs font-mono font-medium">{eq.t2}°C</span>
                </div>
                <div className="flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">P1:</span>
                  <span className="text-xs font-mono font-medium">{eq.p1} bar</span>
                </div>
                <div className="flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">P2:</span>
                  <span className="text-xs font-mono font-medium">{eq.p2} bar</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
