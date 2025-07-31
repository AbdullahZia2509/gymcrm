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
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import {
  Save as SaveIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import AlertContext from "../../context/alert/alertContext";
import AuthContext from "../../context/auth/authContext";
import { formatDate } from "../../utils/format";

// TabPanel component for tab content
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`member-tabpanel-${index}`}
      aria-labelledby={`member-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const MemberDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const alertContext = useContext(AlertContext);
  const authContext = useContext(AuthContext);
  const { setAlert } = alertContext;
  const { user } = authContext;

  const [member, setMember] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
    dateOfBirth: null,
    gender: "",
    emergencyContact: {
      name: "",
      relationship: "",
      phone: "",
    },
    membershipStatus: "active",
    membershipType: "",
    customFee: "",
    startDate: null,
    endDate: null,
    notes: "",
    medicalInformation: {
      conditions: "",
      allergies: "",
      medications: "",
    },
  });

  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    // If id is 'new', we're creating a new member
    if (id === "new") {
      setIsNew(true);
      setLoading(false);
    } else {
      getMember();
    }

    // Get all memberships for the dropdown
    getMemberships();
  }, [id]);

  // Get member details
  const getMember = async () => {
    try {
      const res = await axios.get(`/api/members/${id}`);

      // Format dates for form fields
      const formattedMember = {
        ...res.data,
        dateOfBirth: res.data.dateOfBirth
          ? new Date(res.data.dateOfBirth)
          : null,
        startDate: res.data.startDate ? new Date(res.data.startDate) : null,
        endDate: res.data.endDate ? new Date(res.data.endDate) : null,
        // Handle membershipType which could be an object or just an ID
        membershipType: res.data.membershipType
          ? typeof res.data.membershipType === "object"
            ? res.data.membershipType._id
            : res.data.membershipType
          : "",
      };

      console.log("Formatted member:", formattedMember);
      setMember(formattedMember);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching member:", err);
      setAlert(
        err.response?.data?.msg || "Error fetching member details",
        "error"
      );
      navigate("/members");
    }
  };

  // Get all memberships
  const getMemberships = async () => {
    try {
      const res = await axios.get("/api/memberships");
      setMemberships(res.data);
    } catch (err) {
      setAlert(
        err.response?.data?.msg || "Error fetching memberships",
        "error"
      );
    }
  };

  // Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Handle nested objects
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setMember({
        ...member,
        [parent]: {
          ...member[parent],
          [child]: value,
        },
      });
    } else {
      setMember({
        ...member,
        [name]: value,
      });
    }
  };

  // Handle date changes
  const handleDateChange = (name, date) => {
    setMember({
      ...member,
      [name]: date,
    });
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!member.firstName.trim())
      newErrors.firstName = "First name is required";
    if (!member.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!member.email.trim()) newErrors.email = "Email is required";
    if (!member.phone.trim()) newErrors.phone = "Phone number is required";

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
      // Create a copy of the member data to clean up before submission
      const memberData = { ...member };

      // Remove empty membershipType to prevent ObjectId casting errors
      if (memberData.membershipType === "") {
        delete memberData.membershipType;
      }

      // Handle empty gender field - remove it if empty to prevent enum validation error
      if (memberData.gender === "") {
        delete memberData.gender;
      }

      let res;

      if (isNew) {
        res = await axios.post("/api/members", memberData);
        setAlert("Member created successfully", "success");

        // If a custom fee is provided, create a custom membership plan for this member
        if (memberData.customFee && parseFloat(memberData.customFee) > 0) {
          try {
            // Get the original membership to copy its details
            let originalMembership = null;
            if (memberData.membershipType) {
              const membershipRes = await axios.get(
                `/api/memberships/${memberData.membershipType}`
              );
              originalMembership = membershipRes.data;
            }

            // Create a new custom membership plan
            const customMembershipData = {
              name: `Custom Plan - ${parseFloat(memberData.customFee).toFixed(2)}`,
              description: `Custom membership plan with fee of ${parseFloat(memberData.customFee).toFixed(2)}`,
              price: parseFloat(memberData.customFee),
              duration: originalMembership
                ? originalMembership.duration
                : { value: 1, unit: "months" },
              features: originalMembership ? originalMembership.features : [],
              classesIncluded: originalMembership
                ? originalMembership.classesIncluded
                : 0,
              personalTrainingIncluded: originalMembership
                ? originalMembership.personalTrainingIncluded
                : 0,
              discounts: originalMembership ? originalMembership.discounts : 0,
              isActive: true,
            };

            const membershipRes = await axios.post(
              "/api/memberships",
              customMembershipData
            );

            // Update the member with the new custom membership
            await axios.put(`/api/members/${res.data._id}`, {
              membershipType: membershipRes.data._id,
            });

            setAlert("Member created with custom membership plan", "success");
          } catch (membershipErr) {
            console.error("Error creating custom membership:", membershipErr);
            setAlert(
              "Member created but failed to create custom membership plan. Please create it manually.",
              "warning"
            );
          }
        }
      } else {
        res = await axios.put(`/api/members/${id}`, memberData);
        setAlert("Member updated successfully", "success");
      }

      navigate(`/members/${res.data._id}`);
    } catch (err) {
      console.error("Error submitting form:", err);
      setAlert(
        err.response?.data?.msg ||
          `Error ${isNew ? "creating" : "updating"} member`,
        "error"
      );
    }
  };

  // Handle delete member
  const handleDeleteMember = async () => {
    try {
      await axios.delete(`/api/members/${id}`);
      setAlert("Member deleted successfully", "success");
      navigate("/members");
    } catch (err) {
      setAlert(err.response?.data?.msg || "Error deleting member", "error");
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
        <Typography>Loading member details...</Typography>
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
              onClick={() => navigate("/members")}
            >
              Back to Members
            </Button>
            <Typography variant="h4" component="h1" gutterBottom>
              {isNew
                ? "Add New Member"
                : `${member.firstName} ${member.lastName}`}
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
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="member tabs"
          >
            <Tab label="Personal Information" />
            <Tab label="Membership" />
            <Tab label="Medical Information" />
            <Tab label="Notes" />
          </Tabs>
        </Box>

        {/* Personal Information Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={member.firstName}
                onChange={handleChange}
                error={!!errors.firstName}
                helperText={errors.firstName}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={member.lastName}
                onChange={handleChange}
                error={!!errors.lastName}
                helperText={errors.lastName}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={member.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={member.phone}
                onChange={handleChange}
                error={!!errors.phone}
                helperText={errors.phone}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Address
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street Address"
                name="address.street"
                value={member.address.street}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="City"
                name="address.city"
                value={member.address.city}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="State/Province"
                name="address.state"
                value={member.address.state}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Zip/Postal Code"
                name="address.zipCode"
                value={member.address.zipCode}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Country"
                name="address.country"
                value={member.address.country}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Date of Birth"
                value={member.dateOfBirth}
                onChange={(date) => handleDateChange("dateOfBirth", date)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="gender-label">Gender</InputLabel>
                <Select
                  labelId="gender-label"
                  name="gender"
                  value={member.gender || ""}
                  label="Gender"
                  onChange={handleChange}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                  <MenuItem value="prefer not to say">
                    Prefer not to say
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Emergency Contact
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                name="emergencyContact.name"
                value={member.emergencyContact.name}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Relationship"
                name="emergencyContact.relationship"
                value={member.emergencyContact.relationship}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                name="emergencyContact.phone"
                value={member.emergencyContact.phone}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Membership Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="membership-status-label">
                  Membership Status
                </InputLabel>
                <Select
                  labelId="membership-status-label"
                  name="membershipStatus"
                  value={member.membershipStatus}
                  label="Membership Status"
                  onChange={handleChange}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="frozen">Frozen</MenuItem>
                  <MenuItem value="expired">Expired</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="membership-type-label">
                  Membership Type
                </InputLabel>
                <Select
                  labelId="membership-type-label"
                  name="membershipType"
                  value={member.membershipType || ""}
                  label="Membership Type"
                  onChange={handleChange}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {memberships.map((membership) => (
                    <MenuItem key={membership._id} value={membership._id}>
                      {membership.name} (${membership.price}/
                      {membership.duration.value} {membership.duration.unit})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Custom Fee (Special Package)"
                name="customFee"
                type="number"
                value={member.customFee}
                onChange={handleChange}
                helperText="Enter a custom fee amount for special packages (leave empty to use standard membership pricing)"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Start Date"
                value={member.startDate}
                onChange={(date) => handleDateChange("startDate", date)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="End Date"
                value={member.endDate}
                onChange={(date) => handleDateChange("endDate", date)}
                renderInput={(params) => (
                  <TextField {...params} fullWidth disabled />
                )}
                disabled
              />
              <FormHelperText>
                End date is calculated automatically based on membership type
                and start date
              </FormHelperText>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Medical Information Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Medical Conditions"
                name="medicalInformation.conditions"
                value={member.medicalInformation.conditions}
                onChange={handleChange}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Allergies"
                name="medicalInformation.allergies"
                value={member.medicalInformation.allergies}
                onChange={handleChange}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Medications"
                name="medicalInformation.medications"
                value={member.medicalInformation.medications}
                onChange={handleChange}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Notes Tab */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                value={member.notes}
                onChange={handleChange}
                multiline
                rows={6}
              />
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog}>
        <DialogTitle>Delete Member</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {member.firstName} {member.lastName}
            ? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteMember} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MemberDetail;
