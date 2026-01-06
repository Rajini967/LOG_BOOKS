import React, { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  DialogDescription,
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
import { Plus, Thermometer, Gauge, Droplets, Save, Clock, Trash2, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { logbookAPI, chemicalPrepAPI, chillerLogAPI, boilerLogAPI, compressorLogAPI } from '@/lib/api';
import { LogbookSchema } from '@/types/logbook-config';
import { FieldWithValidation } from '@/components/logbook/FieldWithValidation';

interface ELogBook {
  id: string;
  equipmentType: 'chiller' | 'boiler' | 'compressor' | 'chemical' | string; // string for custom logbooks
  equipmentId: string;
  schemaId?: string; // For custom logbooks
  customFields?: Record<string, any>; // For custom logbook field values
  date: string;
  time: string;
  // Chiller fields
  chillerSupplyTemp?: number;
  chillerReturnTemp?: number;
  coolingTowerSupplyTemp?: number;
  coolingTowerReturnTemp?: number;
  ctDifferentialTemp?: number;
  chillerWaterInletPressure?: number;
  chillerMakeupWaterFlow?: number;
  // Boiler fields
  feedWaterTemp?: number;
  oilTemp?: number;
  steamTemp?: number;
  steamPressure?: number;
  steamFlowLPH?: number;
  // Compressor fields (similar to chiller but different parameters)
  compressorSupplyTemp?: number;
  compressorReturnTemp?: number;
  compressorPressure?: number;
  compressorFlow?: number;
  // Chemical fields
  equipmentName?: string;
  chemicalName?: string;
  chemicalPercent?: number;
  solutionConcentration?: number;
  waterQty?: number;
  chemicalQty?: number;
  remarks: string;
  checkedBy: string;
  timestamp: Date;
  status: 'pending' | 'approved' | 'rejected' | 'draft';
}

// Equipment limits based on the example documents
const equipmentLimits = {
  chiller: {
    chillerSupplyTemp: { max: 8, unit: '°C', type: 'NMT' },
    chillerReturnTemp: { max: 15, unit: '°C', type: 'NMT' },
    coolingTowerSupplyTemp: { max: 25, unit: '°C', type: 'NMT' },
    coolingTowerReturnTemp: { max: 30, unit: '°C', type: 'NMT' },
    ctDifferentialTemp: { max: 5, unit: '°C', type: 'NMT' },
    chillerWaterInletPressure: { min: 2, unit: 'bar', type: 'NLT' },
  },
  boiler: {
    feedWaterTemp: { min: 50, unit: '°C', type: 'NLT' },
    oilTemp: { min: 50, unit: '°C', type: 'NLT' },
    steamTemp: { min: 150, unit: '°C', type: 'NLT' },
    steamPressure: { min: 6, unit: 'bar', type: 'NLT' },
  },
  compressor: {
    compressorSupplyTemp: { max: 10, unit: '°C', type: 'NMT' },
    compressorReturnTemp: { max: 20, unit: '°C', type: 'NMT' },
    compressorPressure: { min: 5, unit: 'bar', type: 'NLT' },
  },
};

const equipmentList = {
  chiller: ['CH-001', 'CH-002', 'CH-003'],
  boiler: ['BL-001', 'BL-002'],
  compressor: ['AC-001', 'AC-002', 'AC-003'],
  chemical: ['EN0001-MGF', 'EN0002-RO', 'EN0003-PW', 'EN0004-Other', 'EN0005-Other'],
};

const chemicals = [
  { name: 'NaOCl – Sodium Hypochlorite', stockConcentration: 99 },
  { name: 'NaOH – Sodium Hydroxide', stockConcentration: 95 },
  { name: 'SMBS – Sodium Metabisulfite', stockConcentration: 50 },
  { name: 'NaCl – Sodium Chloride', stockConcentration: 100 },
  { name: 'HCl – Hydrochloric Acid', stockConcentration: 37 },
  { name: 'Citric Acid (C₆H₈O₇) – Citric Acid', stockConcentration: 100 },
  { name: 'Nitric Acid (HNO₃) – Nitric Acid', stockConcentration: 70 },
  { name: 'Hydrogen Peroxide (H₂O₂) – Hydrogen Peroxide', stockConcentration: 30 },
  { name: 'Antiscalant', stockConcentration: 100 },
];

interface ELogBookPageProps {
  equipmentType?: 'chiller' | 'boiler' | 'chemical';
}

export default function ELogBookPage({ equipmentType }: ELogBookPageProps = {}) {
  const { user } = useAuth();
  const [logbookSchemas, setLogbookSchemas] = useState<LogbookSchema[]>([]);
  const [selectedSchema, setSelectedSchema] = useState<LogbookSchema | null>(null);
  const [customFormData, setCustomFormData] = useState<Record<string, any>>({});
  const [logs, setLogs] = useState<ELogBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    equipmentType: (equipmentType || '') as 'chiller' | 'boiler' | 'compressor' | 'chemical' | string,
    equipmentId: '',
    // Chiller fields
    chillerSupplyTemp: '',
    chillerReturnTemp: '',
    coolingTowerSupplyTemp: '',
    coolingTowerReturnTemp: '',
    ctDifferentialTemp: '',
    chillerWaterInletPressure: '',
    chillerMakeupWaterFlow: '',
    // Boiler fields
    feedWaterTemp: '',
    oilTemp: '',
    steamTemp: '',
    steamPressure: '',
    steamFlowLPH: '',
    // Compressor fields
    compressorSupplyTemp: '',
    compressorReturnTemp: '',
    compressorPressure: '',
    compressorFlow: '',
    // Chemical fields
    equipmentName: '',
    chemicalName: '',
    solutionConcentration: '',
    waterQty: '',
    chemicalQty: '',
    remarks: '',
  });
  
  // Filter state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    status: 'all',
    equipmentType: 'all',
    equipmentId: '',
    checkedBy: '',
    fromTime: '',
    toTime: '',
  });
  const [filteredLogs, setFilteredLogs] = useState<ELogBook[]>(logs);

  // Fetch logbook schemas and logs from API
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch logbook schemas
        const schemas = await logbookAPI.list();
        setLogbookSchemas(schemas);

        // Fetch chemical preparations
        const chemicalPreps = await chemicalPrepAPI.list().catch(err => {
          console.error('Error fetching chemical preps:', err);
          return [];
        });
        
        // Fetch chiller, boiler, and compressor logs
        const [chillerLogs, boilerLogs, compressorLogs] = await Promise.all([
          chillerLogAPI.list().catch(err => {
            console.error('Error fetching chiller logs:', err);
            return [];
          }),
          boilerLogAPI.list().catch(err => {
            console.error('Error fetching boiler logs:', err);
            return [];
          }),
          compressorLogAPI.list().catch(err => {
            console.error('Error fetching compressor logs:', err);
            return [];
          }),
        ]);

        console.log('Fetched data:', { chillerLogs, boilerLogs, compressorLogs, chemicalPreps });

        // Convert API data to ELogBook format
        const allLogs: ELogBook[] = [];

        // Convert chemical preps
        chemicalPreps.forEach((prep: any) => {
          const timestamp = new Date(prep.timestamp);
          allLogs.push({
            id: prep.id,
            equipmentType: 'chemical',
            equipmentId: prep.equipment_name || 'N/A',
            date: format(timestamp, 'yyyy-MM-dd'),
            time: format(timestamp, 'HH:mm:ss'),
            equipmentName: prep.equipment_name,
            chemicalName: prep.chemical_name,
            chemicalPercent: prep.chemical_percent,
            solutionConcentration: prep.solution_concentration,
            waterQty: prep.water_qty,
            chemicalQty: prep.chemical_qty,
            remarks: prep.remarks || '',
            checkedBy: prep.checked_by || prep.operator_name,
            timestamp: timestamp,
            status: prep.status as 'pending' | 'approved' | 'rejected',
          });
        });

        // Convert chiller logs
        chillerLogs.forEach((log: any) => {
          const timestamp = new Date(log.timestamp);
          allLogs.push({
            id: log.id,
            equipmentType: 'chiller',
            equipmentId: log.equipment_id,
            date: format(timestamp, 'yyyy-MM-dd'),
            time: format(timestamp, 'HH:mm:ss'),
            chillerSupplyTemp: log.chiller_supply_temp,
            chillerReturnTemp: log.chiller_return_temp,
            coolingTowerSupplyTemp: log.cooling_tower_supply_temp,
            coolingTowerReturnTemp: log.cooling_tower_return_temp,
            ctDifferentialTemp: log.ct_differential_temp,
            chillerWaterInletPressure: log.chiller_water_inlet_pressure,
            chillerMakeupWaterFlow: log.chiller_makeup_water_flow,
            remarks: log.remarks || '',
            checkedBy: log.operator_name,
            timestamp: timestamp,
            status: log.status as 'pending' | 'approved' | 'rejected',
          });
        });

        // Convert boiler logs
        boilerLogs.forEach((log: any) => {
          const timestamp = new Date(log.timestamp);
          allLogs.push({
            id: log.id,
            equipmentType: 'boiler',
            equipmentId: log.equipment_id,
            date: format(timestamp, 'yyyy-MM-dd'),
            time: format(timestamp, 'HH:mm:ss'),
            feedWaterTemp: log.feed_water_temp,
            oilTemp: log.oil_temp,
            steamTemp: log.steam_temp,
            steamPressure: log.steam_pressure,
            steamFlowLPH: log.steam_flow_lph,
            remarks: log.remarks || '',
            checkedBy: log.operator_name,
            timestamp: timestamp,
            status: log.status as 'pending' | 'approved' | 'rejected',
          });
        });

        // Convert compressor logs
        compressorLogs.forEach((log: any) => {
          const timestamp = new Date(log.timestamp);
          allLogs.push({
            id: log.id,
            equipmentType: 'compressor',
            equipmentId: log.equipment_id,
            date: format(timestamp, 'yyyy-MM-dd'),
            time: format(timestamp, 'HH:mm:ss'),
            compressorSupplyTemp: log.compressor_supply_temp,
            compressorReturnTemp: log.compressor_return_temp,
            compressorPressure: log.compressor_pressure,
            compressorFlow: log.compressor_flow,
            remarks: log.remarks || '',
            checkedBy: log.operator_name,
            timestamp: timestamp,
            status: log.status as 'pending' | 'approved' | 'rejected',
          });
        });

        // Filter by equipmentType if provided
        let filteredLogs = allLogs;
        if (equipmentType) {
          filteredLogs = allLogs.filter(log => log.equipmentType === equipmentType);
        }

        // Sort by timestamp (newest first)
        filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        console.log('Total logs after conversion:', filteredLogs.length, filteredLogs);
        setLogs(filteredLogs);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load log entries');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Listen for new logbook creation
    const handleLogbookSaved = () => {
      fetchData();
    };
    window.addEventListener('logbookSaved', handleLogbookSaved);

    return () => {
      window.removeEventListener('logbookSaved', handleLogbookSaved);
    };
  }, []);

  // Update selected schema when equipment type changes
  useEffect(() => {
    if (formData.equipmentType?.startsWith('custom_')) {
      const schemaId = formData.equipmentType.replace('custom_', '');
      const schema = logbookSchemas.find(s => s.id === schemaId);
      setSelectedSchema(schema || null);
      // Reset custom form data
      setCustomFormData({});
    } else {
      setSelectedSchema(null);
      setCustomFormData({});
    }
  }, [formData.equipmentType, logbookSchemas]);

  // Refresh logs from API
  const refreshLogs = async () => {
    try {
      const chemicalPreps = await chemicalPrepAPI.list().catch(err => {
        console.error('Error fetching chemical preps:', err);
        return [];
      });
      const [chillerLogs, boilerLogs, compressorLogs] = await Promise.all([
        chillerLogAPI.list().catch(err => {
          console.error('Error fetching chiller logs:', err);
          return [];
        }),
        boilerLogAPI.list().catch(err => {
          console.error('Error fetching boiler logs:', err);
          return [];
        }),
        compressorLogAPI.list().catch(err => {
          console.error('Error fetching compressor logs:', err);
          return [];
        }),
      ]);
      
      console.log('Refreshed data:', { chillerLogs, boilerLogs, compressorLogs, chemicalPreps });

      const allLogs: ELogBook[] = [];

      // Convert chemical preps
      chemicalPreps.forEach((prep: any) => {
        const timestamp = new Date(prep.timestamp);
        allLogs.push({
          id: prep.id,
          equipmentType: 'chemical',
          equipmentId: prep.equipment_name || 'N/A',
          date: format(timestamp, 'yyyy-MM-dd'),
          time: format(timestamp, 'HH:mm:ss'),
          equipmentName: prep.equipment_name,
          chemicalName: prep.chemical_name,
          chemicalPercent: prep.chemical_percent,
          solutionConcentration: prep.solution_concentration,
          waterQty: prep.water_qty,
          chemicalQty: prep.chemical_qty,
          remarks: prep.remarks || '',
          checkedBy: prep.checked_by || prep.operator_name,
          timestamp: timestamp,
          status: prep.status as 'pending' | 'approved' | 'rejected',
        });
      });

      // Convert chiller logs
      chillerLogs.forEach((log: any) => {
        const timestamp = new Date(log.timestamp);
        allLogs.push({
          id: log.id,
          equipmentType: 'chiller',
          equipmentId: log.equipment_id,
          date: format(timestamp, 'yyyy-MM-dd'),
          time: format(timestamp, 'HH:mm:ss'),
          chillerSupplyTemp: log.chiller_supply_temp,
          chillerReturnTemp: log.chiller_return_temp,
          coolingTowerSupplyTemp: log.cooling_tower_supply_temp,
          coolingTowerReturnTemp: log.cooling_tower_return_temp,
          ctDifferentialTemp: log.ct_differential_temp,
          chillerWaterInletPressure: log.chiller_water_inlet_pressure,
          chillerMakeupWaterFlow: log.chiller_makeup_water_flow,
          remarks: log.remarks || '',
          checkedBy: log.operator_name,
          timestamp: timestamp,
          status: log.status as 'pending' | 'approved' | 'rejected',
        });
      });

      // Convert boiler logs
      boilerLogs.forEach((log: any) => {
        const timestamp = new Date(log.timestamp);
        allLogs.push({
          id: log.id,
          equipmentType: 'boiler',
          equipmentId: log.equipment_id,
          date: format(timestamp, 'yyyy-MM-dd'),
          time: format(timestamp, 'HH:mm:ss'),
          feedWaterTemp: log.feed_water_temp,
          oilTemp: log.oil_temp,
          steamTemp: log.steam_temp,
          steamPressure: log.steam_pressure,
          steamFlowLPH: log.steam_flow_lph,
          remarks: log.remarks || '',
          checkedBy: log.operator_name,
          timestamp: timestamp,
          status: log.status as 'pending' | 'approved' | 'rejected',
        });
      });

      // Convert compressor logs
      compressorLogs.forEach((log: any) => {
        const timestamp = new Date(log.timestamp);
        allLogs.push({
          id: log.id,
          equipmentType: 'compressor',
          equipmentId: log.equipment_id,
          date: format(timestamp, 'yyyy-MM-dd'),
          time: format(timestamp, 'HH:mm:ss'),
          compressorSupplyTemp: log.compressor_supply_temp,
          compressorReturnTemp: log.compressor_return_temp,
          compressorPressure: log.compressor_pressure,
          compressorFlow: log.compressor_flow,
          remarks: log.remarks || '',
          checkedBy: log.operator_name,
          timestamp: timestamp,
          status: log.status as 'pending' | 'approved' | 'rejected',
        });
      });

      // Filter by equipmentType if provided
      let filteredLogs = allLogs;
      if (equipmentType) {
        filteredLogs = allLogs.filter(log => log.equipmentType === equipmentType);
      }

      filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      console.log('Total logs after refresh:', filteredLogs.length, filteredLogs);
      setLogs(filteredLogs);
    } catch (error) {
      console.error('Error refreshing logs:', error);
      toast.error('Failed to refresh log entries');
    }
  };

  // Get unique equipment IDs, equipment types, and checked by users
  const uniqueEquipmentIds = useMemo(() => {
    if (!logs || logs.length === 0) return [];
    return Array.from(new Set(logs.map(log => log.equipmentId).filter(Boolean))).sort();
  }, [logs]);
  
  const uniqueEquipmentTypes = useMemo(() => {
    if (!logs || logs.length === 0) return [];
    return Array.from(new Set(logs.map(log => log.equipmentType).filter(Boolean))).sort();
  }, [logs]);
  
  const uniqueCheckedBy = useMemo(() => {
    if (!logs || logs.length === 0) return [];
    return Array.from(new Set(logs.map(log => log.checkedBy).filter(Boolean))).sort();
  }, [logs]);

  // Apply filters function
  const applyFilters = () => {
    let result = [...logs];

    // Date range filter
    if (filters.fromDate) {
      result = result.filter(log => log.date >= filters.fromDate);
    }
    if (filters.toDate) {
      result = result.filter(log => log.date <= filters.toDate);
    }

    // Status filter
    if (filters.status !== 'all') {
      result = result.filter(log => log.status === filters.status);
    }

    // Equipment Type filter
    if (filters.equipmentType !== 'all') {
      result = result.filter(log => log.equipmentType === filters.equipmentType);
    }

    // Equipment ID filter
    if (filters.equipmentId) {
      result = result.filter(log => log.equipmentId.toLowerCase().includes(filters.equipmentId.toLowerCase()));
    }

    // Checked By filter
    if (filters.checkedBy) {
      result = result.filter(log => log.checkedBy === filters.checkedBy);
    }

    // Time range filter
    if (filters.fromTime) {
      result = result.filter(log => log.time >= filters.fromTime);
    }
    if (filters.toTime) {
      result = result.filter(log => log.time <= filters.toTime);
    }

    setFilteredLogs(result);
    setIsFilterOpen(false);
    toast.success(`Filtered ${result.length} entries`);
  };

  // Clear filters
  const clearFilters = () => {
    const clearedFilters = {
      fromDate: '',
      toDate: '',
      status: 'all',
      equipmentType: 'all',
      equipmentId: '',
      checkedBy: '',
      fromTime: '',
      toTime: '',
    };
    setFilters(clearedFilters);
    setFilteredLogs(logs);
    setIsFilterOpen(false);
    toast.success('Filters cleared');
  };

  // Count active filters
  const activeFilterCount = useMemo(() => {
    return [
      filters.fromDate,
      filters.toDate,
      filters.status !== 'all',
      filters.equipmentType !== 'all',
      filters.equipmentId,
      filters.checkedBy,
      filters.fromTime,
      filters.toTime,
    ].filter(Boolean).length;
  }, [filters]);

  // Update filtered logs when logs or filters change
  useEffect(() => {
    // Check if there are active filters
    const hasActiveFilters = activeFilterCount > 0;
    if (hasActiveFilters) {
      // Re-apply existing filters with new logs
      let result = [...logs];
      if (filters.fromDate) result = result.filter(log => log.date >= filters.fromDate);
      if (filters.toDate) result = result.filter(log => log.date <= filters.toDate);
      if (filters.status !== 'all') result = result.filter(log => log.status === filters.status);
      if (filters.equipmentType !== 'all') result = result.filter(log => log.equipmentType === filters.equipmentType);
      if (filters.equipmentId) result = result.filter(log => log.equipmentId.toLowerCase().includes(filters.equipmentId.toLowerCase()));
      if (filters.checkedBy) result = result.filter(log => log.checkedBy === filters.checkedBy);
      if (filters.fromTime) result = result.filter(log => log.time >= filters.fromTime);
      if (filters.toTime) result = result.filter(log => log.time <= filters.toTime);
      setFilteredLogs(result);
    } else {
      setFilteredLogs(logs);
    }
  }, [logs, filters, activeFilterCount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate custom logbook fields if selected
    if (selectedSchema) {
      const requiredFields = selectedSchema.fields.filter(f => f.required);
      for (const field of requiredFields) {
        if (!customFormData[field.id] || customFormData[field.id] === '') {
          toast.error(`Please fill in required field: ${field.label}`);
          return;
        }
      }
    }
    
    try {
      // Handle chemical entries
      if (formData.equipmentType === 'chemical') {
        const prepData = {
          equipment_name: formData.equipmentName,
          chemical_name: formData.chemicalName,
          chemical_percent: chemicals.find(c => c.name === formData.chemicalName)?.stockConcentration,
          solution_concentration: parseFloat(formData.solutionConcentration),
          water_qty: parseFloat(formData.waterQty),
          chemical_qty: parseFloat(formData.chemicalQty),
          remarks: formData.remarks || undefined,
          checked_by: user?.name || user?.email || 'Unknown',
        };
        
        await chemicalPrepAPI.create(prepData);
        toast.success('Chemical preparation entry saved successfully');
      }
      // Handle chiller entries
      else if (formData.equipmentType === 'chiller') {
        const logData = {
          equipment_id: formData.equipmentId,
          chiller_supply_temp: parseFloat(formData.chillerSupplyTemp),
          chiller_return_temp: parseFloat(formData.chillerReturnTemp),
          cooling_tower_supply_temp: parseFloat(formData.coolingTowerSupplyTemp),
          cooling_tower_return_temp: parseFloat(formData.coolingTowerReturnTemp),
          ct_differential_temp: parseFloat(formData.ctDifferentialTemp),
          chiller_water_inlet_pressure: parseFloat(formData.chillerWaterInletPressure),
          chiller_makeup_water_flow: formData.chillerMakeupWaterFlow ? parseFloat(formData.chillerMakeupWaterFlow) : undefined,
          remarks: formData.remarks || undefined,
        };
        
        await chillerLogAPI.create(logData);
        toast.success('Chiller entry saved successfully');
      }
      // Handle boiler entries
      else if (formData.equipmentType === 'boiler') {
        const logData = {
          equipment_id: formData.equipmentId,
          feed_water_temp: parseFloat(formData.feedWaterTemp),
          oil_temp: parseFloat(formData.oilTemp),
          steam_temp: parseFloat(formData.steamTemp),
          steam_pressure: parseFloat(formData.steamPressure),
          steam_flow_lph: formData.steamFlowLPH ? parseFloat(formData.steamFlowLPH) : undefined,
          remarks: formData.remarks || undefined,
        };
        
        await boilerLogAPI.create(logData);
        toast.success('Boiler entry saved successfully');
      }
      // Handle compressor entries
      else if (formData.equipmentType === 'compressor') {
        const logData = {
          equipment_id: formData.equipmentId,
          compressor_supply_temp: parseFloat(formData.compressorSupplyTemp),
          compressor_return_temp: parseFloat(formData.compressorReturnTemp),
          compressor_pressure: parseFloat(formData.compressorPressure),
          compressor_flow: formData.compressorFlow ? parseFloat(formData.compressorFlow) : undefined,
          remarks: formData.remarks || undefined,
        };
        
        await compressorLogAPI.create(logData);
        toast.success('Compressor entry saved successfully');
      }
      
      // Reset form
      setFormData({
        equipmentType: '',
        equipmentId: '',
        chillerSupplyTemp: '',
        chillerReturnTemp: '',
        coolingTowerSupplyTemp: '',
        coolingTowerReturnTemp: '',
        ctDifferentialTemp: '',
        chillerWaterInletPressure: '',
        chillerMakeupWaterFlow: '',
        feedWaterTemp: '',
        oilTemp: '',
        steamTemp: '',
        steamPressure: '',
        steamFlowLPH: '',
        compressorSupplyTemp: '',
        compressorReturnTemp: '',
        compressorPressure: '',
        compressorFlow: '',
        equipmentName: '',
        chemicalName: '',
        solutionConcentration: '',
        waterQty: '',
        chemicalQty: '',
        remarks: '',
      });
      setCustomFormData({});
      setSelectedSchema(null);
      setIsDialogOpen(false);
      
      // Refresh logs from API
      await refreshLogs();
    } catch (error: any) {
      console.error('Error saving entry:', error);
      toast.error(error?.message || 'Failed to save entry');
    }
  };

  const handleApprove = async (id: string) => {
    setApproveConfirmOpen(false);
    try {
      const log = logs.find(l => l.id === id);
      if (!log) return;

      if (log.equipmentType === 'chemical') {
        await chemicalPrepAPI.approve(id, 'approve');
      } else if (log.equipmentType === 'boiler') {
        await boilerLogAPI.approve(id, 'approve');
      } else if (log.equipmentType === 'chiller') {
        await chillerLogAPI.approve(id, 'approve');
      } else if (log.equipmentType === 'compressor') {
        await compressorLogAPI.approve(id, 'approve');
      }
      
      toast.success('Entry approved successfully');
      await refreshLogs();
    } catch (error: any) {
      console.error('Error approving entry:', error);
      toast.error(error?.message || 'Failed to approve entry');
    }
  };

  const handleApproveClick = (id: string) => {
    setSelectedLogId(id);
    setApproveConfirmOpen(true);
  };

  const handleReject = async (id: string) => {
    setRejectConfirmOpen(false);
    try {
      const log = logs.find(l => l.id === id);
      if (!log) return;

      if (log.equipmentType === 'chemical') {
        await chemicalPrepAPI.approve(id, 'reject');
      } else if (log.equipmentType === 'boiler') {
        await boilerLogAPI.approve(id, 'reject');
      } else if (log.equipmentType === 'chiller') {
        await chillerLogAPI.approve(id, 'reject');
      } else if (log.equipmentType === 'compressor') {
        await compressorLogAPI.approve(id, 'reject');
      }
      
      toast.error('Entry rejected');
      await refreshLogs();
    } catch (error: any) {
      console.error('Error rejecting entry:', error);
      toast.error(error?.message || 'Failed to reject entry');
    }
  };

  const handleRejectClick = (id: string) => {
    setSelectedLogId(id);
    setRejectConfirmOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
      return;
    }
    
    try {
      const log = logs.find(l => l.id === id);
      if (!log) return;

      if (log.equipmentType === 'chemical') {
        await chemicalPrepAPI.delete(id);
      } else if (log.equipmentType === 'boiler') {
        await boilerLogAPI.delete(id);
      } else if (log.equipmentType === 'chiller') {
        await chillerLogAPI.delete(id);
      } else if (log.equipmentType === 'compressor') {
        await compressorLogAPI.delete(id);
      }
      
      toast.success('Entry deleted successfully');
      await refreshLogs();
    } catch (error: any) {
      console.error('Error deleting entry:', error);
      toast.error(error?.message || 'Failed to delete entry');
    }
  };

  const isValueOutOfLimit = (log: ELogBook, field: string, value?: number): boolean => {
    if (value === undefined) return false;
    const limits = equipmentLimits[log.equipmentType];
    const limit = limits[field as keyof typeof limits] as { max?: number; min?: number; unit: string; type: 'NMT' | 'NLT' } | undefined;
    if (!limit) return false;
    
    if (limit.type === 'NMT' && limit.max !== undefined) {
      return value > limit.max;
    }
    if (limit.type === 'NLT' && limit.min !== undefined) {
      return value < limit.min;
    }
    return false;
  };

  const getTitle = () => {
    if (equipmentType) {
      return `${equipmentType.charAt(0).toUpperCase() + equipmentType.slice(1)} Log Book`;
    }
    return 'E Log Book';
  };

  const getSubtitle = () => {
    if (equipmentType) {
      return `Manage ${equipmentType} log entries`;
    }
    return 'Manual readings for Chillers and Boilers';
  };

  return (
    <div className="min-h-screen">
      <Header
        title={getTitle()}
        subtitle={getSubtitle()}
      />

      <div className="p-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="pending">{logs.filter(l => l.status === 'pending').length} Pending</Badge>
            <Badge variant="success">{logs.filter(l => l.status === 'approved').length} Approved</Badge>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Button */}
            <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="relative">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                  {activeFilterCount > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Filter E Log Book Entries
                  </DialogTitle>
                  <DialogDescription>
                    Filter entries by date range, status, equipment, checked by user, and time range.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  {/* Date Range */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Date Range</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>From Date</Label>
                        <Input
                          type="date"
                          value={filters.fromDate}
                          onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>To Date</Label>
                        <Input
                          type="date"
                          value={filters.toDate}
                          onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                          min={filters.fromDate}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Status</Label>
                    <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Equipment Type - Hide if equipmentType prop is provided */}
                  {!equipmentType && (
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Equipment Type</Label>
                      <Select value={filters.equipmentType} onValueChange={(v) => setFilters({ ...filters, equipmentType: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select equipment type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="chiller">Chiller</SelectItem>
                          <SelectItem value="boiler">Boiler</SelectItem>
                          <SelectItem value="chemical">Chemical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Equipment ID */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Equipment ID</Label>
                    <Input
                      type="text"
                      value={filters.equipmentId}
                      onChange={(e) => setFilters({ ...filters, equipmentId: e.target.value })}
                      placeholder="e.g., CH-001"
                    />
                  </div>

                  {/* Checked By */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Checked By</Label>
                    <Select value={filters.checkedBy || 'all'} onValueChange={(v) => setFilters({ ...filters, checkedBy: v === 'all' ? '' : v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        {uniqueCheckedBy
                          .filter((user): user is string => Boolean(user && typeof user === 'string'))
                          .map((user) => (
                            <SelectItem key={user} value={user}>
                              {user}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Time Range */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Time Range (Optional)</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>From Time</Label>
                        <Input
                          type="time"
                          value={filters.fromTime}
                          onChange={(e) => setFilters({ ...filters, fromTime: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>To Time</Label>
                        <Input
                          type="time"
                          value={filters.toTime}
                          onChange={(e) => setFilters({ ...filters, toTime: e.target.value })}
                          min={filters.fromTime}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={clearFilters}>
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsFilterOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="button" variant="accent" onClick={applyFilters}>
                    Apply Filters
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* New Entry Dialog */}
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
                {/* Digital Signature Info */}
                <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{format(new Date(), 'PPpp')}</p>
                    <p className="text-xs text-muted-foreground">Checked By: {user?.name || user?.email || 'Unknown'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Equipment Type *</Label>
                    <Select
                      value={formData.equipmentType}
                      onValueChange={(v) => {
                        setFormData({
                          ...formData,
                          equipmentType: v,
                          equipmentId: '',
                          // Reset all fields when type changes
                          chillerSupplyTemp: '',
                          chillerReturnTemp: '',
                          coolingTowerSupplyTemp: '',
                          coolingTowerReturnTemp: '',
                          ctDifferentialTemp: '',
                          chillerWaterInletPressure: '',
                          chillerMakeupWaterFlow: '',
                          feedWaterTemp: '',
                          oilTemp: '',
                          steamTemp: '',
                          steamPressure: '',
                          steamFlowLPH: '',
                          compressorSupplyTemp: '',
                          compressorReturnTemp: '',
                          compressorPressure: '',
                          compressorFlow: '',
                          equipmentName: '',
                          chemicalName: '',
                          solutionConcentration: '',
                          waterQty: '',
                          chemicalQty: '',
                        });
                        setCustomFormData({});
                      }}
                      disabled={!!equipmentType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="chiller">Chiller</SelectItem>
                        <SelectItem value="boiler">Boiler</SelectItem>
                        <SelectItem value="chemical">Chemical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.equipmentType !== 'chemical' && (
                    <div className="space-y-2">
                      <Label>Equipment ID *</Label>
                      <Select
                        value={formData.equipmentId}
                        onValueChange={(v) => setFormData({ ...formData, equipmentId: v })}
                        disabled={!formData.equipmentType}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select ID" />
                        </SelectTrigger>
                        <SelectContent>
                          {formData.equipmentType && equipmentList[formData.equipmentType as keyof typeof equipmentList]?.map((id) => (
                            <SelectItem key={id} value={id}>{id}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Chiller Fields */}
                {formData.equipmentType === 'chiller' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Thermometer className="w-4 h-4" /> Chiller supply temp
                          <span className="text-xs text-muted-foreground">(NMT {equipmentLimits.chiller.chillerSupplyTemp.max} {equipmentLimits.chiller.chillerSupplyTemp.unit})</span>
                        </Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.chillerSupplyTemp}
                          onChange={(e) => setFormData({ ...formData, chillerSupplyTemp: e.target.value })}
                          placeholder="e.g., 8"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Thermometer className="w-4 h-4" /> Chiller return temp
                          <span className="text-xs text-muted-foreground">(NMT {equipmentLimits.chiller.chillerReturnTemp.max} {equipmentLimits.chiller.chillerReturnTemp.unit})</span>
                        </Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.chillerReturnTemp}
                          onChange={(e) => setFormData({ ...formData, chillerReturnTemp: e.target.value })}
                          placeholder="e.g., 15"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Thermometer className="w-4 h-4" /> Cooling tower supply temp
                          <span className="text-xs text-muted-foreground">(NMT {equipmentLimits.chiller.coolingTowerSupplyTemp.max} {equipmentLimits.chiller.coolingTowerSupplyTemp.unit})</span>
                        </Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.coolingTowerSupplyTemp}
                          onChange={(e) => setFormData({ ...formData, coolingTowerSupplyTemp: e.target.value })}
                          placeholder="e.g., 25"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Thermometer className="w-4 h-4" /> Cooling tower Return temp
                          <span className="text-xs text-muted-foreground">(NMT {equipmentLimits.chiller.coolingTowerReturnTemp.max} {equipmentLimits.chiller.coolingTowerReturnTemp.unit})</span>
                        </Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.coolingTowerReturnTemp}
                          onChange={(e) => setFormData({ ...formData, coolingTowerReturnTemp: e.target.value })}
                          placeholder="e.g., 30"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Thermometer className="w-4 h-4" /> CT Differential temperature
                          <span className="text-xs text-muted-foreground">(NMT {equipmentLimits.chiller.ctDifferentialTemp.max} {equipmentLimits.chiller.ctDifferentialTemp.unit})</span>
                        </Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.ctDifferentialTemp}
                          onChange={(e) => setFormData({ ...formData, ctDifferentialTemp: e.target.value })}
                          placeholder="e.g., 5"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Gauge className="w-4 h-4" /> Chiller water inlet pressure
                          <span className="text-xs text-muted-foreground">(NLT {equipmentLimits.chiller.chillerWaterInletPressure.min} {equipmentLimits.chiller.chillerWaterInletPressure.unit})</span>
                        </Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.chillerWaterInletPressure}
                          onChange={(e) => setFormData({ ...formData, chillerWaterInletPressure: e.target.value })}
                          placeholder="e.g., 2"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Chiller make up water Flow (LPH)</Label>
                      <Input
                        type="number"
                        step="1"
                        value={formData.chillerMakeupWaterFlow}
                        onChange={(e) => setFormData({ ...formData, chillerMakeupWaterFlow: e.target.value })}
                        placeholder="e.g., 10000"
                      />
                    </div>
                  </>
                )}

                {/* Boiler Fields */}
                {formData.equipmentType === 'boiler' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Thermometer className="w-4 h-4" /> Feed water temp
                          <span className="text-xs text-muted-foreground">(NLT {equipmentLimits.boiler.feedWaterTemp.min} {equipmentLimits.boiler.feedWaterTemp.unit})</span>
                        </Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.feedWaterTemp}
                          onChange={(e) => setFormData({ ...formData, feedWaterTemp: e.target.value })}
                          placeholder="e.g., 50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Thermometer className="w-4 h-4" /> Oil temp
                          <span className="text-xs text-muted-foreground">(NLT {equipmentLimits.boiler.oilTemp.min} {equipmentLimits.boiler.oilTemp.unit})</span>
                        </Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.oilTemp}
                          onChange={(e) => setFormData({ ...formData, oilTemp: e.target.value })}
                          placeholder="e.g., 50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Thermometer className="w-4 h-4" /> Steam temp
                          <span className="text-xs text-muted-foreground">(NLT {equipmentLimits.boiler.steamTemp.min} {equipmentLimits.boiler.steamTemp.unit})</span>
                        </Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.steamTemp}
                          onChange={(e) => setFormData({ ...formData, steamTemp: e.target.value })}
                          placeholder="e.g., 150"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Gauge className="w-4 h-4" /> Steam Pressure
                          <span className="text-xs text-muted-foreground">(NLT {equipmentLimits.boiler.steamPressure.min} {equipmentLimits.boiler.steamPressure.unit})</span>
                        </Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.steamPressure}
                          onChange={(e) => setFormData({ ...formData, steamPressure: e.target.value })}
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
                        onChange={(e) => setFormData({ ...formData, steamFlowLPH: e.target.value })}
                        placeholder="e.g., 10000"
                      />
                    </div>
                  </>
                )}

                {/* Compressor Fields */}
                {formData.equipmentType === 'compressor' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Thermometer className="w-4 h-4" /> Compressor supply temp
                          <span className="text-xs text-muted-foreground">(NMT {equipmentLimits.compressor.compressorSupplyTemp.max} {equipmentLimits.compressor.compressorSupplyTemp.unit})</span>
                        </Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.compressorSupplyTemp}
                          onChange={(e) => setFormData({ ...formData, compressorSupplyTemp: e.target.value })}
                          placeholder="e.g., 10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Thermometer className="w-4 h-4" /> Compressor return temp
                          <span className="text-xs text-muted-foreground">(NMT {equipmentLimits.compressor.compressorReturnTemp.max} {equipmentLimits.compressor.compressorReturnTemp.unit})</span>
                        </Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.compressorReturnTemp}
                          onChange={(e) => setFormData({ ...formData, compressorReturnTemp: e.target.value })}
                          placeholder="e.g., 20"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Gauge className="w-4 h-4" /> Compressor pressure
                          <span className="text-xs text-muted-foreground">(NLT {equipmentLimits.compressor.compressorPressure.min} {equipmentLimits.compressor.compressorPressure.unit})</span>
                        </Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.compressorPressure}
                          onChange={(e) => setFormData({ ...formData, compressorPressure: e.target.value })}
                          placeholder="e.g., 5"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Droplets className="w-4 h-4" /> Compressor flow (L/min)
                        </Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.compressorFlow}
                          onChange={(e) => setFormData({ ...formData, compressorFlow: e.target.value })}
                          placeholder="e.g., 100"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Chemical Fields */}
                {formData.equipmentType === 'chemical' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>EqP Name *</Label>
                        <Select
                          value={formData.equipmentName}
                          onValueChange={(v) => setFormData({ ...formData, equipmentName: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select equipment" />
                          </SelectTrigger>
                          <SelectContent>
                            {equipmentList.chemical.map((eq) => (
                              <SelectItem key={eq} value={eq}>
                                {eq}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Chemical name *</Label>
                        <Select
                          value={formData.chemicalName}
                          onValueChange={(v) => setFormData({ ...formData, chemicalName: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select chemical" />
                          </SelectTrigger>
                          <SelectContent>
                            {chemicals.map((chem) => (
                              <SelectItem key={chem.name} value={chem.name}>
                                {chem.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {formData.chemicalName && (
                      <div className="bg-accent/10 rounded-lg p-3 border border-accent/20">
                        <p className="text-sm text-accent font-medium">
                          Chemical %: {chemicals.find(c => c.name === formData.chemicalName)?.stockConcentration}%
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Solution concentration % *</Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0.1"
                          max="100"
                          value={formData.solutionConcentration}
                          onChange={(e) => setFormData({ ...formData, solutionConcentration: e.target.value })}
                          placeholder="e.g., 2"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Water Qty (L) *</Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={formData.waterQty}
                          onChange={(e) => setFormData({ ...formData, waterQty: e.target.value })}
                          placeholder="e.g., 5"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Chemical Qty (G) *</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        value={formData.chemicalQty}
                        onChange={(e) => setFormData({ ...formData, chemicalQty: e.target.value })}
                        placeholder="e.g., 100"
                      />
                    </div>
                  </>
                )}

                {/* Custom Logbook Fields */}
                {selectedSchema && formData.equipmentType?.startsWith('custom_') && (
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-semibold text-lg">{selectedSchema.name}</h3>
                    {selectedSchema.description && (
                      <p className="text-sm text-muted-foreground">{selectedSchema.description}</p>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      {selectedSchema.fields
                        .filter(field => !field.display?.hidden)
                        .sort((a, b) => (a.display?.order || 0) - (b.display?.order || 0))
                        .map((field) => {
                          const columnSpan = field.display?.columnSpan || 1;
                          return (
                            <div
                              key={field.id}
                              className={columnSpan === 2 ? 'col-span-2' : ''}
                            >
                              <FieldWithValidation
                                field={field}
                                value={customFormData[field.id] || ''}
                                onChange={(value) => {
                                  setCustomFormData({
                                    ...customFormData,
                                    [field.id]: value,
                                  });
                                }}
                              />
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Remarks</Label>
                  <Textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    placeholder="Add any observations or notes..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="accent">
                    <Save className="w-4 h-4 mr-2" />
                    Save Entry
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Equipment</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Readings</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Remarks</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Checked By</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                      <p className="text-sm">Loading entries...</p>
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                      <p className="text-sm">
                        {activeFilterCount > 0 
                          ? 'No records found matching the selected filters'
                          : 'No E Log Book entries found'}
                      </p>
                      <p className="text-xs mt-1">
                        {activeFilterCount > 0 
                          ? 'Try adjusting your filters or clear them to see all entries'
                          : 'Create a new entry to get started'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-sm text-foreground">{log.date}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-foreground">{log.time}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-foreground capitalize">
                            {log.equipmentType?.startsWith('custom_') 
                              ? logbookSchemas.find(s => s.id === log.schemaId)?.name || 'Custom Logbook'
                              : log.equipmentType}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">{log.equipmentId}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1 text-xs">
                          {log.equipmentType?.startsWith('custom_') && log.customFields && (
                            <>
                              {logbookSchemas
                                .find(s => s.id === log.schemaId)
                                ?.fields.filter(f => !f.display?.hidden)
                                .map((field) => {
                                  const value = log.customFields?.[field.id];
                                  if (value === undefined || value === null || value === '') return null;
                                  
                                  let displayValue = value;
                                  if (field.type === 'number') {
                                    displayValue = parseFloat(value);
                                    if (isNaN(displayValue)) return null;
                                    if (field.metadata?.limit?.unit) {
                                      displayValue = `${displayValue} ${field.metadata.limit.unit}`;
                                    }
                                  } else if (field.type === 'boolean') {
                                    displayValue = value ? 'Yes' : 'No';
                                  } else if (field.type === 'date' || field.type === 'datetime') {
                                    displayValue = format(new Date(value), 'yyyy-MM-dd HH:mm');
                                  }
                                  
                                  const isOutOfLimit = field.metadata?.limit && field.type === 'number' && 
                                    ((field.metadata.limit.type === 'max' && parseFloat(value) > field.metadata.limit.value) ||
                                     (field.metadata.limit.type === 'min' && parseFloat(value) < field.metadata.limit.value));
                                  
                                  return (
                                    <p 
                                      key={field.id}
                                      className={isOutOfLimit ? 'text-destructive font-bold' : ''}
                                    >
                                      <span className="font-medium">{field.label}:</span> {displayValue}
                                    </p>
                                  );
                                })}
                            </>
                          )}
                          {log.equipmentType === 'chiller' && (
                            <>
                              {log.chillerSupplyTemp !== undefined && (
                                <p className={isValueOutOfLimit(log, 'chillerSupplyTemp', log.chillerSupplyTemp) ? 'text-destructive font-bold' : ''}>
                                  Supply: {log.chillerSupplyTemp}°C
                                </p>
                              )}
                              {log.chillerReturnTemp !== undefined && (
                                <p className={isValueOutOfLimit(log, 'chillerReturnTemp', log.chillerReturnTemp) ? 'text-destructive font-bold' : ''}>
                                  Return: {log.chillerReturnTemp}°C
                                </p>
                              )}
                              {log.coolingTowerSupplyTemp !== undefined && (
                                <p className={isValueOutOfLimit(log, 'coolingTowerSupplyTemp', log.coolingTowerSupplyTemp) ? 'text-destructive font-bold' : ''}>
                                  CT Supply: {log.coolingTowerSupplyTemp}°C
                                </p>
                              )}
                              {log.coolingTowerReturnTemp !== undefined && (
                                <p className={isValueOutOfLimit(log, 'coolingTowerReturnTemp', log.coolingTowerReturnTemp) ? 'text-destructive font-bold' : ''}>
                                  CT Return: {log.coolingTowerReturnTemp}°C
                                </p>
                              )}
                              {log.ctDifferentialTemp !== undefined && (
                                <p className={isValueOutOfLimit(log, 'ctDifferentialTemp', log.ctDifferentialTemp) ? 'text-destructive font-bold' : ''}>
                                  CT Diff: {log.ctDifferentialTemp}°C
                                </p>
                              )}
                              {log.chillerWaterInletPressure !== undefined && (
                                <p className={isValueOutOfLimit(log, 'chillerWaterInletPressure', log.chillerWaterInletPressure) ? 'text-destructive font-bold' : ''}>
                                  Pressure: {log.chillerWaterInletPressure} bar
                                </p>
                              )}
                              {log.chillerMakeupWaterFlow !== undefined && (
                                <p>Flow: {log.chillerMakeupWaterFlow} LPH</p>
                              )}
                            </>
                          )}
                          {log.equipmentType === 'boiler' && (
                            <>
                              {log.feedWaterTemp !== undefined && (
                                <p className={isValueOutOfLimit(log, 'feedWaterTemp', log.feedWaterTemp) ? 'text-destructive font-bold' : ''}>
                                  Feed Water: {log.feedWaterTemp}°C
                                </p>
                              )}
                              {log.oilTemp !== undefined && (
                                <p className={isValueOutOfLimit(log, 'oilTemp', log.oilTemp) ? 'text-destructive font-bold' : ''}>
                                  Oil: {log.oilTemp}°C
                                </p>
                              )}
                              {log.steamTemp !== undefined && (
                                <p className={isValueOutOfLimit(log, 'steamTemp', log.steamTemp) ? 'text-destructive font-bold' : ''}>
                                  Steam: {log.steamTemp}°C
                                </p>
                              )}
                              {log.steamPressure !== undefined && (
                                <p className={isValueOutOfLimit(log, 'steamPressure', log.steamPressure) ? 'text-destructive font-bold' : ''}>
                                  Pressure: {log.steamPressure} bar
                                </p>
                              )}
                              {log.steamFlowLPH !== undefined && (
                                <p>Flow: {log.steamFlowLPH} LPH</p>
                              )}
                            </>
                          )}
                          {log.equipmentType === 'compressor' && (
                            <>
                              {log.compressorSupplyTemp !== undefined && (
                                <p className={isValueOutOfLimit(log, 'compressorSupplyTemp', log.compressorSupplyTemp) ? 'text-destructive font-bold' : ''}>
                                  Supply: {log.compressorSupplyTemp}°C
                                </p>
                              )}
                              {log.compressorReturnTemp !== undefined && (
                                <p className={isValueOutOfLimit(log, 'compressorReturnTemp', log.compressorReturnTemp) ? 'text-destructive font-bold' : ''}>
                                  Return: {log.compressorReturnTemp}°C
                                </p>
                              )}
                              {log.compressorPressure !== undefined && (
                                <p className={isValueOutOfLimit(log, 'compressorPressure', log.compressorPressure) ? 'text-destructive font-bold' : ''}>
                                  Pressure: {log.compressorPressure} bar
                                </p>
                              )}
                              {log.compressorFlow !== undefined && (
                                <p>Flow: {log.compressorFlow} L/min</p>
                              )}
                            </>
                          )}
                          {log.equipmentType === 'chemical' && (
                            <>
                              {log.equipmentName && (
                                <p className="font-medium">EqP: {log.equipmentName}</p>
                              )}
                              {log.chemicalName && (
                                <p className="font-medium">Chemical: {log.chemicalName}</p>
                              )}
                              {log.chemicalPercent !== undefined && (
                                <p>Chemical %: {log.chemicalPercent}%</p>
                              )}
                              {log.solutionConcentration !== undefined && (
                                <p>Solution: {log.solutionConcentration}%</p>
                              )}
                              {log.waterQty !== undefined && (
                                <p>Water: {log.waterQty} L</p>
                              )}
                              {log.chemicalQty !== undefined && (
                                <p className="font-bold text-accent">Qty: {log.chemicalQty} G</p>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">{log.remarks || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-foreground">{log.checkedBy}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={log.status === 'approved' ? 'success' : log.status === 'rejected' ? 'danger' : 'pending'}>
                          {log.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {(log.status === 'pending' || log.status === 'draft') && user?.role !== 'operator' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleApproveClick(log.id)}
                                className="h-7 text-xs"
                              >
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRejectClick(log.id)}
                                className="h-7 text-xs text-destructive hover:text-destructive"
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(log.id)}
                            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Delete Entry"
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

      {/* Approve Confirmation Alert */}
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
              onClick={() => selectedLogId && handleApprove(selectedLogId)}
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
              Are you sure you want to reject this entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedLogId && handleReject(selectedLogId)}
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
