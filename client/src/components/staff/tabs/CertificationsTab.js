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
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  TextField,
  Typography,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import AlertContext from '../../../context/alert/alertContext';
import LoadingSpinner from '../../layout/LoadingSpinner';

const CertificationsTab = ({ staffId, certifications, setCertifications, isReadOnly }) => {
  const alertContext = useContext(AlertContext);
  const { setAlert } = alertContext;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCert, setEditingCert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [certForm, setCertForm] = useState({
    name: '',
    issuedBy: '',
    issueDate: '',
    expiryDate: '',
    description: ''
  });

  const openDialog = (cert = null) => {
    if (cert) {
      setEditingCert(cert);
      setCertForm({
        name: cert.name || '',
        issuedBy: cert.issuedBy || '',
        issueDate: cert.issueDate ? new Date(cert.issueDate).toISOString().split('T')[0] : '',
        expiryDate: cert.expiryDate ? new Date(cert.expiryDate).toISOString().split('T')[0] : '',
        description: cert.description || ''
      });
    } else {
      setEditingCert(null);
      setCertForm({
        name: '',
        issuedBy: '',
        issueDate: '',
        expiryDate: '',
        description: ''
      });
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingCert(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setCertForm({
      ...certForm,
      [name]: value
    });
  };

  const validateCertForm = () => {
    if (!certForm.name.trim()) {
      setAlert('Certification name is required', 'error');
      return false;
    }
    return true;
  };

  const handleSaveCertification = async () => {
    if (!validateCertForm()) return;

    setLoading(true);
    try {
      if (editingCert) {
        // Update existing certification
        const res = await axios.put(`/api/staff/${staffId}/certifications/${editingCert._id}`, certForm);
        
        // Update certifications list
        const updatedCertifications = certifications.map(cert => 
          cert._id === editingCert._id ? res.data : cert
        );
        setCertifications(updatedCertifications);
        
        setAlert('Certification updated successfully', 'success');
      } else {
        // Add new certification
        const res = await axios.post(`/api/staff/${staffId}/certifications`, certForm);
        
        // Add to certifications list
        setCertifications([...certifications, res.data]);
        
        setAlert('Certification added successfully', 'success');
      }
      
      closeDialog();
    } catch (err) {
      setAlert(
        err.response?.data?.msg || `Error ${editingCert ? 'updating' : 'adding'} certification`,
        'error'
      );
    }
    setLoading(false);
  };

  const handleDeleteCertification = async (certId) => {
    if (window.confirm('Are you sure you want to delete this certification?')) {
      setLoading(true);
      try {
        await axios.delete(`/api/staff/${staffId}/certifications/${certId}`);
        
        // Remove from certifications list
        const updatedCertifications = certifications.filter(cert => cert._id !== certId);
        setCertifications(updatedCertifications);
        
        setAlert('Certification deleted successfully', 'success');
      } catch (err) {
        setAlert(
          err.response?.data?.msg || 'Error deleting certification',
          'error'
        );
      }
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Certifications & Qualifications</Typography>
        {!isReadOnly && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => openDialog()}
          >
            Add Certification
          </Button>
        )}
      </Box>

      {certifications.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body2" color="textSecondary" align="center">
              No certifications added yet.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <List>
          {certifications.map((cert, index) => (
            <React.Fragment key={cert._id || index}>
              <ListItem>
                <ListItemText
                  primary={cert.name}
                  secondary={
                    <React.Fragment>
                      <Typography component="span" variant="body2" color="textPrimary">
                        Issued by: {cert.issuedBy || 'N/A'}
                      </Typography>
                      <br />
                      <Typography component="span" variant="body2">
                        Issue Date: {formatDate(cert.issueDate)}
                      </Typography>
                      <br />
                      <Typography component="span" variant="body2">
                        Expiry Date: {formatDate(cert.expiryDate)}
                      </Typography>
                      {cert.description && (
                        <>
                          <br />
                          <Typography component="span" variant="body2">
                            {cert.description}
                          </Typography>
                        </>
                      )}
                    </React.Fragment>
                  }
                />
                {!isReadOnly && (
                  <ListItemSecondaryAction>
                    <IconButton edge="end" onClick={() => openDialog(cert)} color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" onClick={() => handleDeleteCertification(cert._id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                )}
              </ListItem>
              {index < certifications.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}

      {/* Add/Edit Certification Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCert ? 'Edit Certification' : 'Add Certification'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Certification Name"
                name="name"
                value={certForm.name}
                onChange={handleFormChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Issued By"
                name="issuedBy"
                value={certForm.issuedBy}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Issue Date"
                name="issueDate"
                type="date"
                value={certForm.issueDate}
                onChange={handleFormChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Expiry Date"
                name="expiryDate"
                type="date"
                value={certForm.expiryDate}
                onChange={handleFormChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={certForm.description}
                onChange={handleFormChange}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveCertification} 
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

export default CertificationsTab;
