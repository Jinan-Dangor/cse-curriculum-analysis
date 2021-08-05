# File for talking to database
#
import psycopg2
import psycopg2.extras

# docker run --name some-postgres -e POSTGRES_PASSWORD=mysecretpassword -p 5432:5432 -d postgres
conn = psycopg2.connect(
	"dbname=cse-curriculum-analysis user=postgres host=db port=5432 password=abc"
)

def put_in_db(course, lecture, keywords, wp_pages, categories):
    query = """update lectures set keywords=%s, wp_pages=%s, categories=%s
    where course_code=%s and lecture_num=%s;"""
    cursor = conn.cursor()
    cursor.execute(query, (keywords, wp_pages, categories, course.course, lecture.num))
    cursor.close()


def insert_keywords_occurrences(course, lecture, keywords):
    # keywords: [('keyword', occurrence: int)]
    keywords = map(lambda x: (x[0], lecture.num, course.course, x[1]), keywords)
    query = """insert into words(word, lecture_num, course_id, occurrences) values %s on conflict do nothing;""" # todo: we should override if override=true
    cursor = conn.cursor()
    psycopg2.extras.execute_values(cursor, query, list(keywords))
    cursor.close()


def dump_parsr_result(course, lecture, json_obj):
    query = """insert into lectures(course_id, lecture_num, parsr_json) values (%s, %s, %s);"""
    cursor = conn.cursor()
    cursor.execute(query, (course.course, lecture.num, json_obj,))
    cursor.close()


def get_parsed_json(course, lecture):
    # Check the DB to see if we've already got JSON parsed
    query = """select parsr_json from lectures where lecture_num = %s and course_code = %s;"""
    cursor = conn.cursor()
    cursor.execute(query, (lecture.num, course.course))
    row = cursor.fetchone()
    cursor.close()
    return None if row is None else row[0] # todo: why compared to below func

def has_parsed_result(course, lecture) -> bool:
    # check if keywords/wp-pages/categories
    query = (
        """select keywords from lectures where lecture_num = %s and course_code = %s;"""
    )
    cursor = conn.cursor()
    cursor.execute(query, (lecture.num, course.course))
    row = cursor.fetchone()
    cursor.close()
    return row[0] is not None

def close_connection_totally():
	conn.close() # Probably need to wrap this in a class. Instantiate just before calling db... 

def close_connection():
    conn.commit()
    
