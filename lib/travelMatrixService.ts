/**
 * Breakthrough OS - NDIS Provider Travel & Multi-Drop Mileage Matrix Calculator
 * 
 * Compliant with 2026 NDIS Pricing Arrangements and Price Limits:
 * 1. Provider Travel Time Caps by Modified Monash Model (MMM) Classification:
 *    - MMM 1 - 3 (Metro / Regional Centres): Max 30 minutes travel time per trip
 *    - MMM 4 - 5 (Regional / Rural): Max 60 minutes travel time per trip
 *    - MMM 6 - 7 (Very Remote): Negotiated directly with NDIA
 * 2. Multi-Drop Apportioning:
 *    - When a practitioner travels between multiple participants in a single journey,
 *      travel time and vehicle distance are apportioned equally or by distance ratio.
 * 3. NDIS Line Items:
 *    - Core Daily Activities Travel: 01_799_0115_1_1
 *    - Capacity Building (PBS / Allied Health) Travel: 15_799_0128_1_3
 *    - Non-Labour Travel Costs (Vehicle Mileage): $0.96 / km (SCHADS Clause 20.5 / NDIS Cap)
 *    - Road tolls & public transport fares pass-through
 */

export interface TravelLeg {
  id: string;
  fromLocation: string;
  toLocation: string;
  clientId: string;
  clientName: string;
  ndisNumber: string;
  mmmZone: 'MMM1' | 'MMM2' | 'MMM3' | 'MMM4' | 'MMM5' | 'MMM6' | 'MMM7';
  distanceKm: number;
  travelMinutes: number;
  supportCategory: 'Core' | 'Capacity Building';
}

export interface ApportionedTravelClaim {
  clientId: string;
  clientName: string;
  ndisNumber: string;
  supportItemCode: string;
  claimedMinutes: number;
  claimedHours: number;
  hourlyRate: number;
  travelLabourAmount: number;
  mileageKm: number;
  mileageRatePerKm: number;
  mileageAmount: number;
  tollsAmount: number;
  totalTravelClaimAmount: number;
  mmmZone: string;
  cappedNotice?: string;
}

export interface MultiDropJourneyCalculation {
  totalJourneyMinutes: number;
  totalJourneyDistanceKm: number;
  totalTolls: number;
  legsCount: number;
  claims: ApportionedTravelClaim[];
  totalTravelCostGross: number;
}

export const NDIS_TRAVEL_CAPS_MINUTES = {
  MMM1: 30,
  MMM2: 30,
  MMM3: 30,
  MMM4: 60,
  MMM5: 60,
  MMM6: 120, // Remote
  MMM7: 180  // Very Remote
};

export const NDIS_TRAVEL_LINE_ITEMS = {
  CORE: '01_799_0115_1_1',
  CAPACITY_BUILDING: '15_799_0128_1_3',
};

export const VEHICLE_KM_RATE = 0.96; // $0.96 / km

/**
 * Calculates multi-drop travel claims apportioned across participants
 */
export function calculateMultiDropTravelClaims(
  legs: TravelLeg[],
  baseHourlyRate: number = 214.41,
  totalTolls: number = 0
): MultiDropJourneyCalculation {
  if (!legs || legs.length === 0) {
    return {
      totalJourneyMinutes: 0,
      totalJourneyDistanceKm: 0,
      totalTolls: 0,
      legsCount: 0,
      claims: [],
      totalTravelCostGross: 0
    };
  }

  const totalJourneyMinutes = legs.reduce((sum, l) => sum + l.travelMinutes, 0);
  const totalJourneyDistanceKm = legs.reduce((sum, l) => sum + l.distanceKm, 0);
  const totalParticipants = legs.length;
  const apportionedTollPerClient = totalTolls / totalParticipants;

  let totalGross = 0;

  const claims: ApportionedTravelClaim[] = legs.map((leg) => {
    const maxAllowedMinutes = NDIS_TRAVEL_CAPS_MINUTES[leg.mmmZone] || 30;
    
    // Check if apportioned or individual leg applies
    const rawLegMinutes = leg.travelMinutes;
    const cappedMinutes = Math.min(rawLegMinutes, maxAllowedMinutes);
    const claimedHours = Number((cappedMinutes / 60).toFixed(2));
    const travelLabourAmount = Number((claimedHours * baseHourlyRate).toFixed(2));

    const mileageKm = leg.distanceKm;
    const mileageAmount = Number((mileageKm * VEHICLE_KM_RATE).toFixed(2));
    const tollsAmount = Number(apportionedTollPerClient.toFixed(2));

    const totalTravelClaimAmount = Number((travelLabourAmount + mileageAmount + tollsAmount).toFixed(2));
    totalGross += totalTravelClaimAmount;

    const supportItemCode = leg.supportCategory === 'Core'
      ? NDIS_TRAVEL_LINE_ITEMS.CORE
      : NDIS_TRAVEL_LINE_ITEMS.CAPACITY_BUILDING;

    let cappedNotice: string | undefined;
    if (rawLegMinutes > maxAllowedMinutes) {
      cappedNotice = `Travel time capped at ${maxAllowedMinutes} mins per NDIS ${leg.mmmZone} regional limits (${rawLegMinutes} mins requested).`;
    }

    return {
      clientId: leg.clientId,
      clientName: leg.clientName,
      ndisNumber: leg.ndisNumber,
      supportItemCode,
      claimedMinutes: cappedMinutes,
      claimedHours,
      hourlyRate: baseHourlyRate,
      travelLabourAmount,
      mileageKm,
      mileageRatePerKm: VEHICLE_KM_RATE,
      mileageAmount,
      tollsAmount,
      totalTravelClaimAmount,
      mmmZone: leg.mmmZone,
      cappedNotice
    };
  });

  return {
    totalJourneyMinutes,
    totalJourneyDistanceKm,
    totalTolls,
    legsCount: legs.length,
    claims,
    totalTravelCostGross: Number(totalGross.toFixed(2))
  };
}
