import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
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
} from "@mui/icons-material";
import AlertContext from "../../context/alert/alertContext";
import AuthContext from "../../context/auth/authContext";
import { formatCurrency } from "../../utils/format";

const Memberships = () => {
  const alertContext = useContext(AlertContext);
  const authContext = useContext(AuthContext);
  const { setAlert } = alertContext;
  const { user } = authContext;
  const navigate = useNavigate();

  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [membershipToDelete, setMembershipToDelete] = useState(null);

  useEffect(() => {
    getMemberships();
  }, []);

  // Get all memberships
  const getMemberships = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/memberships");
      setMemberships(res.data);
      setLoading(false);
    } catch (err) {
      setAlert(
        err.response?.data?.msg || "Error fetching memberships",
        "error"
      );
      setLoading(false);
    }
  };

  // Handle search change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  // Handle status filter change
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(0);
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

  // Filter memberships based on search term and status
  const filteredMemberships = memberships.filter((membership) => {
    const matchesSearch = membership.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && membership.isActive) ||
      (statusFilter === "inactive" && !membership.isActive);

    return matchesSearch && matchesStatus;
  });

  // Paginate memberships
  const paginatedMemberships = filteredMemberships.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Open delete dialog
  const openDeleteDialog = (membership) => {
    setMembershipToDelete(membership);
    setDeleteDialogOpen(true);
  };

  // Close delete dialog
  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setMembershipToDelete(null);
  };

  // Delete membership
  const deleteMembership = async () => {
    try {
      await axios.delete(`/api/memberships/${membershipToDelete._id}`);
      setAlert("Membership deleted successfully", "success");
      getMemberships();
      closeDeleteDialog();
    } catch (err) {
      setAlert(err.response?.data?.msg || "Error deleting membership", "error");
    }
  };

  // Format duration
  const formatDuration = (duration) => {
    if (!duration) return "N/A";

    const { value, unit } = duration;
    return `${value} ${unit}`;
  };

  return (
    <Container maxWidth="lg">
      <Box mb={4}>
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            <Typography variant="h4" component="h1" gutterBottom>
              Memberships
            </Typography>
          </Grid>
          <Grid item>
            {(user?.role === "admin" || user?.role === "manager") && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => navigate("/memberships/new")}
              >
                Add Membership
              </Button>
            )}
          </Grid>
        </Grid>
      </Box>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search Memberships"
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  value={statusFilter}
                  label="Status"
                  onChange={handleStatusFilterChange}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
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
                <TableCell>Name</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Classes</TableCell>
                <TableCell>PT Sessions</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Loading memberships...
                  </TableCell>
                </TableRow>
              ) : paginatedMemberships.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No memberships found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMemberships.map((membership) => (
                  <TableRow
                    key={membership._id}
                    hover
                    onClick={() => navigate(`/memberships/${membership._id}`)}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell>{membership.name}</TableCell>
                    <TableCell>{formatCurrency(membership.price)}</TableCell>
                    <TableCell>{formatDuration(membership.duration)}</TableCell>
                    <TableCell>{membership.classesIncluded || 0}</TableCell>
                    <TableCell>
                      {membership.personalTrainingIncluded || 0}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={membership.isActive ? "Active" : "Inactive"}
                        color={membership.isActive ? "success" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/memberships/${membership._id}`);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      {(user?.role === "admin" || user?.role === "manager") && (
                        <IconButton
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteDialog(membership);
                          }}
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
          count={filteredMemberships.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog}>
        <DialogTitle>Delete Membership</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {membershipToDelete?.name}? This
            action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
          <Button onClick={deleteMembership} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Memberships;
