-- updated info
CREATE TABLE assumed_knowledge(
	course_id	integer UNIQUE,
	keywords 	text[],
	
	FOREIGN KEY (course_id) REFERENCES courses(course_id)
);
