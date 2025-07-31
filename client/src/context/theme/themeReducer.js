import {
  SET_THEME_MODE,
  SET_PRIMARY_COLOR,
  SET_SECONDARY_COLOR,
  THEME_LOADED
} from '../types';

export default (state, action) => {
  switch (action.type) {
    case SET_THEME_MODE:
      return {
        ...state,
        mode: action.payload
      };
    case SET_PRIMARY_COLOR:
      return {
        ...state,
        primaryColor: action.payload
      };
    case SET_SECONDARY_COLOR:
      return {
        ...state,
        secondaryColor: action.payload
      };
    case THEME_LOADED:
      return {
        ...state,
        loaded: true
      };
    default:
      return state;
  }
};
