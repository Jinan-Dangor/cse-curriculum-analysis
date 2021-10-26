from flask import Flask, g, request, Response
from flask.logging import create_logger
from flask_restful import Api
from flask_cors import CORS, cross_origin
import psycopg2
import time
import sys
import signal
import logging
from src.routes.index import Index
from src.routes.graph import generate_graph
from src.routes.prereqs import api_get_all_prereqs
from src.routes.course import get_course_info, get_many_course_info
from src.routes.search import search_courses
from src.routes.relationship import get_course_relationship
from src.routes.vote import like, dislike, unlike, undislike
from src.eclips_scraper.eclips_scraper import execute_eclips
from src.eclips_scraper.update_eclips_database import update_eclips_data
from src.test_database_insert.put_in_db import put_in_database
from src.curriculum_analysis.main import parse_lecture_slide, poll_whether_slides_parsed, insert_lecture_slide
from src.curriculum_analysis.database import insert_assumed_knowledge_keywords, get_assumed_knowledge_keywords, get_all_lectures_keywords, clear_assumed_knowledge, get_course_lecture_keywords
import os
from werkzeug.utils import secure_filename

from flask_mail import Mail, Message

app = Flask(__name__)

app.config.update(dict(
    DEBUG = False,
    MAIL_SERVER = 'smtp.gmail.com',
    MAIL_PORT = 587,
    MAIL_USE_TLS = True,
    MAIL_USE_SSL = False,
    MAIL_USERNAME = 'andrew@trouty.com',
    MAIL_PASSWORD = "myactualemailpassword",
))
mail = Mail(app)

logger = create_logger(app)
logger.setLevel(logging.INFO)  # Set debugging
# Access-Control-Allow-Origin header
CORS(app)
# api = Api(app)

# could go in separate file
def connect_to_db():
    connection = psycopg2.connect("")  # "" to use env vars
    return connection


def get_db():
    if not hasattr(g, "postgres_db"):
        g.postgres_db = connect_to_db()
    return g.postgres_db


@app.teardown_appcontext
def close_db(error):
    if hasattr(g, "postgres_db"):
        g.postgres_db.close()


@app.route("/")
def index():
    return "hi"


@app.route("/graph", methods=["GET"])
def graph():
    return generate_graph(get_db())
    
@app.route("/admin/insert_eclips_data", methods=["POST"])
def insert_eclips_data():
    update_eclips_data()
    return "Test successful\n"

@app.route("/admin/insert_assumed_knowledge", methods=["POST"])
def insert_assumed_knowledge():
	course_id = request.form.get('course_id')
	assumed_knowledge = request.form.get('assumed_knowledge')
	if (assumed_knowledge == ""):
		return "Nothing inserted"
	
	return insert_assumed_knowledge_keywords(course_id, assumed_knowledge)
    
@app.route("/admin/parse_lecture_slides", methods=["POST"])
def parse_lecture_slides():
	# Save file locally
	lecture_file = request.files['slides']
	filename = secure_filename(lecture_file.filename)
	upload_folder = "uploads"
	upload_dir = os.path.join("/usr/src/app/src/curriculum_analysis", upload_folder)
	os.makedirs(upload_dir, exist_ok=True)
	file_dest = os.path.join(upload_dir, filename)
	lecture_file.save(file_dest)
	
	# Parse file
	course_name = request.form.get('course')
	lecture_no = request.form.get('lecture')
	qID = parse_lecture_slide(file_dest, course_name, lecture_no)
	
	# Delete file TODO
	
	return qID

@app.route("/admin/poll_parsed_lecture_slides/<string:qid>", methods=["GET"])
def poll_parsed_lecture_slides(qid):
	return str(poll_whether_slides_parsed(qid))

@app.route("/admin/insert_parsed_lecture_slides", methods=["POST"])
def insert_parsed_lecture_slides():
	insert_lecture_slide(request.form.get('course'), request.form.get('lecture'), request.form.get('qid'))
	return "Insert successful\n"

@app.route("/admin/send_email", methods=["POST"])
def send_email():
	addr = request.form.get('address')
	subj = request.form.get('subject')
	body = request.form.get('body')
	msg = Message(body=body, subject=subj, sender="very_real@unsw.com", recipients=[addr])
	mail.send(msg)
	return "Email sent\n"

@app.route("/admin/execute_eclips_scraper", methods=["POST"])
def execute_eclips_scraper():
    return execute_eclips("", "")
    
# Test function
@app.route("/admin/put_in_db", methods=["POST"])
def put_in_db():
    #put_in_database()
    return "Test successful\n"
    
@app.route("/admin/get_assumed_knowledge", methods=["POST"])
def get_assumed_knowledge():
	return get_assumed_knowledge_keywords(request.form.get('course_id'))
	
@app.route("/admin/all_lecture_keywords", methods=["GET"])
def all_lecture_keywords():
	return get_all_lectures_keywords()

@app.route("/admin/clear_assumed_knowledge_keywords", methods=["POST"])
def clear_assumed_knowledge_keywords():
	clear_assumed_knowledge(request.form.get('course_id'))
	return "Assumed Knowledge Cleared\n"

@app.route("/prereqs", methods=["GET"])
def prereqs():
    return api_get_all_prereqs(get_db())


@app.route("/course", methods=["POST"])
def api_courses():
    body = request.get_json()
    keys = ("courses",)
    if any(i not in body for i in keys):
        return Response("Body required JSON with 'courses' keys.", status=400)
    return get_many_course_info(get_db(), body)


@app.route("/course/<string:course>", methods=["GET"])
def api_course(course):
    return get_course_info(get_db(), course)


@app.route("/course/lecture_keywords/<string:course>", methods=["GET"])
def api_course_lecture_keywords(course):
    return get_course_lecture_keywords(course)


@app.route("/search", methods=["GET"])
def search_keyword():
    phrase = request.args.get("phrase").split(",")
    return search_courses(get_db(), phrase)


@app.route("/relationship/<string:course_a>/<string:course_b>", methods=["GET"])
def relationship(course_a, course_b):
    return get_course_relationship(get_db(), course_a, course_b)


@app.route("/vote", methods=["PUT"])
def vote_on_relationship():
    body = request.get_json()
    keys = ("course_a", "course_b", "action")
    if any(i not in body for i in keys):
        return Response(
            "Body requires JSON with 'course_a'/'course_b'/'action' keys.", status=400
        )
    if any(not isinstance(i, str) for i in keys):
        return Response("keys must all be str value", 400)

    a = body["course_a"]
    b = body["course_b"]
    if body["action"] == "like":
        like(get_db(), a, b)
    elif body["action"] == "dislike":
        dislike(get_db(), a, b)
    elif body["action"] == "unlike":
        unlike(get_db(), a, b)
    elif body["action"] == "undislike":
        undislike(get_db(), a, b)
    else:
        return Response(
            "'action' must be either 'like'/'dislike'/'unlike'/'undislike'", 400
        )
    return Response("success", 202)


@app.route("/log", methods=["POST"])
def log():
    body = request.get_json()
    if "msg" not in body:
        return Response(status=400)

    logger.info(body["msg"])
    return Response("success", 200)
