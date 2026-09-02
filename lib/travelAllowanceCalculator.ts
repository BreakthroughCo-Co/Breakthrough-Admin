import { Client } from '../types';

export interface TravelAllowanceCalculation {
  clientId: string;
  clientName: string;
  mmmZone: 'MMM1' | 'MMM2' | 'MMM3' | 'MMM4' | 'MMM5' | 'MMM6' | 'MMM7';
  travelDistanceKm: number;
  maxBillableTravelMinutes: number;
  actualTravelMinutes: number;
  billableTravelMinutes: number;
  hourlyRate: number;
  laborTravelCost: number;
  nonLaborVehicleAllowance: number; // $0.97 per km (NDIS standard vehicle rate)
  totalTravelClaimAmount: number;
  travelSupportItemCode: string;
}

export class TravelAllowanceCalculator {
  private static VEHICLE_RATE_PER_KM = 0.97; // NDIS vehicle allowance per km
  private static THERAPY_BASE_HOURLY = 214.41; // Specialist PBS Rate

  /**
   * Calculates maximum billable NDIS travel allowance based on Modified Monash Model.
   */
  public static calculateTravel(
    client: Client,
    distanceKm: number,
    travelTimeMinutes: number
  ): TravelAllowanceCalculation {
    const rawMmm = client.address?.mmmZone || 'MMM1';
    const mmmZone = (rawMmm.toUpperCase().startsWith('MMM') ? rawMmm.toUpperCase() : 'MMM1') as TravelAllowanceCalculation['mmmZone'];

    // MMM 1-3 (Metro & Regional Centres): Up to 30 mins billable
    // MMM 4-5 (Rural): Up to 60 mins billable
    // MMM 6-7 (Remote / Very Remote): Negotiated / up to 60+ mins
    let maxMinutes = 30;
    if (mmmZone === 'MMM4' || mmmZone === 'MMM5') {
      maxMinutes = 60;
    } else if (mmmZone === 'MMM6' || mmmZone === 'MMM7') {
      maxMinutes = 90;
    }

    const billableTravelMinutes = Math.min(travelTimeMinutes, maxMinutes);
    const laborTravelCost = (billableTravelMinutes / 60) * this.THERAPY_BASE_HOURLY;
    const nonLaborVehicleAllowance = distanceKm * this.VEHICLE_RATE_PER_KM;
    const totalTravelClaimAmount = laborTravelCost + nonLaborVehicleAllowance;

    return {
      clientId: client.id,
      clientName: client.name,
      mmmZone,
      travelDistanceKm: distanceKm,
      maxBillableTravelMinutes: maxMinutes,
      actualTravelMinutes: travelTimeMinutes,
      billableTravelMinutes,
      hourlyRate: this.THERAPY_BASE_HOURLY,
      laborTravelCost: Math.round(laborTravelCost * 100) / 100,
      nonLaborVehicleAllowance: Math.round(nonLaborVehicleAllowance * 100) / 100,
      totalTravelClaimAmount: Math.round(totalTravelClaimAmount * 100) / 100,
      travelSupportItemCode: '07_799_0115_8_3',
    };
  }
}
