import psycopg2

# docker run --name some-postgres -e POSTGRES_PASSWORD=mysecretpassword -p 5432:5432 -d postgres
def get_all_courses_lectures_categories(conn):
    res = []
    query = """SELECT course_code, lecture_num, categories FROM lectures WHERE course_code != '';"""
    cursor = conn.cursor()
    cursor.execute(query)
    for record in cursor:
        res.append(record) # (course_code, lecture_num, categories)
    cursor.close()
    return res

def search_keyword(conn, keyword, limit=5):
    res = []
    query = """select course_code, sum(occurrences) from words where word=%s group by course_code order by sum desc limit %s;"""
    cursor = conn.cursor()
    cursor.execute(query, (keyword, limit))
    for record in cursor:
        res.append(record)
    cursor.close()
    return res

def get_prereqs(conn, courses):
    res = {}
    query = """select course_code, handbook_prereqs, prereqs from courses where course_code = ANY(%s);"""
    cursor = conn.cursor()
    cursor.execute(query, (courses,))
    for record in cursor: #ideally, put into some model
        res[record[0]] = {
            'handbook_prereqs': record[1],
            'prereqs': record[2]
        }
    cursor.close()
    return res

def get_all_prereqs(conn):
    res = {}
    query = """select course_code, handbook_prereqs, prereqs from courses"""
    cursor = conn.cursor()
    cursor.execute(query)
    for record in cursor: #ideally, put into some model
        res[record[0]] = {
            'handbook_prereqs': record[1],
            'prereqs': record[2]
        }
    cursor.close()
    return res

def get_courses_information(conn, courses):
    res = {'postgraduate':[], 'undergraduate':[], 'both':[]}
    query = """select course_code, course_name, host_url, handbook_summary, grad_level, handbook_prereqs, course_id FROM courses WHERE course_code = ANY(%s) AND term = '21T2';"""
    cursor = conn.cursor()
    cursor.execute(query, (courses,))
    for record in cursor: #ideally, put into some model
        if record[4] is None: continue
        res[record[4]].append(record[0])
    cursor.close()
    return res


def get_course_information(conn, course_code):
    query = """select course_name, host_url, handbook_summary, grad_level, handbook_prereqs, course_id from courses where course_code = %s AND term = '21T2';"""
    cursor = conn.cursor()
    cursor.execute(query, (course_code,))
    row = cursor.fetchone()
    cursor.close()
    return row

def upvote(conn, course_a, course_b):
    a, b = sorted([course_a, course_b])
    print(a, b)
    query = """insert into votes values (%s, %s, 1, 0) on conflict (course_a, course_b) do update set likes = votes.likes + 1;"""
    # query = """update votes set likes = likes + 1 where (course_a = %s and course_b = %s) or (course_b = %s and course_a = %s);"""
    cursor = conn.cursor()
    cursor.execute(query, (a, b))
    conn.commit()
    cursor.close()

def remove_upvote(conn, course_a, course_b):
    a, b = sorted([course_a, course_b])
    query = """update votes set likes = likes - 1 where (course_a = %s and course_b = %s);"""
    cursor = conn.cursor()
    cursor.execute(query, (a, b))
    conn.commit()
    cursor.close()

def downvote(conn, course_a, course_b):
    a, b = sorted([course_a, course_b])
    query = """insert into votes values (%s, %s, 0, 1) on conflict (course_a, course_b) do update set dislikes = votes.dislikes + 1;"""
    cursor = conn.cursor()
    cursor.execute(query, (a, b))
    conn.commit()
    cursor.close()

def remove_downvote(conn, course_a, course_b):
    a, b = sorted([course_a, course_b])
    query = """update votes set dislikes = dislikes - 1 where (course_a = %s and course_b = %s);"""
    cursor = conn.cursor()
    cursor.execute(query, (a, b))
    conn.commit()
    cursor.close()


def get_votes(conn, course_a, course_b):
    query = """select likes, dislikes from votes where (course_a = %s and course_b = %s) or (course_b = %s and course_a = %s);"""
    cursor = conn.cursor()
    cursor.execute(query, (course_a, course_b, course_a, course_b))
    row = cursor.fetchone()
    cursor.close()
    return row
