import React, { useState } from 'react';
import { Plus, ChevronDown, ChevronUp, Trash2, Calendar } from 'lucide-react';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useSchedules } from '../contexts/ScheduleContext';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
// Temporarily comment out framer-motion import until package is installed
import { motion, AnimatePresence } from 'framer-motion';

interface ScheduleFormData {
  soilType: string;
  vegetation: string;
  startDate: string;
  endDate: string;
  irrigationSchedules: {
    startHour: string | number;
    endHour: string | number;
  }[];
}

interface Schedule extends ScheduleFormData {
  id: string;
  createdAt: Date;
}

const cropIconMap: { [key: string]: string } = {
  'Rice': '🌾',
  'Wheat': '🌾',
  'Maize': '🌽',
  'Corn': '🌽',
  'Peanuts': '🥜'
};

const soilTypeColors: { [key: string]: string } = {
  'Red Soil': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  'Black Soil': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
  'Alluvial Soil': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  'Sandy Soil': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  'Clay Soil': 'bg-brown-100 text-brown-800 dark:bg-brown-900/30 dark:text-brown-400'
};

interface IrrigationData {
  date: string;
  hour: number;
  scheduleId: string;
  soilType: string;
  vegetation: string;
}

interface SuggestionData {
  waterAmount: number;
  duration: number;
}

const Schedule: React.FC = () => {
  const { schedules, setSchedules, loading, refreshSchedules } = useSchedules();
  const [showForm, setShowForm] = useState(false);
  const [expandedSchedule, setExpandedSchedule] = useState<string | null>(null);
  const [formData, setFormData] = useState<ScheduleFormData>({
    soilType: '',
    vegetation: '',
    startDate: '',
    endDate: '',
    irrigationSchedules: [
      {
        startHour: '',
        endHour: ''
      }
    ]
  });

  const addIrrigationSchedule = () => {
    setFormData({
      ...formData,
      irrigationSchedules: [
        ...formData.irrigationSchedules,
        {
          startHour: '',
          endHour: ''
        }
      ]
    });
  };

  const removeIrrigationSchedule = (scheduleIndex: number) => {
    if (formData.irrigationSchedules.length === 1) return;
    
    const updatedSchedules = [...formData.irrigationSchedules];
    updatedSchedules.splice(scheduleIndex, 1);
    
    setFormData({
      ...formData,
      irrigationSchedules: updatedSchedules
    });
  };

  const handleScheduleChange = (scheduleIndex: number, field: string, value: number | string) => {
    const updatedSchedules = [...formData.irrigationSchedules];
    const updatedSchedule = {
      ...updatedSchedules[scheduleIndex],
      [field]: value === '' ? '' : Number(value)
    };

    // Skip validation if either value is empty
    if (value === '' || 
        (field === 'endHour' && updatedSchedule.startHour === '') ||
        (field === 'startHour' && updatedSchedule.endHour === '')) {
      updatedSchedules[scheduleIndex] = updatedSchedule;
      setFormData({
        ...formData,
        irrigationSchedules: updatedSchedules
      });
      return;
    }
  
    // Continue with existing validation
    const numericValue = Number(value);
    if (field === 'endHour' && typeof updatedSchedule.startHour === 'number' && numericValue <= updatedSchedule.startHour) {
      toast.error('End hour must be greater than start hour');
      return;
    }
    if (field === 'startHour' && typeof updatedSchedule.endHour === 'number' && numericValue >= updatedSchedule.endHour) {
      toast.error('Start hour must be less than end hour');
      return;
    }
  
    // Check for time overlap with other schedules
    const hasOverlap = updatedSchedules.some((schedule, index) => {
      if (index === scheduleIndex) return false;
      
      const currentStart = field === 'startHour' ? numericValue : updatedSchedule.startHour;
      const currentEnd = field === 'endHour' ? numericValue : updatedSchedule.endHour;
      
      // Skip overlap check if any of the values are empty strings
      if (currentStart === '' || currentEnd === '' ||
          schedule.startHour === '' || schedule.endHour === '') {
        return false;
      }
  
      // Convert to numbers for comparison
      const start = Number(currentStart);
      const end = Number(currentEnd);
      const scheduleStart = Number(schedule.startHour);
      const scheduleEnd = Number(schedule.endHour);
  
      // Check if there's any overlap between time periods
      return (
        (start < scheduleEnd && end > scheduleStart)
      );
    });
  
    if (hasOverlap) {
      toast.error('This time period overlaps with another irrigation schedule');
      return;
    }
  
    updatedSchedules[scheduleIndex] = updatedSchedule;
    setFormData({
      ...formData,
      irrigationSchedules: updatedSchedules
    });
  };
  const soilTypes = ['Red Soil', 'Black Soil', 'Alluvial Soil', 'Sandy Soil', 'Clay Soil'];
  const vegetationTypes = ['Rice', 'Wheat', 'Maize', 'Corn', 'Peanuts'];



  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleDateChange = (field: string, date: Date | null) => {
    if (!date) {
      setFormData({
        ...formData,
        [field]: ''
      });
      return;
    }
    
    setFormData({
      ...formData,
      [field]: date.toISOString()
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    try {
      // Validate form data
      if (!formData.soilType || !formData.vegetation) {
        toast.error('Please select soil type and vegetation');
        return;
      }
  
      if (!formData.startDate || !formData.endDate) {
        toast.error('Please fill all date fields');
        return;
      }
  
      // Validate irrigation schedules
      if (formData.irrigationSchedules.length === 0) {
        toast.error('At least one irrigation schedule is required');
        return;
      }
  
      // Validate each irrigation schedule
      for (const schedule of formData.irrigationSchedules) {
        if (schedule.startHour === '' || schedule.endHour === '') {
          toast.error('Please fill all irrigation schedule times');
          return;
        }
  
        if (Number(schedule.startHour) >= Number(schedule.endHour)) {
          toast.error('End hour must be greater than start hour');
          return;
        }
      }

      // Create a temporary ID for immediate UI update
      const tempId = 'temp-' + new Date().getTime();
      const createdAt = new Date();
      const newSchedule: Schedule = {
        id: tempId,
        ...formData,
        createdAt
      };

      // Update UI immediately
      setSchedules(prevSchedules => {
        const updatedSchedules = [...prevSchedules, newSchedule];
        return updatedSchedules.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      });
  
      // Reset form and close it immediately
      const resetFormData = {
        soilType: '',
        vegetation: '',
        startDate: '',
        endDate: '',
        irrigationSchedules: [{ startHour: '', endHour: '' }]
      };
      setFormData(resetFormData);
      setShowForm(false);
  
      // Add schedule to Firestore
      const docRef = await addDoc(collection(db, 'schedules'), {
        soilType: formData.soilType,
        vegetation: formData.vegetation,
        startDate: formData.startDate,
        endDate: formData.endDate,
        irrigationSchedules: formData.irrigationSchedules,
        createdAt: createdAt.toISOString()
      });
  
      // Update the schedule with the real ID and refresh data
      setSchedules(prevSchedules => {
        const updatedSchedules = prevSchedules.map(schedule => 
          schedule.id === tempId ? { ...schedule, id: docRef.id } : schedule
        );
        return updatedSchedules;
      });
      
      // Refresh schedules to update the graph
      refreshSchedules();
      
      toast.success('Schedule saved successfully');
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error('Failed to save schedule');
      // Revert the UI changes if Firestore operation fails
      setSchedules(prevSchedules => prevSchedules.filter(schedule => !schedule.id.startsWith('temp-')));
    }
  };

  const deleteSchedule = async (id: string) => {
    try {
      // Update UI immediately
      setSchedules(prevSchedules => prevSchedules.filter(schedule => schedule.id !== id));
      toast.success('Schedule deleted');
  
      // Delete from Firestore
      await deleteDoc(doc(db, 'schedules', id));
      
      // Refresh schedules to update the graph
      refreshSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Failed to delete schedule');
      // Revert UI if deletion fails
      setSchedules(prevSchedules => [...prevSchedules]); 
    }
  };

  const isScheduleActive = (schedule: Schedule) => {
    const now = new Date();
    const endDate = new Date(schedule.endDate);
    return now <= endDate;
  };

  const toggleScheduleDetails = (id: string) => {
    if (expandedSchedule === id) {
      setExpandedSchedule(null);
    } else {
      setExpandedSchedule(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Irrigation Schedules</h1>
      </div>

      {showForm && (
        <div className="bg-card rounded-lg shadow-md p-4 sm:p-6">
          <h2 className="text-xl font-semibold mb-4">New Irrigation Schedule</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="soilType" className="block text-sm font-medium">
                  Soil Type
                </label>
                <select
                  id="soilType"
                  name="soilType"
                  value={formData.soilType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-sm"
                  required
                >
                  <option value="">Select Soil Type</option>
                  {soilTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-1">
                <label htmlFor="vegetation" className="block text-sm font-medium">
                  Vegetation
                </label>
                <select
                  id="vegetation"
                  name="vegetation"
                  value={formData.vegetation}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-sm"
                  required
                >
                  <option value="">Select Vegetation</option>
                  {vegetationTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Cultivation Period</h3>

              <div className="bg-muted/30 p-3 sm:p-4 rounded-md">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium">
                      Start Date
                    </label>
                    <DatePicker
                      selected={formData.startDate ? new Date(formData.startDate) : null}
                      onChange={(date) => handleDateChange('startDate', date)}
                      dateFormat="dd-MM-yyyy"
                      minDate={new Date()}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-sm"
                      placeholderText="Select start date"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="block text-sm font-medium">
                      End Date
                    </label>
                    <DatePicker
                      selected={formData.endDate ? new Date(formData.endDate) : null}
                      onChange={(date) => handleDateChange('endDate', date)}
                      dateFormat="dd-MM-yyyy"
                      minDate={formData.startDate ? new Date(formData.startDate) : new Date()}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-sm"
                      placeholderText="Select end date"
                    />
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <div className="mb-3">
                    <h5 className="font-medium text-sm">Irrigation Times</h5>
                  </div>
                  
                  {formData.irrigationSchedules.map((schedule, scheduleIndex) => (
                    <div key={scheduleIndex} className="grid grid-cols-1 gap-4 mb-3 last:mb-0 bg-background p-3 rounded-md relative">
                      {formData.irrigationSchedules.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeIrrigationSchedule(scheduleIndex)}
                          className="absolute top-2 right-2 p-2 text-destructive hover:text-destructive/90 z-10"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                      <div className="grid grid-cols-2 gap-4 items-end">
                        <div className="w-full">
                          <label className="block text-sm font-medium mb-1">
                            Start Hour
                          </label>
                          <select
                            value={schedule.startHour}
                            onChange={(e) => handleScheduleChange(scheduleIndex, 'startHour', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                            required
                          >
                            <option value="">Select start hour</option>
                            {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                              <option key={hour} value={hour}>
                                {hour}:00
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-full">
                          <label className="block text-sm font-medium mb-1">
                            End Hour
                          </label>
                          <select
                            value={schedule.endHour}
                            onChange={(e) => handleScheduleChange(scheduleIndex, 'endHour', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                            required
                          >
                            <option value="">Select end hour</option>
                            {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                              <option key={hour} value={hour}>
                                {hour}:00
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={addIrrigationSchedule}
                    className="flex mx-auto mt-4 py-2 px-4 text-sm text-primary hover:text-primary/90 items-center justify-center gap-1 border border-primary/20 rounded-md hover:bg-primary/5 transition-colors"
                  >
                    <Plus size={16} />
                    Add Schedule
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="w-full sm:w-auto py-2 px-4 bg-transparent text-foreground border border-input rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
              >
                Save Schedule
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {schedules.length === 0 ? (
          <div className="bg-card rounded-lg shadow-md p-6 text-center">
            <Calendar className="mx-auto text-muted-foreground mb-2" size={32} />
            <p className="text-lg font-medium">No existing schedules</p>
            <p className="text-muted-foreground mb-4">Create your first irrigation schedule</p>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="flex mx-auto items-center gap-1 py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
              >
                <Plus size={18} />
                <span>Add Schedule</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="bg-card rounded-lg shadow-md overflow-hidden">
                <div 
                  className="p-4 flex justify-between items-center cursor-pointer"
                  onClick={() => toggleScheduleDetails(schedule.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{cropIconMap[schedule.vegetation as keyof typeof cropIconMap]}</span>
                      <div>
                        <h3 className="font-medium">{schedule.vegetation}</h3>
                        <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${soilTypeColors[schedule.soilType as keyof typeof soilTypeColors]}`}>
                          {schedule.soilType}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Added on {schedule.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isScheduleActive(schedule) && (
                      <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-md">
                        Active
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSchedule(schedule.id);
                      }}
                      className="p-2 text-destructive hover:text-destructive/90"
                    >
                      <Trash2 size={18} />
                    </button>
                    {expandedSchedule === schedule.id ? (
                      <ChevronUp size={20} className="text-muted-foreground" />
                    ) : (
                      <ChevronDown size={20} className="text-muted-foreground" />
                    )}
                  </div>
                </div>
                <AnimatePresence>
                  {expandedSchedule === schedule.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-border"
                    >
                      <div className="p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Start Date</p>
                            <p className="font-medium">{new Date(schedule.startDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">End Date</p>
                            <p className="font-medium">{new Date(schedule.endDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Irrigation Times</p>
                          <div className="space-y-2">
                            {schedule.irrigationSchedules.map((time, index) => (
                              <div key={index} className="bg-muted/30 p-2 rounded-md flex justify-between items-center">
                                <span className="text-sm">{time.startHour}:00 - {time.endHour}:00</span>
                                <span className="text-xs text-muted-foreground">{Number(time.endHour) - Number(time.startHour)} hours</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="flex mx-auto items-center gap-1 py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
              >
                <Plus size={18} />
                <span>Add Schedule</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Schedule;