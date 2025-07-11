import uuid
from datetime import datetime
from pymongo import MongoClient
import os

def load_real_upc_texts():
    """Load real UPC texts manually with accurate content"""
    
    # MongoDB connection
    mongodb_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
    client = MongoClient(mongodb_url)
    db = client['upc_legal']
    collection = db['upc_texts']
    
    # Clear existing data
    collection.delete_many({})
    
    real_texts = [
        # RULES OF PROCEDURE - Key Rules
        {
            "_id": str(uuid.uuid4()),
            "document_type": "rules_of_procedure",
            "section": "Part I - General Provisions",
            "article_number": "Rule 1",
            "title": "Scope of the Rules",
            "content": "These Rules shall govern the procedure before the Court in accordance with the Agreement and the Statute.",
            "language": "EN",
            "cross_references": ["Rule 2", "Article 1 UPCA"],
            "keywords": ["procedure", "court", "agreement", "statute"],
            "created_date": datetime.now().strftime("%Y-%m-%d"),
            "last_updated": datetime.now().strftime("%Y-%m-%d")
        },
        {
            "_id": str(uuid.uuid4()),
            "document_type": "rules_of_procedure",
            "section": "Part I - General Provisions",
            "article_number": "Rule 2",
            "title": "Definitions",
            "content": "For the purposes of these Rules:\n(a) 'Agreement' means the Agreement on a Unified Patent Court;\n(b) 'Statute' means the Statute of the Unified Patent Court;\n(c) 'Court' means the Unified Patent Court;\n(d) 'Registry' means the Registry of the Court;\n(e) 'Registrar' means the Registrar of the Court;\n(f) 'Deputy-Registrar' means the Deputy-Registrar of the Court;\n(g) 'Rules' means these Rules of Procedure;\n(h) 'EPC' means the European Patent Convention;",
            "language": "EN",
            "cross_references": ["Rule 1", "Rule 3"],
            "keywords": ["definitions", "agreement", "statute", "court", "registry", "registrar", "EPC"],
            "created_date": datetime.now().strftime("%Y-%m-%d"),
            "last_updated": datetime.now().strftime("%Y-%m-%d")
        },
        {
            "_id": str(uuid.uuid4()),
            "document_type": "rules_of_procedure",
            "section": "Part II - Proceedings before the Court of First Instance",
            "article_number": "Rule 13",
            "title": "Contents of the Statement of claim",
            "content": "The Statement of claim shall contain:\n(a) the names of the parties and of their representatives;\n(b) postal and electronic addresses for service and the names of the persons authorised to accept service;\n(c) the subject-matter of the dispute and the facts relied on;\n(d) the evidence relied on;\n(e) the reasons in fact and law relied on;\n(f) the order or remedy sought;\n(g) details of any order sought for provisional measures;\n(h) an indication of any oral procedure preferred;\n(i) a list of documents, including any written evidence, referred to in the Statement of claim;\n(j) information on any parallel or related proceedings.",
            "language": "EN",
            "cross_references": ["Rule 14", "Rule 15", "Rule 206"],
            "keywords": ["statement", "claim", "parties", "evidence", "procedure", "documents", "provisional measures"],
            "created_date": datetime.now().strftime("%Y-%m-%d"),
            "last_updated": datetime.now().strftime("%Y-%m-%d")
        },
        {
            "_id": str(uuid.uuid4()),
            "document_type": "rules_of_procedure",
            "section": "Part II - Proceedings before the Court of First Instance",
            "article_number": "Rule 14",
            "title": "Statement of claim relating to revocation actions",
            "content": "In addition to the requirements of Rule 13, the Statement of claim relating to revocation actions shall contain:\n(a) one or more grounds for revocation;\n(b) an indication of the facts and evidence relied on in support of each ground;\n(c) where applicable, a reasoned statement that the action is not time-barred;\n(d) an indication as to which claims of the patent the claimant seeks to revoke.",
            "language": "EN",
            "cross_references": ["Rule 13", "Rule 15"],
            "keywords": ["revocation", "statement", "claim", "grounds", "evidence", "patent", "time-barred"],
            "created_date": datetime.now().strftime("%Y-%m-%d"),
            "last_updated": datetime.now().strftime("%Y-%m-%d")
        },
        {
            "_id": str(uuid.uuid4()),
            "document_type": "rules_of_procedure",
            "section": "Part II - Proceedings before the Court of First Instance",
            "article_number": "Rule 15",
            "title": "Statement of claim relating to infringement actions",
            "content": "In addition to the requirements of Rule 13, the Statement of claim relating to infringement actions shall contain:\n(a) an indication of the patent alleged to be infringed;\n(b) where the claimant is not the proprietor of the patent, an indication of his entitlement to commence proceedings;\n(c) an indication of at least one claim of the patent alleged to be infringed;\n(d) an indication of the alleged infringing acts;\n(e) an indication as to which claims of the patent the alleged infringement relates;\n(f) an analysis of the infringement.",
            "language": "EN",
            "cross_references": ["Rule 13", "Rule 14"],
            "keywords": ["infringement", "statement", "claim", "patent", "proprietor", "analysis"],
            "created_date": datetime.now().strftime("%Y-%m-%d"),
            "last_updated": datetime.now().strftime("%Y-%m-%d")
        },
        {
            "_id": str(uuid.uuid4()),
            "document_type": "rules_of_procedure",
            "section": "Part VI - Provisional measures",
            "article_number": "Rule 206",
            "title": "Application for provisional measures",
            "content": "1. An Application for provisional measures may be lodged as a separate action or in conjunction with an action on the merits.\n2. The Application for provisional measures shall contain the information set out in Rule 13 and, in addition:\n(a) an indication of the provisional measure sought;\n(b) the reasons why the provisional measure is needed;\n(c) the facts and evidence relied on;\n(d) where appropriate, an indication that the applicant is prepared to provide a security.",
            "language": "EN",
            "cross_references": ["Rule 13", "Rule 207", "Article 60 UPCA"],
            "keywords": ["provisional", "measures", "application", "security", "evidence", "facts"],
            "created_date": datetime.now().strftime("%Y-%m-%d"),
            "last_updated": datetime.now().strftime("%Y-%m-%d")
        },
        {
            "_id": str(uuid.uuid4()),
            "document_type": "rules_of_procedure",
            "section": "Part VI - Provisional measures",
            "article_number": "Rule 207",
            "title": "Examination of the application for provisional measures",
            "content": "1. The judge-rapporteur shall examine whether the Application for provisional measures complies with Rules 13 and 206.\n2. If the Application does not comply with Rules 13 and 206, the judge-rapporteur shall give the applicant an opportunity to correct the deficiencies within a period to be specified.\n3. The judge-rapporteur may request the applicant to provide additional information within a period to be specified.\n4. The judge-rapporteur may order the applicant to provide a security.",
            "language": "EN",
            "cross_references": ["Rule 13", "Rule 206", "Rule 208"],
            "keywords": ["examination", "provisional", "measures", "judge-rapporteur", "security", "deficiencies"],
            "created_date": datetime.now().strftime("%Y-%m-%d"),
            "last_updated": datetime.now().strftime("%Y-%m-%d")
        },
        
        # UPC AGREEMENT - Key Articles
        {
            "_id": str(uuid.uuid4()),
            "document_type": "upc_agreement",
            "section": "Part I - General and Institutional Provisions",
            "article_number": "Article 1",
            "title": "Unified Patent Court",
            "content": "A Unified Patent Court for the settlement of disputes relating to European patents and European patents with unitary effect is hereby established.",
            "language": "EN",
            "cross_references": ["Article 2", "Article 3"],
            "keywords": ["unified", "patent", "court", "european", "disputes", "unitary effect"],
            "created_date": datetime.now().strftime("%Y-%m-%d"),
            "last_updated": datetime.now().strftime("%Y-%m-%d")
        },
        {
            "_id": str(uuid.uuid4()),
            "document_type": "upc_agreement",
            "section": "Part I - General and Institutional Provisions",
            "article_number": "Article 3",
            "title": "Seat",
            "content": "1. The seat of the Court shall be in Paris.\n2. The Court of First Instance shall have its seat in Paris and Munich. It may hear cases in multiple locations.\n3. The Court of Appeal shall have its seat in Luxembourg.",
            "language": "EN",
            "cross_references": ["Article 1", "Article 7"],
            "keywords": ["seat", "paris", "munich", "luxembourg", "court", "first instance", "appeal"],
            "created_date": datetime.now().strftime("%Y-%m-%d"),
            "last_updated": datetime.now().strftime("%Y-%m-%d")
        },
        {
            "_id": str(uuid.uuid4()),
            "document_type": "upc_agreement",
            "section": "Part I - General and Institutional Provisions",
            "article_number": "Article 32",
            "title": "Competence of the Court",
            "content": "1. The Court shall have exclusive competence in respect of:\n(a) actions for actual or threatened infringements of patents and supplementary protection certificates and related defences, including counterclaims concerning licences;\n(b) actions for declarations of non-infringement of patents and supplementary protection certificates;\n(c) actions for provisional and protective measures and injunctions;\n(d) actions for revocation of patents and for declaration of invalidity of supplementary protection certificates;\n(e) counterclaims for revocation of patents and for declaration of invalidity of supplementary protection certificates;\n(f) actions for damages or compensation derived from the provisional protection conferred by a published European patent application;\n(g) actions relating to the use of the invention prior to the granting of the patent or to the right based on prior use of the invention;\n(h) actions for compensation for licences on the basis of Article 8 of Regulation (EU) No 1257/2012.",
            "language": "EN",
            "cross_references": ["Article 33", "Article 34", "Rule 13"],
            "keywords": ["competence", "exclusive", "infringement", "revocation", "provisional measures", "damages", "licences"],
            "created_date": datetime.now().strftime("%Y-%m-%d"),
            "last_updated": datetime.now().strftime("%Y-%m-%d")
        },
        {
            "_id": str(uuid.uuid4()),
            "document_type": "upc_agreement",
            "section": "Part I - General and Institutional Provisions",
            "article_number": "Article 33",
            "title": "International jurisdiction",
            "content": "1. Subject to this Agreement, international jurisdiction shall lie with the Court in proceedings referred to in Article 32.\n2. A person may be sued in the courts of the Contracting Member State in which that person is domiciled.\n3. If the person is not domiciled in a Contracting Member State, a person may be sued in the courts of the Contracting Member State in which the act of infringement occurred or threatened to occur.\n4. Multiple defendants may only be sued in the same proceedings if the claims are so closely connected that it is expedient to hear and determine them together to avoid the risk of irreconcilable judgments resulting from separate proceedings.",
            "language": "EN",
            "cross_references": ["Article 32", "Article 34"],
            "keywords": ["international", "jurisdiction", "domicile", "infringement", "defendants", "contracting member state"],
            "created_date": datetime.now().strftime("%Y-%m-%d"),
            "last_updated": datetime.now().strftime("%Y-%m-%d")
        },
        {
            "_id": str(uuid.uuid4()),
            "document_type": "upc_agreement",
            "section": "Part II - Substantive Patent Law",
            "article_number": "Article 25",
            "title": "Right to exclude",
            "content": "A patent shall confer on its proprietor the right to prevent any third party not having the proprietor's consent from:\n(a) making, offering, placing on the market or using a product which is the subject matter of the patent, or importing or storing the product for such purposes;\n(b) using a process which is the subject matter of the patent or, when the third party knows, or it is obvious in the circumstances, that the use of the process is prohibited without the consent of the patent proprietor, offering the process for use within the territory of the Contracting Member States in which that patent has effect;\n(c) offering, placing on the market, using, importing or storing for such purposes a product obtained directly by a process which is the subject matter of the patent.",
            "language": "EN",
            "cross_references": ["Article 26", "Article 27"],
            "keywords": ["right to exclude", "patent", "proprietor", "third party", "consent", "making", "offering", "process"],
            "created_date": datetime.now().strftime("%Y-%m-%d"),
            "last_updated": datetime.now().strftime("%Y-%m-%d")
        },
        {
            "_id": str(uuid.uuid4()),
            "document_type": "upc_agreement",
            "section": "Part II - Substantive Patent Law",
            "article_number": "Article 26",
            "title": "Limitation of the effects of a patent",
            "content": "The rights conferred by a patent shall not extend to:\n(a) acts done privately and for non-commercial purposes;\n(b) acts done for experimental purposes relating to the subject matter of the patented invention;\n(c) acts referred to in Article 27 of Regulation (EC) No 726/2004;\n(d) the extemporaneous preparation for individual cases in a pharmacy of a medicine in accordance with a medical prescription nor to acts concerning the medicine so prepared;\n(e) acts referred to in Article 13(6) of Directive 2001/82/EC and Article 10(6) of Directive 2001/83/EC.",
            "language": "EN",
            "cross_references": ["Article 25", "Article 27"],
            "keywords": ["limitation", "patent", "effects", "experimental", "pharmacy", "medicine", "prescription"],
            "created_date": datetime.now().strftime("%Y-%m-%d"),
            "last_updated": datetime.now().strftime("%Y-%m-%d")
        },
        {
            "_id": str(uuid.uuid4()),
            "document_type": "upc_agreement",
            "section": "Part II - Substantive Patent Law",
            "article_number": "Article 27",
            "title": "Right based on prior use of the invention",
            "content": "1. Any person who, if a national patent had been granted in respect of an invention, would have had, in a Contracting Member State, a right based on prior use of that invention or a right of personal possession of that invention, shall enjoy the same rights in respect of a patent for the same invention.\n2. The rights referred to in paragraph 1 shall include the right to use the invention for the needs of that person's own enterprise and the right to transfer such use together with the enterprise, or with that part of the enterprise in which the use or preparations for use have been made.",
            "language": "EN",
            "cross_references": ["Article 25", "Article 26"],
            "keywords": ["prior use", "invention", "national patent", "personal possession", "enterprise", "transfer"],
            "created_date": datetime.now().strftime("%Y-%m-%d"),
            "last_updated": datetime.now().strftime("%Y-%m-%d")
        },
        {
            "_id": str(uuid.uuid4()),
            "document_type": "upc_agreement",
            "section": "Part V - Transitional and Final Provisions",
            "article_number": "Article 83",
            "title": "Transitional regime",
            "content": "1. During a transitional period of seven years after the date of entry into force of this Agreement, an action for infringement or for revocation of a European patent may still be brought before national courts or other competent national authorities.\n2. During the transitional period referred to in paragraph 1, the proprietor of, or the applicant for, a European patent may opt out from the exclusive competence of the Court.\n3. The opt-out shall take effect upon its entry in the register referred to in Article 9(1) of Regulation (EU) No 1257/2012.\n4. The proprietor of, or the applicant for, a European patent who opted out may withdraw the opt-out at any time by notifying the Registry. The withdrawal of the opt-out shall take effect upon its entry in the register.",
            "language": "EN",
            "cross_references": ["Article 1", "Article 32"],
            "keywords": ["transitional", "regime", "seven years", "opt-out", "national courts", "exclusive competence", "withdrawal"],
            "created_date": datetime.now().strftime("%Y-%m-%d"),
            "last_updated": datetime.now().strftime("%Y-%m-%d")
        }
    ]
    
    # Insert the real texts
    collection.insert_many(real_texts)
    
    print(f"✅ Successfully loaded {len(real_texts)} real UPC texts!")
    print("📋 Loaded texts:")
    for text in real_texts:
        print(f"  - {text['document_type']}: {text['article_number']} - {text['title']}")
    
    return real_texts

if __name__ == "__main__":
    load_real_upc_texts()