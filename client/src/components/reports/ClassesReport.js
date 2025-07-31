import React, { useContext, useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  CircularProgress,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement,
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import ReportContext from '../../context/report/reportContext';
import AlertContext from '../../context/alert/alertContext';
import moment from 'moment';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ClassesReport = () => {
  const reportContext = useContext(ReportContext);
  const alertContext = useContext(AlertContext);
  
  const { classesReport, loading, error, getClassesReport } = reportContext;
  const { setAlert } = alertContext;
  
  const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  
  useEffect(() => {
    getClassesReport();
    // eslint-disable-next-line
  }, []);
  
  useEffect(() => {
    if (error) {
      setAlert(error, 'error');
    }
  }, [error, setAlert]);
  
  const handleGenerateReport = () => {
    const formattedStartDate = startDate ? moment(startDate).format('YYYY-MM-DD') : null;
    const formattedEndDate = endDate ? moment(endDate).format('YYYY-MM-DD') : null;
    getClassesReport(formattedStartDate, formattedEndDate);
  };
  
  // Prepare chart data for class performance if report is available
  const classChartData = classesReport ? {
    labels: classesReport.classPerformance.map(item => item.className),
    datasets: [
      {
        label: 'Total Attendance',
        data: classesReport.classPerformance.map(item => item.totalAttendance),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      },
      {
        label: 'Sessions',
        data: classesReport.classPerformance.map(item => item.sessions),
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1
      }
    ]
  } : null;
  
  const classChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Class Performance'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Count'
        }
      }
    }
  };
  
  // Prepare chart data for instructor performance if report is available
  const instructorChartData = classesReport ? {
    labels: classesReport.instructorPerformance.map(item => item.instructorName),
    datasets: [
      {
        label: 'Average Attendance',
        data: classesReport.instructorPerformance.map(item => item.averageAttendance),
        backgroundColor: 'rgba(255, 159, 64, 0.6)',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 1
      }
    ]
  } : null;
  
  const instructorChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Instructor Performance (Average Attendance)'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Average Attendance'
        }
      }
    }
  };
  
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Classes Report
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <TextField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <TextField
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        
        <Grid item xs={12} md={4}>
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
      ) : classesReport ? (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    Total Sessions
                  </Typography>
                  <Typography variant="h4">
                    {classesReport.totalSessions}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    Total Attendance
                  </Typography>
                  <Typography variant="h4">
                    {classesReport.totalAttendance}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    Average Class Size
                  </Typography>
                  <Typography variant="h4">
                    {classesReport.totalSessions > 0 
                      ? (classesReport.totalAttendance / classesReport.totalSessions).toFixed(1) 
                      : '0.0'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Class Performance
            </Typography>
            <Box sx={{ height: 300, mb: 2 }}>
              {classChartData && <Bar data={classChartData} options={classChartOptions} />}
            </Box>
          </Paper>
          
          <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Instructor Performance
            </Typography>
            <Box sx={{ height: 300, mb: 2 }}>
              {instructorChartData && <Bar data={instructorChartData} options={instructorChartOptions} />}
            </Box>
          </Paper>
          
          <Divider sx={{ my: 4 }} />
          
          <Typography variant="h6" gutterBottom>
            Class Performance Details
          </Typography>
          
          <TableContainer component={Paper} sx={{ mb: 4 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><Typography variant="subtitle2">Class Name</Typography></TableCell>
                  <TableCell align="right"><Typography variant="subtitle2">Sessions</Typography></TableCell>
                  <TableCell align="right"><Typography variant="subtitle2">Total Attendance</Typography></TableCell>
                  <TableCell align="right"><Typography variant="subtitle2">Average Attendance</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {classesReport.classPerformance.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.className}</TableCell>
                    <TableCell align="right">{item.sessions}</TableCell>
                    <TableCell align="right">{item.totalAttendance}</TableCell>
                    <TableCell align="right">{item.averageAttendance}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Typography variant="h6" gutterBottom>
            Instructor Performance Details
          </Typography>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><Typography variant="subtitle2">Instructor</Typography></TableCell>
                  <TableCell align="right"><Typography variant="subtitle2">Sessions</Typography></TableCell>
                  <TableCell align="right"><Typography variant="subtitle2">Total Attendance</Typography></TableCell>
                  <TableCell align="right"><Typography variant="subtitle2">Average Attendance</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {classesReport.instructorPerformance.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.instructorName}</TableCell>
                    <TableCell align="right">{item.sessions}</TableCell>
                    <TableCell align="right">{item.totalAttendance}</TableCell>
                    <TableCell align="right">{item.averageAttendance}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      ) : (
        <Typography variant="body1" color="textSecondary" align="center">
          Generate a report to view class performance data
        </Typography>
      )}
    </Box>
  );
};

export default ClassesReport;
