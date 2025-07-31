import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
  Typography
} from '@mui/material';
// import { DatePicker } from '@mui/x-date-pickers';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import AuthContext from '../../context/auth/authContext';
import AlertContext from '../../context/alert/alertContext';
import LoadingSpinner from '../layout/LoadingSpinner';
import DeleteConfirmDialog from '../common/DeleteConfirmDialog';

const Attendance = () => {
  const authContext = useContext(AuthContext);
  const alertContext = useContext(AlertContext);
  const { setAlert } = alertContext;
  const { user } = authContext;

  // State
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'completed'
  const [filterDate, setFilterDate] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);

  // Check if user has permission to modify
  const canModify = user && (user.role === 'admin' || user.role === 'manager');

  useEffect(() => {
    loadAttendanceRecords();
    // eslint-disable-next-line
  }, [filterStatus, filterDate]);

  const loadAttendanceRecords = async () => {
    try {
      setLoading(true);
      let url = '/api/attendance';
      
      // Apply filters
      if (filterStatus === 'active') {
        url = '/api/attendance/status/active';
      } else if (filterDate) {
        // Handle string date format YYYY-MM-DD
        url = `/api/attendance/date/${filterDate}`;
      }
      
      const res = await axios.get(url);
      setAttendanceRecords(res.data);
      setLoading(false);
    } catch (err) {
      setAlert(err.response?.data?.msg || 'Error loading attendance records', 'error');
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

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const handleStatusFilterChange = (e) => {
    setFilterStatus(e.target.value);
    setPage(0);
  };

  const handleDateFilterChange = (e) => {
    setFilterDate(e.target.value || null);
    setPage(0);
  };

  const handleCheckout = async (id) => {
    try {
      await axios.put(`/api/attendance/checkout/${id}`);
      setAlert('Member checked out successfully', 'success');
      loadAttendanceRecords();
    } catch (err) {
      setAlert(err.response?.data?.msg || 'Error checking out member', 'error');
    }
  };

  const handleDeleteClick = (record) => {
    setRecordToDelete(record);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return;
    
    try {
      await axios.delete(`/api/attendance/${recordToDelete._id}`);
      setAttendanceRecords(attendanceRecords.filter(record => record._id !== recordToDelete._id));
      setAlert('Attendance record deleted', 'success');
    } catch (err) {
      setAlert(err.response?.data?.msg || 'Error deleting record', 'error');
    } finally {
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setRecordToDelete(null);
  };

  // Format date and time
  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    const date = new Date(dateTime);
    return date.toLocaleString();
  };

  // Format duration in hours and minutes
  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Get attendance type display name
  const getAttendanceTypeDisplay = (type) => {
    switch (type) {
      case 'gym':
        return 'Gym';
      case 'class':
        return 'Class';
      case 'personal_training':
        return 'Personal Training';
      default:
        return type;
    }
  };

  // Get status chip color
  const getStatusChipColor = (record) => {
    return record.checkOutTime ? 'success' : 'warning';
  };

  // Filter records based on search term
  const filteredRecords = attendanceRecords.filter(record => {
    if (!searchTerm) return true;
    
    const searchTermLower = searchTerm.toLowerCase();
    
    // Check if member exists before trying to access properties
    if (!record.member) return false;
    
    const memberName = `${record.member.firstName || ''} ${record.member.lastName || ''}`.toLowerCase();
    const memberEmail = (record.member.email || '').toLowerCase();
    const memberPhone = (record.member.phone || '').toLowerCase();
    
    return memberName.includes(searchTermLower) || 
           memberEmail.includes(searchTermLower) || 
           memberPhone.includes(searchTermLower);
  });

  // Apply pagination
  const paginatedRecords = filteredRecords.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Attendance
        </Typography>
        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Search by member name or class"
              value={searchTerm}
              onChange={handleSearchChange}
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={handleStatusFilterChange}
                label="Status"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="active">Active (Checked In)</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Filter by Date (YYYY-MM-DD)"
              value={filterDate || ''}
              onChange={(e) => {
                const dateValue = e.target.value;
                setFilterDate(dateValue || null);
                setPage(0);
              }}
              placeholder="YYYY-MM-DD"
              variant="outlined"
              size="small"
              helperText="Format: YYYY-MM-DD"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Box display="flex" justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
              {canModify && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  component={Link}
                  to="/attendance/new"
                >
                  Check In Member
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>

        <Card>
          <CardContent sx={{ p: 0 }}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Member</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Check-In Time</TableCell>
                    <TableCell>Check-Out Time</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedRecords.length > 0 ? (
                    paginatedRecords.map((record) => (
                      <TableRow key={record._id}>
                        <TableCell>
                          {record.member ? `${record.member.firstName} ${record.member.lastName}` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {record.attendanceType === 'class' && record.classSession ? (
                            <span>
                              {getAttendanceTypeDisplay(record.attendanceType)}: {record.classSession.class?.name || 'N/A'}
                            </span>
                          ) : (
                            getAttendanceTypeDisplay(record.attendanceType)
                          )}
                        </TableCell>
                        <TableCell>{formatDateTime(record.checkInTime)}</TableCell>
                        <TableCell>{formatDateTime(record.checkOutTime)}</TableCell>
                        <TableCell>{formatDuration(record.duration)}</TableCell>
                        <TableCell>
                          <Chip
                            label={record.checkOutTime ? 'Completed' : 'Active'}
                            color={getStatusChipColor(record)}
                            size="small"
                            icon={record.checkOutTime ? <CheckCircleIcon /> : null}
                          />
                        </TableCell>
                        <TableCell>
                          <Box>
                            {canModify && (
                              <>
                                {!record.checkOutTime && (
                                  <IconButton
                                    color="primary"
                                    size="small"
                                    onClick={() => handleCheckout(record._id)}
                                    title="Check Out"
                                  >
                                    <ExitToAppIcon />
                                  </IconButton>
                                )}
                                <IconButton
                                  color="primary"
                                  size="small"
                                  component={Link}
                                  to={`/attendance/${record._id}/edit`}
                                  title="Edit"
                                >
                                  <EditIcon />
                                </IconButton>
                                <IconButton
                                  color="error"
                                  size="small"
                                  onClick={() => handleDeleteClick(record)}
                                  title="Delete"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No attendance records found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredRecords.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </CardContent>
        </Card>
      </Box>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Attendance Record"
        content={`Are you sure you want to delete this attendance record for ${recordToDelete?.member?.firstName || ''} ${recordToDelete?.member?.lastName || ''}? This action cannot be undone.`}
      />
    </Container>
  );
};

export default Attendance;
