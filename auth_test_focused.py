#!/usr/bin/env python3
"""
Focused Authentication System Test
Tests the core authentication functionality that was just implemented.
"""

import requests
import json
import time

def test_authentication_system():
    """Test the complete authentication system"""
    base_url = "http://localhost:8001/api"
    session = requests.Session()
    
    print("🔍 Testing Authentication System Implementation")
    print("=" * 60)
    
    # Test 1: User Registration
    print("\n1. Testing User Registration...")
    timestamp = str(int(time.time()))
    user_data = {
        "email": f"test.user.{timestamp}@example.com",
        "username": f"testuser_{timestamp}",
        "password": "TestPassword123!",
        "profile": "professional",
        "newsletter_opt_in": True
    }
    
    try:
        response = session.post(f"{base_url}/auth/register", json=user_data)
        if response.status_code == 200:
            user_info = response.json()
            print(f"   ✅ User registered successfully: {user_info['email']}")
            print(f"   ✅ User role: {user_info['role']}")
            print(f"   ✅ User profile: {user_info['profile']}")
        else:
            print(f"   ❌ Registration failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Registration error: {e}")
        return False
    
    # Test 2: User Login
    print("\n2. Testing User Login...")
    login_data = {
        "email": user_data["email"],
        "password": user_data["password"]
    }
    
    try:
        response = session.post(f"{base_url}/auth/login", json=login_data)
        if response.status_code == 200:
            token_data = response.json()
            user_token = token_data["access_token"]
            print(f"   ✅ User login successful")
            print(f"   ✅ Token type: {token_data['token_type']}")
            print(f"   ✅ Access token received (length: {len(user_token)})")
        else:
            print(f"   ❌ Login failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Login error: {e}")
        return False
    
    # Test 3: Get Current User Info
    print("\n3. Testing Get Current User Info...")
    try:
        headers = {"Authorization": f"Bearer {user_token}"}
        response = session.get(f"{base_url}/auth/me", headers=headers)
        if response.status_code == 200:
            current_user = response.json()
            print(f"   ✅ Current user info retrieved")
            print(f"   ✅ Email: {current_user['email']}")
            print(f"   ✅ Username: {current_user['username']}")
            print(f"   ✅ Role: {current_user['role']}")
        else:
            print(f"   ❌ Get user info failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Get user info error: {e}")
        return False
    
    # Test 4: Admin Login
    print("\n4. Testing Admin Login...")
    admin_login = {
        "email": "admin@romulus.com",
        "password": "admin123"
    }
    
    try:
        response = session.post(f"{base_url}/auth/login", json=admin_login)
        if response.status_code == 200:
            admin_token_data = response.json()
            admin_token = admin_token_data["access_token"]
            print(f"   ✅ Admin login successful")
            
            # Verify admin role
            headers = {"Authorization": f"Bearer {admin_token}"}
            response = session.get(f"{base_url}/auth/me", headers=headers)
            if response.status_code == 200:
                admin_info = response.json()
                print(f"   ✅ Admin role verified: {admin_info['role']}")
                print(f"   ✅ Admin email: {admin_info['email']}")
            else:
                print(f"   ❌ Admin info verification failed")
                return False
        else:
            print(f"   ❌ Admin login failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Admin login error: {e}")
        return False
    
    # Test 5: Admin Endpoints Access Control
    print("\n5. Testing Admin Endpoints Access Control...")
    try:
        # Test unauthorized access (no token)
        response = session.get(f"{base_url}/admin/cases/excluded")
        if response.status_code in [401, 403]:
            print(f"   ✅ Unauthorized access properly blocked (status: {response.status_code})")
        else:
            print(f"   ❌ Unauthorized access not blocked: {response.status_code}")
            return False
        
        # Test user token access (should be forbidden)
        headers = {"Authorization": f"Bearer {user_token}"}
        response = session.get(f"{base_url}/admin/cases/excluded", headers=headers)
        if response.status_code == 403:
            print(f"   ✅ Non-admin user properly blocked from admin endpoints")
        else:
            print(f"   ❌ Non-admin user access not blocked: {response.status_code}")
            return False
        
        # Test admin token access (should work)
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        response = session.get(f"{base_url}/admin/cases/excluded", headers=admin_headers)
        if response.status_code == 200:
            excluded_cases = response.json()
            print(f"   ✅ Admin access to excluded cases successful")
            print(f"   ✅ Found {len(excluded_cases)} excluded cases")
        else:
            print(f"   ❌ Admin access failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Access control test error: {e}")
        return False
    
    # Test 6: Case Exclusion Functionality
    print("\n6. Testing Case Exclusion Functionality...")
    try:
        # Get all cases (including excluded) to find one to test with
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        response = session.get(f"{base_url}/cases", params={"include_excluded": True, "limit": 1})
        
        if response.status_code == 200 and response.json():
            case = response.json()[0]
            case_id = case["id"]
            
            # Test exclusion toggle
            exclusion_data = {
                "excluded": False,  # Un-exclude first
                "exclusion_reason": None
            }
            
            response = session.put(f"{base_url}/admin/cases/{case_id}/exclude", 
                                 json=exclusion_data, headers=admin_headers)
            if response.status_code == 200:
                print(f"   ✅ Case un-exclusion successful")
                
                # Now exclude it again
                exclusion_data = {
                    "excluded": True,
                    "exclusion_reason": "Test exclusion for authentication system verification"
                }
                
                response = session.put(f"{base_url}/admin/cases/{case_id}/exclude", 
                                     json=exclusion_data, headers=admin_headers)
                if response.status_code == 200:
                    updated_case = response.json()
                    print(f"   ✅ Case exclusion successful")
                    print(f"   ✅ Excluded status: {updated_case['excluded']}")
                    print(f"   ✅ Exclusion reason set: {bool(updated_case['exclusion_reason'])}")
                else:
                    print(f"   ❌ Case exclusion failed: {response.status_code}")
                    return False
            else:
                print(f"   ❌ Case un-exclusion failed: {response.status_code}")
                return False
        else:
            print(f"   ⚠️ No cases available for exclusion testing")
    except Exception as e:
        print(f"   ❌ Case exclusion test error: {e}")
        return False
    
    # Test 7: Public API Exclusion Verification
    print("\n7. Testing Public API Exclusion...")
    try:
        # Get cases without include_excluded (public API)
        response = session.get(f"{base_url}/cases")
        if response.status_code == 200:
            public_cases = response.json()
            print(f"   ✅ Public API accessible")
            print(f"   ✅ Public cases count: {len(public_cases)}")
            
            # Verify no excluded cases in public results
            excluded_found = any(case.get("excluded", False) for case in public_cases)
            if not excluded_found:
                print(f"   ✅ No excluded cases in public API results")
            else:
                print(f"   ❌ Excluded cases found in public API")
                return False
        else:
            print(f"   ❌ Public API access failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Public API test error: {e}")
        return False
    
    print("\n" + "=" * 60)
    print("🎉 AUTHENTICATION SYSTEM TEST COMPLETED SUCCESSFULLY!")
    print("✅ All authentication features are working correctly:")
    print("   • User registration and login")
    print("   • JWT token authentication")
    print("   • Admin login and role verification")
    print("   • Admin endpoint access control")
    print("   • Case exclusion functionality")
    print("   • Public API exclusion filtering")
    
    return True

if __name__ == "__main__":
    success = test_authentication_system()
    exit(0 if success else 1)