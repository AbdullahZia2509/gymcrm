import React, { useReducer, useContext, useEffect } from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import ThemeContext from "./themeContext";
import themeReducer from "./themeReducer";
import SettingsContext from "../settings/settingsContext";
import {
  SET_THEME_MODE,
  SET_PRIMARY_COLOR,
  SET_SECONDARY_COLOR,
  THEME_LOADED,
} from "../types";

const ThemeState = (props) => {
  const initialState = {
    mode: "dark",
    primaryColor: "#1976d2", // Default MUI blue
    secondaryColor: "#dc004e", // Default MUI pink
    loaded: false,
  };

  const [state, dispatch] = useReducer(themeReducer, initialState);
  const settingsContext = useContext(SettingsContext);
  const { settings } = settingsContext;

  // Load theme settings from settings context when available
  useEffect(() => {
    if (settings && settings.appearance) {
      const darkModeSettings = settings.appearance.find(
        (s) => s.key === "darkMode"
      );
      const primaryColorSettings = settings.appearance.find(
        (s) => s.key === "primaryColor"
      );
      const secondaryColorSettings = settings.appearance.find(
        (s) => s.key === "secondaryColor"
      );

      if (darkModeSettings) {
        setThemeMode(darkModeSettings.value ? "dark" : "light");
      }

      if (primaryColorSettings) {
        setPrimaryColor(primaryColorSettings.value);
      }

      if (secondaryColorSettings) {
        setSecondaryColor(secondaryColorSettings.value);
      }

      dispatch({ type: THEME_LOADED });
    }
  }, [settings]);

  // Set theme mode (light/dark)
  const setThemeMode = (mode) => {
    dispatch({
      type: SET_THEME_MODE,
      payload: mode,
    });
  };

  // Set primary color
  const setPrimaryColor = (color) => {
    dispatch({
      type: SET_PRIMARY_COLOR,
      payload: color,
    });
  };

  // Set secondary color
  const setSecondaryColor = (color) => {
    dispatch({
      type: SET_SECONDARY_COLOR,
      payload: color,
    });
  };

  // Create MUI theme based on current state
  const theme = createTheme({
    palette: {
      mode: state.mode,
      primary: {
        main: state.primaryColor,
      },
      secondary: {
        main: state.secondaryColor,
      },
      background: {
        default: state.mode === "dark" ? "#121212" : "#f5f5f5",
        paper: state.mode === "dark" ? "#1e1e1e" : "#ffffff",
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarColor:
              state.mode === "dark" ? "#6b6b6b #2b2b2b" : "#959595 #f5f5f5",
            "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
              backgroundColor: state.mode === "dark" ? "#2b2b2b" : "#f5f5f5",
              width: 8,
            },
            "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
              borderRadius: 8,
              backgroundColor: state.mode === "dark" ? "#6b6b6b" : "#959595",
              minHeight: 24,
            },
          },
        },
      },
    },
  });

  return (
    <ThemeContext.Provider
      value={{
        mode: state.mode,
        primaryColor: state.primaryColor,
        secondaryColor: state.secondaryColor,
        loaded: state.loaded,
        setThemeMode,
        setPrimaryColor,
        setSecondaryColor,
      }}
    >
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {props.children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeState;
