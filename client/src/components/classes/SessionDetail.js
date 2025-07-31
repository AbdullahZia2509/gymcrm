import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
  Avatar
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import AlertContext from '../../context/alert/alertContext';
import AuthContext from '../../context/auth/authContext';
import LoadingSpinner from '../layout/LoadingSpinner';
import DeleteConfirmDialog from '../common/DeleteConfirmDialog';
import { formatDate } from '../../utils/format';

const SessionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const alertContext = useContext(AlertContext);
  const authContext = useContext(AuthContext);
  const { setAlert } = alertContext;
  const { user } = authContext;

  // Check if user has permission to modify
  const canModify = user && (user.role === 'admin' || user.role === 'manager' || user.role === 'trainer');

  const [session, setSession] = useState(null);
  const [classData, setClassData] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  
  // Member search and enrollment
  const [members, setMembers] = useState([]);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [memberSearchLoading, setMemberSearchLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [memberToUnenroll, setMemberToUnenroll] = useState(null);
  const [unenrollDialogOpen, setUnenrollDialogOpen] = useState(false);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [memberToMarkAttendance, setMemberToMarkAttendance] = useState(null);

  useEffect(() => {
    if (authContext.isAuthenticated) {
      loadData();
    }
    // eslint-disable-next-line
  }, [authContext.isAuthenticated]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load session details with enrollments
      const sessionRes = await axios.get(`/api/classes/sessions/${id}`);
      setSession(sessionRes.data);
      
      // Load parent class details
      const classRes = await axios.get(`/api/classes/${sessionRes.data.class}`);
      setClassData(classRes.data);
      
      // Process enrollments
      if (sessionRes.data.enrolledMembers && Array.isArray(sessionRes.data.enrolledMembers)) {
        setEnrollments(sessionRes.data.enrolledMembers);
      }
      
      setLoading(false);
    } catch (err) {
      setAlert(
        err.response?.data?.msg || 'Error loading session data',
        'error'
      );
      setLoading(false);
      
      // Navigate back if session not found
      if (err.response?.status === 404) {
        navigate('/classes');
      }
    }
  };

  // Debounced search function for members
  const searchMembers = async (searchTerm) => {
    if (!searchTerm) {
      setMembers([]);
      return;
    }
    
    setMemberSearchLoading(true);
    try {
      // Search by name, email, or phone
      const response = await axios.get(`/api/members/search?term=${encodeURIComponent(searchTerm)}`);
      
      // Filter out already enrolled members
      const alreadyEnrolledIds = enrollments.map(enrollment => 
        typeof enrollment.member === 'object' ? enrollment.member._id : enrollment.member
      );
      
      const filteredMembers = response.data.filter(member => 
        !alreadyEnrolledIds.includes(member._id)
      );
      
      setMembers(filteredMembers);
    } catch (err) {
      console.error('Error searching members:', err);
    } finally {
      setMemberSearchLoading(false);
    }
  };
  
  // Debounce the search function
  const debouncedSearchMembers = useMemo(() => {
    const debounce = (func, delay) => {
      let timeoutId;
      return (...args) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
      };
    };
    return debounce(searchMembers, 300);
  }, [enrollments]);

  // Effect to trigger search when search term changes
  useEffect(() => {
    debouncedSearchMembers(memberSearchTerm);
  }, [memberSearchTerm, debouncedSearchMembers]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const openEnrollDialog = () => {
    setSelectedMember(null);
    setMemberSearchTerm('');
    setMembers([]);
    setEnrollDialogOpen(true);
  };

  const closeEnrollDialog = () => {
    setEnrollDialogOpen(false);
  };

  const openUnenrollDialog = (enrollment) => {
    setMemberToUnenroll(enrollment);
    setUnenrollDialogOpen(true);
  };

  const closeUnenrollDialog = () => {
    setUnenrollDialogOpen(false);
    setMemberToUnenroll(null);
  };

  const openAttendanceDialog = (enrollment) => {
    setMemberToMarkAttendance(enrollment);
    setAttendanceDialogOpen(true);
  };

  const closeAttendanceDialog = () => {
    setAttendanceDialogOpen(false);
    setMemberToMarkAttendance(null);
  };

  const enrollMember = async () => {
    if (!selectedMember) {
      setAlert('Please select a member to enroll', 'error');
      return;
    }
    
    try {
      await axios.post(`/api/classes/sessions/${id}/enroll`, {
        memberId: selectedMember._id
      });
      
      setAlert('Member enrolled successfully', 'success');
      loadData();
      closeEnrollDialog();
    } catch (err) {
      setAlert(
        err.response?.data?.msg || 'Error enrolling member',
        'error'
      );
    }
  };

  const unenrollMember = async () => {
    if (!memberToUnenroll) return;
    
    try {
      const memberId = typeof memberToUnenroll.member === 'object' 
        ? memberToUnenroll.member._id 
        : memberToUnenroll.member;
      
      await axios.delete(`/api/classes/sessions/${id}/enroll/${memberId}`);
      
      setAlert('Member unenrolled successfully', 'success');
      loadData();
      closeUnenrollDialog();
    } catch (err) {
      setAlert(
        err.response?.data?.msg || 'Error unenrolling member',
        'error'
      );
    }
  };

  const markAttendance = async (attended) => {
    if (!memberToMarkAttendance) return;
    
    try {
      const memberId = typeof memberToMarkAttendance.member === 'object' 
        ? memberToMarkAttendance.member._id 
        : memberToMarkAttendance.member;
      
      await axios.put(`/api/classes/sessions/${id}/attendance/${memberId}`, {
        attended
      });
      
      setAlert(`Member marked as ${attended ? 'attended' : 'absent'}`, 'success');
      loadData();
      closeAttendanceDialog();
    } catch (err) {
      setAlert(
        err.response?.data?.msg || 'Error updating attendance',
        'error'
      );
    }
  };

  const isSessionPast = () => {
    if (!session) return false;
    const sessionTime = new Date(session.startTime);
    return sessionTime < new Date();
  };

  const isSessionFull = () => {
    if (!session) return false;
    const capacity = session.capacity || (classData && classData.capacity) || 0;
    return enrollments.length >= capacity;
  };

  const getSessionStatusChip = () => {
    if (!session) return null;
    
    if (!session.isActive) {
      return <Chip label="Cancelled" color="error" />;
    }
    
    if (isSessionPast()) {
      return <Chip label="Completed" color="default" />;
    }
    
    if (isSessionFull()) {
      return <Chip label="Full" color="warning" />;
    }
    
    return <Chip label="Upcoming" color="success" />;
  };

  const getAttendanceStats = () => {
    if (!enrollments.length) return { attended: 0, total: 0, percentage: 0 };
    
    const attended = enrollments.filter(enrollment => enrollment.attended).length;
    const total = enrollments.length;
    const percentage = Math.round((attended / total) * 100);
    
    return { attended, total, percentage };
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const attendanceStats = getAttendanceStats();

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 3, mb: 4 }}>
        <Button
          component={Link}
          to={`/classes/${classData?._id}/sessions`}
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 2 }}
        >
          Back to Sessions
        </Button>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Typography variant="h4" component="h1" gutterBottom>
              {classData?.name} - Session Details
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {formatDate(session?.startTime, true)} | {classData?.durationMinutes} minutes
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            {getSessionStatusChip()}
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Session Information
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Date & Time" 
                    secondary={formatDate(session?.startTime, true)} 
                  />
                </ListItem>
                <Divider component="li" />
                
                <ListItem>
                  <ListItemText 
                    primary="Instructor" 
                    secondary={
                      session?.instructor ? 
                        (typeof session.instructor === 'object' ? 
                          `${session.instructor.firstName} ${session.instructor.lastName}` : 
                          'Assigned Instructor') : 
                        'Not Assigned'
                    } 
                  />
                </ListItem>
                <Divider component="li" />
                
                <ListItem>
                  <ListItemText 
                    primary="Capacity" 
                    secondary={`${enrollments.length} / ${session?.capacity || classData?.capacity || 0}`} 
                  />
                </ListItem>
                <Divider component="li" />
                
                <ListItem>
                  <ListItemText 
                    primary="Status" 
                    secondary={session?.isActive ? 'Active' : 'Cancelled'} 
                  />
                </ListItem>
                {session?.notes && (
                  <>
                    <Divider component="li" />
                    <ListItem>
                      <ListItemText 
                        primary="Notes" 
                        secondary={session.notes} 
                      />
                    </ListItem>
                  </>
                )}
              </List>
            </CardContent>
          </Card>
          
          {isSessionPast() && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Attendance Statistics
                </Typography>
                
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h3" color="primary">
                    {attendanceStats.percentage}%
                  </Typography>
                  <Typography variant="body1">
                    {attendanceStats.attended} of {attendanceStats.total} members attended
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange}>
                <Tab label="Enrolled Members" />
                {isSessionPast() && <Tab label="Attendance" />}
              </Tabs>
            </Box>
            
            <Box sx={{ p: 2 }}>
              {tabValue === 0 && (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">
                      Enrolled Members ({enrollments.length})
                    </Typography>
                    {canModify && !isSessionPast() && !session?.isActive && (
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={openEnrollDialog}
                        disabled={isSessionFull()}
                      >
                        Enroll Member
                      </Button>
                    )}
                  </Box>
                  
                  {enrollments.length > 0 ? (
                    <List>
                      {enrollments.map((enrollment, index) => {
                        const member = typeof enrollment.member === 'object' ? enrollment.member : null;
                        if (!member) return null;
                        
                        return (
                          <React.Fragment key={member._id || index}>
                            <ListItem>
                              <ListItemAvatar>
                                <Avatar>
                                  <PersonIcon />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={`${member.firstName} ${member.lastName}`}
                                secondary={member.email || member.phone || 'No contact info'}
                              />
                              {canModify && !isSessionPast() && !session?.isActive && (
                                <ListItemSecondaryAction>
                                  <IconButton
                                    edge="end"
                                    color="error"
                                    onClick={() => openUnenrollDialog(enrollment)}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </ListItemSecondaryAction>
                              )}
                            </ListItem>
                            {index < enrollments.length - 1 && <Divider component="li" />}
                          </React.Fragment>
                        );
                      })}
                    </List>
                  ) : (
                    <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
                      No members enrolled in this session yet.
                    </Typography>
                  )}
                </>
              )}
              
              {tabValue === 1 && isSessionPast() && (
                <>
                  <Typography variant="h6" gutterBottom>
                    Attendance Tracking
                  </Typography>
                  
                  {enrollments.length > 0 ? (
                    <List>
                      {enrollments.map((enrollment, index) => {
                        const member = typeof enrollment.member === 'object' ? enrollment.member : null;
                        if (!member) return null;
                        
                        return (
                          <React.Fragment key={member._id || index}>
                            <ListItem>
                              <ListItemAvatar>
                                <Avatar>
                                  <PersonIcon />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={`${member.firstName} ${member.lastName}`}
                                secondary={member.email || member.phone || 'No contact info'}
                              />
                              <Chip
                                label={enrollment.attended ? 'Attended' : 'Absent'}
                                color={enrollment.attended ? 'success' : 'default'}
                                sx={{ mr: 1 }}
                              />
                              {canModify && (
                                <IconButton
                                  edge="end"
                                  color="primary"
                                  onClick={() => openAttendanceDialog(enrollment)}
                                >
                                  <EditIcon />
                                </IconButton>
                              )}
                            </ListItem>
                            {index < enrollments.length - 1 && <Divider component="li" />}
                          </React.Fragment>
                        );
                      })}
                    </List>
                  ) : (
                    <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
                      No members were enrolled in this session.
                    </Typography>
                  )}
                </>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Enroll Member Dialog */}
      <Dialog
        open={enrollDialogOpen}
        onClose={closeEnrollDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Enroll Member</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={members}
            getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
            loading={memberSearchLoading}
            onChange={(event, newValue) => {
              setSelectedMember(newValue);
            }}
            onInputChange={(event, newInputValue) => {
              setMemberSearchTerm(newInputValue);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search Member"
                fullWidth
                margin="normal"
                variant="outlined"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {memberSearchLoading ? <LoadingSpinner size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEnrollDialog}>Cancel</Button>
          <Button
            onClick={enrollMember}
            variant="contained"
            color="primary"
            disabled={!selectedMember}
          >
            Enroll
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unenroll Confirmation Dialog */}
      <DeleteConfirmDialog
        open={unenrollDialogOpen}
        onClose={closeUnenrollDialog}
        onConfirm={unenrollMember}
        title="Confirm Unenroll"
        content={
          <>
            Are you sure you want to unenroll this member from the class session?
            {memberToUnenroll && typeof memberToUnenroll.member === 'object' && (
              <Box component="span" sx={{ display: 'block', mt: 1, fontWeight: 'bold' }}>
                {memberToUnenroll.member.firstName} {memberToUnenroll.member.lastName}
              </Box>
            )}
          </>
        }
      />

      {/* Mark Attendance Dialog */}
      <Dialog
        open={attendanceDialogOpen}
        onClose={closeAttendanceDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Update Attendance</DialogTitle>
        <DialogContent>
          {memberToMarkAttendance && typeof memberToMarkAttendance.member === 'object' && (
            <Typography variant="body1" gutterBottom>
              Mark {memberToMarkAttendance.member.firstName} {memberToMarkAttendance.member.lastName} as:
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => markAttendance(false)}
            variant="outlined"
            color="error"
            startIcon={<CloseIcon />}
          >
            Absent
          </Button>
          <Button
            onClick={() => markAttendance(true)}
            variant="contained"
            color="success"
            startIcon={<CheckIcon />}
          >
            Attended
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SessionDetail;
