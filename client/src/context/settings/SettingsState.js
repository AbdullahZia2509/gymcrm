import React, { useReducer, useContext } from 'react';
import axios from 'axios';
import SettingsContext from './settingsContext';
import settingsReducer from './settingsReducer';
import AlertContext from '../alert/alertContext';
import {
  GET_SETTINGS,
  GET_SETTING,
  UPDATE_SETTING,
  SETTINGS_ERROR,
  SET_SETTINGS_LOADING,
  INITIALIZE_SETTINGS,
  CLEAR_SETTINGS_ERROR
} from '../types';

const SettingsState = props => {
  const initialState = {
    settings: null,
    currentSetting: null,
    loading: false,
    error: null,
    initialized: false
  };

  const [state, dispatch] = useReducer(settingsReducer, initialState);
  const alertContext = useContext(AlertContext);
  const { setAlert } = alertContext;

  // Get all settings
  const getSettings = async () => {
    try {
      setLoading();
      console.log('Fetching settings...');
      const res = await axios.get('/api/settings');
      console.log('Settings fetched:', res.data);
      
      dispatch({
        type: GET_SETTINGS,
        payload: res.data
      });
      return res.data;
    } catch (err) {
      console.error('Error fetching settings:', err);
      const errorMessage = err.response?.data?.msg || 
                          (err.response ? `Server error: ${err.response.status}` : 'Network error');
      
      dispatch({
        type: SETTINGS_ERROR,
        payload: errorMessage
      });
      throw err;
    }
  };

  // Get a specific setting
  const getSetting = async (key) => {
    try {
      setLoading();
      const res = await axios.get(`/api/settings/${key}`);
      
      dispatch({
        type: GET_SETTING,
        payload: res.data
      });
    } catch (err) {
      dispatch({
        type: SETTINGS_ERROR,
        payload: err.response?.data?.msg || 'Error fetching setting'
      });
    }
  };
  
  // Update a setting
  const updateSetting = async (key, settingData) => {
    try {
      setLoading();
      console.log(`Updating setting ${key} with:`, settingData);
      
      // Make sure settingData is properly formatted with a value property
      const dataToSend = typeof settingData === 'object' && settingData !== null && 'value' in settingData
        ? settingData
        : { value: settingData };
      
      console.log('Sending data to API:', dataToSend);
      const res = await axios.put(`/api/settings/${key}`, dataToSend);
      console.log('API response:', res.data);
      
      // Make sure we have the category information for the reducer
      if (!res.data.category) {
        console.error('Response data missing category:', res.data);
        // Try to find the setting in our current state to get its category
        if (state.settings) {
          for (const category in state.settings) {
            const foundSetting = state.settings[category].find(s => s.key === key);
            if (foundSetting) {
              res.data.category = foundSetting.category;
              break;
            }
          }
        }
      }
      
      console.log('Dispatching update with:', res.data);
      dispatch({
        type: UPDATE_SETTING,
        payload: res.data
      });
      
      setAlert(`Setting '${key}' updated successfully`, 'success');
      return true;
    } catch (err) {
      console.error('Error updating setting:', err);
      const errorMessage = err.response?.data?.msg || 
                          (err.response ? `Server error: ${err.response.status}` : 'Network error');
      
      dispatch({
        type: SETTINGS_ERROR,
        payload: errorMessage
      });
      setAlert(errorMessage, 'error');
      return false;
    }
  };

  // This is a duplicate function that was removed

  // Initialize default settings
  const initializeSettings = async () => {
    try {
      setLoading();
      console.log('Initializing settings...');
      const res = await axios.post('/api/settings/initialize');
      console.log('Settings initialized:', res.data);
      
      // After initializing, fetch the settings again
      await getSettings();
      
      dispatch({
        type: INITIALIZE_SETTINGS
      });

      setAlert('Settings initialized successfully', 'success');
      return true;
    } catch (err) {
      console.error('Error initializing settings:', err);
      const errorMessage = err.response?.data?.msg || 
                          (err.response ? `Server error: ${err.response.status}` : 'Network error');
      
      dispatch({
        type: SETTINGS_ERROR,
        payload: errorMessage
      });
      setAlert(errorMessage, 'error');
      return false;
    }
  };

  // Set loading
  const setLoading = () => dispatch({ type: SET_SETTINGS_LOADING });

  // Clear errors
  const clearErrors = () => dispatch({ type: CLEAR_SETTINGS_ERROR });

  return (
    <SettingsContext.Provider
      value={{
        settings: state.settings,
        currentSetting: state.currentSetting,
        loading: state.loading,
        error: state.error,
        initialized: state.initialized,
        getSettings,
        getSetting,
        updateSetting,
        initializeSettings,
        clearErrors
      }}
    >
      {props.children}
    </SettingsContext.Provider>
  );
};

export default SettingsState;
