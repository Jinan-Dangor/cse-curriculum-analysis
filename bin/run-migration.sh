# Replace file names to migrate database
docker cp server/database/V20210708__1_eclips_overhaul.sql cse-curriculum-analysis_db_1:/docker-entrypoint-initdb.d/V20210708__1_eclips_overhaul.sql
docker exec -u postgres cse-curriculum-analysis_db_1 psql cse-curriculum-analysis postgres -f /docker-entrypoint-initdb.d/V20210708__1_eclips_overhaul.sql
