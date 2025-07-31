import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  People as PeopleIcon,
  Event as EventIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import AlertContext from '../../context/alert/alertContext';
import AuthContext from '../../context/auth/authContext';
import LoadingSpinner from '../layout/LoadingSpinner';
import DeleteConfirmDialog from '../common/DeleteConfirmDialog';
import { formatDate } from '../../utils/format';

const ClassSessions = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const alertContext = useContext(AlertContext);
  const authContext = useContext(AuthContext);
  const { setAlert } = alertContext;
  const { user } = authContext;

  // Check if user has permission to modify classes
  const canModify = user && (user.role === 'admin' || user.role === 'manager');

  const [classData, setClassData] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // New session form
  const [newSessionDialogOpen, setNewSessionDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [sessionForm, setSessionForm] = useState({
    startTime: new Date(),
    instructor: '',
    capacity: 0,
    notes: '',
    isActive: true
  });
  const [instructors, setInstructors] = useState([]);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (authContext.isAuthenticated) {
      loadData();
    }
    // eslint-disable-next-line
  }, [authContext.isAuthenticated]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load class details
      const classRes = await axios.get(`/api/classes/${id}`);
      setClassData(classRes.data);
      
      // Set default capacity from class
      setSessionForm(prev => ({
        ...prev,
        capacity: classRes.data.capacity || 0,
        instructor: classRes.data.instructor || ''
      }));
      
      // Load class sessions
      const sessionsRes = await axios.get(`/api/classes/${id}/sessions`);
      setSessions(sessionsRes.data);
      
      // Load instructors (staff with trainer role)
      const instructorsRes = await axios.get('/api/staff?role=trainer');
      setInstructors(instructorsRes.data);
      
      setLoading(false);
    } catch (err) {
      setAlert(
        err.response?.data?.msg || 'Error loading data',
        'error'
      );
      setLoading(false);
      
      // Navigate back to classes list if class not found
      if (err.response?.status === 404) {
        navigate('/classes');
      }
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const openDeleteDialog = (session) => {
    setSessionToDelete(session);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSessionToDelete(null);
  };

  const deleteSession = async () => {
    if (!sessionToDelete) return;
    
    try {
      await axios.delete(`/api/classes/sessions/${sessionToDelete._id}`);
      setAlert('Class session deleted successfully', 'success');
      loadData();
      closeDeleteDialog();
    } catch (err) {
      setAlert(
        err.response?.data?.msg || 'Error deleting class session',
        'error'
      );
    }
  };

  const openNewSessionDialog = () => {
    setEditingSession(null);
    setSessionForm({
      startTime: new Date(),
      instructor: classData?.instructor || '',
      capacity: classData?.capacity || 0,
      notes: '',
      isActive: true
    });
    setFormErrors({});
    setNewSessionDialogOpen(true);
  };

  const openEditSessionDialog = (session) => {
    setEditingSession(session);
    setSessionForm({
      startTime: new Date(session.startTime),
      instructor: session.instructor || classData?.instructor || '',
      capacity: session.capacity || classData?.capacity || 0,
      notes: session.notes || '',
      isActive: session.isActive !== false
    });
    setFormErrors({});
    setNewSessionDialogOpen(true);
  };

  const closeNewSessionDialog = () => {
    setNewSessionDialogOpen(false);
  };

  const handleSessionFormChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'capacity') {
      // Convert to number for numeric fields
      setSessionForm({
        ...sessionForm,
        [name]: value === '' ? '' : Number(value)
      });
    } else {
      setSessionForm({
        ...sessionForm,
        [name]: value
      });
    }
    
    // Clear error for this field if any
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  const handleDateChange = (date) => {
    setSessionForm({
      ...sessionForm,
      startTime: date
    });
    
    // Clear error for this field if any
    if (formErrors.startTime) {
      setFormErrors({
        ...formErrors,
        startTime: ''
      });
    }
  };

  const validateSessionForm = () => {
    const errors = {};
    
    if (!sessionForm.startTime) {
      errors.startTime = 'Start time is required';
    }
    
    if (!sessionForm.capacity || sessionForm.capacity <= 0) {
      errors.capacity = 'Capacity must be greater than 0';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveSession = async () => {
    if (!validateSessionForm()) {
      return;
    }
    
    try {
      const sessionData = {
        ...sessionForm,
        class: id
      };
      
      if (editingSession) {
        // Update existing session
        await axios.put(`/api/classes/sessions/${editingSession._id}`, sessionData);
        setAlert('Class session updated successfully', 'success');
      } else {
        // Create new session
        await axios.post(`/api/classes/${id}/sessions`, sessionData);
        setAlert('Class session created successfully', 'success');
      }
      
      loadData();
      closeNewSessionDialog();
    } catch (err) {
      setAlert(
        err.response?.data?.msg || `Error ${editingSession ? 'updating' : 'creating'} class session`,
        'error'
      );
    }
  };

  const getSessionStatusChip = (session) => {
    const now = new Date();
    const sessionTime = new Date(session.startTime);
    
    if (!session.isActive) {
      return <Chip label="Cancelled" color="error" size="small" />;
    }
    
    if (sessionTime < now) {
      return <Chip label="Completed" color="default" size="small" />;
    }
    
    return <Chip label="Upcoming" color="success" size="small" />;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 3, mb: 4 }}>
        <Button
          component={Link}
          to={`/classes/${id}`}
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 2 }}
        >
          Back to Class Details
        </Button>
        
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            <Typography variant="h4" component="h1" gutterBottom>
              {classData?.name} - Sessions
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {classData?.category} | {classData?.durationMinutes} minutes
            </Typography>
          </Grid>
          {canModify && (
            <Grid item>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={openNewSessionDialog}
              >
                Add Session
              </Button>
            </Grid>
          )}
        </Grid>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Date & Time</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Instructor</TableCell>
                <TableCell>Capacity</TableCell>
                <TableCell>Enrolled</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sessions.length > 0 ? (
                sessions
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((session) => (
                    <TableRow key={session._id}>
                      <TableCell>{formatDate(session.startTime, true)}</TableCell>
                      <TableCell>{getSessionStatusChip(session)}</TableCell>
                      <TableCell>
                        {session.instructor ? 
                          (typeof session.instructor === 'object' ? 
                            `${session.instructor.firstName} ${session.instructor.lastName}` : 
                            'Assigned Instructor') : 
                          'Not Assigned'}
                      </TableCell>
                      <TableCell>{session.capacity || classData?.capacity}</TableCell>
                      <TableCell>
                        {session.enrolledMembers ? session.enrolledMembers.length : 0} / 
                        {session.capacity || classData?.capacity}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          component={Link}
                          to={`/classes/sessions/${session._id}`}
                          size="small"
                          color="info"
                          title="View Details"
                        >
                          <PeopleIcon fontSize="small" />
                        </IconButton>
                        {canModify && (
                          <>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => openEditSessionDialog(session)}
                              title="Edit"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => openDeleteDialog(session)}
                              title="Delete"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No sessions found for this class
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={sessions.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={deleteSession}
        title="Confirm Delete"
        content={
          <>
            Are you sure you want to delete this class session?
            {sessionToDelete && (
              <Box component="span" sx={{ display: 'block', mt: 1, fontWeight: 'bold' }}>
                {formatDate(sessionToDelete.startTime, true)}
              </Box>
            )}
            This action cannot be undone and will remove all member enrollments for this session.
          </>
        }
      />

      {/* New/Edit Session Dialog */}
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Dialog
          open={newSessionDialogOpen}
          onClose={closeNewSessionDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {editingSession ? 'Edit Class Session' : 'New Class Session'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 0 }}>
              <Grid item xs={12}>
                <DateTimePicker
                  label="Start Time"
                  value={sessionForm.startTime}
                  onChange={handleDateChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={!!formErrors.startTime}
                      helperText={formErrors.startTime}
                      required
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Instructor</InputLabel>
                  <Select
                    name="instructor"
                    value={sessionForm.instructor || ''}
                    onChange={handleSessionFormChange}
                    label="Instructor"
                  >
                    <MenuItem value="">
                      <em>Not Assigned</em>
                    </MenuItem>
                    {instructors.map((instructor) => (
                      <MenuItem key={instructor._id} value={instructor._id}>
                        {instructor.firstName} {instructor.lastName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Capacity"
                  name="capacity"
                  type="number"
                  value={sessionForm.capacity}
                  onChange={handleSessionFormChange}
                  error={!!formErrors.capacity}
                  helperText={formErrors.capacity}
                  required
                  InputProps={{
                    inputProps: { min: 1 }
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  name="notes"
                  value={sessionForm.notes}
                  onChange={handleSessionFormChange}
                  multiline
                  rows={2}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="isActive"
                    value={sessionForm.isActive}
                    onChange={handleSessionFormChange}
                    label="Status"
                  >
                    <MenuItem value={true}>Active</MenuItem>
                    <MenuItem value={false}>Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeNewSessionDialog}>Cancel</Button>
            <Button
              onClick={saveSession}
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
            >
              {editingSession ? 'Update Session' : 'Create Session'}
            </Button>
          </DialogActions>
        </Dialog>
      </LocalizationProvider>
    </Container>
  );
};

export default ClassSessions;
