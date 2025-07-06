import React, { useState, useEffect, useMemo } from 'react';
import api from '../axiosConfig';
import { PlusIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const TeacherClassAssignment = () => {
  // State management
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [classTeachers, setClassTeachers] = useState({});
  const [savingClassId, setSavingClassId] = useState(null);
  const [teacherSearch, setTeacherSearch] = useState('');

  // Fetch classes and teachers on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classesRes, teachersRes] = await Promise.all([
        api.get('/classes?include=teachers'),
        api.get('/users?role=teacher')
      ]);
      
      setClasses(classesRes.data);
      setTeachers(teachersRes.data);
      
      const initialAssignments = {};
      classesRes.data.forEach(cls => {
        initialAssignments[cls.id] = (cls.teachers || []).map(t => ({
          teacherId: t.id,
          subject: t.subject
        }));
      });
      setClassTeachers(initialAssignments);
    } catch (err) {
      toast.error('Failed to load data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle teacher assignment change
  const handleTeacherChange = (classId, index, field, value) => {
    setClassTeachers(prev => {
      const updatedAssignments = { ...prev };
      const classAssignments = [...(updatedAssignments[classId] || [])];
      
      classAssignments[index] = {
        ...classAssignments[index],
        [field]: value
      };
      
      updatedAssignments[classId] = classAssignments;
      return updatedAssignments;
    });
  };

  // Add new teacher assignment
  const addTeacherAssignment = (classId) => {
    setClassTeachers(prev => ({
      ...prev,
      [classId]: [
        ...(prev[classId] || []),
        { teacherId: '', subject: '' }
      ]
    }));
  };

  // Remove teacher assignment
  const removeTeacherAssignment = (classId, index) => {
    setClassTeachers(prev => {
      const updatedAssignments = { ...prev };
      updatedAssignments[classId] = (updatedAssignments[classId] || []).filter((_, i) => i !== index);
      return updatedAssignments;
    });
    
    toast.info('Assignment removed. Save to confirm changes.');
  };

  // Save teacher assignments for a class
  const saveClassTeachers = async (classId) => {
    try {
      setSavingClassId(classId);
      
      const currentAssignments = classTeachers[classId] || [];
      
      // Filter out empty assignments and remove duplicates
      const assignmentsToSave = [];
      const uniqueKeys = new Set();
      
      for (const assignment of currentAssignments) {
        if (assignment.teacherId && assignment.subject) {
          const key = `${assignment.teacherId}-${assignment.subject}`;
          if (!uniqueKeys.has(key)) {
            uniqueKeys.add(key);
            assignmentsToSave.push({
              teacherId: assignment.teacherId,
              subject: assignment.subject
            });
          }
        }
      }
      
      const response = await api.put(`/classes/${classId}/teachers`, {
        teachers: assignmentsToSave
      });
      
      // Update the class in the classes array
      setClasses(prev => prev.map(cls => 
        cls.id === classId 
          ? { 
              ...cls, 
              teachers: response.data.updatedAssignments || []
            } 
          : cls
      ));
      
      // Update our local assignments state with the saved data
      setClassTeachers(prev => ({
        ...prev,
        [classId]: (response.data.updatedAssignments || []).map(a => ({
          teacherId: a.teacher_id,
          subject: a.subject
        }))
      }));
      
      toast.success(`Teacher assignments updated successfully!`);
    } catch (err) {
      let errorMsg = 'Failed to update teacher assignments. Please try again.';
      
      if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
        if (err.response.data.details) {
          errorMsg += `: ${err.response.data.details}`;
        }
      }
      
      toast.error(errorMsg);
    } finally {
      setSavingClassId(null);
    }
  };

  // Filter classes based on search term
  const filteredClasses = classes.filter(cls => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Check class name and subject
    if (cls.name.toLowerCase().includes(searchLower) || 
        cls.subject.toLowerCase().includes(searchLower)) {
      return true;
    }
    
    // Check teacher names
    if (cls.teachers && cls.teachers.some(teacher => {
      const teacherName = `${teacher.first_name || ''} ${teacher.last_name || ''}`.toLowerCase();
      return teacherName.includes(searchLower);
    })) {
      return true;
    }
    
    return false;
  });

  // Filter teachers based on search term
  const filteredTeachers = useMemo(() => {
    if (!teacherSearch.trim()) return teachers;
    
    const searchLower = teacherSearch.toLowerCase();
    return teachers.filter(teacher => {
      const fullName = `${teacher.first_name || ''} ${teacher.last_name || ''}`.toLowerCase();
      return fullName.includes(searchLower);
    });
  }, [teachers, teacherSearch]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedClasses = filteredClasses.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);

  // Get teacher name by ID
  const getTeacherName = (teacherId) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? `${teacher.first_name} ${teacher.last_name}` : 'Unknown Teacher';
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 rounded-lg shadow-lg">
      <ToastContainer position="bottom-right" autoClose={3000} />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Teacher Class Assignment</h1>
        <p className="text-gray-600 mt-1">Assign teachers to classes by subject</p>
      </div>

      {/* Search and Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Search Classes
        </label>
        <input
          type="text"
          placeholder="Search by class name, subject, or teacher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="sr-only">Loading...</span>
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No classes found</h3>
          <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria</p>
          
          <button 
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Refresh Data
          </button>
        </div>
      ) : (
        <>
          {/* Classes Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">
                    Teacher Assignments
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedClasses.map(cls => (
                  <tr key={cls.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{cls.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{cls.subject}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Grade {cls.grade_level}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-3">
                        {(Array.isArray(classTeachers[cls.id]) ? classTeachers[cls.id] : []).map((assignment, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="flex-1 relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                              </div>
                              <select
                                value={assignment.teacherId || ''}
                                onChange={(e) => handleTeacherChange(
                                  cls.id, 
                                  index, 
                                  'teacherId', 
                                  e.target.value
                                )}
                                className="w-full pl-10 p-2 border border-gray-300 rounded-md shadow-sm"
                                disabled={savingClassId === cls.id}
                              >
                                <option value="">Select a teacher</option>
                                {filteredTeachers.map(teacher => (
                                  <option key={teacher.id} value={teacher.id}>
                                    {teacher.first_name} {teacher.last_name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            <input
                              type="text"
                              value={assignment.subject || ''}
                              onChange={(e) => handleTeacherChange(
                                cls.id, 
                                index, 
                                'subject', 
                                e.target.value
                              )}
                              placeholder="Subject"
                              className="flex-1 p-2 border border-gray-300 rounded-md shadow-sm"
                              disabled={savingClassId === cls.id}
                            />
                            
                            <button
                              onClick={() => removeTeacherAssignment(cls.id, index)}
                              className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50"
                              title="Remove assignment"
                              disabled={savingClassId === cls.id}
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                        
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => addTeacherAssignment(cls.id)}
                            className="flex items-center text-blue-500 hover:text-blue-700 text-sm"
                            disabled={savingClassId === cls.id}
                          >
                            <PlusIcon className="w-4 h-4 mr-1" />
                            Add Teacher Assignment
                          </button>
                          
                          <div className="flex-1 max-w-xs ml-4">
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                              </div>
                              <input
                                type="text"
                                placeholder="Search teachers..."
                                value={teacherSearch}
                                onChange={(e) => setTeacherSearch(e.target.value)}
                                className="w-full pl-10 p-2 border border-gray-300 rounded-md shadow-sm text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => saveClassTeachers(cls.id)}
                          disabled={savingClassId !== null}
                          className={`px-4 py-2 text-white rounded-md ${
                            savingClassId === cls.id 
                              ? 'bg-blue-400 cursor-not-allowed' 
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                        >
                          {savingClassId === cls.id ? (
                            <span className="flex items-center justify-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Saving...
                            </span>
                          ) : (
                            'Save Assignments'
                          )}
                        </button>
                        
                        <button
                          onClick={fetchData}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                        >
                          Refresh All
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-between items-center">
              <div className="text-sm text-gray-700">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredClasses.length)} of {filteredClasses.length} classes
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === 1 
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Previous
                </button>
                
                <span className="text-sm text-gray-700 px-3 py-1">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === totalPages 
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TeacherClassAssignment;