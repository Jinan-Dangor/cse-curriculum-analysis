# Insert eclips_data.json into the database
import json
import psycopg2

def update_eclips_data():
	# Deprecate 'outline' field, 'handbook_summary' is being used
	# TODO scrape enrollment requirements
	# TODO transform into dictionaries
	keys =   ["Course Code",
		      "Course Name",
		      "Course Name - SiMs",
		      "Owning Faculty",
		      "Owning Academic Unit",
		      "Collaborating Academic Unit",
		      "Administrative Campus",
		      "Units of Credit",
		      "Grading Basis",
		      "Academic Calendar Type",
		      "Career",
		      "Course Description for Handbook",
		      "Field of Education (Broad)",
		      "Field of Education (Narrow)",
		      "Field of Education (Detailed)",
		      "Level",
		      "Teaching Strategies and Rationale",
		      "Course Aims",
		      "Delivery Attributes",
		      "Course Type",
		      "Course Attributes",
		      "Repeat for Credit",
		      "Delivery Name",
		      "Delivery Mode",
		      "Delivery Format"]
	
	fields = ["course_code",
	          "course_name",
	          "course_name_sims",
	          "owning_faculty",
	          "owning_academic_unit",
	          "collab_academic_unit",
	          "administrative_campus",
	          "units_of_credit",
	          "grading_basis",
	          "academic_calendar_type",
	          "career",
	          "handbook_summary",
	          "field_broad",
	          "field_narrow",
	          "field_detailed",
	          "level",
	          "teaching_strat_and_rationale",
	          "course_aims",
	          "delivery_attributes",
	          "course_type",
	          "course_attributes",
	          "repeat_for_credit",
	          "delivery_name",
	          "delivery_mode",
	          "delivery_format"]
	
	lo_keys =   ["Code",
	             "Description"]
	
	lo_fields = ["code",
	             "description"]
	
	a_keys =   ["Assessment Type",
	            "Assessment Name",
	            "Weighting (%)"]
	
	a_fields = ["assessment_type",
	            "assessment_name",
	            "weighting"]
	            

	COURSE_FILE = "/usr/src/app/src/eclips_scraper/eclips_data.json"
	with open(COURSE_FILE) as myf:
		j = json.load(myf)

	conn = psycopg2.connect("dbname=cse-curriculum-analysis user=postgres host=db port=5432 password=abc")
	cursor = conn.cursor()
	
	
	for course in j:
		query = """INSERT INTO courses (course_code, course_name) VALUES(\'"""+course["Course Code"]+"""\',\'"""+course["Course Name"]+"""\') ON CONFLICT DO NOTHING"""
		cursor.execute(query)
		
		
		# Insert basic fields
		for i in range(len(keys)):
			query = """UPDATE courses SET """+fields[i]+"""=%s where course_code =%s"""
			value = course[keys[i]]
			cursor.execute(query, (value, course["Course Code"]))
		query = """UPDATE courses SET handbook_title=%s where course_code =%s"""
		value = course["Handbook Information"]["Title"]
		cursor.execute(query, (value, course["Course Code"]))
		query = """UPDATE courses SET handbook_url=%s where course_code =%s"""
		value = course["Handbook Information"]["URL"]
		cursor.execute(query, (value, course["Course Code"]))
		
		# Learning outcomes
		for i in range(len(course["Learning Outcomes"])):
			query = """INSERT INTO learning_outcomes (course_code, index) VALUES(%s, %s) ON CONFLICT DO NOTHING"""
			cursor.execute(query, (course["Course Code"], i))
			for j in range(len(lo_keys)):
				query = """UPDATE learning_outcomes SET """+lo_fields[j]+"""=%s where course_code =%s AND index=%s"""
				value = course["Learning Outcomes"][i][lo_keys[j]]
				cursor.execute(query, (value, course["Course Code"], i))
		
		# Assessments
		for i in range(len(course["Assessments"])):
			query = """INSERT INTO assessments (course_code, index) VALUES(%s, %s) ON CONFLICT DO NOTHING"""
			cursor.execute(query, (course["Course Code"], i))
			for j in range(len(a_keys)):
				query = """UPDATE assessments SET """+a_fields[j]+"""=%s where course_code =%s AND index=%s"""
				value = course["Assessments"][i][a_keys[j]]
				cursor.execute(query, (value, course["Course Code"], i))
	
	
	conn.commit()

	cursor.close()
	conn.close()














