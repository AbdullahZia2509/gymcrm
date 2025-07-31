import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  FormControl,
  Grid,
  IconButton,
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
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import SearchIcon from "@mui/icons-material/Search";
import AuthContext from "../../context/auth/authContext";
import AlertContext from "../../context/alert/alertContext";
import LoadingSpinner from "../layout/LoadingSpinner";
import DeleteConfirmDialog from "../common/DeleteConfirmDialog";

const Attendance = () => {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const alertContext = useContext(AlertContext);
  const { setAlert } = alertContext;
  const { user } = authContext;

  // State
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);

  // Check if user has permission to modify
  const canModify = user && (user.role === "admin" || user.role === "manager");

  useEffect(() => {
    if (authContext.isAuthenticated) {
      loadAttendanceRecords();
    }
    // eslint-disable-next-line
  }, [
    authContext.isAuthenticated,
    page,
    rowsPerPage,
    statusFilter,
    dateFilter,
  ]);

  const loadAttendanceRecords = async () => {
    try {
      setLoading(true);

      // Build query parameters
      const params = new URLSearchParams();
      params.append("page", page + 1); // API uses 1-based pagination
      params.append("limit", rowsPerPage);

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      if (dateFilter) {
        params.append("date", dateFilter);
      }

      console.log(
        "Fetching attendance records with params:",
        params.toString()
      );
      const response = await axios.get(`/api/attendance?${params.toString()}`);
      console.log("API Response:", response.data);

      // Check the structure of the response
      let records = [];
      if (Array.isArray(response.data)) {
        // If response is an array, use it directly
        records = response.data;
        setTotalCount(records.length);
        console.log("Response is an array with", records.length, "records");
      } else if (
        response.data.attendance &&
        Array.isArray(response.data.attendance)
      ) {
        // If response has attendance property that is an array
        records = response.data.attendance;
        setTotalCount(response.data.total || records.length);
        console.log(
          "Response has attendance array with",
          records.length,
          "records"
        );
      } else if (response.data.data && Array.isArray(response.data.data)) {
        // If response has data property that is an array
        records = response.data.data;
        setTotalCount(
          response.data.total || response.data.count || records.length
        );
        console.log("Response has data array with", records.length, "records");
      } else {
        console.error("Unexpected API response structure:", response.data);
        records = [];
        setTotalCount(0);
      }

      setAttendanceRecords(records);
      setLoading(false);
    } catch (err) {
      console.error("Error loading attendance records:", err);
      setAlert("Error loading attendance records", "error");
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

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(0);
  };

  const handleDateFilterChange = (e) => {
    setDateFilter(e.target.value);
    setPage(0);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCheckout = async (id) => {
    if (!canModify) {
      setAlert("You do not have permission to check out members", "error");
      return;
    }

    try {
      console.log("Checking out attendance record with ID:", id);
      await axios.put(`/api/attendance/checkout/${id}`);
      setAlert("Member checked out successfully", "success");
      loadAttendanceRecords();
    } catch (err) {
      setAlert(err.response?.data?.msg || "Error checking out member", "error");
      console.error("Error checking out member:", err);
    }
  };

  const handleDelete = (record) => {
    if (!canModify) {
      setAlert(
        "You do not have permission to delete attendance records",
        "error"
      );
      return;
    }

    setRecordToDelete(record);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return;

    try {
      await axios.delete(`/api/attendance/${recordToDelete._id}`);
      setAlert("Attendance record deleted successfully", "success");
      loadAttendanceRecords();
    } catch (err) {
      setAlert(
        err.response?.data?.msg || "Error deleting attendance record",
        "error"
      );
      console.error("Error deleting attendance record:", err);
    } finally {
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setRecordToDelete(null);
  };

  // Log attendance records for debugging
  useEffect(() => {
    console.log("Current attendance records:", attendanceRecords);
  }, [attendanceRecords]);

  // Filter records based on search term
  const filteredRecords = attendanceRecords.filter((record) => {
    if (!searchTerm) return true;

    const searchTermLower = searchTerm.toLowerCase();

    // Check if member exists before trying to access properties
    if (!record.member) return false;

    // Handle both populated objects and ID references
    let memberName = "";
    let memberEmail = "";
    let memberPhone = "";

    if (typeof record.member === "object") {
      memberName = `${record.member.firstName || ""} ${
        record.member.lastName || ""
      }`.toLowerCase();
      memberEmail = (record.member.email || "").toLowerCase();
      memberPhone = (record.member.phone || "").toLowerCase();
    }

    return (
      memberName.includes(searchTermLower) ||
      memberEmail.includes(searchTermLower) ||
      memberPhone.includes(searchTermLower)
    );
  });

  // Log filtered records for debugging
  useEffect(() => {
    console.log("Filtered records:", filteredRecords);
  }, [filteredRecords]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Calculate duration between check-in and check-out
  const calculateDuration = (checkInTime, checkOutTime) => {
    if (!checkInTime || !checkOutTime) return "N/A";

    const checkIn = new Date(checkInTime);
    const checkOut = new Date(checkOutTime);

    const durationMs = checkOut - checkIn;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container maxWidth="lg">
      <Box mb={4}>
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            <Typography variant="h4" component="h1" gutterBottom>
              Attendance
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              component={Link}
              to="/attendance/new"
            >
              Check In Member
            </Button>
          </Grid>
        </Grid>
      </Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                  label="Status"
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="checkedIn">Checked In</MenuItem>
                  <MenuItem value="checkedOut">Checked Out</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Date (YYYY-MM-DD)"
                type="text"
                value={dateFilter}
                onChange={handleDateFilterChange}
                placeholder="YYYY-MM-DD"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search Members"
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  endAdornment: <SearchIcon color="action" />,
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Member</TableCell>
                <TableCell>Check-In Time</TableCell>
                <TableCell>Check-Out Time</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Loading members...
                  </TableCell>
                </TableRow>
              ) : filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No attendance records found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record) => (
                  <TableRow key={record._id}>
                    <TableCell>
                      {typeof record.member === "object" && record.member
                        ? `${record.member.firstName || ""} ${
                            record.member.lastName || ""
                          }`
                        : "Unknown Member"}
                    </TableCell>
                    <TableCell>{formatDate(record.checkInTime)}</TableCell>
                    <TableCell>
                      {record.checkOutTime
                        ? formatDate(record.checkOutTime)
                        : "Not checked out"}
                    </TableCell>
                    <TableCell>
                      {calculateDuration(
                        record.checkInTime,
                        record.checkOutTime
                      )}
                    </TableCell>
                    <TableCell>
                      {record.attendanceType === "gym"
                        ? "Gym"
                        : record.attendanceType === "class"
                        ? `Class: ${
                            record.classSession?.class?.name || "Unknown"
                          }`
                        : record.attendanceType}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        component={Link}
                        to={`/attendance/${record._id}`}
                        size="small"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>

                      {!record.checkOutTime && canModify && (
                        <IconButton
                          color="secondary"
                          onClick={() => handleCheckout(record._id)}
                          size="small"
                        >
                          <ExitToAppIcon fontSize="small" />
                        </IconButton>
                      )}

                      {canModify && (
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(record)}
                          size="small"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Attendance Record"
        content={`Are you sure you want to delete the attendance record for ${
          recordToDelete
            ? recordToDelete.member
              ? `${recordToDelete.member.firstName} ${recordToDelete.member.lastName}`
              : "this member"
            : "this member"
        }? This action cannot be undone.`}
      />
    </Container>
  );
};

export default Attendance;
