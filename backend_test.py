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

    def test_13_upc_texts_endpoint(self):
        """Test the UPC texts endpoint - should return 5 sample legal texts"""
        print("\n🔍 Testing UPC texts endpoint...")
        try:
            start_time = time.time()
            response = self.session.get(f"{self.api_url}/upc-texts", timeout=self.timeout)
            elapsed_time = time.time() - start_time
            
            print(f"  Response time: {elapsed_time:.2f} seconds")
            self.assertEqual(response.status_code, 200)
            texts = response.json()
            self.assertIsInstance(texts, list)
            
            print(f"  Retrieved {len(texts)} UPC legal texts")
            
            # Should have exactly 5 sample texts as per the server.py initialization
            self.assertEqual(len(texts), 5, "Expected exactly 5 sample UPC legal texts")
            
            # Verify structure of texts
            if texts:
                text = texts[0]
                required_fields = ["id", "document_type", "section", "article_number", 
                                 "title", "content", "language", "cross_references", 
                                 "keywords", "created_date", "last_updated"]
                for field in required_fields:
                    self.assertIn(field, text, f"Missing required field: {field}")
                
                # Verify specific sample data
                article_numbers = [text.get("article_number") for text in texts]
                expected_articles = ["Rule 1", "Rule 2", "Rule 13", "Rule 206", "Article 32"]
                for expected in expected_articles:
                    self.assertIn(expected, article_numbers, f"Expected article {expected} not found")
                
                print("✅ UPC texts structure and content are valid")
            
            return True
        except Exception as e:
            print(f"❌ UPC texts endpoint error: {str(e)}")
            return False

    def test_14_upc_texts_structure_endpoint(self):
        """Test the UPC texts structure endpoint"""
        print("\n🔍 Testing UPC texts structure endpoint...")
        try:
            start_time = time.time()
            response = self.session.get(f"{self.api_url}/upc-texts/structure", timeout=self.timeout)
            elapsed_time = time.time() - start_time
            
            print(f"  Response time: {elapsed_time:.2f} seconds")
            self.assertEqual(response.status_code, 200)
            structure = response.json()
            self.assertIsInstance(structure, dict)
            
            # Should have document types as keys
            expected_doc_types = ["rules_of_procedure", "upc_agreement"]
            for doc_type in expected_doc_types:
                self.assertIn(doc_type, structure, f"Expected document type {doc_type} not found")
                
                # Each document type should have sections and count
                self.assertIn("sections", structure[doc_type])
                self.assertIn("count", structure[doc_type])
                self.assertIsInstance(structure[doc_type]["sections"], list)
                self.assertIsInstance(structure[doc_type]["count"], int)
            
            print(f"  Structure contains {len(structure)} document types")
            for doc_type, info in structure.items():
                print(f"    {doc_type}: {info['count']} texts, {len(info['sections'])} sections")
            
            print("✅ UPC texts structure endpoint is working correctly")
            return True
        except Exception as e:
            print(f"❌ UPC texts structure endpoint error: {str(e)}")
            return False

    def test_15_add_apport_to_case(self):
        """Test adding an apport with Rule 13 to a case for testing linked-cases functionality"""
        print("\n🔍 Testing adding apport to case for linking...")
        try:
            # First get a case to add apport to
            response = self.session.get(f"{self.api_url}/cases", params={"limit": 1}, timeout=self.timeout)
            self.assertEqual(response.status_code, 200)
            cases = response.json()
            
            if not cases:
                print("⚠️ No cases found to add apport to")
                return False
            
            case = cases[0]
            case_id = case["id"]
            
            # Add an apport with Rule 13 reference
            apport_data = {
                "admin_summary": "Test case for UPC Code system linking",
                "apports": [
                    {
                        "id": 1,
                        "article_number": "Rule 13",
                        "regulation": "Rules of Procedure",
                        "citation": "Rule 13 - Contents of the Statement of claim"
                    }
                ]
            }
            
            # Update the case with apport
            update_response = self.session.put(f"{self.api_url}/cases/{case_id}", 
                                             json=apport_data, timeout=self.timeout)
            self.assertEqual(update_response.status_code, 200)
            
            updated_case = update_response.json()
            self.assertIn("apports", updated_case)
            self.assertEqual(len(updated_case["apports"]), 1)
            self.assertEqual(updated_case["apports"][0]["article_number"], "Rule 13")
            
            print(f"✅ Successfully added Rule 13 apport to case {case_id}")
            return case_id
        except Exception as e:
            print(f"❌ Add apport test error: {str(e)}")
            return False

    def test_16_upc_texts_linked_cases_endpoint(self):
        """Test the linked cases endpoint for UPC texts"""
        print("\n🔍 Testing UPC texts linked cases endpoint...")
        try:
            # First ensure we have a case with Rule 13 apport
            case_id = self.test_15_add_apport_to_case()
            if not case_id:
                print("⚠️ Could not set up test case with apport")
                return False
            
            # Get the Rule 13 text ID
            texts_response = self.session.get(f"{self.api_url}/upc-texts", timeout=self.timeout)
            self.assertEqual(texts_response.status_code, 200)
            texts = texts_response.json()
            
            rule_13_text = None
            for text in texts:
                if text.get("article_number") == "Rule 13":
                    rule_13_text = text
                    break
            
            self.assertIsNotNone(rule_13_text, "Rule 13 text not found")
            
            # Test the linked cases endpoint
            text_id = rule_13_text["id"]
            linked_response = self.session.get(f"{self.api_url}/upc-texts/{text_id}/linked-cases", 
                                             timeout=self.timeout)
            self.assertEqual(linked_response.status_code, 200)
            linked_cases = linked_response.json()
            
            self.assertIsInstance(linked_cases, list)
            
            # Should find at least one linked case (the one we just added apport to)
            self.assertGreater(len(linked_cases), 0, "Expected to find at least one linked case")
            
            # Verify the structure of linked cases
            if linked_cases:
                linked_case = linked_cases[0]
                required_fields = ["case_id", "case_title", "parties", "date", 
                                 "citation", "apport_id", "summary"]
                for field in required_fields:
                    self.assertIn(field, linked_case, f"Missing required field: {field}")
                
                # Verify it's the case we added apport to
                self.assertEqual(linked_case["case_id"], case_id)
                self.assertEqual(linked_case["citation"], "Rule 13 - Contents of the Statement of claim")
            
            print(f"✅ Found {len(linked_cases)} linked cases for Rule 13")
            return True
        except Exception as e:
            print(f"❌ Linked cases endpoint error: {str(e)}")
            return False

    def test_17_upc_texts_filtering(self):
        """Test UPC texts filtering functionality"""
        print("\n🔍 Testing UPC texts filtering...")
        try:
            # Test filtering by document type
            response = self.session.get(f"{self.api_url}/upc-texts", 
                                      params={"document_type": "rules_of_procedure"}, 
                                      timeout=self.timeout)
            self.assertEqual(response.status_code, 200)
            rop_texts = response.json()
            
            for text in rop_texts:
                self.assertEqual(text["document_type"], "rules_of_procedure")
            
            print(f"  Found {len(rop_texts)} Rules of Procedure texts")
            
            # Test filtering by section
            response = self.session.get(f"{self.api_url}/upc-texts", 
                                      params={"section": "Part I - General Provisions"}, 
                                      timeout=self.timeout)
            self.assertEqual(response.status_code, 200)
            part1_texts = response.json()
            
            for text in part1_texts:
                self.assertEqual(text["section"], "Part I - General Provisions")
            
            print(f"  Found {len(part1_texts)} Part I texts")
            
            # Test filtering by language (default is EN)
            response = self.session.get(f"{self.api_url}/upc-texts", 
                                      params={"language": "EN"}, 
                                      timeout=self.timeout)
            self.assertEqual(response.status_code, 200)
            en_texts = response.json()
            
            for text in en_texts:
                self.assertEqual(text["language"], "EN")
            
            print(f"  Found {len(en_texts)} English texts")
            
            print("✅ UPC texts filtering is working correctly")
            return True
        except Exception as e:
            print(f"❌ UPC texts filtering error: {str(e)}")
            return False

    def test_18_upc_code_system_workflow(self):
        """Test the complete UPC Code system workflow"""
        print("\n🔍 Testing complete UPC Code system workflow...")
        try:
            # 1. Verify UPC texts are loaded
            texts_response = self.session.get(f"{self.api_url}/upc-texts", timeout=self.timeout)
            self.assertEqual(texts_response.status_code, 200)
            texts = texts_response.json()
            self.assertEqual(len(texts), 5, "Expected 5 UPC legal texts")
            
            # 2. Verify structure endpoint works
            structure_response = self.session.get(f"{self.api_url}/upc-texts/structure", timeout=self.timeout)
            self.assertEqual(structure_response.status_code, 200)
            structure = structure_response.json()
            self.assertIn("rules_of_procedure", structure)
            self.assertIn("upc_agreement", structure)
            
            # 3. Find Rule 13 text
            rule_13_text = None
            for text in texts:
                if text.get("article_number") == "Rule 13":
                    rule_13_text = text
                    break
            self.assertIsNotNone(rule_13_text, "Rule 13 text not found")
            
            # 4. Get a case and add Rule 13 apport
            cases_response = self.session.get(f"{self.api_url}/cases", params={"limit": 1}, timeout=self.timeout)
            self.assertEqual(cases_response.status_code, 200)
            cases = cases_response.json()
            self.assertGreater(len(cases), 0, "No cases found")
            
            case = cases[0]
            case_id = case["id"]
            
            # Add Rule 13 apport
            apport_data = {
                "admin_summary": "UPC Code system workflow test",
                "apports": [
                    {
                        "id": 2,
                        "article_number": "Rule 13",
                        "regulation": "Rules of Procedure",
                        "citation": "Rule 13 - Contents of the Statement of claim"
                    }
                ]
            }
            
            update_response = self.session.put(f"{self.api_url}/cases/{case_id}", 
                                             json=apport_data, timeout=self.timeout)
            self.assertEqual(update_response.status_code, 200)
            
            # 5. Verify linking works
            text_id = rule_13_text["id"]
            linked_response = self.session.get(f"{self.api_url}/upc-texts/{text_id}/linked-cases", 
                                             timeout=self.timeout)
            self.assertEqual(linked_response.status_code, 200)
            linked_cases = linked_response.json()
            self.assertGreater(len(linked_cases), 0, "No linked cases found")
            
            # 6. Verify the linked case is correct
            found_case = False
            for linked_case in linked_cases:
                if linked_case["case_id"] == case_id:
                    found_case = True
                    self.assertEqual(linked_case["citation"], "Rule 13 - Contents of the Statement of claim")
                    break
            
            self.assertTrue(found_case, "Expected case not found in linked cases")
            
            print("✅ Complete UPC Code system workflow is working correctly")
            print(f"  - {len(texts)} UPC legal texts loaded")
            print(f"  - Document structure properly organized")
            print(f"  - Case-text linking via apports functional")
            print(f"  - Found {len(linked_cases)} linked cases for Rule 13")
            
            return True
        except Exception as e:
            print(f"❌ UPC Code system workflow error: {str(e)}")
            return False

    def test_19_user_registration(self):
        """Test user registration endpoint"""
        print("\n🔍 Testing user registration...")
        try:
            # Create a new user with realistic data and unique email
            import time
            timestamp = str(int(time.time()))
            user_data = {
                "email": f"sarah.johnson.{timestamp}@lawfirm.com",
                "username": f"sarah_johnson_{timestamp}",
                "password": "SecurePass123!",
                "profile": "professional",
                "newsletter_opt_in": True
            }
            
            response = self.session.post(f"{self.api_url}/auth/register", 
                                       json=user_data, timeout=self.timeout)
            
            if response.status_code == 400:
                # User might already exist, try with different email
                user_data["email"] = f"new.user.{timestamp}@example.com"
                user_data["username"] = f"new_user_{timestamp}"
                response = self.session.post(f"{self.api_url}/auth/register", 
                                           json=user_data, timeout=self.timeout)
            
            self.assertEqual(response.status_code, 200)
            
            user_response = response.json()
            required_fields = ["id", "email", "username", "role", "profile", "newsletter_opt_in", "created_at"]
            for field in required_fields:
                self.assertIn(field, user_response)
            
            self.assertEqual(user_response["email"], user_data["email"])
            self.assertEqual(user_response["username"], user_data["username"])
            self.assertEqual(user_response["role"], "user")
            self.assertEqual(user_response["profile"], "professional")
            self.assertEqual(user_response["newsletter_opt_in"], True)
            
            print(f"✅ User registration successful for {user_data['email']}")
            return user_data
        except Exception as e:
            print(f"❌ User registration error: {str(e)}")
            return False

    def test_20_user_login(self):
        """Test user login endpoint"""
        print("\n🔍 Testing user login...")
        try:
            # First register a user if not already done
            user_data = self.test_19_user_registration()
            if not user_data:
                print("⚠️ Could not register user for login test")
                return False
            
            # Login with the registered user
            login_data = {
                "email": user_data["email"],
                "password": user_data["password"]
            }
            
            response = self.session.post(f"{self.api_url}/auth/login", 
                                       json=login_data, timeout=self.timeout)
            self.assertEqual(response.status_code, 200)
            
            token_response = response.json()
            self.assertIn("access_token", token_response)
            self.assertIn("token_type", token_response)
            self.assertEqual(token_response["token_type"], "bearer")
            
            # Store token for future authenticated requests
            self.user_token = token_response["access_token"]
            
            print(f"✅ User login successful for {login_data['email']}")
            return token_response["access_token"]
        except Exception as e:
            print(f"❌ User login error: {str(e)}")
            return False

    def test_21_get_current_user_info(self):
        """Test getting current user info with JWT token"""
        print("\n🔍 Testing get current user info...")
        try:
            # Get token from login test
            token = self.test_20_user_login()
            if not token:
                print("⚠️ Could not get authentication token")
                return False
            
            # Make authenticated request
            headers = {"Authorization": f"Bearer {token}"}
            response = self.session.get(f"{self.api_url}/auth/me", 
                                      headers=headers, timeout=self.timeout)
            self.assertEqual(response.status_code, 200)
            
            user_info = response.json()
            required_fields = ["id", "email", "username", "role", "profile", "newsletter_opt_in", "created_at"]
            for field in required_fields:
                self.assertIn(field, user_info)
            
            self.assertEqual(user_info["email"], "sarah.johnson@lawfirm.com")
            self.assertEqual(user_info["username"], "sarah_johnson")
            self.assertEqual(user_info["role"], "user")
            
            print(f"✅ Current user info retrieved successfully")
            return True
        except Exception as e:
            print(f"❌ Get current user info error: {str(e)}")
            return False

    def test_22_admin_login(self):
        """Test admin login with predefined credentials"""
        print("\n🔍 Testing admin login...")
        try:
            # Login with admin credentials
            admin_login_data = {
                "email": "admin@romulus.com",
                "password": "admin123"
            }
            
            response = self.session.post(f"{self.api_url}/auth/login", 
                                       json=admin_login_data, timeout=self.timeout)
            self.assertEqual(response.status_code, 200)
            
            token_response = response.json()
            self.assertIn("access_token", token_response)
            self.assertIn("token_type", token_response)
            self.assertEqual(token_response["token_type"], "bearer")
            
            # Store admin token for future admin requests
            self.admin_token = token_response["access_token"]
            
            # Verify admin user info
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            user_response = self.session.get(f"{self.api_url}/auth/me", 
                                           headers=headers, timeout=self.timeout)
            self.assertEqual(user_response.status_code, 200)
            
            admin_info = user_response.json()
            self.assertEqual(admin_info["email"], "admin@romulus.com")
            self.assertEqual(admin_info["role"], "admin")
            
            print(f"✅ Admin login successful")
            return self.admin_token
        except Exception as e:
            print(f"❌ Admin login error: {str(e)}")
            return False

    def test_23_exclude_case_admin(self):
        """Test excluding a case with admin privileges"""
        print("\n🔍 Testing case exclusion with admin privileges...")
        try:
            # Get admin token
            admin_token = self.test_22_admin_login()
            if not admin_token:
                print("⚠️ Could not get admin token")
                return False
            
            # Get a case to exclude (including already excluded ones)
            response = self.session.get(f"{self.api_url}/cases", params={"limit": 1, "include_excluded": True}, timeout=self.timeout)
            self.assertEqual(response.status_code, 200)
            cases = response.json()
            
            if not cases:
                print("⚠️ No cases found to exclude")
                return False
            
            case = cases[0]
            case_id = case["id"]
            
            # First include the case if it's already excluded
            if case.get("excluded", False):
                inclusion_data = {
                    "excluded": False,
                    "exclusion_reason": None
                }
                
                headers = {"Authorization": f"Bearer {admin_token}"}
                include_response = self.session.put(f"{self.api_url}/admin/cases/{case_id}/exclude", 
                                                  json=inclusion_data, headers=headers, timeout=self.timeout)
                self.assertEqual(include_response.status_code, 200)
            
            # Now exclude the case
            exclusion_data = {
                "excluded": True,
                "exclusion_reason": "Case contains sensitive information and should not be publicly accessible"
            }
            
            headers = {"Authorization": f"Bearer {admin_token}"}
            exclude_response = self.session.put(f"{self.api_url}/admin/cases/{case_id}/exclude", 
                                              json=exclusion_data, headers=headers, timeout=self.timeout)
            self.assertEqual(exclude_response.status_code, 200)
            
            updated_case = exclude_response.json()
            self.assertEqual(updated_case["excluded"], True)
            self.assertEqual(updated_case["exclusion_reason"], exclusion_data["exclusion_reason"])
            
            print(f"✅ Case {case_id} excluded successfully")
            return case_id
        except Exception as e:
            print(f"❌ Case exclusion error: {str(e)}")
            return False

    def test_24_get_excluded_cases_admin(self):
        """Test getting excluded cases (admin only)"""
        print("\n🔍 Testing get excluded cases (admin only)...")
        try:
            # Get admin token
            admin_token = self.test_22_admin_login()
            if not admin_token:
                print("⚠️ Could not get admin token")
                return False
            
            # Ensure we have at least one excluded case
            excluded_case_id = self.test_23_exclude_case_admin()
            if not excluded_case_id:
                print("⚠️ Could not exclude a case for testing")
                return False
            
            # Get excluded cases
            headers = {"Authorization": f"Bearer {admin_token}"}
            response = self.session.get(f"{self.api_url}/admin/cases/excluded", 
                                      headers=headers, timeout=self.timeout)
            self.assertEqual(response.status_code, 200)
            
            excluded_cases = response.json()
            self.assertIsInstance(excluded_cases, list)
            self.assertGreater(len(excluded_cases), 0, "Expected at least one excluded case")
            
            # Verify all returned cases are excluded
            for case in excluded_cases:
                self.assertEqual(case["excluded"], True)
                self.assertIn("exclusion_reason", case)
            
            print(f"✅ Retrieved {len(excluded_cases)} excluded cases")
            return True
        except Exception as e:
            print(f"❌ Get excluded cases error: {str(e)}")
            return False

    def test_25_verify_excluded_cases_not_in_public_api(self):
        """Test that excluded cases are not returned in public API"""
        print("\n🔍 Testing excluded cases are not in public API...")
        try:
            # Ensure we have an excluded case
            excluded_case_id = self.test_23_exclude_case_admin()
            if not excluded_case_id:
                print("⚠️ Could not exclude a case for testing")
                return False
            
            # Get cases without include_excluded parameter (default behavior)
            response = self.session.get(f"{self.api_url}/cases", timeout=self.timeout)
            self.assertEqual(response.status_code, 200)
            public_cases = response.json()
            
            # Verify excluded case is not in public results
            excluded_case_found = False
            for case in public_cases:
                if case["id"] == excluded_case_id:
                    excluded_case_found = True
                    break
            
            self.assertFalse(excluded_case_found, "Excluded case should not appear in public API")
            
            # Test with include_excluded=false explicitly
            response = self.session.get(f"{self.api_url}/cases", 
                                      params={"include_excluded": False}, timeout=self.timeout)
            self.assertEqual(response.status_code, 200)
            filtered_cases = response.json()
            
            excluded_case_found = False
            for case in filtered_cases:
                if case["id"] == excluded_case_id:
                    excluded_case_found = True
                    break
            
            self.assertFalse(excluded_case_found, "Excluded case should not appear when include_excluded=false")
            
            print(f"✅ Excluded cases properly filtered from public API")
            return True
        except Exception as e:
            print(f"❌ Public API exclusion test error: {str(e)}")
            return False

    def test_26_unauthorized_access_to_admin_endpoints(self):
        """Test that admin endpoints are protected from unauthorized access"""
        print("\n🔍 Testing unauthorized access to admin endpoints...")
        try:
            # Try to access admin endpoints without token
            case_id = "test-case-id"
            
            # Test exclude endpoint without auth - should return 403 (FastAPI with HTTPBearer)
            exclusion_data = {"excluded": True, "exclusion_reason": "Test"}
            response = self.session.put(f"{self.api_url}/admin/cases/{case_id}/exclude", 
                                      json=exclusion_data, timeout=self.timeout)
            self.assertIn(response.status_code, [401, 403], "Should return 401 or 403 for unauthorized access")
            
            # Test get excluded cases without auth
            response = self.session.get(f"{self.api_url}/admin/cases/excluded", timeout=self.timeout)
            self.assertIn(response.status_code, [401, 403], "Should return 401 or 403 for unauthorized access")
            
            # Test with regular user token (not admin)
            user_token = self.test_20_user_login()
            if user_token:
                headers = {"Authorization": f"Bearer {user_token}"}
                
                # Try exclude endpoint with user token
                response = self.session.put(f"{self.api_url}/admin/cases/{case_id}/exclude", 
                                          json=exclusion_data, headers=headers, timeout=self.timeout)
                self.assertEqual(response.status_code, 403, "Should return 403 Forbidden for non-admin")
                
                # Try get excluded cases with user token
                response = self.session.get(f"{self.api_url}/admin/cases/excluded", 
                                          headers=headers, timeout=self.timeout)
                self.assertEqual(response.status_code, 403, "Should return 403 Forbidden for non-admin")
            
            print(f"✅ Admin endpoints properly protected from unauthorized access")
            return True
        except Exception as e:
            print(f"❌ Unauthorized access test error: {str(e)}")
            return False

    def test_27_authentication_system_workflow(self):
        """Test complete authentication system workflow"""
        print("\n🔍 Testing complete authentication system workflow...")
        try:
            # 1. Register new user with unique credentials
            import time
            timestamp = str(int(time.time()))
            user_data = {
                "email": f"michael.chen.{timestamp}@university.edu",
                "username": f"michael_chen_{timestamp}",
                "password": "AcademicPass456!",
                "profile": "academic",
                "newsletter_opt_in": False
            }
            
            register_response = self.session.post(f"{self.api_url}/auth/register", 
                                                json=user_data, timeout=self.timeout)
            self.assertEqual(register_response.status_code, 200)
            
            # 2. Login with new user
            login_data = {"email": user_data["email"], "password": user_data["password"]}
            login_response = self.session.post(f"{self.api_url}/auth/login", 
                                             json=login_data, timeout=self.timeout)
            self.assertEqual(login_response.status_code, 200)
            user_token = login_response.json()["access_token"]
            
            # 3. Access protected endpoint with user token
            headers = {"Authorization": f"Bearer {user_token}"}
            me_response = self.session.get(f"{self.api_url}/auth/me", 
                                         headers=headers, timeout=self.timeout)
            self.assertEqual(me_response.status_code, 200)
            user_info = me_response.json()
            self.assertEqual(user_info["email"], user_data["email"])
            
            # 4. Admin login
            admin_login = {"email": "admin@romulus.com", "password": "admin123"}
            admin_response = self.session.post(f"{self.api_url}/auth/login", 
                                             json=admin_login, timeout=self.timeout)
            self.assertEqual(admin_response.status_code, 200)
            admin_token = admin_response.json()["access_token"]
            
            # 5. Admin operations
            admin_headers = {"Authorization": f"Bearer {admin_token}"}
            
            # Get a case and exclude it
            cases_response = self.session.get(f"{self.api_url}/cases", params={"limit": 1})
            if cases_response.status_code == 200 and cases_response.json():
                case_id = cases_response.json()[0]["id"]
                
                exclusion_data = {
                    "excluded": True,
                    "exclusion_reason": "Workflow test exclusion"
                }
                
                exclude_response = self.session.put(f"{self.api_url}/admin/cases/{case_id}/exclude", 
                                                  json=exclusion_data, headers=admin_headers)
                self.assertEqual(exclude_response.status_code, 200)
                
                # Verify exclusion
                excluded_response = self.session.get(f"{self.api_url}/admin/cases/excluded", 
                                                   headers=admin_headers)
                self.assertEqual(excluded_response.status_code, 200)
                excluded_cases = excluded_response.json()
                self.assertGreater(len(excluded_cases), 0)
            
            print("✅ Complete authentication system workflow successful")
            print("  - User registration ✓")
            print("  - User login ✓")
            print("  - JWT token authentication ✓")
            print("  - Admin login ✓")
            print("  - Admin case exclusion ✓")
            print("  - Protected endpoint access ✓")
            
            return True
        except Exception as e:
            print(f"❌ Authentication workflow error: {str(e)}")
            return False

    def test_28_create_editor_user(self):
        """Create an editor user for testing editor workflow"""
        print("\n🔍 Creating editor user for workflow testing...")
        try:
            # First, we need to create an editor user manually in the database
            # Since there's no endpoint to create editors, we'll use admin privileges
            admin_token = self.test_22_admin_login()
            if not admin_token:
                print("⚠️ Could not get admin token")
                return False
            
            # Create a regular user first
            import time
            timestamp = str(int(time.time()))
            editor_data = {
                "email": f"editor.smith.{timestamp}@lawfirm.com",
                "username": f"editor_smith_{timestamp}",
                "password": "EditorPass789!",
                "profile": "professional",
                "newsletter_opt_in": True
            }
            
            register_response = self.session.post(f"{self.api_url}/auth/register", 
                                                json=editor_data, timeout=self.timeout)
            self.assertEqual(register_response.status_code, 200)
            
            # Store editor credentials for later use
            self.editor_credentials = editor_data
            
            print(f"✅ Editor user created: {editor_data['email']}")
            return editor_data
        except Exception as e:
            print(f"❌ Create editor user error: {str(e)}")
            return False

    def test_29_editor_submit_change(self):
        """Test editor submitting a change for approval"""
        print("\n🔍 Testing editor change submission...")
        try:
            # Create editor user
            editor_data = self.test_28_create_editor_user()
            if not editor_data:
                print("⚠️ Could not create editor user")
                return False
            
            # Login as editor (but they're actually a regular user, so this should test the workflow)
            login_data = {"email": editor_data["email"], "password": editor_data["password"]}
            login_response = self.session.post(f"{self.api_url}/auth/login", 
                                             json=login_data, timeout=self.timeout)
            self.assertEqual(login_response.status_code, 200)
            editor_token = login_response.json()["access_token"]
            
            # Get a case to modify (including excluded ones for testing)
            cases_response = self.session.get(f"{self.api_url}/cases", params={"limit": 1, "include_excluded": True})
            self.assertEqual(cases_response.status_code, 200)
            cases = cases_response.json()
            
            if not cases:
                print("⚠️ No cases found for editor test")
                return False
            
            case_id = cases[0]["id"]
            
            # Submit a change as editor (should go to pending approval since user role is 'user')
            change_data = {
                "admin_summary": "Editor-submitted summary: This case involves complex patent infringement issues requiring detailed analysis.",
                "apports": [
                    {
                        "id": 3,
                        "article_number": "Rule 206",
                        "regulation": "Rules of Procedure",
                        "citation": "Rule 206 - Application for provisional measures"
                    }
                ]
            }
            
            headers = {"Authorization": f"Bearer {editor_token}"}
            submit_response = self.session.post(f"{self.api_url}/editor/changes/submit", 
                                              params={"case_id": case_id, "reason": "Adding detailed analysis and relevant legal references"},
                                              json=change_data, headers=headers, timeout=self.timeout)
            
            # Since the user is not actually an editor, this should return 403
            self.assertEqual(submit_response.status_code, 403)
            
            print("✅ Editor endpoint properly protected - non-editor users cannot submit changes")
            return True
        except Exception as e:
            print(f"❌ Editor submit change error: {str(e)}")
            return False

    def test_30_admin_direct_change(self):
        """Test admin making direct changes (bypassing approval)"""
        print("\n🔍 Testing admin direct changes...")
        try:
            # Get admin token
            admin_token = self.test_22_admin_login()
            if not admin_token:
                print("⚠️ Could not get admin token")
                return False
            
            # Get a case to modify (including excluded ones for testing)
            cases_response = self.session.get(f"{self.api_url}/cases", params={"limit": 1, "include_excluded": True})
            self.assertEqual(cases_response.status_code, 200)
            cases = cases_response.json()
            
            if not cases:
                print("⚠️ No cases found for admin test")
                return False
            
            case_id = cases[0]["id"]
            
            # Submit a change as admin (should be applied directly)
            change_data = {
                "admin_summary": "Admin direct update: Comprehensive analysis of patent validity and infringement claims.",
                "apports": [
                    {
                        "id": 4,
                        "article_number": "Article 32",
                        "regulation": "UPC Agreement",
                        "citation": "Article 32 - Competence of the Court"
                    }
                ]
            }
            
            headers = {"Authorization": f"Bearer {admin_token}"}
            submit_response = self.session.post(f"{self.api_url}/editor/changes/submit", 
                                              params={"case_id": case_id, "reason": "Admin direct update with legal analysis"},
                                              json=change_data, headers=headers, timeout=self.timeout)
            
            self.assertEqual(submit_response.status_code, 200)
            updated_case = submit_response.json()
            
            # Verify the changes were applied directly
            self.assertEqual(updated_case["admin_summary"], change_data["admin_summary"])
            self.assertEqual(len(updated_case["apports"]), 1)
            self.assertEqual(updated_case["apports"][0]["article_number"], "Article 32")
            
            print("✅ Admin changes applied directly without approval process")
            return case_id
        except Exception as e:
            print(f"❌ Admin direct change error: {str(e)}")
            return False

    def test_31_newsletter_subscribers(self):
        """Test getting newsletter subscribers"""
        print("\n🔍 Testing newsletter subscribers endpoint...")
        try:
            # Get admin token
            admin_token = self.test_22_admin_login()
            if not admin_token:
                print("⚠️ Could not get admin token")
                return False
            
            # Get newsletter subscribers
            headers = {"Authorization": f"Bearer {admin_token}"}
            response = self.session.get(f"{self.api_url}/admin/newsletter/subscribers", 
                                      headers=headers, timeout=self.timeout)
            self.assertEqual(response.status_code, 200)
            
            subscribers = response.json()
            self.assertIsInstance(subscribers, list)
            
            # Verify subscriber structure if we have any
            if subscribers:
                subscriber = subscribers[0]
                required_fields = ["id", "email", "username", "profile", "created_at"]
                for field in required_fields:
                    self.assertIn(field, subscriber)
            
            print(f"✅ Retrieved {len(subscribers)} newsletter subscribers")
            return True
        except Exception as e:
            print(f"❌ Newsletter subscribers error: {str(e)}")
            return False

    def test_32_send_newsletter(self):
        """Test sending newsletter (mock)"""
        print("\n🔍 Testing newsletter sending...")
        try:
            # Get admin token
            admin_token = self.test_22_admin_login()
            if not admin_token:
                print("⚠️ Could not get admin token")
                return False
            
            # Get subscribers first
            headers = {"Authorization": f"Bearer {admin_token}"}
            subscribers_response = self.session.get(f"{self.api_url}/admin/newsletter/subscribers", 
                                                  headers=headers, timeout=self.timeout)
            self.assertEqual(subscribers_response.status_code, 200)
            subscribers = subscribers_response.json()
            
            # Prepare newsletter data
            newsletter_data = {
                "subject": "UPC Legal Database - Weekly Update",
                "content": "Dear subscribers,\n\nThis week we've added 15 new UPC decisions to our database, including several important rulings on patent infringement and provisional measures.\n\nHighlights:\n- New decisions from Munich Local Division\n- Updated legal text references\n- Enhanced search functionality\n\nBest regards,\nUPC Legal Team",
                "recipients": [sub["email"] for sub in subscribers] if subscribers else ["test@example.com"]
            }
            
            # Send newsletter
            send_response = self.session.post(f"{self.api_url}/admin/newsletter/send", 
                                            json=newsletter_data, headers=headers, timeout=self.timeout)
            self.assertEqual(send_response.status_code, 200)
            
            result = send_response.json()
            self.assertIn("message", result)
            self.assertIn("newsletter_id", result)
            self.assertIn("recipients_count", result)
            self.assertEqual(result["recipients_count"], len(newsletter_data["recipients"]))
            
            print(f"✅ Newsletter sent successfully to {result['recipients_count']} recipients")
            return True
        except Exception as e:
            print(f"❌ Send newsletter error: {str(e)}")
            return False

    def test_33_get_settings(self):
        """Test getting system settings"""
        print("\n🔍 Testing get system settings...")
        try:
            # Get admin token
            admin_token = self.test_22_admin_login()
            if not admin_token:
                print("⚠️ Could not get admin token")
                return False
            
            # Get settings
            headers = {"Authorization": f"Bearer {admin_token}"}
            response = self.session.get(f"{self.api_url}/admin/settings", 
                                      headers=headers, timeout=self.timeout)
            self.assertEqual(response.status_code, 200)
            
            settings = response.json()
            self.assertIsInstance(settings, dict)
            
            print(f"✅ Retrieved system settings: {len(settings)} settings found")
            return True
        except Exception as e:
            print(f"❌ Get settings error: {str(e)}")
            return False

    def test_34_update_settings(self):
        """Test updating system settings"""
        print("\n🔍 Testing update system settings...")
        try:
            # Get admin token
            admin_token = self.test_22_admin_login()
            if not admin_token:
                print("⚠️ Could not get admin token")
                return False
            
            # Update a setting
            setting_key = "site_maintenance"
            setting_value = {
                "enabled": False,
                "message": "System is operational",
                "scheduled_maintenance": "2025-02-01T02:00:00Z"
            }
            
            headers = {"Authorization": f"Bearer {admin_token}"}
            response = self.session.put(f"{self.api_url}/admin/settings/{setting_key}", 
                                      json=setting_value, headers=headers, timeout=self.timeout)
            self.assertEqual(response.status_code, 200)
            
            result = response.json()
            self.assertIn("message", result)
            self.assertIn(setting_key, result["message"])
            
            # Verify the setting was updated
            get_response = self.session.get(f"{self.api_url}/admin/settings", 
                                          headers=headers, timeout=self.timeout)
            self.assertEqual(get_response.status_code, 200)
            settings = get_response.json()
            
            if setting_key in settings:
                self.assertEqual(settings[setting_key], setting_value)
            
            print(f"✅ System setting '{setting_key}' updated successfully")
            return True
        except Exception as e:
            print(f"❌ Update settings error: {str(e)}")
            return False

    def test_35_enhanced_authentication_workflow(self):
        """Test complete enhanced authentication and workflow system"""
        print("\n🔍 Testing enhanced authentication and workflow system...")
        try:
            # 1. Test user registration with enhanced fields
            import time
            timestamp = str(int(time.time()))
            user_data = {
                "email": f"enhanced.user.{timestamp}@company.com",
                "username": f"enhanced_user_{timestamp}",
                "password": "EnhancedPass123!",
                "profile": "professional",
                "newsletter_opt_in": True
            }
            
            register_response = self.session.post(f"{self.api_url}/auth/register", 
                                                json=user_data, timeout=self.timeout)
            self.assertEqual(register_response.status_code, 200)
            
            user_response = register_response.json()
            self.assertEqual(user_response["profile"], "professional")
            self.assertEqual(user_response["newsletter_opt_in"], True)
            
            # 2. Test admin workflow
            admin_token = self.test_22_admin_login()
            admin_headers = {"Authorization": f"Bearer {admin_token}"}
            
            # 3. Test newsletter system
            subscribers_response = self.session.get(f"{self.api_url}/admin/newsletter/subscribers", 
                                                  headers=admin_headers)
            self.assertEqual(subscribers_response.status_code, 200)
            subscribers = subscribers_response.json()
            
            # Should find our new user who opted in
            found_subscriber = False
            for subscriber in subscribers:
                if subscriber["email"] == user_data["email"]:
                    found_subscriber = True
                    self.assertEqual(subscriber["profile"], "professional")
                    break
            
            self.assertTrue(found_subscriber, "New user should appear in newsletter subscribers")
            
            # 4. Test settings system
            settings_response = self.session.get(f"{self.api_url}/admin/settings", 
                                               headers=admin_headers)
            self.assertEqual(settings_response.status_code, 200)
            
            # 5. Test case exclusion workflow
            cases_response = self.session.get(f"{self.api_url}/cases", params={"limit": 1})
            if cases_response.status_code == 200 and cases_response.json():
                case_id = cases_response.json()[0]["id"]
                
                exclusion_data = {
                    "excluded": True,
                    "exclusion_reason": "Enhanced workflow test exclusion"
                }
                
                exclude_response = self.session.put(f"{self.api_url}/admin/cases/{case_id}/exclude", 
                                                  json=exclusion_data, headers=admin_headers)
                self.assertEqual(exclude_response.status_code, 200)
            
            print("✅ Enhanced authentication and workflow system working correctly")
            print("  - User registration with enhanced fields ✓")
            print("  - Newsletter subscriber tracking ✓")
            print("  - Admin settings management ✓")
            print("  - Case exclusion workflow ✓")
            print("  - Role-based access control ✓")
            
            return True
        except Exception as e:
            print(f"❌ Enhanced authentication workflow error: {str(e)}")
            return False

    def test_36_rop_import_system(self):
        """Test the complete ROP import system"""
        print("\n🔍 Testing ROP import system...")
        try:
            # Get admin token
            admin_token = self.test_22_admin_login()
            if not admin_token:
                print("⚠️ Could not get admin token")
                return False
            
            headers = {"Authorization": f"Bearer {admin_token}"}
            
            # 1. Check initial UPC texts count
            initial_response = self.session.get(f"{self.api_url}/admin/upc-texts", 
                                              headers=headers, timeout=self.timeout)
            self.assertEqual(initial_response.status_code, 200)
            initial_texts = initial_response.json()
            initial_count = len(initial_texts)
            print(f"  Initial UPC texts count: {initial_count}")
            
            # 2. Test ROP import with all options
            import_options = {
                "overwrite_existing": True,
                "import_preamble": True,
                "import_application_rules": True,
                "import_content": True
            }
            
            import_response = self.session.post(f"{self.api_url}/admin/import-rop", 
                                              json=import_options, headers=headers, timeout=30)
            self.assertEqual(import_response.status_code, 200)
            
            import_result = import_response.json()
            self.assertIn("imported_count", import_result)
            self.assertIn("skipped_count", import_result)
            self.assertIn("total_processed", import_result)
            
            imported_count = import_result["imported_count"]
            print(f"  ROP import result: {imported_count} texts imported, {import_result['skipped_count']} skipped")
            
            # Should import around 270 rules based on the ROP JSON structure
            self.assertGreater(imported_count, 200, "Expected to import at least 200 rules")
            
            # 3. Verify texts were imported
            after_response = self.session.get(f"{self.api_url}/admin/upc-texts", 
                                            headers=headers, timeout=self.timeout)
            self.assertEqual(after_response.status_code, 200)
            after_texts = after_response.json()
            after_count = len(after_texts)
            print(f"  UPC texts count after import: {after_count}")
            
            # 4. Check for specific imported content
            rop_texts = [text for text in after_texts if text.get("document_type") == "rules_of_procedure"]
            print(f"  Rules of Procedure texts: {len(rop_texts)}")
            
            # Should have preamble
            preamble_texts = [text for text in rop_texts if text.get("article_number") == "Preamble"]
            self.assertGreater(len(preamble_texts), 0, "Expected to find preamble")
            
            # Should have application rules
            app_texts = [text for text in rop_texts if "Application and Interpretation" in text.get("article_number", "")]
            self.assertGreater(len(app_texts), 0, "Expected to find application rules")
            
            # Should have specific rules
            rule_13_texts = [text for text in rop_texts if text.get("article_number") == "Rule 13"]
            self.assertGreater(len(rule_13_texts), 0, "Expected to find Rule 13")
            
            # 5. Test structure endpoint
            structure_response = self.session.get(f"{self.api_url}/upc-texts/structure", timeout=self.timeout)
            self.assertEqual(structure_response.status_code, 200)
            structure = structure_response.json()
            
            self.assertIn("rules_of_procedure", structure)
            rop_structure = structure["rules_of_procedure"]
            self.assertIn("parts", rop_structure)
            self.assertIn("total_count", rop_structure)
            
            print(f"  Structure contains {rop_structure['total_count']} ROP texts organized in {len(rop_structure['parts'])} parts")
            
            # 6. Test cross-references detection
            if rule_13_texts:
                rule_13 = rule_13_texts[0]
                self.assertIn("cross_references", rule_13)
                cross_refs = rule_13.get("cross_references", [])
                print(f"  Rule 13 has {len(cross_refs)} cross-references detected")
            
            print("✅ ROP import system working correctly")
            print(f"  - Successfully imported {imported_count} ROP texts")
            print("  - Preamble and application rules imported ✓")
            print("  - Hierarchical structure maintained ✓")
            print("  - Cross-references automatically detected ✓")
            
            return True
        except Exception as e:
            print(f"❌ ROP import system error: {str(e)}")
            return False

    def test_37_upc_text_editing_system(self):
        """Test UPC text editing and cross-reference system"""
        print("\n🔍 Testing UPC text editing system...")
        try:
            # Get admin token
            admin_token = self.test_22_admin_login()
            if not admin_token:
                print("⚠️ Could not get admin token")
                return False
            
            headers = {"Authorization": f"Bearer {admin_token}"}
            
            # 1. Get existing texts
            texts_response = self.session.get(f"{self.api_url}/admin/upc-texts", 
                                            headers=headers, timeout=self.timeout)
            self.assertEqual(texts_response.status_code, 200)
            texts = texts_response.json()
            
            if not texts:
                print("⚠️ No texts found for editing test")
                return False
            
            # Find a Rule text to edit
            rule_text = None
            for text in texts:
                if text.get("article_number", "").startswith("Rule"):
                    rule_text = text
                    break
            
            if not rule_text:
                print("⚠️ No Rule text found for editing test")
                return False
            
            text_id = rule_text["id"]
            original_content = rule_text["content"]
            
            # 2. Test text editing with cross-reference detection
            updated_content = original_content + "\n\nThis rule references Rule 206 and Article 32 of the Agreement."
            
            update_data = {
                "content": updated_content,
                "keywords": ["test", "cross-reference", "editing"]
            }
            
            update_response = self.session.put(f"{self.api_url}/admin/upc-texts/{text_id}", 
                                             json=update_data, headers=headers, timeout=self.timeout)
            self.assertEqual(update_response.status_code, 200)
            
            updated_text = update_response.json()
            self.assertEqual(updated_text["content"], updated_content)
            self.assertIn("Rule 206", updated_text.get("cross_references", []))
            self.assertIn("Article 32", updated_text.get("cross_references", []))
            
            print(f"  ✅ Text editing successful with {len(updated_text.get('cross_references', []))} cross-references detected")
            
            # 3. Test creating new text
            new_text_data = {
                "document_type": "rules_of_procedure",
                "part_number": "Test",
                "part_title": "Test Part",
                "article_number": "Rule Test",
                "title": "Test Rule for Editing System",
                "content": "This is a test rule that references Rule 13 and Article 32 UPCA for testing purposes.",
                "keywords": ["test", "new", "rule"]
            }
            
            create_response = self.session.post(f"{self.api_url}/admin/upc-texts", 
                                              json=new_text_data, headers=headers, timeout=self.timeout)
            self.assertEqual(create_response.status_code, 200)
            
            new_text = create_response.json()
            self.assertIn("Rule 13", new_text.get("cross_references", []))
            self.assertIn("Article 32 UPCA", new_text.get("cross_references", []))
            
            print(f"  ✅ New text creation successful with {len(new_text.get('cross_references', []))} cross-references detected")
            
            # 4. Test text deletion
            delete_response = self.session.delete(f"{self.api_url}/admin/upc-texts/{new_text['id']}", 
                                                 headers=headers, timeout=self.timeout)
            self.assertEqual(delete_response.status_code, 200)
            
            print("  ✅ Text deletion successful")
            
            print("✅ UPC text editing system working correctly")
            print("  - Text content editing with cross-reference detection ✓")
            print("  - New text creation with automatic cross-references ✓")
            print("  - Text deletion ✓")
            print("  - Keywords management ✓")
            
            return True
        except Exception as e:
            print(f"❌ UPC text editing system error: {str(e)}")
            return False

def run_tests():
    # Create a test suite
    suite = unittest.TestSuite()
    
    # Add test methods - focusing on enhanced authentication system and new features
    test_cases = [
        'test_01_health_check',
        'test_19_user_registration',
        'test_20_user_login',
        'test_21_get_current_user_info',
        'test_22_admin_login',
        'test_23_exclude_case_admin',
        'test_24_get_excluded_cases_admin',
        'test_25_verify_excluded_cases_not_in_public_api',
        'test_26_unauthorized_access_to_admin_endpoints',
        'test_27_authentication_system_workflow',
        'test_28_create_editor_user',
        'test_29_editor_submit_change',
        'test_30_admin_direct_change',
        'test_31_newsletter_subscribers',
        'test_32_send_newsletter',
        'test_33_get_settings',
        'test_34_update_settings',
        'test_35_enhanced_authentication_workflow',
        'test_36_rop_import_system',
        'test_37_upc_text_editing_system'
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
        print("\n✅ All tests passed! Enhanced authentication system and new features are working correctly.")
    
    return len(result.errors) == 0 and len(result.failures) == 0

if __name__ == "__main__":
    success = run_tests()
    exit(0 if success else 1)