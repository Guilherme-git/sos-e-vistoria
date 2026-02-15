import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CallRecord {
  id: string;
  clientName: string;
  vehicleModel: string;
  vehicleColor: string;
  vehicleYear: string;
  plate: string;
  serviceType: string;
  cpfCnpj: string;
  phone: string;
  pickupAddress: string;
  destinationAddress?: string;
  status: 'active' | 'completed';
  createdAt: string;
  timelineStep: number;
  checkinPhotos: string[];
  checkoutPhotos: string[];
  belongingsPhotos: string[];
  checkinSignature?: string;
  checkoutSignature?: string;
  checkinObservation?: string;
  checkoutObservation?: string;
}

interface CallsContextValue {
  calls: CallRecord[];
  activeCall: CallRecord | null;
  completedCalls: CallRecord[];
  setActiveCall: (call: CallRecord) => Promise<void>;
  updateActiveCall: (updates: Partial<CallRecord>) => Promise<void>;
  completeCall: () => Promise<void>;
  loadCalls: () => Promise<void>;
  clearCalls: () => Promise<void>;
}

const CallsContext = createContext<CallsContextValue | null>(null);

export function CallsProvider({ children }: { children: ReactNode }) {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [activeCall, setActiveCallState] = useState<CallRecord | null>(null);

  const completedCalls = useMemo(() => calls.filter(c => c.status === 'completed'), [calls]);

  useEffect(() => {
    loadCalls();
  }, []);

  const loadCalls = async () => {
    const data = await AsyncStorage.getItem('calls');
    if (data) {
      const parsed: CallRecord[] = JSON.parse(data);
      setCalls(parsed);
      const active = parsed.find(c => c.status === 'active');
      if (active) setActiveCallState(active);
    }
  };

  const setActiveCall = async (call: CallRecord) => {
    setActiveCallState(call);
    const updated = [...calls.filter(c => c.id !== call.id), call];
    setCalls(updated);
    await AsyncStorage.setItem('calls', JSON.stringify(updated));
  };

  const updateActiveCall = async (updates: Partial<CallRecord>) => {
    if (!activeCall) return;
    const updated = { ...activeCall, ...updates };
    setActiveCallState(updated);
    const allCalls = calls.map(c => c.id === updated.id ? updated : c);
    setCalls(allCalls);
    await AsyncStorage.setItem('calls', JSON.stringify(allCalls));
  };

  const completeCall = async () => {
    if (!activeCall) return;
    const completed = { ...activeCall, status: 'completed' as const };
    setActiveCallState(null);
    const allCalls = calls.map(c => c.id === completed.id ? completed : c);
    setCalls(allCalls);
    await AsyncStorage.setItem('calls', JSON.stringify(allCalls));
  };

  const clearCalls = async () => {
    setCalls([]);
    setActiveCallState(null);
    await AsyncStorage.removeItem('calls');
  };

  const value = useMemo(() => ({
    calls,
    activeCall,
    completedCalls,
    setActiveCall,
    updateActiveCall,
    completeCall,
    loadCalls,
    clearCalls,
  }), [calls, activeCall]);

  return (
    <CallsContext.Provider value={value}>
      {children}
    </CallsContext.Provider>
  );
}

export function useCalls() {
  const context = useContext(CallsContext);
  if (!context) {
    throw new Error('useCalls must be used within a CallsProvider');
  }
  return context;
}
