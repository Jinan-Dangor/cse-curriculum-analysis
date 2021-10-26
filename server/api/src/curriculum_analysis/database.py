# File for talking to database
#
import psycopg2
import psycopg2.extras

# docker run --name some-postgres -e POSTGRES_PASSWORD=mysecretpassword -p 5432:5432 -d postgres
conn = psycopg2.connect(
	"dbname=cse-curriculum-analysis user=postgres host=db port=5432 password=abc"
)

def array_to_sql_string(array):
    string = "'{"
    for a in array:
        string += a + ", "
    string += "}'"
    return string

def clear_assumed_knowledge(course_id):
    query = """DELETE FROM assumed_knowledge
    WHERE course_id=%s;"""
    cursor = conn.cursor()
    cursor.execute(query, [course_id])
    conn.commit()
    cursor.close()

def insert_assumed_knowledge_keywords(course_id, new_keywords):
    # Get pre-existing assumed knowledge
    query = """SELECT keywords FROM assumed_knowledge
    WHERE course_id=%s;"""
    cursor = conn.cursor()
    cursor.execute(query, [course_id])
    old_keywords = cursor.fetchone()
    cursor.close()
    
    if (old_keywords == None):
        query = """INSERT INTO assumed_knowledge (course_id, keywords) VALUES (%s, """+"""'{"""+new_keywords+"""}'"""+""");"""
        cursor = conn.cursor()
        cursor.execute(query, [course_id])
        #cursor.execute(query, [course_id, "{potato, pie}"])
        #cursor.execute(query, [course_id])
        cursor.close()
        
        conn.commit()
        return "New insert"
    
    combined_keywords = "'{" + new_keywords
    if (','.join(old_keywords[0]) != ""):
        combined_keywords += "," + ','.join(old_keywords[0])
    combined_keywords += "}'"
	
    # Insert merged list
    query = """UPDATE assumed_knowledge SET keywords=""" + combined_keywords + """WHERE course_id=""" + course_id + """;"""
    cursor = conn.cursor()
    cursor.execute(query)
    cursor.close()
    
    conn.commit()
    return "Merged insert"

def get_assumed_knowledge_keywords(course_id):
    query = """SELECT keywords FROM assumed_knowledge
    WHERE course_id=%s;"""
    cursor = conn.cursor()
    cursor.execute(query, [course_id])
    keywords = cursor.fetchone()
    cursor.close()
    
    if (keywords == None):
        return ""
    
    return ','.join(keywords[0])

def get_all_lectures_keywords():
    query = """SELECT keywords FROM lectures;"""
    cursor = conn.cursor()
    cursor.execute(query)
    keywords = cursor.fetchall()
    cursor.close()
    
    #return ','.join(keywords[0][0]) + "," + ','.join(keywords[1][0])
    
    combined_keywords = ""
    
    for new_keywords in keywords:
        #combined_keywords = combined_keywords + (list(set(new_keywords) - set(combined_keywords)))
        if not (new_keywords[0] == None):
            combined_keywords = combined_keywords + "," + ','.join(new_keywords[0])
    
    return combined_keywords

# Note: Does NOT delete duplicates
def get_course_lecture_keywords(course_id):
    query = """SELECT keywords FROM lectures WHERE course_id=""" + course_id + """;"""
    cursor = conn.cursor()
    cursor.execute(query)
    keywords = cursor.fetchall()
    cursor.close()
    
    combined_keywords = ""
    
    for new_keywords in keywords:
        if not (new_keywords[0] == None):
            combined_keywords = combined_keywords + "," + ','.join(new_keywords[0])
    
    return combined_keywords
	

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
    
