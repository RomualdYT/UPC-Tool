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

            # Find the decisions table - it's a simple table without specific class
            table = soup.find('table')
            if not table:
                logger.warning(f"No table found on page {page}")
                return []

            # Get all table rows from tbody, skip the header row
            tbody = table.find('tbody')
            if tbody:
                decision_rows = tbody.find_all('tr')
            else:
                # Fallback if no tbody
                decision_rows = table.find_all('tr')[1:]  # Skip header row
            
            logger.info(f"Found {len(decision_rows)} table rows on page {page}")
            
            # Keep track of unique references to avoid duplicates within the same page
            seen_references = set()
            
            for row in decision_rows:
                try:
                    decision_data = self._extract_decision_from_row(row)
                    if decision_data and decision_data.get('registry_number'):
                        # Use registry_number as unique identifier
                        ref = decision_data['registry_number']
                        if ref not in seen_references:
                            seen_references.add(ref)
                            decisions.append(decision_data)
                        else:
                            logger.debug(f"Skipping duplicate reference {ref} on page {page}")
                except Exception as e:
                    logger.warning(f"Error parsing decision row: {e}")
                    continue
            
            if len(decisions) > 0:
                logger.info(f"Scraped {len(decisions)} unique decisions from page {page}")
            else:
                logger.info(f"No valid decisions found on page {page}")
                
            return decisions
            
        except Exception as e:
            logger.error(f"Error scraping decisions page {page}: {e}")
            return []
    
    def _extract_decision_from_row(self, row) -> Optional[Dict]:
        """Extract decision data from a table row"""
        try:
            # Get all table cells from the row
            cells = row.find_all(['td', 'th'])
            
            if len(cells) < 6:  # Should have 6 columns: Date, Registry/Order ref, Court, Type, Parties, Document
                logger.debug(f"Row has only {len(cells)} cells, skipping")
                return None
            
            # Extract data from each column
            date_cell = cells[0]
            registry_cell = cells[1]
            court_cell = cells[2]
            type_cell = cells[3]
            parties_cell = cells[4]
            document_cell = cells[5]
            
            # Extract date
            date_text = date_cell.get_text(strip=True)
            formatted_date = self._parse_date_from_text(date_text)
            
            # Extract registry number and order reference
            registry_text = registry_cell.get_text(strip=True)
            # Remove "Full Details" text if present
            registry_text = registry_text.replace('Full Details', '').strip()
            
            # Split by newlines first, then try to parse each line
            registry_lines = [line.strip() for line in registry_text.split('\n') if line.strip()]
            
            registry_number = ""
            order_reference = ""
            
            # Parse registry and order references
            for line in registry_lines:
                # Look for App_ pattern for registry number
                app_match = re.search(r'(App_\d+/\d+)', line)
                if app_match:
                    registry_number = app_match.group(1)
                
                # Look for ORD_ or DEC_ pattern for order reference
                ord_match = re.search(r'((?:ORD|DEC)_\d+/\d+)', line)
                if ord_match:
                    order_reference = ord_match.group(1)
                
                # Handle other patterns
                if not registry_number:
                    cc_match = re.search(r'(CC_\d+/\d+)', line)
                    if cc_match:
                        registry_number = cc_match.group(1)
                
                act_match = re.search(r'(ACT_\d+/\d+)', line)
                if act_match:
                    registry_number = act_match.group(1)
                
                apl_match = re.search(r'(APL_\d+/\d+)', line)
                if apl_match:
                    registry_number = apl_match.group(1)
            
            # Extract court division
            court_division = court_cell.get_text(strip=True)
            
            # Extract type of action
            type_of_action = type_cell.get_text(strip=True)
            
            # Extract parties
            parties_text = parties_cell.get_text(strip=True)
            parties = self._parse_parties_from_text(parties_text)
            
            # Extract documents
            documents = self._extract_documents_from_cell(document_cell)
            
            # Extract the "Full Details" link
            detail_link = self._extract_detail_link_from_cell(registry_cell)
            
            # Get additional information from detail page
            detailed_info = {}
            if detail_link:
                detailed_info = self._scrape_detail_page(detail_link)
            
            # Create decision data
            decision_data = {
                'id': str(uuid.uuid4()),
                'date': formatted_date,
                'type': self._determine_decision_type(order_reference, type_of_action),
                'registry_number': registry_number,
                'order_reference': order_reference,
                'case_number': None,
                'court_division': self._format_court_division(court_division),
                'type_of_action': type_of_action,
                'language_of_proceedings': detailed_info.get('language_of_proceedings', 'EN'),
                'parties': parties,
                'patent': self._extract_patent_from_text(parties_text),
                'legal_norms': detailed_info.get('legal_norms', []),
                'tags': detailed_info.get('tags', []),
                'keywords': detailed_info.get('keywords', []),
                'headnotes': detailed_info.get('headnotes', ''),
                'summary': detailed_info.get('summary', self._create_summary(parties_text, type_of_action, court_division)),
                'documents': documents
            }
            
            # Validate essential fields
            if not decision_data['registry_number'] and not decision_data['order_reference']:
                logger.debug("No registry number or order reference found")
                return None
                
            if not decision_data['date']:
                logger.debug("No date found")
                return None
            
            return decision_data
            
        except Exception as e:
            logger.warning(f"Error extracting decision from row: {e}")
            return None

    
    def _parse_date_from_text(self, date_text: str) -> str:
        """Parse date from text like '10 July 2025'"""
        try:
            # Remove any extra whitespace
            date_text = date_text.strip()
            
            # Handle format like "10 July 2025"
            if re.match(r'\d{1,2}\s+\w+\s+\d{4}', date_text):
                try:
                    parsed_date = datetime.strptime(date_text, '%d %B %Y')
                    return parsed_date.strftime('%Y-%m-%d')
                except ValueError:
                    # Try different format
                    try:
                        parsed_date = datetime.strptime(date_text, '%d %b %Y')
                        return parsed_date.strftime('%Y-%m-%d')
                    except ValueError:
                        pass
            
            # Handle format like "2025-07-10"
            if re.match(r'\d{4}-\d{2}-\d{2}', date_text):
                return date_text
            
            # Handle format like "10/07/2025"
            if re.match(r'\d{1,2}/\d{1,2}/\d{4}', date_text):
                try:
                    parsed_date = datetime.strptime(date_text, '%d/%m/%Y')
                    return parsed_date.strftime('%Y-%m-%d')
                except ValueError:
                    pass
            
            logger.warning(f"Could not parse date: {date_text}")
            return datetime.now().strftime('%Y-%m-%d')
            
        except Exception as e:
            logger.warning(f"Error parsing date '{date_text}': {e}")
            return datetime.now().strftime('%Y-%m-%d')
    
    def _parse_parties_from_text(self, parties_text: str) -> List[str]:
        """Parse parties from text like 'Company A v. Company B'"""
        try:
            parties = []
            
            # Handle the case where there's no space before v.
            if 'v.' in parties_text:
                # Add space before v. if missing
                parties_text = re.sub(r'([a-zA-Z])v\.', r'\1 v.', parties_text)
                
                parts = parties_text.split(' v. ')
                for part in parts:
                    # Split on line breaks for multiple parties on same side
                    sub_parties = part.split('\n')
                    for sub_party in sub_parties:
                        party = sub_party.strip()
                        if party and party not in parties:
                            parties.append(party)
            else:
                # Split on line breaks
                sub_parties = parties_text.split('\n')
                for sub_party in sub_parties:
                    party = sub_party.strip()
                    if party and party not in parties:
                        parties.append(party)
            
            return parties[:10]  # Limit to 10 parties
            
        except Exception as e:
            logger.warning(f"Error parsing parties '{parties_text}': {e}")
            return []
    
    def _extract_documents_from_cell(self, cell) -> List[Dict]:
        """Extract document links from a table cell"""
        documents = []
        try:
            # Find all links in the cell
            links = cell.find_all('a', href=True)
            for link in links:
                href = link['href']
                if href.endswith('.pdf') or 'pdf' in href.lower():
                    doc_id = str(uuid.uuid4())
                    documents.append({
                        'id': doc_id,
                        'title': link.get_text(strip=True) or "Download Document",
                        'url': urljoin(self.base_url, href),
                        'language': self._extract_language_from_filename(href),
                        'case_id': ""
                    })
        except Exception as e:
            logger.warning(f"Error extracting documents from cell: {e}")
        
        return documents
    
    def _extract_detail_link_from_cell(self, cell) -> Optional[str]:
        """Extract the 'Full Details' link from a cell"""
        try:
            links = cell.find_all('a', href=True)
            for link in links:
                if 'Full Details' in link.get_text(strip=True):
                    href = link['href']
                    return urljoin(self.base_url, href)
        except Exception as e:
            logger.debug(f"Error extracting detail link: {e}")
        
        return None
    
    def _determine_decision_type(self, order_reference: str, type_of_action: str) -> str:
        """Determine if it's an Order or Decision based on reference and type"""
        if order_reference.startswith('ORD_'):
            return "Order"
        elif order_reference.startswith('DEC_'):
            return "Decision"
        elif 'decision' in type_of_action.lower():
            return "Decision"
        else:
            return "Order"
    
    def _format_court_division(self, court_division: str) -> str:
        """Format court division consistently"""
        # Add "Court of First Instance - " prefix if not present
        if not court_division.startswith('Court of'):
            if 'Luxembourg' in court_division:
                return f"Court of Appeal - {court_division}"
            else:
                return f"Court of First Instance - {court_division}"
        return court_division
    
    def _extract_patent_from_text(self, text: str) -> Optional[str]:
        """Extract patent number from text"""
        pattern = r'(EP\d+|US\d+|WO\d+)'
        match = re.search(pattern, text, re.I)
        return match.group(1) if match else None
    
    def _extract_language_from_filename(self, filename: str) -> str:
        """Extract language from filename like 'document_en.pdf'"""
        if filename.endswith('_en.pdf'):
            return 'EN'
        elif filename.endswith('_de.pdf'):
            return 'DE'
        elif filename.endswith('_fr.pdf'):
            return 'FR'
        elif filename.endswith('_it.pdf'):
            return 'IT'
        elif filename.endswith('_nl.pdf'):
            return 'NL'
        else:
            return 'EN'  # Default
    
    def _create_summary(self, parties_text: str, type_of_action: str, court_division: str) -> str:
        """Create a summary from available information"""
        summary = f"A {type_of_action.lower()} case in the {court_division}"
        if parties_text:
            parties = self._parse_parties_from_text(parties_text)
            if len(parties) >= 2:
                summary += f" involving {parties[0]} and {parties[1]}"
            elif len(parties) == 1:
                summary += f" involving {parties[0]}"
        summary += "."
        return summary
    
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
        
        return ""  # Return empty string instead of generating fake reference
    
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
        
        return ""  # Return empty string instead of generating fake reference
    
    def _extract_order_reference(self, text: str) -> str:
        """Extract order reference number"""
        patterns = [
            r'(ORD_\d+/\d+)',  # ORD_32533/2025
            r'(DEC_\d+/\d+)',  # DEC_12345/2025
            r'(UPC_\w+_\d+)',  # UPC_CFI_123
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.I)
            if match:
                return match.group(1)
        
        return ""  # Return empty string instead of generating fake reference
    
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
    
    def _extract_detail_link(self, element) -> Optional[str]:
        """Extract the 'Full Details' link from a decision element"""
        try:
            # Look for links containing 'node' in the URL
            links = element.find_all('a', href=True)
            for link in links:
                href = link['href']
                if 'node' in href and '/en/node/' in href:
                    return urljoin(self.base_url, href)
        except Exception as e:
            logger.debug(f"Error extracting detail link: {e}")
        
        return None
    
    def _scrape_detail_page(self, url: str) -> Dict:
        """Scrape detailed information from a decision's detail page"""
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            detailed_info = {}
            
            # Extract all text for pattern matching
            page_text = soup.get_text()
            
            # Extract Language of Proceedings
            language_of_proceedings = self._extract_language_from_detail(page_text)
            if language_of_proceedings:
                detailed_info['language_of_proceedings'] = language_of_proceedings
            
            # Extract Keywords
            keywords = self._extract_keywords_from_detail(page_text)
            if keywords:
                detailed_info['keywords'] = keywords
            
            # Extract Headnotes
            headnotes = self._extract_headnotes_from_detail(page_text)
            if headnotes:
                detailed_info['headnotes'] = headnotes
            
            # Extract enhanced court division
            court_division = self._extract_court_division_from_detail(soup)
            if court_division:
                detailed_info['court_division'] = court_division
            
            # Extract enhanced parties information
            parties = self._extract_parties_from_detail(soup)
            if parties:
                detailed_info['parties'] = parties
            
            # Extract enhanced summary
            summary = self._extract_summary_from_detail(soup)
            if summary:
                detailed_info['summary'] = summary
            
            # Extract legal norms
            legal_norms = self._extract_legal_norms_from_detail(page_text)
            if legal_norms:
                detailed_info['legal_norms'] = legal_norms
            
            # Extract tags based on content
            tags = self._extract_tags_from_detail(page_text)
            if tags:
                detailed_info['tags'] = tags
            
            return detailed_info
            
        except Exception as e:
            logger.warning(f"Error scraping detail page {url}: {e}")
            return {}
    
    def _extract_language_from_detail(self, text: str) -> Optional[str]:
        """Extract Language of Proceedings from detail page"""
        try:
            # Look for language patterns
            patterns = [
                r'Language of Proceedings[:\s]*([A-Za-z]+)',
                r'Language[:\s]*([A-Za-z]+)',
                r'Proceedings Language[:\s]*([A-Za-z]+)',
            ]
            
            for pattern in patterns:
                match = re.search(pattern, text, re.I)
                if match:
                    language = match.group(1).strip().lower()
                    # Map to standard codes
                    language_map = {
                        'english': 'EN',
                        'german': 'DE',
                        'french': 'FR',
                        'italian': 'IT',
                        'dutch': 'NL',
                        'danish': 'DA',
                        'finnish': 'FI',
                        'portuguese': 'PT',
                        'slovenian': 'SI',
                        'swedish': 'SV',
                        'en': 'EN',
                        'de': 'DE',
                        'fr': 'FR',
                        'it': 'IT',
                        'nl': 'NL',
                        'da': 'DA'
                    }
                    return language_map.get(language, 'EN')  # Default to EN if not found
            
            # If no explicit language found, return EN as default
            return 'EN'
            
        except Exception as e:
            logger.debug(f"Error extracting language: {e}")
            return 'EN'  # Default to English
    
    def _extract_keywords_from_detail(self, text: str) -> List[str]:
        """Extract Keywords from detail page"""
        try:
            keywords = []
            
            # Look for keywords section
            patterns = [
                r'Keywords?[:\s]*([^\n]+)',
                r'Key words?[:\s]*([^\n]+)',
                r'Tags?[:\s]*([^\n]+)',
            ]
            
            for pattern in patterns:
                match = re.search(pattern, text, re.I)
                if match:
                    keywords_text = match.group(1).strip()
                    # Split on common separators
                    keywords = [kw.strip() for kw in re.split(r'[,;]', keywords_text) if kw.strip()]
                    break
            
            return keywords
            
        except Exception as e:
            logger.debug(f"Error extracting keywords: {e}")
            return []
    
    def _extract_headnotes_from_detail(self, text: str) -> str:
        """Extract Headnotes from detail page"""
        try:
            # Look for headnotes section
            patterns = [
                r'Headnotes?[:\s]*([^\n]+(?:\n[^\n]+)*)',
                r'Head notes?[:\s]*([^\n]+(?:\n[^\n]+)*)',
                r'Summary[:\s]*([^\n]+(?:\n[^\n]+)*)',
            ]
            
            for pattern in patterns:
                match = re.search(pattern, text, re.I)
                if match:
                    headnotes = match.group(1).strip()
                    # Clean up and limit length
                    headnotes = re.sub(r'\s+', ' ', headnotes)
                    return headnotes[:1000]  # Limit to 1000 characters
            
            return ""
            
        except Exception as e:
            logger.debug(f"Error extracting headnotes: {e}")
            return ""
    
    def _extract_legal_norms_from_detail(self, text: str) -> List[str]:
        """Extract legal norms from detail page"""
        try:
            norms = []
            patterns = [
                r'(Art\.\s*\d+[a-zA-Z]*(?:\s*\([^)]+\))?(?:\s*[A-Z]+)?)',
                r'(Article\s*\d+[a-zA-Z]*(?:\s*\([^)]+\))?(?:\s*[A-Z]+)?)',
                r'(Rule\s*\d+[a-zA-Z]*(?:\s*\([^)]+\))?(?:\s*[A-Z]+)?)',
                r'(Section\s*\d+[a-zA-Z]*(?:\s*\([^)]+\))?(?:\s*[A-Z]+)?)',
            ]
            
            for pattern in patterns:
                matches = re.findall(pattern, text, re.I)
                norms.extend(matches)
            
            # Remove duplicates and clean up
            unique_norms = []
            for norm in norms:
                clean_norm = norm.strip()
                if clean_norm and clean_norm not in unique_norms:
                    unique_norms.append(clean_norm)
            
            return unique_norms[:10]  # Limit to 10 norms
            
        except Exception as e:
            logger.debug(f"Error extracting legal norms: {e}")
            return []
    
    def _extract_tags_from_detail(self, text: str) -> List[str]:
        """Extract relevant tags from detail page content"""
        try:
            tags = []
            tag_keywords = [
                'patent infringement', 'preliminary injunction', 'revocation',
                'counterclaim', 'language change', 'procedural order',
                'costs', 'damages', 'validity', 'enforcement',
                'appeal', 'application', 'generic application',
                'provisional measures', 'default judgment'
            ]
            
            text_lower = text.lower()
            for keyword in tag_keywords:
                if keyword in text_lower:
                    tags.append(keyword)
            
            return tags
            
        except Exception as e:
            logger.debug(f"Error extracting tags: {e}")
            return []
    
    def _extract_court_division_from_detail(self, soup) -> Optional[str]:
        """Extract court division from detail page"""
        try:
            # Look for "Court - Division" pattern
            text = soup.get_text()
            
            # Pattern for "Court of Appeal - Luxembourg (LU)" or similar
            patterns = [
                r'Court of Appeal\s*-\s*([^,\n]+)',
                r'Court of First Instance\s*-\s*([^,\n]+)',
                r'Central Division\s*-\s*([^,\n]+)',
                r'Local Division\s*-\s*([^,\n]+)',
                r'Regional Division\s*-\s*([^,\n]+)',
            ]
            
            for pattern in patterns:
                match = re.search(pattern, text, re.I)
                if match:
                    division = match.group(1).strip()
                    # Reconstruct the full court division
                    if 'Court of Appeal' in pattern:
                        return f"Court of Appeal - {division}"
                    elif 'Court of First Instance' in pattern:
                        return f"Court of First Instance - {division}"
                    elif 'Central Division' in pattern:
                        return f"Central Division - {division}"
                    elif 'Local Division' in pattern:
                        return f"Local Division - {division}"
                    elif 'Regional Division' in pattern:
                        return f"Regional Division - {division}"
            
        except Exception as e:
            logger.debug(f"Error extracting court division from detail: {e}")
        
        return None
    
    def _extract_parties_from_detail(self, soup) -> List[str]:
        """Extract parties from detail page"""
        try:
            # Look for party information in the detail page
            text = soup.get_text()
            
            # Enhanced party extraction patterns
            patterns = [
                r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:AG|GmbH|Ltd|Inc|Corp|SA|SRL|s\.r\.l\.|s\.p\.a\.))',
                r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Limited|Corporation|Company))',
                r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:v\.|versus)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
            ]
            
            parties = []
            for pattern in patterns:
                matches = re.findall(pattern, text)
                parties.extend(matches)
            
            # Remove duplicates and return
            return list(set(parties))[:5]  # Limit to 5 parties
            
        except Exception as e:
            logger.debug(f"Error extracting parties from detail: {e}")
        
        return []
    
    def _extract_summary_from_detail(self, soup) -> Optional[str]:
        """Extract summary from detail page"""
        try:
            # Look for summary content in the detail page
            # This might be in specific divs or sections
            summary_selectors = [
                '.field--name-field-summary',
                '.field--name-body',
                '.content',
                'p',
            ]
            
            for selector in summary_selectors:
                elements = soup.select(selector)
                for element in elements:
                    text = element.get_text(strip=True)
                    if len(text) > 100:  # Reasonable summary length
                        return text[:1000]  # Limit to 1000 characters
            
        except Exception as e:
            logger.debug(f"Error extracting summary from detail: {e}")
        
        return None
    
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
        consecutive_low_pages = 0  # Count pages with very few decisions
        consecutive_empty_pages = 0
        max_consecutive_empty = 2  # Stop after 2 consecutive empty pages
        max_consecutive_low = 5    # Stop after 5 consecutive pages with <= 5 decisions
        min_decisions_per_page = 5  # Minimum expected decisions per page
        
        # Safety limit to prevent infinite scraping
        max_total_pages = 50  # Safety limit
        
        logger.info(f"Starting scraping process. Will stop after {max_consecutive_empty} empty pages or {max_consecutive_low} low-content pages")

        while consecutive_empty_pages < max_consecutive_empty and consecutive_low_pages < max_consecutive_low:
            # Only respect max_pages if it's explicitly set (for testing)
            if max_pages is not None and page > max_pages:
                logger.info(f"Reached max_pages limit: {max_pages}")
                break
                
            # Safety check to prevent infinite scraping
            if page > max_total_pages:
                logger.warning(f"Reached safety limit of {max_total_pages} pages. Stopping scraping.")
                break

            logger.info(f"Scraping page {page}...")
            decisions = self.scrape_decisions_page(page)
            
            decisions_count = len(decisions)

            if decisions_count == 0:
                consecutive_empty_pages += 1
                consecutive_low_pages = 0  # Reset low count when we get empty page
                logger.info(f"No decisions found on page {page} (consecutive empty: {consecutive_empty_pages})")
                
                if consecutive_empty_pages >= max_consecutive_empty:
                    logger.info(f"Stopping after {max_consecutive_empty} consecutive empty pages")
                    break
                    
            elif decisions_count <= min_decisions_per_page:
                consecutive_low_pages += 1
                consecutive_empty_pages = 0  # Reset empty count
                logger.warning(f"Only {decisions_count} decisions found on page {page} (consecutive low: {consecutive_low_pages})")
                
                if consecutive_low_pages >= max_consecutive_low:
                    logger.info(f"Stopping after {max_consecutive_low} consecutive pages with <= {min_decisions_per_page} decisions")
                    break
                    
                # Still add the decisions but track this as a low-content page
                all_decisions.extend(decisions)
                
            else:
                # Good page with many decisions
                consecutive_empty_pages = 0
                consecutive_low_pages = 0
                all_decisions.extend(decisions)
                logger.info(f"Scraped {decisions_count} decisions from page {page}. Total: {len(all_decisions)}")

            page += 1
            # Be respectful with requests
            time.sleep(2)

        logger.info(f"Scraping completed. Total decisions found: {len(all_decisions)} across {page-1} pages")
        return all_decisions
    
    def save_to_mongodb(self, decisions: List[Dict]) -> int:
        """Save decisions to MongoDB with intelligent duplicate handling"""
        if self.collection is None:
            logger.error("MongoDB not configured")
            return 0
        
        saved_count = 0
        updated_count = 0
        skipped_count = 0
        duplicate_count = 0
        
        for decision in decisions:
            try:
                # Ensure _id is a string UUID
                decision['_id'] = decision.pop('id')
                
                # Use registry_number as the primary unique identifier
                unique_key = decision.get('registry_number') or decision.get('order_reference')
                if not unique_key:
                    logger.warning("Decision has no registry number or order reference, skipping")
                    continue
                
                # Check if decision already exists by registry number or order reference
                existing_decision = self.collection.find_one({
                    '$or': [
                        {'registry_number': decision.get('registry_number')},
                        {'order_reference': decision.get('order_reference')}
                    ]
                })
                
                if existing_decision:
                    duplicate_count += 1
                    # Decision exists, check if we should update
                    should_update = False
                    
                    # Update if we have more complete data
                    if len(decision.get('summary', '')) > len(existing_decision.get('summary', '')):
                        should_update = True
                    elif len(decision.get('documents', [])) > len(existing_decision.get('documents', [])):
                        should_update = True
                    elif len(decision.get('parties', [])) > len(existing_decision.get('parties', [])):
                        should_update = True
                    elif decision.get('language_of_proceedings') and not existing_decision.get('language_of_proceedings'):
                        should_update = True
                    elif decision.get('keywords') and not existing_decision.get('keywords'):
                        should_update = True
                    elif decision.get('headnotes') and not existing_decision.get('headnotes'):
                        should_update = True
                    
                    if should_update:
                        # Preserve any custom fields that might have been added manually
                        preserved_fields = ['custom_summary', 'internal_notes', 'admin_comments', 'user_tags', 'admin_summary', 'apports']
                        for field in preserved_fields:
                            if field in existing_decision:
                                decision[field] = existing_decision[field]
                        
                        # Remove _id from update data to avoid MongoDB immutable field error
                        update_data = {k: v for k, v in decision.items() if k != '_id'}
                        
                        self.collection.update_one(
                            {'_id': existing_decision['_id']},
                            {'$set': update_data}
                        )
                        updated_count += 1
                        logger.debug(f"Updated decision {unique_key}")
                    else:
                        skipped_count += 1
                        logger.debug(f"Skipped decision {unique_key} (no improvements)")
                else:
                    # New decision, insert it
                    self.collection.insert_one(decision)
                    saved_count += 1
                    logger.debug(f"Saved new decision {unique_key}")
                    
            except Exception as e:
                logger.error(f"Error saving decision {decision.get('registry_number', 'unknown')}: {e}")
        
        logger.info(f"Database update completed: {saved_count} new, {updated_count} updated, {skipped_count} skipped, {duplicate_count} duplicates")
        
        # Calculate the percentage of new content
        total_processed = len(decisions)
        new_content_percentage = (saved_count + updated_count) / total_processed * 100 if total_processed > 0 else 0
        
        if new_content_percentage < 10 and total_processed > 10:
            logger.warning(f"Low new content detected: {new_content_percentage:.1f}% - this may indicate we've reached the end of available data")
        
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