# File for talking with Parsr API

# docker run -p 3001:3001 axarev/
import requests
import json
from typing import List, NewType, Dict, IO
from http import HTTPStatus
from contextlib import ExitStack
import time


QueueID = NewType("QueueID", str)


class Parsr:
    def __init__(self, server="http://parsr:3001", config_file=None):
        self.server = server
        self.config_file = config_file
        self.config_file_fp: IO = None

    def __enter__(self):
        if self.config_file is not None:
            self.config_file_fp = open(self.config_file)

    def __exit__(self, *args):
        if self.config_file_fp is not None:
            self.config_file_fp.close()
            self.config_file_fp = None

    def check_parser_finished(self, queueID: QueueID):
        """
        Checks if the file has been completely parsed
        """
        req = requests.get(f"{self.server}/api/v1/queue/{queueID}")
        if not req.ok:
            # TODO: Return an error for invalid queueID
            return False

        return req.status_code != HTTPStatus.OK

    def start_parsing_pdf(self, pdf_file_name: str) -> QueueID:
        """
        Takes in a PDF to parse and returns the QueueID to track Parsr parsing it.
        """
        try:
            with open(pdf_file_name, "rb") as pdf_file:
                files = {
                    "file": (pdf_file_name, pdf_file, "application/pdf"),
                    "config": (
                        self.config_file,
                        self.config_file_fp,
                        "application/json",
                    ),
                }
                connect_succ = False
                req = requests.post(f"{self.server}/api/v1/document", files=files)
                """
                while(not connect_succ):
                    try:
                        req = requests.post(f"{self.server}/api/v1/document", files=files)
                        connect_succ = True
                    except requests.exceptions.ConnectionError:
                        time.sleep(5)
                """
        except FileNotFoundError as e:
            raise e
        else:
            return req.text if req.ok else None

    def get_parsed_json(self, queueID: QueueID, retries=20) -> dict:
        """
        Given the QueueID for parsing a PDF, check if it's completed and return the parsed JSON
        """
        if retries <= 0:
            return {}

        if not self.check_parser_finished(queueID):
            time.sleep(5)
            self.get_parsed_json(queueID, retries - 1)

        result_req = requests.get(f"{self.server}/api/v1/json/{queueID}")
        return result_req.json()
