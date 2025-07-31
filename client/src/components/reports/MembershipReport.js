import React, { useContext, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
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
import { Pie, Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  ArcElement, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import ReportContext from '../../context/report/reportContext';
import AlertContext from '../../context/alert/alertContext';

// Register ChartJS components
ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const MembershipReport = () => {
  const reportContext = useContext(ReportContext);
  const alertContext = useContext(AlertContext);
  
  const { membershipReport, loading, error, getMembershipReport } = reportContext;
  const { setAlert } = alertContext;
  
  useEffect(() => {
    getMembershipReport();
    // eslint-disable-next-line
  }, []);
  
  useEffect(() => {
    if (error) {
      setAlert(error, 'error');
    }
  }, [error, setAlert]);
  
  // Prepare pie chart data for membership distribution if report is available
  const distributionChartData = membershipReport ? {
    labels: membershipReport.distribution.map(item => item.name),
    datasets: [
      {
        data: membershipReport.distribution.map(item => item.count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(199, 199, 199, 0.6)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(199, 199, 199, 1)'
        ],
        borderWidth: 1
      }
    ]
  } : null;
  
  // Prepare line chart data for membership growth if report is available
  const growthChartData = membershipReport ? {
    labels: membershipReport.growth.map(item => item.date),
    datasets: [
      {
        label: 'New Members',
        data: membershipReport.growth.map(item => item.newMembers),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1
      }
    ]
  } : null;
  
  const growthChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Membership Growth'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'New Members'
        }
      }
    }
  };
  
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Membership Report
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : membershipReport ? (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    Active Members
                  </Typography>
                  <Typography variant="h4">
                    {membershipReport.totalActiveMembers}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    Inactive Members
                  </Typography>
                  <Typography variant="h4">
                    {membershipReport.totalInactiveMembers}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Membership Distribution
                </Typography>
                <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
                  {distributionChartData && <Pie data={distributionChartData} />}
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Membership Growth (Last 6 Months)
                </Typography>
                <Box sx={{ height: 300 }}>
                  {growthChartData && <Line data={growthChartData} options={growthChartOptions} />}
                </Box>
              </Paper>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 4 }} />
          
          <Typography variant="h6" gutterBottom>
            Membership Type Breakdown
          </Typography>
          
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><Typography variant="subtitle2">Membership Type</Typography></TableCell>
                  <TableCell align="right"><Typography variant="subtitle2">Members</Typography></TableCell>
                  <TableCell align="right"><Typography variant="subtitle2">% of Total</Typography></TableCell>
                  <TableCell align="right"><Typography variant="subtitle2">Monthly Revenue</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {membershipReport.distribution.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell align="right">{item.count}</TableCell>
                    <TableCell align="right">
                      {((item.count / membershipReport.totalActiveMembers) * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell align="right">${item.revenue.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell><Typography variant="subtitle2">Total</Typography></TableCell>
                  <TableCell align="right"><Typography variant="subtitle2">{membershipReport.totalActiveMembers}</Typography></TableCell>
                  <TableCell align="right"><Typography variant="subtitle2">100%</Typography></TableCell>
                  <TableCell align="right"><Typography variant="subtitle2">
                    ${membershipReport.distribution.reduce((sum, item) => sum + item.revenue, 0).toFixed(2)}
                  </Typography></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </>
      ) : (
        <Typography variant="body1" color="textSecondary" align="center">
          Loading membership data...
        </Typography>
      )}
    </Box>
  );
};

export default MembershipReport;
