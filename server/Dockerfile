FROM python:3.8.2

WORKDIR /usr/src/app

# Install dependencies
COPY Pipfile* ./
RUN pip install pipenv
RUN pipenv install --deploy --ignore-pipfile

# Install netcat to check if the database is running
RUN apt-get update && apt-get install -y netcat

COPY api/bin/entrypoint.sh ./
COPY api/*.py ./
COPY api/src ./src

# CMD [ "pipenv", "run", "gunicorn", "--bind", "0.0.0.0:8000", "manage:app" ]

ENTRYPOINT [ "/usr/src/app/entrypoint.sh" ]
