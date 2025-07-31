import React, { useContext } from 'react';
import { 
  Typography, 
  Box, 
  TextField, 
  Grid,
  Card,
  CardContent,
  Button
} from '@mui/material';
import SettingsContext from '../../context/settings/settingsContext';
import SettingItem from './SettingItem';

const GeneralSettings = ({ settings, updateSetting }) => {

  if (!settings || settings.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body1">No general settings found.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        General Settings
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        Configure your gym's basic information and operational settings.
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

export default GeneralSettings;
