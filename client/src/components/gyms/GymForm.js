import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Divider,
  Grid,
  TextField,
  Typography
} from '@mui/material';

const GymForm = ({ addGym, updateGym, currentGym, clearCurrentGym }) => {
  const [gym, setGym] = useState({
    name: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }
  });
  
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (currentGym !== null) {
      setGym(currentGym);
    } else {
      setGym({
        name: '',
        description: '',
        contactEmail: '',
        contactPhone: '',
        website: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        }
      });
    }
  }, [currentGym]);

  const { name, description, contactEmail, contactPhone, website } = gym;
  const { street, city, state, zipCode, country } = gym.address || {};

  const onChange = e => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setGym({
        ...gym,
        address: {
          ...gym.address,
          [addressField]: value
        }
      });
    } else {
      setGym({ ...gym, [name]: value });
    }
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const onSubmit = e => {
    e.preventDefault();
    
    // Validate form
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!contactEmail.trim()) newErrors.contactEmail = 'Email is required';
    if (contactEmail && !/^\S+@\S+\.\S+$/.test(contactEmail)) {
      newErrors.contactEmail = 'Please enter a valid email';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (currentGym === null) {
      addGym(gym);
    } else {
      updateGym(gym);
    }

    // Clear form
    setGym({
      name: '',
      description: '',
      contactEmail: '',
      contactPhone: '',
      website: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      }
    });
    setErrors({});
  };

  return (
    <Box component="form" onSubmit={onSubmit} noValidate>
      <Typography variant="h6" color="primary" gutterBottom>
        {currentGym ? 'Edit Gym' : 'Add Gym'}
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Name*"
            name="name"
            value={name}
            onChange={onChange}
            error={!!errors.name}
            helperText={errors.name || ''}
            required
            size="small"
            variant="outlined"
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={description || ''}
            onChange={onChange}
            multiline
            rows={3}
            size="small"
            variant="outlined"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Contact Email*"
            name="contactEmail"
            type="email"
            value={contactEmail}
            onChange={onChange}
            error={!!errors.contactEmail}
            helperText={errors.contactEmail || ''}
            required
            size="small"
            variant="outlined"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Contact Phone"
            name="contactPhone"
            value={contactPhone || ''}
            onChange={onChange}
            size="small"
            variant="outlined"
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Website"
            name="website"
            value={website || ''}
            onChange={onChange}
            size="small"
            variant="outlined"
          />
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="subtitle1" color="primary" sx={{ mt: 2, mb: 1 }}>
            Address
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Street"
            name="address.street"
            value={street || ''}
            onChange={onChange}
            size="small"
            variant="outlined"
          />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="City"
            name="address.city"
            value={city || ''}
            onChange={onChange}
            size="small"
            variant="outlined"
          />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="State"
            name="address.state"
            value={state || ''}
            onChange={onChange}
            size="small"
            variant="outlined"
          />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Zip Code"
            name="address.zipCode"
            value={zipCode || ''}
            onChange={onChange}
            size="small"
            variant="outlined"
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Country"
            name="address.country"
            value={country || ''}
            onChange={onChange}
            size="small"
            variant="outlined"
          />
        </Grid>
        
        <Grid item xs={12} sx={{ mt: 2 }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
          >
            {currentGym ? 'Update Gym' : 'Add Gym'}
          </Button>
        </Grid>
        
        {currentGym && (
          <Grid item xs={12}>
            <Button
              variant="outlined"
              color="secondary"
              fullWidth
              onClick={clearCurrentGym}
              sx={{ mt: 1 }}
            >
              Cancel
            </Button>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

GymForm.propTypes = {
  addGym: PropTypes.func.isRequired,
  updateGym: PropTypes.func.isRequired,
  clearCurrentGym: PropTypes.func.isRequired,
  currentGym: PropTypes.object
};

export default GymForm;
