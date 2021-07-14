-- updated info
ALTER TABLE courses(
    ADD column delivery_name text,
    ADD column delivery_mode text,
    ADD column delivery_format text,
    ADD column handbook_title text,
    ADD column handbook_url text
);

-- schemas

CREATE TABLE learning_outcomes(
	course_code varchar(8),
	position int,
	code text,
	description text
	
	foreign key (course_code) references courses(course_code)
);

CREATE TABLE assessments(
	course_code varchar(8),
	position int,
	assessment_type text,
	assessment_name text,
	weighting int --TODO limit to 100, maybe add % format
	
	foreign key (course_code) references courses(course_code)
);

CREATE TABLE relationships(
	course_code varchar(8),
	relationship_type text,
	related_course text --TODO make this just a course code and a foreign key
	
	foreign key (course_code) references courses(course_code)
);
