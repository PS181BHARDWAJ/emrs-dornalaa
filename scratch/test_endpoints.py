import urllib.request
import urllib.parse
import json
import sys

BASE_URL = "http://127.0.0.1:5000/api"

def make_request(url, method="GET", data=None, json_data=None, headers=None):
    if headers is None:
        headers = {}
    
    req_data = None
    if json_data is not None:
        req_data = json.dumps(json_data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    elif data is not None:
        req_data = urllib.parse.urlencode(data).encode("utf-8")
        headers["Content-Type"] = "application/x-www-form-urlencoded"

    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            status = response.status
            response_body = response.read().decode("utf-8")
            return status, json.loads(response_body) if response_body else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        print(f"HTTPError: {e.code} for {method} {url}")
        print(f"Response: {err_body}")
        sys.exit(1)
    except Exception as e:
        print(f"Request failed: {e}")
        sys.exit(1)

def run_tests():
    print("1. Fetching public vacancies...")
    status, vacancies = make_request(f"{BASE_URL}/admissions/vacancies")
    print(f"Success! Status={status}, Found {len(vacancies)} records.")
    for v in vacancies:
        print(f"  {v['className']}: Capacity={v['totalStrength']}, Current={v['currentStrength']}, Vacancy={v['vacancy']}")
    
    print("\n2. Logging in as admin...")
    status, token_data = make_request(
        f"{BASE_URL}/auth/login", 
        method="POST", 
        data={"username": "admin", "password": "Admin@123"}
    )
    print(f"Success! Status={status}")
    
    token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Logged in successfully!")

    print("\n3. Fetching admin vacancies...")
    try:
        status, admin_vacancies = make_request(f"{BASE_URL}/admin/admissions/vacancies", headers=headers)
        print(f"Success! Received {len(admin_vacancies)} records.")
    except Exception as e:
        print(f"Failed to fetch admin vacancies: {e}")
        admin_vacancies = []
    
    print("\n3.1. Fetching admin schedules...")
    try:
        status_sched, admin_schedules = make_request(f"{BASE_URL}/admin/admissions/schedules", headers=headers)
        print(f"Schedules Status: {status_sched}, Received {len(admin_schedules)} records.")
    except Exception as e:
        print(f"Failed to fetch admin schedules: {e}")
        admin_schedules = []

    # Find Class VI
    class_vi = next((v for v in admin_vacancies if v["className"] == "Class VI"), None)
    if not class_vi:
        print("Class VI configuration not found! Seeding failed?")
        sys.exit(1)
    
    class_vi_id = class_vi["id"]
    print(f"Found Class VI with ID: {class_vi_id}. Capacity: {class_vi['totalStrength']}, Current: {class_vi['currentStrength']}")

    print("\n4. Updating Class VI vacancy config...")
    update_payload = {
        "className": "Class VI",
        "totalStrength": 80,
        "currentStrength": 60
    }
    status, updated_data = make_request(
        f"{BASE_URL}/admin/admissions/vacancies/{class_vi_id}", 
        method="PUT", 
        json_data=update_payload, 
        headers=headers
    )
    print(f"Success! Status={status}")
    print(f"Updated record details: {updated_data}")

    print("\n5. Fetching public vacancies to verify update...")
    status, updated_list = make_request(f"{BASE_URL}/admissions/vacancies")
    updated_vi = next((v for v in updated_list if v["className"] == "Class VI"), None)
    if not updated_vi:
        print("Updated Class VI not found in public list")
        sys.exit(1)
    
    print("Verification results for Class VI:")
    print(f"  Capacity: {updated_vi['totalStrength']} (expected 80)")
    print(f"  Current: {updated_vi['currentStrength']} (expected 60)")
    print(f"  Vacancy: {updated_vi['vacancy']} (expected 20)")
    
    if updated_vi['totalStrength'] == 80 and updated_vi['currentStrength'] == 60 and updated_vi['vacancy'] == 20:
        print("\nALL TESTS PASSED SUCCESSFULLY! The Backend API is working flawlessly and CRUD updates sync with MongoDB database.")
    else:
        print("\nTESTS FAILED: values are not as expected.")
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
