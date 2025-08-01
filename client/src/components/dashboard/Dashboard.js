import React, { useState, useContext, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  CircularProgress,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import PeopleIcon from "@mui/icons-material/People";
import PaymentIcon from "@mui/icons-material/Payment";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import MoneyOffIcon from "@mui/icons-material/MoneyOff";
import AuthContext from "../../context/auth/authContext";
import AlertContext from "../../context/alert/alertContext";

// Initial empty data structure
const initialData = {
  stats: {
    activeMembers: 0,
    totalRevenue: 0,
    activeClasses: 0,
    checkInsToday: 0,
    upcomingSessions: 0,
    membershipGrowth: 0,
    feesDueCount: 0,
    monthlyExpenses: 0,
  },
  recentMembers: [],
  upcomingClasses: [],
};

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
  ...theme.typography.body2,
  padding: theme.spacing(2),
  textAlign: "center",
  color: theme.palette.text.secondary,
  height: "100%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
}));

const StatCard = ({ icon, title, value, color, onClick }) => {
  return (
    <Item
      elevation={3}
      sx={{
        cursor: onClick ? "pointer" : "default",
        "&:hover": onClick ? { boxShadow: 6 } : {},
      }}
      onClick={onClick}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 1,
        }}
      >
        {icon}
      </Box>
      <Typography variant="h6" component="div" color="text.primary">
        {title}
      </Typography>
      <Typography
        variant="h4"
        component="div"
        sx={{ fontWeight: "bold", color }}
      >
        {value}
      </Typography>
      {onClick && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          Click to view details
        </Typography>
      )}
    </Item>
  );
};

const Dashboard = () => {
  const authContext = useContext(AuthContext);
  const alertContext = useContext(AlertContext);
  const { user } = authContext;
  const { setAlert } = alertContext;
  const navigate = useNavigate();

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);

  // Format currency for display
  const formatCurrency = (amount) => {
    // Ensure amount is a valid number
    const validAmount = Number(amount) || 0;
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(validAmount);
  };

  // Fetch dashboard data once on component mount
  useEffect(() => {
    // Create a flag to track if component is mounted
    let isMounted = true;
    // Create a flag to prevent multiple fetch attempts
    let fetchAttempted = false;

    const fetchDashboardData = async () => {
      // Prevent multiple fetch attempts
      if (fetchAttempted) return;
      fetchAttempted = true;

      // Only proceed if authenticated
      if (!authContext.isAuthenticated) {
        return;
      }

      try {
        setLoading(true);

        // Get today's date for class sessions
        const todayClasses = new Date().toISOString().split("T")[0];

        // Make API requests one at a time to avoid overwhelming the server
        const statsRes = await axios.get("/api/dashboard/stats");

        // Only continue if component is still mounted
        if (!isMounted) return;

        const membersRes = await axios.get("/api/members/recent");

        // Only continue if component is still mounted
        if (!isMounted) return;

        const classesRes = await axios.get(
          `/api/classes/sessions/date/${todayClasses}`
        );

        // Final check if component is still mounted
        if (!isMounted) return;

        // Process data and update state
        const stats = statsRes.data || {};

        const recentMembers = (membersRes.data || []).map((member) => ({
          id: member._id,
          name: `${member.firstName} ${member.lastName}`,
          joinDate: member.createdAt,
          plan: member.membershipType ? member.membershipType.name : "No Plan",
        }));

        const upcomingClasses = (classesRes.data || []).map((session) => ({
          id: session._id,
          name: session.class ? session.class.name : "Unknown Class",
          time: new Date(session.startTime).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          instructor: session.instructor
            ? typeof session.instructor === "object"
              ? `${session.instructor.firstName} ${session.instructor.lastName}`
              : "Unassigned"
            : "Unassigned",
          enrolled: session.enrolledMembers
            ? session.enrolledMembers.length
            : 0,
          capacity: session.class ? session.class.capacity : 0,
        }));

        setData({
          stats: {
            activeMembers: stats.activeMembers || 0,
            totalRevenue: stats.totalRevenue || 0,
            activeClasses: stats.activeClasses || 0,
            checkInsToday: stats.checkInsToday || 0,
            upcomingSessions: stats.upcomingSessions || 0,
            membershipGrowth: stats.membershipGrowth || 0,
            feesDueCount: stats.feesDueCount || 0,
            monthlyExpenses: stats.monthlyExpenses || 0, // Add monthly expenses to the state
          },
          recentMembers,
          upcomingClasses,
        });

        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard data:", err.message);

        if (isMounted) {
          setAlert("Error loading dashboard data. Please try again.", "error");
          setLoading(false);
        }
      }
    };

    // Execute fetch
    fetchDashboardData();

    // Cleanup function
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="subtitle1">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Welcome back, {user ? user.name : "User"}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's what's happening at your gym today.
        </Typography>
      </Box>

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {loading ? (
          <Grid
            item
            xs={12}
            sx={{ display: "flex", justifyContent: "center", py: 4 }}
          >
            <CircularProgress />
          </Grid>
        ) : (
          <>
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <StatCard
                icon={<PeopleIcon sx={{ fontSize: 40, color: "#1976d2" }} />}
                title="Active Members"
                value={data.stats.activeMembers}
                color="#1976d2"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <StatCard
                icon={<PaymentIcon sx={{ fontSize: 40, color: "#2e7d32" }} />}
                title="Monthly Revenue"
                value={formatCurrency(data.stats.totalRevenue)}
                color="#2e7d32"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <StatCard
                icon={
                  <FitnessCenterIcon sx={{ fontSize: 40, color: "#ed6c02" }} />
                }
                title="Active Classes"
                value={data.stats.activeClasses}
                color="#ed6c02"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <StatCard
                icon={<HowToRegIcon sx={{ fontSize: 40, color: "#9c27b0" }} />}
                title="Check-ins Today"
                value={data.stats.checkInsToday}
                color="#9c27b0"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <StatCard
                icon={
                  <CalendarTodayIcon sx={{ fontSize: 40, color: "#0288d1" }} />
                }
                title="Upcoming Sessions"
                value={data.stats.upcomingSessions}
                color="#0288d1"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <StatCard
                icon={
                  <TrendingUpIcon sx={{ fontSize: 40, color: "#d32f2f" }} />
                }
                title="New Members"
                value={data.stats.membershipGrowth}
                color="#4caf50"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <StatCard
                icon={<MoneyOffIcon sx={{ fontSize: 40, color: "#f44336" }} />}
                title="Monthly Expenses"
                value={formatCurrency(data.stats.monthlyExpenses)}
                color="#f44336"
                onClick={() => navigate("/expenses")}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <StatCard
                icon={
                  <NotificationsActiveIcon
                    sx={{ fontSize: 40, color: "#ff9800" }}
                  />
                }
                title="Fees Due"
                value={data.stats.feesDueCount}
                color="#ff9800"
                onClick={() => navigate("/members?filter=fees-due")}
              />
            </Grid>
          </>
        )}
      </Grid>

      {/* Quick Actions */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3} md={2}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate("/members/new")}
              sx={{ height: "100%" }}
            >
              Add Member
            </Button>
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate("/attendance/new")}
              sx={{ height: "100%" }}
            >
              Check-In
            </Button>
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate("/payments/new")}
              sx={{ height: "100%" }}
            >
              Record Payment
            </Button>
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate("/classes/sessions/new")}
              sx={{ height: "100%" }}
            >
              Schedule Class
            </Button>
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate("/members")}
              sx={{ height: "100%" }}
            >
              View Members
            </Button>
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate("/classes")}
              sx={{ height: "100%" }}
            >
              View Classes
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Recent Activity and Upcoming Classes */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Members
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                  <CircularProgress size={30} />
                </Box>
              ) : data.recentMembers.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ py: 2, textAlign: "center" }}
                >
                  No recent members found
                </Typography>
              ) : (
                <List>
                  {data.recentMembers.map((member) => (
                    <ListItem key={member.id} divider>
                      <ListItemAvatar>
                        <Avatar>{member.name.charAt(0)}</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={member.name}
                        secondary={`Joined: ${new Date(
                          member.joinDate
                        ).toLocaleDateString()} • ${member.plan}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
            <CardActions>
              <Button size="small" onClick={() => navigate("/members")}>
                View All Members
              </Button>
            </CardActions>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Today's Classes
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                  <CircularProgress size={30} />
                </Box>
              ) : data.upcomingClasses.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ py: 2, textAlign: "center" }}
                >
                  No classes scheduled for today
                </Typography>
              ) : (
                <List>
                  {data.upcomingClasses.map((cls) => (
                    <ListItem key={cls.id} divider>
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor:
                              cls.enrolled >= cls.capacity
                                ? "#f44336"
                                : "#4caf50",
                          }}
                        >
                          <FitnessCenterIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${cls.name} - ${cls.time}`}
                        secondary={`Instructor: ${cls.instructor} • ${cls.enrolled}/${cls.capacity} enrolled`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
            <CardActions>
              <Button
                size="small"
                onClick={() => navigate("/classes/sessions")}
              >
                View All Classes
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
