import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers";
import AuthContext from "../../context/auth/authContext";
import AlertContext from "../../context/alert/alertContext";
import axios from "axios";

const Expenses = () => {
  const authContext = useContext(AuthContext);
  const alertContext = useContext(AlertContext);
  const { user } = authContext;
  const { setAlert } = alertContext;
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [currentExpense, setCurrentExpense] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    status: "",
    startDate: null,
    endDate: null,
  });

  // Check if current user is admin or manager
  const isAdmin = user && (user.role === "admin" || user.role === "superadmin");
  const isManager =
    user &&
    (user.role === "admin" ||
      user.role === "manager" ||
      user.role === "superadmin");

  useEffect(() => {
    fetchExpenses();
    // eslint-disable-next-line
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);

      // Build query string for filters
      let queryParams = [];
      if (filters.category) queryParams.push(`category=${filters.category}`);
      if (filters.status) queryParams.push(`status=${filters.status}`);
      if (filters.startDate)
        queryParams.push(`startDate=${filters.startDate.toISOString()}`);
      if (filters.endDate)
        queryParams.push(`endDate=${filters.endDate.toISOString()}`);

      const queryString =
        queryParams.length > 0 ? `?${queryParams.join("&")}` : "";

      const res = await axios.get(`/api/expenses${queryString}`);
      setExpenses(res.data);
      setLoading(false);
    } catch (err) {
      setAlert(err.response?.data?.msg || "Error fetching expenses", "error");
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const handleAddExpense = () => {
    navigate("/expenses/new");
  };

  const handleEditExpense = (expenseId) => {
    navigate(`/expenses/${expenseId}/edit`);
  };

  const handleViewExpense = (expenseId) => {
    navigate(`/expenses/${expenseId}`);
  };

  const openDeleteDialog = (expense) => {
    setCurrentExpense(expense);
    setDeleteDialog(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialog(false);
    setCurrentExpense(null);
  };

  const handleDeleteExpense = async () => {
    if (!currentExpense) return;

    try {
      await axios.delete(`/api/expenses/${currentExpense._id}`);
      setAlert("Expense deleted successfully", "success");
      fetchExpenses();
      closeDeleteDialog();
    } catch (err) {
      setAlert(err.response?.data?.msg || "Error deleting expense", "error");
      closeDeleteDialog();
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const handleDateChange = (name, date) => {
    setFilters({
      ...filters,
      [name]: date,
    });
  };

  const applyFilters = () => {
    fetchExpenses();
    setFilterOpen(false);
  };

  const clearFilters = () => {
    setFilters({
      category: "",
      status: "",
      startDate: null,
      endDate: null,
    });
    fetchExpenses();
    setFilterOpen(false);
  };

  // Filter expenses based on search term
  const filteredExpenses = expenses.filter(
    (expense) =>
      expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (expense.description &&
        expense.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (expense.paidTo &&
        expense.paidTo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
    }).format(amount);
  };

  // Get category color
  const getCategoryColor = (category) => {
    switch (category) {
      case "salary":
        return "primary";
      case "bills":
        return "secondary";
      case "maintenance":
        return "warning";
      case "equipment":
        return "info";
      case "rent":
        return "error";
      case "supplies":
        return "success";
      case "marketing":
        return "default";
      default:
        return "default";
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "success";
      case "pending":
        return "warning";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">Expenses</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setFilterOpen(true)}
            sx={{ mr: 1 }}
          >
            Filter
          </Button>
          {isManager && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddExpense}
            >
              Add Expense
            </Button>
          )}
        </Box>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            placeholder="Search expenses..."
            variant="outlined"
            value={searchTerm}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Paid To</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredExpenses.length > 0 ? (
              filteredExpenses
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((expense) => (
                  <TableRow
                    key={expense._id}
                    hover
                    onClick={() => handleViewExpense(expense._id)}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <MoneyIcon sx={{ mr: 1, color: "text.secondary" }} />
                        {expense.title}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          expense.category.charAt(0).toUpperCase() +
                          expense.category.slice(1)
                        }
                        color={getCategoryColor(expense.category)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatCurrency(expense.amount)}</TableCell>
                    <TableCell>
                      {new Date(expense.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          expense.status.charAt(0).toUpperCase() +
                          expense.status.slice(1)
                        }
                        color={getStatusColor(expense.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{expense.paidTo || "N/A"}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                        {isManager && (
                          <>
                            <IconButton
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditExpense(expense._id);
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteDialog(expense);
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </>
                        )}
                        {expense.receiptImage && (
                          <IconButton
                            color="info"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(expense.receiptImage, "_blank");
                            }}
                          >
                            <ReceiptIcon />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No expenses found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredExpenses.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Filter Dialog */}
      <Dialog open={filterOpen} onClose={() => setFilterOpen(false)}>
        <DialogTitle>Filter Expenses</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  label="Category"
                >
                  <MenuItem value="">All Categories</MenuItem>
                  <MenuItem value="salary">Salary</MenuItem>
                  <MenuItem value="bills">Bills</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                  <MenuItem value="equipment">Equipment</MenuItem>
                  <MenuItem value="rent">Rent</MenuItem>
                  <MenuItem value="supplies">Supplies</MenuItem>
                  <MenuItem value="marketing">Marketing</MenuItem>
                  <MenuItem value="misc">Miscellaneous</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  label="Status"
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Start Date"
                value={filters.startDate}
                onChange={(date) => handleDateChange("startDate", date)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="End Date"
                value={filters.endDate}
                onChange={(date) => handleDateChange("endDate", date)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={clearFilters}>Clear</Button>
          <Button onClick={applyFilters} variant="contained">
            Apply
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={closeDeleteDialog}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete expense "{currentExpense?.title}"?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteExpense} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Expenses;
