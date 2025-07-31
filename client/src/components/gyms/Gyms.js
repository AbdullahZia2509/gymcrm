import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  Paper,
  Typography,
  CircularProgress,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import AuthContext from "../../context/auth/authContext";
import AlertContext from "../../context/alert/alertContext";
import GymItem from "./GymItem";
import GymForm from "./GymForm";

const Gyms = () => {
  const authContext = useContext(AuthContext);
  const alertContext = useContext(AlertContext);

  const { user } = authContext;
  const { setAlert } = alertContext;

  const [gyms, setGyms] = useState([]);
  const [currentGym, setCurrentGym] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [gymToDelete, setGymToDelete] = useState(null);

  useEffect(() => {
    if (user && user.role === "superadmin") {
      getGyms();
    } else {
      setAlert("Superadmin access required", "danger");
      setLoading(false);
    }
    // eslint-disable-next-line
  }, [user]);

  const getGyms = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/gyms");
      setGyms(res.data);
      setLoading(false);
    } catch (err) {
      setAlert("Error fetching gyms", "danger");
      setLoading(false);
    }
  };

  const addGym = async (gym) => {
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };

      const res = await axios.post("/api/gyms", gym, config);
      setGyms([...gyms, res.data]);
      setAlert("Gym added", "success");
      setShowForm(false);
    } catch (err) {
      setAlert(err.response.data.msg || "Error adding gym", "danger");
    }
  };

  const updateGym = async (gym) => {
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };

      const res = await axios.put(`/api/gyms/${gym._id}`, gym, config);

      setGyms(gyms.map((g) => (g._id === gym._id ? res.data : g)));
      setAlert("Gym updated", "success");
      setCurrentGym(null);
      setShowForm(false);
    } catch (err) {
      setAlert(err.response.data.msg || "Error updating gym", "danger");
    }
  };

  const deleteGym = async () => {
    if (!gymToDelete) return;

    try {
      await axios.delete(`/api/gyms/${gymToDelete._id}`);
      setGyms(gyms.filter((gym) => gym._id !== gymToDelete._id));
      setAlert("Gym removed", "success");
      setDeleteDialogOpen(false);
      setGymToDelete(null);
    } catch (err) {
      setAlert(err.response?.data?.msg || "Error deleting gym", "error");
      setDeleteDialogOpen(false);
    }
  };

  const openDeleteDialog = (gym) => {
    setGymToDelete(gym);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setGymToDelete(null);
  };

  const onEdit = (gym) => {
    setCurrentGym(gym);
    setShowForm(true);
  };

  const clearCurrentGym = () => {
    setCurrentGym(null);
    setShowForm(false);
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
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            <Typography variant="h4" component="h1" gutterBottom>
              Gym Management
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Manage gyms in the system (Superadmin only)
            </Typography>
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          {showForm ? (
            <Paper sx={{ p: 3 }}>
              <GymForm
                addGym={addGym}
                updateGym={updateGym}
                currentGym={currentGym}
                clearCurrentGym={clearCurrentGym}
              />
            </Paper>
          ) : (
            <Paper
              sx={{
                p: 3,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "100px",
              }}
            >
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => setShowForm(true)}
                fullWidth
              >
                Add New Gym
              </Button>
            </Paper>
          )}
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 0 }}>
            {gyms.length === 0 ? (
              <Box sx={{ p: 3, textAlign: "center" }}>
                <Typography variant="body1" color="text.secondary">
                  No gyms found
                </Typography>
              </Box>
            ) : (
              <Box>
                {gyms.map((gym) => (
                  <GymItem
                    key={gym._id}
                    gym={gym}
                    onEdit={() => onEdit(gym)}
                    onDelete={() => openDeleteDialog(gym)}
                  />
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog}>
        <DialogTitle>Delete Gym</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {gymToDelete?.name}? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
          <Button onClick={deleteGym} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Gyms;
