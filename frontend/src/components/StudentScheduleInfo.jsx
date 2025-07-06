export default function StudentScheduleInfo({ event }) {
  return (
    <div className="p-3 space-y-2">
      <h3 className="font-bold text-lg">{event.subject}</h3>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center">
          <UserIcon className="w-4 h-4 mr-2" />
          <span>{event.teacherName}</span>
        </div>
        <div className="flex items-center">
          <BuildingOffice2Icon className="w-4 h-4 mr-2" />
          <span>{event.classroom}</span>
        </div>
        <div className="flex items-center">
          <ClockIcon className="w-4 h-4 mr-2" />
          <span>{moment(event.start).format('h:mm A')} - {moment(event.end).format('h:mm A')}</span>
        </div>
        <div className="flex items-center">
          <AcademicCapIcon className="w-4 h-4 mr-2" />
          <span>Grade: {event.gradeLevel}</span>
        </div>
      </div>
      <div className="pt-2">
        <button 
          className="text-sm text-blue-600 hover:underline"
          onClick={() => {/* Show assignment details */}}
        >
          View Assignments
        </button>
      </div>
    </div>
  );
}