-- updated info
ALTER TABLE courses
    ADD column course_name_sims 			text,
    ADD column owning_faculty 				text,
    ADD column owning_academic_unit 		text,
    ADD column collab_academic_unit 		text,
    ADD column administrative_campus 		text,
    ADD column units_of_credit 				integer,
    ADD column grading_basis 				text,
    ADD column academic_calendar_type 		text,
    ADD column career 						text,
    ADD column field_broad 					text,
    ADD column field_narrow 				text,
    ADD column field_detailed 				text,
    ADD column level 						text,
    ADD column teaching_strat_and_rationale	text,
    ADD column course_aims 					text,
    ADD column delivery_attributes 			text,
    ADD column course_type 					text,
    ADD column course_attributes 			text,
    ADD column repeat_for_credit 			text,
    ADD column delivery_name 				text,
    ADD column delivery_mode 				text,
    ADD column delivery_format 				text,
    ADD column handbook_title 				text,
    ADD column handbook_url 				text
;

-- schemas

CREATE TABLE learning_outcomes(
	course_code varchar(8),
	index int,
	code text,
	description text,
	
	PRIMARY KEY (course_code, index),
	FOREIGN KEY (course_code) references courses(course_code)
);

CREATE TABLE assessments(
	course_code varchar(8),
	index int,
	assessment_type text,
	assessment_name text,
	weighting decimal, --TODO limit to 100, maybe add % format
	
	PRIMARY KEY (course_code, index),
	foreign key (course_code) references courses(course_code)
);

CREATE TABLE relationships(
	course_code varchar(8),
	relationship_type text,
	related_course text, --TODO make this just a course code and a foreign key
	
	foreign key (course_code) references courses(course_code)
);


