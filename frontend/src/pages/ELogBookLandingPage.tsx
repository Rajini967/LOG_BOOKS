import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Thermometer, Gauge, Droplets, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { chillerLogAPI, boilerLogAPI, chemicalPrepAPI } from '@/lib/api';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface EquipmentModule {
  id: string;
  name: string;
  description: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const equipmentModules: EquipmentModule[] = [
  {
    id: 'chiller',
    name: 'Chiller',
    description: 'Monitor chiller temperature, pressure, and flow readings',
    path: '/e-log-book/chiller',
    icon: Thermometer,
    color: 'bg-blue-500',
  },
  {
    id: 'boiler',
    name: 'Boiler',
    description: 'Track boiler feed water, steam, and oil temperature',
    path: '/e-log-book/boiler',
    icon: Gauge,
    color: 'bg-orange-500',
  },
  {
    id: 'chemical',
    name: 'Chemical',
    description: 'Manage chemical preparation and solution concentrations',
    path: '/e-log-book/chemical',
    icon: Droplets,
    color: 'bg-green-500',
  },
];

type CombinedEquipmentType = 'chiller' | 'boiler' | 'chemical';

interface CombinedLogRow {
  id: string;
  equipmentType: CombinedEquipmentType;
  equipmentId?: string;
  equipmentName?: string;
  date: string;
  time: string;
  readings: { text: string; outOfLimit?: boolean }[];
  remarks: string;
  checkedBy: string;
  status: 'pending' | 'approved' | 'rejected' | 'draft';
  timestamp: Date;
}

export default function ELogBookLandingPage() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<CombinedLogRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<CombinedLogRow | null>(null);

  const loadAllLogs = async () => {
    try {
      setIsLoading(true);

      const [chillerLogs, boilerLogs, chemicalLogs] = await Promise.all([
          chillerLogAPI.list().catch((err) => {
            console.error('Error fetching chiller logs:', err);
            return [];
          }),
          boilerLogAPI.list().catch((err) => {
            console.error('Error fetching boiler logs:', err);
            return [];
          }),
          chemicalPrepAPI.list().catch((err) => {
            console.error('Error fetching chemical logs:', err);
            return [];
          }),
      ]);

      const combined: CombinedLogRow[] = [];

      // Chiller readings limits (same as chiller page summary)
      const chillerLimits = {
        supplyMax: 8,
        returnMax: 15,
        ctSupplyMax: 25,
        ctReturnMax: 30,
        ctDiffMax: 5,
        pressureMin: 2,
      };

      // Boiler limits (same as boiler page)
      const boilerLimits = {
        feedWaterMin: 50,
        oilMin: 50,
        steamTempMin: 150,
        steamPressureMin: 6,
      };

      chillerLogs.forEach((log: any) => {
          const timestamp = new Date(log.timestamp);
          const parts: { text: string; outOfLimit?: boolean }[] = [];
          if (log.chiller_supply_temp !== undefined && log.chiller_supply_temp !== null) {
            parts.push({
              text: `Supply: ${log.chiller_supply_temp}°C`,
              outOfLimit: log.chiller_supply_temp > chillerLimits.supplyMax,
            });
          }
          if (log.chiller_return_temp !== undefined && log.chiller_return_temp !== null) {
            parts.push({
              text: `Return: ${log.chiller_return_temp}°C`,
              outOfLimit: log.chiller_return_temp > chillerLimits.returnMax,
            });
          }
          if (log.cooling_tower_supply_temp !== undefined && log.cooling_tower_supply_temp !== null) {
            parts.push({
              text: `CT Supply: ${log.cooling_tower_supply_temp}°C`,
              outOfLimit: log.cooling_tower_supply_temp > chillerLimits.ctSupplyMax,
            });
          }
          if (log.cooling_tower_return_temp !== undefined && log.cooling_tower_return_temp !== null) {
            parts.push({
              text: `CT Return: ${log.cooling_tower_return_temp}°C`,
              outOfLimit: log.cooling_tower_return_temp > chillerLimits.ctReturnMax,
            });
          }
          if (log.ct_differential_temp !== undefined && log.ct_differential_temp !== null) {
            parts.push({
              text: `CT Diff: ${log.ct_differential_temp}°C`,
              outOfLimit: log.ct_differential_temp > chillerLimits.ctDiffMax,
            });
          }
          if (log.chiller_water_inlet_pressure !== undefined && log.chiller_water_inlet_pressure !== null) {
            parts.push({
              text: `Pressure: ${log.chiller_water_inlet_pressure} bar`,
              outOfLimit: log.chiller_water_inlet_pressure < chillerLimits.pressureMin,
            });
          }
          if (log.chiller_makeup_water_flow !== undefined && log.chiller_makeup_water_flow !== null) {
            parts.push({
              text: `Flow: ${log.chiller_makeup_water_flow} LPH`,
            });
          }

          combined.push({
            id: `chiller-${log.id}`,
            equipmentType: 'chiller',
            equipmentId: log.equipment_id,
            date: format(timestamp, 'yyyy-MM-dd'),
            time: format(timestamp, 'HH:mm:ss'),
            readings: parts,
            remarks: log.remarks || '',
            checkedBy: log.operator_name,
            status: log.status as CombinedLogRow['status'],
            timestamp,
          });
      });

      boilerLogs.forEach((log: any) => {
          const timestamp = new Date(log.timestamp);
          const parts: { text: string; outOfLimit?: boolean }[] = [];
          if (log.feed_water_temp !== undefined && log.feed_water_temp !== null) {
            parts.push({
              text: `Feed Water: ${log.feed_water_temp}°C`,
              outOfLimit: log.feed_water_temp < boilerLimits.feedWaterMin,
            });
          }
          if (log.steam_temp !== undefined && log.steam_temp !== null) {
            parts.push({
              text: `Steam: ${log.steam_temp}°C`,
              outOfLimit: log.steam_temp < boilerLimits.steamTempMin,
            });
          }
          if (log.steam_pressure !== undefined && log.steam_pressure !== null) {
            parts.push({
              text: `Pressure: ${log.steam_pressure} bar`,
              outOfLimit: log.steam_pressure < boilerLimits.steamPressureMin,
            });
          }
          if (log.steam_flow_lph !== undefined && log.steam_flow_lph !== null) {
            parts.push({
              text: `Flow: ${log.steam_flow_lph} LPH`,
            });
          }

          combined.push({
            id: `boiler-${log.id}`,
            equipmentType: 'boiler',
            equipmentId: log.equipment_id,
            date: format(timestamp, 'yyyy-MM-dd'),
            time: format(timestamp, 'HH:mm:ss'),
            readings: parts,
            remarks: log.remarks || '',
            checkedBy: log.operator_name,
            status: log.status as CombinedLogRow['status'],
            timestamp,
          });
      });

      chemicalLogs.forEach((prep: any) => {
          const timestamp = new Date(prep.timestamp);
          const parts: { text: string; outOfLimit?: boolean }[] = [];
          if (prep.chemical_name) {
            parts.push({ text: `Chemical: ${prep.chemical_name}` });
          }
          if (prep.solution_concentration !== undefined && prep.solution_concentration !== null) {
            parts.push({ text: `Solution: ${prep.solution_concentration}%` });
          }
          if (prep.chemical_qty !== undefined && prep.chemical_qty !== null) {
            parts.push({ text: `Qty: ${prep.chemical_qty} kg` });
          }

          combined.push({
            id: `chemical-${prep.id}`,
            equipmentType: 'chemical',
            equipmentName: prep.equipment_name,
            date: format(timestamp, 'yyyy-MM-dd'),
            time: format(timestamp, 'HH:mm:ss'),
            readings: parts,
            remarks: prep.remarks || '',
            checkedBy: prep.checked_by || prep.operator_name,
            status: prep.status as CombinedLogRow['status'],
            timestamp,
          });
      });

      combined.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setLogs(combined);
    } catch (error) {
      console.error('Error loading all logbook entries:', error);
      toast.error('Failed to load logbook entries');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllLogs();
  }, []);

  const handleApprove = async () => {
    if (!selectedLog) return;
    setApproveConfirmOpen(false);
    try {
      const id = selectedLog.id.split('-')[1];
      if (selectedLog.equipmentType === 'chiller') {
        await chillerLogAPI.approve(id, 'approve');
      } else if (selectedLog.equipmentType === 'boiler') {
        await boilerLogAPI.approve(id, 'approve');
      } else if (selectedLog.equipmentType === 'chemical') {
        await chemicalPrepAPI.approve(id, 'approve');
      }
      toast.success('Entry approved successfully');
      await loadAllLogs();
    } catch (error: any) {
      console.error('Error approving entry:', error);
      toast.error(error?.message || 'Failed to approve entry');
    }
  };

  const handleReject = async () => {
    if (!selectedLog) return;
    setRejectConfirmOpen(false);
    try {
      const id = selectedLog.id.split('-')[1];
      if (selectedLog.equipmentType === 'chiller') {
        await chillerLogAPI.approve(id, 'reject');
      } else if (selectedLog.equipmentType === 'boiler') {
        await boilerLogAPI.approve(id, 'reject');
      } else if (selectedLog.equipmentType === 'chemical') {
        await chemicalPrepAPI.approve(id, 'reject');
      }
      toast.success('Entry rejected');
      await loadAllLogs();
    } catch (error: any) {
      console.error('Error rejecting entry:', error);
      toast.error(error?.message || 'Failed to reject entry');
    }
  };

  const handleDelete = async (log: CombinedLogRow) => {
    if (!confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
      return;
    }
    try {
      const id = log.id.split('-')[1];
      if (log.equipmentType === 'chiller') {
        await chillerLogAPI.delete(id);
      } else if (log.equipmentType === 'boiler') {
        await boilerLogAPI.delete(id);
      } else if (log.equipmentType === 'chemical') {
        await chemicalPrepAPI.delete(id);
      }
      toast.success('Entry deleted');
      await loadAllLogs();
    } catch (error: any) {
      console.error('Error deleting entry:', error);
      toast.error(error?.message || 'Failed to delete entry');
    }
  };

  return (
    <div className="min-h-screen">
      <Header
        title="E Log Book"
        subtitle="Select an equipment module to manage log entries"
      />

      <div className="p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {equipmentModules.map((module) => {
            const IconComponent = module.icon;
            return (
              <button
                key={module.id}
                onClick={() => navigate(module.path)}
                className={cn(
                  'bg-card rounded-lg border border-border p-6',
                  'hover:border-accent hover:shadow-lg',
                  'transition-all duration-200',
                  'text-left group',
                  'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2'
                )}
              >
                <div className="flex flex-col items-start gap-4">
                  <div className={cn(
                    'w-16 h-16 rounded-lg flex items-center justify-center',
                    'group-hover:scale-110 transition-transform duration-200',
                    module.color,
                    'text-white'
                  )}>
                    <IconComponent className="w-8 h-8" />
                  </div>
                  
                  <div className="flex-1 w-full">
                    <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
                      {module.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {module.description}
                    </p>
                  </div>
                  
                  <div className="w-full flex items-center justify-between text-sm text-accent group-hover:text-accent/80">
                    <span className="font-medium">Open Module</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Combined logbook list */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              All logbook entries
            </h2>
            <span className="text-xs text-muted-foreground">
              {logs.length} entries
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Time</th>
                  <th className="px-3 py-2 text-left">Module</th>
                  <th className="px-3 py-2 text-left">Equipment</th>
                  <th className="px-3 py-2 text-left">Readings</th>
                  <th className="px-3 py-2 text-left">Remarks</th>
                  <th className="px-3 py-2 text-left">Checked By</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      Loading entries...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      No logbook entries found
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-sm text-foreground">{log.date}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-foreground">{log.time}</span>
                      </td>
                      <td className="px-4 py-3 capitalize">
                        {log.equipmentType}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-foreground">
                          {log.equipmentId || log.equipmentName || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top w-[260px]">
                        <div className="space-y-1 text-xs text-foreground">
                          {log.readings && log.readings.length > 0 ? (
                            log.readings.map((line, idx) => (
                              <p
                                key={idx}
                                className={cn(
                                  'whitespace-nowrap',
                                  line.outOfLimit ? 'text-destructive font-bold' : ''
                                )}
                              >
                                {line.text}
                              </p>
                            ))
                          ) : (
                            <span>-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">
                          {log.remarks || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-foreground">
                          {log.checkedBy || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            log.status === 'approved'
                              ? 'success'
                              : log.status === 'rejected'
                              ? 'danger'
                              : 'pending'
                          }
                        >
                          {log.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {(log.status === 'pending' || log.status === 'draft') &&
                            user?.role !== 'operator' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => {
                                    setSelectedLog(log);
                                    setApproveConfirmOpen(true);
                                  }}
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs text-destructive hover:text-destructive"
                                  onClick={() => {
                                    setSelectedLog(log);
                                    setRejectConfirmOpen(true);
                                  }}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Delete entry"
                            onClick={() => handleDelete(log)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Approve Confirmation */}
      <AlertDialog open={approveConfirmOpen} onOpenChange={setApproveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Approval</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation */}
      <AlertDialog open={rejectConfirmOpen} onOpenChange={setRejectConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Rejection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

