# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: contract-workflow.spec.ts >> Multi-Level Contract Approval Workflow >> should complete a full approval cycle from Staff to Manager
- Location: tests/e2e/contract-workflow.spec.ts:5:3

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /.*contracts\/[a-f0-9-]*/
Received string:  "http://127.0.0.1:8000/contracts?page=1&per_page=25"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    9 × unexpected value "http://127.0.0.1:8000/contracts?page=1&per_page=25"

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e7]:
      - list [ref=e9]:
        - listitem [ref=e10]:
          - link "Contract Management" [ref=e11] [cursor=pointer]:
            - /url: /dashboard
            - generic [ref=e13]: Contract Management
      - generic [ref=e14]:
        - generic [ref=e17]:
          - img [ref=e18]
          - textbox "Cari menu & fitur..." [ref=e21]
        - generic [ref=e22]:
          - generic [ref=e23]: Dashboard
          - list [ref=e24]:
            - listitem [ref=e25]:
              - link "Dashboard" [ref=e26] [cursor=pointer]:
                - /url: /dashboard
                - img [ref=e27]
                - generic [ref=e32]: Dashboard
        - generic [ref=e33]:
          - generic [ref=e34]: Manajemen Kontrak
          - list [ref=e35]:
            - listitem [ref=e36]:
              - link "Daftar Kontrak" [ref=e37] [cursor=pointer]:
                - /url: /contracts
                - img [ref=e38]
                - generic [ref=e41]: Daftar Kontrak
            - listitem [ref=e42]:
              - link "Kontrak Saya" [ref=e43] [cursor=pointer]:
                - /url: /contracts/mine
                - img [ref=e44]
                - generic [ref=e48]: Kontrak Saya
            - listitem [ref=e49]:
              - link "Persetujuan" [ref=e50] [cursor=pointer]:
                - /url: /contracts/pending
                - img [ref=e51]
                - generic [ref=e54]: Persetujuan
            - listitem [ref=e55]:
              - link "Masa Berlaku" [ref=e56] [cursor=pointer]:
                - /url: /contracts/expiry
                - img [ref=e57]
                - generic [ref=e61]: Masa Berlaku
      - generic [ref=e62]:
        - generic [ref=e63]:
          - generic:
            - list
        - list [ref=e64]:
          - listitem [ref=e65]:
            - button "AF Ahmad Fauzi" [ref=e66]:
              - generic [ref=e68]: AF
              - generic [ref=e70]: Ahmad Fauzi
              - img [ref=e71]
    - main [ref=e74]:
      - generic [ref=e75]:
        - generic [ref=e76]:
          - button "Toggle Sidebar" [ref=e77]:
            - img
            - generic [ref=e78]: Toggle Sidebar
          - navigation "breadcrumb" [ref=e80]:
            - list [ref=e81]:
              - listitem [ref=e82]:
                - link "Manajemen Kontrak" [ref=e83] [cursor=pointer]:
                  - /url: http://127.0.0.1:8000/contracts
              - listitem [ref=e84]:
                - img [ref=e85]
              - listitem [ref=e87]:
                - link "Manajemen Kontrak" [disabled] [ref=e88]
        - button "Toggle theme" [ref=e90]:
          - img
          - generic [ref=e91]: Toggle theme
      - generic [ref=e94]:
        - generic [ref=e95]:
          - generic [ref=e96]:
            - img [ref=e97]
            - textbox "Cari berdasarkan judul atau nomor..." [ref=e100]
          - generic [ref=e101]:
            - generic [ref=e102]:
              - button [ref=e103]:
                - img [ref=e104]
              - button [ref=e108]:
                - img [ref=e109]
            - button "Filter" [ref=e114]:
              - img [ref=e115]
              - text: Filter
            - button "+ Kontrak Baru" [ref=e117]:
              - generic [ref=e118]: +
              - text: Kontrak Baru
        - generic [ref=e120]:
          - table [ref=e122]:
            - rowgroup [ref=e123]:
              - row "No. Pengajuan Judul Kontrak Departemen Status Versi Progress Masa Berlaku SLA Sisa Tgl Dibuat" [ref=e124]:
                - columnheader "No. Pengajuan" [ref=e125]:
                  - generic [ref=e126]:
                    - text: No. Pengajuan
                    - button [ref=e127]:
                      - img [ref=e128]
                - columnheader "Judul Kontrak" [ref=e131]:
                  - generic [ref=e132]:
                    - text: Judul Kontrak
                    - button [ref=e133]:
                      - img [ref=e134]
                - columnheader "Departemen" [ref=e137]:
                  - generic [ref=e138]: Departemen
                - columnheader "Status" [ref=e139]:
                  - generic [ref=e140]: Status
                - columnheader "Versi" [ref=e141]:
                  - generic [ref=e142]: Versi
                - columnheader "Progress" [ref=e143]:
                  - generic [ref=e144]: Progress
                - columnheader "Masa Berlaku" [ref=e145]:
                  - generic [ref=e146]: Masa Berlaku
                - columnheader "SLA Sisa" [ref=e147]:
                  - generic [ref=e148]: SLA Sisa
                - columnheader "Tgl Dibuat" [ref=e149]:
                  - generic [ref=e150]: Tgl Dibuat
            - rowgroup [ref=e151]:
              - row "REQ-2025-001 Kontrak Vendor IT Infrastructure Perjanjian Pengadaan Barang Legal & Compliance In Review v2 0/0 27/04/2026 — — 25/04/2026" [ref=e152] [cursor=pointer]:
                - cell "REQ-2025-001" [ref=e153]
                - cell "Kontrak Vendor IT Infrastructure Perjanjian Pengadaan Barang" [ref=e154]:
                  - generic [ref=e155]:
                    - generic [ref=e156]: Kontrak Vendor IT Infrastructure
                    - generic [ref=e157]: Perjanjian Pengadaan Barang
                - cell "Legal & Compliance" [ref=e158]
                - cell "In Review" [ref=e159]:
                  - generic [ref=e160]: In Review
                - cell "v2" [ref=e161]:
                  - generic [ref=e162]: v2
                - cell "0/0" [ref=e163]:
                  - generic [ref=e165]: 0/0
                - cell "27/04/2026 —" [ref=e167]:
                  - generic [ref=e168]:
                    - generic [ref=e169]: 27/04/2026
                    - img [ref=e170]
                    - generic [ref=e172]: —
                - cell "—" [ref=e173]
                - cell "25/04/2026" [ref=e174]
              - row "REQ-CMS-003 MoU Sinergi Layanan Digital (#3) Perjanjian Sewa Legal & Compliance In Review v1 0/0 23/04/2026 — — 23/04/2026" [ref=e175] [cursor=pointer]:
                - cell "REQ-CMS-003" [ref=e176]
                - cell "MoU Sinergi Layanan Digital (#3) Perjanjian Sewa" [ref=e177]:
                  - generic [ref=e178]:
                    - generic [ref=e179]: MoU Sinergi Layanan Digital (#3)
                    - generic [ref=e180]: Perjanjian Sewa
                - cell "Legal & Compliance" [ref=e181]
                - cell "In Review" [ref=e182]:
                  - generic [ref=e183]: In Review
                - cell "v1" [ref=e184]:
                  - generic [ref=e185]: v1
                - cell "0/0" [ref=e186]:
                  - generic [ref=e188]: 0/0
                - cell "23/04/2026 —" [ref=e190]:
                  - generic [ref=e191]:
                    - generic [ref=e192]: 23/04/2026
                    - img [ref=e193]
                    - generic [ref=e195]: —
                - cell "—" [ref=e196]
                - cell "23/04/2026" [ref=e197]
              - row "REQ-CMS-011 Integrasi API Payment Gateway (#11) Perjanjian Joint Venture Finance & Accounting Approved v1 0/0 12/04/2026 — — 12/04/2026" [ref=e198] [cursor=pointer]:
                - cell "REQ-CMS-011" [ref=e199]
                - cell "Integrasi API Payment Gateway (#11) Perjanjian Joint Venture" [ref=e200]:
                  - generic [ref=e201]:
                    - generic [ref=e202]: Integrasi API Payment Gateway (#11)
                    - generic [ref=e203]: Perjanjian Joint Venture
                - cell "Finance & Accounting" [ref=e204]
                - cell "Approved" [ref=e205]:
                  - generic [ref=e206]: Approved
                - cell "v1" [ref=e207]:
                  - generic [ref=e208]: v1
                - cell "0/0" [ref=e209]:
                  - generic [ref=e211]: 0/0
                - cell "12/04/2026 —" [ref=e213]:
                  - generic [ref=e214]:
                    - generic [ref=e215]: 12/04/2026
                    - img [ref=e216]
                    - generic [ref=e218]: —
                - cell "—" [ref=e219]
                - cell "12/04/2026" [ref=e220]
              - row "REQ-CMS-026 Penyediaan Alat Tulis Kantor (ATK) (#26) Perjanjian Pengadaan Barang Information Technology In Review v1 0/0 11/04/2026 — — 11/04/2026" [ref=e221] [cursor=pointer]:
                - cell "REQ-CMS-026" [ref=e222]
                - cell "Penyediaan Alat Tulis Kantor (ATK) (#26) Perjanjian Pengadaan Barang" [ref=e223]:
                  - generic [ref=e224]:
                    - generic [ref=e225]: Penyediaan Alat Tulis Kantor (ATK) (#26)
                    - generic [ref=e226]: Perjanjian Pengadaan Barang
                - cell "Information Technology" [ref=e227]
                - cell "In Review" [ref=e228]:
                  - generic [ref=e229]: In Review
                - cell "v1" [ref=e230]:
                  - generic [ref=e231]: v1
                - cell "0/0" [ref=e232]:
                  - generic [ref=e234]: 0/0
                - cell "11/04/2026 —" [ref=e236]:
                  - generic [ref=e237]:
                    - generic [ref=e238]: 11/04/2026
                    - img [ref=e239]
                    - generic [ref=e241]: —
                - cell "—" [ref=e242]
                - cell "11/04/2026" [ref=e243]
              - row "REQ-CMS-020 Pengadaan Seragam Kerja Lapangan (#20) Perjanjian Distribusi Finance & Accounting In Review v1 0/0 09/04/2026 — — 09/04/2026" [ref=e244] [cursor=pointer]:
                - cell "REQ-CMS-020" [ref=e245]
                - cell "Pengadaan Seragam Kerja Lapangan (#20) Perjanjian Distribusi" [ref=e246]:
                  - generic [ref=e247]:
                    - generic [ref=e248]: Pengadaan Seragam Kerja Lapangan (#20)
                    - generic [ref=e249]: Perjanjian Distribusi
                - cell "Finance & Accounting" [ref=e250]
                - cell "In Review" [ref=e251]:
                  - generic [ref=e252]: In Review
                - cell "v1" [ref=e253]:
                  - generic [ref=e254]: v1
                - cell "0/0" [ref=e255]:
                  - generic [ref=e257]: 0/0
                - cell "09/04/2026 —" [ref=e259]:
                  - generic [ref=e260]:
                    - generic [ref=e261]: 09/04/2026
                    - img [ref=e262]
                    - generic [ref=e264]: —
                - cell "—" [ref=e265]
                - cell "09/04/2026" [ref=e266]
              - row "REQ-CMS-019 Kontrak Maintenance Lift dan Eskalator (#19) Perjanjian Outsourcing Finance & Accounting Approved v1 0/0 07/04/2026 — — 07/04/2026" [ref=e267] [cursor=pointer]:
                - cell "REQ-CMS-019" [ref=e268]
                - cell "Kontrak Maintenance Lift dan Eskalator (#19) Perjanjian Outsourcing" [ref=e269]:
                  - generic [ref=e270]:
                    - generic [ref=e271]: Kontrak Maintenance Lift dan Eskalator (#19)
                    - generic [ref=e272]: Perjanjian Outsourcing
                - cell "Finance & Accounting" [ref=e273]
                - cell "Approved" [ref=e274]:
                  - generic [ref=e275]: Approved
                - cell "v1" [ref=e276]:
                  - generic [ref=e277]: v1
                - cell "0/0" [ref=e278]:
                  - generic [ref=e280]: 0/0
                - cell "07/04/2026 —" [ref=e282]:
                  - generic [ref=e283]:
                    - generic [ref=e284]: 07/04/2026
                    - img [ref=e285]
                    - generic [ref=e287]: —
                - cell "—" [ref=e288]
                - cell "07/04/2026" [ref=e289]
              - row "REQ-CMS-038 Jasa Konsultasi Audit Pajak (#38) Perjanjian Jasa Information Technology Revision v1 0/0 07/04/2026 — — 07/04/2026" [ref=e290] [cursor=pointer]:
                - cell "REQ-CMS-038" [ref=e291]
                - cell "Jasa Konsultasi Audit Pajak (#38) Perjanjian Jasa" [ref=e292]:
                  - generic [ref=e293]:
                    - generic [ref=e294]: Jasa Konsultasi Audit Pajak (#38)
                    - generic [ref=e295]: Perjanjian Jasa
                - cell "Information Technology" [ref=e296]
                - cell "Revision" [ref=e297]:
                  - generic [ref=e298]: Revision
                - cell "v1" [ref=e299]:
                  - generic [ref=e300]: v1
                - cell "0/0" [ref=e301]:
                  - generic [ref=e303]: 0/0
                - cell "07/04/2026 —" [ref=e305]:
                  - generic [ref=e306]:
                    - generic [ref=e307]: 07/04/2026
                    - img [ref=e308]
                    - generic [ref=e310]: —
                - cell "—" [ref=e311]
                - cell "07/04/2026" [ref=e312]
              - row "REQ-CMS-027 MoU Sinergi Layanan Digital (#27) Perjanjian Outsourcing Information Technology Approved v1 0/0 05/04/2026 — — 05/04/2026" [ref=e313] [cursor=pointer]:
                - cell "REQ-CMS-027" [ref=e314]
                - cell "MoU Sinergi Layanan Digital (#27) Perjanjian Outsourcing" [ref=e315]:
                  - generic [ref=e316]:
                    - generic [ref=e317]: MoU Sinergi Layanan Digital (#27)
                    - generic [ref=e318]: Perjanjian Outsourcing
                - cell "Information Technology" [ref=e319]
                - cell "Approved" [ref=e320]:
                  - generic [ref=e321]: Approved
                - cell "v1" [ref=e322]:
                  - generic [ref=e323]: v1
                - cell "0/0" [ref=e324]:
                  - generic [ref=e326]: 0/0
                - cell "05/04/2026 —" [ref=e328]:
                  - generic [ref=e329]:
                    - generic [ref=e330]: 05/04/2026
                    - img [ref=e331]
                    - generic [ref=e333]: —
                - cell "—" [ref=e334]
                - cell "05/04/2026" [ref=e335]
              - row "REQ-CMS-032 Perjanjian Lisensi Font Korporat (#32) Perjanjian Sewa Legal & Compliance Revision v1 0/0 05/04/2026 — — 05/04/2026" [ref=e336] [cursor=pointer]:
                - cell "REQ-CMS-032" [ref=e337]
                - cell "Perjanjian Lisensi Font Korporat (#32) Perjanjian Sewa" [ref=e338]:
                  - generic [ref=e339]:
                    - generic [ref=e340]: Perjanjian Lisensi Font Korporat (#32)
                    - generic [ref=e341]: Perjanjian Sewa
                - cell "Legal & Compliance" [ref=e342]
                - cell "Revision" [ref=e343]:
                  - generic [ref=e344]: Revision
                - cell "v1" [ref=e345]:
                  - generic [ref=e346]: v1
                - cell "0/0" [ref=e347]:
                  - generic [ref=e349]: 0/0
                - cell "05/04/2026 —" [ref=e351]:
                  - generic [ref=e352]:
                    - generic [ref=e353]: 05/04/2026
                    - img [ref=e354]
                    - generic [ref=e356]: —
                - cell "—" [ref=e357]
                - cell "05/04/2026" [ref=e358]
              - row "REQ-CMS-024 Penyediaan Alat Tulis Kantor (ATK) (#24) Addendum / Perpanjangan Kontrak Legal & Compliance Approved v1 0/0 01/04/2026 — — 01/04/2026" [ref=e359] [cursor=pointer]:
                - cell "REQ-CMS-024" [ref=e360]
                - cell "Penyediaan Alat Tulis Kantor (ATK) (#24) Addendum / Perpanjangan Kontrak" [ref=e361]:
                  - generic [ref=e362]:
                    - generic [ref=e363]: Penyediaan Alat Tulis Kantor (ATK) (#24)
                    - generic [ref=e364]: Addendum / Perpanjangan Kontrak
                - cell "Legal & Compliance" [ref=e365]
                - cell "Approved" [ref=e366]:
                  - generic [ref=e367]: Approved
                - cell "v1" [ref=e368]:
                  - generic [ref=e369]: v1
                - cell "0/0" [ref=e370]:
                  - generic [ref=e372]: 0/0
                - cell "01/04/2026 —" [ref=e374]:
                  - generic [ref=e375]:
                    - generic [ref=e376]: 01/04/2026
                    - img [ref=e377]
                    - generic [ref=e379]: —
                - cell "—" [ref=e380]
                - cell "01/04/2026" [ref=e381]
              - row "REQ-CMS-036 Jasa Konsultasi Audit Pajak (#36) Perjanjian Outsourcing Legal & Compliance Approved v1 0/0 24/03/2026 — — 24/03/2026" [ref=e382] [cursor=pointer]:
                - cell "REQ-CMS-036" [ref=e383]
                - cell "Jasa Konsultasi Audit Pajak (#36) Perjanjian Outsourcing" [ref=e384]:
                  - generic [ref=e385]:
                    - generic [ref=e386]: Jasa Konsultasi Audit Pajak (#36)
                    - generic [ref=e387]: Perjanjian Outsourcing
                - cell "Legal & Compliance" [ref=e388]
                - cell "Approved" [ref=e389]:
                  - generic [ref=e390]: Approved
                - cell "v1" [ref=e391]:
                  - generic [ref=e392]: v1
                - cell "0/0" [ref=e393]:
                  - generic [ref=e395]: 0/0
                - cell "24/03/2026 —" [ref=e397]:
                  - generic [ref=e398]:
                    - generic [ref=e399]: 24/03/2026
                    - img [ref=e400]
                    - generic [ref=e402]: —
                - cell "—" [ref=e403]
                - cell "24/03/2026" [ref=e404]
              - row "CTR-2025-003 Perjanjian Sewa Gudang Logistik Perjanjian Sewa Legal & Compliance Revision v1 0/0 27/03/2026 — — 22/03/2026" [ref=e405] [cursor=pointer]:
                - cell "CTR-2025-003" [ref=e406]
                - cell "Perjanjian Sewa Gudang Logistik Perjanjian Sewa" [ref=e407]:
                  - generic [ref=e408]:
                    - generic [ref=e409]: Perjanjian Sewa Gudang Logistik
                    - generic [ref=e410]: Perjanjian Sewa
                - cell "Legal & Compliance" [ref=e411]
                - cell "Revision" [ref=e412]:
                  - generic [ref=e413]: Revision
                - cell "v1" [ref=e414]:
                  - generic [ref=e415]: v1
                - cell "0/0" [ref=e416]:
                  - generic [ref=e418]: 0/0
                - cell "27/03/2026 —" [ref=e420]:
                  - generic [ref=e421]:
                    - generic [ref=e422]: 27/03/2026
                    - img [ref=e423]
                    - generic [ref=e425]: —
                - cell "—" [ref=e426]
                - cell "22/03/2026" [ref=e427]
              - row "REQ-CMS-008 Perjanjian Kerjasama Distribusi Logistik (#8) Perjanjian Lisensi Legal & Compliance In Review v1 0/0 21/03/2026 — — 21/03/2026" [ref=e428] [cursor=pointer]:
                - cell "REQ-CMS-008" [ref=e429]
                - cell "Perjanjian Kerjasama Distribusi Logistik (#8) Perjanjian Lisensi" [ref=e430]:
                  - generic [ref=e431]:
                    - generic [ref=e432]: Perjanjian Kerjasama Distribusi Logistik (#8)
                    - generic [ref=e433]: Perjanjian Lisensi
                - cell "Legal & Compliance" [ref=e434]
                - cell "In Review" [ref=e435]:
                  - generic [ref=e436]: In Review
                - cell "v1" [ref=e437]:
                  - generic [ref=e438]: v1
                - cell "0/0" [ref=e439]:
                  - generic [ref=e441]: 0/0
                - cell "21/03/2026 —" [ref=e443]:
                  - generic [ref=e444]:
                    - generic [ref=e445]: 21/03/2026
                    - img [ref=e446]
                    - generic [ref=e448]: —
                - cell "—" [ref=e449]
                - cell "21/03/2026" [ref=e450]
              - row "REQ-2025-002 MoU Kerjasama Pemasaran Regional Perjanjian Kerja Sama (PKS) Legal & Compliance Approved v3 0/0 27/03/2026 — — 17/03/2026" [ref=e451] [cursor=pointer]:
                - cell "REQ-2025-002" [ref=e452]
                - cell "MoU Kerjasama Pemasaran Regional Perjanjian Kerja Sama (PKS)" [ref=e453]:
                  - generic [ref=e454]:
                    - generic [ref=e455]: MoU Kerjasama Pemasaran Regional
                    - generic [ref=e456]: Perjanjian Kerja Sama (PKS)
                - cell "Legal & Compliance" [ref=e457]
                - cell "Approved" [ref=e458]:
                  - generic [ref=e459]: Approved
                - cell "v3" [ref=e460]:
                  - generic [ref=e461]: v3
                - cell "0/0" [ref=e462]:
                  - generic [ref=e464]: 0/0
                - cell "27/03/2026 —" [ref=e466]:
                  - generic [ref=e467]:
                    - generic [ref=e468]: 27/03/2026
                    - img [ref=e469]
                    - generic [ref=e471]: —
                - cell "—" [ref=e472]
                - cell "17/03/2026" [ref=e473]
              - row "REQ-CMS-025 Kontrak Catering Karyawan Shift Malam (#25) Perjanjian Internal (Intercompany) Finance & Accounting Revision v1 0/0 17/03/2026 — — 17/03/2026" [ref=e474] [cursor=pointer]:
                - cell "REQ-CMS-025" [ref=e475]
                - cell "Kontrak Catering Karyawan Shift Malam (#25) Perjanjian Internal (Intercompany)" [ref=e476]:
                  - generic [ref=e477]:
                    - generic [ref=e478]: Kontrak Catering Karyawan Shift Malam (#25)
                    - generic [ref=e479]: Perjanjian Internal (Intercompany)
                - cell "Finance & Accounting" [ref=e480]
                - cell "Revision" [ref=e481]:
                  - generic [ref=e482]: Revision
                - cell "v1" [ref=e483]:
                  - generic [ref=e484]: v1
                - cell "0/0" [ref=e485]:
                  - generic [ref=e487]: 0/0
                - cell "17/03/2026 —" [ref=e489]:
                  - generic [ref=e490]:
                    - generic [ref=e491]: 17/03/2026
                    - img [ref=e492]
                    - generic [ref=e494]: —
                - cell "—" [ref=e495]
                - cell "17/03/2026" [ref=e496]
              - row "REQ-CMS-023 Integrasi API Payment Gateway (#23) Perjanjian Pengadaan Barang Information Technology Approved v1 0/0 06/03/2026 — — 06/03/2026" [ref=e497] [cursor=pointer]:
                - cell "REQ-CMS-023" [ref=e498]
                - cell "Integrasi API Payment Gateway (#23) Perjanjian Pengadaan Barang" [ref=e499]:
                  - generic [ref=e500]:
                    - generic [ref=e501]: Integrasi API Payment Gateway (#23)
                    - generic [ref=e502]: Perjanjian Pengadaan Barang
                - cell "Information Technology" [ref=e503]
                - cell "Approved" [ref=e504]:
                  - generic [ref=e505]: Approved
                - cell "v1" [ref=e506]:
                  - generic [ref=e507]: v1
                - cell "0/0" [ref=e508]:
                  - generic [ref=e510]: 0/0
                - cell "06/03/2026 —" [ref=e512]:
                  - generic [ref=e513]:
                    - generic [ref=e514]: 06/03/2026
                    - img [ref=e515]
                    - generic [ref=e517]: —
                - cell "—" [ref=e518]
                - cell "06/03/2026" [ref=e519]
              - row "REQ-CMS-035 MoU Penyelenggaraan Event Tahunan (#35) Perjanjian Lisensi Information Technology Approved v1 0/0 04/03/2026 — — 04/03/2026" [ref=e520] [cursor=pointer]:
                - cell "REQ-CMS-035" [ref=e521]
                - cell "MoU Penyelenggaraan Event Tahunan (#35) Perjanjian Lisensi" [ref=e522]:
                  - generic [ref=e523]:
                    - generic [ref=e524]: MoU Penyelenggaraan Event Tahunan (#35)
                    - generic [ref=e525]: Perjanjian Lisensi
                - cell "Information Technology" [ref=e526]
                - cell "Approved" [ref=e527]:
                  - generic [ref=e528]: Approved
                - cell "v1" [ref=e529]:
                  - generic [ref=e530]: v1
                - cell "0/0" [ref=e531]:
                  - generic [ref=e533]: 0/0
                - cell "04/03/2026 —" [ref=e535]:
                  - generic [ref=e536]:
                    - generic [ref=e537]: 04/03/2026
                    - img [ref=e538]
                    - generic [ref=e540]: —
                - cell "—" [ref=e541]
                - cell "04/03/2026" [ref=e542]
              - row "REQ-CMS-022 Perjanjian Sewa Kendaraan Operasional (#22) Perjanjian Internal (Intercompany) Legal & Compliance Revision v1 0/0 01/03/2026 — — 01/03/2026" [ref=e543] [cursor=pointer]:
                - cell "REQ-CMS-022" [ref=e544]
                - cell "Perjanjian Sewa Kendaraan Operasional (#22) Perjanjian Internal (Intercompany)" [ref=e545]:
                  - generic [ref=e546]:
                    - generic [ref=e547]: Perjanjian Sewa Kendaraan Operasional (#22)
                    - generic [ref=e548]: Perjanjian Internal (Intercompany)
                - cell "Legal & Compliance" [ref=e549]
                - cell "Revision" [ref=e550]:
                  - generic [ref=e551]: Revision
                - cell "v1" [ref=e552]:
                  - generic [ref=e553]: v1
                - cell "0/0" [ref=e554]:
                  - generic [ref=e556]: 0/0
                - cell "01/03/2026 —" [ref=e558]:
                  - generic [ref=e559]:
                    - generic [ref=e560]: 01/03/2026
                    - img [ref=e561]
                    - generic [ref=e563]: —
                - cell "—" [ref=e564]
                - cell "01/03/2026" [ref=e565]
              - row "CTR-2025-005 Pengadaan Laptop Staff Baru Perjanjian Pengadaan Barang Legal & Compliance Approved v1 0/0 27/02/2026 — — 22/02/2026" [ref=e566] [cursor=pointer]:
                - cell "CTR-2025-005" [ref=e567]
                - cell "Pengadaan Laptop Staff Baru Perjanjian Pengadaan Barang" [ref=e568]:
                  - generic [ref=e569]:
                    - generic [ref=e570]: Pengadaan Laptop Staff Baru
                    - generic [ref=e571]: Perjanjian Pengadaan Barang
                - cell "Legal & Compliance" [ref=e572]
                - cell "Approved" [ref=e573]:
                  - generic [ref=e574]: Approved
                - cell "v1" [ref=e575]:
                  - generic [ref=e576]: v1
                - cell "0/0" [ref=e577]:
                  - generic [ref=e579]: 0/0
                - cell "27/02/2026 —" [ref=e581]:
                  - generic [ref=e582]:
                    - generic [ref=e583]: 27/02/2026
                    - img [ref=e584]
                    - generic [ref=e586]: —
                - cell "—" [ref=e587]
                - cell "22/02/2026" [ref=e588]
              - row "REQ-CMS-049 Sewa Area Parkir Tambahan (#49) Perjanjian Distribusi Finance & Accounting Approved v1 0/0 22/02/2026 — — 22/02/2026" [ref=e589] [cursor=pointer]:
                - cell "REQ-CMS-049" [ref=e590]
                - cell "Sewa Area Parkir Tambahan (#49) Perjanjian Distribusi" [ref=e591]:
                  - generic [ref=e592]:
                    - generic [ref=e593]: Sewa Area Parkir Tambahan (#49)
                    - generic [ref=e594]: Perjanjian Distribusi
                - cell "Finance & Accounting" [ref=e595]
                - cell "Approved" [ref=e596]:
                  - generic [ref=e597]: Approved
                - cell "v1" [ref=e598]:
                  - generic [ref=e599]: v1
                - cell "0/0" [ref=e600]:
                  - generic [ref=e602]: 0/0
                - cell "22/02/2026 —" [ref=e604]:
                  - generic [ref=e605]:
                    - generic [ref=e606]: 22/02/2026
                    - img [ref=e607]
                    - generic [ref=e609]: —
                - cell "—" [ref=e610]
                - cell "22/02/2026" [ref=e611]
              - row "REQ-CMS-018 Kontrak Outsourcing Security Gedung (#18) Perjanjian Joint Venture Tax In Review v1 0/0 18/02/2026 — — 18/02/2026" [ref=e612] [cursor=pointer]:
                - cell "REQ-CMS-018" [ref=e613]
                - cell "Kontrak Outsourcing Security Gedung (#18) Perjanjian Joint Venture" [ref=e614]:
                  - generic [ref=e615]:
                    - generic [ref=e616]: Kontrak Outsourcing Security Gedung (#18)
                    - generic [ref=e617]: Perjanjian Joint Venture
                - cell "Tax" [ref=e618]
                - cell "In Review" [ref=e619]:
                  - generic [ref=e620]: In Review
                - cell "v1" [ref=e621]:
                  - generic [ref=e622]: v1
                - cell "0/0" [ref=e623]:
                  - generic [ref=e625]: 0/0
                - cell "18/02/2026 —" [ref=e627]:
                  - generic [ref=e628]:
                    - generic [ref=e629]: 18/02/2026
                    - img [ref=e630]
                    - generic [ref=e632]: —
                - cell "—" [ref=e633]
                - cell "18/02/2026" [ref=e634]
              - row "REQ-CMS-044 Kontrak Renovasi Ruang Meeting (#44) Perjanjian Lisensi Legal & Compliance In Review v1 0/0 17/02/2026 — — 17/02/2026" [ref=e635] [cursor=pointer]:
                - cell "REQ-CMS-044" [ref=e636]
                - cell "Kontrak Renovasi Ruang Meeting (#44) Perjanjian Lisensi" [ref=e637]:
                  - generic [ref=e638]:
                    - generic [ref=e639]: Kontrak Renovasi Ruang Meeting (#44)
                    - generic [ref=e640]: Perjanjian Lisensi
                - cell "Legal & Compliance" [ref=e641]
                - cell "In Review" [ref=e642]:
                  - generic [ref=e643]: In Review
                - cell "v1" [ref=e644]:
                  - generic [ref=e645]: v1
                - cell "0/0" [ref=e646]:
                  - generic [ref=e648]: 0/0
                - cell "17/02/2026 —" [ref=e650]:
                  - generic [ref=e651]:
                    - generic [ref=e652]: 17/02/2026
                    - img [ref=e653]
                    - generic [ref=e655]: —
                - cell "—" [ref=e656]
                - cell "17/02/2026" [ref=e657]
              - row "REQ-CMS-037 Perjanjian Kerjasama Distribusi Logistik (#37) Addendum / Perpanjangan Kontrak Tax Revision v1 0/0 05/02/2026 — — 05/02/2026" [ref=e658] [cursor=pointer]:
                - cell "REQ-CMS-037" [ref=e659]
                - cell "Perjanjian Kerjasama Distribusi Logistik (#37) Addendum / Perpanjangan Kontrak" [ref=e660]:
                  - generic [ref=e661]:
                    - generic [ref=e662]: Perjanjian Kerjasama Distribusi Logistik (#37)
                    - generic [ref=e663]: Addendum / Perpanjangan Kontrak
                - cell "Tax" [ref=e664]
                - cell "Revision" [ref=e665]:
                  - generic [ref=e666]: Revision
                - cell "v1" [ref=e667]:
                  - generic [ref=e668]: v1
                - cell "0/0" [ref=e669]:
                  - generic [ref=e671]: 0/0
                - cell "05/02/2026 —" [ref=e673]:
                  - generic [ref=e674]:
                    - generic [ref=e675]: 05/02/2026
                    - img [ref=e676]
                    - generic [ref=e678]: —
                - cell "—" [ref=e679]
                - cell "05/02/2026" [ref=e680]
              - row "REQ-CMS-039 Jasa Konsultasi Audit Pajak (#39) Perjanjian Outsourcing Information Technology In Review v1 0/0 03/02/2026 — — 03/02/2026" [ref=e681] [cursor=pointer]:
                - cell "REQ-CMS-039" [ref=e682]
                - cell "Jasa Konsultasi Audit Pajak (#39) Perjanjian Outsourcing" [ref=e683]:
                  - generic [ref=e684]:
                    - generic [ref=e685]: Jasa Konsultasi Audit Pajak (#39)
                    - generic [ref=e686]: Perjanjian Outsourcing
                - cell "Information Technology" [ref=e687]
                - cell "In Review" [ref=e688]:
                  - generic [ref=e689]: In Review
                - cell "v1" [ref=e690]:
                  - generic [ref=e691]: v1
                - cell "0/0" [ref=e692]:
                  - generic [ref=e694]: 0/0
                - cell "03/02/2026 —" [ref=e696]:
                  - generic [ref=e697]:
                    - generic [ref=e698]: 03/02/2026
                    - img [ref=e699]
                    - generic [ref=e701]: —
                - cell "—" [ref=e702]
                - cell "03/02/2026" [ref=e703]
              - row "REQ-CMS-031 Perjanjian Kerjasama Distribusi Logistik (#31) Perjanjian Khusus (Custom) Legal & Compliance Revision v1 0/0 02/02/2026 — — 02/02/2026" [ref=e704] [cursor=pointer]:
                - cell "REQ-CMS-031" [ref=e705]
                - cell "Perjanjian Kerjasama Distribusi Logistik (#31) Perjanjian Khusus (Custom)" [ref=e706]:
                  - generic [ref=e707]:
                    - generic [ref=e708]: Perjanjian Kerjasama Distribusi Logistik (#31)
                    - generic [ref=e709]: Perjanjian Khusus (Custom)
                - cell "Legal & Compliance" [ref=e710]
                - cell "Revision" [ref=e711]:
                  - generic [ref=e712]: Revision
                - cell "v1" [ref=e713]:
                  - generic [ref=e714]: v1
                - cell "0/0" [ref=e715]:
                  - generic [ref=e717]: 0/0
                - cell "02/02/2026 —" [ref=e719]:
                  - generic [ref=e720]:
                    - generic [ref=e721]: 02/02/2026
                    - img [ref=e722]
                    - generic [ref=e724]: —
                - cell "—" [ref=e725]
                - cell "02/02/2026" [ref=e726]
          - generic [ref=e727]:
            - generic [ref=e728]:
              - generic [ref=e729]: Showing 1 to 25 of 48 Results
              - generic [ref=e730]:
                - generic [ref=e731]: Rows per page
                - combobox [ref=e732] [cursor=pointer]:
                  - option "10"
                  - option "25" [selected]
                  - option "50"
                  - option "100"
            - generic [ref=e733]:
              - button "Prev" [disabled]
              - generic [ref=e734]:
                - button "1" [ref=e735]
                - button "2" [ref=e736]
              - button "Next" [ref=e737]
      - generic [ref=e739]:
        - generic [ref=e740]:
          - heading " Buat Kontrak Baru" [level=6] [ref=e741]:
            - generic [ref=e742]: 
            - text: Buat Kontrak Baru
          - button "" [ref=e743]:
            - generic [ref=e744]: 
        - generic [ref=e745]:
          - generic [ref=e746]:
            - generic [ref=e747]:
              - generic [ref=e748]: Perjanjian *
              - combobox [ref=e749]:
                - option "Pilih Tipe"
                - option "Perjanjan Baru" [selected]
                - option "Addendum/Amandment"
                - option "Review"
                - option "Surat Kuasa"
            - generic [ref=e750]:
              - generic [ref=e751]: Tipe Kontrak *
              - combobox [ref=e752]:
                - option "Pilih Tipe" [selected]
                - option "Perjanjian Kerja Sama (PKS)"
                - option "Perjanjian Jasa"
                - option "Perjanjian Pengadaan Barang"
                - option "Perjanjian Sewa"
                - option "Perjanjian Kerahasiaan (NDA)"
                - option "Perjanjian Lisensi"
                - option "Perjanjian Distribusi"
                - option "Perjanjian Outsourcing"
                - option "Perjanjian Joint Venture"
                - option "Perjanjian Internal (Intercompany)"
                - option "Perjanjian Khusus (Custom)"
                - option "Addendum / Perpanjangan Kontrak"
              - generic [ref=e753]: Tipe kontrak harus dipilih
          - generic [ref=e754]:
            - generic [ref=e755]: Judul Kontrak *
            - textbox "Masukkan judul kontrak" [ref=e756]: Workflow Test 1777343634153
        - generic [ref=e757]:
          - button "Batal" [ref=e758]
          - button " Buat Kontrak" [active] [ref=e759]:
            - generic [ref=e760]: 
            - text: Buat Kontrak
      - button "" [ref=e761]:
        - generic [ref=e762]: 
  - generic [ref=e763]: Jan
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Multi-Level Contract Approval Workflow', () => {
  4  |     
  5  |   test('should complete a full approval cycle from Staff to Manager', async ({ page }) => {
  6  |     // === TAHAP 1: STAFF MENGAJUKAN KONTRAK ===
  7  |     await page.goto('/login');
  8  |     await page.fill('#email', 'ahmad@example.com');
  9  |     await page.fill('#password', 'password');
  10 |     await page.click('button:has-text("Log in")');
  11 | 
  12 |     await expect(page).toHaveURL(/.*dashboard/);
  13 |     await page.click('text=Daftar Kontrak');
  14 |     
  15 |     // Buat Kontrak Baru
  16 |     const contractName = `Workflow Test ${Date.now()}`;
  17 |     await page.click('button:has-text("KONTRAK BARU")');
  18 |     await page.fill('input[placeholder="Masukkan judul kontrak"]', contractName);
  19 |     await page.locator('select').nth(0).selectOption({ index: 1 }); // Submission Type
  20 |     await page.locator('select').nth(1).selectOption({ index: 1 }); // Contract Type
  21 |     await page.click('button:has-text("Buat Kontrak")');
  22 | 
  23 |     // Tunggu redirect ke detail
> 24 |     await expect(page).toHaveURL(/.*contracts\/[a-f0-9-]*/);
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  25 | 
  26 |     // Isi F1 (Wajib agar bisa dikirim)
  27 |     await page.click('button:has-text("Formulir F1")');
  28 |     await page.waitForTimeout(1000);
  29 |     const formFields = page.locator('.space-y-4 input[type="text"], .space-y-4 textarea');
  30 |     if (await formFields.count() > 0) {
  31 |         await formFields.first().fill('Data Test Otomatis');
  32 |     }
  33 |     await page.click('button:has-text("Simpan Formulir")');
  34 |     await page.waitForTimeout(2500);
  35 | 
  36 |     // Kirim untuk Approval
  37 |     await page.click('button:has-text("Kirim Approval")');
  38 |     await expect(page.locator('text=Otorisasi Akses')).toBeVisible();
  39 |     await page.click('button:has-text("Otorisasi & Kirim")');
  40 |     
  41 |     // Verifikasi Status In Review
  42 |     await expect(page.locator('text=In Review').first()).toBeVisible();
  43 | 
  44 |     // === LOGOUT STAFF ===
  45 |     // Klik menu user di pojok kiri bawah (Sidebar Footer)
  46 |     await page.locator('button[aria-haspopup="menu"]').last().click();
  47 |     await page.click('button:has-text("Log out")');
  48 |     await expect(page).toHaveURL(/.*login/);
  49 | 
  50 |     // === TAHAP 2: MANAGER MENYETUJUI KONTRAK ===
  51 |     await page.fill('#email', 'budi@example.com'); // Manager Legal/Staff
  52 |     await page.fill('#password', 'password');
  53 |     await page.click('button:has-text("Log in")');
  54 | 
  55 |     await expect(page).toHaveURL(/.*dashboard/);
  56 |     
  57 |     // Navigasi ke menu Persetujuan
  58 |     await page.click('text=Persetujuan');
  59 |     
  60 |     // Cari kontrak yang baru dibuat (baris pertama biasanya yang terbaru)
  61 |     const contractRow = page.locator('tr').filter({ hasText: contractName });
  62 |     await expect(contractRow).toBeVisible();
  63 |     await contractRow.click();
  64 | 
  65 |     // Berikan Persetujuan
  66 |     await expect(page.locator('text=Persetujuan Diperlukan')).toBeVisible();
  67 |     await page.fill('textarea[placeholder*="Catatan"]', 'Disetujui secara otomatis melalui Playwright Testing');
  68 |     await page.click('button:has-text("Setujui")');
  69 | 
  70 |     // Konfirmasi di Modal
  71 |     await page.click('button:has-text("Ya, Setujui")');
  72 | 
  73 |     // === VERIFIKASI AKHIR ===
  74 |     // Cek apakah ada indikator keberhasilan (Toast atau perubahan status di detail)
  75 |     await expect(page.locator('text=In Review').or(page.locator('text=Approved'))).toBeVisible();
  76 |     
  77 |     // Logout Manager
  78 |     await page.locator('button[aria-haspopup="menu"]').last().click();
  79 |     await page.click('button:has-text("Log out")');
  80 |   });
  81 | });
  82 | 
```