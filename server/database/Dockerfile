# docker build --tag=postgres-db .
# docker run -e POSTGRES_PASSWORD=abc postgres-db ### TODO: Should use -d to run in background?
# FROM postgres:latest
# COPY *.sql /docker-entrypoint-initdb.d/
# docker-compose up --build
# docker exec -t a7c04ed2d067 pg_dumpall -c -U postgres > dump.sql
## maybe don't need... but maybe would need if want to run locally someone else

# RUN THE FOLLOWING LINES TO ENTER THE POSTGRESQL DATABASE while application is running
# docker exec -it cse-curriculum-analysis_db_1 bash
# psql -d cse-curriculum-analysis -U postgres
FROM postgres:latest

COPY dump.pgdata ./


# then run
# docker exec cse-curriculum-analysis_db_1 sh -c "pg_restore -C -d postgres dump.pgdata"

# to build:
# docker build -t postgresdb:mypostgresdb .
# docker run -p 5432:5432  postgresdb:mypostgresdb
