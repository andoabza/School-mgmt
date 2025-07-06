GRANT ALL PRIVILEGES ON TABLE schedules TO postgres;
GRANT ALL PRIVILEGES ON SEQUENCE schedules_id_seq TO postgres;
-- Clear existing data (optional - use with caution in production)
TRUNCATE TABLE student_parents, parents, teachers, students, schedules, classes, classrooms, users RESTART IDENTITY CASCADE;

-- Insert admin users
INSERT INTO users (email, password, role, first_name, last_name) VALUES
('admin1@school.edu', '$2a$12$6VZ5XzO7WJd9Y8QwLk7zE.3jJfK9M2N1B0CvA3D4E5F6G7H8I9J0K1L', 'admin', 'John', 'Admin'),
('admin2@school.edu', '$2a$12$6VZ5XzO7WJd9Y8QwLk7zE.3jJfK9M2N1B0CvA3D4E5F6G7H8I9J0K1L', 'admin', 'Sarah', 'Administrator');

-- Insert teachers
INSERT INTO users (email, password, role, first_name, last_name) VALUES
('teacher1@school.edu', '$2a$12$6VZ5XzO7WJd9Y8QwLk7zE.3jJfK9M2N1B0CvA3D4E5F6G7H8I9J0K1L', 'teacher', 'Robert', 'Mathison'),
('teacher2@school.edu', '$2a$12$6VZ5XzO7WJd9Y8QwLk7zE.3jJfK9M2N1B0CvA3D4E5F6G7H8I9J0K1L', 'teacher', 'Emily', 'Scienceberg'),
('teacher3@school.edu', '$2a$12$6VZ5XzO7WJd9Y8QwLk7zE.3jJfK9M2N1B0CvA3D4E5F6G7H8I9J0K1L', 'teacher', 'David', 'Englishford');

-- Insert teacher records
INSERT INTO teachers (id, subject) VALUES
(3, 'Mathematics'),
(4, 'Science'),
(5, 'English Literature');

-- Insert students
INSERT INTO users (email, password, role, first_name, last_name) VALUES
('student1@school.edu', '$2a$12$6VZ5XzO7WJd9Y8QwLk7zE.3jJfK9M2N1B0CvA3D4E5F6G7H8I9J0K1L', 'student', 'Michael', 'Johnson'),
('student2@school.edu', '$2a$12$6VZ5XzO7WJd9Y8QwLk7zE.3jJfK9M2N1B0CvA3D4E5F6G7H8I9J0K1L', 'student', 'Jessica', 'Williams'),
('student3@school.edu', '$2a$12$6VZ5XzO7WJd9Y8QwLk7zE.3jJfK9M2N1B0CvA3D4E5F6G7H8I9J0K1L', 'student', 'Daniel', 'Brown'),
('student4@school.edu', '$2a$12$6VZ5XzO7WJd9Y8QwLk7zE.3jJfK9M2N1B0CvA3D4E5F6G7H8I9J0K1L', 'student', 'Sophia', 'Davis'),
('student5@school.edu', '$2a$12$6VZ5XzO7WJd9Y8QwLk7zE.3jJfK9M2N1B0CvA3D4E5F6G7H8I9J0K1L', 'student', 'Matthew', 'Miller');

-- Insert student records
INSERT INTO students (id, student_id, birth_date, grade_level, section) VALUES
(6, 'STU2023001', '2010-05-15', 8, 'A'),
(7, 'STU2023002', '2010-07-22', 8, 'A'),
(8, 'STU2023003', '2011-03-10', 7, 'B'),
(9, 'STU2023004', '2011-01-30', 7, 'B'),
(10, 'STU2023005', '2009-11-05', 9, 'C');

-- Insert parents
INSERT INTO users (email, password, role, first_name, last_name) VALUES
('parent1@school.edu', '$2a$12$6VZ5XzO7WJd9Y8QwLk7zE.3jJfK9M2N1B0CvA3D4E5F6G7H8I9J0K1L', 'parent', 'James', 'Johnson'),
('parent2@school.edu', '$2a$12$6VZ5XzO7WJd9Y8QwLk7zE.3jJfK9M2N1B0CvA3D4E5F6G7H8I9J0K1L', 'parent', 'Jennifer', 'Williams'),
('parent3@school.edu', '$2a$12$6VZ5XzO7WJd9Y8QwLk7zE.3jJfK9M2N1B0CvA3D4E5F6G7H8I9J0K1L', 'parent', 'Richard', 'Brown');

-- Insert parent records
INSERT INTO parents (id) VALUES (11), (12), (13);

-- Link parents to students
INSERT INTO student_parents (student_id, parent_id) VALUES
(6, 11), -- Michael Johnson -> James Johnson
(7, 12), -- Jessica Williams -> Jennifer Williams
(8, 13), -- Daniel Brown -> Richard Brown
(9, 12), -- Sophia Davis -> Jennifer Williams (shared parent)
(10, 11); -- Matthew Miller -> James Johnson (shared parent)

-- Insert classrooms
INSERT INTO classrooms (name, capacity, building) VALUES
('Room 101', 30, 'Main Building'),
('Room 102', 25, 'Main Building'),
('Science Lab', 20, 'Science Wing'),
('Computer Lab', 25, 'Technology Center'),
('Auditorium', 100, 'Arts Building');

-- Insert classes
INSERT INTO classes (name, subject, teacher_id) VALUES
('Algebra I', 'Mathematics', 3),
('Geometry', 'Mathematics', 3),
('Biology', 'Science', 4),
('Chemistry', 'Science', 4),
('English Literature', 'English', 5),
('Creative Writing', 'English', 5);

-- Insert schedules
INSERT INTO schedules (class_id, classroom_id, day_of_week, start_time, end_time) VALUES
-- Monday
(1, 1, 1, '08:00:00', '09:00:00'), -- Algebra I in Room 101
(3, 3, 1, '09:00:00', '10:30:00'), -- Biology in Science Lab
(5, 2, 1, '11:00:00', '12:00:00'), -- English Lit in Room 102

-- Tuesday
(2, 1, 2, '08:00:00', '09:00:00'), -- Geometry in Room 101
(4, 3, 2, '10:00:00', '11:30:00'), -- Chemistry in Science Lab
(6, 4, 2, '13:00:00', '14:00:00'), -- Creative Writing in Computer Lab

-- Wednesday
(1, 2, 3, '08:30:00', '09:30:00'), -- Algebra I in Room 102
(3, 3, 3, '10:00:00', '11:30:00'), -- Biology in Science Lab
(5, 1, 3, '12:00:00', '13:00:00'), -- English Lit in Room 101

-- Thursday
(2, 2, 4, '09:00:00', '10:00:00'), -- Geometry in Room 102
(4, 3, 4, '11:00:00', '12:30:00'), -- Chemistry in Science Lab
(6, 4, 4, '14:00:00', '15:00:00'), -- Creative Writing in Computer Lab

-- Friday
(1, 5, 5, '08:00:00', '09:00:00'), -- Algebra I in Auditorium
(5, 5, 5, '10:00:00', '11:00:00'); -- English Lit in Auditorium
