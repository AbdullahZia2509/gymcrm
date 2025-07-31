import React, { useContext } from 'react';
import AlertContext from '../../context/alert/alertContext';
import { Alert as MuiAlert, Stack } from '@mui/material';

const Alert = () => {
  const alertContext = useContext(AlertContext);
  const { alerts } = alertContext;

  return (
    <Stack sx={{ width: '100%', mb: 2 }} spacing={2}>
      {alerts.length > 0 &&
        alerts.map(alert => (
          <MuiAlert 
            key={alert.id} 
            severity={alert.type} 
            variant="filled" 
            elevation={6}
          >
            {alert.msg}
          </MuiAlert>
        ))}
    </Stack>
  );
};

export default Alert;
