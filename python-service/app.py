from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import PyPDF2
from docx import Document
import logging

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Common skills to extract from CV
COMMON_SKILLS = {
    'python', 'java', 'javascript', 'c++', 'c#', 'react', 'angular', 'vue',
    'node.js', 'express', 'django', 'flask', 'mongodb', 'sql', 'mysql',
    'postgresql', 'git', 'docker', 'kubernetes', 'aws', 'azure', 'machine learning',
    'deep learning', 'tensorflow', 'pytorch', 'electronics', 'matlab', 'circuit',
    'pcb', 'embedded systems', 'microcontroller', 'arduino', 'fpga'
}

def extract_text_from_pdf(file_path):
    """Extract text from PDF file"""
    try:
        text = ""
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text()
        return text
    except Exception as e:
        logger.error(f"Error extracting PDF: {e}")
        return None

def extract_text_from_docx(file_path):
    """Extract text from DOCX file"""
    try:
        doc = Document(file_path)
        text = "\n".join([para.text for para in doc.paragraphs])
        return text
    except Exception as e:
        logger.error(f"Error extracting DOCX: {e}")
        return None

def extract_email(text):
    """Extract email address from text"""
    import re
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    emails = re.findall(email_pattern, text)
    return emails[0] if emails else None

def extract_phone(text):
    """Extract phone number from text"""
    import re
    phone_pattern = r'(\+92|0)\d{10}|(\+92|0)[0-9]{3}-[0-9]{7}|(\+1)?[0-9]{10}'
    phones = re.findall(phone_pattern, text)
    return phones[0] if phones else None

def extract_skills(text):
    """Extract skills from CV text"""
    text_lower = text.lower()
    found_skills = []
    for skill in COMMON_SKILLS:
        if skill in text_lower:
            found_skills.append(skill.title())
    return list(set(found_skills))

def extract_education(text):
    """Extract education information"""
    education_keywords = ['bachelor', 'master', 'phd', 'diploma', 'degree', 'b.tech', 'b.s', 'm.s', 'bscs', 'b.e']
    text_lower = text.lower()
    education = []
    for line in text.split('\n'):
        if any(keyword in line.lower() for keyword in education_keywords):
            education.append(line.strip())
    return education[:3]  # Return top 3

def extract_experience(text):
    """Extract work experience"""
    experience_keywords = ['experience', 'worked', 'worked at', 'employed', 'position']
    experience = []
    for line in text.split('\n'):
        if any(keyword in line.lower() for keyword in experience_keywords):
            cleaned = line.strip()
            if cleaned and len(cleaned) > 10:
                experience.append(cleaned)
    return experience[:3]  # Return top 3

def parse_cv(file_path):
    """Main CV parsing function"""
    try:
        # Extract text based on file type
        if file_path.endswith('.pdf'):
            text = extract_text_from_pdf(file_path)
        elif file_path.endswith('.docx'):
            text = extract_text_from_docx(file_path)
        else:
            return None

        if not text:
            return None

        # Extract information
        parsed_data = {
            'name': extract_name_from_text(text),
            'email': extract_email(text),
            'phone': extract_phone(text),
            'skills': extract_skills(text),
            'education': extract_education(text),
            'experience': extract_experience(text),
            'summary': text[:500]  # First 500 chars as summary
        }

        return parsed_data
    except Exception as e:
        logger.error(f"Error parsing CV: {e}")
        return None

def extract_name_from_text(text):
    """Extract name - usually in first few lines"""
    lines = text.split('\n')
    for line in lines[:5]:
        line_clean = line.strip()
        if line_clean and len(line_clean) > 3 and len(line_clean) < 50:
            return line_clean
    return None

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'cv-parser'}), 200

@app.route('/parse-cv', methods=['POST'])
def parse_cv_endpoint():
    """CV Parsing endpoint"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']

        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        # Check file type
        if not (file.filename.endswith('.pdf') or file.filename.endswith('.docx')):
            return jsonify({'error': 'Only PDF and DOCX files are allowed'}), 400

        # Save file temporarily
        temp_path = os.path.join('/tmp', file.filename)
        file.save(temp_path)

        # Parse CV
        parsed_data = parse_cv(temp_path)

        # Clean up
        if os.path.exists(temp_path):
            os.remove(temp_path)

        if not parsed_data:
            return jsonify({'error': 'Failed to parse CV'}), 400

        return jsonify({
            'success': True,
            'data': parsed_data
        }), 200

    except Exception as e:
        logger.error(f"Error in parse_cv_endpoint: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/extract-text', methods=['POST'])
def extract_text_endpoint():
    """Extract raw text from CV"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']

        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        temp_path = os.path.join('/tmp', file.filename)
        file.save(temp_path)

        if file.filename.endswith('.pdf'):
            text = extract_text_from_pdf(temp_path)
        elif file.filename.endswith('.docx'):
            text = extract_text_from_docx(temp_path)
        else:
            text = None

        if os.path.exists(temp_path):
            os.remove(temp_path)

        if not text:
            return jsonify({'error': 'Failed to extract text'}), 400

        return jsonify({
            'success': True,
            'text': text
        }), 200

    except Exception as e:
        logger.error(f"Error in extract_text_endpoint: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('FLASK_PORT', 5001))
    app.run(debug=os.getenv('FLASK_ENV') == 'development', port=port, host='0.0.0.0')
