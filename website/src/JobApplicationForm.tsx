import React, { useState } from 'react';
import axios from 'axios';

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
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<FormFields>({
    name: '',
    email: '',
    // Add more fields as needed
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setResumeFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const uploadResponse = await uploadResumeToDrive();
    console.log('uploadResponse', uploadResponse.webViewLink);

    const formResponse = await submitFormResponse(uploadResponse);

    if (formResponse) {
      onSubmit(formData);
    }
  };

  const uploadResumeToDrive = async () => {
    // Authenticate with Google Drive
    // You can use react-google-login to handle authentication

    // Create a new file in Google Drive
    const fileMetadata = {
      name: resumeFile?.name || 'resume.pdf',
      parents: ['1UWW22Fj10ohYtfW9-JBS5ZpnEG3Yg-Ov'], // Replace with the ID of the folder in Google Drive
    };

    const response = await axios.post(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
      fileMetadata,
      {
        headers: {
          Authorization:
            'Bearer ya29.a0AbVbY6PLbtWIz89LXYaj1XWgNV2kabXkCDZHOr55ECUuZkFTg3GjTX7F_v2wjea9bpomg6rr3w8Ga4PvR2p9WGAB6wQzrTDVjKhn6fRMQMX6TRmuFeZwpWxrBHvlCDwYsthOlNwuJ2t-k43d_TPBKxoT7DAKaCgYKAY4SARMSFQFWKvPl6QwJtjv4TMycc9OIaQ2hog0163', // Replace with the access token obtained after authentication
          'Content-Type': 'application/json',
        },
      }
    );

    // Upload the resume content
    await axios.put(response.headers.location, resumeFile, {
      headers: {
        'Content-Type': resumeFile?.type,
      },
    });

    return response.data;
  };

  const submitFormResponse = async (uploadResponse: any) => {
    // Create a new response in Google Forms
    const formDataWithResumeUrl = {
      ...formData,
      resumeUrl: uploadResponse.webViewLink,
    };

    console.log('formDataWithResumeUrl', formDataWithResumeUrl);

    const response = await axios.post(
      'https://docs.google.com/forms/d/e/1FAIpQLSe1n_fKUjx17L2rOg2WkpoeS7lZoZdaZEDTajbKFMJ2sh5cPg/formResponse',
      // Replace with the URL of your Google Form's endpoint
      {
        'entry.714037552': formDataWithResumeUrl.name,
        'entry.1056543652': formDataWithResumeUrl.email,
        'entry.1423805949': formDataWithResumeUrl.resumeUrl,
        // Add more form field entries as needed
      }
    );

    return response.data;
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Name:
        <input
          type='text'
          name='name'
          value={formData.name}
          onChange={handleInputChange}
        />
      </label>
      <label>
        Email:
        <input
          type='email'
          name='email'
          value={formData.email}
          onChange={handleInputChange}
        />
      </label>
      <label>
        Resume:
        <input type='file' accept='.pdf' onChange={handleFileChange} />
      </label>
      <button type='submit'>Submit</button>
    </form>
  );
};

export default JobApplicationForm;
