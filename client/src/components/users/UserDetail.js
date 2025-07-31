import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Security as SecurityIcon,
  CalendarToday as CalendarIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import AuthContext from '../../context/auth/authContext';
import AlertContext from '../../context/alert/alertContext';
import axios from 'axios';

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const alertContext = useContext(AlertContext);
  const { user } = authContext;
  const { setAlert } = alertContext;

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [statusDialog, setStatusDialog] = useState(false);

  // Check if current user is admin or viewing their own profile
  const isAdmin = user && user.role === 'admin';
  const isManager = user && (user.role === 'admin' || user.role === 'manager');
  const isSelf = user && user._id === id;
  const canEdit = isAdmin || isSelf;
  const canDelete = isAdmin && !isSelf;

  useEffect(() => {
    if (!isManager && !isSelf) {
      setAlert('Not authorized to view this user', 'error');
      navigate('/');
      return;
    }

    fetchUserData();
    // eslint-disable-next-line
  }, [id]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/users/${id}`);
      setUserData(res.data);
      setLoading(false);
    } catch (err) {
      setAlert(err.response?.data?.msg || 'Error fetching user data', 'error');
      setLoading(false);
      navigate('/users');
    }
  };

  const handleEdit = () => {
    navigate(`/users/edit/${id}`);
  };

  const openDeleteDialog = () => {
    setDeleteDialog(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialog(false);
  };

  const openStatusDialog = () => {
    setStatusDialog(true);
  };

  const closeStatusDialog = () => {
    setStatusDialog(false);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/users/${id}`);
      setAlert('User deleted successfully', 'success');
      navigate('/users');
    } catch (err) {
      setAlert(err.response?.data?.msg || 'Error deleting user', 'error');
      closeDeleteDialog();
    }
  };

  const handleToggleStatus = async () => {
    try {
      const updatedStatus = !userData.isActive;
      await axios.put(`/api/users/${id}`, {
        isActive: updatedStatus
      });
      setAlert(`User ${updatedStatus ? 'activated' : 'deactivated'} successfully`, 'success');
      fetchUserData();
      closeStatusDialog();
    } catch (err) {
      setAlert(err.response?.data?.msg || 'Error updating user status', 'error');
      closeStatusDialog();
    }
  };

  const handleBack = () => {
    navigate('/users');
  };

  // Get role color
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'manager':
        return 'warning';
      case 'staff':
        return 'info';
      case 'trainer':
        return 'success';
      default:
        return 'default';
    }
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (!userData) {
    return <Typography>User not found</Typography>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          Back to Users
        </Button>
        <Box>
          {isAdmin && !isSelf && (
            <Button
              variant="outlined"
              color={userData.isActive ? 'warning' : 'success'}
              startIcon={userData.isActive ? <BlockIcon /> : <CheckCircleIcon />}
              onClick={openStatusDialog}
              sx={{ mr: 1 }}
            >
              {userData.isActive ? 'Deactivate' : 'Activate'}
            </Button>
          )}
          {canEdit && (
            <Button
              variant="outlined"
              color="primary"
              startIcon={<EditIcon />}
              onClick={handleEdit}
              sx={{ mr: 1 }}
            >
              Edit
            </Button>
          )}
          {canDelete && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={openDeleteDialog}
            >
              Delete
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card elevation={3}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  margin: '0 auto 16px',
                  bgcolor: getRoleColor(userData.role),
                  fontSize: '2.5rem'
                }}
              >
                {userData.name.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="h5" gutterBottom>
                {userData.name}
              </Typography>
              <Chip
                label={userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
                color={getRoleColor(userData.role)}
                sx={{ mb: 1 }}
              />
              <Box sx={{ mt: 1 }}>
                <Chip
                  label={userData.isActive ? 'Active' : 'Inactive'}
                  color={userData.isActive ? 'success' : 'default'}
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              User Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List>
              <ListItem>
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText primary="Name" secondary={userData.name} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <EmailIcon />
                </ListItemIcon>
                <ListItemText primary="Email" secondary={userData.email} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <SecurityIcon />
                </ListItemIcon>
                <ListItemText primary="Role" secondary={userData.role.charAt(0).toUpperCase() + userData.role.slice(1)} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CalendarIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Account Created" 
                  secondary={new Date(userData.createdAt).toLocaleString()}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CalendarIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Last Updated" 
                  secondary={new Date(userData.updatedAt).toLocaleString()}
                />
              </ListItem>
            </List>
          </Paper>

          {userData.staff && (
            <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Linked Staff Member
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ mr: 2 }}>
                  {userData.staff.firstName ? userData.staff.firstName.charAt(0) : 'S'}
                </Avatar>
                <Box>
                  <Typography variant="body1">
                    {userData.staff.firstName} {userData.staff.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {userData.staff.position}
                  </Typography>
                </Box>
                <Button 
                  variant="outlined" 
                  size="small" 
                  sx={{ ml: 'auto' }}
                  onClick={() => navigate(`/staff/${userData.staff._id}`)}
                >
                  View Staff Profile
                </Button>
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog}
        onClose={closeDeleteDialog}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete user {userData.name}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog
        open={statusDialog}
        onClose={closeStatusDialog}
      >
        <DialogTitle>Confirm Status Change</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to {userData.isActive ? 'deactivate' : 'activate'} user {userData.name}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeStatusDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleToggleStatus} color={userData.isActive ? 'warning' : 'success'}>
            {userData.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserDetail;
