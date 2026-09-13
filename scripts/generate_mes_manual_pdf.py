import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Polygon, Group

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_footer(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_footer(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 9)
        self.setFillColor(colors.HexColor("#64748B"))
        # Header banner line
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(40, 755, 572, 755)
        self.drawString(40, 760, "Mini MES — Shop-Floor Manufacturing Execution System | User & Architecture Guide")
        
        # Footer
        self.line(40, 45, 572, 45)
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(572, 32, page_text)
        self.drawString(40, 32, "Confidential & Proprietary — Factory Operations")
        self.restoreState()

def create_flowchart_drawing():
    """Generates a clean vector flowchart diagram illustrating the end-to-end MES process."""
    d = Drawing(532, 175)
    
    # Outer frame container
    d.add(Rect(0, 0, 532, 175, rx=12, ry=12, fillColor=colors.HexColor("#F8FAFC"), strokeColor=colors.HexColor("#CBD5E1"), strokeWidth=1))
    
    # Flowchart Header
    d.add(String(16, 155, "END-TO-END MANUFACTURING EXECUTION PROCESS FLOW", fontName="Helvetica-Bold", fontSize=9, fillColor=colors.HexColor("#0F172A")))
    d.add(String(16, 142, "Automated shop-floor lifecycle from machine configuration to quality disposition and fulfillment", fontName="Helvetica", fontSize=7.5, fillColor=colors.HexColor("#64748B")))
    
    # Nodes configuration: 5 pipeline boxes across top
    nodes = [
        {"x": 14,  "y": 72, "w": 90, "h": 58, "title": "1. Machine Setup", "role": "ADMIN", "desc": "Register stations,\ncapacity & status", "bg": "#EFF6FF", "border": "#93C5FD", "color": "#1E3A8A"},
        {"x": 118, "y": 72, "w": 90, "h": 58, "title": "2. Work Order",   "role": "SUPERVISOR", "desc": "Schedule batches,\nquantities & dates", "bg": "#F0FDF4", "border": "#86EFAC", "color": "#14532D"},
        {"x": 222, "y": 72, "w": 90, "h": 58, "title": "3. Gantt Dispatch","role": "TIMELINE", "desc": "Visual machine loading\n& collision checks", "bg": "#FAF5FF", "border": "#D8B4FE", "color": "#581C87"},
        {"x": 326, "y": 72, "w": 90, "h": 58, "title": "4. Shift Run",     "role": "OPERATOR", "desc": "Log good parts\n& shift scrap", "bg": "#EFF6FF", "border": "#93C5FD", "color": "#1E3A8A"},
        {"x": 428, "y": 72, "w": 90, "h": 58, "title": "5. QA & Seal",     "role": "INSPECTOR", "desc": "Audit sample lot &\ndisposition (Pass/Fail)", "bg": "#FEF3C7", "border": "#FCD34D", "color": "#78350F"},
    ]
    
    for i, n in enumerate(nodes):
        # Node Box
        d.add(Rect(n["x"], n["y"], n["w"], n["h"], rx=6, ry=6, fillColor=colors.HexColor(n["bg"]), strokeColor=colors.HexColor(n["border"]), strokeWidth=1))
        
        # Node Title
        d.add(String(n["x"] + 6, n["y"] + 44, n["title"], fontName="Helvetica-Bold", fontSize=7.5, fillColor=colors.HexColor(n["color"])))
        
        # Role Pill
        d.add(Rect(n["x"] + 6, n["y"] + 31, 56, 10, rx=3, ry=3, fillColor=colors.HexColor("#FFFFFF"), strokeColor=colors.HexColor(n["border"]), strokeWidth=0.5))
        d.add(String(n["x"] + 10, n["y"] + 33.5, n["role"], fontName="Helvetica-Bold", fontSize=5.5, fillColor=colors.HexColor(n["color"])))
        
        # Desc lines
        lines = n["desc"].split("\n")
        for line_idx, line in enumerate(lines):
            d.add(String(n["x"] + 6, n["y"] + 19 - (line_idx * 9), line, fontName="Helvetica", fontSize=6.5, fillColor=colors.HexColor("#334155")))
            
        # Arrow between top nodes
        if i < len(nodes) - 1:
            ax1 = n["x"] + n["w"]
            ax2 = nodes[i+1]["x"]
            ay = n["y"] + (n["h"] / 2)
            d.add(Line(ax1, ay, ax2 - 5, ay, strokeColor=colors.HexColor("#64748B"), strokeWidth=1.2))
            d.add(Polygon([ax2 - 5, ay - 3, ax2, ay, ax2 - 5, ay + 3], fillColor=colors.HexColor("#64748B"), strokeColor=None))
            
    # Bottom Integration Bar: Database Trigger Engine & Live Analytics
    d.add(Rect(14, 12, 504, 46, rx=8, ry=8, fillColor=colors.HexColor("#0F172A"), strokeColor=colors.HexColor("#1E2939"), strokeWidth=1))
    
    d.add(String(24, 38, "AUTOMATED BACKEND SYNCHRONIZATION ENGINE (PostgreSQL Triggers with SECURITY DEFINER)", fontName="Helvetica-Bold", fontSize=7.5, fillColor=colors.HexColor("#38BDF8")))
    d.add(String(24, 26, "• Floor Scrap + QC Defect Aggregation  • Single Source of Truth Completion %  • Planned Quantity Cap Defense", fontName="Helvetica", fontSize=6.5, fillColor=colors.HexColor("#CBD5E1")))
    d.add(String(24, 16, "• Automatic Status Flip to 'Completed' upon reaching Target  • Live Executive KPI Dashboard (FPY, OEE, Scrap Rate)", fontName="Helvetica", fontSize=6.5, fillColor=colors.HexColor("#94A3B8")))
    
    # Connecting Arrows from Shift Run and QA down to the Backend Bar
    d.add(Line(371, 72, 371, 62, strokeColor=colors.HexColor("#0284C7"), strokeWidth=1.2))
    d.add(Polygon([368, 62, 371, 58, 374, 62], fillColor=colors.HexColor("#0284C7"), strokeColor=None))
    
    d.add(Line(473, 72, 473, 62, strokeColor=colors.HexColor("#0284C7"), strokeWidth=1.2))
    d.add(Polygon([470, 62, 473, 58, 476, 62], fillColor=colors.HexColor("#0284C7"), strokeColor=None))
    
    return d

def build_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=55,
        bottomMargin=55
    )

    styles = getSampleStyleSheet()
    
    # Custom Palette
    c_primary = colors.HexColor("#0284C7")     # Sky blue
    c_dark = colors.HexColor("#0F172A")        # Slate 900
    c_body = colors.HexColor("#334155")        # Slate 700
    c_card_bg = colors.HexColor("#F8FAFC")     # Slate 50
    c_border = colors.HexColor("#CBD5E1")      # Slate 300

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=28,
        textColor=c_dark,
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=c_primary,
        spaceAfter=12
    )

    h1_style = ParagraphStyle(
        'Header1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=c_dark,
        spaceBefore=12,
        spaceAfter=5,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Header2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor("#0369A1"),
        spaceBefore=8,
        spaceAfter=3,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=c_body,
        spaceAfter=5
    )

    bullet_style = ParagraphStyle(
        'Bullet',
        parent=body_style,
        leftIndent=14,
        firstLineIndent=-9,
        spaceAfter=2.5
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=10.5,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10.5,
        textColor=c_dark
    )

    table_cell_code = ParagraphStyle(
        'TableCellCode',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#0F172A")
    )

    story = []

    # Title & Header
    story.append(Paragraph("Mini MES (Manufacturing Execution System)", title_style))
    story.append(Paragraph("Operational Manual, Role Reference & Process Flow Guide", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_primary, spaceBefore=0, spaceAfter=8))

    # SECTION 1: SYSTEM PURPOSE
    story.append(Paragraph("1. Executive Overview & System Purpose", h1_style))
    story.append(Paragraph(
        "<b>Mini MES</b> is a real-time <b>Manufacturing Execution System</b> engineered for discrete and batch production environments. "
        "It acts as the single source of operational truth on the factory floor, orchestrating work orders, machine stations, operator shifts, and quality audits.",
        body_style
    ))
    story.append(Paragraph("&bull; <b>Work Order Life-Cycle:</b> Planning, machine assignment, progress tracking, and automated completion.", bullet_style))
    story.append(Paragraph("&bull; <b>Machine Scheduling &amp; Gantt Timeline:</b> Visual horizontal timeline plotted across workstations and dates, complete with overload conflict warning indicators and drag-to-reschedule.", bullet_style))
    story.append(Paragraph("&bull; <b>Shift Output &amp; Floor Scrap:</b> Fast operator logging of good units versus rejected scrap with planned quantity defense guards.", bullet_style))
    story.append(Paragraph("&bull; <b>Quality Assurance (QA) Audits:</b> Lot sample inspections, defect classifications, and dispositioning.", bullet_style))
    story.append(Paragraph("&bull; <b>Database-Enforced Security:</b> PostgreSQL Row-Level Security (RLS) and elevated <code>SECURITY DEFINER</code> recalculation triggers.", bullet_style))

    story.append(Spacer(1, 4))

    # SECTION 2: PROCESS FLOWCHART
    story.append(Paragraph("2. Manufacturing Execution Process Flowchart", h1_style))
    story.append(Paragraph("The visual diagram below maps how orders, machines, and shift logs flow seamlessly from creation to final executive analytics:", body_style))
    story.append(Spacer(1, 2))
    story.append(create_flowchart_drawing())
    story.append(Spacer(1, 10))
    story.append(PageBreak())

    # SECTION 3: ROLES & CREDENTIALS
    story.append(Paragraph("3. User Roles & Clean Login Credentials", h1_style))
    story.append(Paragraph(
        "All credentials use clean alphanumeric passwords with no special characters. Powered by Supabase Auth with PostgreSQL RLS:",
        body_style
    ))

    role_data = [
        [
            Paragraph("Role", table_header_style),
            Paragraph("Login Email", table_header_style),
            Paragraph("Password", table_header_style),
            Paragraph("System Permissions & Scope", table_header_style)
        ],
        [
            Paragraph("<b>Admin</b>", table_cell_style),
            Paragraph("admin@factory.com", table_cell_code),
            Paragraph("Admin123", table_cell_code),
            Paragraph("Unrestricted control. Create/edit/delete orders, register machines, Gantt schedule timeline, production logs, QA audits, diagnostics.", table_cell_style)
        ],
        [
            Paragraph("<b>Supervisor</b>", table_cell_style),
            Paragraph("supervisor@factory.com", table_cell_code),
            Paragraph("Supervisor123", table_cell_code),
            Paragraph("Production scheduling. Plan and release work orders, Gantt timeline dispatch, drag-reschedule batches, manage shift logs, view analytics.", table_cell_style)
        ],
        [
            Paragraph("<b>Operator</b>", table_cell_style),
            Paragraph("operator@factory.com", table_cell_code),
            Paragraph("Operator123", table_cell_code),
            Paragraph("Floor execution. Submit shift production logs (good units vs scrap), monitor active jobs and station statuses. (Read-only on schedule/orders).", table_cell_style)
        ],
        [
            Paragraph("<b>Quality Inspector</b>", table_cell_style),
            Paragraph("quality@factory.com", table_cell_code),
            Paragraph("Quality123", table_cell_code),
            Paragraph("Quality auditing authority. Log inspection sample sizes, defect classifications, and record lot disposition (Pass / Fail / Conditional).", table_cell_style)
        ]
    ]

    col_widths = [85, 125, 80, 242]
    role_table = Table(role_data, colWidths=col_widths, repeatRows=1)
    role_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_dark),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_card_bg]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(role_table)

    story.append(PageBreak())

    # SECTION 4: STEP-BY-STEP OPERATIONAL EXAMPLE
    story.append(Paragraph("4. End-to-End Operational Walkthrough Example", h1_style))
    story.append(Paragraph(
        "<b>Scenario:</b> Manufacturing a batch of <b>500 Electric Motor Shafts 25mm</b> (Work Order: <code>WO-2026-8178</code>) on workstation <code>CNC-01</code>.",
        body_style
    ))

    story.append(Paragraph("Step 1: Create & Schedule the Work Order (Supervisor)", h2_style))
    story.append(Paragraph(
        "1. Log in with <code>supervisor@factory.com</code> / <code>Supervisor123</code>.<br/>"
        "2. Navigate to <b>Work Orders</b> &rarr; click <b>+ New Work Order</b>.<br/>"
        "3. Enter batch parameters:<br/>"
        "&nbsp;&nbsp;&bull; <b>Order Number:</b> <code>WO-2026-8178</code><br/>"
        "&nbsp;&nbsp;&bull; <b>Product Name:</b> <code>Electric Motor Shaft 25mm</code><br/>"
        "&nbsp;&nbsp;&bull; <b>Machine:</b> <code>CNC-01</code> | <b>Target Quantity:</b> <code>500</code><br/>"
        "&nbsp;&nbsp;&bull; <b>Dates:</b> Start = <code>Today</code>, Due = <code>Next Friday</code>.<br/>"
        "4. Click <b>Create Work Order</b>. The batch initializes at 0% in <b>Pending</b> status.",
        body_style
    ))

    story.append(Paragraph("Step 2: Inspect Gantt Timeline & Workstation Loading (Supervisor)", h2_style))
    story.append(Paragraph(
        "1. In the sidebar, click <b>Gantt Schedule</b>.<br/>"
        "2. The horizontal span bar for <code>WO-2026-8178</code> appears across CNC-01's row.<br/>"
        "3. <b>Conflict Detection:</b> If another order is booked on CNC-01 during overlapping dates, an amber <code>Conflict (2)</code> warning badge automatically flags the collision and stacks the bars in clear vertical lanes.<br/>"
        "4. <b>Interactive Reschedule:</b> Drag the bar horizontally to adjust start/due dates in real-time, or drag the right edge handle to extend due date.",
        body_style
    ))

    story.append(Paragraph("Step 3: Record Shift Production Output (Operator)", h2_style))
    story.append(Paragraph(
        "1. Sign out and log in as <code>operator@factory.com</code> / <code>Operator123</code>.<br/>"
        "2. Click <b>Production Logs</b> &rarr; click <b>+ Log Production</b>.<br/>"
        "3. Select Work Order <code>WO-2026-8178</code> and enter:<br/>"
        "&nbsp;&nbsp;&bull; <b>Produced Qty (Passed Units):</b> <code>200</code><br/>"
        "&nbsp;&nbsp;&bull; <b>Rejected / Scrap Qty:</b> <code>5</code><br/>"
        "&nbsp;&nbsp;&bull; <b>Shift:</b> <code>Shift A (Morning)</code><br/>"
        "4. Click <b>Save Entry</b>.<br/>"
        "<b>Automated System Reaction:</b> The PostgreSQL <code>SECURITY DEFINER</code> trigger updates the work order record to <code>200 Produced, 5 Rejected (40%)</code> and advances status to <b>In Progress</b>. On the Gantt chart, the bar displays a mini progress-fill spanning 40%.",
        body_style
    ))

    story.append(Paragraph("Step 4: Conduct Quality Assurance Sample Audit (Quality Inspector)", h2_style))
    story.append(Paragraph(
        "1. Sign out and log in as <code>quality@factory.com</code> / <code>Quality123</code>.<br/>"
        "2. Go to <b>Quality</b> &rarr; click <b>+ New Inspection</b>.<br/>"
        "3. Link to <code>WO-2026-8178</code>:<br/>"
        "&nbsp;&nbsp;&bull; <b>Sample Inspected:</b> <code>25 units</code> | <b>Defect Count:</b> <code>1 unit</code><br/>"
        "&nbsp;&nbsp;&bull; <b>Classification:</b> <code>Dimensional Tolerance</code> | <b>Result:</b> <code>Pass</code><br/>"
        "4. Total rejected count synchronizes to <b>6 units</b> (5 floor scrap + 1 QC defect).",
        body_style
    ))

    story.append(Paragraph("Step 5: Final Shift Completion & Automatic Seal (Operator)", h2_style))
    story.append(Paragraph(
        "1. Sign in as <code>operator@factory.com</code>.<br/>"
        "2. Log remaining batch output: <code>Produced: 294</code> (or <code>300</code>), <code>Scrap: 0</code>.<br/>"
        "<b>Automated Sealing:</b> Once good units reach the planned 500 target, the trigger immediately flips status to <b>Completed (100%)</b>.",
        body_style
    ))

    story.append(Paragraph("Step 6: Real-Time Intelligence Review (Management)", h2_style))
    story.append(Paragraph(
        "Open <b>Live Dashboard</b>. Management monitors:<br/>"
        "&bull; <b>Fulfillment Rate:</b> <code>100% (Good Units Only)</code>.<br/>"
        "&bull; <b>Scrap Rate:</b> <code>1.2%</code> | <b>First Pass Yield (FPY):</b> <code>98.8%</code> conforming output.<br/>"
        "&bull; <b>Top Orders Graph:</b> WO-2026-8178 reflects complete delivery.",
        body_style
    ))

    story.append(Spacer(1, 8))

    # SECTION 5: TECHNICAL ARCHITECTURE & DEPLOYMENT
    story.append(Paragraph("5. Technical Architecture & Deployment", h1_style))
    story.append(Paragraph(
        "<b>Database Trigger Privileges:</b> The PostgreSQL trigger function <code>public.recalculate_work_order_totals()</code> is defined with <b><code>SECURITY DEFINER SET search_path = public, pg_temp</code></b>. "
        "This bypasses Row Level Security when updating <code>work_orders</code> totals, guaranteeing that Operator shift logs update production counts and status seamlessly.<br/>"
        "<b>Vercel Production Deployment:</b><br/>"
        "1. Push latest codebase to GitHub: <code>git push origin main</code>.<br/>"
        "2. In Vercel, import project with preset <b>Vite</b> (build command: <code>npm run build</code>).<br/>"
        "3. Configure Environment Variables: <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>.<br/>"
        "4. Client-side Single Page Application (SPA) routing is handled automatically by <code>vercel.json</code>.",
        body_style
    ))

    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated: {filename}")

if __name__ == "__main__":
    output_path = os.path.join(os.path.dirname(__file__), "..", "Mini_MES_User_Guide.pdf")
    build_pdf(os.path.abspath(output_path))
