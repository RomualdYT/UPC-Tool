import requests
import unittest
import json
from datetime import datetime

class UPCLegalAPITester(unittest.TestCase):
    def __init__(self, *args, **kwargs):
        super(UPCLegalAPITester, self).__init__(*args, **kwargs)
        self.base_url = "http://localhost:8001"
        self.api_url = f"{self.base_url}/api"
        self.session = requests.Session()

    def test_01_health_check(self):
        """Test the health check endpoint"""
        print("\n🔍 Testing API health check...")
        response = self.session.get(f"{self.api_url}/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn("timestamp", data)
        print("✅ Health check endpoint is working")

    def test_02_get_cases(self):
        """Test retrieving cases"""
        print("\n🔍 Testing get cases endpoint...")
        response = self.session.get(f"{self.api_url}/cases")
        self.assertEqual(response.status_code, 200)
        cases = response.json()
        self.assertIsInstance(cases, list)
        self.assertGreater(len(cases), 0)
        print(f"✅ Retrieved {len(cases)} cases successfully")
        
        # Verify case structure
        case = cases[0]
        required_fields = ["id", "date", "type", "reference", "registry_number", 
                          "court_division", "type_of_action", "language_of_proceedings", 
                          "parties", "summary"]
        for field in required_fields:
            self.assertIn(field, case)
        print("✅ Case data structure is valid")
        
        return cases

    def test_03_get_case_by_id(self):
        """Test retrieving a specific case by ID"""
        print("\n🔍 Testing get case by ID endpoint...")
        # First get all cases to get an ID
        cases = self.test_02_get_cases()
        case_id = cases[0]["id"]
        
        response = self.session.get(f"{self.api_url}/cases/{case_id}")
        self.assertEqual(response.status_code, 200)
        case = response.json()
        self.assertEqual(case["id"], case_id)
        print(f"✅ Retrieved case with ID {case_id} successfully")

    def test_04_get_cases_count(self):
        """Test getting the count of cases"""
        print("\n🔍 Testing get cases count endpoint...")
        response = self.session.get(f"{self.api_url}/cases/count")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("count", data)
        self.assertIsInstance(data["count"], int)
        self.assertGreater(data["count"], 0)
        print(f"✅ Case count endpoint returned {data['count']} cases")

    def test_05_get_filters(self):
        """Test getting available filters"""
        print("\n🔍 Testing get filters endpoint...")
        response = self.session.get(f"{self.api_url}/filters")
        self.assertEqual(response.status_code, 200)
        filters = response.json()
        
        required_filters = ["court_divisions", "languages", "tags", "case_types", "action_types"]
        for filter_type in required_filters:
            self.assertIn(filter_type, filters)
            self.assertIsInstance(filters[filter_type], list)
        
        print("✅ Filters endpoint returned all required filter types")
        return filters

    def test_06_search_functionality(self):
        """Test search functionality"""
        print("\n🔍 Testing search functionality...")
        search_terms = ["patent", "injunction", "Renault"]
        
        for term in search_terms:
            print(f"  Searching for '{term}'...")
            response = self.session.get(f"{self.api_url}/cases", params={"search": term})
            self.assertEqual(response.status_code, 200)
            results = response.json()
            print(f"  Found {len(results)} results for '{term}'")
            
            # For Renault, we should find at least one result based on the sample data
            if term == "Renault":
                self.assertGreater(len(results), 0)
                found = False
                for case in results:
                    if any("Renault" in party for party in case["parties"]):
                        found = True
                        break
                self.assertTrue(found, f"Expected to find 'Renault' in search results")
                print(f"  ✅ Successfully found Renault case")
        
        print("✅ Search functionality is working")

    def test_07_filter_functionality(self):
        """Test filter functionality"""
        print("\n🔍 Testing filter functionality...")
        
        # Get available filters first
        available_filters = self.test_05_get_filters()
        
        # Test date range filter
        print("  Testing date range filter...")
        response = self.session.get(f"{self.api_url}/cases", 
                                   params={"date_from": "2025-01-01", "date_to": "2025-01-31"})
        self.assertEqual(response.status_code, 200)
        date_filtered_cases = response.json()
        for case in date_filtered_cases:
            case_date = datetime.strptime(case["date"], "%Y-%m-%d")
            self.assertTrue(datetime(2025, 1, 1) <= case_date <= datetime(2025, 1, 31))
        print(f"  ✅ Date range filter returned {len(date_filtered_cases)} cases")
        
        # Test case type filter if available
        if available_filters["case_types"]:
            case_type = available_filters["case_types"][0]
            print(f"  Testing case type filter with '{case_type}'...")
            response = self.session.get(f"{self.api_url}/cases", params={"case_type": case_type})
            self.assertEqual(response.status_code, 200)
            type_filtered_cases = response.json()
            for case in type_filtered_cases:
                self.assertEqual(case["type"], case_type)
            print(f"  ✅ Case type filter returned {len(type_filtered_cases)} cases")
        
        # Test court division filter if available
        if available_filters["court_divisions"]:
            court_division = available_filters["court_divisions"][0]
            print(f"  Testing court division filter with '{court_division}'...")
            response = self.session.get(f"{self.api_url}/cases", 
                                       params={"court_division": court_division})
            self.assertEqual(response.status_code, 200)
            division_filtered_cases = response.json()
            for case in division_filtered_cases:
                self.assertEqual(case["court_division"], court_division)
            print(f"  ✅ Court division filter returned {len(division_filtered_cases)} cases")
        
        # Test language filter if available
        if available_filters["languages"]:
            language = available_filters["languages"][0]
            print(f"  Testing language filter with '{language}'...")
            response = self.session.get(f"{self.api_url}/cases", 
                                       params={"language": language})
            self.assertEqual(response.status_code, 200)
            language_filtered_cases = response.json()
            for case in language_filtered_cases:
                self.assertEqual(case["language_of_proceedings"], language)
            print(f"  ✅ Language filter returned {len(language_filtered_cases)} cases")
        
        print("✅ Filter functionality is working")

    def test_08_combined_search_and_filter(self):
        """Test combining search and filters"""
        print("\n🔍 Testing combined search and filter...")
        
        # Combine search with date filter
        params = {
            "search": "patent",
            "date_from": "2025-01-01",
            "date_to": "2025-12-31"
        }
        
        response = self.session.get(f"{self.api_url}/cases", params=params)
        self.assertEqual(response.status_code, 200)
        results = response.json()
        
        print(f"  Combined search and filter returned {len(results)} results")
        print("✅ Combined search and filter functionality is working")

def run_tests():
    # Create a test suite
    suite = unittest.TestSuite()
    
    # Add test methods
    test_cases = [
        'test_01_health_check',
        'test_02_get_cases',
        'test_03_get_case_by_id',
        'test_04_get_cases_count',
        'test_05_get_filters',
        'test_06_search_functionality',
        'test_07_filter_functionality',
        'test_08_combined_search_and_filter'
    ]
    
    for test_case in test_cases:
        suite.addTest(UPCLegalAPITester(test_case))
    
    # Run the tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Print summary
    print("\n📊 Test Summary:")
    print(f"  Tests run: {result.testsRun}")
    print(f"  Errors: {len(result.errors)}")
    print(f"  Failures: {len(result.failures)}")
    
    return len(result.errors) == 0 and len(result.failures) == 0

if __name__ == "__main__":
    success = run_tests()
    exit(0 if success else 1)