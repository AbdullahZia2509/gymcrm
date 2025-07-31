import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  Event as EventIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import AlertContext from "../../context/alert/alertContext";
import AuthContext from "../../context/auth/authContext";
import LoadingSpinner from "../layout/LoadingSpinner";
import DeleteConfirmDialog from "../common/DeleteConfirmDialog";

const Classes = () => {
  const navigate = useNavigate();
  const alertContext = useContext(AlertContext);
  const authContext = useContext(AuthContext);
  const { setAlert } = alertContext;
  const { user } = authContext;

  const [classes, setClasses] = useState([]);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [classToDelete, setClassToDelete] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categories, setCategories] = useState([]);

  // Check if user has permission to modify classes
  const canModify = user && (user.role === "admin" || user.role === "manager");

  useEffect(() => {
    if (authContext.isAuthenticated) {
      loadClasses();
    }
    // eslint-disable-next-line
  }, [authContext.isAuthenticated]);

  useEffect(() => {
    filterClasses();
    // eslint-disable-next-line
  }, [searchTerm, categoryFilter, classes]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/classes");
      setClasses(res.data);

      // Extract unique categories
      const uniqueCategories = [
        ...new Set(res.data.map((cls) => cls.category)),
      ];
      setCategories(uniqueCategories);

      setLoading(false);
    } catch (err) {
      setAlert(err.response?.data?.msg || "Error fetching classes", "error");
      setLoading(false);
    }
  };

  const filterClasses = () => {
    let filtered = classes;

    // Filter by search term
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (cls) =>
          cls.name.toLowerCase().includes(searchTermLower) ||
          cls.description.toLowerCase().includes(searchTermLower) ||
          (cls.instructor &&
            cls.instructor.name.toLowerCase().includes(searchTermLower))
      );
    }

    // Filter by category
    if (categoryFilter !== "all") {
      filtered = filtered.filter((cls) => cls.category === categoryFilter);
    }

    setFilteredClasses(filtered);
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
    setPage(0);
  };

  const handleCategoryFilterChange = (e) => {
    setCategoryFilter(e.target.value);
    setPage(0);
  };

  const openDeleteDialog = (classItem) => {
    setClassToDelete(classItem);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setClassToDelete(null);
  };

  const deleteClass = async () => {
    if (!classToDelete) return;

    try {
      await axios.delete(`/api/classes/${classToDelete._id}`);
      setAlert("Class deleted successfully", "success");
      loadClasses();
      closeDeleteDialog();
    } catch (err) {
      setAlert(err.response?.data?.msg || "Error deleting class", "error");
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
              Classes
            </Typography>
          </Grid>
          {canModify && (
            <Grid item>
              <Button
                onClick={() => {
                  navigate("/classes/new");
                }}
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
              >
                Add Class
              </Button>
            </Grid>
          )}
        </Grid>
      </Box>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Search Classes"
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
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  onChange={handleCategoryFilterChange}
                  label="Category"
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
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
                <TableCell>Category</TableCell>
                <TableCell>Instructor</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Capacity</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredClasses.length > 0 ? (
                filteredClasses
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((classItem) => (
                    <TableRow key={classItem._id}>
                      <TableCell>{classItem.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={classItem.category}
                          color="primary"
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {classItem.instructor
                          ? classItem.instructor.name
                          : "Not Assigned"}
                      </TableCell>
                      <TableCell>{classItem.durationMinutes} min</TableCell>
                      <TableCell>{classItem.capacity}</TableCell>
                      <TableCell>
                        <IconButton
                          component={Link}
                          to={`/classes/${classItem._id}`}
                          size="small"
                          color="info"
                          title="View"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          component={Link}
                          to={`/classes/${classItem._id}/sessions`}
                          size="small"
                          color="secondary"
                          title="Sessions"
                        >
                          <EventIcon fontSize="small" />
                        </IconButton>
                        {canModify && (
                          <>
                            <IconButton
                              component={Link}
                              to={`/classes/${classItem._id}/edit`}
                              size="small"
                              color="primary"
                              title="Edit"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => openDeleteDialog(classItem)}
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
                  <TableCell colSpan={6} align="center">
                    No classes found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredClasses.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={deleteClass}
        title="Confirm Delete"
        content={
          <>
            Are you sure you want to delete this class?
            {classToDelete && (
              <Box
                component="span"
                sx={{ display: "block", mt: 1, fontWeight: "bold" }}
              >
                {classToDelete.name}
              </Box>
            )}
            This action cannot be undone.
          </>
        }
      />
    </Container>
  );
};

export default Classes;
