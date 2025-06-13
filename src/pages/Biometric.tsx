
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Fingerprint, Server, Clock, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface AttendanceRecord {
  id: string;
  staff_id: string;
  staff_name: string;
  clock_in: string;
  clock_out: string | null;
  hours_worked: number | null;
}

interface BiometricDevice {
  name: string;
  ip_address: string;
  port: string;
  status: 'connected' | 'disconnected' | 'pending';
  last_sync: string | null;
}

const Biometric = () => {
  const [deviceName, setDeviceName] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [port, setPort] = useState('4370'); // Default ZKTeco port
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [devices, setDevices] = useState<BiometricDevice[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [activeTab, setActiveTab] = useState('devices');
  const { toast } = useToast();

  useEffect(() => {
    fetchDevices();
    fetchAttendanceRecords();
  }, []);

  const fetchDevices = async () => {
    try {
      const { data: settingsData } = await supabase
        .from('settings')
        .select('setting_value')
        .eq('setting_key', 'biometric_devices');

      if (settingsData && settingsData[0]?.setting_value) {
        setDevices(JSON.parse(settingsData[0].setting_value));
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  };

  const fetchAttendanceRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          id,
          staff_id,
          clock_in,
          clock_out,
          staff(name)
        `)
        .order('clock_in', { ascending: false })
        .limit(20);

      if (error) throw error;

      const formattedRecords = data.map(record => ({
        id: record.id,
        staff_id: record.staff_id,
        staff_name: record.staff?.name || 'Unknown Staff',
        clock_in: record.clock_in,
        clock_out: record.clock_out,
        hours_worked: record.clock_out 
          ? calculateHoursWorked(record.clock_in, record.clock_out) 
          : null
      }));

      setAttendanceRecords(formattedRecords);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      toast({
        title: "Error",
        description: "Failed to load attendance records",
        variant: "destructive",
      });
    }
  };

  const calculateHoursWorked = (clockIn: string, clockOut: string): number => {
    const startTime = new Date(clockIn).getTime();
    const endTime = new Date(clockOut).getTime();
    const millisDiff = endTime - startTime;
    return parseFloat((millisDiff / (1000 * 60 * 60)).toFixed(2)); // Convert to hours with 2 decimal places
  };

  const handleConnect = async () => {
    if (!deviceName || !ipAddress || !port) {
      toast({
        title: "Validation Error",
        description: "Please fill in all device details",
        variant: "destructive",
      });
      return;
    }

    setConnecting(true);

    try {
      // In a real implementation, this would make an actual connection to the device
      // For demo purposes, we'll simulate the connection
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newDevice: BiometricDevice = {
        name: deviceName,
        ip_address: ipAddress,
        port: port,
        status: 'connected',
        last_sync: new Date().toISOString(),
      };

      const updatedDevices = [...devices, newDevice];
      setDevices(updatedDevices);

      // Save to settings table
      await supabase
        .from('settings')
        .upsert({
          setting_key: 'biometric_devices',
          setting_value: JSON.stringify(updatedDevices)
        });

      toast({
        title: "Device Connected",
        description: `${deviceName} has been successfully connected.`,
      });

      // Reset form
      setDeviceName('');
      setIpAddress('');
      setPort('4370');
    } catch (error) {
      console.error('Error connecting to device:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to the biometric device. Please check the device details and try again.",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };

  const handleSync = async (deviceIndex: number) => {
    setSyncing(true);
    const device = devices[deviceIndex];

    try {
      // Simulate device synchronization
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate adding new attendance records
      const mockAttendance = generateMockAttendanceData();
      
      if (mockAttendance.length > 0) {
        // In a real implementation, this would save actual attendance records from the device
        await saveMockAttendanceRecords(mockAttendance);
      }

      // Update last sync time for the device
      const updatedDevices = [...devices];
      updatedDevices[deviceIndex] = {
        ...device,
        last_sync: new Date().toISOString()
      };
      
      setDevices(updatedDevices);
      
      // Save updated devices to settings
      await supabase
        .from('settings')
        .upsert({
          setting_key: 'biometric_devices',
          setting_value: JSON.stringify(updatedDevices)
        });

      // Refresh attendance records
      await fetchAttendanceRecords();

      toast({
        title: "Sync Complete",
        description: `Successfully synced attendance data from ${device.name}.`,
      });
    } catch (error) {
      console.error('Error syncing device:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to synchronize with the biometric device.",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  // Generate mock attendance data for demonstration
  const generateMockAttendanceData = () => {
    // In a real implementation, this would be actual data from the device
    const staffIds = ['3a75a7ee-6a5a-4a68-8d3e-c8d85683e76a', '4b85b7ff-7a6a-5b78-9e4f-d9e96794f87b'];
    const mockData = [];
    
    // Generate 1-3 random attendance records
    const recordsToGenerate = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < recordsToGenerate; i++) {
      const staffId = staffIds[Math.floor(Math.random() * staffIds.length)];
      const now = new Date();
      const clockIn = new Date(now.getTime() - (Math.random() * 8 * 60 * 60 * 1000)); // Random time in the last 8 hours
      const clockOut = Math.random() > 0.3 ? new Date(clockIn.getTime() + (Math.random() * 8 * 60 * 60 * 1000)) : null; // 30% chance of no clock out
      
      mockData.push({
        staff_id: staffId,
        clock_in: clockIn.toISOString(),
        clock_out: clockOut?.toISOString() || null
      });
    }
    
    return mockData;
  };

  const saveMockAttendanceRecords = async (records: any[]) => {
    // In a real implementation, this would save actual attendance records from the device
    try {
      for (const record of records) {
        await supabase
          .from('attendance')
          .insert(record);
      }
    } catch (error) {
      console.error('Error saving attendance records:', error);
      throw error;
    }
  };

  const handleRemoveDevice = async (index: number) => {
    const updatedDevices = [...devices];
    updatedDevices.splice(index, 1);
    setDevices(updatedDevices);
    
    try {
      await supabase
        .from('settings')
        .upsert({
          setting_key: 'biometric_devices',
          setting_value: JSON.stringify(updatedDevices)
        });
      
      toast({
        title: "Device Removed",
        description: "Biometric device has been removed.",
      });
    } catch (error) {
      console.error('Error removing device:', error);
      toast({
        title: "Error",
        description: "Failed to remove device",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Biometric Integration</h1>
        <p className="text-muted-foreground">
          Connect to biometric devices for staff attendance tracking.
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="devices">
            <Server className="h-4 w-4 mr-2" />
            Devices
          </TabsTrigger>
          <TabsTrigger value="attendance">
            <Clock className="h-4 w-4 mr-2" />
            Attendance
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Biometric Device</CardTitle>
              <CardDescription>
                Enter the details of your biometric device to start tracking attendance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <label htmlFor="device-name" className="text-sm font-medium">
                    Device Name
                  </label>
                  <Input
                    id="device-name"
                    placeholder="Main Entrance Device"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="ip-address" className="text-sm font-medium">
                    IP Address
                  </label>
                  <Input
                    id="ip-address"
                    placeholder="192.168.1.100"
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="port" className="text-sm font-medium">
                    Port Number
                  </label>
                  <Input
                    id="port"
                    placeholder="4370"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                className="mt-4"
                onClick={handleConnect}
                disabled={connecting || !deviceName || !ipAddress || !port}
              >
                {connecting ? 'Connecting...' : 'Connect Device'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Connected Devices</CardTitle>
              <CardDescription>
                Manage your connected biometric devices and sync attendance data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {devices.length === 0 ? (
                <div className="text-center py-10">
                  <Fingerprint className="mx-auto h-12 w-12 text-muted-foreground/60" />
                  <p className="mt-4 text-muted-foreground">
                    No biometric devices connected yet. Add your first device above.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Device Name</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Port</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Sync</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {devices.map((device, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{device.name}</TableCell>
                        <TableCell>{device.ip_address}</TableCell>
                        <TableCell>{device.port}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={device.status === 'connected' ? 'default' : 'destructive'}
                          >
                            {device.status === 'connected' ? 'Connected' : 'Disconnected'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {device.last_sync 
                            ? format(new Date(device.last_sync), 'dd MMM yyyy HH:mm')
                            : 'Never'}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            disabled={syncing}
                            onClick={() => handleSync(index)}
                          >
                            {syncing ? 'Syncing...' : 'Sync Now'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleRemoveDevice(index)}
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Alert>
            <Fingerprint className="h-4 w-4" />
            <AlertTitle>Compatibility Information</AlertTitle>
            <AlertDescription>
              This integration supports most ZKTeco biometric devices and compatible models that use UDP port 4370.
              Both the device and this computer must be on the same network. For help, contact support.
            </AlertDescription>
          </Alert>
        </TabsContent>
        
        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Staff Attendance Records</CardTitle>
              <CardDescription>
                View and manage staff attendance data collected from biometric devices.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {attendanceRecords.length === 0 ? (
                <div className="text-center py-10">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground/60" />
                  <p className="mt-4 text-muted-foreground">
                    No attendance records available. Sync your biometric devices to see data here.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff Name</TableHead>
                      <TableHead>Clock In</TableHead>
                      <TableHead>Clock Out</TableHead>
                      <TableHead>Hours Worked</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.staff_name}</TableCell>
                        <TableCell>{format(new Date(record.clock_in), 'dd MMM yyyy HH:mm')}</TableCell>
                        <TableCell>
                          {record.clock_out 
                            ? format(new Date(record.clock_out), 'dd MMM yyyy HH:mm')
                            : <Badge variant="outline">Still Working</Badge>
                          }
                        </TableCell>
                        <TableCell>
                          {record.hours_worked !== null 
                            ? `${record.hours_worked} hrs`
                            : '-'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Biometric;
