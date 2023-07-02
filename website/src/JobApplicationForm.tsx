import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GoogleDrivePicker from 'google-drive-picker';

import './JobApplicationForm.css';

interface FormFields {
  name: string;
  email: string;
  // Add more fields as needed
}

interface JobApplicationFormProps {
  onSubmit: (data: FormFields) => void;
}

const JobApplicationForm: React.FC<JobApplicationFormProps> = ({
  onSubmit,
}) => {
  const [openPicker, authRes] = GoogleDrivePicker();
  const [authTocken, setauthTocken] = useState('');
  const [formData, setFormData] = useState<FormFields>({
    name: '',
    email: '',
    // Add more fields as needed
  });
  const [uploadResponse, setUploadResponse] = useState<string>('');
  const [showSuccessPopup, setShowSuccessPopup] = useState<boolean>(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOpenPicker = () => {
    openPicker({
      clientId:
        '370773725330-hk1dfkfcn6uhjo2cebqk8d4iiviudfmu.apps.googleusercontent.com',
      developerKey: 'AIzaSyCsnm83pONiOrbBtIfu6G7yklqMDAFMJA4',
      viewId: 'DOCS',
      token: authTocken,
      showUploadView: true,
      showUploadFolders: true,
      supportDrives: true,
      multiselect: false,
      // Other configuration options...
      callbackFunction: (data) => {
        if (data.action === 'cancel') {
          console.log('User clicked cancel/close button');
        } else if (data.docs && data.docs.length > 0) {
          console.log(data);
          const uploadResponse = data.docs[0].url;
          setUploadResponse(uploadResponse);
        }
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadResponse) {
      alert('Please Attached Resume file.');
      return;
    }

    const formResponse = await submitFormResponse(uploadResponse);

    if (formResponse) {
      onSubmit(formData);
      setShowSuccessPopup(true);
      setFormData({
        name: '',
        email: '',
      });
    }
  };

  const submitFormResponse = async (resumeUrl: string) => {
    // Create a new response in Google Forms

    const payload = new FormData();
    payload.append('entry.714037552', formData.name);
    payload.append('entry.1056543652', formData.email);
    payload.append('entry.1423805949', resumeUrl);

    try {
      const FORM_ID =
        '1FAIpQLSe1n_fKUjx17L2rOg2WkpoeS7lZoZdaZEDTajbKFMJ2sh5cPg'; // Replace with the URL of your Google Form's endpoint
      const response = await axios.post(
        `https://docs.google.com/forms/d/e/${FORM_ID}/formResponse`,
        payload
      );
      return response.data;
    } catch (error) {
      return true;
    }
  };

  const closeSuccessPopup = () => {
    setShowSuccessPopup(false);
  };

  useEffect(() => {
    if (authRes) {
      setauthTocken(authRes.access_token);
    }
  }, [authRes]);

  return (
    <form className='job-application-form' onSubmit={handleSubmit}>
      <div className='form-group'>
        <label className='form-label'>Name*:</label>
        <input
          type='text'
          name='name'
          value={formData.name}
          onChange={handleInputChange}
          className='form-input'
          required
        />
      </div>
      <div className='form-group'>
        <label className='form-label'>Email*:</label>
        <input
          type='email'
          name='email'
          value={formData.email}
          onChange={handleInputChange}
          className='form-input'
          required
        />
      </div>
      <div className='form-group'>
        <button
          type='button'
          onClick={handleOpenPicker}
          className='btn-open-picker'
        >
          Attached Resume
        </button>
      </div>
      <div className='form-group'>
        <button type='submit' className='btn-submit'>
          Submit
        </button>
      </div>
      {showSuccessPopup && (
        <div className='success-popup'>
          <p>Form submitted successfully!</p>
          <button className='close-button' onClick={closeSuccessPopup}>
            Close
          </button>
        </div>
      )}
    </form>
  );
};

export default JobApplicationForm;
