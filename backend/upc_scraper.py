import requests
from bs4 import BeautifulSoup
import json
import re
from datetime import datetime
from typing import List, Dict, Optional
import uuid
import time
import logging
from urllib.parse import urljoin, urlparse
from pymongo import MongoClient
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class UPCScraper:
    def __init__(self, mongodb_url: str = None):
        self.base_url = "https://www.unified-patent-court.org"
        self.decisions_url = f"{self.base_url}/en/decisions-and-orders"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
        # MongoDB connection
        if mongodb_url:
            self.client = MongoClient(mongodb_url)
            self.db = self.client['upc_legal']
            self.collection = self.db['cases']
        else:
            self.client = None
            self.db = None
            self.collection = None
    
    def scrape_decisions_page(self, page: int = 1) -> List[Dict]:
        """Scrape decisions from a specific page"""
        try:
            # Build page URL (pagination starts at 0)
            url = self.decisions_url
            if page > 1:
                url = f"{self.decisions_url}?page={page - 1}"

            # Request the page
            response = self.session.get(url, timeout=30)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'html.parser')
            decisions = []

            # The decisions are listed in a table with 50 rows per page
            decision_elements = soup.select('table.views-table tbody tr')

            if not decision_elements:
                # Fallback to previous generic selectors
                decision_elements = soup.find_all(['div', 'tr'], class_=re.compile(r'decision|case|order', re.I))

            if not decision_elements:
                decision_elements = soup.find_all(['div', 'article', 'section'],
                                                attrs={'class': re.compile(r'result|item|entry', re.I)})
            
            for element in decision_elements:
                try:
                    decision_data = self._extract_decision_data(element)
                    if decision_data:
                        decisions.append(decision_data)
                except Exception as e:
                    logger.warning(f"Error parsing decision element: {e}")
                    continue
            
            logger.info(f"Scraped {len(decisions)} decisions from page {page}")
            return decisions
            
        except Exception as e:
            logger.error(f"Error scraping decisions page {page}: {e}")
            return []
    
    def _extract_decision_data(self, element) -> Optional[Dict]:
        """Extract decision data from an HTML element"""
        try:
            # Extract text content
            text = element.get_text(strip=True)
            
            # Basic patterns for common data
            decision_data = {
                'id': str(uuid.uuid4()),
                'date': self._extract_date(text),
                'type': self._extract_type(text),
                'reference': self._extract_reference(text),
                'registry_number': self._extract_registry_number(text),
                'case_number': None,
                'court_division': self._extract_court_division(text),
                'type_of_action': self._extract_action_type(text),
                'language_of_proceedings': self._extract_language(text),
                'parties': self._extract_parties(text),
                'patent': self._extract_patent(text),
                'legal_norms': self._extract_legal_norms(text),
                'tags': self._extract_tags(text),
                'summary': self._extract_summary(text),
                'documents': self._extract_documents(element)
            }
            
            # Only return if we have essential data
            if decision_data['reference'] or decision_data['registry_number']:
                return decision_data
            
        except Exception as e:
            logger.warning(f"Error extracting decision data: {e}")
        
        return None
    
    def _extract_date(self, text: str) -> str:
        """Extract date from text"""
        # Look for date patterns
        date_patterns = [
            r'(\d{1,2}\s+\w+\s+\d{4})',  # "8 July 2025"
            r'(\d{1,2}/\d{1,2}/\d{4})',  # "08/07/2025"
            r'(\d{4}-\d{2}-\d{2})',      # "2025-07-08"
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, text, re.I)
            if match:
                try:
                    date_str = match.group(1)
                    # Try to parse and format consistently
                    if '/' in date_str:
                        parsed_date = datetime.strptime(date_str, '%m/%d/%Y')
                    elif '-' in date_str:
                        parsed_date = datetime.strptime(date_str, '%Y-%m-%d')
                    else:
                        # Try to parse natural language date
                        parsed_date = self._parse_natural_date(date_str)
                    
                    if parsed_date:
                        return parsed_date.strftime('%Y-%m-%d')
                except:
                    pass
        
        return datetime.now().strftime('%Y-%m-%d')
    
    def _parse_natural_date(self, date_str: str) -> Optional[datetime]:
        """Parse natural language dates like '8 July 2025'"""
        try:
            months = {
                'january': 1, 'february': 2, 'march': 3, 'april': 4,
                'may': 5, 'june': 6, 'july': 7, 'august': 8,
                'september': 9, 'october': 10, 'november': 11, 'december': 12
            }
            
            parts = date_str.lower().split()
            if len(parts) >= 3:
                day = int(parts[0])
                month = months.get(parts[1].lower())
                year = int(parts[2])
                
                if month:
                    return datetime(year, month, day)
        except:
            pass
        
        return None
    
    def _extract_type(self, text: str) -> str:
        """Extract decision type"""
        if re.search(r'\border\b', text, re.I):
            return "Order"
        elif re.search(r'\bdecision\b', text, re.I):
            return "Decision"
        return "Order"
    
    def _extract_reference(self, text: str) -> str:
        """Extract reference number"""
        patterns = [
            r'(ORD_\d+/\d+)',  # ORD_32533/2025
            r'(DEC_\d+/\d+)',  # DEC_12345/2025
            r'(UPC_\w+_\d+)',  # UPC_CFI_123
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.I)
            if match:
                return match.group(1)
        
        return f"REF_{uuid.uuid4().hex[:8]}"
    
    def _extract_registry_number(self, text: str) -> str:
        """Extract registry number"""
        patterns = [
            r'(App_\d+/\d+)',  # App_31860/2025
            r'(REG_\d+/\d+)',  # REG_12345/2025
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.I)
            if match:
                return match.group(1)
        
        return f"APP_{uuid.uuid4().hex[:8]}"
    
    def _extract_court_division(self, text: str) -> str:
        """Extract court division"""
        patterns = [
            r'(Milano\s*\([^)]+\))',
            r'(München\s*\([^)]+\))',
            r'(Paris\s*\([^)]+\))',
            r'(The\s+Hague\s*\([^)]+\))',
            r'(Düsseldorf\s*\([^)]+\))',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.I)
            if match:
                return match.group(1)
        
        return "Court of Appeal"
    
    def _extract_action_type(self, text: str) -> str:
        """Extract type of action"""
        if re.search(r'patent\s+infringement', text, re.I):
            return "Patent infringement"
        elif re.search(r'revocation', text, re.I):
            return "Patent revocation"
        elif re.search(r'preliminary\s+injunction', text, re.I):
            return "Preliminary injunction"
        return "Generic application"
    
    def _extract_language(self, text: str) -> str:
        """Extract language of proceedings"""
        if re.search(r'\bEnglish\b|\bEN\b', text, re.I):
            return "EN"
        elif re.search(r'\bGerman\b|\bDE\b', text, re.I):
            return "DE"
        elif re.search(r'\bFrench\b|\bFR\b', text, re.I):
            return "FR"
        elif re.search(r'\bItalian\b|\bIT\b', text, re.I):
            return "IT"
        return "EN"
    
    def _extract_parties(self, text: str) -> List[str]:
        """Extract party names"""
        parties = []
        
        # Look for common party patterns
        patterns = [
            r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:AG|GmbH|Ltd|Inc|Corp|SA|SRL|s\.r\.l\.|s\.p\.a\.))',
            r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Limited|Corporation|Company))',
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text)
            parties.extend(matches)
        
        # Remove duplicates and return
        return list(set(parties))[:5]  # Limit to 5 parties
    
    def _extract_patent(self, text: str) -> Optional[str]:
        """Extract patent number"""
        pattern = r'(EP\d+|US\d+|WO\d+)'
        match = re.search(pattern, text, re.I)
        return match.group(1) if match else None
    
    def _extract_legal_norms(self, text: str) -> List[str]:
        """Extract legal norms"""
        norms = []
        patterns = [
            r'(Art\.\s*\d+\s*\w*)',
            r'(Rule\s*\d+\s*\w*)',
            r'(Article\s*\d+)',
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text, re.I)
            norms.extend(matches)
        
        return list(set(norms))
    
    def _extract_tags(self, text: str) -> List[str]:
        """Extract relevant tags"""
        tags = []
        tag_keywords = [
            'patent infringement', 'preliminary injunction', 'revocation',
            'counterclaim', 'language change', 'procedural order',
            'costs', 'damages', 'validity', 'enforcement'
        ]
        
        for keyword in tag_keywords:
            if re.search(rf'\b{re.escape(keyword)}\b', text, re.I):
                tags.append(keyword)
        
        return tags
    
    def _extract_summary(self, text: str) -> str:
        """Extract or generate summary"""
        # Take first 500 characters as summary
        summary = text[:500].strip()
        if len(text) > 500:
            summary += "..."
        
        return summary
    
    def _extract_documents(self, element) -> List[Dict]:
        """Extract document links"""
        documents = []
        
        # Look for PDF links
        links = element.find_all('a', href=True)
        for link in links:
            href = link['href']
            if href.endswith('.pdf') or 'pdf' in href.lower():
                doc_id = str(uuid.uuid4())
                documents.append({
                    'id': doc_id,
                    'title': link.get_text(strip=True) or "Download Document",
                    'url': urljoin(self.base_url, href),
                    'language': "EN",
                    'case_id': ""
                })
        
        return documents
    
    def scrape_all_decisions(self, max_pages: Optional[int] = None) -> List[Dict]:
        """Scrape all decisions from multiple pages until none are left"""
        all_decisions = []
        page = 1
        consecutive_empty_pages = 0
        max_consecutive_empty = 3  # Stop after 3 consecutive empty pages

        while consecutive_empty_pages < max_consecutive_empty:
            # Only respect max_pages if it's explicitly set (for testing)
            if max_pages is not None and page > max_pages:
                break

            logger.info(f"Scraping page {page}...")
            decisions = self.scrape_decisions_page(page)

            if not decisions:
                consecutive_empty_pages += 1
                logger.info(f"No decisions found on page {page} (consecutive empty: {consecutive_empty_pages})")
                if consecutive_empty_pages >= max_consecutive_empty:
                    logger.info(f"Stopping after {max_consecutive_empty} consecutive empty pages")
                    break
            else:
                consecutive_empty_pages = 0  # Reset counter when we find decisions
                all_decisions.extend(decisions)
                logger.info(f"Total decisions collected so far: {len(all_decisions)}")

            page += 1
            # Be respectful with requests
            time.sleep(2)

        logger.info(f"Scraping completed. Total decisions found: {len(all_decisions)}")
        return all_decisions
    
    def save_to_mongodb(self, decisions: List[Dict]) -> int:
        """Save decisions to MongoDB with intelligent duplicate handling"""
        if self.collection is None:
            logger.error("MongoDB not configured")
            return 0
        
        saved_count = 0
        updated_count = 0
        skipped_count = 0
        
        for decision in decisions:
            try:
                # Ensure _id is a string UUID
                decision['_id'] = decision.pop('id')
                
                # Check if decision already exists by reference
                existing_decision = self.collection.find_one({'reference': decision['reference']})
                
                if existing_decision:
                    # Decision exists, check if we should update
                    # Only update if the new decision has more data (longer summary, more documents, etc.)
                    should_update = False
                    
                    if len(decision.get('summary', '')) > len(existing_decision.get('summary', '')):
                        should_update = True
                    elif len(decision.get('documents', [])) > len(existing_decision.get('documents', [])):
                        should_update = True
                    elif len(decision.get('parties', [])) > len(existing_decision.get('parties', [])):
                        should_update = True
                    
                    if should_update:
                        # Preserve any custom fields that might have been added manually
                        preserved_fields = ['custom_summary', 'internal_notes', 'admin_comments', 'user_tags']
                        for field in preserved_fields:
                            if field in existing_decision:
                                decision[field] = existing_decision[field]
                        
                        self.collection.update_one(
                            {'reference': decision['reference']},
                            {'$set': decision}
                        )
                        updated_count += 1
                        logger.debug(f"Updated decision {decision['reference']}")
                    else:
                        skipped_count += 1
                        logger.debug(f"Skipped decision {decision['reference']} (no improvements)")
                else:
                    # New decision, insert it
                    self.collection.insert_one(decision)
                    saved_count += 1
                    logger.debug(f"Saved new decision {decision['reference']}")
                    
            except Exception as e:
                logger.error(f"Error saving decision {decision.get('reference', 'unknown')}: {e}")
        
        logger.info(f"Database update completed: {saved_count} new, {updated_count} updated, {skipped_count} skipped")
        return saved_count + updated_count
    
    def update_database(self, max_pages: Optional[int] = None) -> int:
        """Update database with latest decisions - scrapes all pages if max_pages is None"""
        logger.info("Starting UPC decisions update...")

        # If max_pages is None, scrape all available pages
        decisions = self.scrape_all_decisions(max_pages)
        
        if decisions:
            count = self.save_to_mongodb(decisions)
            logger.info(f"Updated database with {count} decisions")
            return count
        else:
            logger.warning("No decisions found to update")
            return 0

def main():
    """Main function for testing"""
    mongodb_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
    scraper = UPCScraper(mongodb_url)
    
    # Test scraping
    decisions = scraper.scrape_decisions_page(1)
    print(f"Found {len(decisions)} decisions")
    
    for decision in decisions[:3]:  # Show first 3
        print(json.dumps(decision, indent=2))

if __name__ == "__main__":    main()