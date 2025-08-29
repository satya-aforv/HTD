// // src/components/Doctors/DoctorForm.tsx - Updated with multiple file support
// import React, { useState, useEffect, useRef } from 'react';
// import { useNavigate, useParams } from 'react-router-dom';
// import { useForm } from 'react-hook-form';
// import { 
//   ArrowLeft, 
//   Save, 
//   Loader2, 
//   Upload, 
//   X, 
//   Download, 
//   Eye, 
//   FileText, 
//   Trash2,
//   Plus,
//   Edit
// } from 'lucide-react';
// import { motion } from 'framer-motion';
// import toast from 'react-hot-toast';
// import { doctorAPI, DoctorFormData, DoctorDocument } from '../../services/doctorAPI';
// import { statesAPI, handleApiError } from '../../services/api';
// import { useAuthStore } from '../../store/authStore';

// interface State {
//   _id: string;
//   name: string;
//   code: string;
// }

// interface FileWithMetadata {
//   file: File;
//   fileType: string;
//   description: string;
//   id: string;
// }

// const DoctorForm: React.FC = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const isEdit = !!id;
//   const fileInputRef = useRef<HTMLInputElement>(null);
  
//   const [loading, setLoading] = useState(false);
//   const [initialLoading, setInitialLoading] = useState(isEdit);
//   const [states, setStates] = useState<State[]>([]);
//   const [statesLoading, setStatesLoading] = useState(true);
  
//   // Multiple file states
//   const [selectedFiles, setSelectedFiles] = useState<FileWithMetadata[]>([]);
//   const [existingDocuments, setExistingDocuments] = useState<DoctorDocument[]>([]);
//   const [uploadProgress, setUploadProgress] = useState(0);
//   const [deleteFileLoading, setDeleteFileLoading] = useState<string>('');
//   const [showAddDocument, setShowAddDocument] = useState(false);
//   const [newDocument, setNewDocument] = useState({
//     fileType: 'other',
//     description: ''
//   });

//   // Legacy single file states (for backward compatibility)
//   const [selectedFile, setSelectedFile] = useState<File | null>(null);
//   const [existingFile, setExistingFile] = useState<any>(null);
//   const [filePreview, setFilePreview] = useState<string>('');

//   const {
//     register,
//     handleSubmit,
//     setValue,
//     formState: { errors },
//   } = useForm<DoctorFormData>({
//     defaultValues: {
//       isActive: true,
//     },
//   });

//   useEffect(() => {
//     fetchStates();
//     if (isEdit && id) {
//       fetchDoctor(id);
//     }
//   }, [id, isEdit]);

//   const fetchStates = async () => {
//     try {
//       setStatesLoading(true);
//       const response = await statesAPI.getStates({ limit: 100 });
//       setStates(response.data.states || []);
//     } catch (error) {
//       console.error('Error fetching states:', error);
//       handleApiError(error);
//     } finally {
//       setStatesLoading(false);
//     }
//   };

//   const fetchDoctor = async (doctorId: string) => {
//     try {
//       setInitialLoading(true);
//       const response = await doctorAPI.getDoctor(doctorId);
//       const doctor = response.data.doctor;
      
//       setValue('name', doctor.name);
//       setValue('email', doctor.email);
//       setValue('phone', doctor.phone);
//       setValue('gstNumber', doctor.gstNumber);
//       setValue('panNumber', doctor.panNumber);
//       setValue('gstAddress', doctor.gstAddress);
//       setValue('city', doctor.city);
//       setValue('state', doctor.state._id);
//       setValue('pincode', doctor.pincode);
//       setValue('isActive', doctor.isActive);
      
//       // Handle existing documents
//       if (doctor.documents && doctor.documents.length > 0) {
//         setExistingDocuments(doctor.documents);
//       }
      
//       // Handle legacy file
//       if (doctor.agreementFile?.filename) {
//         setExistingFile(doctor.agreementFile);
//       }
//     } catch (error) {
//       handleApiError(error);
//       navigate('/doctors');
//     } finally {
//       setInitialLoading(false);
//     }
//   };

//   const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const files = e.target.files;
//     if (files && files.length > 0) {
//       const newFiles: FileWithMetadata[] = [];
      
//       for (let i = 0; i < files.length; i++) {
//         const file = files[i];
        
//         // Validate file type
//         const allowedTypes = [
//           'application/pdf',
//           'application/msword',
//           'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//           'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//           'application/vnd.ms-excel',
//           'image/jpeg',
//           'image/png',
//           'image/jpg',
//           'text/plain'
//         ];
        
//         if (!allowedTypes.includes(file.type)) {
//           toast.error(`Invalid file type for ${file.name}. Only PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG, and TXT files are allowed.`);
//           continue;
//         }
        
//         // Validate file size (10MB)
//         if (file.size > 10 * 1024 * 1024) {
//           toast.error(`File ${file.name} is too large. Maximum size is 10MB.`);
//           continue;
//         }
        
//         newFiles.push({
//           file,
//           fileType: 'other',
//           description: '',
//           id: `${Date.now()}-${i}`
//         });
//       }
      
//       if (newFiles.length > 0) {
//         setSelectedFiles(prev => [...prev, ...newFiles]);
//         toast.success(`${newFiles.length} file(s) selected successfully`);
//       }
//     }
    
//     // Reset file input
//     if (fileInputRef.current) {
//       fileInputRef.current.value = '';
//     }
//   };

//   const handleSingleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       // Validate file type
//       const allowedTypes = [
//         'application/pdf',
//         'application/msword',
//         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//         'image/jpeg',
//         'image/png',
//         'image/jpg'
//       ];
      
//       if (!allowedTypes.includes(file.type)) {
//         toast.error('Invalid file type. Only PDF, DOC, DOCX, JPG, JPEG, and PNG files are allowed.');
//         return;
//       }
      
//       // Validate file size (10MB)
//       if (file.size > 10 * 1024 * 1024) {
//         toast.error('File too large. Maximum size is 10MB.');
//         return;
//       }
      
//       setSelectedFile(file);
      
//       // Create preview for images
//       if (file.type.startsWith('image/')) {
//         const reader = new FileReader();
//         reader.onload = (e) => {
//           setFilePreview(e.target?.result as string);
//         };
//         reader.readAsDataURL(file);
//       } else {
//         setFilePreview('');
//       }
      
//       toast.success('File selected successfully');
//     }
//   };

//   const removeSelectedFile = (fileId: string) => {
//     setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
//   };

//   const updateFileMetadata = (fileId: string, field: 'fileType' | 'description', value: string) => {
//     setSelectedFiles(prev => prev.map(f => 
//       f.id === fileId ? { ...f, [field]: value } : f
//     ));
//   };

//   const removeSingleFile = () => {
//     setSelectedFile(null);
//     setFilePreview('');
//     if (fileInputRef.current) {
//       fileInputRef.current.value = '';
//     }
//   };

//   const handleDeleteExistingDocument = async (documentId: string) => {
//     if (!id) return;
    
//     try {
//       setDeleteFileLoading(documentId);
//       await doctorAPI.deleteDocument(id, documentId);
//       setExistingDocuments(prev => prev.filter(doc => doc._id !== documentId));
//       toast.success('Document deleted successfully');
//     } catch (error) {
//       console.error('Error deleting document:', error);
//       handleApiError(error);
//     } finally {
//       setDeleteFileLoading('');
//     }
//   };

//   const handleDeleteExistingFile = async () => {
//     if (!existingFile || !id) return;
    
//     try {
//       setDeleteFileLoading('legacy');
//       await doctorAPI.deleteDoctorFile(id);
//       setExistingFile(null);
//       toast.success('File deleted successfully');
//     } catch (error) {
//       console.error('Error deleting file:', error);
//       handleApiError(error);
//     } finally {
//       setDeleteFileLoading('');
//     }
//   };

//   const handleViewFile = (filename: string) => {
//     doctorAPI.viewFile(filename);
//   };

//   const handleDownloadFile = (filename: string, originalName: string) => {
//     doctorAPI.downloadFile(filename, originalName);
//   };

//   const formatFileSize = (bytes: number): string => {
//     if (bytes === 0) return '0 Bytes';
//     const k = 1024;
//     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
//   };

//   const getFileIcon = (mimetype: string) => {
//     if (mimetype?.includes('pdf')) return <FileText className="w-5 h-5 text-red-600" />;
//     if (mimetype?.includes('word') || mimetype?.includes('document')) return <FileText className="w-5 h-5 text-blue-600" />;
//     if (mimetype?.includes('sheet') || mimetype?.includes('excel')) return <FileText className="w-5 h-5 text-green-600" />;
//     if (mimetype?.includes('image')) return <FileText className="w-5 h-5 text-purple-600" />;
//     return <FileText className="w-5 h-5 text-gray-600" />;
//   };

//   const getFileTypeColor = (fileType: string) => {
//     switch (fileType) {
//       case 'agreement': return 'bg-blue-100 text-blue-800';
//       case 'license': return 'bg-green-100 text-green-800';
//       case 'certificate': return 'bg-purple-100 text-purple-800';
//       default: return 'bg-gray-100 text-gray-800';
//     }
//   };

//   const onSubmit = async (data: DoctorFormData) => {
//     setLoading(true);
//     setUploadProgress(0);
    
//     try {
//       // Prepare form data with multiple files
//       const formData: DoctorFormData = {
//         ...data,
//         documents: selectedFiles.map(f => f.file),
//         fileTypes: selectedFiles.map(f => f.fileType),
//         descriptions: selectedFiles.map(f => f.description),
//         agreementFile: selectedFile || undefined,
//       };

//       if (isEdit && id) {
//         await doctorAPI.updateDoctor(id, formData, setUploadProgress);
//         toast.success('Doctor updated successfully');
//       } else {
//         await doctorAPI.createDoctor(formData, setUploadProgress);
//         toast.success('Doctor created successfully');
//       }
      
//       navigate('/doctors');
//     } catch (error: any) {
//       console.error('Submit error:', error);
//       handleApiError(error);
//     } finally {
//       setLoading(false);
//       setUploadProgress(0);
//     }
//   };

//   if (initialLoading || statesLoading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-6xl mx-auto space-y-6">
//       {/* Header */}
//       <div className="flex items-center space-x-4">
//         <button
//           onClick={() => navigate('/doctors')}
//           className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
//         >
//           <ArrowLeft className="w-5 h-5" />
//         </button>
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">
//             {isEdit ? 'Edit Doctor' : 'Add New Doctor'}
//           </h1>
//           <p className="text-gray-600 mt-1">
//             {isEdit ? 'Update doctor information' : 'Create a new doctor entry with contact details'}
//           </p>
//         </div>
//       </div>

//       {/* Form */}
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         className="bg-white rounded-lg shadow-sm p-6"
//       >
//         <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
//           {/* Basic Information */}
//           <div className="space-y-4">
//             <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
//               Basic Information
//             </h3>
            
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div>
//                 <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
//                   Doctor Name *
//                 </label>
//                 <input
//                   {...register('name', {
//                     required: 'Doctor name is required',
//                     minLength: {
//                       value: 2,
//                       message: 'Name must be at least 2 characters',
//                     },
//                   })}
//                   type="text"
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="Enter doctor name"
//                 />
//                 {errors.name && (
//                   <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
//                 )}
//               </div>

//               <div>
//                 <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
//                   Email Address *
//                 </label>
//                 <input
//                   {...register('email', {
//                     required: 'Email is required',
//                     pattern: {
//                       value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
//                       message: 'Please enter a valid email address',
//                     },
//                   })}
//                   type="email"
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="Enter email address"
//                 />
//                 {errors.email && (
//                   <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
//                 )}
//               </div>

//               <div>
//                 <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
//                   Phone Number *
//                 </label>
//                 <input
//                   {...register('phone', {
//                     required: 'Phone number is required',
//                     minLength: {
//                       value: 10,
//                       message: 'Phone number must be at least 10 digits',
//                     },
//                   })}
//                   type="tel"
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="Enter phone number"
//                 />
//                 {errors.phone && (
//                   <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
//                 )}
//               </div>
//             </div>
//           </div>
          
//           {/* specialization Information */}
// <div>
//   <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-2">
//     Specialization *
//   </label>
//   <select
//     {...register('specialization', { required: 'Specialization is required' })}
//     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//   >
//     <option value="">Select specialization</option>
//     <option value="cardiology">Cardiology</option>
//     <option value="neurology">Neurology</option>
//     <option value="orthopedics">Orthopedics</option>
//     <option value="general">General Medicine</option>
//     {/* Add more as needed */}
//   </select>
//   {errors.specialization && (
//     <p className="mt-1 text-sm text-red-600">{errors.specialization.message}</p>
//   )}
// </div>

//  {/* select HospitalsList */}
//         <div>
//   <label className="block text-sm font-medium text-gray-700 mb-2">Hospitals *</label>
//   <div className="space-y-2">
//     {['Apollo', 'Fortis', 'Manipal', 'AIIMS'].map((hospital) => (
//       <label key={hospital} className="flex items-center space-x-2">
//         <input
//           type="checkbox"
//           value={hospital}
//           {...register('hospitals')}
//           className="rounded border-gray-300"
//         />
//         <span className="text-sm text-gray-700">{hospital}</span>
//       </label>
//     ))}
//   </div>
// </div>

// {/* Location information */}
//        <div>
//   <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
//     Location *
//   </label>
//   <input
//     {...register('location', { required: 'Location is required' })}
//     type="text"
//     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//     placeholder="Enter location"
//   />
//   {errors.location && (
//     <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
//   )}
// </div>

// <div>
//   <label htmlFor="targets" className="block text-sm font-medium text-gray-700 mb-2">
//     Targets
//   </label>
//   <input
//     {...register('targets', { valueAsNumber: true })}
//     type="number"
//     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//     placeholder="Enter target value"
//   />
// </div>


//           {/* Submit Button */}
//           <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
//             <button
//               type="button"
//               onClick={() => navigate('/doctors')}
//               className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               disabled={loading}
//               className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors duration-200"
//             >
//               {loading ? (
//                 <>
//                   <Loader2 className="w-4 h-4 animate-spin mr-2" />
//                   {uploadProgress > 0 ? `Uploading... ${uploadProgress}%` : (isEdit ? 'Updating...' : 'Creating...')}
//                 </>
//               ) : (
//                 <>
//                   <Save className="w-4 h-4 mr-2" />
//                   {isEdit ? 'Update Doctor' : 'Create Doctor'}
//                 </>
//               )}
//             </button>
//           </div>
//         </form>
//       </motion.div>
//     </div>
//   );
// };

// export default DoctorForm;

// src/components/Doctors/DoctorForm.tsx - Updated with hospital multiselect
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { doctorAPI, DoctorFormData } from '../../services/doctorAPI';
import { statesAPI, handleApiError } from '../../services/api';
import { hospitalAPI } from '../../services/hospitalAPI';

const DoctorForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileTypes, setFileTypes] = useState<string[]>([]);
  const [descriptions, setDescriptions] = useState<string[]>([]);
  const [hospitals, setHospitals] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<DoctorFormData>({
    defaultValues: {
      isActive: true,
    },
  });

  useEffect(() => {
    fetchHospitals();
    if (isEdit && id) {
      (async () => {
        try {
          const response = await doctorAPI.getDoctor(id);
          const doctor = response.data;
          setValue('name', doctor.name);
          setValue('email', doctor.email);
          setValue('phone', doctor.phone);
          setValue('specialization', doctor.specialization);
          setValue('Hospitallist', doctor.Hospitallist);
          setValue('location', doctor.location);
          setValue('targets', doctor.targets);
          setValue('isActive', doctor.isActive);
        } catch (error) {
          handleApiError(error);
          navigate('/doctors');
        }
      })();
    }
  }, [id, isEdit, navigate, setValue]);

  const fetchHospitals = async () => {
    try {
      const res = await hospitalAPI.getHospitals();
      console.log('Fetched hospitals:', res.data);
      setHospitals(res.data.map((h: any) => h.name));
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const onSubmit = async (data: DoctorFormData) => {
    setLoading(true);
    try {
      const formData: DoctorFormData = {
        ...data,
        documents: selectedFiles,
        fileTypes,
        descriptions,
      };

      if (isEdit && id) {
        await doctorAPI.updateDoctor(id, formData, setUploadProgress);
        toast.success('Doctor updated successfully');
      } else {
        await doctorAPI.createDoctor(formData, setUploadProgress);
        toast.success('Doctor created successfully');
      }
      navigate('/doctors');
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/doctors')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Doctor' : 'Add New Doctor'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEdit ? 'Update doctor information' : 'Create a new doctor entry with contact details'}
          </p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm p-6"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input {...register('name', { required: 'Name is required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input {...register('email', { required: 'Email is required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input {...register('phone', { required: 'Phone is required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
              <input {...register('specialization')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hospitals</label>
              <select multiple {...register('Hospitallist')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32">
                {hospitals.map((hosp, index) => (
                  <option key={index} value={hosp}>{hosp}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input {...register('location')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Targets</label>
              <input type="number" {...register('targets')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload Documents</label>
              <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} className="block" />
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-gray-200">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors duration-200"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {uploadProgress > 0 ? `Uploading... ${uploadProgress}%` : (isEdit ? 'Updating...' : 'Creating...')}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEdit ? 'Update Doctor' : 'Create Doctor'}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default DoctorForm;
