import React, { useState, useRef } from 'react';
import axios from 'axios';
import secureKey from './secureKey';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormFields>({
    name: '',
    email: '',
    // Add more fields as needed
  });
  const formRef = useRef<HTMLFormElement>(null);

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

    const timestamp = new Date().getTime(); // Generate a unique timestamp
    const uniqueFileName = `${timestamp}_${fileMetadata.name}`; // Append the timestamp to the original filename

    const folderName = 'formdata'; // Specify folder name
    const url = `https://${accountName}.blob.core.windows.net/${containerName}/${folderName}/${uniqueFileName}?${sasToken}`;

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
      console.log(response, 'response');
      return response.data;
    } catch (error) {
      console.log('Form not submitted', error);
      return true;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) {
      return; // Ignore the form submission if already submitting
    }

    try {
      setIsSubmitting(true); // Disable the submit button
      const fileUrl = await uploadResumeToAzureBlobStorage();
      console.log('fileUrl', fileUrl);

      const formResponse = await submitFormResponse(fileUrl);

      console.log('formResponse', formResponse);

      if (formResponse) {
        onSubmit(formData);
        toast.success('Form submitted successfully!');
        setFormData({
          name: '',
          email: '',
        });
        formRef.current?.reset(); // Reset the form
      } else {
        toast.error('Failed to submit form. Please try again.');
      }
    } catch (error) {
      // Handle errors here (display error message, log, etc.)
      console.log('Error:', error);
      toast.error('An error occurred. Please try again later.');
    } finally {
      setIsSubmitting(false); // Enable the submit button
    }
  };

  return (
    <div className='form-container'>
      <h2 className='form-heading'>Job Application Form</h2>
      <ToastContainer />
      <form ref={formRef} onSubmit={handleSubmit}>
        <label className='form-label'>
          Name:
          <input
            className='form-input'
            type='text'
            name='name'
            value={formData.name}
            onChange={handleInputChange}
          />
        </label>
        <label className='form-label'>
          Email:
          <input
            className='form-input'
            type='email'
            name='email'
            value={formData.email}
            onChange={handleInputChange}
          />
        </label>
        <label className='form-label'>
          Resume:
          <input
            className='form-file-input'
            type='file'
            accept='.pdf'
            required
            onChange={handleFileChange}
          />
        </label>
        <button
          className='form-submit-button'
          type='submit'
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  );
};

export default JobApplicationForm;
