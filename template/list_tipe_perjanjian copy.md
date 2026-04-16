# Field Mapping per Tipe Perjanjian

---

## 1. Perjanjian Kerja Sama (PKS)

### Core Field

- contract_number
- contract_type
- contract_title
- start_date
- end_date
- initiator_id
- current_status

### Pihak

- company_name
- vendor_id
- PIC_name

### Finansial

- contract_value
- currency
- payment_terms

### Pajak (Optional)

- is_tax_required
- tax_type
- tax_percentage

### Dokumen

- po_document
- quotation_document
- negotiation_minutes

### Legal

- legal_notes
- risk_level

---

## 2. Perjanjian Jasa

### Core Field

- contract_number
- contract_type
- contract_title
- start_date
- end_date

### Scope & Deliverables

- service_scope
- deliverables
- SLA

### Finansial

- contract_value
- payment_terms
- termin

### Pajak

- is_tax_required
- tax_type

### Dokumen

- spk_document
- proposal_document

---

## 3. Perjanjian Pengadaan Barang

### Core Field

- contract_number
- contract_type
- contract_title

### Barang

- item_list
- quantity
- specification

### Finansial

- total_price
- currency
- payment_terms

### Dokumen

- po_document
- invoice
- delivery_note

### Pajak

- tax_included
- tax_type

---

## 4. Perjanjian Sewa

### Core Field

- contract_number
- contract_title
- start_date
- end_date

### Objek Sewa

- asset_name
- location
- usage_type

### Finansial

- rental_fee
- payment_schedule
- deposit_amount

### Ketentuan

- maintenance_clause
- penalty_clause

---

## 5. Perjanjian NDA

### Core Field

- contract_number
- contract_title
- start_date
- end_date

### Kerahasiaan

- confidential_scope
- information_type
- disclosure_limit

### Ketentuan

- penalty_breach
- dispute_resolution

---

## 6. Perjanjian Outsourcing

### Core Field

- contract_number
- contract_title

### Tenaga Kerja

- manpower_count
- job_description
- work_location

### Finansial

- service_fee
- payment_terms

### Legal

- compliance_check
- insurance

---

## 7. Perjanjian Distribusi

### Core Field

- contract_number
- contract_title

### Distribusi

- product_list
- territory
- exclusivity

### Finansial

- margin
- pricing_scheme

---

## 8. Perjanjian Lisensi

### Core Field

- contract_number
- contract_title

### Lisensi

- license_type
- usage_scope
- duration

### Finansial

- royalty_fee
- payment_terms

---

## 9. Joint Venture

### Core Field

- contract_number
- contract_title

### Investasi

- capital_contribution
- ownership_percentage

### Operasional

- management_structure
- profit_sharing

---

## 10. Addendum

### Core Field

- contract_number
- parent_contract_id

### Perubahan

- revised_clause
- effective_date

### Dokumen

- addendum_document

---

## 11. Intercompany

### Core Field

- contract_number
- contract_title

### Internal

- entity_1
- entity_2

### Finansial

- transfer_pricing

---

## 12. Custom

### Core Field

- contract_number
- contract_title

### Flexible

- custom_fields (JSON)
