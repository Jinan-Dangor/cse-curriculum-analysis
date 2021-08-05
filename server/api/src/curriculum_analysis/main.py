# Main file - todo rename to analyse.py?
from .parsr import Parsr
import json
import string
import re
import urllib.parse
import requests
from nltk.corpus import words as nltk_words  # nltk.download('words')
import nltk
from .stopwords import STOPWORDS
import argparse
from .my_wikipedia import get_categories, wp_search
from .validate import validate_course, validate_file, validate_lec_number
from .database import get_parsed_json, dump_parsr_result, has_parsed_result, insert_keywords_occurrences, put_in_db, close_connection
import sys
from collections import Counter

nltk.download('words')
english_words = set(nltk_words.words())

def preprocess(old: str) -> str:
    # strip non-alphabetical characters
    pattern = re.compile("[^a-z]+", re.UNICODE | re.IGNORECASE)
    new = pattern.sub("", old).lower()
    return new if new not in STOPWORDS else ""


def get_words(elements) -> list:
    words = []
    for element in elements:
        if element is None:
            continue
        if "content" not in element:
            continue
        if isinstance(element["content"], list):
            words.extend(get_words(element["content"]))
        else:
            new_content = preprocess(element["content"])
            if not new_content or new_content not in english_words or len(new_content) == 1:
                # Filter out one letter words, often used in maths/programming contexts
                continue
            words.append(
                {
                    "content": new_content,
                    "font": element["font"],
                }
            )
    return words

def submit_lecture_slides(lecture_file, course, lecture):
    #if ((parsed_json := get_parsed_json(course, lecture)) is None):
    if lecture_file is None:
        # We need to parse a file, but one hasn't been passed in
        print("-f not supplied but a file can't be found in the database for given lecture/course.")
        sys.exit(0)
    
    print("Parsing PDF")
    parsr = Parsr()
    with parsr:
        qID = parsr.start_parsing_pdf(lecture_file)
        return qID

# TODO: Put in a file
class Course:
    def __init__(self, course):
        self.course = course

class Lecture:
    def __init__(self, num):
        self.num = num

def parse_lecture_slide(lecture_slides, course, lecture):
    return submit_lecture_slides(lecture_slides, Course(course), Lecture(lecture))
	#main(lecture_slides, Course(course), Lecture(lecture))

def insert_lecture_slide(course, lecture, qID):
    main(Course(course), Lecture(lecture), qID)

def poll_whether_slides_parsed(qid):
    return requests.get(f"http://parsr:3001/api/v1/queue/"+qid).status_code

def main(course, lecture, qID, num_keywords=5, num_wp_pages=20):
    parsr = Parsr()
    with parsr:
        parsed_json = parsr.get_parsed_json(qID) 
        # could maybe do something smarter here... threading, etc
        # todo: scale with # of pages?

    # Dump in DB
    dump_parsr_result(course, lecture, json.dumps(parsed_json))

    # check if we've already parsed this lecture
    # if we have, but we override, do CA again
    #if not args.override and has_parsed_result(course, lecture):
    #    print("Content has already been parsed.")
    #    sys.exit(0)
    
    print("Performing Curriculum Analysis")
    all_words = []
    for page in parsed_json["pages"]:
        page_elements = page["elements"]
        all_words.extend(get_words(page_elements))

    c = Counter()
    # We want to give weight to those with lower font
    lowest_font = min(all_words, key=lambda x: x["font"])["font"]
    highest_font = max(all_words, key=lambda x: x["font"])["font"]
    for word_obj in all_words:
        word = word_obj["content"]
        font = word_obj["font"]
        # font is kinda backwards with parsr
        c[word] += (highest_font - lowest_font) - font

    insert_keywords_occurrences(course, lecture, c.items())

    keywords = [i[0] for i in c.most_common(num_keywords)]
    wp_pages_search_result = wp_search(*keywords, results=num_wp_pages)
    wp_categories = []
    for page in wp_pages_search_result:
        wp_categories.extend(get_categories(page))

    put_in_db(course, lecture, keywords, wp_pages_search_result, wp_categories)
    print(f"{course.course} {lecture.num} parsed and added to db")
    
    close_connection()

