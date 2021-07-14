# put courses_nodupes.json into database
import json
import psycopg2

def put_in_database():
	COURSE_FILE = "/usr/src/app/src/test_database_insert/prereqs3.json"
	with open(COURSE_FILE) as myf:
		j = json.load(myf)

	conn = psycopg2.connect("dbname=cse-curriculum-analysis user=postgres host=db port=5432 password=abc")
	cursor = conn.cursor()

	for course in j.keys():
		print(course)
		query = """UPDATE courses set handbook_prereqs=%s where course_code = %s"""
		# grad_lvl = j[course]['grad_level']
		handbook = j[course]['handbook_prereqs']
		# prereqs = json.dumps(j[course]['prereqs'])
		cursor.execute(query, (handbook, course))

	conn.commit()

	cursor.close()
	conn.close()
