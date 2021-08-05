-- updated info
ALTER TABLE lectures DROP CONSTRAINT lectures_course_code_fkey;
ALTER TABLE votes DROP CONSTRAINT votes_course_a_fkey;
ALTER TABLE votes DROP CONSTRAINT votes_course_b_fkey;
ALTER TABLE learning_outcomes DROP CONSTRAINT learning_outcomes_course_code_fkey;
ALTER TABLE relationships DROP CONSTRAINT relationships_course_code_fkey;
ALTER TABLE assessments DROP CONSTRAINT assessments_course_code_fkey;
ALTER TABLE courses DROP CONSTRAINT courses_pkey;

ALTER TABLE courses
    ADD column term 			text,
    ADD column course_id 		SERIAL PRIMARY KEY,
    ADD CONSTRAINT course_id_unique UNIQUE (course_id)
;

ALTER TABLE lectures
	ADD column course_id		integer,
	ADD FOREIGN KEY (course_id) references courses(course_id)
;

ALTER TABLE learning_outcomes
	ADD column course_id		integer,
	ADD FOREIGN KEY (course_id) references courses(course_id)
;

ALTER TABLE relationships
	ADD column course_id 		integer,
	ADD FOREIGN KEY (course_id) references courses(course_id)
;

ALTER TABLE assessments
	ADD column course_id		integer,
	ADD FOREIGN KEY (course_id) references courses(course_id)
;
