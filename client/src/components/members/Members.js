import React, { useState, useEffect, useContext } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
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
  Grid,
  IconButton,
  InputAdornment,
  Link,
  MenuItem,
  Paper,
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
  FilterList as FilterIcon,
  NotificationsActive as NotificationsActiveIcon,
} from "@mui/icons-material";
import AlertContext from "../../context/alert/alertContext";
import AuthContext from "../../context/auth/authContext";
import { formatDate } from "../../utils/format";

const Members = () => {
  const alertContext = useContext(AlertContext);
  const authContext = useContext(AuthContext);
  const { setAlert } = alertContext;
  const { user } = authContext;
  const location = useLocation();
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [feesDueFilter, setFeesDueFilter] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);

  // Fetch members on component mount and handle URL query parameters
  useEffect(() => {
    // Check for filter query parameter
    const queryParams = new URLSearchParams(location.search);
    const filterParam = queryParams.get("filter");

    if (filterParam === "fees-due") {
      // Apply fees due filter automatically
      handleFeesDueFilter(true);
    } else {
      // Normal fetch without filters
      getMembers();
    }
  }, [location.search]); // Re-run when URL query parameters change

  // Get all members
  const getMembers = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/members");
      setMembers(res.data);
      setLoading(false);
    } catch (err) {
      setAlert(err.response?.data?.msg || "Error fetching members", "error");
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = async () => {
    if (searchTerm.trim() === "") {
      getMembers();
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(`/api/members/search/${searchTerm}`);
      setMembers(res.data);
      setLoading(false);
    } catch (err) {
      setAlert(err.response?.data?.msg || "Error searching members", "error");
      setLoading(false);
    }
  };

  // Handle status filter
  const handleStatusFilter = async (status) => {
    setStatusFilter(status);

    // Reset fees due filter when changing status filter
    if (feesDueFilter) {
      setFeesDueFilter(false);
    }

    if (status === "all") {
      getMembers();
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(`/api/members/status/${status}`);
      setMembers(res.data);
      setLoading(false);
    } catch (err) {
      setAlert(err.response?.data?.msg || "Error filtering members", "error");
      setLoading(false);
    }
  };

  // Handle fees due filter
  const handleFeesDueFilter = async (enabled) => {
    setFeesDueFilter(enabled);

    // Reset status filter when enabling fees due filter
    if (enabled && statusFilter !== "all") {
      setStatusFilter("all");
    }

    // Update URL to reflect filter state (without reloading page)
    const url = new URL(window.location);
    if (enabled) {
      url.searchParams.set("filter", "fees-due");
    } else {
      url.searchParams.delete("filter");
    }
    navigate(url.pathname + url.search, { replace: true });

    if (!enabled) {
      getMembers();
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get("/api/members/fees-due");
      setMembers(res.data);
      setLoading(false);
    } catch (err) {
      console.error(
        err.response?.data?.msg || "Error fetching members with fees due"
      );
      setLoading(false);
      setMembers([]);
    }
  };

  // Handle delete member
  const handleDeleteMember = async () => {
    if (!memberToDelete) return;

    try {
      await axios.delete(`/api/members/${memberToDelete._id}`);
      setMembers(members.filter((member) => member._id !== memberToDelete._id));
      setAlert("Member deleted successfully", "success");
      setDeleteDialogOpen(false);
      setMemberToDelete(null);
    } catch (err) {
      setAlert(err.response?.data?.msg || "Error deleting member", "error");
    }
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (member) => {
    setMemberToDelete(member);
    setDeleteDialogOpen(true);
  };

  // Close delete confirmation dialog
  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setMemberToDelete(null);
  };

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Get status chip color
  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "success";
      case "inactive":
        return "error";
      case "frozen":
        return "info";
      case "expired":
        return "warning";
      default:
        return "default";
    }
  };

  return (
    <Container maxWidth="lg">
      <Box mb={4}>
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            <Typography variant="h4" component="h1" gutterBottom>
              Members
            </Typography>
          </Grid>
          <Grid item>
            {(user?.role === "admin" || user?.role === "manager") && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                component={RouterLink}
                to="/members/new"
              >
                Add Member
              </Button>
            )}
          </Grid>
        </Grid>
      </Box>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Search Members"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleSearch} edge="end">
                        <SearchIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="Filter by Status"
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value)}
                disabled={loading || feesDueFilter}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FilterIcon />
                    </InputAdornment>
                  ),
                }}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="frozen">Frozen</MenuItem>
                <MenuItem value="expired">Expired</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant={feesDueFilter ? "contained" : "outlined"}
                color={feesDueFilter ? "warning" : "primary"}
                fullWidth
                startIcon={<NotificationsActiveIcon />}
                onClick={() => handleFeesDueFilter(!feesDueFilter)}
                disabled={loading}
                sx={{ height: "100%" }}
              >
                {feesDueFilter ? "Clear Fees Due Filter" : "Show Fees Due"}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Membership</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Loading members...
                  </TableCell>
                </TableRow>
              ) : members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No members found
                  </TableCell>
                </TableRow>
              ) : (
                members
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((member) => (
                    <TableRow key={member._id}>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Link
                            component={RouterLink}
                            to={`/members/${member._id}`}
                            underline="hover"
                          >
                            {member.firstName} {member.lastName}
                          </Link>
                          {member.dueStatus && (
                            <Chip
                              icon={<NotificationsActiveIcon />}
                              label={
                                member.dueStatus === "overdue"
                                  ? "Overdue"
                                  : "Due Soon"
                              }
                              color={
                                member.dueStatus === "overdue"
                                  ? "error"
                                  : "warning"
                              }
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>{member.phone}</TableCell>
                      <TableCell>
                        {member.membershipType
                          ? member.membershipType.name
                          : "None"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            member.membershipStatus.charAt(0).toUpperCase() +
                            member.membershipStatus.slice(1)
                          }
                          color={getStatusColor(member.membershipStatus)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {member.endDate ? formatDate(member.endDate) : "N/A"}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          component={RouterLink}
                          to={`/members/${member._id}`}
                          color="primary"
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                        {(user?.role === "admin" ||
                          user?.role === "manager") && (
                          <IconButton
                            onClick={() => openDeleteDialog(member)}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon />
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
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={members.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog}>
        <DialogTitle>Delete Member</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete{" "}
            {memberToDelete &&
              `${memberToDelete.firstName} ${memberToDelete.lastName}`}
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

export default Members;
