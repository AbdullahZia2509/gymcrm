import React, { useState } from 'react';
import { Box, Typography, Paper, Tabs, Tab, Container } from '@mui/material';
import RevenueReport from './RevenueReport';
import MembershipReport from './MembershipReport';
import AttendanceReport from './AttendanceReport';
import ClassesReport from './ClassesReport';

const Reports = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="xl">
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Gym Reports
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          Generate and view detailed reports on revenue, memberships, attendance, and classes.
        </Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            aria-label="report tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Revenue" />
            <Tab label="Membership" />
            <Tab label="Attendance" />
            <Tab label="Classes" />
          </Tabs>
        </Box>
        
        <TabPanel value={activeTab} index={0}>
          <RevenueReport />
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <MembershipReport />
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          <AttendanceReport />
        </TabPanel>
        <TabPanel value={activeTab} index={3}>
          <ClassesReport />
        </TabPanel>
      </Paper>
    </Container>
  );
};

// TabPanel component for handling tab content
const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`report-tabpanel-${index}`}
      aria-labelledby={`report-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box>
          {children}
        </Box>
      )}
    </div>
  );
};

export default Reports;
