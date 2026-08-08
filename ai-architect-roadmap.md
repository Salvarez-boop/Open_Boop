# Arquitecto de Modelos IA — Mapa de Competencias 🦈

> De infraestructura a diseño de arquitecturas: el camino completo

---

## NIVEL 1: FUNDAMENTOS

| Competencia | Qué incluye |
|:------------|:------------|
| **Matemáticas** | Álgebra lineal (matrices, vectores, eigenvalores), Cálculo (derivadas, gradientes, chain rule), Probabilidad y Estadística |
| **Programación** | Python (avanzado), C++ (nociones), CUDA (conceptos básicos) |
| **ML Clásico** | Regresión, SVM, Árboles de decisión, Random Forest, clustering |
| **Deep Learning** | CNNs, RNNs, Backpropagation, funciones de activación, optimizadores |
| **Frameworks** | PyTorch, TensorFlow, JAX — al menos uno en profundidad |

---

## NIVEL 2: NÚCLEO — ARQUITECTURAS DE MODELOS

| Competencia | Qué incluye |
|:------------|:------------|
| **Transformers** | Attention mechanism, Self-Attention, Cross-Attention, Multi-Head Attention, Masking |
| **Arquitecturas LLM** | GPT (decoder-only), LLaMA, Mistral, Qwen, DeepSeek — cómo varían |
| **Tokenización** | BPE, SentencePiece, Unigram, Vocabulary construction, Special tokens |
| **Embeddings** | Posicionales (sinusoidal), RoPE (Rotary Position Embeddings), ALiBi |
| **Normalización** | LayerNorm, RMSNorm, Pre-Norm vs Post-Norm |
| **Modelos de Visión** | ViT, ConvNeXt, arquitecturas híbridas visión-texto |
| **Arquitecturas Multimodales** | CLIP, LLaVA, Flamingo — cómo fusionan modalidades |
| **Mixture of Experts (MoE)** | Routing, expert balancing, sparse activation |
| **State Space Models** | Mamba, S4 — atención lineal, alternativa a transformers |
| **Técnicas de Atención** | Grouped-Query Attention (GQA), Multi-Query Attention (MQA), Sliding Window, Flash Attention |

### Papers base para leer
- *"Attention Is All You Need"* (Vaswani 2017)
- *"LLaMA: Open and Efficient Foundation Language Models"* (Touvron 2023)
- *"Mamba: Linear-Time Sequence Modeling with Selective State Spaces"* (Gu & Dao 2023)
- *"Mixture of Experts Explained"* (Art Técnico)

---

## NIVEL 3: AVANZADO — DISTRIBUCIÓN Y OPTIMIZACIÓN

| Competencia | Qué incluye |
|:------------|:------------|
| **Distribución de Modelos** | Tensor Parallel (TP), Pipeline Parallel (PP), Sequence Parallel |
| **Entrenamiento Distribuido** | DDP, FSDP, ZeRO (1/2/3), DeepSpeed, Megatron-LM |
| **Cuantización** | GPTQ, AWQ, GGUF, Bitsandbytes (8-bit, 4-bit), NF4 |
| **Fine-Tuning** | LoRA, QLoRA, DoRA, Adapters, PEFT |
| **Inferencia** | vLLM, TGI, Triton Inference Server, KV-Cache Management, PagedAttention |
| **Flash Attention** | FA2, FA3 — cómo acelera la atención y reduce memoria |
| **Kernels CUDA Personalizados** | Escribir kernels para operaciones custom, fused kernels |
| **Memory Optimization** | Activation checkpointing, memory profiling, offloading |
| **Model Serving** | vLLM, TGI, SGLang — deployment, batching, continuous batching |
| **Observabilidad** | Prometheus, Grafana, profiling (nsys, ncu) — monitoreo de GPUs |

---

## NIVEL 4: MAESTRÍA — DISEÑO DE ARQUITECTURAS

| Competencia | Qué incluye |
|:------------|:------------|
| **Arquitecturas Nuevas** | MoE routing design, State Space hybrids, atención lineal, nuevas normalizaciones |
| **Capacity Scaling** | Scaling laws (Chinchilla), compute-optimal training, data scaling |
| **Eficiencia de Parámetros** | Sparse models, weight tying, parameter sharing, distillation |
| **Evaluación y Benchmarking** | Ablation studies, MMLU, HumanEval, GSM8K, benchmarks custom |
| **Diseño de Atención** | Grouped-Query Attention (GQA), Multi-Latent Attention (MLA), Sliding Window, atención recurrente |
| **Arquitecturas Híbridas** | Combinación de atención + State Space + MoE — diseño de bloques |

---

## LATERAL: INGENIERÍA

| Competencia | Qué incluye |
|:------------|:------------|
| **MLOps / LLMOps** | CI/CD, Experiment tracking (MLflow, Weights & Biases), versionado de modelos, data pipelines |
| **Infraestructura** | Docker, Kubernetes, Slurm, GPU scheduling, networking (NCCL, RDMA), storage distribuido |

## LATERAL: INVESTIGACIÓN

| Competencia | Qué incluye |
|:------------|:------------|
| **Papers y Literatura** | ArXiv diario, Twitter (Soumith, Karpathy, Google DeepMind), conferencias (NeurIPS, ICML, ICLR) |
| **Implementación desde Cero** | Reproducir papers, "build-nanogpt" de Karpathy, implementation challenges (EfficientDL) |

---

## Recomendación de Ruta de Aprendizaje

1. **Domina los Fundamentos** — especialmente álgebra lineal y PyTorch
2. **Implementa un Transformer desde Cero** — el tutorial nanoGPT de Karpathy es obligatorio
3. **Lee y reproduce Papers** — arranca con "Attention Is All You Need", implementa atención multi-head
4. **Experimenta con Distribución** — tensor parallelism, FSDP, cuantización
5. **Haz Ablation Studies** — cambia una cosa a la vez, mide el impacto
6. **Diseña tu Propia Arquitectura** — propón un bloque nuevo, impleméntalo, benchéalo

> El camino no es lineal: la investigación informa a la ingeniería y viceversa. Se avanza en espiral, no en línea recta.