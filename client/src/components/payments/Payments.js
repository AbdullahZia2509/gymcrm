import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
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
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import AlertContext from "../../context/alert/alertContext";
import AuthContext from "../../context/auth/authContext";
import { formatCurrency, formatDate } from "../../utils/format";

const Payments = () => {
  const alertContext = useContext(AlertContext);
  const authContext = useContext(AuthContext);
  const { setAlert } = alertContext;
  const { user } = authContext;

  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);

  // Date range filter options
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfYear = new Date(today.getFullYear(), 0, 1);

  // Custom date range
  const [startDate, setStartDate] = useState(startOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [customDateDialogOpen, setCustomDateDialogOpen] = useState(false);

  useEffect(() => {
    if (authContext.isAuthenticated) {
      getPayments();
    }
    // eslint-disable-next-line
  }, [authContext.isAuthenticated]);

  useEffect(() => {
    filterPayments();
    // eslint-disable-next-line
  }, [searchTerm, statusFilter, dateFilter, payments]);

  const getPayments = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/payments");
      setPayments(res.data);
      setFilteredPayments(res.data);
      setLoading(false);
    } catch (err) {
      setAlert(err.response?.data?.msg || "Error fetching payments", "error");
      setLoading(false);
    }
  };

  const getPaymentsByDateRange = async (start, end) => {
    try {
      setLoading(true);
      const formattedStart = start.toISOString().split("T")[0];
      const formattedEnd = end.toISOString().split("T")[0];
      const res = await axios.get(
        `/api/payments/date-range/${formattedStart}/${formattedEnd}`
      );
      setPayments(res.data);
      setFilteredPayments(res.data);
      setLoading(false);
    } catch (err) {
      setAlert(
        err.response?.data?.msg || "Error fetching payments by date range",
        "error"
      );
      setLoading(false);
    }
  };

  const filterPayments = () => {
    let filtered = payments;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (payment) =>
          (payment.member &&
            `${payment.member.firstName} ${payment.member.lastName}`
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (payment.invoiceNumber &&
            payment.invoiceNumber
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (payment.transactionId &&
            payment.transactionId
              .toLowerCase()
              .includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by payment status
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (payment) => payment.paymentStatus === statusFilter
      );
    }

    setFilteredPayments(filtered);
  };

  const handleDateFilterChange = (e) => {
    const value = e.target.value;
    setDateFilter(value);

    const now = new Date();

    if (value === "today") {
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      getPaymentsByDateRange(startOfDay, now);
    } else if (value === "this_week") {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
      getPaymentsByDateRange(startOfWeek, now);
    } else if (value === "this_month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      getPaymentsByDateRange(startOfMonth, now);
    } else if (value === "this_year") {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      getPaymentsByDateRange(startOfYear, now);
    } else if (value === "custom") {
      setCustomDateDialogOpen(true);
    } else if (value === "all") {
      getPayments();
    }
  };

  const applyCustomDateRange = () => {
    getPaymentsByDateRange(startDate, endDate);
    setCustomDateDialogOpen(false);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const openDeleteDialog = (payment) => {
    setPaymentToDelete(payment);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setPaymentToDelete(null);
  };

  const deletePayment = async () => {
    try {
      await axios.delete(`/api/payments/${paymentToDelete._id}`);
      setPayments(
        payments.filter((payment) => payment._id !== paymentToDelete._id)
      );
      setAlert("Payment deleted successfully", "success");
      closeDeleteDialog();
    } catch (err) {
      setAlert(err.response?.data?.msg || "Error deleting payment", "error");
    }
  };

  // Check if user has permission to add/edit/delete
  const canModify = user && (user.role === "admin" || user.role === "manager");

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

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case "credit_card":
        return "credit_card";
      case "cash":
        return "payments";
      case "bank_transfer":
        return "account_balance";
      case "online_payment":
        return "language";
      default:
        return "payment";
    }
  };

  return (
    <Container maxWidth="lg">
      <Box mb={4}>
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            <Typography variant="h4" component="h1" gutterBottom>
              Payments
            </Typography>
          </Grid>

          {canModify && (
            <Grid item>
              <Button
                component={Link}
                to="/payments/new"
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
              >
                Add Payment
              </Button>
            </Grid>
          )}
        </Grid>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                variant="outlined"
                label="Search"
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                placeholder="Search by member name, invoice #, or transaction ID"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                  label="Status"
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                  <MenuItem value="refunded">Refunded</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={dateFilter}
                  onChange={handleDateFilterChange}
                  label="Date Range"
                >
                  <MenuItem value="all">All Time</MenuItem>
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="this_week">This Week</MenuItem>
                  <MenuItem value="this_month">This Month</MenuItem>
                  <MenuItem value="this_year">This Year</MenuItem>
                  <MenuItem value="custom">Custom Range</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Invoice #</TableCell>
                <TableCell>Member</TableCell>
                <TableCell>Payment For</TableCell>
                <TableCell>Staff</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Loading members...
                  </TableCell>
                </TableRow>
              ) : filteredPayments.length > 0 ? (
                filteredPayments
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((payment) => (
                    <TableRow key={payment._id}>
                      <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                      <TableCell>{payment.invoiceNumber}</TableCell>
                      <TableCell>
                        {payment.member ? (
                          <Link to={`/members/${payment.member._id}`}>
                            {payment.member.firstName} {payment.member.lastName}
                          </Link>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        {payment.paymentFor === "membership" && payment.membership
                          ? payment.membership.name
                          : payment.paymentFor ? payment.paymentFor.replace(/_/g, " ") : ""}
                      </TableCell>
                      <TableCell>
                        {payment.paymentFor === "personal_training" && payment.staff ? (
                          `${payment.staff.firstName} ${payment.staff.lastName}`
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>
                        <Chip
                          label={payment.paymentMethod.replace("_", " ")}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={payment.paymentStatus}
                          color={getPaymentStatusColor(payment.paymentStatus)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          component={Link}
                          to={`/payments/${payment._id}`}
                          size="small"
                          color="primary"
                          title="View"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        {canModify && (
                          <>
                            <IconButton
                              component={Link}
                              to={`/payments/${payment._id}/edit`}
                              size="small"
                              color="primary"
                              title="Edit"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => openDeleteDialog(payment)}
                              title="Delete"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No payments found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredPayments.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this payment?
            {paymentToDelete && (
              <Box
                component="span"
                sx={{ display: "block", mt: 1, fontWeight: "bold" }}
              >
                {paymentToDelete.invoiceNumber} -{" "}
                {formatCurrency(paymentToDelete.amount)}
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

      {/* Custom Date Range Dialog */}
      <Dialog
        open={customDateDialogOpen}
        onClose={() => setCustomDateDialogOpen(false)}
      >
        <DialogTitle>Select Date Range</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Start Date"
                type="date"
                fullWidth
                margin="normal"
                value={startDate.toISOString().split("T")[0]}
                onChange={(e) => setStartDate(new Date(e.target.value))}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="End Date"
                type="date"
                fullWidth
                margin="normal"
                value={endDate.toISOString().split("T")[0]}
                onChange={(e) => setEndDate(new Date(e.target.value))}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomDateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={applyCustomDateRange}
            color="primary"
            variant="contained"
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Payments;
