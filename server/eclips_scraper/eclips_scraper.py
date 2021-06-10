# Webscrapes Eclips after being provided with a valid login
# TODO: Replace sleep commands with actual checks that determine whether the webpage is loaded
# TODO: Save login on this computer and skip login process if page loads without login
from selenium import webdriver
from selenium.webdriver import ActionChains
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

import time

PATH = "./chromedriver"
driver = webdriver.Chrome(PATH)

driver.get("https://eclips.unsw.edu.au/courseloop/dashboard#/")

# Logging In
print("Please enter email:")
email = input()
print("Please enter password:")
password = input()

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

time.sleep(15)

# Loop through relevant courses
course_links = driver.find_elements_by_class_name("css-3u0sm5-Box")
print("Found "+str(len(course_links))+" courses")
course_hyperlinks = []

for course_link in course_links:
    course_code = course_link.find_element_by_class_name("css-ikrow1-Text").text
    course_hyperlink = ""
    #dropdown_arrow = course_link.find_element_by_class_name("expandVersionsButton css-wv9bnw-Button-IconButton-ExpandVersionsButton")
    ActionChains(driver).click(course_link).perform()
    term_offerings = course_link.find_elements_by_class_name("css-1bm06br-Link")
    for t in term_offerings:
        term = t.find_element_by_class_name("css-x2h87q-Text").text
        if term[0:4] == "2020":
            course_hyperlink = t.get_attribute("href")
            break
    if course_hyperlink == "":
        continue
    
    course_hyperlinks.append(course_hyperlink)
    
# Extract relevant data
for h in course_hyperlinks:
    print("PRINTING DETAILS OF NEXT COURSE")
    driver.get(h)
    time.sleep(10)
    changes = driver.find_elements_by_class_name("Changes")
    for c in changes:
        print(c.text)

print("Done, will close in 30 seconds")
time.sleep(30)
driver.quit()
























