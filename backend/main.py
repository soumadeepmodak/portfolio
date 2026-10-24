
import io
import os
import smtplib
from email.message import EmailMessage
from pathlib import Path

import cloudinary
import cloudinary.uploader
import firebase_admin

from dotenv import load_dotenv
from fastapi import (
    FastAPI,
    Depends,
    File,
    HTTPException,
    UploadFile,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import credentials, auth, firestore
from pydantic import BaseModel, Field


# ---------------- ENVIRONMENT CONFIGURATION ----------------

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

# Firebase service account
# Render uses its Secret File; local development uses the local JSON file.
service_path = Path(
    os.getenv(
        "FIREBASE_SERVICE_ACCOUNT_PATH",
        str(BASE_DIR / "firebase-service-account.json"),
    )
)

if not service_path.is_file():
    raise RuntimeError(
        f"Firebase service account file not found at: {service_path}"
    )

if not firebase_admin._apps:
    firebase_credential = credentials.Certificate(str(service_path))
    firebase_admin.initialize_app(firebase_credential)

db = firestore.client()


# ---------------- CLOUDINARY CONFIGURATION ----------------

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True,
)


# ---------------- FASTAPI APPLICATION ----------------

app = FastAPI(title="My Portfolio API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "https://portfolio-dusky-nine-23.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

security = HTTPBearer(auto_error=False)
ADMIN_UID = "PuosNYo4JCOhP8vJCSHcSAxQ9Rt2"


@app.get("/")
def home():
    return {"message": "Portfolio Backend is running!"}


@app.get("/healthz")
def health_check():
    return {"status": "ok"}


# ---------------- ADMIN AUTHENTICATION ----------------

def verify_admin(
    credentials_header: HTTPAuthorizationCredentials | None = Depends(
        security
    ),
):
    if credentials_header is None:
        raise HTTPException(status_code=401, detail="Login required.")

    try:
        decoded_token = auth.verify_id_token(
            credentials_header.credentials
        )
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired login token.",
        )

    if decoded_token.get("uid") != ADMIN_UID:
        raise HTTPException(
            status_code=403,
            detail="Admin access required.",
        )

    return decoded_token


# ---------------- RESUME API ----------------

@app.get("/api/resume")
def get_resume():
    try:
        snapshot = db.collection("siteContent").document("resume").get()

        if not snapshot.exists:
            return {
                "url": None,
                "fileName": None,
                "message": "No resume uploaded yet.",
            }

        data = snapshot.to_dict() or {}
        return {
            "url": data.get("url"),
            "fileName": data.get("fileName"),
            "message": "Resume loaded.",
        }
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Could not load resume information.",
        )


@app.post("/api/resume")
async def upload_resume(
    file: UploadFile = File(...),
    admin=Depends(verify_admin),
):
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed.",
        )

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Please select a PDF file.",
        )

    content = await file.read(10 * 1024 * 1024 + 1)

    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="PDF must be 10 MB or smaller.",
        )

    if not content.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=400,
            detail="The selected file is not a valid PDF.",
        )

    try:
        result = cloudinary.uploader.upload(
            io.BytesIO(content),
            resource_type="raw",
            public_id="portfolio/resume.pdf",
            overwrite=True,
            invalidate=True,
        )

        resume_data = {
            "url": result["secure_url"],
            "fileName": file.filename,
            "updatedAt": firestore.SERVER_TIMESTAMP,
        }

        db.collection("siteContent").document("resume").set(resume_data)

        return {
            "url": result["secure_url"],
            "fileName": file.filename,
            "message": "Resume uploaded successfully.",
        }
    except Exception:
        raise HTTPException(
            status_code=500,
            detail=(
                "Resume upload failed. Check server configuration "
                "and Cloudinary/Firestore permissions."
            ),
        )


# ---------------- PROFILE PHOTO API ----------------

@app.get("/api/profile-photo")
def get_profile_photo():
    try:
        snapshot = (
            db.collection("siteContent").document("profilePhoto").get()
        )

        if not snapshot.exists:
            return {
                "url": None,
                "fileName": None,
                "message": "No profile photo uploaded yet.",
            }

        data = snapshot.to_dict() or {}
        return {
            "url": data.get("url"),
            "fileName": data.get("fileName"),
            "message": "Profile photo loaded.",
        }
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Could not load profile photo information.",
        )


@app.post("/api/profile-photo")
async def upload_profile_photo(
    file: UploadFile = File(...),
    admin=Depends(verify_admin),
):
    if file.content_type not in {
        "image/jpeg",
        "image/png",
        "image/webp",
    }:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG or WEBP images are allowed.",
        )

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Please select an image.",
        )

    extension = Path(file.filename).suffix.lower()
    if extension not in {".jpg", ".jpeg", ".png", ".webp"}:
        raise HTTPException(
            status_code=400,
            detail="Please select a JPG, PNG or WEBP image.",
        )

    content = await file.read(5 * 1024 * 1024 + 1)

    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="Image must be 5 MB or smaller.",
        )

    valid_image = (
        content.startswith(b"\xff\xd8\xff")
        or content.startswith(b"\x89PNG\r\n\x1a\n")
        or (
            content.startswith(b"RIFF")
            and content[8:12] == b"WEBP"
        )
    )

    if not valid_image:
        raise HTTPException(
            status_code=400,
            detail="The selected file is not a valid supported image.",
        )

    try:
        result = cloudinary.uploader.upload(
            io.BytesIO(content),
            resource_type="image",
            public_id="portfolio/profile-photo",
            overwrite=True,
            invalidate=True,
        )

        photo_data = {
            "url": result["secure_url"],
            "fileName": file.filename,
            "updatedAt": firestore.SERVER_TIMESTAMP,
        }

        db.collection("siteContent").document("profilePhoto").set(
            photo_data
        )

        return {
            "url": result["secure_url"],
            "fileName": file.filename,
            "message": "Profile photo uploaded successfully.",
        }
    except Exception:
        raise HTTPException(
            status_code=500,
            detail=(
                "Photo upload failed. Check Cloudinary and "
                "Firestore configuration."
            ),
        )


# ---------------- EMAIL CONFIGURATION ----------------

def get_smtp_config():
    sender_email = os.getenv("SMTP_EMAIL", "").strip()
    app_password = os.getenv("SMTP_APP_PASSWORD", "").replace(" ", "")

    if not sender_email or not app_password:
        raise HTTPException(
            status_code=500,
            detail="Gmail SMTP configuration is missing on the server.",
        )

    return sender_email, app_password


def send_email(email_message, sender_email, app_password):
    try:
        with smtplib.SMTP("smtp.gmail.com", 587, timeout=20) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(sender_email, app_password)
            server.send_message(email_message)
    except Exception:
        raise HTTPException(
            status_code=502,
            detail="Email could not be sent. Check SMTP configuration.",
        )


# ---------------- CONTACT REPLY API ----------------

class ReplyRequest(BaseModel):
    reply: str = Field(min_length=1, max_length=5000)


@app.post("/api/contact-messages/{message_id}/reply")
def reply_to_contact_message(
    message_id: str,
    request: ReplyRequest,
    admin=Depends(verify_admin),
):
    reply_text = request.reply.strip()

    if not reply_text:
        raise HTTPException(
            status_code=400,
            detail="Reply cannot be empty.",
        )

    sender_email, app_password = get_smtp_config()
    message_ref = db.collection("contactMessages").document(message_id)

    try:
        message_snapshot = message_ref.get()
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Could not load the contact message.",
        )

    if not message_snapshot.exists:
        raise HTTPException(
            status_code=404,
            detail="Contact message not found.",
        )

    message_data = message_snapshot.to_dict() or {}
    recipient_email = str(message_data.get("email", "")).strip()
    original_subject = str(message_data.get("subject", "")).strip()
    original_message = str(message_data.get("message", "")).strip()
    visitor_name = str(message_data.get("name", "there")).strip()

    if (
        not recipient_email
        or "@" not in recipient_email
        or "\r" in recipient_email
        or "\n" in recipient_email
    ):
        raise HTTPException(
            status_code=400,
            detail="The visitor email address is invalid.",
        )

    email_message = EmailMessage()
    email_message["From"] = sender_email
    email_message["To"] = recipient_email
    email_message["Reply-To"] = sender_email
    email_message["Subject"] = (
        f"Re: {original_subject or 'Portfolio enquiry'}"
    )
    email_message.set_content(
        f"Hello {visitor_name},\n\n"
        f"{reply_text}\n\n"
        f"--- Your original message ---\n"
        f"{original_message}\n\n"
        "Regards,\nPortfolio Owner"
    )

    send_email(email_message, sender_email, app_password)

    try:
        message_ref.collection("replies").add({
            "reply": reply_text,
            "to": recipient_email,
            "subject": email_message["Subject"],
            "sentBy": ADMIN_UID,
            "status": "sent",
            "sentAt": firestore.SERVER_TIMESTAMP,
        })
    except Exception:
        raise HTTPException(
            status_code=500,
            detail=(
                "The email was sent, but its history could not be saved. "
                "Check Firestore before sending again."
            ),
        )

    return {
        "message": "Reply email sent successfully.",
        "recipient": recipient_email,
    }


# ---------------- CONTACT NOTIFICATION EMAIL API ----------------

class ContactNotificationRequest(BaseModel):
    message_id: str = Field(min_length=1, max_length=200)


@app.post("/api/contact-messages/notify")
def notify_contact_message(request: ContactNotificationRequest):
    sender_email, app_password = get_smtp_config()

    message_ref = db.collection("contactMessages").document(
        request.message_id
    )

    try:
        snapshot = message_ref.get()
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Could not load the contact message.",
        )

    if not snapshot.exists:
        raise HTTPException(
            status_code=404,
            detail="Contact message not found.",
        )

    data = snapshot.to_dict() or {}

    # Prevent repeated notification attempts for the same message.
    if data.get("emailNotificationSent") is True:
        return {"message": "Notification was already sent."}

    visitor_name = str(data.get("name", "Visitor")).strip()
    visitor_email = str(data.get("email", "")).strip()
    subject = str(data.get("subject", "Portfolio enquiry")).strip()
    body = str(data.get("message", "")).strip()

    if (
        not visitor_email
        or "@" not in visitor_email
        or "\r" in visitor_email
        or "\n" in visitor_email
    ):
        raise HTTPException(
            status_code=400,
            detail="The visitor email address is invalid.",
        )

    email_message = EmailMessage()
    email_message["From"] = sender_email
    email_message["To"] = sender_email
    email_message["Reply-To"] = visitor_email
    email_message["Subject"] = f"Portfolio contact: {subject}"
    email_message.set_content(
        "You received a new message through your portfolio.\n\n"
        f"Name: {visitor_name}\n"
        f"Visitor email: {visitor_email}\n"
        f"Subject: {subject}\n\n"
        f"Message:\n{body}\n"
    )

    send_email(email_message, sender_email, app_password)

    try:
        message_ref.update({
            "emailNotificationSent": True,
            "emailNotificationSentAt": firestore.SERVER_TIMESTAMP,
        })
    except Exception:
        raise HTTPException(
            status_code=500,
            detail=(
                "Email was sent, but notification status could not be saved."
            ),
        )

    return {"message": "Contact notification email sent successfully."}
