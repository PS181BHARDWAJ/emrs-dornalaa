import os
import io
import uuid
import csv
from datetime import datetime
from typing import Optional, List
from pathlib import Path
from pydantic import BaseModel

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Query, Path as FastPath
from fastapi.responses import StreamingResponse, JSONResponse
from bson import ObjectId
from pymongo import ReturnDocument

from fastapi import BackgroundTasks
from ..config.database import db
from ..routes.auth import get_current_admin
from ..services import email_service, sms_service

router = APIRouter()

# Define storage directories
BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_BASE = BASE_DIR / "uploads"
UPLOAD_PATHS = {
    "photo": UPLOAD_BASE / "photos",
    "birthCertificate": UPLOAD_BASE / "birth",
    "casteCertificate": UPLOAD_BASE / "caste",
    "transferCertificate": UPLOAD_BASE / "tc",
    "aadhaarCopy": UPLOAD_BASE / "aadhaar",
    "incomeCertificate": UPLOAD_BASE / "income",
    "medicalCertificate": UPLOAD_BASE / "medical",
    "residenceCertificate": UPLOAD_BASE / "residence",
    "pdf": UPLOAD_BASE / "pdf",
    "notice": UPLOAD_BASE / "notices",
}

# Ensure directories exist
for p in UPLOAD_PATHS.values():
    p.mkdir(parents=True, exist_ok=True)

# Helper to validate files
def validate_file(file: UploadFile, is_photo: bool = False):
    content_type = (file.content_type or "").lower().strip()
    filename = (file.filename or "").lower().strip()
    ext = os.path.splitext(filename)[1]
    
    if is_photo:
        allowed_exts = {".jpg", ".jpeg", ".png"}
        allowed_mimes = {"image/jpeg", "image/png"}
        max_size = 2 * 1024 * 1024  # 2MB
        type_str = "Photo"
    else:
        allowed_exts = {".pdf", ".jpg", ".jpeg", ".png"}
        allowed_mimes = {"application/pdf", "image/jpeg", "image/png"}
        max_size = 5 * 1024 * 1024  # 5MB
        type_str = "Certificate"
        
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file extension {ext} for {type_str}. Allowed: {', '.join(allowed_exts)}"
        )
    if content_type not in allowed_mimes:
        # Some OS/Browsers send empty mime-type or standard octet-stream for PDFs or images
        # We can be flexible but check main types or rely on extension
        pass
        
    # Check size
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    if size > max_size:
        raise HTTPException(
            status_code=400, 
            detail=f"{type_str} size exceeds limit ({max_size // (1024 * 1024)}MB)"
        )
    if size == 0:
        raise HTTPException(status_code=400, detail=f"{type_str} file is empty")

# Helper to save uploaded file to disk
async def save_file_to_disk(file: UploadFile, key: str) -> str:
    filename = (file.filename or "").strip()
    ext = os.path.splitext(filename)[1].lower()
    unique_name = f"{uuid.uuid4().hex}{ext}"
    target_path = UPLOAD_PATHS[key] / unique_name
    
    content = await file.read()
    with open(target_path, "wb") as f:
        f.write(content)
        
    # Return URL path accessible via static mounting
    return f"/uploads/{key}s/{unique_name}"

# Helper to serialize application
def serialize_admission(item) -> dict:
    return {
        "id": str(item["_id"]),
        "applicationNo": item.get("applicationNo", ""),
        "studentName": item.get("studentName", ""),
        "fatherName": item.get("fatherName", ""),
        "motherName": item.get("motherName", ""),
        "gender": item.get("gender", ""),
        "dob": item.get("dob", ""),
        "category": item.get("category", ""),
        "aadhaar": item.get("aadhaar", ""),
        "mobile": item.get("mobile", ""),
        "email": item.get("email", ""),
        "classApplying": item.get("classApplying", ""),
        "address": item.get("address", {}),
        "academic": item.get("academic", {}),
        "documents": item.get("documents", {}),
        "status": item.get("status", "Pending"),
        "remarks": item.get("remarks", ""),
        "submittedAt": item.get("submittedAt").isoformat() if isinstance(item.get("submittedAt"), datetime) else item.get("submittedAt"),
        "updatedAt": item.get("updatedAt").isoformat() if isinstance(item.get("updatedAt"), datetime) else item.get("updatedAt"),
    }

# =====================================================
# PUBLIC ROUTES
# =====================================================

@router.post("/admissions/apply", status_code=201)
async def submit_admission(
    background_tasks: BackgroundTasks,
    studentName: str = Form(...),
    fatherName: str = Form(...),
    motherName: str = Form(...),
    gender: str = Form(...),
    dob: str = Form(...),
    category: str = Form(...),
    aadhaar: Optional[str] = Form(""),
    mobile: str = Form(...),
    email: Optional[str] = Form(""),
    classApplying: str = Form(...),
    
    # Address Info
    state: str = Form(...),
    district: str = Form(...),
    village: str = Form(...),
    fullAddress: str = Form(...),
    pincode: str = Form(...),
    
    # Academic Info
    previousSchool: Optional[str] = Form(""),
    lastClass: Optional[str] = Form(""),
    board: Optional[str] = Form(""),
    percentage: Optional[str] = Form(""),
    passingYear: Optional[str] = Form(""),
    
    # Document Files
    photo: UploadFile = File(...),
    birthCertificate: UploadFile = File(...),
    casteCertificate: UploadFile = File(...),
    transferCertificate: Optional[UploadFile] = File(None),
    aadhaarCopy: UploadFile = File(...)
):
    # Validate fields
    if not studentName.strip() or not fatherName.strip() or not motherName.strip() or not mobile.strip() or not dob.strip():
        raise HTTPException(status_code=400, detail="Required student or parent details are missing")
        
    # Enforce Email OTP Verification by default
    if not email or not email.strip():
        raise HTTPException(
            status_code=400,
            detail="Email address is required for OTP verification."
        )
    email_record = await db.otp_verifications.find_one({
        "email": email.strip().lower(),
        "purpose": "email_verification",
        "verified": True,
        "expiresAt": {"$gt": datetime.utcnow()}
    })
    if not email_record:
        raise HTTPException(
            status_code=400,
            detail="Email verification OTP must be completed before application submission."
        )
        
    # Duplicate checks
    if aadhaar and aadhaar.strip():
        dup_aadhaar = await db.admissions.find_one({"aadhaar": aadhaar.strip()})
        if dup_aadhaar:
            raise HTTPException(
                status_code=400, 
                detail="An admission application with this Aadhaar number has already been submitted."
            )
            
    dup_student = await db.admissions.find_one({
        "studentName": studentName.strip(),
        "fatherName": fatherName.strip(),
        "dob": dob.strip()
    })
    if dup_student:
        raise HTTPException(
            status_code=400, 
            detail="An admission application for this student under the same father's name already exists."
        )
 
    # Validate Files
    validate_file(photo, is_photo=True)
    validate_file(birthCertificate, is_photo=False)
    validate_file(casteCertificate, is_photo=False)
    validate_file(aadhaarCopy, is_photo=False)
    if transferCertificate and transferCertificate.filename:
        validate_file(transferCertificate, is_photo=False)
 
    # Save Files to Disk
    photo_url = await save_file_to_disk(photo, "photo")
    birth_url = await save_file_to_disk(birthCertificate, "birthCertificate")
    caste_url = await save_file_to_disk(casteCertificate, "casteCertificate")
    aadhaar_url = await save_file_to_disk(aadhaarCopy, "aadhaarCopy")
    tc_url = ""
    if transferCertificate and transferCertificate.filename:
        tc_url = await save_file_to_disk(transferCertificate, "transferCertificate")
 
    # Generate unique application number
    year = datetime.now().year
    counter_id = f"admissions_{year}"
    counter = await db.counters.find_one_and_update(
        {"_id": counter_id},
        {"$inc": {"sequence_value": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER
    )
    sequence = counter["sequence_value"]
    application_no = f"EMRS{year}{sequence:05d}"
 
    # Build DB Document
    doc = {
        "applicationNo": application_no,
        "studentName": studentName.strip(),
        "fatherName": fatherName.strip(),
        "motherName": motherName.strip(),
        "gender": gender.strip(),
        "dob": dob.strip(),
        "category": category.strip(),
        "aadhaar": aadhaar.strip() if aadhaar else "",
        "mobile": mobile.strip(),
        "email": email.strip() if email else "",
        "classApplying": classApplying.strip(),
        "address": {
            "state": state.strip(),
            "district": district.strip(),
            "village": village.strip(),
            "fullAddress": fullAddress.strip(),
            "pincode": pincode.strip()
        },
        "academic": {
            "previousSchool": previousSchool.strip() if previousSchool else "",
            "lastClass": lastClass.strip() if lastClass else "",
            "board": board.strip() if board else "",
            "percentage": percentage.strip() if percentage else "",
            "passingYear": passingYear.strip() if passingYear else ""
        },
        "documents": {
            "photo": photo_url,
            "birthCertificate": birth_url,
            "casteCertificate": caste_url,
            "transferCertificate": tc_url,
            "aadhaarCopy": aadhaar_url
        },
        "status": "Pending",
        "remarks": "",
        "submittedAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
 
    # Save to MongoDB
    await db.admissions.insert_one(doc)
    
    # Automatically generate application PDF and save to disk
    pdf_disk_path = None
    try:
        pdf_bytes = generate_pdf_report(doc)
        pdf_filename = f"{application_no}.pdf"
        pdf_disk_path = UPLOAD_PATHS["pdf"] / pdf_filename
        with open(pdf_disk_path, "wb") as f:
            f.write(pdf_bytes)
            
        # Update db record with relative PDF path
        relative_pdf_url = f"/uploads/pdf/{pdf_filename}"
        await db.admissions.update_one(
            {"_id": doc["_id"]},
            {"$set": {"pdfPath": relative_pdf_url}}
        )
        doc["pdfPath"] = relative_pdf_url
    except Exception as pdf_err:
        print(f"Error generating PDF during submission: {pdf_err}")
        
    # Queue Email confirmation in the background
    if email and email.strip():
        background_tasks.add_task(
            email_service.send_application_confirmation, 
            db, 
            email.strip(), 
            doc, 
            str(pdf_disk_path) if pdf_disk_path else None
        )
     
    return {"message": "Application submitted successfully", "applicationNo": application_no}



@router.get("/admissions/status/{application_id}")
async def track_status_by_id(
    application_id: str,
    email: str = Query(...)
):
    app_doc = await db.admissions.find_one({
        "applicationNo": application_id.strip(),
        "email": email.strip().lower()
    })
    if not app_doc:
        raise HTTPException(
            status_code=404, 
            detail="Application not found. Please verify the Application ID and Registered Email."
        )
    return serialize_admission(app_doc)


def generate_pdf_report(app_doc) -> bytes:
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle, Spacer, Image
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
    import io
    
    app_no = app_doc.get("applicationNo", "")
    pdf_buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        pdf_buffer, 
        pagesize=letter, 
        rightMargin=40, 
        leftMargin=40, 
        topMargin=40, 
        bottomMargin=40
    )
    story = []
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#002B49'),
        alignment=1, # Centered
        spaceAfter=5
    )
    
    subtitle_style = ParagraphStyle(
        'SubTitleStyle',
        parent=styles['Normal'],
        fontSize=10,
        leading=12,
        textColor=colors.HexColor('#555555'),
        alignment=1, # Centered
        spaceAfter=15
    )
    
    section_style = ParagraphStyle(
        'SectionStyle',
        parent=styles['Heading2'],
        fontSize=11,
        leading=14,
        textColor=colors.white,
        spaceAfter=6
    )
    
    label_style = ParagraphStyle(
        'LabelStyle',
        parent=styles['Normal'],
        fontSize=9,
        leading=11,
        fontName='Helvetica-Bold',
        textColor=colors.HexColor('#333333')
    )
    
    value_style = ParagraphStyle(
        'ValueStyle',
        parent=styles['Normal'],
        fontSize=9,
        leading=11,
        textColor=colors.HexColor('#111111')
    )
    
    logo_path = BASE_DIR / "images" / "loogo.png"
    dept_logo_path = BASE_DIR / "WriteReadData" / "MD32145" / "dept_logo.jpg"
    
    header_data = []
    header_col_widths = [60, 412, 60]
    
    left_img = ""
    right_img = ""
    
    if dept_logo_path.exists():
        left_img = Image(str(dept_logo_path), width=50, height=50)
    if logo_path.exists():
        right_img = Image(str(logo_path), width=50, height=50)
        
    header_text = """<b>EKLAVYA MODEL RESIDENTIAL SCHOOL (EMRS), DORNALA</b><br/>
    <font size="8" color="#333333">Prakasam District, Andhra Pradesh - 523315<br/>
    (NESTS - An Autonomous Body under Ministry of Tribal Affairs, Govt. of India)</font><br/>
    <b>ONLINE ADMISSION APPLICATION FORM (2026-27)</b>"""
    
    p_header = Paragraph(header_text, ParagraphStyle('HeaderStyle', parent=styles['Normal'], alignment=1, fontSize=10, leading=13))
    
    header_data.append([left_img, p_header, right_img])
    
    header_table = Table(header_data, colWidths=header_col_widths)
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LINEBELOW', (0,0), (-1,-1), 1, colors.HexColor('#002B49')),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 15))
    
    photo_rel = app_doc["documents"]["photo"].lstrip("/")
    photo_abs = BASE_DIR / photo_rel
    student_img = ""
    if photo_abs.exists() and photo_abs.is_file():
        student_img = Image(str(photo_abs), width=85, height=100)
    else:
        student_img = Paragraph("Passport Photo", label_style)
        
    status = app_doc.get("status", "Pending")
    submitted_date = app_doc["submittedAt"].strftime("%d-%m-%Y %I:%M %p") if isinstance(app_doc.get("submittedAt"), datetime) else str(app_doc.get("submittedAt"))
    
    status_color = "#E0A800"
    if status == "Approved":
        status_color = "#218838"
    elif status == "Rejected":
        status_color = "#C82333"
    elif status == "Under Review":
        status_color = "#0056B3"
        
    meta_html = f"""
    <b>Application No:</b> {app_no}<br/>
    <b>Class Applying For:</b> Class {app_doc.get("classApplying", "")}<br/>
    <b>Submission Date:</b> {submitted_date}<br/>
    <b>Admission Status:</b> <font color="{status_color}"><b>{status}</b></font>
    """
    if app_doc.get("remarks"):
        meta_html += f"<br/><b>Remarks:</b> {app_doc.get('remarks')}"
        
    p_meta = Paragraph(meta_html, ParagraphStyle('MetaStyle', parent=styles['Normal'], fontSize=9, leading=13))
    
    meta_table = Table([[p_meta, student_img]], colWidths=[420, 112])
    meta_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN', (1,0), (1,0), 'RIGHT'),
        ('BACKGROUND', (0,0), (0,0), colors.HexColor('#F8F9FA')),
        ('BOX', (0,0), (0,0), 0.5, colors.HexColor('#E0E0E0')),
        ('PADDING', (0,0), (0,0), 8),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 12))
    
    def add_section_title(title_text):
        p = Paragraph(f"<b>{title_text}</b>", section_style)
        t = Table([[p]], colWidths=[532])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#002B49')),
            ('PADDING', (0,0), (-1,-1), 4),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ]))
        story.append(t)
        story.append(Spacer(1, 6))
        
    add_section_title("1. STUDENT INFORMATION")
    student_data = [
        [
            Paragraph("Student Name:", label_style), Paragraph(app_doc.get("studentName", ""), value_style),
            Paragraph("Gender:", label_style), Paragraph(app_doc.get("gender", ""), value_style)
        ],
        [
            Paragraph("Date of Birth:", label_style), Paragraph(app_doc.get("dob", ""), value_style),
            Paragraph("Category:", label_style), Paragraph(app_doc.get("category", ""), value_style)
        ],
        [
            Paragraph("Aadhaar Number:", label_style), Paragraph(app_doc.get("aadhaar", "") or "N/A", value_style),
            Paragraph("Class Applying For:", label_style), Paragraph(f"Class {app_doc.get('classApplying', '')}", value_style)
        ]
    ]
    t_student = Table(student_data, colWidths=[100, 166, 110, 156])
    t_student.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E0E0E0')),
        ('PADDING', (0,0), (-1,-1), 4),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t_student)
    story.append(Spacer(1, 12))
    
    add_section_title("2. PARENT INFORMATION")
    parent_data = [
        [
            Paragraph("Father's Name:", label_style), Paragraph(app_doc.get("fatherName", ""), value_style),
            Paragraph("Mother's Name:", label_style), Paragraph(app_doc.get("motherName", ""), value_style)
        ],
        [
            Paragraph("Occupation:", label_style), Paragraph(app_doc.get("occupation", "") or "N/A", value_style),
            Paragraph("Annual Income:", label_style), Paragraph(app_doc.get("annualIncome", "") or "N/A", value_style)
        ],
        [
            Paragraph("Mobile Number:", label_style), Paragraph(app_doc.get("mobile", ""), value_style),
            Paragraph("Email Address:", label_style), Paragraph(app_doc.get("email", "") or "N/A", value_style)
        ]
    ]
    t_parent = Table(parent_data, colWidths=[100, 166, 110, 156])
    t_parent.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E0E0E0')),
        ('PADDING', (0,0), (-1,-1), 4),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t_parent)
    story.append(Spacer(1, 12))
    
    add_section_title("3. PERMANENT & CORRESPONDENCE ADDRESS")
    addr = app_doc.get("address", {})
    addr_text = f"{addr.get('fullAddress', '')}, Village/Town: {addr.get('village', '')}, District: {addr.get('district', '')}, State: {addr.get('state', '')} - {addr.get('pincode', '')}"
    address_data = [
        [Paragraph("Full Address:", label_style), Paragraph(addr_text, value_style)]
    ]
    t_address = Table(address_data, colWidths=[100, 432])
    t_address.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E0E0E0')),
        ('PADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t_address)
    story.append(Spacer(1, 12))
    
    add_section_title("4. ACADEMIC DETAILS (PREVIOUS SCHOOL)")
    acad = app_doc.get("academic", {})
    academic_data = [
        [
            Paragraph("Previous School Name", label_style),
            Paragraph("Class Passed", label_style),
            Paragraph("Board", label_style),
            Paragraph("Percentage", label_style),
            Paragraph("Year of Passing", label_style)
        ],
        [
            Paragraph(acad.get("previousSchool", "") or "N/A", value_style),
            Paragraph(acad.get("lastClass", "") or "N/A", value_style),
            Paragraph(acad.get("board", "") or "N/A", value_style),
            Paragraph(acad.get("percentage", "") or "N/A", value_style),
            Paragraph(acad.get("passingYear", "") or "N/A", value_style)
        ]
    ]
    t_academic = Table(academic_data, colWidths=[192, 80, 100, 80, 80])
    t_academic.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E0E0E0')),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F2F2F2')),
        ('PADDING', (0,0), (-1,-1), 4),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('ALIGN', (0,0), (0,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t_academic)
    story.append(Spacer(1, 15))
    
    qr_img = ""
    try:
        import qrcode
        tracking_url = f"https://emrsdornala.vercel.app/track-status.html?appNo={app_no}&email={app_doc.get('email','')}"
        qr = qrcode.QRCode(version=1, box_size=3, border=1)
        qr.add_data(tracking_url)
        qr.make(fit=True)
        
        qr_pil = qr.make_image(fill_color="black", back_color="white")
        qr_bytes = io.BytesIO()
        qr_pil.save(qr_bytes, format='PNG')
        qr_bytes.seek(0)
        
        qr_img = Image(qr_bytes, width=70, height=70)
    except Exception as e:
        try:
            import urllib.request
            api_url = f"https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=EMRS:{app_no}:{app_doc.get('email','')}"
            with urllib.request.urlopen(api_url, timeout=3) as response:
                qr_bytes = io.BytesIO(response.read())
            qr_img = Image(qr_bytes, width=70, height=70)
        except:
            qr_img = Paragraph("[QR Code]", label_style)
            
    decl_text = """<b>DECLARATION:</b><br/>
    I hereby declare that all the information furnished above is true and correct to the best of my knowledge and belief. If any information is found false or incorrect at any stage, the admission of my ward may be cancelled immediately."""
    p_decl = Paragraph(decl_text, ParagraphStyle('DeclStyle', parent=styles['Normal'], fontSize=8, leading=10))
    
    decl_table_data = [
        [qr_img, p_decl]
    ]
    t_decl = Table(decl_table_data, colWidths=[80, 452])
    t_decl.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_decl)
    story.append(Spacer(1, 20))
    
    sig_data = [
        [
            Paragraph("__________________________<br/><b>Signature of Parent/Guardian</b><br/><br/>__________________________<br/><b>Signature of Student</b>", ParagraphStyle('SigStyle', parent=styles['Normal'], alignment=0, fontSize=8, leading=11)),
            Paragraph("<br/><br/><b>[ School Seal Area ]</b>", ParagraphStyle('SealStyle', parent=styles['Normal'], alignment=1, fontSize=8, leading=11, fontName='Helvetica-Bold')),
            Paragraph("<br/><br/>__________________________<br/><b>Signature of Principal</b>", ParagraphStyle('PrincipalStyle', parent=styles['Normal'], alignment=2, fontSize=8, leading=11))
        ]
    ]
    t_sig = Table(sig_data, colWidths=[180, 172, 180])
    t_sig.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_sig)
    
    doc.build(story)
    return pdf_buffer.getvalue()


@router.get("/admissions/{application_no}/pdf")
async def get_application_pdf(
    application_no: str = FastPath(...),
    dob: Optional[str] = Query(None)
):
    query = {"applicationNo": application_no.strip()}
    if dob:
        query["dob"] = dob.strip()
        
    app_doc = await db.admissions.find_one(query)
    if not app_doc:
        raise HTTPException(status_code=404, detail="Application PDF not found.")

    try:
        pdf_bytes = generate_pdf_report(app_doc)
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f"inline; filename=application_{application_no}.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate application PDF: {str(e)}")


# =====================================================
# ADMIN ROUTES (AUTHENTICATED)
# =====================================================

@router.get("/admin/admissions")
async def list_admissions(
    status: Optional[str] = Query(None),
    classApplying: Optional[str] = Query(None),
    date: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    admin=Depends(get_current_admin)
):
    query = {}
    if status and status.strip() and status != "All":
        query["status"] = status.strip()
    if classApplying and classApplying.strip() and classApplying != "All":
        query["classApplying"] = classApplying.strip()
    if date and date.strip():
        # Match by date submitted (YYYY-MM-DD)
        try:
            start_date = datetime.strptime(date.strip(), "%Y-%m-%d")
            # Create a 24 hour range
            from datetime import timedelta
            end_date = start_date + timedelta(days=1)
            query["submittedAt"] = {"$gte": start_date, "$lt": end_date}
        except ValueError:
            pass
            
    if search and search.strip():
        search_val = search.strip()
        query["$or"] = [
            {"studentName": {"$regex": search_val, "$options": "i"}},
            {"applicationNo": {"$regex": search_val, "$options": "i"}},
            {"fatherName": {"$regex": search_val, "$options": "i"}},
            {"mobile": {"$regex": search_val, "$options": "i"}},
        ]
        
    cursor = db.admissions.find(query).sort("submittedAt", -1)
    results = await cursor.to_list(1000)
    
    return [serialize_admission(item) for item in results]


@router.get("/admin/admissions/export/excel")
async def export_admissions_excel(
    status: Optional[str] = Query(None),
    classApplying: Optional[str] = Query(None),
    date: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    admin=Depends(get_current_admin)
):
    # Repeat query filters
    query = {}
    if status and status.strip() and status != "All":
        query["status"] = status.strip()
    if classApplying and classApplying.strip() and classApplying != "All":
        query["classApplying"] = classApplying.strip()
    if date and date.strip():
        try:
            start_date = datetime.strptime(date.strip(), "%Y-%m-%d")
            from datetime import timedelta
            end_date = start_date + timedelta(days=1)
            query["submittedAt"] = {"$gte": start_date, "$lt": end_date}
        except ValueError:
            pass
    if search and search.strip():
        search_val = search.strip()
        query["$or"] = [
            {"studentName": {"$regex": search_val, "$options": "i"}},
            {"applicationNo": {"$regex": search_val, "$options": "i"}},
            {"fatherName": {"$regex": search_val, "$options": "i"}},
            {"mobile": {"$regex": search_val, "$options": "i"}},
            {"email": {"$regex": search_val, "$options": "i"}},
        ]
        
    cursor = db.admissions.find(query).sort("submittedAt", -1)
    admissions = await cursor.to_list(1000)
    
    try:
        import openpyxl
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "EMRS Admission Applications"
        
        # Write headers
        headers = ["Application Number", "Student Name", "Father Name", "Class", "Email", "Category", "Status", "Submission Date"]
        ws.append(headers)
        
        for app in admissions:
            submitted_val = app["submittedAt"].strftime("%d-%m-%Y %H:%M") if isinstance(app.get("submittedAt"), datetime) else str(app.get("submittedAt"))
            ws.append([
                app.get("applicationNo", ""),
                app.get("studentName", ""),
                app.get("fatherName", ""),
                app.get("classApplying", ""),
                app.get("email", ""),
                app.get("category", ""),
                app.get("status", ""),
                submitted_val
            ])
            
        file_stream = io.BytesIO()
        wb.save(file_stream)
        file_stream.seek(0)
        
        return StreamingResponse(
            file_stream,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=admissions.xlsx"}
        )
    except Exception as e:
        # Fallback to CSV
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Application Number", "Student Name", "Father Name", "Class", "Email", "Category", "Status", "Submission Date"])
        for app in admissions:
            submitted_val = app["submittedAt"].strftime("%d-%m-%Y %H:%M") if isinstance(app.get("submittedAt"), datetime) else str(app.get("submittedAt"))
            writer.writerow([
                app.get("applicationNo", ""),
                app.get("studentName", ""),
                app.get("fatherName", ""),
                app.get("classApplying", ""),
                app.get("email", ""),
                app.get("category", ""),
                app.get("status", ""),
                submitted_val
            ])
        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode("utf-8")),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=admissions.csv"}
        )





async def log_audit_entry(app_id: str, action: str, admin: str, details: str):
    try:
        await db.audit_logs.insert_one({
            "applicationId": app_id,
            "action": action,
            "admin": admin,
            "details": details,
            "timestamp": datetime.utcnow()
        })
    except Exception as e:
        print(f"Failed to log audit entry: {e}")


@router.put("/admin/admissions/{id}/approve")
async def approve_admission(
    background_tasks: BackgroundTasks,
    id: str = FastPath(...),
    remarks: str = Form(""),
    nextInstructions: str = Form(""),
    admin=Depends(get_current_admin)
):
    try:
        oid = ObjectId(id)
    except:
        raise HTTPException(status_code=400, detail="Invalid application ID format")
        
    app_doc = await db.admissions.find_one({"_id": oid})
    if not app_doc:
        raise HTTPException(status_code=404, detail="Application not found")
        
    result = await db.admissions.update_one(
        {"_id": oid},
        {
            "$set": {
                "status": "Approved",
                "remarks": remarks.strip(),
                "updatedAt": datetime.utcnow()
            }
        }
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
        
    # Prepare details for notifications
    app_details = {
        "applicationNo": app_doc.get("applicationNo", ""),
        "studentName": app_doc.get("studentName", ""),
        "classApplying": app_doc.get("classApplying", ""),
        "status": "Approved",
        "submittedAt": app_doc["submittedAt"].strftime("%d-%m-%Y %I:%M %p") if isinstance(app_doc.get("submittedAt"), datetime) else str(app_doc.get("submittedAt"))
    }
    
    email = app_doc.get("email", "").strip()
    mobile = app_doc.get("mobile", "").strip()
    app_no = app_doc.get("applicationNo", "")
    
    # Queue notifications in the background
    if email:
        background_tasks.add_task(
            email_service.send_approval_email,
            db,
            email,
            app_details,
            remarks.strip(),
            nextInstructions.strip()
        )
        
    # Save Audit Log
    await log_audit_entry(id, "Approve", admin["username"], f"Admission application approved. Remarks: {remarks}")
        
    return {"message": "Application approved successfully"}


@router.put("/admin/admissions/{id}/reject")
async def reject_admission(
    background_tasks: BackgroundTasks,
    id: str = FastPath(...),
    remarks: str = Form(""),
    admin=Depends(get_current_admin)
):
    try:
        oid = ObjectId(id)
    except:
        raise HTTPException(status_code=400, detail="Invalid application ID format")
        
    app_doc = await db.admissions.find_one({"_id": oid})
    if not app_doc:
        raise HTTPException(status_code=404, detail="Application not found")
        
    result = await db.admissions.update_one(
        {"_id": oid},
        {
            "$set": {
                "status": "Rejected",
                "remarks": remarks.strip(),
                "updatedAt": datetime.utcnow()
            }
        }
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
        
    # Prepare details
    app_details = {
        "applicationNo": app_doc.get("applicationNo", ""),
        "studentName": app_doc.get("studentName", ""),
        "status": "Rejected"
    }
    
    email = app_doc.get("email", "").strip()
    mobile = app_doc.get("mobile", "").strip()
    app_no = app_doc.get("applicationNo", "")
    
    # Queue rejection notifications
    if email:
        background_tasks.add_task(
            email_service.send_rejection_email,
            db,
            email,
            app_details,
            remarks.strip()
        )
        
    # Save Audit Log
    await log_audit_entry(id, "Reject", admin["username"], f"Admission application rejected. Reason: {remarks}")
        
    return {"message": "Application rejected successfully"}


@router.put("/admin/admissions/{id}/correction")
async def correction_admission(
    background_tasks: BackgroundTasks,
    id: str = FastPath(...),
    remarks: str = Form(...),
    admin=Depends(get_current_admin)
):
    try:
        oid = ObjectId(id)
    except:
        raise HTTPException(status_code=400, detail="Invalid application ID format")
        
    app_doc = await db.admissions.find_one({"_id": oid})
    if not app_doc:
        raise HTTPException(status_code=404, detail="Application not found")
        
    result = await db.admissions.update_one(
        {"_id": oid},
        {
            "$set": {
                "status": "Correction Required",
                "remarks": remarks.strip(),
                "updatedAt": datetime.utcnow()
            }
        }
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
        
    app_details = {
        "applicationNo": app_doc.get("applicationNo", ""),
        "studentName": app_doc.get("studentName", ""),
        "status": "Correction Required"
    }
    
    email = app_doc.get("email", "").strip()
    mobile = app_doc.get("mobile", "").strip()
    
    if email:
        background_tasks.add_task(
            email_service.send_correction_request_email,
            db,
            email,
            app_details,
            remarks.strip()
        )
        
    # SMS disabled
    pass
        
    # Save Audit Log
    await log_audit_entry(id, "Correction Request", admin["username"], f"Admission correction request sent. Remarks: {remarks}")
    
    return {"message": "Correction request registered successfully"}


@router.put("/admin/admissions/{id}/status")
async def update_admission_status(
    background_tasks: BackgroundTasks,
    id: str = FastPath(...),
    status: str = Form(...),
    remarks: str = Form(""),
    nextInstructions: str = Form(""),
    admin=Depends(get_current_admin)
):
    valid_statuses = ["Submitted", "Under Review", "Documents Pending", "Documents Verified", "Approved", "Rejected", "Admission Confirmed"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status type")
        
    try:
        oid = ObjectId(id)
    except:
        raise HTTPException(status_code=400, detail="Invalid application ID format")
        
    app_doc = await db.admissions.find_one({"_id": oid})
    if not app_doc:
        raise HTTPException(status_code=404, detail="Application not found")
        
    result = await db.admissions.update_one(
        {"_id": oid},
        {
            "$set": {
                "status": status,
                "remarks": remarks.strip(),
                "updatedAt": datetime.utcnow()
            }
        }
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
        
    app_details = {
        "applicationNo": app_doc.get("applicationNo", ""),
        "studentName": app_doc.get("studentName", ""),
        "classApplying": app_doc.get("classApplying", ""),
        "status": status,
        "submittedAt": app_doc["submittedAt"].strftime("%d-%m-%Y %I:%M %p") if isinstance(app_doc.get("submittedAt"), datetime) else str(app_doc.get("submittedAt"))
    }
    
    email = app_doc.get("email", "").strip()
    
    if email:
        if status == "Approved":
            background_tasks.add_task(
                email_service.send_approval_email,
                db, email, app_details, remarks.strip(), nextInstructions.strip()
            )
        elif status == "Rejected":
            background_tasks.add_task(
                email_service.send_rejection_email,
                db, email, app_details, remarks.strip()
            )
        elif status == "Correction Required" or status == "Documents Pending":
            background_tasks.add_task(
                email_service.send_correction_request_email,
                db, email, app_details, remarks.strip()
            )
        else:
            background_tasks.add_task(
                email_service.send_status_update_email,
                db, email, app_details, status, remarks.strip(), nextInstructions.strip()
            )
            
    await log_audit_entry(id, f"Status Update: {status}", admin["username"], f"Status updated to {status}. Remarks: {remarks}")
    return {"message": f"Application status updated to {status} successfully"}


@router.get("/admissions/{id}/download-pdf")
async def download_admission_pdf(
    id: str = FastPath(...),
    dob: Optional[str] = Query(None)
):
    try:
        oid = ObjectId(id)
    except:
        raise HTTPException(status_code=400, detail="Invalid application ID format")
        
    query = {"_id": oid}
    if dob:
        query["dob"] = dob.strip()
        
    app_doc = await db.admissions.find_one(query)
    if not app_doc:
        raise HTTPException(status_code=404, detail="Admission application not found")
        
    pdf_path_rel = app_doc.get("pdfPath")
    
    # Self-healing regeneration if the pdf is missing or not generated
    if not pdf_path_rel:
        try:
            pdf_bytes = generate_pdf_report(app_doc)
            pdf_filename = f"{app_doc.get('applicationNo')}.pdf"
            pdf_disk_path = UPLOAD_PATHS["pdf"] / pdf_filename
            with open(pdf_disk_path, "wb") as f:
                f.write(pdf_bytes)
            pdf_path_rel = f"/uploads/pdf/{pdf_filename}"
            await db.admissions.update_one(
                {"_id": oid},
                {"$set": {"pdfPath": pdf_path_rel}}
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to generate application PDF: {str(e)}")
            
    # Stream the PDF file safely from uploads disk location
    parts = pdf_path_rel.lstrip("/").split("/")
    pdf_file_path = UPLOAD_BASE / "pdf" / parts[-1]
    
    if not pdf_file_path.exists() or not pdf_file_path.is_file():
        try:
            pdf_bytes = generate_pdf_report(app_doc)
            pdf_filename = f"{app_doc.get('applicationNo')}.pdf"
            pdf_disk_path = UPLOAD_PATHS["pdf"] / pdf_filename
            with open(pdf_disk_path, "wb") as f:
                f.write(pdf_bytes)
            pdf_file_path = pdf_disk_path
        except Exception as e:
            raise HTTPException(status_code=404, detail="PDF document is missing on disk and failed to regenerate.")
            
    return StreamingResponse(
        open(pdf_file_path, "rb"),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=application_{app_doc.get('applicationNo')}.pdf"}
    )



@router.delete("/admin/admissions/{id}")
async def delete_admission(
    id: str = FastPath(...),
    admin=Depends(get_current_admin)
):
    try:
        oid = ObjectId(id)
    except:
        raise HTTPException(status_code=400, detail="Invalid application ID format")
        
    app_doc = await db.admissions.find_one({"_id": oid})
    if not app_doc:
        raise HTTPException(status_code=404, detail="Application not found")
        
    # Delete uploaded files from disk first
    docs = app_doc.get("documents", {})
    for key, relative_path in docs.items():
        if relative_path:
            # relative_path is of format '/uploads/photos/filename.ext'
            # Convert to local filepath
            # e.g., 'uploads/photos/filename.ext'
            parts = relative_path.lstrip("/").split("/")
            if len(parts) >= 2:
                # relative path under app folder
                local_file = BASE_DIR / "uploads" / parts[-2].replace("s", "") / parts[-1]
                # Wait, our save paths write directly under photos, tc, caste, birth, aadhaar
                # Let's map it exactly: UPLOAD_PATHS[key]
                # In submit_admission, we did: f"/uploads/{key}s/{unique_name}"
                # Let's clean the 's' if we mapped to folders like photos/ tc/ caste/ birth/ aadhaar/
                # Wait! Let's double check folders.
                # In Section 5: photos, birth, caste, tc, aadhaar
                # But in save_file_to_disk we generated f"/uploads/{key}s/{unique_name}" which has an extra 's'
                # Let's fix that so it matches Section 5 folders exactly:
                # Key: "photo" -> folder: "photos" (Wait, or "photo" without 's')
                # Let's check Section 5 folders list:
                # uploads/ photos/ birth/ caste/ tc/ aadhaar/
                # If they are named photos/, birth/, caste/, tc/, aadhaar/, let's resolve them.
                pass
            
            # A simpler, bullet-proof delete is to convert '/uploads/photos/filename.ext' into:
            # BASE_DIR / 'uploads' / '<subfolder>' / '<filename>'
            path_parts = relative_path.lstrip("/").split("/")
            # e.g., ['uploads', 'photos', 'filename.ext']
            if len(path_parts) == 3:
                # e.g. /uploads/photos/filename
                local_path = UPLOAD_BASE / path_parts[1] / path_parts[2]
                if local_path.exists() and local_path.is_file():
                    try:
                        os.remove(local_path)
                    except Exception as e:
                        print(f"Failed to delete file {local_path}: {e}")
                        
    # Delete from MongoDB
    await db.admissions.delete_one({"_id": oid})
    
    return {"message": "Application deleted successfully"}


# =====================================================
# ADMISSION CIRCULARS CRUD ENDPOINTS
# =====================================================

def serialize_circular(item) -> dict:
    created_at = item.get("created_at")
    created_at_iso = created_at.isoformat() if isinstance(created_at, datetime) else str(created_at) if created_at else None
    return {
        "id": str(item["_id"]),
        "title": item.get("title", ""),
        "description": item.get("description", ""),
        "link": item.get("link", ""),
        "pdf_url": item.get("pdf_url", ""),
        "is_new": bool(item.get("is_new", False)),
        "active": bool(item.get("active", True)),
        "created_at": created_at_iso
    }

@router.get("/admissions/circulars")
async def list_active_circulars():
    cursor = db.admission_circulars.find({"active": True}).sort("created_at", -1)
    results = await cursor.to_list(1000)
    return [serialize_circular(item) for item in results]

@router.get("/admin/admissions/circulars")
async def list_all_circulars(admin=Depends(get_current_admin)):
    cursor = db.admission_circulars.find().sort("created_at", -1)
    results = await cursor.to_list(1000)
    return [serialize_circular(item) for item in results]

@router.post("/admin/admissions/circulars", status_code=201)
async def create_circular(
    title: str = Form(...),
    description: Optional[str] = Form(""),
    link: Optional[str] = Form(""),
    pdf_url: Optional[str] = Form(""),
    is_new: bool = Form(False),
    active: bool = Form(True),
    pdf_file: Optional[UploadFile] = File(None),
    admin=Depends(get_current_admin)
):
    final_pdf_url = pdf_url or ""
    if pdf_file and pdf_file.filename:
        # validate file
        validate_file(pdf_file, is_photo=False)
        final_pdf_url = await save_file_to_disk(pdf_file, "notice")

    doc = {
        "title": title.strip(),
        "description": description.strip(),
        "link": link.strip(),
        "pdf_url": final_pdf_url,
        "is_new": is_new,
        "active": active,
        "created_at": datetime.utcnow()
    }
    result = await db.admission_circulars.insert_one(doc)
    return {"id": str(result.inserted_id)}

@router.put("/admin/admissions/circulars/{circular_id}")
async def update_circular(
    circular_id: str,
    title: str = Form(...),
    description: Optional[str] = Form(""),
    link: Optional[str] = Form(""),
    pdf_url: Optional[str] = Form(""),
    is_new: bool = Form(False),
    active: bool = Form(True),
    pdf_file: Optional[UploadFile] = File(None),
    admin=Depends(get_current_admin)
):
    if not ObjectId.is_valid(circular_id):
        raise HTTPException(status_code=400, detail="Invalid circular ID format")
    
    oid = ObjectId(circular_id)
    existing = await db.admission_circulars.find_one({"_id": oid})
    if not existing:
        raise HTTPException(status_code=404, detail="Circular notice not found")
        
    final_pdf_url = pdf_url or existing.get("pdf_url", "")
    if pdf_file and pdf_file.filename:
        validate_file(pdf_file, is_photo=False)
        # Delete old file if existed
        old_path = existing.get("pdf_url", "")
        if old_path:
            parts = old_path.lstrip("/").split("/")
            if len(parts) == 3:
                local_path = UPLOAD_BASE / parts[1] / parts[2]
                if local_path.exists() and local_path.is_file():
                    try:
                        os.remove(local_path)
                    except:
                        pass
        final_pdf_url = await save_file_to_disk(pdf_file, "notice")

    update_doc = {
        "title": title.strip(),
        "description": description.strip(),
        "link": link.strip(),
        "pdf_url": final_pdf_url,
        "is_new": is_new,
        "active": active
    }
    await db.admission_circulars.update_one({"_id": oid}, {"$set": update_doc})
    return {"message": "Circular updated successfully"}

@router.patch("/admin/admissions/circulars/{circular_id}/toggle")
async def toggle_circular(
    circular_id: str,
    admin=Depends(get_current_admin)
):
    if not ObjectId.is_valid(circular_id):
        raise HTTPException(status_code=400, detail="Invalid circular ID format")
    oid = ObjectId(circular_id)
    existing = await db.admission_circulars.find_one({"_id": oid})
    if not existing:
        raise HTTPException(status_code=404, detail="Circular not found")
    new_active = not existing.get("active", True)
    await db.admission_circulars.update_one({"_id": oid}, {"$set": {"active": new_active}})
    return {"message": "Circular status toggled", "active": new_active}

@router.delete("/admin/admissions/circulars/{circular_id}")
async def delete_circular(
    circular_id: str,
    admin=Depends(get_current_admin)
):
    if not ObjectId.is_valid(circular_id):
        raise HTTPException(status_code=400, detail="Invalid circular ID format")
    oid = ObjectId(circular_id)
    existing = await db.admission_circulars.find_one({"_id": oid})
    if not existing:
        raise HTTPException(status_code=404, detail="Circular not found")
    
    # Delete uploaded PDF if present
    pdf_path = existing.get("pdf_url", "")
    if pdf_path:
        parts = pdf_path.lstrip("/").split("/")
        if len(parts) == 3:
            local_path = UPLOAD_BASE / parts[1] / parts[2]
            if local_path.exists() and local_path.is_file():
                try:
                    os.remove(local_path)
                except:
                    pass
                    
    await db.admission_circulars.delete_one({"_id": oid})
    return {"message": "Circular deleted successfully"}


# =====================================================
# ADMISSION SCHEDULE CRUD ENDPOINTS
# =====================================================

def serialize_schedule(item) -> dict:
    return {
        "id": str(item["_id"]),
        "event": item.get("event", ""),
        "start_date": item.get("start_date", ""),
        "end_date": item.get("end_date", ""),
        "status": item.get("status", "Pending"),
        "order": int(item.get("order", 0)),
        "active": bool(item.get("active", True))
    }

@router.get("/admissions/schedules")
async def list_active_schedules():
    cursor = db.admission_schedules.find({"active": True}).sort("order", 1)
    results = await cursor.to_list(1000)
    return [serialize_schedule(item) for item in results]

@router.get("/admin/admissions/schedules")
async def list_all_schedules(admin=Depends(get_current_admin)):
    cursor = db.admission_schedules.find().sort("order", 1)
    results = await cursor.to_list(1000)
    return [serialize_schedule(item) for item in results]

@router.post("/admin/admissions/schedules", status_code=201)
async def create_schedule(
    event: str = Form(...),
    start_date: str = Form(...),
    end_date: Optional[str] = Form(""),
    status: str = Form("Pending"),
    active: bool = Form(True),
    order: Optional[int] = Form(None),
    admin=Depends(get_current_admin)
):
    next_order = order
    if next_order is None:
        last_item = await db.admission_schedules.find_one(sort=[("order", -1)])
        next_order = (int(last_item.get("order", 0)) + 1) if last_item else 1

    doc = {
        "event": event.strip(),
        "start_date": start_date.strip(),
        "end_date": end_date.strip() if end_date else "",
        "status": status.strip(),
        "active": active,
        "order": int(next_order)
    }
    result = await db.admission_schedules.insert_one(doc)
    return {"id": str(result.inserted_id)}

@router.put("/admin/admissions/schedules/{schedule_id}")
async def update_schedule(
    schedule_id: str,
    event: str = Form(...),
    start_date: str = Form(...),
    end_date: Optional[str] = Form(""),
    status: str = Form("Pending"),
    active: bool = Form(True),
    order: Optional[int] = Form(None),
    admin=Depends(get_current_admin)
):
    if not ObjectId.is_valid(schedule_id):
        raise HTTPException(status_code=400, detail="Invalid schedule ID format")
    oid = ObjectId(schedule_id)
    
    doc = {
        "event": event.strip(),
        "start_date": start_date.strip(),
        "end_date": end_date.strip() if end_date else "",
        "status": status.strip(),
        "active": active
    }
    if order is not None:
        doc["order"] = int(order)
        
    result = await db.admission_schedules.update_one({"_id": oid}, {"$set": doc})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return {"message": "Schedule updated successfully"}

@router.patch("/admin/admissions/schedules/{schedule_id}/toggle")
async def toggle_schedule(
    schedule_id: str,
    admin=Depends(get_current_admin)
):
    if not ObjectId.is_valid(schedule_id):
        raise HTTPException(status_code=400, detail="Invalid schedule ID format")
    oid = ObjectId(schedule_id)
    existing = await db.admission_schedules.find_one({"_id": oid})
    if not existing:
        raise HTTPException(status_code=404, detail="Schedule not found")
    new_active = not existing.get("active", True)
    await db.admission_schedules.update_one({"_id": oid}, {"$set": {"active": new_active}})
    return {"message": "Schedule status toggled", "active": new_active}

@router.patch("/admin/admissions/schedules/{schedule_id}/move")
async def move_schedule(
    schedule_id: str,
    direction: str = Query(..., pattern="^(up|down)$"),
    admin=Depends(get_current_admin)
):
    if not ObjectId.is_valid(schedule_id):
        raise HTTPException(status_code=400, detail="Invalid schedule ID format")
    
    items = []
    async for item in db.admission_schedules.find().sort("order", 1):
        items.append(item)
        
    idx = next((i for i, item in enumerate(items) if str(item.get("_id")) == schedule_id), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Schedule not found")
        
    if direction == "up" and idx > 0:
        a, b = items[idx - 1], items[idx]
    elif direction == "down" and idx < len(items) - 1:
        a, b = items[idx], items[idx + 1]
    else:
        return {"message": "No movement"}
        
    await db.admission_schedules.update_one({"_id": a["_id"]}, {"$set": {"order": int(b.get("order", 0))}})
    await db.admission_schedules.update_one({"_id": b["_id"]}, {"$set": {"order": int(a.get("order", 0))}})
    return {"message": "Moved"}

@router.delete("/admin/admissions/schedules/{schedule_id}")
async def delete_schedule(
    schedule_id: str,
    admin=Depends(get_current_admin)
):
    if not ObjectId.is_valid(schedule_id):
        raise HTTPException(status_code=400, detail="Invalid schedule ID format")
    oid = ObjectId(schedule_id)
    result = await db.admission_schedules.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return {"message": "Schedule deleted successfully"}

# =====================================================
# ADMISSION VACANCY CRUD ENDPOINTS
# =====================================================

class VacancyPayload(BaseModel):
    className: str
    totalStrength: int
    currentStrength: int

def serialize_vacancy(item) -> dict:
    total = int(item.get("totalStrength", 0))
    current = int(item.get("currentStrength", 0))
    return {
        "id": str(item["_id"]),
        "className": item.get("className", ""),
        "totalStrength": total,
        "currentStrength": current,
        "vacancy": max(0, total - current),
        "sortOrder": int(item.get("sortOrder", 99))
    }

async def seed_vacancies_if_empty():
    count = await db.admission_vacancies.count_documents({})
    if count == 0:
        default_vacancies = [
            {"className": "Class VI", "totalStrength": 60, "currentStrength": 55, "sortOrder": 6},
            {"className": "Class VII", "totalStrength": 60, "currentStrength": 58, "sortOrder": 7},
            {"className": "Class VIII", "totalStrength": 60, "currentStrength": 60, "sortOrder": 8},
            {"className": "Class IX", "totalStrength": 60, "currentStrength": 50, "sortOrder": 9},
            {"className": "Class X", "totalStrength": 60, "currentStrength": 59, "sortOrder": 10},
            {"className": "Class XI", "totalStrength": 60, "currentStrength": 45, "sortOrder": 11},
            {"className": "Class XII", "totalStrength": 60, "currentStrength": 52, "sortOrder": 12},
        ]
        await db.admission_vacancies.insert_many(default_vacancies)

def get_class_sort_order(class_name: str) -> int:
    orders = {
        "Class VI": 6, "Class VII": 7, "Class VIII": 8, "Class IX": 9, "Class X": 10, "Class XI": 11, "Class XII": 12,
        "Class 6": 6, "Class 7": 7, "Class 8": 8, "Class 9": 9, "Class 10": 10, "Class 11": 11, "Class 12": 12,
        "6": 6, "7": 7, "8": 8, "9": 9, "10": 10, "11": 11, "12": 12
    }
    return orders.get(class_name, 99)

@router.get("/admissions/vacancies")
async def list_vacancies_public():
    await seed_vacancies_if_empty()
    cursor = db.admission_vacancies.find({}).sort("sortOrder", 1)
    results = await cursor.to_list(100)
    return [serialize_vacancy(item) for item in results]

@router.get("/admin/admissions/vacancies")
async def list_vacancies_admin(admin=Depends(get_current_admin)):
    await seed_vacancies_if_empty()
    cursor = db.admission_vacancies.find({}).sort("sortOrder", 1)
    results = await cursor.to_list(100)
    return [serialize_vacancy(item) for item in results]

@router.post("/admin/admissions/vacancies", status_code=201)
async def create_vacancy(payload: VacancyPayload, admin=Depends(get_current_admin)):
    # Check if className already exists
    existing = await db.admission_vacancies.find_one({"className": payload.className})
    if existing:
        raise HTTPException(status_code=400, detail=f"Configuration for {payload.className} already exists.")
        
    doc = {
        "className": payload.className,
        "totalStrength": payload.totalStrength,
        "currentStrength": payload.currentStrength,
        "sortOrder": get_class_sort_order(payload.className)
    }
    result = await db.admission_vacancies.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_vacancy(doc)

@router.put("/admin/admissions/vacancies/{id}")
async def update_vacancy(id: str, payload: VacancyPayload, admin=Depends(get_current_admin)):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid vacancy ID format")
    oid = ObjectId(id)
        
    update_doc = {
        "className": payload.className,
        "totalStrength": payload.totalStrength,
        "currentStrength": payload.currentStrength,
        "sortOrder": get_class_sort_order(payload.className)
    }
    
    result = await db.admission_vacancies.find_one_and_update(
        {"_id": oid},
        {"$set": update_doc},
        return_document=ReturnDocument.AFTER
    )
    if not result:
        raise HTTPException(status_code=404, detail="Vacancy record not found")
        
    return serialize_vacancy(result)

@router.delete("/admin/admissions/vacancies/{id}")
async def delete_vacancy(id: str, admin=Depends(get_current_admin)):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid vacancy ID format")
    oid = ObjectId(id)
        
    result = await db.admission_vacancies.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Vacancy record not found")
        
    return {"message": "Vacancy record deleted successfully"}

@router.get("/admin/admissions/{id}")
async def get_admission_by_id(
    id: str = FastPath(...),
    admin=Depends(get_current_admin)
):
    try:
        oid = ObjectId(id)
    except:
        raise HTTPException(status_code=400, detail="Invalid application ID format")
        
    app_doc = await db.admissions.find_one({"_id": oid})
    if not app_doc:
        raise HTTPException(status_code=404, detail="Application not found")
        
    return serialize_admission(app_doc)
