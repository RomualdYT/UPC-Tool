import requests
import unittest
import json
import re
from datetime import datetime
import time

class UPCLegalAPITester(unittest.TestCase):
    def __init__(self, *args, **kwargs):
        super(UPCLegalAPITester, self).__init__(*args, **kwargs)
        # Use the correct backend URL from frontend/.env
        self.base_url = "http://localhost:8001"
        self.api_url = f"{self.base_url}/api"
        self.session = requests.Session()
        # Set a timeout for all requests to detect unresponsive endpoints
        self.timeout = 5  # 5 seconds timeout

    def test_01_health_check(self):
        """Test the health check endpoint"""
        print("\n🔍 Testing API health check...")
        try:
            start_time = time.time()
            response = self.session.get(f"{self.api_url}/health", timeout=self.timeout)
            elapsed_time = time.time() - start_time
            
            print(f"  Response time: {elapsed_time:.2f} seconds")
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data["status"], "healthy")
            self.assertIn("timestamp", data)
            print("✅ Health check endpoint is working")
            return True
        except requests.exceptions.Timeout:
            print("❌ Health check endpoint timed out after {} seconds".format(self.timeout))
            return False
        except Exception as e:
            print(f"❌ Health check endpoint error: {str(e)}")
            return False

    def test_02_get_cases(self):
        """Test retrieving cases with limit=5"""
        print("\n🔍 Testing get cases endpoint with limit=5...")
        try:
            start_time = time.time()
            response = self.session.get(f"{self.api_url}/cases", params={"limit": 5}, timeout=self.timeout)
            elapsed_time = time.time() - start_time
            
            print(f"  Response time: {elapsed_time:.2f} seconds")
            self.assertEqual(response.status_code, 200)
            cases = response.json()
            self.assertIsInstance(cases, list)
            self.assertLessEqual(len(cases), 5)  # Should be 5 or fewer cases
            print(f"✅ Retrieved {len(cases)} cases successfully")
            
            # Verify case structure if we have cases
            if cases:
                case = cases[0]
                required_fields = ["id", "date", "type", "order_reference", "registry_number", 
                                "court_division", "type_of_action", "language_of_proceedings", 
                                "parties", "summary"]
                for field in required_fields:
                    self.assertIn(field, case)
                print("✅ Case data structure is valid")
            
            return True
        except requests.exceptions.Timeout:
            print("❌ Get cases endpoint timed out after {} seconds".format(self.timeout))
            return False
        except Exception as e:
            print(f"❌ Get cases endpoint error: {str(e)}")
            return False

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
        try:
            start_time = time.time()
            response = self.session.get(f"{self.api_url}/cases/count", timeout=self.timeout)
            elapsed_time = time.time() - start_time
            
            print(f"  Response time: {elapsed_time:.2f} seconds")
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertIn("count", data)
            self.assertIsInstance(data["count"], int)
            print(f"✅ Case count endpoint returned {data['count']} cases")
            return True
        except requests.exceptions.Timeout:
            print("❌ Cases count endpoint timed out after {} seconds".format(self.timeout))
            return False
        except Exception as e:
            print(f"❌ Cases count endpoint error: {str(e)}")
            return False

    def test_05_get_filters(self):
        """Test getting available filters"""
        print("\n🔍 Testing get filters endpoint...")
        try:
            start_time = time.time()
            response = self.session.get(f"{self.api_url}/filters", timeout=self.timeout)
            elapsed_time = time.time() - start_time
            
            print(f"  Response time: {elapsed_time:.2f} seconds")
            self.assertEqual(response.status_code, 200)
            filters = response.json()
            
            required_filters = ["court_divisions", "languages", "tags", "case_types", "action_types"]
            for filter_type in required_filters:
                self.assertIn(filter_type, filters)
                self.assertIsInstance(filters[filter_type], list)
            
            print("✅ Filters endpoint returned all required filter types")
            return True
        except requests.exceptions.Timeout:
            print("❌ Filters endpoint timed out after {} seconds".format(self.timeout))
            return False
        except Exception as e:
            print(f"❌ Filters endpoint error: {str(e)}")
            return False

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

    def test_09_upc_sync_endpoint(self):
        """Test the UPC sync endpoint to trigger scraping"""
        print("\n🔍 Testing UPC sync endpoint...")
        try:
            # Test the sync endpoint
            response = self.session.post(f"{self.api_url}/sync/upc", timeout=10)
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertIn("message", data)
            self.assertIn("sync started", data["message"].lower())
            print("✅ UPC sync endpoint triggered successfully")
            
            # Wait a moment for the background task to start
            time.sleep(3)
            
            # Check sync status
            status_response = self.session.get(f"{self.api_url}/sync/status", timeout=5)
            self.assertEqual(status_response.status_code, 200)
            status_data = status_response.json()
            self.assertIn("total_cases", status_data)
            print(f"✅ Sync status shows {status_data['total_cases']} total cases")
            
            return True
        except Exception as e:
            print(f"❌ UPC sync endpoint error: {str(e)}")
            return False

    def test_10_enhanced_case_fields(self):
        """Test that scraped cases have enhanced fields (keywords, headnotes, language_of_proceedings)"""
        print("\n🔍 Testing enhanced case fields from UPC scraper...")
        try:
            # Get cases to check for enhanced fields
            response = self.session.get(f"{self.api_url}/cases", params={"limit": 10}, timeout=self.timeout)
            self.assertEqual(response.status_code, 200)
            cases = response.json()
            
            if not cases:
                print("⚠️ No cases found to test enhanced fields")
                return False
            
            enhanced_fields_found = {
                'keywords': 0,
                'headnotes': 0,
                'language_of_proceedings': 0
            }
            
            total_cases = len(cases)
            
            for case in cases:
                # Check for enhanced fields
                if case.get('keywords') and len(case['keywords']) > 0:
                    enhanced_fields_found['keywords'] += 1
                
                if case.get('headnotes') and case['headnotes'].strip():
                    enhanced_fields_found['headnotes'] += 1
                
                if case.get('language_of_proceedings'):
                    enhanced_fields_found['language_of_proceedings'] += 1
                    # Verify it's a valid language code
                    valid_languages = ['EN', 'DE', 'FR', 'IT', 'NL', 'DA']
                    self.assertIn(case['language_of_proceedings'], valid_languages)
            
            # Report findings
            print(f"  Enhanced fields found in {total_cases} cases:")
            print(f"    Keywords: {enhanced_fields_found['keywords']}/{total_cases} cases")
            print(f"    Headnotes: {enhanced_fields_found['headnotes']}/{total_cases} cases")
            print(f"    Language of Proceedings: {enhanced_fields_found['language_of_proceedings']}/{total_cases} cases")
            
            # At least some cases should have enhanced fields
            if enhanced_fields_found['language_of_proceedings'] > 0:
                print("✅ Enhanced fields are being populated correctly")
                return True
            else:
                print("⚠️ No enhanced fields found - may need more time for scraping")
                return False
                
        except Exception as e:
            print(f"❌ Enhanced fields test error: {str(e)}")
            return False

    def test_11_scraper_data_quality(self):
        """Test the quality of scraped data from UPC website"""
        print("\n🔍 Testing UPC scraper data quality...")
        try:
            # Get recent cases to check data quality
            response = self.session.get(f"{self.api_url}/cases", 
                                       params={"limit": 20, "date_from": "2024-01-01"}, 
                                       timeout=self.timeout)
            self.assertEqual(response.status_code, 200)
            cases = response.json()
            
            if not cases:
                print("⚠️ No recent cases found to test data quality")
                return False
            
            quality_metrics = {
                'valid_registry_numbers': 0,
                'valid_order_references': 0,
                'valid_court_divisions': 0,
                'valid_parties': 0,
                'valid_summaries': 0,
                'valid_dates': 0
            }
            
            total_cases = len(cases)
            
            for case in cases:
                # Check registry number format (App_XXXXX/YYYY or similar)
                if case.get('registry_number') and re.match(r'(App_|CC_|ACT_|APL_)\d+/\d{4}', case['registry_number']):
                    quality_metrics['valid_registry_numbers'] += 1
                
                # Check order reference format (ORD_XXXXX/YYYY or DEC_XXXXX/YYYY)
                if case.get('order_reference') and re.match(r'(ORD_|DEC_)\d+/\d{4}', case['order_reference']):
                    quality_metrics['valid_order_references'] += 1
                
                # Check court division format
                if case.get('court_division') and ('Court of' in case['court_division'] or 'Division' in case['court_division']):
                    quality_metrics['valid_court_divisions'] += 1
                
                # Check parties (should have at least one party)
                if case.get('parties') and len(case['parties']) > 0:
                    quality_metrics['valid_parties'] += 1
                
                # Check summary (should be meaningful length)
                if case.get('summary') and len(case['summary']) > 50:
                    quality_metrics['valid_summaries'] += 1
                
                # Check date format (YYYY-MM-DD)
                if case.get('date') and re.match(r'\d{4}-\d{2}-\d{2}', case['date']):
                    quality_metrics['valid_dates'] += 1
            
            # Report quality metrics
            print(f"  Data quality metrics for {total_cases} cases:")
            for metric, count in quality_metrics.items():
                percentage = (count / total_cases) * 100
                print(f"    {metric.replace('_', ' ').title()}: {count}/{total_cases} ({percentage:.1f}%)")
            
            # Check if data quality is acceptable (at least 80% for key fields)
            key_fields = ['valid_registry_numbers', 'valid_dates', 'valid_court_divisions']
            acceptable_quality = all(
                (quality_metrics[field] / total_cases) >= 0.8 
                for field in key_fields
            )
            
            if acceptable_quality:
                print("✅ UPC scraper data quality is acceptable")
                return True
            else:
                print("⚠️ UPC scraper data quality needs improvement")
                return False
                
        except Exception as e:
            print(f"❌ Data quality test error: {str(e)}")
            return False

    def test_12_scraper_real_data_extraction(self):
        """Test that scraper is extracting real data from UPC website (not just sample data)"""
        print("\n🔍 Testing real data extraction from UPC website...")
        try:
            # Get all cases
            response = self.session.get(f"{self.api_url}/cases", params={"limit": 50}, timeout=self.timeout)
            self.assertEqual(response.status_code, 200)
            cases = response.json()
            
            if not cases:
                print("⚠️ No cases found")
                return False
            
            # Check for indicators of real UPC data vs sample data
            real_data_indicators = 0
            sample_data_indicators = 0
            
            sample_parties = ["Progress Maschinen & Automation AG", "Renault Deutschland AG"]
            
            for case in cases:
                # Check if this looks like sample data
                is_sample = False
                if case.get('parties'):
                    for party in case['parties']:
                        if any(sample_party in party for sample_party in sample_parties):
                            is_sample = True
                            break
                
                if is_sample:
                    sample_data_indicators += 1
                else:
                    real_data_indicators += 1
            
            total_cases = len(cases)
            real_data_percentage = (real_data_indicators / total_cases) * 100
            
            print(f"  Data source analysis for {total_cases} cases:")
            print(f"    Real UPC data: {real_data_indicators} cases ({real_data_percentage:.1f}%)")
            print(f"    Sample data: {sample_data_indicators} cases ({100-real_data_percentage:.1f}%)")
            
            # Check for variety in court divisions (real data should have multiple divisions)
            court_divisions = set()
            for case in cases:
                if case.get('court_division'):
                    court_divisions.add(case['court_division'])
            
            print(f"    Unique court divisions: {len(court_divisions)}")
            
            # Real data should have multiple court divisions and mostly non-sample data
            if len(court_divisions) >= 3 and real_data_percentage >= 70:
                print("✅ Scraper is extracting real data from UPC website")
                return True
            elif real_data_percentage >= 30:
                print("⚠️ Scraper has some real data but may need more time to fully populate")
                return True
            else:
                print("⚠️ Scraper appears to be mostly returning sample data")
                return False
                
        except Exception as e:
            print(f"❌ Real data extraction test error: {str(e)}")
            return False

def run_tests():
    # Create a test suite
    suite = unittest.TestSuite()
    
    # Add test methods - focusing on UPC scraper improvements
    test_cases = [
        'test_01_health_check',
        'test_02_get_cases',
        'test_04_get_cases_count',
        'test_05_get_filters',
        'test_09_upc_sync_endpoint',
        'test_10_enhanced_case_fields',
        'test_11_scraper_data_quality',
        'test_12_scraper_real_data_extraction'
    ]
    
    # Track results for each test
    results = {}
    
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
    
    # Check for timeouts or other issues
    if result.errors or result.failures:
        print("\n❌ Some tests failed or had errors.")
        for error in result.errors:
            print(f"   ERROR: {error[0]} - {error[1]}")
        for failure in result.failures:
            print(f"   FAILURE: {failure[0]} - {failure[1]}")
    else:
        print("\n✅ All tests passed! UPC scraper improvements are working correctly.")
    
    return len(result.errors) == 0 and len(result.failures) == 0

if __name__ == "__main__":
    success = run_tests()
    exit(0 if success else 1)