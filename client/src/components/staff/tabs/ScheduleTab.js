import React, { useState, useContext } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import AlertContext from '../../../context/alert/alertContext';
import LoadingSpinner from '../../layout/LoadingSpinner';

const ScheduleTab = ({ staffId, schedule, setSchedule, isReadOnly }) => {
  const alertContext = useContext(AlertContext);
  const { setAlert } = alertContext;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [loading, setLoading] = useState(false);
  const [shiftForm, setShiftForm] = useState({
    day: '',
    startTime: '',
    endTime: '',
    location: ''
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const openDialog = (shift = null) => {
    if (shift) {
      setEditingShift(shift);
      setShiftForm({
        day: shift.day || '',
        startTime: shift.startTime || '',
        endTime: shift.endTime || '',
        location: shift.location || ''
      });
    } else {
      setEditingShift(null);
      setShiftForm({
        day: '',
        startTime: '',
        endTime: '',
        location: ''
      });
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingShift(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setShiftForm({
      ...shiftForm,
      [name]: value
    });
  };

  const validateShiftForm = () => {
    if (!shiftForm.day) {
      setAlert('Day is required', 'error');
      return false;
    }
    if (!shiftForm.startTime) {
      setAlert('Start time is required', 'error');
      return false;
    }
    if (!shiftForm.endTime) {
      setAlert('End time is required', 'error');
      return false;
    }
    return true;
  };

  const handleSaveShift = async () => {
    if (!validateShiftForm()) return;

    setLoading(true);
    try {
      if (editingShift) {
        // Update existing shift
        const res = await axios.put(`/api/staff/${staffId}/schedule/${editingShift._id}`, shiftForm);
        
        // Update schedule list
        const updatedSchedule = schedule.map(shift => 
          shift._id === editingShift._id ? res.data : shift
        );
        setSchedule(updatedSchedule);
        
        setAlert('Schedule shift updated successfully', 'success');
      } else {
        // Add new shift
        const res = await axios.post(`/api/staff/${staffId}/schedule`, shiftForm);
        
        // Add to schedule list
        setSchedule([...schedule, res.data]);
        
        setAlert('Schedule shift added successfully', 'success');
      }
      
      closeDialog();
    } catch (err) {
      setAlert(
        err.response?.data?.msg || `Error ${editingShift ? 'updating' : 'adding'} schedule shift`,
        'error'
      );
    }
    setLoading(false);
  };

  const handleDeleteShift = async (shiftId) => {
    if (window.confirm('Are you sure you want to delete this shift?')) {
      setLoading(true);
      try {
        await axios.delete(`/api/staff/${staffId}/schedule/${shiftId}`);
        
        // Remove from schedule list
        const updatedSchedule = schedule.filter(shift => shift._id !== shiftId);
        setSchedule(updatedSchedule);
        
        setAlert('Schedule shift deleted successfully', 'success');
      } catch (err) {
        setAlert(
          err.response?.data?.msg || 'Error deleting schedule shift',
          'error'
        );
      }
      setLoading(false);
    }
  };

  // Sort schedule by day of week
  const sortedSchedule = [...schedule].sort((a, b) => {
    const dayOrder = {
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6,
      'Sunday': 7
    };
    return dayOrder[a.day] - dayOrder[b.day];
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Work Schedule</Typography>
        {!isReadOnly && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => openDialog()}
          >
            Add Shift
          </Button>
        )}
      </Box>

      {sortedSchedule.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body2" color="textSecondary" align="center">
              No schedule shifts added yet.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Day</TableCell>
                <TableCell>Start Time</TableCell>
                <TableCell>End Time</TableCell>
                <TableCell>Location</TableCell>
                {!isReadOnly && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedSchedule.map((shift) => (
                <TableRow key={shift._id}>
                  <TableCell>{shift.day}</TableCell>
                  <TableCell>{shift.startTime}</TableCell>
                  <TableCell>{shift.endTime}</TableCell>
                  <TableCell>{shift.location || 'Main Gym'}</TableCell>
                  {!isReadOnly && (
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => openDialog(shift)} color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteShift(shift._id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit Shift Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingShift ? 'Edit Schedule Shift' : 'Add Schedule Shift'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Day</InputLabel>
                <Select
                  name="day"
                  value={shiftForm.day}
                  onChange={handleFormChange}
                  label="Day"
                >
                  {days.map((day) => (
                    <MenuItem key={day} value={day}>
                      {day}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Start Time"
                name="startTime"
                type="time"
                value={shiftForm.startTime}
                onChange={handleFormChange}
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  step: 300, // 5 min
                }}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="End Time"
                name="endTime"
                type="time"
                value={shiftForm.endTime}
                onChange={handleFormChange}
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  step: 300, // 5 min
                }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                name="location"
                value={shiftForm.location}
                onChange={handleFormChange}
                placeholder="Main Gym"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveShift} 
            color="primary" 
            variant="contained"
            disabled={loading}
          >
            {loading ? <LoadingSpinner size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ScheduleTab;
