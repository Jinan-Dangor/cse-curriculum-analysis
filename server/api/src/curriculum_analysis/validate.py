import re
import os
import argparse

def validate_course(course_name: str) -> str:
    pattern = re.compile(r'^[A-Z]{4}[0-9]{4}$')
    if pattern.match(course_name) is None:
        raise argparse.ArgumentTypeError(f"'{course_name}' is an invalid course.")
    return course_name

def validate_file(file_name: str) -> str:
    _, file_extension = os.path.splitext(file_name)
    if file_extension.lower() != '.pdf':
        raise argparse.ArgumentTypeError(f"Only PDFs are currently supported.")
    return file_name

def validate_lec_number(num: str) -> int:
    try:
        n = int(num)
        if n < 0:
            raise argparse.ArgumentTypeError("Lecture number must be non-negative.")
        return n
    except ValueError:
        raise argparse.ArgumentTypeError("Lecture number must be a non-negative integer.")

## no... use type=Course
# where
# class Course:
#    self.faculty = ...
#    self.num: str = ...
#    def __str__(self):
#        return

#??