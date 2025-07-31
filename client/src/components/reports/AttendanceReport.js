import React, { useContext, useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  TextField, 
  Button, 
  CircularProgress,
  Divider,
  Paper
} from '@mui/material';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import ReportContext from '../../context/report/reportContext';
import AlertContext from '../../context/alert/alertContext';
import moment from 'moment';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const AttendanceReport = () => {
  const reportContext = useContext(ReportContext);
  const alertContext = useContext(AlertContext);
  
  const { attendanceReport, loading, error, getAttendanceReport } = reportContext;
  const { setAlert } = alertContext;
  
  const [period, setPeriod] = useState('daily');
  // Set start date to first day of current month
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  // Set end date to last day of current month
  const [endDate, setEndDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]);
  
  useEffect(() => {
    getAttendanceReport(period);
    // eslint-disable-next-line
  }, []);
  
  useEffect(() => {
    if (error) {
      setAlert(error, 'error');
    }
  }, [error, setAlert]);
  
  const handlePeriodChange = (e) => {
    setPeriod(e.target.value);
  };
  
  const handleGenerateReport = () => {
    const formattedStartDate = startDate ? moment(startDate).format('YYYY-MM-DD') : null;
    const formattedEndDate = endDate ? moment(endDate).format('YYYY-MM-DD') : null;
    getAttendanceReport(period, formattedStartDate, formattedEndDate);
  };
  
  // Prepare chart data for attendance over time if report is available
  const attendanceChartData = attendanceReport ? {
    labels: attendanceReport.data.map(item => item.date),
    datasets: [
      {
        label: 'Check-ins',
        data: attendanceReport.data.map(item => item.count),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1
      }
    ]
  } : null;
  
  const attendanceChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Attendance Over Time'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Check-ins'
        }
      }
    }
  };
  
  // Prepare chart data for busiest hours if report is available
  const hoursChartData = attendanceReport ? {
    labels: attendanceReport.busiestHours.map(item => {
      const hour = item.hour;
      return hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;
    }),
    datasets: [
      {
        label: 'Check-ins by Hour',
        data: attendanceReport.busiestHours.map(item => item.count),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }
    ]
  } : null;
  
  // Prepare chart data for busiest days if report is available
  const daysChartData = attendanceReport ? {
    labels: attendanceReport.busiestDays.map(item => item.day),
    datasets: [
      {
        label: 'Check-ins by Day',
        data: attendanceReport.busiestDays.map(item => item.count),
        backgroundColor: 'rgba(255, 159, 64, 0.6)',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 1
      }
    ]
  } : null;
  
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Attendance Report
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel id="period-select-label">Time Period</InputLabel>
            <Select
              labelId="period-select-label"
              id="period-select"
              value={period}
              label="Time Period"
              onChange={handlePeriodChange}
            >
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <TextField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        
        <Grid item xs={12} md={3}>
          <TextField
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Button 
            variant="contained" 
            color="primary" 
            fullWidth 
            onClick={handleGenerateReport}
            disabled={loading}
            sx={{ height: '56px' }}
          >
            {loading ? <CircularProgress size={24} /> : 'Generate Report'}
          </Button>
        </Grid>
      </Grid>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : attendanceReport ? (
        <>
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Total Check-ins
              </Typography>
              <Typography variant="h4">
                {attendanceReport.totalCheckIns}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                {moment(attendanceReport.startDate).format('MMM D, YYYY')} - {moment(attendanceReport.endDate).format('MMM D, YYYY')}
              </Typography>
            </CardContent>
          </Card>
          
          <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Attendance Over Time
            </Typography>
            <Box sx={{ height: 300 }}>
              {attendanceChartData && <Line data={attendanceChartData} options={attendanceChartOptions} />}
            </Box>
          </Paper>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Busiest Hours of Day
                </Typography>
                <Box sx={{ height: 300 }}>
                  {hoursChartData && <Bar data={hoursChartData} />}
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Busiest Days of Week
                </Typography>
                <Box sx={{ height: 300 }}>
                  {daysChartData && <Bar data={daysChartData} />}
                </Box>
              </Paper>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 4 }} />
          
          <Typography variant="h6" gutterBottom>
            Attendance Details
          </Typography>
          
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Typography variant="subtitle2" fontWeight="bold">Date</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2" fontWeight="bold">Check-ins</Typography>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 1 }} />
          
          {attendanceReport.data.map((item, index) => (
            <Grid container spacing={1} key={index} sx={{ py: 1 }}>
              <Grid item xs={6}>
                <Typography variant="body2">{item.date}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">{item.count}</Typography>
              </Grid>
            </Grid>
          ))}
        </>
      ) : (
        <Typography variant="body1" color="textSecondary" align="center">
          Generate a report to view attendance data
        </Typography>
      )}
    </Box>
  );
};

export default AttendanceReport;
