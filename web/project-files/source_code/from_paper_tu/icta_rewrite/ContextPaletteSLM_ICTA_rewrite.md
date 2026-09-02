# Measuring Ultra-Small Language Models for Context-Aware Mobile UI Personalization at the Edge
Doan Ngoc Phuong, Tran Ngoc Tu

Thai Nguyen University of Information and Communication Technology, Thai Nguyen, Viet Nam

Email: [corresponding email]

**Abstract.** Context-aware mobile interfaces can adapt colors and interaction states from time, environment, and lightweight biometric signals, but cloud-based inference raises privacy and latency concerns. This paper studies whether an ultra-small language model can perform the palette-selection step entirely on a resource-constrained Android edge device. We implement a Flutter on-device pipeline using Gemma-3-270M-IT in GGUF format, Q4_K_M quantization, a persistent native worker, a 256-token context window, throttling and cache reuse, and grammar-constrained JSON output. We evaluate 200 randomized context cases on two hardware settings: an Android x86_64 emulator with 8 GB RAM and a Samsung Galaxy A03 with 3 GB RAM and a Unisoc T606 SoC. The Galaxy A03 reaches 1.09 s mean time-to-first-token, 2.17 s mean total inference time, 0.92 tokens/s throughput, and 553 MB mean RSS, improving latency, throughput, and memory over the emulator condition. However, semantic palette accuracy remains low at 33.0%, showing that schema-constrained decoding should not be confused with task correctness. The study provides an evidence-based boundary for deploying SLM-driven Dynamic UI on low-end mobile hardware: local inference is feasible for session-level adaptation, but accuracy and energy require further domain tuning.
**Keywords:** edge AI; small language models; on-device inference; constrained decoding; mobile user interfaces; Flutter; performance measurement
## 1 Introduction
Dynamic mobile interfaces increasingly use context signals such as time of day, weather, activity, and physiological state to adapt colors and visual density. In a cloud-centric design, these signals must be transmitted to a remote model, which creates privacy exposure and makes response time depend on network conditions. On-device inference offers a cleaner deployment boundary: sensitive context remains on the handset, and the application can decide locally when to adapt its UI.

The main obstacle is not only model size. Low-end Android phones combine limited memory bandwidth, small RAM budgets, passive cooling, and aggressive process management. For language models, these limits appear as long prefill time, slow token generation, resident memory pressure, and thermal or battery cost under repeated inference. These costs are especially important for UI adaptation, where a technically correct response may still be unusable if it arrives too late or destabilizes the foreground application.

Recent small language models (SLMs) make local inference more plausible, and quantized GGUF deployments reduce storage and RAM pressure. However, a second reliability problem remains: small generative models frequently emit free-form text when an application expects a strict control value. In this paper, the required output is a compact JSON object selecting one UI palette. We therefore separate two questions that are often blurred: whether the model output is structurally valid, and whether the selected palette is semantically correct for the context.

This paper evaluates an on-device Flutter pipeline using Gemma-3-270M-IT, Q4_K_M quantization, a persistent worker, a 256-token context window, throttling and cache reuse, and GBNF-style grammar-constrained decoding. The study uses N=200 randomized context cases and compares an 8 GB Android emulator with a Samsung Galaxy A03, a low-end 3 GB RAM phone based on the Unisoc T606 SoC. Our contribution is an empirical boundary study rather than a claim that SLM-based UI selection is already solved.

The results show that the low-end phone condition can be faster and more memory-efficient than the emulator condition for this pipeline: mean TTFT decreases from 1596.98 ms to 1090.75 ms, mean total inference time decreases from 2732.57 ms to 2173.36 ms, throughput increases from 0.74 to 0.92 tokens/s, and mean RSS decreases from 1065.36 MB to 552.89 MB. At the same time, semantic palette accuracy remains only 33.0% on the phone. The paper therefore positions constrained decoding as an output-safety mechanism, not as a substitute for task learning.

## 2 Related Work
### 2.1 Small and Edge Language Models
SLM research studies how transformer language models can be made usable under memory, latency, and energy constraints. Surveys of SLMs and edge LLMs emphasize that small models are not merely compressed versions of server LLMs: their useful deployment depends on model design, quantization, runtime engines, memory management, and workload-specific evaluation [1], [3]. Mobile measurement studies further show that latency and memory footprint vary substantially across model sizes, devices, and inference settings [2].

The present work follows that measurement-oriented tradition but narrows the task to a concrete mobile UI control problem. Instead of measuring open-ended chat quality, we measure a bounded palette-selection workload where the output is a single structured control token embedded in JSON.

### 2.2 Quantization and Mobile Runtime Constraints
Quantization is central to edge deployment because model weights and KV cache compete with the Android application's normal memory needs. GPTQ and AWQ show how low-bit weight representations can preserve much of a large model's behavior while reducing storage and bandwidth pressure [5], [6]. More recent work also warns that quantization can damage reasoning or difficult task behavior, particularly when bit-widths are pushed aggressively [7]. This warning matters for the present study: even if a 270M model fits on a 3 GB device, accuracy for ambiguous context-to-palette mapping cannot be assumed.

Our implementation uses Q4_K_M GGUF weights, a small context window, and a persistent native worker to reduce startup and memory churn. These engineering choices are evaluated as part of the deployed system, because mobile performance depends on the runtime path as much as on the model checkpoint.

### 2.3 Structured Output and Constrained Decoding
Applications often require structured outputs such as JSON, function calls, or commands. Grammar-constrained decoding restricts the token sampler so that invalid continuations are masked during generation. llama.cpp documents GBNF grammars for constraining output formats, while XGrammar studies efficient structured generation for LLM runtimes [8], [9], [10]. These approaches can provide structural correctness by construction, for example ensuring that a response parses as JSON.

Structural correctness is different from semantic correctness. A model may emit a valid object such as {"palette":"ocean"} while still choosing the wrong palette for the context. This distinction is a central correction made in this rewrite: the paper reports palette accuracy separately from schema validity and avoids treating valid JSON as task success.

## 3 System Design
### 3.1 Task Formulation
Each inference receives a compact context record containing time, environmental state, and optional lightweight biometric signals. The output space is a finite set of UI palettes. The application consumes the model response as JSON with one field:

{"palette":"rose|ocean|sunset|forest|cyber"}

We evaluate two properties. The first is output validity: the response must match the JSON schema and be parseable without fallback heuristics. The second is semantic palette accuracy: the selected palette must match the soft ground-truth label assigned to the benchmark case.

### 3.2 On-Device Runtime Pipeline
The mobile application is implemented in Flutter. A persistent worker isolate owns the native inference context and keeps the model outside the UI thread. The runtime uses Gemma-3-270M-IT [4] in GGUF format with Q4_K_M quantization. Context length is set to 256 tokens to limit KV-cache growth, and the prompt is kept short because the task does not require long conversation history.

A throttling and cache layer prevents repeated model calls for minor context changes. When the minimum interval has not elapsed, the app reuses the most recent palette stored in local preferences. This layer is important for UI adaptation because perceived responsiveness depends on avoiding unnecessary inference, not only on making each inference faster.

### 3.3 Grammar-Constrained Output
The grammar restricts the decoder to a single JSON object with one palette value. At each decoding step, tokens that would violate the grammar are removed from the candidate set. This allows the application to parse the model response directly and removes the need for a regular-expression fallback parser.

The grammar does not encode the correct palette for each context. It only encodes the output language accepted by the application. For that reason, the evaluation treats grammar validity as an engineering reliability property and palette accuracy as the actual task metric.

## 4 Experimental Methodology
Table 1. Testbed and deployment configuration.
| Item | Emulator condition (MayAo) | Phone condition (SSA03) |
| --- | --- | --- |
| Device class | Android x86_64 emulator | Samsung Galaxy A03 |
| Memory | 8 GB RAM | 3 GB RAM |
| Processor | Desktop-hosted CPU | Unisoc T606, 12 nm |
| Runtime | Flutter + local native SLM runtime | Flutter + local native SLM runtime |
| Model | Gemma-3-270M-IT, Q4_K_M GGUF | Gemma-3-270M-IT, Q4_K_M GGUF |
| Context window | 256 tokens | 256 tokens |
| Runs | N=200 | N=200 |

### 4.1 Testbeds
The benchmark compares two hardware settings. The emulator condition (MayAo) runs Android x86_64 with 8 GB RAM and desktop CPU resources. The phone condition (SSA03) runs on a Samsung Galaxy A03 with Android 11, 3 GB RAM, and a Unisoc T606 SoC. The phone represents the low-end target where memory pressure and passive cooling are most relevant.

### 4.2 Benchmark Protocol
The benchmark service executes N=200 inference runs sampled from a pool of 40 context cases. Every 20 runs, the service pauses for five seconds to reduce continuous-load heating and to approximate bursty UI usage. For each run, the system records time-to-first-token (TTFT), total inference time, generated-token throughput, resident memory, peak memory, and whether the palette matches the benchmark label.

Battery drain is reported only for the phone condition, where the run consumed two percentage points over 640 seconds. This corresponds to approximately 11.25 percent per hour under the continuous benchmark workload. This value should not be read as normal daily-use drain, because the benchmark repeatedly invokes the model and keeps the device active.

### 4.3 Metrics
TTFT measures the time from the start of streamed inference to the first received token. Total inference time measures the full generation window. Throughput is output tokens per second over the generation window. RSS is the resident physical memory used by the application process. Palette accuracy is the fraction of runs whose selected palette matches the soft benchmark label. These metrics follow standard system-performance practice: latency, throughput, memory, energy, and correctness are reported separately rather than collapsed into a single score [11].

## 5 Results
Table 2. Main benchmark results across two hardware settings.
| Metric | MayAo (8 GB) | SSA03 (3 GB) | Observation |
| --- | --- | --- | --- |
| Semantic palette accuracy | 27.0% (54/200) | 33.0% (66/200) | SSA03 +6.0 percentage points |
| Mean throughput | 0.74 tokens/s | 0.92 tokens/s | SSA03 +24% |
| Mean TTFT | 1596.98 ms | 1090.75 ms | SSA03 -32% |
| Mean total inference | 2732.57 ms | 2173.36 ms | SSA03 -20% |
| Mean RSS | 1065.36 MB | 552.89 MB | SSA03 -48% |
| Peak RSS | 1076.79 MB | 741.07 MB | SSA03 lower peak |
| Battery drain | Not recorded | 2% over 640 s | Approx. 11.25%/h under benchmark load |

### 5.1 Overall Results
Table 2 summarizes the main comparison. The phone condition is faster and uses less memory than the emulator condition in this pipeline. Mean TTFT falls from 1596.98 ms to 1090.75 ms, mean total inference time falls from 2732.57 ms to 2173.36 ms, and throughput increases from 0.74 to 0.92 tokens/s. Mean RSS is almost halved, from 1065.36 MB to 552.89 MB.

The accuracy result is more modest. Palette accuracy is 27.0% on the emulator and 33.0% on the phone. The improvement is positive but still too low for a production Dynamic UI system without additional domain tuning, calibration, or fallback logic.

This contrast is important for system design. The local runtime already meets a practical latency and memory envelope for occasional UI adaptation, but the decision layer must still treat the SLM output as a recommendation that can be rejected, cached, or overridden by hand-written rules.

### 5.2 Latency and Throughput
Figure 1(a) shows that the phone condition has a tighter TTFT distribution than the emulator condition. On the Galaxy A03, TTFT ranges from 959 ms to 1302 ms, with P50=1082 ms and P95=1199 ms. Total inference time ranges from 1950 ms to 2584 ms, with P50=2167 ms and P95=2316 ms. These values are not token-by-token real time, but they are compatible with session-level UI adaptation when results are cached.

Fig. 1. Latency behavior across the emulator and Samsung Galaxy A03 conditions.

| (a) TTFT distribution | (b) Cold-start and warm-start TTFT |
| --- | --- |
| ![](icta_rewrite\cropped_figures\ttft_box.jpg) | ![](icta_rewrite\cropped_figures\cold_warm.jpg) |

Table 3. Latency percentiles on Samsung Galaxy A03.
| Metric | Min | P50 | Mean | P95 | Max |
| --- | --- | --- | --- | --- | --- |
| TTFT (ms) | 959.0 | 1082.0 | 1090.75 | 1199.0 | 1302.0 |
| Total inference (ms) | 1950.0 | 2167.0 | 2173.36 | 2316.0 | 2584.0 |

Figure 1(b) compares cold-start and warm-start TTFT. The gap is small in both conditions, suggesting that the persistent worker reduces repeated initialization cost after the model is loaded. Figures 2(a) and 2(b) show that phone throughput is consistently centered around 0.9 to 1.0 tokens/s, whereas the emulator condition is centered around 0.7 to 0.8 tokens/s and exhibits a wider low-end tail.

Fig. 2. Throughput behavior under repeated benchmark runs.

| (a) Per-run throughput | (b) Throughput distribution |
| --- | --- |
| ![](icta_rewrite\cropped_figures\throughput_runs.jpg) | ![](icta_rewrite\cropped_figures\throughput_hist.jpg) |

### 5.3 Memory, Accuracy, and Trade-off
Figure 3 reports memory over 200 runs. The emulator remains near 1.06 GB RSS. The phone begins higher and then drops in steps before stabilizing near 500 MB. Because this observation comes from system-level RSS rather than controlled allocator instrumentation, we interpret it conservatively as observed memory behavior, not as proof of a specific memory-management mechanism.

![Fig. 3. Resident memory across 200 runs.](icta_rewrite\cropped_figures\ram.jpg)

Figure 4(a) shows that accuracy varies sharply by context category. Combined and edge cases are the strongest groups, while weather and time-only cases remain difficult. This pattern suggests that the current prompt and model do not reliably learn the intended palette semantics from sparse context fields. Figure 4(b) places both hardware settings on an accuracy-throughput plane. The phone condition lies above and to the right of the emulator condition, meaning it is better on both throughput and accuracy for this benchmark. This Pareto view is useful for system selection, but it should not hide the absolute accuracy ceiling: 33.0% is a diagnostic result, not a deployment-grade semantic score.

Fig. 4. Semantic accuracy and accuracy-throughput trade-off.

| (a) Accuracy by context category | (b) Accuracy-throughput trade-off |
| --- | --- |
| ![](icta_rewrite\cropped_figures\acc_category.jpg) | ![](icta_rewrite\cropped_figures\pareto.jpg) |

For a Dynamic UI pipeline, these plots suggest a two-stage design: use the SLM only when context changes are meaningful enough to justify inference, then validate the returned palette against a small set of accessibility and contrast constraints before applying it.

## 6 Discussion
The strongest supported claim is that a quantized 270M-parameter SLM can run fully offline on a 3 GB Android phone for a compact structured-output task, with roughly two-second total inference and sub-gigabyte resident memory. This supports privacy-preserving UI personalization because context data remains local. Constrained decoding also improves integration by turning unparseable text failures into valid but possibly wrong palette choices.

The results do not support near-perfect UI personalization. Grammar constraints can make the output schema-valid, but they do not make the selected palette correct; semantic accuracy remains 33.0% on the phone. The results also do not prove general mobile superiority, because only one physical low-end device and one emulator were tested.

For application builders, the pipeline is most appropriate for per-session or event-triggered adaptation rather than continuous streaming. A two-second generation path is acceptable only when the result is cached; battery drain under continuous benchmark load further argues for throttling and selective invocation.

For researchers, the benchmark shows why edge SLM papers should report multiple metrics together. A system can be structurally safe, faster on-device than expected, and still semantically weak. Reporting only JSON validity or only latency would miss the central trade-off.

The benchmark uses 40 context cases and 200 repeated runs, which is sufficient for system measurements but limited for semantic generalization. Future work should expand the dataset, add independent annotators, and tune the model on a curated UI-context dataset.

## 7 Conclusion
This paper reframes the original study as an empirical boundary evaluation of ultra-small language models for context-aware mobile UI personalization. The Flutter pipeline runs Gemma-3-270M-IT locally with Q4_K_M quantization, a persistent worker, caching, and grammar-constrained JSON output. Across 200 runs, the Galaxy A03 condition achieves 1.09 s mean TTFT, 2.17 s mean total inference time, 0.92 tokens/s throughput, and 553 MB mean RSS.

The main caution is that semantic palette accuracy is only 33.0%. The system is a feasible local inference prototype and measurement baseline, but not yet a high-accuracy personalization model. The next step is domain-specific tuning, larger benchmarks, and accelerator-aware energy measurement.

## References
[1] Z. Lu, X. Li, D. Cai, R. Yi, F. Liu, X. Zhang, N. D. Lane, and M. Xu, "Small Language Models: Survey, Measurements, and Insights," arXiv:2409.15790, 2024.
[2] X. Li et al., "Large Language Models on Mobile Devices: Measurements, Analysis, and Insights," in Proc. ACM EdgeFM@MobiSys, 2024.
[3] Y. Zheng, B. Chen, X. Qian, Y. Shi, Y. Shu, and J. Chen, "A Review on Edge Large Language Models: Design, Execution, and Applications," ACM Computing Surveys, 2025.
[4] Gemma Team, "Gemma 3 Technical Report," arXiv:2503.19786, 2025.
[5] E. Frantar, S. Ashkboos, T. Hoefler, and D. Alistarh, "GPTQ: Accurate Post-Training Quantization for Generative Pre-trained Transformers," in Proc. ICLR, 2023.
[6] J. Lin et al., "AWQ: Activation-aware Weight Quantization for LLM Compression and Acceleration," in Proc. MLSys, 2024.
[7] R. Liu et al., "Quantization Hurts Reasoning? An Empirical Study on Quantized Reasoning Models," arXiv:2504.04823, 2025.
[8] Y. Dong, C. F. Ruan, Y. Cai, R. Lai, Z. Xu, Y. Zhao, and T. Chen, "XGrammar: Flexible and Efficient Structured Generation Engine for Large Language Models," arXiv:2411.15100, 2024.
[9] G. Gerganov et al., "llama.cpp: Inference of LLaMA Models in C/C++," GitHub repository, 2023-2026.
[10] ggml-org, "GBNF Guide," llama.cpp grammars documentation, 2026.
[11] R. Jain, The Art of Computer Systems Performance Analysis. John Wiley and Sons, 1991.
