"""Build the downloadable CV from src/data/cv.json. Requires reportlab."""

from pathlib import Path
import json
import shutil
from html import escape
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
    HRFlowable,
)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import A4

ROOT = Path(__file__).resolve().parents[1]
ink = HexColor("#202820")
green = HexColor("#36543b")
muted = HexColor("#576052")
styles = {
    "name": ParagraphStyle(
        "name", fontName="Helvetica-Bold", fontSize=23, leading=26, textColor=ink
    ),
    "sub": ParagraphStyle(
        "sub", fontName="Helvetica", fontSize=10, leading=13, textColor=green
    ),
    "body": ParagraphStyle(
        "body", fontName="Helvetica", fontSize=9, leading=12, textColor=ink
    ),
    "small": ParagraphStyle(
        "small", fontName="Helvetica", fontSize=8.5, leading=11, textColor=muted
    ),
    "right": ParagraphStyle(
        "right",
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=muted,
        alignment=TA_RIGHT,
    ),
    "job": ParagraphStyle(
        "job", fontName="Helvetica-Bold", fontSize=10, leading=13, textColor=ink
    ),
    "section": ParagraphStyle(
        "section",
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=12,
        textColor=green,
        spaceBefore=8,
        spaceAfter=5,
    ),
    "bullet": ParagraphStyle(
        "bullet",
        fontName="Helvetica",
        fontSize=8.7,
        leading=10.8,
        textColor=ink,
        leftIndent=8,
        firstLineIndent=-8,
        spaceAfter=2,
    ),
}


def paragraph(text, style="body"):
    """Render explicit ReportLab markup with a named style."""
    return Paragraph(text, styles[style])


def section(name):
    return [
        paragraph(name.upper(), "section"),
        HRFlowable(width="100%", thickness=0.5, color=HexColor("#ccd3c6")),
        Spacer(1, 5),
    ]


def row(left, right, style="job"):
    table = Table(
        [[paragraph(left, style), paragraph(right, "right")]], colWidths=[340, 175]
    )
    table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
            ]
        )
    )
    return table


def main():
    cv = json.loads((ROOT / "src/data/cv.json").read_text())
    out = ROOT / "output/pdf/Rohit_Udaiwal_CV_2026.pdf"
    out.parent.mkdir(parents=True, exist_ok=True)
    story = [
        paragraph(cv["name"], "name"),
        Spacer(1, 3),
        row(escape(cv["title"]), cv["phone"], "sub"),
        row(
            '<link href="mailto:' + cv["email"] + '">' + cv["email"] + "</link>",
            '<link href="' + cv["website"] + '">rohit.udaiwal.com</link>',
            "small",
        ),
        row(
            '<link href="' + cv["linkedin"] + '">linkedin.com/in/rohit-udaiwal</link>',
            "Bangalore, India",
            "small",
        ),
    ]
    story += section("Experience")
    for job in cv["experience"]:
        group = [
            row(escape(job["company"]), job["dates"]),
            row(escape(job["role"]), job["location"], "small"),
            Spacer(1, 4),
        ]
        for b in job["bullets"]:
            group.append(
                paragraph(
                    "&#8226; <b>" + escape(b["label"]) + ":</b> " + escape(b["text"]),
                    "bullet",
                )
            )
        group.append(Spacer(1, 4))
        story.append(KeepTogether(group))
    story += section("Technical Skills")
    for skill in cv["skills"]:
        story.append(
            paragraph(
                "<b>" + escape(skill["label"]) + ":</b> " + escape(skill["text"]),
                "bullet",
            )
        )
    story += section("Publication")
    pub = cv["publication"]
    story += [
        row(
            '<link href="' + pub["url"] + '">' + pub["title"] + "</link>", pub["venue"]
        ),
        paragraph(pub["institution"] + " | " + pub["dates"], "small"),
        Spacer(1, 3),
        paragraph(pub["text"], "bullet"),
    ]
    story += section("Education")
    ed = cv["education"]
    story += [
        row(ed["institution"], ed["date"]),
        paragraph(ed["degree"] + " | " + ed["grade"], "small"),
    ]
    story += section("Honors & Awards")
    story.append(
        paragraph(" &nbsp; | &nbsp; ".join(escape(h) for h in cv["honors"]), "small")
    )
    doc = SimpleDocTemplate(
        str(out),
        pagesize=A4,
        invariant=1,
        rightMargin=40,
        leftMargin=40,
        topMargin=31,
        bottomMargin=28,
        title="Rohit Udaiwal - AI Engineer",
        author="Rohit Udaiwal",
    )
    doc.build(story)
    shutil.copyfile(out, ROOT / "public/assets/resume.pdf")
    print(out)


if __name__ == "__main__":
    main()
