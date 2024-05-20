import copy
import json
import uuid
import random

c1_id = "4affd421e12842ca9580f015b98d245c"
c2_id = "714c5682f8144643a064e324b9c10c9b"

def get_random_student_ids(json_data):
    student_ids = []
    if "students" in json_data:
        student_ids = [student["id"] for student in json_data["students"]]
        random.shuffle(student_ids)
    return student_ids

def remove_random_elements(input_list):
    if not input_list:
        return [], []

    num_elements_to_remove = random.randint(1, len(input_list))
    removed_elements = []

    for _ in range(num_elements_to_remove):
        removed_element = input_list.pop(random.randrange(len(input_list)))
        removed_elements.append(removed_element)

    return removed_elements, input_list

def add_respondees_to_answers(data, students):
    for question in data["questions"]:
        question['id'] = uuid.uuid4().hex
        students_copy = students.copy()
        for answer in question["answers"]:
            respondees, students_copy = remove_random_elements(students_copy)
            answer['id'] = uuid.uuid4().hex
            answer["respondees"] = respondees
    return data

def main(input_file):
    # Read JSON data from input file
    with open(input_file, 'r') as f:
        json_data = json.load(f)
    
    #generate for c1
    for i in range(10):
        json_data_copy = copy.deepcopy(json_data)
        json_data_copy['class_id'] = c1_id
        json_data_copy['test_id'] = uuid.uuid4().hex
        json_data_copy['name'] = "C1 Test 2024-04-" + str(i+1).zfill(2)
        json_data_copy['date_taken'] = "2024-04-" + str(i+1).zfill(2)+"T13:00:00-05:00"
    
        # Modify JSON data
        modified_data = add_respondees_to_answers(json_data_copy, get_random_student_ids(json_data_copy))
        
        # Write modified JSON data back to file
        with open("c1_output"+str(i)+".json", 'w') as f:
            json.dump(modified_data, f, indent=2)

    #generate for c2
    for i in range(10):
        json_data_copy = copy.deepcopy(json_data)
        json_data_copy['class_id'] = c2_id
        json_data_copy['test_id'] = uuid.uuid4().hex
        json_data_copy['name'] = "C2 Test 2024-04-" + str(i+1).zfill(2)
        json_data_copy['date_taken'] = "2024-04-" + str(i+1).zfill(2) +"T13:00:00-05:00"
    
        # Modify JSON data
        modified_data = add_respondees_to_answers(json_data_copy, get_random_student_ids(json_data_copy))
        
        # Write modified JSON data back to file
        with open("c2_output"+str(i)+".json", 'w') as f:
            json.dump(modified_data, f, indent=2)

if __name__ == "__main__":
    input_file = "input.json"  # Change this to your input file name
    main(input_file)
