import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormHelperText,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Paper,
  Divider,
  CardHeader,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Event as EventIcon
} from '@mui/icons-material';
import AlertContext from '../../context/alert/alertContext';
import AuthContext from '../../context/auth/authContext';
import LoadingSpinner from '../layout/LoadingSpinner';
import DeleteConfirmDialog from '../common/DeleteConfirmDialog';

const ClassDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const alertContext = useContext(AlertContext);
  const authContext = useContext(AuthContext);
  const { setAlert } = alertContext;
  const { user } = authContext;

  const isNew = id === 'new';
  const isEdit = window.location.pathname.includes('/edit');
  const isReadOnly = !isNew && !isEdit;

  // Check if user has permission to modify classes
  const canModify = user && (user.role === 'admin' || user.role === 'manager');

  const [classData, setClassData] = useState({
    name: '',
    description: '',
    category: '',
    duration: 60, // Changed from durationMinutes to match backend model
    capacity: 20,
    difficulty: 'beginner', // Changed from difficultyLevel to match backend model
    equipment: '',
    image: '', // Changed from imageUrl to match backend model
    isActive: true
  });

  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    console.log('ClassDetail component mounted, id:', id, 'isNew:', isNew);
    
    const init = async () => {
      try {
        setLoading(true);
        
        // Ensure auth token is set in axios headers
        if (localStorage.token) {
          axios.defaults.headers.common['x-auth-token'] = localStorage.token;
        }
        
        // Load instructors for the dropdown
        const instructorsRes = await axios.get('/api/staff?role=trainer');
        setInstructors(instructorsRes.data);
        
        // If not a new class, load the class data
        if (!isNew && id) {
          await loadData();
        } else {
          // For new class, just set loading to false
          console.log('Creating a new class, setting loading to false');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error in init:', err);
        setAlert('Error initializing form. Please try again.', 'error');
        setLoading(false);
      }
    };
    
    init();
    // eslint-disable-next-line
  }, [id, isNew]);

  const loadData = async () => {
    try {
      console.log('loadData called, id:', id);
      setLoading(true);
      
      // Fetch the class data for an existing class
      const classRes = await axios.get(`/api/classes/${id}`);
      setClassData(classRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Error loading class data:', err);
      
      // If class not found, navigate back to classes list
      if (err.response?.status === 404) {
        setAlert('Class not found', 'error');
        navigate('/classes');
      } else {
        setAlert(err.response?.data?.msg || 'Error loading class data', 'error');
      }
      
      // Always set loading to false, even on error
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'duration' || name === 'capacity') {
      // Convert to number for numeric fields
      setClassData({
        ...classData,
        [name]: value === '' ? '' : Number(value)
      });
    } else {
      setClassData({
        ...classData,
        [name]: value
      });
    }
    
    // Clear error for this field if any
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!classData.name.trim()) {
      newErrors.name = 'Class name is required';
    }
    
    if (!classData.category.trim()) {
      newErrors.category = 'Category is required';
    }
    
    if (!classData.duration) {
      newErrors.duration = 'Duration is required';
    } else if (classData.duration <= 0) {
      newErrors.duration = 'Duration must be greater than 0';
    }
    
    if (!classData.capacity) {
      newErrors.capacity = 'Capacity is required';
    } else if (classData.capacity <= 0) {
      newErrors.capacity = 'Capacity must be greater than 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      if (isNew) {
        await axios.post('/api/classes', classData);
        setAlert('Class created successfully', 'success');
      } else {
        await axios.put(`/api/classes/${id}`, classData);
        setAlert('Class updated successfully', 'success');
      }
      
      navigate('/classes');
    } catch (err) {
      setAlert(
        err.response?.data?.msg || `Error ${isNew ? 'creating' : 'updating'} class`,
        'error'
      );
    }
  };

  const openDeleteDialog = () => {
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await axios.delete(`/api/classes/${id}`);
      setAlert('Class deleted successfully', 'success');
      navigate('/classes');
    } catch (err) {
      setAlert(
        err.response?.data?.msg || 'Error deleting class',
        'error'
      );
      setDeleteLoading(false);
      closeDeleteDialog();
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  // Check if user has permission to access this page
  if (!isReadOnly && !canModify) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 5, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1" gutterBottom>
            You do not have permission to modify classes.
          </Typography>
          <Button
            component={Link}
            to="/classes"
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
          >
            Back to Classes
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 3, mb: 4 }}>
        <Button
          component={Link}
          to="/classes"
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 2 }}
        >
          Back to Classes
        </Button>
        
        <Typography variant="h4" component="h1" gutterBottom>
          {isNew ? 'Create Class' : isEdit ? 'Edit Class' : 'Class Details'}
        </Typography>
      </Box>

      <form onSubmit={handleSubmit}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Class Name"
                  name="name"
                  value={classData.name}
                  onChange={handleChange}
                  error={!!errors.name}
                  helperText={errors.name}
                  disabled={isReadOnly}
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Category"
                  name="category"
                  value={classData.category}
                  onChange={handleChange}
                  error={!!errors.category}
                  helperText={errors.category}
                  disabled={isReadOnly}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Duration (minutes)"
                  name="duration"
                  type="number"
                  value={classData.duration}
                  onChange={handleChange}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">min</InputAdornment>,
                  }}
                  error={!!errors.duration}
                  helperText={errors.duration}
                  disabled={isReadOnly}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Capacity"
                  name="capacity"
                  type="number"
                  value={classData.capacity}
                  onChange={handleChange}
                  InputProps={{
                    inputProps: { min: 1 }
                  }}
                  error={!!errors.capacity}
                  helperText={errors.capacity}
                  disabled={isReadOnly}
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Instructor</InputLabel>
                  <Select
                    name="instructor"
                    value={classData.instructor || ''}
                    onChange={handleChange}
                    label="Instructor"
                    disabled={isReadOnly}
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
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Difficulty Level</InputLabel>
                  <Select
                    name="difficulty"
                    value={classData.difficulty}
                    onChange={handleChange}
                    label="Difficulty Level"
                    disabled={isReadOnly}
                  >
                    <MenuItem value="beginner">Beginner</MenuItem>
                    <MenuItem value="intermediate">Intermediate</MenuItem>
                    <MenuItem value="advanced">Advanced</MenuItem>
                    <MenuItem value="all_levels">All Levels</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={classData.description}
                  onChange={handleChange}
                  multiline
                  rows={3}
                  disabled={isReadOnly}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Required Equipment"
                  name="equipment"
                  value={classData.equipment}
                  onChange={handleChange}
                  disabled={isReadOnly}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Image URL"
                  name="image"
                  value={classData.image}
                  onChange={handleChange}
                  disabled={isReadOnly}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="isActive"
                    value={classData.isActive}
                    onChange={handleChange}
                    label="Status"
                    disabled={isReadOnly}
                  >
                    <MenuItem value={true}>Active</MenuItem>
                    <MenuItem value={false}>Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {!isReadOnly && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            {!isNew && (
              <Button
                variant="outlined"
                color="error"
                onClick={openDeleteDialog}
                startIcon={<DeleteIcon />}
              >
                Delete Class
              </Button>
            )}
            <Box>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                sx={{ mr: 2 }}
              >
                {isNew ? 'Create' : 'Update'} Class
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/classes')}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        )}
      </form>

      {!isNew && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Button
            component={Link}
            to={`/classes/${id}/sessions`}
            variant="contained"
            color="secondary"
            startIcon={<EventIcon />}
          >
            Manage Sessions
          </Button>
          
          {!isEdit && canModify && (
            <Box>
              <Button
                component={Link}
                to={`/classes/${id}/edit`}
                variant="contained"
                color="primary"
                sx={{ mr: 2 }}
              >
                Edit Class
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={openDeleteDialog}
              >
                Delete Class
              </Button>
            </Box>
          )}
        </Box>
      )}

      {/* Delete dialog is handled by the Dialog component below */}
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Delete Class
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this class? This action cannot be undone.
            Note that you cannot delete a class that has existing sessions.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            variant="contained"
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ClassDetail;
