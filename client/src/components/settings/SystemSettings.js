import React from 'react';
import { 
  Typography, 
  Box, 
  Grid,
  Alert
} from '@mui/material';
import SettingItem from './SettingItem';

const SystemSettings = ({ settings, updateSetting }) => {
  if (!settings || settings.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body1">No system settings found.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        System Settings
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        Configure system-level settings for your gym application.
      </Typography>

      <Alert severity="warning" sx={{ mb: 3 }}>
        These settings are for administrators only. Changing these values may affect system functionality.
      </Alert>

      <Grid container spacing={3}>
        {settings.map(setting => (
          <Grid item xs={12} md={6} key={setting.key}>
            <SettingItem setting={setting} updateSetting={updateSetting} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default SystemSettings;
