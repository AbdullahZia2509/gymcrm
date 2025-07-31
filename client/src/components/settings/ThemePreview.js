import React, { useContext } from 'react';
import { 
  Box, 
  Paper, 
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ThemeContext from '../../context/theme/themeContext';

const ThemePreview = () => {
  const themeContext = useContext(ThemeContext);
  const { mode, primaryColor, secondaryColor } = themeContext;
  const theme = useTheme();

  return (
    <Card sx={{ mb: 3, overflow: 'hidden' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Theme Preview
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          This is how your current theme looks.
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 2, 
          p: 2, 
          bgcolor: theme.palette.background.default,
          borderRadius: 1
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Current Mode: {mode === 'dark' ? 'Dark' : 'Light'}</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Box sx={{ 
                width: 24, 
                height: 24, 
                bgcolor: primaryColor,
                borderRadius: '50%',
                border: '1px solid rgba(0,0,0,0.12)'
              }} />
              <Box sx={{ 
                width: 24, 
                height: 24, 
                bgcolor: secondaryColor,
                borderRadius: '50%',
                border: '1px solid rgba(0,0,0,0.12)'
              }} />
            </Box>
          </Box>
          
          <Divider />
          
          <Box>
            <Typography variant="h5" color="primary" gutterBottom>Primary Color</Typography>
            <Typography variant="body1" paragraph>
              This text uses the primary color.
            </Typography>
            <Button variant="contained" color="primary" sx={{ mr: 1 }}>
              Primary Button
            </Button>
            <Button variant="outlined" color="primary">
              Outlined
            </Button>
          </Box>
          
          <Box>
            <Typography variant="h5" color="secondary" gutterBottom>Secondary Color</Typography>
            <Typography variant="body1" paragraph>
              Interface elements can use the secondary color.
            </Typography>
            <Button variant="contained" color="secondary" sx={{ mr: 1 }}>
              Secondary Button
            </Button>
            <Button variant="outlined" color="secondary">
              Outlined
            </Button>
          </Box>
          
          <Paper elevation={3} sx={{ p: 2, mt: 2 }}>
            <Typography variant="h6" gutterBottom>Paper Component</Typography>
            <Typography variant="body2">
              This is how cards and elevated surfaces appear with your theme.
            </Typography>
          </Paper>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ThemePreview;
