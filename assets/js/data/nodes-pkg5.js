(function () {
  "use strict";
  window.COMFY_DATA = window.COMFY_DATA || {};
  window.COMFY_DATA.nodePackages = window.COMFY_DATA.nodePackages || [];

  // ---------- 1. ComfyUI-WanVideoWrapper ----------
  // 节点名与参数均核对自 github.com/kijai/ComfyUI-WanVideoWrapper 的 nodes.py / nodes_model_loading.py / nodes_sampler.py
  window.COMFY_DATA.nodePackages.push({
    id: "wanvideo-wrapper",
    name: "ComfyUI-WanVideoWrapper",
    author: "kijai",
    official: false,
    category: "视频生成",
    install: "在 ComfyUI-Manager 里搜索 WanVideoWrapper 一键安装",
    summary: "kijai 的 WanVideo Wrapper 是社区公认的 Wan 2.1 与 2.2 视频生成重量级封装，也是视频方向人气最高的自定义节点包之一。它把模型加载、文本与图像编码、采样、解码拆成一条专有类型的流水线，并大量引入显存优化与进阶特性：分块换出、上下文窗口长视频、LoRA 链式叠加，以及 VACE、Fun、UniAnimate 等各类运动控制分支。社区的共识是 Wan 2.2 日常出片用原生节点更简单，而要低显存跑大模型、做长视频或深度控制时，wrapper 是首选工具。",
    why: "视频生成的显存压力远超图片，同一张显卡能跑图未必能跑视频。wrapper 把分块换出、精度量化、上下文窗口这些硬核手段都做成独立的小节点，让 16G 级显存也有机会跑 14B 模型；专有类型的连线让每个环节可以独立替换与实验，是深入研究 Wan 系列绕不开的一套工具。",
    tags: ["视频生成", "Wan 2.1 与 2.2", "低显存"],
    nodes: [
      {
        name: "WanVideoModelLoader", cat: "load",
        brief: "加载 Wan 视频扩散模型，集中配置精度、量化与卸载策略。",
        desc: "整套 wrapper 工作流的起点。它从 diffusion_models 目录加载 Wan 主体模型，也支持同目录的 GGUF 量化版。输出的是 wrapper 专有的 WANVIDEOMODEL 类型，里面除了模型还携带精度与设备信息，因此后续必须接 wrapper 自己的采样器。LoRA、分块换出配置、显存管理参数都通过可选输入接进来，集中在这一个节点生效。",
        inputs: [
          { name: "block_swap_args", type: "BLOCKSWAPARGS", from: "可选，WanVideoBlockSwap", desc: "接入后按配置把部分模型块常驻内存" },
          { name: "lora", type: "WANVIDLORA", from: "可选，WanVideoLoraSelect 链", desc: "要叠加的视频 LoRA 列表" },
          { name: "vram_management_args", type: "VRAM_MANAGEMENTARGS", from: "可选，WanVideoVRAMManagement", desc: "另一种更激进的显存卸载方案" }
        ],
        outputs: [
          { type: "WANVIDEOMODEL", to: "典型下游：WanVideoSetBlockSwap 或 WanVideoSampler 的 model 输入", desc: "加载完成的视频扩散模型" }
        ],
        why: "视频模型动辄十几 GB，加载方式直接决定能不能跑、跑多快。这个节点把精度、量化与设备策略收拢在一处，是调优的第一站。",
        params: [
          { name: "model", kind: "下拉选择", default: "按所用 Wan 版本选择对应文件", desc: "从 models/diffusion_models 目录选择模型。Wan 2.1 有 1.3B 与 14B，Wan 2.2 有 5B 与 14B 双模型方案，14B 质量高但显存门槛陡增。" },
          { name: "base_precision", kind: "下拉选择", default: "bf16", desc: "模型主体计算精度。bf16 是质量与速度的默认平衡点，fp16_fast 这类快速模式牺牲少量精度换速度。", options: [["fp32", "全精度，最稳但最占显存"], ["bf16", "当前主流默认，质量与显存均衡"], ["fp16", "半精度，部分老卡友好"], ["fp16_fast", "半精度快速算子，速度更快"]] },
          { name: "quantization", kind: "下拉选择", default: "disabled", desc: "可选的权重量化，把 16 位权重压成 8 位，显存占用近乎减半。", options: [["disabled", "按权重类型自动决定，最稳妥"], ["fp8_e4m3fn", "标准 8 位量化，通用性最好"], ["fp8_e4m3fn_fast", "量化加快速矩阵运算，需 40 系及以上显卡"], ["fp8_e5m2", "动态范围更大的 8 位格式，精度略低"]] },
          { name: "load_device", kind: "下拉选择", default: "offload_device", desc: "模型初始加载到哪个设备。", options: [["main_device", "常驻显存，速度最快，建议 48G 以上显存再选"], ["offload_device", "放内存按需搬入显存，普通显卡的默认选择"]] }
        ],
        tips: "小显存跑 14B 的常见组合是 offload_device 加 fp8 量化再配 BlockSwap；GGUF 模型不要指望权重合并加速，LoRA 会自动改为运行时挂载。"
      },
      {
        name: "WanVideoVAELoader", cat: "vae",
        brief: "加载 Wan 专用视频 VAE，图像编码与视频解码共用。",
        desc: "Wan 的 VAE 承担两个方向的工作：图生视频时把首帧图像压缩进潜空间，采样结束后再把整段潜空间解码回像素帧。wrapper 使用自己的 VAE 实现，所以要在 models/vae 目录单独加载这个文件，而不是用底模捆绑的。显存吃紧时可以打开 CPU 缓存或下游解码节点的分块开关。",
        inputs: [],
        outputs: [
          { type: "WANVAE", to: "典型下游：WanVideoImageToVideoEncode 与 WanVideoDecode 的 vae 输入", desc: "Wan 专用的视频编解码器" }
        ],
        why: "视频 VAE 是整条流水线的进出口，类型专有且必须单独加载。没有它，图生视频的图像编码和最终的视频解码都无法进行。",
        params: [
          { name: "model_name", kind: "下拉选择", default: "Wan2_1_VAE.pth", desc: "从 models/vae 目录选择 Wan 专用 VAE 文件，Wan 2.2 沿用 2.1 的 VAE。" },
          { name: "precision", kind: "下拉选择", default: "bf16", desc: "VAE 计算精度，一般保持默认即可。", options: [["fp16", "半精度，显存占用低"], ["fp32", "全精度，解码质量最稳"], ["bf16", "默认选择，均衡之选"]] },
          { name: "use_cpu_cache", kind: "开关", default: "false", desc: "把 VAE 缓存到内存降低显存占用，代价是解码速度明显变慢。" }
        ],
        tips: "解码长视频爆显存时，优先在 WanVideoDecode 上开分块解码，而不是让 VAE 整体降速。"
      },
      {
        name: "LoadWanVideoT5TextEncoder", cat: "clip",
        brief: "单独加载 umt5 文本编码器，供提示词编码节点复用。",
        desc: "Wan 使用 umt5 系列模型读懂提示词，这个编码器体积本身就有几个 GB。此节点把它从 text_encoders 目录加载出来，输出 WANTEXTENCODER 类型，接到 WanVideoTextEncode 的 t5 输入。编码器常驻后，反复修改提示词重新执行时不用每次重新加载，等待时间大幅缩短。",
        inputs: [],
        outputs: [
          { type: "WANTEXTENCODER", to: "典型下游：WanVideoTextEncode 的 t5 输入", desc: "加载完成的文本编码器" }
        ],
        why: "当前版本 wrapper 的文本编码必须有一路 T5 编码器输入，这个节点就是标准来源。把它常驻在画布上，是所有 Wan 工作流的固定件。",
        params: [
          { name: "model_name", kind: "下拉选择", default: "按下载版本选择", desc: "从 models/text_encoders 目录选择 umt5 编码器文件，常见为 bf16 精度的 safetensors 版本。" },
          { name: "precision", kind: "下拉选择", default: "bf16", desc: "编码器计算精度，fp32 更稳但更占显存。", options: [["fp32", "全精度"], ["bf16", "默认，显存与质量均衡"]] },
          { name: "quantization", kind: "下拉选择", default: "disabled", desc: "可选的 8 位量化，进一步压缩编码器显存占用。", options: [["disabled", "不量化"], ["fp8_e4m3fn", "量化为 8 位，显存减半"]] },
          { name: "load_device", kind: "下拉选择", default: "offload_device", desc: "编码器常驻显存还是内存，小显存选 offload。", options: [["main_device", "常驻显存，编码快"], ["offload_device", "放内存，用的时候再搬"]] }
        ],
        tips: "显存紧张就选 offload_device 加 fp8 量化；只调提示词不改模型时，保持它常驻最划算。"
      },
      {
        name: "WanVideoTextEncode", cat: "cond",
        brief: "把正负提示词一次编码成 Wan 专用的文本嵌入。",
        desc: "正面与负面提示词写在同一个节点的两个文本框里，编码后输出 wrapper 专用的 WANVIDEOTEXTEMBEDS 嵌入，直接对接采样器的 text_embeds 输入，省去标准流程里成对的 CLIP Text Encode。必须有 t5 输入提供编码器，或开启磁盘缓存复用过去的编码结果。节点还支持用竖线分隔多段提示词，把各段均匀铺满整段视频时长，做出随时间变化的提示词旅行效果。",
        inputs: [
          { name: "t5", type: "WANTEXTENCODER", from: "典型上游：LoadWanVideoT5TextEncoder", desc: "已加载的文本编码器，不接且未开缓存时会报错" }
        ],
        outputs: [
          { type: "WANVIDEOTEXTEMBEDS", to: "典型下游：WanVideoSampler 的 text_embeds 输入", desc: "正负提示词的编码嵌入" }
        ],
        why: "它是人类意图进入视频模型的唯一入口，也是 wrapper 流水线与标准图片工作流分道扬镳的地方。一次节点完成双向编码，画布更简洁。",
        params: [
          { name: "positive_prompt", kind: "文本", default: "空", desc: "正面提示词，描述画面主体、运镜与质感。视频提示词更强调动作与镜头语言，例如缓慢推进、跟拍。" },
          { name: "negative_prompt", kind: "文本", default: "空", desc: "负面提示词，描述要避免的内容。Wan 官方提供了固定的默认负面词，新手直接沿用即可。" },
          { name: "use_disk_cache", kind: "开关", default: "false", desc: "把编码结果缓存到磁盘，相同提示词再次执行几乎瞬时完成，缓存目录在节点包的 text_embed_cache 下。" },
          { name: "device", kind: "下拉选择", default: "gpu", desc: "编码在显卡还是处理器上运行。", options: [["gpu", "默认，速度快"], ["cpu", "显存极度紧张时选用，较慢"]] }
        ],
        tips: "改词频繁的调试期建议开磁盘缓存；想复用自带加载与缓存逻辑的老式写法，可以改用同包的 WanVideoTextEncodeCached。"
      },
      {
        name: "WanVideoImageToVideoEncode", cat: "video",
        brief: "把首帧尾帧图像编码成图生视频所需的图像嵌入。",
        desc: "图生视频流程的核心枢纽：接收 start_image 与可选的 end_image，配合 VAE 与 CLIP Vision 嵌入，产出采样器必需的 image_embeds。宽高与帧数在这里决定视频的画幅与时长，start 与 end 潜空间强度则控制对首尾帧的忠实程度，调低会让画面动得更自由。它输出的嵌入同时携带目标形状信息，采样器据此构建噪声。",
        inputs: [
          { name: "vae", type: "WANVAE", from: "典型上游：WanVideoVAELoader", desc: "用于把图像压进潜空间" },
          { name: "clip_embeds", type: "WANVIDIMAGE_CLIPEMBEDS", from: "可选，WanVideoClipVisionEncode", desc: "参考图的视觉嵌入，接入后主体一致性更好" },
          { name: "start_image", type: "IMAGE", from: "可选，加载的起始帧图像", desc: "视频第一帧" },
          { name: "end_image", type: "IMAGE", from: "可选，加载的结束帧图像", desc: "视频最后一帧，做出首尾可控的运镜" }
        ],
        outputs: [
          { type: "WANVIDIMAGE_EMBEDS", to: "典型下游：WanVideoSampler 的 image_embeds 输入", desc: "携带首尾帧信息的图像嵌入" }
        ],
        why: "它同时决定画幅、时长与首帧约束强度，是图生视频工作流里调得最多的节点。首尾帧双控能力也是 Wan 系列的招牌玩法。",
        params: [
          { name: "width", kind: "整数", default: "832", desc: "画幅宽度，默认 832 配 480 对应 16 比 9 附近的横幅，注意 Wan 没有严格的 64 对齐要求但保持 16 的倍数最稳。" },
          { name: "height", kind: "整数", default: "480", desc: "画幅高度，与宽度共同决定分辨率，竖版视频对调两值即可。" },
          { name: "num_frames", kind: "整数", default: "81", desc: "总帧数，必须按 4 的倍数设置，81 帧在 16fps 下约五秒，是单窗口的标准长度。" },
          { name: "noise_aug_strength", kind: "浮点数", default: "0.0", desc: "对首帧注入轻微噪声，图生视频画面过于静止时可以调高试试，常能带来更多运动。" },
          { name: "start_latent_strength", kind: "浮点数", default: "1.0", desc: "首帧约束强度，调低画面更敢动但可能偏离原图，调高则忠实还原。" },
          { name: "end_latent_strength", kind: "浮点数", default: "1.0", desc: "尾帧约束强度，只在接了 end_image 时有意义。" }
        ],
        tips: "帧数改多少都必须是 4 的倍数；想让首帧之外动起来更多，优先调低 start_latent_strength 或加一点噪声增强，而不是猛改提示词。"
      },
      {
        name: "WanVideoClipVisionEncode", cat: "clip",
        brief: "用 CLIP Vision 把参考图编码成视觉嵌入。",
        desc: "图生视频模型靠 CLIP Vision 嵌入认识首帧长什么样，这个节点把输入图像交给 CLIP Vision 模型编码，输出 wrapper 专用的视觉嵌入。支持两路图像合并与一路负向图像，多图嵌入可用平均、求和、拼接等不同方式组合。默认会先把图像中心裁剪到编码器需要的尺寸再编码。",
        inputs: [
          { name: "clip_vision", type: "CLIP_VISION", from: "典型上游：ComfyUI 原生 CLIP Vision Loader", desc: "CLIP Vision 模型，Wan 常用 clip vision H 版本" },
          { name: "image_1", type: "IMAGE", from: "典型上游：加载或生成的图像", desc: "主参考图" },
          { name: "image_2", type: "IMAGE", from: "可选，另一路图像", desc: "第二参考图，与主图按设定方式合并" },
          { name: "negative_image", type: "IMAGE", from: "可选，负向图像", desc: "作为负向条件的参考图" }
        ],
        outputs: [
          { type: "WANVIDIMAGE_CLIPEMBEDS", to: "典型下游：WanVideoImageToVideoEncode 的 clip_embeds 输入", desc: "参考图的视觉嵌入" }
        ],
        why: "没有这路嵌入，模型只能靠潜空间隐约感知首帧，主体一致性会明显下降。它是图生视频质量的第一道保险。",
        params: [
          { name: "strength_1", kind: "浮点数", default: "1.0", desc: "主图视觉嵌入的倍率，画面过分黏住原图时调低，主体跑偏时调高。" },
          { name: "crop", kind: "下拉选择", default: "center", desc: "编码前是否把图像中心裁剪到编码器的标准尺寸。", options: [["center", "中心裁剪，标准用法"], ["disabled", "不裁剪，直接缩放"]] },
          { name: "combine_embeds", kind: "下拉选择", default: "average", desc: "多路图像嵌入的合并方式。", options: [["average", "取平均，最常用"], ["sum", "求和，分量更强"], ["concat", "拼接，信息最全"], ["batch", "按批量处理"]] },
          { name: "force_offload", kind: "开关", default: "true", desc: "编码完成后把 CLIP Vision 移出显存，给后续环节腾地方。" }
        ],
        tips: "CLIP Vision 模型文件需要单独放在 models/clip_vision 目录；首帧风格跑偏时先检查这路强度，再怀疑提示词。"
      },
      {
        name: "WanVideoEmptyEmbeds", cat: "video",
        brief: "纯文生视频时按尺寸帧数生成空白图像嵌入。",
        desc: "采样器必须接收一路 image_embeds，但纯文生视频没有输入图像。这个节点按设定的宽高与帧数生成一个空白占位嵌入，只携带目标形状信息，不含图像内容。它补齐了纯文生视频链路的缺环，让同一个采样器既能跑图生视频也能跑纯文生视频。",
        inputs: [],
        outputs: [
          { type: "WANVIDIMAGE_EMBEDS", to: "典型下游：WanVideoSampler 的 image_embeds 输入", desc: "空白图像嵌入占位" }
        ],
        why: "类型系统的对称设计让文生视频与图生视频共用同一套采样器，而这个节点就是文生视频侧的替身演员。",
        params: [
          { name: "width", kind: "整数", default: "832", desc: "画幅宽度，需与其余环节保持一致。" },
          { name: "height", kind: "整数", default: "480", desc: "画幅高度，需与其余环节保持一致。" },
          { name: "num_frames", kind: "整数", default: "81", desc: "总帧数，按 4 的倍数设置。" }
        ],
        tips: "三个参数要和最终想要的视频规格一致，不一致会在采样时因形状不匹配报错。"
      },
      {
        name: "WanVideoLoraSelect", cat: "model",
        brief: "选择一个视频 LoRA，可串联叠加任意多个。",
        desc: "它输出的不是改好的模型，而是一个 WANVIDLORA 配置对象。多个 LoRA 通过 prev_lora 输入串成一条链，末端接进模型加载器的 lora 输入，一次性全部应用。默认会把 LoRA 权重合并进模型以获得更快推理，遇到 GGUF 或 scaled fp8 这类权重时自动改为运行时挂载，不需要用户操心。",
        inputs: [
          { name: "prev_lora", type: "WANVIDLORA", from: "可选，上一个 WanVideoLoraSelect", desc: "把多个 LoRA 串成一条链" }
        ],
        outputs: [
          { type: "WANVIDLORA", to: "典型下游：WanVideoModelLoader 的 lora 输入", desc: "含本节点与整条链的 LoRA 配置" }
        ],
        why: "视频 LoRA 负责运镜、特效与风格化，链条式设计让任意数量的 LoRA 一次配置完成，配合开关与权重可以快速做有无对比。",
        params: [
          { name: "lora", kind: "下拉选择", default: "按需选择", desc: "从 models/loras 目录选择 LoRA 文件，视频 LoRA 常见类型是运镜控制与画面风格。" },
          { name: "strength", kind: "浮点数", default: "1.0", desc: "LoRA 强度，支持负值反向削弱某种特征，权重运算与图片侧一致。" },
          { name: "merge_loras", kind: "开关", default: "true", desc: "把权重合并进模型，推理更快；GGUF 与 scaled fp8 权重会自动跳过合并。" },
          { name: "low_mem_load", kind: "开关", default: "false", desc: "加载时用更低显存的慢速方式，显存极限时打开。" }
        ],
        tips: "多个 LoRA 串联时权重别都拉满，互相稀释很常见；单个 LoRA 的作用先单独验证再组合。"
      },
      {
        name: "WanVideoBlockSwap", cat: "model",
        brief: "配置分块换出，把部分模型块放进内存以省显存。",
        desc: "扩散模型由几十个 Transformer 块组成，分块换出把其中一部分常驻内存，用到时再临时搬进显存，用传输带宽换显存空间。换出块数越多越省显存也越慢，配合预取可以掩盖部分搬运延迟。节点输出一个 BLOCKSWAPARGS 配置对象，本身不接触模型。",
        inputs: [],
        outputs: [
          { type: "BLOCKSWAPARGS", to: "典型下游：WanVideoModelLoader 的 block_swap_args 输入，或 WanVideoSetBlockSwap", desc: "分块换出配置" }
        ],
        why: "这是 wrapper 相比原生节点最有价值的招牌能力之一，低显存跑 14B 视频模型基本绕不开它。调好换出策略，等于给显卡无声扩容。",
        params: [
          { name: "blocks_to_swap", kind: "整数", default: "20", desc: "换出的块数。14B 模型共 40 块，1.3B 与 5B 为 30 块，数值越大越省显存、速度越慢。" },
          { name: "offload_img_emb", kind: "开关", default: "false", desc: "额外把图像嵌入也移出显存，极限省显存时打开。" },
          { name: "offload_txt_emb", kind: "开关", default: "false", desc: "额外把时间嵌入移出显存。" },
          { name: "prefetch_blocks", kind: "整数", default: "0", desc: "提前预取的块数，1 通常足以抵消换出的速度损失，配合调试开关确认自己机器的最优值。" },
          { name: "block_swap_debug", kind: "开关", default: "false", desc: "打印换出日志，观察命中与搬运动向再调参。" }
        ],
        tips: "从默认 20 开始，显存仍不够就逐步加到 30 以上；速度敏感时先试预取 1，再考虑减少换出块数。"
      },
      {
        name: "WanVideoSetBlockSwap", cat: "model",
        brief: "把换出配置附加到已加载的模型上。",
        desc: "接收一路 WANVIDEOMODEL 与一个 BLOCKSWAPARGS，把配置写进模型后原样输出。当你想给既有工作流的模型链插入换出配置，而不想改动模型加载器的连线时用它；配置写入后由采样器在运行时执行换出。",
        inputs: [
          { name: "model", type: "WANVIDEOMODEL", from: "典型上游：WanVideoModelLoader", desc: "待附加配置的模型" },
          { name: "block_swap_args", type: "BLOCKSWAPARGS", from: "典型上游：WanVideoBlockSwap", desc: "分块换出配置" }
        ],
        outputs: [
          { type: "WANVIDEOMODEL", to: "典型下游：WanVideoSampler 的 model 输入", desc: "携带换出配置的模型" }
        ],
        why: "它把换出策略变成模型链上的可插拔环节，实验不同换出档位时不用反复改加载器，也不用拔线。",
        params: [],
        tips: "与模型加载器的 block_swap_args 输入二选一即可，两处同时设置并无额外收益。"
      },
      {
        name: "WanVideoContextOptions", cat: "video",
        brief: "配置上下文窗口，让长视频分段采样且衔接自然。",
        desc: "模型一次只能稳定处理约 81 帧的窗口，生成更长视频需要把总帧数切成多个窗口滚动采样。这个节点决定窗口长度、滑动步幅与相邻窗口的重叠量：重叠部分用来缝合过渡，重叠不足会出现明显跳变。调度方式可选均匀或循环等策略，自由噪声开关则在窗口间打乱噪声提升多样性。",
        inputs: [],
        outputs: [
          { type: "WANVIDCONTEXT", to: "典型下游：WanVideoSampler 的 context_options 输入", desc: "上下文窗口配置" }
        ],
        why: "长视频是 wrapper 的招牌能力，而上下文窗口参数调得好坏直接决定长片有没有闪变与跳轴。它是 81 帧以上制作的必经节点。",
        params: [
          { name: "context_schedule", kind: "下拉选择", default: "uniform_standard", desc: "窗口滚动策略。", options: [["uniform_standard", "均匀滚动，通用默认"], ["uniform_looped", "均匀滚动且首尾衔接，适合循环视频"], ["static_standard", "静态分窗，特殊情况使用"]] },
          { name: "context_frames", kind: "整数", default: "81", desc: "每个窗口的帧数，一般保持 81 不动。" },
          { name: "context_stride", kind: "整数", default: "4", desc: "窗口之间的帧步幅，最小值为 4，对应潜空间的时间压缩率。" },
          { name: "context_overlap", kind: "整数", default: "16", desc: "相邻窗口的重叠帧数，衔接出现跳变时优先调大。" },
          { name: "freenoise", kind: "开关", default: "true", desc: "打乱窗口间噪声的相关性，常能提升长片的多样性。" }
        ],
        tips: "先用 81 帧单窗口跑通基准，再上多窗口；先动 overlap 再动其他参数，是排查长片跳变的标准顺序。"
      },
      {
        name: "WanVideoSampler", cat: "sampler",
        brief: "执行视频采样，输出成品与去噪中间潜空间。",
        desc: "整条流水线的执行核心：model 输入接模型，image_embeds 接图像嵌入，text_embeds 接文本嵌入，三路汇齐后按步数迭代去噪。cfg 控制对提示词的服从度，shift 是流匹配模型特有的分布偏移参数，对视频动态与构图影响很大。接上 samples 可输入现成潜空间做视频转视频，接上上下文配置即可跑长视频。输出两路潜空间：最终结果与去噪后的中间结果。",
        inputs: [
          { name: "model", type: "WANVIDEOMODEL", from: "典型上游：WanVideoModelLoader 或 WanVideoSetBlockSwap", desc: "采样用模型" },
          { name: "image_embeds", type: "WANVIDIMAGE_EMBEDS", from: "典型上游：WanVideoImageToVideoEncode 或 WanVideoEmptyEmbeds", desc: "图像嵌入，决定画幅与首帧" },
          { name: "text_embeds", type: "WANVIDEOTEXTEMBEDS", from: "典型上游：WanVideoTextEncode", desc: "提示词嵌入" },
          { name: "samples", type: "LATENT", from: "可选，已有视频的编码潜空间", desc: "视频转视频的起点，配合去噪强度使用" },
          { name: "context_options", type: "WANVIDCONTEXT", from: "可选，WanVideoContextOptions", desc: "长视频上下文窗口配置" }
        ],
        outputs: [
          { type: "LATENT", to: "典型下游：WanVideoDecode 的 samples 输入", desc: "采样完成的潜空间" },
          { type: "LATENT", to: "典型下游：需要去噪中间结果的编码或对比流程", desc: "去噪后未加噪的中间潜空间" }
        ],
        why: "它集中了 wrapper 的大多数实验特性：分段起止步、缓存加速、各类引导注入都在这里汇合。理解这一个节点，就理解了 wrapper 与原生采样器的差别。",
        params: [
          { name: "steps", kind: "整数", default: "30", desc: "去噪步数，20 到 30 是常用区间，视频对步数没有图片那么敏感。" },
          { name: "cfg", kind: "浮点数", default: "6.0", desc: "提示词服从度，视频里过高容易出现闪烁与僵硬，4 到 7 之间最常用。" },
          { name: "shift", kind: "浮点数", default: "5.0", desc: "流匹配分布偏移，视频常用 5 到 8，调大让前段去噪更狠、构图更早定型。" },
          { name: "seed", kind: "整数", default: "0", desc: "随机种子，锁定后便于在相同动态下微调提示词。" },
          { name: "scheduler", kind: "下拉选择", default: "unipc", desc: "每步噪声削减的调度器，unipc 与 simple 是常见起点。" },
          { name: "riflex_freq_index", kind: "整数", default: "0", desc: "RIFLEX 频率索引，0 为禁用；想生成超出训练帧数且不循环的视频时参考默认值 6。" }
        ],
        tips: "画面闪烁先降 cfg 再查提示词；接 samples 做视频转视频时记得配合 denoise_strength 控制改动幅度。"
      },
      {
        name: "WanVideoDecode", cat: "vae",
        brief: "把视频潜空间解码回像素帧序列。",
        desc: "流水线的出口：接收采样器输出的潜空间与 WanVideoVAELoader 加载的 VAE，输出一段按帧排列的 IMAGE 序列，交给保存节点或视频合成节点封装成 mp4 或 gif。解码是全流程的第二个显存高峰，开分块解码后显存峰值大幅下降，代价是块与块的边界可能出现接缝，加大块尺寸能让接缝几乎不可见。",
        inputs: [
          { name: "vae", type: "WANVAE", from: "典型上游：WanVideoVAELoader", desc: "Wan 专用视频解码器" },
          { name: "samples", type: "LATENT", from: "典型上游：WanVideoSampler", desc: "待解码的视频潜空间" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：保存节点或视频合成节点", desc: "解码后的帧序列" }
        ],
        why: "不解码就看不到任何东西，而解码方式直接决定长视频能否完整跑完。分块参数是长片制作的救生圈。",
        params: [
          { name: "enable_vae_tiling", kind: "开关", default: "false", desc: "分块解码，显存不够时的标准解法，长视频建议直接打开。" },
          { name: "tile_x", kind: "整数", default: "272", desc: "解码块的像素宽度，块越大接缝越不明显但显存越高。" },
          { name: "tile_y", kind: "整数", default: "272", desc: "解码块的像素高度。" },
          { name: "tile_stride_x", kind: "整数", default: "144", desc: "块的横向滑动步幅，步幅小于块尺寸时相邻块重叠覆盖。" },
          { name: "tile_stride_y", kind: "整数", default: "128", desc: "块的纵向滑动步幅。" }
        ],
        tips: "经验法则是让块尺寸达到步幅的一点五倍以上，接缝就基本看不见；显存充裕时关掉分块，速度与画质双赢。"
      }
    ]
  });

  // ---------- 2. ComfyUI_Comfyroll ----------
  // 节点名与参数均核对自 github.com/Suzie1/ComfyUI_Comfyroll_CustomNodes 的 node_mappings.py 与各分类源码
  window.COMFY_DATA.nodePackages.push({
    id: "comfyroll",
    name: "ComfyUI_Comfyroll",
    author: "Suzie1",
    official: false,
    category: "工作流构建工具",
    install: "在 ComfyUI-Manager 里搜索 Comfyroll 一键安装",
    summary: "Comfyroll 是老牌的工作流构建工具箱，节点按 Essential 核心、List 列表、Aspect Ratio 比例、ControlNet、LoRA、Animation 动画、Graphics 图形与 Utils 工具等大类组织，总数超过一百个。它不碰生成算法本身，专攻工作流的支撑环节：尺寸与批量设定、提示词模板、多 ControlNet 堆叠、列表循环与逐帧调度。社区早期大量经典模板与动画工作流都建立在它之上，配套的 Wiki 文档在同类包里数一数二地齐全。",
    why: "搭工作流真正费时间的往往不是模型而是支撑件：改尺寸、配批量、串 ControlNet、做逐帧变化。Comfyroll 把这些环节做成规整、带开关、可堆叠的小节点，配合列表与调度器，可以把一个手工流程改造成结构清晰的生产线。",
    tags: ["工作流构建", "ControlNet", "列表批处理"],
    nodes: [
      {
        name: "CR Image Output", cat: "image",
        brief: "预览与保存二合一的图像输出节点。",
        desc: "相当于把 Preview Image 与 Save Image 合成一个节点：输出类型下拉切换预览、保存或界面记录三种模式，切换时不用拆线换节点。文件名前缀支持固定的自定义文本，也可以选日期模板让文件按天归档，格式覆盖 png、jpg、webp 与 tif。布尔输入接通为真时才执行保存，可用来做条件触发。",
        inputs: [
          { name: "images", type: "IMAGE", from: "典型上游：任何图像输出", desc: "要输出或保存的图像" },
          { name: "trigger", type: "BOOLEAN", from: "可选，逻辑节点的布尔输出", desc: "为真时才执行本节点" }
        ],
        outputs: [
          { type: "BOOLEAN", to: "典型下游：需要触发信号的逻辑节点", desc: "回传触发状态" }
        ],
        why: "调试期用预览不写盘、量产期切保存一键归档，一个节点覆盖两种状态，省去来回替换节点与重连线的功夫。",
        params: [
          { name: "output_type", kind: "下拉选择", default: "Preview", desc: "输出方式。", options: [["Preview", "写临时目录，重启用后自动清理"], ["Save", "写入输出目录长期保存"], ["UI (no batch)", "只进界面记录，不落盘"]] },
          { name: "filename_prefix", kind: "文本", default: "CR", desc: "文件名前缀，可写项目或模型关键词，方便事后检索。" },
          { name: "prefix_presets", kind: "下拉选择", default: "None", desc: "在前缀后追加日期模板，选 yyyyMMdd 即按天归档。", options: [["None", "不追加"], ["yyyyMMdd", "前缀后接当天日期"]] },
          { name: "file_format", kind: "下拉选择", default: "png", desc: "保存格式，png 无损，jpg 与 webp 体积小。" }
        ],
        tips: "挂机跑样图选 UI 模式，结果只进图像记录不占磁盘，确定要哪几张再单独保存。"
      },
      {
        name: "CR Latent Batch Size", cat: "latent",
        brief: "在潜空间链路中途调整批量数。",
        desc: "接收一路潜空间，按设定的批量数复制扩展后再输出。与空潜空间节点上的批量参数不同，它可以插在任何潜空间链路中间：图生图时把单张参考图扩成多张并行微调，或者把上游固定的批量改成本次需要的数量。复制的是同一份潜空间内容，后续靠不同种子或提示词产生差异。",
        inputs: [
          { name: "latent", type: "LATENT", from: "典型上游：空潜空间、编码节点或上游采样", desc: "待调整批量的潜空间" }
        ],
        outputs: [
          { type: "LATENT", to: "典型下游：采样器或二次采样节点", desc: "扩展后的批量潜空间" }
        ],
        why: "批量是控制出图效率的旋钮，能中途调整意味着不用回到链路起点改参数，复杂工作流里非常省心。",
        params: [
          { name: "batch_size", kind: "整数", default: "2", desc: "目标批量数，调大显存与耗时按倍增长，建议配合随机种子一次出多张候选。" }
        ],
        tips: "想做同构图不同细节的对比，先锁定种子再扩批量；显存报警时先把批量降到 1 再排查。"
      },
      {
        name: "CR Aspect Ratio", cat: "latent",
        brief: "按比例预设一次产出宽高、放大系数与空潜空间。",
        desc: "内置一比一、竖版二比三、十六比九、宽银幕二点三九比一等常用比例预设，选中即得到对应宽高，custom 选项下手动填写。swap_dimensions 开关一键横竖互换，不用手动对调两个数。输出除了宽高还有放大系数、批量数与一个现成的空潜空间，等于把文生图的起点整套打包。",
        inputs: [],
        outputs: [
          { type: "INT", to: "典型下游：需要宽度的节点", desc: "画幅宽度" },
          { type: "INT", to: "典型下游：需要高度的节点", desc: "画幅高度" },
          { type: "FLOAT", to: "典型下游：放大流程", desc: "放大系数" },
          { type: "INT", to: "典型下游：批量类节点", desc: "批量数" },
          { type: "LATENT", to: "典型下游：采样器", desc: "按设定尺寸生成的空潜空间" }
        ],
        why: "改构图比例是出图过程中最高频的操作之一。一个节点管理全部尺寸参数，宽高接采样器、放大系数接放大链，改比例只动一处。",
        params: [
          { name: "aspect_ratio", kind: "下拉选择", default: "custom", desc: "比例预设，从一比一到宽银幕电影比例，覆盖常见出图场景。", options: [["custom", "按下方宽高手动填写"], ["1:1 square 1024x1024", "正方形，SDXL 标准尺寸"], ["2:3 portrait 512x768", "竖版人像常用"], ["16:9 cinema 910x512", "横幅视频比例"], ["2.39:1 anamorphic 1224x512", "宽银幕电影感"]] },
          { name: "width", kind: "整数", default: "512", desc: "手动模式下的画幅宽度。" },
          { name: "height", kind: "整数", default: "512", desc: "手动模式下的画幅高度。" },
          { name: "swap_dimensions", kind: "下拉选择", default: "Off", desc: "切到 On 时宽高互换，一键横竖版切换。", options: [["Off", "保持现状"], ["On", "交换宽与高"]] },
          { name: "upscale_factor", kind: "浮点数", default: "1.0", desc: "随输出带出的放大系数，接给放大流程统一控制倍率。" },
          { name: "batch_size", kind: "整数", default: "1", desc: "随输出带出的批量数。" }
        ],
        tips: "先选接近的预设再切 custom 微调，比从零填数快；横竖版对比实验全靠 swap_dimensions 一个开关。"
      },
      {
        name: "CR Prompt Text", cat: "cond",
        brief: "承载一段可连线的提示词文本。",
        desc: "一个多行文本框，把输入的提示词原样输出为字符串。它本身不做编码，只负责把文本变成可路由的数据，接到任何文本输入口上。与同包的组合、调度类节点搭配，可以把固定前缀、主体与风格词分开维护再拼装。",
        inputs: [],
        outputs: [
          { type: "STRING", to: "典型下游：条件编码或文本处理节点", desc: "提示词文本" }
        ],
        why: "把提示词从编码节点里解耦出来，一套文本可以喂给多个编码节点或多个流程分支，模板化管理才有可能。",
        params: [
          { name: "prompt", kind: "文本", default: "prompt", desc: "提示词内容，支持多行。正面负面各放一个节点并排摆放，画布一目了然。" }
        ],
        tips: "配合输入切换节点在两套提示词方案之间整体切换，比手改文本框快且不易出错。"
      },
      {
        name: "CR Apply ControlNet", cat: "cond",
        brief: "把单个 ControlNet 按开关与强度注入条件。",
        desc: "接收条件、CONTROL_NET 与引导图像，输出注入控制信号后的条件。自带 On 与 Off 开关，关闭或强度为零时条件原样直通，等于免拔线的旁路开关。多个本节点可以串联，实现先定构图再补细节的分层注入顺序。",
        inputs: [
          { name: "conditioning", type: "CONDITIONING", from: "典型上游：条件编码或上游 ControlNet", desc: "待注入的条件" },
          { name: "control_net", type: "CONTROL_NET", from: "典型上游：ControlNet Loader", desc: "加载好的 ControlNet 模型" },
          { name: "image", type: "IMAGE", from: "典型上游：引导图（深度图、姿态图等）", desc: "控制信号来源" }
        ],
        outputs: [
          { type: "CONDITIONING", to: "典型下游：采样器或下一个 ControlNet", desc: "注入完成或直通的条件" }
        ],
        why: "开关加直通的设计让有无对比一键完成，串联结构也让多个 ControlNet 的先后顺序清清楚楚，是排查控制冲突的好工具。",
        params: [
          { name: "switch", kind: "下拉选择", default: "On", desc: "注入开关，Off 时完全直通。", options: [["On", "注入生效"], ["Off", "直通旁路"]] },
          { name: "strength", kind: "浮点数", default: "1.0", desc: "控制强度，超过一点五容易画面僵硬，调零等于关闭。" }
        ],
        tips: "调试多 ControlNet 叠加时，先只开一个确认各自贡献，再逐个打开其余的。"
      },
      {
        name: "CR Multi-ControlNet Stack", cat: "cond",
        brief: "把最多三层 ControlNet 配置打包成一个堆栈。",
        desc: "每一层包含控制模型下拉、引导图输入、强度、作用区间与独立开关，三层之外还能接上一层堆栈继续扩展。输出一个 CONTROL_NET_STACK 配置对象，交给应用节点统一注入。作用区间用起止百分比描述，可以让深度控制只管前半程、姿态控制只管后半程。",
        inputs: [
          { name: "image_1", type: "IMAGE", from: "可选，第一层引导图", desc: "对应 controlnet_1 的控制信号" },
          { name: "image_2", type: "IMAGE", from: "可选，第二层引导图", desc: "对应 controlnet_2" },
          { name: "image_3", type: "IMAGE", from: "可选，第三层引导图", desc: "对应 controlnet_3" },
          { name: "controlnet_stack", type: "CONTROL_NET_STACK", from: "可选，另一个堆栈节点", desc: "在此堆栈基础上继续叠加" }
        ],
        outputs: [
          { type: "CONTROL_NET_STACK", to: "典型下游：CR Apply Multi-ControlNet", desc: "打包完成的多层配置" }
        ],
        why: "深度加姿态加线稿这类多路控制，散着写要七八个节点。堆栈化后配置收拢在一处，每层还能独立开关与分时段，实验维度一目了然。",
        params: [
          { name: "controlnet_1", kind: "下拉选择", default: "None", desc: "第一层的 ControlNet 文件，第二层第三层结构相同。" },
          { name: "switch_1", kind: "下拉选择", default: "Off", desc: "第一层独立开关，便于逐层验证贡献。" },
          { name: "controlnet_strength_1", kind: "浮点数", default: "1.0", desc: "第一层强度，支持负值做反向控制。" },
          { name: "start_percent_1", kind: "浮点数", default: "0.0", desc: "第一层开始作用的采样进度，0 表示从第一步开始。" },
          { name: "end_percent_1", kind: "浮点数", default: "1.0", desc: "第一层停止作用的采样进度，1 表示作用到最后一步。" }
        ],
        tips: "多个 ControlNet 互相打架时，把各层的起止区间错开是最有效的解法之一。"
      },
      {
        name: "CR Apply Multi-ControlNet", cat: "cond",
        brief: "把整包 ControlNet 堆栈一次性应用到正负条件。",
        desc: "堆栈只是配置，真正逐层加载模型并注入条件的是这个节点。它接收正负两组条件与一个堆栈，按顺序完成所有层的注入，输出应用完毕的正负条件。带一个总开关，关闭时整包直通，方便做全有全无的对照。",
        inputs: [
          { name: "base_positive", type: "CONDITIONING", from: "典型上游：正面条件编码", desc: "正面条件" },
          { name: "base_negative", type: "CONDITIONING", from: "典型上游：负面条件编码", desc: "负面条件" },
          { name: "controlnet_stack", type: "CONTROL_NET_STACK", from: "典型上游：CR Multi-ControlNet Stack", desc: "要应用的堆栈" }
        ],
        outputs: [
          { type: "CONDITIONING", to: "典型下游：采样器正面输入", desc: "注入后的正面条件" },
          { type: "CONDITIONING", to: "典型下游：采样器负面输入", desc: "注入后的负面条件" }
        ],
        why: "配方与应用分离后，同一套控制方案可以喂给不同模型或不同提示词，控制维度与生成维度解耦，实验效率翻倍。",
        params: [
          { name: "switch", kind: "下拉选择", default: "Off", desc: "总开关，Off 时堆栈完全不生效，条件原样通过。" }
        ],
        tips: "堆栈为空或开关关闭时输出原条件，正好用来生成没有控制的对照组。"
      },
      {
        name: "CR Text List", cat: "util",
        brief: "把多行文本拆成逐行列表，驱动批量执行。",
        desc: "文本框里每行一个词条，输出按行拆好的字符串列表。列表进入下游后，ComfyUI 会自动逐项执行，等于一次排队跑完所有提示词。起始索引与最大行数两个参数控制取哪一段，长词表可以先取一小段验证再放开。",
        inputs: [],
        outputs: [
          { type: "STRING", to: "典型下游：条件编码等文本输入", desc: "按行拆分的字符串列表" }
        ],
        why: "列表是 ComfyUI 原生批量的核心机制，这个节点把维护词表简化成编辑文本框，是批量出变体最朴素的入口。",
        params: [
          { name: "multiline_text", kind: "文本", default: "text", desc: "每行一个词条，行数就是批量执行的次数。" },
          { name: "start_index", kind: "整数", default: "0", desc: "从第几行开始取，配合断点续跑很方便。" },
          { name: "max_rows", kind: "整数", default: "1000", desc: "最多取多少行，控制单次批量规模。" }
        ],
        tips: "第一次跑大词表先把 max_rows 设为个位数验证流程，确认无误再放开全量。"
      },
      {
        name: "CR Prompt List", cat: "util",
        brief: "前缀加词表加后缀，组装成批量提示词列表。",
        desc: "结构与文本列表类似，多出前后缀两栏：前缀与后缀是单行文本，会拼接到主体每一行的头尾。输出拼装好的提示词列表、纯主体列表与帮助文本三路。典型的用法是前缀放画质与风格词，主体每行一个人物或场景，一次生成整套风格统一的变体。",
        inputs: [],
        outputs: [
          { type: "STRING", to: "典型下游：条件编码等文本输入", desc: "拼装完成的提示词列表" },
          { type: "STRING", to: "典型下游：需要主体词的处理节点", desc: "未拼装的主体列表" },
          { type: "STRING", to: "一般不用接", desc: "帮助文档链接" }
        ],
        why: "前后缀与主体分离后，换风格只改前缀、换主体只改中间列表，批量实验的模板化程度更高，维护成本更低。",
        params: [
          { name: "prepend_text", kind: "文本", default: "空", desc: "拼接在每行开头的前缀，放质量词与风格词。" },
          { name: "multiline_text", kind: "文本", default: "body_text", desc: "主体词表，每行一条。" },
          { name: "append_text", kind: "文本", default: "空", desc: "拼接在每行末尾的后缀。" },
          { name: "start_index", kind: "整数", default: "0", desc: "起始行号。" },
          { name: "max_rows", kind: "整数", default: "1000", desc: "最大行数。" }
        ],
        tips: "同一份主体词表换不同前缀跑两轮，就是最快速的风格对比实验。"
      },
      {
        name: "CR Text Cycler", cat: "util",
        brief: "按行循环输出文本，驱动逐段换词。",
        desc: "把多行文本按重复次数与循环轮数展开成列表输出：每条词条先按重复次数复制，再整体循环若干轮。动画流程里配合帧计数器实现按时间段轮换提示词；静态批量里用来按固定节奏复用一份词表。输出的仍是列表，交给下游逐项消化。",
        inputs: [],
        outputs: [
          { type: "STRING", to: "典型下游：条件编码或调度节点", desc: "展开后的文本列表" }
        ],
        why: "动画与批处理的本质都是让参数随执行推进。循环器把推进逻辑做成纯数据节点，不写一行代码就能实现轮换。",
        params: [
          { name: "text", kind: "文本", default: "空", desc: "每行一个词条，按顺序轮换。" },
          { name: "repeats", kind: "整数", default: "1", desc: "每条词条连续重复的次数，对应它在时间轴上停留的长度。" },
          { name: "loops", kind: "整数", default: "1", desc: "整份词表循环的轮数。" }
        ],
        tips: "把 repeats 设为帧率对应的帧数，可以让每条提示词恰好停留几秒，节奏控制非常直观。"
      },
      {
        name: "CR Text Scheduler", cat: "util",
        brief: "按帧调度文本，到点自动切换内容。",
        desc: "面向动画的时间轴节点：接上当前帧数后，按调度表返回当前时刻应显示的文本。模式在默认文本与调度之间切换，调度写法支持 CR 自有格式与 Deforum 格式，后者可以把 WebUI 动画词表直接搬过来用。别名用于在日志里区分多个调度器。",
        inputs: [
          { name: "schedule", type: "SCHEDULE", from: "可选，CR 调度表节点", desc: "要执行的调度表数据" }
        ],
        outputs: [
          { type: "STRING", to: "典型下游：条件编码或文本处理节点", desc: "当前帧对应的文本" }
        ],
        why: "关键帧式换词是动画工作流的刚需。兼容 Deforum 格式这一点，让大量现成词表资产可以无缝迁移到 ComfyUI。",
        params: [
          { name: "mode", kind: "下拉选择", default: "Default Text", desc: "默认文本模式下直接输出 default_text，切到 Schedule 才走时间轴。", options: [["Default Text", "固定输出默认文本，调试用"], ["Schedule", "按调度表逐帧切换"]] },
          { name: "current_frame", kind: "整数", default: "0", desc: "当前帧号，通常接帧计数节点的输出。" },
          { name: "schedule_alias", kind: "文本", default: "空", desc: "调度器别名，用于日志与多调度器管理。" },
          { name: "default_text", kind: "文本", default: "default text", desc: "默认模式或调度缺失时的兜底文本。" },
          { name: "schedule_format", kind: "下拉选择", default: "CR", desc: "调度表写法。", options: [["CR", "Comfyroll 自有格式"], ["Deforum", "兼容 WebUI Deforum 词表格式"]] }
        ],
        tips: "调试时先切默认文本确认下游正常，再切回调度模式；帧号接错是这类节点最常见的故障源。"
      },
      {
        name: "CR Apply LoRA Stack", cat: "model",
        brief: "把 LoRA 堆栈里的整份配方应用到模型。",
        desc: "接收模型、编码器与一个 LORA_STACK 堆栈，逐个加载并应用堆栈里的每个 LoRA，输出应用完毕的模型与编码器。堆栈由同包的 LoRA Stack 系列节点生成，一份堆栈可以容纳任意数量的 LoRA 与双强度设定。堆栈为空或未接时原样直通。",
        inputs: [
          { name: "model", type: "MODEL", from: "典型上游：Checkpoint 加载器", desc: "待注入的模型" },
          { name: "clip", type: "CLIP", from: "典型上游：同一加载器", desc: "配套文本编码器" },
          { name: "lora_stack", type: "LORA_STACK", from: "可选，CR LoRA Stack 系列节点", desc: "LoRA 配方堆栈" }
        ],
        outputs: [
          { type: "MODEL", to: "典型下游：采样器", desc: "应用堆栈后的模型" },
          { type: "CLIP", to: "典型下游：条件编码节点", desc: "应用文本侧权重后的编码器" }
        ],
        why: "配方与应用分离，让多套 LoRA 方案之间可以整体切换：换风格只换堆栈线，下游完全不动。这是 Comfyroll 版的批量 LoRA 管理思路。",
        params: [],
        tips: "想做有无 LoRA 的对照，把堆栈线断开跑一次即可，输出会原样直通。"
      }
    ]
  });

  // ---------- 3. ComfyUI-Custom-Scripts ----------
  // 节点名核对自 github.com/pythongosssss/ComfyUI-Custom-Scripts 的 py 目录注册表与 README 功能列表
  window.COMFY_DATA.nodePackages.push({
    id: "custom-scripts",
    name: "ComfyUI-Custom-Scripts",
    author: "pythongosssss",
    official: false,
    category: "界面与效率增强",
    install: "在 ComfyUI-Manager 里搜索 Custom-Scripts 一键安装",
    summary: "pythongosssss 的 Custom-Scripts 是安装量最高的效率增强包之一，内容分两层：一小批实用图节点（Show Text、String Function、Math Expression 等）与一大批界面增强功能（提示词自动补全、图像流面板、自动排版、网格吸附、部件默认值等），后者安装即生效，不需要任何连线。很多用户的 ComfyUI 早已离不开它，只是未必知道这些贴心功能出自这个包。社区习惯用作者 ID 把它的节点称为 pysssss 节点。",
    why: "ComfyUI 原生界面长期偏极简：写词没有补全，出图要翻文件夹，画布整理全靠手。这个包用最低的成本把这些体验补齐，图节点则填补了文本处理与数值计算的小工具空缺，几乎没有学习成本。",
    tags: ["界面增强", "效率", "调试"],
    nodes: [
      {
        name: "ShowText|pysssss", cat: "util",
        brief: "把上游文本直接显示在节点上，是画布监视器。",
        desc: "这是一个图节点。它只接受连线输入的字符串，执行时把内容显示在节点画面上，同时原样输出继续向后传。反推提示词、随机词表、字符串处理的结果都能即时查看，是社区工作流出镜率最高的调试节点之一。节点不参与任何计算，纯粹让你看见中间发生了什么。",
        inputs: [
          { name: "text", type: "STRING", from: "典型上游：任何输出文本的节点", desc: "强制走连线输入，不能手填" }
        ],
        outputs: [
          { type: "STRING", to: "典型下游：条件编码或继续观察", desc: "原样传出的文本" }
        ],
        why: "调试文本链路最怕中间内容与预期不符。Show Text 提供零成本的即时显示，排错从猜测变成查看。",
        params: [],
        tips: "与 String Function 级联摆放，可以逐步观察文本被处理成什么样；内容在每次执行后刷新。"
      },
      {
        name: "StringFunction|pysssss", cat: "util",
        brief: "三路文本的拼接与查找替换工具。",
        desc: "这是一个图节点。动作选 append 时把三路可选文本按顺序用逗号拼接，选 replace 时在第一路文本里查找第二路并替换成第三路，查找内容写成斜杠包裹的正则时还能做正则替换。整理开关会顺手清理多余逗号与空格，让拼出来的提示词干净可用。",
        inputs: [
          { name: "text_a", type: "STRING", from: "可选，任意文本节点", desc: "拼接的首段或替换的目标文本" },
          { name: "text_b", type: "STRING", from: "可选，任意文本节点", desc: "拼接的第二段或查找内容" },
          { name: "text_c", type: "STRING", from: "可选，任意文本节点", desc: "拼接的第三段或替换内容" }
        ],
        outputs: [
          { type: "STRING", to: "典型下游：条件编码或 Show Text", desc: "处理完成的文本" }
        ],
        why: "提示词的组装、替换与清理是模板化工作流的高频动作，一个节点覆盖三种需求，不必为一次换词重写整段提示词。",
        params: [
          { name: "action", kind: "下拉选择", default: "append", desc: "处理方式。", options: [["append", "按顺序拼接三路文本"], ["replace", "在 text_a 中查找 text_b 替换为 text_c"]] },
          { name: "tidy_tags", kind: "下拉选择", default: "yes", desc: "是否整理格式：拼接时补逗号、清理重复逗号与多余空格。", options: [["yes", "整理，输出干净文本"], ["no", "不整理，原样拼接"]] }
        ],
        tips: "replace 模式里查找词用正斜杠包裹即按正则解析，配合捕获组引用可以批量改写提示词结构。"
      },
      {
        name: "ConstrainImage|pysssss", cat: "image",
        brief: "把图像限制在最大最小尺寸之间，可选裁剪。",
        desc: "这是一个图节点。按保持比例的原则把图像缩进最大宽高以内，同时抬到最小宽高以上，需要严格匹配比例时打开裁剪选项裁掉多余部分。输出是图像列表形式，常用于把任意来源的参考图规格化，或约束视频流程里的首帧尺寸，避免下游节点因尺寸不对而报错。",
        inputs: [
          { name: "images", type: "IMAGE", from: "典型上游：加载或生成的图像", desc: "待约束的图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：编码、采样或保存节点", desc: "尺寸受控的图像列表" }
        ],
        why: "下游节点对尺寸敏感，入口先规格化能省掉大量莫名的对齐错误。一个小节点替代手搭的缩放判断组合。",
        params: [
          { name: "max_width", kind: "整数", default: "1024", desc: "允许的最大宽度，超出的按比例缩小。" },
          { name: "max_height", kind: "整数", default: "1024", desc: "允许的最大高度。" },
          { name: "min_width", kind: "整数", default: "0", desc: "允许的最小宽度，不足的按比例放大，0 表示不限制。" },
          { name: "min_height", kind: "整数", default: "0", desc: "允许的最小高度。" },
          { name: "crop_if_required", kind: "下拉选择", default: "no", desc: "比例仍不匹配时是否居中裁剪。", options: [["no", "只缩放不裁剪"], ["yes", "裁剪到完全匹配"]] }
        ],
        tips: "只设上限是温和的等比缩小；上下限都设且开了裁剪，可以得到尺寸完全一致的批量图。"
      },
      {
        name: "MathExpression|pysssss", cat: "util",
        brief: "在画布上计算数学表达式，可引用其他节点数值。",
        desc: "这是一个图节点。表达式框里写算式，三个可选输入能接整数、浮点、图像与潜空间等任意数据，图像与潜空间还能直接取宽高属性参与运算。支持四则运算、整除、幂、取模以及取整与随机整数等函数，输出整数与浮点两路结果。动态尺寸、按比例折算步数这类需求一处算清。",
        inputs: [
          { name: "a", type: "*", from: "可选，任意数值或图像潜空间", desc: "参与运算的第一路数据" },
          { name: "b", type: "*", from: "可选，同上", desc: "第二路数据" },
          { name: "c", type: "*", from: "可选，同上", desc: "第三路数据" }
        ],
        outputs: [
          { type: "INT", to: "典型下游：需要整数的参数输入", desc: "表达式的整数结果" },
          { type: "FLOAT", to: "典型下游：需要浮点数的参数输入", desc: "表达式的浮点结果" }
        ],
        why: "不少工作流需要根据上游动态算参数，硬编码改不过来。表达式节点把画布变成一台可连线的计算器。",
        params: [
          { name: "expression", kind: "文本", default: "空", desc: "算式内容，可用 a、b、c 引用输入，也可引用画布上其他节点控件的数值，图像与潜空间输入支持取宽高。" }
        ],
        tips: "算式里含随机函数时每次执行都会重算；引用其他节点数值用的是节点的搜索与恢复名称，重命名节点后记得同步。"
      },
      {
        name: "Repeater|pysssss", cat: "util",
        brief: "把一路输入复制成列表或多路输出。",
        desc: "这是一个图节点。对任意类型的输入复制指定份数：输出模式选 single 时生成一个列表交给下游逐项处理，选 multi 时展开成多个独立输出。节点模式决定复制时复用上游节点还是新建实例，前者适合模型这类可共享的数据，后者适合随机数这类每次都要不同的数据。",
        inputs: [
          { name: "source", type: "*", from: "典型上游：任意待复制的数据", desc: "要重复的数据源" }
        ],
        outputs: [
          { type: "*", to: "典型下游：接受列表或多路输入的节点", desc: "复制后的数据" }
        ],
        why: "列表批量的起点往往就是重复。一个节点替代手工复制一串相同的节点链，改份数只动一个参数。",
        params: [
          { name: "repeats", kind: "整数", default: "2", desc: "复制份数，上限五千。" },
          { name: "output", kind: "下拉选择", default: "single", desc: "输出形态。", options: [["single", "合成一个列表"], ["multi", "拆成多路独立输出"]] },
          { name: "node_mode", kind: "下拉选择", default: "reuse", desc: "复制行为。", options: [["reuse", "复用上游节点，适合模型与固定数据"], ["create", "每次新建实例，适合随机数等需差异的数据"]] }
        ],
        tips: "复制随机种子类的输入一定要选 create 模式，否则整批数值完全相同，批量就失去了意义。"
      },
      {
        name: "ReroutePrimitive|pysssss", cat: "util",
        brief: "为原始类型数据设计的可折叠路由节点。",
        desc: "这是一个图节点。原生改道点对数值、文本这类原始类型的支持时好时坏，这个节点补齐缺口：任意原始类型进出原样传递，节点还能折叠成一个小圆点随处摆放。官方提醒不要把它与普通改道点或原始值节点混用，它本身就是用来替代它们的。",
        inputs: [
          { name: "value", type: "*", from: "典型上游：任意原始类型数据", desc: "待路由的数据" }
        ],
        outputs: [
          { type: "*", to: "典型下游：同类型的任意输入", desc: "原样传出的数据" }
        ],
        why: "长距离传种子、数值、文本时，它让线路既整齐又不丢类型。折叠成圆点后比标准改道点醒目得多。",
        params: [],
        tips: "折叠后贴着目标节点摆放，再给上游起好名字，复杂画布的可读性立刻上一个台阶。"
      },
      {
        name: "LoadText|pysssss", cat: "load",
        brief: "从指定目录读取文本文件内容输出。",
        desc: "这是一个图节点。目录下拉选择允许的根目录，文件下拉列出其中的文本文件，选中即读出内容作为字符串输出。提示词模板、负面词库这类固定文本放进文件维护，比塞在节点文本框里干净得多，也便于多个工作流共享同一份词表。",
        inputs: [],
        outputs: [
          { type: "STRING", to: "典型下游：条件编码或文本处理节点", desc: "文件里的文本内容" }
        ],
        why: "把长提示词外置成文件，是词表资产管理意识的第一步。文件改动后重新执行即生效，不需要动工作流。",
        params: [
          { name: "root_dir", kind: "下拉选择", default: "按设置允许的目录", desc: "允许读取的根目录，在设置里配置后这里下拉选择。" },
          { name: "file", kind: "下拉选择", default: "[none]", desc: "目录内的文本文件，选定后执行即读取。" }
        ],
        tips: "文件下拉依赖目录绑定刷新，新增文件后如果没出现，切换一下根目录即可。"
      },
      {
        name: "PlaySound|pysssss", cat: "audio",
        brief: "执行经过时播放提示音，支持清空队列模式。",
        desc: "这是一个图节点。串在任意链路上，数据原样透传，执行经过时播放提示音。模式选清空队列时，只在排队的任务全部跑完后响一声，特别适合挂一批任务后离开屏幕跟前。音量可调，替换包内的音频文件可以自定义音效。",
        inputs: [
          { name: "any", type: "*", from: "典型上游：任意链路数据", desc: "只用于挂接与透传，内容不变" }
        ],
        outputs: [
          { type: "*", to: "典型下游：继续原有链路", desc: "原样透传的数据" }
        ],
        why: "长任务挂机时靠声音感知完成节点，比盯屏幕或翻日志直接得多。清空队列模式让它只在大功告成时提醒一次。",
        params: [
          { name: "mode", kind: "下拉选择", default: "always", desc: "播放时机。", options: [["always", "每次执行经过都播放"], ["on empty queue", "仅当队列为空时播放，适合批量挂机"]] },
          { name: "volume", kind: "浮点数", default: "0.5", desc: "音量，范围零到一。" },
          { name: "file", kind: "文本", default: "notify.mp3", desc: "音效文件名，替换包内同名文件即可换铃声。" }
        ],
        tips: "接在保存节点之后最合适，声音响起即代表这张图已经落盘。"
      },
      {
        name: "Image Feed", cat: "util",
        brief: "侧边图像流面板，实时回看本会话所有出图。",
        desc: "这是界面功能，不是图节点：安装后在界面一侧出现缩略图流，自动收录本次会话生成的每一张图。面板位置、图像排列方向与缩略图大小都可以调，点击缩略图可放大查看或保存。批量跑图时不用反复翻输出文件夹，选图对比下载在一个面板内完成。",
        inputs: [],
        outputs: [],
        why: "出图率高的时候，切文件夹翻图是最大的时间黑洞。图像流让生产与挑选零距离，挂机时的成果也一目了然。",
        params: [],
        tips: "在 ComfyUI 设置里搜索 Image Feed 可调位置与行为；面板只保留当前会话的图像，重启用后清空。"
      },
      {
        name: "Autocomplete", cat: "util",
        brief: "提示词输入框的自动补全与词表管理。",
        desc: "这是界面功能，不是图节点：给所有文本输入框补上自动补全，内置 embedding 词条提示，可一键载入 danbooru 标签词表，也支持自定义词表的导入与管理，部分词条还能查看详情。对 embedding 名称这类记不住的写法尤其有用，拼写错误也随之减少。",
        inputs: [],
        outputs: [],
        why: "写提示词是 ComfyUI 里最高频的打字场景，补全同时解决记忆负担与拼写错误两个问题，是很多用户装机必开的功能。",
        params: [],
        tips: "首次使用到设置里点载入按钮获取 danbooru 词表；自定义词表按纯文本维护，一行一个词条。"
      }
    ]
  });
})();
