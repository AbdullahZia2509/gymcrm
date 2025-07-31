import React, { useState, useEffect, useContext } from "react";
import { Link as RouterLink } from "react-router-dom";
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
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Chip,
  Avatar,
  TextField,
  InputAdornment,
  MenuItem,
  Link,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import AlertContext from "../../context/alert/alertContext";
import AuthContext from "../../context/auth/authContext";
import LoadingSpinner from "../layout/LoadingSpinner";
import { useNavigate } from "react-router-dom";

const Staff = () => {
  const navigate = useNavigate();
  const alertContext = useContext(AlertContext);
  const authContext = useContext(AuthContext);
  const { setAlert } = alertContext;
  const { user } = authContext;

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPosition, setFilterPosition] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Check if user has permission to modify staff
  const canModify = user && (user.role === "admin" || user.role === "manager");

  useEffect(() => {
    loadStaff();
    // eslint-disable-next-line
  }, []);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/staff");
      setStaff(res.data);
      setLoading(false);
    } catch (err) {
      setAlert(err.response?.data?.msg || "Error loading staff data", "error");
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = async () => {
    if (searchTerm.trim() === "") {
      loadStaff();
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(`/api/staff/search/${searchTerm}`);
      setStaff(res.data);
      setLoading(false);
    } catch (err) {
      setAlert(err.response?.data?.msg || "Error searching staff", "error");
      setLoading(false);
    }
  };

  // Handle position filter
  const handlePositionFilter = async (position) => {
    setFilterPosition(position);

    if (position === "") {
      loadStaff();
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(`/api/staff/position/${position}`);
      setStaff(res.data);
      setLoading(false);
    } catch (err) {
      setAlert(err.response?.data?.msg || "Error filtering staff", "error");
      setLoading(false);
    }
  };

  // These pagination handlers are already defined above
  // No need to redefine them here

  const openDeleteDialog = (staffMember) => {
    setStaffToDelete(staffMember);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setStaffToDelete(null);
  };

  const handleDelete = async () => {
    if (!staffToDelete) return;

    try {
      setDeleteLoading(true);
      await axios.delete(`/api/staff/${staffToDelete._id}`);
      setAlert("Staff member deleted successfully", "success");
      loadStaff();
      closeDeleteDialog();
    } catch (err) {
      setAlert(
        err.response?.data?.msg || "Error deleting staff member",
        "error"
      );
      setDeleteLoading(false);
    }
  };

  const filteredStaff = staff.filter((staffMember) => {
    // Only apply client-side filtering if we're not using API filtering
    if (searchTerm.trim() === "" && filterPosition === "") {
      return true;
    }

    const fullName =
      `${staffMember.firstName} ${staffMember.lastName}`.toLowerCase();
    const searchMatch =
      searchTerm.trim() === ""
        ? true
        : fullName.includes(searchTerm.toLowerCase()) ||
          staffMember.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          staffMember.position.toLowerCase().includes(searchTerm.toLowerCase());

    const positionMatch =
      filterPosition === "" ? true : staffMember.position === filterPosition;

    return searchMatch && positionMatch;
  });

  const getPositionColor = (position) => {
    switch (position) {
      case "manager":
        return "primary";
      case "trainer":
        return "secondary";
      case "receptionist":
        return "success";
      case "maintenance":
        return "warning";
      case "nutritionist":
        return "info";
      default:
        return "default";
    }
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
              Staff Management
            </Typography>
          </Grid>
          {canModify && (
            <Grid item>
              <Button
                onClick={() => {
                  navigate("/staff/new");
                }}
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
              >
                Add Staff Member
              </Button>
            </Grid>
          )}
        </Grid>
      </Box>
      {/* Search and Filter Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search Staff"
                variant="outlined"
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
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Filter by Position"
                value={filterPosition}
                onChange={(e) => handlePositionFilter(e.target.value)}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FilterIcon />
                    </InputAdornment>
                  ),
                }}
              >
                <MenuItem value="">All Positions</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
                <MenuItem value="trainer">Trainer</MenuItem>
                <MenuItem value="receptionist">Receptionist</MenuItem>
                <MenuItem value="maintenance">Maintenance</MenuItem>
                <MenuItem value="nutritionist">Nutritionist</MenuItem>
              </TextField>
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
                <TableCell>Position</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Loading staff...
                  </TableCell>
                </TableRow>
              ) : filteredStaff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No staff members found
                  </TableCell>
                </TableRow>
              ) : (
                filteredStaff
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((staffMember) => (
                    <TableRow key={staffMember._id}>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Avatar sx={{ mr: 2 }}>
                            {staffMember.photo ? (
                              <img
                                src={staffMember.photo}
                                alt={`${staffMember.firstName} ${staffMember.lastName}`}
                              />
                            ) : (
                              <PersonIcon />
                            )}
                          </Avatar>
                          <Link
                            component={RouterLink}
                            to={`/staff/${staffMember._id}`}
                            underline="hover"
                          >
                            {staffMember.firstName} {staffMember.lastName}
                          </Link>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            staffMember.position.charAt(0).toUpperCase() +
                            staffMember.position.slice(1)
                          }
                          color={getPositionColor(staffMember.position)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{staffMember.email}</TableCell>
                      <TableCell>{staffMember.phone}</TableCell>
                      <TableCell>
                        <Chip
                          label={staffMember.isActive ? "Active" : "Inactive"}
                          color={staffMember.isActive ? "success" : "error"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          component={RouterLink}
                          to={`/staff/${staffMember._id}`}
                          color="primary"
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                        {canModify && (
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => openDeleteDialog(staffMember)}
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
          count={filteredStaff.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
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
            Are you sure you want to delete {staffToDelete?.firstName}{" "}
            {staffToDelete?.lastName}? This action cannot be undone.
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

export default Staff;
