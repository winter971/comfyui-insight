(function () {
  "use strict";

  window.COMFY_DATA = window.COMFY_DATA || {};
  window.COMFY_DATA.workflows = window.COMFY_DATA.workflows || [];

  /* ================= 1. ControlNet Canny 勾边控制 ================= */
  window.COMFY_DATA.workflows.push({
    id: "controlnet-canny",
    name: "ControlNet Canny 勾边控制",
    category: "ControlNet",
    tags: ["ControlNet", "Canny", "边缘控制", "构图"],
    difficulty: 2,
    source: "社区通用结构（controlnet_aux + Apply ControlNet 经典组合）",
    summary: "用 Canny 边缘检测（Canny Edge Detection）把参考图的轮廓线提取出来，再通过控制网（ControlNet）把这条轮廓强加给扩散模型（Diffusion Model）。构图完全锁定，而材质、颜色、光照、风格全部由提示词和底模重新绘制。这是理解 ControlNet 工作原理最直观的入门实验。",
    useCases: [
      "按产品照片的轮廓重新渲染成不同材质的概念图",
      "把真人照片转成动画、插画等指定风格且保持姿势",
      "建筑与工业设计草图的上色与材质替换",
      "固定构图的批量风格化出图"
    ],
    models: [
      { type: "Checkpoint", name: "SD1.5 写实或人像向底模", note: "Canny 系列控制模型主要面向 SD1.5 训练，底模与控制模型需同一代。" },
      { type: "ControlNet", name: "control_v11p_sd15_canny", note: "Canny 专用控制模型，权重约 1.4GB。" }
    ],
    graph: {
      nodes: [
        { id: "ckpt", title: "Load Checkpoint", cat: "load", x: 30, y: 40,
          widgets: ["SD1.5 人像向底模"],
          inputs: [],
          outputs: [ { type: "MODEL" }, { type: "CLIP" }, { type: "VAE" } ],
          params: [
            { name: "ckpt_name", kind: "下拉选择", default: "SD1.5 人像向底模", desc: "选择 models/checkpoints 目录中的底模；Canny 系控制模型主要面向 SD1.5 训练，底模必须与控制模型同代。" }
          ],
          brief: "加载底模并吐出三大件。",
          desc: "底模提供去噪能力，CLIP 负责理解提示词，VAE 负责潜空间与像素图像的互转。" },
        { id: "ref", title: "Load Image", cat: "load", x: 30, y: 220,
          widgets: ["勾边参考图"],
          inputs: [],
          outputs: [ { type: "IMAGE" } ],
          params: [
            { name: "image", kind: "下拉选择", default: "勾边参考图", desc: "从 input 目录选择用于提取轮廓的参考图；它只贡献线条信息，模糊或过曝的照片会提取出断线。" }
          ],
          brief: "载入用来提取轮廓的参考图。",
          desc: "参考图只贡献线条信息，画面内容可以与最终输出完全不同。" },
        { id: "cn", title: "Load ControlNet Model", cat: "load", x: 30, y: 400,
          widgets: ["control_v11p_sd15_canny"],
          inputs: [],
          outputs: [ { type: "CONTROL_NET" } ],
          params: [
            { name: "control_net_name", kind: "下拉选择", default: "control_v11p_sd15_canny", desc: "models/controlnet 目录中的 Canny 专用控制模型，把线稿图翻译成对采样的引导信号。" }
          ],
          brief: "载入 Canny 专用控制模型。",
          desc: "它是一个挂在 U-Net 上的旁路网络，把线条图翻译成对采样的引导信号。" },
        { id: "pre", title: "CannyEdgePreprocessor", cat: "image", x: 360, y: 400,
          widgets: ["low_threshold 100", "high_threshold 200"],
          inputs: [ { name: "image", type: "IMAGE" } ],
          outputs: [ { type: "IMAGE" } ],
          params: [
            { name: "low_threshold", kind: "整数", default: "100", desc: "Canny 低阈值，低于此梯度的边不算边缘；线条太碎时升它，断线多时降它。" },
            { name: "high_threshold", kind: "整数", default: "200", desc: "Canny 高阈值，高于此梯度必为边缘；两值之间为过渡区，越高只剩主要轮廓。" }
          ],
          brief: "controlnet_aux 插件的 Canny 预处理器。",
          desc: "从参考图中提取黑白线稿，白线代表强边缘。ControlNet Canny 模型只认这种线稿格式。" },
        { id: "pos", title: "CLIP Text Encode (Prompt)", cat: "cond", x: 360, y: 40,
          widgets: ["正向提示词"],
          inputs: [ { name: "clip", type: "CLIP" } ],
          outputs: [ { type: "CONDITIONING" } ],
          params: [
            { name: "text", kind: "多行文本", default: "正向提示词", desc: "描述线稿内部长出什么内容；构图已被线稿锁定，重点写材质、光照与风格。" }
          ],
          brief: "把正向提示词编码为条件向量。",
          desc: "描述你希望线稿内部长出什么内容，如人物、材质与光照。" },
        { id: "neg", title: "CLIP Text Encode (Prompt)", cat: "cond", x: 360, y: 220,
          widgets: ["负向提示词"],
          inputs: [ { name: "clip", type: "CLIP" } ],
          outputs: [ { type: "CONDITIONING" } ],
          params: [
            { name: "text", kind: "多行文本", default: "负向提示词", desc: "排除低画质、畸形等特征；ControlNet 场景下负向词不会破坏构图。" }
          ],
          brief: "把负向提示词编码为要避开的条件。",
          desc: "低画质、畸形手指等要排除的特征写在这里。" },
        { id: "apply", title: "Apply ControlNet", cat: "cond", x: 660, y: 40,
          widgets: ["strength 1.0"],
          inputs: [
            { name: "positive", type: "CONDITIONING" },
            { name: "negative", type: "CONDITIONING" },
            { name: "control_net", type: "CONTROL_NET" },
            { name: "image", type: "IMAGE" }
          ],
          outputs: [ { type: "CONDITIONING" }, { type: "CONDITIONING" } ],
          params: [
            { name: "strength", kind: "浮点数", default: "1.0", desc: "控制强度，1.0 严格贴线；0.6 到 0.8 保留结构同时给模型更多发挥空间。" }
          ],
          brief: "把线稿控制信号注入正负两条条件。",
          desc: "输出仍是两条 CONDITIONING，但内部已携带引导信息，KSampler 无感知地接收。" },
        { id: "latent", title: "Empty Latent Image", cat: "latent", x: 360, y: 580,
          widgets: ["512 x 768", "batch 1"],
          inputs: [],
          outputs: [ { type: "LATENT" } ],
          params: [
            { name: "width", kind: "整数", default: "512", desc: "画布宽度，SD1.5 建议 512 至 768 区间且为 8 的倍数；比例尽量与参考图一致，否则线条被拉伸导致变形。" },
            { name: "height", kind: "整数", default: "768", desc: "画布高度，竖构图 512 x 768 是人像常用档。" },
            { name: "batch_size", kind: "整数", default: "1", desc: "一次并行生成的张数；ControlNet 实验建议逐张验收。" }
          ],
          brief: "生成一张空白潜空间画布。",
          desc: "ControlNet 属于文生图控制，起画点依然是一张纯噪声潜空间。" },
        { id: "ks", title: "KSampler", cat: "sampler", x: 1000, y: 60,
          widgets: ["seed 42", "steps 25", "cfg 7.0", "sampler dpmpp_2m", "scheduler karras", "denoise 1.0"],
          inputs: [
            { name: "model", type: "MODEL" },
            { name: "positive", type: "CONDITIONING" },
            { name: "negative", type: "CONDITIONING" },
            { name: "latent_image", type: "LATENT" }
          ],
          outputs: [ { type: "LATENT" } ],
          params: [
            { name: "seed", kind: "整数", default: "42", desc: "固定种子可复现结果；固定后微调 strength 与阈值，是定位问题的标准手法。" },
            { name: "steps", kind: "整数", default: "25", desc: "去噪步数，ControlNet 场景 20 到 30 步足够收敛。" },
            { name: "cfg", kind: "浮点数", default: "7.0", desc: "提示词服从度，过高会过饱和并放大线条外的噪点。" },
            { name: "sampler_name", kind: "下拉选择", default: "dpmpp_2m", desc: "去噪的数学策略，影响速度与画风。",
              options: [["dpmpp_2m", "2 阶多步方法，速度与质量兼顾，配 karras 最热门"], ["dpmpp_2m_sde", "在 dpmpp_2m 基础上加噪声方程，纹理更锐利"], ["euler", "最朴素稳定，通用首选，出图柔和"], ["euler_ancestral", "每步引入随机性，细节更奔放，复现性略差"]] },
            { name: "scheduler", kind: "下拉选择", default: "karras", desc: "控制每一步噪声强度的时间表。",
              options: [["karras", "步间过渡更平滑，细节更干净，最常用"], ["normal", "默认线性计划，通用"], ["simple", "简化日程，部分新模型表现更稳"], ["sgm_uniform", "SD3 与视频模型常用，少步采样收益明显"]] },
            { name: "denoise", kind: "浮点数", default: "1.0", desc: "文生图控制流从纯噪声开始，保持 1.0。" }
          ],
          brief: "在线稿引导下完成整个去噪过程。",
          desc: "每一步去噪都会被 Apply ControlNet 注入的信号拉向线稿结构。" },
        { id: "dec", title: "VAE Decode", cat: "vae", x: 1290, y: 60,
          widgets: [],
          inputs: [
            { name: "samples", type: "LATENT" },
            { name: "vae", type: "VAE" }
          ],
          outputs: [ { type: "IMAGE" } ],
          brief: "把采样结果解码为可见图像。",
          desc: "潜空间是压缩后的数学表示，必须经 VAE 还原成像素。" },
        { id: "save", title: "Save Image", cat: "image", x: 1530, y: 60,
          widgets: ["filename_prefix ComfyUI"],
          inputs: [ { name: "images", type: "IMAGE" } ],
          outputs: [],
          params: [
            { name: "filename_prefix", kind: "文本", default: "ComfyUI", desc: "输出文件命名前缀，支持日期等占位符，方便批量实验归档；产物在 output 目录。" }
          ],
          brief: "保存最终结果。",
          desc: "文件名前缀可自定义，输出目录默认为 ComfyUI 的 output 文件夹。" }
      ],
      links: [
        { from: "ckpt", fromOut: 0, to: "ks", toIn: "model" },
        { from: "ckpt", fromOut: 1, to: "pos", toIn: "clip" },
        { from: "ckpt", fromOut: 1, to: "neg", toIn: "clip" },
        { from: "ckpt", fromOut: 2, to: "dec", toIn: "vae" },
        { from: "ref", fromOut: 0, to: "pre", toIn: "image" },
        { from: "pre", fromOut: 0, to: "apply", toIn: "image" },
        { from: "cn", fromOut: 0, to: "apply", toIn: "control_net" },
        { from: "pos", fromOut: 0, to: "apply", toIn: "positive" },
        { from: "neg", fromOut: 0, to: "apply", toIn: "negative" },
        { from: "apply", fromOut: 0, to: "ks", toIn: "positive" },
        { from: "apply", fromOut: 1, to: "ks", toIn: "negative" },
        { from: "latent", fromOut: 0, to: "ks", toIn: "latent_image" },
        { from: "ks", fromOut: 0, to: "dec", toIn: "samples" },
        { from: "dec", fromOut: 0, to: "save", toIn: "images" }
      ]
    },
    stages: [
      { name: "模型与参考载入", nodes: ["ckpt", "ref", "cn"], desc: "底模决定画面质感，Canny 控制模型决定控制强度上限，参考图提供原始轮廓来源。三者相互独立、可分别替换。" },
      { name: "边缘提取", nodes: ["pre"], desc: "Canny 算法用双阈值把参考图变成黑白线稿，这一步剥离了颜色与纹理，只留下结构。" },
      { name: "条件注入", nodes: ["pos", "neg", "apply"], desc: "正负提示词先编码成条件，再由 Apply ControlNet 把线稿作为额外信号缝进条件里。" },
      { name: "采样与解码", nodes: ["latent", "ks", "dec", "save"], desc: "KSampler 在噪声与条件的博弈中逐步去噪，每一步都被线稿牵引，最终经 VAE 解码成图。" }
    ],
    nodeAnalysis: [
      { node: "ckpt", detail: "Load Checkpoint 是所有文生图工作流的起点，一次性输出 MODEL、CLIP、VAE 三个对象。MODEL 是扩散模型本体，决定画面风格与能力上限。CLIP 是文本编码器，提示词必须经过它才能被模型理解。VAE 负责像素与潜空间之间的压缩与还原，底模自带的 VAE 通常与模型最匹配。" },
      { node: "ref", detail: "Load Image 载入的参考图只充当结构来源，不会直接进入输出画面。图片质量会影响线稿质量，模糊或过曝的照片会提取出断线。分辨率建议与最终出图尺寸接近，避免线条比例失真。它和提示词是互补关系：线条管构图，文字管内容。" },
      { node: "cn", detail: "Load ControlNet Model 读取 control_v11p_sd15_canny 权重文件。它本身不产生图像，而是提供一个旁路神经网络，在采样时实时把控制图转译成特征注入 U-Net。控制模型必须与底模同代同家族，SD1.5 底模不能配 SDXL 控制模型。" },
      { node: "pre", detail: "CannyEdgePreprocessor 来自 controlnet_aux 插件，实现了经典的 Canny 边缘检测。low_threshold 与 high_threshold 是双阈值：梯度高于高值视为强边缘，介于两值之间且与强边缘相连才保留。阈值越低线条越多越碎，越高则只剩主轮廓。输出是黑底白线的线稿图，这正是 ControlNet Canny 模型训练时见过的输入格式。" },
      { node: "pos", detail: "正向提示词决定线稿内部长出什么。写法上先描述主体，再描述材质、光照与画质词。由于构图已被线稿锁死，提示词的重点应放在材质与风格上。CLIP 编码后输出的 CONDITIONING 是一串带注意力上下文的向量，而非简单文本。" },
      { node: "neg", detail: "负向提示词把不想要的元素从采样中推开。常规组合是低画质词、水印、畸形等通用项。ControlNet 场景下负向词不会破坏构图，因为结构约束在另一条通路里。它与正向词共用同一个 CLIP 但各自编码。" },
      { node: "apply", detail: "Apply ControlNet 是整个工作流的枢纽，四进两出。它把线稿图和控制模型绑定后注入正负两条条件，输出类型不变但内容已被增强。strength 控制引导强度，1.0 为完全跟随，降到 0.6 左右可给模型更多自由。start_percent 与 end_percent 可限定只在采样的某一段生效。" },
      { node: "latent", detail: "Empty Latent Image 按宽高与批量数生成纯噪声潜空间。尺寸是 64 的倍数时 VAE 工作最干净，SD1.5 常用 512 至 768 区间。尺寸越大，线条约束下的细节越丰富，但显存与时间成本也上升。文生图控制流中它是采样的唯一起点。" },
      { node: "ks", detail: "KSampler 组合了噪声生成、采样器与调度器三件事。seed 固定可复现结果，steps 25 在质量与速度间较平衡，cfg 7.0 控制提示词的听话程度。denoise 1.0 表示从纯噪声开始完整去噪。ControlNet 信号在每一步都参与，把画面逐步拉向线稿结构。" },
      { node: "dec", detail: "VAE Decode 把潜空间张量还原成 RGB 图像。潜空间是原图八分之一边长的压缩表示，解码过程会重建高频细节。若画面出现色偏或涂抹感，可换用外置 VAE 文件。它与 Load Checkpoint 输出的 VAE 同源，也可用 VAELoader 单独替换。" },
      { node: "save", detail: "Save Image 把图像写入 output 目录并在界面里显示缩略图。filename_prefix 支持日期等占位符，方便批量实验归档。想要临时比对结果时，可以换成 Preview Image 节点不落盘。调试期间建议先小尺寸跑通再放大尺寸。" }
    ],
    flow: [
      "① 载入底模，获得 MODEL、CLIP、VAE 三条输出线。",
      "② 载入勾边参考图与 Canny 控制模型。",
      "③ CannyEdgePreprocessor 用双阈值把参考图转成黑白线稿。",
      "④ 正负提示词分别经 CLIP 编码为条件向量。",
      "⑤ Apply ControlNet 把线稿与控制模型注入两条条件，strength 起步取 1.0。",
      "⑥ 生成空白潜空间，尺寸与参考图比例保持一致。",
      "⑦ KSampler 以 denoise 1.0 完整去噪，观察轮廓是否逐层贴合线稿。",
      "⑧ VAE Decode 解码，Save Image 保存，不满意时微调阈值与 strength 再跑。"
    ],
    params: [
      { name: "low_threshold / high_threshold", value: "100 / 200", desc: "Canny 双阈值，越低线条越多越碎，越高只剩主要轮廓，默认即常用值。" },
      { name: "strength", value: "1.0", desc: "控制强度，1.0 严格贴线，0.6 至 0.8 保留结构同时给模型更多发挥。" },
      { name: "steps", value: "25", desc: "采样步数，ControlNet 场景 20 到 30 步足够收敛。" },
      { name: "cfg", value: "7.0", desc: "提示词引导系数，过高会过饱和并放大线条外的噪点。" },
      { name: "denoise", value: "1.0", desc: "文生图控制流从纯噪声开始，保持 1.0 即可。" }
    ],
    tips: [
      "线稿里断线太多时优先降 low_threshold，而不是加大 strength。",
      "想要一半像参考一半自由发挥，把 strength 设为 0.7 左右效果往往比降低阈值更自然。",
      "用 start_percent 0.15 可以跳过前几步的约束，让大结构先自由成形再贴线。",
      "出图尺寸尽量与参考图等比例，否则线条会被拉伸导致人物变形。",
      "Canny 预处理器可以在 Apply ControlNet 前接一个 Preview Image，先看清线稿质量再采样。"
    ],
    notice: ""
  });

  /* ================= 2. 多 ControlNet 叠加 ================= */
  window.COMFY_DATA.workflows.push({
    id: "controlnet-multi",
    name: "多 ControlNet 叠加控制",
    category: "ControlNet",
    tags: ["ControlNet", "Depth", "Lineart", "条件合并"],
    difficulty: 3,
    source: "社区通用结构（双路 Apply ControlNet + Conditioning Combine）",
    summary: "同时使用深度（Depth）与线稿（Lineart）两路控制网：Depth 负责大体积与空间关系，Lineart 负责边缘细节，两路正向条件用 Conditioning Combine 合并后交给同一个 KSampler。这是把不同维度控制信息叠加进一次采样的标准做法。",
    useCases: [
      "空间感与轮廓都要精确的复杂场景构图",
      "人物姿态靠深度锁定、服饰褶皱靠线稿锁定的角色图",
      "多参考图融合：一张给体块，一张给线条",
      "需要精确控制前后遮挡关系的插画与分镜"
    ],
    models: [
      { type: "Checkpoint", name: "SD1.5 写实或插画底模", note: "两路控制模型都需与底模同代。" },
      { type: "ControlNet", name: "control_v11f1p_sd15_depth", note: "深度控制模型，f1 版本对深度图风格更宽容。" },
      { type: "ControlNet", name: "control_v11p_sd15_lineart", note: "线稿控制模型，跟随能力极强。" }
    ],
    graph: {
      nodes: [
        { id: "ckpt", title: "Load Checkpoint", cat: "load", x: 30, y: 40,
          widgets: ["SD1.5 底模"],
          inputs: [],
          outputs: [ { type: "MODEL" }, { type: "CLIP" }, { type: "VAE" } ],
          params: [
            { name: "ckpt_name", kind: "下拉选择", default: "SD1.5 底模", desc: "底模的先验必须足够强才能同时满足两路约束；两个控制网共用同一底模保证特征空间一致。" }
          ],
          brief: "加载底模三件套。",
          desc: "两个控制网共用同一底模的 MODEL 与 CLIP，保证特征空间一致。" },
        { id: "imgD", title: "Load Image", cat: "load", x: 30, y: 220,
          widgets: ["深度参考图"],
          inputs: [],
          outputs: [ { type: "IMAGE" } ],
          params: [
            { name: "image", kind: "下拉选择", default: "深度参考图", desc: "提供空间结构的参考图；深度路只关心远近与体块，配色无关紧要，单人照片最稳。" }
          ],
          brief: "载入提供空间结构的参考图。",
          desc: "Depth 路只关心远近与体块，颜色和线条都会被丢弃。" },
        { id: "imgL", title: "Load Image", cat: "load", x: 30, y: 400,
          widgets: ["线稿参考图"],
          inputs: [],
          outputs: [ { type: "IMAGE" } ],
          params: [
            { name: "image", kind: "下拉选择", default: "线稿参考图", desc: "提供边缘细节的参考图；照片、线稿或 3D 轮廓图都可以，关键是预处理后线条干净。" }
          ],
          brief: "载入提供边缘细节的参考图。",
          desc: "可以是照片、线稿或 3D 渲染的轮廓图。" },
        { id: "cnD", title: "Load ControlNet Model", cat: "load", x: 30, y: 580,
          widgets: ["control_v11f1p_sd15_depth"],
          inputs: [],
          outputs: [ { type: "CONTROL_NET" } ],
          params: [
            { name: "control_net_name", kind: "下拉选择", default: "control_v11f1p_sd15_depth", desc: "深度控制模型，f1 变体对非标准深度图更宽容；必须与底模同为 SD1.5。" }
          ],
          brief: "载入深度控制模型。",
          desc: "把深度图转译为空间体块信号注入采样过程。" },
        { id: "cnL", title: "Load ControlNet Model", cat: "load", x: 30, y: 760,
          widgets: ["control_v11p_sd15_lineart"],
          inputs: [],
          outputs: [ { type: "CONTROL_NET" } ],
          params: [
            { name: "control_net_name", kind: "下拉选择", default: "control_v11p_sd15_lineart", desc: "线稿控制模型，跟随精度高于 Canny；引导偏硬，叠路时强度要低于单路使用。" }
          ],
          brief: "载入线稿控制模型。",
          desc: "把线稿转译为边缘与轮廓信号。" },
        { id: "pos", title: "CLIP Text Encode (Prompt)", cat: "cond", x: 360, y: 40,
          widgets: ["正向提示词"],
          inputs: [ { name: "clip", type: "CLIP" } ],
          outputs: [ { type: "CONDITIONING" } ],
          params: [
            { name: "text", kind: "多行文本", default: "正向提示词", desc: "两个 Apply 节点共用这条正向条件；控制信息各自附加，语义信息保持一致。" }
          ],
          brief: "正向条件源，两路控制共用。",
          desc: "两个 Apply 节点都从这一条条件出发，分别叠加不同的控制信号。" },
        { id: "neg", title: "CLIP Text Encode (Prompt)", cat: "cond", x: 360, y: 220,
          widgets: ["负向提示词"],
          inputs: [ { name: "clip", type: "CLIP" } ],
          outputs: [ { type: "CONDITIONING" } ],
          params: [
            { name: "text", kind: "多行文本", default: "负向提示词", desc: "本图负向只走线稿路一次；需要独立负向控制时再把两条负向也接进 Combine。" }
          ],
          brief: "负向条件源。",
          desc: "本图负向只走一路 Apply，控制需求低时足够。" },
        { id: "preD", title: "DepthAnythingV2Preprocessor", cat: "image", x: 360, y: 400,
          widgets: ["depth_anything_v2_vitl.pth"],
          inputs: [ { name: "image", type: "IMAGE" } ],
          outputs: [ { type: "IMAGE" } ],
          params: [
            { name: "ckpt_name", kind: "下拉选择", default: "depth_anything_v2_vitl.pth", desc: "Depth Anything V2 的权重档位，vitl 精度最高也最吃显存；输出近亮远暗的灰度深度图。" }
          ],
          brief: "Depth Anything V2 深度估计预处理。",
          desc: "controlnet_aux 插件节点，输出灰度深度图，越亮越近、越暗越远。" },
        { id: "preL", title: "LineArtPreprocessor", cat: "image", x: 360, y: 580,
          widgets: ["coarse disable"],
          inputs: [ { name: "image", type: "IMAGE" } ],
          outputs: [ { type: "IMAGE" } ],
          params: [
            { name: "coarse", kind: "下拉选择", default: "disable", desc: "控制线稿粗细，叠路场景用精细线条发挥细节分工。",
              options: [["disable", "输出全细节线条"], ["enable", "只保留粗轮廓，锁大体形状"]] }
          ],
          brief: "Lineart 线稿提取预处理。",
          desc: "coarse 设为 disable 输出精细线条，enable 则只保留粗轮廓。" },
        { id: "latent", title: "Empty Latent Image", cat: "latent", x: 360, y: 760,
          widgets: ["512 x 768", "batch 1"],
          inputs: [],
          outputs: [ { type: "LATENT" } ],
          params: [
            { name: "width", kind: "整数", default: "512", desc: "画布宽度，尺寸比例尽量与两张参考图一致，失配会造成结构拉伸。" },
            { name: "height", kind: "整数", default: "768", desc: "画布高度，与预处理的控制图等比最稳。" },
            { name: "batch_size", kind: "整数", default: "1", desc: "一次并行生成的张数，多路控制先单张调通再批量。" }
          ],
          brief: "空白潜空间画布。",
          desc: "尺寸比例尽量与两张参考图一致。" },
        { id: "aD", title: "Apply ControlNet", cat: "cond", x: 660, y: 40,
          widgets: ["strength 0.65", "start_percent 0.0", "end_percent 1.0"],
          inputs: [
            { name: "positive", type: "CONDITIONING" },
            { name: "negative", type: "CONDITIONING" },
            { name: "control_net", type: "CONTROL_NET" },
            { name: "image", type: "IMAGE" }
          ],
          outputs: [ { type: "CONDITIONING" }, { type: "CONDITIONING" } ],
          params: [
            { name: "strength", kind: "浮点数", default: "0.65", desc: "深度管大形，取中低强度给线稿路留空间；过强会压制细节路表现。" },
            { name: "start_percent", kind: "浮点数", default: "0.0", desc: "保持 0，体块信号从第一步就注入。" },
            { name: "end_percent", kind: "浮点数", default: "1.0", desc: "保持 1.0 让深度全程生效，体块从第一步就定调。" }
          ],
          brief: "深度路条件注入。",
          desc: "全程生效，负责大形与空间关系。" },
        { id: "aL", title: "Apply ControlNet", cat: "cond", x: 660, y: 270,
          widgets: ["strength 0.9", "start_percent 0.0", "end_percent 0.8"],
          inputs: [
            { name: "positive", type: "CONDITIONING" },
            { name: "negative", type: "CONDITIONING" },
            { name: "control_net", type: "CONTROL_NET" },
            { name: "image", type: "IMAGE" }
          ],
          outputs: [ { type: "CONDITIONING" }, { type: "CONDITIONING" } ],
          params: [
            { name: "strength", kind: "浮点数", default: "0.9", desc: "线稿需要较高强度才能压住细节；两路 strength 总和不宜超过 1.6。" },
            { name: "start_percent", kind: "浮点数", default: "0.0", desc: "保持 0，轮廓从第一步就锁定。" },
            { name: "end_percent", kind: "浮点数", default: "0.8", desc: "最后两成步数放开线条约束，避免细节被描边感污染。" }
          ],
          brief: "线稿路条件注入。",
          desc: "end_percent 收到 0.8，让收尾阶段放松线条约束以获得更自然的细节。" },
        { id: "mix", title: "Conditioning (Combine)", cat: "cond", x: 660, y: 612,
          widgets: [],
          inputs: [
            { name: "conditioning_1", type: "CONDITIONING" },
            { name: "conditioning_2", type: "CONDITIONING" }
          ],
          outputs: [ { type: "CONDITIONING" } ],
          brief: "把两路正向条件拼接成一条。",
          desc: "KSampler 只接受一条正向输入，多路控制必须先在此汇合。" },
        { id: "ks", title: "KSampler", cat: "sampler", x: 1020, y: 120,
          widgets: ["seed 42", "steps 28", "cfg 7.0", "sampler dpmpp_2m", "scheduler karras", "denoise 1.0"],
          inputs: [
            { name: "model", type: "MODEL" },
            { name: "positive", type: "CONDITIONING" },
            { name: "negative", type: "CONDITIONING" },
            { name: "latent_image", type: "LATENT" }
          ],
          outputs: [ { type: "LATENT" } ],
          params: [
            { name: "seed", kind: "整数", default: "42", desc: "固定种子便于对比不同 strength 组合的效果。" },
            { name: "steps", kind: "整数", default: "28", desc: "双重约束需要更多步数协调，比单路控制略增。" },
            { name: "cfg", kind: "浮点数", default: "7.0", desc: "多路叠加时提示词权重不宜再高，过高画面僵硬。" },
            { name: "sampler_name", kind: "下拉选择", default: "dpmpp_2m", desc: "去噪的数学策略，影响速度与画风。",
              options: [["dpmpp_2m", "2 阶多步方法，速度与质量兼顾，配 karras 最热门"], ["dpmpp_2m_sde", "在 dpmpp_2m 基础上加噪声方程，纹理更锐利"], ["euler", "最朴素稳定，通用首选，出图柔和"], ["euler_ancestral", "每步引入随机性，细节更奔放，复现性略差"]] },
            { name: "scheduler", kind: "下拉选择", default: "karras", desc: "控制每一步噪声强度的时间表。",
              options: [["karras", "步间过渡更平滑，细节更干净，最常用"], ["normal", "默认线性计划，通用"], ["simple", "简化日程，部分新模型表现更稳"], ["sgm_uniform", "SD3 与视频模型常用，少步采样收益明显"]] },
            { name: "denoise", kind: "浮点数", default: "1.0", desc: "从零开始完整生成，保持 1.0。" }
          ],
          brief: "在双重引导下采样。",
          desc: "两路信号同时作用于每一步去噪，彼此通过 strength 与时间段划分分工。" },
        { id: "dec", title: "VAE Decode", cat: "vae", x: 1310, y: 120,
          widgets: [],
          inputs: [
            { name: "samples", type: "LATENT" },
            { name: "vae", type: "VAE" }
          ],
          outputs: [ { type: "IMAGE" } ],
          brief: "解码潜空间为图像。",
          desc: "与底模配套的 VAE 保证色彩还原一致。" },
        { id: "save", title: "Save Image", cat: "image", x: 1540, y: 120,
          widgets: ["filename_prefix ComfyUI"],
          inputs: [ { name: "images", type: "IMAGE" } ],
          outputs: [],
          params: [
            { name: "filename_prefix", kind: "文本", default: "ComfyUI", desc: "多控制参数空间大，前缀里记录两路 strength 缩写便于横向比较。" }
          ],
          brief: "保存结果。",
          desc: "多控制实验建议在前缀里记录参数组合便于回溯。" }
      ],
      links: [
        { from: "ckpt", fromOut: 0, to: "ks", toIn: "model" },
        { from: "ckpt", fromOut: 1, to: "pos", toIn: "clip" },
        { from: "ckpt", fromOut: 1, to: "neg", toIn: "clip" },
        { from: "ckpt", fromOut: 2, to: "dec", toIn: "vae" },
        { from: "imgD", fromOut: 0, to: "preD", toIn: "image" },
        { from: "imgL", fromOut: 0, to: "preL", toIn: "image" },
        { from: "cnD", fromOut: 0, to: "aD", toIn: "control_net" },
        { from: "cnL", fromOut: 0, to: "aL", toIn: "control_net" },
        { from: "pos", fromOut: 0, to: "aD", toIn: "positive" },
        { from: "pos", fromOut: 0, to: "aL", toIn: "positive" },
        { from: "neg", fromOut: 0, to: "aD", toIn: "negative" },
        { from: "neg", fromOut: 0, to: "aL", toIn: "negative" },
        { from: "preD", fromOut: 0, to: "aD", toIn: "image" },
        { from: "preL", fromOut: 0, to: "aL", toIn: "image" },
        { from: "aD", fromOut: 0, to: "mix", toIn: "conditioning_1" },
        { from: "aL", fromOut: 0, to: "mix", toIn: "conditioning_2" },
        { from: "aL", fromOut: 1, to: "ks", toIn: "negative" },
        { from: "mix", fromOut: 0, to: "ks", toIn: "positive" },
        { from: "latent", fromOut: 0, to: "ks", toIn: "latent_image" },
        { from: "ks", fromOut: 0, to: "dec", toIn: "samples" },
        { from: "dec", fromOut: 0, to: "save", toIn: "images" }
      ]
    },
    stages: [
      { name: "双参考与双控制模型载入", nodes: ["ckpt", "imgD", "imgL", "cnD", "cnL"], desc: "两张参考图各管一个维度，两个控制模型分别与之配对。底模的三条输出线被整条管线共享。" },
      { name: "双路预处理", nodes: ["preD", "preL"], desc: "深度图与线稿分别从各自参考图提取，格式必须与对应控制模型的训练输入一致。" },
      { name: "双路条件注入", nodes: ["pos", "neg", "aD", "aL"], desc: "同一条正向条件被复制成两份，各自叠加不同的控制信号；strength 与时间段在此分工。" },
      { name: "条件合并", nodes: ["mix"], desc: "Conditioning Combine 把两条正向条件拼成一条，采样时两路引导同时生效。" },
      { name: "采样与输出", nodes: ["latent", "ks", "dec", "save"], desc: "KSampler 只看到一条合并后的正向输入，负向直接取线稿路的输出。" }
    ],
    nodeAnalysis: [
      { node: "ckpt", detail: "底模加载节点输出 MODEL、CLIP、VAE。多控制叠加时对底模的要求更高，因为引导信号互相挤压，底模的先验必须足够强才能同时满足两种约束。CLIP 输出被两条条件链共享，保证两路条件在同一语义空间。VAE 单独供解码使用。" },
      { node: "imgD", detail: "深度参考图优先选择主体完整、前后关系清晰的画面。深度预处理只保留明度层次，所以参考图的配色无关紧要。若想控制的是人物体态，用单人照片效果最稳定。它与线稿参考可以是完全不同的两张图。" },
      { node: "imgL", detail: "线稿参考图决定所有可见边缘的位置。照片、线稿或 3D 素材都能作为输入，关键在预处理后线条是否干净。线稿路与深度路冲突时，视觉上表现为轮廓抖动，此时应降低其中一路的 strength。" },
      { node: "cnD", detail: "control_v11f1p_sd15_depth 是 v11 系列的深度模型，f1 变体在训练时混用了多种深度估计器的输出，对非标准深度图更宽容。它把灰度深度图编码成空间注意力信号注入 U-Net 的各层。与底模必须同为 SD1.5。" },
      { node: "cnL", detail: "control_v11p_sd15_lineart 对线条的跟随精度高于 Canny，因为它在训练时学习的是完整线稿语义而非纯边缘。适合锁定服装褶皱、发丝走向等细节。它的引导偏硬，叠路时 strength 常要低于单路使用。" },
      { node: "pos", detail: "正向提示词在这里被两个 Apply 节点共用，这是多路叠加的推荐做法：控制信息各自附加，语义信息保持一致。提示词描述最终画面内容即可，无需分别描述两个维度。若两路想用不同提示词，也可拆成两个 CLIP Text Encode。" },
      { node: "neg", detail: "负向条件同样可被两路共用。本图负向只经过线稿路一次就送入 KSampler，深度路输出的负向被闲置，这在两路负向内容相同时是常见简化。需要独立负向控制时，把两条负向也接进一个 Combine 即可。" },
      { node: "preD", detail: "DepthAnythingV2Preprocessor 是当前社区最常用的深度估计器之一，模型文件按参数量分档，vitl 精度最高也最吃显存。输出单通道灰度图，近处亮、远处暗。深度图的平滑程度直接影响体块的柔和度，边缘过硬时可换用相对深度模式。" },
      { node: "preL", detail: "LineArtPreprocessor 基于线稿检测网络，coarse 参数控制输出粗细：disable 输出全细节线条，enable 输出粗轮廓。叠路场景常用 disable 以发挥线稿路管细节的分工。输出同样是白线黑底格式。" },
      { node: "latent", detail: "空白潜空间决定了输出的宽高比。多控制时各控制图会在节点内部按采样尺寸自动缩放，比例失配会造成结构拉伸。建议三者等比，或统一按目标出图比例裁剪参考图。" },
      { node: "aD", detail: "深度路 Apply 节点全程生效，strength 取 0.65 左右的偏低值，因为深度控制的是大形，过强会压制细节路的表现。它输出的正向进入 Combine，负向在本图未用。start_percent 保持 0 让体块从第一步就定调。" },
      { node: "aL", detail: "线稿路 strength 取 0.9 提供强轮廓约束，end_percent 设 0.8 让最后两成步数放开线条，避免细节被描边感污染。两路时间段重叠区是二者博弈的区间，也是参数调试的核心。输出的负向直接作为 KSampler 的负向输入。" },
      { node: "mix", detail: "Conditioning Combine 只做条件拼接，不计算平均值。多路控制正是利用这一点：两条条件各自携带注意力引导，采样时同时生效。叠加超过两路时可以级联多个 Combine 节点。注意它不是混合强度旋钮，强度要在各路 Apply 上调。" },
      { node: "ks", detail: "KSampler 拿到的正向是合并条件，负向是线稿路的输出。steps 28 略高于单路控制，因为双重约束需要更多步数协调。seed 固定便于对比不同 strength 组合。denoise 1.0 从零开始完整生成。" },
      { node: "dec", detail: "VAE Decode 在多控制场景没有特殊之处，参数与单路用法完全一致。但正因为两路信号互相挤压，潜空间容易出现轻微色偏，解码前可加后处理观察。若发现灰蒙蒙的观感，优先降 cfg 而不是改 VAE。它的输出质量也是判断两路 strength 是否平衡的直观参考。" },
      { node: "save", detail: "Save Image 落盘最终图像。多控制工作流参数空间大，建议在前缀或文件名里带上两路 strength 缩写，方便横向比较。配合固定 seed 可形成干净的对照实验。" }
    ],
    flow: [
      "① 载入底模，三条输出线分发给整条管线。",
      "② 分别载入深度参考图与线稿参考图。",
      "③ DepthAnythingV2 与 LineArt 两个预处理器各自提取控制图。",
      "④ 同一正向条件复制两份，分别进两个 Apply ControlNet。",
      "⑤ 深度路全程生效 strength 0.65，线稿路 strength 0.9 且 end_percent 0.8。",
      "⑥ 两路正向条件进 Conditioning Combine 合并成一条。",
      "⑦ KSampler 用合并后的正向与线稿路的负向采样 28 步。",
      "⑧ 解码保存，若轮廓与体块打架，按比例回调两路 strength。"
    ],
    params: [
      { name: "strength (深度路)", value: "0.65", desc: "深度管大形，取中低强度给线稿路留空间。" },
      { name: "strength (线稿路)", value: "0.9", desc: "线稿管边缘，需要较高强度才能压住细节。" },
      { name: "end_percent (线稿路)", value: "0.8", desc: "最后两成步数放开线条约束，避免描边感。" },
      { name: "steps", value: "28", desc: "双重约束下略增步数帮助协调。" },
      { name: "cfg", value: "7.0", desc: "多路叠加时提示词权重不宜再高。" }
    ],
    tips: [
      "先单跑深度路确认体块正确，再叠加线稿路，出问题时能快速定位是哪一路的锅。",
      "两路 strength 总和不宜超过 1.6，超过后画面容易僵硬并出现油炸纹理。",
      "让两路时间段错开（如深度路 0 至 0.7、线稿路 0.2 至 0.9）可以得到更柔和的融合。",
      "负向条件也可以像正向一样两路合并，需要精细控制排除项时再加一个 Combine。",
      "深度参考用真实照片、线稿参考用手绘草图，是获取独特构图的常用组合。"
    ],
    notice: ""
  });

  /* ================= 3. IPAdapter 风格迁移 ================= */
  window.COMFY_DATA.workflows.push({
    id: "ipadapter-style",
    name: "IPAdapter 参考图风格迁移",
    category: "风格迁移",
    tags: ["IPAdapter", "风格迁移", "参考图"],
    difficulty: 2,
    source: "社区通用结构（IPAdapter Plus 官方示例简化）",
    summary: "图像提示适配器（IPAdapter，Image Prompt Adapter）把参考图的风格信息直接注入模型，不需要训练也不写风格提示词。一张风格参考图加一句主体描述，就能让输出继承参考图的笔触、色调与质感。它与 ControlNet 的区别在于：控制的是风格而非构图。",
    useCases: [
      "把指定画师的色彩与笔触套用到新构图上",
      "批量生成统一视觉风格的品牌素材",
      "用一张剧照风格图驱动整套角色设计",
      "老照片质感到插画质感的风格转换"
    ],
    models: [
      { type: "Checkpoint", name: "SD1.5 底模", note: "IPAdapter 模型与底模的 CLIP 空间绑定，SD1.5 用 SD1.5 系适配器。" },
      { type: "IPAdapter", name: "ip-adapter-plus_sd15 适配器权重", note: "由 Unified Loader 按 preset 自动匹配。" },
      { type: "CLIPVision", name: "CLIP Vision 图像编码器", note: "把参考图编码为风格向量，Unified Loader 自动附带。" }
    ],
    graph: {
      nodes: [
        { id: "ckpt", title: "Load Checkpoint", cat: "load", x: 30, y: 40,
          widgets: ["SD1.5 底模"],
          inputs: [],
          outputs: [ { type: "MODEL" }, { type: "CLIP" }, { type: "VAE" } ],
          params: [
            { name: "ckpt_name", kind: "下拉选择", default: "SD1.5 底模", desc: "IPAdapter 适配器按底模家族训练，SD1.5 适配器接 SDXL 底模会完全失效。" }
          ],
          brief: "加载底模三件套。",
          desc: "MODEL 将被 IPAdapter 打补丁，CLIP 与 VAE 正常使用。" },
        { id: "style", title: "Load Image", cat: "load", x: 30, y: 220,
          widgets: ["风格参考图"],
          inputs: [],
          outputs: [ { type: "IMAGE" } ],
          params: [
            { name: "image", kind: "下拉选择", default: "风格参考图", desc: "唯一的风格来源；裁掉主体只留笔触密集区域，风格更纯、主体串扰更少。" }
          ],
          brief: "载入风格参考图。",
          desc: "这张图的笔触与色调将被提取，主体内容不会出现在结果里。" },
        { id: "uni", title: "IPAdapter Unified Loader", cat: "load", x: 30, y: 400,
          widgets: ["preset PLUS (high strength)"],
          inputs: [ { name: "model", type: "MODEL" } ],
          outputs: [ { type: "MODEL" }, { type: "IPADAPTER" }, { type: "CLIP_VISION" } ],
          params: [
            { name: "preset", kind: "下拉选择", default: "PLUS (high strength)", desc: "决定自动加载的适配器权重档位；PLUS 系兼顾质量与强度，是风格迁移常用档，与底模不匹配会直接报错。" }
          ],
          brief: "一键载入适配器与图像编码器。",
          desc: "按 preset 自动从模型目录匹配 IPAdapter 权重和对应的 CLIP Vision 编码器。" },
        { id: "pos", title: "CLIP Text Encode (Prompt)", cat: "cond", x: 360, y: 40,
          widgets: ["主体与构图描述"],
          inputs: [ { name: "clip", type: "CLIP" } ],
          outputs: [ { type: "CONDITIONING" } ],
          params: [
            { name: "text", kind: "多行文本", default: "主体与构图描述", desc: "提示词只说清画什么与怎么摆；风格词留给参考图表达，写了反而与参考图打架。" }
          ],
          brief: "描述画面主体与构图。",
          desc: "风格交给参考图，提示词只需说清画什么与怎么摆。" },
        { id: "neg", title: "CLIP Text Encode (Prompt)", cat: "cond", x: 360, y: 220,
          widgets: ["负向提示词"],
          inputs: [ { name: "clip", type: "CLIP" } ],
          outputs: [ { type: "CONDITIONING" } ],
          params: [
            { name: "text", kind: "多行文本", default: "负向提示词", desc: "排除低画质与杂质；风格主要走图像通路，负向词对风格影响很小。" }
          ],
          brief: "负向条件。",
          desc: "排除低画质与不想要的元素。" },
        { id: "latent", title: "Empty Latent Image", cat: "latent", x: 360, y: 400,
          widgets: ["512 x 768", "batch 1"],
          inputs: [],
          outputs: [ { type: "LATENT" } ],
          params: [
            { name: "width", kind: "整数", default: "512", desc: "画布宽度；风格向量与分辨率无关，无需与参考图同比例。" },
            { name: "height", kind: "整数", default: "768", desc: "画布高度；想要参考图氛围更浓可尝试相同长宽比。" },
            { name: "batch_size", kind: "整数", default: "1", desc: "一次并行生成的张数，权重扫描时逐张对比更清晰。" }
          ],
          brief: "空白潜空间。",
          desc: "风格迁移本质仍是文生图，起画点为纯噪声。" },
        { id: "ipa", title: "IPAdapter", cat: "model", x: 660, y: 60,
          widgets: ["weight 0.85", "weight_type style transfer"],
          inputs: [
            { name: "model", type: "MODEL" },
            { name: "ipadapter", type: "IPADAPTER" },
            { name: "image", type: "IMAGE" },
            { name: "clip_vision", type: "CLIP_VISION" }
          ],
          outputs: [ { type: "MODEL" } ],
          params: [
            { name: "weight", kind: "浮点数", default: "0.85", desc: "风格强度旋钮；0.6 轻微染色，1.0 完全继承，超过 1.2 画面常被参考图主体污染。" },
            { name: "weight_type", kind: "下拉选择", default: "style transfer", desc: "注入方式，决定风格信息怎么写进模型。",
              options: [["style transfer", "只迁移笔触与色彩，主体不串扰"], ["linear", "均衡迁移，风格与内容都受影响"]] }
          ],
          brief: "把风格向量注入模型。",
          desc: "参考图经 CLIP Vision 编码后作为交叉注意力键值写入 U-Net，输出一个风格化补丁模型。" },
        { id: "ks", title: "KSampler", cat: "sampler", x: 1000, y: 60,
          widgets: ["seed 42", "steps 25", "cfg 7.0", "sampler dpmpp_2m", "scheduler karras", "denoise 1.0"],
          inputs: [
            { name: "model", type: "MODEL" },
            { name: "positive", type: "CONDITIONING" },
            { name: "negative", type: "CONDITIONING" },
            { name: "latent_image", type: "LATENT" }
          ],
          outputs: [ { type: "LATENT" } ],
          params: [
            { name: "seed", kind: "整数", default: "42", desc: "固定 seed 逐档调 weight，可以画出清晰的风格影响曲线。" },
            { name: "steps", kind: "整数", default: "25", desc: "风格渗入需要足够步数，建议 25 起步。" },
            { name: "cfg", kind: "浮点数", default: "7.0", desc: "过高会把风格感挤掉，6 到 7 区间较稳。" },
            { name: "sampler_name", kind: "下拉选择", default: "dpmpp_2m", desc: "去噪的数学策略，影响速度与画风。",
              options: [["dpmpp_2m", "2 阶多步方法，速度与质量兼顾，配 karras 最热门"], ["dpmpp_2m_sde", "在 dpmpp_2m 基础上加噪声方程，纹理更锐利"], ["euler", "最朴素稳定，通用首选，出图柔和"], ["euler_ancestral", "每步引入随机性，细节更奔放，复现性略差"]] },
            { name: "scheduler", kind: "下拉选择", default: "karras", desc: "控制每一步噪声强度的时间表。",
              options: [["karras", "步间过渡更平滑，细节更干净，最常用"], ["normal", "默认线性计划，通用"], ["simple", "简化日程，部分新模型表现更稳"], ["sgm_uniform", "SD3 与视频模型常用，少步采样收益明显"]] },
            { name: "denoise", kind: "浮点数", default: "1.0", desc: "风格迁移本质仍是文生图，保持 1.0。" }
          ],
          brief: "用打补丁后的模型采样。",
          desc: "每一步去噪都同时受提示词与参考图风格的双重影响。" },
        { id: "dec", title: "VAE Decode", cat: "vae", x: 1280, y: 60,
          widgets: [],
          inputs: [
            { name: "samples", type: "LATENT" },
            { name: "vae", type: "VAE" }
          ],
          outputs: [ { type: "IMAGE" } ],
          brief: "解码输出图像。",
          desc: "常规解码，无特殊参数。" },
        { id: "save", title: "Save Image", cat: "image", x: 1510, y: 60,
          widgets: ["filename_prefix ComfyUI"],
          inputs: [ { name: "images", type: "IMAGE" } ],
          outputs: [],
          params: [
            { name: "filename_prefix", kind: "文本", default: "ComfyUI", desc: "建议固定 seed 做权重扫描，前缀带上 weight 数值便于归档对比。" }
          ],
          brief: "保存结果。",
          desc: "风格迁移建议固定 seed 做权重扫描对比。" }
      ],
      links: [
        { from: "ckpt", fromOut: 0, to: "uni", toIn: "model" },
        { from: "ckpt", fromOut: 1, to: "pos", toIn: "clip" },
        { from: "ckpt", fromOut: 1, to: "neg", toIn: "clip" },
        { from: "ckpt", fromOut: 2, to: "dec", toIn: "vae" },
        { from: "uni", fromOut: 0, to: "ipa", toIn: "model" },
        { from: "uni", fromOut: 1, to: "ipa", toIn: "ipadapter" },
        { from: "uni", fromOut: 2, to: "ipa", toIn: "clip_vision" },
        { from: "style", fromOut: 0, to: "ipa", toIn: "image" },
        { from: "ipa", fromOut: 0, to: "ks", toIn: "model" },
        { from: "pos", fromOut: 0, to: "ks", toIn: "positive" },
        { from: "neg", fromOut: 0, to: "ks", toIn: "negative" },
        { from: "latent", fromOut: 0, to: "ks", toIn: "latent_image" },
        { from: "ks", fromOut: 0, to: "dec", toIn: "samples" },
        { from: "dec", fromOut: 0, to: "save", toIn: "images" }
      ]
    },
    stages: [
      { name: "模型与参考载入", nodes: ["ckpt", "style", "uni"], desc: "Unified Loader 依据底模与 preset 自动配齐适配器权重与 CLIP Vision 编码器，免去手动挂三四个节点的麻烦。" },
      { name: "条件与画布", nodes: ["pos", "neg", "latent"], desc: "提示词只负责主体与构图，负向负责排除项，画布尺寸决定输出规格。" },
      { name: "风格注入", nodes: ["ipa"], desc: "参考图经 CLIP Vision 编码为风格向量，IPAdapter 以交叉注意力形式把它写进模型。" },
      { name: "采样与输出", nodes: ["ks", "dec", "save"], desc: "打补丁后的模型在采样中持续施加风格影响，解码保存得到风格化结果。" }
    ],
    nodeAnalysis: [
      { node: "ckpt", detail: "底模决定被风格化的画布基础。IPAdapter 的适配器权重是按底模家族训练的，SD1.5 适配器接 SDXL 底模会完全失效。风格迁移对底模本身风格有放大作用，写实底模配插画参考图会得到折中产物。CLIP 输出供提示词编码，VAE 供解码。" },
      { node: "style", detail: "风格参考图是唯一的风格来源，图里的主体内容理论上不会迁移，但强特征主体仍可能串进画面。裁掉参考图的主体、只留笔触密集区域，是提高风格纯度的常用手法。多张参考图可以通过 Image Batch 拼接后输入实现风格平均。" },
      { node: "uni", detail: "IPAdapter Unified Loader 是 IPAdapter Plus 插件的便捷入口。preset 决定加载哪一档权重：PLUS 档兼顾质量与强度，high strength 变体进一步提升风格表现。它同时输出 MODEL、IPADAPTER、CLIP_VISION 三个对象，把原本三个加载节点的工作合并为一个。preset 与底模不匹配时会直接报错提示。" },
      { node: "pos", detail: "正向提示词在此工作流中应专注内容而非风格。若提示词也写大量风格词，会与参考图打架，表现为色彩混浊。简短清晰的主体描述加构图描述效果最好。CLIP 编码后的条件与风格向量在采样时并行起作用。" },
      { node: "neg", detail: "负向提示词维持常规配置即可。风格迁移中负向词对风格的影响很小，因为风格主要走图像通路。要排除参考图带进来的杂质主体时，把该主体写进负向有一定帮助。" },
      { node: "latent", detail: "空白潜空间尺寸决定输出构图比例。风格参考图与出图尺寸无需同比例，风格向量与分辨率无关。想要参考图整体氛围更浓，可以尝试与参考图相同的长宽比。" },
      { node: "ipa", detail: "IPAdapter 节点接收补丁化前的模型、适配器权重、参考图与图像编码器四路输入。参考图先经 CLIP Vision 得到图像嵌入，再以交叉注意力的键值形式注入 U-Net。weight 是风格强度旋钮，weight_type 决定注入方式：style transfer 偏重笔触与色彩而弱化主体内容，linear 则均衡迁移。输出是携带风格信息的补丁模型，只能进 KSampler 的 model 口。" },
      { node: "ks", detail: "KSampler 使用补丁后的模型采样，流程与普通文生图一致。风格强度大的组合建议步数不低于 25，让风格特征充分渗入。cfg 过高会把风格感挤掉，7.0 附近较稳。固定 seed 逐档调 weight 可以画出清晰的影响曲线。" },
      { node: "dec", detail: "VAE Decode 把潜空间还原成图像。IPAdapter 不改变潜空间格式，解码环节与常规工作流完全一致。若风格图整体偏色导致输出偏色，可在解码后加色彩校正节点处理。" },
      { node: "save", detail: "Save Image 保存风格化结果。建议同时保存参考图与权重参数截图，方便日后复现风格组合。批量出系列图时保持 seed 与提示词不变、只换参考图，可观察不同参考的迁移差异。" }
    ],
    flow: [
      "① 载入底模，得到 MODEL、CLIP、VAE。",
      "② Unified Loader 按 preset 自动配好 IPAdapter 权重与 CLIP Vision 编码器。",
      "③ 载入风格参考图，必要时裁剪到笔触为主的部分。",
      "④ 写主体与构图提示词，风格词留给参考图表达。",
      "⑤ IPAdapter 以 weight 0.85、weight_type style transfer 把风格注入模型。",
      "⑥ 生成空白潜空间，KSampler 完整采样 25 步。",
      "⑦ 解码保存，再按 weight 0.6 到 1.1 扫描找到最满意的强度。"
    ],
    params: [
      { name: "preset", value: "PLUS (high strength)", desc: "决定加载的适配器权重档位，PLUS 系是风格迁移的常用档。" },
      { name: "weight", value: "0.85", desc: "风格强度，0.6 轻微染色，1.0 完全继承，超过 1.0 开始抢主体。" },
      { name: "weight_type", value: "style transfer", desc: "注入方式，style transfer 只取笔触与色彩不搬主体内容。" },
      { name: "steps", value: "25", desc: "风格渗入需要足够步数，建议 25 起步。" },
      { name: "cfg", value: "7.0", desc: "过高会削弱风格表达，6 至 7 区间较稳。" }
    ],
    tips: [
      "参考图裁剪成局部笔触再输入，风格更纯、主体串扰更少。",
      "style transfer 档位比 linear 更适合本工作流，想连氛围构图一起搬再换回 linear。",
      "weight 超过 1.2 常见问题是画面被参考图主体污染，此时应降权重而不是加提示词风格描述。",
      "想让风格与 ControlNet 构图同时生效，把本图的补丁模型接到带 ControlNet 的工作流即可，两者互不冲突。",
      "底模自带风格与参考图风格差异越大，weight 需要越高才看得见迁移。"
    ],
    notice: ""
  });

  /* ================= 4. InstantID 人像一致性 ================= */
  window.COMFY_DATA.workflows.push({
    id: "instantid-portrait",
    name: "InstantID 人像一致性生成",
    category: "人物一致性",
    tags: ["InstantID", "人脸", "ID 保持", "ControlNet"],
    difficulty: 3,
    source: "社区通用结构（ComfyUI InstantID 官方示例简化）",
    summary: "InstantID 用一张正面人像参考图同时锁住身份（Identity）与面部结构：身份特征经 IPAdapter 通路注入，五官位置经专用 ControlNet 通路锁定，可选再叠一路姿态控制。只需一次前向，无需训练 LoRA（Low-Rank Adaptation）即可在不同风格与场景中保持同一张脸。",
    useCases: [
      "同一角色在不同场景与画风下的连续出图",
      "虚拟形象与头像的批量衍生",
      "绘本与分镜中固定主角长相",
      "换装、换背景但换脸不换人的商品图"
    ],
    models: [
      { type: "Checkpoint", name: "SD1.5 写实人像底模", note: "InstantID 官方权重基于 SD1.5，底模选人像向效果最稳。" },
      { type: "InstantID", name: "ip-adapter.bin（InstantID 适配器）", note: "放在 models/instantid 目录。" },
      { type: "ControlNet", name: "control_v11p_sd15_instantid", note: "InstantID 专用面部结构控制模型，放在 models/controlnet。" },
      { type: "InsightFace", name: "antelopev2 人脸分析模型", note: "InsightFace 库自带下载，用于提取身份特征向量。" }
    ],
    graph: {
      nodes: [
        { id: "ckpt", title: "Load Checkpoint", cat: "load", x: 30, y: 40,
          widgets: ["SD1.5 人像底模"],
          inputs: [],
          outputs: [ { type: "MODEL" }, { type: "CLIP" }, { type: "VAE" } ],
          params: [
            { name: "ckpt_name", kind: "下拉选择", default: "SD1.5 人像底模", desc: "InstantID 官方权重基于 SD1.5，选人像向底模五官稳定性更好。" }
          ],
          brief: "加载底模三件套。",
          desc: "MODEL 将被 InstantID 与姿态 ControlNet 先后打补丁。" },
        { id: "ref", title: "Load Image", cat: "load", x: 30, y: 220,
          widgets: ["正面人像参考"],
          inputs: [],
          outputs: [ { type: "IMAGE" } ],
          params: [
            { name: "image", kind: "下拉选择", default: "正面人像参考", desc: "身份参考图；正面、无遮挡、单人、光线均匀是四个硬指标，同时供给身份与面部结构两条通路。" }
          ],
          brief: "载入身份参考图。",
          desc: "正面、光线均匀、单人的照片识别率最高，同时供给身份与面部结构两条通路。" },
        { id: "pose", title: "Load Image", cat: "load", x: 30, y: 400,
          widgets: ["姿态参考图（可选）"],
          inputs: [],
          outputs: [ { type: "IMAGE" } ],
          params: [
            { name: "image", kind: "下拉选择", default: "姿态参考图（可选）", desc: "可选的姿态参考；只经 DWPose 转成骨骼后起作用，颜色与衣着都会被丢弃，不需要时整条路不搭。" }
          ],
          brief: "载入可选的姿态参考。",
          desc: "想控制身体姿势时提供一张姿势图，经 DWPose 提取骨骼后进入姿态控制路。" },
        { id: "idm", title: "InstantID Model Loader", cat: "load", x: 30, y: 580,
          widgets: ["ip-adapter.bin"],
          inputs: [],
          outputs: [ { type: "INSTANTID" } ],
          params: [
            { name: "instantid_file", kind: "下拉选择", default: "ip-adapter.bin", desc: "models/instantid 目录中的 InstantID 适配器权重，内含面部注意力模块，只能接 Apply InstantID。" }
          ],
          brief: "载入 InstantID 适配器权重。",
          desc: "这是基于 IPAdapter 架构改造的身份适配器，内含面部注意力模块。" },
        { id: "cnm", title: "ControlNet Loader", cat: "load", x: 30, y: 760,
          widgets: ["control_v11p_sd15_instantid"],
          inputs: [],
          outputs: [ { type: "CONTROL_NET" } ],
          params: [
            { name: "control_net_name", kind: "下拉选择", default: "control_v11p_sd15_instantid", desc: "InstantID 专用面部结构控制模型，训练信号是面部关键点，与普通姿态控制模型不同。" }
          ],
          brief: "载入 InstantID 专用控制模型。",
          desc: "它的训练目标是面部关键点，与普通姿态控制模型不同。" },
        { id: "pos", title: "CLIP Text Encode (Prompt)", cat: "cond", x: 360, y: 40,
          widgets: ["正向提示词"],
          inputs: [ { name: "clip", type: "CLIP" } ],
          outputs: [ { type: "CONDITIONING" } ],
          params: [
            { name: "text", kind: "多行文本", default: "正向提示词", desc: "描述场景、发型、服装与画风；绝不要写长相，身份特征完全由参考图提供。" }
          ],
          brief: "描述场景、发型、服装与风格。",
          desc: "不要在提示词里描述长相，身份特征完全由参考图提供。" },
        { id: "neg", title: "CLIP Text Encode (Prompt)", cat: "cond", x: 360, y: 220,
          widgets: ["负向提示词"],
          inputs: [ { name: "clip", type: "CLIP" } ],
          outputs: [ { type: "CONDITIONING" } ],
          params: [
            { name: "text", kind: "多行文本", default: "负向提示词", desc: "常规低画质词之外，可加多人、多余的手、面部模糊等针对性排除项。" }
          ],
          brief: "负向条件。",
          desc: "常规低画质与畸形词之外，可加多人、面部特写模糊等针对性排除项。" },
        { id: "face", title: "InstantID Face Analysis", cat: "util", x: 360, y: 400,
          widgets: ["provider CUDA"],
          inputs: [ { name: "image", type: "IMAGE" } ],
          outputs: [ { type: "FACE_ANALYSIS" } ],
          params: [
            { name: "provider", kind: "下拉选择", default: "CUDA", desc: "InsightFace 的运行设备；分析对象只能是一张脸，多人图会取到不确定目标。",
              options: [["CUDA", "显卡加速，速度最快"], ["CPU", "无显卡环境使用，速度慢"]] }
          ],
          brief: "InsightFace 人脸检测与特征提取。",
          desc: "从参考图定位人脸并输出身份特征向量，供 Apply 节点选用。" },
        { id: "dw", title: "DWPose_Preprocessor", cat: "image", x: 360, y: 580,
          widgets: ["detect_hand enable", "detect_body enable"],
          inputs: [ { name: "image", type: "IMAGE" } ],
          outputs: [ { type: "IMAGE" } ],
          params: [
            { name: "detect_hand", kind: "下拉选择", default: "enable", desc: "是否检测手部关键点；需要控制手部姿态时打开。",
              options: [["enable", "检测手部关键点"], ["disable", "跳过手部，速度更快"]] },
            { name: "detect_body", kind: "下拉选择", default: "enable", desc: "是否检测躯干关键点，是身体姿态控制的主要信号来源。",
              options: [["enable", "检测躯干与四肢关键点"], ["disable", "跳过躯干检测"]] }
          ],
          brief: "DWPose 骨骼点提取。",
          desc: "把姿态参考图转成骨骼火柴人，供姿态控制路使用。" },
        { id: "latent", title: "Empty Latent Image", cat: "latent", x: 360, y: 760,
          widgets: ["512 x 768", "batch 1"],
          inputs: [],
          outputs: [ { type: "LATENT" } ],
          params: [
            { name: "width", kind: "整数", default: "512", desc: "半身人像用 512 x 768 起步，脸部占比过小会稀释身份特征。" },
            { name: "height", kind: "整数", default: "768", desc: "画布高度，全身构图想保脸需后续接 FaceDetailer。" },
            { name: "batch_size", kind: "整数", default: "1", desc: "一致性实验不宜并行出多张，保持 1 逐张验收。" }
          ],
          brief: "空白潜空间。",
          desc: "半身人像用 512 x 768 起步，脸部占比过小会削弱一致性。" },
        { id: "aid", title: "Apply InstantID", cat: "cond", x: 660, y: 40,
          widgets: ["weight 1.0", "start_at 0.0", "end_at 1.0"],
          inputs: [
            { name: "model", type: "MODEL" },
            { name: "positive", type: "CONDITIONING" },
            { name: "negative", type: "CONDITIONING" },
            { name: "instantid", type: "INSTANTID" },
            { name: "control_net", type: "CONTROL_NET" },
            { name: "image", type: "IMAGE" },
            { name: "insightface", type: "FACE_ANALYSIS" }
          ],
          outputs: [ { type: "CONDITIONING" }, { type: "CONDITIONING" } ],
          params: [
            { name: "weight", kind: "浮点数", default: "1.0", desc: "身份相似度总旋钮，0.8 到 1.0 之间最稳，过高会向参考图照片感靠拢。" },
            { name: "start_at", kind: "浮点数", default: "0.0", desc: "身份注入的起始时间占比，保持 0 让五官从第一步就被锁定。" },
            { name: "end_at", kind: "浮点数", default: "1.0", desc: "身份注入截止时间；降到 0.8 可减轻照片感、增加画风自由度。" }
          ],
          brief: "身份与面部结构一次注入。",
          desc: "一个节点同时完成 IPAdapter 式身份注入与面部 ControlNet 注入，输出增强后的正负条件。" },
        { id: "acn", title: "Apply ControlNet", cat: "cond", x: 660, y: 340,
          widgets: ["strength 0.65", "start_percent 0.0", "end_percent 0.85"],
          inputs: [
            { name: "positive", type: "CONDITIONING" },
            { name: "negative", type: "CONDITIONING" },
            { name: "control_net", type: "CONTROL_NET" },
            { name: "image", type: "IMAGE" }
          ],
          outputs: [ { type: "CONDITIONING" }, { type: "CONDITIONING" } ],
          params: [
            { name: "strength", kind: "浮点数", default: "0.65", desc: "骨骼约束强度，0.5 到 0.7 之间不会挤压面部特征。" },
            { name: "start_percent", kind: "浮点数", default: "0.0", desc: "控制从采样的第几成开始生效。" },
            { name: "end_percent", kind: "浮点数", default: "0.85", desc: "收尾阶段放松身体约束，有利于画面自然收束。" }
          ],
          brief: "可选的姿态控制注入。",
          desc: "把骨骼图作为第二重约束叠在身份条件之上。" },
        { id: "mix", title: "Conditioning (Combine)", cat: "cond", x: 660, y: 660,
          widgets: [],
          inputs: [
            { name: "conditioning_1", type: "CONDITIONING" },
            { name: "conditioning_2", type: "CONDITIONING" }
          ],
          outputs: [ { type: "CONDITIONING" } ],
          brief: "合并身份路与姿态路的正向条件。",
          desc: "两路引导在采样中同时生效，互不覆盖。" },
        { id: "ks", title: "KSampler", cat: "sampler", x: 1020, y: 100,
          widgets: ["seed 42", "steps 28", "cfg 7.0", "sampler dpmpp_2m", "scheduler karras", "denoise 1.0"],
          inputs: [
            { name: "model", type: "MODEL" },
            { name: "positive", type: "CONDITIONING" },
            { name: "negative", type: "CONDITIONING" },
            { name: "latent_image", type: "LATENT" }
          ],
          outputs: [ { type: "LATENT" } ],
          params: [
            { name: "seed", kind: "整数", default: "42", desc: "固定后仅改提示词，可产出同脸不同场景的系列图。" },
            { name: "steps", kind: "整数", default: "28", desc: "面部细节收敛需要足够步数。" },
            { name: "cfg", kind: "浮点数", default: "7.0", desc: "标准引导强度，人像不宜超过 8。" },
            { name: "sampler_name", kind: "下拉选择", default: "dpmpp_2m", desc: "去噪的数学策略，影响速度与画风。",
              options: [["dpmpp_2m", "2 阶多步方法，速度与质量兼顾，配 karras 最热门"], ["dpmpp_2m_sde", "在 dpmpp_2m 基础上加噪声方程，纹理更锐利"], ["euler", "最朴素稳定，通用首选，出图柔和"], ["euler_ancestral", "每步引入随机性，细节更奔放，复现性略差"]] },
            { name: "scheduler", kind: "下拉选择", default: "karras", desc: "控制每一步噪声强度的时间表。",
              options: [["karras", "步间过渡更平滑，细节更干净，最常用"], ["normal", "默认线性计划，通用"], ["simple", "简化日程，部分新模型表现更稳"], ["sgm_uniform", "SD3 与视频模型常用，少步采样收益明显"]] },
            { name: "denoise", kind: "浮点数", default: "1.0", desc: "从纯噪声完整生成，保持 1.0。" }
          ],
          brief: "在身份锁定下采样。",
          desc: "一致性主要来自条件通路，模型本体未被改动。" },
        { id: "dec", title: "VAE Decode", cat: "vae", x: 1310, y: 100,
          widgets: [],
          inputs: [
            { name: "samples", type: "LATENT" },
            { name: "vae", type: "VAE" }
          ],
          outputs: [ { type: "IMAGE" } ],
          brief: "解码输出图像。",
          desc: "常规解码流程。" },
        { id: "save", title: "Save Image", cat: "image", x: 1540, y: 100,
          widgets: ["filename_prefix ComfyUI"],
          inputs: [ { name: "images", type: "IMAGE" } ],
          outputs: [],
          params: [
            { name: "filename_prefix", kind: "文本", default: "ComfyUI", desc: "一致性工作流建议把参考图与参数一并归档，便于后续接 FaceDetailer 或放大流复用。" }
          ],
          brief: "保存结果。",
          desc: "固定 seed 与参数即可批量产出同一人物的不同场景。" }
      ],
      links: [
        { from: "ckpt", fromOut: 0, to: "aid", toIn: "model" },
        { from: "ckpt", fromOut: 1, to: "pos", toIn: "clip" },
        { from: "ckpt", fromOut: 1, to: "neg", toIn: "clip" },
        { from: "ckpt", fromOut: 2, to: "dec", toIn: "vae" },
        { from: "ref", fromOut: 0, to: "face", toIn: "image" },
        { from: "ref", fromOut: 0, to: "aid", toIn: "image" },
        { from: "idm", fromOut: 0, to: "aid", toIn: "instantid" },
        { from: "face", fromOut: 0, to: "aid", toIn: "insightface" },
        { from: "cnm", fromOut: 0, to: "aid", toIn: "control_net" },
        { from: "cnm", fromOut: 0, to: "acn", toIn: "control_net" },
        { from: "pos", fromOut: 0, to: "aid", toIn: "positive" },
        { from: "neg", fromOut: 0, to: "aid", toIn: "negative" },
        { from: "pose", fromOut: 0, to: "dw", toIn: "image" },
        { from: "dw", fromOut: 0, to: "acn", toIn: "image" },
        { from: "aid", fromOut: 0, to: "acn", toIn: "positive" },
        { from: "aid", fromOut: 1, to: "acn", toIn: "negative" },
        { from: "aid", fromOut: 0, to: "mix", toIn: "conditioning_2" },
        { from: "acn", fromOut: 0, to: "mix", toIn: "conditioning_1" },
        { from: "acn", fromOut: 1, to: "ks", toIn: "negative" },
        { from: "mix", fromOut: 0, to: "ks", toIn: "positive" },
        { from: "latent", fromOut: 0, to: "ks", toIn: "latent_image" },
        { from: "ks", fromOut: 0, to: "dec", toIn: "samples" },
        { from: "dec", fromOut: 0, to: "save", toIn: "images" }
      ]
    },
    stages: [
      { name: "参考与模型载入", nodes: ["ckpt", "ref", "pose", "idm", "cnm"], desc: "身份参考图与 InstantID 双权重是核心，姿态图与普通 Apply 路是可选增强。" },
      { name: "人脸分析", nodes: ["face", "dw"], desc: "InsightFace 提取身份向量，DWPose 提取姿态骨骼，两条信息分别供下游注入。" },
      { name: "条件与画布", nodes: ["pos", "neg", "latent"], desc: "提示词描述场景与风格，长相描述全部留白。" },
      { name: "双重条件注入", nodes: ["aid", "acn", "mix"], desc: "Apply InstantID 一步注入身份与面部结构，姿态路再叠一层身体控制，最后合并。" },
      { name: "采样与输出", nodes: ["ks", "dec", "save"], desc: "KSampler 在双重约束下采样，解码保存。" }
    ],
    nodeAnalysis: [
      { node: "ckpt", detail: "底模选写实人像向的 SD1.5 模型最稳，InstantID 的两个权重都是在 SD1.5 生态上训练的。人像底模的面部先验更丰富，配合身份注入后五官稳定性更好。MODEL 输出虽然接入 Apply InstantID，但 InstantID 主要走条件通路，模型本体改动很小。CLIP 与 VAE 正常分发。" },
      { node: "ref", detail: "身份参考图的质量决定一切：正面、无遮挡、单人、光线均匀是四个硬指标。这张图同时进入 Face Analysis 与 Apply InstantID 的 image 口，前者提身份向量，后者供面部 ControlNet 提取关键点。侧脸或多人合影会明显降低一致性。分辨率不需要很大，512 以上即可。" },
      { node: "pose", detail: "姿态参考图是可选输入，不需要身体控制时可以整条路不搭。它只经 DWPose 转成骨骼火柴人后起作用，原图的颜色与衣着都会被丢弃。使用全身照作为姿态参考时，注意与出图比例保持一致。" },
      { node: "idm", detail: "InstantID Model Loader 读取 ip-adapter.bin，它是把 IPAdapter 架构与身份保持目标结合训练出的适配器，内部包含图像交叉注意力与面部特化模块。输出类型 INSTANTID 是该插件自定义类型，只能接 Apply InstantID。文件需放在 models/instantid 目录下。" },
      { node: "cnm", detail: "control_v11p_sd15_instantid 是官方配套的专用控制模型，训练信号是面部关键点而非普通姿态。它保证生成的脸与身份向量的五官排布一致，是 InstantID 成对发布的双权重之一。本图把它同时供给身份路和姿态路两个 Apply 节点使用。" },
      { node: "pos", detail: "提示词负责场景、发型、服装、表情与画风，绝不要写外貌特征，否则会与身份向量打架。想换画风时在这里写风格词即可，身份不受影响。提示词里加一张脸特写相关词会放大面部权重，可用于半身构图。" },
      { node: "neg", detail: "负向条件常规配置之外，建议加入多人、多余的手、模糊面部等词。InstantID 偶发双脸问题多与画面比例有关，负向词只能缓解不能根治。保持负向简短稳定，方便横向对比参数。" },
      { node: "face", detail: "InstantID Face Analysis 基于 InsightFace 库，provider 选 CUDA 走显卡加速。它检测参考图中的人脸并输出包含身份嵌入与关键点的分析结果。分析对象只能是一张脸，多人图会取到不确定的目标。输出类型 FACE_ANALYSIS 同样是插件自定义类型。" },
      { node: "dw", detail: "DWPose_Preprocessor 是 controlnet_aux 提供的骨骼点提取器，识别人体、手部与面部关键点并渲染成火柴人图。detect_hand 与 detect_body 打开可获得完整姿态信息。骨骼图线条简单，姿态控制模型解析起来最稳定。" },
      { node: "latent", detail: "画布尺寸影响一致性：脸部在画面中占比过小时，身份特征会被稀释，半身或特写构图最稳。全身构图想保脸，需要后续接 FaceDetailer 局部修复。批量参数保持 1，一致性实验不宜并行出多张。" },
      { node: "aid", detail: "Apply InstantID 是核心节点，七个输入一步完成两件事：身份向量走 IPAdapter 通路注入交叉注意力，参考图走专用 ControlNet 通路锁定五官结构。weight 控制身份相似度，start_at 与 end_at 控制生效的时间段。输出增强后的正负条件，供后续叠加或直接采样。" },
      { node: "acn", detail: "普通 Apply ControlNet 在这里承担身体姿态控制，与面部控制共享同一个 InstantID 控制模型载入。strength 0.65 属于偏柔和的叠加，避免骨骼把身份路的面部信号压变形。end_percent 0.85 让收尾阶段放松身体约束，有利于画面自然收束。" },
      { node: "mix", detail: "Conditioning Combine 把姿态路与身份路的正向条件拼接，采样时两路引导同时生效。顺序不影响结果，拼接是并列而非加权。不需要姿态控制时，把 aid 的正向直接接 KSampler，删除整条姿态路即可。" },
      { node: "ks", detail: "KSampler 常规配置即可，steps 28 保证面部细节收敛。seed 固定后仅改提示词，可以产出同脸不同场景的系列图。若脸部偶尔漂移，优先提高 InstantID weight 或收紧 end_at，而不是加步数。" },
      { node: "dec", detail: "VAE Decode 解码输出。InstantID 对 VAE 无特殊要求，底模自带 VAE 即可。若人像肤色偏灰，可尝试换外置 VAE 文件对比。" },
      { node: "save", detail: "Save Image 保存结果。一致性工作流建议把参考图与参数一并归档，后续用 FaceDetailer 或放大流时可以直接复用。批量场景图时保持 seed 不变最省心。" }
    ],
    flow: [
      "① 载入人像底模与 InstantID 双权重（适配器加专用控制模型）。",
      "② 载入正面人像参考，Face Analysis 提取身份向量。",
      "③ 可选：载入姿态参考，DWPose 转成骨骼图。",
      "④ 写场景与风格提示词，长相描述留白。",
      "⑤ Apply InstantID 以 weight 1.0 注入身份与五官结构。",
      "⑥ 姿态路以 strength 0.65 叠加，两路正向条件合并。",
      "⑦ KSampler 采样 28 步，解码保存。",
      "⑧ 相似度不足时提高 weight 或收紧 end_at，姿态变形时降姿态路 strength。"
    ],
    params: [
      { name: "weight (InstantID)", value: "1.0", desc: "身份相似度总旋钮，0.8 至 1.0 之间最稳，过高会向参考图照片感靠拢。" },
      { name: "end_at", value: "1.0", desc: "身份注入截止时间，降到 0.8 可减轻照片感、增加画风自由度。" },
      { name: "strength (姿态路)", value: "0.65", desc: "骨骼约束强度，0.5 至 0.7 之间不会挤压面部特征。" },
      { name: "steps", value: "28", desc: "面部细节收敛需要足够步数。" },
      { name: "cfg", value: "7.0", desc: "标准引导强度，人像不宜超过 8。" }
    ],
    tips: [
      "参考图选正面单人大头照，识别率和相似度都会显著提升。",
      "提示词里出现长相描述词是相似度下降的常见原因，检查并删除它们。",
      "脸部占比小于画布十分之一时一致性必然下降，全身图请搭配 FaceDetailer 修脸。",
      "想要画风更浓而相似度略降，把 weight 降到 0.85 并把 end_at 收到 0.8。",
      "换姿势时只换姿态参考图、固定其余参数，可以稳定产出同一人的动作序列。"
    ],
    notice: "仅可使用自己拥有权利或已获本人授权的人像照片作为身份参考；不得用于伪造他人身份、冒充公众人物或制作误导性内容，由此产生的法律责任由使用者自负。"
  });

  /* ================= 5. ReActor 换脸 ================= */
  window.COMFY_DATA.workflows.push({
    id: "reactor-faceswap",
    name: "ReActor 一键换脸",
    category: "人物一致性",
    tags: ["换脸", "ReActor", "人脸修复"],
    difficulty: 2,
    source: "社区通用结构（ReActor 官方示例）",
    summary: "ReActor 基于检测、对齐、交换、还原四步管线，把输入人脸贴换到目标图的脸上。核心模型是公开的 inswapper_128.onnx，交换后可直接用 GFPGAN 做人脸修复提升清晰度。它是 ComfyUI 中最常用的后处理换脸方案，属于生成后的局部替换而非采样控制。",
    useCases: [
      "给已生成的插画或照片换上指定人脸",
      "批量替换系列图中的面部保持角色统一",
      "修复生成图中五官崩坏的问题",
      "老照片修复中的人脸重建"
    ],
    models: [
      { type: "FaceSwap", name: "inswapper_128.onnx", note: "公开周知的换脸模型，运行依赖 onnxruntime，放在 models/insightface。" },
      { type: "FaceRestore", name: "GFPGANv1.4.pth", note: "人脸修复模型，放在 models/facerestore_models，可选。" },
      { type: "Detection", name: "retinaface_resnet50", note: "InsightFace 自带的人脸检测模型，插件自动管理。" }
    ],
    graph: {
      nodes: [
        { id: "tgt", title: "Load Image", cat: "load", x: 30, y: 40,
          widgets: ["目标图"],
          inputs: [],
          outputs: [ { type: "IMAGE" } ],
          params: [
            { name: "image", kind: "下拉选择", default: "目标图", desc: "被换脸的画布；必须能检测到清晰人脸，目标脸角度过大或被遮挡时对齐会失败。" }
          ],
          brief: "载入被换脸的目标图。",
          desc: "目标图中必须能检测到清晰人脸，否则节点直接报错。" },
        { id: "src", title: "Load Image", cat: "load", x: 30, y: 220,
          widgets: ["输入人脸"],
          inputs: [],
          outputs: [ { type: "IMAGE" } ],
          params: [
            { name: "image", kind: "下拉选择", default: "输入人脸", desc: "提供身份的源图；正面清晰、表情自然的照片迁移效果最好，多人图会取第一张检测到的脸。" }
          ],
          brief: "载入提供人脸的源图。",
          desc: "正面清晰的源脸换出来的相似度与质感最好。" },
        { id: "bfm", title: "ReActorBuildFaceModel", cat: "model", x: 30, y: 400,
          widgets: ["send_always false"],
          inputs: [ { name: "reference_face", type: "IMAGE" } ],
          outputs: [ { type: "FACE_MODEL" } ],
          params: [
            { name: "send_always", kind: "开关", default: "false", desc: "脸模型是否每次执行都强制发送；批处理多图平均时设为 true 更稳，单图场景保持 false。" }
          ],
          brief: "把源脸固化成脸模型对象。",
          desc: "可选节点：多张同脸照片平均后相似度更高，单图场景也可直接把源图接进换脸节点。" },
        { id: "swap", title: "ReActorFastFaceSwap", cat: "image", x: 650, y: 40,
          widgets: ["inswapper_128.onnx", "retinaface_resnet50", "restore GFPGANv1.4"],
          inputs: [
            { name: "input_image", type: "IMAGE" },
            { name: "source_image", type: "IMAGE" },
            { name: "face_model", type: "FACE_MODEL" }
          ],
          outputs: [ { type: "IMAGE" } ],
          params: [
            { name: "swap_model", kind: "下拉选择", default: "inswapper_128.onnx", desc: "核心换脸权重，128 指内部面部工作分辨率；输出面部必糊，必须配合修复节点。" },
            { name: "det_model", kind: "下拉选择", default: "retinaface_resnet50", desc: "人脸检测模型，负责在目标图中定位并对齐人脸；检测不到脸时先检查它。" },
            { name: "face_restore_model", kind: "下拉选择", default: "GFPGANv1.4", desc: "节点内直选的修复模型，可在换脸同时一步完成面部重建。" }
          ],
          brief: "检测并对齐人脸后完成交换。",
          desc: "先在目标图定位人脸，再把源脸身份特征迁移过去，输出整张替换后的图。" },
        { id: "fix", title: "FaceRestoreGFPGANWithModel", cat: "image", x: 950, y: 40,
          widgets: ["GFPGANv1.4", "visibility 1.0"],
          inputs: [ { name: "image", type: "IMAGE" } ],
          outputs: [ { type: "IMAGE" } ],
          params: [
            { name: "face_restore_model", kind: "下拉选择", default: "GFPGANv1.4", desc: "独立修复节点使用的人脸重建模型，与换脸节点解耦便于单独调参。" },
            { name: "visibility", kind: "浮点数", default: "1.0", desc: "修复强度；1.0 完全采用重建脸，0.5 左右保留一半原图细节以保住身份相似度。" }
          ],
          brief: "对换脸结果做人脸修复。",
          desc: "inswapper 输出固定 128 分辨率的面部，GFPGAN 负责把它重建为高清质感。" },
        { id: "prev", title: "Preview Image", cat: "image", x: 1260, y: 40,
          widgets: [],
          inputs: [ { name: "images", type: "IMAGE" } ],
          outputs: [],
          brief: "预览修复效果。",
          desc: "修复前后各接一个预览便于对比 visibility 参数。" },
        { id: "save", title: "Save Image", cat: "image", x: 1530, y: 40,
          widgets: ["filename_prefix ComfyUI"],
          inputs: [ { name: "images", type: "IMAGE" } ],
          outputs: [],
          params: [
            { name: "filename_prefix", kind: "文本", default: "ComfyUI", desc: "换脸属敏感操作，前缀建议记录源脸与目标图的对应关系，便于审计。" }
          ],
          brief: "保存最终图像。",
          desc: "换脸属敏感操作，输出文件请按合规要求管理。" }
      ],
      links: [
        { from: "tgt", fromOut: 0, to: "swap", toIn: "input_image" },
        { from: "src", fromOut: 0, to: "swap", toIn: "source_image" },
        { from: "src", fromOut: 0, to: "bfm", toIn: "reference_face" },
        { from: "bfm", fromOut: 0, to: "swap", toIn: "face_model" },
        { from: "swap", fromOut: 0, to: "fix", toIn: "image" },
        { from: "fix", fromOut: 0, to: "prev", toIn: "images" },
        { from: "fix", fromOut: 0, to: "save", toIn: "images" }
      ]
    },
    stages: [
      { name: "素材载入", nodes: ["tgt", "src"], desc: "目标图提供画布与脸部位置，源图提供身份。两张图无需同尺寸。" },
      { name: "脸模型构建（可选）", nodes: ["bfm"], desc: "ReActorBuildFaceModel 把源脸编码成可复用的脸模型对象，多图平均可提升稳定性。" },
      { name: "换脸执行", nodes: ["swap"], desc: "检测、对齐、交换三步在节点内部完成，输出整张已替换图像。" },
      { name: "修复与输出", nodes: ["fix", "prev", "save"], desc: "GFPGAN 重建高清面部，预览确认后保存。" }
    ],
    nodeAnalysis: [
      { node: "tgt", detail: "目标图是换脸的画布。ReActor 用 RetinaFace 检测其中的所有人脸，默认替换置信度最高的一张。目标脸角度过大或被遮挡时，对齐会失败导致边缘违和。分辨率越高，128 像素的面部贴回后的差距越明显，因此人脸修复几乎是必配。" },
      { node: "src", detail: "源图提供要贴上去的身份。正面、光线均匀、表情自然的照片迁移效果最好。源图分辨率影响不大，因为身份会被压缩成特征向量。多人图会取第一张检测到的脸，建议单独裁出目标人脸再输入。" },
      { node: "bfm", detail: "ReActorBuildFaceModel 把参考脸编码为 FACE_MODEL 对象。它的价值在于可输入多张同脸照片取平均，抑制单张照片的表情与光照偏差。send_always 参数控制该模型是否每次执行都强制发送，批处理时设为 true 更稳。简单场景可跳过此节点，把源图直连换脸节点。" },
      { node: "swap", detail: "ReActorFastFaceSwap 是 ReActor 插件的快速换脸节点。内部流程：RetinaFace 检测目标脸，按关键点对齐，调用 inswapper_128.onnx 把源脸身份写入，再贴回原图。swap_model 下拉选择换脸权重，face_restore_model 可在节点内直接选 GFPGAN 一步完成修复。它的输出是整张图，脸部区域已被替换。" },
      { node: "fix", detail: "FaceRestoreGFPGANWithModel 是 ReActor 附带的独立修复节点，把节点内修复与换脸解耦，便于单独调参。GFPGANv1.4 对写实质感重建效果好，visibility 控制修复强度，1.0 完全采用重建脸。过度修复会抹平原图五官特征，让相似度下降，0.5 左右适合保留身份。" },
      { node: "prev", detail: "Preview Image 在画布上显示结果不落盘。换脸工作流强烈建议保留预览，肉眼检查发际线、肤色衔接与表情自然度。对批量任务，可接 Image Feed 类节点做快速人工筛选。" },
      { node: "save", detail: "Save Image 保存成品。换脸结果的合规风险高于普通生成图，务必确认素材授权后再保存传播。文件名前缀建议记录源脸与目标图的对应关系，便于审计。" }
    ],
    flow: [
      "① 载入目标图与源人脸图。",
      "② 可选：源脸先经 ReActorBuildFaceModel 固化为脸模型。",
      "③ ReActorFastFaceSwap 检测目标脸并对齐，调用 inswapper 完成交换。",
      "④ 换脸结果进入 GFPGAN 修复节点重建高清面部。",
      "⑤ 预览对比修复前后，调整 visibility 找平衡点。",
      "⑥ 确认无误后 Save Image 保存。"
    ],
    params: [
      { name: "swap_model", value: "inswapper_128.onnx", desc: "核心换脸权重，128 指内部面部工作分辨率。" },
      { name: "face_restore_model", value: "GFPGANv1.4", desc: "节点内直选的修复模型，也可用独立修复节点替代。" },
      { name: "visibility", value: "1.0", desc: "修复强度，1.0 全修复，0.5 保留一半原图细节。" },
      { name: "codeformer_weight", value: "0.5", desc: "选 CodeFormer 修复时的保真权重，GFPGAN 路不生效。" },
      { name: "send_always", value: "false", desc: "脸模型是否每次执行强制发送，批量建议 true。" }
    ],
    tips: [
      "换脸后脸部发糊是正常现象，inswapper 内部只有 128 像素，必须接修复节点。",
      "相似度不满意时优先换更正面的源脸照片，比调参数有效得多。",
      "多张同脸照片进 BuildFaceModel 平均，可显著稳定跨场景的相似度。",
      "肤色衔接违和时，在 swap 前对目标图做整体色彩匹配，或在修复后加局部调色。",
      "目标图里有多张脸时，用 ReActor 的 face_margin 与人脸索引参数锁定要替换的那一张。"
    ],
    notice: "换脸技术涉及肖像权与人格权：只允许处理自己的照片或已获书面授权的人物照片，严禁未经同意换用他人面部，严禁用于伪造、诽谤、色情或其他违法用途，生成与传播的法律责任由使用者自行承担。"
  });

  /* ================= 6. FaceDetailer 自动修脸 ================= */
  window.COMFY_DATA.workflows.push({
    id: "facedetailer-pipeline",
    name: "FaceDetailer 自动修脸管线",
    category: "人物一致性",
    tags: ["FaceDetailer", "Impact Pack", "局部重绘"],
    difficulty: 3,
    source: "社区通用结构（Impact Pack 官方示例简化）",
    summary: "FaceDetailer 是 Impact Pack 提供的自动局部精修节点：先用 YOLO 人脸检测框出脸部，再用 SAM（Segment Anything Model）生成精细遮罩，把脸部区域放大后独立重采样，最后无缝贴回原图。它解决全身图中人脸过小而崩坏的经典问题，全程无需手动涂遮罩。",
    useCases: [
      "全身人像中自动修复小脸崩坏",
      "批量出图后统一做面部质量提升",
      "与 InstantID、LoRA 等身份方案配合保脸",
      "手部等区域的自动化精修（换检测模型即可）"
    ],
    models: [
      { type: "Checkpoint", name: "SD1.5 人像底模", note: "精修用的是同一个底模，风格才能保持一致。" },
      { type: "Detector", name: "bbox/face_yolov8m.pt", note: "Ultralytics 人脸检测模型，放在 models/ultralytics/bbox。" },
      { type: "SAM", name: "sam_vit_b_01ec64.pth", note: "SAM 分割模型，放在 models/sams，用于把检测框变成贴边遮罩。" }
    ],
    graph: {
      nodes: [
        { id: "ckpt", title: "Load Checkpoint", cat: "load", x: 30, y: 40,
          widgets: ["SD1.5 人像底模"],
          inputs: [],
          outputs: [ { type: "MODEL" }, { type: "CLIP" }, { type: "VAE" } ],
          params: [
            { name: "ckpt_name", kind: "下拉选择", default: "SD1.5 人像底模", desc: "精修必须用与主图同一底模，否则脸部风格会与身体脱节。" }
          ],
          brief: "加载底模三件套。",
          desc: "FaceDetailer 需要完整的模型、文本编码器与 VAE 来独立完成一次小规模重绘。" },
        { id: "det", title: "UltralyticsDetectorProvider", cat: "load", x: 30, y: 240,
          widgets: ["bbox/face_yolov8m.pt"],
          inputs: [],
          outputs: [ { type: "BBOX_DETECTOR" }, { type: "SEGM_DETECTOR" } ],
          params: [
            { name: "model_name", kind: "下拉选择", default: "bbox/face_yolov8m.pt", desc: "models/ultralytics 目录中的检测模型；bbox 版只给矩形框配 SAM 使用，segm 版自带分割可不接 SAM。" }
          ],
          brief: "提供人脸检测器。",
          desc: "bbox 模型输出检测框，segm 模型直接输出分割遮罩，二选一即可。" },
        { id: "sam", title: "SAMLoader", cat: "load", x: 30, y: 420,
          widgets: ["sam_vit_b_01ec64.pth"],
          inputs: [],
          outputs: [ { type: "SAM_MODEL" } ],
          params: [
            { name: "model_name", kind: "下拉选择", default: "sam_vit_b_01ec64.pth", desc: "models/sams 目录中的 SAM 分割权重，把粗框细化成贴脸遮罩；vit_b 基础档，vit_h 更准但显存翻倍。" }
          ],
          brief: "加载 SAM 分割模型。",
          desc: "把粗糙的检测框细化成沿脸部轮廓的精细遮罩。" },
        { id: "pos", title: "CLIP Text Encode (Prompt)", cat: "cond", x: 360, y: 40,
          widgets: ["正向提示词"],
          inputs: [ { name: "clip", type: "CLIP" } ],
          outputs: [ { type: "CONDITIONING" } ],
          params: [
            { name: "text", kind: "多行文本", default: "正向提示词", desc: "主提示词同时驱动主图与脸部重绘；可用通配符给脸部单独加细节词。" }
          ],
          brief: "主提示词，同时也是脸部精修的提示词。",
          desc: "FaceDetailer 默认复用主提示词重绘面部，也可用通配符给脸部单独加细节词。" },
        { id: "neg", title: "CLIP Text Encode (Prompt)", cat: "cond", x: 360, y: 220,
          widgets: ["负向提示词"],
          inputs: [ { name: "clip", type: "CLIP" } ],
          outputs: [ { type: "CONDITIONING" } ],
          params: [
            { name: "text", kind: "多行文本", default: "负向提示词", desc: "特写重绘对畸形词更敏感，保留五官与手部畸形词收益明显。" }
          ],
          brief: "负向条件。",
          desc: "精修同样执行负向排除，畸形词在特写重绘时更重要。" },
        { id: "latent", title: "Empty Latent Image", cat: "latent", x: 360, y: 400,
          widgets: ["512 x 768", "batch 1"],
          inputs: [],
          outputs: [ { type: "LATENT" } ],
          params: [
            { name: "width", kind: "整数", default: "512", desc: "主图画布宽度，决定脸部像素占比，脸小于 200 像素时精修收益最大。" },
            { name: "height", kind: "整数", default: "768", desc: "画布高度，全身图把 FaceDetailer 当默认配件。" },
            { name: "batch_size", kind: "整数", default: "1", desc: "批量大于 1 时逐张检测处理，耗时线性增加。" }
          ],
          brief: "主图生成的画布。",
          desc: "先正常生成一张全身图，再交给 FaceDetailer 修脸。" },
        { id: "ks", title: "KSampler", cat: "sampler", x: 660, y: 60,
          widgets: ["seed 42", "steps 25", "cfg 7.0", "denoise 1.0"],
          inputs: [
            { name: "model", type: "MODEL" },
            { name: "positive", type: "CONDITIONING" },
            { name: "negative", type: "CONDITIONING" },
            { name: "latent_image", type: "LATENT" }
          ],
          outputs: [ { type: "LATENT" } ],
          params: [
            { name: "seed", kind: "整数", default: "42", desc: "固定后主图与精修结果都可复现。" },
            { name: "steps", kind: "整数", default: "25", desc: "主图生成步数，与普通文生图一致。" },
            { name: "cfg", kind: "浮点数", default: "7.0", desc: "提示词服从度，常规值即可。" },
            { name: "denoise", kind: "浮点数", default: "1.0", desc: "主图从纯噪声生成，保持 1.0；脸部精修强度由 FaceDetailer 自己的 denoise 控制。" }
          ],
          brief: "先生成主图。",
          desc: "这一步与普通文生图完全相同，崩脸在此发生，也在此被下一阶段拯救。" },
        { id: "dec", title: "VAE Decode", cat: "vae", x: 660, y: 420,
          widgets: [],
          inputs: [
            { name: "samples", type: "LATENT" },
            { name: "vae", type: "VAE" }
          ],
          outputs: [ { type: "IMAGE" } ],
          brief: "解码主图为像素图像。",
          desc: "FaceDetailer 在像素域检测与修复，必须先解码。" },
        { id: "fd", title: "FaceDetailer", cat: "sampler", x: 960, y: 40,
          widgets: ["guide_size 512", "max_size 1024", "denoise 0.5", "bbox_threshold 0.5", "feather 20", "cycle 1"],
          inputs: [
            { name: "image", type: "IMAGE" },
            { name: "model", type: "MODEL" },
            { name: "clip", type: "CLIP" },
            { name: "vae", type: "VAE" },
            { name: "positive", type: "CONDITIONING" },
            { name: "negative", type: "CONDITIONING" },
            { name: "bbox_detector", type: "BBOX_DETECTOR" },
            { name: "sam_model", type: "SAM_MODEL" }
          ],
          outputs: [ { type: "IMAGE" }, { type: "IMAGE" }, { type: "MASK" } ],
          params: [
            { name: "guide_size", kind: "整数", default: "512", desc: "脸部被放大到的目标边长，决定重绘的工作分辨率。" },
            { name: "max_size", kind: "整数", default: "1024", desc: "放大上限，防止极小人脸被放大到夸张尺寸浪费算力。" },
            { name: "denoise", kind: "浮点数", default: "0.5", desc: "脸部重绘强度；0.4 到 0.6 平衡结构与自由度，高于 0.7 脸可能变成另一个人。" },
            { name: "bbox_threshold", kind: "浮点数", default: "0.5", desc: "人脸检测置信度阈值；漏检时降到 0.35，误检时升到 0.6。" },
            { name: "feather", kind: "整数", default: "20", desc: "遮罩羽化像素，控制贴回接缝的柔和度。" },
            { name: "cycle", kind: "整数", default: "1", desc: "精修轮数；2 轮对重度崩脸有效但可能磨平特征。" }
          ],
          brief: "检测、分割、放大、重绘、贴回，一步完成。",
          desc: "脸部区域被放大到 guide_size 独立采样后，按 SAM 遮罩带羽化贴回原图。" },
        { id: "prev", title: "Preview Image", cat: "image", x: 1290, y: 40,
          widgets: [],
          inputs: [ { name: "images", type: "IMAGE" } ],
          outputs: [],
          brief: "预览精修后的脸部特写。",
          desc: "接 cropped_enhanced 输出，快速检查修复质量。" },
        { id: "save", title: "Save Image", cat: "image", x: 1490, y: 40,
          widgets: ["filename_prefix ComfyUI"],
          inputs: [ { name: "images", type: "IMAGE" } ],
          outputs: [],
          params: [
            { name: "filename_prefix", kind: "文本", default: "ComfyUI", desc: "建议把 denoise 与 guide_size 记入文件名，方便跨批次对比。" }
          ],
          brief: "保存最终图像。",
          desc: "输出为整图，脸部已替换为精修版本。" }
      ],
      links: [
        { from: "ckpt", fromOut: 0, to: "ks", toIn: "model" },
        { from: "ckpt", fromOut: 0, to: "fd", toIn: "model" },
        { from: "ckpt", fromOut: 1, to: "pos", toIn: "clip" },
        { from: "ckpt", fromOut: 1, to: "neg", toIn: "clip" },
        { from: "ckpt", fromOut: 1, to: "fd", toIn: "clip" },
        { from: "ckpt", fromOut: 2, to: "dec", toIn: "vae" },
        { from: "ckpt", fromOut: 2, to: "fd", toIn: "vae" },
        { from: "pos", fromOut: 0, to: "ks", toIn: "positive" },
        { from: "pos", fromOut: 0, to: "fd", toIn: "positive" },
        { from: "neg", fromOut: 0, to: "ks", toIn: "negative" },
        { from: "neg", fromOut: 0, to: "fd", toIn: "negative" },
        { from: "latent", fromOut: 0, to: "ks", toIn: "latent_image" },
        { from: "ks", fromOut: 0, to: "dec", toIn: "samples" },
        { from: "dec", fromOut: 0, to: "fd", toIn: "image" },
        { from: "det", fromOut: 0, to: "fd", toIn: "bbox_detector" },
        { from: "sam", fromOut: 0, to: "fd", toIn: "sam_model" },
        { from: "fd", fromOut: 0, to: "save", toIn: "images" },
        { from: "fd", fromOut: 1, to: "prev", toIn: "images" }
      ]
    },
    stages: [
      { name: "主图生成", nodes: ["ckpt", "pos", "neg", "latent", "ks", "dec"], desc: "按普通文生图流程先产出整图，人脸崩坏问题在这一步自然产生。" },
      { name: "检测器与分割模型准备", nodes: ["det", "sam"], desc: "YOLO 框出脸部，SAM 负责把框变成贴边遮罩，两者组合是 Impact 管线的标准配置。" },
      { name: "自动精修", nodes: ["fd"], desc: "FaceDetailer 在节点内部串起检测、分割、放大、重绘、融合五个动作。" },
      { name: "检查与输出", nodes: ["prev", "save"], desc: "先看脸部特写确认质量，再保存整图。" }
    ],
    nodeAnalysis: [
      { node: "ckpt", detail: "底模在这里被两处引用：主图 KSampler 与 FaceDetailer。精修必须用同一底模，否则脸部风格会与身体脱节。FaceDetailer 对 CLIP 与 VAE 也有输入需求，因为它要在放大的脸部画布上独立跑一次完整采样。三线并出是这个工作流的标准开局。" },
      { node: "det", detail: "UltralyticsDetectorProvider 加载 YOLO 系检测权重并输出 BBOX_DETECTOR 对象。bbox 模型只给矩形框，配合 SAM 使用；segm 模型自带分割能力可以不接 SAM。face_yolov8m 是精度与速度的平衡档，检测不到脸时先检查文件放没放对目录。" },
      { node: "sam", detail: "SAMLoader 加载 Segment Anything 模型。它的作用是把 YOLO 的粗框细化成沿脸部边缘的遮罩，让贴回时看不出接缝。vit_b 是基础档，vit_h 更准但显存翻倍。SAM 输入是可选的：不接时 FaceDetailer 直接用矩形框加羽化，边缘质量略差。" },
      { node: "pos", detail: "主提示词同时驱动主图与脸部重绘。FaceDetailer 支持通配符语法，可以在提示词里插入随机细节词让每张脸略有差异。若脸部重绘出现与主图无关的内容，通常是提示词里混入了身体之外的描述。保持提示词聚焦人物本身最稳。" },
      { node: "neg", detail: "负向条件同样复用。特写重绘对畸形词更敏感，负向里保留手部与五官畸形词收益明显。精修失败的常见原因是负向过强导致脸部风格漂移，可单独为 FaceDetailer 复制一份弱化负向。" },
      { node: "latent", detail: "主图画布决定人物在画面中的大小，也间接决定脸部像素占比。脸小于 200 像素时精修收益最大。批量参数大于 1 时 FaceDetailer 会逐张检测处理，耗时线性增加。" },
      { node: "ks", detail: "主图 KSampler 无特殊之处。seed 固定后，主图与精修结果都可复现。若只想精修不想重新生成主图，把 KSampler 到 Decode 的部分换成 Load Image 即可，FaceDetailer 对图源没有要求。" },
      { node: "dec", detail: "主图必须解码成像素才能进入检测流程，因为 YOLO 与 SAM 都工作在图像域而非潜空间。解码后再精修也意味着精修结果不会再经过潜空间，贴回融合全部在像素域完成，色彩一致性更好。解码环节本身无参数，但它是检测精修的前置闸门。若这一步就发现主图不可用，应先回上游调参，避免浪费精修算力。" },
      { node: "fd", detail: "FaceDetailer 是 Impact Pack 的招牌节点，八进三出。内部流程：检测脸框，SAM 细化遮罩，把脸区裁剪放大到 guide_size，用主模型独立采样（denoise 0.5 保留一半原图），再按遮罩加羽化贴回。bbox_threshold 控制检测灵敏度，feather 控制接缝柔和度，cycle 大于 1 时会再跑一轮逐步增强。输出三张图：整图、精修前裁剪、精修后裁剪。" },
      { node: "prev", detail: "Preview Image 接 FaceDetailer 的第二输出，显示精修后的脸部特写。这是判断 denoise 是否合适的最佳观测点：特写里五官结构崩坏要降 denoise，脸部纹理太糊要提高它。特写与整图对照着看，能快速定位是检测问题还是重绘问题。" },
      { node: "save", detail: "Save Image 保存精修后的整图。FaceDetailer 后常接放大工作流，脸部分辨率已经足够高，放大时不容易再崩。建议把 denoise 与 guide_size 记入文件名，方便跨批次对比。" }
    ],
    flow: [
      "① 用主提示词与 KSampler 正常生成整图，解码为像素。",
      "② 准备 YOLO 人脸检测器与 SAM 分割模型。",
      "③ FaceDetailer 检测脸部并生成精细遮罩。",
      "④ 脸部区域放大到 guide_size，用同一底模独立重采样。",
      "⑤ 精修后的脸按遮罩羽化贴回原图。",
      "⑥ 预览脸部特写确认质量，调整 denoise 与 threshold。",
      "⑦ 保存整图，必要时接放大或换装工作流。"
    ],
    params: [
      { name: "guide_size", value: "512", desc: "脸部被放大到的目标边长，决定重绘的工作分辨率。" },
      { name: "denoise", value: "0.5", desc: "精修重绘强度，0.4 到 0.6 之间在结构与自由度间平衡。" },
      { name: "bbox_threshold", value: "0.5", desc: "检测置信度阈值，漏检时降到 0.35，误检时升到 0.6。" },
      { name: "feather", value: "20", desc: "遮罩羽化像素，控制贴回接缝的柔和度。" },
      { name: "cycle", value: "1", desc: "精修轮数，2 轮对重度崩脸有奇效但可能磨平特征。" },
      { name: "max_size", value: "1024", desc: "放大上限，防止极小人脸被放大到夸张尺寸。" }
    ],
    tips: [
      "主图脸部越小，FaceDetailer 的收益越大，全身图请把它当默认配件。",
      "denoise 高于 0.7 时脸部可能变成另一个人，先从 0.45 起调。",
      "检测不到脸时依次检查：模型路径、图片分辨率、bbox_threshold。",
      "把 cropped_enhanced 输出接预览，是调参阶段效率最高的观察方式。",
      "同一管线把检测模型换成手部 YOLO 权重，就变成自动修手管线。"
    ],
    notice: "人脸检测与精修均属于人脸信息处理：请仅对本人或已获授权的照片使用，并遵守所在平台关于人脸内容的规则。"
  });

  /* ================= 7. AnimateDiff 文生视频 ================= */
  window.COMFY_DATA.workflows.push({
    id: "animatediff-txt2vid",
    name: "AnimateDiff 文生视频",
    category: "视频生成",
    tags: ["AnimateDiff", "文生视频", "运动模块"],
    difficulty: 4,
    source: "社区通用结构（AnimateDiff-Evolved 官方示例简化）",
    summary: "AnimateDiff 在 SD1.5 的 U-Net 中插入可插拔运动模块（Motion Module），让静止的文生图模型学会帧间运动。工作流把运动模块加载进模型、用上下文窗口（Context Options）切分长序列，再用 KSampler 一次采样出整段潜空间帧序列，最后由 VHS 合成视频。它是纯本地、无训练门槛的文生视频入门主路线。",
    useCases: [
      "短循环动画与动态壁纸",
      "提示词驱动的风格化短片片段",
      "静态插画批量转化为动态版本",
      "视频扩散模型之前的低配本地动画实验"
    ],
    models: [
      { type: "Checkpoint", name: "SD1.5 底模", note: "选动画风格强化过的底模效果更顺滑。" },
      { type: "Motion", name: "mm_sd_v15_v2.ckpt", note: "公开周知的 v2 运动模块，放在 models/animatediff_models。" }
    ],
    graph: {
      nodes: [
        { id: "ckpt", title: "Load Checkpoint", cat: "load", x: 30, y: 40,
          widgets: ["SD1.5 动画向底模"],
          inputs: [],
          outputs: [ { type: "MODEL" }, { type: "CLIP" }, { type: "VAE" } ],
          params: [
            { name: "ckpt_name", kind: "下拉选择", default: "SD1.5 动画向底模", desc: "动画向底模与运动模块配合更顺滑；必须是 SD1.5 家族，mm_sd_v15 系运动模块不兼容 SDXL。" }
          ],
          brief: "加载底模三件套。",
          desc: "MODEL 将被注入运动模块，变成能输出帧序列的时序模型。" },
        { id: "ctx", title: "ADE_StandardStaticContextOptions", cat: "util", x: 30, y: 260,
          widgets: ["context_length 16", "context_overlap 4", "context_stride 1"],
          inputs: [],
          outputs: [ { type: "CONTEXT_OPTIONS" } ],
          params: [
            { name: "context_length", kind: "整数", default: "16", desc: "上下文窗口长度，v2 运动模块的训练窗口是 16，不建议改大。" },
            { name: "context_overlap", kind: "整数", default: "4", desc: "窗口间重叠帧数，越大衔接越平滑、显存越高。" },
            { name: "context_stride", kind: "整数", default: "1", desc: "窗口内抽帧步长，保持 1 逐帧处理。" }
          ],
          brief: "配置运动上下文窗口。",
          desc: "长于 16 帧的序列被切成滑动窗口逐段处理，overlap 保证段间衔接。" },
        { id: "pos", title: "CLIP Text Encode (Prompt)", cat: "cond", x: 380, y: 40,
          widgets: ["正向提示词"],
          inputs: [ { name: "clip", type: "CLIP" } ],
          outputs: [ { type: "CONDITIONING" } ],
          params: [
            { name: "text", kind: "多行文本", default: "正向提示词", desc: "所有帧共用；镜头感靠缓慢推近、环绕等镜头词汇描述，主体描述要具体且简短。" }
          ],
          brief: "描述画面与镜头运动。",
          desc: "所有帧共享同一条提示词，镜头感靠 motion 与镜头词汇描述。" },
        { id: "neg", title: "CLIP Text Encode (Prompt)", cat: "cond", x: 380, y: 220,
          widgets: ["负向提示词"],
          inputs: [ { name: "clip", type: "CLIP" } ],
          outputs: [ { type: "CONDITIONING" } ],
          params: [
            { name: "text", kind: "多行文本", default: "负向提示词", desc: "全帧共享；闪烁、抖动、重复帧等视频特有负向词值得写入。" }
          ],
          brief: "负向条件。",
          desc: "视频场景下闪烁、抖动、重复帧等词值得写入。" },
        { id: "latent", title: "ADE_EmptyLatentImage", cat: "latent", x: 30, y: 460,
          widgets: ["width 512", "height 512", "length 16", "batch 1"],
          inputs: [],
          outputs: [ { type: "LATENT" } ],
          params: [
            { name: "width", kind: "整数", default: "512", desc: "视频画布宽度；512 是质量与速度的甜点位，放大交给后续补帧与超分。" },
            { name: "height", kind: "整数", default: "512", desc: "视频画布高度，与宽度同为 8 的倍数。" },
            { name: "length", kind: "整数", default: "16", desc: "总帧数；等于窗口长度时质量最稳，32 帧以上依赖滑窗衔接。" },
            { name: "batch_size", kind: "整数", default: "1", desc: "帧序列显存占用大，保持 1。" }
          ],
          brief: "生成带帧数维度的空视频潜空间。",
          desc: "AnimateDiff 专用空潜空间，length 即总帧数，区别于普通单帧 Empty Latent。" },
        { id: "ad", title: "ADE_AnimateDiffLoaderGen1", cat: "model", x: 680, y: 40,
          widgets: ["mm_sd_v15_v2.ckpt", "beta_schedule autoselect"],
          inputs: [
            { name: "model", type: "MODEL" },
            { name: "context_options", type: "CONTEXT_OPTIONS" }
          ],
          outputs: [ { type: "MODEL" }, { type: "CONDITIONING" }, { type: "CONDITIONING" } ],
          params: [
            { name: "model_name", kind: "下拉选择", default: "mm_sd_v15_v2.ckpt", desc: "models/animatediff_models 目录中的运动模块；v2 是公认最稳的通用档。" },
            { name: "beta_schedule", kind: "下拉选择", default: "autoselect", desc: "噪声调度按运动模块自动匹配，一般保持默认。",
              options: [["autoselect", "按运动模块自动匹配，通用"], ["linear", "线性调度，v2 模块的典型匹配"]] }
          ],
          brief: "把运动模块注入底模。",
          desc: "加载 mm 权重并挂到 U-Net 的时序层上，输出可出帧序列的补丁模型。" },
        { id: "ks", title: "KSampler", cat: "sampler", x: 1090, y: 40,
          widgets: ["seed 42", "steps 25", "cfg 7.0", "sampler dpmpp_2m", "scheduler karras", "denoise 1.0"],
          inputs: [
            { name: "model", type: "MODEL" },
            { name: "positive", type: "CONDITIONING" },
            { name: "negative", type: "CONDITIONING" },
            { name: "latent_image", type: "LATENT" }
          ],
          outputs: [ { type: "LATENT" } ],
          params: [
            { name: "seed", kind: "整数", default: "42", desc: "固定 seed 只改提示词，可保持运镜大体一致。" },
            { name: "steps", kind: "整数", default: "25", desc: "帧序列采样耗时按帧数放大，25 步是质量与速度的平衡。" },
            { name: "cfg", kind: "浮点数", default: "7.0", desc: "画面抽搐时优先降 cfg 与检查负向词，而不是换采样器。" },
            { name: "sampler_name", kind: "下拉选择", default: "dpmpp_2m", desc: "去噪的数学策略，影响速度与画风。",
              options: [["dpmpp_2m", "2 阶多步方法，速度与质量兼顾，配 karras 最热门"], ["dpmpp_2m_sde", "在 dpmpp_2m 基础上加噪声方程，纹理更锐利"], ["euler", "最朴素稳定，通用首选，出图柔和"], ["euler_ancestral", "每步引入随机性，细节更奔放，复现性略差"]] },
            { name: "scheduler", kind: "下拉选择", default: "karras", desc: "控制每一步噪声强度的时间表。",
              options: [["karras", "步间过渡更平滑，细节更干净，最常用"], ["normal", "默认线性计划，通用"], ["simple", "简化日程，部分新模型表现更稳"], ["sgm_uniform", "SD3 与视频模型常用，少步采样收益明显"]] },
            { name: "denoise", kind: "浮点数", default: "1.0", desc: "从纯噪声起步，整段帧序列一次采样完成。" }
          ],
          brief: "一次采样出整段帧序列。",
          desc: "潜空间在帧维度上是批量，采样器感知不到区别，时序一致性由运动模块保证。" },
        { id: "dec", title: "VAE Decode", cat: "vae", x: 1370, y: 40,
          widgets: [],
          inputs: [
            { name: "samples", type: "LATENT" },
            { name: "vae", type: "VAE" }
          ],
          outputs: [ { type: "IMAGE" } ],
          brief: "把帧序列解码为图像批量。",
          desc: "输出是 N 张一组的图像张量，VHS 节点会按帧处理。" },
        { id: "vhs", title: "VHS_VideoCombine", cat: "video", x: 1370, y: 300,
          widgets: ["frame_rate 12", "format video/h264-mp4", "crf 19"],
          inputs: [
            { name: "images", type: "IMAGE" },
            { name: "audio", type: "AUDIO" }
          ],
          outputs: [],
          params: [
            { name: "frame_rate", kind: "整数", default: "12", desc: "合成帧率；16 帧配 12fps 约 1.3 秒，可配合循环播放。" },
            { name: "format", kind: "下拉选择", default: "video/h264-mp4", desc: "输出容器与编码格式。",
              options: [["video/h264-mp4", "mp4 通用格式，兼容性最好"], ["video/h265-mp4", "压缩率更高，兼容性稍差"], ["image/gif", "GIF 动图，体积大且无音轨"]] },
            { name: "crf", kind: "整数", default: "19", desc: "压缩质量；越小越清晰、文件越大，19 是高清档。" }
          ],
          brief: "把图像帧合成为视频文件。",
          desc: "Video Helper Suite 的合成节点，支持 mp4 与 gif，直接落盘到 output。" }
      ],
      links: [
        { from: "ckpt", fromOut: 0, to: "ad", toIn: "model" },
        { from: "ctx", fromOut: 0, to: "ad", toIn: "context_options" },
        { from: "ckpt", fromOut: 1, to: "pos", toIn: "clip" },
        { from: "ckpt", fromOut: 1, to: "neg", toIn: "clip" },
        { from: "ckpt", fromOut: 2, to: "dec", toIn: "vae" },
        { from: "ad", fromOut: 0, to: "ks", toIn: "model" },
        { from: "pos", fromOut: 0, to: "ks", toIn: "positive" },
        { from: "neg", fromOut: 0, to: "ks", toIn: "negative" },
        { from: "latent", fromOut: 0, to: "ks", toIn: "latent_image" },
        { from: "ks", fromOut: 0, to: "dec", toIn: "samples" },
        { from: "dec", fromOut: 0, to: "vhs", toIn: "images" }
      ]
    },
    stages: [
      { name: "模型与时序配置", nodes: ["ckpt", "ctx", "latent"], desc: "底模、上下文窗口与带帧数的空潜空间构成视频化三要素。" },
      { name: "条件准备", nodes: ["pos", "neg"], desc: "所有帧共用一对提示词，画面内容与镜头语言都在这里定义。" },
      { name: "运动注入与采样", nodes: ["ad", "ks"], desc: "运动模块改写模型的时序行为，KSampler 一次性采样出长度为 length 的潜空间序列。" },
      { name: "解码与合成", nodes: ["dec", "vhs"], desc: "潜空间帧批量解码为图像帧，VHS 按 frame_rate 合成视频落盘。" }
    ],
    nodeAnalysis: [
      { node: "ckpt", detail: "底模是画风的来源，运动模块只负责让帧动起来。动画向底模与 AnimateDiff 配合会有更好的卡通流畅感，写实底模则容易出新诡异的抖动。底模必须是 SD1.5 家族，mm_sd_v15 系列运动模块不兼容 SDXL。CLIP 与 VAE 保持常规用法。" },
      { node: "ctx", detail: "ADE_StandardStaticContextOptions 定义滑窗采样策略。context_length 16 是 v2 运动模块的训练窗口，不建议改大。overlap 4 让相邻窗口共享 4 帧信息，抑制接缝跳变。总帧数不超过窗口时该配置几乎不起作用，超过后窗口策略直接决定长视频的连贯性。" },
      { node: "pos", detail: "正向提示词对全部帧生效。AnimateDiff 对镜头类词汇响应良好，例如缓慢推近、环绕等描述。想在视频里保持角色一致，主体描述要具体且简短。过长的提示词会在帧间产生相互矛盾的引导，表现为内容漂移。" },
      { node: "neg", detail: "负向条件同样全帧共享。视频特有的负向词包括闪烁、变形、重复等，能有效抑制画面抽搐。写实向底模还要加常见的画质排除词。负向词对运动幅度也有影响，过强的负向会让画面趋近静止。" },
      { node: "latent", detail: "ADE_EmptyLatentImage 与普通空潜空间的区别在于多了 length 维度，直接决定输出帧数。512 分辨率配 16 帧是显存友好的起点，帧数翻倍显存近似翻倍。length 大于窗口长度时才会真正触发滑窗采样。" },
      { node: "ad", detail: "ADE_AnimateDiffLoaderGen1 是 AnimateDiff-Evolved 的第一代加载器，选择 mm 权重后把它挂进 U-Net 的时空注意力层。beta_schedule autoselect 会按运动模块自动匹配噪声调度，v2 模块通常落在 linear。它还输出正负条件的透传口，本图未使用。加载后模型每次采样都会输出整段帧序列而非单帧。" },
      { node: "ks", detail: "KSampler 对帧批量采样，流程与文生图一致，但潜空间形状多了时间维。denoise 1.0 从纯噪声起步。seed 决定初始噪声，也是画面内容的种子，固定 seed 只改提示词可以保持运镜大体一致。采样时长与帧数成正比。" },
      { node: "dec", detail: "VAE Decode 逐帧解码潜空间，输出图像批量。SD1.5 的 VAE 是逐帧独立解码的，帧间亮度可能轻微波动，这是 AnimateDiff 闪烁的来源之一。解码后可以接 VHS 的帧处理节点做亮度稳定。" },
      { node: "vhs", detail: "VHS_VideoCombine 是 Video Helper Suite 的视频合成节点。frame_rate 12 对 16 帧约 1.3 秒，配合 loop_count 可做循环播放。format 选择 h264 mp4 时 crf 控制压缩质量，19 是高清档。它同时承担预览与落盘，保存开关由 save_output 控制。" }
    ],
    flow: [
      "① 载入 SD1.5 底模与 v2 运动模块。",
      "② 配置上下文窗口：length 16、overlap 4。",
      "③ 用 ADE_EmptyLatentImage 设定总帧数 length。",
      "④ 写正向与负向提示词，加入镜头与防闪烁词汇。",
      "⑤ KSampler 一次采样整段帧序列。",
      "⑥ VAE Decode 解码为图像帧批量。",
      "⑦ VHS_VideoCombine 以 frame_rate 12 合成 mp4 并保存。",
      "⑧ 不满意时优先调帧数与提示词，再考虑换运动模块。"
    ],
    params: [
      { name: "length", value: "16", desc: "总帧数，等于窗口长度时质量最稳，32 帧以上需依赖滑窗衔接。" },
      { name: "context_length", value: "16", desc: "运动模块的训练窗口，v2 模块固定 16 最佳。" },
      { name: "context_overlap", value: "4", desc: "窗口间重叠帧数，越大衔接越平滑、显存越高。" },
      { name: "frame_rate", value: "12", desc: "合成帧率，16 帧配 12fps 约 1.3 秒的循环。" },
      { name: "steps", value: "25", desc: "与文生图一致，帧序列采样耗时按帧数放大。" },
      { name: "crf", value: "19", desc: "mp4 压缩质量，越小越清晰、文件越大。" }
    ],
    tips: [
      "帧数先按窗口长度的整数倍设置，滑窗接缝最不明显。",
      "画面抽搐时优先降 cfg 与检查负向词，而不是换采样器。",
      "自由运动不明显时，在提示词里明确写出镜头动词，或换 motion scale 更高的运动模块。",
      "512 分辨率是质量与速度的甜点位，放大请交给后续补帧与超分流程。",
      "循环动画想无缝，用 16 帧加 closed loop 类运动模块或后期做帧回绕。"
    ],
    notice: ""
  });

  /* ================= 8. Wan 2.2 文生视频 ================= */
  window.COMFY_DATA.workflows.push({
    id: "wan22-txt2vid",
    name: "Wan 2.2 文生视频（5B 单模型）",
    category: "视频生成",
    tags: ["Wan", "文生视频", "视频扩散"],
    difficulty: 4,
    source: "社区通用结构（ComfyUI Wan2.2 TI2V 5B 官方模板简化）",
    summary: "Wan 2.2 是原生视频扩散模型（Video Diffusion Model），本页采用轻量的 TI2V 5B 单模型方案：文本经 UMT5 编码器进入条件，模型直接在视频潜空间去噪，一次生成带时序的整段画面。相比 AnimateDiff 的帧批量思路，它的运动幅度与物理合理性显著更强。",
    useCases: [
      "提示词直接生成数秒的写实或风格化短片",
      "镜头语言与物理运动要求较高的素材片段",
      "8GB 级显存本地的视频扩散入门",
      "作为图生视频流程的基线对照"
    ],
    models: [
      { type: "Diffusion", name: "wan2.2_ti2v_5B_fp16.safetensors", note: "TI2V 5B 单模型，官方发布，放在 models/diffusion_models。" },
      { type: "CLIP", name: "umt5_xxl_fp8_e4m3fn_scaled.safetensors", note: "UMT5 文本编码器，放在 models/text_encoders。" },
      { type: "VAE", name: "wan2.2_vae.safetensors", note: "Wan 2.2 专用 VAE，与 5B 模型配套，压缩率高于 2.1 VAE。" }
    ],
    graph: {
      nodes: [
        { id: "unet", title: "Load Diffusion Model", cat: "load", x: 30, y: 40,
          widgets: ["wan2.2_ti2v_5B_fp16.safetensors", "weight_dtype fp16"],
          inputs: [],
          outputs: [ { type: "MODEL" } ],
          params: [
            { name: "unet_name", kind: "下拉选择", default: "wan2.2_ti2v_5B_fp16.safetensors", desc: "models/diffusion_models 目录中的 5B 单模型，一个模型同时支持文生与图生视频。" },
            { name: "weight_dtype", kind: "下拉选择", default: "fp16", desc: "加载精度；fp16 在质量与显存间平衡，显存紧张可换 fp8 量化版。",
              options: [["fp16", "半精度，质量与速度平衡"], ["fp8_e4m3fn", "再省约一半显存，画质略降"], ["default", "按文件原始精度加载"]] }
          ],
          brief: "加载视频扩散模型本体。",
          desc: "只输出 MODEL，视频模型不再捆绑 CLIP 与 VAE，需各自独立加载。" },
        { id: "clip", title: "Load CLIP", cat: "load", x: 30, y: 220,
          widgets: ["umt5_xxl_fp8_e4m3fn_scaled.safetensors", "type wan"],
          inputs: [],
          outputs: [ { type: "CLIP" } ],
          params: [
            { name: "clip_name", kind: "下拉选择", default: "umt5_xxl_fp8_e4m3fn_scaled.safetensors", desc: "UMT5 文本编码器的 fp8 量化版，中文提示词效果很好。" },
            { name: "type", kind: "下拉选择", default: "wan", desc: "编码器用途类型，必须选 wan 让提示词按 Wan 模板处理。",
              options: [["wan", "Wan 系专用模板"], ["wan_vision", "带视觉通路的 Wan 变体"]] }
          ],
          brief: "加载 UMT5 文本编码器。",
          desc: "type 选 wan 使编码器按 Wan 的提示词模板工作。" },
        { id: "vae", title: "Load VAE", cat: "load", x: 30, y: 400,
          widgets: ["wan2.2_vae.safetensors"],
          inputs: [],
          outputs: [ { type: "VAE" } ],
          params: [
            { name: "vae_name", kind: "下拉选择", default: "wan2.2_vae.safetensors", desc: "Wan 2.2 专用 VAE，压缩率高于 2.1 版；与模型版本严格配套，混用报形状错误。" }
          ],
          brief: "加载 Wan 2.2 专用 VAE。",
          desc: "它同时负责图像帧与视频潜空间的编解码，压缩规格与 2.1 不同不能混用。" },
        { id: "pos", title: "CLIP Text Encode (Prompt)", cat: "cond", x: 380, y: 40,
          widgets: ["正向提示词"],
          inputs: [ { name: "clip", type: "CLIP" } ],
          outputs: [ { type: "CONDITIONING" } ],
          params: [
            { name: "text", kind: "多行文本", default: "正向提示词", desc: "按主体、场景、动作、镜头四段式书写；推拉摇移等运动词汇响应明确，中文长句可直接使用。" }
          ],
          brief: "正向视频描述。",
          desc: "写清主体、动作与镜头运动，视频模型对运动描述的响应远强于文生图。" },
        { id: "neg", title: "CLIP Text Encode (Prompt)", cat: "cond", x: 380, y: 220,
          widgets: ["负向提示词"],
          inputs: [ { name: "clip", type: "CLIP" } ],
          outputs: [ { type: "CONDITIONING" } ],
          params: [
            { name: "text", kind: "多行文本", default: "负向提示词", desc: "排除模糊、色调异常、字幕水印、画面抖动等视频瑕疵；沿用官方负向模板即可。" }
          ],
          brief: "负向视频描述。",
          desc: "排除模糊、变形、字幕水印等常见视频瑕疵。" },
        { id: "latent", title: "Wan22ImageToVideoLatent", cat: "latent", x: 380, y: 400,
          widgets: ["width 704", "height 1280", "length 121", "batch 1"],
          inputs: [
            { name: "positive", type: "CONDITIONING" },
            { name: "negative", type: "CONDITIONING" },
            { name: "vae", type: "VAE" }
          ],
          outputs: [ { type: "CONDITIONING" }, { type: "CONDITIONING" }, { type: "LATENT" } ],
          params: [
            { name: "width", kind: "整数", default: "704", desc: "视频画布宽度；704 x 1280 是 5B 的训练分辨率档，改尺寸尽量保持该面积量级。" },
            { name: "height", kind: "整数", default: "1280", desc: "视频画布高度，竖幅视频的标准档位。" },
            { name: "length", kind: "整数", default: "121", desc: "总帧数，24fps 下约 5 秒；显存不足先降它。" },
            { name: "batch_size", kind: "整数", default: "1", desc: "视频生成显存消耗大，保持 1。" }
          ],
          brief: "创建带时序的空视频潜空间。",
          desc: "5B 模板的标配节点：不接 start_image 时等价于空视频画布，同时承担宽高与帧数的设定。" },
        { id: "ms", title: "ModelSamplingSD3", cat: "model", x: 730, y: 40,
          widgets: ["shift 8.0"],
          inputs: [ { name: "model", type: "MODEL" } ],
          outputs: [ { type: "MODEL" } ],
          params: [
            { name: "shift", kind: "浮点数", default: "8.0", desc: "采样位移，把更多去噪步数分配给高噪声区；官方 5B 模板默认 8。" }
          ],
          brief: "给模型加采样位移调度。",
          desc: "shift 值把噪声调度向高噪声区偏移，视频模型普遍需要较大 shift。" },
        { id: "cfg", title: "CFGNorm", cat: "model", x: 730, y: 220,
          widgets: ["strength 1.0"],
          inputs: [ { name: "model", type: "MODEL" } ],
          outputs: [ { type: "MODEL" } ],
          params: [
            { name: "strength", kind: "浮点数", default: "1.0", desc: "引导归一化强度，官方默认 1.0；关掉后高 cfg 的油炸感会立刻回来。" }
          ],
          brief: "归一化引导强度。",
          desc: "官方模板配套节点，抑制高 cfg 下的过曝与过饱和，让引导更平稳。" },
        { id: "ks", title: "KSampler", cat: "sampler", x: 950, y: 220,
          widgets: ["seed 42", "steps 30", "cfg 6.0", "sampler uni_pc", "scheduler simple", "denoise 1.0"],
          inputs: [
            { name: "model", type: "MODEL" },
            { name: "positive", type: "CONDITIONING" },
            { name: "negative", type: "CONDITIONING" },
            { name: "latent_image", type: "LATENT" }
          ],
          outputs: [ { type: "LATENT" } ],
          params: [
            { name: "seed", kind: "整数", default: "42", desc: "决定整段视频的内容与运镜；固定后换提示词是稳定的对比方法。" },
            { name: "steps", kind: "整数", default: "30", desc: "uni_pc 下的收敛步数，20 步可用于快速预览。" },
            { name: "cfg", kind: "浮点数", default: "6.0", desc: "配合 CFGNorm 使用，6 左右已足够听话。" },
            { name: "sampler_name", kind: "下拉选择", default: "uni_pc", desc: "去噪的数学策略，影响速度与画风。",
              options: [["uni_pc", "高阶求解器，低步数表现好"], ["dpmpp_2m", "2 阶多步方法，速度与质量兼顾，配 karras 最热门"], ["dpmpp_2m_sde", "在 dpmpp_2m 基础上加噪声方程，纹理更锐利"], ["euler", "最朴素稳定，通用首选，出图柔和"]] },
            { name: "scheduler", kind: "下拉选择", default: "simple", desc: "控制每一步噪声强度的时间表。",
              options: [["simple", "简化日程，部分新模型表现更稳"], ["karras", "步间过渡更平滑，细节更干净，最常用"], ["normal", "默认线性计划，通用"], ["sgm_uniform", "SD3 与视频模型常用，少步采样收益明显"]] },
            { name: "denoise", kind: "浮点数", default: "1.0", desc: "从纯噪声完整去噪，保持 1.0。" }
          ],
          brief: "在视频潜空间完成去噪。",
          desc: "潜空间形状是帧压缩后的时序张量，采样一次即得整段视频。" },
        { id: "dec", title: "VAE Decode", cat: "vae", x: 1250, y: 220,
          widgets: [],
          inputs: [
            { name: "samples", type: "LATENT" },
            { name: "vae", type: "VAE" }
          ],
          outputs: [ { type: "IMAGE" } ],
          brief: "把视频潜空间解码为帧序列。",
          desc: "时序 VAE 解码时相邻帧共享信息，这是 Wan 画面稳定的关键之一。" },
        { id: "vhs", title: "VHS_VideoCombine", cat: "video", x: 1480, y: 220,
          widgets: ["frame_rate 24", "format video/h264-mp4", "crf 19"],
          inputs: [
            { name: "images", type: "IMAGE" },
            { name: "audio", type: "AUDIO" }
          ],
          outputs: [],
          params: [
            { name: "frame_rate", kind: "整数", default: "24", desc: "Wan 生成帧率即 24fps，按 24 合成不会变速。" },
            { name: "format", kind: "下拉选择", default: "video/h264-mp4", desc: "输出容器与编码格式。",
              options: [["video/h264-mp4", "mp4 通用格式，兼容性最好"], ["video/h265-mp4", "压缩率更高，兼容性稍差"], ["image/gif", "GIF 动图，体积大且无音轨"]] },
            { name: "crf", kind: "整数", default: "19", desc: "压缩质量；越小越清晰、文件越大。" }
          ],
          brief: "合成并保存视频。",
          desc: "24fps 是 Wan 默认帧率，5B 模型 121 帧约 5 秒。" }
      ],
      links: [
        { from: "unet", fromOut: 0, to: "ms", toIn: "model" },
        { from: "ms", fromOut: 0, to: "cfg", toIn: "model" },
        { from: "cfg", fromOut: 0, to: "ks", toIn: "model" },
        { from: "clip", fromOut: 0, to: "pos", toIn: "clip" },
        { from: "clip", fromOut: 0, to: "neg", toIn: "clip" },
        { from: "vae", fromOut: 0, to: "latent", toIn: "vae" },
        { from: "vae", fromOut: 0, to: "dec", toIn: "vae" },
        { from: "pos", fromOut: 0, to: "latent", toIn: "positive" },
        { from: "neg", fromOut: 0, to: "latent", toIn: "negative" },
        { from: "latent", fromOut: 0, to: "ks", toIn: "positive" },
        { from: "latent", fromOut: 1, to: "ks", toIn: "negative" },
        { from: "latent", fromOut: 2, to: "ks", toIn: "latent_image" },
        { from: "ks", fromOut: 0, to: "dec", toIn: "samples" },
        { from: "dec", fromOut: 0, to: "vhs", toIn: "images" }
      ]
    },
    stages: [
      { name: "三模型独立加载", nodes: ["unet", "clip", "vae"], desc: "视频扩散模型把模型、文本编码器、VAE 拆成三个独立文件，分别加载后组合。" },
      { name: "条件与画布", nodes: ["pos", "neg", "latent"], desc: "提示词描述动作与镜头，Wan22ImageToVideoLatent 定义 704x1280、121 帧的视频画布。" },
      { name: "模型调校", nodes: ["ms", "cfg"], desc: "shift 位移与 CFG 归一化是官方模板的两个标配补丁，直接影响画面对比度与稳定性。" },
      { name: "采样与合成", nodes: ["ks", "dec", "vhs"], desc: "一次性去噪整段视频潜空间，时序 VAE 解码后合成为 24fps 视频。" }
    ],
    nodeAnalysis: [
      { node: "unet", detail: "Load Diffusion Model 读取 wan2.2_ti2v_5B_fp16 权重。5B 档是 Wan 2.2 的单模型方案，一个模型同时处理文生视频与图生视频，省去了 14B 方案高低噪声双模型接力切换的复杂度。fp16 精度在质量与显存间平衡，8GB 显存可借助 ComfyUI 的权重卸载运行。输出 MODEL 供后续打补丁。" },
      { node: "clip", detail: "Load CLIP 加载 UMT5 XXL 编码器的 fp8 量化版。Wan 的提示词理解依赖 UMT5 的多语能力，中文提示词效果很好。type 选 wan 后编码器按 Wan 模板处理文本。视频提示词通常较长，UMT5 的长上下文优势明显。" },
      { node: "vae", detail: "Wan 2.2 VAE 是 5B 方案的配套新 VAE，空间压缩率高于 2.1 版本，同显存能跑更长更高的视频。它把像素视频压缩为时序潜空间，也让 Wan22ImageToVideoLatent 能在节点内完成图像编码。务必与 2.1 VAE 区分，混用会直接报形状错误。" },
      { node: "pos", detail: "正向提示词建议按主体、场景、动作、镜头四段式书写。Wan 对镜头运动词汇（推、拉、摇、跟拍）与物理描述的响应明确。中文长句可以直接使用，无需翻译成英文。提示词越具体，运动越可控。" },
      { node: "neg", detail: "负向提示词排除画质与内容瑕疵。视频场景下模糊、色调异常、字幕水印、画面抖动是高频排除项。Wan 官方给出了推荐的负向模板，直接沿用即可，不必自创。" },
      { node: "latent", detail: "Wan22ImageToVideoLatent 在 5B 模板中身兼两职：设定宽高与 length 帧数，并在有 start_image 输入时把首帧编码进潜空间。本页文生视频场景不接图像，等价于空视频画布。121 帧是 5B 的默认长度，704x1280 是其训练分辨率档。输出的正负条件与潜空间三线进 KSampler。" },
      { node: "ms", detail: "ModelSamplingSD3 实现 shift 采样调度，名字源于其首次在 SD3 上使用。shift 8.0 把更多去噪步数分配给高噪声区，视频生成普遍受益于此。官方模板 5B 方案的 shift 取 8，14B 方案常取 5 到 8 之间。它是纯调度补丁，不增加显存。" },
      { node: "cfg", detail: "CFGNorm 是官方模板配套的引导归一化补丁。它把每步引导后的预测重新缩放，抑制高 cfg 带来的过曝、饱和与纹理油炸。strength 1.0 为官方默认，一般不动。该节点与 KSampler 的 cfg 参数配合使用，让 6 左右的 cfg 接近无归一化时更高 cfg 的听话度。" },
      { node: "ks", detail: "KSampler 在时序潜空间上执行标准采样循环。uni_pc 加 simple 调度是社区对 Wan 的高效组合，30 步左右收敛。cfg 6.0 配合 CFGNorm 已经足够听话。seed 决定整段视频的内容与运镜，固定 seed 换提示词是稳定的对比方法。" },
      { node: "dec", detail: "VAE Decode 用时序 VAE 把视频潜空间还原为帧序列。与逐帧解码不同，时序解码在帧间共享时序信息，因此画面亮度与纹理稳定得多。121 帧 704x1280 的解码也是显存峰值之一，显存紧张时降低 length 优先于降低分辨率。" },
      { node: "vhs", detail: "VHS_VideoCombine 按帧率合成视频。Wan 生成帧率即 24fps，直接按 24 合成不会变速。save_output 打开时文件落在 output 目录。需要保留生成时附带音频的场景可接 audio 口，纯文生视频一般没有音轨。" }
    ],
    flow: [
      "① 分别加载 5B 扩散模型、UMT5 编码器与 Wan2.2 VAE。",
      "② 正负提示词经 UMT5 编码为视频条件。",
      "③ Wan22ImageToVideoLatent 设定 704x1280、121 帧的空视频画布。",
      "④ MODEL 依次过 ModelSamplingSD3（shift 8）与 CFGNorm 两个补丁。",
      "⑤ KSampler 以 uni_pc 采样 30 步完成整段去噪。",
      "⑥ 时序 VAE 解码为帧序列。",
      "⑦ VHS_VideoCombine 以 24fps 合成 mp4 保存。"
    ],
    params: [
      { name: "length", value: "121", desc: "总帧数，24fps 下约 5 秒，显存不足先降它。" },
      { name: "shift", value: "8.0", desc: "采样位移，官方 5B 模板默认值。" },
      { name: "cfg", value: "6.0", desc: "引导强度，配合 CFGNorm 使用。" },
      { name: "steps", value: "30", desc: "uni_pc 下的收敛步数，20 步可用于快速预览。" },
      { name: "width x height", value: "704 x 1280", desc: "5B 模型的训练分辨率档，改尺寸尽量保持该面积量级。" }
    ],
    tips: [
      "提示词里写出明确的镜头动词，是控制运镜最有效的手段。",
      "显存吃紧时先减 length，再考虑 fp8 量化版模型。",
      "固定 seed 微调提示词，比换 seed 更容易获得满意的连续版本。",
      "CFGNorm 不要关，关掉后高 cfg 的油炸感会立刻回来。",
      "想要更长的视频，分段生成再用首尾帧衔接，比直接拉大 length 更稳。"
    ],
    notice: ""
  });

  /* ================= 9. Wan 2.2 图生视频 ================= */
  window.COMFY_DATA.workflows.push({
    id: "wan22-img2vid",
    name: "Wan 2.2 图生视频（首帧驱动）",
    category: "视频生成",
    tags: ["Wan", "图生视频", "首帧"],
    difficulty: 4,
    source: "社区通用结构（ComfyUI Wan2.2 TI2V 5B 官方模板简化）",
    summary: "在文生视频结构上增加首帧（First Frame）驱动：上传的图像被 VAE 编码进视频潜空间的第一帧位置，采样从这里出发向外延展运动。视频的内容与画风继承首帧，运动与后续画面由提示词引导，是让静态图动起来的标准本地方案。",
    useCases: [
      "让插画、照片动起来生成短片",
      "电商商品图的动态展示",
      "漫画分镜的动态化预览",
      "为更长视频生成可衔接的片段"
    ],
    models: [
      { type: "Diffusion", name: "wan2.2_ti2v_5B_fp16.safetensors", note: "TI2V 5B 单模型，图生视频走同一权重。" },
      { type: "CLIP", name: "umt5_xxl_fp8_e4m3fn_scaled.safetensors", note: "UMT5 文本编码器。" },
      { type: "VAE", name: "wan2.2_vae.safetensors", note: "负责把首帧编码进视频潜空间并负责最终解码。" }
    ],
    graph: {
      nodes: [
        { id: "unet", title: "Load Diffusion Model", cat: "load", x: 30, y: 40,
          widgets: ["wan2.2_ti2v_5B_fp16.safetensors", "weight_dtype fp16"],
          inputs: [],
          outputs: [ { type: "MODEL" } ],
          params: [
            { name: "unet_name", kind: "下拉选择", default: "wan2.2_ti2v_5B_fp16.safetensors", desc: "与文生视频共用的 5B 权重；TI2V 意为文本与图像混合驱动，图生视频无需额外权重。" },
            { name: "weight_dtype", kind: "下拉选择", default: "fp16", desc: "加载精度；fp16 配 8GB 级显存可跑，帧数与分辨率是显存两大开关。",
              options: [["fp16", "半精度，质量与速度平衡"], ["fp8_e4m3fn", "再省约一半显存，画质略降"], ["default", "按文件原始精度加载"]] }
          ],
          brief: "加载视频扩散模型。",
          desc: "与文生视频共用同一 5B 权重。" },
        { id: "clip", title: "Load CLIP", cat: "load", x: 30, y: 220,
          widgets: ["umt5_xxl_fp8_e4m3fn_scaled.safetensors", "type wan"],
          inputs: [],
          outputs: [ { type: "CLIP" } ],
          params: [
            { name: "clip_name", kind: "下拉选择", default: "umt5_xxl_fp8_e4m3fn_scaled.safetensors", desc: "UMT5 编码器把运动描述转成条件向量，中英文皆可。" },
            { name: "type", kind: "下拉选择", default: "wan", desc: "编码器用途类型，保持 wan。" }
          ],
          brief: "加载文本编码器。",
          desc: "type 选 wan。" },
        { id: "vae", title: "Load VAE", cat: "load", x: 30, y: 400,
          widgets: ["wan2.2_vae.safetensors"],
          inputs: [],
          outputs: [ { type: "VAE" } ],
          params: [
            { name: "vae_name", kind: "下拉选择", default: "wan2.2_vae.safetensors", desc: "本流程承担三重职责：编码首帧、构建潜空间、解码输出；与模型版本严格配套。" }
          ],
          brief: "加载 Wan2.2 VAE。",
          desc: "本流程它有三重职责：编码首帧、构建潜空间、解码输出。" },
        { id: "pos", title: "CLIP Text Encode (Prompt)", cat: "cond", x: 380, y: 40,
          widgets: ["正向提示词"],
          inputs: [ { name: "clip", type: "CLIP" } ],
          outputs: [ { type: "CONDITIONING" } ],
          params: [
            { name: "text", kind: "多行文本", default: "正向提示词", desc: "描述首帧之后发生什么；想让画面基本不动就写轻微动作，想放大运动就写明位移方向与速度。" }
          ],
          brief: "描述首帧之后的运动。",
          desc: "重点写会动什么、怎么动，静态外观交给首帧表达。" },
        { id: "neg", title: "CLIP Text Encode (Prompt)", cat: "cond", x: 380, y: 220,
          widgets: ["负向提示词"],
          inputs: [ { name: "clip", type: "CLIP" } ],
          outputs: [ { type: "CONDITIONING" } ],
          params: [
            { name: "text", kind: "多行文本", default: "负向提示词", desc: "沿用官方负向模板；首帧漂移主要靠 length 与 steps 控制，负向词帮助有限。" }
          ],
          brief: "负向条件。",
          desc: "沿用官方负向模板即可。" },
        { id: "img", title: "Load Image", cat: "load", x: 380, y: 400,
          widgets: ["首帧图片"],
          inputs: [],
          outputs: [ { type: "IMAGE" } ],
          params: [
            { name: "image", kind: "下拉选择", default: "首帧图片", desc: "首帧决定整段视频的画风与主体；建议预先裁剪到输出比例，质量低的首帧会被忠实继承。" }
          ],
          brief: "载入首帧图像。",
          desc: "分辨率不必精确等于输出尺寸，节点会按设定宽高缩放对齐。" },
        { id: "latent", title: "Wan22ImageToVideoLatent", cat: "latent", x: 730, y: 40,
          widgets: ["width 704", "height 1280", "length 121", "batch 1"],
          inputs: [
            { name: "positive", type: "CONDITIONING" },
            { name: "negative", type: "CONDITIONING" },
            { name: "vae", type: "VAE" },
            { name: "start_image", type: "IMAGE" }
          ],
          outputs: [ { type: "CONDITIONING" }, { type: "CONDITIONING" }, { type: "LATENT" } ],
          params: [
            { name: "width", kind: "整数", default: "704", desc: "输出宽度，首帧会被自动缩放到该尺寸。" },
            { name: "height", kind: "整数", default: "1280", desc: "输出高度；与首帧比例不一致会拉伸变形。" },
            { name: "length", kind: "整数", default: "121", desc: "总帧数；越长首帧约束越弱、显存越高。" },
            { name: "batch_size", kind: "整数", default: "1", desc: "视频生成显存消耗大，保持 1。" }
          ],
          brief: "把首帧编码进视频潜空间。",
          desc: "节点内部用 VAE 编码首帧并填入潜空间第一帧位，同时对条件做首帧相关标注。" },
        { id: "ms", title: "ModelSamplingSD3", cat: "model", x: 730, y: 320,
          widgets: ["shift 8.0"],
          inputs: [ { name: "model", type: "MODEL" } ],
          outputs: [ { type: "MODEL" } ],
          params: [
            { name: "shift", kind: "浮点数", default: "8.0", desc: "采样位移；帮助模型在首帧约束下规划整体运动轨迹，与文生视频同值即可。" }
          ],
          brief: "采样位移补丁。",
          desc: "shift 8 与官方模板一致。" },
        { id: "ks", title: "KSampler", cat: "sampler", x: 1080, y: 100,
          widgets: ["seed 42", "steps 30", "cfg 6.0", "sampler uni_pc", "scheduler simple", "denoise 1.0"],
          inputs: [
            { name: "model", type: "MODEL" },
            { name: "positive", type: "CONDITIONING" },
            { name: "negative", type: "CONDITIONING" },
            { name: "latent_image", type: "LATENT" }
          ],
          outputs: [ { type: "LATENT" } ],
          params: [
            { name: "seed", kind: "整数", default: "42", desc: "影响运动路径；同 seed 配小幅改提示词，是同一首帧探索多种运镜的方法。" },
            { name: "steps", kind: "整数", default: "30", desc: "标准收敛步数，预览可用 20；提高 steps 也能缓解首帧漂移。" },
            { name: "cfg", kind: "浮点数", default: "6.0", desc: "引导强度，运动幅度过大时降低。" },
            { name: "sampler_name", kind: "下拉选择", default: "uni_pc", desc: "去噪的数学策略，影响速度与画风。",
              options: [["uni_pc", "高阶求解器，低步数表现好"], ["dpmpp_2m", "2 阶多步方法，速度与质量兼顾，配 karras 最热门"], ["dpmpp_2m_sde", "在 dpmpp_2m 基础上加噪声方程，纹理更锐利"], ["euler", "最朴素稳定，通用首选，出图柔和"]] },
            { name: "scheduler", kind: "下拉选择", default: "simple", desc: "控制每一步噪声强度的时间表。",
              options: [["simple", "简化日程，部分新模型表现更稳"], ["karras", "步间过渡更平滑，细节更干净，最常用"], ["normal", "默认线性计划，通用"], ["sgm_uniform", "SD3 与视频模型常用，少步采样收益明显"]] },
            { name: "denoise", kind: "浮点数", default: "1.0", desc: "首帧信息已写进潜空间而非噪声，1.0 不会抹掉首帧。" }
          ],
          brief: "从首帧出发去噪整段视频。",
          desc: "denoise 1.0 并不抹掉首帧，因为首帧信息已写进潜空间而非仅作为起点噪声。" },
        { id: "dec", title: "VAE Decode", cat: "vae", x: 1360, y: 100,
          widgets: [],
          inputs: [
            { name: "samples", type: "LATENT" },
            { name: "vae", type: "VAE" }
          ],
          outputs: [ { type: "IMAGE" } ],
          brief: "解码帧序列。",
          desc: "第一帧输出应与输入首帧几乎一致，这是检验流程正确性的快捷标准。" },
        { id: "vhs", title: "VHS_VideoCombine", cat: "video", x: 1360, y: 300,
          widgets: ["frame_rate 24", "format video/h264-mp4", "crf 19"],
          inputs: [
            { name: "images", type: "IMAGE" },
            { name: "audio", type: "AUDIO" }
          ],
          outputs: [],
          params: [
            { name: "frame_rate", kind: "整数", default: "24", desc: "与模型生成帧率一致，24fps 合成不会变速。" },
            { name: "format", kind: "下拉选择", default: "video/h264-mp4", desc: "输出容器与编码格式。",
              options: [["video/h264-mp4", "mp4 通用格式，兼容性最好"], ["video/h265-mp4", "压缩率更高，兼容性稍差"], ["image/gif", "GIF 动图，体积大且无音轨"]] },
            { name: "crf", kind: "整数", default: "19", desc: "压缩质量；121 帧约 5 秒的 mp4 体积适中。" }
          ],
          brief: "合成保存视频。",
          desc: "24fps 合成，121 帧约 5 秒。" }
      ],
      links: [
        { from: "unet", fromOut: 0, to: "ms", toIn: "model" },
        { from: "ms", fromOut: 0, to: "ks", toIn: "model" },
        { from: "clip", fromOut: 0, to: "pos", toIn: "clip" },
        { from: "clip", fromOut: 0, to: "neg", toIn: "clip" },
        { from: "vae", fromOut: 0, to: "latent", toIn: "vae" },
        { from: "vae", fromOut: 0, to: "dec", toIn: "vae" },
        { from: "pos", fromOut: 0, to: "latent", toIn: "positive" },
        { from: "neg", fromOut: 0, to: "latent", toIn: "negative" },
        { from: "img", fromOut: 0, to: "latent", toIn: "start_image" },
        { from: "latent", fromOut: 0, to: "ks", toIn: "positive" },
        { from: "latent", fromOut: 1, to: "ks", toIn: "negative" },
        { from: "latent", fromOut: 2, to: "ks", toIn: "latent_image" },
        { from: "ks", fromOut: 0, to: "dec", toIn: "samples" },
        { from: "dec", fromOut: 0, to: "vhs", toIn: "images" }
      ]
    },
    stages: [
      { name: "模型加载", nodes: ["unet", "clip", "vae"], desc: "三件套与文生视频完全一致，图生视频不换模型。" },
      { name: "首帧与条件", nodes: ["img", "pos", "neg"], desc: "首帧提供外观，提示词提供运动，二者分工明确。" },
      { name: "首帧编码", nodes: ["latent"], desc: "Wan22ImageToVideoLatent 在节点内完成 VAE 编码，把首帧写进潜空间第 0 帧。" },
      { name: "采样与合成", nodes: ["ms", "ks", "dec", "vhs"], desc: "shift 补丁后采样去噪，解码并合成 24fps 视频。" }
    ],
    nodeAnalysis: [
      { node: "unet", detail: "TI2V 意为文本与图像混合驱动视频，5B 单模型天然支持两种模式，图生视频无需额外权重。模型从首帧潜位出发学习后续时序变化。fp16 加载配 8GB 级显存可跑，帧数与分辨率是显存两大开关。" },
      { node: "clip", detail: "UMT5 编码器把运动描述转成条件向量。图生视频的提示词聚焦动态：人物做什么、镜头怎么走、天气光线如何变化。静态外观描述可以少写，因为首帧已经携带了全部视觉信息。中英文皆可，长度建议两三句以内。" },
      { node: "vae", detail: "Wan2.2 VAE 在本流程承担三重角色：被 Wan22ImageToVideoLatent 调用编码首帧、参与潜空间构建、最后负责整段视频解码。它的时序压缩让 121 帧视频的潜空间只相当于几十帧普通图像的体量。与模型版本严格配套是使用前提。" },
      { node: "pos", detail: "正向提示词描述首帧之后发生什么。想让画面基本保持原样只做微动，就写轻微动作与镜头不动类描述；想放大运动就明确写位移方向与速度。提示词与首帧内容矛盾时，模型通常折中，画面会显得诡异。" },
      { node: "neg", detail: "负向模板沿用官方推荐，重点是画质瑕疵词。图生视频特有的问题是首帧漂移，即后续帧逐渐偏离原图。负向词对漂移帮助有限，主要靠 length 与 steps 控制。保持负向稳定，便于横向对比不同首帧的表现。" },
      { node: "img", detail: "首帧图像决定整段视频的画风与主体。比例与输出设置不一致时节点会自动缩放，轻微变形可能被放大成运动瑕疵，建议预先裁剪到目标比例。质量低的首帧会被模型忠实继承，先修图再驱动是推荐顺序。" },
      { node: "latent", detail: "该节点是图生视频的核心机关：内部把 start_image 经 VAE 编码后写入视频潜空间的首帧位置，并调整正负条件使模型知晓首帧约束。输出三线：增强后的正负条件与带首帧的潜空间。width、height、length 在此设定，图像缩放也在此完成。" },
      { node: "ms", detail: "ModelSamplingSD3 的 shift 8.0 让去噪在高噪声区投入更多步数，帮助模型在首帧约束下规划整体运动轨迹。图生视频与文生视频使用相同 shift 值即可。该补丁对首帧保真没有直接影响。" },
      { node: "ks", detail: "KSampler 从带首帧的潜空间出发去噪。虽然 denoise 为 1.0，首帧信息不会丢失，因为它已经是潜空间的一部分而非噪声。运动自由度与 length 正相关，帧数越长首帧的约束感越弱。seed 影响运动路径，同 seed 便于微调对比。" },
      { node: "dec", detail: "解码输出整段帧序列，第一帧与输入首帧的差异是快速自检指标。差异明显说明管线接错或 VAE 版本不匹配。后续帧的稳定性取决于模型与采样参数，与解码环节无关。显存峰值也常出现在这一步，帧数过多时优先分段解码。" },
      { node: "vhs", detail: "VHS_VideoCombine 以 24fps 合成。图生视频常见需求是保留首帧静帧片刻，可在 VHS 侧加帧重复或把 length 适度加长。mp4 输出便于直接发布或进入剪辑软件。" }
    ],
    flow: [
      "① 加载 5B 模型、UMT5 编码器与 Wan2.2 VAE。",
      "② 载入首帧图像，必要时先裁剪到输出比例。",
      "③ 写运动导向的正向提示词与官方负向模板。",
      "④ Wan22ImageToVideoLatent 内部编码首帧并设定 121 帧画布。",
      "⑤ MODEL 过 shift 8 位移补丁后进 KSampler。",
      "⑥ 采样 30 步得到整段潜空间视频。",
      "⑦ 解码检查首帧是否保真，合成 24fps mp4 保存。"
    ],
    params: [
      { name: "width x height", value: "704 x 1280", desc: "输出分辨率，首帧会被缩放到该尺寸。" },
      { name: "length", value: "121", desc: "总帧数，越长首帧约束越弱、显存越高。" },
      { name: "shift", value: "8.0", desc: "采样位移，官方模板默认。" },
      { name: "cfg", value: "6.0", desc: "引导强度，运动幅度过大时降低。" },
      { name: "steps", value: "30", desc: "标准收敛步数，预览可用 20。" },
      { name: "frame_rate", value: "24", desc: "合成帧率，与模型生成帧率一致。" }
    ],
    tips: [
      "首帧质量决定视频上限，先做超分或修复再驱动。",
      "输出比例与首帧比例不一致会导致内容变形，务必预先裁剪。",
      "首帧漂移严重时缩短 length，或提高 steps 让模型更充分贴合条件。",
      "运动太微弱时，把提示词里的动作写得更具体，并确认没有强负向词压制运动。",
      "固定 seed 并小幅改提示词，是同一首帧探索多种运镜的高效方法。"
    ],
    notice: ""
  });

  /* ================= 10. RIFE 视频补帧 ================= */
  window.COMFY_DATA.workflows.push({
    id: "rife-frame-interp",
    name: "RIFE 视频补帧",
    category: "视频生成",
    tags: ["补帧", "RIFE", "插帧", "后处理"],
    difficulty: 2,
    source: "社区通用结构（ComfyUI-Frame-Interpolation 官方示例简化）",
    summary: "光流插帧（Frame Interpolation）在相邻帧之间合成中间帧，把低帧率视频平滑倍增到高帧率。RIFE 是其中速度与质量兼顾的经典模型，在 ComfyUI 里作为后处理节点使用，不占采样时间。配合 VHS 读入与输出，即可组成一条纯视频处理流水线。",
    useCases: [
      "把 AnimateDiff 的 8 至 12fps 结果补成 24 至 48fps",
      "让 Wan 生成的视频更丝滑",
      "老视频或幻灯片式素材的帧率提升",
      "慢动作素材的加倍帧平滑化"
    ],
    models: [
      { type: "VFI", name: "rife49.pth", note: "公开周知的 RIFE v4.9 权重，放在 models/vfi。" },
      { type: "Upscale", name: "4x-UltraSharp.pth（可选）", note: "补帧后若要放大可加超分模型，本流程为可选环节。" }
    ],
    graph: {
      nodes: [
        { id: "vid", title: "VHS_LoadVideo", cat: "video", x: 30, y: 40,
          widgets: ["video.mp4", "frame_load_cap 0", "select_every_nth 1"],
          inputs: [],
          outputs: [ { type: "IMAGE" }, { type: "INT" }, { type: "AUDIO" } ],
          params: [
            { name: "video", kind: "文本", default: "video.mp4", desc: "要读入的视频文件；长视频建议配合 frame_load_cap 分段处理。" },
            { name: "frame_load_cap", kind: "整数", default: "0", desc: "读取帧数上限，0 表示全部读入；内存吃紧时用它分段。" },
            { name: "select_every_nth", kind: "整数", default: "1", desc: "抽帧步长，1 为逐帧全取；调大可跳帧抽稀素材。" }
          ],
          brief: "读入视频为帧序列。",
          desc: "Video Helper Suite 的加载节点，输出图像帧批量与音轨。" },
        { id: "r1", title: "RIFE VFI", cat: "image", x: 360, y: 40,
          widgets: ["ckpt_name rife49.pth", "multiplier 2"],
          inputs: [
            { name: "frame1", type: "IMAGE" },
            { name: "frame2", type: "IMAGE" }
          ],
          outputs: [ { type: "IMAGE" } ],
          params: [
            { name: "ckpt_name", kind: "下拉选择", default: "rife49.pth", desc: "RIFE v4.9 权重，对快速运动与透明物体的鲁棒性优于旧版。" },
            { name: "multiplier", kind: "整数", default: "2", desc: "插帧倍率，2 表示在每对相邻帧间合成 1 帧、帧数翻倍。" }
          ],
          brief: "第一段 2 倍插帧。",
          desc: "在每对相邻帧之间合成中间帧，帧数翻倍。" },
        { id: "p0", title: "Preview Image", cat: "image", x: 360, y: 220,
          widgets: [],
          inputs: [ { name: "images", type: "IMAGE" } ],
          outputs: [],
          brief: "预览原始帧。",
          desc: "补帧前先看素材，确认加载的帧范围与顺序正确。" },
        { id: "um", title: "Load Upscale Model", cat: "load", x: 360, y: 400,
          widgets: ["4x-UltraSharp.pth"],
          inputs: [],
          outputs: [ { type: "UPSCALE_MODEL" } ],
          params: [
            { name: "model_name", kind: "下拉选择", default: "4x-UltraSharp.pth", desc: "可选超分模型；放在插帧之后使用，不为被丢弃的帧浪费算力。" }
          ],
          brief: "加载可选超分模型。",
          desc: "补帧后分辨率不变，放大环节在此挂载，不需要可整段移除。" },
        { id: "r2", title: "RIFE VFI", cat: "image", x: 660, y: 40,
          widgets: ["ckpt_name rife49.pth", "multiplier 2"],
          inputs: [
            { name: "frame1", type: "IMAGE" },
            { name: "frame2", type: "IMAGE" }
          ],
          outputs: [ { type: "IMAGE" } ],
          params: [
            { name: "ckpt_name", kind: "下拉选择", default: "rife49.pth", desc: "第二段使用同一 RIFE 权重。" },
            { name: "multiplier", kind: "整数", default: "2", desc: "第二段再翻倍累计 4 倍；两段串联比单段 multiplier 4 的运动估计更准。" }
          ],
          brief: "第二段 2 倍插帧。",
          desc: "对已翻倍的序列再来一轮，累计 4 倍；帧多时耗时明显上升。" },
        { id: "p1", title: "Preview Image", cat: "image", x: 660, y: 220,
          widgets: [],
          inputs: [ { name: "images", type: "IMAGE" } ],
          outputs: [],
          brief: "预览插帧结果。",
          desc: "观察中间帧是否出现鬼影与粘连。" },
        { id: "up", title: "Upscale Image (using Model)", cat: "image", x: 960, y: 40,
          widgets: [],
          inputs: [
            { name: "image", type: "IMAGE" },
            { name: "upscale_model", type: "UPSCALE_MODEL" }
          ],
          outputs: [ { type: "IMAGE" } ],
          brief: "可选的超分放大。",
          desc: "逐帧超分显存压力大，可改用分批处理或删掉该环节。" },
        { id: "vhs", title: "VHS_VideoCombine", cat: "video", x: 1300, y: 40,
          widgets: ["frame_rate 24", "format video/h264-mp4", "crf 19"],
          inputs: [
            { name: "images", type: "IMAGE" },
            { name: "audio", type: "AUDIO" }
          ],
          outputs: [],
          params: [
            { name: "frame_rate", kind: "整数", default: "24", desc: "必须按倍数同步放大（源 12fps 补 4 倍后应写 48fps），否则只是慢放。" },
            { name: "format", kind: "下拉选择", default: "video/h264-mp4", desc: "输出容器与编码格式。",
              options: [["video/h264-mp4", "mp4 通用格式，兼容性最好"], ["video/h265-mp4", "压缩率更高，兼容性稍差"], ["image/gif", "GIF 动图，体积大且无音轨"]] },
            { name: "crf", kind: "整数", default: "19", desc: "输出压缩质量。" }
          ],
          brief: "按新帧率合成视频。",
          desc: "帧率要按倍数同步放大，否则只是慢放而不是补帧。" }
      ],
      links: [
        { from: "vid", fromOut: 0, to: "r1", toIn: "frame1" },
        { from: "vid", fromOut: 0, to: "r1", toIn: "frame2" },
        { from: "vid", fromOut: 0, to: "p0", toIn: "images" },
        { from: "vid", fromOut: 2, to: "vhs", toIn: "audio" },
        { from: "r1", fromOut: 0, to: "r2", toIn: "frame1" },
        { from: "r1", fromOut: 0, to: "r2", toIn: "frame2" },
        { from: "r2", fromOut: 0, to: "p1", toIn: "images" },
        { from: "r2", fromOut: 0, to: "up", toIn: "image" },
        { from: "um", fromOut: 0, to: "up", toIn: "upscale_model" },
        { from: "up", fromOut: 0, to: "vhs", toIn: "images" }
      ]
    },
    stages: [
      { name: "视频读入", nodes: ["vid", "p0"], desc: "VHS 把视频拆成帧批量，音轨单独引出，最后回接合成节点保留原声。" },
      { name: "两段式插帧", nodes: ["r1", "r2", "p1"], desc: "RIFE 连跑两轮各 2 倍，累计 4 倍帧数；中间预览用于发现鬼影。" },
      { name: "可选超分", nodes: ["um", "up"], desc: "插帧不改分辨率，需要高清输出时用超分模型逐帧放大。" },
      { name: "合成输出", nodes: ["vhs"], desc: "帧率乘以倍数后合成，音轨同步保留。" }
    ],
    nodeAnalysis: [
      { node: "vid", detail: "VHS_LoadVideo 把视频文件解码为图像帧批量输出。frame_load_cap 限制读取帧数，0 表示全部读入；select_every_nth 可跳帧抽稀素材。帧批量在内存中的体积随帧数线性增长，长视频建议分段处理。音轨作为独立输出保留，供最终合成回接。" },
      { node: "r1", detail: "RIFE VFI 是光流插帧节点，frame1 与 frame2 都接同一帧批量时按整段序列模式工作，在每对相邻帧之间生成中间帧。multiplier 2 表示帧数翻倍。rife49 是 v4.9 权重，对快速运动与透明物体的鲁棒性都优于旧版。插帧是纯前向推理，不影响生成质量，但会忠实放大源视频的瑕疵。" },
      { node: "p0", detail: "补帧前的预览点。用 VHS 的帧预览或直接看这个输出的若干帧，确认加载范围、方向与素材内容符合预期。源视频若本来就有抽帧卡顿，插帧只会让卡顿更平滑，不能还原缺失的真实运动。" },
      { node: "um", detail: "Load Upscale Model 读取超分权重。4x-UltraSharp 对写实与动画素材都较通用。该环节与补帧相互独立，顺序上先插帧后超分更省算力，因为不需要为被丢弃的中间帧做超分。不需要放大时可整段删除。" },
      { node: "r2", detail: "第二段 RIFE 把已翻倍的序列再翻倍，合计 4 倍。两段串联比单段 multiplier 4 更稳，因为每轮插值都在时间上更近的帧对之间进行，运动估计更准。代价是帧数平方级增长，长视频要先算好内存与耗时。" },
      { node: "p1", detail: "插帧后的预览点。重点检查快速运动区域是否出现鬼影、残影与边缘粘连，这些是 RIFE 的典型失效模式。发现严重伪影时降低倍数或改用 FILM 等其他插帧模型对比。" },
      { node: "up", detail: "Upscale Image (using Model) 对帧批量逐帧超分。帧数多时耗时与显存都会成为瓶颈，可用 VHS 的分批手段或降低放大倍率。超分放在插帧后，能让中间帧同样获得清晰度提升。" },
      { node: "vhs", detail: "VHS_VideoCombine 把新帧序列按调整后的帧率合成视频。关键在于 frame_rate 必须乘以补帧倍数：源 12fps 补 4 倍后应写 48fps，否则会变成慢动作。audio 输入口回接源音轨，保证声画同步。" }
    ],
    flow: [
      "① VHS_LoadVideo 读入视频并拆成帧批量，音轨单独引出。",
      "② 预览原始帧确认素材正确。",
      "③ 第一段 RIFE 2 倍插帧。",
      "④ 第二段 RIFE 再 2 倍，累计 4 倍，预览检查鬼影。",
      "⑤ 可选：超分模型逐帧放大。",
      "⑥ VHS_VideoCombine 把帧率乘以倍数后合成，回接音轨保存。"
    ],
    params: [
      { name: "multiplier", value: "2（每段）", desc: "单次插帧倍数，两段串联累计 4 倍。" },
      { name: "frame_load_cap", value: "0", desc: "读取帧数上限，0 为不限，长视频建议分段。" },
      { name: "frame_rate", value: "24（源 12fps x4）", desc: "必须按倍数同步放大，否则变成慢放。" },
      { name: "crf", value: "19", desc: "输出压缩质量。" },
      { name: "select_every_nth", value: "1", desc: "抽帧步长，1 为逐帧全取。" }
    ],
    tips: [
      "先插帧后超分，省下的算力相当可观。",
      "鬼影严重时把两段 2 倍改成一段 2 倍，先看效果再决定是否加倍。",
      "源视频 8fps 补到 32fps 与 12fps 补到 48fps 的观感差异很大，源帧率越高越平滑。",
      "AI 生成视频常伴随轻微闪烁，插帧会放大它，可先做去闪再补帧。",
      "内存吃紧时用 frame_load_cap 分段处理，再按顺序拼接输出。"
    ],
    notice: ""
  });

  /* ================= 11. 艺术二维码 ================= */
  window.COMFY_DATA.workflows.push({
    id: "art-qrcode",
    name: "艺术二维码生成",
    category: "实用工具",
    tags: ["二维码", "ControlNet", "双条件"],
    difficulty: 3,
    source: "社区通用结构（QR Pattern 控制模型 + 双条件融合）",
    summary: "用二维码图案专用控制模型（QR Pattern ControlNet）把二维码的黑白结构作为强约束注入采样，同时用第二路控制条件在采样后段接管画面，让作品既好看又能扫。两路条件通过 Conditioning Combine 融合，时间段错开是可扫性与美观平衡的关键。",
    useCases: [
      "海报与名片上的装饰性可扫二维码",
      "活动物料与商品包装的艺术码",
      "个人主页的视觉化入口",
      "品牌风格的营销物料配图"
    ],
    models: [
      { type: "Checkpoint", name: "SD1.5 底模", note: "画风任意，写实与插画皆可。" },
      { type: "ControlNet", name: "control_v1p_sd15_qrcode_monster", note: "社区公开的二维码控制模型，对黑白结构宽容度高。" },
      { type: "ControlNet", name: "control_v11f1p_sd15_tile", note: "Tile 控制模型，后段接管用于压住噪声、保住可扫性。" }
    ],
    graph: {
      nodes: [
        { id: "ckpt", title: "Load Checkpoint", cat: "load", x: 30, y: 40,
          widgets: ["SD1.5 底模"],
          inputs: [],
          outputs: [ { type: "MODEL" }, { type: "CLIP" }, { type: "VAE" } ],
          params: [
            { name: "ckpt_name", kind: "下拉选择", default: "SD1.5 底模", desc: "高细节底模会与码块结构打架，输出更花；底模必须为 SD1.5 系。" }
          ],
          brief: "加载底模三件套。",
          desc: "两个控制模型共用一个底模。" },
        { id: "qr", title: "Load Image", cat: "load", x: 30, y: 240,
          widgets: ["二维码图片"],
          inputs: [],
          outputs: [ { type: "IMAGE" } ],
          params: [
            { name: "image", kind: "下拉选择", default: "二维码图片", desc: "标准黑白二维码；容错等级选最高档给生成噪声留余地，尺寸与画布等比。" }
          ],
          brief: "载入普通二维码。",
          desc: "任何二维码生成器做出的标准码即可，内容链接自定。" },
        { id: "cnQ", title: "Load ControlNet Model", cat: "load", x: 30, y: 440,
          widgets: ["control_v1p_sd15_qrcode_monster"],
          inputs: [],
          outputs: [ { type: "CONTROL_NET" } ],
          params: [
            { name: "control_net_name", kind: "下拉选择", default: "control_v1p_sd15_qrcode_monster", desc: "二维码专用控制模型，把码图结构转译为强构图信号，strength 可超过 1.0 使用。" }
          ],
          brief: "载入二维码控制模型。",
          desc: "它的训练目标就是把黑白码图转译为画面结构。" },
        { id: "cnT", title: "Load ControlNet Model", cat: "load", x: 30, y: 640,
          widgets: ["control_v11f1p_sd15_tile"],
          inputs: [],
          outputs: [ { type: "CONTROL_NET" } ],
          params: [
            { name: "control_net_name", kind: "下拉选择", default: "control_v11f1p_sd15_tile", desc: "Tile 控制模型，后段让细节围绕码块结构收敛，压住噪声保住可扫性。" }
          ],
          brief: "载入 Tile 控制模型。",
          desc: "后段用它压住散乱纹理，让码块轮廓在最终图里保持清晰。" },
        { id: "pos", title: "CLIP Text Encode (Prompt)", cat: "cond", x: 380, y: 40,
          widgets: ["正向提示词"],
          inputs: [ { name: "clip", type: "CLIP" } ],
          outputs: [ { type: "CONDITIONING" } ],
          params: [
            { name: "text", kind: "多行文本", default: "正向提示词", desc: "选明暗对比强、大色块的题材更容易保住可扫性；写光照与材质比写复杂场景有效。" }
          ],
          brief: "描述想要的画面风格。",
          desc: "高对比、明暗分明的构图更容易保住可扫性。" },
        { id: "neg", title: "CLIP Text Encode (Prompt)", cat: "cond", x: 380, y: 220,
          widgets: ["负向提示词"],
          inputs: [ { name: "clip", type: "CLIP" } ],
          outputs: [ { type: "CONDITIONING" } ],
          params: [
            { name: "text", kind: "多行文本", default: "负向提示词", desc: "排除模糊、低对比、噪点，作用面集中在保持块面对比。" }
          ],
          brief: "负向条件。",
          desc: "排除模糊与低对比词。" },
        { id: "latent", title: "Empty Latent Image", cat: "latent", x: 380, y: 400,
          widgets: ["768 x 768", "batch 1"],
          inputs: [],
          outputs: [ { type: "LATENT" } ],
          params: [
            { name: "width", kind: "整数", default: "768", desc: "方形画布与码图 1 比 1 对齐，比例失衡会让码块拉伸、扫码失败率骤增。" },
            { name: "height", kind: "整数", default: "768", desc: "画布高度，保持与宽度一致。" },
            { name: "batch_size", kind: "整数", default: "1", desc: "艺术码必须逐张扫码验收，保持 1。" }
          ],
          brief: "方形画布。",
          desc: "二维码是方形的，画布保持 1 比 1 对齐最稳。" },
        { id: "aQ", title: "Apply ControlNet", cat: "cond", x: 730, y: 40,
          widgets: ["strength 1.1", "start_percent 0.0", "end_percent 0.7"],
          inputs: [
            { name: "positive", type: "CONDITIONING" },
            { name: "negative", type: "CONDITIONING" },
            { name: "control_net", type: "CONTROL_NET" },
            { name: "image", type: "IMAGE" }
          ],
          outputs: [ { type: "CONDITIONING" }, { type: "CONDITIONING" } ],
          params: [
            { name: "strength", kind: "浮点数", default: "1.1", desc: "码结构强度，可超过 1.0 是该模型特性；码感不足优先升它。" },
            { name: "start_percent", kind: "浮点数", default: "0.0", desc: "码的骨架必须从第一步开始立，保持 0。" },
            { name: "end_percent", kind: "浮点数", default: "0.7", desc: "后三成步数放开结构，给画面留自由度。" }
          ],
          brief: "二维码路注入，前段主导。",
          desc: "前 7 成采样由码图结构主导，后段放开让画面呼吸。" },
        { id: "aT", title: "Apply ControlNet", cat: "cond", x: 730, y: 280,
          widgets: ["strength 0.7", "start_percent 0.4", "end_percent 1.0"],
          inputs: [
            { name: "positive", type: "CONDITIONING" },
            { name: "negative", type: "CONDITIONING" },
            { name: "control_net", type: "CONTROL_NET" },
            { name: "image", type: "IMAGE" }
          ],
          outputs: [ { type: "CONDITIONING" }, { type: "CONDITIONING" } ],
          params: [
            { name: "strength", kind: "浮点数", default: "0.7", desc: "后段收敛强度，直接影响可扫性；画面太死板就降它。" },
            { name: "start_percent", kind: "浮点数", default: "0.4", desc: "从第 4 成开始介入，与 QR 路形成 0.4 到 0.7 的过渡带。" },
            { name: "end_percent", kind: "浮点数", default: "1.0", desc: "保持 1.0 全程接管到采样结束。" }
          ],
          brief: "Tile 路注入，后段接管。",
          desc: "从 4 成开始介入，以原图结构为参照收敛细节。" },
        { id: "mix", title: "Conditioning (Combine)", cat: "cond", x: 730, y: 620,
          widgets: [],
          inputs: [
            { name: "conditioning_1", type: "CONDITIONING" },
            { name: "conditioning_2", type: "CONDITIONING" }
          ],
          outputs: [ { type: "CONDITIONING" } ],
          brief: "合并两路正向条件。",
          desc: "两路时间段部分重叠，重叠区是融合过渡带。" },
        { id: "ks", title: "KSampler", cat: "sampler", x: 1090, y: 120,
          widgets: ["seed 42", "steps 30", "cfg 7.5", "sampler dpmpp_2m", "scheduler karras", "denoise 1.0"],
          inputs: [
            { name: "model", type: "MODEL" },
            { name: "positive", type: "CONDITIONING" },
            { name: "negative", type: "CONDITIONING" },
            { name: "latent_image", type: "LATENT" }
          ],
          outputs: [ { type: "LATENT" } ],
          params: [
            { name: "seed", kind: "整数", default: "42", desc: "同一参数不同 seed 的可扫性差异明显，需要多抽卡。" },
            { name: "steps", kind: "整数", default: "30", desc: "双阶段引导需要足够步数执行。" },
            { name: "cfg", kind: "浮点数", default: "7.5", desc: "略高的引导让风格更突出。" },
            { name: "sampler_name", kind: "下拉选择", default: "dpmpp_2m", desc: "去噪的数学策略，影响速度与画风。",
              options: [["dpmpp_2m", "2 阶多步方法，速度与质量兼顾，配 karras 最热门"], ["dpmpp_2m_sde", "在 dpmpp_2m 基础上加噪声方程，纹理更锐利"], ["euler", "最朴素稳定，通用首选，出图柔和"], ["euler_ancestral", "每步引入随机性，细节更奔放，复现性略差"]] },
            { name: "scheduler", kind: "下拉选择", default: "karras", desc: "控制每一步噪声强度的时间表。",
              options: [["karras", "步间过渡更平滑，细节更干净，最常用"], ["normal", "默认线性计划，通用"], ["simple", "简化日程，部分新模型表现更稳"], ["sgm_uniform", "SD3 与视频模型常用，少步采样收益明显"]] },
            { name: "denoise", kind: "浮点数", default: "1.0", desc: "从纯噪声完整生成，保持 1.0。" }
          ],
          brief: "双引导采样。",
          desc: "码结构先立骨，画面后长肉。" },
        { id: "dec", title: "VAE Decode", cat: "vae", x: 1370, y: 120,
          widgets: [],
          inputs: [
            { name: "samples", type: "LATENT" },
            { name: "vae", type: "VAE" }
          ],
          outputs: [ { type: "IMAGE" } ],
          brief: "解码输出。",
          desc: "解码后立即扫码测试，而不是调完参数才测。" },
        { id: "save", title: "Save Image", cat: "image", x: 1370, y: 300,
          widgets: ["filename_prefix ComfyUI"],
          inputs: [ { name: "images", type: "IMAGE" } ],
          outputs: [],
          params: [
            { name: "filename_prefix", kind: "文本", default: "ComfyUI", desc: "只保存扫码成功的版本；命名带参数缩写便于复现。" }
          ],
          brief: "保存成品。",
          desc: "只保存扫码成功的版本。" }
      ],
      links: [
        { from: "ckpt", fromOut: 0, to: "ks", toIn: "model" },
        { from: "ckpt", fromOut: 1, to: "pos", toIn: "clip" },
        { from: "ckpt", fromOut: 1, to: "neg", toIn: "clip" },
        { from: "ckpt", fromOut: 2, to: "dec", toIn: "vae" },
        { from: "cnQ", fromOut: 0, to: "aQ", toIn: "control_net" },
        { from: "cnT", fromOut: 0, to: "aT", toIn: "control_net" },
        { from: "qr", fromOut: 0, to: "aQ", toIn: "image" },
        { from: "qr", fromOut: 0, to: "aT", toIn: "image" },
        { from: "pos", fromOut: 0, to: "aQ", toIn: "positive" },
        { from: "pos", fromOut: 0, to: "aT", toIn: "positive" },
        { from: "neg", fromOut: 0, to: "aQ", toIn: "negative" },
        { from: "neg", fromOut: 0, to: "aT", toIn: "negative" },
        { from: "aQ", fromOut: 0, to: "mix", toIn: "conditioning_1" },
        { from: "aT", fromOut: 0, to: "mix", toIn: "conditioning_2" },
        { from: "aT", fromOut: 1, to: "ks", toIn: "negative" },
        { from: "mix", fromOut: 0, to: "ks", toIn: "positive" },
        { from: "latent", fromOut: 0, to: "ks", toIn: "latent_image" },
        { from: "ks", fromOut: 0, to: "dec", toIn: "samples" },
        { from: "dec", fromOut: 0, to: "save", toIn: "images" }
      ]
    },
    stages: [
      { name: "素材与双控制模型", nodes: ["ckpt", "qr", "cnQ", "cnT"], desc: "二维码原图与两个控制模型是本流程的全部外部依赖。" },
      { name: "条件与画布", nodes: ["pos", "neg", "latent"], desc: "方形画布对齐码图，提示词描述承载码的画面风格。" },
      { name: "双路注入与融合", nodes: ["aQ", "aT", "mix"], desc: "QR 路前段立结构，Tile 路后段保可扫，Combine 合并后交给采样。" },
      { name: "采样与验收", nodes: ["ks", "dec", "save"], desc: "采样 30 步，解码后马上扫码测试，合格才保存。" }
    ],
    nodeAnalysis: [
      { node: "ckpt", detail: "底模提供画面风格。艺术码对底模没有特殊要求，但高细节底模会与码块结构打架，输出更花。QR monster 模型是 SD1.5 系，底模必须同为 SD1.5。VAE 正常供解码。" },
      { node: "qr", detail: "标准黑白二维码原图。码的容错等级建议选较高档，给生成噪声留余地。尺寸建议 512 至 768 的方形，与画布等比。码内容确定后就不宜再换，因为每次换码都要重跑采样与测试。" },
      { node: "cnQ", detail: "control_v1p_sd15_qrcode_monster 是社区训练的二维码专用控制模型，把码图结构转译为强构图信号。它对黑白块的宽容度高于通用 Canny，能把码块融进画笔纹理里。strength 可以超过 1.0 使用，这是它的特色。" },
      { node: "cnT", detail: "Tile 控制模型的作用是让画面细节围绕自身结构收敛，本流程用它在中后段压住噪声、稳住码块轮廓。它以原图为参照做细节聚合，天然适合保结构。没有它，后段放开的采样会把码块糊掉。" },
      { node: "pos", detail: "提示词描述风格场景。经验法则是选明暗对比强、有大面积色块的题材，画面天然形成码块分区。提示词里写光照与材质比写复杂场景有效。风格越花哨，可扫性越依赖 Tile 路的强度。" },
      { node: "neg", detail: "负向排除模糊、低对比、噪点等词。艺术码场景负向的作用面集中在保持块面对比上。常规低画质词组合即可，无需花哨。" },
      { node: "latent", detail: "768 见方的画布与码图等比对齐。比例失衡会让码块被拉伸，扫码失败率骤增。batch 保持 1，艺术码必须逐张验收。" },
      { node: "aQ", detail: "QR 路的 strength 1.1 高于常规 ControlNet 用法，是码模型的特性区间。end_percent 0.7 让后三成步数放开结构，给画面留自由度。start_percent 保持 0，码的骨架必须从第一步就开始立。输出的负向未用，负向由 Tile 路透传。" },
      { node: "aT", detail: "Tile 路 start_percent 0.4 与 QR 路形成 0.4 到 0.7 的重叠过渡带，两路引导在此交接。strength 0.7 足以收敛细节又不至于把画面拉回原图。它的 image 输入同样接二维码原图，让细节向码块结构聚拢。" },
      { node: "mix", detail: "Conditioning Combine 把两路正向拼成一条。时间段错开加条件拼接，构成前段立骨后段保真的双阶段引导。想要更强的码感，调 aQ 的 strength；想要更花的画面，降 aT 的 end_percent 或 strength。" },
      { node: "ks", detail: "steps 30 给足双阶段引导的执行空间。cfg 7.5 略高，让风格提示词压得住结构信号。seed 扫描是艺术码的常规操作，同一参数不同 seed 的可扫性差异明显，需要多抽卡。" },
      { node: "dec", detail: "解码后立即用两台以上设备扫码测试，这是艺术码流程的验收环节。能扫即成功，扫不出就降 aT 的自由度或升 aQ 的 strength。不要凭肉眼判断可扫性，扫码器对对比度与定位角的要求远比肉眼苛刻。" },
      { node: "save", detail: "只保存通过扫码验收的成品。艺术码上线前建议再做印刷尺寸测试，缩小到实际使用尺寸后重新扫码一次。文件命名带参数缩写便于复现。" }
    ],
    flow: [
      "① 用任意二维码生成器做好标准码并载入。",
      "② 载入 QR monster 与 Tile 两个控制模型。",
      "③ 写高对比风格的提示词，方形画布对齐码图。",
      "④ QR 路前段 strength 1.1 立住码结构。",
      "⑤ Tile 路 0.4 起介入压稳细节，两路正向合并。",
      "⑥ 采样 30 步解码，立即多设备扫码验收。",
      "⑦ 扫码失败就收紧参数重跑，成功才保存。"
    ],
    params: [
      { name: "strength (QR 路)", value: "1.1", desc: "码结构强度，可超过 1.0 是该模型特性。" },
      { name: "end_percent (QR 路)", value: "0.7", desc: "后段放开结构，给画面自由度。" },
      { name: "strength (Tile 路)", value: "0.7", desc: "后段收敛强度，直接影响可扫性。" },
      { name: "start_percent (Tile 路)", value: "0.4", desc: "与 QR 路形成过渡带。" },
      { name: "steps", value: "30", desc: "双阶段引导需要足够步数。" },
      { name: "cfg", value: "7.5", desc: "略高的引导让风格更突出。" }
    ],
    tips: [
      "解码后立刻用多台设备扫码，肉眼好看不等于能扫。",
      "二维码容错等级选最高档，可扫性余量最大。",
      "可扫性与美观是一对旋钮：码感不足升 aQ 的 strength，画面太死板降 aT 的 strength。",
      "方形构图与等比例画布是稳定前提，比例错了先修图再生成。",
      "高对比、大色块的题材天然适合藏码，避免选密集小元素的场景。"
    ],
    notice: "生成的艺术二维码务必经真实扫码验证后再发布，因码无法识别或识别错误造成的损失由使用者自行承担。"
  });

  /* ================= 12. 无限放大循环视频 ================= */
  window.COMFY_DATA.workflows.push({
    id: "infinite-zoom",
    name: "无限放大循环视频",
    category: "视频生成",
    tags: ["无限缩放", "分阶段采样", "AnimateDiff"],
    difficulty: 4,
    source: "社区通用结构（多级 Latent 放大 + AnimateDiff 循环采样）",
    summary: "无限缩放（Infinite Zoom）用多级潜空间放大模拟镜头持续推进：第一级从空白生成远景，放大潜空间后以中等去噪强度重绘成中景，再放大重绘成近景，三段连起来就是不断深入画面的运动镜头。接上 AnimateDiff 后每段内部还有连续帧运动，最后合成整段视频。",
    useCases: [
      "从全景推入细节的动画开场",
      "概念艺术图的沉浸式展示视频",
      "地图与场景设定的穿行动画",
      "循环播放的展会展台素材"
    ],
    models: [
      { type: "Checkpoint", name: "SD1.5 底模", note: "选择场景层次丰富的底模更耐推近。" },
      { type: "Motion", name: "mm_sd_v15_v2.ckpt", note: "为每段画面提供帧间运动。" }
    ],
    graph: {
      nodes: [
        { id: "ckpt", title: "Load Checkpoint", cat: "load", x: 30, y: 40,
          widgets: ["SD1.5 底模"],
          inputs: [],
          outputs: [ { type: "MODEL" }, { type: "CLIP" }, { type: "VAE" } ],
          params: [
            { name: "ckpt_name", kind: "下拉选择", default: "SD1.5 底模", desc: "选场景纵深感强的底模，推近过程更耐看；三段采样共用同一底模保证画风一致。" }
          ],
          brief: "加载底模三件套。",
          desc: "MODEL 被三个 KSampler 共用，保证三段画风一致。" },
        { id: "ctx", title: "ADE_StandardStaticContextOptions", cat: "util", x: 30, y: 460,
          widgets: ["context_length 16", "context_overlap 4"],
          inputs: [],
          outputs: [ { type: "CONTEXT_OPTIONS" } ],
          params: [
            { name: "context_length", kind: "整数", default: "16", desc: "每段窗口长度，24 帧序列会被切成两个窗口衔接。" },
            { name: "context_overlap", kind: "整数", default: "4", desc: "窗口重叠帧数；帧数加到 32 以上时同步提高。" }
          ],
          brief: "运动上下文配置。",
          desc: "每段 16 帧以内的序列按窗口处理。" },
        { id: "ad", title: "ADE_AnimateDiffLoaderGen1", cat: "model", x: 30, y: 240,
          widgets: ["mm_sd_v15_v2.ckpt"],
          inputs: [
            { name: "model", type: "MODEL" },
            { name: "context_options", type: "CONTEXT_OPTIONS" }
          ],
          outputs: [ { type: "MODEL" }, { type: "CONDITIONING" }, { type: "CONDITIONING" } ],
          params: [
            { name: "model_name", kind: "下拉选择", default: "mm_sd_v15_v2.ckpt", desc: "运动模块给每段内部提供连续微动；只要纯缩放效果可整段移除，结构不变。" }
          ],
          brief: "注入运动模块。",
          desc: "补丁后的模型输出帧序列，三个 KSampler 共用。" },
        { id: "pos", title: "CLIP Text Encode (Prompt)", cat: "cond", x: 430, y: 40,
          widgets: ["正向提示词（由远及近分层描述）"],
          inputs: [ { name: "clip", type: "CLIP" } ],
          outputs: [ { type: "CONDITIONING" } ],
          params: [
            { name: "text", kind: "多行文本", default: "正向提示词（由远及近分层描述）", desc: "三段共用；推近感主要来自放大与重绘机制，提示词描述同一场景即可。" }
          ],
          brief: "正向条件，三段共用。",
          desc: "推近的效果主要来自放大与重绘，提示词只需描述同一场景。" },
        { id: "neg", title: "CLIP Text Encode (Prompt)", cat: "cond", x: 430, y: 220,
          widgets: ["负向提示词"],
          inputs: [ { name: "clip", type: "CLIP" } ],
          outputs: [ { type: "CONDITIONING" } ],
          params: [
            { name: "text", kind: "多行文本", default: "负向提示词", desc: "抑制重复纹理与边缘生长畸形，三段共用保持观感统一。" }
          ],
          brief: "负向条件。",
          desc: "抑制重复、模糊与边缘畸变。" },
        { id: "latent", title: "ADE_EmptyLatentImage", cat: "latent", x: 430, y: 400,
          widgets: ["width 512", "height 512", "length 24", "batch 1"],
          inputs: [],
          outputs: [ { type: "LATENT" } ],
          params: [
            { name: "width", kind: "整数", default: "512", desc: "第一段画布宽度，两级 1.25 放大后到 800。" },
            { name: "height", kind: "整数", default: "512", desc: "第一段画布高度，后续段帧数继承自放大后的潜空间。" },
            { name: "length", kind: "整数", default: "24", desc: "每段帧数，24 帧约 2 秒。" },
            { name: "batch_size", kind: "整数", default: "1", desc: "三段级联显存占用高，保持 1。" }
          ],
          brief: "第一段的空视频画布。",
          desc: "512 起步，级联放大后分辨率逐段提高。" },
        { id: "ks1", title: "KSampler", cat: "sampler", x: 730, y: 40,
          widgets: ["seed 42", "steps 24", "cfg 7.0", "denoise 1.0"],
          inputs: [
            { name: "model", type: "MODEL" },
            { name: "positive", type: "CONDITIONING" },
            { name: "negative", type: "CONDITIONING" },
            { name: "latent_image", type: "LATENT" }
          ],
          outputs: [ { type: "LATENT" } ],
          params: [
            { name: "seed", kind: "整数", default: "42", desc: "与后两段各自独立，段间连续性靠潜空间传递而非 seed。" },
            { name: "steps", kind: "整数", default: "24", desc: "每段采样步数，三段总耗时约三倍单段。" },
            { name: "cfg", kind: "浮点数", default: "7.0", desc: "提示词服从度，三段保持一致。" },
            { name: "denoise", kind: "浮点数", default: "1.0", desc: "第一段从纯噪声生成远景，必须保持 1.0；构图居中留白给推近留空间。" }
          ],
          brief: "第一段：从零生成远景。",
          desc: "denoise 1.0 完整生成，画面为全貌远景。" },
        { id: "up1", title: "LatentUpscaleBy", cat: "latent", x: 730, y: 330,
          widgets: ["upscale_method bilinear", "scale_by 1.25"],
          inputs: [ { name: "samples", type: "LATENT" } ],
          outputs: [ { type: "LATENT" } ],
          params: [
            { name: "upscale_method", kind: "下拉选择", default: "bilinear", desc: "潜空间插值方式；bilinear 平滑，nearest-exact 更锐但易放大噪点。",
              options: [["bilinear", "双线性，平滑常用"], ["nearest-exact", "最近邻，锐利但易放大噪点"], ["bicubic", "三次卷积，较锐利"]] },
            { name: "scale_by", kind: "浮点数", default: "1.25", desc: "每级放大倍率，决定镜头推进步长；越大推进越猛也越容易跳变。" }
          ],
          brief: "第一级潜空间放大。",
          desc: "在潜空间里直接放大并留下模糊，交给下一段重绘。" },
        { id: "ks2", title: "KSampler", cat: "sampler", x: 730, y: 600,
          widgets: ["seed 43", "steps 24", "cfg 7.0", "denoise 0.55"],
          inputs: [
            { name: "model", type: "MODEL" },
            { name: "positive", type: "CONDITIONING" },
            { name: "negative", type: "CONDITIONING" },
            { name: "latent_image", type: "LATENT" }
          ],
          outputs: [ { type: "LATENT" } ],
          params: [
            { name: "seed", kind: "整数", default: "43", desc: "与第一段各自独立，段间连续性来自潜空间传递。" },
            { name: "steps", kind: "整数", default: "24", desc: "中景段步数，与前后段一致便于控制耗时。" },
            { name: "cfg", kind: "浮点数", default: "7.0", desc: "与三段共用条件保持一致。" },
            { name: "denoise", kind: "浮点数", default: "0.55", desc: "中景重绘强度，推进感与稳定性的平衡点；低于 0.5 推进感弱，高于 0.7 容易整体换内容。" }
          ],
          brief: "第二段：放大后重绘中景。",
          desc: "中等去噪保留大结构，长出中景细节。" },
        { id: "up2", title: "LatentUpscaleBy", cat: "latent", x: 1020, y: 40,
          widgets: ["upscale_method bilinear", "scale_by 1.25"],
          inputs: [ { name: "samples", type: "LATENT" } ],
          outputs: [ { type: "LATENT" } ],
          params: [
            { name: "upscale_method", kind: "下拉选择", default: "bilinear", desc: "第二级放大与第一级同参数，两级累计约 1.56 倍。" },
            { name: "scale_by", kind: "浮点数", default: "1.25", desc: "级数越多推得越深，但每级都累积轻微画质损失，三到四级是常见上限。" }
          ],
          brief: "第二级放大。",
          desc: "继续放大，为近景段做准备。" },
        { id: "ks3", title: "KSampler", cat: "sampler", x: 1020, y: 220,
          widgets: ["seed 44", "steps 24", "cfg 7.0", "denoise 0.5"],
          inputs: [
            { name: "model", type: "MODEL" },
            { name: "positive", type: "CONDITIONING" },
            { name: "negative", type: "CONDITIONING" },
            { name: "latent_image", type: "LATENT" }
          ],
          outputs: [ { type: "LATENT" } ],
          params: [
            { name: "seed", kind: "整数", default: "44", desc: "第三段独立种子，输出直接决定成片观感。" },
            { name: "steps", kind: "整数", default: "24", desc: "近景段步数，与前两段一致。" },
            { name: "cfg", kind: "浮点数", default: "7.0", desc: "与三段共用条件保持一致。" },
            { name: "denoise", kind: "浮点数", default: "0.5", desc: "近景段略低于第二段，越接近镜头终点越要稳住结构。" }
          ],
          brief: "第三段：重绘近景。",
          desc: "更低去噪稳住结构，补出近景纹理。" },
        { id: "dec", title: "VAE Decode", cat: "vae", x: 1020, y: 560,
          widgets: [],
          inputs: [
            { name: "samples", type: "LATENT" },
            { name: "vae", type: "VAE" }
          ],
          outputs: [ { type: "IMAGE" } ],
          brief: "解码最终帧序列。",
          desc: "只解码第三段输出，前两段只是过程潜空间。" },
        { id: "vhs", title: "VHS_VideoCombine", cat: "video", x: 1530, y: 560,
          widgets: ["frame_rate 12", "format video/h264-mp4", "crf 19"],
          inputs: [
            { name: "images", type: "IMAGE" },
            { name: "audio", type: "AUDIO" }
          ],
          outputs: [],
          params: [
            { name: "frame_rate", kind: "整数", default: "12", desc: "24 帧配 12fps 约 2 秒推进镜头，与 AnimateDiff 帧率习惯一致。" },
            { name: "format", kind: "下拉选择", default: "video/h264-mp4", desc: "输出容器与编码格式。",
              options: [["video/h264-mp4", "mp4 通用格式，兼容性最好"], ["video/h265-mp4", "压缩率更高，兼容性稍差"], ["image/gif", "GIF 动图，体积大且无音轨"]] },
            { name: "crf", kind: "整数", default: "19", desc: "压缩质量，保证细节不被压毁。" }
          ],
          brief: "合成整段缩放视频。",
          desc: "三段帧序列在潜空间已首尾相接，这里一次性输出。" }
      ],
      links: [
        { from: "ckpt", fromOut: 0, to: "ad", toIn: "model" },
        { from: "ctx", fromOut: 0, to: "ad", toIn: "context_options" },
        { from: "ad", fromOut: 0, to: "ks1", toIn: "model" },
        { from: "ad", fromOut: 0, to: "ks2", toIn: "model" },
        { from: "ad", fromOut: 0, to: "ks3", toIn: "model" },
        { from: "ckpt", fromOut: 1, to: "pos", toIn: "clip" },
        { from: "ckpt", fromOut: 1, to: "neg", toIn: "clip" },
        { from: "ckpt", fromOut: 2, to: "dec", toIn: "vae" },
        { from: "pos", fromOut: 0, to: "ks1", toIn: "positive" },
        { from: "pos", fromOut: 0, to: "ks2", toIn: "positive" },
        { from: "pos", fromOut: 0, to: "ks3", toIn: "positive" },
        { from: "neg", fromOut: 0, to: "ks1", toIn: "negative" },
        { from: "neg", fromOut: 0, to: "ks2", toIn: "negative" },
        { from: "neg", fromOut: 0, to: "ks3", toIn: "negative" },
        { from: "latent", fromOut: 0, to: "ks1", toIn: "latent_image" },
        { from: "ks1", fromOut: 0, to: "up1", toIn: "samples" },
        { from: "up1", fromOut: 0, to: "ks2", toIn: "latent_image" },
        { from: "ks2", fromOut: 0, to: "up2", toIn: "samples" },
        { from: "up2", fromOut: 0, to: "ks3", toIn: "latent_image" },
        { from: "ks3", fromOut: 0, to: "dec", toIn: "samples" },
        { from: "dec", fromOut: 0, to: "vhs", toIn: "images" }
      ]
    },
    stages: [
      { name: "模型与时序准备", nodes: ["ckpt", "ad", "ctx", "latent"], desc: "运动模块与 24 帧空画布构成第一段的时序基础。" },
      { name: "条件配置", nodes: ["pos", "neg"], desc: "三段共用一对条件，画面由放大与去噪强度推动演进。" },
      { name: "三级放大级联", nodes: ["ks1", "up1", "ks2", "up2", "ks3"], desc: "生成、放大、重绘交替进行，镜头感来自逐级放大，画面内容来自逐级重绘。" },
      { name: "解码与合成", nodes: ["dec", "vhs"], desc: "最终段解码为帧序列并合成视频。" }
    ],
    nodeAnalysis: [
      { node: "ckpt", detail: "底模承担三段一致画风的重任。选场景纵深感强的底模，推近过程更耐看。MODEL 输出先进运动模块再分发给三个 KSampler，三段采样共享同一时序补丁模型。CLIP 与 VAE 常规分发。" },
      { node: "ad", detail: "运动模块让每段 24 帧内部有连续微动，是放大步进之间的润滑剂。若只要纯缩放效果，可以把本节点移除、换成普通 KSampler，结构不变。补丁模型被三段共用保证帧率与时序行为一致。" },
      { node: "ctx", detail: "上下文窗口 16 配 24 帧总长，序列会被切成两个窗口并带 4 帧重叠，运动衔接平滑。缩放类视频运动幅度小，窗口策略的压力比自由运动低。若把帧数加到 32 以上，建议同步提高 overlap。" },
      { node: "pos", detail: "提示词描述同一场景的分层内容。高级玩法是给三段分别配条件实现从森林到树叶的跨越，那需要把 pos 拆成三份分别接三个 KSampler。共用条件时，镜头推进感全部来自放大重绘机制本身。" },
      { node: "neg", detail: "负向条件三段共用。缩放重绘的高频问题是重复纹理与边缘生长畸形，对应负向词收益明显。保持负向稳定便于三段观感统一。" },
      { node: "latent", detail: "24 帧空画布只作用于第一段。后续段的帧数继承自放大后的潜空间，潜空间放大不改变帧维。512 起步经两级 1.25 放大到 800，分辨率阶梯可按需调整。" },
      { node: "ks1", detail: "第一段从纯噪声生成远景，denoise 1.0。它是整条镜头的基调，构图要尽量居中且留白，给后续推近留出深入空间。seed 42 与后续段的 43、44 各自独立，前后段的连续性靠潜空间传递而非 seed。" },
      { node: "up1", detail: "LatentUpscaleBy 在潜空间直接插值放大 1.25 倍。放大的副作用是细节模糊，这正是重绘的动力来源。bilinear 是平滑的常用选择，想更锐可换 nearest-exact 但容易放大噪点。放大倍率决定镜头步长，越大推进越猛也越容易跳变。" },
      { node: "ks2", detail: "第二段以 denoise 0.55 重绘放大后的潜空间，一半信息保留作结构，一半重新生成作中景细节。这个强度是推进感与稳定性的平衡点。低于 0.5 推进感弱，高于 0.7 画面容易整体换内容。seed 43 与第一段各自独立，段间连续性来自潜空间传递而非随机数。" },
      { node: "up2", detail: "第二级放大与第一级同参数。两级累计 1.5625 倍，画布从 512 到 800。级数越多推得越深，但每级都会累积轻微的画质损失，三到四级是社区常见上限。" },
      { node: "ks3", detail: "第三段 denoise 0.5 略低于第二段，越接近镜头终点越要稳住结构。近景段的细节密度由底模先验决定。提示词里补一点近景材质描述也有帮助。它是三段中最后采样的一环，输出直接决定成片观感。" },
      { node: "dec", detail: "只解码最后一段的输出，前两段是纯中间潜空间，无需落盘。24 帧一次解码，显存压力集中在此。若想分段检查，可临时给 ks1、ks2 各接一个解码预览。" },
      { node: "vhs", detail: "VHS_VideoCombine 按 12fps 合成 24 帧，约 2 秒的推进镜头。想循环播放，可在剪辑端做首尾帧交叉叠化，或调整段数让首尾内容相近。crf 19 保证细节不被压缩毁掉。" }
    ],
    flow: [
      "① 载入底模并注入 AnimateDiff 运动模块。",
      "② 生成 24 帧空视频画布，写好正负条件。",
      "③ 第一段 KSampler 以 denoise 1.0 生成远景。",
      "④ LatentUpscaleBy 放大 1.25 倍。",
      "⑤ 第二段以 denoise 0.55 重绘出中景。",
      "⑥ 再放大一次，第三段以 denoise 0.5 收出近景。",
      "⑦ 解码最终帧序列，合成 12fps 视频保存。",
      "⑧ 推进感不足就加大 scale_by，画面跳变就降第二三段的 denoise。"
    ],
    params: [
      { name: "scale_by", value: "1.25", desc: "每级放大倍率，决定镜头推进步长。" },
      { name: "denoise (第二段)", value: "0.55", desc: "中景重绘强度，推进感与稳定性的平衡点。" },
      { name: "denoise (第三段)", value: "0.5", desc: "近景段更低，稳住结构收尾。" },
      { name: "length", value: "24", desc: "每段帧数，24 帧约 2 秒。" },
      { name: "steps", value: "24", desc: "每段采样步数，三段总耗时约三倍单段。" },
      { name: "frame_rate", value: "12", desc: "合成帧率，与 AnimateDiff 帧率习惯一致。" }
    ],
    tips: [
      "远景构图居中留白，是推进镜头耐看的前提。",
      "denoise 每段递减（1.0、0.55、0.5）比三段同值观感稳定得多。",
      "级数加到四段以上收益递减，画质损失开始明显。",
      "想要画面从森林推到树叶的内容跨越，把提示词拆成三份分别接三段。",
      "首尾交叉叠化 8 帧即可得到几乎无缝的循环版本。"
    ],
    notice: ""
  });

  /* ================= 13. NSFW 工作流通用结构解析 ================= */
  window.COMFY_DATA.workflows.push({
    id: "nsfw-structure",
    name: "成人内容工作流通用结构解析",
    category: "成人内容（技术解析）",
    tags: ["结构解析", "LoRA 注入", "条件控制"],
    difficulty: 3,
    source: "通用管线结构教学（不含任何具体模型与提示词示例）",
    summary: "本页只做管线结构层面的技术解析：讲解底模选型思路、LoRA 注入位置、提示词的作用面、区域构图控制与细节精修在通用扩散管线中的实现方式。不提供任何具体模型名称、不给出任何具体提示词示例、不涉及任何下载渠道。图中 LoRA 为占位说明。",
    useCases: [
      "理解 LoRA 在管线中的注入位置与作用面",
      "学习条件分离与区域控制的通用原理",
      "掌握内容类工作流的合规自查清单",
      "将通用结构迁移到任意合规题材的批量生产"
    ],
    models: [
      { type: "Checkpoint", name: "写实向通用底模（占位说明）", note: "选型思路：优先选训练数据透明、授权清晰的底模，具体文件请自行评估合规性。" },
      { type: "LoRA", name: "主题风格 LoRA（占位，无具体指向）", note: "本页不指向任何具体文件，仅演示注入结构。" }
    ],
    graph: {
      nodes: [
        { id: "ckpt", title: "Load Checkpoint", cat: "load", x: 30, y: 40,
          widgets: ["写实向通用底模（占位）"],
          inputs: [],
          outputs: [ { type: "MODEL" }, { type: "CLIP" }, { type: "VAE" } ],
          params: [
            { name: "ckpt_name", kind: "下拉选择", default: "写实向通用底模（占位）", desc: "选型优先审查训练授权与使用条款；底模审美上限决定整条管线上限，LoRA 只能修饰不能逆转。" }
          ],
          brief: "加载底模。",
          desc: "底模决定基础画质与审美上限，选型时应审查其训练授权与使用条款。" },
        { id: "csl", title: "CLIP Set Last Layer", cat: "clip", x: 30, y: 240,
          widgets: ["stop_at_clip_layer -2"],
          inputs: [ { name: "clip", type: "CLIP" } ],
          outputs: [ { type: "CLIP" } ],
          params: [
            { name: "stop_at_clip_layer", kind: "整数", default: "-2", desc: "CLIP 截断层，-2 表示截掉最后 2 层编码；部分社区底模用 -2 贴合度明显提升。" }
          ],
          brief: "调整文本编码深度。",
          desc: "裁掉最后一层编码层，常见于 SD1.5 生态，让提示词理解更贴近部分社区底模的训练方式。" },
        { id: "l1", title: "LoraLoader", cat: "model", x: 380, y: 40,
          widgets: ["主题风格 LoRA（占位）", "strength_model 0.8", "strength_clip 0.8"],
          inputs: [
            { name: "model", type: "MODEL" },
            { name: "clip", type: "CLIP" }
          ],
          outputs: [ { type: "MODEL" }, { type: "CLIP" } ],
          params: [
            { name: "lora_name", kind: "下拉选择", default: "主题风格 LoRA（占位）", desc: "第一级 LoRA 文件；本页不指向任何具体文件，仅演示注入结构。" },
            { name: "strength_model", kind: "浮点数", default: "0.8", desc: "主题级模型端强度，内容倾向类常用 0.7 到 0.9。" },
            { name: "strength_clip", kind: "浮点数", default: "0.8", desc: "文本端强度，与模型端同步，保证触发词响应一致。" }
          ],
          brief: "第一级 LoRA 注入。",
          desc: "低秩适配器以旁路权重修改模型行为，文本端同步注入保持提示词与模型对齐。" },
        { id: "l2", title: "LoraLoader", cat: "model", x: 380, y: 220,
          widgets: ["质感辅助 LoRA（占位）", "strength_model 0.5", "strength_clip 0.5"],
          inputs: [
            { name: "model", type: "MODEL" },
            { name: "clip", type: "CLIP" }
          ],
          outputs: [ { type: "MODEL" }, { type: "CLIP" } ],
          params: [
            { name: "lora_name", kind: "下拉选择", default: "质感辅助 LoRA（占位）", desc: "第二级 LoRA 串联在主题级之后，承担质感与风格辅助；作用面大的放前。" },
            { name: "strength_model", kind: "浮点数", default: "0.5", desc: "串联强度逐级递减，两级总和过高会出现特征粘连与油炸纹理。" },
            { name: "strength_clip", kind: "浮点数", default: "0.5", desc: "文本端强度随模型端同步递减。" }
          ],
          brief: "第二级 LoRA 串联。",
          desc: "多个 LoRA 串联时强度要逐级递减，避免权重叠加导致画面崩坏。" },
        { id: "pos", title: "CLIP Text Encode (Prompt)", cat: "cond", x: 680, y: 40,
          widgets: ["正向提示词（构图与质量描述）"],
          inputs: [ { name: "clip", type: "CLIP" } ],
          outputs: [ { type: "CONDITIONING" } ],
          params: [
            { name: "text", kind: "多行文本", default: "正向提示词（构图与质量描述）", desc: "作用面是内容、构图与画质方向；本页不提供任何具体示例词，按主体、场景、构图、画质分层书写。" }
          ],
          brief: "正向条件。",
          desc: "作用面是画面内容与画质方向；本页不提供任何具体示例词。" },
        { id: "neg", title: "CLIP Text Encode (Prompt)", cat: "cond", x: 680, y: 220,
          widgets: ["负向提示词（质量与规避项）"],
          inputs: [ { name: "clip", type: "CLIP" } ],
          outputs: [ { type: "CONDITIONING" } ],
          params: [
            { name: "text", kind: "多行文本", default: "负向提示词（质量与规避项）", desc: "作用面是排除项；维护一份稳定的基础集按需追加，负向过强会压制内容多样性。" }
          ],
          brief: "负向条件。",
          desc: "作用面是排除项，对画质稳定性的贡献常被低估。" },
        { id: "latent", title: "Empty Latent Image", cat: "latent", x: 680, y: 400,
          widgets: ["512 x 768", "batch 1"],
          inputs: [],
          outputs: [ { type: "LATENT" } ],
          params: [
            { name: "width", kind: "整数", default: "512", desc: "竖幅适合人物全身与半身，方幅适合特写，画布比例是最基础的构图控制。" },
            { name: "height", kind: "整数", default: "768", desc: "画布高度，与景别规划配合。" },
            { name: "batch_size", kind: "整数", default: "1", desc: "内容类工作流建议逐张审查，保持 1。" }
          ],
          brief: "画布。",
          desc: "构图控制的第一层就在这里：画布比例决定人物景别。" },
        { id: "ks", title: "KSampler", cat: "sampler", x: 980, y: 150,
          widgets: ["seed 42", "steps 28", "cfg 7.0", "sampler dpmpp_2m", "scheduler karras", "denoise 1.0"],
          inputs: [
            { name: "model", type: "MODEL" },
            { name: "positive", type: "CONDITIONING" },
            { name: "negative", type: "CONDITIONING" },
            { name: "latent_image", type: "LATENT" }
          ],
          outputs: [ { type: "LATENT" } ],
          params: [
            { name: "seed", kind: "整数", default: "42", desc: "固定后便于横向对比不同 LoRA 强度组合。" },
            { name: "steps", kind: "整数", default: "28", desc: "采样步数，28 步细节收敛充分。" },
            { name: "cfg", kind: "浮点数", default: "7.0", desc: "引导强度，LoRA 多时建议下调防过饱和。" },
            { name: "sampler_name", kind: "下拉选择", default: "dpmpp_2m", desc: "去噪的数学策略，影响速度与画风。",
              options: [["dpmpp_2m", "2 阶多步方法，速度与质量兼顾，配 karras 最热门"], ["dpmpp_2m_sde", "在 dpmpp_2m 基础上加噪声方程，纹理更锐利"], ["euler", "最朴素稳定，通用首选，出图柔和"], ["euler_ancestral", "每步引入随机性，细节更奔放，复现性略差"]] },
            { name: "scheduler", kind: "下拉选择", default: "karras", desc: "控制每一步噪声强度的时间表。",
              options: [["karras", "步间过渡更平滑，细节更干净，最常用"], ["normal", "默认线性计划，通用"], ["simple", "简化日程，部分新模型表现更稳"], ["sgm_uniform", "SD3 与视频模型常用，少步采样收益明显"]] },
            { name: "denoise", kind: "浮点数", default: "1.0", desc: "文生图场景保持 1.0，精修回路另按区域设置。" }
          ],
          brief: "采样核心。",
          desc: "模型补丁与条件在此汇合；若需区域控制，条件在进入前就应完成分离与绑定。" },
        { id: "dec", title: "VAE Decode", cat: "vae", x: 1270, y: 150,
          widgets: [],
          inputs: [
            { name: "samples", type: "LATENT" },
            { name: "vae", type: "VAE" }
          ],
          outputs: [ { type: "IMAGE" } ],
          brief: "解码。",
          desc: "像素域才便于做遮罩级精修与质检。" },
        { id: "save", title: "Save Image", cat: "image", x: 1510, y: 150,
          widgets: ["filename_prefix ComfyUI"],
          inputs: [ { name: "images", type: "IMAGE" } ],
          outputs: [],
          params: [
            { name: "filename_prefix", kind: "文本", default: "ComfyUI", desc: "成人向内容的存储与传播是高责任环节，保存前完成合规自查。" }
          ],
          brief: "输出。",
          desc: "成人向内容的存储与传播是高责任环节，请阅读本页须知。" }
      ],
      links: [
        { from: "ckpt", fromOut: 0, to: "l1", toIn: "model" },
        { from: "ckpt", fromOut: 1, to: "csl", toIn: "clip" },
        { from: "csl", fromOut: 0, to: "l1", toIn: "clip" },
        { from: "l1", fromOut: 0, to: "l2", toIn: "model" },
        { from: "l1", fromOut: 1, to: "l2", toIn: "clip" },
        { from: "l2", fromOut: 0, to: "ks", toIn: "model" },
        { from: "l2", fromOut: 1, to: "pos", toIn: "clip" },
        { from: "l2", fromOut: 1, to: "neg", toIn: "clip" },
        { from: "pos", fromOut: 0, to: "ks", toIn: "positive" },
        { from: "neg", fromOut: 0, to: "ks", toIn: "negative" },
        { from: "latent", fromOut: 0, to: "ks", toIn: "latent_image" },
        { from: "ks", fromOut: 0, to: "dec", toIn: "samples" },
        { from: "ckpt", fromOut: 2, to: "dec", toIn: "vae" },
        { from: "dec", fromOut: 0, to: "save", toIn: "images" }
      ]
    },
    stages: [
      { name: "底模与编码深度", nodes: ["ckpt", "csl"], desc: "底模选型看授权与训练透明度，编码深度微调让提示词与底模训练习惯对齐。" },
      { name: "LoRA 串联注入", nodes: ["l1", "l2"], desc: "主题 LoRA 管内容倾向，质感 LoRA 管画面风格，强度逐级递减防崩坏。" },
      { name: "条件与构图", nodes: ["pos", "neg", "latent"], desc: "提示词分正向与负向两个作用面，画布比例承担最基础的构图控制。" },
      { name: "采样与精修衔接", nodes: ["ks", "dec", "save"], desc: "区域与细节控制发生在条件绑定与像素域精修两个层面，采样本身不感知这些区分。" }
    ],
    nodeAnalysis: [
      { node: "ckpt", detail: "底模是所有内容类工作流的地基。选型思路有三条：训练数据与授权是否透明、社区维护是否活跃、与后续 LoRA 的生态是否兼容。底模的审美上限决定整条管线的上限，LoRA 只能修饰不能逆转。VAE 与底模同源可减少色彩偏移。" },
      { node: "csl", detail: "CLIP Set Last Layer 把文本编码停在倒数第二层。部分社区底模在训练时就用了裁剪后的编码深度，输出时对齐这一设定能让提示词被更正确地理解。表现为画面与提示词的贴合度提升。它只影响 CLIP 通路，对 MODEL 无作用。" },
      { node: "l1", detail: "LoraLoader 把低秩适配权重叠加到 MODEL 与 CLIP 上。strength_model 与 strength_clip 分开控制两个端：模型端决定画面倾向强度，文本端决定提示词触发词的响应强度。内容主题类 LoRA 常用 0.7 到 0.9。它是串在模型链上的第一级。" },
      { node: "l2", detail: "第二级 LoRA 串联在第一级之后，承担质感与风格辅助。串联顺序会影响叠加效果，通常把作用面更大的主题 LoRA 放在前。两级总强度过高时会出现特征粘连与油炸纹理，0.8 加 0.5 是安全的起点组合。" },
      { node: "pos", detail: "正向提示词的作用面是画面内容、构图与画质方向。在内容类管线里，提示词与 LoRA 触发词是配合关系：LoRA 提供倾向，提示词做具体描述。本页不给出任何具体示例词，通用原则是结构化书写，主体、场景、构图、画质分层描述。" },
      { node: "neg", detail: "负向提示词的作用面是排除项，对成片稳定性的贡献常被低估。通用建议是维护一份稳定的负向基础集，按需追加针对性排除词。负向过强会压制内容多样性，与正向保持权重平衡比堆长度更重要。" },
      { node: "latent", detail: "画布尺寸是最基础的构图控制：竖幅适合人物全身与半身，方幅适合特写。构图进阶手段发生在条件层：把不同提示词经条件分离节点绑定到画面不同区域，或引入 ControlNet 锁定姿势与布局。这些都是在进入 KSampler 之前完成的。" },
      { node: "ks", detail: "KSampler 是模型补丁与条件的汇合点。采样器与调度器的选择影响细节锐度，dpmpp_2m 配 karras 是通用稳妥组合。区域与细节控制在结构上并不发生在采样器内部，而是通过进样前的条件处理与采样后的局部重绘实现，理解这一点才能把结构迁移到任意题材。" },
      { node: "dec", detail: "解码到像素域之后，才有条件做遮罩级精修：人脸、手部等局部区域可以经检测与分割后独立重绘再贴回。这就是 FaceDetailer 一类管线的接入点。潜空间阶段做不了这种像素级区分，精修环节放在解码后是通用共识。" },
      { node: "save", detail: "输出环节在内容类工作流里是责任最重的一步。保存前应完成合规自查：人物是否成年形象、是否涉及真实人物、是否带有平台禁止的要素。存储位置应做好访问控制，传播行为适用当地法律与平台规则。" }
    ],
    flow: [
      "① 加载底模，审查其授权与使用条款。",
      "② 按底模习惯设置 CLIP 编码深度。",
      "③ 串联两级 LoRA：主题级在前、质感级在后，强度递减。",
      "④ 正负提示词分层书写，各自承担内容与排除两个作用面。",
      "⑤ 用画布比例与条件分离实现基础构图与区域控制。",
      "⑥ KSampler 采样，需要时在条件层引入 ControlNet 锁姿势。",
      "⑦ 解码后按需做检测式局部精修再贴回。",
      "⑧ 输出前完成合规自查，再决定保存与传播。"
    ],
    params: [
      { name: "strength_model", value: "0.8 / 0.5", desc: "两级 LoRA 的模型端强度，总和不宜超过 1.3。" },
      { name: "strength_clip", value: "0.8 / 0.5", desc: "文本端强度，与模型端同步但可独立微调。" },
      { name: "stop_at_clip_layer", value: "-2", desc: "编码深度，视底模训练习惯取 -1 或 -2。" },
      { name: "cfg", value: "7.0", desc: "引导强度，LoRA 多时建议下调防过饱和。" },
      { name: "denoise", value: "1.0", desc: "文生图场景保持 1.0，精修回路另按区域设置。" }
    ],
    tips: [
      "底模选型优先看授权条款与训练透明度，这决定下游一切产物的合规基础。",
      "LoRA 串联时把作用面大的放前、强度逐级递减，是最不容易崩的排布。",
      "区域构图控制发生在条件层：条件分离与 ControlNet 绑定都在进采样器之前完成。",
      "细节精修放在解码后的像素域，检测加重绘的回路可以复用于任何题材。",
      "输出前把合规自查做成固定清单执行，而不是凭当时判断。"
    ],
    notice: "本页仅为管线结构的技术解析，不提供任何具体模型文件名、提示词示例或下载渠道。成人向内容仅限 18 岁以上人群，制作与传播须遵守所在地区法律法规与平台规则；生成内容的传播责任由使用者自行承担；涉及真实人物肖像的内容必须取得本人授权，严禁制作涉及未成年人或非自愿人物的内容。"
  });

  /* ================= 14. SD1.5 修复式重绘进阶 ================= */
  window.COMFY_DATA.workflows.push({
    id: "sd15-inpaint-advanced",
    name: "SD1.5 修复式重绘进阶（双路对比）",
    category: "图生图",
    tags: ["局部重绘", "GrowMask", "Differential Diffusion"],
    difficulty: 3,
    source: "社区通用结构（传统 Inpaint 路与现代遮罩噪声路对比）",
    summary: "本页用两条并行支路对比 SD1.5 局部重绘（Inpainting）的两种主流做法：A 路是经典的 VAE Encode for Inpainting 方案，B 路是现代的 Differential Diffusion 加 SetLatentNoiseMask 方案。GrowMask 负责把遮罩外扩以柔化过渡，两路同图同遮罩同时采样，直观看到边界融合与颜色一致性的差异。",
    useCases: [
      "替换照片中的指定物体并保持周边不变",
      "扩展画面中被裁掉的区域",
      "修复老照片的破损与污渍",
      "对比学习两种重绘机制的边界差异"
    ],
    models: [
      { type: "Checkpoint", name: "SD1.5 底模", note: "通用底模即可；也可选 inpainting 专用底模配合 A 路。" },
      { type: "VAE", name: "底模自带 VAE", note: "编码与解码使用同一 VAE，避免色彩偏移。" }
    ],
    graph: {
      nodes: [
        { id: "ckpt", title: "Load Checkpoint", cat: "load", x: 30, y: 40,
          widgets: ["SD1.5 底模"],
          inputs: [],
          outputs: [ { type: "MODEL" }, { type: "CLIP" }, { type: "VAE" } ],
          params: [
            { name: "ckpt_name", kind: "下拉选择", default: "SD1.5 底模", desc: "倾向传统 A 路可换 inpainting 专用底模；B 路对底模没有特殊要求。" }
          ],
          brief: "加载底模三件套。",
          desc: "MODEL 同时供两条支路：A 路直连，B 路先过 Differential Diffusion。" },
        { id: "img", title: "Load Image", cat: "load", x: 30, y: 240,
          widgets: ["原图"],
          inputs: [],
          outputs: [ { type: "IMAGE" } ],
          params: [
            { name: "image", kind: "下拉选择", default: "原图", desc: "两条支路共用同一原图，保证对比变量唯一；分辨率即工作分辨率，短边 512 到 768。" }
          ],
          brief: "载入待重绘原图。",
          desc: "两条支路共用同一原图，保证对比变量唯一。" },
        { id: "msk", title: "Load Image (as Mask)", cat: "load", x: 30, y: 440,
          widgets: ["mask 图", "channel red"],
          inputs: [],
          outputs: [ { type: "MASK" } ],
          params: [
            { name: "image", kind: "下拉选择", default: "mask 图", desc: "遮罩图，白色区域为重绘目标；也可用遮罩编辑器手涂后导入，两路共用。" },
            { name: "channel", kind: "下拉选择", default: "red", desc: "从哪个颜色通道读取遮罩强度，标准黑白图保持 red。",
              options: [["red", "红色通道，标准黑白遮罩默认"], ["green", "绿色通道"], ["blue", "蓝色通道"], ["alpha", "透明度通道"]] }
          ],
          brief: "从图片通道读取遮罩。",
          desc: "白色区域为重绘区。也可用遮罩编辑器手涂后导入。" },
        { id: "diff", title: "Differential Diffusion", cat: "model", x: 380, y: 40,
          widgets: [],
          inputs: [ { name: "model", type: "MODEL" } ],
          outputs: [ { type: "MODEL" } ],
          brief: "B 路模型补丁。",
          desc: "让每步注入的噪声强度跟随遮罩软边界渐变，是颜色一致性的关键。" },
        { id: "grow", title: "GrowMask", cat: "mask", x: 380, y: 240,
          widgets: ["expand 12", "tapered_corners true"],
          inputs: [ { name: "mask", type: "MASK" } ],
          outputs: [ { type: "MASK" } ],
          params: [
            { name: "expand", kind: "整数", default: "12", desc: "遮罩向外扩的像素数，盖住旧边缘光晕与白边的最小必要值。" },
            { name: "tapered_corners", kind: "开关", default: "true", desc: "角部收缩更自然，保持 true。" }
          ],
          brief: "遮罩外扩。",
          desc: "把重绘区向外扩几个像素，重绘结果能盖住旧边缘的光晕与白边。" },
        { id: "pos", title: "CLIP Text Encode (Prompt)", cat: "cond", x: 380, y: 440,
          widgets: ["正向提示词"],
          inputs: [ { name: "clip", type: "CLIP" } ],
          outputs: [ { type: "CONDITIONING" } ],
          params: [
            { name: "text", kind: "多行文本", default: "正向提示词", desc: "只描述遮罩内要长出的内容与风格；写太多周边描述反而稀释重绘区注意力。" }
          ],
          brief: "描述重绘区内容。",
          desc: "只描述要长出来的东西，不需要复述整张图。" },
        { id: "neg", title: "CLIP Text Encode (Prompt)", cat: "cond", x: 380, y: 620,
          widgets: ["负向提示词"],
          inputs: [ { name: "clip", type: "CLIP" } ],
          outputs: [ { type: "CONDITIONING" } ],
          params: [
            { name: "text", kind: "多行文本", default: "负向提示词", desc: "两路共用；局部重绘的典型瑕疵是边界发糊与色彩突变，可针对性排除。" }
          ],
          brief: "负向条件。",
          desc: "两路共用，排除重绘区常见瑕疵。" },
        { id: "encA", title: "VAE Encode (for Inpainting)", cat: "vae", x: 660, y: 240,
          widgets: ["grow_mask_by 6"],
          inputs: [
            { name: "pixels", type: "IMAGE" },
            { name: "vae", type: "VAE" },
            { name: "mask", type: "MASK" }
          ],
          outputs: [ { type: "LATENT" } ],
          params: [
            { name: "grow_mask_by", kind: "整数", default: "6", desc: "编码节点内部的遮罩外扩量，与 GrowMask 的外扩叠加生效。" }
          ],
          brief: "A 路：传统重绘编码。",
          desc: "编码后把遮罩外区域模糊化处理，采样时未遮罩内容被强行保留。" },
        { id: "encB", title: "VAE Encode", cat: "vae", x: 660, y: 440,
          widgets: [],
          inputs: [
            { name: "pixels", type: "IMAGE" },
            { name: "vae", type: "VAE" }
          ],
          outputs: [ { type: "LATENT" } ],
          brief: "B 路：普通全图编码。",
          desc: "整张图原样进潜空间，重绘范围完全交给噪声遮罩决定。" },
        { id: "setm", title: "SetLatentNoiseMask", cat: "latent", x: 660, y: 620,
          widgets: [],
          inputs: [
            { name: "samples", type: "LATENT" },
            { name: "noise_mask", type: "MASK" }
          ],
          outputs: [ { type: "LATENT" } ],
          brief: "给潜空间挂噪声遮罩。",
          desc: "标记哪里允许重新加噪、哪里保持原样，与 Differential Diffusion 配套。" },
        { id: "ksA", title: "KSampler", cat: "sampler", x: 990, y: 40,
          widgets: ["seed 42", "steps 25", "cfg 7.0", "denoise 1.0"],
          inputs: [
            { name: "model", type: "MODEL" },
            { name: "positive", type: "CONDITIONING" },
            { name: "negative", type: "CONDITIONING" },
            { name: "latent_image", type: "LATENT" }
          ],
          outputs: [ { type: "LATENT" } ],
          params: [
            { name: "seed", kind: "整数", default: "42", desc: "两路使用相同 seed，差异全部来自机制而非随机性。" },
            { name: "steps", kind: "整数", default: "25", desc: "两路相同步数保证对比公平。" },
            { name: "cfg", kind: "浮点数", default: "7.0", desc: "提示词服从度，两路一致。" },
            { name: "denoise", kind: "浮点数", default: "1.0", desc: "A 路遮罩外内容靠编码时的模糊锚定保留，保持 1.0。" }
          ],
          brief: "A 路采样。",
          desc: "denoise 1.0 配传统重绘编码，遮罩外区域靠编码时的模糊锁定。" },
        { id: "ksB", title: "KSampler", cat: "sampler", x: 990, y: 400,
          widgets: ["seed 42", "steps 25", "cfg 7.0", "denoise 1.0"],
          inputs: [
            { name: "model", type: "MODEL" },
            { name: "positive", type: "CONDITIONING" },
            { name: "negative", type: "CONDITIONING" },
            { name: "latent_image", type: "LATENT" }
          ],
          outputs: [ { type: "LATENT" } ],
          params: [
            { name: "seed", kind: "整数", default: "42", desc: "与 A 路相同，便于并排对比。" },
            { name: "steps", kind: "整数", default: "25", desc: "与 A 路相同步数。" },
            { name: "cfg", kind: "浮点数", default: "7.0", desc: "提示词服从度，两路一致。" },
            { name: "denoise", kind: "浮点数", default: "1.0", desc: "B 路遮罩外保持由噪声遮罩完成，1.0 不会波及未遮罩区域。" }
          ],
          brief: "B 路采样。",
          desc: "遮罩外区域的保持由噪声遮罩与渐变噪声共同完成。" },
        { id: "decA", title: "VAE Decode", cat: "vae", x: 1280, y: 40,
          widgets: [],
          inputs: [
            { name: "samples", type: "LATENT" },
            { name: "vae", type: "VAE" }
          ],
          outputs: [ { type: "IMAGE" } ],
          brief: "解码 A 路结果。",
          desc: "重点观察遮罩边界有无颜色断层。" },
        { id: "decB", title: "VAE Decode", cat: "vae", x: 1280, y: 400,
          widgets: [],
          inputs: [
            { name: "samples", type: "LATENT" },
            { name: "vae", type: "VAE" }
          ],
          outputs: [ { type: "IMAGE" } ],
          brief: "解码 B 路结果。",
          desc: "与 A 路并排对比边界与纹理连续性。" },
        { id: "svA", title: "Save Image", cat: "image", x: 1520, y: 40,
          widgets: ["filename_prefix inpaint_A"],
          inputs: [ { name: "images", type: "IMAGE" } ],
          outputs: [],
          params: [
            { name: "filename_prefix", kind: "文本", default: "inpaint_A", desc: "A 路结果单独存档，建议文件名带 denoise 与 expand 参数形成可复现对照组。" }
          ],
          brief: "保存 A 路结果。",
          desc: "前缀区分两条支路便于对比归档。" },
        { id: "svB", title: "Save Image", cat: "image", x: 1520, y: 400,
          widgets: ["filename_prefix inpaint_B"],
          inputs: [ { name: "images", type: "IMAGE" } ],
          outputs: [],
          params: [
            { name: "filename_prefix", kind: "文本", default: "inpaint_B", desc: "B 路结果单独存档；大区域与颜色敏感场景优先选 B 路。" }
          ],
          brief: "保存 B 路结果。",
          desc: "同一 seed 下两路的差异即两种机制的差异。" }
      ],
      links: [
        { from: "ckpt", fromOut: 0, to: "ksA", toIn: "model" },
        { from: "ckpt", fromOut: 0, to: "diff", toIn: "model" },
        { from: "diff", fromOut: 0, to: "ksB", toIn: "model" },
        { from: "ckpt", fromOut: 1, to: "pos", toIn: "clip" },
        { from: "ckpt", fromOut: 1, to: "neg", toIn: "clip" },
        { from: "ckpt", fromOut: 2, to: "encA", toIn: "vae" },
        { from: "ckpt", fromOut: 2, to: "encB", toIn: "vae" },
        { from: "ckpt", fromOut: 2, to: "decA", toIn: "vae" },
        { from: "ckpt", fromOut: 2, to: "decB", toIn: "vae" },
        { from: "img", fromOut: 0, to: "encA", toIn: "pixels" },
        { from: "img", fromOut: 0, to: "encB", toIn: "pixels" },
        { from: "msk", fromOut: 0, to: "grow", toIn: "mask" },
        { from: "grow", fromOut: 0, to: "encA", toIn: "mask" },
        { from: "grow", fromOut: 0, to: "setm", toIn: "noise_mask" },
        { from: "pos", fromOut: 0, to: "ksA", toIn: "positive" },
        { from: "pos", fromOut: 0, to: "ksB", toIn: "positive" },
        { from: "neg", fromOut: 0, to: "ksA", toIn: "negative" },
        { from: "neg", fromOut: 0, to: "ksB", toIn: "negative" },
        { from: "encA", fromOut: 0, to: "ksA", toIn: "latent_image" },
        { from: "encB", fromOut: 0, to: "setm", toIn: "samples" },
        { from: "setm", fromOut: 0, to: "ksB", toIn: "latent_image" },
        { from: "ksA", fromOut: 0, to: "decA", toIn: "samples" },
        { from: "ksB", fromOut: 0, to: "decB", toIn: "samples" },
        { from: "decA", fromOut: 0, to: "svA", toIn: "images" },
        { from: "decB", fromOut: 0, to: "svB", toIn: "images" }
      ]
    },
    stages: [
      { name: "素材与遮罩", nodes: ["ckpt", "img", "msk", "grow"], desc: "同图同遮罩是对比实验的前提，GrowMask 外扩为两路共享柔化边界。" },
      { name: "条件准备", nodes: ["pos", "neg"], desc: "一对条件供两路共用，排除提示词变量。" },
      { name: "双路编码分叉", nodes: ["encA", "encB", "setm", "diff"], desc: "A 路传统重绘编码锁定遮罩外，B 路普通编码加噪声遮罩与模型补丁。" },
      { name: "双路采样与对比", nodes: ["ksA", "ksB", "decA", "decB", "svA", "svB"], desc: "同 seed 并行采样，解码后并排比较边界融合与颜色一致性。" }
    ],
    nodeAnalysis: [
      { node: "ckpt", detail: "SD1.5 底模对两条支路一视同仁。若倾向传统 A 路，可换用 inpainting 专用底模，它的 U-Net 输入通道带遮罩分支，边缘更稳。B 路对底模没有特殊要求，通用底模即可发挥。CLIP 与 VAE 三处分发保持同源。" },
      { node: "img", detail: "原图决定重绘的底色与上下文。分辨率就是工作分辨率，SD1.5 建议短边 512 至 768，过大可先切块。两条支路共用这一张图，任何差异都来自机制而非素材。" },
      { node: "msk", detail: "Load Image as Mask 从指定通道读取遮罩，红通道常用。遮罩白区是重绘目标，边缘越干净对比越可控。手涂遮罩建议导出后统一走 GrowMask 处理，两路共享同一个外扩结果。" },
      { node: "diff", detail: "Differential Diffusion 是 B 路的模型补丁，作用是让每步注入的噪声按遮罩软边界渐变：离重绘区越远噪声越少。它解决的是普通噪声遮罩边界生硬的问题。补丁只在采样期生效，不改变模型权重。" },
      { node: "grow", detail: "GrowMask 把遮罩均匀外扩 expand 像素。重绘区略微盖过旧物边缘，可以吃掉旧边缘留下的光晕、白边与压缩伪影。tapered_corners 让角部收缩更自然。两路共用外扩后的遮罩，保证对比公平。" },
      { node: "pos", detail: "重绘提示词只需描述遮罩内要出现的内容与风格。写太多周边环境描述反而稀释重绘区的注意力。与图生图不同，这里不需要复述原图全貌，原图信息已由编码与遮罩机制保留。" },
      { node: "neg", detail: "负向条件两路共用。局部重绘的典型瑕疵是边界发糊与色彩突变，可针对性加入模糊、色偏类排除词。保持与正向简短平衡。" },
      { node: "encA", detail: "VAE Encode for Inpainting 是 ComfyUI 内置的传统方案：编码原图后，把遮罩外区域的潜空间与模糊版本混合，使采样时未遮罩内容被锚定。它的优点是简单稳定，缺点是锚定方式粗放，边界容易出现颜色与纹理的轻微断层。grow_mask_by 在节点内再做一次小外扩。" },
      { node: "encB", detail: "B 路用普通 VAE Encode 原样编码整图，不做任何遮罩处理。重绘范围的控制在后两个环节完成：噪声遮罩标记重绘区，Differential Diffusion 让噪声按遮罩渐变。这套机制的颜色一致性明显更好，代价是多两个节点。" },
      { node: "setm", detail: "SetLatentNoiseMask 把 GrowMask 输出的遮罩挂到潜空间上，声明哪里可以重新加噪。它本身不改变数据，只是附加元数据。与 Differential Diffusion 配合才是完整形态：前者划定范围，后者让范围边缘渐变过渡。" },
      { node: "ksA", detail: "A 路 denoise 1.0 搭配传统重绘编码，遮罩外内容靠编码时的模糊锚定保留。这是大量老教程的做法，优点是流程短。观察它的输出边界，通常能看到轻微的明度差。" },
      { node: "ksB", detail: "B 路同为 denoise 1.0，但遮罩外保持由噪声遮罩完成。噪声随边界渐变，未遮罩区域几乎不被扰动。同 seed 对比下，B 路边界的颜色与纹理连续性通常显著更好。它尤其适合大面积重绘与调色敏感场景。" },
      { node: "decA", detail: "A 路解码结果用于观察传统机制的边界表现。把两路输出并排放大到边界处对比，是最直观的学习方式。A 路在遮罩精确、重绘区小时表现也不错。" },
      { node: "decB", detail: "B 路解码结果重点看三点：边界颜色是否连续、纹理是否自然过渡、遮罩外像素是否与原图逐像素一致。三个指标通常都优于 A 路。这也是社区逐步转向 B 路方案的原因。对比时把两图放大到边界处最直观。" },
      { node: "svA", detail: "A 路结果单独存档。建议文件名带 denoise 与 expand 参数，形成可复现的对照组。修复类任务可以把两路输出都保留，按需取用。" },
      { node: "svB", detail: "B 路结果单独存档。两图对比后会形成明确的选型经验：小修小补用 A 路省事，大区域与颜色敏感用 B 路。把这个对比图保存下来，是教学与复盘的好素材。" }
    ],
    flow: [
      "① 载入原图与遮罩，GrowMask 外扩 12 像素柔化边界。",
      "② 正负条件只描述重绘区内容。",
      "③ A 路：VAE Encode for Inpainting 编码后直接进 KSampler。",
      "④ B 路：普通 VAE Encode，经 SetLatentNoiseMask 挂上外扩遮罩。",
      "⑤ B 路模型先过 Differential Diffusion，让噪声沿遮罩渐变。",
      "⑥ 两路以相同 seed 并行采样 denoise 1.0。",
      "⑦ 解码后并排对比边界颜色与纹理连续性。",
      "⑧ 按场景选路：小修补用 A 路，大区域重绘用 B 路。"
    ],
    params: [
      { name: "expand", value: "12", desc: "遮罩外扩像素，盖住旧边缘光晕的最小必要值。" },
      { name: "grow_mask_by", value: "6", desc: "A 路编码节点内部的外扩量，与 GrowMask 叠加生效。" },
      { name: "denoise", value: "1.0", desc: "重绘区完全重新生成，遮罩外由各自机制保护。" },
      { name: "steps", value: "25", desc: "两路相同步数保证对比公平。" },
      { name: "seed", value: "42（两路相同）", desc: "同 seed 下差异全部来自机制而非随机性。" }
    ],
    tips: [
      "重绘边缘有白边或光晕，说明遮罩没盖住旧物轮廓，加大 expand。",
      "A 路出现颜色断层是机制性问题，换 B 路而不是继续调参。",
      "B 路的 Differential Diffusion 与 SetLatentNoiseMask 必须成对出现，缺一则效果打折。",
      "对比实验时固定 seed 与步数，只切换支路，结论才可靠。",
      "遮罩边缘的羽化程度决定过渡自然度，软遮罩配 B 路渐变噪声效果最佳。"
    ],
    notice: ""
  });

})();
