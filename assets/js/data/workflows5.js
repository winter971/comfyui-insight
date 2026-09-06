(function () {
  "use strict";
  window.COMFY_DATA = window.COMFY_DATA || {};
  window.COMFY_DATA.workflows = window.COMFY_DATA.workflows || [];

  // ---------- 30. SUPIR 画质修复放大 ----------
  window.COMFY_DATA.workflows.push({
    id: "supir-upscale",
    name: "SUPIR 画质修复放大",
    category: "修复与放大",
    tags: ["SUPIR", "画质修复", "放大", "官方模板"],
    difficulty: 4,
    source: "ComfyUI 官方模板库（真实文件 utility_image_upscale_supir.json，子图展开后的主干简化）",
    summary: "SUPIR 是基于扩散先验的画质修复放大方法：把低清图当作条件，引导一个预训练 SDXL 主干在空白画布上重新去噪，从而在放大的同时重建皮肤、毛发等真实细节。官方模板已把 SUPIR 收编为原生模型补丁节点（ModelPatchLoader 加 SUPIRApply，属于 comfy-core，并非第三方 kijai 节点包），用 juggernautXL Lightning 写实底模加 SUPIR-v0Q 补丁，再让 Qwen3.5 4B 语言模型看图自动写英文描述词驱动修复。采样只要 10 步，最后 ColorTransfer 把色调对齐回原图。图为源文件子图展开后的主干简化。",
    useCases: [
      "老照片、低清截图、压缩图的画质修复与放大",
      "AI 生成图的二次放大，补足皮肤纹理与毛发细节",
      "保留原图构图与内容的约两倍高清化",
      "学习原生 SUPIR 模型补丁机制的工作原理"
    ],
    models: [
      { type: "Checkpoint", name: "juggernautXL_v9Rdphoto2Lightning.safetensors", note: "SDXL 写实底模（Lightning 少步特调版），提供扩散先验，放 models/checkpoints" },
      { type: "ModelPatch", name: "SUPIR-v0Q_fp16.safetensors", note: "SUPIR 官方修复补丁 v0Q 版，由 ModelPatchLoader 从 models/model_patches 加载" },
      { type: "LLM", name: "qwen3.5_4b_bf16.safetensors", note: "Qwen3.5 4B 视觉语言模型，CLIPLoader 加载，看图自动写提示词，放 models/text_encoders" }
    ],
    graph: {
      nodes: [
        { id: "92", title: "LoadImage", cat: "load", x: 20, y: 40,
          widgets: ["blurry_city_horses.png", "image"],
          inputs: [],
          outputs: [ { type: "IMAGE" }, { type: "MASK" } ],
          params: [
            { name: "image", kind: "下拉选择", default: "blurry_city_horses.png", desc: "input 目录中的待修复低清图；换成自己的照片直接改下拉框，三条输出连线不用动。" },
            { name: "upload", kind: "按钮", default: "image", desc: "上传新图片到 input 目录并自动选中。" }
          ],
          brief: "读入待修复的低清示例图。",
          desc: "IMAGE 输出兵分三路：进 ResizeImageMaskNode 缩放后供全图使用，直接给 TextGenerate 看图写词，再直接给 ImageCompare 当对比基准。MASK 输出未使用，悬空即可。" },
        { id: "1", title: "CheckpointLoaderSimple", cat: "load", x: 20, y: 260,
          widgets: ["juggernautXL_v9Rdphoto2Lightning.safetensors"],
          inputs: [],
          outputs: [ { type: "MODEL" }, { type: "CLIP" }, { type: "VAE" } ],
          params: [
            { name: "ckpt_name", kind: "下拉选择", default: "juggernautXL_v9Rdphoto2Lightning.safetensors", desc: "SDXL 写实向 Lightning 底模，提供扩散先验；SUPIR 的重建风格高度依赖底模，换更写实的 SDXL 底模会直接改变成片质感。" }
          ],
          brief: "加载 SDXL 写实底模，提供扩散先验。",
          desc: "MODEL 进 SUPIRApply 注入修复补丁，CLIP 供正负两个 SDXL 编码器，VAE 一路进 SUPIRApply 做参考编码、一路给 VAEDecode 最终解码。底模画质直接决定修复上限，这是官方模板配套的写实向 Lightning 底模。" },
        { id: "3", title: "ModelPatchLoader", cat: "load", x: 20, y: 470,
          widgets: ["SUPIR-v0Q_fp16.safetensors"],
          inputs: [],
          outputs: [ { type: "MODEL_PATCH" } ],
          params: [
            { name: "model_patch_name", kind: "下拉选择", default: "SUPIR-v0Q_fp16.safetensors", desc: "models/model_patches 目录中的 SUPIR 修复补丁；注意目录名与 checkpoints 不同，放错位置节点会变红。" }
          ],
          brief: "从 models/model_patches 目录加载 SUPIR 修复补丁。",
          desc: "SUPIR-v0Q 是 SUPIR 论文官方权重的 v0Q 版，以模型补丁文件形式存在，不改动底模本身。MODEL_PATCH 输出接 SUPIRApply 的 model_patch 端口，加载时会按文件内特征自动识别为 SUPIR 补丁类型。" },
        { id: "86", title: "CLIPLoader", cat: "load", x: 20, y: 660,
          widgets: ["qwen3.5_4b_bf16.safetensors", "stable_diffusion", "default"],
          inputs: [],
          outputs: [ { type: "CLIP" } ],
          params: [
            { name: "clip_name", kind: "下拉选择", default: "qwen3.5_4b_bf16.safetensors", desc: "Qwen3.5 4B 视觉语言模型，不参与图像条件编码，只被 TextGenerate 调用看图写英文描述；约 8GB 显存占用。" },
            { name: "type", kind: "下拉选择", default: "stable_diffusion", desc: "加载类型保持 stable_diffusion 即可。" },
            { name: "device", kind: "下拉选择", default: "default", desc: "设备选择保持 default。" }
          ],
          brief: "加载 Qwen3.5 4B 语言模型充当看图写词的 LLM。",
          desc: "type 选 stable_diffusion 即可，它不参与图像条件编码，只被 TextGenerate 调用把图片转成英文描述。一个语言模型借 CLIP 加载器进驻工作流，是新版 ComfyUI 的原生玩法。" },
        { id: "94", title: "ResizeImageMaskNode", cat: "image", x: 360, y: 40,
          widgets: ["scale total pixels", "2.25", "lanczos"],
          inputs: [ { name: "input", type: "IMAGE" } ],
          outputs: [ { type: "IMAGE" } ],
          params: [
            { name: "resize_mode", kind: "下拉选择", default: "scale total pixels", desc: "缩放模式为按总像素控制目标尺寸，与按倍率缩放相比能精确控制显存占用。" },
            { name: "megapixels", kind: "浮点数", default: "2.25", desc: "目标总像素 2.25 百万，约等于原面积两倍出头；想要更大倍率直接上调，显存与耗时随之上涨。" },
            { name: "upscale_method", kind: "下拉选择", default: "lanczos", desc: "插值算法，lanczos 是质量最高的经典插值，放大首选。",
              options: [["lanczos", "质量最高，放大首选"], ["bicubic", "较锐利，速度快"], ["bilinear", "双线性，偏平滑"]] }
          ],
          brief: "按总像素 2.25 百万像素用 lanczos 放大输入图。",
          desc: "缩放模式为按总像素、目标 2.25 百万像素、插值 lanczos。输出三路：进 SUPIRApply 当修复目标、进 ColorTransfer 当色彩参考、经 GetImageSize 决定潜空间画布尺寸，三处看到的必须是同一张图。" },
        { id: "58", title: "GetImageSize", cat: "util", x: 360, y: 260,
          widgets: [],
          inputs: [ { name: "image", type: "IMAGE" } ],
          outputs: [ { type: "INT" }, { type: "INT" } ],
          brief: "读取缩放图的宽高两个整数。",
          desc: "width 与 height 分别喂给 EmptyLatentImage，保证空白画布与修复目标严格同尺寸。免参数节点，是尺寸联动的小枢纽。" },
        { id: "57", title: "EmptyLatentImage", cat: "latent", x: 600, y: 260,
          widgets: ["512", "512", "1"],
          inputs: [ { name: "width", type: "INT" }, { name: "height", type: "INT" } ],
          outputs: [ { type: "LATENT" } ],
          params: [
            { name: "width", kind: "整数", default: "512", desc: "画布宽度；控件里的 512 只是占位，实际被 GetImageSize 的连线覆盖成缩放图真实尺寸。" },
            { name: "height", kind: "整数", default: "512", desc: "画布高度，同样由 GetImageSize 覆盖，保证画布与修复目标严格同尺寸。" },
            { name: "batch_size", kind: "整数", default: "1", desc: "批次数保持 1。" }
          ],
          brief: "生成与缩放图同尺寸的空白潜空间画布。",
          desc: "控件里的 512 只是占位，实际宽高被 GetImageSize 的连线覆盖。采样从这个空白画布开始，画面内容完全由 SUPIR 补丁引导重建。" },
        { id: "87", title: "TextGenerate", cat: "net", x: 360, y: 470,
          widgets: ["Describe this scene using only English without any other description", "2048", "on", "0.7", "64", "0.95", "0.05", "1.05", "0", "0", "false", "true"],
          inputs: [ { name: "clip", type: "CLIP" }, { name: "image", type: "IMAGE" } ],
          outputs: [ { type: "STRING" } ],
          params: [
            { name: "prompt", kind: "多行文本", default: "Describe this scene using only English without any other description", desc: "给 LLM 的指令：只用英文描述画面；输出会直接进入正向编码器替代手写描述。" },
            { name: "max_tokens", kind: "整数", default: "2048", desc: "生成文本的 token 上限，描述词场景用不了这么多，保持默认即可。" },
            { name: "streaming", kind: "下拉选择", default: "on", desc: "流式输出开关，保持 on。",
              options: [["on", "逐段输出"], ["off", "整体输出"]] },
            { name: "temperature", kind: "浮点数", default: "0.7", desc: "采样温度，0.7 在稳定性与多样性之间平衡，描述词场景不建议调高。" },
            { name: "top_k", kind: "整数", default: "64", desc: "每步只在概率前 64 的候选词中采样，抑制离谱描述。" },
            { name: "top_p", kind: "浮点数", default: "0.95", desc: "核采样阈值，与 top_k 共同约束输出分布。" },
            { name: "min_p", kind: "浮点数", default: "0.05", desc: "最小概率过滤，进一步压制低概率噪声词。" },
            { name: "repetition_penalty", kind: "浮点数", default: "1.05", desc: "重复惩罚，轻微大于 1 防止描述词原地打圈。" },
            { name: "seed", kind: "整数", default: "0", desc: "生成种子，0 表示随机；固定后同一张图的描述词可复现。" },
            { name: "presence_penalty", kind: "浮点数", default: "0", desc: "存在性惩罚，保持 0 即可。" },
            { name: "thinking", kind: "开关", default: "false", desc: "思维链开关，看图写描述词不需要深度思考，保持关闭。" },
            { name: "keep_model_loaded", kind: "开关", default: "true", desc: "推理后模型常驻显存，批量修复时更快；显存极限时可关闭换取余量。" }
          ],
          brief: "LLM 看图自动生成英文画质描述词。",
          desc: "prompt 是给模型的指令：只用英文描述画面。采样全开：温度 0.7、top_k 64、top_p 0.95、min_p 0.05、重复惩罚 1.05，最多 2048 token，thinking 关闭。源文件里指令文本还与可选手写描述拼接，并经 ComfySwitchNode 与 KJNodes 的 BOOLConstant 在自动手动之间二选一，当前自动路径生效，简化图直接取其输出。" },
        { id: "59", title: "CLIPTextEncodeSDXL", cat: "cond", x: 620, y: 470,
          widgets: ["1024", "1024", "0", "0", "1024", "1024", "Cinematic, High Contrast, highly detailed, taken using a Canon EOS R camera, hyper detailed photo - realistic  aximum detail, 32k, Color Grading, ultra HD, extreme meticulous detailing, skin pore detailing, hyper sharpness, perfect without deformations, high quality, detailed, photograph of an old man", "Cinematic, High Contrast, highly detailed, taken using a Canon EOS R camera, hyper detailed photo - realistic  aximum detail, 32k, Color Grading, ultra HD, extreme meticulous detailing, skin pore detailing, hyper sharpness, perfect without deformations, high quality, detailed, photograph of an old man"],
          inputs: [ { name: "clip", type: "CLIP" }, { name: "text_g", type: "STRING" }, { name: "text_l", type: "STRING" } ],
          outputs: [ { type: "CONDITIONING" } ],
          params: [
            { name: "width", kind: "整数", default: "1024", desc: "SDXL 条件的全局画幅宽度，保持默认即可。" },
            { name: "height", kind: "整数", default: "1024", desc: "全局画幅高度。" },
            { name: "crop_w", kind: "整数", default: "0", desc: "条件裁剪宽度偏移，保持 0。" },
            { name: "crop_h", kind: "整数", default: "0", desc: "条件裁剪高度偏移，保持 0。" },
            { name: "target_width", kind: "整数", default: "1024", desc: "目标画幅宽度，SDXL 双编码器条件专用参数，保持默认。" },
            { name: "target_height", kind: "整数", default: "1024", desc: "目标画幅高度，保持默认。" },
            { name: "text_g", kind: "多行文本", default: "Cinematic, High Contrast, highly detailed, taken using a Canon EOS R camera, hyper detailed photo - realistic  aximum detail, 32k, Color Grading, ultra HD, extreme meticulous detailing, skin pore detailing, hyper sharpness, perfect without deformations, high quality, detailed, photograph of an old man", desc: "全局描述词输入口；控件里的文案只是被连线覆盖的占位，实际接 TextGenerate 的 LLM 输出。" },
            { name: "text_l", kind: "多行文本", default: "Cinematic, High Contrast, highly detailed, taken using a Canon EOS R camera, hyper detailed photo - realistic  aximum detail, 32k, Color Grading, ultra HD, extreme meticulous detailing, skin pore detailing, hyper sharpness, perfect without deformations, high quality, detailed, photograph of an old man", desc: "局部描述词输入口，与 text_g 接同一份 LLM 描述。" }
          ],
          brief: "用 SDXL 双编码器把描述词编成正向条件。",
          desc: "text_g 全局与 text_l 局部接同一份 LLM 描述，控件里预留的老人肖像旧文案已被连线覆盖。SDXL 条件要同时给宽高与目标宽高六个数值，全部保持 1024 默认即可，输出进 SamplerCustom 的 positive 端口。" },
        { id: "60", title: "CLIPTextEncodeSDXL", cat: "cond", x: 620, y: 680,
          widgets: ["1024", "1024", "0", "0", "1024", "1024", "painting, oil painting, illustration, drawing, art, sketch, cartoon, CG Style, 3D render, unreal engine, blurring, dirty, messy, worst quality, low quality, frames, watermark, signature, jpeg artifacts, deformed, lowres, over-smooth bad quality, blurry, messy", "painting, oil painting, illustration, drawing, art, sketch, cartoon, CG Style, 3D render, unreal engine, blurring, dirty, messy, worst quality, low quality, frames, watermark, signature, jpeg artifacts, deformed, lowres, over-smooth, bad quality, blurry, messy"],
          inputs: [ { name: "clip", type: "CLIP" }, { name: "text_g", type: "STRING" }, { name: "text_l", type: "STRING" } ],
          outputs: [ { type: "CONDITIONING" } ],
          params: [
            { name: "width", kind: "整数", default: "1024", desc: "负向条件全局画幅宽度，保持默认。" },
            { name: "height", kind: "整数", default: "1024", desc: "负向条件全局画幅高度。" },
            { name: "crop_w", kind: "整数", default: "0", desc: "裁剪偏移，保持 0。" },
            { name: "crop_h", kind: "整数", default: "0", desc: "裁剪偏移，保持 0。" },
            { name: "target_width", kind: "整数", default: "1024", desc: "目标宽度，保持默认。" },
            { name: "target_height", kind: "整数", default: "1024", desc: "目标高度，保持默认。" },
            { name: "text_g", kind: "多行文本", default: "painting, oil painting, illustration, drawing, art, sketch, cartoon, CG Style, 3D render, unreal engine, blurring, dirty, messy, worst quality, low quality, frames, watermark, signature, jpeg artifacts, deformed, lowres, over-smooth bad quality, blurry, messy", desc: "负向全局词；SUPIR 很吃这段词，防止结果滑向插画风格或过度磨皮，保留原文不要清空。" },
            { name: "text_l", kind: "多行文本", default: "painting, oil painting, illustration, drawing, art, sketch, cartoon, CG Style, 3D render, unreal engine, blurring, dirty, messy, worst quality, low quality, frames, watermark, signature, jpeg artifacts, deformed, lowres, over-smooth, bad quality, blurry, messy", desc: "负向局部词，与全局词配套使用。" }
          ],
          brief: "编码负向条件，压制油画感与低质瑕疵。",
          desc: "负向词由源文件中被省略的多行字符串节点供给，内容是 painting、low quality、watermark、deformed 等一长串反例词。SUPIR 很吃这段词：它能防止结果变成插画风格或过度磨皮，控件里两段文本即真实值。" },
        { id: "62", title: "SUPIRApply", cat: "model", x: 900, y: 40,
          widgets: ["1", "0.9", "4", "0.05"],
          inputs: [ { name: "model", type: "MODEL" }, { name: "model_patch", type: "MODEL_PATCH" }, { name: "vae", type: "VAE" }, { name: "image", type: "IMAGE" }, { name: "strength_start", type: "FLOAT" }, { name: "strength_end", type: "FLOAT" } ],
          outputs: [ { type: "MODEL" } ],
          params: [
            { name: "strength_start", kind: "浮点数", default: "1", desc: "修复引导的起始强度；想更多重建细节就提高它。" },
            { name: "strength_end", kind: "浮点数", default: "0.9", desc: "引导随采样进程线性衰减到的终值；调低更贴近原片但细节减少。" },
            { name: "restore_cfg", kind: "浮点数", default: "4", desc: "把去噪中间结果往输入潜空间方向拉拽的保真项，越高越忠于原图，设 0 关闭。" },
            { name: "restore_cfg_s_tmin", kind: "浮点数", default: "0.05", desc: "sigma 阈值，低于该值停止 restore_cfg 拉拽，避免收尾阶段细节被压平。" }
          ],
          brief: "全图灵魂：把 SUPIR 修复补丁挂上 SDXL 主干。",
          desc: "它用补丁自带的编码器把缩放图压成参考特征，再以模型补丁形式在采样每一步引导去噪方向。strength_start 1 到 strength_end 0.9 线性衰减控制引导强度，restore_cfg 4 把中间结果往输入潜空间方向拉拽保真，0.05 是其生效的 sigma 下限阈值，四个控件正好对应这四个参数。" },
        { id: "76", title: "KSamplerSelect", cat: "sampler", x: 900, y: 270,
          widgets: ["dpmpp_2m_sde"],
          inputs: [],
          outputs: [ { type: "SAMPLER" } ],
          params: [
            { name: "sampler_name", kind: "下拉选择", default: "dpmpp_2m_sde", desc: "SUPIR 官方推荐采样器，二阶多步加随机性，少步数下细节重建稳定。",
              options: [["dpmpp_2m_sde", "官方推荐，细节重建稳"], ["dpmpp_2m", "确定性更强，可对比"], ["euler", "朴素稳定兜底"]] }
          ],
          brief: "选择 dpmpp_2m_sde 采样算法。",
          desc: "SUPIR 官方推荐的采样器之一，随机性与细节重建平衡较好，与 sgm_uniform 调度搭配在 10 步内即可稳定收敛，输出给 SamplerCustom 的 sampler 端口。" },
        { id: "29", title: "BasicScheduler", cat: "sampler", x: 900, y: 490,
          widgets: ["sgm_uniform", "10", "1"],
          inputs: [ { name: "model", type: "MODEL" }, { name: "steps", type: "INT" }, { name: "denoise", type: "FLOAT" } ],
          outputs: [ { type: "SIGMAS" } ],
          params: [
            { name: "scheduler", kind: "下拉选择", default: "sgm_uniform", desc: "sigma 日程类型，sgm_uniform 与 dpmpp_2m_sde 搭配在 10 步内稳定收敛。",
              options: [["sgm_uniform", "官方默认"], ["simple", "简化日程，可对比"], ["karras", "过渡平滑，可尝试"]] },
            { name: "steps", kind: "整数", default: "10", desc: "采样步数，Lightning 底模为少步设计，拉到 30 以上收益极小而时间翻倍。" },
            { name: "denoise", kind: "浮点数", default: "1", desc: "从空白画布完整生成，保持 1；注意 model 输入接的是 SUPIRApply 修饰后的模型。" }
          ],
          brief: "按修饰后的模型生成 10 步 sigma 噪声序列。",
          desc: "注意 model 输入接的是 SUPIRApply 的输出而不是底模本体，这样 sigma 曲线会参考补丁后的模型状态。调度器 sgm_uniform、步数 10、降噪 1，数值由子图对外暴露的参数统一供给。" },
        { id: "20", title: "SamplerCustom", cat: "sampler", x: 940, y: 700,
          widgets: ["true", "402244474214267", "fixed", "1.5"],
          inputs: [ { name: "model", type: "MODEL" }, { name: "positive", type: "CONDITIONING" }, { name: "negative", type: "CONDITIONING" }, { name: "sampler", type: "SAMPLER" }, { name: "sigmas", type: "SIGMAS" }, { name: "latent_image", type: "LATENT" }, { name: "noise_seed", type: "INT" }, { name: "cfg", type: "FLOAT" } ],
          outputs: [ { type: "LATENT" }, { type: "LATENT" } ],
          params: [
            { name: "add_noise", kind: "开关", default: "true", desc: "从空白画布生成需要加噪，保持开启。",
              options: [["true", "添加初始噪声"], ["false", "不加噪，仅用于续采样"]] },
            { name: "noise_seed", kind: "整数", default: "402244474214267", desc: "噪声种子；修复类任务对种子不敏感，固定便于对比参数改动。" },
            { name: "control_after_generate", kind: "下拉选择", default: "fixed", desc: "种子控制模式，fixed 保持可复现。",
              options: [["fixed", "保持不变"], ["randomize", "每次随机"], ["increment", "每次加一"]] },
            { name: "cfg", kind: "浮点数", default: "1.5", desc: "CFG 只需小值，画面内容的控制权在补丁手里，条件只负责质感方向。" }
          ],
          brief: "在空白画布上执行 10 步 SUPIR 引导去噪。",
          desc: "add_noise 开、种子 402244474214267 固定、CFG 1.5。画布虽是空白潜空间，但补丁会在每一步把去噪结果拉向低清参考的重建方向，这与普通文生图的本质区别就在这里，第二个输出 denoised_output 未使用。" },
        { id: "11", title: "VAEDecode", cat: "vae", x: 1180, y: 40,
          widgets: [],
          inputs: [ { name: "samples", type: "LATENT" }, { name: "vae", type: "VAE" } ],
          outputs: [ { type: "IMAGE" } ],
          brief: "把修复后的潜空间解码成像素图。",
          desc: "VAE 来自同一个 checkpoint。SUPIR 补丁内部还会用带 denoise_encoder 权重的 VAE 编码参考图，与本节点共用同一份底模 VAE，两处都不能断线。" },
        { id: "39", title: "ColorTransfer", cat: "image", x: 1180, y: 260,
          widgets: ["mkl_lab", "per_frame", "1"],
          inputs: [ { name: "image_target", type: "IMAGE" }, { name: "image_ref", type: "IMAGE" } ],
          outputs: [ { type: "IMAGE" } ],
          params: [
            { name: "method", kind: "下拉选择", default: "mkl_lab", desc: "色彩迁移算法，mkl_lab 在 LAB 色彩空间做统计量匹配，修复偏色发灰的最后兜底。",
              options: [["mkl_lab", "LAB 空间统计匹配，官方默认"], ["pdf_gmm", "高斯混合模型匹配，更慢"], ["hm_mkl_hsv", "HSV 变体，可对比"]] },
            { name: "source_stats", kind: "下拉选择", default: "per_frame", desc: "色彩统计的取样方式，per_frame 表示按帧计算。" },
            { name: "strength", kind: "浮点数", default: "1", desc: "迁移强度 1 表示完全对齐回原图色调；想保留部分修复后的色调可调低。" }
          ],
          brief: "把修复结果的色调对齐回输入图。",
          desc: "image_target 是 SUPIR 成品，image_ref 是缩放后的原输入图，用 mkl_lab 算法在 LAB 色彩空间迁移色彩统计，强度 1。重新生成难免偏色发灰，这一步兜底让成片色调与原图一致。" },
        { id: "96", title: "ImageCompare", cat: "image", x: 1420, y: 40,
          widgets: [],
          inputs: [ { name: "image_a", type: "IMAGE" }, { name: "image_b", type: "IMAGE" } ],
          outputs: [],
          brief: "滑杆对比原图与修复结果。",
          desc: "image_a 接 LoadImage 原图，image_b 接 ColorTransfer 输出，节点内置前后对比视图方便拖动查看差异，属于输出型节点，不参与任何计算链路。" },
        { id: "97", title: "SaveImage", cat: "image", x: 1480, y: 260,
          widgets: ["upscaled_by_supir"],
          inputs: [ { name: "images", type: "IMAGE" } ],
          outputs: [],
          params: [
            { name: "filename_prefix", kind: "文本", default: "upscaled_by_supir", desc: "输出文件命名前缀；批量修复时建议改成项目名便于归档，重名自动追加序号。" }
          ],
          brief: "以 upscaled_by_supir 前缀保存成品。",
          desc: "写入 output 目录，PNG 内嵌完整工作流元数据，拖回画布即可复现整条修复链路。重名文件自动追加序号不会覆盖。" }
      ],
      links: [
        { from: "92", fromOut: 0, to: "94", toIn: "input" },
        { from: "92", fromOut: 0, to: "87", toIn: "image" },
        { from: "92", fromOut: 0, to: "96", toIn: "image_a" },
        { from: "94", fromOut: 0, to: "58", toIn: "image" },
        { from: "58", fromOut: 0, to: "57", toIn: "width" },
        { from: "58", fromOut: 1, to: "57", toIn: "height" },
        { from: "94", fromOut: 0, to: "62", toIn: "image" },
        { from: "94", fromOut: 0, to: "39", toIn: "image_ref" },
        { from: "1", fromOut: 0, to: "62", toIn: "model" },
        { from: "1", fromOut: 1, to: "59", toIn: "clip" },
        { from: "1", fromOut: 1, to: "60", toIn: "clip" },
        { from: "1", fromOut: 2, to: "62", toIn: "vae" },
        { from: "1", fromOut: 2, to: "11", toIn: "vae" },
        { from: "3", fromOut: 0, to: "62", toIn: "model_patch" },
        { from: "86", fromOut: 0, to: "87", toIn: "clip" },
        { from: "87", fromOut: 0, to: "59", toIn: "text_g" },
        { from: "87", fromOut: 0, to: "59", toIn: "text_l" },
        { from: "59", fromOut: 0, to: "20", toIn: "positive" },
        { from: "60", fromOut: 0, to: "20", toIn: "negative" },
        { from: "62", fromOut: 0, to: "29", toIn: "model" },
        { from: "62", fromOut: 0, to: "20", toIn: "model" },
        { from: "76", fromOut: 0, to: "20", toIn: "sampler" },
        { from: "29", fromOut: 0, to: "20", toIn: "sigmas" },
        { from: "57", fromOut: 0, to: "20", toIn: "latent_image" },
        { from: "20", fromOut: 0, to: "11", toIn: "samples" },
        { from: "11", fromOut: 0, to: "39", toIn: "image_target" },
        { from: "39", fromOut: 0, to: "96", toIn: "image_b" },
        { from: "39", fromOut: 0, to: "97", toIn: "images" }
      ]
    },
    stages: [
      { name: "输入与缩放", nodes: ["92", "94", "58", "57"], desc: "低清输入图按 2.25 百万像素 lanczos 放大，宽高同步给空白潜空间画布，后续修复、配色与采样全部基于这张缩放图。" },
      { name: "三模型加载", nodes: ["1", "3", "86"], desc: "SDXL 写实底模、SUPIR-v0Q 修复补丁与 Qwen3.5 4B 语言模型分别就位，分别承担扩散先验、修复引导与自动写词三种职责。" },
      { name: "自动提示词", nodes: ["87", "59", "60"], desc: "LLM 看图生成英文描述，经 SDXL 双编码器变成正向条件；负向条件由长串反例词编码而成，两路都来自同一个底模 CLIP。" },
      { name: "SUPIR 采样", nodes: ["62", "76", "29", "20"], desc: "修复补丁挂上主干，dpmpp_2m_sde 加 sgm_uniform 的 10 步采样在空白画布上重建细节，引导强度从 1 衰减到 0.9。" },
      { name: "解码与输出", nodes: ["11", "39", "96", "97"], desc: "VAE 解码后经 ColorTransfer 把色调对齐回输入图，ImageCompare 滑杆对比前后，SaveImage 落盘。" }
    ],
    nodeAnalysis: [
      { node: "92", detail: "输入图加载节点，当前是模板自带的示例图 blurry_city_horses.png，一张夜色城市中奔跑的马群低清照。IMAGE 输出三路：进 ResizeImageMaskNode 做修复前的像素扩充、直接给 TextGenerate 当看图素材、再给 ImageCompare 当对比左图。想修自己的图，把下拉框换成上传文件即可，其余连线不用动，MASK 输出悬空。" },
      { node: "1", detail: "加载 SDXL 写实底模 juggernautXL_v9Rdphoto2Lightning.safetensors，这是 Juggernaut XL V9 的 RDPhoto2 Lightning 变体，为少步写实生成特调。MODEL 输出进 SUPIRApply，是补丁附着的主干；CLIP 同时供正负两个 CLIPTextEncodeSDXL；VAE 分两路进 SUPIRApply 与 VAEDecode。SUPIR 的重建风格高度依赖底模，换更写实的 SDXL 底模会直接改变成片质感。文件放 models/checkpoints 目录。" },
      { node: "3", detail: "ModelPatchLoader 是 ComfyUI 原生的模型补丁加载器，从 models/model_patches 目录读取 SUPIR-v0Q_fp16.safetensors。v0Q 是 SUPIR 官方放出的高保真版本，文件里装的是控制网络与去噪编码器等附加权重，加载器会按文件特征自动识别补丁类型。MODEL_PATCH 输出接 SUPIRApply 的 model_patch 端口，注意这个目录名与 checkpoints 不同，放错位置节点会变红。" },
      { node: "86", detail: "CLIPLoader 加载 qwen3.5_4b_bf16.safetensors，一个 40 亿参数的 Qwen3.5 视觉语言模型，type 选 stable_diffusion、device 保持 default。它在这个工作流里不编码图像条件，而是被 TextGenerate 当成会看图的写字模型调用，自动产出英文画质描述。模型文件放 models/text_encoders，约 8GB 显存占用，显存紧张时可以换更小的 LLM。" },
      { node: "94", detail: "ResizeImageMaskNode 是核心内置的通用缩放节点，同时支持图像与遮罩。配置为按总像素缩放、目标 2.25 百万像素、lanczos 插值，输出接三处：SUPIRApply 的修复目标、ColorTransfer 的色彩参考、GetImageSize 的尺寸来源。2.25 百万像素约等于原面积的两倍出头，想要更大倍率直接上调这个值，但显存与耗时随之上涨。三路同源是修复一致性的关键。" },
      { node: "58", detail: "GetImageSize 免参数节点，读入缩放图后输出 width 与 height 两个整数，分别接 EmptyLatentImage 的宽高端口。这样空白画布永远与修复目标同尺寸，换图或改倍率都不需要手动同步。它输出的 batch_size 第三个端口在本图中未使用。" },
      { node: "57", detail: "空白潜空间节点，控件里的 512 x 512 只是占位值，实际被 GetImageSize 的连线覆盖成缩放图的真实尺寸。输出作为 SamplerCustom 的 latent_image，也就是采样的画布。与图生图不同，这里不从原图潜空间出发，而是空白起画，内容重建完全交给 SUPIR 补丁引导，这正是 SUPIR 自由重建细节的机制基础。" },
      { node: "87", detail: "TextGenerate 是 ComfyUI 原生的 LLM 文本生成节点，clip 输入来自 CLIPLoader 的 Qwen3.5，image 输入直接吃 LoadImage 的原图。指令词要求只用英文描述画面，采样参数为温度 0.7、top_k 64、top_p 0.95、min_p 0.05、重复惩罚 1.05，上限 2048 token，thinking 关闭。源文件里指令还与可选手写描述拼接，并经 ComfySwitchNode 加 KJNodes 的 BOOLConstant 在自动手动两种模式间切换，当前自动生效，简化图直接把生成文本送进正向编码器。" },
      { node: "59", detail: "正向条件编码器，用 SDXL 的双文本编码器分别处理 text_g 全局描述与 text_l 局部描述，两路接的都是 TextGenerate 的输出，控件里预留的老人肖像文案只是被连线覆盖的占位。六个尺寸控件保持 1024 默认。CONDITIONING 输出接 SamplerCustom 的 positive 端口。LLM 描述会替换成当前画面内容，所以模板自带的文案不必手改。" },
      { node: "60", detail: "负向条件编码器，结构与正向完全相同，负向词来自源文件中被省略的多行字符串节点，内容是 painting、oil painting、low quality、watermark、jpeg artifacts、over-smooth 等一长串反例词，两个控件分别对应 text_g 与 text_l。SUPIR 对负向词很敏感，这段词防止重建结果滑向插画风格、过度磨皮或伪影，建议保留原文不要清空。" },
      { node: "62", detail: "全图灵魂节点 SUPIRApply，是 ComfyUI 原生 SUPIR 实现：把 ModelPatchLoader 的补丁挂到底模 MODEL 上输出修饰后的模型。它同时用补丁内置的 denoise_encoder 加底模 VAE 把缩放图编码成参考特征，在采样每一步引导去噪方向。四个控件依次是 strength_start 1、strength_end 0.9、restore_cfg 4、restore_cfg_s_tmin 0.05：强度随采样进程线性衰减，restore_cfg 把中间结果往输入方向拉拽保真，阈值以下的低噪声区停止拉拽。想更贴近原图就降强度，想更多重建细节就提高起始强度。" },
      { node: "76", detail: "KSamplerSelect 选定采样算法为 dpmpp_2m_sde，这是 SUPIR 官方推荐的采样器之一，二阶多步加随机性，在少步数下细节重建稳定。它只输出算法选择器本身，与 BasicScheduler 的 sigma 序列在 SamplerCustom 里组装。想换采样器直接改这里的下拉框，不需要动别的连线。" },
      { node: "29", detail: "BasicScheduler 生成 10 步的 sigma 噪声调度序列，调度器 sgm_uniform，denoise 1。关键细节是 model 输入接的是 SUPIRApply 的输出而不是底模本体，这样 sigma 计算基于补丁修饰后的模型，噪声节奏与修复引导匹配。steps 与 denoise 由子图对外暴露的参数统一供给，本图数值已写回控件。" },
      { node: "20", detail: "SamplerCustom 执行最终采样：模型来自 SUPIRApply，正负条件来自两个 SDXL 编码器，sampler 与 sigmas 分别来自选择器与调度器，latent_image 是与缩放图同尺寸的空白画布。add_noise 开、种子 402244474214267 固定、CFG 1.5。CFG 只需要小值，因为画面内容的控制权在补丁手里，条件只负责质感方向；第二个输出 denoised_output 在本图悬空。" },
      { node: "11", detail: "VAEDecode 把采样完成的潜空间还原成像素图，VAE 来自同一个 checkpoint。由于 SUPIR 从空白画布重建画面，解码结果就是完整的放大修复图。显存吃紧时可换成 VAE Decode Tiled 分块解码，几乎无损画质。" },
      { node: "39", detail: "ColorTransfer 是核心内置的色彩迁移节点，image_target 接 SUPIR 结果，image_ref 接缩放后的原输入图。方法 mkl_lab 在 LAB 色彩空间做统计量匹配，source_stats 选 per_frame 表示逐帧计算，强度 1。重新去噪难免整体偏色或发灰，这一步把成片色调拉回原图基准，是官方模板给修复质量的最后一道保险。" },
      { node: "96", detail: "ImageCompare 是核心内置的对比预览节点，image_a 接原图、image_b 接修复结果，在界面上生成可拖动滑杆的前后对比视图。它是输出型节点，不向下游提供数据，删除不影响运行，但留着非常直观，能立刻看出修复对皮肤纹理与建筑细节的重建幅度。" },
      { node: "97", detail: "SaveImage 接收 ColorTransfer 的输出，文件名前缀 upscaled_by_supir，写入 output 目录。PNG 内嵌完整工作流元数据，把成图拖回画布即可还原整条链路。批量修复时建议把前缀改成项目名便于归档。" }
    ],
    flow: [
      "① LoadImage 读入低清图，ResizeImageMaskNode 按 2.25 百万像素 lanczos 放大。",
      "② GetImageSize 把缩放图宽高喂给 EmptyLatentImage，生成同尺寸空白画布。",
      "③ Qwen3.5 LLM 看图自动写出英文描述词，经 SDXL 双编码器变成正负条件。",
      "④ ModelPatchLoader 载入 SUPIR-v0Q 补丁，SUPIRApply 把补丁挂上 SDXL 主干。",
      "⑤ dpmpp_2m_sde 加 sgm_uniform 组成 10 步采样，SamplerCustom 在空白画布上重建细节。",
      "⑥ VAEDecode 解码成图，ColorTransfer 把色调对齐回输入图。",
      "⑦ ImageCompare 滑杆对比前后，SaveImage 以 upscaled_by_supir 前缀落盘。"
    ],
    params: [
      { name: "strength_start / strength_end", value: "1 / 0.9", desc: "SUPIR 引导强度的起止值，随采样线性衰减；调低更贴近原片但细节减少，调高重建更激进。" },
      { name: "restore_cfg", value: "4", desc: "把去噪中间结果拉回输入潜空间的保真项，越高越忠于原图，设 0 关闭。" },
      { name: "restore_cfg_s_tmin", value: "0.05", desc: "sigma 阈值，低于该值停止 restore_cfg 拉拽，避免收尾阶段细节被压平。" },
      { name: "final_megapixels", value: "2.25", desc: "缩放目标总像素，约两倍面积；想要更大倍率可上调，但要注意显存与耗时。" },
      { name: "steps / cfg", value: "10 / 1.5", desc: "SUPIR 官方的小步数低 CFG 组合，配 dpmpp_2m_sde 与 sgm_uniform，不建议随意拉高步数。" },
      { name: "seed", value: "402244474214267（fixed）", desc: "修复类任务对种子不敏感，固定种子便于对比参数改动效果。" }
    ],
    tips: [
      "SUPIR 的本质是把低清图当条件、借预训练 SDXL 的生成先验重画细节，底模画质决定上限，换更强写实的 SDXL 底模收益明显。",
      "三种文件三个目录：底模放 checkpoints、补丁放 model_patches、LLM 放 text_encoders，目录错一个节点就找不到文件。",
      "修复痕迹重就降 restore_cfg 或把 strength_end 调低，细节不够就提高 final_megapixels 的像素预算。",
      "自动描述理解画面翻车时，可在源文件的切换开关处改用手动描述，手写一段画面句子即可接管正向词。",
      "Lightning 底模为少步设计，步数拉到 30 以上收益极小而时间翻倍，保持 10 步即可。"
    ],
    notice: "源文件是一个名为 Image Upscale (SUPIR) 的子图，本图为子图展开后的主干简化：省略了两个 MarkdownNote、PreviewAny 预览、手动描述字符串节点与自动手动切换用的 ComfySwitchNode 和 KJNodes 的 BOOLConstant（当前自动描述生效，LLM 输出直接进入正向编码器）。子图对外暴露的倍率、强度、步数、种子等参数在外层实例节点上是代理控件，本图已把这些实际生效值写回各节点控件。另外子图输入的两个下拉框标签 SUPIR_model 与 SDXL_model 在官方模板中标反了，实际底模是 juggernautXL、补丁才是 SUPIR-v0Q。"
  });

  // ---------- 31. ACE-Step 音乐生成 ----------
  window.COMFY_DATA.workflows.push({
    id: "ace-step-music",
    name: "ACE-Step 音乐生成",
    category: "音频生成",
    tags: ["ACE-Step", "音乐", "音频", "官方模板"],
    difficulty: 3,
    source: "ComfyUI 官方模板库（真实文件 audio_ace_step1_5_xl_turbo.json）",
    summary: "ACE-Step 1.5 是开源音乐生成基础模型，官方 XL turbo 模板用 8 步采样把风格标签加歌词变成最长两分钟的完整歌曲。特色在条件节点 TextEncodeAceStepAudio1.5：风格、歌词、BPM、拍号、调式、语言等音乐要素全部在这里一起编码，其内部还有一个小 LLM 生成音频码提升音质。负向条件由零化节点占位，CFG 1 配 ModelSamplingAuraFlow 的 shift 3 调度，音频专用潜空间经 VAE 解码后直接存成 mp3。",
    useCases: [
      "输入风格标签与歌词快速生成完整歌曲",
      "定制 BPM 与调式的短视频背景音乐",
      "写好分段歌词生成带人声的 demo 小样",
      "学习音频潜空间与图像工作流的异同"
    ],
    models: [
      { type: "UNET", name: "acestep_v1.5_xl_turbo_bf16.safetensors", note: "ACE-Step 1.5 XL turbo 音乐主干 bf16 版，8 步出曲，放 models/diffusion_models" },
      { type: "CLIP", name: "qwen_0.6b_ace15.safetensors + qwen_4b_ace15.safetensors", note: "双 Qwen 文本编码器，DualCLIPLoader type 必须选 ace，放 models/text_encoders" },
      { type: "VAE", name: "ace_1.5_vae.safetensors", note: "ACE-Step 1.5 音频 VAE，负责把音频潜空间解码成波形，放 models/vae" }
    ],
    graph: {
      nodes: [
        { id: "104", title: "UNETLoader", cat: "load", x: 20, y: 40,
          widgets: ["acestep_v1.5_xl_turbo_bf16.safetensors", "default"],
          inputs: [],
          outputs: [ { type: "MODEL" } ],
          params: [
            { name: "unet_name", kind: "下拉选择", default: "acestep_v1.5_xl_turbo_bf16.safetensors", desc: "ACE-Step 1.5 XL turbo 音乐主干，官方蒸馏的快速版本，8 步即可成曲。" },
            { name: "weight_dtype", kind: "下拉选择", default: "default", desc: "保持 default 按文件 bf16 精度读取。" }
          ],
          brief: "加载 ACE-Step 1.5 XL turbo 音乐主干。",
          desc: "turbo 版为少步快速生成特调，8 步即可成曲；weight_dtype 保持 default。MODEL 输出经 ModelSamplingAuraFlow 修饰后进 KSampler。" },
        { id: "105", title: "DualCLIPLoader", cat: "load", x: 20, y: 240,
          widgets: ["qwen_0.6b_ace15.safetensors", "qwen_4b_ace15.safetensors", "ace", "default"],
          inputs: [],
          outputs: [ { type: "CLIP" } ],
          params: [
            { name: "clip_name1", kind: "下拉选择", default: "qwen_0.6b_ace15.safetensors", desc: "小 Qwen 编码器，负责节奏、标签等控制信号的编码。" },
            { name: "clip_name2", kind: "下拉选择", default: "qwen_4b_ace15.safetensors", desc: "大 Qwen 编码器，负责歌词语义与人声韵律的理解。" },
            { name: "type", kind: "下拉选择", default: "ace", desc: "必须选 ace，否则编码口径与主干对不上，直接报错或产出噪声。" },
            { name: "device", kind: "下拉选择", default: "default", desc: "设备选择保持 default。" }
          ],
          brief: "加载 0.6B 与 4B 两个 Qwen 编码器，type 选 ace。",
          desc: "小模型负责节奏、标签等控制信号的编码，大模型负责歌词语义与人声韵律的理解，type 必须选 ace，否则整套编码口径与主干对不上。" },
        { id: "106", title: "VAELoader", cat: "load", x: 20, y: 440,
          widgets: ["ace_1.5_vae.safetensors"],
          inputs: [],
          outputs: [ { type: "VAE" } ],
          params: [
            { name: "vae_name", kind: "下拉选择", default: "ace_1.5_vae.safetensors", desc: "音频专用 VAE，只负责最终解码成波形；与图像 VAE 完全不通用，接错报维度错误。" }
          ],
          brief: "加载 ACE-Step 1.5 音频 VAE。",
          desc: "只服务于最终解码：起点潜空间由专用的空音频潜节点直接给出，本图没有音频编码环节，所以 VAE 只接 VAEDecodeAudio。" },
        { id: "94", title: "TextEncodeAceStepAudio1.5", cat: "cond", x: 360, y: 40,
          widgets: ["Late Night Trap, 95 BPM, Heavy 808 Bass, Wet Synths, Female Background Vocals, Male Rap Vocals + Seductive Female Vocals, Dark Bedroom Production, Atmospheric Club Vibes, Breathy Whispers, Slap Bass, Deep Sub Bass, Cinematic R&B Soundtrack Feel", "[Verse 1]\nOpen up the canvas, blank slate on my screen\nDrag a checkpoint loader, you know what I mean\nKSampler in the middle, VAE on the right\nClip text encode, yeah I\u0027m building tonight\n[Chorus]\nConnect the nodes, run the queue\nWatch the latent flow right through\nGreen dot to green dot, link it up\nPositive prompt in my cup\n[Verse 2]\nEmpty latent image, set the width and height\nPlug it to the sampler, get the settings right\nCFG at seven, steps at twenty-two\nHit that Queue Prompt button, render coming through\n[Bridge]\nUpscale node, ControlNet in the chain\nLora stacked on Lora driving me insane\nSave image at the end of every single flow\nRed wire means broken — fix it, let it go\n[Outro]\nNodes connected, workflow clean\nBest AI pipeline you ever seen\nComfyUI, yeah we building art\nOne node at a time right from the start", "0", "fixed", "95", "120", "4", "en", "E minor", "true", "2", "0.85", "0.9", "0", "0"],
          inputs: [ { name: "clip", type: "CLIP" } ],
          outputs: [ { type: "CONDITIONING" } ],
          params: [
            { name: "tags", kind: "多行文本", default: "Late Night Trap, 95 BPM, Heavy 808 Bass, Wet Synths, Female Background Vocals, Male Rap Vocals + Seductive Female Vocals, Dark Bedroom Production, Atmospheric Club Vibes, Breathy Whispers, Slap Bass, Deep Sub Bass, Cinematic R&B Soundtrack Feel", desc: "逗号分隔的风格与配器关键词，是决定曲风的第一要素，BPM 也可以写在这里。" },
            { name: "lyrics", kind: "多行文本", default: "[Verse 1]\nOpen up the canvas, blank slate on my screen\nDrag a checkpoint loader, you know what I mean\nKSampler in the middle, VAE on the right\nClip text encode, yeah I\u0027m building tonight\n[Chorus]\nConnect the nodes, run the queue\nWatch the latent flow right through\nGreen dot to green dot, link it up\nPositive prompt in my cup\n[Verse 2]\nEmpty latent image, set the width and height\nPlug it to the sampler, get the settings right\nCFG at seven, steps at twenty-two\nHit that Queue Prompt button, render coming through\n[Bridge]\nUpscale node, ControlNet in the chain\nLora stacked on Lora driving me insane\nSave image at the end of every single flow\nRed wire means broken — fix it, let it go\n[Outro]\nNodes connected, workflow clean\nBest AI pipeline you ever seen\nComfyUI, yeah we building art\nOne node at a time right from the start", desc: "歌词文本，用 Verse、Chorus、Bridge、Outro 段落标记控制歌曲结构；整段留空可生成纯音乐。" },
            { name: "seed", kind: "整数", default: "0", desc: "条件编码器的种子，与 KSampler 由同一来源供给，保证音频码生成与采样一致。" },
            { name: "control_after_generate", kind: "下拉选择", default: "fixed", desc: "种子控制模式，fixed 保持可复现。",
              options: [["fixed", "保持不变"], ["randomize", "每次随机"], ["increment", "每次加一"]] },
            { name: "bpm", kind: "整数", default: "95", desc: "每分钟节拍数，决定歌曲速度，与 tags 里写到的 BPM 保持一致。" },
            { name: "duration", kind: "整数", default: "120", desc: "目标曲长秒数，与空音频潜节点的秒数由同一来源联动，改曲长要两处一致。" },
            { name: "keyscale", kind: "整数", default: "4", desc: "拍号，4 表示常见四拍子。" },
            { name: "language", kind: "下拉选择", default: "en", desc: "歌词语言标记，要与歌词实际语种一致，人声发音才自然。" },
            { name: "key", kind: "文本", default: "E minor", desc: "调式，影响整体氛围；小调偏暗郁，大调偏明亮。" },
            { name: "generate_audio_codes", kind: "开关", default: "true", desc: "开启后内部 LLM 先生成音频码，音质更好但更慢；赶时间关掉可显著提速。" },
            { name: "cfg_scale", kind: "浮点数", default: "2", desc: "编码器内部音频码生成的高级采样参数，保持默认。" },
            { name: "temperature", kind: "浮点数", default: "0.85", desc: "音频码生成的采样温度，保持默认。" },
            { name: "top_p", kind: "浮点数", default: "0.9", desc: "音频码生成的核采样阈值，保持默认。" },
            { name: "top_k", kind: "整数", default: "0", desc: "保持 0 表示不启用 top_k 过滤。" },
            { name: "min_p", kind: "浮点数", default: "0", desc: "保持 0 表示不启用 min_p 过滤。" }
          ],
          brief: "音乐要素总控：标签、歌词、BPM、调式一次编码成条件。",
          desc: "第一格 tags 写曲风与配器，第二格 lyrics 用 Verse Chorus 段落标记写歌词，后面依次是 BPM 95、时长 120 秒、拍号 4、语言 en、调式 E minor。generate_audio_codes 开启会调用内部 LLM 生成音频码，音质更高但更慢；duration 与 seed 控件被连线统一供给，输出同时作正向条件与负向条件的源头。" },
        { id: "47", title: "ConditioningZeroOut", cat: "cond", x: 640, y: 240,
          widgets: [],
          inputs: [ { name: "conditioning", type: "CONDITIONING" } ],
          outputs: [ { type: "CONDITIONING" } ],
          brief: "把正向条件清零后充当负向占位。",
          desc: "turbo 模式 CFG 固定 1，负向条件实际不参与计算，用零化条件占位比真编一段负向词更省算力，保留是为了结构完整。" },
        { id: "98", title: "EmptyAceStep1.5LatentAudio", cat: "audio", x: 360, y: 440,
          widgets: ["120", "1"],
          inputs: [],
          outputs: [ { type: "LATENT" } ],
          params: [
            { name: "duration", kind: "整数", default: "120", desc: "空白音频潜空间的秒数，必须与条件编码器的 duration 一致，否则歌词与曲长对不上。" },
            { name: "batch_size", kind: "整数", default: "1", desc: "一次生成几首，保持 1。" }
          ],
          brief: "生成 120 秒的空白音频潜空间。",
          desc: "秒数与条件编码器的 duration 由同一个被省略的 Primitive 节点统一供给并保持联动，批量为 1。音频潜空间是 64 通道的一维时间序列，与图像潜空间的四维结构完全不同，不能混用。" },
        { id: "78", title: "ModelSamplingAuraFlow", cat: "model", x: 640, y: 40,
          widgets: ["3"],
          inputs: [ { name: "model", type: "MODEL" } ],
          outputs: [ { type: "MODEL" } ],
          params: [
            { name: "shift", kind: "整数", default: "3", desc: "AuraFlow 式调度偏移，ACE-Step 沿用该调度结构；官方默认 3，影响噪声削减节奏，一般不动。" }
          ],
          brief: "附加 AuraFlow 式采样调度偏移 shift 3。",
          desc: "ACE-Step 沿用 AuraFlow 的离散流调度结构，shift 决定去噪预算在高低调噪声区的分配，官方默认 3，一般不需要调整。" },
        { id: "3", title: "KSampler", cat: "sampler", x: 880, y: 240,
          widgets: ["0", "fixed", "8", "1", "euler", "simple", "1"],
          inputs: [ { name: "model", type: "MODEL" }, { name: "positive", type: "CONDITIONING" }, { name: "negative", type: "CONDITIONING" }, { name: "latent_image", type: "LATENT" } ],
          outputs: [ { type: "LATENT" } ],
          params: [
            { name: "seed", kind: "整数", default: "0", desc: "采样种子，控件由连线供给并与条件编码器共享来源，保证音频码与采样一致。" },
            { name: "control_after_generate", kind: "下拉选择", default: "fixed", desc: "种子控制模式，fixed 保持可复现。",
              options: [["fixed", "保持不变"], ["randomize", "每次随机"], ["increment", "每次加一"]] },
            { name: "steps", kind: "整数", default: "8", desc: "turbo 主干专属步数；直接套到普通 ACE-Step 主干会得到欠拟合的糊曲。" },
            { name: "cfg", kind: "浮点数", default: "1", desc: "turbo 模式固定 1，负向条件实际不参与计算。" },
            { name: "sampler_name", kind: "下拉选择", default: "euler", desc: "euler 加 simple 是 turbo 主干的固定搭配。",
              options: [["euler", "官方默认"], ["dpmpp_2m", "可尝试但非官方组合"], ["uni_pc", "可尝试"]] },
            { name: "scheduler", kind: "下拉选择", default: "simple", desc: "简化日程，与 8 步 turbo 搭配。",
              options: [["simple", "官方默认"], ["normal", "线性计划"], ["sgm_uniform", "可对比"]] },
            { name: "denoise", kind: "浮点数", default: "1", desc: "从空白音频潜空间完整生成，保持 1。" }
          ],
          brief: "8 步 CFG 1 的快速音频采样。",
          desc: "turbo 主干专属参数：8 步、CFG 1、euler 加 simple、denoise 1。种子控件被连线供给并与条件编码器共享同一个来源，保证音频码生成与采样使用一致种子。" },
        { id: "18", title: "VAEDecodeAudio", cat: "audio", x: 1160, y: 240,
          widgets: [],
          inputs: [ { name: "samples", type: "LATENT" }, { name: "vae", type: "VAE" } ],
          outputs: [ { type: "AUDIO" } ],
          brief: "把音频潜空间解码成可播放的波形。",
          desc: "节点本身无参数，samples 来自 KSampler，vae 来自专用音频 VAE，输出 AUDIO 类型接保存节点。音频 VAE 与图像 VAE 互不通用。" },
        { id: "111", title: "SaveAudioAdvanced", cat: "audio", x: 1480, y: 240,
          widgets: ["audio/ACE_Step1.5_xl_turbo", "mp3", "V0"],
          inputs: [ { name: "audio", type: "AUDIO" } ],
          outputs: [ { type: "AUDIO" } ],
          params: [
            { name: "filename_prefix", kind: "文本", default: "audio/ACE_Step1.5_xl_turbo", desc: "输出前缀支持子目录写法，产物落在 output 下的同名子文件夹。" },
            { name: "format", kind: "下拉选择", default: "mp3", desc: "输出格式；换 flac 或 wav 可得无损档案。",
              options: [["mp3", "有损压缩，兼容性最好"], ["flac", "无损档案"], ["wav", "无损原始波形，体积大"], ["opus", "体积更小的有损格式"]] },
            { name: "quality", kind: "下拉选择", default: "V0", desc: "mp3 编码质量，V0 即最高码率 VBR。",
              options: [["V0", "最高码率 VBR"], ["V2", "高质量，体积更小"], ["320k", "固定 320kbps"]] }
          ],
          brief: "把成曲保存为 mp3 文件。",
          desc: "核心内置的增强版音频保存节点：前缀 audio/ACE_Step1.5_xl_turbo 表示输出到 output 下的同名子目录，格式 mp3，质量 V0 即最高码率 VBR。换 flac 或 wav 可得无损档案。" }
      ],
      links: [
        { from: "104", fromOut: 0, to: "78", toIn: "model" },
        { from: "78", fromOut: 0, to: "3", toIn: "model" },
        { from: "105", fromOut: 0, to: "94", toIn: "clip" },
        { from: "94", fromOut: 0, to: "3", toIn: "positive" },
        { from: "94", fromOut: 0, to: "47", toIn: "conditioning" },
        { from: "47", fromOut: 0, to: "3", toIn: "negative" },
        { from: "98", fromOut: 0, to: "3", toIn: "latent_image" },
        { from: "3", fromOut: 0, to: "18", toIn: "samples" },
        { from: "106", fromOut: 0, to: "18", toIn: "vae" },
        { from: "18", fromOut: 0, to: "111", toIn: "audio" }
      ]
    },
    stages: [
      { name: "模型加载", nodes: ["104", "105", "106"], desc: "turbo 音乐主干、双 Qwen 文本编码器与音频 VAE 三件就位，DualCLIPLoader 的 type 必须选 ace。" },
      { name: "条件与画布", nodes: ["94", "47", "98"], desc: "风格标签、歌词与 BPM、调式等要素在专用编码器里变成条件，零化节点生成空负向，空音频潜节点给出 120 秒画布。" },
      { name: "采样与调度", nodes: ["78", "3"], desc: "主干经 AuraFlow 式 shift 3 调度修饰，KSampler 以 8 步 CFG 1 从空白音频潜空间去噪成曲。" },
      { name: "解码与保存", nodes: ["18", "111"], desc: "音频 VAE 把潜空间还原成波形，SaveAudioAdvanced 以 mp3 V0 质量写入输出目录。" }
    ],
    nodeAnalysis: [
      { node: "104", detail: "加载 ACE-Step 1.5 XL turbo 音乐主干 acestep_v1.5_xl_turbo_bf16.safetensors，bf16 半精度，weight_dtype 保持 default。turbo 是官方蒸馏过的快速版本，把常规几十步的生成压缩到 8 步。MODEL 输出经 ModelSamplingAuraFlow 后进入 KSampler。文件放 models/diffusion_models 目录，缺失时节点下拉框会为空。" },
      { node: "105", detail: "DualCLIPLoader 同时加载 qwen_0.6b_ace15 与 qwen_4b_ace15 两个 Qwen 编码器，type 必须选 ace，device 保持 default。小模型编码节奏、标签等控制信号，大模型理解歌词语义与人声韵律，两路编码结果共同构成音乐条件。type 选错会导致编码器输出与主干维度不匹配，直接报错或产出噪声。" },
      { node: "106", detail: "加载音频专用 VAE ace_1.5_vae.safetensors。本图没有音频编码环节，空音频潜空间由 EmptyAceStep1.5LatentAudio 直接给出，所以 VAE 只接 VAEDecodeAudio 负责最终解码。它与 SD 系、Flux 系的图像 VAE 完全不通用，接错会报维度错误。" },
      { node: "94", detail: "全图的词曲控制台 TextEncodeAceStepAudio1.5：tags 一行写 Late Night Trap 加 95 BPM、808 贝斯、男女声等风格配器关键词；lyrics 用 Verse 1、Chorus、Bridge、Outro 段落标记写完整歌词，本模板的示例歌词恰好是唱 ComfyUI 工作流的说唱词；随后是 BPM 95、时长 120 秒、拍号 4、语言 en、调式 E minor。generate_audio_codes 开启时内部 LLM 会先生成音频码，音质更好但耗时增加。duration 与 seed 控件由连线供给，cfg_scale 2、temperature 0.85、top_p 0.9 为高级采样参数保持默认。输出同时接正向采样与零化节点。" },
      { node: "47", detail: "ConditioningZeroOut 把正向条件复制并清零后输出给 KSampler 的 negative 端口。turbo 模式 CFG 固定 1，负向条件不参与实际计算，用零化占位比真编码一段负向词更省算力。它与正向编码器共享输入，正向改动时无需同步这里。" },
      { node: "98", detail: "EmptyAceStep1.5LatentAudio 生成空白音频潜空间：120 秒、批量 1。秒数由源文件中一个标题为 Float (Duration) 的 Primitive 节点供给，同时喂给条件编码器的 duration，两处自动保持一致，简化图中数值已写回控件。音频潜空间是 64 通道的一维时间序列，改秒数这里与编码器要一起改，否则歌词与曲长对不上。" },
      { node: "78", detail: "ModelSamplingAuraFlow 给模型附加 shift 3 的调度偏移。ACE-Step 沿用了 AuraFlow 的离散流调度结构，shift 决定去噪预算在高噪声与低噪声区间的分配方式，官方默认 3。它是音频质量与稳定性的隐性开关，一般不动，输出接 KSampler 的 model 端口。" },
      { node: "3", detail: "KSampler 四路输入齐备：模型来自调度修饰后的主干，正负条件来自专用编码器与零化节点，起点是 120 秒空音频潜空间。参数为 seed 0 加 fixed、8 步、CFG 1、euler 加 simple、denoise 1。种子控件被连线供给，与条件编码器共享同一来源，保证内部音频码生成与采样一致。8 步配 CFG 1 是 turbo 主干的固定搭配。" },
      { node: "18", detail: "VAEDecodeAudio 把 8 步去噪后的音频潜空间还原成波形 AUDIO，samples 来自 KSampler，vae 来自专用音频 VAE。节点本身无参数。AUDIO 类型在 ComfyUI 里可以直接接预览播放，也可以像本图一样接保存节点落盘。" },
      { node: "111", detail: "SaveAudioAdvanced 是核心内置的增强版音频保存节点，比普通 SaveAudio 多出格式与质量选项。当前设置：前缀 audio/ACE_Step1.5_xl_turbo，即输出到 output 目录下的同名子文件夹；格式 mp3；质量 V0，也就是最高码率的 VBR 编码。需要无损档案时换 flac 或 wav，想减小体积可选 opus。" }
    ],
    flow: [
      "① 三个加载器分别载入 turbo 音乐主干、双 Qwen 编码器与音频 VAE。",
      "② TextEncodeAceStepAudio1.5 把风格标签、歌词与 BPM、调式等要素一起编码成条件。",
      "③ ConditioningZeroOut 生成空负向条件，EmptyAceStep1.5LatentAudio 给出 120 秒画布。",
      "④ 主干经 ModelSamplingAuraFlow 的 shift 3 修饰后进入 KSampler。",
      "⑤ 8 步 CFG 1 采样把空白音频潜空间去噪成曲。",
      "⑥ VAEDecodeAudio 还原波形，SaveAudioAdvanced 以 mp3 V0 落盘。"
    ],
    params: [
      { name: "steps / cfg", value: "8 / 1", desc: "turbo 主干专用组合，换成非 turbo 主干需按官方建议提高步数并调整 CFG。" },
      { name: "shift", value: "3", desc: "ModelSamplingAuraFlow 的调度偏移，官方默认值，影响噪声削减节奏。" },
      { name: "tags", value: "Late Night Trap, 95 BPM, ...", desc: "逗号分隔的风格与配器关键词，是决定曲风的第一要素，BPM 也可以写在这里。" },
      { name: "bpm / duration", value: "95 / 120 秒", desc: "节拍与曲长，duration 与空音频潜节点的秒数由同一来源联动，改曲长要两处一致。" },
      { name: "keyscale / language", value: "E minor / en", desc: "调式与歌词语言，调式影响整体氛围，语言要与歌词实际语种一致。" },
      { name: "generate_audio_codes", value: "true", desc: "开启后内部 LLM 先生成音频码，音质更好但更慢；关闭可显著提速。" }
    ],
    tips: [
      "tags 决定曲风与配器，用逗号列出风格、BPM、人声类型、乐器等关键词，比歌词对听感的影响更直接。",
      "lyrics 用 Verse、Chorus、Bridge 段落标签控制歌曲结构，整段留空可以生成纯音乐。",
      "duration 与空音频潜节点的秒数必须一致，源文件用同一个 Primitive 同时喂两处，手动改时记得同步。",
      "赶时间就把 generate_audio_codes 关掉，速度提升明显，音质略降；追求发布品质保持开启。",
      "8 步是 turbo 专属参数，直接套到普通 ACE-Step 主干上会得到欠拟合的糊曲，两套参数不要混用。"
    ],
    notice: "源文件里的两个 Primitive 节点（标题分别为 Float (Duration) 与 Int (Seed)）同时给空音频潜节点、条件编码器与采样器供数，本简化图按规则将其省略并把实际数值写回各节点控件；左上角的 MarkdownNote 模型指引节点同样省略。"
  });

  // ---------- 32. SD3.5 Canny 结构控制 ----------
  window.COMFY_DATA.workflows.push({
    id: "sd35-canny",
    name: "SD3.5 Canny 结构控制",
    category: "ControlNet",
    tags: ["SD3.5", "ControlNet", "Canny", "官方模板"],
    difficulty: 3,
    source: "ComfyUI 官方模板库（真实文件 sd3.5_large_canny_controlnet_example.json）",
    summary: "SD3.5 Large 官方 Canny 控制模板：参考图经 ImageScale 统一成 1024 方图后抽取 Canny 边缘，ControlNetApplyAdvanced 把边缘图以 0.66 强度同时注入正负条件，KSampler 用 32 步 CFG 4.5 在空白 SD3 潜空间上重新作画。构图轮廓跟随参考图，画面内容则由提示词自由发挥，示例里是水晶粉龙替换原图场景。全图只有 13 个节点，是理解 ControlNet 结构控制最干净的一课。",
    useCases: [
      "用边缘图或线稿锁定构图重新生成画面",
      "保持轮廓不变替换主体与风格",
      "学习 ControlNetApplyAdvanced 的标准接线",
      "测试 SD3.5 Canny 控制强度对画面的约束力"
    ],
    models: [
      { type: "Checkpoint", name: "sd3.5_large_fp8_scaled.safetensors", note: "SD3.5 Large 主干 fp8 缩放版，放 models/checkpoints" },
      { type: "ControlNet", name: "sd3.5_large_controlnet_canny.safetensors", note: "SD3.5 官方 Canny 控制 net，放 models/controlnet" }
    ],
    graph: {
      nodes: [
        { id: "4", title: "CheckpointLoaderSimple", cat: "load", x: 20, y: 40,
          widgets: ["sd3.5_large_fp8_scaled.safetensors"],
          inputs: [],
          outputs: [ { type: "MODEL" }, { type: "CLIP" }, { type: "VAE" } ],
          params: [
            { name: "ckpt_name", kind: "下拉选择", default: "sd3.5_large_fp8_scaled.safetensors", desc: "SD3.5 Large 主干 fp8 缩放版，体积约为原版一半；三路输出全部有用，VAE 还要供 ControlNet 编码控制图。" }
          ],
          brief: "加载 SD3.5 Large 主干 fp8 版。",
          desc: "MODEL 接 KSampler，CLIP 接正向编码器，VAE 分两路：一路给 ControlNetApplyAdvanced 供其编码控制图，一路给 VAEDecode 做最终解码，三路输出全部有用。" },
        { id: "46", title: "ControlNetLoader", cat: "load", x: 20, y: 240,
          widgets: ["sd3.5_large_controlnet_canny.safetensors"],
          inputs: [],
          outputs: [ { type: "CONTROL_NET" } ],
          params: [
            { name: "control_net_name", kind: "下拉选择", default: "sd3.5_large_controlnet_canny.safetensors", desc: "models/controlnet 目录中的 SD3.5 官方 Canny 控制模型；必须与主干同架构，SDXL 的控制模型在这里用不了。" }
          ],
          brief: "加载 SD3.5 官方 Canny 控制模型。",
          desc: "只输出 CONTROL_NET 一路，接 ControlNetApplyAdvanced 的 control_net 端口。控制模型必须与主干的架构版本配套，SD3.5 的控制 net 不能给 SDXL 用。" },
        { id: "45", title: "LoadImage", cat: "load", x: 20, y: 440,
          widgets: ["sd3.5_large_canny_controlnet_example_input_image.png", "image"],
          inputs: [],
          outputs: [ { type: "IMAGE" }, { type: "MASK" } ],
          params: [
            { name: "image", kind: "下拉选择", default: "sd3.5_large_canny_controlnet_example_input_image.png", desc: "用于提取边缘的参考图；主体清晰、背景干净时线稿质量最好。" },
            { name: "upload", kind: "按钮", default: "image", desc: "上传自己的参考图到 input 目录并自动选中。" }
          ],
          brief: "读入用于提取边缘的参考图。",
          desc: "模板自带的示例图，IMAGE 输出接 ImageScale 做统一缩放；MASK 输出未使用。换成自己的图时注意构图主体要清晰，Canny 只认边缘轮廓。" },
        { id: "6", title: "CLIPTextEncode", cat: "cond", x: 380, y: 40,
          widgets: ["crystal pink dragon on a blue mystery sky, hyperdetailed"],
          inputs: [ { name: "clip", type: "CLIP" } ],
          outputs: [ { type: "CONDITIONING" } ],
          params: [
            { name: "text", kind: "多行文本", default: "crystal pink dragon on a blue mystery sky, hyperdetailed", desc: "正向提示词只负责画什么，构图轮廓由控制图说了算；SD3.5 对自然语言长句友好，写清主体与场景即可。" }
          ],
          brief: "把水晶粉龙的画面描述编码成正向条件。",
          desc: "CONDITIONING 输出两路：一路进 ControlNetApplyAdvanced 的 positive，一路进 ConditioningZeroOut 生成空负向。SD3.5 对自然语言长句友好，写清主体与场景即可。" },
        { id: "50", title: "ConditioningZeroOut", cat: "cond", x: 380, y: 240,
          widgets: [],
          inputs: [ { name: "conditioning", type: "CONDITIONING" } ],
          outputs: [ { type: "CONDITIONING" } ],
          brief: "把正向条件清零后充当负向条件。",
          desc: "与正向编码器共享输入，输出接 ControlNetApplyAdvanced 的 negative，这样空负向也会被注入结构控制信息，负向无需单独写词。" },
        { id: "48", title: "ImageScale", cat: "image", x: 380, y: 440,
          widgets: ["bilinear", "1024", "1024", "center"],
          inputs: [ { name: "image", type: "IMAGE" } ],
          outputs: [ { type: "IMAGE" } ],
          params: [
            { name: "upscale_method", kind: "下拉选择", default: "bilinear", desc: "缩放插值方式，参考图统一规格用的平滑插值即可。",
              options: [["bilinear", "双线性，平滑快速"], ["lanczos", "质量更高，可选用"], ["nearest-exact", "最近邻，像素风"]] },
            { name: "width", kind: "整数", default: "1024", desc: "目标宽度，与空潜空间尺寸严格一致是控制精度的基础。" },
            { name: "height", kind: "整数", default: "1024", desc: "目标高度，改分辨率时这里与 EmptySD3LatentImage 要同步。" },
            { name: "crop", kind: "下拉选择", default: "center", desc: "比例不符时居中裁剪成标准方图，保证控制图与画布同尺寸。",
              options: [["center", "居中裁剪"], ["disabled", "直接拉伸变形"]] }
          ],
          brief: "把参考图统一缩放成 1024 方图。",
          desc: "插值 bilinear，目标 1024 x 1024，crop 选 center：比例不符时居中裁剪，保证与空潜空间严格同尺寸，这是控制精度的基础。" },
        { id: "47", title: "Canny", cat: "image", x: 620, y: 440,
          widgets: ["0.3", "0.6"],
          inputs: [ { name: "image", type: "IMAGE" } ],
          outputs: [ { type: "IMAGE" } ],
          params: [
            { name: "low_threshold", kind: "浮点数", default: "0.3", desc: "Canny 低阈值，弱边缘只在与强边相连时保留；线稿太碎就调高。" },
            { name: "high_threshold", kind: "浮点数", default: "0.6", desc: "Canny 高阈值，高于此梯度直接确认为强边缘；轮廓太简就调低。" }
          ],
          brief: "用双阈值抽取参考图的黑白边缘线稿。",
          desc: "低阈值 0.3、高阈值 0.6 的滞后双阈值算法：低阈值负责边缘连续、高阈值负责确认强边。输出两路：一路进 PreviewImage 供肉眼检查，一路进 ControlNetApplyAdvanced 当控制图。" },
        { id: "49", title: "PreviewImage", cat: "image", x: 840, y: 440,
          widgets: [],
          inputs: [ { name: "images", type: "IMAGE" } ],
          outputs: [],
          brief: "预览抽取出的边缘线稿。",
          desc: "纯预览节点不参与计算，生成前先看一眼线稿密度，太碎就调高 Canny 阈值，太简就调低，确认后再跑采样能省很多试错。" },
        { id: "33", title: "EmptySD3LatentImage", cat: "latent", x: 380, y: 640,
          widgets: ["1024", "1024", "1"],
          inputs: [],
          outputs: [ { type: "LATENT" } ],
          params: [
            { name: "width", kind: "整数", default: "1024", desc: "SD3 系专用空潜空间宽度；潜空间池化方式与 SDXL 不同，不能用普通 Empty Latent Image 替代。" },
            { name: "height", kind: "整数", default: "1024", desc: "画布高度，必须与控制图一致，这里决定最终成图尺寸。" },
            { name: "batch_size", kind: "整数", default: "1", desc: "批次数保持 1。" }
          ],
          brief: "生成 SD3 系专用的 1024 空白潜空间。",
          desc: "SD3 系潜空间池化方式与 SDXL 不同，要用专用空潜节点。宽高必须与控制图一致，改分辨率时这里与 ImageScale 要同步。" },
        { id: "51", title: "ControlNetApplyAdvanced", cat: "cond", x: 620, y: 240,
          widgets: ["0.66", "0", "1"],
          inputs: [ { name: "positive", type: "CONDITIONING" }, { name: "negative", type: "CONDITIONING" }, { name: "control_net", type: "CONTROL_NET" }, { name: "image", type: "IMAGE" }, { name: "vae", type: "VAE" } ],
          outputs: [ { type: "CONDITIONING" }, { type: "CONDITIONING" } ],
          params: [
            { name: "strength", kind: "浮点数", default: "0.66", desc: "控制强度，0.5 上下轮廓宽松内容自由，0.8 以上严格贴线但画面容易发僵。" },
            { name: "start_percent", kind: "浮点数", default: "0", desc: "控制从采样的第几成开始生效，保持 0 全程锁结构。" },
            { name: "end_percent", kind: "浮点数", default: "1", desc: "控制到第几成停止生效，保持 1；想让收尾更自由可降到 0.8 左右。" }
          ],
          brief: "把边缘图以 0.66 强度注入正负条件。",
          desc: "strength 0.66、起止区间 0 到 1；vae 输入供节点内部把边缘图编码成控制特征。正负条件分别注入后输出，保证负向也感知结构，这是 Advanced 版与普通版的关键差别。" },
        { id: "3", title: "KSampler", cat: "sampler", x: 880, y: 40,
          widgets: ["840657187058661", "randomize", "32", "4.5", "euler", "simple", "1"],
          inputs: [ { name: "model", type: "MODEL" }, { name: "positive", type: "CONDITIONING" }, { name: "negative", type: "CONDITIONING" }, { name: "latent_image", type: "LATENT" } ],
          outputs: [ { type: "LATENT" } ],
          params: [
            { name: "seed", kind: "整数", default: "840657187058661", desc: "种子值；固定后可复现同一张受控画面。" },
            { name: "control_after_generate", kind: "下拉选择", default: "randomize", desc: "每次生成后的种子行为，randomize 每次随机，复现时改 fixed。",
              options: [["randomize", "每次运行换随机种子"], ["fixed", "保持不变，可复现"], ["increment", "每次加一"]] },
            { name: "steps", kind: "整数", default: "32", desc: "SD3.5 Large 官方推荐 28 到 32 步，再往上收益很小。" },
            { name: "cfg", kind: "浮点数", default: "4.5", desc: "SD3.5 自带引导能力，官方区间 3.5 到 4.5，调高易过饱和与硬边。" },
            { name: "sampler_name", kind: "下拉选择", default: "euler", desc: "euler 加 simple 是官方默认组合，稳妥优先。",
              options: [["euler", "官方默认，稳定"], ["dpmpp_2m", "更锐利，可尝试"], ["dpmpp_2m_sde", "纹理更细腻，耗时增加"]] },
            { name: "scheduler", kind: "下拉选择", default: "simple", desc: "简化日程，官方默认。",
              options: [["simple", "官方默认"], ["sgm_uniform", "可对比"], ["normal", "线性计划"]] },
            { name: "denoise", kind: "浮点数", default: "1", desc: "从空白画布完整生成，保持 1。" }
          ],
          brief: "32 步 CFG 4.5 从空白画布生成受控画面。",
          desc: "seed 840657187058661 加 randomize、euler 加 simple、denoise 1。SD3.5 Large 官方推荐 28 到 32 步与 CFG 3.5 到 4.5 区间，模型本身带引导能力，CFG 不需要太高。" },
        { id: "8", title: "VAEDecode", cat: "vae", x: 1160, y: 240,
          widgets: [],
          inputs: [ { name: "samples", type: "LATENT" }, { name: "vae", type: "VAE" } ],
          outputs: [ { type: "IMAGE" } ],
          brief: "把受控采样的潜空间还原成像素图。",
          desc: "VAE 来自同一个 checkpoint。节点无参数，samples 来自 KSampler，解码结果直接进保存节点。" },
        { id: "9", title: "SaveImage", cat: "image", x: 1480, y: 240,
          widgets: ["sd3.5_canny_controlnet"],
          inputs: [ { name: "images", type: "IMAGE" } ],
          outputs: [],
          params: [
            { name: "filename_prefix", kind: "文本", default: "sd3.5_canny_controlnet", desc: "输出文件命名前缀；PNG 内嵌完整工作流元数据，拖回画布即可复现整条链路。" }
          ],
          brief: "以 sd3.5_canny_controlnet 前缀保存成图。",
          desc: "写入 output 目录，PNG 内嵌完整工作流元数据，拖回画布即可复现整条链路。" }
      ],
      links: [
        { from: "4", fromOut: 0, to: "3", toIn: "model" },
        { from: "4", fromOut: 1, to: "6", toIn: "clip" },
        { from: "4", fromOut: 2, to: "51", toIn: "vae" },
        { from: "4", fromOut: 2, to: "8", toIn: "vae" },
        { from: "46", fromOut: 0, to: "51", toIn: "control_net" },
        { from: "45", fromOut: 0, to: "48", toIn: "image" },
        { from: "48", fromOut: 0, to: "47", toIn: "image" },
        { from: "47", fromOut: 0, to: "49", toIn: "images" },
        { from: "47", fromOut: 0, to: "51", toIn: "image" },
        { from: "6", fromOut: 0, to: "50", toIn: "conditioning" },
        { from: "6", fromOut: 0, to: "51", toIn: "positive" },
        { from: "50", fromOut: 0, to: "51", toIn: "negative" },
        { from: "51", fromOut: 0, to: "3", toIn: "positive" },
        { from: "51", fromOut: 1, to: "3", toIn: "negative" },
        { from: "33", fromOut: 0, to: "3", toIn: "latent_image" },
        { from: "3", fromOut: 0, to: "8", toIn: "samples" },
        { from: "8", fromOut: 0, to: "9", toIn: "images" }
      ]
    },
    stages: [
      { name: "模型加载", nodes: ["4", "46"], desc: "SD3.5 Large 主干与官方 Canny 控制模型分别加载，主干三路输出全部投入使用，控制 net 只走条件注入一条线。" },
      { name: "参考图处理", nodes: ["45", "48", "47", "49"], desc: "参考图缩放成 1024 方图后抽 Canny 边缘，线稿先进预览节点供检查，再作为控制图注入条件。" },
      { name: "条件注入", nodes: ["6", "50", "51", "33"], desc: "水晶粉龙描述编成正向条件，零化节点生成空负向，两者一起过 ControlNetApplyAdvanced 注入结构信息，画布用 SD3 专用空潜空间。" },
      { name: "采样输出", nodes: ["3", "8", "9"], desc: "32 步 CFG 4.5 受控采样，VAE 解码后按 sd3.5_canny_controlnet 前缀落盘。" }
    ],
    nodeAnalysis: [
      { node: "4", detail: "加载 SD3.5 Large 主干 sd3.5_large_fp8_scaled.safetensors，fp8 缩放精度版约为原版一半体积，桌面显存友好。MODEL 输出接 KSampler，CLIP 接正向编码器，VAE 分两路：一路给 ControlNetApplyAdvanced 供其内部把控制图编码成潜空间特征，一路给 VAEDecode 解码成图。文件放 models/checkpoints 目录，约 17GB 原版可换 fp8 版减负。" },
      { node: "46", detail: "ControlNetLoader 加载 sd3.5_large_controlnet_canny.safetensors，SD3.5 官方发布的 Canny 结构控制模型。它只输出 CONTROL_NET 一路，接 ControlNetApplyAdvanced 的 control_net 端口。控制模型与主干必须同架构配套，跨版本混用会报维度错误，SDXL 的 Canny 控制模型在这里用不了。" },
      { node: "45", detail: "读入模板自带示例图 sd3.5_large_canny_controlnet_example_input_image.png，IMAGE 输出接 ImageScale 统一缩放。Canny 只认轮廓，参考图主体清晰、背景干净时线稿质量最好。MASK 输出未使用，悬空即可。" },
      { node: "6", detail: "正向编码器，提示词为 crystal pink dragon on a blue mystery sky, hyperdetailed，CLIP 来自 checkpoint。CONDITIONING 输出两路：进 ControlNetApplyAdvanced 的 positive，同时进 ConditioningZeroOut。提示词只负责画什么，构图轮廓由控制图说了算，两边职责互不越界。" },
      { node: "50", detail: "把正向条件复制并清零后输出给 ControlNetApplyAdvanced 的 negative 端口。这样负向条件也会被注入结构控制信息，是官方模板的固定写法。想压制某些元素时可以直接在这里前面换成一个真正的负向编码器，接线方式不变。" },
      { node: "48", detail: "ImageScale 用 bilinear 插值把参考图缩放到 1024 x 1024，crop 选 center 表示比例不符时居中裁剪。控制图与潜空间尺寸一致是 Canny 控制稳定的前提，改分辨率时这里与 EmptySD3LatentImage 要同步修改。" },
      { node: "47", detail: "Canny 节点用 0.3 与 0.6 的低高双阈值抽取边缘：低于低阈值的弱边缘只在与强边相连时保留，高于高阈值的直接确认，从而得到干净连续的黑白线稿。参考图细节多导致线稿太碎时上调两个阈值，轮廓太简时下调。输出分两路，一路进预览，一路进条件注入。" },
      { node: "49", detail: "PreviewImage 预览抽取出的边缘线稿，属于输出型节点，删除不影响流程。养成先看线稿再采样的习惯：线稿阶段就能发现阈值不当或构图不符，比生成后返工省得多。" },
      { node: "33", detail: "EmptySD3LatentImage 生成 1024 x 1024、批量为 1 的空白潜空间。SD3 系的潜空间处理与 SDXL 不同，必须用这个专用节点而不是 EmptyLatentImage。宽高必须与控制图一致，这里决定最终成图尺寸。" },
      { node: "51", detail: "ControlNetApplyAdvanced 是结构控制的核心：接收正负两路条件、控制 net 与边缘图，strength 0.66 决定结构约束力度，起止 0 到 1 表示全程生效。vae 输入供节点内部把控制图编码成与主干匹配的控制特征，这是 Advanced 版独有的输入。正负条件分别输出再进 KSampler，负向也受结构引导，整幅画的构图就锁死在参考轮廓上了。" },
      { node: "3", detail: "KSampler 四路齐备：模型来自 checkpoint，正负条件来自 ControlNetApplyAdvanced，画布是 SD3 专用空潜空间。参数为 seed 840657187058661 加 randomize、32 步、CFG 4.5、euler 加 simple、denoise 1。SD3.5 Large 官方推荐 28 到 32 步，CFG 保持 3.5 到 4.5 区间即可，调太高会出现过饱和与硬边。" },
      { node: "8", detail: "VAEDecode 把受控采样的潜空间还原成像素图，VAE 来自同一个 checkpoint，节点无参数。显存不足时可换成 VAE Decode Tiled 分块解码，代价是极小的接缝风险。" },
      { node: "9", detail: "接收 VAEDecode 的 IMAGE 输出，前缀 sd3.5_canny_controlnet，写入 output 目录。PNG 内嵌完整工作流参数，把成图拖回画布即可复现整条链路，批量出图时建议按项目改前缀便于归档。" }
    ],
    flow: [
      "① CheckpointLoaderSimple 与 ControlNetLoader 分别载入主干与 Canny 控制模型。",
      "② LoadImage 读参考图，ImageScale 居中缩放成 1024 方图。",
      "③ Canny 以 0.3 与 0.6 双阈值抽取边缘线稿，PreviewImage 供检查。",
      "④ 正向条件与零化负向一起过 ControlNetApplyAdvanced，以 0.66 强度注入结构。",
      "⑤ KSampler 从 SD3 专用空潜空间以 32 步 CFG 4.5 受控采样。",
      "⑥ VAEDecode 还原像素，SaveImage 按 sd3.5_canny_controlnet 前缀落盘。"
    ],
    params: [
      { name: "strength", value: "0.66", desc: "控制强度，0.5 上下轮廓宽松内容自由，0.8 以上严格贴线但画面容易发僵。" },
      { name: "canny low / high", value: "0.3 / 0.6", desc: "双阈值控制边缘密度，参考图细节多就调高只留主结构，太简就调低。" },
      { name: "steps", value: "32", desc: "SD3.5 Large 官方推荐 28 到 32 步，再往上收益很小。" },
      { name: "cfg", value: "4.5", desc: "SD3.5 自带引导能力，官方区间 3.5 到 4.5，调高易过饱和。" },
      { name: "sampler / scheduler", value: "euler / simple", desc: "官方默认组合，稳妥优先。" },
      { name: "width / height", value: "1024 x 1024", desc: "空潜空间与控制图必须同尺寸，改分辨率时 ImageScale 与 EmptySD3LatentImage 同步。" }
    ],
    tips: [
      "strength 是第一旋钮：轮廓要松内容要活就降到 0.5 附近，结构必须严丝合缝就升到 0.8 以上。",
      "先看 PreviewImage 里的线稿再跑采样，阈值问题在这一步就能发现，省下大量试错时间。",
      "正负条件都过 ControlNet 是官方写法，空负向也带结构信息；要压制元素时换真负向编码器即可。",
      "控制图与潜空间尺寸一致是稳定前提，模板用 ImageScale 居中裁方图来兜底，换尺寸两处要同步。",
      "SD3.5 对自然语言友好，提示词写成清晰的画面短句即可，不必堆砌/tags 式词组。"
    ],
    notice: "源文件另有一个 MarkdownNote 模型指引节点，本图按规则省略；其余节点与连线均与真实文件一致。"
  });
})();
