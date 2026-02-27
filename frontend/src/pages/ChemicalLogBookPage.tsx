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
import { chemicalPrepAPI } from "@/lib/api";
import { Clock, Save, Filter, X, Plus, Trash2 } from "lucide-react";
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

interface ChemicalPrepLog {
  id: string;
  equipmentName: string;
  chemicalName: string;
  chemicalPercent?: number;
  solutionConcentration: number;
  waterQty: number;
  chemicalQty: number;
  date: string;
  time: string;
  remarks: string;
  checkedBy: string;
  timestamp: Date;
  status: "pending" | "approved" | "rejected" | "draft";
}

const ChemicalLogBookPage: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ChemicalPrepLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ChemicalPrepLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    equipmentName: "",
    chemicalName: "",
    solutionConcentration: "",
    waterQty: "",
    chemicalQty: "",
    remarks: "",
  });

  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    status: "all" as "all" | "pending" | "approved" | "rejected",
    equipmentName: "",
    checkedBy: "",
  });

  const refreshLogs = async () => {
    try {
      setIsLoading(true);
      const chemicalPreps = await chemicalPrepAPI.list().catch((err) => {
        console.error("Error fetching chemical preps:", err);
        return [];
      });

      const allLogs: ChemicalPrepLog[] = [];
      chemicalPreps.forEach((prep: any) => {
        const timestamp = new Date(prep.timestamp);
        allLogs.push({
          id: prep.id,
          equipmentName: prep.equipment_name,
          chemicalName: prep.chemical_name,
          chemicalPercent: prep.chemical_percent ?? undefined,
          solutionConcentration: prep.solution_concentration,
          waterQty: prep.water_qty,
          chemicalQty: prep.chemical_qty,
          date: format(timestamp, "yyyy-MM-dd"),
          time: format(timestamp, "HH:mm:ss"),
          remarks: prep.remarks || "",
          checkedBy: prep.checked_by || prep.operator_name,
          timestamp,
          status: prep.status as ChemicalPrepLog["status"],
        });
      });

      allLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setLogs(allLogs);
      setFilteredLogs(allLogs);
    } catch (error) {
      console.error("Error refreshing chemical logs:", error);
      toast.error("Failed to refresh chemical preparation entries");
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
    if (filters.equipmentName) {
      result = result.filter((log) =>
        log.equipmentName
          .toLowerCase()
          .includes(filters.equipmentName.toLowerCase()),
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
      equipmentName: "",
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
      if (!formData.equipmentName) {
        toast.error("Please enter Equipment Name.");
        return;
      }
      if (!formData.chemicalName) {
        toast.error("Please enter Chemical Name.");
        return;
      }
      const numericFields: { key: keyof typeof formData; label: string }[] = [
        { key: "solutionConcentration", label: "Solution concentration" },
        { key: "waterQty", label: "Water quantity" },
        { key: "chemicalQty", label: "Chemical quantity" },
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

      const prepData = {
        equipment_name: formData.equipmentName,
        chemical_name: formData.chemicalName,
        // Keep existing behavior: chemical_percent taken from configured stock if needed
        chemical_percent: undefined,
        solution_concentration: parseFloat(formData.solutionConcentration),
        water_qty: parseFloat(formData.waterQty),
        chemical_qty: parseFloat(formData.chemicalQty),
        remarks: formData.remarks || undefined,
        checked_by: user?.name || user?.email || "Unknown",
      };

      await chemicalPrepAPI.create(prepData);
      toast.success("Chemical preparation entry saved successfully");

      setFormData({
        equipmentName: "",
        chemicalName: "",
        solutionConcentration: "",
        waterQty: "",
        chemicalQty: "",
        remarks: "",
      });
      setIsDialogOpen(false);
      await refreshLogs();
    } catch (error: any) {
      console.error("Error saving chemical entry:", error);
      toast.error(error?.message || "Failed to save chemical preparation entry");
    }
  };

  const handleApprove = async (id: string) => {
    setApproveConfirmOpen(false);
    try {
      await chemicalPrepAPI.approve(id, "approve");
      toast.success("Chemical entry approved successfully");
      await refreshLogs();
    } catch (error: any) {
      console.error("Error approving chemical entry:", error);
      toast.error(error?.message || "Failed to approve chemical entry");
    }
  };

  const handleReject = async (id: string) => {
    setRejectConfirmOpen(false);
    try {
      await chemicalPrepAPI.approve(id, "reject");
      toast.error("Chemical entry rejected");
      await refreshLogs();
    } catch (error: any) {
      console.error("Error rejecting chemical entry:", error);
      toast.error(error?.message || "Failed to reject chemical entry");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry? This action cannot be undone.")) {
      return;
    }
    try {
      await chemicalPrepAPI.delete(id);
      toast.success("Chemical entry deleted");
      await refreshLogs();
    } catch (error: any) {
      console.error("Error deleting chemical entry:", error);
      toast.error(error?.message || "Failed to delete chemical entry");
    }
  };

  return (
    <>
      <Header
        title="Chemical Log Book"
        subtitle="Manage chemical preparations"
      />
      <main className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Manage chemical preparations</h2>
            <p className="text-sm text-muted-foreground">
              Record and review chemical preparation details.
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
                  <DialogTitle>New Chemical Preparation Entry</DialogTitle>
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

                  <div className="space-y-2">
                    <Label>Equipment Name *</Label>
                    <Input
                      type="text"
                      value={formData.equipmentName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          equipmentName: e.target.value,
                        })
                      }
                      placeholder="e.g., EN0001-MGF"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Chemical Name *</Label>
                    <Input
                      type="text"
                      value={formData.chemicalName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          chemicalName: e.target.value,
                        })
                      }
                      placeholder="e.g., NaOCl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Solution Concentration (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.solutionConcentration}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            solutionConcentration: e.target.value,
                          })
                        }
                        placeholder="e.g., 1.0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Water Quantity (L)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.waterQty}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            waterQty: e.target.value,
                          })
                        }
                        placeholder="e.g., 100"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Chemical Quantity (Kg)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.chemicalQty}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          chemicalQty: e.target.value,
                        })
                      }
                      placeholder="e.g., 0.32"
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

        <div className="border rounded-lg overflow-hidden">
          <div className="border-b px-4 py-2 flex justify-between items-center">
            <span className="text-sm font-medium">
              {isLoading
                ? "Loading chemical preparations..."
                : `${filteredLogs.length} entries`}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Date</th>
                  <th className="px-3 py-2 text-left font-semibold">Time</th>
                  <th className="px-3 py-2 text-left font-semibold">Equipment</th>
                  <th className="px-3 py-2 text-left font-semibold">Chemical</th>
                  <th className="px-3 py-2 text-left font-semibold">Details</th>
                  <th className="px-3 py-2 text-left font-semibold">Remarks</th>
                  <th className="px-3 py-2 text-left font-semibold">Checked By</th>
                  <th className="px-3 py-2 text-left font-semibold">Status</th>
                  <th className="px-3 py-2 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 && !isLoading && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-3 py-6 text-center text-muted-foreground"
                    >
                      No Chemical Log Book entries found.
                    </td>
                  </tr>
                )}
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="border-t">
                    <td className="px-3 py-2">{log.date}</td>
                    <td className="px-3 py-2">{log.time}</td>
                    <td className="px-3 py-2">{log.equipmentName}</td>
                    <td className="px-3 py-2">{log.chemicalName}</td>
                    <td className="px-3 py-2">
                      <div className="space-y-1">
                        <div>
                          <span className="font-semibold">Conc:</span>{" "}
                          {log.solutionConcentration}%
                        </div>
                        <div>
                          <span className="font-semibold">Water:</span>{" "}
                          {log.waterQty} L
                        </div>
                        <div>
                          <span className="font-semibold">Chemical:</span>{" "}
                          {log.chemicalQty} Kg
                        </div>
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
              Are you sure you want to approve this chemical entry? This action cannot be undone.
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
              Are you sure you want to reject this chemical entry? This action cannot be undone.
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

export default ChemicalLogBookPage;

