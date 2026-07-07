from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class AddressSchema(BaseModel):
    state: str
    district: str
    village: str
    fullAddress: str
    pincode: str

class AcademicSchema(BaseModel):
    previousSchool: Optional[str] = ""
    lastClass: Optional[str] = ""
    board: Optional[str] = ""
    percentage: Optional[str] = ""
    passingYear: Optional[str] = ""

class DocumentsSchema(BaseModel):
    photo: str  # URL or relative path
    birthCertificate: str
    casteCertificate: str
    transferCertificate: Optional[str] = ""
    aadhaarCopy: str
    incomeCertificate: Optional[str] = ""
    medicalCertificate: Optional[str] = ""
    residenceCertificate: Optional[str] = ""

class AdmissionBase(BaseModel):
    studentName: str
    fatherName: str
    motherName: str
    gender: str
    dob: str  # YYYY-MM-DD
    category: str
    aadhaar: Optional[str] = ""
    mobile: str
    email: Optional[str] = ""
    classApplying: str
    address: AddressSchema
    academic: AcademicSchema
    documents: DocumentsSchema
    status: str = "Pending"  # Pending, Under Review, Approved, Rejected
    remarks: Optional[str] = ""
    submittedAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

class AdmissionResponse(AdmissionBase):
    id: str
    applicationNo: str

class CounterSchema(BaseModel):
    id: str
    sequence_value: int
