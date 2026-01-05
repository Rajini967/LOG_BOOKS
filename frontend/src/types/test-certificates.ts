// Common instrument interface
export interface InstrumentDetails {
  name: string;
  make: string;
  model: string;
  serialNumber: string;
  idNumber?: string; // Instrument ID Number
  calibrationDate: string;
  calibrationDueDate: string;
  flowRate?: string; // e.g., "100 LPM"
  samplingTime?: string; // e.g., "1 Min"
}

// Common client info
export interface ClientInfo {
  name: string;
  address: string;
}

// Air Velocity Test Data
export interface FilterReading {
  filterId: string;
  filterArea: number; // Sq. ft
  readings: [number, number, number, number, number]; // 5 velocity readings in FPM
  avgVelocity: number; // Calculated
  airFlowCFM: number; // Calculated
}

export interface RoomData {
  roomName: string;
  roomNumber?: string;
  filters: FilterReading[];
  totalAirFlowCFM: number; // Calculated
  roomVolumeCFT: number;
  ach: number; // Calculated
  designACPH?: number;
}

export interface AirVelocityTestData {
  id: string;
  clientInfo: ClientInfo;
  certificateNo: string;
  date: string;
  testReference: string;
  instrument: InstrumentDetails;
  ahuNumber: string;
  inference?: string; // Test inference/conclusion
  rooms: RoomData[];
  preparedBy: string;
  approvedBy?: string;
  timestamp: Date;
  status: 'pending' | 'approved' | 'rejected';
}

// Filter Integrity Test Data
export interface FilterIntegrityReading {
  filterId: string;
  upstreamConcentration: number; // % (typically 100%)
  aerosolConcentration: number; // µg/litre (20 to 80) - this is the downstream measurement
  downstreamConcentration: number; // µg/litre - measured downstream value
  downstreamLeakage: number; // % (calculated: (downstream/upstream) * 100)
  acceptableLimit: number; // Default 0.01%
  testStatus: 'PASS' | 'FAIL';
}

export interface FilterIntegrityRoomData {
  roomName: string;
  roomNumber?: string;
  filters: FilterIntegrityReading[];
}

export interface FilterIntegrityTestData {
  id: string;
  clientInfo: ClientInfo;
  certificateNo: string;
  date: string;
  testReference: string;
  instrument: InstrumentDetails;
  ahuNumber: string;
  rooms: FilterIntegrityRoomData[];
  inference: string;
  preparedBy: string;
  approvedBy?: string;
  timestamp: Date;
  status: 'pending' | 'approved' | 'rejected';
}

// Recovery Test Data
export interface RecoveryDataPoint {
  time: string;
  ahuStatus: 'ON' | 'OFF';
  particleCount05: number; // ≥0.5μm
  particleCount5: number; // ≥5μm
}

export interface RecoveryTestData {
  id: string;
  clientInfo: ClientInfo;
  certificateNo: string;
  date: string;
  areaClassification: string;
  instrument: InstrumentDetails;
  ahuNumber: string;
  roomName?: string;
  roomNumber?: string;
  testCondition?: string; // e.g., "At Rest" or "Operational"
  timeSeries: RecoveryDataPoint[];
  recoveryTime: number; // Calculated in minutes
  testStatus?: 'PASS' | 'FAIL'; // Based on recovery time ≤ 15 minutes
  auditStatement?: string; // Auto-generated audit statement
  preparedBy: string;
  approvedBy?: string;
  timestamp: Date;
  status: 'pending' | 'approved' | 'rejected';
}

// Differential Pressure Test Data
export interface DifferentialPressureReading {
  roomPositive: string; // Room with positive pressure
  roomNegative: string; // Room with negative pressure
  dpReading: number; // Pascals
  limit: number; // Default 5 Pa (NLT)
  testStatus: 'PASS' | 'FAIL';
}

export interface DifferentialPressureTestData {
  id: string;
  clientInfo: ClientInfo;
  certificateNo: string;
  date: string;
  instrument: InstrumentDetails;
  ahuNumber: string;
  readings: DifferentialPressureReading[];
  preparedBy: string;
  approvedBy?: string;
  timestamp: Date;
  status: 'pending' | 'approved' | 'rejected';
}

// NVPC Test Data
export interface NVPCSamplingPoint {
  pointId: string;
  location: string; // Location name
  readings05: number[]; // Multiple readings for ≥0.5μm (e.g., S1, S2, etc.)
  readings5: number[]; // Multiple readings for ≥5μm
  average05: number; // Calculated average for ≥0.5μm
  average5: number; // Calculated average for ≥5μm
  // Legacy fields for backward compatibility
  particleCount05?: number; // ≥0.5μm (deprecated, use average05)
  particleCount5?: number; // ≥5μm (deprecated, use average5)
  limit05: number;
  limit5: number;
  testStatus: 'PASS' | 'FAIL';
}

export interface NVPCRoomData {
  roomName: string;
  roomNumber?: string;
  isoClass?: number; // Optional, kept for backward compatibility
  samplingPoints: NVPCSamplingPoint[];
  // Room-level calculated values
  mean05?: number; // Mean of all locations for ≥0.5µm
  mean5?: number; // Mean of all locations for ≥5.0µm
  roomStatus?: 'PASS' | 'FAIL'; // Room-level status based on mean comparison
}

export interface NVPCTestData {
  id: string;
  clientInfo: ClientInfo;
  certificateNo: string;
  date: string;
  areaClassification: string; // e.g., "ISO 8 (Class 1,00,000)"
  instrument: InstrumentDetails;
  ahuNumber: string;
  areaName?: string; // e.g., "B- BLOCK"
  inference?: string; // Test inference/conclusion
  rooms: NVPCRoomData[];
  preparedBy: string;
  approvedBy?: string;
  timestamp: Date;
  status: 'pending' | 'approved' | 'rejected';
}

