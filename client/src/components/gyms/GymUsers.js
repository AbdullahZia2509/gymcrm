import React, { useState, useEffect, useContext } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import AuthContext from "../../context/auth/authContext";
import AlertContext from "../../context/alert/alertContext";

const GymUsers = () => {
  const { id } = useParams();
  const authContext = useContext(AuthContext);
  const alertContext = useContext(AlertContext);

  const { user } = authContext;
  const { setAlert } = alertContext;

  const [gym, setGym] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === "superadmin") {
      getGymDetails();
      getGymUsers();
    } else {
      setAlert("Superadmin access required", "danger");
      setLoading(false);
    }
    // eslint-disable-next-line
  }, [user, id]);

  const getGymDetails = async () => {
    try {
      const res = await axios.get(`/api/gyms/${id}`);
      setGym(res.data);
    } catch (err) {
      setAlert("Error fetching gym details", "danger");
    }
  };

  const getGymUsers = async () => {
    try {
      const res = await axios.get(`/api/gyms/${id}/users`);
      setUsers(res.data);
      setLoading(false);
    } catch (err) {
      setAlert("Error fetching gym users", "danger");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "50vh",
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (user && user.role !== "superadmin") {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3, bgcolor: "#fff9f9", border: "1px solid #ffcccc" }}>
          <Typography variant="h5" color="error">
            Access Denied
          </Typography>
          <Typography variant="body1">
            You do not have permission to access this page.
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Button
          component={RouterLink}
          to="/gyms"
          startIcon={<ArrowBackIcon />}
          variant="outlined"
          sx={{ mb: 2 }}
        >
          Back to Gyms
        </Button>

        {gym && (
          <Typography variant="h4" component="h1" gutterBottom>
            Users for {gym.name}
          </Typography>
        )}
        <Divider sx={{ my: 2 }} />
      </Box>

      {users.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="body1" color="text.secondary">
            No users found for this gym
          </Typography>
        </Paper>
      ) : (
        <Paper>
          <TableContainer>
            <Table aria-label="gym users table">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Staff ID</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id} hover>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={
                          user.role.charAt(0).toUpperCase() + user.role.slice(1)
                        }
                        color={
                          user.role === "admin"
                            ? "primary"
                            : user.role === "manager"
                            ? "secondary"
                            : "default"
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{user.staff ? user.staff : "N/A"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ p: 2, pb: 2 }}>
            <Typography variant="body2" color="text.primary">
              Total Users: {users.length}
            </Typography>
          </Box>
        </Paper>
      )}
    </Container>
  );
};

export default GymUsers;
