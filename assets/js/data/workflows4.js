(function () {
  "use strict";
  window.COMFY_DATA = window.COMFY_DATA || {};
  window.COMFY_DATA.workflows = window.COMFY_DATA.workflows || [];

  // ---------- 22. Wan VACE 文生视频（14B） ----------
  window.COMFY_DATA.workflows.push({
    id: "wan-vace-t2v",
    name: "Wan VACE 视频编辑",
    category: "视频生成",
    tags: ["Wan", "VACE", "官方模板"],
    difficulty: 4,
    source: "ComfyUI 官方模板库（真实文件 video_wan_vace_14B_t2v.json）",
    summary: "这是 ComfyUI 官方的 Wan 2.1 VACE 文生视频模板：14B 主模型经 CausVid 蒸馏 LoRA 加速后，由 WanVaceToVideo 把 1280 x 720、81 帧的画布与正负条件编排成视频潜空间，KSampler 以 4 步 uni_pc 采样，TrimVideoLatent 裁掉参考占位后解码合成 MP4。VACE 的价值在于 control_video、control_masks、reference_image 三个可选输入一接就变成可控视频编辑，本模板留空即为纯文生视频基线。源文件还带一套被 bypass 的 1.3B 低显存分支，本图为保留主干后的简化。",
    useCases: [
      "按文本提示生成电影感短片，后续再接入控制视频做风格化编辑",
      "在参考图或控制遮罩引导下重拍与续写现有视频片段",
      "用 CausVid LoRA 把 14B 模型的出片时间压缩到分钟级",
      "研究 VACE 全能编辑框架在 ComfyUI 原生节点里的连线方式"
    ],
    models: [
      { type: "Diffusion 模型", name: "wan2.1_vace_14B_fp16.safetensors", note: "Wan 2.1 VACE 14B 主模型，fp16 精度，放 models/diffusion_models；文件内另有被 bypass 的 1.3B 备选分支 wan2.1_vace_1.3B_fp16" },
      { type: "文本编码器", name: "umt5_xxl_fp16.safetensors", note: "UMT5-XXL 文本编码器，中英双语友好；文件内有 fp8_e4m3fn_scaled 量化版加载节点但处于 bypass" },
      { type: "VAE", name: "wan_2.1_vae.safetensors", note: "Wan 2.1 全系共用 VAE，同时供给 WanVaceToVideo 与 VAEDecode" },
      { type: "LoRA", name: "Wan21_CausVid_14B_T2V_lora_rank32.safetensors", note: "CausVid 蒸馏加速 LoRA，强度 0.7，把采样压到 4 步 cfg 1" }
    ],
    graph: {
      nodes: [
        { id: "unet", title: "UNETLoader", cat: "load", x: 30, y: 40,
          widgets: ["wan2.1_vace_14B_fp16.safetensors", "default"],
          inputs: [],
          outputs: [ { type: "MODEL" } ],
          params: [
            { name: "unet_name", kind: "下拉选择", default: "wan2.1_vace_14B_fp16.safetensors", desc: "models/diffusion_models 目录中的 Wan 2.1 VACE 14B 主模型；源文件留有被 bypass 的 1.3B 低显存分支，但 1.3B 只支持 480P。" },
            { name: "weight_dtype", kind: "下拉选择", default: "default", desc: "保持 default 按文件精度读取；切换模型分支时配套的 CausVid LoRA 也要换成对应规模。" }
          ],
          brief: "载入 Wan 2.1 VACE 14B 文生视频主模型。",
          desc: "在 diffusion_models 目录选择 14B 的 fp16 权重。源文件里还有一个处于 bypass 状态的 1.3B 分支（wan2.1_vace_1.3B_fp16）供低显存用户切换，但 1.3B 只支持 480P。" },
        { id: "clip", title: "CLIPLoader", cat: "load", x: 30, y: 240,
          widgets: ["umt5_xxl_fp16.safetensors", "wan"],
          inputs: [],
          outputs: [ { type: "CLIP" } ],
          params: [
            { name: "clip_name", kind: "下拉选择", default: "umt5_xxl_fp16.safetensors", desc: "UMT5-XXL 文本编码器，中英双语友好；显存不足可换源文件里 bypass 着的 fp8 量化版。" },
            { name: "type", kind: "下拉选择", default: "wan", desc: "编码器用途类型，Wan 系必须选 wan。" }
          ],
          brief: "载入 UMT5-XXL 文本编码器，类型选 wan。",
          desc: "为 Wan 系模型提供文本理解能力，中文提示词也能准确解析。源文件另有 fp8 量化版（umt5_xxl_fp8_e4m3fn_scaled）的加载节点处于 bypass，是低显存替代方案。" },
        { id: "vae", title: "VAELoader", cat: "load", x: 30, y: 430,
          widgets: ["wan_2.1_vae.safetensors"],
          inputs: [],
          outputs: [ { type: "VAE" } ],
          params: [
            { name: "vae_name", kind: "下拉选择", default: "wan_2.1_vae.safetensors", desc: "Wan 2.1 全系共用 VAE，同时供给 WanVaceToVideo 铺画布与 VAEDecode 解码；1.3B 与 14B 切换时不用换。" }
          ],
          brief: "载入 Wan 2.1 专用 VAE，一路两用。",
          desc: "输出同时送入 WanVaceToVideo 铺设视频潜空间画布与 VAEDecode 最终解码。1.3B 与 14B 共用这一个 VAE，切换模型分支时不需要更换。" },
        { id: "lora", title: "LoraLoader", cat: "model", x: 380, y: 40,
          widgets: ["Wan21_CausVid_14B_T2V_lora_rank32.safetensors", "0.7"],
          inputs: [ { name: "model", type: "MODEL" }, { name: "clip", type: "CLIP" } ],
          outputs: [ { type: "MODEL" }, { type: "CLIP" } ],
          params: [
            { name: "lora_name", kind: "下拉选择", default: "Wan21_CausVid_14B_T2V_lora_rank32.safetensors", desc: "CausVid 蒸馏加速 LoRA，把 20 步 cfg 6 压缩到 4 步 cfg 1，81 帧 720P 从约 40 分钟降到约 4 分钟。" },
            { name: "strength_model", kind: "浮点数", default: "0.7", desc: "对模型主干的强度，官方建议在 0.3 到 0.7 之间试验，过高会画面抖动模糊。" },
            { name: "strength_clip", kind: "浮点数", default: "0.7", desc: "对文本编码器的强度，与模型端保持一致。" }
          ],
          brief: "挂载 CausVid 蒸馏加速 LoRA，强度 0.7。",
          desc: "同时作用于 MODEL 与 CLIP 两路。CausVid 把默认 20 步 cfg 6 压缩到 4 步 cfg 1，官方注释给出数据：RTX 4090 上 81 帧 720P 从约 40 分钟降到约 4 分钟。强度建议在 0.3 到 0.7 之间试验。" },
        { id: "pos", title: "CLIPTextEncode", cat: "cond", x: 380, y: 280,
          widgets: ["Fujifilm Portra 400H film still, slammed Nissan Skyline R33 GTR LM JGTC, in heavy motion blur, 7-11 Tokyo, Midnight"],
          inputs: [ { name: "clip", type: "CLIP" } ],
          outputs: [ { type: "CONDITIONING" } ],
          params: [
            { name: "text", kind: "多行文本", default: "Fujifilm Portra 400H film still, slammed Nissan Skyline R33 GTR LM JGTC, in heavy motion blur, 7-11 Tokyo, Midnight", desc: "正向提示词；示例用富士胶片风格强调运动模糊，是典型的电影感写法，写清主体、场景、光线与镜头意图比堆画质词有效。" }
          ],
          brief: "把正向提示词编码为正向条件。",
          desc: "示例用富士胶片风格描写午夜东京的重改装战神 R33，强调运动模糊，是典型的电影感写法。umt5 编码器对长句描述的响应优于标签堆砌。" },
        { id: "neg", title: "CLIPTextEncode", cat: "cond", x: 380, y: 530,
          widgets: ["过曝，静态，细节模糊不清，字幕，风格，作品，画面，静止，整体发灰，最差质量，低质量，JPEG压缩残留，丑陋的，残缺的，多余的手指，画得不好的手部，画得不好的脸部，畸形的，毁容的，形态畸形的肢体，手指融合，静止不动的画面，杂乱的背景，三条腿，背景人很多，倒着走"],
          inputs: [ { name: "clip", type: "CLIP" } ],
          outputs: [ { type: "CONDITIONING" } ],
          params: [
            { name: "text", kind: "多行文本", default: "过曝，静态，细节模糊不清，字幕，风格，作品，画面，静止，整体发灰，最差质量，低质量，JPEG压缩残留，丑陋的，残缺的，多余的手指，画得不好的手部，画得不好的脸部，畸形的，毁容的，形态畸形的肢体，手指融合，静止不动的画面，杂乱的背景，三条腿，背景人很多，倒着走", desc: "Wan 官方模板习惯的中文负向词长表；注意 CausVid 加速模式 cfg 为 1，此时负向条件基本不产生引导，bypass LoRA 恢复 cfg 6 后才真正生效。" }
          ],
          brief: "把中文负向提示词编码为负向条件。",
          desc: "覆盖静态画面、模糊、肢体畸形、背景杂乱等常见视频问题，是 Wan 官方模板的习惯写法。注意在 CausVid 加速模式下 cfg 为 1，负向条件基本不产生引导作用。" },
        { id: "vace", title: "WanVaceToVideo", cat: "cond", x: 680, y: 40,
          widgets: ["1280 x 720", "81", "1", "1"],
          inputs: [ { name: "positive", type: "CONDITIONING" }, { name: "negative", type: "CONDITIONING" }, { name: "vae", type: "VAE" } ],
          outputs: [ { type: "CONDITIONING" }, { type: "CONDITIONING" }, { type: "LATENT" }, { type: "INT" } ],
          params: [
            { name: "width", kind: "整数", default: "1280", desc: "画布宽度；14B 支持 480P 与 720P，1.3B 分支只支持 480P。" },
            { name: "height", kind: "整数", default: "720", desc: "画布高度，与宽度构成 16 比 9 的 720P 档。" },
            { name: "length", kind: "整数", default: "81", desc: "生成帧数，须满足 4 的倍数加 1 约束（81 即 4 x 20 加 1），16fps 下约 5 秒。" },
            { name: "batch_size", kind: "整数", default: "1", desc: "视频生成显存消耗大，保持 1。" }
          ],
          brief: "VACE 核心编排节点：生成 81 帧视频潜空间并改写条件。",
          desc: "宽 1280 高 720、81 帧（16fps 下约 5 秒，满足 Wan 的 4 的倍数加 1 约束），输出改写后的正负条件、初始 latent 与 trim_latent 四路。control_video、control_masks、reference_image 三个可选输入在本模板留空，接入后即变成 VACE 主打的视频编辑模式。" },
        { id: "shift", title: "ModelSamplingSD3", cat: "model", x: 680, y: 330,
          widgets: ["8"],
          inputs: [ { name: "model", type: "MODEL" } ],
          outputs: [ { type: "MODEL" } ],
          params: [
            { name: "shift", kind: "整数", default: "8", desc: "噪声调度偏移量，Wan 系推荐值，把更多去噪预算分配给高噪声阶段，影响动态与结构稳定性。" }
          ],
          brief: "以 shift 8 调整采样噪声调度分布。",
          desc: "Wan 系推荐的偏移量，让调度把更多去噪预算分配给高噪声阶段。节点在源文件中是折叠状态，位于 LoRA 与 KSampler 之间，容易被忽略但影响成片动态表现。" },
        { id: "ks", title: "KSampler", cat: "sampler", x: 920, y: 40,
          widgets: ["675909971186865", "randomize", "4", "1", "uni_pc", "simple", "1"],
          inputs: [ { name: "model", type: "MODEL" }, { name: "positive", type: "CONDITIONING" }, { name: "negative", type: "CONDITIONING" }, { name: "latent_image", type: "LATENT" } ],
          outputs: [ { type: "LATENT" } ],
          params: [
            { name: "seed", kind: "整数", default: "675909971186865", desc: "种子值；固定后可复现同一段视频，是对比调参的基础。" },
            { name: "control_after_generate", kind: "下拉选择", default: "randomize", desc: "每次生成后的种子行为，randomize 每次随机，复现时改 fixed。",
              options: [["randomize", "每次运行换随机种子"], ["fixed", "保持不变，可复现"], ["increment", "每次加一"]] },
            { name: "steps", kind: "整数", default: "4", desc: "与 CausVid LoRA 绑定的加速步数；bypass LoRA 追求质量时官方要求改回 20 步。" },
            { name: "cfg", kind: "浮点数", default: "1", desc: "加速模式必须配 1；恢复默认参数时改回 6。" },
            { name: "sampler_name", kind: "下拉选择", default: "uni_pc", desc: "Wan 官方模板推荐组合，加速与默认模式都适用。",
              options: [["uni_pc", "高阶求解器，低步数表现好"], ["euler", "朴素稳定，可尝试"], ["dpmpp_2m", "锐度更高，非官方组合"]] },
            { name: "scheduler", kind: "下拉选择", default: "simple", desc: "简化日程，与 uni_pc 配合是 Wan 模板默认。",
              options: [["simple", "简化日程，官方默认"], ["sgm_uniform", "可对比尝试"], ["normal", "线性计划"]] },
            { name: "denoise", kind: "浮点数", default: "1", desc: "从纯噪声完整生成，保持 1。" }
          ],
          brief: "4 步 uni_pc 采样，cfg 1，配合 CausVid LoRA 的加速组合。",
          desc: "模型来自 ModelSamplingSD3，正负条件与画布来自 WanVaceToVideo。若 bypass 掉 LoRA 追求质量，官方注释要求改回 20 步 cfg 6。seed 为 randomize，固定后可复现同一段视频。" },
        { id: "trim", title: "TrimVideoLatent", cat: "latent", x: 920, y: 330,
          widgets: ["0"],
          inputs: [ { name: "samples", type: "LATENT" }, { name: "trim_amount", type: "INT" } ],
          outputs: [ { type: "LATENT" } ],
          params: [
            { name: "trim_amount", kind: "整数", default: "0", desc: "裁掉的参考占位帧数，由 WanVaceToVideo 的 trim_latent 输出驱动；未接参考图时为 0 等于直通，接入 reference_image 后自动裁掉对应数量。" }
          ],
          brief: "按 trim_latent 裁掉参考图占用的潜空间帧。",
          desc: "trim_amount 由 WanVaceToVideo 的 trim_latent 输出驱动。未接参考图时值为 0，节点等于直通；一旦接入 reference_image，输出帧数会自动少去参考帧对应的数量，这是 VACE 工作流特有的收尾细节。" },
        { id: "decode", title: "VAEDecode", cat: "vae", x: 1160, y: 40,
          widgets: [],
          inputs: [ { name: "samples", type: "LATENT" }, { name: "vae", type: "VAE" } ],
          outputs: [ { type: "IMAGE" } ],
          brief: "把 81 帧视频潜空间解码成像素帧序列。",
          desc: "视频解码比单图耗时得多且与帧数成正比。源文件里解码结果还并联到一个被 bypass 的 SaveAnimatedWEBP 节点（6fps、质量 80），需要动态 WebP 预览时 Ctrl+B 启用。" },
        { id: "createvideo", title: "CreateVideo", cat: "video", x: 1430, y: 40,
          widgets: ["16"],
          inputs: [ { name: "images", type: "IMAGE" } ],
          outputs: [ { type: "VIDEO" } ],
          params: [
            { name: "fps", kind: "整数", default: "16", desc: "合成帧率，与 Wan 2.1 训练帧率一致；调高只会让动作播放变快而不是更流畅。" }
          ],
          brief: "以 16fps 把帧序列组装成 VIDEO 对象。",
          desc: "新版 ComfyUI 内置的官方合成节点，替代了老模板里常见的第三方 VHS_VideoCombine。16fps 与 Wan 2.1 的训练帧率一致，调高帧率只会让动作变快而不是更流畅。音频输入留空即无声视频。" },
        { id: "save", title: "SaveVideo", cat: "video", x: 1430, y: 260,
          widgets: ["video/ComfyUI", "auto", "auto"],
          inputs: [ { name: "video", type: "VIDEO" } ],
          outputs: [],
          params: [
            { name: "filename_prefix", kind: "文本", default: "video/ComfyUI", desc: "输出文件命名前缀，支持子目录写法，产物在 output 目录自动编号。" },
            { name: "format", kind: "下拉选择", default: "auto", desc: "容器格式，auto 由 ComfyUI 按内容自动选择，实测输出 MP4。" },
            { name: "codec", kind: "下拉选择", default: "auto", desc: "编码器，auto 自动匹配容器；相比 WebP 体积更小、兼容性更好。" }
          ],
          brief: "把 VIDEO 对象写出为 MP4 文件。",
          desc: "前缀 video/ComfyUI，格式与编码均为 auto，由 ComfyUI 按容器自动选择。输出位于 output 目录并自动编号，相比 WebP 体积更小、兼容性更好。" }
      ],
      links: [
        { from: "unet", fromOut: 0, to: "lora", toIn: "model" },
        { from: "clip", fromOut: 0, to: "lora", toIn: "clip" },
        { from: "lora", fromOut: 0, to: "shift", toIn: "model" },
        { from: "lora", fromOut: 1, to: "pos", toIn: "clip" },
        { from: "lora", fromOut: 1, to: "neg", toIn: "clip" },
        { from: "vae", fromOut: 0, to: "vace", toIn: "vae" },
        { from: "vae", fromOut: 0, to: "decode", toIn: "vae" },
        { from: "pos", fromOut: 0, to: "vace", toIn: "positive" },
        { from: "neg", fromOut: 0, to: "vace", toIn: "negative" },
        { from: "vace", fromOut: 0, to: "ks", toIn: "positive" },
        { from: "vace", fromOut: 1, to: "ks", toIn: "negative" },
        { from: "vace", fromOut: 2, to: "ks", toIn: "latent_image" },
        { from: "vace", fromOut: 3, to: "trim", toIn: "trim_amount" },
        { from: "shift", fromOut: 0, to: "ks", toIn: "model" },
        { from: "ks", fromOut: 0, to: "trim", toIn: "samples" },
        { from: "trim", fromOut: 0, to: "decode", toIn: "samples" },
        { from: "decode", fromOut: 0, to: "createvideo", toIn: "images" },
        { from: "createvideo", fromOut: 0, to: "save", toIn: "video" }
      ]
    },
    stages: [
      { name: "模型加载", nodes: ["unet", "clip", "vae"], desc: "14B 主模型、UMT5 文本编码器与 Wan 2.1 VAE 三件套就位，文件内被 bypass 的 1.3B 备选分支与 fp8 编码器分支随时可以顶上。" },
      { name: "加速与条件", nodes: ["lora", "pos", "neg"], desc: "CausVid LoRA 以 0.7 强度同时注入 MODEL 与 CLIP，中英双语的正负提示词编码为条件向量。" },
      { name: "VACE 编排与采样", nodes: ["vace", "shift", "ks", "trim"], desc: "WanVaceToVideo 铺出 81 帧画布并改写条件，shift 8 调整调度后 KSampler 以 4 步 uni_pc 完成去噪，TrimVideoLatent 依据 trim_latent 裁掉参考占位。" },
      { name: "解码与输出", nodes: ["decode", "createvideo", "save"], desc: "VAE 整段解码 81 帧像素，CreateVideo 以 16fps 合成视频，SaveVideo 自动选择容器写出 MP4。" }
    ],
    nodeAnalysis: [
      { node: "unet", detail: "UNETLoader 在 diffusion_models 目录里选择 wan2.1_vace_14B_fp16.safetensors，这是 Wan 2.1 VACE 14B 的文生视频主模型。源文件里保留了一个处于 bypass 状态的 1.3B 分支（wan2.1_vace_1.3B_fp16），显存不足时可以切换，但 1.3B 只支持 480P 分辨率。weight_dtype 保持 default 即可，切换模型分支时配套的 CausVid LoRA 也必须换成对应规模，否则加速会错乱。" },
      { node: "clip", detail: "CLIPLoader 加载 umt5_xxl_fp16.safetensors 并把类型选为 wan，为 Wan 系模型提供 UMT5-XXL 的中英双语理解能力。源文件中另有一个 fp8 量化版（umt5_xxl_fp8_e4m3fn_scaled）的加载节点处于 bypass 状态，是给低显存用户的替代方案。它的 CLIP 输出先进入 CausVid LoRA 的 clip 端口再分发给两个提示词编码器，这个先后顺序不能接反，否则 LoRA 对文本侧的适配会失效。" },
      { node: "vae", detail: "VAELoader 加载 wan_2.1_vae.safetensors，一路送入 WanVaceToVideo 用于在潜空间里铺设视频画布，一路送入 VAEDecode 做最终解码。Wan 2.1 全系共用这一个 VAE，1.3B 与 14B 切换时不需要更换。若解码出现花屏或色彩严重异常，优先检查 VAE 文件是否完整下载以及是否误用了其他系模型的 VAE。" },
      { node: "lora", detail: "LoraLoader 同时接收 MODEL 与 CLIP 两路输入，加载 Wan21_CausVid_14B_T2V_lora_rank32.safetensors，强度 0.7。CausVid 是蒸馏加速 LoRA，它把默认 20 步 cfg 6 的采样压缩到 4 步 cfg 1，官方注释给出参考：RTX 4090 上 81 帧 720P 从约 40 分钟降到约 4 分钟。官方提醒强度可在 0.3 到 0.7 之间试验，过高会画面抖动模糊；不需要加速时 bypass 此节点，并把 KSampler 恢复为 20 步 cfg 6 的默认参数。" },
      { node: "pos", detail: "正向 CLIPTextEncode 编码后的条件进入 WanVaceToVideo 的 positive 端口。示例提示词用富士胶片风格描述一台在东京午夜 7-11 门前带重度运动模糊的改装 R33 战神，属于典型的电影感运镜写法。umt5 编码器对中英文长句都友好，写清主体、场景、光线与镜头意图比堆砌画质词更有效。" },
      { node: "neg", detail: "负向提示词是一长串中文，覆盖静态画面、模糊、低质量、肢体畸形、背景杂乱等视频常见问题，符合 Wan 官方模板的习惯。它与正向条件一起先进入 WanVaceToVideo 改写再交给 KSampler 的 negative 端口。要注意本模板 cfg 为 1（CausVid 加速模式），此时负向条件几乎不产生引导作用，只有关掉 LoRA 恢复 cfg 6 后它才真正生效。" },
      { node: "vace", detail: "WanVaceToVideo 是本图的核心编排节点：宽 1280 高 720、81 帧，16fps 下约 5 秒。它接收正负条件与 VAE，把视频结构信息写入潜空间，并输出改写后的正负条件、初始 latent 与 trim_latent 四路数据。control_video、control_masks、reference_image 三个可选输入在本模板留空，因此此刻它等价于纯文生视频；一旦接入控制视频或参考图，就变成 VACE 主打的局部重绘式视频编辑。81 帧满足 Wan 的 4 的倍数加 1 帧数约束。" },
      { node: "shift", detail: "ModelSamplingSD3 把模型的采样噪声调度做 shift 8 的整体偏移，这是 Wan 系模板推荐的数值，作用是让调度把更多步数分配给高噪声阶段，从而稳住大动态画面的结构。它在源文件中是折叠状态，位于 LoRA 与 KSampler 之间，是容易被忽略但影响成片观感的小节点。换用其他 Wan 变体模板时 shift 数值要参考对应官方推荐值。" },
      { node: "ks", detail: "KSampler 四路输入齐备：模型来自 ModelSamplingSD3，正负条件来自 WanVaceToVideo 的改写输出，画布来自同一节点的 latent 输出。参数为 4 步、cfg 1、uni_pc 加 simple 调度、denoise 1，这是与 CausVid LoRA 绑定的加速组合，官方注释同时给出默认版参数 20 步 cfg 6。seed 控制模式为 randomize，改成固定数字即可复现同一段视频，是对比调参的基础操作。" },
      { node: "trim", detail: "TrimVideoLatent 接收采样结果与 WanVaceToVideo 输出的 trim_latent 整数，把参考图占用的潜空间帧裁掉。纯文生视频且未接参考图时 trim 值为 0，节点等于直通；一旦接入 reference_image，输出帧数会自动少去参考帧对应的数量，保证成片长度与预期一致。它在源文件中折叠放在采样器下方，是 VACE 工作流特有的收尾细节，漏接会导致成片开头混入参考帧。" },
      { node: "decode", detail: "VAEDecode 用 Wan 2.1 VAE 把 81 帧视频潜空间整段还原成像素帧序列，解码耗时与显存占用都随帧数线性增长。源文件里解码结果一路通向 CreateVideo，另一路通向一个被 bypass 的 SaveAnimatedWEBP（6fps、质量 80、default 通配），需要动态 WebP 预览或嵌入网页时启用它即可，两条输出互不影响。" },
      { node: "createvideo", detail: "CreateVideo 是新版 ComfyUI 内置的官方合成节点，把图像帧序列以 16fps 组装成 VIDEO 对象，替代了老模板里常见的第三方 VHS_VideoCombine 的角色。音频输入留空即输出无声视频。16fps 与 Wan 2.1 的训练帧率一致，改高帧率只会让动作播放变快而不是更流畅，想要慢动作反而应调低帧率。" },
      { node: "save", detail: "SaveVideo 接收 VIDEO 对象写出文件，前缀 video/ComfyUI，格式与编码均为 auto，由 ComfyUI 按容器自动选择，实测输出为 MP4。相比 SaveAnimatedWEBP，MP4 体积更小、播放器兼容性更好。输出位于 ComfyUI 的 output 目录，重名文件自动追加序号不会覆盖。" }
    ],
    flow: [
      "① UNETLoader 载入 wan2.1_vace_14B_fp16，CLIPLoader 载入 umt5_xxl_fp16，VAELoader 载入 wan_2.1_vae。",
      "② CausVid LoRA 以 0.7 强度同时作用于 MODEL 与 CLIP 两路。",
      "③ 正负提示词经 CLIPTextEncode 编码后进入 WanVaceToVideo。",
      "④ WanVaceToVideo 按 1280 x 720、81 帧铺设视频潜空间，并把改写后的条件、latent、trim_latent 三类数据分发出去。",
      "⑤ ModelSamplingSD3 以 shift 8 调整调度，KSampler 用 uni_pc 在 4 步内完成 cfg 1 去噪。",
      "⑥ TrimVideoLatent 依据 trim_latent 裁掉参考占位帧。",
      "⑦ VAEDecode 解码为像素帧，CreateVideo 以 16fps 合成视频，SaveVideo 写出 MP4。"
    ],
    params: [
      { name: "width / height", value: "1280 x 720", desc: "VACE 画布尺寸，14B 支持 480P 与 720P，1.3B 分支只支持 480P。" },
      { name: "length", value: "81", desc: "生成帧数，须满足 4 的倍数加 1 约束，16fps 下约 5 秒。" },
      { name: "steps / cfg", value: "4 / 1", desc: "CausVid LoRA 加速组合；bypass LoRA 后官方要求改回 20 步 cfg 6。" },
      { name: "sampler / scheduler", value: "uni_pc / simple", desc: "Wan 官方模板的推荐组合，加速与默认模式都适用。" },
      { name: "shift", value: "8", desc: "ModelSamplingSD3 的噪声偏移量，Wan 系推荐值，影响动态与结构稳定性。" },
      { name: "lora strength", value: "0.7", desc: "CausVid 强度，官方建议在 0.3 到 0.7 之间试验，过高会抖动模糊。" },
      { name: "fps", value: "16", desc: "CreateVideo 合成帧率，与 Wan 2.1 训练帧率一致。" }
    ],
    tips: [
      "14B 支持 480P 与 720P，1.3B 只支持 480P；切换模型分支时 LoRA 必须换成对应规模的版本。",
      "RTX 4090 上 81 帧 720P 原本约 40 分钟，挂 CausVid LoRA 后约 4 分钟；画面发抖或变糊就把强度往 0.3 方向调。",
      "本模板的 VACE 三个控制输入留空，接入 control_video 加 control_masks 即变成局部重绘式视频编辑，接 reference_image 可做参考主体续拍，成片帧数会由 TrimVideoLatent 自动修正。",
      "bypass CausVid LoRA 追求质量时，记得把 KSampler 改回 20 步 cfg 6，否则 4 步不加蒸馏会出灰糊画面。",
      "帧数不是随手填的，Wan 要求帧数为 4 的倍数加 1，81 即 4 x 20 加 1，修改时保持这个约束。"
    ],
    notice: "源文件包含 14B 与 1.3B 两套模型分支，1.3B 分支、fp8 编码器与 WebP 保存节点处于 bypass 状态；本图为保留主干后的简化，省略了 5 个 MarkdownNote 注释节点。"
  });

  // ---------- 23. LTX-2 文生视频（音画一体） ----------
  window.COMFY_DATA.workflows.push({
    id: "ltxv-t2v",
    name: "LTX-2 视频生成",
    category: "视频生成",
    tags: ["LTX-2", "音画一体", "官方模板", "两阶段采样"],
    difficulty: 4,
    source: "ComfyUI 官方模板库（真实源文件 ltxv-t2v.json，新版子图格式）",
    summary: "这是 Lightricks LTX-2 19B 的官方音画一体文生视频模板，真实文件是新版子图格式，全部逻辑封装在名为 Text to Video (LTX 2.0) 的子图内：视频与音频潜空间拼接后联合采样，第一阶段在约 640 x 360 走 20 步，经专用潜空间放大器翻倍到 1280 x 720，第二阶段用蒸馏 LoRA 加固定 sigma 快速精修，最终画面与声音分别解码并由 CreateVideo 合成一条带音轨的 MP4。LTX-2 最大的卖点是能按提示词生成对白与音效并保持口型同步。真实文件含 30 多个节点，本图为展开子图后的主干简化。",
    useCases: [
      "一条提示词同时生成画面与同步对白、音效的短视频",
      "需要人物开口说话且口型与语音对得上的内容创作",
      "体验低分辨率草稿加两倍潜空间放大的两阶段出片流程",
      "测试 Lightricks 官方相机控制 LoRA 的指定运镜效果"
    ],
    models: [
      { type: "Checkpoint", name: "ltx-2-19b-dev-fp8.safetensors", note: "LTX-2 19B dev 的 fp8 一体包，内含视频主模型与音频 VAE，放 models/checkpoints；另有完整精度 ltx-2-19b-dev 可选" },
      { type: "文本编码器", name: "gemma_3_12B_it_fp4_mixed.safetensors", note: "Gemma 3 12B fp4 混合量化文本编码器，由 LTXAVTextEncoderLoader 加载，放 models/text_encoders" },
      { type: "LoRA", name: "ltx-2-19b-distilled-lora-384.safetensors", note: "官方蒸馏加速 LoRA，强度 1，挂在第二阶段模型路径上" },
      { type: "潜空间放大模型", name: "ltx-2-spatial-upscaler-x2-1.0.safetensors", note: "2 倍空间潜空间放大器，放 models/latent_upscale_models" }
    ],
    graph: {
      nodes: [
        { id: "ckpt", title: "CheckpointLoaderSimple", cat: "load", x: 30, y: 40,
          widgets: ["ltx-2-19b-dev-fp8.safetensors"],
          inputs: [],
          outputs: [ { type: "MODEL" }, { type: "CLIP" }, { type: "VAE" } ],
          params: [
            { name: "ckpt_name", kind: "下拉选择", default: "ltx-2-19b-dev-fp8.safetensors", desc: "LTX-2 19B 的 fp8 一体包，一个文件同时提供视频扩散主模型与音频 VAE；显存充裕可换完整精度版。" }
          ],
          brief: "载入 LTX-2 19B fp8 一体包，同时提供视频模型与 VAE。",
          desc: "一个 checkpoint 同时封装视频扩散模型与音频 VAE，放进 models/checkpoints。VAE 输出供给潜空间放大器与分块解码器，MODEL 输出经模型侧包装后进入两个阶段的 guider。" },
        { id: "textenc", title: "LTXAVTextEncoderLoader", cat: "load", x: 30, y: 240,
          widgets: ["gemma_3_12B_it_fp4_mixed.safetensors", "ltx-2-19b-dev-fp8.safetensors"],
          inputs: [],
          outputs: [ { type: "CLIP" } ],
          params: [
            { name: "text_encoder", kind: "下拉选择", default: "gemma_3_12B_it_fp4_mixed.safetensors", desc: "Gemma 3 12B 的 fp4 混合量化文本编码器，LTX-2 能理解长提示词、时间线与对白的关键。" },
            { name: "ckpt_name", kind: "下拉选择", default: "ltx-2-19b-dev-fp8.safetensors", desc: "关联的 LTX-2 checkpoint，用于对齐编码器与主模型的组件版本，两个下拉框应指向配套文件。" }
          ],
          brief: "载入 Gemma 3 12B 文本编码器。",
          desc: "LTX-2 用 Gemma 3 12B 理解长提示词与对白，fp4 混合量化把显存压力压到可用范围。官方提示指南要求按时间描述事件动作、描述视觉细节、再描述需要出现的声音与对白。" },
        { id: "audiovae", title: "LTXVAudioVAELoader", cat: "load", x: 30, y: 450,
          widgets: ["ltx-2-19b-dev-fp8.safetensors"],
          inputs: [],
          outputs: [ { type: "VAE" } ],
          params: [
            { name: "ckpt_name", kind: "下拉选择", default: "ltx-2-19b-dev-fp8.safetensors", desc: "从该 LTX-2 checkpoint 中取出音频 VAE；断开这条音频链路整图就退化为无声视频。" }
          ],
          brief: "从 LTX-2 checkpoint 中取出音频 VAE。",
          desc: "音频链路的入口：一路供给 LTXVEmptyLatentAudio 生成音频潜空间，一路在末端供给 LTXVAudioVAEDecode 还原声音。想做无声视频时从这一路断开即可。" },
        { id: "upscaler", title: "LatentUpscaleModelLoader", cat: "load", x: 30, y: 640,
          widgets: ["ltx-2-spatial-upscaler-x2-1.0.safetensors"],
          inputs: [],
          outputs: [ { type: "LATENT_UPSCALE_MODEL" } ],
          params: [
            { name: "model_name", kind: "下拉选择", default: "ltx-2-spatial-upscaler-x2-1.0.safetensors", desc: "models/latent_upscale_models 目录中的 2 倍潜空间放大器，在潜空间维度直接放大，省一次像素级放大开销。" }
          ],
          brief: "载入 2 倍潜空间空间放大器。",
          desc: "它不是像素级放大器，而是在潜空间维度直接放大 2 倍，让第二阶段采样在高分辨率上继续去噪精修，从而省掉一次完整的像素放大开销。" },
        { id: "pos", title: "CLIPTextEncode", cat: "cond", x: 380, y: 40,
          widgets: ["A close-up of a cheerful girl puppet with curly auburn yarn hair and wide button eyes, holding a small red umbrella above her head. Rain falls gently around her. She looks upward and begins to sing with joy in English. Her fabric mouth opening and closing to a melodic tune. The camera holds steady as the rain sparkles against the soft lighting."],
          inputs: [ { name: "clip", type: "CLIP" } ],
          outputs: [ { type: "CONDITIONING" } ],
          params: [
            { name: "text", kind: "多行文本", default: "A close-up of a cheerful girl puppet with curly auburn yarn hair and wide button eyes, holding a small red umbrella above her head. Rain falls gently around her. She looks upward and begins to sing with joy in English. Her fabric mouth opening and closing to a melodic tune. The camera holds steady as the rain sparkles against the soft lighting.", desc: "正向提示词按三层写：随时间发生的事件动作、画面视觉细节、需要出现的声音与对白；事件按发生顺序写效果最好，明确写出唱的内容模型真的会生成歌声与口型。" }
          ],
          brief: "把含对白描述的正向提示词编码为条件。",
          desc: "源文件示例是一段唱着歌的毛线头发条女孩在雨中撑伞的完整描述，明确写出了要唱的内容。LTX-2 对随时间推进的动作与时序描述敏感，事件按发生顺序写效果最好。" },
        { id: "neg", title: "CLIPTextEncode", cat: "cond", x: 380, y: 290,
          widgets: ["blurry, low quality, still frame, watermark, subtitles"],
          inputs: [ { name: "clip", type: "CLIP" } ],
          outputs: [ { type: "CONDITIONING" } ],
          params: [
            { name: "text", kind: "多行文本", default: "blurry, low quality, still frame, watermark, subtitles", desc: "负向提示词压制模糊、静帧、水印与画面内字幕；LTX 系负向词保持精简即可，堆太多会压制画面表现力。" }
          ],
          brief: "把负向提示词编码为负向条件。",
          desc: "固定压制模糊、静帧、水印与字幕，与正向共用同一个 Gemma 编码器。LTX 系负向词保持精简即可，堆太多会压制画面表现力。" },
        { id: "cond", title: "LTXVConditioning", cat: "cond", x: 660, y: 40,
          widgets: ["24"],
          inputs: [ { name: "positive", type: "CONDITIONING" }, { name: "negative", type: "CONDITIONING" }, { name: "frame_rate", type: "FLOAT" } ],
          outputs: [ { type: "CONDITIONING" }, { type: "CONDITIONING" } ],
          params: [
            { name: "frame_rate", kind: "整数", default: "24", desc: "写入条件的目标帧率，让模型知道时间基准；必须与音频画布和 CreateVideo 的帧率完全一致，否则音画错位。" }
          ],
          brief: "把 24fps 帧率信息写进正负条件。",
          desc: "让模型在采样时知道目标时间基准，这是视频条件与图片条件的核心差别。源文件用两个常量节点分别提供 24 的整数与浮点版本，并特别注释两处帧率值必须相同。" },
        { id: "vidlatent", title: "EmptyLTXVLatentVideo", cat: "latent", x: 380, y: 570,
          widgets: ["640 x 360", "121"],
          inputs: [],
          outputs: [ { type: "LATENT" } ],
          params: [
            { name: "width", kind: "整数", default: "640", desc: "第一阶段画布宽度；源文件由 1280 x 720 缩小 0.5 倍读出，第二阶段再放大回去，宽高必须能被 64 整除。" },
            { name: "height", kind: "整数", default: "360", desc: "第一阶段画布高度；参数不合法不会报错而是静默取最接近的合法值。" },
            { name: "length", kind: "整数", default: "121", desc: "总帧数，必须为 8 的倍数加 1，24fps 下约 5 秒。" }
          ],
          brief: "生成第一阶段用的空视频潜空间画布。",
          desc: "源文件里宽高不是直接填写，而是由一个 1280 x 720 的 EmptyImage 经过 0.5 倍 lanczos 缩放后用 GetImageSize 读出，实际画布为 640 x 360，第二阶段再放大回 1280 x 720。长度 121 帧满足 8 的倍数加 1 约束，24fps 下约 5 秒。" },
        { id: "audlatent", title: "LTXVEmptyLatentAudio", cat: "latent", x: 380, y: 810,
          widgets: ["121", "24"],
          inputs: [ { name: "audio_vae", type: "VAE" } ],
          outputs: [ { type: "LATENT" } ],
          params: [
            { name: "length", kind: "整数", default: "121", desc: "音频潜空间的帧数，必须与视频画布完全一致，由音频 VAE 参与换算实现声画时间对齐。" },
            { name: "frame_rate", kind: "整数", default: "24", desc: "音频帧率，与条件及合成节点三处保持一致。" }
          ],
          brief: "按帧数 121 与帧率 24 生成等长的音频潜空间。",
          desc: "由音频 VAE 参与换算，让声音与画面在同一批潜空间里时间对齐，是实现口型同步与声画匹配的前提。帧数与帧率必须与视频画布完全一致。" },
        { id: "concat1", title: "LTXVConcatAVLatent", cat: "latent", x: 660, y: 570,
          widgets: [],
          inputs: [ { name: "video_latent", type: "LATENT" }, { name: "audio_latent", type: "LATENT" } ],
          outputs: [ { type: "LATENT" } ],
          brief: "把视频与音频潜空间拼成音画一体的 LATENT。",
          desc: "拼接后的潜空间交给第一阶段采样器联合去噪，这是 LTX-2 单模型同时生成画面与声音的结构基础。源文件在采样之后还会再分离、放大、再拼接，本图简化为入口拼接一次。" },
        { id: "guider1", title: "CFGGuider", cat: "sampler", x: 660, y: 300,
          widgets: ["4"],
          inputs: [ { name: "model", type: "MODEL" }, { name: "positive", type: "CONDITIONING" }, { name: "negative", type: "CONDITIONING" } ],
          outputs: [ { type: "GUIDER" } ],
          params: [
            { name: "cfg", kind: "浮点数", default: "4", desc: "第一阶段引导强度，LTX-2 第一阶段的质量档位；蒸馏 LoRA 只作用于第二阶段，这里仍用标准引导。" }
          ],
          brief: "以 cfg 4 包装模型与条件，输出第一阶段引导器。",
          desc: "源文件中它的模型路径上挂着一个被 bypass 的相机控制 LoRA（dolly left），启用后可以强迫镜头向左平移。cfg 4 是 LTX-2 第一阶段的质量档位，蒸馏 LoRA 只作用于第二阶段，因此这里仍用标准引导。" },
        { id: "stage1", title: "SamplerCustomAdvanced", cat: "sampler", x: 890, y: 40,
          widgets: [],
          inputs: [ { name: "noise", type: "NOISE" }, { name: "guider", type: "GUIDER" }, { name: "sampler", type: "SAMPLER" }, { name: "sigmas", type: "SIGMAS" }, { name: "latent_image", type: "LATENT" } ],
          outputs: [ { type: "LATENT" }, { type: "LATENT" } ],
          brief: "第一阶段采样：在 640 x 360 上完成构图与音画对齐。",
          desc: "latent_image 来自音画拼接后的潜空间。源文件中 noise 来自 RandomNoise（种子 10）、sampler 来自 KSamplerSelect（euler_ancestral）、sigmas 来自 LTXVScheduler（20 步、max_shift 2.05、base_shift 0.95、terminal 0.1），简化图省略了这四个辅助节点。此阶段占全程大部分耗时。" },
        { id: "upsampler", title: "LTXVLatentUpsampler", cat: "latent", x: 1100, y: 40,
          widgets: [],
          inputs: [ { name: "samples", type: "LATENT" }, { name: "upscale_model", type: "LATENT_UPSCALE_MODEL" }, { name: "vae", type: "VAE" } ],
          outputs: [ { type: "LATENT" } ],
          brief: "用专用模型把潜空间放大 2 倍到 1280 x 720。",
          desc: "放大不是简单插值，而是带着可继续去噪的结构进入第二阶段。源文件在它之前还有 LTXVSeparateAVLatent 与 LTXVCropGuides 两个节点，先分离音画再裁掉引导标记，简化图中直接从第一阶段输出接入。" },
        { id: "stage2", title: "SamplerCustomAdvanced", cat: "sampler", x: 1100, y: 280,
          widgets: [],
          inputs: [ { name: "noise", type: "NOISE" }, { name: "guider", type: "GUIDER" }, { name: "sampler", type: "SAMPLER" }, { name: "sigmas", type: "SIGMAS" }, { name: "latent_image", type: "LATENT" } ],
          outputs: [ { type: "LATENT" }, { type: "LATENT" } ],
          brief: "第二阶段精修：蒸馏 LoRA 加固定 sigma 快速收尾。",
          desc: "源文件中 sigmas 来自 ManualSigmas（固定 0.909375、0.725、0.421875、0 四个值，只走 3 步），guider 的 cfg 为 1，模型路径上挂着强度 1 的蒸馏 LoRA（ltx-2-19b-distilled-lora-384），这四个辅助节点在简化图中省略。蒸馏模型加固定 sigma 让精修几步内完成，是 LTX-2 提速的关键设计。" },
        { id: "decode", title: "VAEDecodeTiled", cat: "vae", x: 1320, y: 40,
          widgets: ["512", "64", "4096", "8"],
          inputs: [ { name: "samples", type: "LATENT" }, { name: "vae", type: "VAE" } ],
          outputs: [ { type: "IMAGE" } ],
          params: [
            { name: "tile_size", kind: "整数", default: "512", desc: "空间分块尺寸，分块解码显著降低显存峰值，对 121 帧长序列尤其重要。" },
            { name: "overlap", kind: "整数", default: "64", desc: "分块间重叠像素，消除块间接缝。" },
            { name: "temporal_size", kind: "整数", default: "4096", desc: "时间维分块大小，4096 相当于时间维不切分，显存吃紧时可调小。" },
            { name: "temporal_overlap", kind: "整数", default: "8", desc: "时间维分块重叠帧数，保证帧间过渡平滑。" }
          ],
          brief: "分块解码视频潜空间，控制显存峰值。",
          desc: "512 分块、64 重叠、4096 时间块、8 时间重叠。分块方式显著降低解码峰值显存，源文件里另有一个被 bypass 的普通 VAEDecode 备选。源文件中它的输入取自分离后的视频部分，简化图直接从第二阶段输出接入。" },
        { id: "audiodec", title: "LTXVAudioVAEDecode", cat: "audio", x: 1320, y: 240,
          widgets: [],
          inputs: [ { name: "samples", type: "LATENT" }, { name: "audio_vae", type: "VAE" } ],
          outputs: [ { type: "AUDIO" } ],
          brief: "把音频潜空间还原成 AUDIO。",
          desc: "音画一体生成的最后一步，输出的声音与画面天然对齐，可直接用于含对白与音效的成片。源文件中它接收的是第二阶段输出再分离出的音频部分，audio_vae 来自 LTXVAudioVAELoader。" },
        { id: "createvideo", title: "CreateVideo", cat: "video", x: 1520, y: 40,
          widgets: ["24"],
          inputs: [ { name: "images", type: "IMAGE" }, { name: "audio", type: "AUDIO" } ],
          outputs: [ { type: "VIDEO" } ],
          params: [
            { name: "fps", kind: "整数", default: "24", desc: "合成帧率，必须与条件里写入的 24 一致，否则音画错位；源文件用常量节点统一供给正是为了杜绝不一致。" }
          ],
          brief: "以 24fps 把画面与音频合成为 VIDEO 对象。",
          desc: "官方内置节点，替代了第三方 VHS_VideoCombine 的角色。fps 必须与条件里写入的 24 一致，否则音画会错位；源文件的 fps 由浮点常量节点统一供给，就是为了杜绝两处数值不一致。" },
        { id: "save", title: "SaveVideo", cat: "video", x: 1520, y: 250,
          widgets: ["video/LTX-2", "mp4", "auto"],
          inputs: [ { name: "video", type: "VIDEO" } ],
          outputs: [],
          params: [
            { name: "filename_prefix", kind: "文本", default: "video/LTX-2", desc: "输出文件命名前缀，含音轨的 MP4 可直接发布。" },
            { name: "format", kind: "下拉选择", default: "mp4", desc: "容器格式，明确选 mp4，兼容性最好。" },
            { name: "codec", kind: "下拉选择", default: "auto", desc: "编码器，auto 自动匹配；改格式只需改这里，上游连线不用动。" }
          ],
          brief: "把含音轨的 VIDEO 写出为 MP4。",
          desc: "前缀 video/LTX-2，格式明确选 mp4，编码 auto。含音轨的 MP4 可直接发布。想改输出格式只需改这里的下拉框，上游连线不用动。" }
      ],
      links: [
        { from: "ckpt", fromOut: 0, to: "guider1", toIn: "model" },
        { from: "ckpt", fromOut: 2, to: "upsampler", toIn: "vae" },
        { from: "ckpt", fromOut: 2, to: "decode", toIn: "vae" },
        { from: "textenc", fromOut: 0, to: "pos", toIn: "clip" },
        { from: "textenc", fromOut: 0, to: "neg", toIn: "clip" },
        { from: "audiovae", fromOut: 0, to: "audlatent", toIn: "audio_vae" },
        { from: "upscaler", fromOut: 0, to: "upsampler", toIn: "upscale_model" },
        { from: "pos", fromOut: 0, to: "cond", toIn: "positive" },
        { from: "neg", fromOut: 0, to: "cond", toIn: "negative" },
        { from: "cond", fromOut: 0, to: "guider1", toIn: "positive" },
        { from: "cond", fromOut: 1, to: "guider1", toIn: "negative" },
        { from: "vidlatent", fromOut: 0, to: "concat1", toIn: "video_latent" },
        { from: "audlatent", fromOut: 0, to: "concat1", toIn: "audio_latent" },
        { from: "concat1", fromOut: 0, to: "stage1", toIn: "latent_image" },
        { from: "guider1", fromOut: 0, to: "stage1", toIn: "guider" },
        { from: "stage1", fromOut: 0, to: "upsampler", toIn: "samples" },
        { from: "upsampler", fromOut: 0, to: "stage2", toIn: "latent_image" },
        { from: "stage2", fromOut: 0, to: "decode", toIn: "samples" },
        { from: "stage2", fromOut: 0, to: "audiodec", toIn: "samples" },
        { from: "decode", fromOut: 0, to: "createvideo", toIn: "images" },
        { from: "audiodec", fromOut: 0, to: "createvideo", toIn: "audio" },
        { from: "createvideo", fromOut: 0, to: "save", toIn: "video" }
      ]
    },
    stages: [
      { name: "模型加载", nodes: ["ckpt", "textenc", "audiovae", "upscaler"], desc: "fp8 一体包同时提供视频模型与音频 VAE，Gemma 3 文本编码器负责理解长提示词与对白，潜空间放大器为第二阶段待命。" },
      { name: "条件与音画潜空间", nodes: ["pos", "neg", "cond", "vidlatent", "audlatent", "concat1"], desc: "24fps 写入条件，640 x 360、121 帧的视频画布与等长音频画布分别就绪后拼成音画一体潜空间。" },
      { name: "第一阶段采样", nodes: ["guider1", "stage1"], desc: "cfg 4 引导下以 20 步 euler_ancestral 在低分辨率上完成构图与声画对齐，占全程主要耗时。" },
      { name: "放大与精修", nodes: ["upsampler", "stage2"], desc: "潜空间翻倍到 1280 x 720，第二阶段用蒸馏 LoRA 模型、cfg 1 与四个固定 sigma 快速精修。" },
      { name: "解码与合成", nodes: ["decode", "audiodec", "createvideo", "save"], desc: "画面分块解码、声音独立解码，CreateVideo 以 24fps 音画合成，SaveVideo 写出 MP4。" }
    ],
    nodeAnalysis: [
      { node: "ckpt", detail: "CheckpointLoaderSimple 加载 ltx-2-19b-dev-fp8.safetensors，这是 LTX-2 19B 的 fp8 一体包，一个文件同时提供视频扩散主模型与音频 VAE，放进 models/checkpoints。VAE 输出同时供给潜空间放大器与分块解码器，MODEL 输出经模型侧包装后进入两个阶段的 guider。显存充裕可以换完整精度的 ltx-2-19b-dev，但体积与显存要求高得多。" },
      { node: "textenc", detail: "LTXAVTextEncoderLoader 加载 Gemma 3 12B 的 fp4 混合量化文本编码器，这是 LTX-2 能理解长提示词、时间线与对白的关键，也是它区别于多数视频模型的地方。它的 CLIP 输出同时供给正向与负向两个 CLIPTextEncode。官方提示指南要求按三层写提示词：随时间发生的事件动作、画面视觉细节、需要出现的声音与对白。" },
      { node: "audiovae", detail: "LTXVAudioVAELoader 从同一个 ltx-2 checkpoint 里取出音频 VAE，一路供给 LTXVEmptyLatentAudio 生成音频潜空间，一路在末端供给 LTXVAudioVAEDecode 还原声音。音画共用一个模型联合采样是 LTX-2 最大的卖点，这个节点是整条音频链路的入口，断开它整条链路就退化为无声视频。" },
      { node: "upscaler", detail: "LatentUpscaleModelLoader 加载 ltx-2-spatial-upscaler-x2-1.0.safetensors，文件需放在 models/latent_upscale_models 目录。它不是像素级放大器，而是在潜空间维度直接放大 2 倍，让第二阶段采样在 1280 x 720 上继续去噪精修。相比像素放大再二次采样，这种做法省一次完整解码编码，画质连续性也更好。" },
      { node: "pos", detail: "正向 CLIPTextEncode 的文本来自子图入口的提示词控件，源文件示例是一段唱着歌的毛线头发条女孩在雨中撑伞的完整英文描述，明确写出了要唱的歌词内容，模型真的会生成对应的歌声与口型。LTX-2 对时序敏感，事件要按发生顺序写，镜头与光线单独交代。" },
      { node: "neg", detail: "负向提示词固定为 blurry、low quality、still frame、watermark、subtitles 等词，用于压制模糊、静帧、水印与画面内字幕。它与正向提示词共用同一个 Gemma 编码器，不需要额外的编码资源。LTX 系负向词保持精简即可，堆太多反而会压制画面表现力。" },
      { node: "cond", detail: "LTXVConditioning 把 24fps 的帧率信息写进正负条件，让模型在采样时知道目标时间基准，这是视频条件与图片条件的核心差别。它输出改写后的正负条件两路。源文件用 PrimitiveInt 与 PrimitiveFloat 两个常量节点分别提供 24 的整数与浮点版本，分别供给音频画布、条件与合成节点，并有注释强调两处帧率必须一致。" },
      { node: "vidlatent", detail: "EmptyLTXVLatentVideo 生成第一阶段用的空视频潜空间。源文件里宽高不是直接填的，而是由一个 1280 x 720 的 EmptyImage 经过 0.5 倍 lanczos 缩放后用 GetImageSize 读出，实际画布为 640 x 360，第二阶段再放大回 1280 x 720，这是两阶段提速的结构基础。长度 121 帧满足 8 的倍数加 1 约束。官方注释明确：宽高必须能被 64 整除、帧数必须是 8 的倍数加 1，参数不合法不会报错而是静默取最接近的合法值。" },
      { node: "audlatent", detail: "LTXVEmptyLatentAudio 依据帧数 121 与帧率 24 计算出与视频等长的音频潜空间画布，audio_vae 输入来自 LTXVAudioVAELoader。它让声音与画面在同一批潜空间里时间对齐，是实现口型同步与声画匹配的前提。它的帧数与帧率必须和视频画布完全一致，想做无声视频时从这一路断开即可。" },
      { node: "concat1", detail: "LTXVConcatAVLatent 把视频潜空间与音频潜空间拼接成一个音画一体的 LATENT，交给第一阶段采样器联合去噪。这是 LTX-2 单模型同时产出画面与声音的结构基础，也是本图与普通视频模板最大的差异点。源文件在采样之后还会经历分离、裁剪引导、放大、再拼接的循环，本简化图只保留入口这一次拼接。" },
      { node: "guider1", detail: "CFGGuider 以 cfg 4 包装模型与正负条件，输出 GUIDER 给第一阶段采样器。源文件中它的模型路径上挂着一个被 bypass 的相机控制 LoRA（ltx-2-19b-lora-camera-control-dolly-left，强度 1），Ctrl+B 启用后可以强迫镜头向左平移。cfg 4 是 LTX-2 第一阶段的质量档位，蒸馏 LoRA 只作用于第二阶段，因此这里用的是未经蒸馏的标准模型引导。" },
      { node: "stage1", detail: "SamplerCustomAdvanced 是第一阶段采样器，latent_image 来自音画拼接后的潜空间。源文件中它的 noise 来自 RandomNoise（种子 10）、sampler 来自 KSamplerSelect（euler_ancestral）、sigmas 来自 LTXVScheduler（20 步、max_shift 2.05、base_shift 0.95、stretch 开启、terminal 0.1），简化图省略了这四个辅助节点。此阶段在 640 x 360 低分辨率上完成构图与音画对齐，占全程大部分耗时。" },
      { node: "upsampler", detail: "LTXVLatentUpsampler 用专用放大模型把第一阶段输出的潜空间在空间维度放大 2 倍，从 640 x 360 到 1280 x 720。放大结果不是插值图，而是带着可继续去噪的结构，第二阶段在此之上精修即可。源文件在它之前还有 LTXVSeparateAVLatent 与 LTXVCropGuides 两个节点，先分离音画、裁掉引导标记再放大视频部分，简化图中直接从第一阶段输出接入。" },
      { node: "stage2", detail: "第二阶段 SamplerCustomAdvanced 在放大后的 1280 x 720 潜空间上做快速精修。源文件中 sigmas 来自 ManualSigmas（固定 0.909375、0.725、0.421875、0 四个值，只走 3 步）、guider 的 cfg 为 1、模型路径上挂着强度 1 的蒸馏 LoRA（ltx-2-19b-distilled-lora-384），噪声为固定种子 0 的 RandomNoise，这四个辅助节点在简化图中省略。蒸馏模型加固定 sigma 让精修几步内完成，是 LTX-2 兼顾速度与画质的关键设计。" },
      { node: "decode", detail: "VAEDecodeTiled 以 512 分块、64 重叠、4096 时间块、8 时间重叠把视频潜空间解码成像素帧，分块方式显著降低解码峰值显存，对 121 帧这类长序列尤其重要。源文件里另有一个被 bypass 的普通 VAEDecode 备选。源文件中它的输入取自分离后的视频部分，简化图直接从第二阶段输出接入。" },
      { node: "audiodec", detail: "LTXVAudioVAEDecode 把音频潜空间还原成 AUDIO，audio_vae 来自 LTXVAudioVAELoader。这是音画一体生成的最后一步，输出的声音与画面天然对齐，包含提示词要求的对白、歌声与音效，可直接发布。源文件中它接收的是第二阶段输出再分离出的音频部分，想检查音频效果可以临时接一个预览节点。" },
      { node: "createvideo", detail: "CreateVideo 把解码出的画面帧与音频以 24fps 合成为 VIDEO 对象，images 来自 VAEDecodeTiled，audio 来自 LTXVAudioVAEDecode。与 Wan、混元等新官方模板一样，这里用内置节点替代了第三方 VHS_VideoCombine 的角色。fps 必须与条件里写入的 24 一致，源文件用同一个浮点常量同时喂给条件与合成节点，就是为了杜绝两处数值不一致导致音画错位。" },
      { node: "save", detail: "SaveVideo 把 VIDEO 写出为 MP4，前缀 video/LTX-2，格式明确选 mp4、编码 auto。含音轨的 MP4 可直接发布到社交平台。想改输出格式或编码只需改这里的下拉框，不需要动上游任何连线，输出位于 output 目录并自动编号。" }
    ],
    flow: [
      "① CheckpointLoaderSimple 载入 ltx-2-19b-dev-fp8，同时提供视频主模型与音频 VAE。",
      "② LTXAVTextEncoderLoader 载入 Gemma 3 12B 编码器，正负提示词分别编码。",
      "③ LTXVConditioning 把 24fps 写入条件，视频画布（约 640 x 360、121 帧）与等长音频画布分别生成后由 LTXVConcatAVLatent 拼成音画一体潜空间。",
      "④ CFGGuider 以 cfg 4 引导 SamplerCustomAdvanced 用 20 步 euler_ancestral 完成第一阶段去噪。",
      "⑤ LTXVLatentUpsampler 用专用模型把潜空间放大 2 倍到 1280 x 720。",
      "⑥ 第二阶段 SamplerCustomAdvanced 以蒸馏 LoRA 模型、cfg 1 与 ManualSigmas 的四个固定 sigma 快速精修。",
      "⑦ VAEDecodeTiled 解码画面、LTXVAudioVAEDecode 解码声音，CreateVideo 以 24fps 音画合成，SaveVideo 写出 MP4。"
    ],
    params: [
      { name: "width / height", value: "1280 x 720", desc: "最终输出分辨率；第一阶段实际在 640 x 360 采样。宽高必须能被 64 整除，官方称显存强悍可试 1920 x 1088。" },
      { name: "frame_count", value: "121", desc: "帧数必须为 8 的倍数加 1，24fps 下约 5 秒；参数不合法时流程静默取最接近的合法值。" },
      { name: "stage1 steps / cfg", value: "20 / 4", desc: "LTXVScheduler 20 步、max_shift 2.05、base_shift 0.95、terminal 0.1；第一阶段 CFGGuider 为 4。" },
      { name: "stage2 sigmas", value: "0.909375, 0.725, 0.421875, 0", desc: "ManualSigmas 固定四个 sigma（约 3 步），配合 cfg 1 与蒸馏模型完成精修。" },
      { name: "sampler", value: "euler_ancestral", desc: "两阶段共用的采样器选择。" },
      { name: "distilled lora", value: "1", desc: "蒸馏 LoRA 强度 1，只挂在第二阶段模型路径上负责提速。" },
      { name: "fps", value: "24", desc: "条件、音频画布与 CreateVideo 三处必须一致，源文件用常量节点统一供给。" },
      { name: "format", value: "mp4", desc: "SaveVideo 输出格式，编码 auto。" }
    ],
    tips: [
      "宽高必须能被 64 整除、帧数必须是 8 的倍数加 1；参数不合法不会报错而是静默取最近合法值，画面尺寸突变时先检查这里。",
      "默认输出 720p，显卡强悍可把子图入口的宽高改成 1920 x 1088 冲击 1080p，两阶段结构不变。",
      "提示词按三层写：随时间发生的事件与动作、画面视觉细节、需要出现的声音与对白，LTX-2 会真的把对白和歌声生成出来。",
      "相机控制 LoRA（dolly left 等）默认 bypass，强度设 1 启用即可指定运镜方向，Lightricks 提供了一整套方向系列可替换。",
      "想要无声视频从 LTXVEmptyLatentAudio 一路断开即可；反之要有声必须保留音频 VAE 到 CreateVideo 的完整链路，且三处帧率必须一致。"
    ],
    notice: "源文件是新版子图格式，全部节点封装在名为 Text to Video (LTX 2.0) 的子图内；本图为展开子图后的主干简化，省略了分离音画、裁剪引导、ManualSigmas、随机噪声等辅助节点与全部 MarkdownNote，被省略处的真实连线上文均在节点说明中注明。"
  });

  // ---------- 24. 混元视频 1.5 文生视频 ----------
  window.COMFY_DATA.workflows.push({
    id: "hunyuan-t2v",
    name: "混元视频 1.5 文生视频",
    category: "视频生成",
    tags: ["混元", "HunyuanVideo 1.5", "官方模板", "文生视频"],
    difficulty: 3,
    source: "ComfyUI 官方模板库（真实源文件 hunyuan-t2v.json，含 1080p 超分分支）",
    summary: "这是腾讯混元视频 1.5 的 720p 文生视频官方模板：DualCLIPLoader 同时载入 Qwen2.5-VL 7B 与 ByT5 双文本编码器，EmptyHunyuanVideo15Latent 铺出 1280 x 720、121 帧画布，SamplerCustomAdvanced 以 20 步 euler 完成约 5 秒视频采样，最后经 CreateVideo 与 SaveVideo 输出 H.264 MP4。模型链上挂了一个默认 bypass 的 EasyCache 加速开关，另有一整套 1080p 超分二段采样分支同样处于 bypass。真实文件共 40 多个节点，本图只保留默认启用的主干。",
    useCases: [
      "开箱即用的 720p 国产开源文生视频基线体验",
      "学习混元 1.5 双文本编码器架构的连线方式",
      "启用 1080p 超分分支验证潜空间放大加二段采样的画质收益",
      "用 EasyCache 对比推理加速与画质之间的取舍"
    ],
    models: [
      { type: "Diffusion 模型", name: "hunyuanvideo1.5_720p_t2v_fp16.safetensors", note: "混元视频 1.5 的 720p 文生视频模型，fp16；显存紧张可把 weight_dtype 改为 fp8_e4m3fn" },
      { type: "文本编码器", name: "qwen_2.5_vl_7b_fp8_scaled.safetensors", note: "Qwen2.5-VL 7B fp8 量化版，双编码器组合中负责语义理解的一路" },
      { type: "文本编码器", name: "byt5_small_glyphxl_fp16.safetensors", note: "ByT5 小型编码器，负责字形与画面内文字渲染细节" },
      { type: "VAE", name: "hunyuanvideo15_vae_fp16.safetensors", note: "混元 1.5 专用视频 VAE，文件内输出四路分发" },
      { type: "超分模型（bypass）", name: "hunyuanvideo1.5_1080p_sr_distilled_fp16.safetensors", note: "1080p 超分分支的 8 步蒸馏模型，随分支整体处于 bypass" },
      { type: "潜空间放大模型（bypass）", name: "hunyuanvideo15_latent_upsampler_1080p.safetensors", note: "1080p 潜空间放大器，放 models/latent_upscale_models，随超分分支 bypass" }
    ],
    graph: {
      nodes: [
        { id: "unet", title: "UNETLoader", cat: "load", x: 30, y: 40,
          widgets: ["hunyuanvideo1.5_720p_t2v_fp16.safetensors", "default"],
          inputs: [],
          outputs: [ { type: "MODEL" } ],
          params: [
            { name: "unet_name", kind: "下拉选择", default: "hunyuanvideo1.5_720p_t2v_fp16.safetensors", desc: "混元视频 1.5 的 720p 文生视频模型；显存不足遇 OOM 时优先把 weight_dtype 改为 fp8 量化选项。" },
            { name: "weight_dtype", kind: "下拉选择", default: "default", desc: "按文件精度加载；改 fp8_e4m3fn 是官方注释给出的第一省显存手段。" }
          ],
          brief: "载入混元视频 1.5 的 720p 文生视频模型。",
          desc: "官方注释提示：显存不足遇到 OOM 时，把 weight_dtype 从 default 改为 fp8 量化选项可显著降低占用。文件内另有被 bypass 的 1080p 超分蒸馏模型 hunyuanvideo1.5_1080p_sr_distilled_fp16，属超分分支专用。" },
        { id: "clip", title: "DualCLIPLoader", cat: "load", x: 30, y: 240,
          widgets: ["qwen_2.5_vl_7b_fp8_scaled.safetensors", "byt5_small_glyphxl_fp16.safetensors", "hunyuan_video_15"],
          inputs: [],
          outputs: [ { type: "CLIP" } ],
          params: [
            { name: "clip_name1", kind: "下拉选择", default: "qwen_2.5_vl_7b_fp8_scaled.safetensors", desc: "Qwen2.5-VL 7B fp8 量化版，双编码器中负责语义理解的一路。" },
            { name: "clip_name2", kind: "下拉选择", default: "byt5_small_glyphxl_fp16.safetensors", desc: "ByT5 小型编码器，负责字形与画面内文字渲染细节。" },
            { name: "type", kind: "下拉选择", default: "hunyuan_video_15", desc: "编码器组合用途类型，必须选 hunyuan_video_15，缺任一文件节点会报红。" }
          ],
          brief: "一次载入 Qwen2.5-VL 与 ByT5 双文本编码器。",
          desc: "Qwen2.5-VL 7B 的 fp8 量化版负责语义理解，ByT5 small glyphxl 负责字形与画面内文字渲染，类型选 hunyuan_video_15。双编码器是混元 1.5 的架构特色，缺任一文件节点都会报红。" },
        { id: "vae", title: "VAELoader", cat: "load", x: 30, y: 450,
          widgets: ["hunyuanvideo15_vae_fp16.safetensors"],
          inputs: [],
          outputs: [ { type: "VAE" } ],
          params: [
            { name: "vae_name", kind: "下拉选择", default: "hunyuanvideo15_vae_fp16.safetensors", desc: "混元 1.5 专用视频 VAE，为视频压缩率专门设计；与其他系 VAE 混用会解码失败或色彩异常。" }
          ],
          brief: "载入混元 1.5 专用视频 VAE。",
          desc: "源文件里这一个输出分出四路：主干 VAEDecode、超分分支的 VAEDecode 与 VAEDecodeTiled、以及另一个 bypass 的分块解码节点。混元 VAE 为视频压缩率专门设计，不要与其他系 VAE 混用。" },
        { id: "cache", title: "EasyCache", cat: "model", x: 380, y: 40,
          widgets: ["0.2", "0.15", "0.95"],
          inputs: [ { name: "model", type: "MODEL" } ],
          outputs: [ { type: "MODEL" } ],
          params: [
            { name: "reuse_threshold", kind: "浮点数", default: "0.2", desc: "步长复用的判定阈值，越高复用越多、越省时也越损画质。" },
            { name: "start_percent", kind: "浮点数", default: "0.15", desc: "加速生效区间的起点占比。" },
            { name: "end_percent", kind: "浮点数", default: "0.95", desc: "加速生效区间的终点占比，收尾阶段不复用以保住细节。" }
          ],
          brief: "推理加速开关，默认 bypass，Ctrl+B 启用。",
          desc: "通过在去噪过程中复用相似步长的计算来提速，三个数值参数控制复用判定的阈值。官方注释明确说明提速会牺牲一部分画质，因此模板默认关闭，模型输出在 bypass 状态下直通下游。" },
        { id: "pos", title: "CLIPTextEncode", cat: "cond", x: 380, y: 260,
          widgets: ["A paper airplane released from the top of a skyscraper, gliding through urban canyons, crossing traffic, flying over streets, spiraling upward between buildings. The camera follows the paper airplane perspective, shooting cityscape in first-person POV, finally flying toward the sunset, disappearing in golden light. Creative camera movement, free perspective, dreamlike colors."],
          inputs: [ { name: "clip", type: "CLIP" } ],
          outputs: [ { type: "CONDITIONING" } ],
          params: [
            { name: "text", kind: "多行文本", default: "A paper airplane released from the top of a skyscraper, gliding through urban canyons, crossing traffic, flying over streets, spiraling upward between buildings. The camera follows the paper airplane perspective, shooting cityscape in first-person POV, finally flying toward the sunset, disappearing in golden light. Creative camera movement, free perspective, dreamlike colors.", desc: "运镜叙事型正向提示词；明确写镜头跟随与 POV 视角，混元 1.5 对运镜描述友好，事件按发生顺序写。" }
          ],
          brief: "把运镜叙事型正向提示词编码为条件。",
          desc: "示例描写一架纸飞机从摩天楼顶起飞、穿越城市峡谷、第一视角飞向夕阳的完整运镜故事，突出镜头运动与色彩氛围，符合混元 1.5 对运镜描述友好的特点。输出条件同时供给主干 guider 与被 bypass 的超分分支。" },
        { id: "neg", title: "CLIPTextEncode", cat: "cond", x: 380, y: 500,
          widgets: ["（留空）"],
          inputs: [ { name: "clip", type: "CLIP" } ],
          outputs: [ { type: "CONDITIONING" } ],
          params: [
            { name: "text", kind: "多行文本", default: "（留空）", desc: "本模板有意留空：混元 1.5 对负向词依赖较低，cfg 6 标准引导即可稳定出片；想压制特定瑕疵时再自行少量补充。" }
          ],
          brief: "负向提示词在本模板中留空。",
          desc: "混元 1.5 对负向词依赖较低，配合 cfg 6 的标准引导即可出片，这与 Wan 模板写一长串中文负向词的做法形成对比。留空不影响运行，想压制特定瑕疵时可自行补充。" },
        { id: "latent", title: "EmptyHunyuanVideo15Latent", cat: "latent", x: 380, y: 720,
          widgets: ["1280 x 720", "121", "1"],
          inputs: [],
          outputs: [ { type: "LATENT" } ],
          params: [
            { name: "width", kind: "整数", default: "1280", desc: "画布宽度，混元 1.5 的 720p 档位原生尺寸，降到 480p 档可明显省显存。" },
            { name: "height", kind: "整数", default: "720", desc: "画布高度，建议保持 16 比 9。" },
            { name: "length", kind: "整数", default: "121", desc: "生成帧数，24fps 下约 5 秒，改时长直接改此值。" },
            { name: "batch_size", kind: "整数", default: "1", desc: "视频采样显存消耗大，保持 1。" }
          ],
          brief: "生成 1280 x 720、121 帧的空视频潜空间。",
          desc: "混元专用节点，内部按混元 VAE 的压缩率换算潜空间形状，不能用普通 Empty Latent Image 替代。121 帧在 24fps 下约 5 秒，改时长就改帧数，分辨率建议保持 16 比 9。" },
        { id: "shift", title: "ModelSamplingSD3", cat: "model", x: 660, y: 40,
          widgets: ["7"],
          inputs: [ { name: "model", type: "MODEL" } ],
          outputs: [ { type: "MODEL" } ],
          params: [
            { name: "shift", kind: "整数", default: "7", desc: "噪声调度偏移；官方 720p 文生视频原始值为 9，模板取 7 换取速度，二者都在可用甜点区间。" }
          ],
          brief: "以 shift 7 调整采样调度分布。",
          desc: "把更多去噪预算留给高噪声阶段。混元官方原始设置中 720p 文生视频的 shift 为 9，模板默认取 7 换取速度，二者都在可用的甜点区间。" },
        { id: "guider", title: "CFGGuider", cat: "sampler", x: 660, y: 230,
          widgets: ["6"],
          inputs: [ { name: "model", type: "MODEL" }, { name: "positive", type: "CONDITIONING" }, { name: "negative", type: "CONDITIONING" } ],
          outputs: [ { type: "GUIDER" } ],
          params: [
            { name: "cfg", kind: "浮点数", default: "6", desc: "混元官方推荐的标准引导强度；视频模型对高 cfg 敏感，盲目上调容易过曝与闪烁。" }
          ],
          brief: "以 cfg 6 组合模型与正负条件。",
          desc: "对应混元官方推荐的标准 cfg 值。它接收经 EasyCache 与 ModelSamplingSD3 两级包装后的模型，输出 GUIDER 给 SamplerCustomAdvanced。视频模型对高 cfg 敏感，盲目上调容易过曝。" },
        { id: "scheduler", title: "BasicScheduler", cat: "sampler", x: 660, y: 430,
          widgets: ["simple", "20", "1"],
          inputs: [ { name: "model", type: "MODEL" } ],
          outputs: [ { type: "SIGMAS" } ],
          params: [
            { name: "scheduler", kind: "下拉选择", default: "simple", desc: "simple 调度配 euler 是混元 1.5 模板推荐的稳妥组合。",
              options: [["simple", "简化日程，官方默认"], ["normal", "线性计划，可对比"], ["karras", "过渡更平滑，可尝试"]] },
            { name: "steps", kind: "整数", default: "20", desc: "官方原始设置 50 步，模板为速度降到 20；追质量可改回 50 并把等待时间纳入预期。" },
            { name: "denoise", kind: "浮点数", default: "1", desc: "从纯噪声完整生成，保持 1。" }
          ],
          brief: "simple 调度生成 20 步 sigma 序列。",
          desc: "denoise 1 表示从纯噪声完整生成。混元官方原始设置是 50 步，模板默认 20 步以缩短等待，官方注释的对照表里可查到各档位原始参数。模型输入同样来自 EasyCache 输出。" },
        { id: "noise", title: "RandomNoise", cat: "sampler", x: 660, y: 630,
          widgets: ["887963123424675", "fixed"],
          inputs: [],
          outputs: [ { type: "NOISE" } ],
          params: [
            { name: "noise_seed", kind: "整数", default: "887963123424675", desc: "初始噪声种子，模板默认固定值，可复现同一段视频方便对照调参。" },
            { name: "control_after_generate", kind: "下拉选择", default: "fixed", desc: "种子控制模式；想抽卡把 fixed 改成 randomize。",
              options: [["fixed", "保持不变，可复现"], ["randomize", "每次运行换随机种子"], ["increment", "每次加一"]] }
          ],
          brief: "提供初始噪声，种子固定可复现。",
          desc: "种子 887963123424675 且控制模式为 fixed，模板默认可复现同一段视频，方便对照调参。想抽卡把控制改成 randomize 即可，它与调度器、采样器选择器、guider 一起构成采样器的五路输入。" },
        { id: "ksselect", title: "KSamplerSelect", cat: "sampler", x: 660, y: 790,
          widgets: ["euler"],
          inputs: [],
          outputs: [ { type: "SAMPLER" } ],
          params: [
            { name: "sampler_name", kind: "下拉选择", default: "euler", desc: "采样算法选择，euler 配 simple 调度是模板推荐的均衡组合。",
              options: [["euler", "朴素稳定，官方默认"], ["uni_pc", "低步数表现好，可尝试"], ["dpmpp_2m", "更锐利，非官方组合"]] }
          ],
          brief: "选择 euler 采样器。",
          desc: "euler 配 simple 调度是混元 1.5 模板推荐的稳妥组合。源文件中超分分支另有一个相同的 KSamplerSelect，两个分支各自独立选参互不影响。" },
        { id: "scustom", title: "SamplerCustomAdvanced", cat: "sampler", x: 900, y: 40,
          widgets: [],
          inputs: [ { name: "noise", type: "NOISE" }, { name: "guider", type: "GUIDER" }, { name: "sampler", type: "SAMPLER" }, { name: "sigmas", type: "SIGMAS" }, { name: "latent_image", type: "LATENT" } ],
          outputs: [ { type: "LATENT" }, { type: "LATENT" } ],
          brief: "集齐五路输入执行 20 步视频采样。",
          desc: "输出 LATENT 在源文件中一分三：主干 VAEDecode、被 bypass 的潜空间放大器入口与被 bypass 的 VAEDecodeTiled。这种自定义采样器拆法虽然节点多，但每一支路都可以单独替换或 bypass，是官方模板的标准写法。" },
        { id: "decode", title: "VAEDecode", cat: "vae", x: 1150, y: 40,
          widgets: [],
          inputs: [ { name: "samples", type: "LATENT" }, { name: "vae", type: "VAE" } ],
          outputs: [ { type: "IMAGE" } ],
          brief: "把 121 帧潜空间整段解码成像素帧。",
          desc: "旁边的官方注释提示解码太慢时可改用分块解码，源文件已备好处于 bypass 的 VAEDecodeTiled。视频解码的显存峰值与帧数成正比，121 帧 720p 对小显存机器是不小的压力点。" },
        { id: "createvideo", title: "CreateVideo", cat: "video", x: 1400, y: 40,
          widgets: ["24"],
          inputs: [ { name: "images", type: "IMAGE" } ],
          outputs: [ { type: "VIDEO" } ],
          params: [
            { name: "fps", kind: "整数", default: "24", desc: "合成帧率，与混元训练设定一致；帧率改动只影响播放速度不影响动作流畅度。" }
          ],
          brief: "以 24fps 把帧序列组装成 VIDEO 对象。",
          desc: "与另外两个视频官方模板一致，新版已改用内置 CreateVideo 加 SaveVideo 组合，不再依赖第三方 VHS_VideoCombine。音频输入留空即无声视频，帧率改动只影响播放速度不影响流畅度。" },
        { id: "save", title: "SaveVideo", cat: "video", x: 1400, y: 250,
          widgets: ["video/hunyuan_video_1.5", "auto", "h264"],
          inputs: [ { name: "video", type: "VIDEO" } ],
          outputs: [],
          params: [
            { name: "filename_prefix", kind: "文本", default: "video/hunyuan_video_1.5", desc: "输出文件命名前缀；文件内另一个带 sr 前缀的 SaveVideo 属于超分分支，处于 bypass。" },
            { name: "format", kind: "下拉选择", default: "auto", desc: "容器格式，auto 自动选择，实测输出 MP4。" },
            { name: "codec", kind: "下拉选择", default: "h264", desc: "编码器明确选 h264，兼容性最好的 H.264 MP4。" }
          ],
          brief: "以 h264 编码写出 MP4 文件。",
          desc: "前缀 video/hunyuan_video_1.5，格式 auto、编码明确选 h264，兼容性最好。文件内另一个 SaveVideo（前缀带 sr）属于超分分支，处于 bypass 状态。" }
      ],
      links: [
        { from: "unet", fromOut: 0, to: "cache", toIn: "model" },
        { from: "cache", fromOut: 0, to: "shift", toIn: "model" },
        { from: "cache", fromOut: 0, to: "scheduler", toIn: "model" },
        { from: "clip", fromOut: 0, to: "pos", toIn: "clip" },
        { from: "clip", fromOut: 0, to: "neg", toIn: "clip" },
        { from: "vae", fromOut: 0, to: "decode", toIn: "vae" },
        { from: "pos", fromOut: 0, to: "guider", toIn: "positive" },
        { from: "neg", fromOut: 0, to: "guider", toIn: "negative" },
        { from: "shift", fromOut: 0, to: "guider", toIn: "model" },
        { from: "scheduler", fromOut: 0, to: "scustom", toIn: "sigmas" },
        { from: "guider", fromOut: 0, to: "scustom", toIn: "guider" },
        { from: "noise", fromOut: 0, to: "scustom", toIn: "noise" },
        { from: "ksselect", fromOut: 0, to: "scustom", toIn: "sampler" },
        { from: "latent", fromOut: 0, to: "scustom", toIn: "latent_image" },
        { from: "scustom", fromOut: 0, to: "decode", toIn: "samples" },
        { from: "decode", fromOut: 0, to: "createvideo", toIn: "images" },
        { from: "createvideo", fromOut: 0, to: "save", toIn: "video" }
      ]
    },
    stages: [
      { name: "模型加载", nodes: ["unet", "clip", "vae"], desc: "720p 主模型、Qwen2.5-VL 加 ByT5 双编码器与混元专用 VAE 就位，超分分支的两套模型在文件内随分支一起 bypass。" },
      { name: "加速开关", nodes: ["cache"], desc: "EasyCache 挂在模型链最前端，默认 bypass 直通，启用后通过复用相似步长计算换取速度。" },
      { name: "条件与画布", nodes: ["pos", "neg", "latent"], desc: "运镜叙事型正向提示词编码为条件，负向留空，混元专用节点铺出 1280 x 720、121 帧画布。" },
      { name: "采样集群", nodes: ["shift", "guider", "scheduler", "noise", "ksselect", "scustom"], desc: "shift 7 调整调度，cfg 6 引导，simple 调度 20 步 sigma，固定种子噪声与 euler 采样器在 SamplerCustomAdvanced 汇合完成去噪。" },
      { name: "解码与输出", nodes: ["decode", "createvideo", "save"], desc: "VAE 整段解码 121 帧，CreateVideo 以 24fps 合成，SaveVideo 以 h264 写出 MP4。" }
    ],
    nodeAnalysis: [
      { node: "unet", detail: "UNETLoader 加载 hunyuanvideo1.5_720p_t2v_fp16.safetensors，混元视频 1.5 的 720p 文生视频模型。官方注释提示显存不足遇到 OOM 时可把 weight_dtype 改为 fp8 量化选项，这是最优先的省显存手段。文件内另有被 bypass 的 1080p 超分蒸馏模型 hunyuanvideo1.5_1080p_sr_distilled_fp16，属于超分分支专用，启用超分分支前要先下载它。" },
      { node: "clip", detail: "DualCLIPLoader 一次加载两个文本编码器：Qwen2.5-VL 7B 的 fp8 量化版负责语义理解，ByT5 small glyphxl 负责字形与画面内文字渲染，类型选 hunyuan_video_15。双编码器分工是混元 1.5 的架构特色，中文理解与画面内生成文字的能力都来自这里。两个文件缺任何一个节点都会报红，fp8 量化让 7B 级编码器的显存压力可控。" },
      { node: "vae", detail: "VAELoader 加载 hunyuanvideo15_vae_fp16.safetensors，这一个输出在源文件里分出四路：主干 VAEDecode、超分分支的 VAEDecodeTiled 与 VAEDecode、以及另一个 bypass 的分块解码节点。混元 1.5 的 VAE 为视频压缩率专门设计，换用其他系 VAE 会导致解码失败或色彩异常。本简化图只保留主干那一路。" },
      { node: "cache", detail: "EasyCache 是混元官方模板附带的推理加速开关，原理是在去噪过程中识别变化很小的步长并复用此前的计算，三个数值参数控制复用判定的阈值与范围。注意它在本模板默认处于 bypass 状态，需要 Ctrl+B 手动启用，官方注释明确说明提速会牺牲一部分画质。bypass 时模型信号直通下游，因此是否启用不影响连线路径。" },
      { node: "pos", detail: "正向 CLIPTextEncode 的示例提示词描写一架纸飞机从摩天楼顶起飞、穿越城市峡谷车流、以第一视角螺旋上升飞向夕阳的运镜故事，明确写了镜头跟随与 POV 视角，符合混元 1.5 对运镜描述友好的特点。输出条件同时供给主 guider 与被 bypass 的超分分支两个 guider，因此启用超分分支时提示词条件自动复用。" },
      { node: "neg", detail: "负向提示词在本模板中留空，这是官方有意为之：混元 1.5 对负向词依赖较低，配合 cfg 6 的标准引导即可稳定出片，与 Wan 模板写一长串中文负向词的做法形成鲜明对比。留空不影响运行，实际使用中想压制特定瑕疵（如字幕、水印）时可以自行补充少量负向词。" },
      { node: "latent", detail: "EmptyHunyuanVideo15Latent 生成 1280 x 720、121 帧的空视频潜空间，24fps 下约 5 秒。它是混元专用节点，内部按混元 VAE 的压缩率换算潜空间形状，不能用普通 Empty Latent Image 替代，否则采样形状不匹配直接报错。改时长就改帧数，改分辨率建议保持 16 比 9 并参考官方注释里的 480p 与 720p 档位。" },
      { node: "shift", detail: "ModelSamplingSD3 以 shift 7 调整采样噪声调度分布，把更多去噪预算分配给高噪声阶段以稳住大动态画面结构。混元官方注释的对照表中 720p 文生视频原始 shift 为 9，模板默认取 7，属于速度与质量之间的折中。它位于 EasyCache 与 CFGGuider 之间，是模型侧包装的最后一步。" },
      { node: "guider", detail: "CFGGuider 以 cfg 6 组合模型与正负条件输出 GUIDER，对应混元官方推荐的标准引导强度。它接收经 EasyCache 与 ModelSamplingSD3 两级包装后的模型，输出给 SamplerCustomAdvanced。视频模型对高 cfg 敏感，盲目上调会出现过曝与闪烁，追求提示词服从度时应小幅试探。" },
      { node: "scheduler", detail: "BasicScheduler 用 simple 调度生成 20 步 sigma 序列，denoise 1 表示从纯噪声完整生成。混元官方原始设置是 50 步，模板注释明确说明 50 步太慢所以默认降到 20，并给出各档位原始参数对照表（例如 720p 文生视频原始为 cfg 6、shift 9、50 步）。想追质量可改回 50 步并把等待时间纳入预期。" },
      { node: "noise", detail: "RandomNoise 提供初始噪声，种子 887963123424675 且控制模式为 fixed，意味着模板默认可复现同一段视频，方便逐项对比调参效果。想抽卡时把控制改成 randomize 即可。它与调度器、采样器选择器、guider、空潜空间一起构成 SamplerCustomAdvanced 的五路输入，缺一路都会报错。" },
      { node: "ksselect", detail: "KSamplerSelect 选 euler 采样器输出 SAMPLER 对象。euler 配 simple 调度是混元 1.5 模板推荐的稳妥组合，速度与稳定性均衡。源文件中超分分支另有一个相同的 KSamplerSelect 供二段采样使用，两个分支各自独立选参互不影响，这也体现了自定义采样器拆分的灵活性。" },
      { node: "scustom", detail: "SamplerCustomAdvanced 集齐 noise、guider、sampler、sigmas、latent_image 五路输入执行 20 步采样，输出 LATENT 在源文件中一分三：主干 VAEDecode、被 bypass 的潜空间放大器入口与被 bypass 的 VAEDecodeTiled。这种拆分写法虽然节点比 KSampler 多，但每条支路都可以单独替换或 bypass，超分分支正是复用这一输出接入的。" },
      { node: "decode", detail: "VAEDecode 把 121 帧潜空间整段解码成像素帧，旁边的官方注释提示解码太慢时可以改用分块解码，源文件已备好处于 bypass 的 VAEDecodeTiled。视频解码的显存峰值与帧数成正比，121 帧 720p 是 8GB 级显存机器的常见压力点，爆显存时优先换分块解码而不是降帧数。" },
      { node: "createvideo", detail: "CreateVideo 以 24fps 把帧序列组装成 VIDEO 对象，音频输入留空即无声视频。与 Wan、LTX-2 等新版官方模板一致，这里用内置 CreateVideo 加 SaveVideo 组合替代了第三方 VHS_VideoCombine 的角色。帧率改动只影响播放速度不影响动作流畅度，24fps 与混元训练设定一致，保持默认即可。" },
      { node: "save", detail: "SaveVideo 前缀 video/hunyuan_video_1.5，格式 auto、编码明确选 h264，输出兼容性最好的 H.264 MP4。文件内另一个 SaveVideo（前缀带 sr）属于超分分支，处于 bypass。想换更高画质编码可在下拉框中调整，输出位于 output 目录并自动编号。" }
    ],
    flow: [
      "① DualCLIPLoader 同时载入 Qwen2.5-VL 7B 与 ByT5 双文本编码器，UNETLoader 载入 720p 主模型，VAELoader 载入专用 VAE。",
      "② 模型先经过 EasyCache（默认 bypass 直通），再分两路：一路经 ModelSamplingSD3 shift 7 进入 CFGGuider，一路进入 BasicScheduler 生成 20 步 sigma。",
      "③ 正向提示词编码为条件（负向留空），EmptyHunyuanVideo15Latent 铺出 1280 x 720、121 帧画布。",
      "④ RandomNoise、CFGGuider、KSamplerSelect、BasicScheduler、空潜空间五路在 SamplerCustomAdvanced 汇合，20 步 euler 完成去噪。",
      "⑤ VAEDecode 整段解码为像素帧。",
      "⑥ CreateVideo 以 24fps 合成视频，SaveVideo 以 h264 编码写出 MP4。"
    ],
    params: [
      { name: "width / height", value: "1280 x 720", desc: "混元 1.5 的 720p 档位原生尺寸，降低到 480p 档可明显省显存。" },
      { name: "length", value: "121", desc: "生成帧数，24fps 下约 5 秒，改时长直接改此值。" },
      { name: "steps", value: "20", desc: "官方原始设置为 50 步，模板为速度降到 20，注释中附有原始参数对照表。" },
      { name: "cfg", value: "6", desc: "混元官方推荐值，与 50 步原始设置一致。" },
      { name: "shift", value: "7", desc: "噪声调度偏移，官方 720p 文生视频原始值为 9，模板取 7 折中。" },
      { name: "sampler / scheduler", value: "euler / simple", desc: "混元 1.5 模板推荐的稳妥组合。" },
      { name: "fps", value: "24", desc: "CreateVideo 合成帧率，与混元训练设定一致。" },
      { name: "codec", value: "h264", desc: "SaveVideo 输出编码，兼容性最好的选择。" }
    ],
    tips: [
      "显存不足时先把 UNETLoader 的 weight_dtype 改为 fp8_e4m3fn，再考虑降分辨率或降帧数。",
      "EasyCache 默认关闭，Ctrl+B 启用可明显提速，但官方明确说明会牺牲画质，做对比测试时注意控制变量。",
      "1080p 超分分支整组 bypass：潜空间经专用放大器到 1920 x 1080 后，用 8 步蒸馏模型按高低 sigma 两段精修，启用前确认已下载 1080p_sr 模型与 latent upsampler 两套文件。",
      "负向提示词留空即可出片，混元 1.5 不靠负向词救画质，别把其他模型的负向词习惯硬搬过来。",
      "解码慢或爆显存就换文件里备好的 VAEDecodeTiled，分块解码以极小的接缝风险换显存安全。"
    ],
    notice: "源文件包含完整的 1080p 超分二段采样分支（潜空间放大、HunyuanVideo15SuperResolution、SplitSigmas 高低 sigma 两段采样、独立解码与保存，共十余个节点），整组处于 bypass 状态；本图只保留默认启用的 720p 主干，另省略全部 Note 与 MarkdownNote 节点。"
  });
})();
