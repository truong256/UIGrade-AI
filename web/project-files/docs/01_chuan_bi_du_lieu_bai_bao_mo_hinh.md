# UIGrade AI - Chuan bi du lieu, bai bao va mo hinh

## Bo nen sinh vien

Bat dau tai `../README.md`, dung `data/student_practice_grades.jsonl` de hoc MAE,
bias va within-1-point truoc khi cham anh/bai that.

## 1. Bai toan

Xay dung nen tang ma nguon mo ho tro cham bai giao dien Android: sinh vien nop source/APK/anh chup man hinh, he thong so sanh voi rubric va baseline, sau do dua diem va phan hoi AI. De tai ke thua repo `manh2404/android-ui-grader-AI` va nghien cuu `paper_tu` ve SLM ca nhan hoa giao dien.

## 2. Du lieu can chuan bi

### Bo bai tap mau

Moi bai tap can co:

- De bai/rubric.
- Anh baseline giao dien dung.
- Anh submission cua sinh vien.
- File metadata: ten man hinh, device size, theme, diem mong muon.

Da co file mau tai `data/sample_ui_grading_cases.jsonl`.

### Truong diem goi y

| Tieu chi | Diem |
|---|---:|
| Dung bo cuc | 3 |
| Dung mau/typography | 2 |
| Dung chuc nang UI | 2 |
| Responsive tren man hinh nho | 1 |
| Accessibility/contrast | 1 |
| Code/submit dung quy cach | 1 |

## 3. Bai bao/tai lieu can doc

1. Repo nen: https://github.com/manh2404/android-ui-grader-AI
2. Android UI Automator: https://developer.android.com/training/testing/other-components/ui-automator
3. WCAG 2.2: https://www.w3.org/TR/WCAG22/
4. Guidance on applying WCAG to mobile apps: https://www.w3.org/TR/wcag2mobile-22/
5. Tai lieu noi bo: `paper_tu` - ContextPalette-SLM / on-device SLM UI personalization.
6. Tai lieu noi bo: `ContextPaletteSLM_ICTA_rewrite.md` trong `paper_tu/icta_rewrite`.

## 4. Mo hinh nen/nen dung

| Muc dich | Model/thu vien | Dinh dang |
|---|---|---|
| So sanh anh | `pixelmatch`, `sharp` | Khong can model |
| Parse rubric | Rule/Zod + optional LLM | JSON schema |
| Phan hoi AI | Gemma-3-270M-IT | GGUF Q4_K_M |
| So sanh model | SmolLM2-360M, Qwen2.5-0.5B | GGUF Q4_K_M |
| UI personalization | Gemma/SmolLM tu `paper_tu` | GGUF Q4_K_M |

Khuyen nghi: phien ban dau cham bang metric + rubric, AI chi sinh phan hoi giai thich.

## 5. Viec can lam tuan dau

1. Chay duoc repo `android-ui-grader-AI` local.
2. Tao 3 bai tap Android UI mau.
3. Tao 10 anh baseline/submission mau.
4. Tinh diem pixel difference va contrast.
5. Sinh phan hoi tu rubric: loi mau sac, khoang cach, responsive.

## 6. Ket qua toi thieu

- Web demo co dang nhap/tao bai/nop bai/cham bai.
- 3 assignment mau.
- 30 submission/anh test.
- Bao cao so sanh diem tu dong voi diem giang vien.
