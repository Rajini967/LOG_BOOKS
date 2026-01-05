import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Wind, Calculator, Save, Clock, CheckCircle2, XCircle, Grid3X3, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface HVACValidation {
  id: string;
  roomName: string;
  isoClass: number;
  roomVolume: number;
  gridReadings: number[];
  averageVelocity: number;
  flowRateCFM: number;
  totalCFM: number;
  ach: number;
  designSpec: number;
  result: 'pass' | 'fail';
  operator: string;
  timestamp: Date;
  status: 'pending' | 'approved' | 'rejected';
}

// TODO: Replace with API call to fetch rooms
const rooms = [
  { name: 'Clean Room A', volume: 500 },
  { name: 'Clean Room B', volume: 450 },
  { name: 'Filling Suite A', volume: 120 },
  { name: 'Filling Suite B', volume: 150 },
  { name: 'Aseptic Core', volume: 80 },
];

const isoClassSpecs: Record<number, number> = {
  5: 60, // ACH requirement for ISO 5
  6: 40,
  7: 20,
  8: 10,
};

export default function HVACValidationPage() {
  const { user } = useAuth();
  // TODO: Replace with API call to fetch validations from backend
  const [validations, setValidations] = useState<HVACValidation[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);
  const [selectedValidationId, setSelectedValidationId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    roomName: '',
    isoClass: '',
    gridReadings: Array(9).fill(''),
  });
  const [calculations, setCalculations] = useState<{
    avgVelocity: number;
    flowRateCFM: number;
    totalCFM: number;
    ach: number;
    designSpec: number;
    result: 'pass' | 'fail' | null;
  } | null>(null);

  // Calculate results when inputs change
  useEffect(() => {
    const selectedRoom = rooms.find(r => r.name === formData.roomName);
    const isoClass = parseInt(formData.isoClass);
    const readings = formData.gridReadings.map(r => parseFloat(r)).filter(r => !isNaN(r));

    if (selectedRoom && isoClass && readings.length >= 3) {
      const avgVelocity = readings.reduce((a, b) => a + b, 0) / readings.length;
      
      // Flow Rate (CFM) = Avg Velocity (m/s) * Area (m²) * 2118.88
      const areaPerReading = 0.09; // 0.3m x 0.3m grid
      const totalArea = areaPerReading * readings.length;
      const flowRateCFM = avgVelocity * totalArea * 2118.88;
      
      // Total CFM = Flow Rate per reading * number of readings
      const totalCFM = flowRateCFM * readings.length;
      
      // ACH = (Total CFM * 60) / Room Volume (ft³)
      const roomVolumeFt3 = selectedRoom.volume * 35.3147; // m³ to ft³
      const ach = (totalCFM * 60) / roomVolumeFt3;
      
      const designSpec = isoClassSpecs[isoClass] || 20;
      const result = ach >= designSpec ? 'pass' : 'fail';

      setCalculations({
        avgVelocity: Math.round(avgVelocity * 1000) / 1000,
        flowRateCFM: Math.round(flowRateCFM * 100) / 100,
        totalCFM: Math.round(totalCFM * 100) / 100,
        ach: Math.round(ach * 10) / 10,
        designSpec,
        result,
      });
    } else {
      setCalculations(null);
    }
  }, [formData]);

  const handleGridChange = (index: number, value: string) => {
    const newReadings = [...formData.gridReadings];
    newReadings[index] = value;
    setFormData({ ...formData, gridReadings: newReadings });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!calculations) return;

    const selectedRoom = rooms.find(r => r.name === formData.roomName);
    if (!selectedRoom) return;

    const newValidation: HVACValidation = {
      id: Date.now().toString(),
      roomName: formData.roomName,
      isoClass: parseInt(formData.isoClass),
      roomVolume: selectedRoom.volume,
      gridReadings: formData.gridReadings.map(r => parseFloat(r)).filter(r => !isNaN(r)),
      averageVelocity: calculations.avgVelocity,
      flowRateCFM: calculations.flowRateCFM,
      totalCFM: calculations.totalCFM,
      ach: calculations.ach,
      designSpec: calculations.designSpec,
      result: calculations.result!,
      operator: user?.name || 'Unknown',
      timestamp: new Date(),
      status: 'pending',
    };

    setValidations([newValidation, ...validations]);
    setIsDialogOpen(false);
    setFormData({
      roomName: '',
      isoClass: '',
      gridReadings: Array(9).fill(''),
    });
    toast.success('HVAC validation recorded successfully');
  };

  const handleApprove = (id: string) => {
    setApproveConfirmOpen(false);
    setValidations(validations.map(val => 
      val.id === id 
        ? { ...val, status: 'approved' as const }
        : val
    ));
    toast.success('Validation approved successfully');
  };

  const handleReject = (id: string) => {
    setRejectConfirmOpen(false);
    setValidations(validations.map(val => 
      val.id === id 
        ? { ...val, status: 'rejected' as const }
        : val
    ));
    toast.error('Validation rejected');
  };

  return (
    <div className="min-h-screen">
      <Header
        title="HVAC Validation Module"
        subtitle="HVAC validation and air change calculations"
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="metric-card">
            <p className="data-label">Total Validations</p>
            <p className="reading-display text-2xl">{validations.length}</p>
          </div>
          <div className="metric-card">
            <p className="data-label">Pass Rate</p>
            <p className="reading-display text-2xl text-success">
              {Math.round((validations.filter(v => v.result === 'pass').length / validations.length) * 100)}%
            </p>
          </div>
          <div className="metric-card">
            <p className="data-label">Pending Review</p>
            <p className="reading-display text-2xl">{validations.filter(v => v.status === 'pending').length}</p>
          </div>
          <div className="metric-card">
            <p className="data-label">Failed This Week</p>
            <p className="reading-display text-2xl text-danger">{validations.filter(v => v.result === 'fail').length}</p>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="success">{validations.filter(v => v.result === 'pass').length} Passed</Badge>
            <Badge variant="danger">{validations.filter(v => v.result === 'fail').length} Failed</Badge>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="accent">
                <Plus className="w-4 h-4 mr-2" />
                New Validation
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Wind className="w-5 h-5" />
                  HVAC Validation Form
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Digital Signature Info */}
                <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{format(new Date(), 'PPpp')}</p>
                    <p className="text-xs text-muted-foreground">Validated by: {user?.name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Room Name</Label>
                    <Select
                      value={formData.roomName}
                      onValueChange={(v) => setFormData({ ...formData, roomName: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select room" />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.map((room) => (
                          <SelectItem key={room.name} value={room.name}>
                            {room.name} ({room.volume} m³)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>ISO Classification</Label>
                    <Select
                      value={formData.isoClass}
                      onValueChange={(v) => setFormData({ ...formData, isoClass: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">ISO 5 (≥60 ACH)</SelectItem>
                        <SelectItem value="6">ISO 6 (≥40 ACH)</SelectItem>
                        <SelectItem value="7">ISO 7 (≥20 ACH)</SelectItem>
                        <SelectItem value="8">ISO 8 (≥10 ACH)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Grid Readings */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Grid3X3 className="w-4 h-4" />
                    Air Velocity Grid Readings (m/s)
                  </Label>
                  <div className="grid grid-cols-3 gap-2 bg-muted/30 rounded-lg p-4">
                    {formData.gridReadings.map((reading, index) => (
                      <Input
                        key={index}
                        type="number"
                        step="0.01"
                        min="0"
                        value={reading}
                        onChange={(e) => handleGridChange(index, e.target.value)}
                        placeholder={`P${index + 1}`}
                        className="text-center font-mono"
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Enter readings from left to right, top to bottom (min. 3 readings)</p>
                </div>

                {/* Calculations Display */}
                <div className={cn(
                  'rounded-lg p-4 border-2 space-y-3',
                  calculations?.result === 'pass' && 'bg-success/10 border-success/30',
                  calculations?.result === 'fail' && 'bg-danger/10 border-danger/30',
                  !calculations && 'bg-muted/50 border-border'
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="w-5 h-5" />
                    <span className="text-sm font-medium text-foreground">Calculated Results</span>
                  </div>
                  
                  {calculations ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Avg Velocity</p>
                        <p className="text-lg font-mono font-bold">{calculations.avgVelocity} m/s</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Flow Rate</p>
                        <p className="text-lg font-mono font-bold">{calculations.flowRateCFM} CFM</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total CFM</p>
                        <p className="text-lg font-mono font-bold">{calculations.totalCFM}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">ACH (≥{calculations.designSpec})</p>
                        <p className={cn(
                          'text-lg font-mono font-bold',
                          calculations.result === 'pass' ? 'text-success' : 'text-danger'
                        )}>
                          {calculations.ach}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Enter grid readings to calculate</p>
                  )}

                  {calculations && (
                    <div className={cn(
                      'flex items-center gap-2 pt-2 border-t',
                      calculations.result === 'pass' ? 'border-success/30' : 'border-danger/30'
                    )}>
                      {calculations.result === 'pass' ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-success" />
                          <span className="font-semibold text-success">PASS - Meets ISO requirements</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-danger" />
                          <span className="font-semibold text-danger">FAIL - Below required ACH</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="accent" disabled={!calculations}>
                    <Save className="w-4 h-4 mr-2" />
                    Submit Validation
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Validations List */}
        <div className="grid gap-4">
          {validations.map((val) => (
            <div
              key={val.id}
              className={cn(
                'bg-card rounded-lg border p-4',
                val.result === 'pass' ? 'border-success/30' : 'border-danger/30'
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-foreground">{val.roomName}</h4>
                  <p className="text-sm text-muted-foreground">ISO Class {val.isoClass} • {val.roomVolume} m³</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={val.result === 'pass' ? 'success' : 'danger'}>
                    {val.result === 'pass' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                    {val.result.toUpperCase()}
                  </Badge>
                  <Badge variant={val.status === 'approved' ? 'success' : val.status === 'rejected' ? 'danger' : 'pending'}>
                    {val.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <p className="data-label">Avg Velocity</p>
                  <p className="text-sm font-mono font-medium">{val.averageVelocity} m/s</p>
                </div>
                <div>
                  <p className="data-label">Flow Rate</p>
                  <p className="text-sm font-mono font-medium">{val.flowRateCFM} CFM</p>
                </div>
                <div>
                  <p className="data-label">ACH (≥{val.designSpec})</p>
                  <p className={cn('text-sm font-mono font-bold', val.result === 'pass' ? 'text-success' : 'text-danger')}>
                    {val.ach}
                  </p>
                </div>
                <div>
                  <p className="data-label">Validated By</p>
                  <p className="text-sm">{val.operator}</p>
                </div>
                <div>
                  <p className="data-label">Timestamp</p>
                  <p className="text-sm text-muted-foreground">{format(val.timestamp, 'dd/MM/yy HH:mm')}</p>
                </div>
              </div>

              {/* Actions */}
              {val.status === 'pending' && user?.role !== 'operator' && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedValidationId(val.id);
                      setApproveConfirmOpen(true);
                    }}
                    className="h-7 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedValidationId(val.id);
                      setRejectConfirmOpen(true);
                    }}
                    className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Approve Confirmation Alert */}
      <AlertDialog open={approveConfirmOpen} onOpenChange={setApproveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Approval</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this validation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedValidationId && handleApprove(selectedValidationId)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation Alert */}
      <AlertDialog open={rejectConfirmOpen} onOpenChange={setRejectConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Rejection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this validation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedValidationId && handleReject(selectedValidationId)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
