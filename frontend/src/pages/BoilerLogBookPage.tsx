import React, { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { toast } from "sonner";
import { boilerLogAPI } from "@/lib/api";
import { Clock, Thermometer, Gauge, Save, Filter, X, Plus, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BoilerLog {
  id: string;
  equipmentId: string;
  date: string;
  time: string;
  feedWaterTemp: number;
  oilTemp: number;
  steamTemp: number;
  steamPressure: number;
  steamFlowLPH?: number;
  remarks: string;
  checkedBy: string;
  timestamp: Date;
  status: "pending" | "approved" | "rejected" | "draft";
}

const BoilerLogBookPage: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<BoilerLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<BoilerLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    equipmentId: "",
    feedWaterTemp: "",
    oilTemp: "",
    steamTemp: "",
    steamPressure: "",
    steamFlowLPH: "",
    remarks: "",
  });

  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    status: "all" as "all" | "pending" | "approved" | "rejected",
    equipmentId: "",
    checkedBy: "",
  });

  const refreshLogs = async () => {
    try {
      setIsLoading(true);
      const boilerLogs = await boilerLogAPI.list().catch((err) => {
        console.error("Error fetching boiler logs:", err);
        return [];
      });

      const allLogs: BoilerLog[] = [];
      boilerLogs.forEach((log: any) => {
        const timestamp = new Date(log.timestamp);
        allLogs.push({
          id: log.id,
          equipmentId: log.equipment_id,
          date: format(timestamp, "yyyy-MM-dd"),
          time: format(timestamp, "HH:mm:ss"),
          feedWaterTemp: log.feed_water_temp,
          oilTemp: log.oil_temp,
          steamTemp: log.steam_temp,
          steamPressure: log.steam_pressure,
          steamFlowLPH: log.steam_flow_lph ?? undefined,
          remarks: log.remarks || "",
          checkedBy: log.operator_name,
          timestamp,
          status: log.status as BoilerLog["status"],
        });
      });

      allLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setLogs(allLogs);
      setFilteredLogs(allLogs);
    } catch (error) {
      console.error("Error refreshing boiler logs:", error);
      toast.error("Failed to refresh boiler log entries");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshLogs();
  }, []);

  const uniqueCheckedBy = useMemo(() => {
    if (!logs.length) return [];
    return Array.from(new Set(logs.map((log) => log.checkedBy).filter(Boolean))).sort();
  }, [logs]);

  const applyFilters = () => {
    let result = [...logs];
    if (filters.fromDate) {
      result = result.filter((log) => log.date >= filters.fromDate);
    }
    if (filters.toDate) {
      result = result.filter((log) => log.date <= filters.toDate);
    }
    if (filters.status !== "all") {
      result = result.filter((log) => log.status === filters.status);
    }
    if (filters.equipmentId) {
      result = result.filter((log) =>
        log.equipmentId.toLowerCase().includes(filters.equipmentId.toLowerCase()),
      );
    }
    if (filters.checkedBy) {
      result = result.filter((log) => log.checkedBy === filters.checkedBy);
    }
    setFilteredLogs(result);
    setIsFilterOpen(false);
    toast.success(`Filtered ${result.length} entries`);
  };

  const clearFilters = () => {
    const cleared = {
      fromDate: "",
      toDate: "",
      status: "all" as const,
      equipmentId: "",
      checkedBy: "",
    };
    setFilters(cleared);
    setFilteredLogs(logs);
    setIsFilterOpen(false);
    toast.success("Filters cleared");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.equipmentId) {
        toast.error("Please select Equipment ID.");
        return;
      }
      const numericFields: { key: keyof typeof formData; label: string }[] = [
        { key: "feedWaterTemp", label: "Feed water temp" },
        { key: "oilTemp", label: "Oil temp" },
        { key: "steamTemp", label: "Steam temp" },
        { key: "steamPressure", label: "Steam pressure" },
      ];
      for (const field of numericFields) {
        const raw = formData[field.key];
        if (!raw) {
          toast.error(`Please enter ${field.label}.`);
          return;
        }
        const value = parseFloat(raw);
        if (Number.isNaN(value)) {
          toast.error(`${field.label} must be numeric.`);
          return;
        }
      }

      const logData = {
        equipment_id: formData.equipmentId,
        feed_water_temp: parseFloat(formData.feedWaterTemp),
        oil_temp: parseFloat(formData.oilTemp),
        steam_temp: parseFloat(formData.steamTemp),
        steam_pressure: parseFloat(formData.steamPressure),
        steam_flow_lph: formData.steamFlowLPH
          ? parseFloat(formData.steamFlowLPH)
          : undefined,
        remarks: formData.remarks || undefined,
      };

      await boilerLogAPI.create(logData);
      toast.success("Boiler entry saved successfully");

      setFormData({
        equipmentId: "",
        feedWaterTemp: "",
        oilTemp: "",
        steamTemp: "",
        steamPressure: "",
        steamFlowLPH: "",
        remarks: "",
      });
      setIsDialogOpen(false);
      await refreshLogs();
    } catch (error: any) {
      console.error("Error saving boiler entry:", error);
      toast.error(error?.message || "Failed to save boiler entry");
    }
  };

  const handleApprove = async (id: string) => {
    setApproveConfirmOpen(false);
    try {
      await boilerLogAPI.approve(id, "approve");
      toast.success("Boiler entry approved successfully");
      await refreshLogs();
    } catch (error: any) {
      console.error("Error approving boiler entry:", error);
      toast.error(error?.message || "Failed to approve boiler entry");
    }
  };

  const handleReject = async (id: string) => {
    setRejectConfirmOpen(false);
    try {
      await boilerLogAPI.approve(id, "reject");
      toast.error("Boiler entry rejected");
      await refreshLogs();
    } catch (error: any) {
      console.error("Error rejecting boiler entry:", error);
      toast.error(error?.message || "Failed to reject boiler entry");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry? This action cannot be undone.")) {
      return;
    }
    try {
      await boilerLogAPI.delete(id);
      toast.success("Boiler entry deleted");
      await refreshLogs();
    } catch (error: any) {
      console.error("Error deleting boiler entry:", error);
      toast.error(error?.message || "Failed to delete boiler entry");
    }
  };

  return (
    <>
      <Header
        title="Boiler Log Book"
        subtitle="Manage boiler log entries"
      />
      <main className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Manage boiler log entries</h2>
            <p className="text-sm text-muted-foreground">
              Record and review boiler operating parameters.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsFilterOpen(true)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="accent">
                  <Plus className="w-4 h-4 mr-2" />
                  New Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>New E Log Book Entry</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {format(new Date(), "PPpp")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Checked By:{" "}
                        {user?.name || user?.email || "Unknown"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Equipment Type *</Label>
                      <Input value="Boiler" disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Equipment ID *</Label>
                      <Input
                        type="text"
                        value={formData.equipmentId}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            equipmentId: e.target.value,
                          })
                        }
                        placeholder="e.g., BL-001"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Thermometer className="w-4 h-4" /> Feed water temp
                      </Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.feedWaterTemp}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            feedWaterTemp: e.target.value,
                          })
                        }
                        placeholder="e.g., 50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Thermometer className="w-4 h-4" /> Oil temp
                      </Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.oilTemp}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            oilTemp: e.target.value,
                          })
                        }
                        placeholder="e.g., 50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Thermometer className="w-4 h-4" /> Steam temp
                      </Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.steamTemp}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            steamTemp: e.target.value,
                          })
                        }
                        placeholder="e.g., 150"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Gauge className="w-4 h-4" /> Steam pressure
                      </Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.steamPressure}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            steamPressure: e.target.value,
                          })
                        }
                        placeholder="e.g., 6"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Steam Flow LPH</Label>
                    <Input
                      type="number"
                      step="1"
                      value={formData.steamFlowLPH}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          steamFlowLPH: e.target.value,
                        })
                      }
                      placeholder="e.g., 10000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Remarks</Label>
                    <Textarea
                      value={formData.remarks}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          remarks: e.target.value,
                        })
                      }
                      placeholder="Add any observations or notes..."
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      <Save className="w-4 h-4 mr-2" />
                      Save Entry
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* TODO: Implement filter dialog similar to chiller, but scoped to boiler */}
        {isFilterOpen && (
          <div className="border rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Date</Label>
                <Input
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) =>
                    setFilters({ ...filters, fromDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>To Date</Label>
                <Input
                  type="date"
                  value={filters.toDate}
                  onChange={(e) =>
                    setFilters({ ...filters, toDate: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  className="border rounded px-2 py-1 text-sm w-full"
                  value={filters.status}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      status: e.target.value as typeof filters.status,
                    })
                  }
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Checked By</Label>
                <select
                  className="border rounded px-2 py-1 text-sm w-full"
                  value={filters.checkedBy || "all"}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      checkedBy: e.target.value === "all" ? "" : e.target.value,
                    })
                  }
                >
                  <option value="all">All</option>
                  {uniqueCheckedBy.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearFilters}
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
              <Button
                type="button"
                variant="accent"
                size="sm"
                onClick={applyFilters}
              >
                Apply
              </Button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="border-b px-4 py-2 flex justify-between items-center">
            <span className="text-sm font-medium">
              {isLoading ? "Loading boiler logs..." : `${filteredLogs.length} entries`}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Time</th>
                  <th className="px-3 py-2 text-left">Equipment</th>
                  <th className="px-3 py-2 text-left">Readings</th>
                  <th className="px-3 py-2 text-left">Remarks</th>
                  <th className="px-3 py-2 text-left">Checked By</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 && !isLoading && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-3 py-6 text-center text-muted-foreground"
                    >
                      No Boiler Log Book entries found.
                    </td>
                  </tr>
                )}
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="border-t">
                    <td className="px-3 py-2">{log.date}</td>
                    <td className="px-3 py-2">{log.time}</td>
                    <td className="px-3 py-2">{log.equipmentId}</td>
                    <td className="px-3 py-2">
                      <div className="space-y-1">
                        <div>
                          <span className="font-semibold">Feed:</span>{" "}
                          {log.feedWaterTemp}°C
                        </div>
                        <div>
                          <span className="font-semibold">Oil:</span>{" "}
                          {log.oilTemp}°C
                        </div>
                        <div>
                          <span className="font-semibold">Steam:</span>{" "}
                          {log.steamTemp}°C @ {log.steamPressure} bar
                        </div>
                        {log.steamFlowLPH !== undefined && (
                          <div>
                            <span className="font-semibold">Flow:</span>{" "}
                            {log.steamFlowLPH} LPH
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 max-w-xs">
                      <p className="line-clamp-3">{log.remarks}</p>
                    </td>
                    <td className="px-3 py-2">{log.checkedBy}</td>
                    <td className="px-3 py-2">
                      <Badge
                        variant={
                          log.status === "approved"
                            ? "success"
                            : log.status === "rejected"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {log.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {(log.status === "pending" || log.status === "draft") &&
                          user?.role !== "operator" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => {
                                  setSelectedLogId(log.id);
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
                                  setSelectedLogId(log.id);
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
                          onClick={() => handleDelete(log.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      {/* Approve Confirmation */}
      <AlertDialog open={approveConfirmOpen} onOpenChange={setApproveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Approval</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this boiler entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedLogId && handleApprove(selectedLogId)}
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
              Are you sure you want to reject this boiler entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedLogId && handleReject(selectedLogId)}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BoilerLogBookPage;

