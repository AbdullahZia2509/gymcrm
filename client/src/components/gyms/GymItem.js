import React from 'react';
import PropTypes from 'prop-types';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  Grid,
  IconButton,
  Link,
  Typography,
  Chip
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon
} from '@mui/icons-material';

const GymItem = ({ gym, onEdit, onDelete }) => {
  const { _id, name, contactEmail, contactPhone, address } = gym;

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" color="primary" gutterBottom>
          {name}
        </Typography>
        <Divider sx={{ my: 1 }} />
        <Grid container spacing={2}>
          {contactEmail && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2">{contactEmail}</Typography>
              </Box>
            </Grid>
          )}
          {contactPhone && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2">{contactPhone}</Typography>
              </Box>
            </Grid>
          )}
          {address && address.city && address.state && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2">{address.city}, {address.state}</Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
        <Button
          component={RouterLink}
          to={`/gyms/${_id}/users`}
          startIcon={<PeopleIcon />}
          size="small"
          variant="outlined"
        >
          View Users
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton size="small" color="primary" onClick={onEdit}>
          <EditIcon />
        </IconButton>
        <IconButton size="small" color="error" onClick={onDelete}>
          <DeleteIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
};

GymItem.propTypes = {
  gym: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

export default GymItem;
