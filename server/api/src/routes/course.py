from flask_restful import Resource
from flask import request, jsonify, Response

from src.routes.database.db_manager import get_course_information, get_courses_information

# class Course(Resource):
#     def __init__(self, connection):
#         self.connection = connection

def get_many_course_info(connection, courses):
    db_course_info = get_courses_information(connection, courses['courses'])
    return jsonify(db_course_info)

def get_course_info(connection, course):
    db_course_info = get_course_information(connection, course)
    keys = ['course_code', 'course_name', 'host_url', 'handbook_summary', 'grad_level', 'handbook_prereqs', 'course_id']
    if db_course_info is None:
        return jsonify(dict(zip(keys, (course,))))
    return jsonify(dict(zip(keys, (course,) + db_course_info)))
    # def post(self):
    #     pass
