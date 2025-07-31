import React, { useEffect, useContext, useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Tabs, 
  Tab, 
  Paper, 
  CircularProgress,
  Button
} from '@mui/material';
import SettingsContext from '../../context/settings/settingsContext';
import AlertContext from '../../context/alert/alertContext';
import AuthContext from '../../context/auth/authContext';
import GeneralSettings from './GeneralSettings';
import NotificationSettings from './NotificationSettings';
import BillingSettings from './BillingSettings';
import AppearanceSettings from './AppearanceSettings';
import SystemSettings from './SystemSettings';

const Settings = () => {
  const settingsContext = useContext(SettingsContext);
  const alertContext = useContext(AlertContext);
  const authContext = useContext(AuthContext);
  
  const { 
    settings, 
    loading, 
    error, 
    initialized,
    getSettings, 
    updateSetting,
    initializeSettings,
    clearErrors 
  } = settingsContext;
  
  const { setAlert } = alertContext;
  const { user } = authContext;
  
  const [tabValue, setTabValue] = useState(0);
  
  // Check if user is admin or manager
  const isAdmin = user && (user.role === 'admin' || user.role === 'manager');
  
  useEffect(() => {
    const loadSettings = async () => {
      try {
        await getSettings();
      } catch (error) {
        console.error('Failed to load settings:', error);
        setAlert('Failed to load settings. Please try again later.', 'error');
      }
    };
    
    loadSettings();
    // eslint-disable-next-line
  }, []);
  
  useEffect(() => {
    if (error) {
      setAlert(error, 'error');
    }
    // eslint-disable-next-line
  }, [error]);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleInitializeSettings = () => {
    initializeSettings();
  };
  
  // Define tab content based on category
  const renderTabContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (error) {
      return (
        <Box sx={{ mt: 4 }}>
          <Paper sx={{ p: 3, bgcolor: '#fff9f9', border: '1px solid #ffcccc' }}>
            <Typography color="error" variant="h6">Error Loading Settings</Typography>
            <Typography color="error">{error}</Typography>
            <Button 
              variant="contained" 
              color="primary" 
              sx={{ mt: 2 }}
              onClick={() => {
                clearErrors();
                getSettings();
              }}
            >
              Retry
            </Button>
          </Paper>
        </Box>
      );
    }
    
    if (!settings) {
      return (
        <Box sx={{ mt: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography>No settings found. Initialize default settings to get started.</Typography>
          </Paper>
        </Box>
      );
    }
    
    switch (tabValue) {
      case 0:
        return <GeneralSettings settings={settings.general || []} updateSetting={updateSetting} />;
      case 1:
        return <NotificationSettings settings={settings.notifications || []} updateSetting={updateSetting} />;
      case 2:
        return <BillingSettings settings={settings.billing || []} updateSetting={updateSetting} />;
      case 3:
        return <AppearanceSettings settings={settings.appearance || []} updateSetting={updateSetting} />;
      case 4:
        return isAdmin ? <SystemSettings settings={settings.system || []} updateSetting={updateSetting} /> : null;
      default:
        return <GeneralSettings settings={settings.general || []} updateSetting={updateSetting} />;
    }
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Settings
        </Typography>
        {isAdmin && (
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleInitializeSettings}
            disabled={loading}
          >
            Initialize Default Settings
          </Button>
        )}
      </Box>
      
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="General" />
          <Tab label="Notifications" />
          <Tab label="Billing" />
          <Tab label="Appearance" />
          {isAdmin && <Tab label="System" />}
        </Tabs>
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        {renderTabContent()}
      </Paper>
    </Container>
  );
};

export default Settings;
