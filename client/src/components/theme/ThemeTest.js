import React, { useContext } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper,
  Switch,
  FormControlLabel,
  Container,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ThemeContext from '../../context/theme/themeContext';

const ThemeTest = () => {
  const themeContext = useContext(ThemeContext);
  const { mode, primaryColor, secondaryColor, setThemeMode } = themeContext;
  const theme = useTheme();

  const handleModeToggle = () => {
    setThemeMode(mode === 'light' ? 'dark' : 'light');
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, my: 4 }}>
        <Typography variant="h4" gutterBottom>Theme System Test</Typography>
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>Current Theme Settings</Typography>
          <Typography>Mode: {mode}</Typography>
          <Typography>Primary Color: {primaryColor}</Typography>
          <Typography>Secondary Color: {secondaryColor}</Typography>
          
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch 
                  checked={mode === 'dark'} 
                  onChange={handleModeToggle}
                  color="primary"
                />
              }
              label={mode === 'dark' ? "Dark Mode" : "Light Mode"}
            />
          </Box>
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom>
                  Primary Color
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button variant="contained" color="primary">
                    Primary Button
                  </Button>
                  <Button variant="outlined" color="primary">
                    Outlined
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="secondary" gutterBottom>
                  Secondary Color
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button variant="contained" color="secondary">
                    Secondary Button
                  </Button>
                  <Button variant="outlined" color="secondary">
                    Outlined
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default ThemeTest;
