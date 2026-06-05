import os
from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, black, white, grey
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, Image, KeepTogether
)
from reportlab.graphics.shapes import Drawing, Rect, String as RLString
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_RIGHT, TA_CENTER, TA_LEFT

FONTS_DIR = os.path.join(os.path.dirname(__file__))
FONT_REGULAR = os.path.join(FONTS_DIR, 'Vazirmatn-Regular.ttf')
FONT_BOLD = os.path.join(FONTS_DIR, 'Vazirmatn-Bold.ttf')

pdfmetrics.registerFont(TTFont('Vazir', FONT_REGULAR))
pdfmetrics.registerFont(TTFont('Vazir-Bold', FONT_BOLD))

BRAND = HexColor('#1e40af')
ACCENT = HexColor('#3b82f6')
LIGHT_BG = HexColor('#f1f5f9')
BORDER = HexColor('#cbd5e1')
SUCCESS = HexColor('#10b981')
WARNING = HexColor('#f59e0b')
DANGER = HexColor('#ef4444')

PAGE_WIDTH, PAGE_HEIGHT = A4
MARGIN = 2 * cm


def _r(text):
    """Right-aligned text (for Persian)"""
    return f'\u200f{text}'


def _style(name, **kw):
    defaults = dict(fontName='Vazir', fontSize=10, leading=16,
                    alignment=TA_RIGHT, spaceAfter=4, textColor=HexColor('#1e293b'))
    defaults.update(kw)
    return ParagraphStyle(name, **defaults)


styles = {
    'title': _style('Title', fontName='Vazir-Bold', fontSize=18, leading=26,
                    alignment=TA_CENTER, spaceAfter=6, textColor=BRAND),
    'subtitle': _style('Subtitle', fontSize=11, leading=18,
                       alignment=TA_CENTER, textColor=HexColor('#64748b')),
    'h2': _style('H2', fontName='Vazir-Bold', fontSize=13, leading=20,
                 spaceBefore=12, spaceAfter=8, textColor=BRAND),
    'h3': _style('H3', fontName='Vazir-Bold', fontSize=11, leading=17,
                 spaceBefore=8, spaceAfter=4, textColor=HexColor('#334155')),
    'body': _style('Body', fontSize=9, leading=15),
    'label': _style('Label', fontName='Vazir-Bold', fontSize=8, leading=12,
                    textColor=HexColor('#64748b'), spaceAfter=1),
    'value': _style('Value', fontSize=10, leading=16),
    'small': _style('Small', fontSize=7, leading=10,
                    textColor=HexColor('#94a3b8'), alignment=TA_CENTER),
    'header_cell': _style('HeaderCell', fontName='Vazir-Bold', fontSize=8,
                          leading=12, alignment=TA_CENTER, textColor=white),
    'cell': _style('Cell', fontSize=8, leading=12, alignment=TA_CENTER),
}

COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#0891b2',
          '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316']


class ReportPDF:
    def __init__(self, title, subtitle='', filename=None):
        self.title = title
        self.subtitle = subtitle
        self.filename = filename
        self.buf = BytesIO()
        self.elements = []
        self._page_count = 0

    def _header_footer(self, canvas, doc):
        self._page_count += 1
        canvas.saveState()
        # header line
        canvas.setStrokeColor(BRAND)
        canvas.setLineWidth(0.5)
        canvas.line(MARGIN, PAGE_HEIGHT - 1.2 * cm,
                    PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 1.2 * cm)
        # clinic name
        canvas.setFont('Vazir-Bold', 9)
        canvas.setFillColor(BRAND)
        canvas.drawRightString(PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 1 * cm,
                               'کلینیک تخصصی')
        # page number
        canvas.setFont('Vazir', 7)
        canvas.setFillColor(HexColor('#94a3b8'))
        canvas.drawCentredString(PAGE_WIDTH / 2, 1 * cm,
                                 f'صفحه {doc.page}')

        # footer line
        canvas.setStrokeColor(BORDER)
        canvas.setLineWidth(0.3)
        canvas.line(MARGIN, 1.5 * cm, PAGE_WIDTH - MARGIN, 1.5 * cm)
        # generated date
        canvas.setFont('Vazir', 6)
        canvas.setFillColor(HexColor('#94a3b8'))
        canvas.drawRightString(
            PAGE_WIDTH - MARGIN, 0.7 * cm,
            f'تاریخ تولید: {datetime.now().strftime("%Y-%m-%d %H:%M")}'
        )
        canvas.restoreState()

    def build(self):
        doc = SimpleDocTemplate(
            self.filename or self.buf,
            pagesize=A4,
            topMargin=1.8 * cm,
            bottomMargin=2 * cm,
            leftMargin=MARGIN,
            rightMargin=MARGIN,
        )
        self._add_cover()
        doc.build(self.elements, onFirstPage=self._header_footer,
                  onLaterPages=self._header_footer)
        if self.buf.tell():
            self.buf.seek(0)
        return self.filename or self.buf

    def _add_cover(self):
        self.elements.append(Spacer(1, 1.5 * cm))
        # decorative line
        self.elements.append(
            Table([['']], colWidths=[8 * cm])
        )
        self.elements[-1].setStyle(TableStyle([
            ('LINEBELOW', (0, 0), (-1, -1), 3, BRAND),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ]))
        self.elements.append(Spacer(1, 0.8 * cm))
        self.elements.append(Paragraph(_r(self.title), styles['title']))
        if self.subtitle:
            self.elements.append(Paragraph(_r(self.subtitle), styles['subtitle']))
        self.elements.append(Spacer(1, 0.5 * cm))
        self.elements.append(
            Table([['']], colWidths=[8 * cm])
        )
        self.elements[-1].setStyle(TableStyle([
            ('LINEBELOW', (0, 0), (-1, -1), 3, BRAND),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ]))
        self.elements.append(Spacer(1, 1 * cm))

    def add_heading(self, text):
        self.elements.append(Paragraph(_r(text), styles['h2']))

    def add_subheading(self, text):
        self.elements.append(Paragraph(_r(text), styles['h3']))

    def add_body(self, text):
        self.elements.append(Paragraph(_r(text), styles['body']))

    def add_spacer(self, h=0.3):
        self.elements.append(Spacer(1, h * cm))

    def add_info_row(self, label, value):
        data = [[
            Paragraph(_r(value), styles['value']),
            Paragraph(_r(label), styles['label']),
        ]]
        t = Table(data, colWidths=[None, 3.5 * cm])
        t.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, 0), 'LEFT'),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 2),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ]))
        self.elements.append(t)

    def add_summary_cards(self, cards):
        """cards: list of (label, value, color_hex)"""
        row = []
        for label, value, color in cards:
            cell = Table([
                [Paragraph(_r(str(value)), _style('_sc_v', fontName='Vazir-Bold',
                         fontSize=16, leading=20, alignment=TA_CENTER,
                         textColor=HexColor(color)))],
                [Paragraph(_r(label), _style('_sc_l', fontSize=7, leading=10,
                         alignment=TA_CENTER, textColor=HexColor('#64748b')))],
            ], colWidths=[4 * cm])
            cell.setStyle(TableStyle([
                ('BOX', (0, 0), (-1, -1), 0.5, BORDER),
                ('BACKGROUND', (0, 0), (-1, -1), HexColor('#f8fafc')),
                ('TOPPADDING', (0, 0), (0, 0), 10),
                ('BOTTOMPADDING', (0, -1), (-1, -1), 6),
                ('ROUNDEDCORNERS', [4, 4, 4, 4]),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ]))
            row.append(cell)

        t = Table([row], colWidths=[4.5 * cm] * len(cards))
        t.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ]))
        self.elements.append(t)
        self.add_spacer(0.3)

    def add_table(self, headers, rows, col_widths=None):
        """Professional table with header row and alternating colors"""
        header_row = [Paragraph(_r(h), styles['header_cell']) for h in headers]
        data = [header_row]
        for row in rows:
            data.append([Paragraph(_r(str(c)), styles['cell']) for c in row])

        if not col_widths:
            usable = PAGE_WIDTH - 2 * MARGIN
            col_widths = [usable / len(headers)] * len(headers)

        t = Table(data, colWidths=col_widths, repeatRows=1)
        style_cmds = [
            ('BACKGROUND', (0, 0), (-1, 0), BRAND),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('FONTNAME', (0, 0), (-1, 0), 'Vazir-Bold'),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.3, BORDER),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ]
        for i in range(1, len(data)):
            if i % 2 == 0:
                style_cmds.append(
                    ('BACKGROUND', (0, i), (-1, i), LIGHT_BG)
                )
        t.setStyle(TableStyle(style_cmds))
        self.elements.append(t)

    def add_bar_chart(self, data, labels, title='', width=480, height=200):
        """Simple horizontal bar chart using reportlab shapes"""
        self.add_subheading(title)
        drawing = Drawing(width, height)
        chart = VerticalBarChart()
        chart.x = 50
        chart.y = 30
        chart.height = height - 60
        chart.width = width - 80
        chart.data = [data]
        chart.categoryAxis.categoryNames = labels
        chart.categoryAxis.labels.fontName = 'Vazir'
        chart.categoryAxis.labels.fontSize = 7
        chart.valueAxis.valueMin = 0
        chart.valueAxis.valueMax = max(data) * 1.2 if data else 1
        chart.valueAxis.labels.fontName = 'Vazir'
        chart.valueAxis.labels.fontSize = 7
        chart.bars[0].fillColor = ACCENT
        chart.barLabelFormat = '%d'
        chart.barLabels.nudge = 10
        chart.barLabels.fontName = 'Vazir'
        chart.barLabels.fontSize = 7
        drawing.add(chart)
        self.elements.append(drawing)

    def add_doctor_signature(self, doctor_name=''):
        self.add_spacer(1)
        data = [
            [Paragraph(_r('امضای پزشک'), styles['label']),
             Paragraph(_r('تاریخ'), styles['label'])],
            [Paragraph(_r(doctor_name), styles['value']),
             Paragraph(_r(datetime.now().strftime('%Y/%m/%d')), styles['value'])],
        ]
        t = Table(data, colWidths=[6 * cm, 4 * cm])
        t.setStyle(TableStyle([
            ('BOX', (0, 0), (-1, -1), 0.5, BORDER),
            ('LINEBELOW', (0, 0), (-1, 0), 0.3, BORDER),
            ('LINEAFTER', (0, 0), (0, -1), 0.3, BORDER),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('BACKGROUND', (0, 0), (-1, -1), HexColor('#f8fafc')),
        ]))
        self.elements.append(t)
