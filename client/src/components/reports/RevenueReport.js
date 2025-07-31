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
  Divider
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import ReportContext from '../../context/report/reportContext';
import AlertContext from '../../context/alert/alertContext';
import moment from 'moment';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const RevenueReport = () => {
  const reportContext = useContext(ReportContext);
  const alertContext = useContext(AlertContext);
  
  const { revenueReport, loading, error, getRevenueReport } = reportContext;
  const { setAlert } = alertContext;
  
  const [period, setPeriod] = useState('monthly');
  // Set start date to first day of current month
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  // Set end date to last day of current month
  const [endDate, setEndDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]);
  
  useEffect(() => {
    getRevenueReport(period);
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
    getRevenueReport(period, formattedStartDate, formattedEndDate);
  };
  
  // Prepare chart data if report is available
  const chartData = revenueReport ? {
    labels: revenueReport.data.map(item => item.date),
    datasets: [
      {
        label: 'Revenue',
        data: revenueReport.data.map(item => item.totalRevenue),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1
      }
    ]
  } : null;
  
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Revenue Over Time'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Amount ($)'
        }
      }
    }
  };
  
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Revenue Report
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
      ) : revenueReport ? (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    Total Revenue
                  </Typography>
                  <Typography variant="h4">
                    ${revenueReport.totalRevenue.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    Total Payments
                  </Typography>
                  <Typography variant="h4">
                    {revenueReport.totalPayments}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    Average Payment
                  </Typography>
                  <Typography variant="h4">
                    ${revenueReport.totalPayments > 0 
                      ? (revenueReport.totalRevenue / revenueReport.totalPayments).toFixed(2) 
                      : '0.00'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 4 }} />
          
          <Box sx={{ height: 400, mb: 4 }}>
            {chartData && <Line data={chartData} options={chartOptions} />}
          </Box>
          
          <Typography variant="h6" gutterBottom>
            Revenue Details
          </Typography>
          
          <Grid container spacing={1}>
            <Grid item xs={4}>
              <Typography variant="subtitle2" fontWeight="bold">Date</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="subtitle2" fontWeight="bold">Revenue</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="subtitle2" fontWeight="bold">Payments</Typography>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 1 }} />
          
          {revenueReport.data.map((item, index) => (
            <Grid container spacing={1} key={index} sx={{ py: 1 }}>
              <Grid item xs={4}>
                <Typography variant="body2">{item.date}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2">${item.totalRevenue.toFixed(2)}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2">{item.count}</Typography>
              </Grid>
            </Grid>
          ))}
        </>
      ) : (
        <Typography variant="body1" color="textSecondary" align="center">
          Generate a report to view revenue data
        </Typography>
      )}
    </Box>
  );
};

export default RevenueReport;
