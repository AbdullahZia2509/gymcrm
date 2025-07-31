import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
  Paper,
  CircularProgress,
  Divider,
  Avatar
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import AuthContext from '../../context/auth/authContext';
import AlertContext from '../../context/alert/alertContext';
import axios from 'axios';

const UserForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const alertContext = useContext(AlertContext);
  const { user } = authContext;
  const { setAlert } = alertContext;

  const isEdit = Boolean(id);
  const formTitle = isEdit ? 'Edit User' : 'Add User';

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    isActive: true,
    avatar: '',
    gym: user?.gym || '' // Initialize with current user's gym
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  // Check if current user is admin
  const isAdmin = user && user.role === 'admin';

  useEffect(() => {
    if (!isAdmin) {
      setAlert('Not authorized to manage users', 'error');
      navigate('/');
      return;
    }

    fetchStaffList();

    if (isEdit) {
      fetchUserData();
    }
    // eslint-disable-next-line
  }, [id]);

  const fetchStaffList = async () => {
    try {
      setLoadingStaff(true);
      const res = await axios.get('/api/staff');
      // Filter out staff that already have user accounts
      setStaffList(res.data);
      setLoadingStaff(false);
    } catch (err) {
      setAlert(err.response?.data?.msg || 'Error fetching staff list', 'error');
      setLoadingStaff(false);
    }
  };

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/users/${id}`);
      const userData = res.data;
      
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        password: '', // Don't populate password for security
        role: userData.role || 'staff',
        isActive: userData.isActive !== undefined ? userData.isActive : true,
        staff: userData.staff?._id || '',
        avatar: userData.avatar || ''
      });
      
      setLoading(false);
    } catch (err) {
      setAlert(err.response?.data?.msg || 'Error fetching user data', 'error');
      setLoading(false);
      navigate('/users');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!isEdit && !formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (!isEdit && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.role) {
      newErrors.role = 'Role is required';
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
      setLoading(true);
      
      // Remove password if it's empty in edit mode
      const submitData = { ...formData };
      if (isEdit && !submitData.password) {
        delete submitData.password;
      }
      
      // Ensure gym is set to the admin's gym for new users
      if (!isEdit && user && user.gym) {
        submitData.gym = user.gym;
      }
      
      if (isEdit) {
        await axios.put(`/api/users/${id}`, submitData);
        setAlert('User updated successfully', 'success');
      } else {
        await axios.post('/api/users', submitData);
        setAlert('User created successfully', 'success');
      }
      
      navigate('/users');
    } catch (err) {
      const errorMsg = err.response?.data?.msg || 
                      (err.response?.data?.errors ? err.response.data.errors[0].msg : 'Error saving user');
      setAlert(errorMsg, 'error');
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        {formTitle}
      </Typography>
      
      <Paper sx={{ p: 3, mt: 2 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={Boolean(errors.name)}
                helperText={errors.name}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={Boolean(errors.email)}
                helperText={errors.email}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={isEdit ? "New Password (leave blank to keep current)" : "Password"}
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                error={Boolean(errors.password)}
                helperText={errors.password}
                required={!isEdit}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={Boolean(errors.role)}>
                <InputLabel>Role</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  label="Role"
                  required
                >
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="manager">Manager</MenuItem>
                  <MenuItem value="staff">Staff</MenuItem>
                  <MenuItem value="trainer">Trainer</MenuItem>
                </Select>
                {errors.role && <FormHelperText>{errors.role}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="isActive"
                  value={formData.isActive}
                  onChange={handleChange}
                  label="Status"
                >
                  <MenuItem value={true}>Active</MenuItem>
                  <MenuItem value={false}>Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={loadingStaff}>
                <InputLabel>Link to Staff (Optional)</InputLabel>
                <Select
                  name="staff"
                  value={formData.staff || ''}
                  onChange={handleChange}
                  label="Link to Staff (Optional)"
                >
                  <MenuItem value="">None</MenuItem>
                  {staffList.map(staff => (
                    <MenuItem key={staff._id} value={staff._id}>
                      {staff.firstName} {staff.lastName} - {staff.position}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>Link this user account to a staff member</FormHelperText>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Avatar URL (Optional)"
                name="avatar"
                value={formData.avatar || ''}
                onChange={handleChange}
                helperText="URL to user's profile picture"
              />
            </Grid>
            
            {formData.avatar && (
              <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar 
                  src={formData.avatar} 
                  alt="Avatar Preview" 
                  sx={{ width: 100, height: 100, mr: 2 }}
                />
                <Typography variant="body2" color="textSecondary">
                  Avatar Preview
                </Typography>
              </Grid>
            )}
          </Grid>
          
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              variant="contained" 
              color="primary" 
              type="submit" 
              startIcon={<SaveIcon />}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save User'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default UserForm;
