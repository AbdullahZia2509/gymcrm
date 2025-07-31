import React, { useReducer } from 'react';
import axios from 'axios';
import ReportContext from './reportContext';
import reportReducer from './reportReducer';
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

const ReportState = props => {
  const initialState = {
    revenueReport: null,
    membershipReport: null,
    attendanceReport: null,
    classesReport: null,
    loading: false,
    error: null
  };

  const [state, dispatch] = useReducer(reportReducer, initialState);

  // Set Loading
  const setLoading = () => dispatch({ type: SET_REPORT_LOADING });

  // Clear Error
  const clearError = () => dispatch({ type: CLEAR_REPORT_ERROR });

  // Clear Current Report
  const clearCurrentReport = () => dispatch({ type: CLEAR_CURRENT_REPORT });

  // Get Revenue Report
  const getRevenueReport = async (period = 'monthly', startDate = null, endDate = null) => {
    try {
      setLoading();
      
      let url = `/api/reports/revenue?period=${period}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      
      const res = await axios.get(url);
      
      dispatch({
        type: GET_REVENUE_REPORT,
        payload: res.data
      });
    } catch (err) {
      console.error('Error fetching revenue report:', err);
      dispatch({
        type: REPORT_ERROR,
        payload: err.response?.data?.msg || 'Error fetching revenue report'
      });
    }
  };

  // Get Membership Report
  const getMembershipReport = async () => {
    try {
      setLoading();
      
      const res = await axios.get('/api/reports/membership');
      
      dispatch({
        type: GET_MEMBERSHIP_REPORT,
        payload: res.data
      });
    } catch (err) {
      console.error('Error fetching membership report:', err);
      dispatch({
        type: REPORT_ERROR,
        payload: err.response?.data?.msg || 'Error fetching membership report'
      });
    }
  };

  // Get Attendance Report
  const getAttendanceReport = async (period = 'monthly', startDate = null, endDate = null) => {
    try {
      setLoading();
      
      let url = `/api/reports/attendance?period=${period}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      
      const res = await axios.get(url);
      
      dispatch({
        type: GET_ATTENDANCE_REPORT,
        payload: res.data
      });
    } catch (err) {
      console.error('Error fetching attendance report:', err);
      dispatch({
        type: REPORT_ERROR,
        payload: err.response?.data?.msg || 'Error fetching attendance report'
      });
    }
  };

  // Get Classes Report
  const getClassesReport = async (startDate = null, endDate = null) => {
    try {
      setLoading();
      
      let url = '/api/reports/classes';
      if (startDate) url += `?startDate=${startDate}`;
      if (endDate) url += `${startDate ? '&' : '?'}endDate=${endDate}`;
      
      const res = await axios.get(url);
      
      dispatch({
        type: GET_CLASSES_REPORT,
        payload: res.data
      });
    } catch (err) {
      console.error('Error fetching classes report:', err);
      dispatch({
        type: REPORT_ERROR,
        payload: err.response?.data?.msg || 'Error fetching classes report'
      });
    }
  };

  return (
    <ReportContext.Provider
      value={{
        revenueReport: state.revenueReport,
        membershipReport: state.membershipReport,
        attendanceReport: state.attendanceReport,
        classesReport: state.classesReport,
        loading: state.loading,
        error: state.error,
        getRevenueReport,
        getMembershipReport,
        getAttendanceReport,
        getClassesReport,
        clearError,
        clearCurrentReport
      }}
    >
      {props.children}
    </ReportContext.Provider>
  );
};

export default ReportState;
