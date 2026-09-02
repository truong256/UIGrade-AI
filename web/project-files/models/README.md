# Models - UIGrade AI

## Baseline khuyen nghi

Khong can model vision trong phien ban dau:

- `pixelmatch`: so sanh baseline va submission screenshot.
- `sharp`: resize/crop/normalize anh.
- WCAG contrast formula: cham do tuong phan mau.
- Rubric parser: Zod/JSON schema.

## Model nen/SLM tuy chon

1. Gemma-3-270M-IT GGUF Q4_K_M
   - Link: https://huggingface.co/unsloth/gemma-3-270m-it-GGUF
   - Vai tro: sinh phan hoi ngan dua tren rubric va ket qua metric.

2. SmolLM2-360M-Instruct GGUF Q4_K_M
   - Link: https://huggingface.co/bartowski/SmolLM2-360M-Instruct-GGUF
   - Vai tro: so sanh SLM sieu nhe.

3. Qwen2.5-0.5B-Instruct GGUF Q4_K_M
   - Link: https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF
   - Vai tro: so sanh chat luong phan hoi voi model lon hon.

## Ket noi voi paper_tu

`paper_tu` da co ket qua ve Gemma-3-270M, SmolLM2-360M va Qwen2.5-0.5B tren Android thiet bi thap. UIGrade AI co the dung lai:

- Grammar-constrained JSON output.
- Benchmark TTFT, total inference, RAM, pin.
- Context-to-palette/UI feedback schema.

So lieu benchmark that (accuracy 27-33%, TTFT/RAM theo tung thiet bi) da duoc
trich va dien giai tai `docs/04_KET_QUA_CAP_NHAT_TU_DU_AN_NEN.md`.
