import React, { useState, useEffect, useRef, useMemo } from 'react';
import moment from 'moment';
import { useUser } from '../context/userContext';
import Modal from './Modal';
import ClassDropdown from './ClassDropdown';
import api from '../axiosConfig.js';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  PlusIcon, ChevronLeftIcon, ChevronRightIcon, 
  CalendarIcon, ViewColumnsIcon as ViewGridIcon, EyeIcon as ViewListIcon,
  UserIcon, AcademicCapIcon, BuildingOffice2Icon,
  XMarkIcon, ClockIcon, ArrowPathIcon, FunnelIcon
} from '@heroicons/react/24/outline';
import AttendanceModal from './AttendanceModal';

export default function Scheduler() {
  const userContext = useUser();
  const [events, setEvents] = useState([]);
  const [resources, setResources] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('week');
  const [filter, setFilter] = useState({
    teacher: null,
    class: null
  });
  const [draggedEvent, setDraggedEvent] = useState(null);
  const [dragOverSlot, setDragOverSlot] = useState(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [children, setChildren] = useState([]); // For parent role
  const [classTeacherMap, setClassTeacherMap] = useState({}); // Map class IDs to teachers

  const calendarRef = useRef(null);

  const currentUser = userContext?.user;
  const isAdmin = currentUser?.role === 'admin';
  const isTeacher = currentUser?.role === 'teacher';
  const isStudent = currentUser?.role === 'student';
  const isParent = currentUser?.role === 'parent';
  
  // Determine edit permissions
  const canEdit = isAdmin || isTeacher;
  const canTakeAttendance = isTeacher || isAdmin;

  // Fetch data from API
  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      let schedulesData = [], classList = [], teacherList = [], filteredList = [], classroomsData = [];

      if (isStudent) {
        // Student: fetch enrolled classes
        const enrolledRes = await api.get(`enrollments/${currentUser.id}`);
        const enrolledClassIds = enrolledRes.data.map(cls => cls.class_id)

        // Fetch schedules for enrolled classes
        const schedulesRes = await api.get('/schedules');
        schedulesData = schedulesRes.data.filter(s => 
          enrolledClassIds.includes(s.class_id)
        );

        // Get classes from enrollment data
        classList = enrolledRes.data;
        
        // Fetch teachers and classrooms
        const [teachersRes, classroomsRes] = await Promise.all([
          api.get('/teacher'),
          api.get('/classrooms')
        ]);
        filteredList = teachersRes.data.filter(teacher => teacher.classes.some(cls => enrolledClassIds.includes(cls.id)));
        teacherList = teachersRes.data;
        classroomsData = classroomsRes.data;

      } else if (isTeacher) {
        // Teacher: fetch classes taught by this teacher
        const classesRes = await api.get(`/teacher/${currentUser.id}/classes`);
        const teacherClassIds = classesRes.data.map(c => c.id);
        
        // Fetch schedules for teacher's classes
        const schedulesRes = await api.get('/schedules');
        schedulesData = schedulesRes.data.filter(s => 
          teacherClassIds.includes(s.class_id)
        );
        
        classList = classesRes.data;

        // Fetch teachers and classrooms
        const [teachersRes, classroomsRes] = await Promise.all([
          api.get('/teacher'),
          api.get('/classrooms')
        ]);
        teacherList = teachersRes.data;
        classroomsData = classroomsRes.data;

      } else if (isParent) {
        // Parent: fetch children and their schedules
        const childrenRes = await api.get(`/parent/${currentUser.id}/children`);
        const childrenIds = childrenRes.data.map(child => child.id);
        setChildren(childrenRes.data);
        
        // Fetch enrollments for all children
        const enrollments = [];
        for (const childId of childrenIds) {
          const enrollmentRes = await api.get(`enrollments/${childId}`);
          enrollments.push(...enrollmentRes.data);
        }
        
        const enrolledClassIds = [...new Set(enrollments.map(e => e.class_id))];
        
        // Fetch schedules for these classes
        const schedulesRes = await api.get('/schedules');
        schedulesData = schedulesRes.data.filter(s => 
          enrolledClassIds.includes(s.class_id)
        );
        
        // Get classes, teachers, and classrooms
        const [classesRes, teachersRes, classroomsRes] = await Promise.all([
          api.get('/classes'),
          api.get('/teacher'),
          api.get('/classrooms')
        ]);
        
        classList = classesRes.data.filter(c => 
          enrolledClassIds.includes(c.id)
        );
        teacherList = teachersRes.data;
        classroomsData = classroomsRes.data;

      } else if (isAdmin) {
        // Admin: fetch all data
        const [schedulesRes, classesRes, teachersRes, classroomsRes] = await Promise.all([
          api.get('/schedules'),
          api.get('/classes'),
          api.get('/teacher'),
          api.get('/classrooms')
        ]);
        schedulesData = schedulesRes.data;
        classList = classesRes.data;
        teacherList = teachersRes.data;
        classroomsData = classroomsRes.data;
      }
      // Create class-teacher map
      const classTeacherMapping = {};
      classList.forEach(cls => {
        classTeacherMapping[cls.id] = cls.teacher_id;
      });
      setClassTeacherMap(classTeacherMapping);

      // Process events
      const processedEvents = schedulesData.map(sched => {
        const teacher = teacherList.find(t => t.id === sched.teacher_id);
        const teacherName = teacher ? `${teacher.first_name} ${teacher.last_name}` : '' ;

        const startDate = moment().day(sched.day_of_week).set({
          hour: moment(sched.start_time, 'HH:mm:ss').hour(),
          minute: moment(sched.start_time, 'HH:mm:ss').minute(),
          second: 0
        }).toDate();

        const endDate = moment().day(sched.day_of_week).set({
          hour: moment(sched.end_time, 'HH:mm:ss').hour(),
          minute: moment(sched.end_time, 'HH:mm:ss').minute(),
          second: 0
        }).toDate();

        return {
          id: sched.id,
          title: `${sched.class_name} - ${sched.subject}`,
          start: startDate,
          end: endDate,
          resourceId: sched.classroom_id,
          classId: sched.class_id,
          teacherId: sched.teacher_id,
          dayOfWeek: sched.day_of_week,
          startTime: sched.start_time,
          endTime: sched.end_time,
          teacherName,
          className: sched.class_name,
          subject: sched.subject,
          color: `hsl(${(sched.class_id * 137) % 360}, 70%, 50%)`
        };
      });

      setEvents(processedEvents);
      setResources(classroomsData);
      setClasses(classList);
      setTeachers(teacherList || filteredList);
    } catch (error) {
      console.error('Error fetching data:', error);
      console.log(error);
      toast.error('Failed to load schedule data');
    } finally {
      setIsLoading(false);
    }
  };

  // Navigation functions
  const navigate = (action) => {
    switch (action) {
      case 'PREV':
        setCurrentDate(moment(currentDate).subtract(1, view === 'day' ? 'day' : 'week').toDate());
        break;
      case 'NEXT':
        setCurrentDate(moment(currentDate).add(1, view === 'day' ? 'day' : 'week').toDate());
        break;
      case 'TODAY':
        setCurrentDate(new Date());
        break;
      default:
        break;
    }
  };

  // Handle view change
  const handleViewChange = (newView) => {
    setView(newView);
  };

  // Handle slot selection
  const handleSelectSlot = (resourceId, dayIndex, time) => {
    if (!canEdit) {
      toast.info('Only admins and teachers can create schedules');
      return;
    }

    const selectedDate = new Date(currentDate);
    selectedDate.setDate(selectedDate.getDate() + (dayIndex - selectedDate.getDay()));

    // Prevent creating events for past days
    if (selectedDate < new Date().setHours(0, 0, 0, 0)) {
      toast.error("Cannot create schedules for past dates");
      return;
    }

    const start = new Date(selectedDate);
    start.setHours(time, 0, 0, 0);

    const end = new Date(start);
    end.setHours(time + 1, 0, 0, 0);

    setCurrentEvent({
      start,
      end,
      resourceId,
      dayOfWeek: dayIndex,
      startTime: moment(start).format('HH:mm:ss'),
      endTime: moment(end).format('HH:mm:ss'),
      classId: null
    });
    setIsModalOpen(true);
  };

  // Handle event selection
  const handleSelectEvent = (event) => {
    // Prevent teachers from editing other teachers' classes
    if (isTeacher &&
        event.teacherId !== currentUser.id) {
      // Show event details for teacher (view only)
      const eventDetails = (
        <div className="p-3">
          <h3 className="font-bold text-lg mb-2">{event.title}</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center">
              <UserIcon className="w-4 h-4 mr-2 text-gray-500" />
              <span>{event.teacherName}</span>
            </div>
            <div className="flex items-center">
              <BuildingOffice2Icon className="w-4 h-4 mr-2 text-gray-500" />
              <span>{resources.find(r => r.id === event.resourceId)?.name || 'Unknown Room'}</span>
            </div>
            <div className="flex items-center">
              <ClockIcon className="w-4 h-4 mr-2 text-gray-500" />
              <span>{moment(event.start).format('h:mm A')} - {moment(event.end).format('h:mm A')}</span>
            </div>
            <div className="flex items-center">
              <AcademicCapIcon className="w-4 h-4 mr-2 text-gray-500" />
              <span>{event.subject}</span>
            </div>
          </div>
          {/*{canTakeAttendance && (
            <button
              onClick={() => {
                toast.dismiss();
                setCurrentEvent(event);
                setIsAttendanceModalOpen(true);
              }}
              className="mt-2 w-full py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Take Attendance
            </button>
          )}*/}
        </div>
      );

      toast.info(eventDetails, {
        autoClose: false,
        closeButton: true,
        icon: <CalendarIcon className="w-5 h-5 text-blue-500" />
      });
      return;
    }

    // For students and parents, show event details without edit options
    if (isStudent || isParent) {
      const eventDetails = (
        <div className="p-3">
          <h3 className="font-bold text-lg mb-2">{event.title}</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center">
              <UserIcon className="w-4 h-4 mr-2 text-gray-500" />
              <span>{event.teacherName}</span>
            </div>
            <div className="flex items-center">
              <BuildingOffice2Icon className="w-4 h-4 mr-2 text-gray-500" />
              <span>{resources.find(r => r.id === event.resourceId)?.name || 'Unknown Room'}</span>
            </div>
            <div className="flex items-center">
              <ClockIcon className="w-4 h-4 mr-2 text-gray-500" />
              <span>{moment(event.start).format('h:mm A')} - {moment(event.end).format('h:mm A')}</span>
            </div>
            <div className="flex items-center">
              <AcademicCapIcon className="w-4 h-4 mr-2 text-gray-500" />
              <span>{event.subject}</span>
            </div>
          </div>
          {isParent && (
            <div className="mt-2">
              <div className="font-medium text-sm">Your children in this class:</div>
              <ul className="list-disc pl-5">
                {children.filter(child => 
                  child.classes?.some(c => c.id === event.classId)
                ).map(child => (
                  <li key={child.id}>{child.first_name} {child.last_name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );

      toast.info(eventDetails, {
        autoClose: false,
        closeButton: true,
        icon: <CalendarIcon className="w-5 h-5 text-blue-500" />
      });
      return;
    }

    // For admins and teachers (editing their own classes)
    setCurrentEvent({
      id: event.id,
      classId: event.classId,
      start: new Date(event.start),
      end: new Date(event.end),
      resourceId: event.resourceId,
      dayOfWeek: event.dayOfWeek,
      startTime: event.startTime,
      endTime: event.endTime
    });
    setIsModalOpen(true);
  };

  // Open attendance modal
  const openAttendanceModal = (event) => {
    setCurrentEvent(event);
    setIsAttendanceModalOpen(true);
  };

  // Handle drag start
  const handleDragStart = (e, event) => {
    if (!canEdit) return;
    e.dataTransfer.setData("text/plain", event.id);
    setDraggedEvent(event);
  };

  // Handle drag over
  const handleDragOver = (e, resourceId, dayIndex, timeSlot) => {
    e.preventDefault();
    if (!canEdit) return;
    setDragOverSlot({ resourceId, dayIndex, timeSlot });
  };

  // Handle drop
  const handleDrop = async (e, resourceId, dayIndex, timeSlot) => {
    e.preventDefault();
    if (!canEdit || !draggedEvent) return;

    try {
      const eventId = e.dataTransfer.getData("text");
      const event = events.find(ev => ev.id === eventId);

      if (!event) return;

      const newStart = new Date(currentDate);
      newStart.setDate(newStart.getDate() + (dayIndex - newStart.getDay()));
      newStart.setHours(timeSlot, 0, 0, 0);

      // Prevent moving events to past dates
      if (newStart < new Date().setHours(0, 0, 0, 0)) {
        toast.error("Cannot move schedules to past dates");
        return;
      }

      const duration = moment(event.end).diff(moment(event.start), 'hours');
      const newEnd = new Date(newStart);
      newEnd.setHours(timeSlot + duration, 0, 0, 0);

      await api.patch(`/schedules/${event.id}`, {
        classroom_id: resourceId,
        day_of_week: dayIndex,
        start_time: moment(newStart).format('HH:mm:ss'),
        end_time: moment(newEnd).format('HH:mm:ss')
      });

      const updatedEvent = {
        ...event,
        start: newStart,
        end: newEnd,
        resourceId,
        dayOfWeek: dayIndex,
        startTime: moment(newStart).format('HH:mm:ss'),
        endTime: moment(newEnd).format('HH:mm:ss')
      };

      setEvents(events.map(ev => ev.id === event.id ? updatedEvent : ev));
      toast.success('Schedule updated successfully');
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update schedule');
    } finally {
      setDraggedEvent(null);
      setDragOverSlot(null);
    }
  };

  // Save event handler
  const handleSaveEvent = async () => {
    if (!currentEvent?.classId) {
      toast.error('Please select a class');
      return;
    }

    try {
      if (currentEvent.id) {
        await api.patch(`/schedules/${currentEvent.id}`, {
          class_id: currentEvent.classId,
          classroom_id: currentEvent.resourceId,
          day_of_week: currentEvent.dayOfWeek,
          start_time: currentEvent.startTime,
          end_time: currentEvent.endTime
        });

        setEvents(events.map(ev =>
          ev.id === currentEvent.id ? {
            ...ev,
            classId: currentEvent.classId,
            title: classes.find(c => c.id === currentEvent.classId)?.name || 'Unknown Class',
            start: currentEvent.start,
            end: currentEvent.end,
            resourceId: currentEvent.resourceId
          } : ev
        ));
        toast.success('Schedule updated successfully');
      } else {
        // Validate event date
        const eventDate = new Date(currentEvent.start);
        if (eventDate < new Date().setHours(0, 0, 0, 0)) {
          toast.error("Cannot create schedules for past dates");
          return;
        }

        const response = await api.post('/schedules', {
          class_id: currentEvent.classId,
          classroom_id: currentEvent.resourceId,
          day_of_week: currentEvent.dayOfWeek,
          start_time: currentEvent.startTime,
          end_time: currentEvent.endTime
        });
        const newEvent = response.data;
        const classInfo = classes.find(c => c.id === currentEvent.classId);
        const teacher = teachers.find(t => t.id === classTeacherMap[currentEvent.classId]);
        const teacherName = teacher ? `${teacher.first_name} ${teacher.last_name}` : 'Unknown Teacher';

        const newEventObj = {
          id: newEvent.id,
          title: `${classInfo?.name || 'Unknown'} - ${classInfo?.subject || ''}`,
          start: currentEvent.start,
          end: currentEvent.end,
          resourceId: currentEvent.resourceId,
          classId: currentEvent.classId,
          teacherId: classTeacherMap[currentEvent.classId],
          dayOfWeek: currentEvent.dayOfWeek,
          startTime: currentEvent.startTime,
          endTime: currentEvent.endTime,
          teacherName,
          className: classInfo?.name,
          subject: classInfo?.subject,
          color: classInfo 
            ? `hsl(${(classInfo.id * 137) % 360}, 70%, 50%)` 
            : '#cccccc'
        };

        setEvents([...events, newEventObj]);
        toast.success('Schedule created successfully');
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error(error.response?.data?.error || 'Failed to save schedule');
    }
  };

  // Delete event handler
  const handleDeleteEvent = async () => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) return;

    try {
      await api.delete(`/schedules/${currentEvent.id}`);
      setEvents(events.filter(ev => ev.id !== currentEvent.id));
      setIsModalOpen(false);
      toast.success('Schedule deleted successfully');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete schedule');
    }
  };

  // Filter events
  const filteredEvents = events.filter(event => {
    return (
      (!filter.teacher || event.teacherId === filter.teacher) &&
      (!filter.class || event.classId === filter.class)
    );
  });

  // Clear all filters
  const clearFilters = () => {
    setFilter({
      teacher: null,
      class: null
    });
  };

  // Render calendar grid
  const renderCalendarGrid = () => {
    const timeSlots = Array.from({ length: 14 }, (_, i) => i + 7); // 7am to 8pm
    const days = Array.from({ length: 7 }, (_, i) => i); // Sunday to Saturday

    const currentDay = currentDate.getDay();
    const currentWeekStart = new Date(currentDate);
    currentWeekStart.setDate(currentDate.getDate() - currentDay);

    return (
      <div className="overflow-auto h-[calc(100vh-300px)]" ref={calendarRef}>
        <div className="grid grid-cols-8 gap-px bg-gray-200 border border-gray-200">
          {/* Header row */}
          <div className="bg-gray-100 p-2 sticky top-0 z-10 border-b border-gray-300">
            <div className="h-10 flex items-center justify-center">
              <span className="text-gray-500">Time</span>
            </div>
          </div>

          {days.map(dayIndex => {
            const day = new Date(currentWeekStart);
            day.setDate(day.getDate() + dayIndex);
            const isToday = moment(day).isSame(new Date(), 'day');
            const isPast = day < new Date().setHours(0, 0, 0, 0);

            return (
              <div
                key={dayIndex}
                className={`bg-blue-500 p-2 sticky top-0 z-10 border-b border-gray-300 ${isToday ? 'bg-blue-50' : ''} ${isPast ? 'opacity-70' : ''}`}
              >
                <div className={`text-center font-medium text-gray-700 ${isToday ? 'text-white bg-green-600 rounded' : ''} ${isPast ? 'opacity-70' : ''}`}>
                  {moment(day).format('ddd')}
                </div>
                <div className={`text-center text-sm ${isToday ? 'text-white' : ''}`}>
                  {moment(day).format('MMM D')}
                </div>
              </div>
            );
          })}

          {/* Time slots */}
          {timeSlots.map(time => (
            <React.Fragment key={time}>
              <div className="bg-gray-50 p-2 border-r border-gray-200 flex items-center justify-center text-sm text-gray-500 sticky left-0 z-10">
                {time > 12 ? `${time - 12} PM` : `${time === 12 ? 12 : time} AM`}
              </div>

              {days.map(dayIndex => {
                const eventsInSlot = filteredEvents.filter(event =>
                  event.dayOfWeek === dayIndex &&
                  moment(event.start).hours() <= time &&
                  moment(event.end).hours() > time
                );

                const day = new Date(currentWeekStart);
                day.setDate(day.getDate() + dayIndex);
                const isPast = day < new Date().setHours(0, 0, 0, 0);

                return (
                  <div
                    key={`${dayIndex}-${time}`}
                    className={`bg-white min-h-[60px] relative group ${dragOverSlot?.dayIndex === dayIndex && dragOverSlot?.timeSlot === time ? 'bg-blue-50' : ''} ${isPast ? 'bg-gray-50' : ''}`}
                    onDragOver={(e) => !isPast && canEdit && handleDragOver(e, resources[0]?.id, dayIndex, time)}
                    onDrop={(e) => !isPast && canEdit && handleDrop(e, resources[0]?.id, dayIndex, time)}
                  >
                    {eventsInSlot.map(event => (
                      <div
                        key={event.id}
                        className="absolute w-full p-1 rounded cursor-pointer"
                        style={{
                          top: `${(moment(event.start).minutes() / 60) * 100}%`,
                          height: `${moment.duration(moment(event.end).diff(moment(event.start))).asHours() * 60}px`,
                          backgroundColor: event.color,
                          zIndex: 10
                        }}
                        onClick={() => handleSelectEvent(event)}
                        draggable={canEdit && !isPast}
                        onDragStart={(e) => canEdit && !isPast && handleDragStart(e, event)}
                      >
                        <div className="bg-white bg-opacity-90 h-full rounded p-1.5">
                          <div className="font-medium text-xs truncate">{event.title}</div>
                          <div className="text-xs opacity-80">
                            {moment(event.start).format('h:mm')} - {moment(event.end).format('h:mm A')}
                          </div>
                        </div>
                      </div>
                    ))}

                    {canEdit && !isPast && (
                      <button
                        className="w-full h-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-gray-400 hover:text-blue-500"
                        onClick={() => handleSelectSlot(resources[0]?.id, dayIndex, time)}
                      >
                        <PlusIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <ArrowPathIcon className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="mt-4 text-lg text-gray-600">Loading schedule data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                  <CalendarIcon className="w-6 h-6 mr-2 text-blue-600" />
                  School Schedule Calendar
                </h1>
                <p className="text-gray-600 mt-1">
                  {moment(currentDate).format('ddd MMMM YYYY')}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => navigate('PREV')}
                    className="p-2 rounded-lg hover:bg-gray-200"
                    aria-label="Previous"
                  >
                    <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
                  </button>

                  <button
                    onClick={() => navigate('TODAY')}
                    className="px-3 py-1 text-sm bg-white text-blue-600 rounded-lg hover:bg-blue-50 border border-blue-100"
                  >
                    Today
                  </button>

                  <button
                    onClick={() => navigate('NEXT')}
                    className="p-2 rounded-lg hover:bg-gray-200"
                    aria-label="Next"
                  >
                    <ChevronRightIcon className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => handleViewChange('day')}
                    className={`px-3 py-2 text-sm flex items-center ${view === 'day' ? 'bg-blue-100 text-blue-600' : 'bg-white'}`}
                  >
                    <ViewListIcon className="w-4 h-4 mr-1" />
                    Day
                  </button>
                  <button
                    onClick={() => handleViewChange('week')}
                    className={`px-3 py-2 text-sm flex items-center ${view === 'week' ? 'bg-blue-100 text-blue-600' : 'bg-white'}`}
                  >
                    <ViewGridIcon className="w-4 h-4 mr-1" />
                    Week
                  </button>
                </div>

                <button
                  onClick={() => setShowFilterPanel(!showFilterPanel)}
                  className="flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
                >
                  <FunnelIcon className="w-4 h-4" />
                  <span>Filters</span>
                </button>

                <button
                  onClick={fetchData}
                  className="flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
                >
                  <ArrowPathIcon className="w-5 h-5" />
                  <span>Refresh</span>
                </button>

                {canEdit && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:opacity-90 transition-opacity shadow-md"
                  >
                    <PlusIcon className="w-5 h-5" />
                    <span>Add Schedule</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Filter Panel - Collapsible */}
          {showFilterPanel && (
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold flex items-center">
                  <FunnelIcon className="w-5 h-5 mr-2 text-blue-500" />
                  Filter Schedules
                </h3>
                <button
                  onClick={() => setShowFilterPanel(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(isAdmin || isStudent || isParent) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <UserIcon className="w-4 h-4 mr-2 text-gray-500" />
                      Teacher
                    </label>
                    <select
                      className="w-full p-2 border rounded-lg bg-white"
                      value={filter.teacher || ''}
                      onChange={(e) => setFilter({...filter, teacher: e.target.value ? parseInt(e.target.value) : null})}
                    >
                      <option value="">All Teachers</option>
                      {teachers.map(teacher => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.first_name} {teacher.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {(isAdmin || isTeacher || isParent) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <AcademicCapIcon className="w-4 h-4 mr-2 text-gray-500" />
                      Class
                    </label>
                    <select
                      className="w-full p-2 border rounded-lg bg-white"
                      value={filter.class || ''}
                      onChange={(e) => setFilter({...filter, class: e.target.value ? parseInt(e.target.value) : null})}
                    >
                      <option value="">All Classes</option>
                      {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {(filter.teacher || filter.class) && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Calendar Grid */}
          <div className="p-4">
            {renderCalendarGrid()}
          </div>
        </div>
      </div>

      {/* Event Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              {currentEvent?.id ? 'Edit Schedule' : 'Create New Schedule'}
            </h2>
            <button
              onClick={() => setIsModalOpen(false)}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <XMarkIcon className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Class:</label>
              <ClassDropdown
                classes={classes}
                currentUser={currentUser}
                value={currentEvent?.classId}
                onChange={(classId) => setCurrentEvent({...currentEvent, classId})}
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Day of Week:</label>
              <select
                className="w-full p-2 border rounded-lg bg-gray-50"
                value={currentEvent?.dayOfWeek || 1}
                onChange={(e) => setCurrentEvent({...currentEvent, dayOfWeek: parseInt(e.target.value)})}
              >
                <option value={0}>Sunday</option>
                <option value={1}>Monday</option>
                <option value={2}>Tuesday</option>
                <option value={3}>Wednesday</option>
                <option value={4}>Thursday</option>
                <option value={5}>Friday</option>
                <option value={6}>Saturday</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Classroom:</label>
              <select
                className="w-full p-2 border rounded-lg bg-gray-50"
                value={currentEvent?.resourceId || ''}
                onChange={(e) => setCurrentEvent({...currentEvent, resourceId: parseInt(e.target.value)})}
              >
                <option value="">Select a classroom</option>
                {resources.map(resource => (
                  <option key={resource.id} value={resource.id}>
                    {resource.name} ({resource.building}) - Capacity: {resource.capacity}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Start Time:</label>
                <input
                  type="time"
                  className="w-full p-2 border rounded-lg bg-gray-50"
                  value={currentEvent?.startTime || '08:00'}
                  onChange={(e) => setCurrentEvent({...currentEvent, startTime: e.target.value})}
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">End Time:</label>
                <input
                  type="time"
                  className="w-full p-2 border rounded-lg bg-gray-50"
                  value={currentEvent?.endTime || '09:00'}
                  onChange={(e) => setCurrentEvent({...currentEvent, endTime: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-8">
            {currentEvent?.id && (
              <button
                onClick={handleDeleteEvent}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center"
              >
                <span>Delete</span>
              </button>
            )}
            <div className="flex space-x-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEvent}
                disabled={!currentEvent?.classId || !currentEvent?.resourceId}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Attendance Modal */}
      {isAttendanceModalOpen && currentEvent && (
        <AttendanceModal
          event={currentEvent}
          onClose={() => setIsAttendanceModalOpen(false)}
        />
      )}
      </div>
  );
}