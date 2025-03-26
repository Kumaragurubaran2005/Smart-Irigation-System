import React, { useState, useEffect } from 'react';
import { AlertCircle, Droplet, Clock, Cloud, Thermometer, Sprout } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

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

interface SensorData {
  waterLevel: number;
  humidity: number;
  temperature: number;
  soilMoisture: number;
}

interface Schedule {
  id: string;
  soilType: string;
  vegetation: string;
  startDate: string;
  endDate: string;
  createdAt: Date;
  irrigationSchedules: {
    startHour: string | number;
    endHour: string | number;
  }[];
}

const Home: React.FC = () => {
  const [chartData, setChartData] = useState<IrrigationData[]>([]);
  const [systemStatus, setSystemStatus] = useState<'watering' | 'offline'>('offline');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [suggestion, setSuggestion] = useState<SuggestionData>({
    waterAmount: 500,
    duration: 30
  });

  const [sensorData, setSensorData] = useState<SensorData>({
    waterLevel: 0,
    humidity: 0,
    temperature: 0,
    soilMoisture: 0
  });

  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        const response = await fetch('http://192.168.57.117', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Received sensor data:', data);

        const processedData = {
          waterLevel: Math.min(Math.max(0, Number(data.waterLevel)), 100),
          humidity: Math.min(Math.max(0, Number(data.humidity)), 100),
          temperature: Number(data.temperature),
          soilMoisture: Math.min(Math.max(0, Number(data.soilMoisture)), 100)
        };

        if (!Object.values(processedData).some(isNaN)) {
          setSensorData(processedData);
        } else {
          throw new Error('Invalid sensor data format');
        }
      } catch (error) {
        console.error('Error fetching sensor data:', error);
      }
    };

    fetchSensorData();
    const interval = setInterval(fetchSensorData, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Initialize Firebase data fetching
  useEffect(() => {
    const initializeData = async () => {
      try {
        await fetchSchedules();
        checkSystemStatus();
      } catch (error) {
        console.error('Error initializing data:', error);
        toast.error('Failed to load initial data');
      }
    };
    
    initializeData();
  }, []);

  useEffect(() => {
    fetchSchedules();
    const interval = setInterval(() => {
      checkSystemStatus();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const fetchSchedules = async () => {
    try {
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
      processSchedulesData(fetchedSchedules);
      checkSystemStatus(fetchedSchedules);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast.error('Failed to load schedules');
    }
  };

  const processSchedulesData = (schedules: Schedule[]) => {
    const now = new Date();
    const processedData: IrrigationData[] = [];

    schedules.forEach(schedule => {
      const startDate = new Date(schedule.startDate);
      const endDate = new Date(schedule.endDate);

      // Only process schedules that haven't ended yet
      if (now <= endDate) {
        schedule.irrigationSchedules.forEach(time => {
          const startHour = Number(time.startHour);
          const endHour = Number(time.endHour);

          // Add data points for each hour in the irrigation schedule
          for (let hour = startHour; hour < endHour; hour++) {
            processedData.push({
              date: startDate.toISOString().split('T')[0],
              hour,
              scheduleId: schedule.id,
              soilType: schedule.soilType,
              vegetation: schedule.vegetation
            });
          }
        });
      }
    });

    // Sort data by date and hour
    processedData.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.hour - b.hour;
    });

    setChartData(processedData);
  };

  const checkSystemStatus = (currentSchedules?: Schedule[]) => {
    const schedulesToCheck = currentSchedules || schedules;
    const now = new Date();
    const currentHour = now.getHours();
    const currentDate = now.toISOString().split('T')[0];

    const isWatering = schedulesToCheck.some(schedule => {
      const startDate = schedule.startDate.split('T')[0];
      const endDate = schedule.endDate.split('T')[0];
      
      // Check if current date is within schedule period
      if (currentDate >= startDate && currentDate <= endDate) {
        // Check if current hour is within any irrigation time slot
        return schedule.irrigationSchedules.some(time => {
          const startHour = Number(time.startHour);
          const endHour = Number(time.endHour);
          return currentHour >= startHour && currentHour < endHour;
        });
      }
      return false;
    });

    setSystemStatus(isWatering ? 'watering' : 'offline');
  };

  const handleAcceptSuggestion = () => {
    alert(`Accepted: ${suggestion.waterAmount}ml for ${suggestion.duration} minutes`);
  };

  const handleRejectSuggestion = () => {
    alert('Suggestion rejected');
  };

  return (
    <div className="min-h-screen container mx-auto px-4 py-8 overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Irrigation Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Monitor and control your irrigation system
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Irrigation Timeline
          </h2>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 40, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis
                  dataKey="date"
                  type="category"
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-GB')}
                  label={{ value: 'Date', position: 'bottom', offset: 5 }}
                  stroke="#6B7280"
                  height={60}
                />
                <YAxis
                  dataKey="hour"
                  type="number"
                  domain={[0, 23]}
                  ticks={[0, 6, 12, 18, 23]}
                  tickFormatter={(hour) => `${hour}:00`}
                  label={{ value: 'Hours', angle: -90, position: 'insideLeft', offset: -20 }}
                  stroke="#6B7280"
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', padding: '8px' }}
                  itemStyle={{ color: '#E5E7EB' }}
                  cursor={false}
                  isAnimationActive={false}
                  formatter={(value, name, props) => {
                    const date = new Date(props.payload.date);
                    const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
                    return [
                      name === 'hour' ? `${value}:00` : formattedDate,
                      <div key="crop-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: props.color }} />
                        {`${props.payload.vegetation} (${props.color})`}
                      </div>
                    ];
                  }}
                />
                {chartData.length > 0 && Array.from(new Set(chartData.map(data => data.scheduleId))).map((scheduleId, index) => {
                  const scheduleData = chartData.filter(data => data.scheduleId === scheduleId);
                  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
                  return (
                    <Line
                      key={scheduleId}
                      type="monotone"
                      data={scheduleData}
                      dataKey="hour"
                      stroke={colors[index % colors.length]}
                      strokeWidth={2}
                      dot={{ fill: colors[index % colors.length], r: 4, strokeWidth: 0 }}
                      activeDot={{
                        r: 6,
                        fill: colors[index % colors.length],
                        strokeWidth: 0
                      }}
                      isAnimationActive={true}
                      animationDuration={1000}
                      animationBegin={index * 200}
                      name={scheduleData[0]?.vegetation || 'Schedule'}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              System Status
            </h2>
            <div className="flex items-center">
              <div className={`relative flex items-center justify-center w-16 h-16 rounded-full ${systemStatus === 'watering' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                <div>
                  <Droplet 
                    size={32} 
                    className={systemStatus === 'watering' ? 'text-blue-500' : 'text-gray-400'}
                  />
                </div>
                {systemStatus === 'watering' && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping" />
                )}
              </div>
              <div className="ml-4">
                <p className="text-lg font-medium text-gray-800 dark:text-white">
                  {systemStatus === 'watering' ? 'Currently Watering' : 'System Offline'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {systemStatus === 'watering' 
                    ? 'Your irrigation system is active' 
                    : 'Your irrigation system is currently not running'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Water Suggestion
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center">
                  <Droplet className="text-blue-500 mr-2" size={20} />
                  <span className="text-gray-700 dark:text-gray-300">Water Amount:</span>
                </div>
                <span className="font-medium text-gray-800 dark:text-white">{suggestion.waterAmount} ml</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center">
                  <Clock className="text-blue-500 mr-2" size={20} />
                  <span className="text-gray-700 dark:text-gray-300">Estimated Duration:</span>
                </div>
                <span className="font-medium text-gray-800 dark:text-white">{suggestion.duration} minutes</span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button 
                  onClick={handleAcceptSuggestion}
                  className="flex-1 py-2.5 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                >
                  Accept
                </button>
                <button 
                  onClick={handleRejectSuggestion}
                  className="flex-1 py-2.5 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Sensor Real-time Data
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">Water Level</span>
                <Droplet className="text-blue-500" size={20} />
              </div>
              <p className="text-2xl font-semibold text-gray-800 dark:text-white">
                {sensorData.waterLevel}%
              </p>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">Humidity</span>
                <Cloud className="text-green-500" size={20} />
              </div>
              <p className="text-2xl font-semibold text-gray-800 dark:text-white">
                {sensorData.humidity}%
              </p>
            </div>

            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">Temperature</span>
                <Thermometer className="text-orange-500" size={20} />
              </div>
              <p className="text-2xl font-semibold text-gray-800 dark:text-white">
                {sensorData.temperature}°C
              </p>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">Soil Moisture</span>
                <Sprout className="text-purple-500" size={20} />
              </div>
              <p className="text-2xl font-semibold text-gray-800 dark:text-white">
                {sensorData.soilMoisture}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;