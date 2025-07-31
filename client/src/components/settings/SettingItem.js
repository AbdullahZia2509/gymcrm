import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  TextField, 
  Switch, 
  FormControlLabel,
  Button,
  Box,
  Tooltip,
  IconButton
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

const SettingItem = ({ setting, updateSetting }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(setting.value);
  
  const handleEdit = () => {
    setEditValue(setting.value);
    setIsEditing(true);
  };
  
  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(setting.value);
  };
  
  const handleSave = async () => {
    const success = await updateSetting(setting.key, {
      value: editValue
    });
    
    if (success) {
      setIsEditing(false);
    }
  };
  
  const handleChange = (e) => {
    const { type, checked, value } = e.target;
    if (type === 'checkbox') {
      setEditValue(checked);
    } else {
      setEditValue(value);
    }
  };
  
  const renderEditControl = () => {
    switch (setting.type) {
      case 'boolean':
        return (
          <FormControlLabel
            control={
              <Switch
                checked={editValue}
                onChange={handleChange}
                color="primary"
              />
            }
            label={editValue ? 'Enabled' : 'Disabled'}
          />
        );
      case 'number':
        return (
          <TextField
            fullWidth
            type="number"
            value={editValue}
            onChange={handleChange}
            variant="outlined"
            size="small"
          />
        );
      case 'object':
        // For objects, we'll show a simplified representation
        return (
          <TextField
            fullWidth
            multiline
            rows={4}
            value={JSON.stringify(editValue, null, 2)}
            onChange={(e) => {
              try {
                setEditValue(JSON.parse(e.target.value));
              } catch (err) {
                // If not valid JSON, just store as string
                setEditValue(e.target.value);
              }
            }}
            variant="outlined"
            size="small"
          />
        );
      case 'array':
        // For arrays, we'll show a simplified representation
        return (
          <TextField
            fullWidth
            multiline
            rows={4}
            value={JSON.stringify(editValue, null, 2)}
            onChange={(e) => {
              try {
                setEditValue(JSON.parse(e.target.value));
              } catch (err) {
                // If not valid JSON, just store as string
                setEditValue(e.target.value);
              }
            }}
            variant="outlined"
            size="small"
          />
        );
      case 'string':
      default:
        return (
          <TextField
            fullWidth
            value={editValue}
            onChange={handleChange}
            variant="outlined"
            size="small"
          />
        );
    }
  };
  
  const renderDisplayValue = () => {
    switch (setting.type) {
      case 'boolean':
        return setting.value ? 'Enabled' : 'Disabled';
      case 'object':
      case 'array':
        return (
          <pre style={{ 
            whiteSpace: 'pre-wrap', 
            wordBreak: 'break-word',
            fontSize: '0.8rem',
            background: '#f5f5f5',
            padding: '8px',
            borderRadius: '4px',
            maxHeight: '100px',
            overflow: 'auto'
          }}>
            {JSON.stringify(setting.value, null, 2)}
          </pre>
        );
      default:
        return String(setting.value);
    }
  };
  
  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle1" component="h3">
            {setting.label}
            {setting.description && (
              <Tooltip title={setting.description}>
                <IconButton size="small" sx={{ ml: 0.5 }}>
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Typography>
          
          {!isEditing ? (
            <IconButton size="small" onClick={handleEdit}>
              <EditIcon fontSize="small" />
            </IconButton>
          ) : (
            <Box>
              <IconButton size="small" onClick={handleSave} color="primary">
                <SaveIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={handleCancel} color="error">
                <CancelIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Box>
        
        {isEditing ? (
          renderEditControl()
        ) : (
          <Box sx={{ mt: 1 }}>
            {renderDisplayValue()}
          </Box>
        )}
        
        <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
          {setting.isPublic ? 'Public setting' : 'Admin-only setting'}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default SettingItem;
