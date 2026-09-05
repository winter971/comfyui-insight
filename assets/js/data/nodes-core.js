/* 核心官方节点（ComfyUI 内置，v0.34.2） */
(function () {
  "use strict";
  window.COMFY_DATA = window.COMFY_DATA || {};
  window.COMFY_DATA.nodePackages = window.COMFY_DATA.nodePackages || [];

  window.COMFY_DATA.nodePackages.push({
    id: "core-nodes",
    name: "ComfyUI 核心官方节点",
    author: "Comfy Org（comfyanonymous）",
    official: true,
    category: "官方核心",
    install: "ComfyUI 自带，无需安装。双击画布即可搜索使用",
    summary: "ComfyUI 内置的基础节点集，覆盖一条生成管线必需的全部环节：模型加载、条件编码、采样、潜空间操作、图像输入输出。任何工作流的骨架都由这些节点构成，第三方包只是在其间插入增强能力。",
    why: "无论用不用第三方包，文生图、图生图、重绘、放大的最小闭环都靠它们完成。理解了这组节点，就看懂了任何复杂工作流的主干；遇到陌生第三方节点时，通常也能定位它替代或增强了这里的哪一个环节。",
    tags: ["官方", "基础", "必学"],
    nodes: [
      {
        name: "Load Checkpoint", cat: "load",
        brief: "加载扩散模型主包，同时取出配套的 CLIP 与 VAE。",
        desc: "工作流的起点。一个 checkpoint 文件里其实捆着三个模型：UNet/DiT 扩散主体（负责去噪）、CLIP 文本编码器（负责读提示词）、VAE（负责潜空间与图像的互相转换）。这个节点一次性把三者输出，分别供给下游。SD1.5/SDXL 底模是三合一格式；Flux 等新架构把三者拆开存放，所以要改用 UNET Loader + Dual CLIP Loader + VAE Loader 的组合加载。",
        inputs: [
          { name: "ckpt_name", type: "COMBO", from: "models/checkpoints 目录中的文件列表", desc: "下拉选择底模文件" }
        ],
        outputs: [
          { type: "MODEL", to: "KSampler 的 model 输入（中间可插 LoRA）", desc: "扩散主体，负责画图" },
          { type: "CLIP", to: "CLIP Text Encode 的 clip 输入", desc: "文本编码器，负责读提示词" },
          { type: "VAE", to: "VAE Encode / VAE Decode 的 vae 输入", desc: "编解码器，负责图像与潜空间互转" }
        ],
        why: "没有它就没有 MODEL/CLIP/VAE 三路供给，整条管线无从谈起。它是缓存判断的锚点：只要不换模型，它的结果一直复用，后续所有迭代都不重复加载模型。",
        params: [
          { name: "ckpt_name", kind: "下拉选择", default: "最近使用的模型文件", desc: "从 models/checkpoints 目录里选一个底模文件。切换这里等于切换整套画风与能力，是工作流里影响最大的单一选项。" }
        ],
        why: "没有它就没有 MODEL/CLIP/VAE 三路供给，整条管线无从谈起。它是缓存判断的锚点：只要不换模型，它的结果一直复用，后续所有迭代都不重复加载模型。",
        tips: "换底模 = 换画风最有效的一步。模型放在 models/checkpoints 目录（桌面版可在设置里改模型路径）。加载 6GB 以上大模型时第一次执行会明显卡顿，那是模型读入显存的过程。"
      },
      {
        name: "LoRA Loader", cat: "load",
        brief: "把 LoRA 微调权重注入模型，叠加画风、人物或概念。",
        desc: "LoRA 是一个小体积（通常几十到几百 MB）的低秩微调补丁，记录了『在原模型基础上朝某个方向偏移』的权重变化。这个节点把补丁套在 MODEL 和 CLIP 上再输出。它是链式的：多个 LoRA Loader 串成一条链依次叠加，每个都有自己的强度滑杆。强度 1.0 是完全施加，0 则等于没插。",
        inputs: [
          { name: "model", type: "MODEL", from: "上游的 Load Checkpoint 或另一个 LoRA Loader", desc: "待注入的模型" },
          { name: "clip", type: "CLIP", from: "同一个上游的 CLIP 输出", desc: "待注入的文本编码器" }
        ],
        outputs: [
          { type: "MODEL", to: "下游 LoRA 链或 KSampler", desc: "注入后的模型" },
          { type: "CLIP", to: "CLIP Text Encode", desc: "注入后的编码器" }
        ],
        params: [
          { name: "lora_name", kind: "下拉选择", default: "无", desc: "从 models/loras 目录选择 LoRA 文件。文件名通常就是画风或人物名，需配合训练时的触发词使用。" },
          { name: "strength_model", kind: "浮点数", default: "1.0", desc: "对绘画主体（UNet）的注入强度。1.0 完全生效，0.6-0.8 常用于与其他 LoRA 混搭，超过 1.5 容易画面崩坏或颜色溢出。" },
          { name: "strength_clip", kind: "浮点数", default: "1.0", desc: "对文本编码器的注入强度，影响触发词的权重。一般与 strength_model 保持一致；只想改画面不改文字理解时可单独调低。" }
        ],
        why: "它是扩展模型能力的最轻量方式——不必为每种画风下载整个 7GB 底模，一个 LoRA 即可切换。几乎所有风格化、人物一致性、NSFW 调整类工作流都依赖它。",
        tips: "多个 LoRA 叠加时总强度别拉满，互相稀释或冲突很常见；出问题先逐个把强度归零排查。LoRA 名称要和训练时触发词配合使用才生效。"
      },
      {
        name: "CLIP Text Encode (Prompt)", cat: "cond",
        brief: "把提示词文本翻译成模型能理解的条件向量。",
        desc: "整个 ComfyUI 里最『平易近人』却最关键的节点：它调用 CLIP 文本编码器，把你的文字变成一组高维向量（条件/Conditioning），采样器靠它知道『该往什么方向去噪』。正向提示词描述想要的内容，负向提示词描述要避开的内容——两者通常是两个这样的节点。SDXL 之后还支持把多行文本拆成不同编码器通道。",
        inputs: [
          { name: "clip", type: "CLIP", from: "Load Checkpoint / LoRA 链的 CLIP 输出", desc: "文本编码器" }
        ],
        outputs: [
          { type: "CONDITIONING", to: "KSampler 的 positive/negative，或 ControlNet/区域控制节点", desc: "条件向量" }
        ],
        params: [
          { name: "text", kind: "文本", default: "空", desc: "提示词内容。正向节点写想要的内容，负向节点写要避开的词；支持 (word:1.2) 权重语法，越具体越可控，过长会稀释每个词的权重。" }
        ],
        why: "它是人类意图与模型之间的唯一翻译官。提示词怎么写决定模型怎么理解，而这个节点决定了翻译质量（配合什么 CLIP、截不截尾层都有影响）。",
        tips: "正向写具体主体+风格+质量词，负向一般用通用负面列表即可。权重语法（如 (word:1.2)）由前端解析后传入。Flux 等模型对负向提示词不敏感，负向常留空。"
      },
      {
        name: "Empty Latent Image", cat: "latent",
        brief: "生成一张纯噪声『画布』，是文生图的起点。",
        desc: "扩散模型的生成不是从空白开始，而是从『一团纯噪声』开始逐步去噪。这个节点按指定宽高创建一批随机噪声张量（潜空间/Latent 格式）。注意分辨率是潜空间尺寸：SD1.5 以 512 为基准，SDXL 以 1024 为基准，尺寸偏离基准太多会导致物体重复或构图崩坏。",
        inputs: [
          { name: "width", type: "INT", from: "控件输入", desc: "宽度（像素）" },
          { name: "height", type: "INT", from: "控件输入", desc: "高度（像素）" },
          { name: "batch_size", type: "INT", from: "控件输入", desc: "一次生成几张" }
        ],
        outputs: [
          { type: "LATENT", to: "KSampler 的 latent_image 输入", desc: "初始噪声" }
        ],
        params: [
          { name: "width", kind: "整数", default: "512", desc: "画布宽度（像素）。需为 8 的倍数；SD1.5 以 512 为基准，SDXL 以 1024 为基准，偏离基准太多会出现人物重复或构图崩坏。" },
          { name: "height", kind: "整数", default: "512", desc: "画布高度（像素）。与 width 一起决定最终输出分辨率，竖版图直接把高度调大即可。" },
          { name: "batch_size", kind: "整数", default: "1", desc: "一次生成几张。调大可以一次出多张候选，但显存与耗时按张数成倍增长。" }
        ],
        why: "文生图必须有一个初始噪声；图生图用 VAEEncode 的结果替代它。它决定了最终输出的分辨率。",
        tips: "SD1.5 用 512~768，SDXL 用 1024~1536，Flux 在 1024 附近最稳。想要竖版海报就直接改宽高比例，不必生成长图再裁。"
      },
      {
        name: "KSampler", cat: "sampler",
        brief: "整条管线的核心引擎：在条件引导下把噪声变成图像。",
        desc: "采样器（Sampler）执行扩散过程的每一步迭代：拿模型预测当前噪声里『画面应该长什么样』，减去一部分噪声，重复 steps 次。它同时汇聚四路输入——MODEL（怎么画）、正向/负向条件（往哪画）、LATENT（从哪开始）。cfg 控制对提示词的服从度（越高越死板、越低越自由），seed 决定随机性。执行时通过 WebSocket 逐步推送预览图。",
        inputs: [
          { name: "model", type: "MODEL", from: "模型加载链的终点", desc: "扩散模型" },
          { name: "positive", type: "CONDITIONING", from: "正向 CLIP Text Encode（可经 ControlNet 注入）", desc: "想要的方向" },
          { name: "negative", type: "CONDITIONING", from: "负向 CLIP Text Encode", desc: "避开的方向" },
          { name: "latent_image", type: "LATENT", from: "Empty Latent Image 或 VAEEncode", desc: "起点噪声或待改图" }
        ],
        outputs: [
          { type: "LATENT", to: "VAE Decode（或第二遍采样/放大）", desc: "去噪完成的潜空间结果" }
        ],
        params: [
          { name: "seed", kind: "整数", default: "0", desc: "随机种子，相同种子加相同参数可以得到几乎相同的结果。锁定它方便微调提示词，改成 randomize 则每次出新构图。" },
          { name: "steps", kind: "整数", default: "20", desc: "去噪迭代次数，20-35 常用。越多细节越充分但耗时线性增加，超过 40 通常收益很小。" },
          { name: "cfg", kind: "浮点数", default: "8.0", desc: "对提示词的服从度。调高更听话但画面容易过饱和僵硬，调低更自由有创意。SD1.5 常用 6-8，SDXL 常用 4-7，Flux 不用这个参数。" },
          { name: "sampler_name", kind: "下拉选择", default: "euler", desc: "去噪算法。新手记住两个组合就够用：euler/normal 最朴素稳定，dpmpp_2m/karras 细节与效率兼得。",
            options: [
              ["euler", "最朴素稳定，通用首选，出图风格偏柔和"],
              ["euler_ancestral", "每步都注入随机性，细节多但构图不稳定，同种子复现性差"],
              ["dpmpp_2m", "二阶多步采样，速度快细节好，配 karras 是社区公认的高质量组合"],
              ["dpmpp_2m_sde", "在 2m 基础上加入随机微分方程噪声，质感更细腻丰富，略慢"],
              ["dpmpp_3m_sde", "三阶版本，高步数下细节更佳，低步数优势不明显"],
              ["ddim", "老牌确定性采样，步数少时结构稳定，常用于老模型与图生图"],
              ["uni_pc", "新一代预测校正采样，低步数下性价比高"]
            ] },
          { name: "scheduler", kind: "下拉选择", default: "normal", desc: "控制每一步噪声减多少的日程表，和采样算法搭配使用。换调度器对画面质感的影响常常比换采样器还大。",
            options: [
              ["normal", "默认线性日程，与 euler 搭配的中规中矩"],
              ["karras", "步长前大后小，收尾更精细，细节和质感普遍更好，dpmpp_2m 的黄金搭档"],
              ["exponential", "指数衰减，前期去噪快，适合低步数出图"],
              ["sgm_uniform", "均匀步长，视频模型与 SGM 系模型常用"],
              ["simple", "简单缩短的日程，行为接近 karras 的通用替代"],
              ["beta", "按 Beta 分布分配步长，某些模型官方推荐，整体更均匀"]
            ] },
          { name: "denoise", kind: "浮点数", default: "1.0", desc: "去噪强度：1.0 表示从纯噪声重画（文生图），0.5 左右表示保留一半原图信息做图生图。输入是纯噪声时保持 1.0，图生图常用 0.4-0.7。" }
        ],
        why: "它是唯一真正『生成』的节点——其他节点都在为它做准备或处理它的产物。工作流的调参九成发生在它的四个参数上：steps、cfg、sampler、seed。",
        tips: "通用起步：steps 25-35、cfg 5-7（SDXL）。sampler 选 euler/normal 或 dpmpp_2m/karras 最稳。锁定 seed 可以固定构图只微调提示词。denoise 参数仅在图生图（输入不是纯噪声）时才有意义。"
      },
      {
        name: "KSampler (Advanced)", cat: "sampler",
        brief: "KSampler 的增强版：可分步执行、可控噪声添加。",
        desc: "把 KSampler 拆得更细：add_noise 开关、start_at_step/end_at_step 把采样过程切成两段、return_with_leftover_noise 保留中间噪声。高清修复的经典结构就是用它跑第一遍的前半程、放大后再续后半程；视频与多阶段工作流也依赖这种分段能力。",
        inputs: [
          { name: "model / positive / negative / latent_image", type: "同 KSampler", from: "同 KSampler", desc: "四路标准输入" }
        ],
        outputs: [
          { type: "LATENT", to: "VAE Decode 或下一段 KSampler (Advanced)", desc: "分段采样的结果" }
        ],
        params: [
          { name: "add_noise", kind: "开关", default: "enable", desc: "是否在起点潜空间上添加新噪声。两段式采样时第二段通常保持默认；做某些无噪续算玩法时才关掉。" },
          { name: "noise_seed", kind: "整数", default: "0", desc: "噪声随机种子，与普通 KSampler 的 seed 作用相同，仅当 add_noise 开启时生效。" },
          { name: "steps", kind: "整数", default: "20", desc: "整段采样的总步数。两段接力时两遍必须填同一个数，分界点才有意义。" },
          { name: "cfg", kind: "浮点数", default: "8.0", desc: "提示词服从度，含义与普通 KSampler 相同。SD1.5 用 6-8，SDXL 用 4-7。" },
          { name: "sampler_name", kind: "下拉选择", default: "euler", desc: "去噪算法，选项与普通 KSampler 完全一致；euler/normal 与 dpmpp_2m/karras 是稳妥起步。" },
          { name: "start_at_step", kind: "整数", default: "0", desc: "本段从第几步开始。第一遍填 0，第二遍填上一遍的结束步（如 15），实现中途接力。" },
          { name: "end_at_step", kind: "整数", default: "10000", desc: "本段跑到第几步为止。高清修复第一遍常填 15 左右，剩余步数留给放大后的第二遍。" },
          { name: "return_with_leftover_noise", kind: "开关", default: "disable", desc: "到达结束步时是否带着剩余噪声直接输出。两段式采样必须开启，否则第一遍会一步到底；单段使用保持关闭。" }
        ],
        why: "任何『分两遍采样』的玩法（两段式放大、先低步数预览再精修）都必须用它，普通 KSampler 做不到中途暂停。",
        tips: "两段式示例：第一遍 end_at_step=15、第二遍 start_at_step=15，两遍 steps 保持一致；第二遍 denoise 无效，控制力度靠 step 分界点。"
      },
      {
        name: "VAE Decode", cat: "vae",
        brief: "把潜空间结果解码成人眼可见的图像。",
        desc: "扩散全程都发生在压缩过的潜空间（Latent，尺寸约为图像的 1/8），那里没有真正的像素。VAE Decode 是『显影』环节：把潜空间张量还原成 RGB 图像。它通常是采样之后的必经节点（除非你要把潜空间直接存盘或继续在潜空间操作）。",
        inputs: [
          { name: "samples", type: "LATENT", from: "KSampler 输出", desc: "潜空间结果" },
          { name: "vae", type: "VAE", from: "Load Checkpoint 或 VAE Loader", desc: "解码器" }
        ],
        outputs: [
          { type: "IMAGE", to: "SaveImage / 预览 / 后处理节点", desc: "成品图像" }
        ],
        params: [],
        why: "没有它就看不到图。工作流里凡是『KSampler 之后接什么』的问题，九成答案就是它。",
        tips: "画面发灰、发指纹状噪点常常是 VAE 不匹配——SDXL 模型建议显式加载官方 SDXL VAE。 tiled 版本（VAE Decode Tiled）可在低显存下解码大图。"
      },
      {
        name: "VAE Encode", cat: "vae",
        brief: "把真实图像压缩进潜空间，是图生图的入口。",
        desc: "VAE Decode 的逆过程：把一张已有图像编码成潜空间张量，交给 KSampler 在其基础上做低强度去噪（denoise<1），实现『在原图基础上改』——这就是图生图与重绘的起点。编码后的图保留了原图的构图信息，denoise 越低越像原图。",
        inputs: [
          { name: "pixels", type: "IMAGE", from: "Load Image 或预处理节点", desc: "待编码图像" },
          { name: "vae", type: "VAE", from: "模型链", desc: "编码器" }
        ],
        outputs: [
          { type: "LATENT", to: "KSampler / SetLatentNoiseMask", desc: "原图的潜空间表示" }
        ],
        params: [],
        why: "它是『从图像出发的所有玩法』（图生图、重绘、ControlNet 后采样、换脸管线）的第一站。",
        tips: "denoise 0.4-0.7 是图生图常用区间：0.4 微调、0.7 大改。输入图长宽比尽量贴合目标，采样前先 ImageScale 统一尺寸。"
      },
      {
        name: "Load Image", cat: "load",
        brief: "从 input 目录或本机上传一张图片作为输入。",
        desc: "把外部图像读进工作流，输出 IMAGE 张量与 MASK 两个输出口（alpha 通道自动成为蒙版）。桌面版直接拖图到画布即可。它是一切图生图、重绘、ControlNet 参考图、换脸素材的源头。",
        inputs: [
          { name: "image", type: "COMBO", from: "input 目录文件 / 上传", desc: "选择图片文件" }
        ],
        outputs: [
          { type: "IMAGE", to: "VAEEncode / ControlNet 预处理 / ReActor 等", desc: "图像张量" },
          { type: "MASK", to: "遮罩类节点", desc: "透明通道提取的蒙版" }
        ],
        params: [
          { name: "image", kind: "下拉选择", default: "最近上传的图片", desc: "从 input 目录选择图片，也可以直接点上传按钮（桌面版支持把图拖进画布）。换机器后需要把原图片重新放进 input 目录。" }
        ],
        why: "所有以图为输入的玩法都需要它。工作流文件里内嵌了缩略图与文件名，但换机器后文件必须重新存在于 input 目录。",
        tips: "大图先经过 ImageScale 缩到目标分辨率再编码，可显著提速并稳定构图。PNG 透明背景会自动变成 MASK 输出。"
      },
      {
        name: "Load Image Mask", cat: "mask",
        brief: "从图片的指定颜色通道提取重绘蒙版。",
        desc: "局部重绘需要一张『哪里可以改』的掩码图。这个节点读取一张图片的红/绿/蓝/alpha 通道作为 MASK 输出——黑色区域保护、白色区域允许重绘（按 channel 选项而定）。配合修图软件画蒙版，是手动控制重绘范围的基础手段。",
        inputs: [
          { name: "image", type: "COMBO", from: "input 目录的蒙版图", desc: "蒙版图片" },
          { name: "channel", type: "COMBO", from: "控件：red/green/blue/alpha", desc: "用哪个通道当蒙版" }
        ],
        outputs: [
          { type: "MASK", to: "GrowMask / SetLatentNoiseMask / 遮罩处理节点", desc: "提取出的蒙版" }
        ],
        params: [
          { name: "image", kind: "下拉选择", default: "最近上传的蒙版图", desc: "选择 input 目录里的蒙版图片，白（亮）色区域表示允许重绘的部分。" },
          { name: "channel", kind: "下拉选择", default: "red", desc: "用图片的哪个颜色通道生成蒙版，适合用修图软件按颜色分别保存多块蒙版。",
            options: [
              ["red", "取红色通道，最常用的默认画法：红色涂出重绘范围"],
              ["green", "取绿色通道，可用于在同一张图里放第二块蒙版"],
              ["blue", "取蓝色通道，同上，用于第三块蒙版"],
              ["alpha", "取透明通道，PNG 里透明处即蒙版，适合保留透明的素材图"]
            ] }
        ],
        why: "手动重绘（inpaint）工作流的『范围控制器』。没有蒙版，KSampler 会重画整张图。",
        tips: "桌面版更常用的方式是直接在 Load Image 上右键 Open in MaskEditor 涂抹蒙版，省去单独画蒙版图。"
      },
      {
        name: "SetLatentNoiseMask", cat: "mask",
        brief: "把蒙版贴到潜空间上，限定采样只影响蒙版区域。",
        desc: "它不给图像打码，而是告诉采样器『只有蒙版内的潜空间像素允许变化』。蒙版经 VAEEncode (for Inpainting) 或 SetLatentNoiseMask 附加到 latent 后，KSampler 的去噪就被约束在指定区域内——这是 ComfyUI 局部重绘的核心机制。",
        inputs: [
          { name: "samples", type: "LATENT", from: "VAEEncode 的输出", desc: "原图潜空间" },
          { name: "mask", type: "MASK", from: "LoadImageMask / 蒙版处理链", desc: "重绘范围" }
        ],
        outputs: [
          { type: "LATENT", to: "KSampler 的 latent_image", desc: "带蒙版约束的潜空间" }
        ],
        params: [],
        why: "重绘工作流的『围栏』。没有它，所谓 inpaint 与普通图生图没有区别。",
        tips: "重绘边缘生硬时，把蒙版经 GrowMask 扩几个像素并加羽化，衔接会自然得多。"
      },
      {
        name: "ControlNet Loader / Apply ControlNet (Advanced)", cat: "cond",
        brief: "加载 ControlNet 模型并把参考图的结构信息注入条件。",
        desc: "这两个节点成对出现：Loader 载入一个 ControlNet 模型；Apply (Advanced) 把『参考图（经预处理后的线条/深度/姿态）』与你的提示词条件融合，输出新的 CONDITIONING。采样时模型会同时服从文本与图像结构——这就是『构图由参考图锁定、内容由提示词决定』的实现原理。strength 控制约束强度。",
        inputs: [
          { name: "conditioning", type: "CONDITIONING", from: "正向 CLIP Text Encode", desc: "原始正向条件" },
          { name: "control_net", type: "CONTROL_NET", from: "ControlNet Loader", desc: "结构控制模型" },
          { name: "image", type: "IMAGE", from: "LoadImage 或 controlnet_aux 预处理器", desc: "结构参考图" }
        ],
        outputs: [
          { type: "CONDITIONING", to: "KSampler 的 positive（可再叠下一个 ControlNet）", desc: "注入结构约束后的条件" }
        ],
        params: [
          { name: "control_net_name", kind: "下拉选择", default: "首个可用的 ControlNet 模型", desc: "选择 models/controlnet 目录里的 ControlNet 模型。模型类型决定它吃什么图：线稿模型配线稿、深度模型配深度图。" },
          { name: "strength", kind: "浮点数", default: "1.0", desc: "结构约束强度。1.0 严格跟随参考图，0.6-0.8 给模型留发挥空间，2.0 起可能喧宾夺主压过提示词。" },
          { name: "start_percent", kind: "浮点数", default: "0.0", desc: "从采样的百分之几开始施加约束，0 表示从第一步就锁结构。一般不动，除非想前半程自由打底。" },
          { name: "end_percent", kind: "浮点数", default: "1.0", desc: "在采样的百分之几松开约束。0.5-0.8 常用：前半程锁定构图，后半程放开让模型补细节，画面更自然。" }
        ],
        why: "构图可控是 AI 绘图工程化的分水岭：姿态、线条、深度、法线、二维码……一切『按参考图生成』的需求都由此实现。",
        tips: "Advanced 版可以分别设置正/负向强度与起止步数（end_percent 0.5 常用于后半程松手让细节自由）。预处理必须与 ControlNet 类型匹配：线稿模型吃线稿图，深度模型吃深度图。"
      },
      {
        name: "Conditioning (Combine / Set Area 等)", cat: "cond",
        brief: "条件系列节点：合并多路条件、把条件限制在画面区域。",
        desc: "这是官方条件家族的统称：ConditioningCombine 把两路条件按强度相加（多 ControlNet 叠加的接法）；ConditioningSetAreaStrength / SetArea 把某路条件锁定在画面的一个矩形区域内（左右分区、人物+背景分离的原理）；ConditioningZeroOut 常用于把负向条件归零（Flux 常见用法）。",
        inputs: [
          { name: "conditioning_1 / 2", type: "CONDITIONING", from: "两路 CLIP Text Encode 或 ControlNet 输出", desc: "待合并/处理的条件" }
        ],
        outputs: [
          { type: "CONDITIONING", to: "KSampler 或下一级条件节点", desc: "合并/区域化后的条件" }
        ],
        params: [
          { name: "strength", kind: "浮点数", default: "1.0", desc: "该路条件（或该区域）的影响力。多路条件叠加时各路权重之和控制在 1.0 上下，过高会互相撕扯导致画面混乱。" },
          { name: "x", kind: "整数", default: "0", desc: "区域条件生效范围的左上角横坐标（像素）。与 width 搭配决定『条件管住画面的哪一条竖带』。" },
          { name: "y", kind: "整数", default: "0", desc: "区域条件生效范围的左上角纵坐标（像素）。把角色条件锁在上半、背景条件锁在下半就是这么用的。" },
          { name: "width", kind: "整数", default: "64", desc: "区域条件的生效宽度。x 加 width 不要超出画面总宽，否则多出的部分无效。" },
          { name: "height", kind: "整数", default: "64", desc: "区域条件的生效高度。区域至少要能框住主体的轮廓，太小会导致该条件几乎不起作用。" }
        ],
        why: "单个提示词无法表达『左边是男孩右边是女孩』这类空间需求，条件区域化是双角色构图、艺术二维码等玩法的地基。",
        tips: "分区控制建议配合区域蒙版类第三方节点（如 Latent Couple）使用；两路条件权重之和以 1.0 上下为宜，过高会互相撕扯。"
      },
      {
        name: "FluxGuidance", cat: "cond",
        brief: "Flux 专用的引导强度（distilled cfg）调节节点。",
        desc: "Flux.1 使用蒸馏引导，没有传统的 cfg 机制。FluxGuidance 以『guidance』参数替代：数值越高越贴合提示词、越低越自由发散。它串联在正向条件之后、KSampler 之前，是 Flux 工作流的标志性节点。",
        inputs: [
          { name: "conditioning", type: "CONDITIONING", from: "正向 T5/CLIP 编码链", desc: "Flux 正向条件" }
        ],
        outputs: [
          { type: "CONDITIONING", to: "KSampler 的 positive", desc: "带引导值的事件条件" }
        ],
        params: [
          { name: "guidance", kind: "浮点数", default: "3.5", desc: "Flux 的蒸馏引导值，相当于传统 cfg 的替代品。越高越严格贴合提示词、构图越死板，越低越自由有氛围。3.5 是社区默认；人像 2.5-3.5，需要严格对齐构图时提到 4-5。" }
        ],
        why: "Flux 不吃普通 cfg——没有这个节点（或固定 guidance 值）就无法控制 Flux 的提示词服从度。",
        tips: "guidance 3.5 是社区默认值；人像 2.5-3.5、需要严格服从构图时提到 4-5。负向提示词对 Flux 基本无效，负向用 ZeroOut 即可。"
      },
      {
        name: "Latent Upscale (by)", cat: "latent",
        brief: "在潜空间层面放大尺寸，配合二次采样实现高清修复。",
        desc: "把潜空间张量直接插值放大（nearest/excel/bicubic 等算法）。它不增加细节——放大的只是『画布』——所以标准用法是放大后接第二个 KSampler 以较低 denoise（0.3-0.6）重绘一遍，把细节补回来，这就是高清修复（Hires Fix）的骨架。",
        inputs: [
          { name: "samples", type: "LATENT", from: "第一遍 KSampler", desc: "小尺寸潜空间" }
        ],
        outputs: [
          { type: "LATENT", to: "第二遍 KSampler", desc: "放大后的潜空间画布" }
        ],
        params: [
          { name: "upscale_method", kind: "下拉选择", default: "bilinear", desc: "潜空间插值算法。这只决定『画布放大后平滑与否』，不产生新细节，细节要靠第二遍采样补。",
            options: [
              ["bilinear", "双线性插值，平滑通用，最常用的默认选择"],
              ["bicubic", "双三次插值，过渡更柔顺，放大后再采样时过渡更自然"],
              ["area", "区域平均，整体偏柔和，适合避免锯齿"],
              ["nearest-exact", "最近邻直接复制像素，硬边明显，一般只在特殊风格下用"],
              ["bislerp", "球面插值，潜空间语义混合更连贯，放大后崩坏率更低，稍慢"]
            ] },
          { name: "upscale_by", kind: "浮点数", default: "1.5", desc: "放大倍率。1.25-1.5 最稳，直接超过 2 倍容易构图崩坏，大倍率建议分多级放大逐级采样。" }
        ],
        why: "低成本放大工作流的关键中转站：在潜空间放大比在像素空间放大省显存得多，且能与增量采样无缝配合。",
        tips: "upscale_method 选 bicubic/area 更平滑；放大倍率 1.25-1.5 倍最稳，超过 2 倍建议分多级进行。"
      },
      {
        name: "Upscale Model Loader + Image Upscale With Model", cat: "image",
        brief: "用超分神经网络（ESRGAN 等）把图像放大并补细节。",
        desc: "与 Latent Upscale 不同，这对节点工作在像素层面：Loader 载入一个专门的超分模型（如 4x-UltraSharp、RealESRGAN），With Model 执行放大——网络会『脑补』出真实的纹理细节。常用于工作流末端的无损放大，或 Ultimate SD Upscale 的前置放大步骤。",
        inputs: [
          { name: "model_name", type: "COMBO", from: "models/upscale_models 目录", desc: "选择超分模型" },
          { name: "image", type: "IMAGE", from: "VAEDecode 输出", desc: "待放大图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "SaveImage / Ultimate SD Upscale", desc: "放大后的图像" }
        ],
        params: [
          { name: "model_name", kind: "下拉选择", default: "models/upscale_models 里的第一个模型", desc: "选择超分模型文件。名字里的 4x 表示放大倍率；UltraSharp 偏锐利、RealESRGAN 偏通用平滑，按画风喜好选。" }
        ],
        why: "它是『出大图』最省心的路径：不占采样预算、不挑模型架构，4 倍放大一键完成。",
        tips: "4x 模型名字里的 4x 指放大倍率。超分后再过一遍低 denoise 的 Ultimate SD Upscale 可消除过度锐化的伪影。"
      },
      {
        name: "Image Scale / Image Blend / Image Composite Masked", cat: "image",
        brief: "像素级图像处理三件套：缩放、混合、按蒙版合成。",
        desc: "官方图像工具家族的代表：Image Scale 用插值缩放图像（可指定长宽或只放大短边）；Image Blend 按混合模式叠加两图；Image Composite Masked 把一张图按蒙版贴到另一张上——换脸后回贴、局部替换、加水印都用它。",
        inputs: [
          { name: "image / destination / mask", type: "IMAGE / MASK", from: "上游图像与蒙版", desc: "参与处理的图层" }
        ],
        outputs: [
          { type: "IMAGE", to: "SaveImage 或后处理链", desc: "处理结果" }
        ],
        params: [
          { name: "upscale_method", kind: "下拉选择", default: "nearest-exact", desc: "Image Scale 的像素插值算法。放大照片级内容建议 bicubic 或 lanczos。",
            options: [
              ["lanczos", "锐利清晰，放大后文字与线条边缘保持最好，稍慢"],
              ["bicubic", "平滑中带细节，放大照片类图像的通用选择"],
              ["nearest-exact", "像素风硬边效果，放大像素画专用，常规图会有锯齿"],
              ["area", "缩小图片时质量最好，能避免摩尔纹"]
            ] },
          { name: "width", kind: "整数", default: "512", desc: "Image Scale 的目标宽度。只改宽会拉伸变形，配合 crop 或保持比例的缩放节点使用。" },
          { name: "height", kind: "整数", default: "512", desc: "Image Scale 的目标高度。送入潜空间前记得保持 8 的倍数。" },
          { name: "crop", kind: "下拉选择", default: "disabled", desc: "Image Scale 尺寸不一致时是否居中裁掉超出部分。center 可避免拉伸变形，代价是损失边缘内容。",
            options: [
              ["disabled", "不裁剪，直接缩放到目标尺寸，比例不同会被拉伸"],
              ["center", "居中裁剪，保持比例但裁掉画面边缘"]
            ] },
          { name: "blend_mode", kind: "下拉选择", default: "normal", desc: "Image Blend 的图层混合模式，与 Photoshop 同名模式概念一致。",
            options: [
              ["normal", "普通叠加，仅按不透明度混合，效果最可预期"],
              ["multiply", "正片叠底，白色变透明、整体变暗，适合叠线稿和阴影"],
              ["screen", "滤色，黑色变透明、整体变亮，适合叠光效、光斑"],
              ["overlay", "叠加，暗部更暗亮部更亮，增强对比与质感"],
              ["soft_light", "柔光，比 overlay 温和，适合轻度统一色调"],
              ["difference", "差值，两图差异处变亮，常用于对齐检查与故障风"]
            ] },
          { name: "blend_factor", kind: "浮点数", default: "1.0", desc: "Image Blend 的混合比例：0 只见底图，1 上层图完全生效，0.5 左右是自然的双重曝光。" },
          { name: "resize_source", kind: "开关", default: "disable", desc: "Image Composite Masked 的选项：开启后自动把贴入的小图缩放到目标位置尺寸，省一步手工 Scale。" }
        ],
        why: "采样管线结束后的一切『排版级』操作都靠它们：尺寸统一、图层合成、局部回贴是几乎所有成品工作流的收尾步骤。",
        tips: "Composite 前务必保证两图尺寸一致（先 Scale）；按蒙版贴回时蒙版羽化 2-5px 可以消除接缝。"
      },
      {
        name: "Save Image / Preview Image", cat: "image",
        brief: "把图像写入 output 目录（保存）或仅在工作流中预览。",
        desc: "SaveImage 是工作流的终点节点：把 IMAGE 写入 output 文件夹，文件名可用 %date%、%seed% 等模板变量；同时图片元数据里完整嵌入了工作流信息——把 ComfyUI 生成的 PNG 直接拖回画布即可恢复整条工作流。PreviewImage 只在界面显示不落盘，适合中间结果检查。",
        inputs: [
          { name: "images", type: "IMAGE", from: "VAEDecode 或后处理输出", desc: "待输出图像" }
        ],
        outputs: [],
        params: [
          { name: "filename_prefix", kind: "文本", default: "ComfyUI", desc: "输出文件名前缀，支持 %date:yyyy-MM-dd% 这类日期模板与 %seed% 等变量，批量出图时建议带上日期或模型关键词方便归档。" }
        ],
        why: "OUTPUT_NODE 类型节点：引擎以它们为『终点』判断哪些分支需要执行——一张图里没有输出节点的话，整个工作流会被判定无事可做。",
        tips: "文件名模板用 ComfyUI_%date:yyyy-MM-dd%_# 前缀自动编号；中间节点多用 Preview 少落盘，能省大量磁盘。"
      },
      {
        name: "Load Checkpoint 之外的模型加载家族", cat: "load",
        brief: "UNET/Diffusion Model Loader、DualCLIPLoader、VAE Loader——分离式模型的三件套。",
        desc: "Flux、Wan、SD3 等新架构不再把模型打包成一个文件，而是分开存放：扩散主体用 UNET Loader（models/unet 或 diffusion_models），文本编码器用 Dual/Triple CLIPLoader（如 Flux 用 T5-XXL + CLIP-L 双编码器），解码器用 VAE Loader 单独加载。三者替代 Load Checkpoint 的三路输出，接口不变。",
        inputs: [
          { name: "unet_name / clip_name1,2 / vae_name", type: "COMBO", from: "对应模型目录", desc: "各组件文件" }
        ],
        outputs: [
          { type: "MODEL / CLIP / VAE", to: "与 Load Checkpoint 完全相同的下游", desc: "三路标准输出" }
        ],
        params: [
          { name: "unet_name", kind: "下拉选择", default: "models/unet 或 diffusion_models 里的文件", desc: "选择扩散主体文件（Flux、Wan 等）。同名 fp8 版本体积与显存减半，是低显存跑新模型的第一选择。" },
          { name: "weight_dtype", kind: "下拉选择", default: "default", desc: "UNET Loader 的加载精度。default 按文件原样加载；显存吃紧时选 fp8 相关项可大幅省显存。",
            options: [
              ["fp8_e4m3fn", "8bit 浮点格式，显存约省一半，画质损失轻微，低显存首选"],
              ["fp8_e4m3fn_fast", "在 e4m3fn 基础上用更快的计算核心，速度更快，个别显卡可能报错"],
              ["fp8_e5m2", "另一种 8bit 格式，动态范围大但精度略低，较少用"]
            ] },
          { name: "clip_name1", kind: "下拉选择", default: "models/clip 里的编码器文件", desc: "DualCLIPLoader 的第一个文本编码器，Flux 通常是 CLIP-L（如 clip_l.safetensors）。" },
          { name: "clip_name2", kind: "下拉选择", default: "models/clip 里的编码器文件", desc: "第二个文本编码器，Flux 通常选 T5-XXL（显存翻倍，可选 fp8 版节省）。" },
          { name: "vae_name", kind: "下拉选择", default: "models/vae 里的文件", desc: "VAE Loader 选择的解码器文件，需与所用模型架构匹配，如 Flux 用 ae.safetensors。" }
        ],
        why: "新世代大模型都是分离式发布（且常有 fp8 量化版），不会用这三件套就跑不了 Flux/Wan 工作流。",
        tips: "显存不足优先换 fp8 量化的 UNET 文件；CLIP 编码器可用 CLIPSetLastLayer 或 skip 影响输出风格。加载 T5 时显存翻倍，可考虑 FP8 版 T5。"
      },
      {
        name: "CLIP Set Last Layer", cat: "clip",
        brief: "截断 CLIP 编码器的最后几层，修复某些模型的提示词表现。",
        desc: "CLIP 文本编码器有 12 层（SD1.5），社区经验表明最后 1-2 层对图像生成没有正面贡献，截掉后某些底模的色彩饱和度与构图会更好。这个节点把 CLIP 的输出层数设为 stop_at_clip_layer（常填 -1 或 -2），插在 Load Checkpoint 与 CLIP Text Encode 之间。",
        inputs: [
          { name: "clip", type: "CLIP", from: "Load Checkpoint", desc: "待截断的编码器" },
          { name: "stop_at_clip_layer", type: "INT", from: "控件（常为 -1/-2）", desc: "从尾部截掉几层" }
        ],
        outputs: [
          { type: "CLIP", to: "CLIP Text Encode", desc: "截断后的编码器" }
        ],
        params: [
          { name: "stop_at_clip_layer", kind: "整数", default: "-1", desc: "负数表示从 CLIP 尾部截掉几层。-1 截一层，-2 截两层。某些二次元底模在 -2 时色彩与构图明显更好；现代 SDXL/Flux 模型一般保持默认。" }
        ],
        why: "特定二次元底模（如 Anything 系列）在 -1/-2 层有明显画质增益，是老玩家口口相传的『玄学优化』的真实出处。",
        tips: "现代 SDXL/Flux 模型一般不需要动它；只有当特定底模出图发灰、构图呆板时值得试 -2。"
      },
      {
        name: "Note / Primitive / Reroute", cat: "util",
        brief: "画布辅助三件套：便签、参数复用、走线整理。",
        desc: "它们不参与计算：Note 用来写工作流说明（作者、参数建议）；Primitive 把一个参数（种子/数值/文本）提取成独立控件，可同时喂给多个节点实现『一处改、处处变』；Reroute 是纯粹的连线转折点，让复杂图的走线保持清爽。",
        inputs: [],
        outputs: [
          { type: "*（Primitive 视内容而定）", to: "任意同类型输入", desc: "转发的参数值" }
        ],
        params: [],
        why: "工作流传播（社区分享）离不开它们：没有注释的工作流两周后连作者自己都看不懂；没有 Primitive，改一个公共种子要点开每个节点。",
        tips: "分享工作流前放一张 Note 写清模型清单与参数范围是社区礼仪；rgthree 等第三方包有增强版（如 Power Prompt、Any Reroute）。"
      },
      {
        name: "Image Resize（官方）与裁剪家族", cat: "image",
        brief: "官方图像尺寸调整：等比缩放、裁剪、填充。",
        desc: "ImageScaleBy（倍率缩放）、ImageCrop（裁剪）、ImagePad（填充边框）等构成基础尺寸工具箱。外扩工作流（outpaint）的核心一步就是用 Pad 把小图周围填充成大画布、生成对应蒙版后重绘。",
        inputs: [
          { name: "image", type: "IMAGE", from: "LoadImage 或上游处理结果", desc: "源图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "VAEEncode / Composite / Save", desc: "调整后的图像" }
        ],
        params: [
          { name: "upscale_method", kind: "下拉选择", default: "bicubic", desc: "像素插值算法，与 Image Scale 相同；放大照片选 lanczos 或 bicubic 更清晰。" },
          { name: "scale_by", kind: "浮点数", default: "1.5", desc: "缩放倍率。以倍率缩放时自动保持长宽比，比手填宽高更不容易变形；外扩画布外的操作则配合裁剪与填充节点完成。" }
        ],
        why: "所有涉及『输入图与目标分辨率不一致』的场景都需要它：图生图、ControlNet 参考、外扩、拼图合成。",
        tips: "等比缩放后常出现非 8 倍数尺寸——潜空间要求尺寸是 8 的倍数，记得用选项里的 divisible-by 对齐。"
      },
      {
        name: "SamplerCustomAdvanced + 基础采样组件", cat: "sampler",
        brief: "新一代解耦采样：noise / guider / sampler / sigmas 四件自由组合。",
        desc: "官方把采样拆成四个独立组件：KSampler 一把抓的东西在这里全部变成输入——NoisyLatentImageMaker/RandomNoise（造噪声）、BasicGuider/FluxGuidance（引导策略）、KSamplerSelect（选算法）、BasicScheduler（按模型与步数生成噪声日程 sigmas）。SamplerCustomAdvanced 把它们拼装执行。Flux、Wan 等新模型工作流多用这种写法，灵活性远超老式 KSampler。",
        inputs: [
          { name: "noise / guider / sampler / sigmas / latent_image", type: "NOISE / GUIDER / SAMPLER / SIGMAS / LATENT", from: "对应的四个组件节点", desc: "采样全家桶" }
        ],
        outputs: [
          { type: "LATENT / output", to: "VAEDecode", desc: "采样结果" }
        ],
        params: [
          { name: "noise_seed", kind: "整数", default: "0", desc: "RandomNoise 组件的噪声种子，作用等同于 KSampler 的 seed，控制整次生成的随机性。" },
          { name: "sampler_name", kind: "下拉选择", default: "euler", desc: "KSamplerSelect 选择的去噪算法，选项与普通 KSampler 相同；dpmpp_2m 配 karras 调度器依旧是稳妥的高质量组合。" },
          { name: "scheduler", kind: "下拉选择", default: "normal", desc: "BasicScheduler 生成的噪声日程表类型，karras 细节更精致，sgm_uniform 常用于视频模型。" },
          { name: "steps", kind: "整数", default: "20", desc: "BasicScheduler 的总步数，决定噪声日程被切成多少步，20-35 为常用区间。" },
          { name: "denoise", kind: "浮点数", default: "1.0", desc: "BasicScheduler 的去噪强度：1.0 完整生成，0.5 相当于只用日程表的前半段做图生图。" }
        ],
        why: "想精细控制采样（自定义噪声日程、中途换引导、多阶段采样）只能用它；新模型官方示例也用它，看不懂它就看不懂 Flux 工作流。",
        tips: "入门先理解 sigmas：它本质是每一步的噪声强度时间表，denoise 0.5 在老 KSampler 里等价于 sigmas 取前半段。"
      },
      {
        name: "Video 相关官方节点（EmptyLatentVideo / 拆帧合帧）", cat: "video",
        brief: "视频潜空间与帧序列处理的官方基础件。",
        desc: "随着视频模型（Wan、HunyuanVideo、LTXV）进入官方支持，内置了视频版潜空间创建（按帧数与 fps 建立带时间维度的 latent）、GetImageSize、帧序列处理等基础节点，配合 VHS（第三方）完成读写视频文件。视频 latent 的『批次』含义从『几张图』变成了『多少帧』。",
        inputs: [
          { name: "width / height / length / fps", type: "INT", from: "控件", desc: "分辨率与帧数帧率" }
        ],
        outputs: [
          { type: "LATENT", to: "视频模型 KSampler", desc: "视频初始噪声" }
        ],
        params: [
          { name: "width", kind: "整数", default: "832", desc: "视频画布宽度。Wan 系模型常用 832x480 横版或 480x832 竖版，需为 16 的倍数。" },
          { name: "height", kind: "整数", default: "480", desc: "视频画布高度。分辨率与帧数共同决定显存占用，先降帧再降分辨率是排障顺序。" },
          { name: "length", kind: "整数", default: "81", desc: "总帧数，即视频长度（Wan 按 16 帧每秒计，81 帧约 5 秒）。多数视频模型要求帧数为 4 的倍数加 1（如 49、81），显存随帧数近似线性增长。" }
        ],
        why: "视频工作流的信息量是图像的几百倍，理解『帧数即 batch、显存随帧数线性涨』是入门视频生成的第一课。",
        tips: "512x512x81 帧的 5B 级模型在 12G 显存可跑；帧数每翻一倍显存近似翻倍，出问题先降帧再降分辨率。"
      }
    ]
  });
})();
