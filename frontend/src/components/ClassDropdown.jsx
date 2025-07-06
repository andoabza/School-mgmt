export default function ClassDropdown({ classes, currentUser, value, onChange }) {
  // Filter classes if user is a teacher (only show their own classes)
  const filteredClasses = currentUser?.role === 'teacher' 
    ? classes.filter(c => c.teacher_id === currentUser.id)
    : classes;

  return (
    <select
      className="w-full p-2 border rounded"
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
    >
      <option value="">Select a class</option>
      {filteredClasses.map(cls => (
        <option key={cls.id} value={cls.id}>
          {cls.name} - {cls.subject} (Teacher: {cls.teacher_name})
        </option>
      ))}
    </select>
  );
}