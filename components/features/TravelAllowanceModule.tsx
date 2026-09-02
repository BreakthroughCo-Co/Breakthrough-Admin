import React, { useState } from 'react';
import { useManagementStore } from '../../stores/useManagementStore';
import { TravelAllowanceCalculator, TravelAllowanceCalculation } from '../../lib/travelAllowanceCalculator';
import {
  Car,
  MapPin,
  Clock,
  DollarSign,
  PlusCircle,
  CheckCircle2,
  Navigation
} from 'lucide-react';

export const TravelAllowanceModule: React.FC = () => {
  const { clients, addBillingClaim, addNotification } = useManagementStore();
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || '');
  const [distanceKm, setDistanceKm] = useState(25);
  const [travelMinutes, setTravelMinutes] = useState(35);

  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0];

  const calculation: TravelAllowanceCalculation = TravelAllowanceCalculator.calculateTravel(
    selectedClient || { id: 'c-1', name: 'Participant', address: { mmmZone: 'MMM1' } } as any,
    distanceKm,
    travelMinutes
  );

  const handleGenerateClaim = () => {
    if (!selectedClient) return;
    addBillingClaim({
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      ndisNumber: selectedClient.ndisNumber || '430000000',
      serviceDate: new Date().toISOString().slice(0, 10),
      ndisSupportItem: '07_799_0115_8_3 - Provider Travel - Capacity Building',
      supportItemCode: '07_799_0115_8_3',
      supportItemName: 'Provider Travel - Capacity Building',
      hours: calculation.billableTravelMinutes / 60,
      unitRate: calculation.hourlyRate,
      totalAmount: calculation.totalTravelClaimAmount,
      status: 'Pending',
    });

    addNotification({
      title: 'Travel Billing Claim Created',
      message: `Generated travel claim for $${calculation.totalTravelClaimAmount.toFixed(2)} (${calculation.billableTravelMinutes} mins + ${calculation.travelDistanceKm}km non-labor).`,
      type: 'billing',
      severity: 'success',
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Modified Monash Model (MMM) Travel Allowance Calculator
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                NDIS 2026 Caps
              </span>
            </h2>
            <p className="text-sm text-slate-400">
              Automated travel cap calculation (labor + $0.97/km vehicle allowance) with 1-click billing claim generation
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerateClaim}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-emerald-900/30 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          Create Travel Claim (${calculation.totalTravelClaimAmount.toFixed(2)})
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Select Participant</label>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.address?.mmmZone || 'MMM1'})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">One-Way Distance (KM)</label>
          <input
            type="number"
            value={distanceKm}
            onChange={(e) => setDistanceKm(Number(e.target.value))}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Travel Time (Minutes)</label>
          <input
            type="number"
            value={travelMinutes}
            onChange={(e) => setTravelMinutes(Number(e.target.value))}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">MMM Region Tier</span>
          <span className="text-xl font-bold text-white">{calculation.mmmZone}</span>
          <span className="text-[11px] text-slate-500 block mt-1">Cap: Up to {calculation.maxBillableTravelMinutes} mins</span>
        </div>

        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">Billable Labor Time</span>
          <span className="text-xl font-bold text-emerald-400">{calculation.billableTravelMinutes} mins</span>
          <span className="text-[11px] text-slate-500 block mt-1">${calculation.laborTravelCost.toFixed(2)} labor</span>
        </div>

        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">Vehicle Allowance ($0.97/km)</span>
          <span className="text-xl font-bold text-white">${calculation.nonLaborVehicleAllowance.toFixed(2)}</span>
          <span className="text-[11px] text-slate-500 block mt-1">{calculation.travelDistanceKm} km driven</span>
        </div>

        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">Total Travel Claim</span>
          <span className="text-xl font-extrabold text-emerald-400">${calculation.totalTravelClaimAmount.toFixed(2)}</span>
          <span className="text-[11px] text-slate-500 block font-mono mt-1">{calculation.travelSupportItemCode}</span>
        </div>
      </div>
    </div>
  );
};
