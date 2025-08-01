import React, { useState, useEffect, useContext, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
  Autocomplete,
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
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import AlertContext from "../../context/alert/alertContext";
import AuthContext from "../../context/auth/authContext";
import { formatCurrency, formatDate } from "../../utils/format";

const PaymentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const alertContext = useContext(AlertContext);
  const authContext = useContext(AuthContext);
  const { setAlert } = alertContext;
  const { user } = authContext;

  const isNew =
    id === "new" || window.location.pathname.includes("/payments/new");
  const isEdit = window.location.pathname.includes("/edit");

  const [payment, setPayment] = useState({
    member: "",
    membership: "",
    amount: "",
    paymentDate: new Date(),
    paymentMethod: "cash",
    paymentStatus: "completed",
    transactionId: "",
    invoiceNumber: "",
    description: "",
    paymentFor: "membership",
    staff: "",
  });

  const [members, setMembers] = useState([]);
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const [memberSearchLoading, setMemberSearchLoading] = useState(false);
  const [memberships, setMemberships] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (authContext.isAuthenticated) {
      loadData();
    }
    // eslint-disable-next-line
  }, [authContext.isAuthenticated]);

  // Debounced search function for members
  const searchMembers = async (searchTerm) => {
    if (!searchTerm && !payment.member) {
      // If no search term and no selected member, just load a limited set
      setMemberSearchLoading(true);
      try {
        const response = await axios.get(
          "/api/members?limit=50&sort=firstName"
        );
        setMembers(response.data);
      } catch (err) {
        console.error("Error fetching members:", err);
      } finally {
        setMemberSearchLoading(false);
      }
      return;
    }

    setMemberSearchLoading(true);
    try {
      // Search by name, email, or phone
      const response = await axios.get(
        `/api/members/search?term=${encodeURIComponent(searchTerm)}`
      );
      setMembers(response.data);
    } catch (err) {
      console.error("Error searching members:", err);
    } finally {
      setMemberSearchLoading(false);
    }
  };

  // Debounce the search function to avoid too many API calls
  const debouncedSearchMembers = useMemo(() => {
    const debounce = (func, delay) => {
      let timeoutId;
      return (...args) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
      };
    };
    return debounce(searchMembers, 300);
  }, [payment.member]);

  // Effect to trigger search when search term changes
  useEffect(() => {
    debouncedSearchMembers(memberSearchTerm);
  }, [memberSearchTerm, debouncedSearchMembers]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load initial limited set of members, all memberships, and staff
      const [membersRes, membershipsRes, staffRes] = await Promise.all([
        axios.get("/api/members?limit=50&sort=firstName"),
        axios.get("/api/memberships"),
        axios.get("/api/staff"),
      ]);

      setMembers(membersRes.data);
      setMemberships(membershipsRes.data);
      setStaffMembers(staffRes.data);

      // If editing or viewing an existing payment, fetch its data
      if (!isNew && id) {
        try {
          const paymentRes = await axios.get(`/api/payments/${id}`);
          const paymentData = {
            ...paymentRes.data,
            member: paymentRes.data.member ? paymentRes.data.member._id : "",
            membership: paymentRes.data.membership
              ? paymentRes.data.membership._id
              : "",
            paymentDate: new Date(paymentRes.data.paymentDate),
          };
          setPayment(paymentData);
        } catch (err) {
          console.error("Error fetching payment:", err);
          // If payment not found, redirect to payments list
          if (err.response?.status === 404) {
            setAlert("Payment not found", "error");
            navigate("/payments");
            return;
          }
        }
      } else {
        // Generate invoice number for new payments
        generateInvoiceNumber();
      }

      setLoading(false);
    } catch (err) {
      console.error("Error loading data:", err);
      setAlert(err.response?.data?.msg || "Error loading data", "error");
      navigate("/payments");
    }
  };

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const randomNum = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    const invoiceNumber = `INV-${year}${month}${day}-${randomNum}`;

    setPayment((prev) => ({
      ...prev,
      invoiceNumber,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayment({
      ...payment,
      [name]: value,
    });

    // Clear error when field is updated
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      });
    }
  };

  const handleDateChange = (date) => {
    setPayment({
      ...payment,
      paymentDate: date,
    });
  };

  const handleMembershipChange = async (e) => {
    const membershipId = e.target.value;
    setPayment({
      ...payment,
      membership: membershipId,
    });

    // If a membership is selected, update the amount based on membership price
    if (membershipId) {
      try {
        const res = await axios.get(`/api/memberships/${membershipId}`);
        setPayment((prev) => ({
          ...prev,
          amount: res.data.price,
          paymentFor: "membership",
        }));
      } catch (err) {
        console.error("Error fetching membership details:", err);
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!payment.member) newErrors.member = "Member is required";
    if (!payment.amount) newErrors.amount = "Amount is required";
    if (payment.amount && isNaN(payment.amount))
      newErrors.amount = "Amount must be a number";
    if (!payment.paymentMethod)
      newErrors.paymentMethod = "Payment method is required";
    if (!payment.paymentDate)
      newErrors.paymentDate = "Payment date is required";
    if (payment.paymentFor === "membership" && !payment.membership) {
      newErrors.membership =
        "Membership is required when payment is for membership";
    }
    if (payment.paymentFor === "personal_training" && !payment.staff) {
      newErrors.staff =
        "Staff member is required for personal training payments";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      let res;
      const paymentData = {
        ...payment,
        // Convert date to ISO string for backend
        paymentDate: payment.paymentDate.toISOString(),
        // Set membership to null if it's an empty string
        membership: payment.membership || null,
        // Ensure staff is properly set for personal training
        staff:
          payment.paymentFor === "personal_training" ? payment.staff : null,
      };

      if (isNew) {
        res = await axios.post("/api/payments", paymentData);
        setAlert("Payment created successfully", "success");
      } else {
        res = await axios.put(`/api/payments/${id}`, paymentData);
        setAlert("Payment updated successfully", "success");
      }

      navigate(`/payments/${res.data._id}`);
    } catch (err) {
      setAlert(err.response?.data?.msg || "Error saving payment", "error");

      // Handle validation errors from server
      if (err.response?.data?.errors) {
        const serverErrors = {};
        err.response.data.errors.forEach((error) => {
          serverErrors[error.param] = error.msg;
        });
        setErrors(serverErrors);
      }
    }
  };

  const openDeleteDialog = () => {
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };

  const deletePayment = async () => {
    try {
      await axios.delete(`/api/payments/${id}`);
      setAlert("Payment deleted successfully", "success");
      navigate("/payments");
    } catch (err) {
      setAlert(err.response?.data?.msg || "Error deleting payment", "error");
    }
    closeDeleteDialog();
  };

  // Check if user has permission to modify
  const canModify = user && (user.role === "admin" || user.role === "manager");
  // Fields should be editable if it's a new payment or in edit mode
  const isReadOnly = !isNew && !isEdit;

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "success";
      case "pending":
        return "warning";
      case "failed":
        return "error";
      case "refunded":
        return "info";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <Container>
        <Typography variant="h6">Loading payment details...</Typography>
      </Container>
    );
  }

  return (
    <Container>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {isNew ? "New Payment" : isEdit ? "Edit Payment" : "Payment Details"}
        </Typography>
        <Button
          component={Link}
          to="/payments"
          startIcon={<ArrowBackIcon />}
          variant="outlined"
        >
          Back to Payments
        </Button>
      </Box>

      <form onSubmit={handleSubmit}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  id="member-search"
                  options={members}
                  getOptionLabel={(option) =>
                    option
                      ? `${option.firstName} ${option.lastName}${
                          option.email ? ` (${option.email})` : ""
                        }`
                      : ""
                  }
                  value={members.find((m) => m._id === payment.member) || null}
                  onChange={(event, newValue) => {
                    setPayment({
                      ...payment,
                      member: newValue ? newValue._id : "",
                    });

                    // Clear error when field is updated
                    if (errors.member) {
                      setErrors({
                        ...errors,
                        member: null,
                      });
                    }
                  }}
                  onInputChange={(event, newInputValue) => {
                    setMemberSearchTerm(newInputValue);
                  }}
                  loading={memberSearchLoading}
                  loadingText="Searching members..."
                  noOptionsText="No members found"
                  disabled={isReadOnly}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Member *"
                      required
                      error={!!errors.member}
                      helperText={errors.member}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <React.Fragment>
                            {memberSearchLoading ? (
                              <CircularProgress color="inherit" size={20} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </React.Fragment>
                        ),
                      }}
                    />
                  )}
                  filterOptions={(x) => x} // Disable client-side filtering as we're using server-side search
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Autocomplete
                  id="membership-search"
                  options={memberships}
                  getOptionLabel={(option) =>
                    option ? `${option.name} ($${option.price})` : ""
                  }
                  value={
                    memberships.find((m) => m._id === payment.membership) ||
                    null
                  }
                  onChange={(event, newValue) => {
                    const newMembership = newValue ? newValue._id : "";
                    const newAmount = newValue ? newValue.price : "";

                    setPayment({
                      ...payment,
                      membership: newMembership,
                      amount: newAmount,
                    });

                    // Clear error when field is updated
                    if (errors.membership) {
                      setErrors({
                        ...errors,
                        membership: null,
                      });
                    }
                  }}
                  disabled={isReadOnly}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Membership"
                      error={!!errors.membership}
                      helperText={errors.membership}
                    />
                  )}
                  filterOptions={(options, { inputValue }) => {
                    const searchTerm = inputValue.toLowerCase();
                    return options.filter(
                      (option) =>
                        option.name.toLowerCase().includes(searchTerm) ||
                        option.description
                          ?.toLowerCase()
                          .includes(searchTerm) ||
                        `${option.price}`.includes(searchTerm)
                    );
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Amount *"
                  name="amount"
                  value={payment.amount}
                  onChange={handleChange}
                  error={!!errors.amount}
                  helperText={errors.amount}
                  disabled={isReadOnly}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">Rs.</InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Payment Date *"
                  value={payment.paymentDate}
                  onChange={handleDateChange}
                  disabled={isReadOnly}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      required
                      error={!!errors.paymentDate}
                      helperText={errors.paymentDate}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.paymentMethod}>
                  <InputLabel>Payment Method *</InputLabel>
                  <Select
                    name="paymentMethod"
                    value={payment.paymentMethod}
                    onChange={handleChange}
                    label="Payment Method *"
                    disabled={isReadOnly}
                    required
                  >
                    <MenuItem value="cash">Cash</MenuItem>
                    <MenuItem value="credit_card">Credit Card</MenuItem>
                    <MenuItem value="debit_card">Debit Card</MenuItem>
                    <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                    <MenuItem value="online_payment">Online Payment</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                  {errors.paymentMethod && (
                    <FormHelperText>{errors.paymentMethod}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Payment Status</InputLabel>
                  <Select
                    name="paymentStatus"
                    value={payment.paymentStatus}
                    onChange={handleChange}
                    label="Payment Status"
                    disabled={isReadOnly}
                  >
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="failed">Failed</MenuItem>
                    <MenuItem value="refunded">Refunded</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Invoice Number"
                  name="invoiceNumber"
                  value={payment.invoiceNumber}
                  onChange={handleChange}
                  disabled={isReadOnly}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Transaction ID"
                  name="transactionId"
                  value={payment.transactionId}
                  onChange={handleChange}
                  disabled={isReadOnly}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Payment For</InputLabel>
                  <Select
                    name="paymentFor"
                    value={payment.paymentFor}
                    onChange={handleChange}
                    label="Payment For"
                    disabled={isReadOnly}
                  >
                    <MenuItem value="membership">Membership</MenuItem>
                    <MenuItem value="personal_training">
                      Personal Training
                    </MenuItem>
                    <MenuItem value="merchandise">Merchandise</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {payment.paymentFor === "personal_training" && (
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth error={Boolean(errors.staff)}>
                    <InputLabel>Trainer</InputLabel>
                    <Select
                      name="staff"
                      value={payment.staff || ""}
                      onChange={handleChange}
                      label="Trainer"
                      disabled={isReadOnly}
                      required
                    >
                      <MenuItem value="">Select Trainer</MenuItem>
                      {staffMembers.map((staff) => (
                        <MenuItem key={staff._id} value={staff._id}>
                          {staff.firstName} {staff.lastName} - {staff.position}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.staff && (
                      <FormHelperText>{errors.staff}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
              )}

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={payment.description}
                  onChange={handleChange}
                  multiline
                  rows={2}
                  disabled={isReadOnly}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {!isReadOnly && (
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
            <Button
              type="button"
              variant="outlined"
              onClick={() => navigate("/payments")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
            >
              {isNew ? "Create Payment" : "Update Payment"}
            </Button>
          </Box>
        )}
      </form>

      {!isNew && !isEdit && canModify && (
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
          <Button
            component={Link}
            to={`/payments/${id}/edit`}
            variant="contained"
            color="primary"
          >
            Edit Payment
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={openDeleteDialog}
          >
            Delete Payment
          </Button>
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this payment?
            {payment.invoiceNumber && (
              <Box
                component="span"
                sx={{ display: "block", mt: 1, fontWeight: "bold" }}
              >
                {payment.invoiceNumber} - {formatCurrency(payment.amount)}
              </Box>
            )}
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
          <Button onClick={deletePayment} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PaymentDetail;
