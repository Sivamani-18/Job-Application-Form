import React, { useState, useEffect } from 'react';
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
  const [accessToken, setAccessToken] = useState('');

  useEffect(() => {
    const handleAuthSuccess = () => {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);

      if (params.has('access_token')) {
        const token = params.get('access_token');
        setAccessToken(token || '');
      }
    };

    handleAuthSuccess();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setResumeFile(e.target.files[0]);
    }
  };

  const handleAuthClick = async () => {
    try {
      const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
      const redirectUri = 'http://localhost:3000/oauth2callback'; // Replace with your redirect URI
      const clientId =
        '370773725330-hk1dfkfcn6uhjo2cebqk8d4iiviudfmu.apps.googleusercontent.com'; // Replace with your OAuth2 client ID
      const scope = 'https://www.googleapis.com/auth/drive.file';

      window.location.href = `${authUrl}?response_type=token&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
    } catch (error) {
      console.error('Authentication error:', error);
    }
  };

  const uploadResumeToDrive = async () => {
    if (!accessToken) {
      console.log('Authentication required');
      return;
    }

    // Create a new file in Google Drive
    const fileMetadata = {
      name: resumeFile?.name || 'resume.pdf',
      parents: ['1UWW22Fj10ohYtfW9-JBS5ZpnEG3Yg-Ov'], // Replace with the ID of the folder in Google Drive
    };

    const createResponse = await axios.post(
      'https://www.googleapis.com/drive/v3/files',
      fileMetadata,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const fileId = createResponse.data.id;

    // Upload the resume content
    await axios.patch(
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
      resumeFile,
      {
        headers: {
          'Content-Type': resumeFile?.type,
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const response = await axios.get(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=webViewLink`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data;
  };

  const submitFormResponse = async (uploadResponse: any) => {
    if (!accessToken) {
      console.log('Authentication required');
      return;
    }

    // Create a new response in Google Forms
    const formDataWithResumeUrl = {
      ...formData,
      resumeUrl: uploadResponse.webViewLink,
    };

    const payload = new FormData();
    payload.append('entry.714037552', formDataWithResumeUrl.name);
    payload.append('entry.1056543652', formDataWithResumeUrl.email);
    payload.append('entry.1423805949', formDataWithResumeUrl.resumeUrl);

    try {
      const FORM_ID =
        '1FAIpQLSe1n_fKUjx17L2rOg2WkpoeS7lZoZdaZEDTajbKFMJ2sh5cPg'; // Replace with the URL of your Google Form's endpoint
      const response = await axios.post(
        `https://docs.google.com/forms/d/e/${FORM_ID}/formResponse`,
        payload
      );
      return response.data;
    } catch (error) {
      console.log('Form not sumbit', error);
      return false;
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

  return (
    <div>
      {accessToken ? (
        <p>Authenticated</p>
      ) : (
        <button onClick={handleAuthClick}>Authenticate with Google</button>
      )}

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
          <input
            type='file'
            accept='.pdf'
            required
            onChange={handleFileChange}
          />
        </label>
        <button type='submit' disabled={!accessToken}>
          Submit
        </button>
      </form>
    </div>
  );
};

export default JobApplicationForm;
