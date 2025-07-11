import requests
import pdfplumber
import re
import json
import uuid
from datetime import datetime
from typing import List, Dict, Optional
from pymongo import MongoClient
import os

class UPCTextParser:
    def __init__(self, mongodb_url: str = None):
        """Initialize UPC text parser with MongoDB connection"""
        if mongodb_url:
            self.client = MongoClient(mongodb_url)
            self.db = self.client['upc_legal']
            self.collection = self.db['upc_texts']
        else:
            self.client = None
            self.db = None
            self.collection = None
    
    def download_pdf(self, url: str, filename: str) -> bool:
        """Download PDF from URL"""
        try:
            print(f"Downloading {filename} from {url}")
            
            # Add more headers to avoid 406 errors
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/pdf,text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
            
            response = requests.get(url, stream=True, timeout=60, headers=headers)
            response.raise_for_status()
            
            with open(filename, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            print(f"✅ Successfully downloaded {filename}")
            return True
        except Exception as e:
            print(f"❌ Error downloading {filename}: {e}")
            return False
    
    def parse_rules_of_procedure(self, pdf_path: str) -> List[Dict]:
        """Parse the Rules of Procedure PDF"""
        print("📖 Parsing Rules of Procedure PDF...")
        rules = []
        
        try:
            with pdfplumber.open(pdf_path) as pdf:
                all_text = ""
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        all_text += text + "\n"
                
                # Parse the text to extract rules
                rules = self._extract_rules_from_text(all_text, "rules_of_procedure")
                print(f"✅ Extracted {len(rules)} rules from Rules of Procedure")
                
        except Exception as e:
            print(f"❌ Error parsing Rules of Procedure: {e}")
        
        return rules
    
    def parse_upca(self, pdf_path: str) -> List[Dict]:
        """Parse the UPC Agreement PDF"""
        print("📖 Parsing UPC Agreement PDF...")
        articles = []
        
        try:
            with pdfplumber.open(pdf_path) as pdf:
                all_text = ""
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        all_text += text + "\n"
                
                # Parse the text to extract articles
                articles = self._extract_articles_from_text(all_text, "upc_agreement")
                print(f"✅ Extracted {len(articles)} articles from UPC Agreement")
                
        except Exception as e:
            print(f"❌ Error parsing UPC Agreement: {e}")
        
        return articles
    
    def _extract_rules_from_text(self, text: str, doc_type: str) -> List[Dict]:
        """Extract rules from Rules of Procedure text"""
        rules = []
        
        # Clean the text
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Look for rule patterns - more flexible approach
        # Pattern for "Rule X" followed by content
        rule_pattern = r'Rule\s+(\d+(?:\.\d+)?)\s*\.?\s*([^\n]+?)(?=\n\s*Rule\s+\d+|\nPart\s+[IVX]+|\n\s*Chapter|\n\s*PART|\Z)'
        
        # Find all rules
        matches = re.finditer(rule_pattern, text, re.IGNORECASE | re.DOTALL)
        
        current_section = "Part I - General Provisions"
        
        for match in matches:
            rule_num = match.group(1)
            rule_content = match.group(2).strip()
            
            # Skip if content is too short
            if len(rule_content) < 20:
                continue
                
            # Extract title from first sentence
            sentences = re.split(r'[.!?]', rule_content)
            title = sentences[0].strip() if sentences else f"Rule {rule_num}"
            
            # Clean title
            title = re.sub(r'^\d+\.?\s*', '', title)
            title = title.strip()
            
            # If title is too long, truncate
            if len(title) > 100:
                title = title[:100] + "..."
            
            # Extract keywords
            keywords = self._extract_keywords(rule_content)
            
            # Create rule record
            rule = {
                "_id": str(uuid.uuid4()),
                "document_type": doc_type,
                "section": current_section,
                "article_number": f"Rule {rule_num}",
                "title": title,
                "content": rule_content,
                "language": "EN",
                "cross_references": self._extract_cross_references(rule_content),
                "keywords": keywords,
                "created_date": datetime.now().strftime("%Y-%m-%d"),
                "last_updated": datetime.now().strftime("%Y-%m-%d")
            }
            
            rules.append(rule)
        
        # If no rules found with the pattern, try a simpler approach
        if not rules:
            print("No rules found with pattern, trying simpler extraction...")
            # Split by numbers and look for rule-like content
            sections = re.split(r'\n\s*(\d+)\s*\.', text)
            for i in range(1, len(sections), 2):
                if i + 1 < len(sections):
                    rule_num = sections[i]
                    rule_content = sections[i + 1].strip()
                    
                    if len(rule_content) > 50:  # Minimum content length
                        title = rule_content.split('.')[0].strip()
                        if len(title) > 100:
                            title = title[:100] + "..."
                        
                        rule = {
                            "_id": str(uuid.uuid4()),
                            "document_type": doc_type,
                            "section": "Rules of Procedure",
                            "article_number": f"Rule {rule_num}",
                            "title": title,
                            "content": rule_content,
                            "language": "EN",
                            "cross_references": self._extract_cross_references(rule_content),
                            "keywords": self._extract_keywords(rule_content),
                            "created_date": datetime.now().strftime("%Y-%m-%d"),
                            "last_updated": datetime.now().strftime("%Y-%m-%d")
                        }
                        rules.append(rule)
        
        return rules
    
    def _extract_articles_from_text(self, text: str, doc_type: str) -> List[Dict]:
        """Extract articles from UPC Agreement text"""
        articles = []
        
        # Clean the text
        text = re.sub(r'\s+', ' ', text)
        text = text.replace('\n', ' ')
        
        # Patterns for different parts and articles
        part_pattern = r'PART\s+([IVX]+)[\s\-–—]*([^a-z]*?)(?=PART|$)'
        article_pattern = r'Article\s+(\d+(?:\.\d+)?)\s*[:\-–—]*\s*([^a-z]+?)(?=Article\s+\d+|$)'
        
        # Extract parts
        parts = re.finditer(part_pattern, text, re.IGNORECASE)
        current_part = "Part I"
        
        for part_match in parts:
            part_num = part_match.group(1)
            part_content = part_match.group(2)
            current_part = f"Part {part_num}"
            
            # Extract articles from this part
            articles_in_part = re.finditer(article_pattern, part_content, re.IGNORECASE)
            
            for article_match in articles_in_part:
                article_num = article_match.group(1)
                article_content = article_match.group(2).strip()
                
                # Extract title (first line usually)
                lines = article_content.split('.')
                title = lines[0].strip() if lines else f"Article {article_num}"
                
                # Clean title
                title = re.sub(r'^\d+\.?\s*', '', title)
                title = title.strip()
                
                # Extract content (rest of the text)
                content = article_content.strip()
                
                # Skip if content is too short
                if len(content) < 50:
                    continue
                
                # Extract keywords
                keywords = self._extract_keywords(content)
                
                # Create article record
                article = {
                    "_id": str(uuid.uuid4()),
                    "document_type": doc_type,
                    "section": current_part,
                    "article_number": f"Article {article_num}",
                    "title": title,
                    "content": content,
                    "language": "EN",
                    "cross_references": self._extract_cross_references(content),
                    "keywords": keywords,
                    "created_date": datetime.now().strftime("%Y-%m-%d"),
                    "last_updated": datetime.now().strftime("%Y-%m-%d")
                }
                
                articles.append(article)
        
        return articles
    
    def _extract_keywords(self, text: str) -> List[str]:
        """Extract keywords from text"""
        keywords = []
        
        # Common legal keywords
        legal_terms = [
            "infringement", "patent", "claim", "procedure", "court", "division",
            "application", "provisional", "measures", "evidence", "proceedings",
            "revocation", "validity", "competence", "jurisdiction", "remedy",
            "damages", "injunction", "hearing", "decision", "order", "appeal",
            "costs", "representation", "service", "language", "translation",
            "time", "limit", "extension", "suspension", "stay", "security",
            "enforcement", "execution", "cross-border", "license", "declaration"
        ]
        
        text_lower = text.lower()
        for term in legal_terms:
            if term in text_lower:
                keywords.append(term)
        
        # Remove duplicates and limit to 10
        keywords = list(set(keywords))[:10]
        return keywords
    
    def _extract_cross_references(self, text: str) -> List[str]:
        """Extract cross-references from text"""
        references = []
        
        # Pattern for Rules
        rule_refs = re.findall(r'Rule\s+(\d+(?:\.\d+)?)', text, re.IGNORECASE)
        for ref in rule_refs:
            references.append(f"Rule {ref}")
        
        # Pattern for Articles
        article_refs = re.findall(r'Article\s+(\d+(?:\.\d+)?)', text, re.IGNORECASE)
        for ref in article_refs:
            references.append(f"Article {ref}")
        
        # Remove duplicates
        references = list(set(references))
        return references
    
    def save_to_database(self, texts: List[Dict]):
        """Save parsed texts to MongoDB"""
        if not self.collection:
            print("❌ No database connection available")
            return False
        
        try:
            # Clear existing data
            self.collection.delete_many({})
            
            # Insert new data
            if texts:
                self.collection.insert_many(texts)
                print(f"✅ Successfully saved {len(texts)} texts to database")
            else:
                print("⚠️ No texts to save")
            
            return True
        except Exception as e:
            print(f"❌ Error saving to database: {e}")
            return False
    
    def load_official_texts(self):
        """Load official UPC texts from PDFs"""
        print("🚀 Starting to load official UPC texts...")
        
        # URLs for official PDFs
        urls = {
            "rules_of_procedure": "https://www.unified-patent-court.org/sites/default/files/upc_documents/rop_en_25_july_2022_final_consolidated_published_on_website.pdf",
            "upc_agreement": "https://www.unified-patent-court.org/sites/default/files/upc_documents/agreement-on-a-unified-patent-court.pdf"
        }
        
        all_texts = []
        
        for doc_type, url in urls.items():
            filename = f"{doc_type}.pdf"
            
            # Download PDF
            if self.download_pdf(url, filename):
                # Parse PDF
                if doc_type == "rules_of_procedure":
                    texts = self.parse_rules_of_procedure(filename)
                elif doc_type == "upc_agreement":
                    texts = self.parse_upca(filename)
                else:
                    texts = []
                
                all_texts.extend(texts)
                
                # Clean up file
                try:
                    os.remove(filename)
                except:
                    pass
        
        # Save to database
        if all_texts:
            self.save_to_database(all_texts)
            print(f"🎉 Successfully loaded {len(all_texts)} official UPC texts!")
        else:
            print("❌ No texts were extracted")
        
        return all_texts

if __name__ == "__main__":
    # Test the parser
    mongodb_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
    parser = UPCTextParser(mongodb_url)
    parser.load_official_texts()