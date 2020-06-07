from flask import Flask
from flask_restful import Api
from flask_cors import CORS

from src.routes.index import Index
from src.routes.graph import Graph

app = Flask(__name__)
# Access-Control-Allow-Origin header
CORS(app)
api = Api(app)

api.add_resource(Index, "/")
api.add_resource(Graph, "/graph")