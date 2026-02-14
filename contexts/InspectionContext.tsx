import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type PhotoStatus = 'pending' | 'validating' | 'approved' | 'error';

export interface InspectionPhoto {
  uri: string;
  status: PhotoStatus;
  label: string;
}

export interface InspectionRecord {
  id: string;
  associateName: string;
  associateCpf: string;
  associatePhone: string;
  vehicleModel: string;
  vehicleBrand: string;
  vehicleColor: string;
  vehicleYear: string;
  plate: string;
  occurrenceType: string;
  occurrenceAddress: string;
  occurrenceDate: string;
  status: 'active' | 'completed';
  createdAt: string;
  receivingCalls: boolean;
  primaryPhotos: InspectionPhoto[];
  secondaryPhotos: InspectionPhoto[];
  primaryAudioUri?: string;
  primaryVideoUri?: string;
  secondaryAudioUri?: string;
  secondaryVideoUri?: string;
  hasSecondaryVehicle: boolean;
  secondaryVehicleModel?: string;
  secondaryVehiclePlate?: string;
}

interface InspectionContextValue {
  inspections: InspectionRecord[];
  activeInspection: InspectionRecord | null;
  completedInspections: InspectionRecord[];
  receivingCalls: boolean;
  setReceivingCalls: (val: boolean) => Promise<void>;
  setActiveInspection: (record: InspectionRecord) => Promise<void>;
  updateActiveInspection: (updates: Partial<InspectionRecord>) => Promise<void>;
  completeInspection: () => Promise<void>;
  updatePrimaryPhoto: (index: number, photo: InspectionPhoto) => Promise<void>;
  updateSecondaryPhoto: (index: number, photo: InspectionPhoto) => Promise<void>;
}

const InspectionContext = createContext<InspectionContextValue | null>(null);

const PRIMARY_LABELS = ['Lateral Direita', 'Lateral Esquerda', 'Frente', 'Traseira', 'Painel', 'Hodômetro'];
const SECONDARY_LABELS = ['Lateral Direita', 'Lateral Esquerda', 'Frente', 'Traseira'];

export function getDefaultPrimaryPhotos(): InspectionPhoto[] {
  return PRIMARY_LABELS.map(label => ({ uri: '', status: 'pending' as PhotoStatus, label }));
}

export function getDefaultSecondaryPhotos(): InspectionPhoto[] {
  return SECONDARY_LABELS.map(label => ({ uri: '', status: 'pending' as PhotoStatus, label }));
}

export function InspectionProvider({ children }: { children: ReactNode }) {
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [activeInspection, setActiveState] = useState<InspectionRecord | null>(null);
  const [receivingCalls, setReceivingCallsState] = useState(false);

  const completedInspections = useMemo(() => inspections.filter(i => i.status === 'completed'), [inspections]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [data, rcv] = await Promise.all([
      AsyncStorage.getItem('inspections'),
      AsyncStorage.getItem('receivingCalls'),
    ]);
    if (data) {
      const parsed: InspectionRecord[] = JSON.parse(data);
      setInspections(parsed);
      const active = parsed.find(i => i.status === 'active');
      if (active) setActiveState(active);
    }
    if (rcv) setReceivingCallsState(JSON.parse(rcv));
  };

  const persist = async (all: InspectionRecord[]) => {
    setInspections(all);
    await AsyncStorage.setItem('inspections', JSON.stringify(all));
  };

  const setReceivingCalls = async (val: boolean) => {
    setReceivingCallsState(val);
    await AsyncStorage.setItem('receivingCalls', JSON.stringify(val));
  };

  const setActiveInspection = async (record: InspectionRecord) => {
    setActiveState(record);
    const updated = [...inspections.filter(i => i.id !== record.id), record];
    await persist(updated);
  };

  const updateActiveInspection = async (updates: Partial<InspectionRecord>) => {
    if (!activeInspection) return;
    const updated = { ...activeInspection, ...updates };
    setActiveState(updated);
    const all = inspections.map(i => i.id === updated.id ? updated : i);
    await persist(all);
  };

  const updatePrimaryPhoto = async (index: number, photo: InspectionPhoto) => {
    if (!activeInspection) return;
    const photos = [...activeInspection.primaryPhotos];
    photos[index] = photo;
    await updateActiveInspection({ primaryPhotos: photos });
  };

  const updateSecondaryPhoto = async (index: number, photo: InspectionPhoto) => {
    if (!activeInspection) return;
    const photos = [...activeInspection.secondaryPhotos];
    photos[index] = photo;
    await updateActiveInspection({ secondaryPhotos: photos });
  };

  const completeInspection = async () => {
    if (!activeInspection) return;
    const completed = { ...activeInspection, status: 'completed' as const };
    setActiveState(null);
    const all = inspections.map(i => i.id === completed.id ? completed : i);
    await persist(all);
  };

  const value = useMemo(() => ({
    inspections,
    activeInspection,
    completedInspections,
    receivingCalls,
    setReceivingCalls,
    setActiveInspection,
    updateActiveInspection,
    completeInspection,
    updatePrimaryPhoto,
    updateSecondaryPhoto,
  }), [inspections, activeInspection, receivingCalls]);

  return (
    <InspectionContext.Provider value={value}>
      {children}
    </InspectionContext.Provider>
  );
}

export function useInspection() {
  const context = useContext(InspectionContext);
  if (!context) throw new Error('useInspection must be used within an InspectionProvider');
  return context;
}
