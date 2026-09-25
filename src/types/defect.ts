export type CarModel =
  | "Base"
  | "iX0M"
  | "Long"
  | "Pick-Up"
  | "Alpina";

export type MotorType =
  | "Long Range"
  | "High Performance";

export type DesignPackage =
  | "Race"
  | "Offroad"
  | "Luxury";

export type DefectCategory =
  | "Cosmetic"
  | "Functional"
  | "Electrical"
  | "Structural"
  | "Safety";

export type ProductionShift =
  | "Morning"
  | "Afternoon"
  | "Night";

export type ResolutionStatus =
  | "Open"
  | "In Progress"
  | "Resolved";

export type YesNo = "Yes" | "No";

export interface Defect {
  defectId: string;

  reportDate: string;
  reportTime: string;
  productionDate: string;

  vin: string;

  carModel: CarModel;
  motorType: MotorType;
  designPackage: DesignPackage;

  stationId: string;
  stationName: string;
 stationNameOriginal: string;

  partNumber: string;
  partName: string;
  supplier: string;

  defectName: string;
  defectCategory: DefectCategory;

  severityRating: number;

  inspectorId: string;
  productionShift: ProductionShift;

  resolutionStatus: ResolutionStatus;

  resolutionTimestamp: string | null;
  resolutionTimeHours: number | null;

  rootCauseIdentified: YesNo | null;
  reworkTimeMinutes: number | null;

  potentialDuplicate: boolean;
}