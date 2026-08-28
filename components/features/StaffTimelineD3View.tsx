'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Practitioner, Client } from '@/types';
import { useManagementStore } from '@/stores/useManagementStore';
import {
  evaluateSCHADSShiftCompliance,
  validateRosterBatchBeforePublish,
  evaluatePractitionerCredentialGating,
  SCHADSRosterValidationResult,
  SCHADSValidationBreach,
  SCHADSShiftInput
} from '@/lib/schadsAwardService';
import { calculateMultiDropTravelClaims } from '@/lib/travelMatrixService';
import {
  Calendar,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Info,
  Filter,
  Eye,
  Briefcase,
  MapPin,
  FileText,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  CalendarCheck,
  ShieldCheck,
  DollarSign,
  Car,
  Lock,
  Unlock,
  Download,
  Check
} from 'lucide-react';

export interface ShiftAppointment {
  id: string;
  practitionerId: string;
  clientId: string;
  clientName: string;
  clientNdisNumber: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  supportType: string;
  supportCode: string;
  location: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CONFLICT';
  hasConflict?: boolean;
  conflictReason?: string;
}

export interface StaffShiftBlock {
  id: string;
  practitionerId: string;
  date: string;
  shiftStart: string; // HH:mm e.g. "08:30"
  shiftEnd: string; // HH:mm e.g. "17:00"
  breakStart?: string;
  breakEnd?: string;
  status: 'ROSTERED' | 'ON_CALL' | 'LEAVE';
}

interface StaffTimelineD3ViewProps {
  onSelectShift?: (shift: ShiftAppointment) => void;
  onOpenScheduler?: () => void;
}

export const StaffTimelineD3View: React.FC<StaffTimelineD3ViewProps> = ({
  onSelectShift,
  onOpenScheduler
}) => {
  const { practitioners, clients, currentUser, addNotification, addAuditLog } = useManagementStore();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Active Date Selection
  const [selectedDate, setSelectedDate] = useState('2026-08-11');
  const [filterDepartment, setFilterDepartment] = useState<'ALL' | 'PBS' | 'OT' | 'PSYCH' | 'SPEECH'>('ALL');
  const [filterPbsLevel, setFilterPbsLevel] = useState<'ALL' | 'Core' | 'Proficient' | 'Advanced'>('ALL');
  const [showShiftBackdrops, setShowShiftBackdrops] = useState(true);
  const [showTravelBuffers, setShowTravelBuffers] = useState(true);
  const [highlightConflictsOnly, setHighlightConflictsOnly] = useState(false);
  const [selectedItemDetail, setSelectedItemDetail] = useState<ShiftAppointment | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showSchadsModal, setShowSchadsModal] = useState(false);
  const [isPublishingRoster, setIsPublishingRoster] = useState(false);
  const [rosterPublishedSuccess, setRosterPublishedSuccess] = useState(false);

  // Generate realistic Shift Roster and Client Appointments for the timeline
  const [appointments, setAppointments] = useState<ShiftAppointment[]>([
    {
      id: 'apt-101',
      practitionerId: 'prac-201',
      clientId: 'cli-101',
      clientName: 'Jordan Miller',
      clientNdisNumber: '430988123',
      date: '2026-08-11',
      startTime: '09:00',
      endTime: '11:00',
      supportType: 'Specialist Behaviour Intervention',
      supportCode: '07_002_0115_8_3',
      location: 'Participant Residence (Preston)',
      status: 'CONFIRMED'
    },
    {
      id: 'apt-102',
      practitionerId: 'prac-201',
      clientId: 'cli-103',
      clientName: 'Liam Patterson',
      clientNdisNumber: '430876543',
      date: '2026-08-11',
      startTime: '13:00',
      endTime: '15:30',
      supportType: 'Functional Behaviour Assessment',
      supportCode: '07_004_0115_8_3',
      location: 'Breakthrough Clinic (Carlton)',
      status: 'SCHEDULED'
    },
    {
      id: 'apt-103',
      practitionerId: 'prac-202',
      clientId: 'cli-102',
      clientName: 'Samantha Reed',
      clientNdisNumber: '430765432',
      date: '2026-08-11',
      startTime: '09:30',
      endTime: '11:30',
      supportType: 'Sensory Profile Assessment',
      supportCode: '15_056_0128_1_3',
      location: 'SIL Facility (Richmond)',
      status: 'CONFIRMED'
    },
    {
      id: 'apt-104',
      practitionerId: 'prac-202',
      clientId: 'cli-105',
      clientName: 'Lucas Campbell',
      clientNdisNumber: '430456789',
      date: '2026-08-11',
      startTime: '13:30',
      endTime: '15:30',
      supportType: 'Home Environment Risk Review',
      supportCode: '15_056_0128_1_3',
      location: 'Participant Residence (Brunswick)',
      status: 'SCHEDULED'
    },
    {
      id: 'apt-105',
      practitionerId: 'prac-203',
      clientId: 'cli-104',
      clientName: 'Emma Watson',
      clientNdisNumber: '430654321',
      date: '2026-08-11',
      startTime: '10:00',
      endTime: '12:00',
      supportType: 'Trauma-Informed Behaviour Plan',
      supportCode: '07_002_0115_8_3',
      location: 'Participant Home (Footscray)',
      status: 'CONFIRMED'
    },
    {
      id: 'apt-106',
      practitionerId: 'prac-203',
      clientId: 'cli-106',
      clientName: 'Chloe Bennett',
      clientNdisNumber: '430345678',
      date: '2026-08-11',
      startTime: '14:00',
      endTime: '16:00',
      supportType: 'PBS Implementation Coaching',
      supportCode: '07_002_0115_8_3',
      location: 'Breakthrough HQ (Carlton)',
      status: 'CONFIRMED'
    },
    {
      id: 'apt-107',
      practitionerId: 'prac-204',
      clientId: 'cli-107',
      clientName: 'Oliver Taylor',
      clientNdisNumber: '430234567',
      date: '2026-08-11',
      startTime: '08:30',
      endTime: '10:30',
      supportType: 'Communication Matrix Review',
      supportCode: '15_043_0128_1_3',
      location: 'Day Program (Northcote)',
      status: 'CONFIRMED'
    },
    {
      id: 'apt-108',
      practitionerId: 'prac-204',
      clientId: 'cli-108',
      clientName: 'Zoe Jenkins',
      clientNdisNumber: '430123456',
      date: '2026-08-11',
      startTime: '11:00',
      endTime: '12:30',
      supportType: 'AAC Assistive Tech Training',
      supportCode: '15_043_0128_1_3',
      location: 'SIL Home (Coburg)',
      status: 'SCHEDULED'
    },
    // Intentional Schedule Overlap to test D3 Conflict Visualizer
    {
      id: 'apt-109-conflict',
      practitionerId: 'prac-204',
      clientId: 'cli-101',
      clientName: 'Jordan Miller (Duplicate Booking)',
      clientNdisNumber: '430988123',
      date: '2026-08-11',
      startTime: '11:30',
      endTime: '13:00',
      supportType: 'Emergency Support Coordination',
      supportCode: '07_002_0115_8_3',
      location: 'Preston',
      status: 'CONFLICT',
      hasConflict: true,
      conflictReason: 'Double booking overlap with Zoe Jenkins AAC session (11:00 - 12:30)'
    }
  ]);

  // Base Practitioner Working Shifts for the day
  const staffShifts: StaffShiftBlock[] = useMemo(() => {
    return practitioners.map((p, idx) => ({
      id: `shift-base-${p.id}`,
      practitionerId: p.id,
      date: selectedDate,
      shiftStart: idx === 1 ? '09:00' : '08:30',
      shiftEnd: idx === 3 ? '16:30' : '17:00',
      breakStart: '12:30',
      breakEnd: '13:00',
      status: 'ROSTERED'
    }));
  }, [practitioners, selectedDate]);

  // Filter Practitioners based on controls
  const filteredPractitioners = useMemo(() => {
    return practitioners.filter((p) => {
      if (filterDepartment !== 'ALL') {
        if (filterDepartment === 'PBS' && !p.position.toLowerCase().includes('behaviour')) return false;
        if (filterDepartment === 'OT' && !p.position.toLowerCase().includes('occupational')) return false;
        if (filterDepartment === 'PSYCH' && !p.position.toLowerCase().includes('psych')) return false;
        if (filterDepartment === 'SPEECH' && !p.position.toLowerCase().includes('speech')) return false;
      }
      if (filterPbsLevel !== 'ALL') {
        if (p.pbsRegistrationLevel && !p.pbsRegistrationLevel.includes(filterPbsLevel)) return false;
      }
      return true;
    });
  }, [practitioners, filterDepartment, filterPbsLevel]);

  // Filtered Appointments for the selected date
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      if (apt.date !== selectedDate) return false;
      if (highlightConflictsOnly && !apt.hasConflict) return false;
      const isPracIncluded = filteredPractitioners.some((p) => p.id === apt.practitionerId);
      return isPracIncluded;
    });
  }, [appointments, selectedDate, highlightConflictsOnly, filteredPractitioners]);

  // SCHADS Shift Inputs Conversion & Batch Evaluation
  const schadsShiftInputs: SCHADSShiftInput[] = useMemo(() => {
    return appointments.map((apt) => ({
      id: apt.id,
      practitionerId: apt.practitionerId,
      clientId: apt.clientId,
      date: apt.date,
      startTime: apt.startTime,
      endTime: apt.endTime,
      supportTypeCode: apt.supportCode,
      travelDistanceKm: 12.5,
      breakDurationMinutes: 0
    }));
  }, [appointments]);

  const schadsBatchValidation = useMemo(() => {
    return validateRosterBatchBeforePublish(schadsShiftInputs, practitioners, clients);
  }, [schadsShiftInputs, practitioners, clients]);

  const handlePublishRoster = () => {
    if (!schadsBatchValidation.canPublish) {
      addNotification({
        title: 'Roster Publication Blocked',
        message: `Publication blocked due to ${schadsBatchValidation.blockedShiftsCount} statutory SCHADS Award or Credential Gating breaches.`,
        type: 'ERROR'
      });
      return;
    }

    setIsPublishingRoster(true);
    setTimeout(() => {
      setIsPublishingRoster(false);
      setRosterPublishedSuccess(true);
      addAuditLog({
        userId: currentUser?.uid || 'user-admin',
        userName: currentUser?.name || 'Practice Director',
        action: 'SCHADS_ROSTER_PUBLISH',
        resourceType: 'StaffRoster',
        resourceId: `ROSTER-${selectedDate}`,
        details: `Published roster for ${selectedDate} (${schadsShiftInputs.length} shifts, Estimated Payroll: $${schadsBatchValidation.totalEstimatedPayrollGross}) with 100% SCHADS and Screening verification.`
      });
      addNotification({
        title: 'Roster Published Successfully',
        message: `Roster for ${selectedDate} published with verified SCHADS Award compliance and credential gating.`,
        type: 'SUCCESS'
      });
    }, 900);
  };

  // D3 Rendering Hook
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth || 980;
    const margin = { top: 40, right: 30, bottom: 40, left: 220 };
    const rowHeight = 76;
    const height = margin.top + margin.bottom + Math.max(1, filteredPractitioners.length) * rowHeight;
    const width = Math.max(800, containerWidth * zoomLevel);

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('width', width).attr('height', height);

    // Main Chart Canvas Group
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Time Domain: 07:00 to 19:00 for standard NDIS practice day
    const baseDateStr = `${selectedDate}T`;
    const timeStart = new Date(`${baseDateStr}07:00:00`);
    const timeEnd = new Date(`${baseDateStr}19:00:00`);

    // X Scale: Time
    const xScale = d3.scaleTime().domain([timeStart, timeEnd]).range([0, chartWidth]);

    // Y Scale: Practitioners
    const pracIds = filteredPractitioners.map((p) => p.id);
    const yScale = d3.scaleBand().domain(pracIds).range([0, chartHeight]).padding(0.24);

    // 1. Grid Lines & Hourly Ticks
    const timeTicks = xScale.ticks(d3.timeHour.every(1));

    // Vertical Background Grid Lines
    g.append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data(timeTicks)
      .enter()
      .append('line')
      .attr('x1', (d) => xScale(d))
      .attr('x2', (d) => xScale(d))
      .attr('y1', 0)
      .attr('y2', chartHeight)
      .attr('stroke', '#1e293b')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', (d) => (d.getHours() % 2 === 0 ? 'none' : '2,2'));

    // Top & Bottom Time Axis
    const timeFormat = d3.timeFormat('%I:%M %p');
    const xAxisTop = d3.axisTop(xScale).ticks(d3.timeHour.every(1)).tickFormat((d: any) => timeFormat(d));
    const xAxisBottom = d3.axisBottom(xScale).ticks(d3.timeHour.every(1)).tickFormat((d: any) => timeFormat(d));

    g.append('g')
      .attr('class', 'x-axis-top')
      .call(xAxisTop)
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace');

    g.append('g')
      .attr('class', 'x-axis-bottom')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(xAxisBottom)
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace');

    // 2. Practitioner Row Background Tracks
    filteredPractitioners.forEach((prac) => {
      const y = yScale(prac.id);
      if (y === undefined) return;
      const bandHeight = yScale.bandwidth();

      // Row background track
      g.append('rect')
        .attr('x', 0)
        .attr('y', y)
        .attr('width', chartWidth)
        .attr('height', bandHeight)
        .attr('fill', '#090d16')
        .attr('rx', 6)
        .attr('stroke', '#1e293b')
        .attr('stroke-width', 1)
        .attr('opacity', 0.8);

      // Staff Shift Base Hours Shading
      if (showShiftBackdrops) {
        const staffShift = staffShifts.find((s) => s.practitionerId === prac.id);
        if (staffShift) {
          const shiftStartD = new Date(`${baseDateStr}${staffShift.shiftStart}:00`);
          const shiftEndD = new Date(`${baseDateStr}${staffShift.shiftEnd}:00`);
          const xStart = Math.max(0, xScale(shiftStartD));
          const xEnd = Math.min(chartWidth, xScale(shiftEndD));

          g.append('rect')
            .attr('x', xStart)
            .attr('y', y + 2)
            .attr('width', Math.max(4, xEnd - xStart))
            .attr('height', bandHeight - 4)
            .attr('fill', '#042f2e')
            .attr('fill-opacity', 0.25)
            .attr('stroke', '#0d9488')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '3,3')
            .attr('rx', 4);

          // Break period marker
          if (staffShift.breakStart && staffShift.breakEnd) {
            const bStartD = new Date(`${baseDateStr}${staffShift.breakStart}:00`);
            const bEndD = new Date(`${baseDateStr}${staffShift.breakEnd}:00`);
            const bxStart = xScale(bStartD);
            const bxEnd = xScale(bEndD);

            g.append('rect')
              .attr('x', bxStart)
              .attr('y', y + 4)
              .attr('width', Math.max(2, bxEnd - bxStart))
              .attr('height', bandHeight - 8)
              .attr('fill', '#334155')
              .attr('fill-opacity', 0.35)
              .attr('rx', 2);
          }
        }
      }
    });

    // 3. Y-Axis Practitioner Badges & Labels (Left Column)
    const labelGroup = svg.append('g').attr('transform', `translate(12,${margin.top})`);

    filteredPractitioners.forEach((prac) => {
      const y = yScale(prac.id);
      if (y === undefined) return;
      const bandHeight = yScale.bandwidth();

      const card = labelGroup.append('g').attr('transform', `translate(0,${y})`);

      // Left practitioner card background
      card
        .append('rect')
        .attr('width', margin.left - 24)
        .attr('height', bandHeight)
        .attr('fill', '#0f172a')
        .attr('rx', 8)
        .attr('stroke', '#334155')
        .attr('stroke-width', 1);

      // Name
      card
        .append('text')
        .attr('x', 12)
        .attr('y', 20)
        .attr('fill', '#ffffff')
        .attr('font-size', '12px')
        .attr('font-weight', '700')
        .text(prac.name);

      // Position / Role
      card
        .append('text')
        .attr('x', 12)
        .attr('y', 35)
        .attr('fill', '#94a3b8')
        .attr('font-size', '10px')
        .text(prac.position.length > 24 ? prac.position.slice(0, 22) + '...' : prac.position);

      // Level / Screening pill
      const pbsLevel = prac.pbsRegistrationLevel?.split(' ')[0] || 'Proficient';
      card
        .append('rect')
        .attr('x', 12)
        .attr('y', 42)
        .attr('width', 75)
        .attr('height', 14)
        .attr('fill', '#134e4a')
        .attr('rx', 3);

      card
        .append('text')
        .attr('x', 16)
        .attr('y', 52)
        .attr('fill', '#2dd4bf')
        .attr('font-size', '8px')
        .attr('font-weight', '700')
        .text(`PBS ${pbsLevel}`);

      // Active caseload counter
      card
        .append('text')
        .attr('x', 95)
        .attr('y', 52)
        .attr('fill', '#64748b')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .text(`Load: ${prac.activeCaseloadCount}/${prac.caseloadLimit}`);
    });

    // 4. Render Client Appointments as High-Density Interactive Cards
    filteredAppointments.forEach((apt) => {
      const y = yScale(apt.practitionerId);
      if (y === undefined) return;
      const bandHeight = yScale.bandwidth();

      const startD = new Date(`${baseDateStr}${apt.startTime}:00`);
      const endD = new Date(`${baseDateStr}${apt.endTime}:00`);
      const xStart = xScale(startD);
      const xEnd = xScale(endD);
      const cardWidth = Math.max(20, xEnd - xStart);

      // Travel buffer visual (30 mins before if enabled)
      if (showTravelBuffers && !apt.location.includes('HQ') && !apt.location.includes('Clinic')) {
        const bufferStartD = new Date(startD.getTime() - 20 * 60 * 1000);
        const bxStart = xScale(bufferStartD);
        if (bxStart < xStart) {
          g.append('rect')
            .attr('x', bxStart)
            .attr('y', y + 8)
            .attr('width', xStart - bxStart)
            .attr('height', bandHeight - 16)
            .attr('fill', '#f59e0b')
            .attr('fill-opacity', 0.15)
            .attr('stroke', '#d97706')
            .attr('stroke-width', 0.8)
            .attr('stroke-dasharray', '2,2')
            .attr('rx', 3);

          g.append('text')
            .attr('x', bxStart + 2)
            .attr('y', y + bandHeight / 2 + 3)
            .attr('fill', '#f59e0b')
            .attr('font-size', '8px')
            .attr('font-family', 'monospace')
            .text('🚗 20m');
        }
      }

      // Appointment Node Group
      const aptGroup = g
        .append('g')
        .attr('class', 'appointment-node')
        .attr('cursor', 'pointer')
        .on('click', () => {
          setSelectedItemDetail(apt);
          if (onSelectShift) onSelectShift(apt);
        });

      // Color scheme based on status
      let fillColor = '#0f766e'; // teal-700
      let strokeColor = '#2dd4bf'; // teal-400
      let textColor = '#ffffff';

      if (apt.hasConflict || apt.status === 'CONFLICT') {
        fillColor = '#881337'; // rose-900
        strokeColor = '#f43f5e'; // rose-500
      } else if (apt.supportCode.startsWith('07_')) {
        fillColor = '#1e1b4b'; // indigo-950
        strokeColor = '#818cf8'; // indigo-400
      } else if (apt.supportCode.startsWith('15_')) {
        fillColor = '#064e3b'; // emerald-900
        strokeColor = '#34d399'; // emerald-400
      }

      // Card Body
      const rect = aptGroup
        .append('rect')
        .attr('x', xStart)
        .attr('y', y + 6)
        .attr('width', cardWidth)
        .attr('height', bandHeight - 12)
        .attr('fill', fillColor)
        .attr('stroke', strokeColor)
        .attr('stroke-width', apt.hasConflict ? 2 : 1.5)
        .attr('rx', 6)
        .attr('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))');

      // Animated Conflict Pulse
      if (apt.hasConflict) {
        rect.attr('stroke-dasharray', '4,2');
      }

      // Hover Effect
      aptGroup
        .on('mouseenter', function () {
          d3.select(this)
            .select('rect')
            .attr('stroke-width', 2.5)
            .attr('filter', 'drop-shadow(0 4px 8px rgba(45,212,191,0.5))');
        })
        .on('mouseleave', function () {
          d3.select(this)
            .select('rect')
            .attr('stroke-width', apt.hasConflict ? 2 : 1.5)
            .attr('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))');
        });

      // Left Accent Color Bar
      aptGroup
        .append('rect')
        .attr('x', xStart)
        .attr('y', y + 6)
        .attr('width', 4)
        .attr('height', bandHeight - 12)
        .attr('fill', strokeColor)
        .attr('rx', 2);

      // Title (Client Name)
      if (cardWidth > 45) {
        aptGroup
          .append('text')
          .attr('x', xStart + 8)
          .attr('y', y + 22)
          .attr('fill', textColor)
          .attr('font-size', '11px')
          .attr('font-weight', '700')
          .text(
            cardWidth > 120
              ? `${apt.clientName}`
              : apt.clientName.split(' ')[0]
          );
      }

      // Time Range & Support Code Subtitle
      if (cardWidth > 85) {
        aptGroup
          .append('text')
          .attr('x', xStart + 8)
          .attr('y', y + 36)
          .attr('fill', '#cbd5e1')
          .attr('font-size', '9px')
          .attr('font-family', 'monospace')
          .text(`${apt.startTime}-${apt.endTime} • ${apt.supportCode.slice(0, 6)}`);
      }

      // Location / Conflict Flag
      if (cardWidth > 110) {
        aptGroup
          .append('text')
          .attr('x', xStart + 8)
          .attr('y', y + 48)
          .attr('fill', apt.hasConflict ? '#fda4af' : '#94a3b8')
          .attr('font-size', '8px')
          .text(apt.hasConflict ? '⚠️ OVERLAP CONFLICT' : apt.location.split('(')[0]);
      }
    });

    // 5. Current Time Vertical Line Indicator (e.g. if viewing today)
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeD = new Date(`${baseDateStr}${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}:00`);

    if (currentTimeD >= timeStart && currentTimeD <= timeEnd) {
      const nowX = xScale(currentTimeD);

      const nowG = g.append('g').attr('class', 'now-indicator');

      nowG
        .append('line')
        .attr('x1', nowX)
        .attr('x2', nowX)
        .attr('y1', 0)
        .attr('y2', chartHeight)
        .attr('stroke', '#f43f5e')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4,2');

      nowG
        .append('polygon')
        .attr(
          'points',
          `${nowX - 5},-6 ${nowX + 5},-6 ${nowX},0`
        )
        .attr('fill', '#f43f5e');

      nowG
        .append('text')
        .attr('x', nowX + 6)
        .attr('y', 12)
        .attr('fill', '#f43f5e')
        .attr('font-size', '9px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'monospace')
        .text('NOW');
    }
  }, [
    filteredPractitioners,
    filteredAppointments,
    staffShifts,
    selectedDate,
    showShiftBackdrops,
    showTravelBuffers,
    zoomLevel,
    onSelectShift
  ]);

  const handleNextDay = () => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + 1);
    setSelectedDate(current.toISOString().slice(0, 10));
  };

  const handlePrevDay = () => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() - 1);
    setSelectedDate(current.toISOString().slice(0, 10));
  };

  const conflictCount = appointments.filter((a) => a.hasConflict).length;

  return (
    <div className="space-y-4">
      {/* Header & Controls Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl text-white shadow-md shadow-teal-950/40">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">D3.js High-Density Staff Roster & Shift View</h3>
                <span className="text-[10px] bg-teal-500/10 text-teal-300 font-mono px-2 py-0.5 rounded border border-teal-500/30 font-bold">
                  D3 Vector Canvas
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Continuous timeline synchronization across practitioner rosters, client appointments, travel buffers, and conflict detection.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Date Navigator */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
              <button
                type="button"
                onClick={handlePrevDay}
                className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-all"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-3 py-1 text-xs font-mono font-bold text-teal-300 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-teal-400" />
                <span>{selectedDate}</span>
              </div>
              <button
                type="button"
                onClick={handleNextDay}
                className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-all"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 gap-1">
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.max(0.8, prev - 0.2))}
                className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-all"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono text-slate-400 px-1.5">{Math.round(zoomLevel * 100)}%</span>
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.min(2.0, prev + 0.2))}
                className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-all"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-all"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* SCHADS & Credential Gating Audit Button */}
            <button
              type="button"
              onClick={() => setShowSchadsModal(true)}
              className={`px-3.5 py-2 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md border transition-all ${
                schadsBatchValidation.blockedShiftsCount > 0
                  ? 'bg-amber-950/60 text-amber-300 border-amber-500/50 hover:bg-amber-900/60'
                  : 'bg-slate-950 text-teal-300 border-teal-500/40 hover:bg-slate-900'
              }`}
            >
              {schadsBatchValidation.blockedShiftsCount > 0 ? (
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              )}
              <span>SCHADS Award &amp; Gating</span>
              {schadsBatchValidation.blockedShiftsCount > 0 && (
                <span className="bg-amber-500 text-slate-950 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {schadsBatchValidation.blockedShiftsCount}
                </span>
              )}
            </button>

            {/* Programmatic Roster Publication Button */}
            <button
              type="button"
              onClick={handlePublishRoster}
              disabled={!schadsBatchValidation.canPublish || isPublishingRoster}
              className={`px-3.5 py-2 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-all ${
                !schadsBatchValidation.canPublish
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : rosterPublishedSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-950/40'
              }`}
              title={
                !schadsBatchValidation.canPublish
                  ? 'Roster locked: resolve SCHADS Award or Credential breaches before publishing'
                  : 'Publish verified roster'
              }
            >
              {!schadsBatchValidation.canPublish ? (
                <Lock className="w-3.5 h-3.5 text-rose-400" />
              ) : rosterPublishedSuccess ? (
                <Check className="w-3.5 h-3.5 text-white" />
              ) : (
                <Unlock className="w-3.5 h-3.5 text-white" />
              )}
              <span>
                {isPublishingRoster
                  ? 'Verifying & Publishing...'
                  : rosterPublishedSuccess
                  ? 'Roster Published'
                  : 'Publish Roster'}
              </span>
            </button>

            {onOpenScheduler && (
              <button
                type="button"
                onClick={onOpenScheduler}
                className="px-3.5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-Scheduler</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Strip */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800 flex-wrap text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold">Specialty:</span>
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-teal-500"
              >
                <option value="ALL">All Specialties</option>
                <option value="PBS">PBS / Behaviour</option>
                <option value="OT">Occupational Therapy</option>
                <option value="PSYCH">Psychology</option>
                <option value="SPEECH">Speech Pathology</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold">PBS Level:</span>
              <select
                value={filterPbsLevel}
                onChange={(e) => setFilterPbsLevel(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-teal-500"
              >
                <option value="ALL">All Levels</option>
                <option value="Core">Core Practitioner</option>
                <option value="Proficient">Proficient</option>
                <option value="Advanced">Advanced / Specialist</option>
              </select>
            </div>

            {/* Toggle Layers */}
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={showShiftBackdrops}
                onChange={(e) => setShowShiftBackdrops(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-teal-600 focus:ring-teal-500"
              />
              <span>Shift Roster Windows</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={showTravelBuffers}
                onChange={(e) => setShowTravelBuffers(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-teal-600 focus:ring-teal-500"
              />
              <span>Travel Buffers (20m)</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            {conflictCount > 0 && (
              <button
                type="button"
                onClick={() => setHighlightConflictsOnly(!highlightConflictsOnly)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 border transition-all ${
                  highlightConflictsOnly
                    ? 'bg-rose-600 text-white border-rose-400'
                    : 'bg-rose-950/40 text-rose-300 border-rose-500/40 hover:bg-rose-900/40'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>{conflictCount} Conflict Flagged</span>
              </button>
            )}

            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-indigo-500 inline-block" /> Behaviour (07)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" /> Therapy (15)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" /> Conflict
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* D3 Canvas Container */}
      <div
        ref={containerRef}
        className="bg-slate-950 border border-slate-800 rounded-2xl p-2 sm:p-4 overflow-x-auto shadow-inner relative min-h-[400px]"
      >
        <svg ref={svgRef} className="w-full select-none" />
      </div>

      {/* Selected Shift Appointment Detail Drawer / Inspector */}
      {selectedItemDetail && (
        <div className="bg-slate-900 border border-teal-500/30 rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-teal-500/10 text-teal-300 font-mono px-2.5 py-0.5 rounded border border-teal-500/20 font-bold">
                  {selectedItemDetail.supportCode}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                    selectedItemDetail.hasConflict
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {selectedItemDetail.hasConflict ? 'SCHEDULE CONFLICT' : selectedItemDetail.status}
                </span>
              </div>
              <h4 className="text-base font-bold text-white">{selectedItemDetail.supportType}</h4>
              <p className="text-xs text-slate-400">
                Participant: <strong className="text-slate-200">{selectedItemDetail.clientName}</strong> (NDIS #{selectedItemDetail.clientNdisNumber})
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedItemDetail(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              ✕
            </button>
          </div>

          {selectedItemDetail.hasConflict && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{selectedItemDetail.conflictReason}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] block uppercase font-mono">Time Window</span>
              <div className="flex items-center gap-1.5 text-slate-200 font-bold font-mono">
                <Clock className="w-3.5 h-3.5 text-teal-400" />
                <span>
                  {selectedItemDetail.startTime} - {selectedItemDetail.endTime}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] block uppercase font-mono">Assigned Practitioner</span>
              <div className="flex items-center gap-1.5 text-slate-200 font-bold">
                <Users className="w-3.5 h-3.5 text-teal-400" />
                <span>{practitioners.find((p) => p.id === selectedItemDetail.practitionerId)?.name || 'Staff Member'}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] block uppercase font-mono">Service Location</span>
              <div className="flex items-center gap-1.5 text-slate-200 font-bold truncate">
                <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span className="truncate">{selectedItemDetail.location}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCHADS Award & Dynamic Credential Gating Inspection Modal */}
      {showSchadsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-teal-600 rounded-xl text-white shadow-md">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>SCHADS Award &amp; Credential Gating Engine</span>
                    <span className="text-xs bg-indigo-500/20 text-indigo-300 font-mono px-2 py-0.5 rounded border border-indigo-500/30">
                      2026 Audit Ready
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Programmatic enforcement of Award minimum shifts, broken shift allowances, rest breaks, and NDIS worker screening.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSchadsModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5 overflow-y-auto flex-1">
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[10px] block uppercase font-mono">Publication Status</span>
                  <div className="flex items-center gap-1.5 font-bold">
                    {schadsBatchValidation.canPublish ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Unlocked
                      </span>
                    ) : (
                      <span className="text-rose-400 flex items-center gap-1">
                        <Lock className="w-4 h-4" /> Gated / Locked
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[10px] block uppercase font-mono">Blocking Breaches</span>
                  <div className="text-lg font-bold font-mono text-amber-400">
                    {schadsBatchValidation.blockedShiftsCount}
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[10px] block uppercase font-mono">Allowances / Overtime</span>
                  <div className="text-lg font-bold font-mono text-teal-400">
                    {schadsBatchValidation.warningShiftsCount}
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[10px] block uppercase font-mono">Est. Gross Payroll</span>
                  <div className="text-lg font-bold font-mono text-slate-100 flex items-center gap-0.5">
                    <DollarSign className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>{schadsBatchValidation.totalEstimatedPayrollGross.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Statutory Rules Evaluated */}
              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-teal-400" />
                  <span>Programmatic Award Clauses Enforced</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-200 block">SCHADS Clause 25.5 (Minimum Engagements)</strong>
                      <span className="text-slate-400 text-[11px]">2.0 hr minimum for Disability Support, 3.0 hr for Social &amp; Community Services.</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-200 block">SCHADS Clause 25.4 (Broken Shift &amp; 12h Span)</strong>
                      <span className="text-slate-400 text-[11px]">Automatic $20.15 / $39.80 split shift allowance costing + 12h max daily span lock.</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-200 block">SCHADS Clause 27 (10-Hour Rest Break)</strong>
                      <span className="text-slate-400 text-[11px]">Enforces mandatory 10h continuous break between consecutive shifts to prevent fatigue.</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-200 block">NDIS Worker Screening Dynamic Gating</strong>
                      <span className="text-slate-400 text-[11px]">Automatic hard block on unscreened or expired workers from participant rosters.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Shift Audit Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Rostered Shifts Compliance Breakdown ({schadsBatchValidation.shiftResults.length} shifts)
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {schadsBatchValidation.shiftResults.map((res) => {
                    const hasBlocker = !res.validation.canPublish;
                    return (
                      <div
                        key={res.shiftId}
                        className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          hasBlocker
                            ? 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                            : res.validation.warningCount > 0
                            ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                            : 'bg-slate-950 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <strong className="text-white font-bold">{res.practitionerName}</strong>
                            <span className="text-slate-400">→</span>
                            <span className="text-teal-300 font-semibold">{res.clientName}</span>
                            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                              {res.date}
                            </span>
                          </div>
                          {res.validation.breaches.map((b, i) => (
                            <div key={i} className="text-[11px] flex items-center gap-1.5">
                              {b.blocksPublication ? (
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                              ) : (
                                <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              )}
                              <span><strong>{b.title}:</strong> {b.message}</span>
                            </div>
                          ))}
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-slate-400 text-[10px] block font-mono">Estimated Cost</span>
                          <span className="text-sm font-bold font-mono text-white">
                            ${res.validation.costing.totalGrossPayrollCost.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/50 rounded-b-2xl">
              <div className="text-xs text-slate-400">
                {schadsBatchValidation.canPublish ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-4 h-4" /> Ready for statutory payroll and shift dispatch.
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1 font-semibold">
                    <Lock className="w-4 h-4" /> Resolve blocking breaches to enable publication.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSchadsModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handlePublishRoster();
                    setShowSchadsModal(false);
                  }}
                  disabled={!schadsBatchValidation.canPublish || isPublishingRoster}
                  className={`px-4 py-2 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-all ${
                    !schadsBatchValidation.canPublish
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-teal-600 hover:bg-teal-500 text-white'
                  }`}
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Publish Roster Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
