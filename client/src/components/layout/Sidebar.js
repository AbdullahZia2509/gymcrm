import React, { useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { styled, useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import PaymentIcon from "@mui/icons-material/Payment";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import WorkIcon from "@mui/icons-material/Work";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import BarChartIcon from "@mui/icons-material/BarChart";
import SettingsIcon from "@mui/icons-material/Settings";
import BusinessIcon from "@mui/icons-material/Business";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import AuthContext from "../../context/auth/authContext";
import { Typography } from "@mui/material";

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: "flex-end",
}));

const Sidebar = ({ open, drawerWidth }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const authContext = useContext(AuthContext);
  const { user } = authContext;

  const isAdmin = user && (user.role === "admin" || user.role === "manager");
  const isSuperAdmin = user && user.role === "superadmin";

  const menuItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon />,
      path: "/",
      showAlways: true,
    },
    {
      text: "Members",
      icon: <PeopleIcon />,
      path: "/members",
      showAlways: true,
    },
    {
      text: "Memberships",
      icon: <CardMembershipIcon />,
      path: "/memberships",
      showAlways: true,
    },
    {
      text: "Payments",
      icon: <PaymentIcon />,
      path: "/payments",
      showAlways: true,
    },
    {
      text: "Attendance",
      icon: <HowToRegIcon />,
      path: "/attendance",
      showAlways: true,
    },
    {
      text: "Classes",
      icon: <FitnessCenterIcon />,
      path: "/classes",
      showAlways: true,
    },
    {
      text: "Staff",
      icon: <WorkIcon />,
      path: "/staff",
      showAdmin: true,
    },
    {
      text: "Users",
      icon: <SupervisorAccountIcon />,
      path: "/users",
      showAdmin: true,
    },
    {
      text: "Reports",
      icon: <BarChartIcon />,
      path: "/reports",
      showAlways: true,
    },
    {
      text: "Expenses",
      icon: <AttachMoneyIcon />,
      path: "/expenses",
      showAlways: true,
    },
    {
      text: "Settings",
      icon: <SettingsIcon />,
      path: "/settings",
      showAlways: true,
    },
    {
      text: "Gyms",
      icon: <BusinessIcon />,
      path: "/gyms",
      showSuperAdmin: true,
    },
  ];

  return (
    <Drawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
        },
      }}
      variant="persistent"
      anchor="left"
      open={open}
    >
      <DrawerHeader
        sx={{ display: "flex", justifyContent: "center", width: "100%" }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <FitnessCenterIcon sx={{ mr: 1 }} />
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Gym CRM
          </Typography>
        </Box>
      </DrawerHeader>
      <Divider />
      <List>
        {menuItems.map(
          (item) =>
            (item.showAlways || 
             (item.showAdmin && isAdmin) || 
             (item.showSuperAdmin && isSuperAdmin)) && (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={
                    location.pathname === item.path ||
                    (item.path === "/classes" &&
                      location.pathname.startsWith("/classes"))
                  }
                  onClick={() => navigate(item.path)}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            )
        )}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Divider />
      <Box sx={{ p: 2, textAlign: "center" }}>
        {/* <Box component="img" 
          src="https://via.placeholder.com/150x50?text=Gym+CRM" 
          alt="Gym CRM Logo"
          sx={{ maxWidth: '100%' }}
        /> */}
      </Box>
    </Drawer>
  );
};

export default Sidebar;
