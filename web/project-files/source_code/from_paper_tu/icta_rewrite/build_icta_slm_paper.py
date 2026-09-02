from __future__ import annotations

from pathlib import Path
import re
import shutil
from PIL import Image, ImageChops, ImageDraw, ImageFont
import win32com.client


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "icta_rewrite"
TEMPLATE = Path(
    r"D:\OneDrive - DH Cong nghe thong tin & Truyen Thong\MULTIMODAL_EMOTION_SMALL_DEVICE_1"
    r"\ICTA_WordTemplate\ICTA_Word+Template\icta_R1.docm"
)
WORKING = OUT_DIR / "ContextPaletteSLM_ICTA_working.docm"
OUTPUT = OUT_DIR / "ContextPaletteSLM_ICTA_rewrite.docm"
PROOF = OUT_DIR / "ContextPaletteSLM_ICTA_rewrite_proof.pdf"
MARKDOWN = OUT_DIR / "ContextPaletteSLM_ICTA_rewrite.md"

FIGS = {
    "ttft_box": ROOT / "figure" / "z7959342561653_7fb4a73e2bc748a8d6a26b1cecfd2999.jpg",
    "cold_warm": ROOT / "figure" / "z7959342561672_ee99588b07d5f078e1816920ff142b89.jpg",
    "acc_category": ROOT / "figure" / "z7959342561675_1b0b0c3f563b99cb5042c999a36cb1b2.jpg",
    "pareto": ROOT / "figure" / "z7959342610204_e3dc4dbd2e4a5509a8447c1263cdd4b8.jpg",
    "ram": ROOT / "figure" / "z7959342610272_5a8d884f779b33e8638fa43ca5d1fe82.jpg",
    "throughput_hist": ROOT / "figure" / "z7959342657446_ab6d1f3e026b1f3e6c8c32c4669914fe.jpg",
    "throughput_runs": ROOT / "figure" / "z7959342657482_6b1b43d5278a948b17be42e2c9103b5d.jpg",
}

RAW_FIGS = FIGS.copy()
CROPPED_FIG_DIR = OUT_DIR / "cropped_figures"
COMPOSITE_FIG_DIR = OUT_DIR / "composite_figures"


def prepare_cropped_figures() -> None:
    CROPPED_FIG_DIR.mkdir(exist_ok=True)
    for key, src in RAW_FIGS.items():
        image = Image.open(src).convert("RGB")
        background = Image.new("RGB", image.size, (255, 255, 255))
        diff = ImageChops.difference(image, background).convert("L")
        diff = diff.point(lambda value: 255 if value > 12 else 0)
        bbox = diff.getbbox()
        if bbox is None:
            FIGS[key] = src
            continue
        left, top, right, bottom = bbox
        pad = 6
        left = max(0, left - pad)
        top = max(0, top - pad)
        right = min(image.size[0], right + pad)
        bottom = min(image.size[1], bottom + pad)
        cropped = image.crop((left, top, right, bottom))
        dst = CROPPED_FIG_DIR / f"{key}.jpg"
        cropped.save(dst, quality=95)
        FIGS[key] = dst


def _label_font(size: int = 24):
    for font_name in ("timesi.ttf", "times.ttf", "ariali.ttf", "arial.ttf"):
        try:
            return ImageFont.truetype(font_name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def make_pair_composite(
    left_path: Path,
    right_path: Path,
    left_label: str,
    right_label: str,
    stem: str,
    panel_height_px: int = 360,
    gap_px: int = 18,
) -> Path:
    COMPOSITE_FIG_DIR.mkdir(exist_ok=True)
    out = COMPOSITE_FIG_DIR / f"{stem}.jpg"
    panels = []
    for path in (left_path, right_path):
        image = Image.open(path).convert("RGB")
        width = max(1, round(image.width * panel_height_px / image.height))
        panels.append(image.resize((width, panel_height_px), Image.LANCZOS))

    font = _label_font(24)
    label_h = 44
    total_w = panels[0].width + gap_px + panels[1].width
    total_h = panel_height_px + label_h
    canvas = Image.new("RGB", (total_w, total_h), "white")
    x_positions = (0, panels[0].width + gap_px)
    draw = ImageDraw.Draw(canvas)
    for image, label, x in zip(panels, (left_label, right_label), x_positions):
        canvas.paste(image, (x, 0))
        bbox = draw.textbbox((0, 0), label, font=font)
        text_w = bbox[2] - bbox[0]
        draw.text(
            (x + (image.width - text_w) / 2, panel_height_px + 8),
            label,
            fill="black",
            font=font,
        )
    canvas.save(out, quality=95)
    return out


TITLE = (
    "Measuring Ultra-Small Language Models for Context-Aware Mobile UI "
    "Personalization at the Edge"
)

AUTHORS = "Doan Ngoc Phuong, Tran Ngoc Tu"
EMAIL = "[corresponding email]"
AFFILIATION = (
    "Thai Nguyen University of Information and Communication Technology, "
    "Thai Nguyen, Viet Nam"
)
EMAIL_LINE = f"Email: {EMAIL}"

ABSTRACT = (
    "Context-aware mobile interfaces can adapt colors and interaction states from "
    "time, environment, and lightweight biometric signals, but cloud-based inference "
    "raises privacy and latency concerns. This paper studies whether an ultra-small "
    "language model can perform the palette-selection step entirely on a resource-"
    "constrained Android edge device. We implement a Flutter on-device pipeline using "
    "Gemma-3-270M-IT in GGUF format, Q4_K_M quantization, a persistent native worker, "
    "a 256-token context window, throttling and cache reuse, and grammar-constrained "
    "JSON output. We evaluate 200 randomized context cases on two hardware settings: "
    "an Android x86_64 emulator with 8 GB RAM and a Samsung Galaxy A03 with 3 GB RAM "
    "and a Unisoc T606 SoC. The Galaxy A03 reaches 1.09 s mean time-to-first-token, "
    "2.17 s mean total inference time, 0.92 tokens/s throughput, and 553 MB mean RSS, "
    "improving latency, throughput, and memory over the emulator condition. However, "
    "semantic palette accuracy remains low at 33.0%, showing that schema-constrained "
    "decoding should not be confused with task correctness. The study provides an "
    "evidence-based boundary for deploying SLM-driven Dynamic UI on low-end mobile "
    "hardware: local inference is feasible for session-level adaptation, but accuracy "
    "and energy require further domain tuning."
)

KEYWORDS = (
    "edge AI; small language models; on-device inference; constrained decoding; "
    "mobile user interfaces; Flutter; performance measurement"
)


REFERENCES = [
    (
        "Z. Lu, X. Li, D. Cai, R. Yi, F. Liu, X. Zhang, N. D. Lane, and M. Xu, "
        "\"Small Language Models: Survey, Measurements, and Insights,\" "
        "arXiv:2409.15790, 2024."
    ),
    (
        "X. Li et al., \"Large Language Models on Mobile Devices: Measurements, "
        "Analysis, and Insights,\" in Proc. ACM EdgeFM@MobiSys, 2024."
    ),
    (
        "Y. Zheng, B. Chen, X. Qian, Y. Shi, Y. Shu, and J. Chen, "
        "\"A Review on Edge Large Language Models: Design, Execution, and "
        "Applications,\" ACM Computing Surveys, 2025."
    ),
    (
        "Gemma Team, \"Gemma 3 Technical Report,\" arXiv:2503.19786, 2025."
    ),
    (
        "E. Frantar, S. Ashkboos, T. Hoefler, and D. Alistarh, "
        "\"GPTQ: Accurate Post-Training Quantization for Generative Pre-trained "
        "Transformers,\" in Proc. ICLR, 2023."
    ),
    (
        "J. Lin et al., \"AWQ: Activation-aware Weight Quantization for LLM "
        "Compression and Acceleration,\" in Proc. MLSys, 2024."
    ),
    (
        "R. Liu et al., \"Quantization Hurts Reasoning? An Empirical Study on "
        "Quantized Reasoning Models,\" arXiv:2504.04823, 2025."
    ),
    (
        "Y. Dong, C. F. Ruan, Y. Cai, R. Lai, Z. Xu, Y. Zhao, and T. Chen, "
        "\"XGrammar: Flexible and Efficient Structured Generation Engine for "
        "Large Language Models,\" arXiv:2411.15100, 2024."
    ),
    (
        "G. Gerganov et al., \"llama.cpp: Inference of LLaMA Models in C/C++,\" "
        "GitHub repository, 2023-2026."
    ),
    (
        "ggml-org, \"GBNF Guide,\" llama.cpp grammars documentation, 2026."
    ),
    (
        "R. Jain, The Art of Computer Systems Performance Analysis. "
        "John Wiley and Sons, 1991."
    ),
]


def add_paragraph(doc, text: str, style: str = "p1a"):
    rng = doc.Range(doc.Content.End - 1, doc.Content.End - 1)
    rng.InsertAfter(text.strip() + "\r")
    para = doc.Paragraphs(doc.Paragraphs.Count - 1)
    try:
        para.Style = style
    except Exception:
        para.Style = "Normal"
    return para


def add_labeled_paragraph(doc, text: str, label: str, style: str, alignment=None):
    rng = doc.Range(doc.Content.End - 1, doc.Content.End - 1)
    rng.InsertAfter(text.strip() + "\r")
    para = doc.Paragraphs(doc.Paragraphs.Count - 1)
    try:
        para.Style = style
    except Exception:
        para.Style = "Normal"
    if alignment is not None:
        para.Alignment = alignment
    start = para.Range.Start
    label_range = doc.Range(start, start + len(label))
    label_range.Bold = True
    return para


def add_heading(doc, text: str, level: int = 1):
    text = re.sub(r"^\d+(?:\.\d+)*\s+", "", text)
    return add_paragraph(doc, text, "heading1" if level == 1 else "heading2")


def add_unnumbered_heading(doc, text: str):
    para = add_paragraph(doc, text, "heading1")
    para.Range.ListFormat.RemoveNumbers()
    return para


def add_table(doc, caption: str, headers: list[str], rows: list[list[str]], number: int):
    label = f"Table {number}."
    cap = add_labeled_paragraph(doc, f"{label} {caption}", label, "tablecaption")
    cap.KeepWithNext = True
    rng = doc.Range(doc.Content.End - 1, doc.Content.End - 1)
    table = doc.Tables.Add(rng, len(rows) + 1, len(headers))
    try:
        table.Style = "Normal Table"
    except Exception:
        table.Style = "Table Grid"
    table.AllowAutoFit = True
    table.Rows.Alignment = 1
    table.Borders.Enable = False
    for border_idx in (-1, -2, -3, -4, -5, -6):
        table.Borders(border_idx).LineStyle = 0
    table.TopPadding = 0
    table.BottomPadding = 0
    table.LeftPadding = 1
    table.RightPadding = 1
    for c, header in enumerate(headers, 1):
        cell = table.Cell(1, c)
        cell.Range.Text = header
        cell.Range.Bold = True
        cell.Range.Font.Size = 8
        cell.Range.ParagraphFormat.Alignment = 1
        cell.Range.ParagraphFormat.SpaceBefore = 0
        cell.Range.ParagraphFormat.SpaceAfter = 0
        cell.Borders(-1).LineStyle = 1
        cell.Borders(-1).LineWidth = 6
        cell.Borders(-3).LineStyle = 1
        cell.Borders(-3).LineWidth = 4
    for r, row in enumerate(rows, 2):
        for c, value in enumerate(row, 1):
            cell = table.Cell(r, c)
            cell.Range.Text = value
            cell.Range.Font.Size = 8
            cell.Range.ParagraphFormat.Alignment = 0 if c == 1 else 1
            cell.Range.ParagraphFormat.SpaceBefore = 0
            cell.Range.ParagraphFormat.SpaceAfter = 0
            if r == len(rows) + 1:
                cell.Borders(-3).LineStyle = 1
                cell.Borders(-3).LineWidth = 6


def add_figure(doc, path: Path, caption: str, number: int, max_width_ratio: float = 0.42):
    para = add_paragraph(doc, "", "image")
    para.Alignment = 1
    para.KeepWithNext = True
    rng = doc.Range(para.Range.Start, para.Range.End - 1)
    shape = rng.InlineShapes.AddPicture(str(path.resolve()), False, True)
    max_width = (
        doc.PageSetup.PageWidth
        - doc.PageSetup.LeftMargin
        - doc.PageSetup.RightMargin
    ) * max_width_ratio
    if shape.Width > max_width:
        ratio = max_width / shape.Width
        shape.Width = max_width
        shape.Height = shape.Height * ratio
    label = f"Fig. {number}."
    alignment = 3 if len(caption) > 100 else 1
    cap = add_labeled_paragraph(doc, f"{label} {caption}", label, "figurecaption", alignment)
    cap.KeepWithNext = False


def add_figure_pair(
    doc,
    left_path: Path,
    right_path: Path,
    left_label: str,
    right_label: str,
    caption: str,
    number: int,
    height_in: float = 1.35,
):
    rng = doc.Range(doc.Content.End - 1, doc.Content.End - 1)
    table = doc.Tables.Add(rng, 2, 2)
    table.AllowAutoFit = False
    table.Borders.Enable = False
    for border_idx in (-1, -2, -3, -4, -5, -6):
        table.Borders(border_idx).LineStyle = 0
    table.Rows.Alignment = 1
    table.TopPadding = 0
    table.BottomPadding = 0
    table.LeftPadding = 0
    table.RightPadding = 0
    text_width = (
        doc.PageSetup.PageWidth
        - doc.PageSetup.LeftMargin
        - doc.PageSetup.RightMargin
    )
    col_width = text_width / 2
    try:
        table.Columns(1).Width = col_width
        table.Columns(2).Width = col_width
    except Exception:
        pass
    for idx, path in enumerate([left_path, right_path], start=1):
        cell = table.Cell(1, idx)
        cell.Range.ParagraphFormat.Alignment = 1
        cell.Range.ParagraphFormat.SpaceBefore = 0
        cell.Range.ParagraphFormat.SpaceAfter = 0
        shape = cell.Range.InlineShapes.AddPicture(str(path.resolve()), False, True)
        shape.LockAspectRatio = -1
        shape.Height = height_in * 72
        max_width = col_width - 10
        if shape.Width > max_width:
            shape.Width = max_width
    for idx, label_text in enumerate([left_label, right_label], start=1):
        cell = table.Cell(2, idx)
        cell.Range.Text = label_text
        cell.Range.Italic = True
        cell.Range.Font.Size = 7
        cell.Range.ParagraphFormat.Alignment = 1
        cell.Range.ParagraphFormat.SpaceBefore = 0
        cell.Range.ParagraphFormat.SpaceAfter = 0
    doc.Range(doc.Content.End - 1, doc.Content.End - 1).InsertAfter("\r")
    label = f"Fig. {number}."
    cap = add_labeled_paragraph(doc, f"{label} {caption}", label, "figurecaption", 1)
    cap.KeepWithNext = False


def add_figure_row(
    doc,
    paths: list[Path],
    labels: list[str],
    caption: str,
    number: int,
    width_in: float,
):
    rng = doc.Range(doc.Content.End - 1, doc.Content.End - 1)
    table = doc.Tables.Add(rng, 2, len(paths))
    table.AllowAutoFit = True
    table.Borders.Enable = False
    for border_idx in (-1, -2, -3, -4, -5, -6):
        table.Borders(border_idx).LineStyle = 0
    table.Rows.Alignment = 1
    table.TopPadding = 0
    table.BottomPadding = 0
    table.LeftPadding = 1
    table.RightPadding = 1
    for idx, path in enumerate(paths, start=1):
        cell = table.Cell(1, idx)
        cell.Range.ParagraphFormat.Alignment = 1
        shape = cell.Range.InlineShapes.AddPicture(str(path.resolve()), False, True)
        shape.LockAspectRatio = -1
        shape.Width = width_in * 72
    for idx, label_text in enumerate(labels, start=1):
        cell = table.Cell(2, idx)
        cell.Range.Text = label_text
        cell.Range.Italic = True
        cell.Range.Font.Size = 7
        cell.Range.ParagraphFormat.Alignment = 1
    doc.Range(doc.Content.End - 1, doc.Content.End - 1).InsertAfter("\r")
    label = f"Fig. {number}."
    cap = add_labeled_paragraph(doc, f"{label} {caption}", label, "figurecaption", 3)
    cap.KeepWithNext = False


def add_figure_single_width(doc, path: Path, caption: str, number: int, width_in: float = 3.45):
    para = add_paragraph(doc, "", "image")
    para.Alignment = 1
    para.KeepWithNext = True
    para.Range.ParagraphFormat.SpaceBefore = 0
    para.Range.ParagraphFormat.SpaceAfter = 0
    rng = doc.Range(para.Range.Start, para.Range.End - 1)
    shape = rng.InlineShapes.AddPicture(str(path.resolve()), False, True)
    shape.LockAspectRatio = -1
    shape.Width = width_in * 72
    label = f"Fig. {number}."
    cap = add_labeled_paragraph(doc, f"{label} {caption}", label, "figurecaption", 1)
    cap.Range.ParagraphFormat.SpaceBefore = 0
    cap.Range.ParagraphFormat.SpaceAfter = 0
    cap.KeepWithNext = False


def add_figure_single_size(
    doc,
    path: Path,
    caption: str,
    number: int,
    width_in: float,
    height_in: float,
):
    para = add_paragraph(doc, "", "image")
    para.Alignment = 1
    para.KeepWithNext = True
    para.Range.ParagraphFormat.SpaceBefore = 0
    para.Range.ParagraphFormat.SpaceAfter = 0
    rng = doc.Range(para.Range.Start, para.Range.End - 1)
    shape = rng.InlineShapes.AddPicture(str(path.resolve()), False, True)
    shape.LockAspectRatio = 0
    shape.Width = width_in * 72
    shape.Height = height_in * 72
    label = f"Fig. {number}."
    cap = add_labeled_paragraph(doc, f"{label} {caption}", label, "figurecaption", 1)
    cap.Range.ParagraphFormat.SpaceBefore = 0
    cap.Range.ParagraphFormat.SpaceAfter = 0
    cap.KeepWithNext = False


def section_text() -> list[tuple[str, list[tuple[str | None, list[str]]]]]:
    return [
        (
            "1 Introduction",
            [
                (
                    None,
                    [
                        (
                            "Dynamic mobile interfaces increasingly use context signals "
                            "such as time of day, weather, activity, and physiological "
                            "state to adapt colors and visual density. In a cloud-centric "
                            "design, these signals must be transmitted to a remote model, "
                            "which creates privacy exposure and makes response time depend "
                            "on network conditions. On-device inference offers a cleaner "
                            "deployment boundary: sensitive context remains on the handset, "
                            "and the application can decide locally when to adapt its UI."
                        ),
                        (
                            "The main obstacle is not only model size. Low-end Android "
                            "phones combine limited memory bandwidth, small RAM budgets, "
                            "passive cooling, and aggressive process management. For "
                            "language models, these limits appear as long prefill time, "
                            "slow token generation, resident memory pressure, and thermal "
                            "or battery cost under repeated inference. These costs are "
                            "especially important for UI adaptation, where a technically "
                            "correct response may still be unusable if it arrives too late "
                            "or destabilizes the foreground application."
                        ),
                        (
                            "Recent small language models (SLMs) make local inference more "
                            "plausible, and quantized GGUF deployments reduce storage and "
                            "RAM pressure. However, a second reliability problem remains: "
                            "small generative models frequently emit free-form text when "
                            "an application expects a strict control value. In this paper, "
                            "the required output is a compact JSON object selecting one UI "
                            "palette. We therefore separate two questions that are often "
                            "blurred: whether the model output is structurally valid, and "
                            "whether the selected palette is semantically correct for the "
                            "context."
                        ),
                        (
                            "This paper evaluates an on-device Flutter pipeline using "
                            "Gemma-3-270M-IT, Q4_K_M quantization, a persistent worker, "
                            "a 256-token context window, throttling and cache reuse, and "
                            "GBNF-style grammar-constrained decoding. The study uses "
                            "N=200 randomized context cases and compares an 8 GB Android "
                            "emulator with a Samsung Galaxy A03, a low-end 3 GB RAM phone "
                            "based on the Unisoc T606 SoC. Our contribution is an empirical "
                            "boundary study rather than a claim that SLM-based UI selection "
                            "is already solved."
                        ),
                        (
                            "The results show that the low-end phone condition can be "
                            "faster and more memory-efficient than the emulator condition "
                            "for this pipeline: mean TTFT decreases from 1596.98 ms to "
                            "1090.75 ms, mean total inference time decreases from "
                            "2732.57 ms to 2173.36 ms, throughput increases from 0.74 to "
                            "0.92 tokens/s, and mean RSS decreases from 1065.36 MB to "
                            "552.89 MB. At the same time, semantic palette accuracy remains "
                            "only 33.0% on the phone. The paper therefore positions "
                            "constrained decoding as an output-safety mechanism, not as a "
                            "substitute for task learning."
                        ),
                    ],
                )
            ],
        ),
        (
            "2 Related Work",
            [
                (
                    "2.1 Small and Edge Language Models",
                    [
                        (
                            "SLM research studies how transformer language models can be "
                            "made usable under memory, latency, and energy constraints. "
                            "Surveys of SLMs and edge LLMs emphasize that small models are "
                            "not merely compressed versions of server LLMs: their useful "
                            "deployment depends on model design, quantization, runtime "
                            "engines, memory management, and workload-specific evaluation "
                            "[1], [3]. Mobile measurement studies further show that latency "
                            "and memory footprint vary substantially across model sizes, "
                            "devices, and inference settings [2]."
                        ),
                        (
                            "The present work follows that measurement-oriented tradition "
                            "but narrows the task to a concrete mobile UI control problem. "
                            "Instead of measuring open-ended chat quality, we measure a "
                            "bounded palette-selection workload where the output is a "
                            "single structured control token embedded in JSON."
                        ),
                    ],
                ),
                (
                    "2.2 Quantization and Mobile Runtime Constraints",
                    [
                        (
                            "Quantization is central to edge deployment because model "
                            "weights and KV cache compete with the Android application's "
                            "normal memory needs. GPTQ and AWQ show how low-bit weight "
                            "representations can preserve much of a large model's behavior "
                            "while reducing storage and bandwidth pressure [5], [6]. More "
                            "recent work also warns that quantization can damage reasoning "
                            "or difficult task behavior, particularly when bit-widths are "
                            "pushed aggressively [7]. This warning matters for the present "
                            "study: even if a 270M model fits on a 3 GB device, accuracy "
                            "for ambiguous context-to-palette mapping cannot be assumed."
                        ),
                        (
                            "Our implementation uses Q4_K_M GGUF weights, a small context "
                            "window, and a persistent native worker to reduce startup and "
                            "memory churn. These engineering choices are evaluated as part "
                            "of the deployed system, because mobile performance depends on "
                            "the runtime path as much as on the model checkpoint."
                        ),
                    ],
                ),
                (
                    "2.3 Structured Output and Constrained Decoding",
                    [
                        (
                            "Applications often require structured outputs such as JSON, "
                            "function calls, or commands. Grammar-constrained decoding "
                            "restricts the token sampler so that invalid continuations are "
                            "masked during generation. llama.cpp documents GBNF grammars "
                            "for constraining output formats, while XGrammar studies "
                            "efficient structured generation for LLM runtimes [8], [9], [10]. "
                            "These approaches can provide structural correctness by "
                            "construction, for example ensuring that a response parses as "
                            "JSON."
                        ),
                        (
                            "Structural correctness is different from semantic correctness. "
                            "A model may emit a valid object such as {\"palette\":\"ocean\"} "
                            "while still choosing the wrong palette for the context. This "
                            "distinction is a central correction made in this rewrite: the "
                            "paper reports palette accuracy separately from schema validity "
                            "and avoids treating valid JSON as task success."
                        ),
                    ],
                ),
            ],
        ),
        (
            "3 System Design",
            [
                (
                    "3.1 Task Formulation",
                    [
                        (
                            "Each inference receives a compact context record containing "
                            "time, environmental state, and optional lightweight biometric "
                            "signals. The output space is a finite set of UI palettes. The "
                            "application consumes the model response as JSON with one field:"
                        ),
                        "{\"palette\":\"rose|ocean|sunset|forest|cyber\"}",
                        (
                            "We evaluate two properties. The first is output validity: the "
                            "response must match the JSON schema and be parseable without "
                            "fallback heuristics. The second is semantic palette accuracy: "
                            "the selected palette must match the soft ground-truth label "
                            "assigned to the benchmark case."
                        ),
                    ],
                ),
                (
                    "3.2 On-Device Runtime Pipeline",
                    [
                        (
                            "The mobile application is implemented in Flutter. A persistent "
                            "worker isolate owns the native inference context and keeps the "
                            "model outside the UI thread. The runtime uses Gemma-3-270M-IT [4] "
                            "in GGUF format with Q4_K_M quantization. Context length is set "
                            "to 256 tokens to limit KV-cache growth, and the prompt is kept "
                            "short because the task does not require long conversation "
                            "history."
                        ),
                        (
                            "A throttling and cache layer prevents repeated model calls for "
                            "minor context changes. When the minimum interval has not elapsed, "
                            "the app reuses the most recent palette stored in local preferences. "
                            "This layer is important for UI adaptation because perceived "
                            "responsiveness depends on avoiding unnecessary inference, not only "
                            "on making each inference faster."
                        ),
                    ],
                ),
                (
                    "3.3 Grammar-Constrained Output",
                    [
                        (
                            "The grammar restricts the decoder to a single JSON object with "
                            "one palette value. At each decoding step, tokens that would "
                            "violate the grammar are removed from the candidate set. This "
                            "allows the application to parse the model response directly and "
                            "removes the need for a regular-expression fallback parser."
                        ),
                        (
                            "The grammar does not encode the correct palette for each context. "
                            "It only encodes the output language accepted by the application. "
                            "For that reason, the evaluation treats grammar validity as an "
                            "engineering reliability property and palette accuracy as the "
                            "actual task metric."
                        ),
                    ],
                ),
            ],
        ),
        (
            "4 Experimental Methodology",
            [
                (
                    "4.1 Testbeds",
                    [
                        (
                            "The benchmark compares two hardware settings. The emulator "
                            "condition (MayAo) runs Android x86_64 with 8 GB RAM and desktop "
                            "CPU resources. The phone condition (SSA03) runs on a Samsung "
                            "Galaxy A03 with Android 11, 3 GB RAM, and a Unisoc T606 SoC. "
                            "The phone represents the low-end target where memory pressure "
                            "and passive cooling are most relevant."
                        ),
                    ],
                ),
                (
                    "4.2 Benchmark Protocol",
                    [
                        (
                            "The benchmark service executes N=200 inference runs sampled "
                            "from a pool of 40 context cases. Every 20 runs, the service "
                            "pauses for five seconds to reduce continuous-load heating and "
                            "to approximate bursty UI usage. For each run, the system records "
                            "time-to-first-token (TTFT), total inference time, generated-token "
                            "throughput, resident memory, peak memory, and whether the palette "
                            "matches the benchmark label."
                        ),
                        (
                            "Battery drain is reported only for the phone condition, where "
                            "the run consumed two percentage points over 640 seconds. This "
                            "corresponds to approximately 11.25 percent per hour under the "
                            "continuous benchmark workload. This value should not be read as "
                            "normal daily-use drain, because the benchmark repeatedly invokes "
                            "the model and keeps the device active."
                        ),
                    ],
                ),
                (
                    "4.3 Metrics",
                    [
                        (
                            "TTFT measures the time from the start of streamed inference to "
                            "the first received token. Total inference time measures the full "
                            "generation window. Throughput is output tokens per second over "
                            "the generation window. RSS is the resident physical memory used "
                            "by the application process. Palette accuracy is the fraction of "
                            "runs whose selected palette matches the soft benchmark label. "
                            "These metrics follow standard system-performance practice: "
                            "latency, throughput, memory, energy, and correctness are reported "
                            "separately rather than collapsed into a single score [11]."
                        ),
                    ],
                ),
            ],
        ),
        (
            "5 Results",
            [
                (
                    "5.1 Overall Results",
                    [
                        (
                            "Table 2 summarizes the main comparison. The phone condition is "
                            "faster and uses less memory than the emulator condition in this "
                            "pipeline. Mean TTFT falls from 1596.98 ms to 1090.75 ms, mean "
                            "total inference time falls from 2732.57 ms to 2173.36 ms, and "
                            "throughput increases from 0.74 to 0.92 tokens/s. Mean RSS is "
                            "almost halved, from 1065.36 MB to 552.89 MB."
                        ),
                        (
                            "The accuracy result is more modest. Palette accuracy is 27.0% "
                            "on the emulator and 33.0% on the phone. The improvement is "
                            "positive but still too low for a production Dynamic UI system "
                            "without additional domain tuning, calibration, or fallback logic."
                        ),
                        (
                            "This contrast is important for system design. The local runtime "
                            "already meets a practical latency and memory envelope for occasional "
                            "UI adaptation, but the decision layer must still treat the SLM output "
                            "as a recommendation that can be rejected, cached, or overridden by "
                            "hand-written rules."
                        ),
                    ],
                ),
                (
                    "5.2 Latency and Throughput",
                    [
                        (
                            "Figure 1(a) shows that the phone condition has a tighter TTFT "
                            "distribution than the emulator condition. On the Galaxy A03, "
                            "TTFT ranges from 959 ms to 1302 ms, with P50=1082 ms and "
                            "P95=1199 ms. Total inference time ranges from 1950 ms to "
                            "2584 ms, with P50=2167 ms and P95=2316 ms. These values are "
                            "not token-by-token real time, but they are compatible with "
                            "session-level UI adaptation when results are cached."
                        ),
                        (
                            "Figure 1(b) compares cold-start and warm-start TTFT. The gap is "
                            "small in both conditions, suggesting that the persistent worker "
                            "reduces repeated initialization cost after the model is loaded. "
                            "Figures 2(a) and 2(b) show that phone throughput is consistently "
                            "centered around 0.9 to 1.0 tokens/s, whereas the emulator "
                            "condition is centered around 0.7 to 0.8 tokens/s and exhibits "
                            "a wider low-end tail."
                        ),
                    ],
                ),
                (
                    "5.3 Memory, Accuracy, and Trade-off",
                    [
                        (
                            "Figure 3 reports memory over 200 runs. The emulator remains "
                            "near 1.06 GB RSS. The phone begins higher and then drops in "
                            "steps before stabilizing near 500 MB. Because this observation "
                            "comes from system-level RSS rather than controlled allocator "
                            "instrumentation, we interpret it conservatively as observed "
                            "memory behavior, not as proof of a specific memory-management "
                            "mechanism."
                        ),
                        (
                            "Figure 4(a) shows that accuracy varies sharply by context category. "
                            "Combined and edge cases are the strongest groups, while weather "
                            "and time-only cases remain difficult. This pattern suggests that "
                            "the current prompt and model do not reliably learn the intended "
                            "palette semantics from sparse context fields. Figure 4(b) places "
                            "both hardware settings on an accuracy-throughput plane. The phone "
                            "condition lies above and to the right of the "
                            "emulator condition, meaning it is better on both throughput and "
                            "accuracy for this benchmark. This Pareto view is useful for "
                            "system selection, but it should not hide the absolute accuracy "
                            "ceiling: 33.0% is a diagnostic result, not a deployment-grade "
                            "semantic score."
                        ),
                        (
                            "For a Dynamic UI pipeline, these plots suggest a two-stage design: "
                            "use the SLM only when context changes are meaningful enough to "
                            "justify inference, then validate the returned palette against a "
                            "small set of accessibility and contrast constraints before applying it."
                        ),
                    ],
                ),
            ],
        ),
        (
            "6 Discussion",
            [
                (
                    None,
                    [
                        (
                            "The strongest supported claim is that a quantized 270M-parameter "
                            "SLM can run fully offline on a 3 GB Android phone for a compact "
                            "structured-output task, with roughly two-second total inference "
                            "and sub-gigabyte resident memory. This supports privacy-preserving "
                            "UI personalization because context data remains local. Constrained "
                            "decoding also improves integration by turning unparseable text "
                            "failures into valid but possibly wrong palette choices."
                        ),
                        (
                            "The results do not support near-perfect UI personalization. Grammar "
                            "constraints can make the output schema-valid, but they do not make "
                            "the selected palette correct; semantic accuracy remains 33.0% on "
                            "the phone. The results also do not prove general mobile superiority, "
                            "because only one physical low-end device and one emulator were tested."
                        ),
                        (
                            "For application builders, the pipeline is most appropriate for "
                            "per-session or event-triggered adaptation rather than continuous "
                            "streaming. A two-second generation path is acceptable only when "
                            "the result is cached; battery drain under continuous benchmark "
                            "load further argues for throttling and selective invocation."
                        ),
                        (
                            "For researchers, the benchmark shows why edge SLM papers should "
                            "report multiple metrics together. A system can be structurally "
                            "safe, faster on-device than expected, and still semantically "
                            "weak. Reporting only JSON validity or only latency would miss "
                            "the central trade-off."
                        ),
                        (
                            "The benchmark uses 40 context cases and 200 repeated runs, which "
                            "is sufficient for system measurements but limited for semantic "
                            "generalization. Future work should expand the dataset, add "
                            "independent annotators, and tune the model on a curated UI-context "
                            "dataset."
                        ),
                    ],
                ),
            ],
        ),
        (
            "7 Conclusion",
            [
                (
                    None,
                    [
                        (
                            "This paper reframes the original study as an empirical boundary "
                            "evaluation of ultra-small language models for context-aware mobile "
                            "UI personalization. The Flutter pipeline runs Gemma-3-270M-IT "
                            "locally with Q4_K_M quantization, a persistent worker, caching, "
                            "and grammar-constrained JSON output. Across 200 runs, the Galaxy "
                            "A03 condition achieves 1.09 s mean TTFT, 2.17 s mean total "
                            "inference time, 0.92 tokens/s throughput, and 553 MB mean RSS."
                        ),
                        (
                            "The main caution is that semantic palette accuracy is only 33.0%. "
                            "The system is a feasible local inference prototype and measurement "
                            "baseline, but not yet a high-accuracy personalization model. The "
                            "next step is domain-specific tuning, larger benchmarks, and "
                            "accelerator-aware energy measurement."
                        ),
                    ],
                )
            ],
        ),
    ]


TABLES = [
    (
        "Testbed and deployment configuration.",
        ["Item", "Emulator condition (MayAo)", "Phone condition (SSA03)"],
        [
            ["Device class", "Android x86_64 emulator", "Samsung Galaxy A03"],
            ["Memory", "8 GB RAM", "3 GB RAM"],
            ["Processor", "Desktop-hosted CPU", "Unisoc T606, 12 nm"],
            ["Runtime", "Flutter + local native SLM runtime", "Flutter + local native SLM runtime"],
            ["Model", "Gemma-3-270M-IT, Q4_K_M GGUF", "Gemma-3-270M-IT, Q4_K_M GGUF"],
            ["Context window", "256 tokens", "256 tokens"],
            ["Runs", "N=200", "N=200"],
        ],
    ),
    (
        "Main benchmark results across two hardware settings.",
        ["Metric", "MayAo (8 GB)", "SSA03 (3 GB)", "Observation"],
        [
            ["Semantic palette accuracy", "27.0% (54/200)", "33.0% (66/200)", "SSA03 +6.0 percentage points"],
            ["Mean throughput", "0.74 tokens/s", "0.92 tokens/s", "SSA03 +24%"],
            ["Mean TTFT", "1596.98 ms", "1090.75 ms", "SSA03 -32%"],
            ["Mean total inference", "2732.57 ms", "2173.36 ms", "SSA03 -20%"],
            ["Mean RSS", "1065.36 MB", "552.89 MB", "SSA03 -48%"],
            ["Peak RSS", "1076.79 MB", "741.07 MB", "SSA03 lower peak"],
            ["Battery drain", "Not recorded", "2% over 640 s", "Approx. 11.25%/h under benchmark load"],
        ],
    ),
    (
        "Latency percentiles on Samsung Galaxy A03.",
        ["Metric", "Min", "P50", "Mean", "P95", "Max"],
        [
            ["TTFT (ms)", "959.0", "1082.0", "1090.75", "1199.0", "1302.0"],
            ["Total inference (ms)", "1950.0", "2167.0", "2173.36", "2316.0", "2584.0"],
        ],
    ),
]


FIGURE_PLACEMENTS = [
    (
        "5.2 Latency and Throughput",
        0,
        "pair_composite",
        ("ttft_box", "cold_warm"),
        ("(a) TTFT distribution", "(b) Cold-start and warm-start TTFT"),
        "Latency behavior across the emulator and Samsung Galaxy A03 conditions.",
        4.15,
    ),
    (
        "5.2 Latency and Throughput",
        1,
        "pair_composite",
        ("throughput_runs", "throughput_hist"),
        ("(a) Per-run throughput", "(b) Throughput distribution"),
        "Throughput behavior under repeated benchmark runs.",
        4.15,
    ),
    (
        "5.3 Memory, Accuracy, and Trade-off",
        0,
        "single_size",
        ("ram",),
        (),
        "Resident memory across 200 runs.",
        (2.55, 0.95),
    ),
    (
        "5.3 Memory, Accuracy, and Trade-off",
        1,
        "pair_composite",
        ("acc_category", "pareto"),
        ("(a) Accuracy by context category", "(b) Accuracy-throughput trade-off"),
        "Semantic accuracy and accuracy-throughput trade-off.",
        4.15,
    ),
]


def matching_figure_placements(sub: str | None, para_idx: int):
    return [
        placement
        for placement in FIGURE_PLACEMENTS
        if placement[0] == sub and placement[1] == para_idx
    ]
"""
                            "A second supported claim is that constrained decoding is valuable "
                            "for application integration. It changes the failure mode from "
                            "unparseable text to a valid but possibly wrong palette. This is "
                            "a better engineering surface: applications can directly parse "
                            "the result, log semantic errors, and decide whether to accept, "
                            "cache, or override the palette."
                        ),
                    ],
                ),
                (
                    "6.2 What the Results Do Not Support",
                    [
                        (
                            "The results do not support a claim of near-perfect UI "
                            "personalization. The earlier Vietnamese draft risked mixing "
                            "JSON validity with palette accuracy. This rewrite separates "
                            "them explicitly: grammar constraints can make the output "
                            "schema-valid, but they do not make the selected palette correct. "
                            "The measured semantic accuracy remains 33.0% on the phone."
                        ),
                        (
                            "The results also do not prove general mobile superiority. Only "
                            "one physical low-end device and one emulator configuration were "
                            "tested. The phone outperforms the emulator in this setup, but "
                            "that observation should not be generalized to all Android "
                            "devices, SoCs, runtimes, or model families."
                        ),
                    ],
                ),
                (
                    "6.3 Practical Implications",
                    [
                        (
                            "For application builders, the pipeline is most appropriate for "
                            "per-session or event-triggered adaptation rather than continuous "
                            "streaming. A two-second generation path can be acceptable when "
                            "the result is cached and reused across a session; it is not "
                            "appropriate for every-frame interface changes. The measured "
                            "battery drain under continuous benchmark load also argues for "
                            "throttling, cache reuse, and selective invocation."
                        ),
                        (
                            "For researchers, the benchmark shows why edge SLM papers should "
                            "report multiple metrics together. A system can be structurally "
                            "safe, faster on-device than expected, and still semantically "
                            "weak. Reporting only JSON validity or only latency would miss "
                            "the central trade-off."
                        ),
                    ],
                ),
                (
                    "6.4 Limitations and Future Work",
                    [
                        (
                            "The benchmark uses 40 context cases and 200 repeated runs, which "
                            "is sufficient for system measurements but limited for semantic "
                            "generalization. Labels are soft and application-specific. Future "
                            "work should expand the dataset, add independent annotators, and "
                            "report agreement statistics."
                        ),
                        (
                            "The model has not been instruction-tuned for the palette-selection "
                            "domain. LoRA or instruction tuning on a curated UI-context dataset "
                            "is the most direct path to improving accuracy. Additional hardware "
                            "backends, including NNAPI, GPU, and vendor mobile LLM runtimes, should also be "
                            "tested to reduce TTFT and energy on devices with supported "
                            "accelerators."
                        ),
                    ],
                ),
            ],
        ),
        (
            "7 Conclusion",
            [
                (
                    None,
                    [
                        (
                            "This paper rewrites and reframes the original study as an "
                            "empirical boundary evaluation of ultra-small language models for "
                            "context-aware mobile UI personalization. The evaluated Flutter "
                            "pipeline runs Gemma-3-270M-IT locally with Q4_K_M quantization, "
                            "a persistent worker, a short context window, caching, and "
                            "grammar-constrained JSON output. Across 200 runs, the Samsung "
                            "Galaxy A03 condition achieves 1.09 s mean TTFT, 2.17 s mean "
                            "total inference time, 0.92 tokens/s throughput, and 553 MB mean "
                            "RSS, while consuming 2% battery over 640 seconds of continuous "
                            "benchmarking."
                        ),
                        (
                            "The main caution is equally important: semantic palette accuracy "
                            "is only 33.0%. The system is therefore a feasible local inference "
                            "prototype and a useful measurement baseline, but not yet a high-"
                            "accuracy personalization model. The next step is to combine the "
                            "same edge-runtime discipline with domain-specific tuning, larger "
                            "benchmarks, and accelerator-aware energy measurement."
                        ),
                    ],
                )
            ],
        ),
    ]


TABLES = [
    (
        "Testbed and deployment configuration.",
        ["Item", "Emulator condition (MayAo)", "Phone condition (SSA03)"],
        [
            ["Device class", "Android x86_64 emulator", "Samsung Galaxy A03"],
            ["Memory", "8 GB RAM", "3 GB RAM"],
            ["Processor", "Desktop-hosted CPU", "Unisoc T606, 12 nm"],
            ["Runtime", "Flutter + local native SLM runtime", "Flutter + local native SLM runtime"],
            ["Model", "Gemma-3-270M-IT, Q4_K_M GGUF", "Gemma-3-270M-IT, Q4_K_M GGUF"],
            ["Context window", "256 tokens", "256 tokens"],
            ["Runs", "N=200", "N=200"],
        ],
    ),
    (
        "Main benchmark results across two hardware settings.",
        ["Metric", "MayAo (8 GB)", "SSA03 (3 GB)", "Observation"],
        [
            ["Semantic palette accuracy", "27.0% (54/200)", "33.0% (66/200)", "SSA03 +6.0 percentage points"],
            ["Mean throughput", "0.74 tokens/s", "0.92 tokens/s", "SSA03 +24%"],
            ["Mean TTFT", "1596.98 ms", "1090.75 ms", "SSA03 -32%"],
            ["Mean total inference", "2732.57 ms", "2173.36 ms", "SSA03 -20%"],
            ["Mean RSS", "1065.36 MB", "552.89 MB", "SSA03 -48%"],
            ["Peak RSS", "1076.79 MB", "741.07 MB", "SSA03 lower peak"],
            ["Battery drain", "Not recorded", "2% over 640 s", "Approx. 11.25%/h under benchmark load"],
        ],
    ),
    (
        "Latency percentiles on Samsung Galaxy A03.",
        ["Metric", "Min", "P50", "Mean", "P95", "Max"],
        [
            ["TTFT (ms)", "959.0", "1082.0", "1090.75", "1199.0", "1302.0"],
            ["Total inference (ms)", "1950.0", "2167.0", "2173.36", "2316.0", "2584.0"],
        ],
    ),
]


FIGURE_PLACEMENTS = [
    (
        "5.2 Latency Distribution",
        0,
        "pair",
        ("ttft_box", "cold_warm"),
        ("(a) TTFT distribution", "(b) Cold-start and warm-start TTFT"),
        "Latency behavior across the emulator and Samsung Galaxy A03 conditions.",
        2.45,
    ),
    (
        "5.3 Warm-Start Behavior, Throughput, and Memory",
        0,
        "pair",
        ("throughput_runs", "throughput_hist"),
        ("(a) Per-run throughput", "(b) Throughput distribution"),
        "Throughput behavior under repeated benchmark runs.",
        2.45,
    ),
    (
        "5.3 Warm-Start Behavior, Throughput, and Memory",
        1,
        "single",
        ("ram",),
        (),
        "Resident memory across 200 runs.",
        3.45,
    ),
    (
        "5.4 Accuracy Breakdown and Pareto View",
        0,
        "single",
        ("acc_category",),
        (),
        "Semantic palette accuracy by context category.",
        3.45,
    ),
    (
        "5.4 Accuracy Breakdown and Pareto View",
        1,
        "single",
        ("pareto",),
        (),
        "Accuracy-throughput Pareto view for the two hardware settings.",
        3.45,
    ),
]


def matching_figure_placements(sub: str | None, para_idx: int):
    return [
        placement
        for placement in FIGURE_PLACEMENTS
        if placement[0] == sub and placement[1] == para_idx
    ]


"""
def append_markdown_figure(lines: list[str], placement, fig_idx: int) -> None:
    _, _, panel_type, keys, labels, caption, _width_in = placement
    if panel_type in ("pair", "pair_composite"):
        left, right = keys
        lines.append(f"Fig. {fig_idx}. {caption}\n\n")
        lines.append("| " + " | ".join(labels) + " |\n")
        lines.append("| " + " | ".join(["---"] * len(labels)) + " |\n")
        lines.append(
            f"| ![]({FIGS[left].relative_to(ROOT)}) | "
            f"![]({FIGS[right].relative_to(ROOT)}) |\n\n"
        )
    elif panel_type in ("single", "single_size"):
        key = keys[0]
        lines.append(f"![Fig. {fig_idx}. {caption}]({FIGS[key].relative_to(ROOT)})\n\n")


def add_placed_figure(doc, placement, fig_idx: int) -> None:
    _, _, panel_type, keys, labels, caption, size = placement
    if panel_type == "pair":
        left, right = keys
        add_figure_pair(
            doc,
            FIGS[left],
            FIGS[right],
            labels[0],
            labels[1],
            caption,
            fig_idx,
            size,
        )
    elif panel_type == "pair_composite":
        left, right = keys
        composite = make_pair_composite(
            FIGS[left],
            FIGS[right],
            labels[0],
            labels[1],
            f"fig{fig_idx}_{left}_{right}",
            panel_height_px=330,
            gap_px=16,
        )
        add_figure_single_width(doc, composite, caption, fig_idx, size)
    elif panel_type == "single":
        add_figure_single_width(doc, FIGS[keys[0]], caption, fig_idx, size)
    elif panel_type == "single_size":
        width_in, height_in = size
        add_figure_single_size(doc, FIGS[keys[0]], caption, fig_idx, width_in, height_in)


def build_markdown() -> None:
    lines: list[str] = []
    lines.append(f"# {TITLE}\n")
    lines.append(f"{AUTHORS}\n\n{AFFILIATION}\n\n{EMAIL_LINE}\n\n")
    lines.append(f"**Abstract.** {ABSTRACT}\n")
    lines.append(f"**Keywords:** {KEYWORDS}\n")
    table_idx = 0
    fig_idx = 0
    for sec, groups in section_text():
        lines.append(f"## {sec}\n")
        if sec == "4 Experimental Methodology":
            for _ in range(1):
                caption, headers, rows = TABLES[table_idx]
                table_idx += 1
                lines.append(f"Table {table_idx}. {caption}\n")
                lines.append("| " + " | ".join(headers) + " |\n")
                lines.append("| " + " | ".join(["---"] * len(headers)) + " |\n")
                for row in rows:
                    lines.append("| " + " | ".join(row) + " |\n")
                lines.append("\n")
        if sec == "5 Results":
            caption, headers, rows = TABLES[table_idx]
            table_idx += 1
            lines.append(f"Table {table_idx}. {caption}\n")
            lines.append("| " + " | ".join(headers) + " |\n")
            lines.append("| " + " | ".join(["---"] * len(headers)) + " |\n")
            for row in rows:
                lines.append("| " + " | ".join(row) + " |\n")
            lines.append("\n")
        for sub, paras in groups:
            if sub:
                lines.append(f"### {sub}\n")
            for para_idx, para in enumerate(paras):
                lines.append(para + "\n\n")
                if sec == "5 Results" and sub == "5.2 Latency and Throughput":
                    for placement in matching_figure_placements(sub, para_idx):
                        fig_idx += 1
                        append_markdown_figure(lines, placement, fig_idx)
                    if para_idx == 0:
                        caption, headers, rows = TABLES[table_idx]
                        table_idx += 1
                        lines.append(f"Table {table_idx}. {caption}\n")
                        lines.append("| " + " | ".join(headers) + " |\n")
                        lines.append("| " + " | ".join(["---"] * len(headers)) + " |\n")
                        for row in rows:
                            lines.append("| " + " | ".join(row) + " |\n")
                        lines.append("\n")
                elif sec == "5 Results":
                    for placement in matching_figure_placements(sub, para_idx):
                        fig_idx += 1
                        append_markdown_figure(lines, placement, fig_idx)
    lines.append("## References\n")
    for i, ref in enumerate(REFERENCES, 1):
        lines.append(f"[{i}] {ref}\n")
    MARKDOWN.write_text("".join(lines), encoding="utf-8")


def build_word() -> None:
    OUT_DIR.mkdir(exist_ok=True)
    shutil.copy2(TEMPLATE, WORKING)
    word = win32com.client.DispatchEx("Word.Application")
    word.Visible = False
    word.DisplayAlerts = 0
    word.AutomationSecurity = 3
    doc = None
    try:
        doc = word.Documents.Open(
            str(WORKING.resolve()), ReadOnly=False, AddToRecentFiles=False
        )
        doc.Content.Delete()
        add_paragraph(doc, TITLE, "papertitle")
        add_paragraph(doc, AUTHORS, "author")
        add_paragraph(doc, AFFILIATION, "address")
        add_paragraph(doc, EMAIL_LINE, "address")
        add_paragraph(doc, "Abstract. " + ABSTRACT, "abstract")
        add_paragraph(doc, "Keywords: " + KEYWORDS, "keywords")

        table_idx = 0
        fig_idx = 0
        for sec, groups in section_text():
            add_heading(doc, sec, 1)
            if sec == "4 Experimental Methodology":
                for _ in range(1):
                    table_idx += 1
                    caption, headers, rows = TABLES[table_idx - 1]
                    add_table(doc, caption, headers, rows, table_idx)
            if sec == "5 Results":
                table_idx += 1
                caption, headers, rows = TABLES[table_idx - 1]
                add_table(doc, caption, headers, rows, table_idx)
            for sub, paras in groups:
                if sub:
                    add_heading(doc, sub, 2)
                for para_idx, para in enumerate(paras):
                    add_paragraph(doc, para, "p1a")
                    if sec == "5 Results" and sub == "5.2 Latency and Throughput":
                        for placement in matching_figure_placements(sub, para_idx):
                            fig_idx += 1
                            add_placed_figure(doc, placement, fig_idx)
                        if para_idx == 0:
                            table_idx += 1
                            caption, headers, rows = TABLES[table_idx - 1]
                            add_table(doc, caption, headers, rows, table_idx)
                    elif sec == "5 Results":
                        for placement in matching_figure_placements(sub, para_idx):
                            fig_idx += 1
                            add_placed_figure(doc, placement, fig_idx)

        add_unnumbered_heading(doc, "References")
        for ref in REFERENCES:
            para = add_paragraph(doc, ref, "referenceitem")
            para.Range.Font.Size = 7
            para.Range.ParagraphFormat.SpaceAfter = 0
            para.Range.ParagraphFormat.LineSpacing = 8

        doc.Fields.Update()
        doc.SaveAs2(str(OUTPUT.resolve()), FileFormat=13)
        doc.ExportAsFixedFormat(str(PROOF.resolve()), 17)
        pages = doc.ComputeStatistics(2)
        print(f"Saved: {OUTPUT}")
        print(f"Saved: {PROOF}")
        print(f"Pages: {pages}")
        print(f"Tables: {doc.Tables.Count}")
        print(f"Figures: {doc.InlineShapes.Count}")
    finally:
        if doc is not None:
            doc.Close(False)
        word.Quit()


def main() -> None:
    OUT_DIR.mkdir(exist_ok=True)
    prepare_cropped_figures()
    build_markdown()
    build_word()
    print(f"Saved: {MARKDOWN}")


if __name__ == "__main__":
    main()
