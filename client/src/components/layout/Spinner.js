import React from 'react';
import LoadingSpinner from './LoadingSpinner';

// Re-export LoadingSpinner as Spinner for backward compatibility
const Spinner = ({ message }) => {
  return <LoadingSpinner message={message} />;
};

export default Spinner;
