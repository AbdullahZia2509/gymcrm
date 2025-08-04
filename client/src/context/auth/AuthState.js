import React, { useReducer, useEffect } from "react";
import axios from "axios";
import AuthContext from "./authContext";
import authReducer from "./authReducer";
import setAuthToken from "../../utils/setAuthToken";
import {
  REGISTER_SUCCESS,
  REGISTER_FAIL,
  USER_LOADED,
  AUTH_ERROR,
  LOGIN_SUCCESS,
  LOGIN_FAIL,
  LOGOUT,
  CLEAR_ERRORS,
} from "../types";

const AuthState = (props) => {
  const initialState = {
    token: localStorage.getItem("token"),
    isAuthenticated: null,
    loading: true,
    user: null,
    gym: null,
    error: null,
  };

  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user when component mounts
  useEffect(() => {
    if (localStorage.token) {
      loadUser();
    }
  }, []);

  // Load User
  const loadUser = async () => {
    // Only proceed if we have a token
    if (localStorage.token) {
      setAuthToken(localStorage.token);
      
      try {
        const res = await axios.get("/api/auth");
        dispatch({
          type: USER_LOADED,
          payload: res.data,
        });
      } catch (err) {
        console.log('Auth error:', err.response?.status, err.response?.data?.msg || err.message);
        
        // Only dispatch AUTH_ERROR if it's a 401 Unauthorized
        // This prevents token removal for network errors or server issues
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          dispatch({
            type: AUTH_ERROR,
            payload: err.response.data.msg || 'Authentication failed',
          });
        } else {
          // For other errors (network, 500, etc.), keep user logged in but mark as error
          console.error('Non-auth error in loadUser:', err);
        }
      }
    }
  };

  // Register User
  const register = async (formData) => {
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    try {
      const res = await axios.post("/api/users", formData, config);

      dispatch({
        type: REGISTER_SUCCESS,
        payload: res.data,
      });

      loadUser();
    } catch (err) {
      dispatch({
        type: REGISTER_FAIL,
        payload: err.response.data.msg,
      });
    }
  };

  // Login User
  const login = async (formData) => {
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    try {
      const res = await axios.post("/api/auth", formData, config);

      dispatch({
        type: LOGIN_SUCCESS,
        payload: res.data,
      });

      loadUser();
    } catch (err) {
      dispatch({
        type: LOGIN_FAIL,
        payload: err.response.data.msg,
      });
    }
  };

  // Logout
  const logout = () => dispatch({ type: LOGOUT });

  // Clear Errors
  const clearErrors = () => dispatch({ type: CLEAR_ERRORS });

  return (
    <AuthContext.Provider
      value={{
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        loading: state.loading,
        user: state.user,
        gym: state.gym,
        error: state.error,
        register,
        loadUser,
        login,
        logout,
        clearErrors,
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
};

export default AuthState;
