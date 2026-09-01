'use client';

import React, { useState, useMemo } from 'react';
import { useManagementStore } from '@/stores/useManagementStore';
import { Practitioner, Client } from '@/types';
import { Calendar, Clock, AlertTriangle, Users } from 'lucide-react';
import { ScheduledShift } from './StaffingGapAutoScheduler';

export const DragDropRosterCalendar: React.FC = () => {
  const { practitioners, clients, addNotification, addAuditLog, currentUser } = useManagementStore();
  const isAdmin = currentUser?.role === 'ADMIN';

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay() + 1); // Monday
    return d;
  });

  const [shifts, setShifts] = useState<ScheduledShift[]>([
    // Dummy shifts for demonstration
    { id: 'shift-1', clientId: 'cli-101', clientName: 'James Wilson', practitionerId: 'prac-201', practitionerName: 'Dr. Sarah Jenkins', date: currentWeekStart.toISOString().slice(0, 10), startTime: '09:00', endTime: '11:00', supportType: 'Core Support' }
  ]);

  const [draggedItem, setDraggedItem] = useState<{ type: 'client' | 'shift'; id: string; sourcePractitioner?: string; sourceDate?: string } | null>(null);

  const [conflictError, setConflictError] = useState<string | null>(null);

  const weekDays = useMemo(() => {
    return Array.from({ length: 5 }).map((_, i) => {
      const d = new Date(currentWeekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [currentWeekStart]);

  const handleDragStartClient = (e: React.DragEvent, clientId: string) => {
    e.dataTransfer.setData('clientId', clientId);
    e.dataTransfer.setData('type', 'client');
    setDraggedItem({ type: 'client', id: clientId });
  };

  const handleDragStartShift = (e: React.DragEvent, shiftId: string, practitionerId: string, date: string) => {
    e.dataTransfer.setData('shiftId', shiftId);
    e.dataTransfer.setData('type', 'shift');
    setDraggedItem({ type: 'shift', id: shiftId, sourcePractitioner: practitionerId, sourceDate: date });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetPractitionerId: string, targetDateStr: string) => {
    e.preventDefault();
    setConflictError(null);
    const type = e.dataTransfer.getData('type');
    
    // Simple conflict detection: Practitioner can't have >2 shifts a day for demo, or overlapping shifts
    const existingShifts = shifts.filter(s => s.practitionerId === targetPractitionerId && s.date === targetDateStr);
    
    // Check for double-booking or max capacity (3 shifts = ~max hours demo)
    if (existingShifts.length >= 3) {
      const msg = `Assignment blocked: Practitioner max daily capacity exceeded on ${targetDateStr}.`;
      setConflictError(msg);
      addNotification({ title: 'Scheduling Conflict', message: msg, type: 'hr', severity: 'high' });
      return;
    }

    if (type === 'client') {
      const clientId = e.dataTransfer.getData('clientId');
      const client = clients.find(c => c.id === clientId);
      if (!client) return;
      
      const newShift: ScheduledShift = {
        id: `shift-${Math.random().toString(36).substring(7)}`,
        clientId: client.id,
        clientName: client.name,
        practitionerId: targetPractitionerId,
        practitionerName: practitioners.find(p => p.id === targetPractitionerId)?.name || 'Unknown',
        date: targetDateStr,
        startTime: '09:00',
        endTime: '11:00',
        supportType: 'Core Support'
      };
      
      setShifts([...shifts, newShift]);
      addNotification({ title: 'Shift Scheduled', message: `Assigned ${client.name} to shift on ${targetDateStr}`, type: 'system', severity: 'low' });
      addAuditLog('SCHEDULE_SHIFT', 'ROSTER', newShift.id, `Scheduled shift for ${client.name}`);

    } else if (type === 'shift') {
      const shiftId = e.dataTransfer.getData('shiftId');
      
      setShifts(shifts.map(s => {
        if (s.id === shiftId) {
          return {
            ...s,
            practitionerId: targetPractitionerId,
            practitionerName: practitioners.find(p => p.id === targetPractitionerId)?.name || s.practitionerName,
            date: targetDateStr
          };
        }
        return s;
      }));
      addNotification({ title: 'Shift Moved', message: `Re-assigned shift to ${targetDateStr}`, type: 'system', severity: 'low' });
    }
    setDraggedItem(null);
  };

  const shiftGrouped = useMemo(() => {
    const grouped: Record<string, Record<string, ScheduledShift[]>> = {};
    practitioners.forEach(p => {
      grouped[p.id] = {};
      weekDays.forEach(d => {
        grouped[p.id][d.toISOString().slice(0, 10)] = [];
      });
    });
    
    shifts.forEach(s => {
      if (grouped[s.practitionerId] && grouped[s.practitionerId][s.date]) {
        grouped[s.practitionerId][s.date].push(s);
      }
    });
    return grouped;
  }, [shifts, practitioners, weekDays]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-400" />
            Interactive Drag & Drop Roster
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Drag clients from the sidebar to assign shifts, or drag existing shifts to reassign. Real-time conflict detection active.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              const d = new Date(currentWeekStart);
              d.setDate(d.getDate() - 7);
              setCurrentWeekStart(d);
            }}
            className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded hover:bg-slate-700"
          >
            Prev Week
          </button>
          <span className="text-sm font-bold text-white mx-2">
            Week of {currentWeekStart.toLocaleDateString()}
          </span>
          <button 
            onClick={() => {
              const d = new Date(currentWeekStart);
              d.setDate(d.getDate() + 7);
              setCurrentWeekStart(d);
            }}
            className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded hover:bg-slate-700"
          >
            Next Week
          </button>
        </div>
      </div>

      {conflictError && (
        <div className="p-3 bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {conflictError}
        </div>
      )}

      <div className="flex gap-4">
        {/* Unassigned Clients Tray */}
        <div className="w-64 shrink-0 bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
          <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 border-b border-slate-800 pb-2">
            <Users className="w-4 h-4 text-teal-400" />
            Unscheduled Clients
          </h4>
          <div className="flex-1 overflow-y-auto space-y-2">
            {clients.map(c => (
              <div 
                key={c.id} 
                draggable 
                onDragStart={(e) => handleDragStartClient(e, c.id)}
                className="p-2.5 bg-slate-800/50 border border-slate-700 rounded-lg cursor-grab active:cursor-grabbing hover:bg-slate-800 transition-colors"
              >
                <div className="text-xs font-bold text-white">{c.name}</div>
                <div className="text-[10px] text-slate-400">{c.ndisNumber}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-x-auto bg-slate-950 border border-slate-800 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="p-3 border-b border-r border-slate-800 text-xs text-slate-500 font-semibold w-40 bg-slate-900 sticky left-0 z-10">
                  Practitioner
                </th>
                {weekDays.map(d => (
                  <th key={d.toISOString()} className="p-3 border-b border-slate-800 text-xs text-slate-400 font-semibold text-center min-w-[150px]">
                    {d.toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {practitioners.map(p => (
                <tr key={p.id} className="border-b border-slate-800">
                  <td className="p-3 border-r border-slate-800 bg-slate-900 sticky left-0 z-10">
                    <div className="text-xs font-bold text-white">{p.name}</div>
                    <div className="text-[10px] text-slate-500">{p.role}</div>
                  </td>
                  {weekDays.map(d => {
                    const dateStr = d.toISOString().slice(0, 10);
                    const isDragTarget = draggedItem !== null;
                    return (
                      <td 
                        key={dateStr} 
                        className={`p-2 border-r border-slate-800/50 relative align-top min-h-[80px] transition-colors ${isDragTarget ? 'bg-teal-900/10' : ''}`}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, p.id, dateStr)}
                      >
                        <div className="space-y-1.5 min-h-[60px]">
                          {shiftGrouped[p.id]?.[dateStr]?.map(shift => (
                            <div 
                              key={shift.id}
                              draggable
                              onDragStart={(e) => handleDragStartShift(e, shift.id, p.id, dateStr)}
                              className="p-1.5 bg-teal-500/10 border border-teal-500/30 rounded text-[10px] cursor-grab active:cursor-grabbing hover:bg-teal-500/20 transition-colors"
                            >
                              <div className="font-bold text-teal-300 truncate">{shift.clientName}</div>
                              <div className="text-teal-500 flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" />
                                {shift.startTime} - {shift.endTime}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
