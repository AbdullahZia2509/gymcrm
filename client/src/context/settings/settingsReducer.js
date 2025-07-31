import {
  GET_SETTINGS,
  GET_SETTING,
  UPDATE_SETTING,
  SETTINGS_ERROR,
  SET_SETTINGS_LOADING,
  INITIALIZE_SETTINGS,
  CLEAR_SETTINGS_ERROR
} from '../types';

const settingsReducer = (state, action) => {
  switch (action.type) {
    case GET_SETTINGS:
      return {
        ...state,
        settings: action.payload,
        loading: false,
        error: null
      };
    case GET_SETTING:
      return {
        ...state,
        currentSetting: action.payload,
        loading: false,
        error: null
      };
    case UPDATE_SETTING:
      // Add debugging to see what's happening
      console.log('UPDATE_SETTING action:', action.payload);
      console.log('Current state.settings:', state.settings);
      
      // Make sure we have settings and the category exists
      if (!state.settings || !state.settings[action.payload.category]) {
        console.error(`Settings or category ${action.payload.category} not found in state`);
        return {
          ...state,
          currentSetting: action.payload,
          loading: false,
          error: null
        };
      }
      
      // Create a new settings object with the updated setting
      const updatedSettings = {
        ...state.settings,
        [action.payload.category]: state.settings[action.payload.category].map(setting => 
          setting.key === action.payload.key ? action.payload : setting
        )
      };
      
      console.log('Updated settings:', updatedSettings);
      
      return {
        ...state,
        settings: updatedSettings,
        currentSetting: action.payload,
        loading: false,
        error: null
      };
    case INITIALIZE_SETTINGS:
      return {
        ...state,
        initialized: true,
        loading: false,
        error: null
      };
    case SET_SETTINGS_LOADING:
      return {
        ...state,
        loading: true
      };
    case SETTINGS_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    case CLEAR_SETTINGS_ERROR:
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

export default settingsReducer;
