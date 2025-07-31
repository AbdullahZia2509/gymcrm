import React, { useState, useContext, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Grid,
  TextField,
  Button,
  Divider,
  Card,
  CardContent,
  CardActions,
  IconButton,
  InputAdornment
} from '@mui/material';
import { styled } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import AuthContext from '../../context/auth/authContext';
import AlertContext from '../../context/alert/alertContext';
import axios from 'axios';

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: theme.spacing(12),
  height: theme.spacing(12),
  marginBottom: theme.spacing(2),
  backgroundColor: theme.palette.primary.main
}));

const Profile = () => {
  const authContext = useContext(AuthContext);
  const alertContext = useContext(AlertContext);
  const { user, loading, loadUser } = authContext;
  const { setAlert } = alertContext;

  const [editing, setEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  }, [user]);

  const handleChange = e => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setChangingPassword(false);
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  };

  const handleSave = async () => {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json'
        }
      };

      // Update user profile
      if (editing && !changingPassword) {
        const res = await axios.put(`/api/users/${user._id}`, {
          name: profileData.name,
          email: profileData.email
        }, config);

        if (res.data) {
          setAlert('Profile updated successfully', 'success');
          loadUser(); // Reload user data
          setEditing(false);
        }
      }

      // Change password
      if (changingPassword) {
        if (profileData.newPassword !== profileData.confirmPassword) {
          return setAlert('New passwords do not match', 'error');
        }

        const res = await axios.put(`/api/users/${user._id}/change-password`, {
          currentPassword: profileData.currentPassword,
          newPassword: profileData.newPassword
        }, config);

        if (res.data) {
          setAlert('Password changed successfully', 'success');
          setChangingPassword(false);
          setEditing(false);
          setProfileData({
            ...profileData,
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
        }
      }
    } catch (err) {
      setAlert(err.response?.data?.msg || 'Error updating profile', 'error');
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const toggleChangePassword = () => {
    setChangingPassword(!changingPassword);
  };

  if (loading || !user) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Profile
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
            <StyledAvatar>
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </StyledAvatar>
            <Typography variant="h5" gutterBottom>
              {user.name}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {user.email}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" sx={{ mb: 1 }}>
              Role: <strong>{user.role && user.role.charAt(0).toUpperCase() + user.role.slice(1)}</strong>
            </Typography>
            <Typography variant="body2">
              Account Created: <strong>{new Date(user.createdAt).toLocaleDateString()}</strong>
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Account Information</Typography>
                {!editing ? (
                  <IconButton onClick={handleEdit} color="primary">
                    <EditIcon />
                  </IconButton>
                ) : null}
              </Box>
              <Divider sx={{ mb: 3 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Name"
                    name="name"
                    value={profileData.name}
                    onChange={handleChange}
                    disabled={!editing}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={profileData.email}
                    onChange={handleChange}
                    disabled={!editing}
                    margin="normal"
                  />
                </Grid>
              </Grid>

              {editing && (
                <>
                  <Box sx={{ mt: 3, mb: 2 }}>
                    <Button
                      variant={changingPassword ? "contained" : "outlined"}
                      color={changingPassword ? "primary" : "secondary"}
                      onClick={toggleChangePassword}
                    >
                      {changingPassword ? "Cancel Password Change" : "Change Password"}
                    </Button>
                  </Box>

                  {changingPassword && (
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Current Password"
                          name="currentPassword"
                          type={showPassword ? "text" : "password"}
                          value={profileData.currentPassword}
                          onChange={handleChange}
                          margin="normal"
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton onClick={toggleShowPassword}>
                                  {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                </IconButton>
                              </InputAdornment>
                            )
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="New Password"
                          name="newPassword"
                          type={showPassword ? "text" : "password"}
                          value={profileData.newPassword}
                          onChange={handleChange}
                          margin="normal"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Confirm New Password"
                          name="confirmPassword"
                          type={showPassword ? "text" : "password"}
                          value={profileData.confirmPassword}
                          onChange={handleChange}
                          margin="normal"
                          error={profileData.newPassword !== profileData.confirmPassword && profileData.confirmPassword !== ''}
                          helperText={profileData.newPassword !== profileData.confirmPassword && profileData.confirmPassword !== '' ? "Passwords don't match" : ""}
                        />
                      </Grid>
                    </Grid>
                  )}
                </>
              )}
            </CardContent>
            {editing && (
              <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  sx={{ mr: 1 }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                >
                  Save Changes
                </Button>
              </CardActions>
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;
