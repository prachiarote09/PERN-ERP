# PERN ERP - Enterprise Resource Planning System

A full-stack Enterprise Resource Planning (ERP) application built using the PERN stack:

- PostgreSQL
- Express.js
- React.js
- Node.js

The application manages the complete business workflow:

**Customer Enquiry → Quotation → Sales Order → Inventory Reservation → Dispatch**

---

## 📌 Project Overview

PERN ERP is a role-based ERP system designed to manage customer enquiries, quotations, sales orders, inventory and dispatch operations.

The system provides separate permissions for:

- **ADMIN**
- **SALES_USER**

The backend implements JWT authentication, role-based access control, validation, relational database constraints and transactional inventory operations.

---

## 🚀 Features

### Authentication & Authorization

- User registration
- User login
- JWT-based authentication
- Password hashing using bcrypt
- Protected API routes
- Backend role-based access control
- ADMIN and SALES_USER roles

### Customer Enquiries

- Create customer enquiries
- Add products and quantities to enquiries
- View enquiries
- Track enquiry status

Enquiry status flow:

```text
NEW → QUOTED → WON / LOST