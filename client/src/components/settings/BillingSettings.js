import React from 'react';
import { 
  Typography, 
  Box, 
  Grid
} from '@mui/material';
import SettingItem from './SettingItem';

const BillingSettings = ({ settings, updateSetting }) => {
  if (!settings || settings.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body1">No billing settings found.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Billing Settings
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        Configure payment and billing settings for your gym.
      </Typography>

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

export default BillingSettings;
