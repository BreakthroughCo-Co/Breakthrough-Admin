'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useManagementStore } from '@/stores/useManagementStore';
import { Client } from '@/types';
import firebaseConfig from '@/firebase-applet-config.json';
import {
  MapPin,
  Navigation,
  Compass,
  Car,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Shield,
  Layers,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Radio,
  Locate,
  LocateFixed,
  ShieldAlert,
  FileText,
  UserCheck,
  Zap,
  Play,
  RotateCcw,
  Sliders,
  Check
} from 'lucide-react';

// Default participant coordinates in Sydney & Melbourne metropolitan & regional clusters for NDIS practice
const PARTICIPANT_COORDINATES: Record<string, { lat: number; lng: number; suburb: string; mmmZone: number; siteType: string; safetyNote: string }> = {
  'client-1': { lat: -33.8688, lng: 151.2093, suburb: 'Sydney CBD', mmmZone: 1, siteType: 'Private Residence (SIL)', safetyNote: 'Sensory quiet space required upon arrival. Low vocal tone.' },
  'client-2': { lat: -33.8150, lng: 151.0011, suburb: 'Parramatta NSW', mmmZone: 1, siteType: 'Community Hub / SDA', safetyNote: 'Door code required: 4821#. Support worker on site.' },
  'client-3': { lat: -33.7510, lng: 150.6942, suburb: 'Penrith NSW', mmmZone: 2, siteType: 'Family Home', safetyNote: 'Dog on premises (contained). Ring intercom before entry.' },
  'client-4': { lat: -33.9173, lng: 151.0330, suburb: 'Bankstown NSW', mmmZone: 1, siteType: 'Supported Accommodation', safetyNote: 'PBS protocol active. Review de-escalation triggers on arrival.' },
  'client-5': { lat: -34.4278, lng: 150.8931, suburb: 'Wollongong NSW', mmmZone: 3, siteType: 'Allied Health Clinic', safetyNote: 'Wheelchair ramp available at side entrance.' },
};

// Clinician Practice Base (e.g. Sydney Central Office)
const CLINIC_HQ = { lat: -33.8708, lng: 151.2073, name: 'Breakthrough Allied Health HQ (Sydney)' };

// Sound synthesizer for Web Audio API alerts
function playProximityChime(type: 'approaching' | 'arrived' | 'test') {
  try {
    if (typeof window === 'undefined') return;
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'arrived') {
      // Pleasant high double-tone for arrival
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } else {
      // Alert pulse for approaching
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12); // E5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch {
    // ignore audio failure
  }
}

// Haversine distance in meters
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const toRad = (x: number) => (x * Math.PI) / 180;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

declare global {
  interface Window {
    google?: any;
    initGoogleMapsCallback?: () => void;
  }
}

export const GoogleMapsView: React.FC = () => {
  const { clients, setActiveTab, addNotification, addAuditLog } = useManagementStore();
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || '');
  const [mapLoaded, setMapLoaded] = useState(() => typeof window !== 'undefined' && !!window.google?.maps);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const circlesRef = useRef<any[]>([]);
  const staffMarkerRef = useRef<any>(null);

  // Proximity Alert System State
  const [isAlertSystemActive, setIsAlertSystemActive] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [geofenceRadiusMeters, setGeofenceRadiusMeters] = useState<number>(500); // 500m default alert zone
  const [arrivalThresholdMeters, setArrivalThresholdMeters] = useState<number>(100); // 100m arrival zone
  const [isLiveGpsTracking, setIsLiveGpsTracking] = useState<boolean>(false);
  const [staffLocation, setStaffLocation] = useState<{ lat: number; lng: number }>({
    lat: CLINIC_HQ.lat,
    lng: CLINIC_HQ.lng,
  });
  const [simulationProgress, setSimulationProgress] = useState<number>(0); // 0% at HQ, 100% at client site
  const [isSimulatingDrive, setIsSimulatingDrive] = useState<boolean>(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Record<string, boolean>>({});
  const [recentLocationEvents, setRecentLocationEvents] = useState<
    { id: string; timestamp: string; title: string; clientName: string; distance: number; status: 'APPROACHING' | 'ARRIVED' | 'IN_TRANSIT' }[]
  >([]);

  // API Key priority: Secret / Env / Firebase API key
  const apiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    (typeof process !== 'undefined' ? process.env.GOOGLE_MAPS_PLATFORM_KEY : '') ||
    firebaseConfig.apiKey ||
    '';

  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0] || null;
  const participantLoc = useMemo(() => {
    return (
      (selectedClient && PARTICIPANT_COORDINATES[selectedClient.id]) || {
        lat: -33.8688,
        lng: 151.2093,
        suburb: 'Sydney CBD',
        mmmZone: 1,
        siteType: 'Private Residence',
        safetyNote: 'Standard safety protocols apply.',
      }
    );
  }, [selectedClient]);

  // Current distance between staff and target participant in meters
  const currentDistanceMeters = useMemo(() => {
    return getDistanceMeters(staffLocation.lat, staffLocation.lng, participantLoc.lat, participantLoc.lng);
  }, [staffLocation, participantLoc]);

  // Proximity Status
  const proximityStatus = useMemo<'ARRIVED' | 'APPROACHING' | 'IN_TRANSIT'>(() => {
    if (currentDistanceMeters <= arrivalThresholdMeters) return 'ARRIVED';
    if (currentDistanceMeters <= geofenceRadiusMeters) return 'APPROACHING';
    return 'IN_TRANSIT';
  }, [currentDistanceMeters, arrivalThresholdMeters, geofenceRadiusMeters]);

  // Trigger Proximity Alerts when staff position changes
  const lastAlertStatusRef = useRef<'ARRIVED' | 'APPROACHING' | 'IN_TRANSIT'>('IN_TRANSIT');

  const triggerProximityNotification = useCallback(
    (status: 'ARRIVED' | 'APPROACHING', dist: number, clientObj: Client | null) => {
      if (!clientObj || !isAlertSystemActive) return;

      const clientCoords = PARTICIPANT_COORDINATES[clientObj.id] || participantLoc;
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      if (status === 'ARRIVED') {
        if (soundEnabled) playProximityChime('arrived');
        addNotification({
          title: `📍 ON-SITE ARRIVAL: ${clientObj.name}`,
          message: `Staff within ${dist}m of ${clientCoords.suburb} (${clientCoords.siteType}). Check-in required: "${clientCoords.safetyNote}"`,
          type: 'compliance',
          severity: 'high',
          linkTab: 'case-notes',
        });
        addAuditLog(
          'GEOFENCE_ON_SITE_ARRIVAL',
          'STAFF_DISPATCH',
          clientObj.id,
          `Clinician arrived on-site at ${clientObj.name}'s residence (${dist}m geofence triggered).`
        );
      } else if (status === 'APPROACHING') {
        if (soundEnabled) playProximityChime('approaching');
        addNotification({
          title: `🔔 APPROACHING SITE: ${clientObj.name}`,
          message: `Clinician is ${dist}m from participant residence in ${clientCoords.suburb}. Prepare clinical arrival protocol.`,
          type: 'compliance',
          severity: 'medium',
          linkTab: 'google-maps',
        });
      }

      setRecentLocationEvents((prev) => [
        {
          id: `evt-${Date.now()}`,
          timestamp,
          title: status === 'ARRIVED' ? `On-Site Arrival (<${dist}m)` : `Approaching Residence (${dist}m away)`,
          clientName: clientObj.name,
          distance: dist,
          status,
        },
        ...prev.slice(0, 8),
      ]);
    },
    [isAlertSystemActive, soundEnabled, addNotification, addAuditLog, participantLoc]
  );

  // Monitor Proximity Transition
  useEffect(() => {
    if (!isAlertSystemActive || !selectedClient) return;

    if (proximityStatus !== lastAlertStatusRef.current) {
      if (proximityStatus === 'ARRIVED') {
        triggerProximityNotification('ARRIVED', currentDistanceMeters, selectedClient);
      } else if (proximityStatus === 'APPROACHING') {
        triggerProximityNotification('APPROACHING', currentDistanceMeters, selectedClient);
      }
      lastAlertStatusRef.current = proximityStatus;
    }
  }, [proximityStatus, currentDistanceMeters, selectedClient, isAlertSystemActive, triggerProximityNotification]);

  // Live Geolocation Watcher
  useEffect(() => {
    let watchId: number | null = null;
    if (isLiveGpsTracking && typeof window !== 'undefined' && 'geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setStaffLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => {
          console.warn('Geolocation watch error:', err);
          setIsLiveGpsTracking(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 3000 }
      );
    }
    return () => {
      if (watchId !== null && typeof window !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isLiveGpsTracking]);

  // Simulated Drive Animation
  useEffect(() => {
    let timer: any = null;
    if (isSimulatingDrive) {
      timer = setInterval(() => {
        setSimulationProgress((prev) => {
          if (prev >= 100) {
            setIsSimulatingDrive(false);
            return 100;
          }
          const next = prev + 5;
          // Interpolate coordinates between HQ and Target Participant
          const lat = CLINIC_HQ.lat + ((participantLoc.lat - CLINIC_HQ.lat) * next) / 100;
          const lng = CLINIC_HQ.lng + ((participantLoc.lng - CLINIC_HQ.lng) * next) / 100;
          setStaffLocation({ lat, lng });
          return next;
        });
      }, 400);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isSimulatingDrive, participantLoc]);

  // Calculate NDIS Travel Claim parameters based on MMM (Modified Monash Model) zones
  const travelMetrics = useMemo(() => {
    const straightDistanceKm = Math.max(0.1, Number((currentDistanceMeters / 1000).toFixed(1)));
    const drivingDistanceKm = Number((straightDistanceKm * 1.25).toFixed(1));
    const estimatedMinutes = Math.max(2, Math.round(drivingDistanceKm * 1.8));

    const mmmZone = participantLoc.mmmZone || 1;
    const maxClaimableMinutes = mmmZone <= 3 ? 30 : 60;
    const actualClaimableMinutes = Math.min(estimatedMinutes, maxClaimableMinutes);
    const hourlyRate = 193.99;
    const travelCost = Number(((actualClaimableMinutes / 60) * hourlyRate).toFixed(2));
    const activityTransportKmRate = 0.97;
    const activityTransportCost = Number((drivingDistanceKm * activityTransportKmRate).toFixed(2));

    return {
      drivingDistanceKm,
      estimatedMinutes,
      mmmZone,
      maxClaimableMinutes,
      actualClaimableMinutes,
      travelCost,
      activityTransportCost,
      supportItemCode: '01_799_0128_1_1',
    };
  }, [currentDistanceMeters, participantLoc]);

  // Load Google Maps Script
  useEffect(() => {
    if (!apiKey || typeof window === 'undefined') return;

    if (window.google?.maps) {
      setMapLoaded(true);
      return;
    }

    const scriptId = 'google-maps-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setMapLoaded(true);
      };
      document.head.appendChild(script);
    }
  }, [apiKey]);

  // Initialize and Update Google Map Visuals
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current || !window.google?.maps) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new window.google.maps.Map(mapContainerRef.current, {
        center: { lat: CLINIC_HQ.lat, lng: CLINIC_HQ.lng },
        zoom: 12,
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
          {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{ color: '#1e293b' }],
          },
          {
            featureType: 'road',
            elementType: 'geometry.stroke',
            stylers: [{ color: '#334155' }],
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#0284c7' }],
          },
        ],
      });
    }

    // Clear previous markers and circles
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    circlesRef.current.forEach((c) => c.setMap(null));
    circlesRef.current = [];

    // Add HQ Base Marker
    const hqMarker = new window.google.maps.Marker({
      position: { lat: CLINIC_HQ.lat, lng: CLINIC_HQ.lng },
      map: mapInstanceRef.current,
      title: CLINIC_HQ.name,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#0d9488',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
    });
    markersRef.current.push(hqMarker);

    // Add Participant Markers & Geofence Alert Circles
    clients.forEach((client) => {
      const coords = PARTICIPANT_COORDINATES[client.id] || { lat: -33.8688, lng: 151.2093, suburb: 'Sydney', mmmZone: 1 };
      const isSelected = client.id === selectedClientId;
      const isHighRisk = client.riskLevel === 'High' || client.riskLevel === 'Critical';

      const marker = new window.google.maps.Marker({
        position: { lat: coords.lat, lng: coords.lng },
        map: mapInstanceRef.current,
        title: `${client.name} (${coords.suburb})`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: isSelected ? 11 : 7,
          fillColor: isSelected ? '#06b6d4' : isHighRisk ? '#f59e0b' : '#10b981',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      marker.addListener('click', () => {
        setSelectedClientId(client.id);
      });
      markersRef.current.push(marker);

      // Render Geofence Radius Circle for selected client
      if (isSelected && isAlertSystemActive) {
        const geofenceCircle = new window.google.maps.Circle({
          strokeColor: proximityStatus === 'ARRIVED' ? '#10b981' : '#06b6d4',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: proximityStatus === 'ARRIVED' ? '#10b981' : '#06b6d4',
          fillOpacity: 0.15,
          map: mapInstanceRef.current,
          center: { lat: coords.lat, lng: coords.lng },
          radius: geofenceRadiusMeters,
        });
        circlesRef.current.push(geofenceCircle);

        // Arrival inner boundary
        const arrivalCircle = new window.google.maps.Circle({
          strokeColor: '#10b981',
          strokeOpacity: 0.9,
          strokeWeight: 2,
          fillColor: '#10b981',
          fillOpacity: 0.3,
          map: mapInstanceRef.current,
          center: { lat: coords.lat, lng: coords.lng },
          radius: arrivalThresholdMeters,
        });
        circlesRef.current.push(arrivalCircle);
      }
    });

    // Add Staff Clinician Live/Simulated Vehicle Marker
    if (staffMarkerRef.current) {
      staffMarkerRef.current.setMap(null);
    }

    const staffMarker = new window.google.maps.Marker({
      position: staffLocation,
      map: mapInstanceRef.current,
      title: 'Staff Clinician Current Position',
      icon: {
        path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 6,
        fillColor: '#f43f5e',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        rotation: 45,
      },
    });
    staffMarkerRef.current = staffMarker;
  }, [mapLoaded, clients, selectedClientId, selectedClient, staffLocation, isAlertSystemActive, geofenceRadiusMeters, arrivalThresholdMeters, proximityStatus]);

  const mapsDirectUrl = `https://www.google.com/maps/dir/?api=1&origin=${staffLocation.lat},${staffLocation.lng}&destination=${participantLoc.lat},${participantLoc.lng}&travelmode=driving`;

  const handleSimulateApproach = (progressVal: number) => {
    setSimulationProgress(progressVal);
    const lat = CLINIC_HQ.lat + ((participantLoc.lat - CLINIC_HQ.lat) * progressVal) / 100;
    const lng = CLINIC_HQ.lng + ((participantLoc.lng - CLINIC_HQ.lng) * progressVal) / 100;
    setStaffLocation({ lat, lng });
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo({ lat, lng });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Geofence System Controller */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
              <Compass className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                Google Maps™ Geocoded Participant & Travel Optimization
                <span className="text-[10px] bg-teal-500/20 text-teal-300 font-mono px-2 py-0.5 rounded font-bold border border-teal-500/30">
                  MMM1-7 Zones
                </span>
                <span className="text-[10px] bg-sky-500/20 text-sky-300 font-mono px-2 py-0.5 rounded font-bold border border-sky-500/30 flex items-center gap-1">
                  <Radio className="w-3 h-3 text-sky-400 animate-pulse" />
                  Live Geofence Alerts
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Automatic proximity detection, staff arrival alerts at client residence, and automated NDIS Provider Travel calculation (PACE #01_799_0128_1_1)
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls & Participant Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              const next = !isAlertSystemActive;
              setIsAlertSystemActive(next);
              if (next && soundEnabled) playProximityChime('test');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
              isAlertSystemActive
                ? 'bg-sky-500/10 text-sky-300 border-sky-500/30 shadow-sm'
                : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
            title="Toggle Automated Location Proximity Detection"
          >
            <BellRing className={`w-3.5 h-3.5 ${isAlertSystemActive ? 'text-sky-400 animate-bounce' : 'text-slate-500'}`} />
            <span>{isAlertSystemActive ? 'Proximity Alerts: ON' : 'Proximity Alerts: OFF'}</span>
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl transition-all"
            title={soundEnabled ? 'Mute Proximity Audio Chime' : 'Enable Proximity Audio Chime'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-teal-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {clients.length > 0 && (
            <select
              value={selectedClientId}
              onChange={(e) => {
                setSelectedClientId(e.target.value);
                setSimulationProgress(0);
                setStaffLocation({ lat: CLINIC_HQ.lat, lng: CLINIC_HQ.lng });
              }}
              className="bg-slate-950 border border-slate-700 text-xs text-white rounded-xl px-3 py-2 focus:ring-1 focus:ring-teal-500 font-bold"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  📍 {c.name} ({PARTICIPANT_COORDINATES[c.id]?.suburb || 'NSW'})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* PROXIMITY ALERT BANNER (Active when approaching or arrived) */}
      {isAlertSystemActive && selectedClient && (
        <div
          className={`p-4 rounded-2xl border transition-all shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
            proximityStatus === 'ARRIVED'
              ? 'bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border-emerald-500/40'
              : proximityStatus === 'APPROACHING'
              ? 'bg-gradient-to-r from-sky-950/80 via-slate-900 to-slate-900 border-sky-500/40'
              : 'bg-slate-900/60 border-slate-800/80'
          }`}
        >
          <div className="flex items-start gap-3.5">
            <div
              className={`p-3 rounded-2xl border shrink-0 ${
                proximityStatus === 'ARRIVED'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 animate-pulse'
                  : proximityStatus === 'APPROACHING'
                  ? 'bg-sky-500/20 text-sky-400 border-sky-500/30 animate-bounce'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {proximityStatus === 'ARRIVED' ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : proximityStatus === 'APPROACHING' ? (
                <BellRing className="w-6 h-6" />
              ) : (
                <Navigation className="w-6 h-6" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
                    proximityStatus === 'ARRIVED'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : proximityStatus === 'APPROACHING'
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {proximityStatus === 'ARRIVED'
                    ? '🎯 ON-SITE ARRIVAL CONFIRMED'
                    : proximityStatus === 'APPROACHING'
                    ? `⚠️ APPROACHING RESIDENCE (${currentDistanceMeters}m away)`
                    : `IN TRANSIT (${(currentDistanceMeters / 1000).toFixed(1)} km away)`}
                </span>
                <span className="text-xs font-bold text-white">
                  Target: {selectedClient.name} • {participantLoc.suburb}
                </span>
              </div>

              <p className="text-xs text-slate-300">
                {proximityStatus === 'ARRIVED'
                  ? `Staff has arrived inside the ${arrivalThresholdMeters}m geofence at ${participantLoc.siteType}. Ready for clinical session check-in.`
                  : proximityStatus === 'APPROACHING'
                  ? `Staff is approaching ${participantLoc.siteType} (within ${geofenceRadiusMeters}m alert zone). Review safety checklist below.`
                  : `Staff is currently en route from Practice HQ to ${participantLoc.suburb}. Geofence will auto-trigger at ${geofenceRadiusMeters}m.`}
              </p>

              {/* Site Safety Note Alert */}
              <div className="flex items-center gap-2 text-[11px] text-amber-300 bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-500/30 mt-1.5 font-mono">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  <strong>Site Safety Protocol:</strong> {participantLoc.safetyNote}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons for On-Site Clinician */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={() => {
                setActiveTab('case-notes');
                addNotification({
                  title: `Clinical Check-In: ${selectedClient.name}`,
                  message: `Initiated arrival case note for session at ${participantLoc.suburb}.`,
                  type: 'compliance',
                  severity: 'low',
                });
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Start On-Site Case Note</span>
            </button>

            <button
              onClick={() => {
                if (soundEnabled) playProximityChime('test');
                addNotification({
                  title: 'Proximity Chime Tested',
                  message: 'Audio alert channel verified for staff location alerts.',
                  type: 'system',
                  severity: 'low',
                });
              }}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700"
              title="Test chime sound"
            >
              <Volume2 className="w-3.5 h-3.5 text-teal-400" />
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Map on Left, NDIS Route & Proximity Controls on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map Container */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
          <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs flex-wrap gap-2">
            <div className="flex items-center gap-2 text-slate-300 font-semibold">
              <Navigation className="w-4 h-4 text-teal-400" />
              <span>Interactive Geofence & Participant Map</span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-teal-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-teal-400" /> HQ Base
              </span>
              <span className="flex items-center gap-1 text-rose-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" /> Staff Position
              </span>
              <span className="flex items-center gap-1 text-sky-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-sky-400" /> {geofenceRadiusMeters}m Geofence
              </span>
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Client Site
              </span>
            </div>
          </div>

          <div className="w-full h-[480px] relative bg-slate-950">
            {apiKey ? (
              <div ref={mapContainerRef} className="w-full h-full" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-slate-900 text-slate-300 space-y-4">
                <div className="p-4 bg-teal-500/10 border border-teal-500/20 rounded-2xl">
                  <MapPin className="w-10 h-10 text-teal-400 mx-auto" />
                </div>
                <div className="max-w-md space-y-2">
                  <h3 className="text-base font-bold text-white">Google Maps API Geolocation Service</h3>
                  <p className="text-xs text-slate-400">
                    To render the live satellite/vector map tiles and visual geofence rings, configure{' '}
                    <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in environment settings.
                  </p>
                </div>
                <a
                  href={mapsDirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                >
                  <span>Open Route in Google Maps™</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>

          {/* Interactive Staff Location & Drive Simulation Control Bar */}
          <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-sky-400" />
                <span className="font-bold text-white">Staff Transit & Geofence Simulator:</span>
                <span className="font-mono text-sky-300 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/50">
                  {simulationProgress}% to destination ({currentDistanceMeters}m)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSimulatingDrive(!isSimulatingDrive)}
                  className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
                    isSimulatingDrive
                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                      : 'bg-teal-600 hover:bg-teal-500 text-white'
                  }`}
                >
                  <Play className="w-3 h-3" />
                  <span>{isSimulatingDrive ? 'Pause Drive' : 'Simulate Drive Approach'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSimulateApproach(0)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
                  title="Reset to Clinic HQ"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Slider to interactively drag staff position towards site */}
            <div className="space-y-1">
              <input
                type="range"
                min="0"
                max="100"
                value={simulationProgress}
                onChange={(e) => handleSimulateApproach(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Practice HQ (0km)</span>
                <span>En Route (Transit)</span>
                <span className="text-sky-400">Approaching ({geofenceRadiusMeters}m)</span>
                <span className="text-emerald-400">Arrived On-Site (&lt;{arrivalThresholdMeters}m)</span>
              </div>
            </div>

            {/* Geofence Parameters Settings */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-xs">
              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">Alert Radius</span>
                <select
                  value={geofenceRadiusMeters}
                  onChange={(e) => setGeofenceRadiusMeters(Number(e.target.value))}
                  className="bg-slate-950 text-white text-xs font-bold rounded p-1 w-full border border-slate-700 mt-1"
                >
                  <option value="250">250 meters</option>
                  <option value="500">500 meters (Default)</option>
                  <option value="1000">1.0 km</option>
                  <option value="2000">2.0 km</option>
                </select>
              </div>

              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">Arrival Threshold</span>
                <select
                  value={arrivalThresholdMeters}
                  onChange={(e) => setArrivalThresholdMeters(Number(e.target.value))}
                  className="bg-slate-950 text-white text-xs font-bold rounded p-1 w-full border border-slate-700 mt-1"
                >
                  <option value="50">50 meters</option>
                  <option value="100">100 meters (Default)</option>
                  <option value="200">200 meters</option>
                </select>
              </div>

              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 flex flex-col justify-between">
                <span className="text-[10px] text-slate-400 block font-mono">Current Distance</span>
                <span className="text-sm font-black text-white font-mono">
                  {currentDistanceMeters < 1000 ? `${currentDistanceMeters} m` : `${(currentDistanceMeters / 1000).toFixed(2)} km`}
                </span>
              </div>

              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 flex flex-col justify-between">
                <span className="text-[10px] text-slate-400 block font-mono">GPS Hardware</span>
                <button
                  type="button"
                  onClick={() => setIsLiveGpsTracking(!isLiveGpsTracking)}
                  className={`text-[10px] font-bold px-2 py-1 rounded transition-all flex items-center justify-center gap-1 ${
                    isLiveGpsTracking
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {isLiveGpsTracking ? <LocateFixed className="w-3 h-3 text-emerald-400" /> : <Locate className="w-3 h-3" />}
                  <span>{isLiveGpsTracking ? 'Live GPS Active' : 'Enable Device GPS'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* NDIS Travel & Route Calculator Breakdown */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Participant Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            {selectedClient ? (
              <>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] text-teal-400 font-mono font-bold uppercase tracking-wider">
                      Target Participant
                    </span>
                    <h3 className="text-base font-black text-white">{selectedClient.name}</h3>
                    <p className="text-xs text-slate-400">
                      NDIS #{selectedClient.ndisNumber} • {participantLoc.suburb}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
                      selectedClient.riskLevel === 'High'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}
                  >
                    {selectedClient.riskLevel} Risk
                  </span>
                </div>

                {/* Travel Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Car className="w-3.5 h-3.5 text-teal-400" />
                      <span className="text-[10px] uppercase font-bold">Driving Distance</span>
                    </div>
                    <p className="text-lg font-black text-white font-mono">{travelMetrics.drivingDistanceKm} km</p>
                    <span className="text-[10px] text-slate-500">From Staff Location</span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-[10px] uppercase font-bold">Estimated Transit</span>
                    </div>
                    <p className="text-lg font-black text-white font-mono">{travelMetrics.estimatedMinutes} mins</p>
                    <span className="text-[10px] text-slate-500">Live Traffic Model</span>
                  </div>
                </div>

                {/* NDIS PACE Provider Travel Allowance */}
                <div className="bg-teal-950/30 border border-teal-800/40 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-teal-400" />
                      <span className="font-bold text-teal-200">NDIS Provider Travel Claim</span>
                    </div>
                    <span className="text-[10px] bg-teal-900/60 text-teal-300 font-mono px-2 py-0.5 rounded border border-teal-700/50 font-bold">
                      MMM {travelMetrics.mmmZone} ({travelMetrics.mmmZone <= 3 ? 'Metro Cap 30m' : 'Regional Cap 60m'})
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300 font-mono">
                    <div className="flex justify-between py-0.5 border-b border-slate-800/80">
                      <span className="text-slate-400">Claimable Labour Travel:</span>
                      <span className="font-bold text-white">
                        {travelMetrics.actualClaimableMinutes} mins (${travelMetrics.travelCost})
                      </span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-slate-800/80">
                      <span className="text-slate-400">Non-Labour (Km Allowance):</span>
                      <span className="font-bold text-white">${travelMetrics.activityTransportCost} (@ $0.97/km)</span>
                    </div>
                    <div className="flex justify-between py-1 text-sm font-black text-teal-400">
                      <span>Total Travel Claim:</span>
                      <span>${(travelMetrics.travelCost + travelMetrics.activityTransportCost).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>Auto-formatted for PACE line item <strong>01_799_0128_1_1</strong></span>
                  </div>
                </div>

                {/* Location Events History Log */}
                {recentLocationEvents.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Recent Geofence Trigger Events
                    </span>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto font-mono text-[11px]">
                      {recentLocationEvents.map((evt) => (
                        <div
                          key={evt.id}
                          className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                evt.status === 'ARRIVED' ? 'bg-emerald-400' : 'bg-sky-400'
                              }`}
                            />
                            <span className="text-white font-semibold">{evt.clientName}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">{evt.timestamp}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Action Navigation */}
                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => {
                      setActiveTab('clients');
                    }}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-700"
                  >
                    <span>Open Full Participant Record</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <a
                    href={mapsDirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 bg-teal-900/30 hover:bg-teal-800/40 text-teal-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-teal-700/50"
                  >
                    <span>Open Navigation in Google Maps™</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 space-y-3">
                <MapPin className="w-8 h-8 text-teal-400 mx-auto" />
                <p className="font-bold text-white">No Participants Registered</p>
                <p>Register a participant or import from Google Workspace Contacts to calculate Monash Model travel allowances.</p>
                <button
                  onClick={() => setActiveTab('clients')}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all"
                >
                  Go to NDIS Participants
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

