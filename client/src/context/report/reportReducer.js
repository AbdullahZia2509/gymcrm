import {
  GET_REVENUE_REPORT,
  GET_MEMBERSHIP_REPORT,
  GET_ATTENDANCE_REPORT,
  GET_CLASSES_REPORT,
  SET_REPORT_LOADING,
  REPORT_ERROR,
  CLEAR_REPORT_ERROR,
  CLEAR_CURRENT_REPORT
} from '../types';

const reportReducer = (state, action) => {
  switch (action.type) {
    case GET_REVENUE_REPORT:
      return {
        ...state,
        revenueReport: action.payload,
        loading: false,
        error: null
      };
    case GET_MEMBERSHIP_REPORT:
      return {
        ...state,
        membershipReport: action.payload,
        loading: false,
        error: null
      };
    case GET_ATTENDANCE_REPORT:
      return {
        ...state,
        attendanceReport: action.payload,
        loading: false,
        error: null
      };
    case GET_CLASSES_REPORT:
      return {
        ...state,
        classesReport: action.payload,
        loading: false,
        error: null
      };
    case SET_REPORT_LOADING:
      return {
        ...state,
        loading: true
      };
    case REPORT_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    case CLEAR_REPORT_ERROR:
      return {
        ...state,
        error: null
      };
    case CLEAR_CURRENT_REPORT:
      return {
        ...state,
        revenueReport: null,
        membershipReport: null,
        attendanceReport: null,
        classesReport: null,
        loading: false,
        error: null
      };
    default:
      return state;
  }
};

export default reportReducer;
