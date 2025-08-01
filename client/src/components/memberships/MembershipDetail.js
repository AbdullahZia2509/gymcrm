import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
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
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import {
  Save as SaveIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
} from "@mui/icons-material";
import AlertContext from "../../context/alert/alertContext";
import AuthContext from "../../context/auth/authContext";
import { formatCurrency } from "../../utils/format";

const MembershipDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const alertContext = useContext(AlertContext);
  const authContext = useContext(AuthContext);
  const { setAlert } = alertContext;
  const { user } = authContext;

  const [membership, setMembership] = useState({
    name: "",
    description: "",
    duration: {
      value: 1,
      unit: "months",
    },
    price: 0,
    features: [],
    classesIncluded: 0,
    personalTrainingIncluded: 0,
    discounts: 0,
    isActive: true,
  });

  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [isNew, setIsNew] = useState(false);
  const [newFeature, setNewFeature] = useState("");

  useEffect(() => {
    // If id is 'new', we're creating a new membership
    if (id === "new") {
      setIsNew(true);
      setLoading(false);
    } else {
      getMembership();
    }
  }, [id]);

  // Get membership details
  const getMembership = async () => {
    try {
      const res = await axios.get(`/api/memberships/${id}`);
      setMembership(res.data);
      setLoading(false);
    } catch (err) {
      setAlert(
        err.response?.data?.msg || "Error fetching membership details",
        "error"
      );
      navigate("/memberships");
    }
  };

  // Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Handle nested objects
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setMembership({
        ...membership,
        [parent]: {
          ...membership[parent],
          [child]: value,
        },
      });
    } else if (name === "isActive") {
      // Handle boolean switch
      setMembership({
        ...membership,
        [name]: e.target.checked,
      });
    } else {
      setMembership({
        ...membership,
        [name]: value,
      });
    }
  };

  // Handle numeric input change
  const handleNumericChange = (e) => {
    const { name, value } = e.target;
    const numValue = value === "" ? 0 : parseFloat(value);

    setMembership({
      ...membership,
      [name]: numValue,
    });
  };

  // Add feature
  const addFeature = () => {
    if (newFeature.trim() === "") return;

    setMembership({
      ...membership,
      features: [...membership.features, newFeature.trim()],
    });

    setNewFeature("");
  };

  // Remove feature
  const removeFeature = (index) => {
    const updatedFeatures = [...membership.features];
    updatedFeatures.splice(index, 1);

    setMembership({
      ...membership,
      features: updatedFeatures,
    });
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!membership.name.trim()) newErrors.name = "Name is required";
    if (!membership.description.trim())
      newErrors.description = "Description is required";
    if (!membership.price) newErrors.price = "Price is required";
    if (!membership.duration.value)
      newErrors.durationValue = "Duration value is required";
    if (!membership.duration.unit)
      newErrors.durationUnit = "Duration unit is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setAlert("Please fix the errors in the form", "error");
      return;
    }

    try {
      let res;

      if (isNew) {
        res = await axios.post("/api/memberships", membership);
        setAlert("Membership created successfully", "success");
      } else {
        res = await axios.put(`/api/memberships/${id}`, membership);
        setAlert("Membership updated successfully", "success");
      }

      navigate(`/memberships/${res.data._id}`);
    } catch (err) {
      setAlert(
        err.response?.data?.msg ||
          `Error ${isNew ? "creating" : "updating"} membership`,
        "error"
      );
    }
  };

  // Handle delete membership
  const handleDeleteMembership = async () => {
    try {
      await axios.delete(`/api/memberships/${id}`);
      setAlert("Membership deleted successfully", "success");
      navigate("/memberships");
    } catch (err) {
      setAlert(err.response?.data?.msg || "Error deleting membership", "error");
    }
  };

  // Open delete confirmation dialog
  const openDeleteDialog = () => {
    setDeleteDialogOpen(true);
  };

  // Close delete confirmation dialog
  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Typography>Loading membership details...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box mb={4}>
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate("/memberships")}
            >
              Back to Memberships
            </Button>
            <Typography variant="h4" component="h1" gutterBottom>
              {isNew ? "Add New Membership" : membership.name}
            </Typography>
          </Grid>
          <Grid item>
            {!isNew && (user?.role === "admin" || user?.role === "manager") && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={openDeleteDialog}
                sx={{ mr: 2 }}
              >
                Delete
              </Button>
            )}
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSubmit}
            >
              Save
            </Button>
          </Grid>
        </Grid>
      </Box>

      <Card>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={membership.isActive}
                    onChange={handleChange}
                    name="isActive"
                    color="primary"
                  />
                }
                label={
                  membership.isActive
                    ? "Active Membership"
                    : "Inactive Membership"
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Membership Name"
                name="name"
                value={membership.name}
                onChange={handleChange}
                error={!!errors.name}
                helperText={errors.name}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Price"
                name="price"
                type="number"
                value={membership.price}
                onChange={handleNumericChange}
                error={!!errors.price}
                helperText={errors.price}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">Rs.</InputAdornment>
                  ),
                }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={membership.description}
                onChange={handleChange}
                error={!!errors.description}
                helperText={errors.description}
                multiline
                rows={3}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Duration
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Duration Value"
                name="duration.value"
                type="number"
                value={membership.duration.value}
                onChange={handleChange}
                error={!!errors.durationValue}
                helperText={errors.durationValue}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.durationUnit} required>
                <InputLabel id="duration-unit-label">Duration Unit</InputLabel>
                <Select
                  labelId="duration-unit-label"
                  name="duration.unit"
                  value={membership.duration.unit}
                  label="Duration Unit"
                  onChange={handleChange}
                >
                  <MenuItem value="days">Days</MenuItem>
                  <MenuItem value="weeks">Weeks</MenuItem>
                  <MenuItem value="months">Months</MenuItem>
                  <MenuItem value="years">Years</MenuItem>
                </Select>
                {errors.durationUnit && (
                  <FormHelperText>{errors.durationUnit}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Divider />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Classes Included"
                name="classesIncluded"
                type="number"
                value={membership.classesIncluded}
                onChange={handleNumericChange}
                helperText="Number of classes included per month (0 for unlimited)"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Personal Training Sessions"
                name="personalTrainingIncluded"
                type="number"
                value={membership.personalTrainingIncluded}
                onChange={handleNumericChange}
                helperText="Number of PT sessions included per month"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Discount (%)"
                name="discounts"
                type="number"
                value={membership.discounts}
                onChange={handleNumericChange}
                helperText="Discount percentage on additional services"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">%</InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Divider />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Features
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                {membership.features.map((feature, index) => (
                  <Chip
                    key={index}
                    label={feature}
                    onDelete={() => removeFeature(index)}
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Box>
              <Grid container spacing={1} alignItems="center">
                <Grid item xs>
                  <TextField
                    fullWidth
                    label="Add Feature"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addFeature();
                      }
                    }}
                  />
                </Grid>
                <Grid item>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={addFeature}
                    startIcon={<AddIcon />}
                  >
                    Add
                  </Button>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog}>
        <DialogTitle>Delete Membership</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {membership.name}? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteMembership} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MembershipDetail;
