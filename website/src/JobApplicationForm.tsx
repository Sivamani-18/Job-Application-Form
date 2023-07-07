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

  const uploadResumeToAzureBlobStorage = async () => {
    const accountName = process.env.REACT_APP_AZURE_ACCOUNT_NAME;
    const containerName = process.env.REACT_APP_AZURE_CONTAINER_NAME;
    const sasToken = process.env.REACT_APP_AZURE_SAS_TOKEN;

    if (!accountName || !containerName || !sasToken) {
      throw new Error('Azure Blob Storage credentials missing.');
    }

    const fileMetadata = {
      name: resumeFile?.name || 'resume.pdf',
    };

    const createResponse = await axios.post(
      `https://${accountName}.blob.core.windows.net/${containerName}/${fileMetadata.name}${sasToken}`,
      resumeFile,
      {
        headers: {
          'Content-Type': resumeFile?.type,
        },
      }
    );

    const fileUrl = createResponse.request.res.responseUrl;

    return fileUrl;
  };

  const submitFormResponse = async (fileUrl: string) => {
    const formDataWithResumeUrl = {
      ...formData,
      resumeUrl: fileUrl,
    };

    const payload = new FormData();
    payload.append('entry.714037552', formDataWithResumeUrl.name);
    payload.append('entry.1056543652', formDataWithResumeUrl.email);
    payload.append('entry.1423805949', formDataWithResumeUrl.resumeUrl);

    try {
      const FORM_ID = process.env.REACT_APP_GOOGLE_FORM_ID;

      if (!FORM_ID) {
        throw new Error('Google Form ID missing.');
      }

      const response = await axios.post(
        `https://docs.google.com/forms/d/e/${FORM_ID}/formResponse`,
        payload
      );
      return response.data;
    } catch (error) {
      console.log('Form not submitted', error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const fileUrl = await uploadResumeToAzureBlobStorage();
      console.log('fileUrl', fileUrl);

      const formResponse = await submitFormResponse(fileUrl);

      if (formResponse) {
        onSubmit(formData);
      }
    } catch (error) {
      // Handle errors here (display error message, log, etc.)
      console.log('Error:', error);
    }
  };

  return (
    <div>
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
        <button type='submit'>Submit</button>
      </form>
    </div>
  );
};

export default JobApplicationForm;
