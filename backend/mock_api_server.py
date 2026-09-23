#!/usr/bin/env python3
from __future__ import annotations

import base64
import hashlib
import json
import mimetypes
import os
import secrets
import re
from datetime import datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib import request as urllib_request
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parent
FRONTEND_DIR = ROOT.parent / "frontend"
DATA_FILE = ROOT / "runtime_data.json"
UPLOAD_DIR = ROOT / "uploads"
HOST = "127.0.0.1"
PORT = int(os.environ.get("PORT", "4000"))


def load_env_file() -> None:
    env_path = ROOT / ".env"
    if not env_path.exists():
        return
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


load_env_file()
MATCHING_PROVIDER = os.environ.get("MATCHING_PROVIDER", "local")
EXPLANATION_PROVIDER = os.environ.get("EXPLANATION_PROVIDER", "local")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
OPENAI_BASE_URL = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1")
OPENAI_EMBEDDING_MODEL = os.environ.get("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def next_id(prefix: str) -> str:
    return f"{prefix}_{secrets.token_hex(6)}"


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def encode_token(user_id: str) -> str:
    payload = f"{user_id}:{secrets.token_hex(8)}"
    return base64.urlsafe_b64encode(payload.encode("utf-8")).decode("ascii")


def parse_token(token: str) -> str | None:
    try:
        payload = base64.urlsafe_b64decode(token.encode("ascii")).decode("utf-8")
        user_id = payload.split(":", 1)[0]
        return user_id or None
    except Exception:
        return None


def title_case_mode(value: str) -> str:
    mapping = {"remote": "Remote", "hybrid": "Hybrid", "onsite": "On-site"}
    return mapping.get(value, value or "Hybrid")


def month_display(value: str | None) -> str:
    if not value:
      return "Flexible"
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return dt.strftime("%B %Y")
    except Exception:
        return value


def timestamp_display(value: str | None) -> str:
    if not value:
        return "Unknown"
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return dt.strftime("%d %b %Y, %H:%M")
    except Exception:
        return value


def valid_status_transition(current_status: str, new_status: str) -> bool:
    if current_status == new_status:
        return True
    allowed = {
        "Applied": {"Interview", "Rejected"},
        "Interview": {"Offer", "Rejected"},
        "Offer": set(),
        "Rejected": set(),
    }
    return new_status in allowed.get(current_status, set())


def extract_keywords(text: str) -> list[str]:
    known_skills = [
        "Python",
        "SQL",
        "Power BI",
        "Data Analysis",
        "AI",
        "React",
        "TypeScript",
        "UX",
        "CRM",
        "Excel",
        "Project Management",
        "Presentation",
        "Market Research",
        "Business Strategy",
    ]
    lower = text.lower()
    return [skill for skill in known_skills if skill.lower() in lower]


def tokenize(value: str) -> list[str]:
    return [item for item in re.split(r"[^a-z0-9+#]+", str(value or "").lower()) if len(item) >= 2]


def add_weighted_terms(target: dict[str, float], values, weight: float = 1.0) -> dict[str, float]:
    if isinstance(values, (list, tuple, set)):
        iterable = values
    else:
        iterable = [values]
    for value in iterable:
        for token in tokenize(value):
            target[token] = target.get(token, 0.0) + weight
    return target


def cosine_similarity(left: dict[str, float], right: dict[str, float]) -> float:
    keys = set(left) | set(right)
    dot = sum(left.get(key, 0.0) * right.get(key, 0.0) for key in keys)
    left_norm = sum(value * value for value in left.values()) ** 0.5
    right_norm = sum(value * value for value in right.values()) ** 0.5
    if not left_norm or not right_norm:
        return 0.0
    return dot / (left_norm * right_norm)


def cosine_similarity_array(left: list[float], right: list[float]) -> float:
    if not left or not right or len(left) != len(right):
        return 0.0
    dot = sum(float(a or 0.0) * float(b or 0.0) for a, b in zip(left, right))
    left_norm = sum(float(value or 0.0) ** 2 for value in left) ** 0.5
    right_norm = sum(float(value or 0.0) ** 2 for value in right) ** 0.5
    if not left_norm or not right_norm:
        return 0.0
    return dot / (left_norm * right_norm)


def student_embedding(student: dict) -> dict[str, float]:
    embedding: dict[str, float] = {}
    add_weighted_terms(embedding, student.get("degreeProgram"), 1.2)
    add_weighted_terms(embedding, [skill.get("name", "") for skill in student.get("skills", [])], 3.4)
    add_weighted_terms(embedding, student.get("industryPreference", ""), 2.2)
    add_weighted_terms(embedding, [project.get("title", "") for project in student.get("projects", [])], 1.8)
    add_weighted_terms(embedding, [project.get("description", "") for project in student.get("projects", [])], 1.4)
    add_weighted_terms(embedding, student.get("cvSummary", ""), 1.5)
    add_weighted_terms(embedding, student.get("locationPreference", ""), 0.7)
    add_weighted_terms(embedding, student.get("mode", "Hybrid"), 0.5)
    return embedding


def internship_embedding(internship: dict) -> dict[str, float]:
    embedding: dict[str, float] = {}
    company = company_by_id(internship["companyId"]) or {}
    add_weighted_terms(embedding, internship.get("title"), 2.4)
    add_weighted_terms(embedding, company.get("name", ""), 1.1)
    add_weighted_terms(embedding, internship.get("location", ""), 0.8)
    add_weighted_terms(embedding, internship.get("description", ""), 1.5)
    add_weighted_terms(embedding, internship.get("requiredSkills", []), 3.8)
    add_weighted_terms(embedding, internship.get("preferredSkills", []), 2.1)
    add_weighted_terms(embedding, company.get("industry", ""), 2.2)
    add_weighted_terms(embedding, internship.get("workMode", "hybrid"), 0.5)
    return embedding


def student_embedding_text(student: dict) -> str:
    return "\n".join(
        [
            str(student.get("degreeProgram", "")),
            f"Skills: {', '.join(skill.get('name', '') for skill in student.get('skills', []))}",
            f"Interests: {student.get('industryPreference', '')}",
            "Projects: " + " | ".join(f"{project.get('title', '')} {project.get('description', '')}" for project in student.get("projects", [])),
            f"CV: {student.get('cvSummary', '')}",
            f"Location: {student.get('locationPreference', '')}",
            f"Availability: {student.get('availability', '')}",
        ]
    )


def internship_embedding_text(internship: dict) -> str:
    company = company_by_id(internship["companyId"]) or {}
    return "\n".join(
        [
            f"{internship.get('title', '')} at {company.get('name', '')}",
            str(internship.get("description", "")),
            f"Required skills: {', '.join(internship.get('requiredSkills', []))}",
            f"Preferred skills: {', '.join(internship.get('preferredSkills', []))}",
            f"Industry: {company.get('industry', '')}",
            f"Location: {internship.get('location', '')}",
            f"Work mode: {internship.get('workMode', '')}",
        ]
    )


def create_openai_embedding(input_text: str) -> list[float]:
    if not OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY is not configured")
    payload = json.dumps({"model": OPENAI_EMBEDDING_MODEL, "input": input_text}).encode("utf-8")
    req = urllib_request.Request(
        f"{OPENAI_BASE_URL}/embeddings",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {OPENAI_API_KEY}",
        },
        method="POST",
    )
    with urllib_request.urlopen(req, timeout=15) as response:
        result = json.loads(response.read().decode("utf-8"))
    return result.get("data", [{}])[0].get("embedding", [])


def semantic_similarity(student: dict, internship: dict, profile_vector: dict[str, float], internship_vector: dict[str, float]) -> tuple[float, str]:
    if not OPENAI_API_KEY or MATCHING_PROVIDER == "local":
        return cosine_similarity(profile_vector, internship_vector), ("local-forced" if OPENAI_API_KEY else "local")
    try:
        student_vector = create_openai_embedding(student_embedding_text(student))
        internship_embedding_vector = create_openai_embedding(internship_embedding_text(internship))
        return cosine_similarity_array(student_vector, internship_embedding_vector), "openai"
    except Exception:
        return cosine_similarity(profile_vector, internship_vector), "local-fallback"


def weighted_overlap(left: dict[str, float], right: dict[str, float]) -> list[str]:
    overlapping = [
        (key, left.get(key, 0.0) + right.get(key, 0.0))
        for key in left
        if key in right and key not in {"intern", "internship", "student"}
    ]
    overlapping.sort(key=lambda item: item[1], reverse=True)
    return [key for key, _weight in overlapping]


def build_seed_data() -> dict:
    common_password = hash_password("Password123!")

    users = [
        {"id": "user_student_1", "email": "mira.keller@students.fhnw.ch", "passwordHash": common_password, "role": "student", "createdAt": now_iso(), "updatedAt": now_iso()},
        {"id": "user_student_2", "email": "jonas.meier@students.fhnw.ch", "passwordHash": common_password, "role": "student", "createdAt": now_iso(), "updatedAt": now_iso()},
        {"id": "user_student_3", "email": "lea.baumann@students.fhnw.ch", "passwordHash": common_password, "role": "student", "createdAt": now_iso(), "updatedAt": now_iso()},
        {"id": "user_recruiter_1", "email": "recruiter@zurich-finai.example", "passwordHash": common_password, "role": "recruiter", "createdAt": now_iso(), "updatedAt": now_iso()},
        {"id": "user_admin_1", "email": "admin@lycan-demo.example", "passwordHash": common_password, "role": "admin", "createdAt": now_iso(), "updatedAt": now_iso()},
    ]

    students = [
        {
            "id": "student_1",
            "userId": "user_student_1",
            "firstName": "Mira",
            "lastName": "Keller",
            "degreeProgram": "BSc Business Information Technology",
            "semester": 5,
            "locationPreference": "Basel",
            "industryPreference": "analytics, sustainability, consulting",
            "availability": "2026-08-01T00:00:00+00:00",
            "cvUrl": "mira-keller-cv.pdf",
            "cvSummary": "Business IT student with analytics, SQL, Power BI, and sustainability reporting experience.",
            "skills": [
                {"name": "Python", "category": "technical", "proficiency": 4, "yearsExperience": 1.5},
                {"name": "SQL", "category": "technical", "proficiency": 4, "yearsExperience": 1.5},
                {"name": "Power BI", "category": "analytics", "proficiency": 4, "yearsExperience": 1.0},
                {"name": "Data Analysis", "category": "analytics", "proficiency": 4, "yearsExperience": 2.0},
                {"name": "Sustainability", "category": "business", "proficiency": 3, "yearsExperience": 1.0},
            ],
            "projects": [
                {"title": "FHNW analytics project", "description": "SQL and Power BI reporting", "technologiesUsed": "Python, SQL, Power BI"},
                {"title": "Part-time business analyst", "description": "Business analysis support", "technologiesUsed": "Presentation, Excel, Data Analysis"},
            ],
            "languages": ["German", "English"],
            "mode": "Hybrid",
        },
        {
            "id": "student_2",
            "userId": "user_student_2",
            "firstName": "Jonas",
            "lastName": "Meier",
            "degreeProgram": "BSc Computer Science",
            "semester": 4,
            "locationPreference": "Windisch",
            "industryPreference": "software, product, healthtech",
            "availability": "2026-07-01T00:00:00+00:00",
            "cvUrl": "jonas-meier-cv.pdf",
            "cvSummary": "Frontend-focused student with React, TypeScript, testing, and UX project work.",
            "skills": [
                {"name": "React", "category": "technical", "proficiency": 4, "yearsExperience": 1.5},
                {"name": "TypeScript", "category": "technical", "proficiency": 4, "yearsExperience": 1.5},
                {"name": "Node.js", "category": "technical", "proficiency": 3, "yearsExperience": 1.0},
                {"name": "UX", "category": "product", "proficiency": 3, "yearsExperience": 1.0},
                {"name": "Testing", "category": "technical", "proficiency": 3, "yearsExperience": 1.0},
            ],
            "projects": [
                {"title": "Product prototype studio", "description": "Prototype delivery", "technologiesUsed": "React, TypeScript, UX"},
                {"title": "Frontend student assistant", "description": "UI support", "technologiesUsed": "Testing, Node.js"},
            ],
            "languages": ["German", "English", "French"],
            "mode": "Remote",
        },
        {
            "id": "student_3",
            "userId": "user_student_3",
            "firstName": "Lea",
            "lastName": "Baumann",
            "degreeProgram": "BSc International Management",
            "semester": 6,
            "locationPreference": "Olten",
            "industryPreference": "marketing, sales, mobility",
            "availability": "2026-09-01T00:00:00+00:00",
            "cvUrl": "lea-baumann-cv.pdf",
            "cvSummary": "International Management student with CRM, market research, sales operations, and presentation experience.",
            "skills": [
                {"name": "Market Research", "category": "business", "proficiency": 4, "yearsExperience": 1.5},
                {"name": "CRM", "category": "business", "proficiency": 4, "yearsExperience": 1.5},
                {"name": "Excel", "category": "analytics", "proficiency": 4, "yearsExperience": 2.0},
                {"name": "Presentation", "category": "business", "proficiency": 4, "yearsExperience": 1.5},
                {"name": "Project Management", "category": "business", "proficiency": 3, "yearsExperience": 1.0},
            ],
            "projects": [
                {"title": "CRM migration project", "description": "Migration support", "technologiesUsed": "CRM, Excel"},
                {"title": "Sales operations internship", "description": "Operations support", "technologiesUsed": "Market Research, Presentation"},
            ],
            "languages": ["German", "English", "Spanish"],
            "mode": "On-site",
        },
    ]

    companies = [
        {"id": "company_1", "name": "Zurich FinAI Lab", "email": "careers@zurich-finai.example", "industry": "ai, finance, consulting", "location": "Zurich", "website": "https://example.com/zurich-finai", "careerPage": "https://example.com/finbridge/jobs", "description": "Swiss fintech lab building responsible AI products for financial services.", "createdAt": now_iso(), "updatedAt": now_iso()},
        {"id": "company_2", "name": "Novaterra Analytics", "email": "careers@novaterra.example", "industry": "analytics, sustainability", "location": "Basel", "description": "Sustainability analytics company", "createdAt": now_iso(), "updatedAt": now_iso()},
        {"id": "company_3", "name": "Medflow Digital", "email": "careers@medflow.example", "industry": "software, product, healthtech", "location": "Zurich", "description": "Healthtech product company", "createdAt": now_iso(), "updatedAt": now_iso()},
        {"id": "company_4", "name": "SwissMove Services", "email": "careers@swissmove.example", "industry": "marketing, sales, mobility", "location": "Olten", "description": "Mobility services provider", "createdAt": now_iso(), "updatedAt": now_iso()},
    ]

    recruiters = [
        {"id": "recruiter_1", "userId": "user_recruiter_1", "companyId": "company_1", "firstName": "Nina", "lastName": "Fischer", "role": "Talent Acquisition"}
    ]

    internships = [
        {
            "id": "internship_1",
            "companyId": "company_2",
            "title": "Sustainability Data Intern",
            "description": "Support sustainability reporting and analytics.",
            "location": "Basel",
            "workMode": "hybrid",
            "duration": "6 months",
            "salaryRange": "CHF 1,800-2,200 / month",
            "postedDate": now_iso(),
            "deadline": "2026-08-15T00:00:00+00:00",
            "status": "open",
            "duplicateKey": "sustainability-data-basel",
            "requiredSkills": ["Python", "SQL", "Data Analysis"],
            "preferredSkills": ["Power BI", "Sustainability", "Presentation"],
            "sources": [{"platformName": "Company career page", "sourceUrl": "https://example.com/novaterra/sustainability-data-intern", "sourceType": "company_site", "collectedAt": now_iso(), "isActive": True, "externalPostingId": "novaterra-2026-sdi"}],
        },
        {
            "id": "internship_2",
            "companyId": "company_3",
            "title": "Frontend Product Intern",
            "description": "Build frontend product components.",
            "location": "Zurich",
            "workMode": "remote",
            "duration": "6 months",
            "salaryRange": "CHF 2,000-2,400 / month",
            "postedDate": now_iso(),
            "deadline": "2026-07-31T00:00:00+00:00",
            "status": "open",
            "duplicateKey": "frontend-product-zurich",
            "requiredSkills": ["React", "TypeScript", "UX"],
            "preferredSkills": ["Node.js", "Testing", "Presentation"],
            "sources": [{"platformName": "LinkedIn", "sourceUrl": "https://www.linkedin.com/jobs/view/frontend-product-intern-medflow-digital", "sourceType": "job_board", "collectedAt": now_iso(), "isActive": True, "externalPostingId": "li-medflow-frontend-2026"}],
        },
        {
            "id": "internship_3",
            "companyId": "company_4",
            "title": "Growth & CRM Intern",
            "description": "Support CRM and growth operations.",
            "location": "Olten",
            "workMode": "onsite",
            "duration": "5 months",
            "salaryRange": "CHF 1,700-2,100 / month",
            "postedDate": now_iso(),
            "deadline": "2026-09-01T00:00:00+00:00",
            "status": "open",
            "duplicateKey": "growth-crm-olten",
            "requiredSkills": ["CRM", "Excel", "Market Research"],
            "preferredSkills": ["Project Management", "Presentation", "SQL"],
            "sources": [{"platformName": "Indeed", "sourceUrl": "https://www.indeed.com/viewjob?jk=swissmove-growth-crm", "sourceType": "job_board", "collectedAt": now_iso(), "isActive": True, "externalPostingId": "indeed-swissmove-crm-2026"}],
        },
        {
            "id": "internship_4",
            "companyId": "company_1",
            "title": "AI Business Analyst Intern",
            "description": "Analyze AI use cases and business requirements.",
            "location": "Zurich",
            "workMode": "hybrid",
            "duration": "6 months",
            "salaryRange": "CHF 1,800-2,400 / month",
            "postedDate": now_iso(),
            "deadline": "2026-08-10T00:00:00+00:00",
            "status": "open",
            "duplicateKey": "ai-business-analyst-zurich",
            "requiredSkills": ["AI", "Data Analysis", "Business Strategy"],
            "preferredSkills": ["Python", "Presentation", "Market Research"],
            "sources": [{"platformName": "LinkedIn", "sourceUrl": "https://www.linkedin.com/jobs/view/ai-business-analyst-intern-zurich-finai-lab", "sourceType": "job_board", "collectedAt": now_iso(), "isActive": True, "externalPostingId": "li-finai-analyst-2026"}],
        },
        {
            "id": "internship_5",
            "companyId": "company_1",
            "title": "Product Analytics Intern",
            "description": "Support analytics and reporting.",
            "location": "Zurich",
            "workMode": "remote",
            "duration": "6 months",
            "salaryRange": "CHF 1,850-2,300 / month",
            "postedDate": now_iso(),
            "deadline": "2026-08-22T00:00:00+00:00",
            "status": "open",
            "duplicateKey": "product-analytics-zurich",
            "requiredSkills": ["SQL", "Excel", "Data Analysis"],
            "preferredSkills": ["UX", "Power BI", "Presentation"],
            "sources": [{"platformName": "Company career page", "sourceUrl": "https://example.com/finbridge/jobs/product-analytics-intern", "sourceType": "company_site", "collectedAt": now_iso(), "isActive": True, "externalPostingId": "finbridge-product-analytics-2026"}],
        },
    ]

    return {
        "users": users,
        "students": students,
        "companies": companies,
        "recruiters": recruiters,
        "internships": internships,
        "applications": [],
        "notifications": [],
        "adminAnalytics": [
            {"id": "analytics_1", "capturedAt": now_iso(), "totalStudents": 3, "totalRecruiters": 1, "totalInternships": len(internships), "totalApplications": 0, "totalNotifications": 0, "topIndustry": "AI / Consulting", "topLocation": "Zurich"}
        ],
        "tokens": {},
    }


class DataStore:
    def __init__(self, path: Path):
        self.path = path
        self.data = build_seed_data()
        self.load()

    def load(self):
        if self.path.exists():
            self.data = json.loads(self.path.read_text())
        else:
            self.save()

    def save(self):
        self.path.write_text(json.dumps(self.data, indent=2))

    def find_user_by_token(self, token: str | None):
        if not token:
            return None
        user_id = self.data["tokens"].get(token) or parse_token(token)
        if not user_id:
            return None
        return next((user for user in self.data["users"] if user["id"] == user_id), None)

    def user_payload(self, user: dict) -> dict:
        return {"id": user["id"], "email": user["email"], "role": user["role"]}


STORE = DataStore(DATA_FILE)


def company_by_id(company_id: str) -> dict | None:
    return next((company for company in STORE.data["companies"] if company["id"] == company_id), None)


def student_by_id(student_id: str) -> dict | None:
    return next((student for student in STORE.data["students"] if student["id"] == student_id), None)


def recruiter_by_id(recruiter_id: str) -> dict | None:
    return next((recruiter for recruiter in STORE.data["recruiters"] if recruiter["id"] == recruiter_id), None)


def recruiter_for_user(user_id: str) -> dict | None:
    return next((recruiter for recruiter in STORE.data["recruiters"] if recruiter["userId"] == user_id), None)


def student_for_user(user_id: str) -> dict | None:
    return next((student for student in STORE.data["students"] if student["userId"] == user_id), None)


def internship_payload(internship: dict) -> dict:
    return {
        "id": internship["id"],
        "companyId": internship["companyId"],
        "company": company_by_id(internship["companyId"]),
        "title": internship["title"],
        "description": internship["description"],
        "location": internship["location"],
        "workMode": internship["workMode"],
        "duration": internship["duration"],
        "salaryRange": internship["salaryRange"],
        "postedDate": internship["postedDate"],
        "deadline": internship["deadline"],
        "status": internship["status"],
        "duplicateKey": internship.get("duplicateKey"),
        "sources": internship.get("sources", []),
        "requirements": [
            {"skill": {"name": name}, "skillId": f"skill_{idx}", "requiredLevel": 3, "weight": 0.65}
            for idx, name in enumerate(internship.get("requiredSkills", []), start=1)
        ]
        + [
            {"skill": {"name": name}, "skillId": f"skill_pref_{idx}", "requiredLevel": 2, "weight": 0.35}
            for idx, name in enumerate(internship.get("preferredSkills", []), start=1)
        ],
    }


def student_payload(student: dict) -> dict:
    user = next(user for user in STORE.data["users"] if user["id"] == student["userId"])
    return {
        "id": student["id"],
        "userId": student["userId"],
        "firstName": student["firstName"],
        "lastName": student["lastName"],
        "degreeProgram": student["degreeProgram"],
        "semester": student["semester"],
        "locationPreference": student["locationPreference"],
        "industryPreference": student["industryPreference"],
        "availability": student["availability"],
        "cvUrl": student["cvUrl"],
        "cvSummary": student["cvSummary"],
        "avatarUrl": student.get("avatarUrl", ""),
        "languages": student.get("languages", ["English"]),
        "mode": student.get("mode", "Hybrid"),
        "user": {"email": user["email"]},
        "skills": [
            {
                "skillId": f"skill_{idx}",
                "proficiency": skill.get("proficiency", 3),
                "yearsExperience": skill.get("yearsExperience", 1),
                "skill": {"id": f"skill_{idx}", "name": skill["name"], "category": skill.get("category", "general")},
            }
            for idx, skill in enumerate(student.get("skills", []), start=1)
        ],
        "projects": student.get("projects", []),
        "cvDocuments": [],
    }


def application_payload(application: dict, include_student: bool = False) -> dict:
    payload = {
        "id": application["id"],
        "studentId": application["studentId"],
        "internshipId": application["internshipId"],
        "applicationDate": application["applicationDate"],
        "status": application["status"],
        "recruiterNotes": application.get("recruiterNotes", ""),
        "internship": internship_payload(next(item for item in STORE.data["internships"] if item["id"] == application["internshipId"])),
    }
    if include_student:
        payload["student"] = student_payload(next(item for item in STORE.data["students"] if item["id"] == application["studentId"]))
    return payload


def recommendation_for(student: dict, internship: dict) -> dict:
    student_skills = {skill["name"].lower() for skill in student.get("skills", [])}
    required = internship.get("requiredSkills", [])
    preferred = internship.get("preferredSkills", [])
    exact_required = [skill for skill in required if skill.lower() in student_skills]
    exact_preferred = [skill for skill in preferred if skill.lower() in student_skills]
    missing = [skill for skill in required if skill.lower() not in student_skills]
    interests = [item.strip().lower() for item in student.get("industryPreference", "").split(",") if item.strip()]
    company_industry = (company_by_id(internship["companyId"]) or {}).get("industry", "").lower()
    profile_vector = student_embedding(student)
    internship_vector = internship_embedding(internship)
    semantic_score, provider = semantic_similarity(student, internship, profile_vector, internship_vector)
    required_coverage = len(exact_required) / len(required) if required else 0.6
    preferred_coverage = len(exact_preferred) / len(preferred) if preferred else 0.4
    category_fit = (sum(1 for item in interests if item in company_industry) / len(interests)) if interests else 0.35
    location_fit = 1.0 if student.get("locationPreference", "").lower() == internship.get("location", "").lower() else 0.0
    mode_fit = 1.0 if student.get("mode", "Hybrid").lower().replace("-", "") == internship.get("workMode", "").lower() else 0.6 if internship.get("workMode", "").lower() == "hybrid" else 0.0
    availability_fit = 0.85
    rule_based_score = round(
        (
            ((required_coverage * 0.7) + (preferred_coverage * 0.3)) * 0.5
            + max(category_fit, 0.35) * 0.25
            + ((location_fit * 0.5) + (mode_fit * 0.15) + (availability_fit * 0.35)) * 0.25
        )
        * 100
    )
    score = min(
        99,
        round(
            (
                rule_based_score * 0.6
                + round(semantic_score * 100) * 0.4
            )
        ),
    )
    overlap = weighted_overlap(profile_vector, internship_vector)
    signals = list(dict.fromkeys(exact_required + exact_preferred + overlap))
    explanation = (
        f"Strong fit for {internship['title']} because the semantic profile aligns on "
        f"{', '.join(signals[:4]) or 'adjacent capabilities'}."
        + (f" Category fit is strong for {', '.join(interests[:2])}. " if category_fit >= 0.55 and interests else " ")
        + (f"Main growth area: {', '.join(missing)}." if missing else "All required skills are covered.")
    )
    return {
        "internship": internship_payload(internship),
        "matchScore": score,
        "explanation": explanation,
        "matchingProvider": provider,
        "scores": {
            "embedding": round(semantic_score * 100),
            "skills": round(((required_coverage * 0.7) + (preferred_coverage * 0.3)) * 100),
            "preferences": round(max(category_fit, 0.35) * 100),
            "availability": round(((location_fit * 0.45) + (mode_fit * 0.3) + (availability_fit * 0.25)) * 100),
            "ruleBased": rule_based_score,
        },
        "provider": provider,
    }


class Handler(BaseHTTPRequestHandler):
    server_version = "LycanMockAPI/1.0"

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS")
        super().end_headers()

    def log_message(self, fmt, *args):
        return

    def json_body(self) -> dict:
        length = int(self.headers.get("Content-Length", "0"))
        if not length:
            return {}
        return json.loads(self.rfile.read(length).decode("utf-8"))

    def multipart_file(self, field_name: str = "cv"):
        content_type = self.headers.get("Content-Type", "")
        if "multipart/form-data" not in content_type:
            return None
        boundary_match = re.search(r"boundary=([^;]+)", content_type)
        if not boundary_match:
            return None
        boundary = boundary_match.group(1).strip().strip('"').encode("utf-8")
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length)
        parts = raw.split(b"--" + boundary)
        for part in parts:
            if f'name="{field_name}"'.encode("utf-8") not in part:
                continue
            header_blob, _, body = part.partition(b"\r\n\r\n")
            disposition = header_blob.decode("utf-8", "ignore")
            filename_match = re.search(r'filename="([^"]+)"', disposition)
            if not filename_match:
                continue
            filename = Path(filename_match.group(1)).name or f"{next_id('cv')}.pdf"
            content = body.rstrip(b"\r\n-")
            mime_match = re.search(r"Content-Type:\s*([^\r\n]+)", disposition)
            return {
                "filename": filename,
                "content": content,
                "contentType": mime_match.group(1).strip() if mime_match else "application/octet-stream",
            }
        return None

    def send_json(self, code: int, payload):
        data = json.dumps(payload).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def send_file(self, file_path: Path, content_type: str = "application/octet-stream"):
        data = file_path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def send_text(self, code: int, text: str, content_type: str):
        data = text.encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def serve_frontend(self, path: str) -> bool:
        static_files = {
            "/": ("index.html", "text/html; charset=utf-8"),
            "/index.html": ("index.html", "text/html; charset=utf-8"),
            "/styles.css": ("styles.css", "text/css; charset=utf-8"),
            "/app.js": ("app.js", "text/javascript; charset=utf-8"),
            "/apiClient.js": ("apiClient.js", "text/javascript; charset=utf-8"),
            "/lucide-icons.js": ("lucide-icons.js", "text/javascript; charset=utf-8"),
        }
        if path == "/runtime-config.js":
            host, port = self.server.server_address[:2]
            self.send_text(
                200,
                f'window.FHNW_API_BASE_URL = "http://{host}:{port}/api";\n',
                "text/javascript; charset=utf-8",
            )
            return True
        if path.startswith("/public/"):
            file_path = (FRONTEND_DIR / path.lstrip("/")).resolve()
            public_dir = (FRONTEND_DIR / "public").resolve()
            if public_dir not in file_path.parents or not file_path.is_file():
                return False
            content_type, _ = mimetypes.guess_type(str(file_path))
            self.send_file(file_path, content_type or "application/octet-stream")
            return True
        asset = static_files.get(path)
        if not asset:
            return False
        file_name, content_type = asset
        file_path = FRONTEND_DIR / file_name
        if not file_path.is_file():
            self.send_json(500, {"error": f"Frontend asset missing: {file_name}"})
            return True
        self.send_file(file_path, content_type)
        return True

    def auth_user(self):
        header = self.headers.get("Authorization", "")
        token = header.replace("Bearer ", "", 1) if header.startswith("Bearer ") else None
        return STORE.find_user_by_token(token)

    def require_role(self, user, *roles):
        if user["role"] not in roles:
            self.send_json(403, {"error": "You do not have permission to perform this action"})
            return False
        return True

    def require_auth(self):
        user = self.auth_user()
        if not user:
            self.send_json(401, {"error": "Missing or invalid bearer token"})
            return None
        return user

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        path = urlparse(self.path).path
        if self.serve_frontend(path):
            return
        if path.startswith("/uploads/"):
            file_path = ROOT / path.lstrip("/")
            if file_path.exists() and file_path.is_file():
                content_type, _ = mimetypes.guess_type(str(file_path))
                self.send_file(file_path, content_type or "application/octet-stream")
            else:
                self.send_json(404, {"error": "File not found"})
            return
        if path == "/api":
            self.send_json(200, {
                "service": "Lycan Mock API",
                "message": "API is running. Open the frontend app at http://127.0.0.1:4000/",
            })
            return
        if path == "/api/health":
            self.send_json(200, {
                "status": "ok",
                "service": "Lycan Mock API",
                "providers": {
                    "matching": MATCHING_PROVIDER,
                    "explanation": EXPLANATION_PROVIDER,
                },
                "readiness": {
                    "openaiApiKeyConfigured": bool(OPENAI_API_KEY),
                    "embeddingProviderReady": MATCHING_PROVIDER != "openai" or bool(OPENAI_API_KEY),
                    "explanationProviderReady": EXPLANATION_PROVIDER != "openai" or bool(OPENAI_API_KEY),
                },
            })
            return

        if path == "/api/auth/me":
            user = self.auth_user()
            if not user:
                self.send_json(200, {
                    "user": None,
                    "authenticated": False,
                    "message": "No active session. Open the frontend app and log in there.",
                    "frontendUrl": "http://127.0.0.1:4000/",
                })
                return
            self.send_json(200, {"user": STORE.user_payload(user), "authenticated": True})
            return

        user = self.require_auth()
        if path != "/api/health" and not user:
            return
        if path == "/api/students/me":
            student = student_for_user(user["id"])
            if not student:
                self.send_json(404, {"error": "Student profile not found"})
                return
            self.send_json(200, student_payload(student))
            return
        if path == "/api/recruiters/me":
            recruiter = recruiter_for_user(user["id"])
            if not recruiter:
                self.send_json(404, {"error": "Recruiter profile not found"})
                return
            payload = dict(recruiter)
            payload["company"] = company_by_id(recruiter["companyId"])
            payload["notifications"] = [item for item in STORE.data["notifications"] if item.get("recruiterId") == recruiter["id"]]
            self.send_json(200, payload)
            return
        if path == "/api/students":
            if not self.require_role(user, "recruiter", "admin"):
                return
            self.send_json(200, [student_payload(student) for student in STORE.data["students"]])
            return
        if path == "/api/companies":
            if not self.require_role(user, "recruiter", "admin"):
                return
            self.send_json(200, STORE.data["companies"])
            return
        if path == "/api/internships":
            self.send_json(200, [internship_payload(item) for item in STORE.data["internships"] if item["status"] == "open"])
            return
        if path == "/api/applications":
            if not self.require_role(user, "admin"):
                return
            self.send_json(200, [application_payload(item, include_student=True) for item in STORE.data["applications"]])
            return
        if path.startswith("/api/applications/student/"):
            student_id = path.rsplit("/", 1)[-1]
            student = student_for_user(user["id"])
            if user["role"] != "admin" and (not student or student["id"] != student_id):
                self.send_json(403, {"error": "You do not have permission to view these applications"})
                return
            items = [application_payload(item) for item in STORE.data["applications"] if item["studentId"] == student_id]
            self.send_json(200, items)
            return
        if path.startswith("/api/applications/recruiter/"):
            recruiter_id = path.rsplit("/", 1)[-1]
            recruiter = recruiter_by_id(recruiter_id)
            if not recruiter:
                self.send_json(404, {"error": "Recruiter not found"})
                return
            current_recruiter = recruiter_for_user(user["id"]) if user["role"] == "recruiter" else None
            if user["role"] != "admin" and (not current_recruiter or current_recruiter["id"] != recruiter_id):
                self.send_json(403, {"error": "You do not have permission to view these applications"})
                return
            company_id = recruiter["companyId"]
            items = [
                application_payload(item, include_student=True)
                for item in STORE.data["applications"]
                if next(internship for internship in STORE.data["internships"] if internship["id"] == item["internshipId"])["companyId"] == company_id
            ]
            self.send_json(200, items)
            return
        if path == "/api/notifications":
            if user["role"] == "student":
                student = student_for_user(user["id"])
                filtered = [item for item in STORE.data["notifications"] if item.get("studentId") == student["id"]]
            elif user["role"] == "recruiter":
                recruiter = recruiter_for_user(user["id"])
                filtered = [item for item in STORE.data["notifications"] if item.get("recruiterId") == recruiter["id"]]
            else:
                filtered = STORE.data["notifications"]
            self.send_json(200, filtered)
            return
        if path.startswith("/api/recommendations/"):
            student_id = path.rsplit("/", 1)[-1]
            student = student_by_id(student_id)
            if not student:
                self.send_json(404, {"error": "Student not found"})
                return
            current_student = student_for_user(user["id"]) if user["role"] == "student" else None
            if user["role"] != "admin" and (not current_student or current_student["id"] != student_id):
                self.send_json(403, {"error": "You do not have permission to view these recommendations"})
                return
            recommendations = sorted(
                [recommendation_for(student, internship) for internship in STORE.data["internships"] if internship["status"] == "open"],
                key=lambda item: item["matchScore"],
                reverse=True,
            )
            self.send_json(200, recommendations)
            return
        if path == "/api/admin/stats":
            if not self.require_role(user, "admin"):
                return
            stats = {
                "students": len(STORE.data["students"]),
                "recruiters": len(STORE.data["recruiters"]),
                "internships": len(STORE.data["internships"]),
                "applications": len(STORE.data["applications"]),
                "notifications": len(STORE.data["notifications"]),
            }
            self.send_json(200, stats)
            return
        if path == "/api/admin/sources":
            if not self.require_role(user, "admin"):
                return
            sources = []
            for internship in STORE.data["internships"]:
                for source in internship.get("sources", []):
                    sources.append({**source, "internship": internship_payload(internship)})
            self.send_json(200, sources)
            return
        if path == "/api/admin/analytics":
            if not self.require_role(user, "admin"):
                return
            stats = STORE.data["adminAnalytics"]
            self.send_json(200, stats)
            return

        self.send_json(404, {"error": "Not found"})

    def do_POST(self):
        path = urlparse(self.path).path

        if path == "/api/auth/register":
            body = self.json_body()
            email = body.get("email", "").strip().lower()
            password = body.get("password", "")
            role = body.get("role", "student")
            if not email or not password:
                self.send_json(400, {"error": "Email and password are required"})
                return
            if role not in {"student", "recruiter"}:
                self.send_json(400, {"error": "Public registration supports only student or recruiter accounts"})
                return
            if any(user["email"] == email for user in STORE.data["users"]):
                self.send_json(409, {"error": "Email is already registered"})
                return
            user = {"id": next_id("user"), "email": email, "passwordHash": hash_password(password), "role": role, "createdAt": now_iso(), "updatedAt": now_iso()}
            STORE.data["users"].append(user)
            token = encode_token(user["id"])
            STORE.data["tokens"][token] = user["id"]
            STORE.save()
            self.send_json(201, {"user": STORE.user_payload(user), "token": token})
            return

        if path == "/api/auth/login":
            body = self.json_body()
            email = body.get("email", "").strip().lower()
            password = body.get("password", "")
            user = next((user for user in STORE.data["users"] if user["email"] == email and user["passwordHash"] == hash_password(password)), None)
            if not user:
                self.send_json(401, {"error": "Invalid email or password"})
                return
            token = encode_token(user["id"])
            STORE.data["tokens"][token] = user["id"]
            STORE.save()
            self.send_json(200, {"user": STORE.user_payload(user), "token": token})
            return

        user = self.require_auth()
        if not user:
            return

        if path == "/api/cv/upload":
            if not self.require_role(user, "student", "admin"):
                return
            uploaded = self.multipart_file()
            if not uploaded:
                self.send_json(400, {"error": "CV file is required"})
                return
            UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
            stored_name = f"{next_id('cv')}-{uploaded['filename']}"
            stored_path = UPLOAD_DIR / stored_name
            stored_path.write_bytes(uploaded["content"])
            self.send_json(201, {
                "fileName": uploaded["filename"],
                "storedPath": f"uploads/{stored_name}",
                "url": f"/uploads/{stored_name}",
            })
            return

        if path == "/api/profile/avatar":
            if not self.require_role(user, "student", "admin"):
                return
            uploaded = self.multipart_file("avatar")
            allowed_types = {"image/png", "image/jpeg", "image/webp"}
            if not uploaded:
                self.send_json(400, {"error": "Profile photo is required"})
                return
            if uploaded["contentType"].lower() not in allowed_types:
                self.send_json(400, {"error": "Use a PNG, JPG, or WebP profile photo"})
                return
            if len(uploaded["content"]) > 5 * 1024 * 1024:
                self.send_json(400, {"error": "Profile photos must be 5 MB or smaller"})
                return
            student = student_for_user(user["id"]) if user["role"] == "student" else None
            if not student:
                self.send_json(404, {"error": "Student profile not found"})
                return
            extension = Path(uploaded["filename"]).suffix.lower()
            if extension not in {".png", ".jpg", ".jpeg", ".webp"}:
                extension = {"image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp"}[uploaded["contentType"].lower()]
            UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
            stored_name = f"{student['id']}-avatar-{secrets.token_hex(8)}{extension}"
            (UPLOAD_DIR / stored_name).write_bytes(uploaded["content"])
            student["avatarUrl"] = f"/uploads/{stored_name}"
            STORE.save()
            self.send_json(201, {"url": student["avatarUrl"], "fileName": uploaded["filename"]})
            return

        if path == "/api/cv/parse":
            if not self.require_role(user, "student", "admin"):
                return
            uploaded = self.multipart_file()
            if not uploaded:
                self.send_json(400, {"error": "CV file is required"})
                return
            text = uploaded["content"].decode("latin-1", "ignore")
            filename_text = uploaded["filename"].replace("-", " ").replace("_", " ")
            combined_text = f"{filename_text}\n{text}"
            skills = extract_keywords(combined_text)
            lines = [line.strip() for line in combined_text.splitlines() if line.strip()]
            experience = [line for line in lines if any(keyword in line.lower() for keyword in ("experience", "intern", "project", "analyst", "assistant"))][:4]
            education = [line for line in lines if any(keyword in line.lower() for keyword in ("education", "fhnw", "bsc", "msc", "university"))][:4]
            self.send_json(200, {
                "textPreview": combined_text[:1000],
                "skills": skills,
                "experience": experience or ["FHNW student experience extracted from CV"],
                "education": education or ["FHNW education context detected"],
            })
            return

        if path == "/api/students":
            body = self.json_body()
            if not self.require_role(user, "student", "admin"):
                return
            if user["role"] == "student" and body.get("userId") != user["id"]:
                self.send_json(403, {"error": "You can only create your own student profile"})
                return
            student = {
                "id": next_id("student"),
                "userId": body["userId"],
                "firstName": body.get("firstName", ""),
                "lastName": body.get("lastName", ""),
                "degreeProgram": body.get("degreeProgram", ""),
                "semester": int(body.get("semester", 1)),
                "locationPreference": body.get("locationPreference", "Zurich"),
                "industryPreference": body.get("industryPreference", ""),
                "availability": body.get("availability") or (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
                "cvUrl": body.get("cvUrl", ""),
                "cvSummary": body.get("cvSummary", ""),
                "skills": body.get("skills", []),
                "projects": body.get("projects", []),
                "languages": body.get("languages", ["English"]),
                "mode": body.get("mode", "Hybrid"),
            }
            STORE.data["students"].append(student)
            STORE.save()
            self.send_json(201, student_payload(student))
            return

        if path == "/api/recruiters":
            body = self.json_body()
            if not self.require_role(user, "recruiter", "admin"):
                return
            if user["role"] == "recruiter" and body.get("userId") != user["id"]:
                self.send_json(403, {"error": "You can only create your own recruiter profile"})
                return
            recruiter = {
                "id": next_id("recruiter"),
                "userId": body["userId"],
                "companyId": body["companyId"],
                "firstName": body.get("firstName", ""),
                "lastName": body.get("lastName", ""),
                "role": body.get("role", ""),
            }
            STORE.data["recruiters"].append(recruiter)
            STORE.save()
            self.send_json(201, recruiter)
            return

        if path == "/api/companies":
            body = self.json_body()
            if not self.require_role(user, "recruiter", "admin"):
                return
            company = {
                "id": next_id("company"),
                "name": body.get("name", ""),
                "email": body.get("email", ""),
                "industry": body.get("industry", ""),
                "location": body.get("location", ""),
                "description": body.get("description", ""),
                "createdAt": now_iso(),
                "updatedAt": now_iso(),
            }
            STORE.data["companies"].append(company)
            STORE.save()
            self.send_json(201, company)
            return

        if path == "/api/internships":
            body = self.json_body()
            if not self.require_role(user, "recruiter", "admin"):
                return
            if user["role"] == "recruiter":
                recruiter = recruiter_for_user(user["id"])
                if not recruiter or recruiter["companyId"] != body.get("companyId"):
                    self.send_json(403, {"error": "You can only create internships for your own company"})
                    return
            internship = {
                "id": next_id("internship"),
                "companyId": body.get("companyId"),
                "title": body.get("title", ""),
                "description": body.get("description", ""),
                "location": body.get("location", ""),
                "workMode": body.get("workMode", "hybrid"),
                "duration": body.get("duration", "6 months"),
                "salaryRange": body.get("salaryRange", ""),
                "postedDate": now_iso(),
                "deadline": body.get("deadline") or (datetime.now(timezone.utc) + timedelta(days=60)).isoformat(),
                "status": "open",
                "duplicateKey": body.get("duplicateKey"),
                "requiredSkills": [item["name"] for item in body.get("requiredSkills", [])],
                "preferredSkills": [item["name"] for item in body.get("preferredSkills", [])],
                "sources": [dict(body["source"], collectedAt=now_iso(), isActive=True)] if body.get("source") else [],
            }
            STORE.data["internships"].append(internship)
            STORE.save()
            self.send_json(201, internship_payload(internship))
            return

        if path == "/api/applications":
            body = self.json_body()
            if not self.require_role(user, "student", "admin"):
                return
            internship_id = body.get("internshipId")
            student_id = body.get("studentId")
            current_student = student_for_user(user["id"]) if user["role"] == "student" else None
            if user["role"] == "student" and (not current_student or current_student["id"] != student_id):
                self.send_json(403, {"error": "You can only apply as your own student profile"})
                return
            if any(item["studentId"] == student_id and item["internshipId"] == internship_id for item in STORE.data["applications"]):
                self.send_json(409, {"error": "Application already exists"})
                return
            application = {
                "id": next_id("application"),
                "studentId": student_id,
                "internshipId": internship_id,
                "applicationDate": now_iso(),
                "status": "Applied",
                "recruiterNotes": "",
            }
            STORE.data["applications"].append(application)
            internship = next(item for item in STORE.data["internships"] if item["id"] == internship_id)
            recruiter = next((item for item in STORE.data["recruiters"] if item["companyId"] == internship["companyId"]), None)
            STORE.data["notifications"].insert(0, {
                "id": next_id("notification"),
                "studentId": student_id,
                "recruiterId": None,
                "applicationId": application["id"],
                "message": f"Application submitted for {internship['title']}.",
                "type": "application_submitted",
                "isRead": False,
                "createdAt": now_iso(),
            })
            if recruiter:
                STORE.data["notifications"].insert(0, {
                    "id": next_id("notification"),
                    "studentId": None,
                    "recruiterId": recruiter["id"],
                    "applicationId": application["id"],
                    "message": f"New application received for {internship['title']}.",
                    "type": "application_submitted",
                    "isRead": False,
                    "createdAt": now_iso(),
                })
            STORE.save()
            self.send_json(201, application_payload(application))
            return

        self.send_json(404, {"error": "Not found"})

    def do_PUT(self):
        path = urlparse(self.path).path
        body = self.json_body()
        user = self.require_auth()
        if not user:
            return

        if path.startswith("/api/students/"):
            student_id = path.rsplit("/", 1)[-1]
            student = student_by_id(student_id)
            if not student:
                self.send_json(404, {"error": "Student not found"})
                return
            current_student = student_for_user(user["id"]) if user["role"] == "student" else None
            if user["role"] != "admin" and (not current_student or current_student["id"] != student_id):
                self.send_json(403, {"error": "You can only update your own student profile"})
                return
            student.update({
                "firstName": body.get("firstName", student["firstName"]),
                "lastName": body.get("lastName", student["lastName"]),
                "degreeProgram": body.get("degreeProgram", student["degreeProgram"]),
                "semester": int(body.get("semester", student["semester"])),
                "locationPreference": body.get("locationPreference", student["locationPreference"]),
                "industryPreference": body.get("industryPreference", student["industryPreference"]),
                "availability": body.get("availability", student["availability"]),
                "cvUrl": body.get("cvUrl", student["cvUrl"]),
                "cvSummary": body.get("cvSummary", student["cvSummary"]),
                "avatarUrl": body.get("avatarUrl", student.get("avatarUrl", "")),
                "skills": body.get("skills", student["skills"]),
                "projects": body.get("projects", student["projects"]),
                "languages": body.get("languages", student.get("languages", ["English"])),
                "mode": body.get("mode", student.get("mode", "Hybrid")),
            })
            STORE.save()
            self.send_json(200, student_payload(student))
            return

        if path.startswith("/api/companies/"):
            company_id = path.rsplit("/", 1)[-1]
            company = company_by_id(company_id)
            if not company:
                self.send_json(404, {"error": "Company not found"})
                return
            current_recruiter = recruiter_for_user(user["id"]) if user["role"] == "recruiter" else None
            if user["role"] != "admin" and (not current_recruiter or current_recruiter["companyId"] != company_id):
                self.send_json(403, {"error": "You can only update your own company"})
                return
            company.update({
                "name": body.get("name", company["name"]),
                "email": body.get("email", company["email"]),
                "industry": body.get("industry", company["industry"]),
                "location": body.get("location", company["location"]),
                "website": body.get("website", company.get("website", "")),
                "careerPage": body.get("careerPage", company.get("careerPage", "")),
                "description": body.get("description", company["description"]),
                "updatedAt": now_iso(),
            })
            STORE.save()
            self.send_json(200, company)
            return

        if path.startswith("/api/internships/") and not path.endswith("/status"):
            internship_id = path.rsplit("/", 1)[-1]
            internship = next((item for item in STORE.data["internships"] if item["id"] == internship_id), None)
            if not internship:
                self.send_json(404, {"error": "Internship not found"})
                return
            current_recruiter = recruiter_for_user(user["id"]) if user["role"] == "recruiter" else None
            if user["role"] != "admin" and (not current_recruiter or current_recruiter["companyId"] != internship["companyId"]):
                self.send_json(403, {"error": "You can only update internships for your own company"})
                return
            internship.update({
                "title": body.get("title", internship["title"]),
                "description": body.get("description", internship["description"]),
                "location": body.get("location", internship["location"]),
                "workMode": body.get("workMode", internship["workMode"]),
                "duration": body.get("duration", internship["duration"]),
                "salaryRange": body.get("salaryRange", internship["salaryRange"]),
                "deadline": body.get("deadline", internship["deadline"]),
                "duplicateKey": body.get("duplicateKey", internship.get("duplicateKey")),
                "requiredSkills": [item["name"] for item in body.get("requiredSkills", [{"name": name} for name in internship.get("requiredSkills", [])])],
                "preferredSkills": [item["name"] for item in body.get("preferredSkills", [{"name": name} for name in internship.get("preferredSkills", [])])],
            })
            STORE.save()
            self.send_json(200, internship_payload(internship))
            return

        if path.startswith("/api/applications/") and path.endswith("/status"):
            application_id = path.split("/")[-2]
            application = next((item for item in STORE.data["applications"] if item["id"] == application_id), None)
            if not application:
                self.send_json(404, {"error": "Application not found"})
                return
            if not self.require_role(user, "recruiter", "admin"):
                return
            internship = next(item for item in STORE.data["internships"] if item["id"] == application["internshipId"])
            current_recruiter = recruiter_for_user(user["id"]) if user["role"] == "recruiter" else None
            if user["role"] != "admin" and (not current_recruiter or current_recruiter["companyId"] != internship["companyId"]):
                self.send_json(403, {"error": "You can only update applications for your own company"})
                return
            next_status = body.get("status", application["status"])
            if not valid_status_transition(application["status"], next_status):
                self.send_json(400, {"error": f"Invalid status transition from {application['status']} to {next_status}"})
                return
            application["status"] = next_status
            application["recruiterNotes"] = body.get("recruiterNotes", application.get("recruiterNotes", ""))
            STORE.data["notifications"].insert(0, {
                "id": next_id("notification"),
                "studentId": application["studentId"],
                "recruiterId": None,
                "applicationId": application["id"],
                "message": f"{internship['title']} status updated to {application['status']}.",
                "type": "application_status_updated",
                "isRead": False,
                "createdAt": now_iso(),
            })
            STORE.save()
            self.send_json(200, application_payload(application, include_student=True))
            return

        if path.startswith("/api/notifications/") and path.endswith("/read"):
            notification_id = path.split("/")[-2]
            notification = next((item for item in STORE.data["notifications"] if item["id"] == notification_id), None)
            if not notification:
                self.send_json(404, {"error": "Notification not found"})
                return
            if user["role"] == "student":
                student = student_for_user(user["id"])
                if not student or notification.get("studentId") != student["id"]:
                    self.send_json(403, {"error": "You can only update your own notifications"})
                    return
            elif user["role"] == "recruiter":
                recruiter = recruiter_for_user(user["id"])
                if not recruiter or notification.get("recruiterId") != recruiter["id"]:
                    self.send_json(403, {"error": "You can only update your own notifications"})
                    return
            notification["isRead"] = True
            STORE.save()
            self.send_json(200, notification)
            return

        self.send_json(404, {"error": "Not found"})


def main():
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"Lycan mock API listening on http://{HOST}:{PORT}")
    server.serve_forever()


if __name__ == "__main__":
    main()
