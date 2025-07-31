import React, { useContext, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Alert from "./Alert";
import AuthContext from "../../context/auth/authContext";

const drawerWidth = 240;

const Main = styled("main", { shouldForwardProp: (prop) => prop !== "open" })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${drawerWidth}px`,
    ...(open && {
      transition: theme.transitions.create("margin", {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    }),
  })
);

const Layout = () => {
  const [open, setOpen] = React.useState(true);
  const authContext = useContext(AuthContext);

  const { loadUser } = authContext;

  useEffect(() => {
    loadUser();
    // eslint-disable-next-line
  }, []);

  const handleDrawer = () => {
    setOpen(!open);
  };

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <Navbar
        open={open}
        handleDrawer={handleDrawer}
        drawerWidth={drawerWidth}
      />
      <Sidebar open={open} drawerWidth={drawerWidth} />
      <Main open={open}>
        <Box sx={{ height: 64 }} /> {/* Toolbar spacer */}
        <Alert />
        <Outlet />
      </Main>
    </Box>
  );
};

export default Layout;
