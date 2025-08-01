import React, { useState, useEffect, useContext, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import AuthContext from "../../context/auth/authContext";
import AlertContext from "../../context/alert/alertContext";
import LoadingSpinner from "../layout/LoadingSpinner";
import DeleteConfirmDialog from "../common/DeleteConfirmDialog";
import { format } from "date-fns";

const AttendanceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const alertContext = useContext(AlertContext);
  const { setAlert } = alertContext;
  const { user } = authContext;

  const isNew =
    id === "new" || window.location.pathname.includes("/attendance/new");
  const isEdit = window.location.pathname.includes("/edit");

  // State
  const [attendance, setAttendance] = useState({
    member: "",
    checkInTime: new Date(),
    checkOutTime: null,
    attendanceType: "gym",
    classSession: "",
    notes: "",
  });

  const [members, setMembers] = useState([]);
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const [memberSearchLoading, setMemberSearchLoading] = useState(false);
  const [classSessions, setClassSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Check if user has permission to modify
  const canModify = user && (user.role === "admin" || user.role === "manager");
  const isReadOnly = !isNew && !isEdit;

  // Debounced search function for members
  const searchMembers = async (searchTerm) => {
    if (!searchTerm && !attendance.member) {
      // If no search term and no selected member, just load a limited set
      setMemberSearchLoading(true);
      try {
        const response = await axios.get(
          "/api/members?limit=50&sort=firstName"
        );
        setMembers(response.data);
      } catch (err) {
        console.error("Error fetching members:", err);
      } finally {
        setMemberSearchLoading(false);
      }
      return;
    }

    setMemberSearchLoading(true);
    try {
      // Search by name, email, or phone
      const response = await axios.get(
        `/api/members/search?term=${encodeURIComponent(searchTerm)}`
      );
      setMembers(response.data);
    } catch (err) {
      console.error("Error searching members:", err);
    } finally {
      setMemberSearchLoading(false);
    }
  };

  // Debounce the search function to avoid too many API calls
  const debouncedSearchMembers = useMemo(() => {
    const debounce = (func, delay) => {
      let timeoutId;
      return (...args) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
      };
    };
    return debounce(searchMembers, 300);
  }, [attendance.member]);

  // Effect to trigger search when search term changes
  useEffect(() => {
    debouncedSearchMembers(memberSearchTerm);
  }, [memberSearchTerm, debouncedSearchMembers]);

  useEffect(() => {
    if (authContext.isAuthenticated) {
      loadData();
    }
    // eslint-disable-next-line
  }, [authContext.isAuthenticated]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load members data
      try {
        const membersRes = await axios.get(
          "/api/members?limit=50&sort=firstName"
        );
        setMembers(membersRes.data);
      } catch (err) {
        console.error("Error loading members:", err);
        setMembers([]);
      }

      // Try to load class sessions if the API exists
      try {
        const classSessionsRes = await axios.get(
          "/api/classes/sessions/active"
        );
        setClassSessions(classSessionsRes.data);
      } catch (err) {
        console.log("Classes module not implemented yet:", err.message);
        setClassSessions([]);
      }

      // If editing or viewing an existing attendance record, fetch its data
      if (!isNew && id) {
        try {
          const attendanceRes = await axios.get(`/api/attendance/${id}`);
          const attendanceData = attendanceRes.data;

          // Format dates properly
          if (attendanceData.checkInTime) {
            attendanceData.checkInTime = new Date(attendanceData.checkInTime);
          }

          if (attendanceData.checkOutTime) {
            attendanceData.checkOutTime = new Date(attendanceData.checkOutTime);
          }

          // Set member and class session IDs
          if (
            attendanceData.member &&
            typeof attendanceData.member === "object"
          ) {
            attendanceData.member = attendanceData.member._id;
          }

          if (
            attendanceData.classSession &&
            typeof attendanceData.classSession === "object"
          ) {
            attendanceData.classSession = attendanceData.classSession._id;
          }

          setAttendance(attendanceData);
        } catch (err) {
          console.error("Error fetching attendance:", err);
          if (err.response?.status === 404) {
            setAlert("Attendance record not found", "error");
            navigate("/attendance");
            return;
          }
        }
      }

      setLoading(false);
    } catch (err) {
      setAlert(
        "Error loading data: " + (err.response?.data?.msg || err.message),
        "error"
      );
      console.error("Error loading data:", err);
      setLoading(false);
      navigate("/attendance");
    }
  };

  const handleChange = (e) => {
    setAttendance({
      ...attendance,
      [e.target.name]: e.target.value,
    });

    // Clear error when field is updated
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: null,
      });
    }
  };

  const handleDateChange = (field, value) => {
    console.log("value", new Date(value).toISOString().split("T")[0]);
    try {
      // Ensure value is a valid date or null
      const dateValue = value ? new Date(value) : null;
      setAttendance({
        ...attendance,
        [field]: dateValue,
      });

      // Clear error when field is updated
      if (errors[field]) {
        setErrors({
          ...errors,
          [field]: null,
        });
      }
    } catch (err) {
      console.error(`Invalid date for ${field}:`, err);
      setErrors({
        ...errors,
        [field]: `Invalid date format for ${
          field === "checkInTime" ? "check-in time" : "check-out time"
        }`,
      });
    }
  };

  const handleAttendanceTypeChange = (e) => {
    const newType = e.target.value;
    setAttendance({
      ...attendance,
      attendanceType: newType,
      // Clear class session if type is not 'class'
      classSession: newType === "class" ? attendance.classSession : "",
    });

    // Clear error when field is updated
    if (errors.attendanceType) {
      setErrors({
        ...errors,
        attendanceType: null,
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!attendance.member) {
      newErrors.member = "Member is required";
    }

    if (!attendance.checkInTime) {
      newErrors.checkInTime = "Check-in time is required";
    } else {
      // Validate check-in time format
      try {
        const checkInDate = new Date(attendance.checkInTime);
        if (isNaN(checkInDate.getTime())) {
          newErrors.checkInTime = "Invalid check-in time format";
        }
      } catch (err) {
        newErrors.checkInTime = "Invalid check-in time format";
      }
    }

    if (!attendance.attendanceType) {
      newErrors.attendanceType = "Attendance type is required";
    }

    if (attendance.attendanceType === "class" && !attendance.classSession) {
      newErrors.classSession = "Class session is required for class attendance";
    }

    // If check-out time is provided, ensure it's after check-in time
    if (attendance.checkOutTime) {
      try {
        const checkOutDate = new Date(attendance.checkOutTime);

        if (isNaN(checkOutDate.getTime())) {
          newErrors.checkOutTime = "Invalid check-out time format";
        } else if (attendance.checkInTime) {
          const checkInDate = new Date(attendance.checkInTime);

          if (!isNaN(checkInDate.getTime()) && checkOutDate <= checkInDate) {
            newErrors.checkOutTime =
              "Check-out time must be after check-in time";
          }
        }
      } catch (err) {
        newErrors.checkOutTime = "Invalid check-out time format";
      }
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
      // Create a clean copy of the attendance data
      const attendanceData = {
        member: attendance.member,
        checkInTime: attendance.checkInTime,
        checkOutTime: attendance.checkOutTime,
        attendanceType: attendance.attendanceType,
        notes: attendance.notes,
      };

      // Only include classSession if attendance type is 'class'
      if (attendance.attendanceType === "class" && attendance.classSession) {
        attendanceData.classSession = attendance.classSession;
      }

      if (isNew) {
        await axios.post("/api/attendance", attendanceData);
        setAlert("Member checked in successfully", "success");
        navigate("/attendance");
      } else if (isEdit) {
        await axios.put(`/api/attendance/${id}`, attendanceData);
        setAlert("Attendance record updated successfully", "success");
        navigate(`/attendance/${id}`);
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.msg || "Error saving attendance record";
      setAlert(errorMsg, "error");
      console.error(
        "Error saving attendance:",
        err.response?.data || err.message
      );

      // Handle validation errors from server
      if (err.response?.data?.errors) {
        const serverErrors = {};
        err.response.data.errors.forEach((error) => {
          serverErrors[error.param] = error.msg;
        });
        setErrors({ ...errors, ...serverErrors });
      }
    }
  };

  const handleCheckout = async () => {
    try {
      await axios.put(`/api/attendance/checkout/${id}`);
      setAlert("Member checked out successfully", "success");
      navigate("/attendance");
    } catch (err) {
      setAlert(err.response?.data?.msg || "Error checking out member", "error");
      console.error("Error checking out member:", err);
    }
  };

  const handleEdit = () => {
    navigate(`/attendance/${id}/edit`);
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`/api/attendance/${id}`);
      setAlert("Attendance record deleted successfully", "success");
      navigate("/attendance");
    } catch (err) {
      setAlert(
        err.response?.data?.msg || "Error deleting attendance record",
        "error"
      );
      console.error("Error deleting attendance record:", err);
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container>
      <Box sx={{ mb: 4 }}>
        <Button
          component={Link}
          to="/attendance"
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 2 }}
        >
          Back to Attendance
        </Button>
        <Typography variant="h4" component="h1" gutterBottom>
          {isNew
            ? "Check In Member"
            : isEdit
            ? "Edit Attendance Record"
            : "Attendance Record Details"}
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Card>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Autocomplete
                    id="member-select"
                    options={members}
                    getOptionLabel={(option) =>
                      typeof option === "string"
                        ? option
                        : `${option.firstName} ${option.lastName}`
                    }
                    value={
                      members.find((m) => m._id === attendance.member) || null
                    }
                    onChange={(event, newValue) => {
                      setAttendance({
                        ...attendance,
                        member: newValue ? newValue._id : "",
                      });

                      // Clear error when field is updated
                      if (errors.member) {
                        setErrors({
                          ...errors,
                          member: null,
                        });
                      }
                    }}
                    onInputChange={(event, newInputValue) => {
                      setMemberSearchTerm(newInputValue);
                    }}
                    loading={memberSearchLoading}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Member *"
                        variant="outlined"
                        error={!!errors.member}
                        helperText={errors.member}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {memberSearchLoading ? (
                                <CircularProgress color="inherit" size={20} />
                              ) : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                        disabled={isReadOnly}
                        required
                      />
                    )}
                    disabled={isReadOnly}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl
                    fullWidth
                    required
                    error={!!errors.attendanceType}
                  >
                    <InputLabel id="attendance-type-label">
                      Attendance Type
                    </InputLabel>
                    <Select
                      labelId="attendance-type-label"
                      name="attendanceType"
                      value={attendance.attendanceType}
                      onChange={handleAttendanceTypeChange}
                      label="Attendance Type"
                      disabled={isReadOnly}
                    >
                      <MenuItem value="gym">Gym</MenuItem>
                      <MenuItem value="class">Class</MenuItem>
                    </Select>
                    {errors.attendanceType && (
                      <FormHelperText>{errors.attendanceType}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>

                {attendance.attendanceType === "class" && (
                  <Grid item xs={12} md={6}>
                    <FormControl
                      fullWidth
                      required={attendance.attendanceType === "class"}
                      error={!!errors.classSession}
                    >
                      <InputLabel id="class-session-label">
                        Class Session
                      </InputLabel>
                      <Select
                        labelId="class-session-label"
                        name="classSession"
                        value={attendance.classSession}
                        onChange={handleChange}
                        label="Class Session"
                        disabled={isReadOnly || classSessions.length === 0}
                      >
                        {classSessions.length === 0 ? (
                          <MenuItem value="" disabled>
                            No active class sessions available
                          </MenuItem>
                        ) : (
                          classSessions.map((session) => (
                            <MenuItem key={session._id} value={session._id}>
                              {session.class?.name || "Unknown"} -{" "}
                              {new Date(session.startTime).toLocaleString()}
                            </MenuItem>
                          ))
                        )}
                      </Select>
                      {errors.classSession && (
                        <FormHelperText>{errors.classSession}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                )}

                <Grid item xs={12} md={6}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        type="date"
                        label="Check-In Date *"
                        value={
                          attendance.checkInTime
                            ? format(
                                new Date(attendance.checkInTime),
                                "yyyy-MM-dd"
                              )
                            : ""
                        }
                        onChange={(e) => {
                          try {
                            const datePart = e.target.value;
                            if (!datePart) {
                              handleDateChange("checkInTime", null);
                              return;
                            }

                            // Get current time part or default to current time
                            const currentTime = attendance.checkInTime
                              ? new Date(attendance.checkInTime)
                              : new Date();

                            const hours = currentTime
                              .getHours()
                              .toString()
                              .padStart(2, "0");
                            const minutes = currentTime
                              .getMinutes()
                              .toString()
                              .padStart(2, "0");
                            const timePart = `${hours}:${minutes}`;

                            const newDate = new Date(
                              `${datePart}T${timePart}:00`
                            );

                            if (isNaN(newDate.getTime())) {
                              setErrors({
                                ...errors,
                                checkInTime: "Invalid date",
                              });
                              return;
                            }

                            handleDateChange("checkInTime", newDate);
                          } catch (err) {
                            console.error("Invalid date format", err);
                            setErrors({
                              ...errors,
                              checkInTime: "Invalid date format",
                            });
                          }
                        }}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        required
                        error={!!errors.checkInTime}
                        helperText={errors.checkInTime}
                        disabled={isReadOnly}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        type="time"
                        label="Check-In Time *"
                        value={
                          attendance.checkInTime
                            ? `${new Date(attendance.checkInTime)
                                .getHours()
                                .toString()
                                .padStart(2, "0")}:${new Date(
                                attendance.checkInTime
                              )
                                .getMinutes()
                                .toString()
                                .padStart(2, "0")}`
                            : ""
                        }
                        onChange={(e) => {
                          try {
                            const timePart = e.target.value;
                            if (!timePart) return;

                            // Get current date part or today
                            const currentDate = attendance.checkInTime
                              ? new Date(attendance.checkInTime)
                              : new Date();

                            const year = currentDate.getFullYear();
                            const month = (currentDate.getMonth() + 1)
                              .toString()
                              .padStart(2, "0");
                            const day = currentDate
                              .getDate()
                              .toString()
                              .padStart(2, "0");
                            const datePart = `${year}-${month}-${day}`;

                            const newDate = new Date(
                              `${datePart}T${timePart}:00`
                            );

                            if (isNaN(newDate.getTime())) {
                              setErrors({
                                ...errors,
                                checkInTime: "Invalid time",
                              });
                              return;
                            }

                            handleDateChange("checkInTime", newDate);
                          } catch (err) {
                            console.error("Invalid time format", err);
                            setErrors({
                              ...errors,
                              checkInTime: "Invalid time format",
                            });
                          }
                        }}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        required
                        error={!!errors.checkInTime}
                        helperText={errors.checkInTime}
                        disabled={isReadOnly}
                      />
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        type="date"
                        label="Check-Out Date"
                        value={
                          attendance.checkOutTime
                            ? format(
                                new Date(attendance.checkOutTime),
                                "yyyy-MM-dd"
                              )
                            : ""
                        }
                        onChange={(e) => {
                          try {
                            const datePart = e.target.value;
                            if (!datePart) {
                              handleDateChange("checkOutTime", null);
                              return;
                            }

                            // Get current time part or default to current time
                            const currentTime = attendance.checkOutTime
                              ? new Date(attendance.checkOutTime)
                              : new Date();

                            const hours = currentTime
                              .getHours()
                              .toString()
                              .padStart(2, "0");
                            const minutes = currentTime
                              .getMinutes()
                              .toString()
                              .padStart(2, "0");
                            const timePart = `${hours}:${minutes}`;

                            const newDate = new Date(
                              `${datePart}T${timePart}:00`
                            );

                            if (isNaN(newDate.getTime())) {
                              setErrors({
                                ...errors,
                                checkOutTime: "Invalid date",
                              });
                              return;
                            }

                            // Check if check-out time is after check-in time
                            if (
                              attendance.checkInTime &&
                              newDate <= new Date(attendance.checkInTime)
                            ) {
                              setErrors({
                                ...errors,
                                checkOutTime:
                                  "Check-out time must be after check-in time",
                              });
                              return;
                            }

                            handleDateChange("checkOutTime", newDate);
                          } catch (err) {
                            console.error("Invalid date format", err);
                            setErrors({
                              ...errors,
                              checkOutTime: "Invalid date format",
                            });
                          }
                        }}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        error={!!errors.checkOutTime}
                        helperText={errors.checkOutTime}
                        disabled={isReadOnly}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        type="time"
                        label="Check-Out Time"
                        value={
                          attendance.checkOutTime
                            ? `${new Date(attendance.checkOutTime)
                                .getHours()
                                .toString()
                                .padStart(2, "0")}:${new Date(
                                attendance.checkOutTime
                              )
                                .getMinutes()
                                .toString()
                                .padStart(2, "0")}`
                            : ""
                        }
                        onChange={(e) => {
                          try {
                            const timePart = e.target.value;
                            if (!timePart) return;

                            // Get current date part or today
                            const currentDate = attendance.checkOutTime
                              ? new Date(attendance.checkOutTime)
                              : new Date();

                            const year = currentDate.getFullYear();
                            const month = (currentDate.getMonth() + 1)
                              .toString()
                              .padStart(2, "0");
                            const day = currentDate
                              .getDate()
                              .toString()
                              .padStart(2, "0");
                            const datePart = `${year}-${month}-${day}`;

                            const newDate = new Date(
                              `${datePart}T${timePart}:00`
                            );

                            if (isNaN(newDate.getTime())) {
                              setErrors({
                                ...errors,
                                checkOutTime: "Invalid time",
                              });
                              return;
                            }

                            // Check if check-out time is after check-in time
                            if (attendance.checkInTime) {
                              const checkInDate = new Date(
                                attendance.checkInTime
                              );
                              const checkInDateOnly = new Date(
                                checkInDate.getFullYear(),
                                checkInDate.getMonth(),
                                checkInDate.getDate()
                              );
                              const checkOutDateOnly = new Date(
                                currentDate.getFullYear(),
                                currentDate.getMonth(),
                                currentDate.getDate()
                              );

                              if (
                                checkOutDateOnly.getTime() ===
                                  checkInDateOnly.getTime() &&
                                newDate <= checkInDate
                              ) {
                                setErrors({
                                  ...errors,
                                  checkOutTime:
                                    "Check-out time must be after check-in time",
                                });
                                return;
                              }
                            }

                            handleDateChange("checkOutTime", newDate);
                          } catch (err) {
                            console.error("Invalid time format", err);
                            setErrors({
                              ...errors,
                              checkOutTime: "Invalid time format",
                            });
                          }
                        }}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        error={!!errors.checkOutTime}
                        helperText={errors.checkOutTime}
                        disabled={isReadOnly}
                      />
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    name="notes"
                    label="Notes"
                    value={attendance.notes || ""}
                    onChange={handleChange}
                    fullWidth
                    multiline
                    rows={3}
                    disabled={isReadOnly}
                  />
                </Grid>
              </Grid>

              <Box
                sx={{ mt: 3, display: "flex", justifyContent: "space-between" }}
              >
                <Box>
                  {!isNew && canModify && !isEdit && (
                    <>
                      <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<EditIcon />}
                        onClick={handleEdit}
                        sx={{ mr: 1 }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={handleDelete}
                        sx={{ mr: 1 }}
                      >
                        Delete
                      </Button>
                      {!attendance.checkOutTime && (
                        <Button
                          variant="contained"
                          color="secondary"
                          startIcon={<ExitToAppIcon />}
                          onClick={handleCheckout}
                        >
                          Check Out
                        </Button>
                      )}
                    </>
                  )}
                </Box>
                {(isNew || isEdit) && canModify && (
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                  >
                    {isNew ? "Check In" : "Save Changes"}
                  </Button>
                )}
              </Box>
            </form>
          </CardContent>
        </Card>
      </Box>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Attendance Record"
        content="Are you sure you want to delete this attendance record? This action cannot be undone."
      />
    </Container>
  );
};

export default AttendanceDetail;
