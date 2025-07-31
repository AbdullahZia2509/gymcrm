import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, Link, Link as RouterLink } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Switch,
  FormControlLabel,
  Avatar,
  Chip,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Event as EventIcon,
  Badge as BadgeIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import AlertContext from "../../context/alert/alertContext";
import AuthContext from "../../context/auth/authContext";
import LoadingSpinner from "../layout/LoadingSpinner";
// Import tab components
import CertificationsTab from "./tabs/CertificationsTab";
import ScheduleTab from "./tabs/ScheduleTab";

const StaffDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const alertContext = useContext(AlertContext);
  const authContext = useContext(AuthContext);
  const { setAlert } = alertContext;
  const { user } = authContext;

  // Check if this is a new staff member
  const isNew = id === "new" || window.location.pathname.includes("/new");
  const isEdit = window.location.pathname.includes("/edit");
  const isReadOnly = !isNew && !isEdit;
  
  console.log("StaffDetail state:", {
    id,
    isNew,
    isEdit,
    isReadOnly,
    path: window.location.pathname
  });

  // Check if user has permission to modify staff
  const canModify = user && (user.role === "admin" || user.role === "manager");
  console.log('User object:', user, 'canModify:', canModify);

  const [staffData, setStaffData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    position: "",
    specializations: [],
    hireDate: "",
    isActive: true,
    notes: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
    emergencyContact: {
      name: "",
      relationship: "",
      phone: "",
    },
    salary: {
      amount: "",
      paymentFrequency: "monthly",
    },
    createUser: false,
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [certifications, setCertifications] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [specialization, setSpecialization] = useState("");

  useEffect(() => {
    console.log("StaffDetail useEffect - id:", id, "isNew:", isNew);

    // For new staff, just set loading to false
    if (isNew) {
      console.log("New staff member, skipping data loading");
      setLoading(false);
    } else if (id) {
      // For existing staff, load data
      loadData();
    } else {
      // Fallback
      console.log("No id provided, setting loading to false");
      setLoading(false);
    }

    // eslint-disable-next-line
  }, [id, isNew]);

  const loadData = async () => {
    try {
      console.log("Loading staff data for ID:", id);
      setLoading(true);

      // Skip API call for new staff member
      if (isNew) {
        console.log("New staff member, skipping API call");
        setLoading(false);
        return;
      }

      const res = await axios.get(`/api/staff/${id}`);
      const staffMember = res.data;
      console.log("Staff data loaded:", staffMember);

      setStaffData({
        firstName: staffMember.firstName || "",
        lastName: staffMember.lastName || "",
        email: staffMember.email || "",
        phone: staffMember.phone || "",
        position: staffMember.position || "",
        specializations: staffMember.specializations || [],
        hireDate: staffMember.hireDate
          ? new Date(staffMember.hireDate).toISOString().split("T")[0]
          : "",
        isActive:
          staffMember.isActive !== undefined ? staffMember.isActive : true,
        notes: staffMember.notes || "",
        address: {
          street: staffMember.address?.street || "",
          city: staffMember.address?.city || "",
          state: staffMember.address?.state || "",
          zipCode: staffMember.address?.zipCode || "",
          country: staffMember.address?.country || "",
        },
        emergencyContact: {
          name: staffMember.emergencyContact?.name || "",
          relationship: staffMember.emergencyContact?.relationship || "",
          phone: staffMember.emergencyContact?.phone || "",
        },
        salary: {
          amount: staffMember.salary?.amount || "",
          paymentFrequency: staffMember.salary?.paymentFrequency || "monthly",
        },
        createUser: false,
      });

      setCertifications(staffMember.certifications || []);
      setSchedule(staffMember.schedule || []);

      setLoading(false);
    } catch (err) {
      console.error("Error loading staff data:", err);

      if (err.response?.status === 404) {
        setAlert("Staff member not found", "error");
        navigate("/staff");
      } else {
        setAlert(
          err.response?.data?.msg || "Error loading staff data",
          "error"
        );
      }

      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setStaffData({
        ...staffData,
        [parent]: {
          ...staffData[parent],
          [child]: value,
        },
      });
    } else if (name === "isActive" || name === "createUser") {
      setStaffData({
        ...staffData,
        [name]: e.target.checked,
      });
    } else {
      setStaffData({
        ...staffData,
        [name]: value,
      });
    }

    // Clear error for this field if any
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!staffData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!staffData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!staffData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(staffData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!staffData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }

    if (!staffData.position) {
      newErrors.position = "Position is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const staffPayload = {
        ...staffData,
        certifications,
        schedule,
      };

      if (isNew) {
        await axios.post("/api/staff", staffPayload);
        setAlert("Staff member created successfully", "success");
      } else {
        await axios.put(`/api/staff/${id}`, staffPayload);
        setAlert("Staff member updated successfully", "success");
      }

      navigate("/staff");
    } catch (err) {
      setAlert(
        err.response?.data?.msg ||
          `Error ${isNew ? "creating" : "updating"} staff member`,
        "error"
      );
      setSubmitting(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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
      await axios.delete(`/api/staff/${id}`);
      setAlert("Staff member deleted successfully", "success");
      navigate("/staff");
    } catch (err) {
      setAlert(
        err.response?.data?.msg || "Error deleting staff member",
        "error"
      );
      setDeleteLoading(false);
      closeDeleteDialog();
    }
  };

  const addSpecialization = () => {
    if (specialization.trim() !== "") {
      setStaffData({
        ...staffData,
        specializations: [...staffData.specializations, specialization.trim()],
      });
      setSpecialization("");
    }
  };

  const removeSpecialization = (index) => {
    const newSpecializations = [...staffData.specializations];
    newSpecializations.splice(index, 1);
    setStaffData({
      ...staffData,
      specializations: newSpecializations,
    });
  };

  // Certification handlers will be implemented in a separate component

  // Schedule handlers will be implemented in a separate component

  if (loading) {
    return <LoadingSpinner />;
  }

  // Check if user has permission to access this page
  // Only check permissions for edit/create operations, not for viewing
  if ((isNew || isEdit) && !canModify) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 5, textAlign: "center" }}>
          <Typography variant="h5" color="error" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1" gutterBottom>
            You do not have permission to modify staff records.
          </Typography>
          <Button
            component={Link}
            to="/staff"
            variant="contained"
            color="primary"
            startIcon={<ArrowBackIcon />}
          >
            Back to Staff List
          </Button>
        </Box>
      </Container>
    );
  }

  // Show access denied message for unauthorized users trying to create/edit
  if ((isNew || isEdit) && !canModify) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" color="error" gutterBottom>
              Access Denied
            </Typography>
            <Typography variant="body1">
              You do not have permission to {isNew ? "create" : "edit"} staff members.
            </Typography>
            <Button
              component={RouterLink}
              to="/staff"
              startIcon={<ArrowBackIcon />}
              sx={{ mt: 2 }}
            >
              Back to Staff List
            </Button>
          </Paper>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Button
              component={RouterLink}
              to="/staff"
              startIcon={<ArrowBackIcon />}
              sx={{ mr: 2 }}
            >
              Back
            </Button>
            <Typography variant="h4" component="h1">
              {isNew
                ? "Add New Staff Member"
                : `${staffData.firstName} ${staffData.lastName}`}
            </Typography>
          </Box>
          {!isNew && (
            <Box>
              {isReadOnly && canModify && (
                <Button
                  component={RouterLink}
                  to={`/staff/${id}/edit`}
                  variant="contained"
                  color="primary"
                  startIcon={<EditIcon />}
                  sx={{ mr: 1 }}
                >
                  Edit
                </Button>
              )}
              {isReadOnly && canModify && (
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
          )}
        </Box>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="scrollable"
              scrollButtons="auto"
              aria-label="staff tabs"
            >
              <Tab
                label="Basic Info"
                icon={<PersonIcon />}
                iconPosition="start"
              />
              <Tab
                label="Contact & Address"
                icon={<BadgeIcon />}
                iconPosition="start"
              />
              <Tab
                label="Employment"
                icon={<EventIcon />}
                iconPosition="start"
              />
              {!isNew && (
                <Tab
                  label="Certifications"
                  icon={<BadgeIcon />}
                  iconPosition="start"
                />
              )}
              {!isNew && (
                <Tab
                  label="Schedule"
                  icon={<ScheduleIcon />}
                  iconPosition="start"
                />
              )}
            </Tabs>
          </Box>

          <Box>
            {/* Basic Info Tab */}
            {tabValue === 0 && (
              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Personal Information
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      name="firstName"
                      value={staffData.firstName}
                      onChange={handleChange}
                      error={!!errors.firstName}
                      helperText={errors.firstName}
                      disabled={isReadOnly}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      name="lastName"
                      value={staffData.lastName}
                      onChange={handleChange}
                      error={!!errors.lastName}
                      helperText={errors.lastName}
                      disabled={isReadOnly}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      type="email"
                      value={staffData.email}
                      onChange={handleChange}
                      error={!!errors.email}
                      helperText={errors.email}
                      disabled={isReadOnly}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Phone"
                      name="phone"
                      value={staffData.phone}
                      onChange={handleChange}
                      error={!!errors.phone}
                      helperText={errors.phone}
                      disabled={isReadOnly}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl
                      fullWidth
                      error={!!errors.position}
                      required
                      disabled={isReadOnly}
                    >
                      <InputLabel>Position</InputLabel>
                      <Select
                        name="position"
                        value={staffData.position}
                        onChange={handleChange}
                        label="Position"
                      >
                        <MenuItem value="manager">Manager</MenuItem>
                        <MenuItem value="trainer">Trainer</MenuItem>
                        <MenuItem value="receptionist">Receptionist</MenuItem>
                        <MenuItem value="maintenance">Maintenance</MenuItem>
                        <MenuItem value="nutritionist">Nutritionist</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                      </Select>
                      {errors.position && (
                        <FormHelperText>{errors.position}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={staffData.isActive}
                          onChange={handleChange}
                          name="isActive"
                          color="primary"
                          disabled={isReadOnly}
                        />
                      }
                      label="Active"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      Specializations
                    </Typography>
                    <Box
                      sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}
                    >
                      {staffData.specializations.map((spec, index) => (
                        <Chip
                          key={index}
                          label={spec}
                          onDelete={
                            isReadOnly
                              ? undefined
                              : () => removeSpecialization(index)
                          }
                          color="primary"
                        />
                      ))}
                      {staffData.specializations.length === 0 && (
                        <Typography variant="body2" color="textSecondary">
                          No specializations added
                        </Typography>
                      )}
                    </Box>
                    {!isReadOnly && (
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        <TextField
                          label="Add Specialization"
                          value={specialization}
                          onChange={(e) => setSpecialization(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addSpecialization();
                            }
                          }}
                        />
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={addSpecialization}
                          startIcon={<AddIcon />}
                        >
                          Add
                        </Button>
                      </Box>
                    )}
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Notes"
                      name="notes"
                      value={staffData.notes}
                      onChange={handleChange}
                      multiline
                      rows={4}
                      disabled={isReadOnly}
                    />
                  </Grid>
                </Grid>

                {(isEdit || isNew) && (
                  <Grid item xs={12}>
                    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
                      <Button
                        component={RouterLink}
                        to={isNew ? "/staff" : `/staff/${id}`}
                        variant="outlined"
                        disabled={submitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="contained"
                        color="primary"
                        type="submit"
                        disabled={submitting}
                        startIcon={submitting ? <LoadingSpinner size={20} /> : <SaveIcon />}
                      >
                        {isNew ? "Create Staff Member" : "Save Changes"}
                      </Button>
                    </Box>
                  </Grid>
                )}
              </form>
            )}

            {/* Contact & Address Tab */}
            {tabValue === 1 && (
              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Address Information
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Street Address"
                      name="address.street"
                      value={staffData.address.street}
                      onChange={handleChange}
                      disabled={isReadOnly}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="City"
                      name="address.city"
                      value={staffData.address.city}
                      onChange={handleChange}
                      disabled={isReadOnly}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="State/Province"
                      name="address.state"
                      value={staffData.address.state}
                      onChange={handleChange}
                      disabled={isReadOnly}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Zip/Postal Code"
                      name="address.zipCode"
                      value={staffData.address.zipCode}
                      onChange={handleChange}
                      disabled={isReadOnly}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Country"
                      name="address.country"
                      value={staffData.address.country}
                      onChange={handleChange}
                      disabled={isReadOnly}
                    />
                  </Grid>
                </Grid>

                <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                  Emergency Contact
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Contact Name"
                      name="emergencyContact.name"
                      value={staffData.emergencyContact.name}
                      onChange={handleChange}
                      disabled={isReadOnly}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Relationship"
                      name="emergencyContact.relationship"
                      value={staffData.emergencyContact.relationship}
                      onChange={handleChange}
                      disabled={isReadOnly}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Contact Phone"
                      name="emergencyContact.phone"
                      value={staffData.emergencyContact.phone}
                      onChange={handleChange}
                      disabled={isReadOnly}
                    />
                  </Grid>
                </Grid>

                {!isReadOnly && (
                  <Box
                    sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}
                  >
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      startIcon={<SaveIcon />}
                    >
                      {isNew ? "Create Staff Member" : "Update Staff Member"}
                    </Button>
                  </Box>
                )}
              </form>
            )}

            {/* Employment Tab */}
            {tabValue === 2 && (
              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Hire Date"
                      name="hireDate"
                      type="date"
                      value={staffData.hireDate}
                      onChange={handleChange}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      disabled={isReadOnly}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Salary Amount"
                      name="salary.amount"
                      type="number"
                      value={staffData.salary.amount}
                      onChange={handleChange}
                      disabled={isReadOnly}
                      InputProps={{
                        startAdornment: (
                          <span style={{ marginRight: 8 }}>$</span>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth disabled={isReadOnly}>
                      <InputLabel>Payment Frequency</InputLabel>
                      <Select
                        name="salary.paymentFrequency"
                        value={staffData.salary.paymentFrequency}
                        onChange={handleChange}
                        label="Payment Frequency"
                      >
                        <MenuItem value="hourly">Hourly</MenuItem>
                        <MenuItem value="weekly">Weekly</MenuItem>
                        <MenuItem value="biweekly">Bi-Weekly</MenuItem>
                        <MenuItem value="monthly">Monthly</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {isNew && (
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={staffData.createUser}
                            onChange={handleChange}
                            name="createUser"
                            color="primary"
                          />
                        }
                        label="Create User Account for Staff Member"
                      />
                      <Typography
                        variant="caption"
                        color="textSecondary"
                        display="block"
                      >
                        This will create a user account with appropriate
                        permissions based on the staff position.
                      </Typography>
                    </Grid>
                  )}
                </Grid>

                {!isReadOnly && (
                  <Box
                    sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}
                  >
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      startIcon={<SaveIcon />}
                    >
                      {isNew ? "Create Staff Member" : "Update Staff Member"}
                    </Button>
                  </Box>
                )}
              </form>
            )}

            {/* Certifications Tab */}
            {tabValue === 3 && !isNew && (
              <CertificationsTab
                staffId={id}
                certifications={certifications}
                setCertifications={setCertifications}
                isReadOnly={isReadOnly}
              />
            )}

            {/* Schedule Tab */}
            {tabValue === 4 && !isNew && (
              <ScheduleTab
                staffId={id}
                schedule={schedule}
                setSchedule={setSchedule}
                isReadOnly={isReadOnly}
              />
            )}
          </Box>
        </Paper>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this staff member? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} disabled={deleteLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            disabled={deleteLoading}
            startIcon={deleteLoading ? <LoadingSpinner size={20} /> : null}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StaffDetail;
