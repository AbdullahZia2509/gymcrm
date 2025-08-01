import React, { useContext, useEffect, useState } from "react";
import {
  Typography,
  Box,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ThemeContext from "../../context/theme/themeContext";

const AppearanceSettings = ({ settings, updateSetting }) => {
  const themeContext = useContext(ThemeContext);
  const { setThemeMode } = themeContext;
  const theme = useTheme();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper functions for local storage
  const getLocalDarkMode = () => {
    const savedMode = localStorage.getItem("darkMode");
    return savedMode === "true";
  };

  const saveLocalDarkMode = (value) => {
    localStorage.setItem("darkMode", value.toString());
  };

  // Initialize from local storage if available
  useEffect(() => {
    const localDarkMode = getLocalDarkMode();
    setIsDarkMode(localDarkMode);
    setThemeMode(localDarkMode ? "dark" : "light");
  }, []);

  // Update local state when settings change
  useEffect(() => {
    if (settings && settings.length > 0) {
      const setting = settings.find((s) => s.key === "darkMode");
      if (setting) {
        setIsDarkMode(setting.value);
      }
    }
  }, [settings]);

  if (!settings || settings.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body1">No appearance settings found.</Typography>
      </Box>
    );
  }

  // Handle dark mode toggle
  const handleDarkModeToggle = (event) => {
    const newValue = event.target.checked;
    setIsLoading(true);
    setError(null);

    try {
      // Save to local storage
      saveLocalDarkMode(newValue);

      // Update state
      setIsDarkMode(newValue);

      // Update theme immediately for better UX
      setThemeMode(newValue ? "dark" : "light");

      // Try to update the setting in the database if possible
      // This is optional and won't block the UI if it fails
      if (settings.find((s) => s.key === "darkMode")) {
        updateSetting("darkMode", newValue)
          .then(() => console.log("Also updated in database"))
          .catch((err) =>
            console.log(
              "Could not update in database, but local storage is working"
            )
          );
      }
    } catch (err) {
      console.error("Error handling dark mode toggle:", err);
      setError("Error updating dark mode");

      // Revert if there was an error
      setIsDarkMode(!newValue);
      setThemeMode(!newValue ? "dark" : "light");
    } finally {
      setTimeout(() => setIsLoading(false), 300); // Small delay for better UX
    }
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Typography variant="h6" gutterBottom>
        Appearance Settings
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        Customize the look and feel of your gym's application.
      </Typography>

      <Card sx={{ mb: 3, bgcolor: theme.palette.background.paper }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Theme Mode
          </Typography>

          <FormControlLabel
            control={
              <>
                {isLoading ? (
                  <CircularProgress size={24} sx={{ mr: 1 }} />
                ) : (
                  <Switch
                    checked={isDarkMode}
                    onChange={handleDarkModeToggle}
                    color="primary"
                  />
                )}
              </>
            }
            label={isDarkMode ? "Dark Mode" : "Light Mode"}
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default AppearanceSettings;
