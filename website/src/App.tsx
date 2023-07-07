import React from 'react';
import JobApplicationForm from './JobApplicationForm';
import './App.css';

interface FormFields {
  name: string;
  email: string;
  // Add more fields as needed
}

function App() {
  const handleSubmit = (data: FormFields) => {
    // Handle the submitted form data
    console.log('Form submitted:', data);
  };

  return (
    <div>
      <JobApplicationForm onSubmit={handleSubmit} />
    </div>
  );
}

export default App;
