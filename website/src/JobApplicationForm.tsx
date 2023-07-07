import React, { useState } from 'react';
import axios from 'axios';
import secureKey from './secureKey';

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
    const { accountName, containerName, sasToken } = secureKey.azure;

    const fileMetadata = {
      name: resumeFile?.name || 'resume.pdf',
    };

    const url = `https://${accountName}.blob.core.windows.net/${containerName}/${fileMetadata.name}?${sasToken}`;

    await axios.put(url, resumeFile, {
      headers: {
        'Content-Type': resumeFile?.type,
        'x-ms-blob-type': 'BlockBlob', // Specify the blob type as 'BlockBlob'
      },
    });

    const fileUrl = url.split('?')[0]; // Remove the SAS token from the file URL

    return fileUrl;
  };

  const submitFormResponse = async (fileUrl: string) => {
    const { formId } = secureKey.googleForm;

    const formDataWithResumeUrl = {
      ...formData,
      resumeUrl: fileUrl,
    };

    const payload = new FormData();
    payload.append('entry.714037552', formDataWithResumeUrl.name);
    payload.append('entry.1056543652', formDataWithResumeUrl.email);
    payload.append('entry.1423805949', formDataWithResumeUrl.resumeUrl);

    try {
      const response = await axios.post(
        `https://docs.google.com/forms/d/e/${formId}/formResponse`,
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
