export type MaintenanceActivityType = "operation" | "maintenance" | "shutdown";

export interface MaintenanceTimingsValue {
  activityType: MaintenanceActivityType;
  fromDate: string; // yyyy-MM-dd
  toDate: string; // yyyy-MM-dd
  fromTime: string; // HH:mm
  toTime: string; // HH:mm
}

