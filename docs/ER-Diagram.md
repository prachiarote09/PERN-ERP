# PERN ERP - Database ER Diagram

## Entity Relationship Diagram

```mermaid
erDiagram

    USER {
        int id PK
        string name
        string email UK
        string passwordHash
        Role role
        datetime createdAt
        datetime updatedAt
    }

    CUSTOMER {
        int id PK
        string name
        string email
        string phone
        string address
        string city
        string state
        string pincode
        string gstNumber
        datetime createdAt
        datetime updatedAt
    }

    PRODUCT {
        int id PK
        string code UK
        string name
        string category
        string unit
        decimal basePrice
        datetime createdAt
        datetime updatedAt
    }

    INVENTORY {
        int id PK
        int productId FK,UK
        int physicalQty
        int reservedQty
        datetime createdAt
        datetime updatedAt
    }

    ENQUIRY {
        int id PK
        string enquiryNo UK
        int customerId FK
        int createdById FK
        EnquiryStatus status
        datetime enquiryDate
        string remarks
        datetime createdAt
        datetime updatedAt
    }

    ENQUIRY_ITEM {
        int id PK
        int enquiryId FK
        int productId FK
        int quantity
    }

    QUOTATION {
        int id PK
        string quotationNo UK
        int enquiryId FK
        int customerId FK
        int createdById FK
        datetime validUntil
        QuotationStatus status
        decimal subtotal
        decimal discountAmount
        decimal gstAmount
        decimal grandTotal
        datetime createdAt
        datetime updatedAt
    }

    QUOTATION_ITEM {
        int id PK
        int quotationId FK
        int productId FK
        int quantity
        decimal unitPrice
        decimal discountPct
        decimal gstPct
        decimal lineAmount
    }

    SALES_ORDER {
        int id PK
        string orderNo UK
        int quotationId FK,UK
        int customerId FK
        int createdById FK
        SalesOrderStatus status
        decimal subtotal
        decimal discountAmount
        decimal gstAmount
        decimal grandTotal
        datetime orderDate
        datetime confirmedAt
        datetime createdAt
        datetime updatedAt
    }

    SALES_ORDER_ITEM {
        int id PK
        int salesOrderId FK
        int productId FK
        int quantity
        decimal unitPrice
        decimal discountPct
        decimal gstPct
        decimal lineAmount
    }

    DISPATCH {
        int id PK
        string dispatchNo UK
        int salesOrderId FK,UK
        int processedById FK
        datetime dispatchDate
        string vehicleNumber
        string driverName
        datetime createdAt
        datetime updatedAt
    }

    DISPATCH_ITEM {
        int id PK
        int dispatchId FK
        int productId FK
        int quantity
    }

    USER ||--o{ ENQUIRY : creates
    CUSTOMER ||--o{ ENQUIRY : has
    ENQUIRY ||--|{ ENQUIRY_ITEM : contains
    PRODUCT ||--o{ ENQUIRY_ITEM : included_in

    USER ||--o{ QUOTATION : creates
    CUSTOMER ||--o{ QUOTATION : receives
    ENQUIRY ||--o| QUOTATION : generates
    QUOTATION ||--|{ QUOTATION_ITEM : contains
    PRODUCT ||--o{ QUOTATION_ITEM : included_in

    QUOTATION ||--o| SALES_ORDER : converts_to
    USER ||--o{ SALES_ORDER : creates
    CUSTOMER ||--o{ SALES_ORDER : places
    SALES_ORDER ||--|{ SALES_ORDER_ITEM : contains
    PRODUCT ||--o{ SALES_ORDER_ITEM : included_in

    PRODUCT ||--|| INVENTORY : has

    USER ||--o{ DISPATCH : processes
    SALES_ORDER ||--o| DISPATCH : fulfilled_by
    DISPATCH ||--|{ DISPATCH_ITEM : contains
    PRODUCT ||--o{ DISPATCH_ITEM : included_in