# Webscrapes Eclips after being provided with a valid login
# TODO: Replace sleep commands with actual checks that determine whether the webpage is loaded
# TODO: Save login on this computer and skip login process if page loads without login
# TODO: Manually extract the name of each category
#           At the moment, inexplicably, selenium can't find elements with the "Entry css-124r90d" class,
#           which stores every entry. It can, however, find every element with the class 'Changes',
#           which contain the values that need be extracted. Until a fix for this is found, a static list is being used.
import selenium
from selenium import webdriver
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
from selenium.webdriver import ActionChains
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

import time
import json

def course_is_administrative(course):
	if course["Course Code"][4] == '8':
		return True
	elif course["Course Code"][0] == 'Z':
		return True
	else:
		return False

def execute_eclips(login_email, login_password):
	#PATH = "/usr/src/app/src/eclips_scraper/chromedriver"
	#driver = webdriver.Chrome(PATH)
	driver = webdriver.Remote("http://chrome:4444/wd/hub", DesiredCapabilities.CHROME)

	driver.get("https://eclips.unsw.edu.au/courseloop/dashboard#/")

	# Logging In
	print("Please enter email:")
	email = login_email
	print("Please enter password:")
	password = login_password

	email_textbox = driver.find_element_by_xpath("//input[@type='email']")
	email_textbox.send_keys(email)
	email_textbox.send_keys(Keys.RETURN)
	"""
	try:
		element = WebDriverWait(driver, 10).until(
		    EC.presence_of_element_located((By.XPATH, "//input[@type='password']"))
		)
	finally:
		driver.quit()
	"""

	time.sleep(4)

	password_textbox = driver.find_element_by_xpath("//input[@type='password']")
	password_textbox.send_keys(password)
	password_textbox.send_keys(Keys.RETURN)

	time.sleep(4)

	no_button = driver.find_element_by_id("idBtn_Back")
	ActionChains(driver).click(no_button).perform()

	time.sleep(8)

	# Search for relevant courses
	search_bar = driver.find_element_by_class_name("css-1eutbdf-Input")
	search_bar_wipe = driver.find_element_by_xpath("//button[@data-id='cancelSearchButton']")
	ActionChains(driver).click(search_bar_wipe).perform()
	time.sleep(2)
	search_bar.send_keys("COMP")
	search_bar.send_keys(Keys.RETURN)

	show_filter_button = driver.find_element_by_class_name("css-lkkwxl-Button")
	ActionChains(driver).click(show_filter_button).perform()

	filter_buttons = driver.find_elements_by_class_name("css-b1xi1w-Select")
	filters = ["Course", "Active", "Faculty of Engineering", "School of Computer Science and Engineering", "", "Approved"]
	filter_numbers = ["7", "1", "3", "4", "-1", "1"]
	current_filter = 0
	for filter_button in filter_buttons:
		if current_filter == 4:
		    current_filter += 1
		    continue
		ActionChains(driver).click(filter_button).perform()
		filter_name = filter_button.find_element_by_class_name("rrs").get_attribute("data-name")
		select_none = filter_button.find_element_by_xpath("//button[@aria-label='Deselect all "+filter_name+" filters']")
		ActionChains(driver).click(select_none).perform()
		
		ActionChains(driver).click(filter_button).perform()
		filter_checkbox = filter_button.find_elements_by_xpath("//li[@data-key='"+filter_numbers[current_filter]+"']")
		for f in filter_checkbox:
		    if f.get_attribute("aria-label").strip() == filters[current_filter]:
		        ActionChains(driver).click(f).perform()
		        break
		
		current_filter += 1
		if current_filter >= len(filters):
		    break
	ActionChains(driver).click(driver.find_element_by_class_name("css-18x6z2q-heading2")).perform()

	#TODO Scraping the max number results in the final page being read multiple times
	# Loop through relevant courses
	#num_course_pages = int(driver.find_element_by_class_name("css-p2rip9-Text").text[10:])-1
	num_course_pages = 5
	#print("Number of course pages: "+str(num_course_pages))
	course_hyperlinks = []
	for i in range(num_course_pages):
		time.sleep(12)
		course_links = driver.find_elements_by_class_name("css-3u0sm5-Box")
		
		for course_link in course_links:
		    course_code = course_link.find_element_by_class_name("css-ikrow1-Text").text
		    course_hyperlink = ""
		    #dropdown_arrow = course_link.find_element_by_class_name("expandVersionsButton css-wv9bnw-Button-IconButton-ExpandVersionsButton")
		    ActionChains(driver).click(course_link).perform()
		    term_offerings = course_link.find_elements_by_class_name("css-1bm06br-Link")
		    for t in term_offerings:
		        term = t.find_element_by_class_name("css-x2h87q-Text").text
		        if term[0:4] == "2021":
		            course_hyperlink = t.get_attribute("href")
		            break
		    if course_hyperlink == "":
		        continue
			
		    course_hyperlinks.append(course_hyperlink)
		
		ActionChains(driver).click(driver.find_element_by_xpath("//button[@data-id='nextPageButton']")).perform()

	print("Found "+str(len(course_links))+" courses")
		
	# Extract relevant data
	# Static list for use until dynamic approach found (see header)
	titles = ["Course Code",
		      "Course Name",
		      "Course Name - SiMs",
		      "Owning Faculty",
		      "Owning Academic Unit",
		      "Collaborating Academic Unit",
		      "Administrative Campus",
		      "Units of Credit",
		      "Grading Basis",
		      "Academic Calendar Type",
		      "Career",
		      "Course Description for Handbook",
		      "Field of Education (Broad)",
		      "Field of Education (Narrow)",
		      "Field of Education (Detailed)",
		      "Level",
		      "Teaching Strategies and Rationale",
		      "Course Aims",
		      "Delivery Attributes",
		      "Course Type",
		      "Course Attributes",
		      "Repeat for Credit"]
	num_attributes = len(titles)
	course_info = []
	current_course = 0
	for h in course_hyperlinks:
		print("-----PRINTING DETAILS OF NEXT COURSE-----")
		driver.get(h)
		time.sleep(10)
		course_info.append({})
		entries = driver.find_elements_by_class_name("css-ydlaaa-EntryContent")
		
		entry_num = 0
		while entry_num < num_attributes and entry_num < len(entries):
		    print(titles[entry_num]+" = "+entries[entry_num].text)
		    course_info[current_course][titles[entry_num]] = entries[entry_num].text
		    entry_num += 1
		
		tables = driver.find_elements_by_class_name("DetailRelatedRecord")
		print("Found "+str(len(tables))+" tables")
		for t in tables:
		    print("Table: "+t.text)
		table_num = 0
		while table_num < len(tables):
		    table_text = "\n".join(tables[table_num].text.splitlines()[1:])
		    if table_text == []:
		        table_num = table_num+1
		        continue
		    
		    if table_num == 0:
		        if len(table_text.split()) == 0:
		            course_info[current_course]["Delivery Name"] = ""
		            course_info[current_course]["Delivery Mode"] = ""
		            course_info[current_course]["Delivery Format"] = ""
		        else:
		            delivery_name = table_text.split()[0]
		            delivery_mode = ""
		            delivery_format = ""
		            mode_and_format = table_text.split()[1:]
		            for i in range(1, len(mode_and_format)):
		                if mode_and_format[i][0].isupper():
		                    delivery_mode = " ".join(mode_and_format[0:i])
		                    delivery_format = " ".join(mode_and_format[i:])
		                    break
		            course_info[current_course]["Delivery Name"] = delivery_name
		            course_info[current_course]["Delivery Mode"] = delivery_mode
		            course_info[current_course]["Delivery Format"] = delivery_format
		    elif table_num == 1:
		        lines = table_text.splitlines()
		        course_info[current_course]["Learning Outcomes"] = []
		        for l in lines:
		            new_learning_outcome = {}
		            new_learning_outcome["Code"] = l[:4]
		            new_learning_outcome["Description"] = l[5:]
		            course_info[current_course]["Learning Outcomes"].append(new_learning_outcome)
		    elif table_num == 2:
		        lines = table_text.splitlines()
		        course_info[current_course]["Assessments"] = []
		        for l in lines:
		            new_assessment = {}
		            if len(l.split()) == 0:
		                continue
		            new_assessment["Assessment Type"] = l.split()[0]
		            new_assessment["Assessment Name"] = " ".join(l.split()[1:-1])
		            new_assessment["Weighting (%)"] = l.split()[-1]
		            course_info[current_course]["Assessments"].append(new_assessment)
		    elif table_num == 4:
		        lines = table_text.splitlines()
		        course_info[current_course]["Relationships"] = []
		        for l in lines:
		            new_relationship = {}
		            for i in range(0, len(l.split())):
		                if l.split()[i][1].isupper():
		                    new_relationship["Relationship Type"] = " ".join(l.split()[0:i])
		                    new_relationship["Related Course"] = " ".join(l.split()[i:])
		                    break
		            course_info[current_course]["Relationships"].append(new_relationship)
		    elif table_num == 7:
		        course_info[current_course]["Handbook Information"] = {}
		        course_info[current_course]["Handbook Information"]["Title"] = " ".join(table_text.split()[:3])
		        course_info[current_course]["Handbook Information"]["URL"] = " ".join(table_text.split()[3:])
		    
		    table_num = table_num+1
		
		current_course += 1

	courses_to_remove = []
	for i in range(0, len(course_info)):
		if course_is_administrative(course_info[i]):
			print("Removing "+str(course_info[i]["Course Code"]))
			courses_to_remove.append(course_info[i])
			
	for c in courses_to_remove:
		course_info.remove(c)
		    
	with open("eclips_data.json", "w") as outfile: 
		json.dump(course_info, outfile)
	print("Done, will close in 30 seconds")
	time.sleep(30)
	driver.quit()























































































