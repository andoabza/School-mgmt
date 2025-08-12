import React from 'react';
import { FiUser, FiCalendar, FiCheckCircle, FiXCircle, FiClock, FiAlertCircle } from 'react-icons/fi';
import moment from 'moment';

export const ParentView = ({
  children,
  selectedChild,
  setSelectedChild,
  classes,
  selectedClass,
  setSelectedClass,
  loading,
  students,
  existingAttendance,
  selectedDate,
  studentAttendanceHistory,
  statusOptions,
  findAttendanceRecord
}) => {
  const currentStudent = students.length > 0 ? students[0] : null;
  const studentAttendance = currentStudent 
    ? studentAttendanceHistory.filter(item => item.student_id === currentStudent?.id)
    : [];
  const cls = classes.find(c => c.id === selectedClass);
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {children.length === 0 ? (
        <div className="text-center py-8">
          <FiUser className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No children registered</h3>
          <p className="mt-1 text-sm text-gray-500">Please contact the school to register your children</p>
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-8">
          <FiUser className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No attendance data available</h3>
          <p className="mt-1 text-sm text-gray-500">Select a child and class to view attendance</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center">
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mr-4" />
              <div>
                <h2 className="text-xl font-bold">
                  {currentStudent.first_name} {currentStudent.last_name}
                </h2>
                <p className="text-gray-600">ID: {currentStudent.student_id || 'N/A'} | Grade {currentStudent.grade_level}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold">
                {moment(selectedDate).format('dddd, MMMM D, YYYY')}
              </div>
              <div className="text-gray-600">
                {cls?.name}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Today's Status</h3>
              {existingAttendance && existingAttendance.records && existingAttendance.records.length > 0 ? (
                <div className="flex items-center">
                  {statusOptions.map(option => {
                    if (option.value === existingAttendance.records[0].status) {
                      return (
                        <div key={option.value} className="flex items-center">
                          <div 
                            className="h-10 w-10 rounded-full flex items-center justify-center mr-2"
                            style={{ 
                              backgroundColor: `${option.color}20`, 
                              border: `1px solid ${option.color}` 
                            }}
                          >
                            {option.icon}
                          </div>
                          <div>
                            <div className="font-medium" style={{ color: option.color }}>
                              {option.label}
                            </div>
                            <div className="text-sm text-gray-600">
                              {existingAttendance.records[0].details || 'No details'}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              ) : (
                <div className="text-gray-500">No attendance recorded for today</div>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Attendance Stats</h3>
              <div className="space-y-2">
                {studentAttendance.length > 0 ? (
                  <>
                    <div className="flex justify-between">
                      <span>Present:</span>
                      <span className="font-medium">
                        {Math.round(
                          (studentAttendance.filter(r => r.status === 'present').length / 
                          studentAttendance.length) * 100
                        )}% 
                        ({studentAttendance.filter(r => r.status === 'present').length}/
                        {studentAttendance.length} days)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ 
                          width: `${Math.round(
                            (studentAttendance.filter(r => r.status === 'present').length / 
                            studentAttendance.length) * 100
                          )}%` 
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Absences: {studentAttendance.filter(r => r.status === 'absent').length}</span>
                      <span>Late: {studentAttendance.filter(r => r.status === 'late').length}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-gray-500">No attendance data available</div>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg mt-6">
            <h3 className="font-medium text-gray-900 mb-2">Recent Attendance</h3>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 7 }).map((_, i) => {
                const date = moment().subtract(i, 'days').format('YYYY-MM-DD');
                const historyItem = studentAttendance.find(item => 
                  moment(item.date).format('YYYY-MM-DD') === date
                );
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
        </>
      )}
    </div>
  );
};