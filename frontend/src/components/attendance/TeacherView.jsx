import React from 'react';
import { FiAlertCircle, FiCheckCircle, FiClock, FiXCircle, FiGrid, FiList, FiPrinter, FiSave, FiSearch } from 'react-icons/fi';
import { CSVLink } from 'react-csv';

export default function TeacherView ({
  students,
  attendance,
  handleStatusChange,
  loading,
  existingAttendance,
  remark,
  setRemark,
  submitAttendance,
  statusOptions,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  attendanceStats,
  displayMode,
  setDisplayMode,
  exportData,
  filteredStudents,
  expandedStudent,
  setExpandedStudent,
  fetchMonthAttendance,
  classes,
  selectedClass
}) {
  return (
    <>
      {!existingAttendance && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>No attendance recorded for today.</strong> 
                {' '}Please mark attendance and save.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row justify-between gap-3 mb-6">
        <div className="flex flex-wrap gap-2">
          <textarea
            placeholder="Add remarks about today's class..."
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            className="p-2 border border-gray-300 rounded-md flex-grow min-w-[200px]"
            rows={1}
            disabled={loading}
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setDisplayMode(displayMode === 'table' ? 'card' : 'table')}
            className="p-2 border border-gray-300 rounded-md bg-white flex items-center"
          >
            {displayMode === 'table' ? <FiGrid className="mr-1" /> : <FiList className="mr-1" />}
            {displayMode === 'table' ? 'Card View' : 'Table View'}
          </button>
          
          {exportData.length > 0 && (
            <CSVLink 
              data={exportData} 
              filename={`attendance-${classes.find(c => c.id === selectedClass)?.name || 'class'}.csv`}
              className="px-3 py-2 bg-blue-600 text-white rounded-md flex items-center"
            >
              <FiPrinter className="mr-1" /> Export CSV
            </CSVLink>
          )}
          
          <button 
            onClick={submitAttendance}
            disabled={loading}
            className={`px-4 py-2 rounded-md flex items-center gap-1 min-w-[180px] justify-center ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <FiSave className="h-5 w-5" />
                {existingAttendance ? 'Update' : 'Save'} Attendance
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded-md bg-white"
          >
            <option value="all">All Statuses</option>
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Attendance Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{attendanceStats.total}</div>
          <div className="text-sm text-gray-600">Total Students</div>
        </div>
        
        {statusOptions.map(status => (
          <div key={status.value} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div 
                className="h-8 w-8 rounded-full flex items-center justify-center mr-2"
                style={{ backgroundColor: `${status.color}20`, border: `1px solid ${status.color}` }}
              >
                {status.icon}
              </div>
              <div>
                <div className="text-xl font-bold" style={{ color: status.color }}>
                  {attendanceStats[status.value]}
                </div>
                <div className="text-sm text-gray-600">{status.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Table View */}
      {displayMode === 'table' ? (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  History
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => {
                const status = attendance[student.id]?.status || 'present';
                const details = attendance[student.id]?.details || '';
                const statusInfo = statusOptions.find(opt => opt.value === status);
                
                return (
                  <React.Fragment key={student.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10" />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {student.first_name} {student.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              Grade: {student.grade_level}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.student_id || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-8 w-8 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${statusInfo?.color}20`, border: `1px solid ${statusInfo?.color}` }}
                          >
                            {statusInfo.icon}
                          </div>
                          <select
                            value={status}
                            onChange={(e) => handleStatusChange(student.id, e.target.value)}
                            className="p-1 border border-gray-300 rounded-md bg-white"
                            disabled={loading}
                          >
                            {statusOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {details || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-500">
                        <button 
                          onClick={() => setExpandedStudent(expandedStudent === student.id ? null : student.id)}
                          className="flex items-center"
                        >
                          {expandedStudent === student.id ? (
                            <>
                              <FiChevronUp className="mr-1" /> Hide
                            </>
                          ) : (
                            <>
                              <FiChevronDown className="mr-1" /> View
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                    {expandedStudent === student.id && (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 bg-gray-50">
                          <div className="text-sm text-gray-700">
                            <h4 className="font-medium mb-2">Attendance History (Last 7 Days)</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
                              {Array.from({ length: 7 }).map((_, i) => {
                                const date = moment().subtract(i, 'days').format('YYYY-MM-DD');
                                const historyItem = fetchMonthAttendance(student.id);
                                console.log(historyItem);
                                const status = historyItem?.status || 'not recorded';
                                const statusInfo = statusOptions.find(opt => opt.value === status) || 
                                                 { color: '#9CA3AF', icon: <FiCalendar /> };
                                
                                return (
                                  <div key={date} className="text-center p-2 bg-white rounded-lg border border-gray-200">
                                    <div className="text-xs text-gray-500">{moment(date).format('ddd')}</div>
                                    <div className="text-xs mb-1">{moment(date).format('MMM D')}</div>
                                    <div 
                                      className="mx-auto h-8 w-8 rounded-full flex items-center justify-center"
                                      style={{ 
                                        backgroundColor: `${statusInfo.color}20`, 
                                        border: `1px solid ${statusInfo.color}` 
                                      }}
                                    >
                                      {statusInfo.icon}
                                    </div>
                                    <div className="text-xs mt-1 capitalize">
                                      {status}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        // Card View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => {
            const status = attendance[student.id]?.status;
            const details = attendance[student.id]?.details;
            const statusInfo = statusOptions.find(opt => opt.value === status);
            
            return (
              <div key={student.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center">
                    <div className="bg-gray-200 border-2 border-dashed rounded-xl w-12 h-12 mr-3" />
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {student.first_name} {student.last_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        ID: {student.student_id || 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="h-10 w-10 rounded-full flex items-center justify-center mr-2"
                        style={{ 
                          backgroundColor: `${statusInfo?.color}20`, 
                          border: `1px solid ${statusInfo?.color}` 
                        }}
                      >
                        {statusInfo?.icon}
                      </div>
                      <div>
                        <div className="font-medium">{statusInfo?.label}</div>
                        <div className="text-sm text-gray-600">{details || 'No details'}</div>
                      </div>
                    </div>
                    
                    <select
                      value={status}
                      onChange={(e) => handleStatusChange(student.id, e.target.value)}
                      className="p-1 border border-gray-300 rounded-md bg-white"
                      disabled={loading}
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <button 
                    onClick={() => setExpandedStudent(expandedStudent === student.id ? null : student.id)}
                    className="w-full mt-4 text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center"
                  >
                    {expandedStudent === student.id ? (
                      <>
                        <FiChevronUp className="mr-1" /> Hide history
                      </>
                    ) : (
                      <>
                        <FiChevronDown className="mr-1" /> Show history
                      </>
                    )}
                  </button>
                  
                  {expandedStudent === student.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="font-medium mb-2">Recent Attendance</h4>
                      <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: 7 }).map((_, i) => {
                          const date = moment().subtract(i, 'days').format('YYYY-MM-DD');
                          const historyItem = findAttendanceRecord(student.id, date);
                          const status = historyItem?.status || 'not recorded';
                          const statusInfo = statusOptions.find(opt => opt.value === status) || 
                                          { color: '#9CA3AF', icon: <FiCalendar /> };
                          
                          return (
                            <div key={date} className="text-center">
                              <div className="text-xs text-gray-500">{moment(date).format('ddd')}</div>
                              <div 
                                className="mx-auto h-6 w-6 rounded-full flex items-center justify-center"
                                style={{ 
                                  backgroundColor: `${statusInfo.color}20`, 
                                  border: `1px solid ${statusInfo.color}` 
                                }}
                              >
                                {statusInfo.icon}
                              </div>
                              <div className="text-xs mt-1 capitalize">
                                {status}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};