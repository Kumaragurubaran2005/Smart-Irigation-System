import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';

interface Schedule {
  id: string;
  soilType: string;
  vegetation: string;
  startDate: string;
  endDate: string;
  irrigationSchedules: {
    startHour: string | number;
    endHour: string | number;
  }[];
  createdAt: Date;
}

interface ScheduleContextType {
  schedules: Schedule[];
  loading: boolean;
  error: string | null;
  refreshSchedules: () => Promise<void>;
  setSchedules: React.Dispatch<React.SetStateAction<Schedule[]>>;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export const useSchedules = () => {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error('useSchedules must be used within a ScheduleProvider');
  }
  return context;
};

interface ScheduleProviderProps {
  children: ReactNode;
}

export const ScheduleProvider: React.FC<ScheduleProviderProps> = ({ children }) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const schedulesRef = collection(db, 'schedules');
      const querySnapshot = await getDocs(schedulesRef);
      
      const fetchedSchedules = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate,
        endDate: doc.data().endDate,
        createdAt: doc.data().createdAt ? new Date(doc.data().createdAt) : new Date()
      })) as Schedule[];
      
      setSchedules(fetchedSchedules);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      setError('Failed to load schedules');
      toast.error('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const value = {
    schedules,
    loading,
    error,
    refreshSchedules: fetchSchedules,
    setSchedules
  };

  return (
    <ScheduleContext.Provider value={value}>
      {children}
    </ScheduleContext.Provider>
  );
};