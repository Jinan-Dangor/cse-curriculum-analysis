# Replace file names to migrate database
docker cp server/database/V20210803__1_lecture_and_term_overhaul.sql cse-curriculum-analysis_db_1:/docker-entrypoint-initdb.d/V20210803__1_lecture_and_term_overhaul.sql
docker exec -u postgres cse-curriculum-analysis_db_1 psql cse-curriculum-analysis postgres -f /docker-entrypoint-initdb.d/V20210803__1_lecture_and_term_overhaul.sql
