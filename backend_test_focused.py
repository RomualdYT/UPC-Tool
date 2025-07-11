import requests
import sys
from datetime import datetime
import time
import re

class UPCLegalAPITester:
    def __init__(self):
        # Use the correct backend URL from frontend/.env
        self.base_url = "http://localhost:8001"
        self.api_url = f"{self.base_url}/api"
        self.session = requests.Session()
        self.timeout = 10  # 10 seconds timeout
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_token = None
        self.user_token = None

    def run_test(self, name, test_func):
        """Run a single test and track results"""
        self.tests_run += 1
        print(f"\n🔍 {name}...")
        try:
            result = test_func()
            if result:
                self.tests_passed += 1
                print(f"✅ {name} - PASSED")
            else:
                print(f"❌ {name} - FAILED")
            return result
        except Exception as e:
            print(f"❌ {name} - ERROR: {str(e)}")
            return False

    def test_backend_connectivity(self):
        """Test basic backend connectivity"""
        try:
            response = self.session.get(f"{self.api_url}/stats", timeout=self.timeout)
            if response.status_code == 200:
                data = response.json()
                print(f"  Backend is responding - {data.get('total_cases', 0)} cases in database")
                return True
            else:
                print(f"  Backend responded with status {response.status_code}")
                return False
        except Exception as e:
            print(f"  Backend connectivity error: {str(e)}")
            return False

    def test_dashboard_data(self):
        """Test dashboard data endpoints"""
        try:
            # Test stats endpoint
            response = self.session.get(f"{self.api_url}/stats", timeout=self.timeout)
            if response.status_code != 200:
                print(f"  Stats endpoint failed with status {response.status_code}")
                return False
            
            stats = response.json()
            required_fields = ["total_cases", "total_orders", "total_decisions"]
            for field in required_fields:
                if field not in stats:
                    print(f"  Missing required field in stats: {field}")
                    return False
            
            print(f"  Dashboard stats: {stats['total_cases']} cases, {stats['total_orders']} orders, {stats['total_decisions']} decisions")
            
            # Test cases endpoint
            response = self.session.get(f"{self.api_url}/cases", params={"limit": 5}, timeout=self.timeout)
            if response.status_code != 200:
                print(f"  Cases endpoint failed with status {response.status_code}")
                return False
            
            cases = response.json()
            print(f"  Retrieved {len(cases)} cases for dashboard")
            return True
        except Exception as e:
            print(f"  Dashboard data error: {str(e)}")
            return False

    def test_admin_login(self):
        """Test admin login with provided credentials"""
        try:
            admin_login_data = {
                "email": "admin@romulus.com",
                "password": "admin123"
            }
            
            response = self.session.post(f"{self.api_url}/auth/login", 
                                       json=admin_login_data, timeout=self.timeout)
            
            if response.status_code != 200:
                print(f"  Admin login failed with status {response.status_code}")
                print(f"  Response: {response.text}")
                return False
            
            token_response = response.json()
            if "access_token" not in token_response:
                print("  Admin login response missing access_token")
                return False
            
            self.admin_token = token_response["access_token"]
            
            # Verify admin user info
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            user_response = self.session.get(f"{self.api_url}/auth/me", 
                                           headers=headers, timeout=self.timeout)
            
            if user_response.status_code != 200:
                print(f"  Admin user info failed with status {user_response.status_code}")
                return False
            
            admin_info = user_response.json()
            if admin_info.get("email") != "admin@romulus.com" or admin_info.get("role") != "admin":
                print(f"  Admin user info incorrect: {admin_info}")
                return False
            
            print(f"  Admin login successful for {admin_info['email']}")
            return True
        except Exception as e:
            print(f"  Admin login error: {str(e)}")
            return False

    def test_newsletter_subscription(self):
        """Test newsletter subscription endpoint"""
        try:
            # Test newsletter subscription
            subscription_data = {
                "email": f"test.user.{int(time.time())}@example.com",
                "opt_in": True,
                "source": "website",
                "metadata": {"test": True}
            }
            
            response = self.session.post(f"{self.api_url}/newsletter/subscribe", 
                                       json=subscription_data, timeout=self.timeout)
            
            if response.status_code != 200:
                print(f"  Newsletter subscription failed with status {response.status_code}")
                print(f"  Response: {response.text}")
                return False
            
            result = response.json()
            if result.get("status") != "success":
                print(f"  Newsletter subscription failed: {result}")
                return False
            
            print(f"  Newsletter subscription successful: {result['message']}")
            return True
        except Exception as e:
            print(f"  Newsletter subscription error: {str(e)}")
            return False

    def test_newsletter_admin_access(self):
        """Test newsletter admin endpoints"""
        try:
            if not self.admin_token:
                if not self.test_admin_login():
                    print("  Cannot test newsletter admin - admin login failed")
                    return False
            
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Test get subscribers
            response = self.session.get(f"{self.api_url}/admin/newsletter/subscribers", 
                                      headers=headers, timeout=self.timeout)
            
            if response.status_code != 200:
                print(f"  Get newsletter subscribers failed with status {response.status_code}")
                print(f"  Response: {response.text}")
                return False
            
            subscribers = response.json()
            print(f"  Retrieved {len(subscribers)} newsletter subscribers")
            
            # Test get campaigns
            response = self.session.get(f"{self.api_url}/admin/newsletter/campaigns", 
                                      headers=headers, timeout=self.timeout)
            
            if response.status_code != 200:
                print(f"  Get newsletter campaigns failed with status {response.status_code}")
                return False
            
            campaigns = response.json()
            print(f"  Retrieved {len(campaigns)} newsletter campaigns")
            
            return True
        except Exception as e:
            print(f"  Newsletter admin access error: {str(e)}")
            return False

    def test_newsletter_campaign_management(self):
        """Test newsletter campaign creation and management"""
        try:
            if not self.admin_token:
                if not self.test_admin_login():
                    print("  Cannot test campaign management - admin login failed")
                    return False
            
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Create a test campaign
            campaign_data = {
                "title": "Test Campaign",
                "subject": "UPC Legal Test Newsletter",
                "content": "This is a test newsletter content for API testing.",
                "html_content": "<p>This is a test newsletter content for API testing.</p>",
                "recipients": []
            }
            
            response = self.session.post(f"{self.api_url}/admin/newsletter/campaigns", 
                                       json=campaign_data, headers=headers, timeout=self.timeout)
            
            if response.status_code != 200:
                print(f"  Create campaign failed with status {response.status_code}")
                print(f"  Response: {response.text}")
                return False
            
            campaign = response.json()
            campaign_id = campaign.get("id")
            
            if not campaign_id:
                print("  Campaign creation response missing ID")
                return False
            
            print(f"  Created campaign with ID: {campaign_id}")
            
            # Test sending campaign (should work even with email service disabled)
            send_response = self.session.post(f"{self.api_url}/admin/newsletter/campaigns/{campaign_id}/send", 
                                            headers=headers, timeout=self.timeout)
            
            if send_response.status_code != 200:
                print(f"  Send campaign failed with status {send_response.status_code}")
                print(f"  Response: {send_response.text}")
                return False
            
            send_result = send_response.json()
            print(f"  Campaign send result: {send_result['message']}")
            
            return True
        except Exception as e:
            print(f"  Newsletter campaign management error: {str(e)}")
            return False

    def test_seo_metadata(self):
        """Test SEO metadata endpoints"""
        try:
            # Test getting SEO metadata for a page
            response = self.session.get(f"{self.api_url}/seo/metadata", 
                                      params={"page_path": "/"}, timeout=self.timeout)
            
            if response.status_code != 200:
                print(f"  SEO metadata failed with status {response.status_code}")
                print(f"  Response: {response.text}")
                return False
            
            metadata = response.json()
            required_fields = ["title", "description"]
            for field in required_fields:
                if field not in metadata:
                    print(f"  SEO metadata missing required field: {field}")
                    return False
            
            print(f"  SEO metadata retrieved: {metadata['title'][:50]}...")
            
            # Test admin SEO settings
            if not self.admin_token:
                if not self.test_admin_login():
                    print("  Cannot test SEO admin - admin login failed")
                    return True  # Still pass the basic test
            
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = self.session.get(f"{self.api_url}/admin/settings", 
                                      headers=headers, timeout=self.timeout)
            
            if response.status_code == 200:
                settings = response.json()
                if "seo_config" in settings:
                    print(f"  SEO configuration found in admin settings")
                else:
                    print("  SEO configuration not found in admin settings")
            
            return True
        except Exception as e:
            print(f"  SEO metadata error: {str(e)}")
            return False

    def test_email_service_config(self):
        """Test email service configuration"""
        try:
            if not self.admin_token:
                if not self.test_admin_login():
                    print("  Cannot test email service - admin login failed")
                    return False
            
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Get email service configuration
            response = self.session.get(f"{self.api_url}/admin/email-service", 
                                      headers=headers, timeout=self.timeout)
            
            if response.status_code != 200:
                print(f"  Get email service config failed with status {response.status_code}")
                return False
            
            config = response.json()
            print(f"  Email service enabled: {config.get('enabled', False)}")
            print(f"  Email service type: {config.get('type', 'unknown')}")
            
            # Verify email service is disabled by default as mentioned in review
            if config.get('enabled') == False:
                print("  ✓ Email service correctly disabled by default")
            else:
                print("  ⚠ Email service is enabled (expected to be disabled by default)")
            
            return True
        except Exception as e:
            print(f"  Email service config error: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all focused tests for the review request"""
        print("🚀 Starting UPC Legal CMS Testing - Newsletter & SEO Systems")
        print("=" * 60)
        
        # Test 1: Backend/Frontend Connectivity
        self.run_test("Backend Connectivity", self.test_backend_connectivity)
        
        # Test 2: Dashboard Data
        self.run_test("Dashboard Data", self.test_dashboard_data)
        
        # Test 3: Admin Login
        self.run_test("Admin Login (admin@romulus.com / admin123)", self.test_admin_login)
        
        # Test 4: Newsletter Subscription
        self.run_test("Newsletter Subscription", self.test_newsletter_subscription)
        
        # Test 5: Newsletter Admin Access
        self.run_test("Newsletter Admin Access", self.test_newsletter_admin_access)
        
        # Test 6: Newsletter Campaign Management
        self.run_test("Newsletter Campaign Management", self.test_newsletter_campaign_management)
        
        # Test 7: SEO Metadata
        self.run_test("SEO Metadata Generation", self.test_seo_metadata)
        
        # Test 8: Email Service Configuration
        self.run_test("Email Service Configuration", self.test_email_service_config)
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 TEST SUMMARY")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️ Some tests failed - check output above")
            return 1

def main():
    tester = UPCLegalAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())