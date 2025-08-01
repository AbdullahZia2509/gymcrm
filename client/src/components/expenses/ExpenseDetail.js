import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  Switch,
  FormControlLabel,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { Save as SaveIcon, Receipt as ReceiptIcon } from "@mui/icons-material";
import AuthContext from "../../context/auth/authContext";
import AlertContext from "../../context/alert/alertContext";
import axios from "axios";

const ExpenseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const alertContext = useContext(AlertContext);
  const { user } = authContext;
  const { setAlert } = alertContext;

  const isEdit = Boolean(id);
  const formTitle = isEdit ? "Edit Expense" : "Add Expense";

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    date: new Date(),
    category: "misc",
    description: "",
    paymentMethod: "cash",
    receiptImage: "",
    recurring: false,
    recurringFrequency: "none",
    nextDueDate: null,
    status: "paid",
    paidTo: "",
    staff: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  // Check if current user has permission
  const isAdmin = user && (user.role === "admin" || user.role === "superadmin");
  const isManager =
    user &&
    (user.role === "admin" ||
      user.role === "manager" ||
      user.role === "superadmin");

  useEffect(() => {
    if (!isManager) {
      setAlert("Not authorized to manage expenses", "error");
      navigate("/expenses");
      return;
    }

    fetchStaffList();

    if (isEdit) {
      fetchExpenseData();
    }
    // eslint-disable-next-line
  }, [id]);

  const fetchStaffList = async () => {
    try {
      setLoadingStaff(true);
      const res = await axios.get("/api/staff");
      setStaffList(res.data);
      setLoadingStaff(false);
    } catch (err) {
      setAlert(err.response?.data?.msg || "Error fetching staff list", "error");
      setLoadingStaff(false);
    }
  };

  const fetchExpenseData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/expenses/${id}`);
      const expenseData = res.data;

      setFormData({
        title: expenseData.title || "",
        amount: expenseData.amount || "",
        date: expenseData.date ? new Date(expenseData.date) : new Date(),
        category: expenseData.category || "misc",
        description: expenseData.description || "",
        paymentMethod: expenseData.paymentMethod || "cash",
        receiptImage: expenseData.receiptImage || "",
        recurring: expenseData.recurring || false,
        recurringFrequency: expenseData.recurringFrequency || "none",
        nextDueDate: expenseData.nextDueDate
          ? new Date(expenseData.nextDueDate)
          : null,
        status: expenseData.status || "paid",
        paidTo: expenseData.paidTo || "",
        staff: expenseData.staff?._id || "",
      });

      setLoading(false);
    } catch (err) {
      setAlert(
        err.response?.data?.msg || "Error fetching expense data",
        "error"
      );
      setLoading(false);
      navigate("/expenses");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleDateChange = (name, date) => {
    setFormData((prev) => ({
      ...prev,
      [name]: date,
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (
      !formData.amount ||
      isNaN(formData.amount) ||
      parseFloat(formData.amount) <= 0
    ) {
      newErrors.amount = "Amount is required and must be greater than 0";
    }

    if (!formData.date) {
      newErrors.date = "Date is required";
    }

    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    if (formData.recurring && !formData.recurringFrequency) {
      newErrors.recurringFrequency =
        "Frequency is required for recurring expenses";
    }

    if (formData.recurring && !formData.nextDueDate) {
      newErrors.nextDueDate =
        "Next due date is required for recurring expenses";
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

      // Prepare data for submission
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount),
        // Convert empty staff string to null to avoid ObjectId casting error
        staff: formData.staff || null
      };

      if (isEdit) {
        await axios.put(`/api/expenses/${id}`, submitData);
        setAlert("Expense updated successfully", "success");
      } else {
        await axios.post("/api/expenses", submitData);
        setAlert("Expense created successfully", "success");
      }

      navigate("/expenses");
    } catch (err) {
      const errorMsg =
        err.response?.data?.msg ||
        (err.response?.data?.errors
          ? err.response.data.errors[0].msg
          : "Error saving expense");
      setAlert(errorMsg, "error");
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
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
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                error={Boolean(errors.title)}
                helperText={errors.title}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Amount"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleChange}
                error={Boolean(errors.amount)}
                helperText={errors.amount}
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
                label="Date"
                value={formData.date}
                onChange={(date) => handleDateChange("date", date)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    error={Boolean(errors.date)}
                    helperText={errors.date}
                    required
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={Boolean(errors.category)}>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  label="Category"
                  required
                >
                  <MenuItem value="salary">Salary</MenuItem>
                  <MenuItem value="bills">Bills</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                  <MenuItem value="equipment">Equipment</MenuItem>
                  <MenuItem value="rent">Rent</MenuItem>
                  <MenuItem value="supplies">Supplies</MenuItem>
                  <MenuItem value="marketing">Marketing</MenuItem>
                  <MenuItem value="misc">Miscellaneous</MenuItem>
                </Select>
                {errors.category && (
                  <FormHelperText>{errors.category}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={3}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  label="Payment Method"
                >
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                  <MenuItem value="credit_card">Credit Card</MenuItem>
                  <MenuItem value="check">Check</MenuItem>
                  <MenuItem value="online">Online Payment</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  label="Status"
                >
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Paid To"
                name="paidTo"
                value={formData.paidTo}
                onChange={handleChange}
                placeholder="Vendor, employee, or service provider name"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={loadingStaff}>
                <InputLabel>Related Staff (Optional)</InputLabel>
                <Select
                  name="staff"
                  value={formData.staff || ""}
                  onChange={handleChange}
                  label="Related Staff (Optional)"
                >
                  <MenuItem value="">None</MenuItem>
                  {staffList.map((staff) => (
                    <MenuItem key={staff._id} value={staff._id}>
                      {staff.firstName} {staff.lastName} - {staff.position}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  Link this expense to a staff member
                </FormHelperText>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Receipt Image URL (Optional)"
                name="receiptImage"
                value={formData.receiptImage || ""}
                onChange={handleChange}
                helperText="URL to receipt image"
                InputProps={{
                  endAdornment: formData.receiptImage && (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        onClick={() =>
                          window.open(formData.receiptImage, "_blank")
                        }
                      >
                        <ReceiptIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Recurring Settings
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.recurring}
                    onChange={handleSwitchChange}
                    name="recurring"
                    color="primary"
                  />
                }
                label="Recurring Expense"
              />
            </Grid>

            {formData.recurring && (
              <>
                <Grid item xs={12} md={4}>
                  <FormControl
                    fullWidth
                    error={Boolean(errors.recurringFrequency)}
                  >
                    <InputLabel>Frequency</InputLabel>
                    <Select
                      name="recurringFrequency"
                      value={formData.recurringFrequency}
                      onChange={handleChange}
                      label="Frequency"
                      required={formData.recurring}
                    >
                      <MenuItem value="daily">Daily</MenuItem>
                      <MenuItem value="weekly">Weekly</MenuItem>
                      <MenuItem value="monthly">Monthly</MenuItem>
                      <MenuItem value="quarterly">Quarterly</MenuItem>
                      <MenuItem value="yearly">Yearly</MenuItem>
                    </Select>
                    {errors.recurringFrequency && (
                      <FormHelperText>
                        {errors.recurringFrequency}
                      </FormHelperText>
                    )}
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                  <DatePicker
                    label="Next Due Date"
                    value={formData.nextDueDate}
                    onChange={(date) => handleDateChange("nextDueDate", date)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        error={Boolean(errors.nextDueDate)}
                        helperText={errors.nextDueDate}
                        required={formData.recurring}
                      />
                    )}
                  />
                </Grid>
              </>
            )}
          </Grid>

          <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="outlined"
              onClick={() => navigate("/expenses")}
              sx={{ mr: 2 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              startIcon={<SaveIcon />}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Expense"}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default ExpenseDetail;
