/* 第三方节点包（第四批）：IPAdapter-Plus / ReActor / InstantID / AnimateDiff-Evolved / VideoHelper-Suite / Frame-Interpolation / Ultimate SD Upscale / GGUF / KJNodes */
(function () {
  "use strict";
  window.COMFY_DATA = window.COMFY_DATA || {};
  window.COMFY_DATA.nodePackages = window.COMFY_DATA.nodePackages || [];

  /* ---------------- 1. ComfyUI-IPAdapter-Plus ---------------- */
  window.COMFY_DATA.nodePackages.push({
    id: "ipadapter-plus",
    name: "ComfyUI-IPAdapter-Plus",
    author: "cubiq",
    official: false,
    category: "风格与身份迁移",
    install: "在 ComfyUI-Manager 里搜索 IPAdapter Plus 一键安装，并按控制台提示下载对应的 IPAdapter 与 CLIP Vision 模型文件",
    summary: "IPAdapter 全称 Image Prompt Adapter，即图像提示词适配器，它把一张参考图的风格、构图、材质甚至人脸身份转成模型层面的条件注入生成过程，相当于「文本提示词的图像版」。本项目（Plus）是 ComfyUI 生态中功能最全、更新最活跃的 IPAdapter 实现，覆盖从风格迁移到人物一致性的主流场景。",
    why: "它让「像参考图」变成可精确调节的模型注入，而不是简单的图层混合；配合权重、权重曲线与遮罩控制，可以在贴合参考与保留创意之间自由取舍。想稳定复现某种画风或某个角色的用户几乎必装。",
    tags: ["风格迁移", "IPAdapter", "图像提示"],
    nodes: [
      {
        name: "IPAdapter Unified Loader", cat: "load",
        brief: "一站式自动加载 IPAdapter 模型与配套的 CLIP Vision 视觉编码器。",
        desc: "官方推荐的统一加载节点。它根据上游大模型自动判断适用的 IPAdapter 预设档位（如 PLUS、FACEID PLUS V2、SDXL 专用版本），一次性输出 ipadapter 权重与 clip_vision 编码器两路结果，免去手动挑选模型文件的麻烦。它位于管线的加载段，两路输出分别接到各类 IPAdapter 应用节点的 ipadapter 与 clip_vision 输入。理解时记住一点：IPAdapter 依赖 CLIP Vision（视觉编码器）把参考图编码成特征向量，不同基础模型需要匹配不同版本的权重。",
        inputs: [
          { name: "model", type: "MODEL", from: "典型上游：Load Checkpoint / LoRA 链", desc: "用于自动识别模型架构并匹配预设" },
          { name: "preset", type: "COMBO", from: "节点面板下拉选择", desc: "选择预设档位，如 PLUS (high strength)、FACEID PLUS V2 等" }
        ],
        outputs: [
          { type: "IPADAPTER", to: "各类 IPAdapter 节点的 ipadapter 输入", desc: "加载好的 IPAdapter 权重" },
          { type: "CLIP_VISION", to: "各类 IPAdapter 节点的 clip_vision 输入", desc: "配套的视觉编码器" }
        ],
        why: "IPAdapter 模型文件众多且命名复杂，选错版本会直接报错或效果异常；Unified Loader 自动完成架构识别与文件匹配，大幅降低出错率。",
        params: [
          { name: "preset", kind: "下拉选择", default: "PLUS (high strength)", desc: "预设档位决定加载哪套 IPAdapter 与 CLIP Vision 权重，加载器会根据底模自动匹配 SD1.5 或 SDXL 版本。",
            options: [["PLUS (high strength)", "通用风格与概念迁移，最常用的档位"], ["PLUS FACE (portraits)", "带人脸增强，适合人像参考"], ["FULL FACE - SD1.5 only (portraits stronger)", "整脸保持更强，仅 SD1.5 可用"], ["LIGHT - SD1.5 only (low strength)", "低强度轻度参考，不容易锁死画面"]] }
        ],
        tips: "若提示缺少模型文件，按控制台日志给出的文件名下载，放进 models/ipadapter 与 models/clip_vision 目录后重启即可。"
      },
      {
        name: "IPAdapter", cat: "model",
        brief: "最简洁的 IPAdapter 应用节点，把参考图特征注入模型。",
        desc: "基础版应用节点。它接收 Unified Loader 提供的 ipadapter 与 clip_vision，以及一张或多张参考图，把图像特征转成对 UNet 交叉注意力（Cross Attention）层的干预，最后输出注入完成的 MODEL。位于加载与采样之间：上游接大模型，下游接 KSampler 的 model 输入。可以理解为「图像版的提示词」：文本提示词描述画面内容，IPAdapter 则让画面长得像参考图。",
        inputs: [
          { name: "model", type: "MODEL", from: "典型上游：Load Checkpoint / LoRA 链", desc: "待注入的大模型" },
          { name: "ipadapter", type: "IPADAPTER", from: "典型上游：IPAdapter Unified Loader", desc: "IPAdapter 权重" },
          { name: "image", type: "IMAGE", from: "典型上游：Load Image", desc: "风格或主体参考图" },
          { name: "weight", type: "FLOAT", from: "节点面板调节", desc: "注入强度，0 为不生效，1 为完全生效" }
        ],
        outputs: [
          { type: "MODEL", to: "典型下游：KSampler 的 model 输入", desc: "注入参考图特征后的模型" }
        ],
        why: "无需训练即可把任意图片的风格或内容特征迁移到生成结果中，是风格化与概念一致性的最低门槛入口。",
        params: [
          { name: "weight", kind: "浮点数", default: "1.0", desc: "注入强度，0 为不生效，1 为完全生效；从 0.6 到 0.8 试起，过高画面容易僵化、色彩溢出。" },
          { name: "weight_type", kind: "下拉选择", default: "standard", desc: "参考图话语权与提示词的相对强弱。",
            options: [["standard", "常规注入，图文并重"], ["style transfer", "只学画风，不学构图内容"], ["prompt is more important", "削弱参考图，给提示词更大发挥空间"]] }
        ],
        tips: "weight 从 0.6 到 0.8 试起；过高容易出现画面僵化、色彩溢出或构图被参考图锁死。"
      },
      {
        name: "IPAdapter Advanced", cat: "model",
        brief: "进阶版注入节点，提供权重曲线、嵌入缩放与注意力遮罩。",
        desc: "高级版在基础版之上增加三类关键控制。weight_type 提供线性、缓入缓出、反向等十余种权重曲线，决定注入强度随采样步数的衰减方式，常用来做「先定结构、后放细节」的效果；embeds_scaling 可以只作用于 K、V 通道或按 token 数归一化，改变特征注入的数学方式；attn_mask（注意力遮罩）能把参考图的影响限制在画面局部。管线位置与基础版一致：模型进来，注入后输出 MODEL 给采样器。实际出图质量最高的通常就是它。",
        inputs: [
          { name: "model", type: "MODEL", from: "典型上游：Load Checkpoint / LoRA 链", desc: "待注入的大模型" },
          { name: "ipadapter", type: "IPADAPTER", from: "典型上游：IPAdapter Unified Loader", desc: "IPAdapter 权重" },
          { name: "image", type: "IMAGE", from: "典型上游：Load Image 或 Prep Image For ClipVision", desc: "参考图" },
          { name: "clip_vision", type: "CLIP_VISION", from: "可选，IPAdapter Unified Loader", desc: "视觉编码器" },
          { name: "attn_mask", type: "MASK", from: "可选，遮罩生成节点", desc: "把注入限制在遮罩区域内" },
          { name: "weight_type", type: "COMBO", from: "节点面板选择", desc: "强度随采样步数变化的曲线" }
        ],
        outputs: [
          { type: "MODEL", to: "典型下游：KSampler 的 model 输入", desc: "注入后的模型" }
        ],
        why: "复杂工作流需要对注入的时机、区域和强度做精确控制，Advanced 是用途最广、社区工作流出镜率最高的版本。",
        params: [
          { name: "weight", kind: "浮点数", default: "1.0", desc: "注入强度，配合权重曲线使用，过高会构图被参考图锁死。" },
          { name: "weight_type", kind: "下拉选择", default: "linear", desc: "注入强度随采样步数变化的曲线，决定参考图在何时起作用。",
            options: [["linear", "全程恒定，通用默认"], ["ease in-out", "先弱后强再弱，常用来先定结构、后放细节"], ["style transfer", "专注迁移画风而弱化内容"], ["composition", "只参考构图与布局，弱化画风"]] },
          { name: "start_at", kind: "浮点数", default: "0.0", desc: "从采样进度的哪个比例开始注入，0 表示从头生效。" },
          { name: "end_at", kind: "浮点数", default: "1.0", desc: "到采样进度的哪个比例停止注入，0.7 表示最后三成步不再干预，让画面自由收尾。" },
          { name: "embeds_scaling", kind: "下拉选择", default: "V only", desc: "特征注入的数学方式，影响参考图实际影响力的大小。",
            options: [["V only", "只调节值通道，最通用最稳"], ["K+V", "同时调键与值通道，参考图的约束力更强"]] }
        ],
        tips: "想让构图先定型、细节再自由发挥，选 ease in out 类权重曲线并配合较高的 weight；局部注入时用 attn_mask 划定区域。"
      },
      {
        name: "IPAdapter Plus", cat: "model",
        brief: "早期增强版注入节点，支持多参考图特征平均，多被 Advanced 取代。",
        desc: "项目早期的进阶节点，支持一次输入多张参考图并把特征取平均，比基础版更稳定。随着功能更全的 IPAdapter Advanced 出现，Plus 版已被标记为过时但仍然保留兼容。管线位置与基础版完全相同：模型进来，注入后输出 MODEL 给采样器。老工作流里看到它不必惊讶；新搭工作流建议直接用 Advanced。",
        inputs: [
          { name: "model", type: "MODEL", from: "典型上游：Load Checkpoint / LoRA 链", desc: "待注入的大模型" },
          { name: "ipadapter", type: "IPADAPTER", from: "典型上游：IPAdapter Unified Loader", desc: "IPAdapter 权重" },
          { name: "image", type: "IMAGE", from: "典型上游：Load Image（可成批）", desc: "一张或多张参考图" },
          { name: "clip_vision", type: "CLIP_VISION", from: "可选，IPAdapter Unified Loader", desc: "视觉编码器" }
        ],
        outputs: [
          { type: "MODEL", to: "典型下游：KSampler 的 model 输入", desc: "注入后的模型" }
        ],
        why: "大量社区工作流和教程基于 Plus 版搭建，认识它有助于看懂和改造存量工作流。",
        params: [
          { name: "weight", kind: "浮点数", default: "1.0", desc: "注入强度，多张参考图取平均时总强度过高更容易色彩溢出。" },
          { name: "weight_type", kind: "下拉选择", default: "linear", desc: "强度随采样步数变化的曲线，含义与 IPAdapter Advanced 相同。" }
        ],
        tips: "新工作流请优先用 Advanced，两者参数几乎一一对应，迁移成本很低。"
      },
      {
        name: "IPAdapter FaceID", cat: "model",
        brief: "使用人脸识别嵌入把参考人物的脸注入模型，强调身份一致性。",
        desc: "FaceID 系列不再依赖 CLIP Vision 的通用图像特征，而是改用 InsightFace（开源人脸分析库）提取的人脸身份嵌入，配合专用的 ipadapter_faceid 模型，把「这个人是谁」注入生成过程。适用于人物一致性场景：让同一张脸出现在不同姿势、服装与场景中。位于模型链上，输出 MODEL 给采样器；参考图用一张清晰正脸效果最好。需要额外安装 InsightFace 依赖。",
        inputs: [
          { name: "model", type: "MODEL", from: "典型上游：Load Checkpoint / LoRA 链", desc: "待注入的大模型" },
          { name: "ipadapter", type: "IPADAPTER", from: "典型上游：Unified Loader 选 FACEID 预设", desc: "FaceID 专用权重" },
          { name: "image", type: "IMAGE", from: "典型上游：Load Image", desc: "人脸参考图" },
          { name: "insightface", type: "COMBO", from: "节点面板选择", desc: "人脸检测分析模型" },
          { name: "weight", type: "FLOAT", from: "节点面板调节", desc: "身份注入强度" }
        ],
        outputs: [
          { type: "MODEL", to: "典型下游：KSampler 的 model 输入", desc: "注入人脸身份后的模型" }
        ],
        why: "普通风格迁移对「人脸像不像」控制很弱，FaceID 专门解决人物身份一致这个高频需求。",
        params: [
          { name: "weight", kind: "浮点数", default: "1.0", desc: "身份注入强度，不宜超过 1，否则脸部容易塑料感。" },
          { name: "insightface", kind: "下拉选择", default: "CPU", desc: "人脸分析模型的运行设备。",
            options: [["CPU", "稳定不占显存，分析稍慢"], ["CUDA", "用显卡分析更快，显存紧张时慎用"]] }
        ],
        tips: "配合项目提供的 FaceID 专用 LoRA 一起使用，相似度会明显提升；weight 不宜超过 1，否则脸部容易塑料感。"
      },
      {
        name: "IPAdapter FaceID Plus v2", cat: "model",
        brief: "FaceID 增强版，叠加图像编码特征以获得更高的人脸保真度。",
        desc: "Plus v2 在 FaceID 的基础上重新引入 CLIP Vision 图像特征，把「身份嵌入」与「图像嵌入」按比例融合：前者保证像本人，后者补充光影、质感等外观细节，使人脸在风格化场景下也不容易崩坏。节点提供分别调节两路强度的参数。管线位置与 FaceID 相同，输出 MODEL 给采样器。对参考图质量要求更高，建议保持与训练时接近的输入尺寸。",
        inputs: [
          { name: "model", type: "MODEL", from: "典型上游：Load Checkpoint / LoRA 链", desc: "待注入的大模型" },
          { name: "ipadapter", type: "IPADAPTER", from: "典型上游：Unified Loader 选 FACEID PLUS V2 预设", desc: "FaceID Plus v2 专用权重" },
          { name: "image", type: "IMAGE", from: "典型上游：Load Image", desc: "人脸参考图" },
          { name: "clip_vision", type: "CLIP_VISION", from: "典型上游：IPAdapter Unified Loader", desc: "视觉编码器，提供外观细节特征" },
          { name: "insightface", type: "COMBO", from: "节点面板选择", desc: "人脸检测分析模型" },
          { name: "weight", type: "FLOAT", from: "节点面板调节", desc: "总注入强度" }
        ],
        outputs: [
          { type: "MODEL", to: "典型下游：KSampler 的 model 输入", desc: "注入后的模型" }
        ],
        why: "它是社区公认人脸相似度与画质平衡最好的 IPAdapter 人脸方案之一，常用于虚拟角色与写真类工作流。",
        params: [
          { name: "weight", kind: "浮点数", default: "1.0", desc: "身份嵌入强度，控制像不像参考图里的本人。" },
          { name: "weight_v2", kind: "浮点数", default: "1.0", desc: "图像嵌入强度，控制光影、质感等外观细节的还原程度。" },
          { name: "insightface", kind: "下拉选择", default: "CPU", desc: "人脸分析模型的运行设备。",
            options: [["CPU", "稳定不占显存，分析稍慢"], ["CUDA", "用显卡分析更快，显存紧张时慎用"]] }
        ],
        tips: "脸部崩坏时优先降低总 weight 并检查 FaceID 配套 LoRA 是否加载，而不是反复换参考图。"
      },
      {
        name: "IPAdapter Encoder", cat: "clip",
        brief: "把最多四组参考图预先编码成嵌入向量，供高级节点复用。",
        desc: "编码器节点把参考图提前转换成嵌入（Embeds，特征向量）并输出 EMBEDS 类型，交给 IPAdapter Advanced 的嵌入输入使用。适合两件事：一是多图平均时把「编码」与「注入」解耦，避免重复计算；二是把编码结果送入 Combine Embeds 等节点做进一步运算。它本身不改变模型，处于「图像到特征」的转换层。",
        inputs: [
          { name: "ipadapter", type: "IPADAPTER", from: "典型上游：IPAdapter Unified Loader", desc: "提供编码所需的权重上下文" },
          { name: "image1", type: "IMAGE", from: "典型上游：Load Image", desc: "第一组参考图" },
          { name: "image2", type: "IMAGE", from: "可选，Load Image", desc: "第二组参考图" },
          { name: "weight", type: "FLOAT", from: "节点面板调节", desc: "该组特征的权重" }
        ],
        outputs: [
          { type: "EMBEDS", to: "典型下游：IPAdapter Advanced 或 IPAdapter Combine Embeds", desc: "编码后的特征向量" }
        ],
        why: "把编码与注入两步拆开后，复杂工作流结构更清晰，同一组参考特征也能复用到多个分支。",
        params: [
          { name: "weight", kind: "浮点数", default: "1.0", desc: "该组特征的权重，影响这组参考图在后续注入时的话语权。" }
        ],
        tips: "多张同类风格图放进同一组输入即可自动取平均，不必先在外部合成。"
      },
      {
        name: "IPAdapter Combine Embeds", cat: "clip",
        brief: "用拼接、加减、平均等运算把多路嵌入向量合并为一路。",
        desc: "组合节点接收最多四路 EMBEDS 输入，按 concat（拼接）、add（相加）、subtract（相减）、average（平均）、norm average（归一化平均）等模式合并成一路输出。典型用法：把「风格参考」与「人物参考」分别编码后按比例平均，得到既保留风格又保留身份的混合特征。处于特征层，通常接在 IPAdapter Encoder 之后、IPAdapter Advanced 之前。",
        inputs: [
          { name: "embeds1", type: "EMBEDS", from: "典型上游：IPAdapter Encoder", desc: "第一路特征" },
          { name: "embeds2", type: "EMBEDS", from: "典型上游：IPAdapter Encoder", desc: "第二路特征" },
          { name: "method", type: "COMBO", from: "节点面板选择", desc: "合并运算方式" }
        ],
        outputs: [
          { type: "EMBEDS", to: "典型下游：IPAdapter Advanced 的嵌入输入", desc: "合并后的特征" }
        ],
        why: "想同时参考多张图时，逐层叠加模型节点容易互相干扰；在嵌入层面做数学运算更干净、更可控。",
        params: [
          { name: "method", kind: "下拉选择", default: "concat", desc: "多路特征之间的合并运算方式。",
            options: [["concat", "拼接保留全部信息，信息最完整"], ["average", "平均融合，风格与人物混合时常用"], ["subtract", "相减剔除特征，用来减去混入的污染风格"], ["norm average", "归一化平均，各路强度更均衡"]] }
        ],
        tips: "subtract 模式可以用来「减去」某张图的特征，常用于剔除混入的污染风格。"
      },
      {
        name: "Prep Image For ClipVision", cat: "image",
        brief: "按 CLIP Vision 模型要求裁切缩放参考图，并可附加锐化。",
        desc: "CLIP Vision 编码器对输入分辨率有固定要求，随意缩放会损失细节或引入形变。该节点提供多种裁切位置、插值算法选择与锐化强度调节，把参考图预处理成编码器最「容易读懂」的样子。位置在参考图加载之后、CLIP Vision 编码或 IPAdapter 注入之前，输出仍是 IMAGE。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：Load Image", desc: "原始参考图" },
          { name: "interpolation", type: "COMBO", from: "节点面板选择", desc: "缩放插值算法，如 LANCZOS" },
          { name: "crop_position", type: "COMBO", from: "节点面板选择", desc: "裁切位置，如居中" },
          { name: "sharpening", type: "FLOAT", from: "节点面板调节", desc: "锐化强度，0 为关闭" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：CLIP Vision Encode 或 IPAdapter 节点的图像输入", desc: "预处理后的参考图" }
        ],
        why: "风格迁移对参考图的纹理细节非常敏感，规范的预处理往往能把相似度提升一个明显档次。",
        params: [
          { name: "interpolation", kind: "下拉选择", default: "LANCZOS", desc: "缩放插值算法，LANCZOS 对纹理细节的保留最好。" },
          { name: "crop_position", kind: "下拉选择", default: "top", desc: "裁切位置，决定缩放时保留画面的哪一部分。",
            options: [["center", "居中裁切，主体在画面中间时用"], ["top", "保留上方，人脸常在画面偏上位置时更稳"], ["pad", "不裁切，补边保留完整画面"]] },
          { name: "sharpening", kind: "浮点数", default: "0.0", desc: "锐化强度，0 为关闭；参考图分辨率低时加一点锐化，布纹笔触更容易被学到。" }
        ],
        tips: "参考图分辨率偏低时适当增加锐化，布纹、笔触等细节更容易被学到。"
      },
      {
        name: "IPAdapter Model Loader", cat: "load",
        brief: "从模型目录手动加载指定文件，输出独立的 IPAdapter 权重。",
        desc: "不依赖预设的极简加载器：从 models/ipadapter 目录选择一个权重文件，反序列化后输出 IPADAPTER 类型。与 Unified Loader 的区别是它不做任何自动推断，用哪个文件完全由你决定，常用于加载社区训练的非官方 IPAdapter 权重或精确复现旧工作流。输出可接到任意应用节点的 ipadapter 输入。",
        inputs: [
          { name: "ipadapter_file", type: "COMBO", from: "models/ipadapter 目录中的文件列表", desc: "选择权重文件" }
        ],
        outputs: [
          { type: "IPADAPTER", to: "典型下游：各类 IPAdapter 应用节点的 ipadapter 输入", desc: "手动加载的 IPAdapter 权重" }
        ],
        why: "需要加载自定义或非预设 IPAdapter 权重时，只有这个手动加载器能指名道姓地读文件。",
        params: [
          { name: "ipadapter_file", kind: "下拉选择", default: "—", desc: "models/ipadapter 目录里的权重文件，文件名通常带 PLUS、FACEID 等字样标明用途。" }
        ],
        tips: ""
      },
      {
        name: "IPAdapter InsightFace Loader", cat: "load",
        brief: "加载 InsightFace 人脸分析模型，供 FaceID 系列节点使用。",
        desc: "在 buffalo_l 与 antelopev2 两个模型包中选一个，用指定计算设备加载 InsightFace 人脸分析器，输出 INSIGHTFACE 类型。它服务的对象是 IPAdapter FaceID 系列应用节点：FaceID 靠它从参考图中提取人脸身份向量。显存充裕可选 CUDA 提速，求稳或显存紧张选 CPU。",
        inputs: [
          { name: "provider", type: "COMBO", from: "节点面板选择", desc: "CPU、CUDA 等运行设备" },
          { name: "model_name", type: "COMBO", from: "节点面板选择", desc: "人脸分析模型包" }
        ],
        outputs: [
          { type: "INSIGHTFACE", to: "典型下游：IPAdapter FaceID 系列节点的 insightface 输入", desc: "加载好的人脸分析器" }
        ],
        why: "FaceID 应用节点自身不带人脸分析能力，这个加载器是 FaceID 工作流的必备前置。",
        params: [
          { name: "provider", kind: "下拉选择", default: "CPU", desc: "人脸分析运行设备，CPU 稳定不占显存，CUDA 更快。" },
          { name: "model_name", kind: "下拉选择", default: "buffalo_l", desc: "人脸检测识别模型包，两个官方包效果接近，按仓库说明下载其一。" }
        ],
        tips: ""
      },
      {
        name: "IPAdapter Unified Loader FaceID", cat: "load",
        brief: "FaceID 专用统一加载器，自动备齐权重、LoRA 与人脸分析器。",
        desc: "Unified Loader 的 FaceID 分支：选中 FACEID 系预设后，自动加载对应的 FaceID 权重、配套 LoRA（强度由 lora_strength 控制）与 InsightFace 人脸分析器，输出挂好 LoRA 的底模与打包好的 FaceID 管线。相比普通 Unified Loader，它额外处理了 FaceID 必需的 LoRA 挂载，免去手动补线。",
        inputs: [
          { name: "model", type: "MODEL", from: "典型上游：Load Checkpoint / LoRA 链", desc: "底模" },
          { name: "preset", type: "COMBO", from: "节点面板选择", desc: "FaceID 系预设档位" },
          { name: "lora_strength", type: "FLOAT", from: "节点面板调节", desc: "配套 LoRA 的挂载强度" }
        ],
        outputs: [
          { type: "MODEL", to: "典型下游：LoRA 链或采样器", desc: "挂载配套 LoRA 后的底模" },
          { type: "IPADAPTER", to: "典型下游：IPAdapter FaceID 系列节点的 ipadapter 输入", desc: "含权重与人脸分析器的管线包" }
        ],
        why: "FaceID 方案必须同时就位权重、LoRA、人脸分析三样东西，这个节点一次配齐。",
        params: [
          { name: "preset", kind: "下拉选择", default: "FACEID PLUS V2", desc: "FaceID 预设档位，决定加载哪套权重与 LoRA。",
            options: [["FACEID", "基础人脸身份版"], ["FACEID PLUS V2", "叠加图像嵌入，人脸保真度更高，社区首选"], ["FACEID PORTRAIT (style transfer)", "人像风格化方向"]] },
          { name: "lora_strength", kind: "浮点数", default: "0.6", desc: "FaceID 配套 LoRA 的强度，默认 0.6，脸不像时先调它。" },
          { name: "provider", kind: "下拉选择", default: "CPU", desc: "InsightFace 的运行设备，显存紧张保持 CPU。" }
        ],
        tips: ""
      },
      {
        name: "IPAdapter Embeds", cat: "model",
        brief: "直接用嵌入向量注入模型，跳过图像编码步骤。",
        desc: "与普通 IPAdapter 节点的区别在输入端：它不接受图片，而是接受编码好的 EMBEDS，正向必填、负向可选。适合先把参考图编码成嵌入再反复注入，或对嵌入做组合运算的场景，省去重复编码的开销。权重、权重曲线与生效区间的控制与 Advanced 版一致。",
        inputs: [
          { name: "model", type: "MODEL", from: "典型上游：Load Checkpoint / LoRA 链", desc: "待注入的大模型" },
          { name: "ipadapter", type: "IPADAPTER", from: "典型上游：Unified Loader 或 Model Loader", desc: "IPAdapter 权重" },
          { name: "pos_embed", type: "EMBEDS", from: "典型上游：IPAdapter Encoder", desc: "正向参考特征" },
          { name: "neg_embed", type: "EMBEDS", from: "可选，IPAdapter Encoder", desc: "负向参考特征，用于剔除某些特征" }
        ],
        outputs: [
          { type: "MODEL", to: "典型下游：KSampler 的 model 输入", desc: "注入后的模型" }
        ],
        why: "嵌入解耦后可以保存、复用、运算再注入，是复杂 IPAdapter 工作流的中间枢纽。",
        params: [
          { name: "weight", kind: "浮点数", default: "1.0", desc: "注入强度，控制嵌入对画面的影响。" },
          { name: "weight_type", kind: "下拉选择", default: "linear", desc: "强度随采样步数变化的曲线，含义与 Advanced 版相同。" }
        ],
        tips: ""
      },
      {
        name: "IPAdapter Tiled", cat: "model",
        brief: "把参考图切块编码再注入，高分辨率参考图的专用解法。",
        desc: "CLIP Vision 编码超高分辨率参考图会丢失细节或强拉伸变形。该节点把参考图切成小块分别编码，再把块特征拼回注入，顺带输出切好的图块与遮罩便于检查切块效果，内置 sharpening 还能给参考图做锐化预处理。除 MODEL 外多出 tiles 与 masks 两路输出。",
        inputs: [
          { name: "model", type: "MODEL", from: "典型上游：Load Checkpoint / LoRA 链", desc: "待注入的大模型" },
          { name: "ipadapter", type: "IPADAPTER", from: "典型上游：Unified Loader", desc: "IPAdapter 权重" },
          { name: "image", type: "IMAGE", from: "典型上游：Load Image", desc: "高分辨率参考图" }
        ],
        outputs: [
          { type: "MODEL", to: "典型下游：KSampler 的 model 输入", desc: "注入后的模型" },
          { type: "IMAGE", to: "典型下游：Save Image 预览", desc: "切块结果 tiles，用于检查" },
          { type: "MASK", to: "典型下游：Save Image 预览", desc: "切块遮罩 masks，用于检查" }
        ],
        why: "参考图很大或细节极多时普通编码会糊成一团，分块编码是官方给出的正解。",
        params: [
          { name: "weight", kind: "浮点数", default: "1.0", desc: "注入强度。" },
          { name: "sharpening", kind: "浮点数", default: "0.0", desc: "对参考图的锐化强度，0 为关闭，低清参考图可小幅开启。" }
        ],
        tips: ""
      },
      {
        name: "IPAdapter Batch", cat: "model",
        brief: "一批参考图逐张注入对应帧，图批对帧批的专用节点。",
        desc: "普通节点把整批参考图取平均，Batch 版把第 n 张参考图的特征注入第 n 帧的潜空间，适合给逐帧生成的序列施加逐帧变化的引导，例如让动画跟随一段参考视频的节奏。encode_batch_size 控制编码时一次送几张，显存紧张时调小。",
        inputs: [
          { name: "model", type: "MODEL", from: "典型上游：Load Checkpoint / LoRA 链", desc: "待注入的大模型" },
          { name: "ipadapter", type: "IPADAPTER", from: "典型上游：Unified Loader", desc: "IPAdapter 权重" },
          { name: "image", type: "IMAGE", from: "典型上游：视频加载或图片序列", desc: "批次参考图，数量与帧数对应" }
        ],
        outputs: [
          { type: "MODEL", to: "典型下游：KSampler 的 model 输入", desc: "注入后的模型" }
        ],
        why: "做逐帧控制或参考视频驱动的动画时，逐张对应注入是平均注入做不到的能力。",
        params: [
          { name: "weight", kind: "浮点数", default: "1.0", desc: "注入强度。" },
          { name: "encode_batch_size", kind: "整数", default: "0", desc: "编码参考图时的子批大小，0 为整批一次算完，爆显存就调成 4 或 8。" }
        ],
        tips: ""
      },
      {
        name: "IPAdapter Precise Style Transfer", cat: "model",
        brief: "社区精选风格迁移节点，用 style_boost 精调画风力度。",
        desc: "来自 Unified Loader Community 体系的风格迁移特化节点：在 Advanced 的基础上把风格与内容拆成独立旋钮，style_boost 专门抬升画风还原度而不干扰构图。需要配合 Unified Loader 的 Community 预设或手动加载对应权重使用。",
        inputs: [
          { name: "model", type: "MODEL", from: "典型上游：Load Checkpoint / LoRA 链", desc: "待注入的大模型" },
          { name: "ipadapter", type: "IPADAPTER", from: "典型上游：Unified Loader 选 Community 预设", desc: "IPAdapter 权重" },
          { name: "image", type: "IMAGE", from: "典型上游：Load Image", desc: "画风参考图" }
        ],
        outputs: [
          { type: "MODEL", to: "典型下游：KSampler 的 model 输入", desc: "注入后的模型" }
        ],
        why: "纯画风迁移时它比通用节点更精准，style_boost 让「像几分」变成可量化的调节。",
        params: [
          { name: "weight", kind: "浮点数", default: "1.0", desc: "总体注入强度。" },
          { name: "style_boost", kind: "浮点数", default: "1.0", desc: "画风加强项，正数强化画风还原，负数弱化，可超 1 大胆调。" }
        ],
        tips: ""
      },
      {
        name: "IPAdapter Regional Conditioning", cat: "cond",
        brief: "给不同区域挂不同参考图，实现分区参考的分区注入。",
        desc: "把参考图限定在遮罩区域内生效：输入参考图与可选遮罩，输出 IPADAPTER_PARAMS 区域参数包与更新后的正负条件，交给支持参数包的注入链路。典型用法是画面左边参考一张图、右边参考另一张图，各自用遮罩划定势力范围互不打架。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：Load Image", desc: "该区域的参考图" },
          { name: "mask", type: "MASK", from: "可选，遮罩生成节点", desc: "划定参考图生效的区域" },
          { name: "positive", type: "CONDITIONING", from: "可选，正向 CLIP Text Encode", desc: "待更新的正向条件" },
          { name: "negative", type: "CONDITIONING", from: "可选，负向 CLIP Text Encode", desc: "待更新的负向条件" }
        ],
        outputs: [
          { type: "IPADAPTER_PARAMS", to: "典型下游：支持区域参数的应用链路", desc: "区域注入参数包" },
          { type: "CONDITIONING", to: "典型下游：KSampler 的 positive 输入", desc: "更新后的正向条件" },
          { type: "CONDITIONING", to: "典型下游：KSampler 的 negative 输入", desc: "更新后的负向条件" }
        ],
        why: "一张图想同时借两三个参考的不同部位时，区域参数是唯一不打架的做法。",
        params: [
          { name: "image_weight", kind: "浮点数", default: "1.0", desc: "该区域参考图的注入强度。" },
          { name: "prompt_weight", kind: "浮点数", default: "1.0", desc: "遮罩区内提示词与参考图的相对权重。" }
        ],
        tips: ""
      },
      {
        name: "IPAdapter Weights", cat: "util",
        brief: "把逗号分隔的权重序列展开成随帧变化的权重策略。",
        desc: "输入一串形如 1.0, 0.5, 0.0 的数值，配合 timing 曲线与帧区间设置，把它展开成完整的 WEIGHTS_STRATEGY 策略包，同时输出权重序列与其反相序列，供逐帧注入使用。常用于让 IPAdapter 的作用强度随动画帧数有节奏地起伏。",
        inputs: [
          { name: "weights", type: "STRING", from: "节点面板填写", desc: "逗号分隔的权重数值序列" },
          { name: "image", type: "IMAGE", from: "可选，视频加载节点", desc: "配套的帧序列，用于对齐帧数" }
        ],
        outputs: [
          { type: "FLOAT", to: "典型下游：需要权重序列的节点", desc: "权重序列" },
          { type: "FLOAT", to: "典型下游：需要反相权重的节点", desc: "反相权重序列" },
          { type: "INT", to: "典型下游：需要帧数的节点", desc: "总帧数" },
          { type: "WEIGHTS_STRATEGY", to: "典型下游：支持权重策略的注入节点", desc: "权重策略包" }
        ],
        why: "想让参考图影响力随时间波动，靠一条权重序列比手调无数关键帧直接得多。",
        params: [
          { name: "weights", kind: "文本", default: "1.0, 0.0", desc: "逗号分隔的权重值，按帧依次取用，可以只写几个值由策略循环展开。" },
          { name: "timing", kind: "下拉选择", default: "linear", desc: "权重序列的时间展开方式，custom 按原样、linear 线性过渡、random 随机抖动。" },
          { name: "frames", kind: "整数", default: "0", desc: "目标帧数，0 表示按输入图像的帧数对齐。" }
        ],
        tips: ""
      }
    ]
  });

  /* ---------------- 2. ComfyUI-ReActor ---------------- */
  window.COMFY_DATA.nodePackages.push({
    id: "reactor",
    name: "ComfyUI-ReActor",
    author: "Gourieff",
    official: false,
    category: "换脸",
    install: "在 ComfyUI-Manager 里搜索 ReActor 安装，首次使用需按仓库说明安装 InsightFace 依赖并下载 inswapper_128 换脸模型",
    summary: "ReActor 是 ComfyUI 中最流行的换脸（Face Swap，人脸替换）插件，基于 inswapper_128 换脸模型与 InsightFace 人脸检测，把源图中的人脸替换到目标图或整组帧上，并内置 GFPGAN 与 CodeFormer 面部修复。它支持单图、图批与视频帧序列，也能加载多图融合的自定义人脸模型。",
    why: "它把换脸封装成一个普通节点，可以嵌进任意工作流的任意位置；配合遮罩控制与修复节点能逼近无痕效果。视频换脸场景还有专门的快速节点与显存优化。",
    tags: ["换脸", "人脸修复"],
    nodes: [
      {
        name: "ReActorFastFaceSwap", cat: "image",
        brief: "轻量高速换脸节点，适合批量图片与视频帧序列。",
        desc: "快速版换脸节点。它用 InsightFace 在源图中定位人脸并提取特征，再用 inswapper_128 模型把这张脸替换到输入图上，省去了完整版的大部分附加选项，换来明显的速度与内存优势。位于图像处理段：输入目标图 input_image 与源脸图 source_image，输出换好脸的 IMAGE，可直接接 Save Image 或视频合成节点。处理上千帧的长序列时，它比完整版更不容易爆显存。",
        inputs: [
          { name: "input_image", type: "IMAGE", from: "典型上游：Load Image 或 VHS 加载的视频帧", desc: "要被换脸的目标图" },
          { name: "source_image", type: "IMAGE", from: "典型上游：Load Image", desc: "提供脸部的源图" },
          { name: "face_model", type: "FACE_MODEL", from: "可选，ReActorBuildFaceModel", desc: "预构建的人脸模型，可代替源图" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：Save Image 或 VHS Video Combine", desc: "换脸完成的图像" }
        ],
        why: "视频换脸动辄上千帧，完整版参数在批处理中既慢又不稳定，快速版正是为此而生。",
        params: [
          { name: "swap_model", kind: "下拉选择", default: "inswapper_128.onnx", desc: "换脸模型文件，inswapper_128 是社区默认标配。" }
        ],
        tips: "源图请用光照均匀、无遮挡的正面清晰脸。提醒：换脸属于对肖像的深度合成，务必取得当事人授权并遵守当地法律。"
      },
      {
        name: "ReActorFaceSwap", cat: "image",
        brief: "功能完整的换脸主节点，支持模型选择、多脸指定与面部修复。",
        desc: "ReActor 的核心节点。在快速版的换脸流程之外，它还提供：swap_model 选择换脸模型（默认 inswapper_128）；faces_index 指定替换目标图中第几张脸（从 0 开始编号，可写 0,1 组合）；face_restore_model 选择 GFPGAN 或 CodeFormer 对换完的脸做修复，并用 visibility 与 codeformer_weight 控制修复强度；还能加载 ReActorBuildFaceModel 生成的自定义人脸模型。输入目标图与源图，输出换脸后的 IMAGE。",
        inputs: [
          { name: "input_image", type: "IMAGE", from: "典型上游：Load Image 或上游生成结果", desc: "要被换脸的目标图" },
          { name: "source_image", type: "IMAGE", from: "典型上游：Load Image", desc: "提供脸部的源图" },
          { name: "face_model", type: "FACE_MODEL", from: "可选，ReActorBuildFaceModel", desc: "自定义人脸模型" },
          { name: "swap_model", type: "COMBO", from: "节点面板选择", desc: "换脸模型，默认 inswapper_128" },
          { name: "faces_index", type: "STRING", from: "节点面板填写", desc: "要替换的脸的序号，如 0 或 0,1" },
          { name: "face_restore_model", type: "COMBO", from: "节点面板选择", desc: "面部修复模型，如 GFPGANv1.4、CodeFormer" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：Save Image 或后续修复、放大链", desc: "换脸完成的图像" }
        ],
        why: "精细控制换脸范围与修复强度是商用出图的基本要求，这个节点把整条换脸链收进了一个节点。",
        params: [
          { name: "swap_model", kind: "下拉选择", default: "inswapper_128.onnx", desc: "换脸模型文件，默认 inswapper_128 即可满足大多数场景。" },
          { name: "faces_index", kind: "文本", default: "0", desc: "替换目标图中第几张脸，从 0 开始编号，写 0,1 表示同时换两张。" },
          { name: "face_restore_model", kind: "下拉选择", default: "none", desc: "换完脸之后对面部做修复的模型。",
            options: [["none", "不修复，速度最快"], ["GFPGANv1.4", "通用修复，快而稳"], ["CodeFormer", "细节更好，可调保真权重，稍慢"]] },
          { name: "face_restore_visibility", kind: "浮点数", default: "1.0", desc: "修复结果与原脸的混合比例，1 为全用修复脸，调低保留更多原脸特征。" },
          { name: "codeformer_weight", kind: "浮点数", default: "0.5", desc: "仅 CodeFormer 生效，越高画面越清晰整齐但越容易失真，0.5 左右比较平衡。" }
        ],
        tips: "faces_index 填 0 表示只换图中第一个人脸。合规提醒：处理真实人物面孔前必须取得肖像权授权，不得用于伪造、冒充、诽谤或欺诈内容。"
      },
      {
        name: "ReActorBuildFaceModel", cat: "image",
        brief: "从多张人脸图片打包生成可复用的自定义人脸模型。",
        desc: "单张源图的特征有限，容易受表情和角度影响。该节点接收一组人脸图片（把多张图组成批次输入），从每张脸上提取特征并平均，生成一个 safetensors 格式的人脸模型文件，可在 ReActorFaceSwap 的 face_model 输入处复用。用同一人多角度照片构建的模型，在不同镜头与光线下都更稳定。",
        inputs: [
          { name: "images", type: "IMAGE", from: "典型上游：多张 Load Image 组成的批次或视频帧", desc: "同一人的人脸图片集合" },
          { name: "face_model", type: "FACE_MODEL", from: "可选，已有的人脸模型", desc: "在已有模型基础上继续融合" }
        ],
        outputs: [
          { type: "FACE_MODEL", to: "典型下游：ReActorFaceSwap 的 face_model 输入", desc: "融合后的人脸模型" }
        ],
        why: "多人脸融合模型的稳定性远高于反复挑选单张源图，是视频换脸前的标准准备步骤。",
        params: [
          { name: "face_model_name", kind: "文本", default: "default", desc: "保存模式启用时使用的模型文件名，多个角色可以用不同名字分别管理。" },
          { name: "save_mode", kind: "开关", default: "true", desc: "开启后把融合结果保存进 models 目录长期复用，关闭则只在本次输出。" },
          { name: "compute_method", kind: "下拉选择", default: "Mean", desc: "多张脸特征的融合算法。",
            options: [["Mean", "取平均，最常用最稳"], ["Median", "取中值，能抗个别异常照片"], ["Mode", "取众数，贴近出现最多的特征"]] }
        ],
        tips: "建议用同一人 5 到 20 张不同角度的清晰照片；启用保存模式会把模型存进 models 目录长期复用。合规提醒：采集他人人脸照片需获得授权。"
      },
      {
        name: "ReActorMaskHelper", cat: "mask",
        brief: "根据源脸位置自动生成遮罩，控制换脸作用的区域。",
        desc: "有时只需要换脸，而不想动到发型、耳饰或脖子。该节点依据检测到的人脸范围生成一张羽化遮罩（MASK），可调节裁切系数、遮罩尺寸与模糊量等参数，把换脸效果限制在合适的范围内。输出 MASK，配合遮罩应用节点与原图、换脸结果做混合，实现更自然的过渡。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：目标图", desc: "用于确定人脸位置的图像" },
          { name: "face_image", type: "IMAGE", from: "典型上游：源脸图", desc: "参考脸图" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：遮罩混合或局部处理节点", desc: "围绕人脸的羽化遮罩" }
        ],
        why: "裸换脸常在发际线、下颌边缘出现色差与接缝，用遮罩收窄作用域是最有效的补救手段。",
        params: [
          { name: "bbox_crop_factor", kind: "浮点数", default: "3.0", desc: "人脸检测框向外扩的倍数，决定遮罩覆盖脸周多大范围，调大更容易盖住发际线。" },
          { name: "morphology_distance", kind: "整数", default: "0", desc: "遮罩形态学膨胀收缩的像素数，正数扩大、负数缩小，用来微调作用范围。" },
          { name: "blur_radius", kind: "整数", default: "9", desc: "遮罩边缘的模糊半径，换脸边缘出现生硬接缝时调大。" },
          { name: "sigma_factor", kind: "浮点数", default: "1.0", desc: "模糊强度系数，与模糊半径配合控制过渡的柔和程度。" }
        ],
        tips: "边缘生硬时加大模糊量。提醒：对真实人物换脸请确认已取得肖像权授权，遵守肖像权与深度合成相关法规。"
      },
      {
        name: "ReActorRestoreFace", cat: "image",
        brief: "独立的人脸修复节点，用 GFPGAN 或 CodeFormer 提升面部质量。",
        desc: "该节点只做修复不做换脸：对面部区域应用 GFPGAN 或 CodeFormer 模型，把模糊、低分辨率或有伪影的脸修复得清晰自然，用 visibility 控制修复结果与原图的混合比例。适合放在换脸节点之后作为收尾，也可以单独用于老照片、低清素材的面部增强。输入输出均为 IMAGE。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：换脸结果或任意人脸图", desc: "待修复的图像" },
          { name: "face_restore_model", type: "COMBO", from: "节点面板选择", desc: "GFPGAN 或 CodeFormer 修复模型" },
          { name: "face_restore_visibility", type: "FLOAT", from: "节点面板调节", desc: "修复效果与原图的混合比例" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：Save Image 或放大链", desc: "修复后的图像" }
        ],
        why: "换脸结果的脸部常常发糊，独立的修复节点让「先换脸、后修复」的流程可以灵活拆分与调参。",
        params: [
          { name: "face_restore_model", kind: "下拉选择", default: "GFPGANv1.4", desc: "面部修复模型。",
            options: [["GFPGANv1.4", "通用修复，快而稳"], ["CodeFormer", "细节更好，可调保真权重，稍慢"], ["none", "不修复"]] },
          { name: "face_restore_visibility", kind: "浮点数", default: "1.0", desc: "修复结果与原图的混合比例，1 为全用修复结果，调低保留更多原画面。" },
          { name: "codeformer_weight", kind: "浮点数", default: "0.5", desc: "仅 CodeFormer 生效，越高画面越「整齐」但越容易失真。" }
        ],
        tips: "提醒：人脸属于敏感个人信息，处理他人照片前请确认已获得授权，并遵守肖像权与个人信息保护法规。修复权重越高画面越「整齐」但越容易失真。"
      },
      {
        name: "ReActorLoadFaceModel", cat: "load",
        brief: "从人脸模型目录加载已保存的自定义人脸模型。",
        desc: "读取 models/reactor/faces 目录下的 safetensors 人脸模型文件，输出 FACE_MODEL 供换脸节点的 face_model 输入使用，同时输出模型名文本。与 BuildFaceModel 现场融合不同，它加载的是之前存好的结果，适合把做好的脸部模型跨工作流、跨项目复用。",
        inputs: [
          { name: "face_model", type: "COMBO", from: "models/reactor/faces 目录中的文件列表", desc: "选择人脸模型文件" }
        ],
        outputs: [
          { type: "FACE_MODEL", to: "典型下游：ReActorFaceSwap 的 face_model 输入", desc: "加载好的人脸模型" },
          { type: "STRING", to: "典型下游：需要模型名的节点", desc: "模型文件名" }
        ],
        why: "做好一次人脸模型后反复使用时，加载器比每次重新融合快得多也更稳定。",
        params: [
          { name: "face_model", kind: "下拉选择", default: "default", desc: "models/reactor/faces 里的人脸模型文件，选 none 则输出空值。" }
        ],
        tips: ""
      },
      {
        name: "ReActorSaveFaceModel", cat: "image",
        brief: "把输入图片中的人脸提取保存为人脸模型文件。",
        desc: "从一张含人脸的图片中检测并选定人脸（select_face_index 指定取第几张），打包成 safetensors 存入人脸模型目录，文件名由 face_model_name 决定。也可以不接图片，直接输入已构建的 FACE_MODEL 转存。保存后即可用 LoadFaceModel 或换脸节点复用。",
        inputs: [
          { name: "image", type: "IMAGE", from: "可选，Load Image", desc: "含人脸的源图" },
          { name: "face_model", type: "FACE_MODEL", from: "可选，ReActorBuildFaceModel", desc: "直接转存的人脸模型" }
        ],
        outputs: [],
        why: "把融合好的脸落盘归档，是团队共享与长期复用最省心的一步。",
        params: [
          { name: "face_model_name", kind: "文本", default: "default", desc: "保存用的模型文件名，同一目录下同名文件会被覆盖。" },
          { name: "select_face_index", kind: "整数", default: "0", desc: "图中有多张脸时取第几张，从 0 开始编号。" }
        ],
        tips: ""
      },
      {
        name: "ReActorFaceBoost", cat: "image",
        brief: "生成 FACE_BOOST 配置包，让换脸节点顺手做面部增强。",
        desc: "它本身不处理图像，而是把面部增强设置（启停、修复模型、插值算法、可见度、CodeFormer 权重以及是否在主流程后整体再修复一次）打包输出 FACE_BOOST，接到换脸节点的 face_boost 输入，让换脸与增强一次完成。",
        inputs: [],
        outputs: [
          { type: "FACE_BOOST", to: "典型下游：ReActorFaceSwap 的 face_boost 输入", desc: "面部增强配置包" }
        ],
        why: "换脸加修复一气呵成，省去单独串修复节点的麻烦，配置还能独立保存复用。",
        params: [
          { name: "enabled", kind: "开关", default: "true", desc: "是否启用面部增强。" },
          { name: "boost_model", kind: "下拉选择", default: "GFPGANv1.4", desc: "修复模型，GFPGAN 系快而稳，CodeFormer 细节更好。" },
          { name: "visibility", kind: "浮点数", default: "1.0", desc: "增强结果与原脸的混合比例。" },
          { name: "codeformer_weight", kind: "浮点数", default: "0.5", desc: "仅 CodeFormer 生效的保真权重，越高越清晰也越容易失真。" },
          { name: "restore_with_main_after", kind: "开关", default: "false", desc: "换脸主流程完成后再对全图面部整体修复一次，速度更慢但更干净。" }
        ],
        tips: ""
      }
    ]
  });

  /* ---------------- 3. ComfyUI_InstantID ---------------- */
  window.COMFY_DATA.nodePackages.push({
    id: "instantid",
    name: "ComfyUI_InstantID",
    author: "cubiq",
    official: false,
    category: "人物一致性",
    install: "在 ComfyUI-Manager 里搜索 InstantID 安装，并按仓库说明下载 InstantID 模型与 antelopev2 人脸分析模型放入对应目录",
    summary: "InstantID 用一张人脸参考图实现零训练的人物一致性。它同时使用人脸身份嵌入、IdentityNet 与 ControlNet 三重机制，在锁定长相的同时允许自由改变姿态、表情、服装与场景，是目前开源生态中效果最强的免训练人物一致性方案之一。",
    why: "与训练 LoRA 的方案相比零门槛、即时可用；与普通 IPAdapter 相比，它对人脸结构与身份的保持能力显著更强。虚拟形象、写真与分镜故事板工作流的核心组件。",
    tags: ["人物一致性", "人脸", "IPAdapter"],
    nodes: [
      {
        name: "InstantIDModelLoader", cat: "load",
        brief: "加载 InstantID 的 IP-Adapter 主模型文件。",
        desc: "负责把 ip-adapter.bin（InstantID 的 IP-Adapter 权重，包含 IdentityNet 所需的键值）读入内存，输出 INSTANTID 类型供应用节点使用。它是 InstantID 工作流的第一环，通常与 InstantIDFaceAnalysis 一起放在加载区。模型文件需按仓库说明放入指定目录后才会出现在下拉列表中。",
        inputs: [
          { name: "instantid_file", type: "COMBO", from: "models/instantid 目录中的文件列表", desc: "选择 InstantID 模型文件" }
        ],
        outputs: [
          { type: "INSTANTID", to: "典型下游：Apply InstantID 的 instantid 输入", desc: "InstantID 主模型" }
        ],
        why: "IdentityNet 与普通 IPAdapter 权重结构不同，必须用专用加载器，复用普通 IPAdapter 节点会直接报错。",
        params: [
          { name: "instantid_file", kind: "下拉选择", default: "ip-adapter.bin", desc: "InstantID 主模型文件，放入 models/instantid 目录后出现在下拉列表，官方只有 ip-adapter.bin 一个。" }
        ],
        tips: "bin 文件放入 models/instantid 目录；加载失败多半是路径或文件名问题。提醒：使用他人面部数据请遵守肖像权与个人信息保护法规。"
      },
      {
        name: "InstantIDFaceAnalysis", cat: "load",
        brief: "加载 InsightFace 人脸分析模型，用于检测与提取人脸特征。",
        desc: "节点加载 InsightFace（开源人脸检测与识别库）的 antelopev2 等模型包，输出 FACEANALYSIS 类型给应用节点。provider 参数选择运行设备：显存紧张时可改用 CPU，人脸检测与嵌入提取稍慢但不占显存。这一环节负责「看懂」参考图里的脸，是整条链路的前置条件。",
        inputs: [
          { name: "provider", type: "COMBO", from: "节点面板选择", desc: "CPU 或 CUDA 等运行设备" }
        ],
        outputs: [
          { type: "FACEANALYSIS", to: "典型下游：Apply InstantID 的 insightface 输入", desc: "人脸分析器" }
        ],
        why: "InstantID 对人脸特征提取的依赖比普通 IPAdapter 深得多，没有这一环整条链无法工作。",
        params: [
          { name: "provider", kind: "下拉选择", default: "CPU", desc: "人脸分析模型运行在什么设备上。",
            options: [["CPU", "不占显存，检测稍慢，显存紧张首选"], ["CUDA", "用显卡跑检测更快，占显存"], ["ROCM", "AMD 显卡用这个选项"], ["CoreML", "苹果芯片设备用这个选项"]] }
        ],
        tips: "首次运行报缺模型时，把 antelopev2 模型包解压到 models/insightface 目录。提醒：采集与分析他人人脸前请取得授权。"
      },
      {
        name: "Apply InstantID", cat: "model",
        brief: "核心应用节点，把人脸身份注入模型并更新正负条件。",
        desc: "InstantID 的心脏。它接收模型、人脸分析器、参考脸图与正负条件，内部同时完成两件事：用 InsightFace 提取人脸身份嵌入并经 IP-Adapter 通道注入模型；通过 IdentityNet 把人脸结构信息强约束到去噪过程；最后输出修改后的 MODEL 与更新后的正负 CONDITIONING。weight 控制身份强度，start_at 与 end_at 控制生效的采样区间，weight_type 提供多种衰减曲线。",
        inputs: [
          { name: "instantid", type: "INSTANTID", from: "典型上游：InstantIDModelLoader", desc: "InstantID 主模型" },
          { name: "insightface", type: "FACEANALYSIS", from: "典型上游：InstantIDFaceAnalysis", desc: "人脸分析器" },
          { name: "image", type: "IMAGE", from: "典型上游：Load Image", desc: "人脸参考图" },
          { name: "model", type: "MODEL", from: "典型上游：Load Checkpoint / LoRA 链", desc: "底模" },
          { name: "positive", type: "CONDITIONING", from: "典型上游：正向 CLIP Text Encode", desc: "正向条件" },
          { name: "negative", type: "CONDITIONING", from: "典型上游：负向 CLIP Text Encode", desc: "负向条件" },
          { name: "weight", type: "FLOAT", from: "节点面板调节", desc: "身份注入强度" }
        ],
        outputs: [
          { type: "MODEL", to: "典型下游：KSampler 的 model 输入", desc: "注入身份后的模型" },
          { type: "CONDITIONING", to: "典型下游：KSampler 的 positive 输入", desc: "更新后的正向条件" },
          { type: "CONDITIONING", to: "典型下游：KSampler 的 negative 输入", desc: "更新后的负向条件" }
        ],
        why: "一个节点同时完成模型注入与条件改写，免去手动连接多个节点的复杂度，也让身份强度可以统一调节。",
        params: [
          { name: "weight", kind: "浮点数", default: "0.8", desc: "身份注入强度，0.8 到 1.0 起步，太高容易脸部僵硬、过度贴合参考图。" },
          { name: "start_at", kind: "浮点数", default: "0.0", desc: "从采样进度的哪个比例开始生效，0 表示从头干预。" },
          { name: "end_at", kind: "浮点数", default: "1.0", desc: "到采样进度的哪个比例停止干预，调低可以让画面后段自由收尾。" },
          { name: "weight_type", kind: "下拉选择", default: "linear", desc: "身份强度随采样步数的衰减曲线。",
            options: [["linear", "全程恒定，最常用"], ["ease in-out", "中段最强、开头结尾减弱，效果更自然"]] }
        ],
        tips: "合规提醒：人脸是敏感生物特征，使用他人照片前必须获得明确授权，遵守肖像权法规，严禁制作冒充他人的内容。weight 建议 0.8 到 1.0 配合线性权重曲线起步。"
      },
      {
        name: "Apply InstantID Advanced", cat: "model",
        brief: "进阶应用节点，把身份注入与姿势约束分离并各自控制强度。",
        desc: "高级版把 InstantID 的两条能力拆开：IP-Adapter 身份注入由权重参数控制，内置的 ControlNet（人脸关键点约束）由 cn_strength 控制，还可以外接一个独立的 CONTROL_NET（如 OpenPose）替代内置约束。这样既能「只锁身份不锁姿势」，也能「只锁姿势轻锁身份」，组合自由度远高于基础版。输出同样是 MODEL 与正负 CONDITIONING。",
        inputs: [
          { name: "instantid", type: "INSTANTID", from: "典型上游：InstantIDModelLoader", desc: "InstantID 主模型" },
          { name: "insightface", type: "FACEANALYSIS", from: "典型上游：InstantIDFaceAnalysis", desc: "人脸分析器" },
          { name: "image", type: "IMAGE", from: "典型上游：Load Image", desc: "人脸参考图" },
          { name: "model", type: "MODEL", from: "典型上游：Load Checkpoint / LoRA 链", desc: "底模" },
          { name: "positive", type: "CONDITIONING", from: "典型上游：正向 CLIP Text Encode", desc: "正向条件" },
          { name: "negative", type: "CONDITIONING", from: "典型上游：负向 CLIP Text Encode", desc: "负向条件" },
          { name: "control_net", type: "CONTROL_NET", from: "可选，ControlNet Loader", desc: "外接姿势控制网络" }
        ],
        outputs: [
          { type: "MODEL", to: "典型下游：KSampler 的 model 输入", desc: "注入后的模型" },
          { type: "CONDITIONING", to: "典型下游：KSampler 的 positive / negative 输入", desc: "更新后的正负条件" }
        ],
        why: "想让人物大改姿势或角度时，基础版容易连构图一起锁死；Advanced 的分离控制正是解法。",
        params: [
          { name: "ip_weight", kind: "浮点数", default: "0.8", desc: "IP-Adapter 身份注入强度，控制像不像参考脸。" },
          { name: "cn_strength", kind: "浮点数", default: "0.8", desc: "内置人脸结构约束的强度，想大改姿势或角度时降到 0.5 以下甚至为 0。" },
          { name: "start_at", kind: "浮点数", default: "0.0", desc: "从采样进度的哪个比例开始生效。" },
          { name: "end_at", kind: "浮点数", default: "1.0", desc: "到采样进度的哪个比例停止干预。" }
        ],
        tips: "想大改姿势时把内置约束强度降到 0.5 以下甚至为零，只靠身份权重锁脸。提醒：生成真人形象务必注意肖像权合规。"
      },
      {
        name: "Face Keypoints Preprocessor", cat: "image",
        brief: "可视化人脸关键点并输出人脸边界框，用于检查与调试。",
        desc: "调试节点。它调用已加载的 InsightFace 对输入图做人脸检测，把检测到的关键点直接画在图上输出，同时输出人脸边界框（FACE_BBOX 类型）供其他节点使用。典型用法是把它串在参考图后面，肉眼确认检测到的人脸位置与关键点是否正确，再决定是否进入 Apply InstantID。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：Load Image", desc: "待检测的人脸参考图" },
          { name: "insightface", type: "FACEANALYSIS", from: "典型上游：InstantIDFaceAnalysis", desc: "人脸分析器" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：Save Image 预览", desc: "画有关键点的可视化图" },
          { type: "FACE_BBOX", to: "典型下游：需要人脸框的节点", desc: "人脸边界框" }
        ],
        why: "InstantID 对检测质量非常敏感，侧脸、遮挡、多人脸都会导致效果崩坏；先可视化再排查能省下大量试错时间。",
        params: [],
        tips: "预览图上关键点错乱时先换正脸图或裁剪放大；多人脸图先框定目标脸。提醒：调试真实人脸素材时注意肖像权授权。"
      },
      {
        name: "InstantID Patch Attention", cat: "model",
        brief: "只把 InstantID 的注意力注入部分挂到模型，输出人脸嵌入。",
        desc: "分体式用法的第一步：提取人脸特征并把 IP-Adapter 注意力部分打进模型，输出打了补丁的 MODEL 与 FACE_EMBEDS 人脸嵌入。嵌入随后交给 InstantID Apply ControlNet 做结构约束，两个节点合起来等价于一次完整的 Apply InstantID，但身份与结构两步可以分别接线、分别调参。noise 参数可在负向嵌入里混入随机量，用来给身份留一点自由度。",
        inputs: [
          { name: "instantid", type: "INSTANTID", from: "典型上游：InstantIDModelLoader", desc: "InstantID 主模型" },
          { name: "insightface", type: "FACEANALYSIS", from: "典型上游：InstantIDFaceAnalysis", desc: "人脸分析器" },
          { name: "image", type: "IMAGE", from: "典型上游：Load Image", desc: "人脸参考图" },
          { name: "model", type: "MODEL", from: "典型上游：Load Checkpoint / LoRA 链", desc: "底模" },
          { name: "mask", type: "MASK", from: "可选，遮罩生成节点", desc: "把注入限制在局部区域" }
        ],
        outputs: [
          { type: "MODEL", to: "典型下游：KSampler 的 model 输入", desc: "完成注意力注入的模型" },
          { type: "FACE_EMBEDS", to: "典型下游：InstantID Apply ControlNet 的 face_embeds 输入", desc: "人脸嵌入" }
        ],
        why: "想让身份注入与结构约束分开调参、各自生效区间独立控制时，官方分体节点是正解。",
        params: [
          { name: "weight", kind: "浮点数", default: "1.0", desc: "身份注入强度。" },
          { name: "noise", kind: "浮点数", default: "0.0", desc: "负向嵌入的随机扰动比例，大于 0 时身份约束稍松、表情更活。" },
          { name: "start_at", kind: "浮点数", default: "0.0", desc: "从采样进度的哪个比例开始生效。" },
          { name: "end_at", kind: "浮点数", default: "1.0", desc: "到采样进度的哪个比例停止生效。" }
        ],
        tips: ""
      },
      {
        name: "InstantID Apply ControlNet", cat: "cond",
        brief: "接收人脸嵌入，用 InstantID 的 ControlNet 把脸型写入条件。",
        desc: "分体式用法的第二步：输入 Patch Attention 输出的 FACE_EMBEDS 与一张人脸关键点图（image_kps，可用 Face Keypoints Preprocessor 生成），把 InstantID 内置 ControlNet 的结构约束写进正负条件后输出。strength 控制约束强弱，配合遮罩还能只约束局部。",
        inputs: [
          { name: "face_embeds", type: "FACE_EMBEDS", from: "典型上游：InstantID Patch Attention", desc: "人脸嵌入" },
          { name: "control_net", type: "CONTROL_NET", from: "典型上游：ControlNet Loader", desc: "InstantID 的 ControlNet 权重" },
          { name: "image_kps", type: "IMAGE", from: "典型上游：Face Keypoints Preprocessor", desc: "人脸关键点参考图" },
          { name: "positive", type: "CONDITIONING", from: "典型上游：正向 CLIP Text Encode", desc: "正向条件" },
          { name: "negative", type: "CONDITIONING", from: "典型上游：负向 CLIP Text Encode", desc: "负向条件" },
          { name: "mask", type: "MASK", from: "可选，遮罩生成节点", desc: "把结构约束限制在局部" }
        ],
        outputs: [
          { type: "CONDITIONING", to: "典型下游：KSampler 的 positive 输入", desc: "更新后的正向条件" },
          { type: "CONDITIONING", to: "典型下游：KSampler 的 negative 输入", desc: "更新后的负向条件" }
        ],
        why: "与 Patch Attention 搭配后，身份强度与脸部结构强度彻底解耦，微调空间大得多。",
        params: [
          { name: "strength", kind: "浮点数", default: "1.0", desc: "结构约束强度，想大改姿势角度时调低，为 0 时完全关闭。" },
          { name: "start_at", kind: "浮点数", default: "0.0", desc: "从采样进度的哪个比例开始生效。" },
          { name: "end_at", kind: "浮点数", default: "1.0", desc: "到采样进度的哪个比例停止生效。" }
        ],
        tips: ""
      }
    ]
  });

  /* ---------------- 4. ComfyUI-AnimateDiff-Evolved ---------------- */
  window.COMFY_DATA.nodePackages.push({
    id: "animatediff-evolved",
    name: "ComfyUI-AnimateDiff-Evolved",
    author: "Kosinkadink",
    official: false,
    category: "视频生成",
    install: "在 ComfyUI-Manager 里搜索 AnimateDiff Evolved 安装，并另行下载运动模型放入 models/animatediff_models 目录",
    summary: "AnimateDiff-Evolved 把预训练的运动模块（Motion Module）插入 Stable Diffusion 的 UNet，让原本逐帧独立的生成过程获得时间连贯性，从而实现文生视频与图生视频。Evolved 版本重写了采样与上下文窗口机制，支持任意长度视频、滑动窗口调度与运动 LoRA。",
    why: "它让手头任何 SD1.5、SDXL 模型无需再训练就能产出动画，是 ComfyUI 视频工作流的运动核心。通常与 VideoHelper Suite 搭配组成完整视频管线。",
    tags: ["视频生成", "AnimateDiff"],
    nodes: [
      {
        name: "ADE_AnimateDiffLoaderGen1", cat: "model",
        brief: "第一代统一加载器，把运动模块注入模型并输出可动的 MODEL。",
        desc: "最常用的运动模型加载节点。选择一个 mm_sd_v15_v2、v3_sd15_mm 或 SDXL 系运动模型文件后，它把时间维度卷积与注意力层注入上游 MODEL，使模型去噪时能同时看到相邻帧，输出具备动画能力的 MODEL 给采样器。beta_schedule 建议保持 autoselect，让插件自动匹配该运动模型训练时使用的调度方式。",
        inputs: [
          { name: "model", type: "MODEL", from: "典型上游：Load Checkpoint / LoRA 链", desc: "底模" },
          { name: "model_name", type: "COMBO", from: "models/animatediff_models 目录", desc: "运动模型文件" },
          { name: "beta_schedule", type: "COMBO", from: "节点面板选择", desc: "噪声调度，通常保持 autoselect" },
          { name: "motion_lora", type: "MOTION_LORA", from: "可选，ADE_AnimateDiffLoRALoader", desc: "运动 LoRA" }
        ],
        outputs: [
          { type: "MODEL", to: "典型下游：ADE_UseEvolved Sampling 或 KSampler 的 model 输入", desc: "具备运动能力的模型" }
        ],
        why: "运动模块是 AnimateDiff 的一切来源，选对与基础模型匹配的版本是成片质量的第一道关卡。",
        params: [
          { name: "model_name", kind: "下拉选择", default: "—", desc: "运动模型文件，放在 models/animatediff_models 目录，必须与底模架构匹配。",
            options: [["v3_sd15_mm.ckpt", "SD1.5 首选，运动自然流畅"], ["mm_sd_v15_v2.ckpt", "SD1.5 经典版，稳定通用"]] },
          { name: "beta_schedule", kind: "下拉选择", default: "autoselect", desc: "噪声调度方式，autoselect 会自动匹配运动模型训练时用的调度，建议不要手动改。" }
        ],
        tips: "SD1.5 首选 v3_sd15_mm 或 mm_sd_v15_v2；SDXL 需要用专用动画模型，混用会严重劣化。"
      },
      {
        name: "ADE_AnimateDiffLoaderAdvanced", cat: "model",
        brief: "带帧偏移的高级加载器，适合把长视频切成多段连续生成。",
        desc: "高级版加载器在 Gen1 的能力之上增加 frame_offset（帧偏移）参数：生成长视频时可以分段运行，第二段从上一段的末尾接着采样，运动相位自然衔接，配合固定的其余参数可实现长视频分批续写。其余行为与 Gen1 一致：注入运动模块，输出 MODEL。",
        inputs: [
          { name: "model", type: "MODEL", from: "典型上游：Load Checkpoint / LoRA 链", desc: "底模" },
          { name: "model_name", type: "COMBO", from: "models/animatediff_models 目录", desc: "运动模型文件" },
          { name: "beta_schedule", type: "COMBO", from: "节点面板选择", desc: "噪声调度，通常保持 autoselect" },
          { name: "frame_offset", type: "INT", from: "节点面板填写", desc: "跳过的起始帧偏移量" }
        ],
        outputs: [
          { type: "MODEL", to: "典型下游：ADE_UseEvolved Sampling 或 KSampler", desc: "具备运动能力的模型" }
        ],
        why: "显存与时长受限时，分段生成是跑长动画的实用手段，Advanced 提供了官方入口。",
        params: [
          { name: "model_name", kind: "下拉选择", default: "—", desc: "运动模型文件，需与底模架构匹配，选择原则与 Gen1 相同。" },
          { name: "beta_schedule", kind: "下拉选择", default: "autoselect", desc: "噪声调度方式，保持 autoselect 即可。" },
          { name: "frame_offset", kind: "整数", default: "0", desc: "起始帧偏移，分段生成长视频时第二段填上一段的帧数，让运动相位自然衔接。" }
        ],
        tips: "分段续写时保持工作流其他参数不变，只递增 frame_offset，衔接才顺滑。"
      },
      {
        name: "ADE_UseEvolvedSampling", cat: "sampler",
        brief: "启用进化采样，把上下文选项与采样设置挂载到模型上。",
        desc: "Evolved 采样是该项目的核心调度层。该节点接收上游带运动模块的 MODEL，把 context_options（上下文窗口方案）与 sample_settings（采样配置）等选项挂载进去后输出 MODEL。使用上下文选项类节点时应经过它（新版部分加载器也可直接接收上下文输入）。可以把它理解为「给模型附加一整套视频采样策略」的装配节点。",
        inputs: [
          { name: "model", type: "MODEL", from: "典型上游：ADE_AnimateDiffLoaderGen1", desc: "已注入运动模块的模型" },
          { name: "context_options", type: "CONTEXT_OPTIONS", from: "可选，各类 Context Options 节点", desc: "上下文窗口方案" },
          { name: "sample_settings", type: "SAMPLE_SETTINGS", from: "可选，采样设置类节点", desc: "采样配置" }
        ],
        outputs: [
          { type: "MODEL", to: "典型下游：KSampler 的 model 输入", desc: "挂载视频采样策略后的模型" }
        ],
        why: "无限长度、窗口滑移、自由帧率等功能都建立在进化采样之上，它是视频工作流推荐的标配环节。",
        params: [
          { name: "beta_schedule", kind: "下拉选择", default: "autoselect", desc: "噪声调度方式，autoselect 自动匹配运动模型，一般不动。" }
        ],
        tips: "养成固定链路习惯：运动模型加载器接 Use Evolved Sampling，再接上下文选项或直接进 KSampler。"
      },
      {
        name: "ADE_AnimateDiffUniformContextOptions", cat: "sampler",
        brief: "配置均匀滑动的上下文窗口，让动画突破 16 帧长度限制。",
        desc: "运动模块训练时一次只看 16 帧，直接生成更长视频会出现记忆断裂。该节点定义上下文窗口方案：context_length 设窗口长度，context_overlap 设相邻窗口的重叠帧数，调度方式选 uniform_standard 等模式让窗口沿时间轴滑动并按重叠部分融合。输出 CONTEXT_OPTIONS，接到 Use Evolved Sampling。理解成「滑动窗口加重叠缝合」：每 16 帧内部连贯，窗口之间靠重叠过渡。",
        inputs: [
          { name: "context_length", type: "INT", from: "节点面板填写", desc: "窗口帧数，通常为 16" },
          { name: "context_overlap", type: "INT", from: "节点面板填写", desc: "相邻窗口重叠帧数" },
          { name: "context_schedule", type: "COMBO", from: "节点面板选择", desc: "窗口滑动调度方式" },
          { name: "closed_loop", type: "COMBO", from: "节点面板选择", desc: "是否首尾闭环" }
        ],
        outputs: [
          { type: "CONTEXT_OPTIONS", to: "典型下游：ADE_UseEvolved Sampling", desc: "上下文窗口方案" }
        ],
        why: "想生成 32 帧以上的长动画，上下文机制几乎是唯一正解，它直接决定长视频的连贯性。",
        params: [
          { name: "context_length", kind: "整数", default: "16", desc: "每个窗口的帧数，运动模型按 16 帧训练，一般固定 16。" },
          { name: "context_overlap", kind: "整数", default: "4", desc: "相邻窗口的重叠帧数，重叠部分用来缝合过渡，4 到 8 常用，太小容易跳变。" },
          { name: "context_stride", kind: "整数", default: "1", desc: "窗口滑动的跨步，1 表示逐帧滑动，连贯性最好。" },
          { name: "closed_loop", kind: "开关", default: "false", desc: "首尾闭环，做循环动画时打开，让最后一帧接回第一帧。" }
        ],
        tips: "窗口重叠建议 4 到 8 帧；做循环动画时打开 closed_loop 让首尾相接。"
      },
      {
        name: "ADE_AnimateDiffLoRALoader", cat: "model",
        brief: "加载运动 LoRA，为动画追加镜头运动或稳定效果。",
        desc: "运动 LoRA（Motion LoRA）是在运动模块之上继续训练的小型插件，用 8 帧素材即可教会模型一种特定运动模式，例如平移镜头、放大变焦或固定机位防抖。该节点选择 LoRA 文件与强度，输出 MOTION_LORA，接到运动模型加载器的 motion_lora 输入。可以串联多个 LoRA 节点叠加多种运动。",
        inputs: [
          { name: "lora_name", type: "COMBO", from: "models/animatediff_motion_lora 目录", desc: "运动 LoRA 文件" },
          { name: "strength", type: "FLOAT", from: "节点面板调节", desc: "运动效果强度" },
          { name: "prev_motion_lora", type: "MOTION_LORA", from: "可选，另一个 LoRA Loader", desc: "串联的上一个运动 LoRA" }
        ],
        outputs: [
          { type: "MOTION_LORA", to: "典型下游：运动模型加载器的 motion_lora 输入", desc: "运动 LoRA" }
        ],
        why: "运动模块本身只保证「会动」，镜头感与稳定性要靠运动 LoRA 补足，官方提供的平移类 LoRA 是最常用的起点。",
        params: [
          { name: "lora_name", kind: "下拉选择", default: "—", desc: "运动 LoRA 文件，放在 models/animatediff_motion_lora 目录，每种只教一个镜头动作。",
            options: [["v2_lora_ZoomIn.ckpt", "镜头推近变焦"], ["v2_lora_PanLeft.ckpt", "镜头向左平移"], ["v2_lora_TiltUp.ckpt", "镜头向上摇"]] },
          { name: "strength", kind: "浮点数", default: "1.0", desc: "运动效果强度，0.6 到 1.0 之间调节，叠加多个 LoRA 时适当降低。" }
        ],
        tips: "强度在 0.6 到 1.0 之间调节；一次叠加两个以上运动 LoRA 容易相互抵消。"
      },
      {
        name: "ADE_EmptyLatentImageLarge", cat: "latent",
        brief: "按 width、height、length 创建视频专用的空潜空间。",
        desc: "与内置的 Empty Latent Image 不同，该节点用 length 指定帧数而不是 batch_size，语义上更符合视频生成：一次创建 length 个连续帧的潜空间批次。输出 LATENT 给 KSampler 的 latent_image 输入（文生视频）或作为帧数基准。SD1.5 视频常用 512x512 或 576x1008 等训练分辨率附近起手。",
        inputs: [
          { name: "width", type: "INT", from: "节点面板填写", desc: "帧宽度" },
          { name: "height", type: "INT", from: "节点面板填写", desc: "帧高度" },
          { name: "length", type: "INT", from: "节点面板填写", desc: "帧数" }
        ],
        outputs: [
          { type: "LATENT", to: "典型下游：KSampler 的 latent_image 输入", desc: "视频初始噪声批次" }
        ],
        why: "视频工作流里帧数是核心参数，专用节点避免了 batch_size 与帧数两个概念的混淆。",
        params: [
          { name: "width", kind: "整数", default: "512", desc: "帧宽度，建议用运动模型训练分辨率附近起手，SD1.5 常用 512。" },
          { name: "height", kind: "整数", default: "512", desc: "帧高度，SD1.5 视频 512 到 768 之间更稳。" },
          { name: "length", kind: "整数", default: "16", desc: "帧数，即一次生成的画面数量，先用 16 帧小尺寸测试再放大。" }
        ],
        tips: "先用 16 帧小尺寸测试构图与运动，确认后再放大 length 与分辨率。"
      },
      {
        name: "ADE_LoadAnimateDiffModel", cat: "model",
        brief: "第二代流程的运动模型加载器，输出可复用的运动模型。",
        desc: "Gen2 解耦架构的第一环：只负责把运动模型文件加载成 MOTION_MODEL_ADE 输出，不直接接触底模。输出接到 Apply AnimateDiff Model 系列节点做注入，ad_settings 输入口可接运动模型设置微调内部行为。同一份运动模型可以复制多路给不同分支复用。",
        inputs: [
          { name: "model_name", type: "COMBO", from: "models/animatediff_models 目录", desc: "运动模型文件" },
          { name: "ad_settings", type: "AD_SETTINGS", from: "可选，运动模型设置类节点", desc: "运动模型内部调整" }
        ],
        outputs: [
          { type: "MOTION_MODEL_ADE", to: "典型下游：ADE_ApplyAnimateDiffModel 系列的 motion_model 输入", desc: "加载好的运动模型" }
        ],
        why: "Gen2 流程把加载与应用拆开后更灵活，这个加载器是新版官方工作流的起点。",
        params: [
          { name: "model_name", kind: "下拉选择", default: "—", desc: "运动模型文件，必须与底模架构匹配，选择原则与第一代加载器相同。" }
        ],
        tips: ""
      },
      {
        name: "ADE_ApplyAnimateDiffModelSimple", cat: "model",
        brief: "把运动模型挂上缩放与生效选项，输出运动模型组。",
        desc: "Gen2 核心应用节点：输入 Load AnimateDiff Model 给出的运动模型，挂上缩放 scale_multival 与生效范围 effect_multival 等选项后输出 M_MODELS 运动模型组，再由 Use Evolved Sampling 把整组收进底模。支持串联多个应用节点叠加多个运动模块，也可接运动 LoRA 与关键帧。",
        inputs: [
          { name: "motion_model", type: "MOTION_MODEL_ADE", from: "典型上游：ADE_LoadAnimateDiffModel", desc: "运动模型" },
          { name: "motion_lora", type: "MOTION_LORA", from: "可选，ADE_AnimateDiffLoRALoader", desc: "运动 LoRA" },
          { name: "scale_multival", type: "MULTIVAL", from: "可选，多值调节节点", desc: "运动强度缩放" },
          { name: "effect_multival", type: "MULTIVAL", from: "可选，多值调节节点", desc: "运动影响范围" },
          { name: "ad_keyframes", type: "AD_KEYFRAMES", from: "可选，关键帧节点", desc: "随采样变化的关键帧" }
        ],
        outputs: [
          { type: "M_MODELS", to: "典型下游：ADE_UseEvolved Sampling 的 m_models 输入", desc: "运动模型组" }
        ],
        why: "新版工作流用加载、应用、收拢三步取代老式一键加载，这个节点是中间的注入环节。",
        params: [
          { name: "scale_multival", kind: "可选输入", default: "—", desc: "运动强度，可为常数、数值列表或遮罩，配合多值节点做逐帧变化。" },
          { name: "effect_multival", kind: "可选输入", default: "—", desc: "运动效果的作用范围，0 为关闭，1 为完全生效。" }
        ],
        tips: ""
      },
      {
        name: "ADE_ApplyAnimateDiffModel", cat: "model",
        brief: "高级版运动模型应用节点，增加按采样百分比生效的区间。",
        desc: "在 Simple 版全部能力之上增加 start_percent 与 end_percent：可以规定运动模块只在采样的某一段介入，例如前半段锁运动、后半段自由细化，或反过来后半段才补运动。其余参数与 Simple 一致，输出同样是 M_MODELS。",
        inputs: [
          { name: "motion_model", type: "MOTION_MODEL_ADE", from: "典型上游：ADE_LoadAnimateDiffModel", desc: "运动模型" },
          { name: "start_percent", type: "FLOAT", from: "节点面板调节", desc: "开始介入的采样进度" },
          { name: "end_percent", type: "FLOAT", from: "节点面板调节", desc: "停止介入的采样进度" },
          { name: "motion_lora", type: "MOTION_LORA", from: "可选，ADE_AnimateDiffLoRALoader", desc: "运动 LoRA" }
        ],
        outputs: [
          { type: "M_MODELS", to: "典型下游：ADE_UseEvolved Sampling 的 m_models 输入", desc: "运动模型组" }
        ],
        why: "需要精确控制运动模块何时介入何时退场时，就得用它而不是 Simple 版。",
        params: [
          { name: "start_percent", kind: "浮点数", default: "0.0", desc: "从采样进度的哪个比例开始生效。" },
          { name: "end_percent", kind: "浮点数", default: "1.0", desc: "到采样进度的哪个比例停止生效，0.5 表示后一半采样不再有运动干预。" }
        ],
        tips: ""
      },
      {
        name: "ADE_StandardUniformContextOptions", cat: "sampler",
        brief: "标准均匀滑窗上下文方案，长视频连贯性的默认选择。",
        desc: "定义一组沿时间轴均匀滑动的上下文窗口：context_length 窗口长、context_stride 跨步、context_overlap 重叠，融合方式 fuse_method 默认 pyramid 金字塔加权，缝合最顺滑。与 Looped 版的区别是不支持首尾闭环，适合普通连续长镜头。输出 CONTEXT_OPTS 接 Use Evolved Sampling。",
        inputs: [
          { name: "prev_context", type: "CONTEXT_OPTIONS", from: "可选，另一个上下文节点", desc: "串联叠加的上一个方案" }
        ],
        outputs: [
          { type: "CONTEXT_OPTS", to: "典型下游：ADE_UseEvolved Sampling 的 context_options 输入", desc: "上下文窗口方案" }
        ],
        why: "它是旧版 Uniform Context Options 的现代替代品，社区新工作流的长视频连贯性主要靠它。",
        params: [
          { name: "context_length", kind: "整数", default: "16", desc: "窗口帧数，运动模型按 16 帧训练，一般固定 16。" },
          { name: "context_stride", kind: "整数", default: "1", desc: "窗口滑动的跨步，1 表示逐帧滑动，连贯性最好。" },
          { name: "context_overlap", kind: "整数", default: "4", desc: "相邻窗口重叠帧数，太小容易跳变，4 到 8 常用。" },
          { name: "fuse_method", kind: "下拉选择", default: "pyramid", desc: "窗口重叠部分的融合方式，pyramid 按距离金字塔加权，接缝最不明显。" }
        ],
        tips: ""
      },
      {
        name: "ADE_StandardStaticContextOptions", cat: "sampler",
        brief: "静态固定窗口方案，按固定窗口分批处理整段帧。",
        desc: "与滑窗版本不同，静态方案没有跨步：整段视频按 context_length 切成固定窗口，窗口之间以 context_overlap 重叠融合。帧数不超过窗口长度时几乎零开销，适合 16 帧以内的短片或想省算力的场景，也是多段分批跑长片时的常用基准。",
        inputs: [
          { name: "prev_context", type: "CONTEXT_OPTIONS", from: "可选，另一个上下文节点", desc: "串联叠加的上一个方案" }
        ],
        outputs: [
          { type: "CONTEXT_OPTS", to: "典型下游：ADE_UseEvolved Sampling 的 context_options 输入", desc: "上下文窗口方案" }
        ],
        why: "短动画用它最省事，长动画切多段跑时也常以它为分批基准。",
        params: [
          { name: "context_length", kind: "整数", default: "16", desc: "每个窗口的帧数。" },
          { name: "context_overlap", kind: "整数", default: "4", desc: "相邻窗口的重叠帧数，用来缝合窗口间的过渡。" }
        ],
        tips: ""
      },
      {
        name: "ADE_LoopedUniformContextOptions", cat: "sampler",
        brief: "循环式滑窗方案，支持 closed_loop 首尾闭环。",
        desc: "在 Standard Uniform 的滑窗能力之上增加 closed_loop 闭环开关与更自由的融合方式列表：做循环动画时打开 closed_loop，最后一个窗口会与第一个窗口相互融合，首尾自然衔接。新版用它取代旧的 ADE_AnimateDiffUniformContextOptions 节点。",
        inputs: [
          { name: "prev_context", type: "CONTEXT_OPTIONS", from: "可选，另一个上下文节点", desc: "串联叠加的上一个方案" }
        ],
        outputs: [
          { type: "CONTEXT_OPTS", to: "典型下游：ADE_UseEvolved Sampling 的 context_options 输入", desc: "上下文窗口方案" }
        ],
        why: "循环类动态素材如呼吸、摇摆、飘动，几乎都要靠它把首尾缝起来。",
        params: [
          { name: "context_length", kind: "整数", default: "16", desc: "窗口帧数，一般固定 16。" },
          { name: "context_stride", kind: "整数", default: "1", desc: "窗口滑动的跨步。" },
          { name: "context_overlap", kind: "整数", default: "4", desc: "相邻窗口重叠帧数。" },
          { name: "closed_loop", kind: "开关", default: "false", desc: "首尾闭环，做无缝循环动画时打开。" }
        ],
        tips: ""
      },
      {
        name: "ADE_AnimateDiffSamplingSettings", cat: "sampler",
        brief: "采样设置中枢，统一管理噪声类型、种子生成与迭代方式。",
        desc: "把视频采样相关的杂项集中到一个节点：batch_offset 批偏移、noise_type 噪声类型、seed_gen 种子生成策略、seed_offset 种子偏移，还能外接噪声层、迭代选项、自定义 CFG、sigma 调度与图像注入等子模块。输出 SAMPLE_SETTINGS 接 Use Evolved Sampling 或老式加载器。长视频分段续写时它能保证各段噪声既独立又可复现。",
        inputs: [
          { name: "noise_layers", type: "NOISE_LAYERS", from: "可选，噪声层节点", desc: "分层噪声配置" },
          { name: "iteration_opts", type: "ITERATION_OPTS", from: "可选，迭代选项节点", desc: "多次迭代策略" },
          { name: "seed_override", type: "INT", from: "可选，INT 常量等", desc: "覆盖采样器种子的固定值" },
          { name: "custom_cfg", type: "CUSTOM_CFG", from: "可选，自定义 CFG 节点", desc: "自定义引导配置" },
          { name: "sigma_schedule", type: "SIGMA_SCHEDULE", from: "可选，sigma 调度节点", desc: "自定义噪声调度" }
        ],
        outputs: [
          { type: "SAMPLE_SETTINGS", to: "典型下游：ADE_UseEvolved Sampling 的 sample_settings 输入", desc: "采样设置包" }
        ],
        why: "分段续写、种子可复现、FreeNoise 降噪这些进阶需求，全靠采样设置层兜底。",
        params: [
          { name: "batch_offset", kind: "整数", default: "0", desc: "批次偏移量，多段生成时递增它可以让每段噪声错开而不重样。" },
          { name: "noise_type", kind: "下拉选择", default: "default", desc: "噪声类型，default 跟随全局，constant 每批恒定，FreeNoise 为长视频降噪方案。" },
          { name: "seed_gen", kind: "下拉选择", default: "comfy", desc: "种子生成策略，comfy 与 auto1111 两套风格各可选 CPU 或 GPU 计算。" },
          { name: "seed_offset", kind: "整数", default: "0", desc: "在种子基础上加的偏移，微调噪声用。" }
        ],
        tips: ""
      },
      {
        name: "ADE_AnimateDiffLoaderWithContext", cat: "model",
        brief: "老式一体化加载器，可直接接收上下文选项，现已标记弃用。",
        desc: "Gen1 时代的一站式节点：一次完成运动模型加载、LoRA 接入、上下文选项与采样设置挂载，输出可动 MODEL。大量旧工作流仍在使用它，但官方已在代码中标记弃用，新工作流建议改走 Gen2 的加载、应用、收拢三步。它的价值在于链路少两个节点，小工作流依然好用。",
        inputs: [
          { name: "model", type: "MODEL", from: "典型上游：Load Checkpoint / LoRA 链", desc: "底模" },
          { name: "model_name", type: "COMBO", from: "models/animatediff_models 目录", desc: "运动模型文件" },
          { name: "beta_schedule", type: "COMBO", from: "节点面板选择", desc: "噪声调度，保持 autoselect" },
          { name: "context_options", type: "CONTEXT_OPTIONS", from: "可选，各类 Context Options 节点", desc: "上下文窗口方案" },
          { name: "motion_lora", type: "MOTION_LORA", from: "可选，ADE_AnimateDiffLoRALoader", desc: "运动 LoRA" },
          { name: "sample_settings", type: "SAMPLE_SETTINGS", from: "可选，ADE_AnimateDiffSamplingSettings", desc: "采样设置" }
        ],
        outputs: [
          { type: "MODEL", to: "典型下游：KSampler 的 model 输入", desc: "具备运动能力的模型" }
        ],
        why: "看懂存量工作流绕不开它；参数齐全，临时小工作流也确实省事。",
        params: [
          { name: "model_name", kind: "下拉选择", default: "—", desc: "运动模型文件，必须与底模架构匹配。" },
          { name: "beta_schedule", kind: "下拉选择", default: "autoselect", desc: "噪声调度方式，autoselect 自动匹配运动模型训练时的调度。" },
          { name: "motion_scale", kind: "浮点数", default: "1.0", desc: "整体运动强度，画面晃得太厉害就调低。" }
        ],
        tips: ""
      },
      {
        name: "ADE_AnimateDiffUnload", cat: "util",
        brief: "把模型上的 AnimateDiff 组件卸载，恢复普通模型。",
        desc: "输入一个带运动模块的 MODEL，把挂载的运动模块、上下文与采样设置全部剥离后输出干净的 MODEL。典型用法是在切换回静态生成分支前卸载动画组件，或用它结束动画链路以便复用同一份底模。",
        inputs: [
          { name: "model", type: "MODEL", from: "典型上游：动画加载链", desc: "带运动模块的模型" }
        ],
        outputs: [
          { type: "MODEL", to: "典型下游：静态生成链或 KSampler", desc: "卸载动画组件后的模型" }
        ],
        why: "显存紧张时及时卸载运动模块，是动画与静图混合工作流的保命手段。",
        params: [],
        tips: ""
      },
      {
        name: "ADE_AnimateDiffCombine", cat: "video",
        brief: "官方标记弃用的成片节点，功能已被 VHS Video Combine 取代。",
        desc: "AnimateDiff 早期的视频合成出口：把帧批次按 frame_rate 编码成动图或视频文件输出。作者明确建议改用 Video Helper Suite 的 Video Combine，后者格式更全、功能更强。保留认识它的意义在于读懂旧工作流，新工作流请直接用 VHS。",
        inputs: [
          { name: "images", type: "IMAGE", from: "典型上游：VAE Decode", desc: "待合成的帧序列" },
          { name: "frame_rate", type: "INT", from: "节点面板填写", desc: "输出帧率" },
          { name: "format", type: "COMBO", from: "节点面板选择", desc: "输出格式" }
        ],
        outputs: [
          { type: "GIF", to: "无，终端输出节点", desc: "合成结果直接落盘" }
        ],
        why: "旧教程与老工作流里大量出现，认识它才能顺利把旧链路迁移到 VHS。",
        params: [
          { name: "frame_rate", kind: "整数", default: "8", desc: "输出帧率，AnimateDiff 默认 8 帧节奏。" },
          { name: "pingpong", kind: "开关", default: "false", desc: "正放倒放交替，帧数少时动作显得更流畅。" }
        ],
        tips: ""
      }
    ]
  });

  /* ---------------- 5. ComfyUI-VideoHelper-Suite ---------------- */
  window.COMFY_DATA.nodePackages.push({
    id: "video-helper-suite",
    name: "ComfyUI-VideoHelper-Suite",
    author: "Kosinkadink",
    official: false,
    category: "视频输入输出",
    install: "在 ComfyUI-Manager 里搜索 Video Helper Suite 一键安装",
    summary: "VideoHelper Suite，简称 VHS，是 ComfyUI 视频工作流的事实标准输入输出套件。它覆盖视频与图片序列加载、帧率重采样、音频挂载与成品视频合成导出的完整链路，并对长视频做了惰性加载与分批处理优化。",
    why: "原生节点处理不了多帧序列、音频与视频容器格式，VHS 一套补齐全部缺口；节点之间类型对齐，几乎不需要手工转换。与 AnimateDiff 等运动引擎配合是社区默认组合。",
    tags: ["视频", "输入输出"],
    nodes: [
      {
        name: "VHS Load Video (Upload)", cat: "video",
        brief: "上传并解码视频文件，输出图像帧序列与音频。",
        desc: "最常用的视频入口。上传一个视频文件后，节点逐帧解码为 IMAGE 批次输出，同时给出总帧数、音轨与视频元信息。force_rate 可重采样到目标帧率，skip_first_frames 跳过片头，frame_load_cap 限制加载帧数，select_every_nth 实现隔帧抽帧。四个参数组合可以把任意长视频裁成工作流需要的片段。",
        inputs: [
          { name: "video", type: "COMBO", from: "前端上传的视频文件", desc: "视频来源" },
          { name: "force_rate", type: "INT", from: "节点面板填写", desc: "目标帧率，0 为保持原帧率" },
          { name: "frame_load_cap", type: "INT", from: "节点面板填写", desc: "最多加载的帧数，0 为不限" },
          { name: "skip_first_frames", type: "INT", from: "节点面板填写", desc: "跳过开头的帧数" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：采样、换脸或后处理链", desc: "解码后的帧序列" },
          { type: "INT", to: "典型下游：需要帧数的节点", desc: "实际加载的帧数" },
          { type: "AUDIO", to: "典型下游：VHS Video Combine 的 audio 输入", desc: "视频原声" },
          { type: "VHS_VIDEOINFO", to: "典型下游：需要视频元信息的节点", desc: "宽高、帧率等元数据" }
        ],
        why: "视频工作流的第一步是可控地把视频变成帧，帧率、裁剪与抽帧参数直接决定后续计算量。",
        params: [
          { name: "video", kind: "下拉选择", default: "—", desc: "前端上传的视频文件，上传后自动出现在列表里。" },
          { name: "force_rate", kind: "整数", default: "0", desc: "强制重采样到的目标帧率，0 保持原帧率；常用 12 到 24 控制后续计算量。" },
          { name: "frame_load_cap", kind: "整数", default: "0", desc: "最多加载的帧数，0 为不限；调试时设 8 到 16 帧快速试跑。" },
          { name: "skip_first_frames", kind: "整数", default: "0", desc: "跳过开头的帧数，用来掐掉片头或废帧。" },
          { name: "select_every_nth", kind: "整数", default: "1", desc: "隔帧抽取，设 2 表示每 2 帧取 1 帧，帧数减半、动作更快。" }
        ],
        tips: "调试阶段把 frame_load_cap 设为 8 到 16 帧快速试跑，定稿后再放开全量帧。"
      },
      {
        name: "VHS Load Video Path", cat: "video",
        brief: "按服务器本地路径加载视频，适合批量与自动化管线。",
        desc: "与上传版功能一致，区别是把视频来源从上传对话框改为服务器上的文件路径字符串，因此可以被参数化批处理复用，也避免重复上传大文件的等待。同样输出帧序列、帧数、音频与元信息，并提供相同的帧率重采样与抽帧控制。",
        inputs: [
          { name: "video", type: "STRING", from: "服务器上的视频文件路径", desc: "路径字符串，可由外部脚本注入" },
          { name: "force_rate", type: "INT", from: "节点面板填写", desc: "目标帧率，0 为保持原帧率" },
          { name: "frame_load_cap", type: "INT", from: "节点面板填写", desc: "最多加载的帧数" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：采样或后处理链", desc: "解码后的帧序列" },
          { type: "INT", to: "典型下游：需要帧数的节点", desc: "实际加载的帧数" },
          { type: "AUDIO", to: "典型下游：VHS Video Combine", desc: "视频原声" },
          { type: "VHS_VIDEOINFO", to: "典型下游：需要视频元信息的节点", desc: "视频元数据" }
        ],
        why: "做批处理或无人值守跑图时，路径输入比手动上传可靠得多，这是自动化工作流的标准选择。",
        params: [
          { name: "video", kind: "文本", default: "", desc: "服务器上的视频文件路径，用正斜杠书写最稳妥，可由外部脚本批量注入。" },
          { name: "force_rate", kind: "整数", default: "0", desc: "强制重采样到的目标帧率，0 保持原帧率。" },
          { name: "frame_load_cap", kind: "整数", default: "0", desc: "最多加载的帧数，0 为不限。" },
          { name: "skip_first_frames", kind: "整数", default: "0", desc: "跳过开头的帧数。" },
          { name: "select_every_nth", kind: "整数", default: "1", desc: "隔帧抽取，设 2 表示每 2 帧取 1 帧。" }
        ],
        tips: "路径使用正斜杠书写最稳妥；配合队列脚本可以批量处理整个目录的视频。"
      },
      {
        name: "VHS Load Images (Path)", cat: "video",
        brief: "从文件夹路径读取图片序列当作视频帧使用。",
        desc: "视频的另一种形态是一堆编号图片帧。该节点按路径读取文件夹内按名称排序的图片，打包成 IMAGE 批次输出，并给出帧数与可用音轨。它常用于接收外部渲染或补帧工具输出的序列帧，或把生成结果回流成下一轮输入。文件名排序即帧顺序，建议用 0001.png 这样的零填充编号。",
        inputs: [
          { name: "directory", type: "STRING", from: "服务器上的图片文件夹路径", desc: "序列帧所在目录" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：采样、插帧或合成链", desc: "序列帧批次" },
          { type: "INT", to: "典型下游：需要帧数的节点", desc: "帧数" },
          { type: "AUDIO", to: "典型下游：VHS Video Combine", desc: "可用音轨，可能为空" }
        ],
        why: "图片序列是视频制作中最通用的中间格式，这个节点让 ComfyUI 与外部工具能无缝交换帧数据。",
        params: [
          { name: "directory", kind: "文本", default: "", desc: "序列帧所在文件夹的路径，按文件名排序决定帧顺序，建议用 0001.png 这样的零填充编号。" }
        ],
        tips: "文件夹混入非序列文件会导致帧数异常，先给序列帧单独建目录。"
      },
      {
        name: "VHS Load Images (Upload)", cat: "video",
        brief: "直接上传多张图片或压缩包组成帧序列。",
        desc: "路径版的上传变体：不依赖服务器路径，直接在前端选择多个图片文件或一个 zip 压缩包，按文件名顺序组成 IMAGE 帧批次。适合把外部做好的序列帧快速送进工作流，或小规模测试序列处理逻辑。输出与路径版一致。",
        inputs: [
          { name: "images", type: "COMBO", from: "前端上传的图片或 zip 压缩包", desc: "序列帧来源" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：采样、插帧或合成链", desc: "序列帧批次" },
          { type: "INT", to: "典型下游：需要帧数的节点", desc: "帧数" }
        ],
        why: "不方便访问服务器文件系统的用户也能使用序列帧，降低了视频工作流的上手门槛。",
        params: [
          { name: "images", kind: "下拉选择", default: "—", desc: "前端上传的多张图片或 zip 压缩包，按文件名顺序组成帧序列。" }
        ],
        tips: "打包 zip 时把图片放在压缩包根目录，避免多层文件夹打乱帧顺序。"
      },
      {
        name: "VHS Load Audio", cat: "audio",
        brief: "加载音频文件，供视频合成时挂载音轨。",
        desc: "从上传或路径加载一个音频文件，输出 AUDIO 类型。典型接法是把输出连到 Video Combine 的 audio 输入，让导出的成片自带声音。seek 参数可以从指定位置开始读取。在 AnimateDiff 工作流中，也有人用它配合音频驱动的创意玩法。",
        inputs: [
          { name: "audio", type: "COMBO", from: "前端上传或路径选择", desc: "音频来源" },
          { name: "seek_frames", type: "INT", from: "节点面板填写", desc: "起始读取位置" }
        ],
        outputs: [
          { type: "AUDIO", to: "典型下游：VHS Video Combine 的 audio 输入", desc: "音频流" }
        ],
        why: "无声成片往往要回到剪辑软件再配乐，直接在节点内挂音轨能一步导出完整视频。",
        params: [
          { name: "audio", kind: "下拉选择", default: "—", desc: "前端上传或从服务器路径选择的音频文件。" },
          { name: "seek_frames", kind: "整数", default: "0", desc: "起始读取位置，从第几帧开始取音频。" }
        ],
        tips: "输出帧数与音频长度不必一致，合成时以图像帧数为准拼接音频。"
      },
      {
        name: "VHS Video Combine", cat: "video",
        brief: "终点站节点，把帧序列与音频合成导出为视频文件。",
        desc: "视频工作流的收尾节点。接收 IMAGE 帧批次与可选 AUDIO，用内置 ffmpeg 按 format 选择的容器格式（mp4、webm、gif 等）编码输出：frame_rate 设定帧率，loop_count 控制循环次数，pingpong 可做正放倒放循环，crf 等码率参数控制画质与体积。它是终端节点，没有常规数据输出，成品可在节点上直接预览，或到 output 目录获取文件。",
        inputs: [
          { name: "images", type: "IMAGE", from: "典型上游：VAE Decode 或插帧节点", desc: "待合成的帧序列" },
          { name: "audio", type: "AUDIO", from: "可选，VHS Load Audio 或视频加载节点", desc: "挂载的音轨" },
          { name: "frame_rate", type: "FLOAT", from: "节点面板填写", desc: "输出帧率" },
          { name: "format", type: "COMBO", from: "节点面板选择", desc: "容器与编码格式" }
        ],
        outputs: [],
        why: "帧序列只有被合成为视频文件才方便传播与审阅，该节点还承担帧率对齐与循环处理的职责。",
        params: [
          { name: "frame_rate", kind: "浮点数", default: "8", desc: "输出帧率，要与画面运动速度匹配，常用 12 到 30。" },
          { name: "loop_count", kind: "整数", default: "0", desc: "循环播放次数，0 表示播放一次，导出 gif 循环素材时常调大。" },
          { name: "pingpong", kind: "开关", default: "false", desc: "正放倒放交替，帧数少时能让动作显得更流畅。" },
          { name: "format", kind: "下拉选择", default: "image/gif", desc: "容器与编码格式，不同格式会带出各自的码率设置项。",
            options: [["image/gif", "免安装编码，快速预览运动首选"], ["video/h264-mp4", "常用成品格式，体积小画质好"], ["image/webp", "较高质量的有损动图，体积比 gif 小"]] },
          { name: "filename_prefix", kind: "文本", default: "AnimateDiff", desc: "输出文件名前缀，成品保存在 output 目录。" }
        ],
        tips: "出片前先用 gif 或高 crf 快速预览运动效果，确认后再导出高质量 mp4。"
      },
      {
        name: "VHS Meta Batch Manager", cat: "util",
        brief: "把长视频切成多个批次排队执行，压平显存峰值。",
        desc: "输出一个 VHS_BatchManager 元批次对象：设好 frames_per_batch 后，长视频会被拆成若干次队列执行，每次只处理一批帧，显存占用恒定。需要把输出发给支持元批次的处理链（如 Batched Nodes 系列与采样链路），并与 Video Combine 配合逐批写出成品。",
        inputs: [],
        outputs: [
          { type: "VHS_BATCHMANAGER", to: "典型下游：支持元批次的 VHS 处理链", desc: "元批次对象，控制每次队列处理多少帧" }
        ],
        why: "低显存设备跑长视频，分批执行几乎是唯一可行路线，它就是官方给出的分批开关。",
        params: [
          { name: "frames_per_batch", kind: "整数", default: "16", desc: "每次队列执行的帧数，显存越紧调得越小。" }
        ],
        tips: ""
      },
      {
        name: "VHS Select Images", cat: "video",
        brief: "按索引表达式挑选帧，支持范围、负数与逗号组合。",
        desc: "输入帧批次与索引字符串，按规则挑出子集：0,2,4 挑单帧、区间写法挑一段、负数从尾部倒数。err_if_missing 与 err_if_empty 控制索引越界或结果为空时是报错停跑还是容忍继续。做删帧、抽帧、重排时它是瑞士军刀。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：VHS 加载节点或 VAE Decode", desc: "帧批次" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：合成、插帧或采样链", desc: "挑出的帧子集" }
        ],
        why: "原生节点没有按索引挑帧的能力，序列处理几乎绕不开它。",
        params: [
          { name: "indexes", kind: "文本", default: "0", desc: "索引表达式，逗号分隔单帧、区间写法选一段，负数从末尾倒数。" },
          { name: "err_if_missing", kind: "开关", default: "true", desc: "索引超出范围时是否报错，关掉则静默跳过。" },
          { name: "err_if_empty", kind: "开关", default: "true", desc: "结果为空时是否报错，关掉则输出空批次继续跑。" }
        ],
        tips: ""
      },
      {
        name: "VHS Get Image Count", cat: "util",
        brief: "统计帧批次数量，输出帧数整数。",
        desc: "输入 IMAGE 批次，输出包含多少帧的 INT。看似简单却是自动化工作流的重要积木：用帧数驱动条件分支、计算批次切分、或把帧数喂给其他参数节点，实现纯数据流联动。",
        inputs: [
          { name: "images", type: "IMAGE", from: "典型上游：VHS 加载节点", desc: "帧批次" }
        ],
        outputs: [
          { type: "INT", to: "典型下游：需要帧数的节点", desc: "帧数" }
        ],
        why: "帧数是视频工作流最常被下游引用的元数据，没有它就得靠外部脚本数。",
        params: [],
        tips: ""
      },
      {
        name: "VHS Split Images", cat: "video",
        brief: "在指定位置把帧批次一分为二。",
        desc: "输入帧批次与 split_index 切分点，输出前后两段帧批次及各自帧数。典型用途：把首帧或末帧单独拆出来当参考帧处理，其余帧走主链路，处理完再用 Merge Images 拼回去。",
        inputs: [
          { name: "images", type: "IMAGE", from: "典型上游：VHS 加载节点", desc: "帧批次" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：处理链 A 段", desc: "切分点之前的帧" },
          { type: "INT", to: "典型下游：需要帧数的节点", desc: "A 段帧数" },
          { type: "IMAGE", to: "典型下游：处理链 B 段", desc: "切分点之后的帧" },
          { type: "INT", to: "典型下游：需要帧数的节点", desc: "B 段帧数" }
        ],
        why: "序列处理经常要「留头去尾」分别处理，拆分节点让这类操作不再需要重复加载。",
        params: [
          { name: "split_index", kind: "整数", default: "0", desc: "切分位置，第几帧之后切开。" }
        ],
        tips: ""
      },
      {
        name: "VHS Merge Images", cat: "video",
        brief: "把两个帧批次合并为一个，处理尺寸与裁切策略。",
        desc: "输入 A、B 两路帧批次合并输出，merge_strategy 决定两边长度不一致时怎么办，scale_method 与 crop 决定合并前是否缩放与如何裁切对齐。常与 Split Images 配对使用，拆开处理完再无缝拼回。",
        inputs: [
          { name: "images_A", type: "IMAGE", from: "典型上游：处理链 A 段", desc: "第一批帧" },
          { name: "images_B", type: "IMAGE", from: "典型上游：处理链 B 段", desc: "第二批帧" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：合成或后处理链", desc: "合并后的帧批次" },
          { type: "INT", to: "典型下游：需要帧数的节点", desc: "合并后总帧数" }
        ],
        why: "拆开处理完的帧要拼回去，合并策略能兜住两边帧数不一致的坑。",
        params: [
          { name: "merge_strategy", kind: "下拉选择", default: "—", desc: "帧数不一致时的对齐策略，例如匹配 A、匹配 B、取较小者等。" },
          { name: "scale_method", kind: "下拉选择", default: "—", desc: "合并前的缩放算法。" },
          { name: "crop", kind: "下拉选择", default: "—", desc: "尺寸不齐时的裁切方式。" }
        ],
        tips: ""
      },
      {
        name: "VHS Select Every Nth Image", cat: "video",
        brief: "隔帧抽帧，顺带支持跳过开头若干帧。",
        desc: "从帧批次中每 select_every_nth 帧取一帧，可先用 skip_first_images 跳过开头，输出 count 提示剩余帧数。与 Load Video 里的 select_every_nth 参数功能一致，但作用于任意帧批次，可插在链路中间随时使用。",
        inputs: [
          { name: "images", type: "IMAGE", from: "典型上游：VHS 加载节点", desc: "帧批次" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：合成或后处理链", desc: "抽帧后的批次" },
          { type: "INT", to: "典型下游：需要帧数的节点", desc: "抽帧后的帧数" }
        ],
        why: "对已有帧批次做二次抽帧或降帧率时，插一个节点就能完成。",
        params: [
          { name: "select_every_nth", kind: "整数", default: "1", desc: "每 n 帧取 1 帧，设 2 表示帧数减半。" },
          { name: "skip_first_images", kind: "整数", default: "0", desc: "先跳过开头的帧数再抽帧。" }
        ],
        tips: ""
      },
      {
        name: "VHS VAE Decode Batched", cat: "vae",
        brief: "分小批解码潜空间，大批次解码不再爆显存。",
        desc: "与内置 VAE Decode 功能相同，但把潜空间按 per_batch 分成小块逐批解码再拼接，把显存峰值压平。视频工作流动辄上百帧，整批一次性解码是常见的爆显存点，这个节点就是官方解药。",
        inputs: [
          { name: "samples", type: "LATENT", from: "典型上游：KSampler", desc: "潜空间批次" },
          { name: "vae", type: "VAE", from: "典型上游：Load Checkpoint 或 VAE Loader", desc: "编解码器" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：VHS Video Combine 或插帧节点", desc: "解码后的帧序列" }
        ],
        why: "长视频出图链路里它几乎是标配，代价只是分批之间的微小调度开销。",
        params: [
          { name: "per_batch", kind: "整数", default: "16", desc: "每次解码的帧数，爆显存就调小，速度优先可调大。" }
        ],
        tips: ""
      },
      {
        name: "VHS Prune Outputs", cat: "util",
        brief: "自动清理 Video Combine 留下的中间文件。",
        desc: "接收 Video Combine 输出的 VHS_FILENAMES 文件名信息，按 options 选择删除中间产物（如 gif 预览、帧序列缓存）或连同工具文件一起删，防止输出目录无限膨胀。只清理输出与临时目录内的文件，成品文件会保留。",
        inputs: [
          { name: "filenames", type: "VHS_FILENAMES", from: "典型上游：VHS Video Combine", desc: "本次合成写出的文件清单" }
        ],
        outputs: [],
        why: "调试视频工作流会产生大量废弃中间文件，这个清理节点让输出目录保持干净。",
        params: [
          { name: "options", kind: "下拉选择", default: "Intermediate", desc: "清理范围。",
            options: [["Intermediate", "只删中间产物，保留成品"], ["Intermediate and Utility", "连工具文件一起删，目录更干净"]] }
        ],
        tips: ""
      }
    ]
  });

  /* ---------------- 6. ComfyUI-Frame-Interpolation ---------------- */
  window.COMFY_DATA.nodePackages.push({
    id: "frame-interpolation",
    name: "ComfyUI-Frame-Interpolation",
    author: "Fannovel16",
    official: false,
    category: "补帧插帧",
    install: "在 ComfyUI-Manager 里搜索 Frame Interpolation 安装，首次使用所选插帧模型时会自动下载权重文件",
    summary: "ComfyUI-Frame-Interpolation 把 RIFE、FILM、GMFSS 等插帧（Video Frame Interpolation，视频补帧）模型接入 ComfyUI，在已有帧之间合成过渡帧，把 8 帧、16 帧的低帧率生成结果平滑提升到 24、32 甚至更高帧率，是视频工作流的最后一块拼图。",
    why: "生成式视频在低帧率下卡顿感明显，补帧比让大模型直接多生成帧便宜得多、也更稳定，几乎每条视频管线都会在导出前插一档帧。",
    tags: ["补帧", "插帧", "视频"],
    nodes: [
      {
        name: "RIFE VFI", cat: "video",
        brief: "最流行的光流插帧节点，按倍率在相邻帧之间合成新帧。",
        desc: "RIFE（Real-Time Intermediate Flow Estimation，实时中间流估计）通过估计相邻两帧之间的运动场，在中间时刻合成过渡帧。输入一个 IMAGE 帧批次，multiplier 设 2 表示帧数翻倍、设 4 表示翻三倍，输出插满新帧的 IMAGE 批次。ckpt_name 选择具体模型版本，ensemble 开启多模型投票可略微提升质量但更耗时。位置通常放在 VAE Decode 之后、Video Combine 之前。",
        inputs: [
          { name: "frames", type: "IMAGE", from: "典型上游：VAE Decode 或 VHS 视频加载节点", desc: "待插帧的序列" },
          { name: "ckpt_name", type: "COMBO", from: "RIFE 模型文件列表", desc: "插帧模型版本" },
          { name: "multiplier", type: "INT", from: "节点面板填写", desc: "插帧倍率" },
          { name: "ensemble", type: "COMBO", from: "节点面板选择", desc: "是否启用集成推理" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：VHS Video Combine 的 images 输入", desc: "插帧后的高帧率序列" }
        ],
        why: "生成模型的帧率受显存与时间限制，用 RIFE 把 16 帧补到 48 帧是性价比最高的流畅度方案。",
        params: [
          { name: "ckpt_name", kind: "下拉选择", default: "rife49.pth", desc: "插帧模型版本，编号越大版本越新。",
            options: [["rife49.pth", "较新版本，快速运动重影更少，推荐"], ["rife_v4.6.pth", "经典版本，大量旧工作流在用"]] },
          { name: "multiplier", kind: "整数", default: "2", desc: "插帧倍率，2 表示帧数翻倍、4 表示变四倍，建议一次 2 到 3 倍。" },
          { name: "ensemble", kind: "开关", default: "true", desc: "集成推理，多次推理取平均，快速运动的重影更少但更耗时。" }
        ],
        tips: "倍率建议一次 2 到 3 倍；快速运动画面出现重影时换更高版本的模型或开启 ensemble。"
      },
      {
        name: "RIFE Tiled VFI", cat: "video",
        brief: "分块计算的 RIFE 插帧，专治高分辨率视频爆显存。",
        desc: "与 RIFE VFI 使用相同的插帧算法，但把每帧切成小块分别处理再拼回，显著降低峰值显存占用。输入输出与普通版一致，额外提供 tile_size 控制分块尺寸。适合 1024 以上的大分辨率帧序列，以及把 SDXL 动画补到高帧率的场景。",
        inputs: [
          { name: "frames", type: "IMAGE", from: "典型上游：VAE Decode 或视频加载节点", desc: "待插帧的序列" },
          { name: "ckpt_name", type: "COMBO", from: "RIFE 模型文件列表", desc: "插帧模型版本" },
          { name: "multiplier", type: "INT", from: "节点面板填写", desc: "插帧倍率" },
          { name: "tile_size", type: "INT", from: "节点面板填写", desc: "分块尺寸" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：VHS Video Combine", desc: "插帧后的序列" }
        ],
        why: "高分辨率视频最容易在补帧这最后一步爆显存，分块版本让同一张显卡跑得动更大的画布。",
        params: [
          { name: "ckpt_name", kind: "下拉选择", default: "rife49.pth", desc: "插帧模型版本，含义与 RIFE VFI 相同。" },
          { name: "multiplier", kind: "整数", default: "2", desc: "插帧倍率，2 表示帧数翻倍。" },
          { name: "tile_size", kind: "整数", default: "128", desc: "分块尺寸，显存不足时从 256 降到 128，对插帧质量几乎没有影响。" }
        ],
        tips: "显存不足时把 tile_size 从 256 降到 128；分块对插帧质量几乎无影响。"
      },
      {
        name: "FILM VFI", cat: "video",
        brief: "大运动插帧模型，过渡更柔和，擅长大幅度运动画面。",
        desc: "FILM（Frame Interpolation for Large Motion，面向大运动的帧插值）用大感受野的网络直接合成中间帧，不做显式光流对齐，对运动幅度大、光流难以对齐的画面更稳。使用方式与 RIFE 相同：帧批次进、插值帧批次出，插帧数量通过递归插帧步数控制，帧数会成倍增长，设置时注意别一次翻太多。",
        inputs: [
          { name: "frames", type: "IMAGE", from: "典型上游：VAE Decode 或视频加载节点", desc: "待插帧的序列" },
          { name: "ckpt_name", type: "COMBO", from: "FILM 模型文件列表", desc: "FILM 插帧模型" },
          { name: "clear_cache_after_N_frames", type: "INT", from: "节点面板填写", desc: "每处理多少帧清理一次缓存" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：VHS Video Combine", desc: "插帧后的序列" }
        ],
        why: "RIFE 在剧烈运动或镜头切换处容易撕扯，FILM 作为互补方案可以救回这些镜头。",
        params: [
          { name: "ckpt_name", kind: "下拉选择", default: "film_net_fp32.pt", desc: "FILM 插帧模型文件，一般只有一个可用版本。" },
          { name: "multiplier", kind: "整数", default: "2", desc: "插帧倍率，最小为 2，帧数成倍增长，注意别一次翻太多。" },
          { name: "clear_cache_after_n_frames", kind: "整数", default: "10", desc: "每处理多少帧清理一次缓存，用来控制显存占用，一般保持默认。" }
        ],
        tips: "与 RIFE 各跑同一段对比后再定稿；FILM 速度略慢，适合关键镜头精修。"
      },
      {
        name: "GMFSS Fortuna VFI", cat: "video",
        brief: "面向动画优化的新一代插帧模型，二次元表现突出。",
        desc: "GMFSS Fortuna 是较新的插帧模型，针对动漫与赛璐璐风格做了专门优化，在二次元素材上比 RIFE、FILM 更少出现线条抖动与色块破碎。接口延续 VFI 惯例：帧批次进、插值帧批次出，倍率类参数控制补帧数量。适合 AnimateDiff 产出的动画以及外部动漫片段的补帧。",
        inputs: [
          { name: "frames", type: "IMAGE", from: "典型上游：VAE Decode 或视频加载节点", desc: "待插帧的序列" },
          { name: "ckpt_name", type: "COMBO", from: "GMFSS 模型文件列表", desc: "GMFSS Fortuna 插帧模型" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：VHS Video Combine", desc: "插帧后的序列" }
        ],
        why: "二次元内容的插帧一直是 RIFE 的弱项，GMFSS Fortuna 填补了动画向的空缺。",
        params: [
          { name: "ckpt_name", kind: "下拉选择", default: "GMFSS_fortuna_union", desc: "模型版本，union 是整合增强版。",
            options: [["GMFSS_fortuna_union", "整合版，二次元线条更稳，推荐"], ["GMFSS_fortuna", "基础版，速度稍快"]] },
          { name: "multiplier", kind: "整数", default: "2", desc: "插帧倍率，2 表示帧数翻倍。" }
        ],
        tips: "实拍素材仍优先 RIFE 或 FILM；动画素材可以把几个模型并排对比选效果。"
      },
      {
        name: "AMT VFI", cat: "video",
        brief: "大运动插帧模型 AMT，三档模型按速度与质量取舍。",
        desc: "AMT 通过全场双向相关性估计合成中间帧，对大运动与复杂遮挡比 RIFE 更稳。提供 amt-s、amt-l 等三档模型，s 最快、l 质量最高，首次使用会自动下载对应权重。multiplier 从 2 起，帧数按倍率增长。",
        inputs: [
          { name: "frames", type: "IMAGE", from: "典型上游：VAE Decode 或 VHS 加载节点", desc: "待插帧的序列" },
          { name: "ckpt_name", type: "COMBO", from: "节点面板选择", desc: "AMT 模型档位" },
          { name: "multiplier", type: "INT", from: "节点面板填写", desc: "插帧倍率" },
          { name: "clear_cache_after_n_frames", type: "INT", from: "节点面板填写", desc: "每处理多少帧清理一次缓存" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：VHS Video Combine 的 images 输入", desc: "插帧后的序列" }
        ],
        why: "镜头运动大的素材是 RIFE 的翻车重灾区，AMT 是常用的升级替代。",
        params: [
          { name: "ckpt_name", kind: "下拉选择", default: "amt-s.pth", desc: "AMT 模型档位。",
            options: [["amt-s.pth", "最小最快，先跑通用它"], ["amt-l.pth", "参数更多质量更高，定稿镜头用"]] },
          { name: "multiplier", kind: "整数", default: "2", desc: "插帧倍率，2 表示帧数翻倍，最小为 2。" }
        ],
        tips: ""
      },
      {
        name: "CAIN VFI", cat: "video",
        brief: "通道注意力插帧模型 CAIN，轻量经典，画面柔和。",
        desc: "CAIN 用通道注意力直接合成中间帧，不做显式光流对齐，计算轻、显存友好，画面风格偏柔。只有一个 pretrained_cain 权重，接口与系列其它 VFI 节点保持一致，首次使用自动下载。",
        inputs: [
          { name: "frames", type: "IMAGE", from: "典型上游：VAE Decode 或 VHS 加载节点", desc: "待插帧的序列" },
          { name: "ckpt_name", type: "COMBO", from: "节点面板选择", desc: "CAIN 模型文件" },
          { name: "multiplier", type: "INT", from: "节点面板填写", desc: "插帧倍率" },
          { name: "clear_cache_after_n_frames", type: "INT", from: "节点面板填写", desc: "每处理多少帧清理一次缓存" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：VHS Video Combine", desc: "插帧后的序列" }
        ],
        why: "老牌轻量选项，低配机器或想快速看效果的场合依然好用。",
        params: [
          { name: "ckpt_name", kind: "下拉选择", default: "pretrained_cain.pth", desc: "CAIN 预训练权重，官方只提供一个版本。" },
          { name: "multiplier", kind: "整数", default: "2", desc: "插帧倍率，2 表示帧数翻倍。" }
        ],
        tips: ""
      },
      {
        name: "IFRNet VFI", cat: "video",
        brief: "高效率插帧网络 IFRNet，速度与质量兼顾的均衡选择。",
        desc: "IFRNet 为高效率插帧设计，编码解码结构压缩了计算量：S 小模型速度极快、L 大模型质量更高，另有 Vimeo90K 与 GoPro 两个训练集版本可选。接口保持系列统一，适合大批量补帧。",
        inputs: [
          { name: "frames", type: "IMAGE", from: "典型上游：VAE Decode 或 VHS 加载节点", desc: "待插帧的序列" },
          { name: "ckpt_name", type: "COMBO", from: "节点面板选择", desc: "IFRNet 模型版本" },
          { name: "multiplier", type: "INT", from: "节点面板填写", desc: "插帧倍率" },
          { name: "clear_cache_after_n_frames", type: "INT", from: "节点面板填写", desc: "每处理多少帧清理一次缓存" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：VHS Video Combine", desc: "插帧后的序列" }
        ],
        why: "追求插帧吞吐量时它比多数同类更省时，效果却不掉队。",
        params: [
          { name: "ckpt_name", kind: "下拉选择", default: "IFRNet_S_Vimeo90K.pth", desc: "模型版本，S 快 L 好，Vimeo90K 与 GoPro 是两个训练集方向。" },
          { name: "multiplier", kind: "整数", default: "2", desc: "插帧倍率，2 表示帧数翻倍。" }
        ],
        tips: ""
      },
      {
        name: "Sepconv VFI", cat: "video",
        brief: "可分离卷积插帧 SepConv，经典老牌，慢而稳。",
        desc: "SepConv 用可分离卷积核估计运动信息合成中间帧，是插帧领域的经典方法，画面干净但速度偏慢，权重体积也较大。适合对个别镜头精修，或与 RIFE、FILM 并排评测时使用。",
        inputs: [
          { name: "frames", type: "IMAGE", from: "典型上游：VAE Decode 或 VHS 加载节点", desc: "待插帧的序列" },
          { name: "ckpt_name", type: "COMBO", from: "节点面板选择", desc: "SepConv 模型文件" },
          { name: "multiplier", type: "INT", from: "节点面板填写", desc: "插帧倍率" },
          { name: "clear_cache_after_n_frames", type: "INT", from: "节点面板填写", desc: "每处理多少帧清理一次缓存" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：VHS Video Combine", desc: "插帧后的序列" }
        ],
        why: "与 RIFE、FILM 并列的经典选项，多一个模型就多一种素材适配可能。",
        params: [
          { name: "ckpt_name", kind: "下拉选择", default: "sepconv.pth", desc: "SepConv 预训练权重，官方只提供一个版本。" },
          { name: "multiplier", kind: "整数", default: "2", desc: "插帧倍率，2 表示帧数翻倍。" }
        ],
        tips: ""
      }
    ]
  });

  /* ---------------- 7. Ultimate SD Upscale ---------------- */
  window.COMFY_DATA.nodePackages.push({
    id: "ultimate-sd-upscale",
    name: "Ultimate SD Upscale",
    author: "ssitu",
    official: false,
    category: "高清放大",
    install: "在 ComfyUI-Manager 里搜索 Ultimate SD Upscale 一键安装，并准备至少一个放大模型如 4x-UltraSharp 放入 models/upscale_models",
    summary: "Ultimate SD Upscale 是最经典的高清放大节点，把放大模型与分块重绘（Tiled Denoising，分块去噪）结合：先用放大模型得到大底图，再把大图切块逐块低强度去噪补充细节，在倍率、清晰度与稳定性之间取得平衡，是「既大、又清晰、还稳定」的标准答案。",
    why: "对大图整体重绘会爆显存且容易崩坏，纯放大模型又缺乏真实细节；它用一个节点把两种优点结合，参数体系完整，是社区验证最充分的放大方案。",
    tags: ["高清放大", "分块重绘"],
    nodes: [
      {
        name: "Ultimate SD Upscale", cat: "sampler",
        brief: "分块放大重绘核心节点，放大倍率与去噪强度全可调。",
        desc: "工作分三步。第一步：用选定的 upscale_model（放大模型，如 4x-UltraSharp）把输入图按 upscale_by 倍率放大，得到大而略糊的底图。第二步：把底图按 tile_width 与 tile_height 切成互有重叠的小块（tile_padding 控制每块多带的上下文余量），每个小块像一次微型图生图一样送入采样器跑 steps 步——关键在 denoise 强度：它决定每块允许偏离底图的程度，0.1 到 0.3 只添质感、画面几乎不变，0.35 到 0.5 会长出真实细节，0.55 以上开始改变内容且块与块之间容易风格漂移。第三步：接缝修复（seam fix）——因为各块独立去噪，边界处纹理可能对不上，mode_type 与 seam_fix 的 Half Tile、Linear 等模式会在接缝处再跑一次局部去噪或做渐变混合来抹平缝合线；mask_blur 控制块边缘的羽化程度。最终输出放大完成的 IMAGE。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：VAE Decode 或上游放大链", desc: "待放大的原图" },
          { name: "model", type: "MODEL", from: "典型上游：Load Checkpoint / LoRA 链", desc: "用于重绘的底模" },
          { name: "positive", type: "CONDITIONING", from: "典型上游：正向 CLIP Text Encode", desc: "正向条件，影响补出的细节" },
          { name: "negative", type: "CONDITIONING", from: "典型上游：负向 CLIP Text Encode", desc: "负向条件" },
          { name: "vae", type: "VAE", from: "典型上游：Load Checkpoint 或 VAE Loader", desc: "编解码器" },
          { name: "upscale_model", type: "UPSCALE_MODEL", from: "可选，Upscale Model Loader", desc: "放大模型，不接则用插值放大" },
          { name: "denoise", type: "FLOAT", from: "节点面板调节", desc: "分块去噪强度，决定改动幅度" },
          { name: "tile_width", type: "INT", from: "节点面板填写", desc: "分块宽度" },
          { name: "tile_height", type: "INT", from: "节点面板填写", desc: "分块高度" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：Save Image", desc: "放大并补足细节的成图" }
        ],
        why: "一张图同时要倍率、细节与稳定性时，它是被社区验证了无数遍的方案；分块、去噪、接缝三个层面都能精细控制。",
        params: [
          { name: "upscale_by", kind: "浮点数", default: "2.0", desc: "放大倍率，2 倍是稳妥起点，最高 4 倍，倍率越高越依赖分块重绘兜底。" },
          { name: "steps", kind: "整数", default: "20", desc: "每个分块重绘的采样步数，与主图采样类似，20 左右够用。" },
          { name: "denoise", kind: "浮点数", default: "0.2", desc: "分块重绘幅度，0.1 到 0.3 只添质感、画面几乎不变，0.35 到 0.5 长真实细节，0.55 以上开始改变内容且容易块间风格漂移。" },
          { name: "tile_width", kind: "整数", default: "512", desc: "分块宽度，块更大（如 1024）接缝更少但更占显存。" },
          { name: "tile_padding", kind: "整数", default: "32", desc: "每块向外多带的上下文余量，帮助块与块之间纹理衔接，常用 32。" },
          { name: "mask_blur", kind: "整数", default: "8", desc: "块边缘的羽化宽度，用于淡化块间接缝。" },
          { name: "mode_type", kind: "下拉选择", default: "Linear", desc: "分块重绘的排布方式。",
            options: [["Linear", "线性排布逐块处理，最通用"], ["Chess", "棋盘式隔块重绘，先一半再一半，更省时"], ["None", "只放大不重绘，等于纯放大模型输出"]] },
          { name: "seam_fix_mode", kind: "下拉选择", default: "None", desc: "接缝修复方式，决定如何抹平块与块的缝合线。",
            options: [["Half Tile", "在接缝处再跑一次半块去噪，效果最好最常用"], ["Band Pass", "在接缝处画一条修复带，速度与效果折中"], ["None", "不修复，最快，接缝可能可见"]] }
        ],
        tips: "2 倍放大起步参数：denoise 0.25 到 0.35、块尺寸 1024、tile_padding 32、接缝修复选 Half Tile。放大模型与正向提示词共同决定细节走向，补一些皮肤、材质类描述词效果更好。"
      },
      {
        name: "Ultimate SD Upscale (No Upscale)", cat: "sampler",
        brief: "不放大、只做原尺寸分块重绘的变体节点。",
        desc: "与主节点共用全部分块去噪逻辑，只是跳过放大模型步骤，直接在原始尺寸上切块重绘。两个典型用途：一是放大前先全图精修一遍，用低 denoise 统一质感；二是搭配外部放大（先跑放大模型节点或 tiled VAE 流程），再回到它做细节重绘，把「放大」与「重绘」彻底解耦、各自调到最优。接缝修复与 denoise 的作用方式与主节点完全相同。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：VAE Decode 或外部放大结果", desc: "待重绘的图像" },
          { name: "model", type: "MODEL", from: "典型上游：Load Checkpoint / LoRA 链", desc: "用于重绘的底模" },
          { name: "positive", type: "CONDITIONING", from: "典型上游：正向 CLIP Text Encode", desc: "正向条件" },
          { name: "negative", type: "CONDITIONING", from: "典型上游：负向 CLIP Text Encode", desc: "负向条件" },
          { name: "vae", type: "VAE", from: "典型上游：Load Checkpoint 或 VAE Loader", desc: "编解码器" },
          { name: "denoise", type: "FLOAT", from: "节点面板调节", desc: "分块去噪强度" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：Save Image 或下一轮放大", desc: "原尺寸精修后的图像" }
        ],
        why: "把放大与重绘拆开后，可以自由组合放大模型与重绘强度；排查问题时也更容易定位是放大糊了还是重绘崩了。",
        params: [
          { name: "steps", kind: "整数", default: "20", desc: "每个分块重绘的采样步数。" },
          { name: "denoise", kind: "浮点数", default: "0.2", desc: "分块重绘幅度，当作全图精修用 0.15 到 0.3，不会改变构图。" },
          { name: "tile_width", kind: "整数", default: "512", desc: "分块宽度，显存够用时 1024 接缝更少。" },
          { name: "tile_padding", kind: "整数", default: "32", desc: "每块向外多带的上下文余量，帮助块间纹理衔接。" },
          { name: "mask_blur", kind: "整数", default: "8", desc: "块边缘的羽化宽度，用于淡化块间接缝。" },
          { name: "mode_type", kind: "下拉选择", default: "Linear", desc: "分块重绘的排布方式。",
            options: [["Linear", "线性排布逐块处理，最通用"], ["Chess", "棋盘式隔块重绘，更省时"], ["None", "不重绘，仅原样输出"]] },
          { name: "seam_fix_mode", kind: "下拉选择", default: "None", desc: "接缝修复方式。",
            options: [["Half Tile", "在接缝处再跑一次半块去噪，效果最好"], ["Band Pass", "在接缝处画一条修复带"], ["None", "不修复，最快"]] }
        ],
        tips: "当作全图精修用：denoise 0.15 到 0.3、块尺寸 1024，正负提示词沿用出图时那一套，画面不会变构图。"
      },
      {
        name: "Ultimate SD Upscale (Custom Sample)", cat: "sampler",
        brief: "主节点的自定义采样变体，可外接采样器与噪声调度。",
        desc: "分块重绘逻辑与主节点完全一致，区别是放宽了输入：放大模型改为可选（不接则用 Lanczos 插值放大），并新增 custom_sampler 与 custom_sigmas 两个可选输入，允许接入 ComfyUI 采样器体系里的 SAMPLER 与 SIGMAS 对象，两者需同时提供才生效。想在分块重绘里用非内置采样流程时选它。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：VAE Decode", desc: "待放大的原图" },
          { name: "model", type: "MODEL", from: "典型上游：Load Checkpoint / LoRA 链", desc: "用于重绘的底模" },
          { name: "positive", type: "CONDITIONING", from: "典型上游：正向 CLIP Text Encode", desc: "正向条件" },
          { name: "negative", type: "CONDITIONING", from: "典型上游：负向 CLIP Text Encode", desc: "负向条件" },
          { name: "vae", type: "VAE", from: "典型上游：Load Checkpoint 或 VAE Loader", desc: "编解码器" },
          { name: "custom_sampler", type: "SAMPLER", from: "可选，采样器对象节点", desc: "替代内置采样的自定义采样器" },
          { name: "custom_sigmas", type: "SIGMAS", from: "可选，噪声调度节点", desc: "替代内置调度的自定义 sigma 序列" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：Save Image", desc: "放大并补足细节的成图" }
        ],
        why: "想要分块重绘的稳定性又想用社区新采样器时，它是唯一留了接口的变体。",
        params: [
          { name: "upscale_by", kind: "浮点数", default: "2.0", desc: "放大倍率，含义与主节点相同。" },
          { name: "denoise", kind: "浮点数", default: "0.2", desc: "分块重绘幅度，取值经验与主节点一致。" }
        ],
        tips: ""
      },
      {
        name: "Ultimate SD Upscale (Guider)", cat: "sampler",
        brief: "面向新版采样体系的变体，用 Guider 封装模型与条件。",
        desc: "为 ComfyUI 新版采样架构准备的变体：不再分别接模型与正负条件，而是接一个 guider（GUIDER 类型，由 BasicGuider 类节点生成，内部已封装模型、条件与 CFG），配合 sampler 与 sigmas 两个输入驱动每个分块的采样。其余分块、接缝修复等逻辑与主节点一致。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：VAE Decode", desc: "待放大的原图" },
          { name: "guider", type: "GUIDER", from: "典型上游：BasicGuider 类节点", desc: "封装模型、条件与 CFG 的引导器" },
          { name: "sampler", type: "SAMPLER", from: "可选，采样器对象节点", desc: "每个分块使用的采样器" },
          { name: "sigmas", type: "SIGMAS", from: "可选，噪声调度节点", desc: "采样噪声调度" },
          { name: "vae", type: "VAE", from: "典型上游：VAE Loader", desc: "编解码器" },
          { name: "upscale_model", type: "UPSCALE_MODEL", from: "典型上游：Upscale Model Loader", desc: "放大模型" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：Save Image", desc: "放大并补足细节的成图" }
        ],
        why: "新版工作流把模型与条件封进 Guider 后，主节点的老接口接不上，这个变体就是为它们准备的。",
        params: [
          { name: "upscale_by", kind: "浮点数", default: "2.0", desc: "放大倍率。" },
          { name: "seed", kind: "整数", default: "0", desc: "噪声种子，供分块采样生成噪声使用。" },
          { name: "tile_width", kind: "整数", default: "512", desc: "分块宽度，含义与主节点相同。" },
          { name: "tile_height", kind: "整数", default: "512", desc: "分块高度。" }
        ],
        tips: ""
      }
    ]
  });

  /* ---------------- 8. ComfyUI-GGUF ---------------- */
  window.COMFY_DATA.nodePackages.push({
    id: "comfyui-gguf",
    name: "ComfyUI-GGUF",
    author: "city96",
    official: false,
    category: "量化模型加载",
    install: "在 ComfyUI-Manager 里搜索 ComfyUI-GGUF 安装，把 gguf 模型文件分别放入 models/unet 与 models/clip 目录",
    summary: "ComfyUI-GGUF 让 ComfyUI 直接加载 GGUF 量化格式的模型权重。量化（Quantization）把 16 位浮点权重压缩到 Q4_K_M、Q5_K_M、Q8_0 等更低精度档位，显存占用成倍下降，让 8GB 级消费显卡也能跑 Flux 这类大模型，是当前低显存社区的事实标准。",
    why: "Flux 的 FP16 主模型超过 20GB，低显存用户原本无缘；GGUF 在几乎不损画质的档位下把门槛拉回消费级。量化文本编码器还能进一步压低整条工作流的显存峰值。",
    tags: ["量化", "低显存", "GGUF"],
    nodes: [
      {
        name: "Unet Loader (GGUF)", cat: "load",
        brief: "加载量化后的扩散主模型，输出与普通加载器相同的 MODEL。",
        desc: "该节点读取 gguf 格式的 UNet 或 Flux 权重文件，在加载时把低精度权重反量化（Dequantize，转回计算所需的浮点格式）送入显存，输出与 Load Checkpoint 模型部分同类型的 MODEL，可直接串 LoRA 链与采样器。unet_name 按文件名列出全部已安装的量化版本；dequant 参数控制反量化目标精度，默认自动即可。以 Flux 为例：FP16 版约 22GB，Q8_0 档约 12GB，Q4_K_M 档约 7GB，按显存量力而行。",
        inputs: [
          { name: "unet_name", type: "COMBO", from: "models/unet 目录中的 gguf 文件列表", desc: "选择量化模型文件" },
          { name: "dequant_dtype", type: "COMBO", from: "节点面板选择", desc: "反量化目标精度，默认自动" }
        ],
        outputs: [
          { type: "MODEL", to: "典型下游：LoRA 链或 KSampler 的 model 输入", desc: "量化加载的扩散模型" }
        ],
        why: "没有它，低显存设备连大模型的第一步都迈不出去；它把「能不能跑」变成了「跑哪个档位」的选择题。",
        params: [
          { name: "unet_name", kind: "下拉选择", default: "—", desc: "models/unet 里的量化模型文件，文件名中的 Q4_K_M、Q8_0 等是量化档位。",
            options: [["Q8_0", "最接近原版画质，约 12GB 级显存占用"], ["Q5_K_M", "画质与体积的折中"], ["Q4_K_M", "8GB 显存的经典选择，画质损失很小"]] },
          { name: "dequant_dtype", kind: "下拉选择", default: "default", desc: "反量化时的计算精度，default 自动选择即可。" }
        ],
        tips: "8GB 显存选 Q4_K_M，12GB 可上 Q6_K 或 Q8_0；档位越高质量越接近原版，但显存几乎线性上升。Q4_K_M 是画质与体积的经典平衡点。"
      },
      {
        name: "CLIPLoader GGUF", cat: "load",
        brief: "加载单个量化文本编码器，如 Flux 的 T5 或 clip_l。",
        desc: "文本编码器（Text Encoder）同样体积可观，Flux 的 T5-XXL 在 FP16 下约 9GB。该节点加载单个 gguf 文本编码器，输出标准 CLIP 类型，接口与内置 CLIPLoader 一致，type 参数选择对应架构（如 flux、stable_diffusion）。文本编码只在提示词阶段工作，量化它对画质的影响通常比量化主模型更小，是省显存的优先选项。",
        inputs: [
          { name: "clip_name", type: "COMBO", from: "models/clip 目录中的 gguf 文件列表", desc: "选择量化编码器文件" },
          { name: "type", type: "COMBO", from: "节点面板选择", desc: "对应模型架构" }
        ],
        outputs: [
          { type: "CLIP", to: "典型下游：CLIP Text Encode 的 clip 输入", desc: "量化加载的文本编码器" }
        ],
        why: "T5 这类大编码器常驻显存是低配设备的最大负担之一，量化后可再省下数 GB。",
        params: [
          { name: "clip_name", kind: "下拉选择", default: "—", desc: "models/clip 目录里的量化编码器文件，文件名中的档位含义与主模型相同。",
            options: [["t5xxl 系文件", "Flux 的语义理解主力，体积最大，优先量化它"], ["clip_l 系文件", "辅助编码器，保持较高精度整体损失最小"]] },
          { name: "type", kind: "下拉选择", default: "stable_diffusion", desc: "编码器对应的模型架构，要与主模型匹配。",
            options: [["flux", "Flux 系模型"], ["sd3", "Stable Diffusion 3 系"], ["stable_diffusion", "SD1.5 与 SDXL 传统架构"]] }
        ],
        tips: "优先把 T5 降到低档位量化，clip_l 保持较高精度，整体画质损失最小。"
      },
      {
        name: "DualCLIPLoader GGUF", cat: "load",
        brief: "一次加载两个量化编码器，覆盖 Flux 与 SD3 系需求。",
        desc: "Flux 与 SD3 类模型需要同时使用两个文本编码器：Flux 用 clip_l 加 t5xxl，SD3 用 clip_g 加 clip_l 等。该节点一次选择两个 gguf 文件并指定架构类型，输出一个合并的 CLIP 供下游使用。相比分别加载两个单编码器节点，它保证了类型与内部配置的正确对齐，接线也更简洁。",
        inputs: [
          { name: "clip_name1", type: "COMBO", from: "models/clip 目录中的 gguf 文件列表", desc: "第一个编码器，如 clip_l" },
          { name: "clip_name2", type: "COMBO", from: "models/clip 目录中的 gguf 文件列表", desc: "第二个编码器，如 t5xxl" },
          { name: "type", type: "COMBO", from: "节点面板选择", desc: "flux、sd3 等架构类型" }
        ],
        outputs: [
          { type: "CLIP", to: "典型下游：CLIP Text Encode 的 clip 输入", desc: "合并后的双编码器" }
        ],
        why: "双编码器架构是新一代模型的标配，量化版加载器让低显存用户也能完整走通 Flux 工作流。",
        params: [
          { name: "clip_name1", kind: "下拉选择", default: "—", desc: "第一个编码器文件，Flux 标配选 clip_l 的量化版。" },
          { name: "clip_name2", kind: "下拉选择", default: "—", desc: "第二个编码器文件，Flux 标配选 t5xxl 的量化版。" },
          { name: "type", kind: "下拉选择", default: "stable_diffusion", desc: "两个编码器的组合架构。",
            options: [["flux", "Flux 用 clip_l 加 t5xxl"], ["sd3", "SD3 用 clip_g 加 clip_l 等组合"], ["stable_diffusion", "传统双编码器架构"]] }
        ],
        tips: "Flux 标配组合是 clip_l 与 t5xxl 两个 gguf 文件；t5 选低档量化、clip_l 选高档，画质损失最小。"
      },
      {
        name: "TripleCLIPLoader GGUF", cat: "load",
        brief: "一次加载三个量化文本编码器，对应 SD3 系列需求。",
        desc: "Stable Diffusion 3 与 3.5 使用 clip_l、clip_g 与 t5xxl 三个文本编码器联合理解提示词。该节点一次选择三个 gguf 文件，输出合并后的 CLIP。三路编码器如何分工由模型架构决定，节点只负责正确加载与类型对齐。",
        inputs: [
          { name: "clip_name1", type: "COMBO", from: "models/clip 目录中的 gguf 文件列表", desc: "第一个编码器" },
          { name: "clip_name2", type: "COMBO", from: "models/clip 目录中的 gguf 文件列表", desc: "第二个编码器" },
          { name: "clip_name3", type: "COMBO", from: "models/clip 目录中的 gguf 文件列表", desc: "第三个编码器" },
          { name: "type", type: "COMBO", from: "节点面板选择", desc: "sd3 等架构类型" }
        ],
        outputs: [
          { type: "CLIP", to: "典型下游：CLIP Text Encode 的 clip 输入", desc: "合并后的三编码器" }
        ],
        why: "SD3 系三路编码器总体积可观，全部量化才能显著压低整条链路的显存峰值。",
        params: [
          { name: "clip_name1", kind: "下拉选择", default: "—", desc: "第一个编码器文件，SD3 系用 clip_l。" },
          { name: "clip_name2", kind: "下拉选择", default: "—", desc: "第二个编码器文件，SD3 系用 clip_g。" },
          { name: "clip_name3", kind: "下拉选择", default: "—", desc: "第三个编码器文件，SD3 系用 t5xxl，占体积大头。" },
          { name: "type", kind: "下拉选择", default: "stable_diffusion", desc: "三编码器的组合架构，SD3 与 SD3.5 选 sd3。" }
        ],
        tips: "SD3.5 中 t5xxl 占体积大头，显存吃紧时优先对它使用低档量化。"
      },
      {
        name: "QuadrupleCLIPLoader GGUF", cat: "load",
        brief: "一次加载四个量化文本编码器，服务超大混合架构模型。",
        desc: "部分新架构（如 HiDream 类模型）同时使用四路文本编码器。该节点一次选择四个 gguf 文件并输出合并 CLIP，是这一系列加载器的扩展形态，接口逻辑与前几个完全一致。使用前请核对目标模型官方说明列出的编码器清单，按名字一一对应放入 models/clip 目录。",
        inputs: [
          { name: "clip_name1", type: "COMBO", from: "models/clip 目录中的 gguf 文件列表", desc: "第一个编码器" },
          { name: "clip_name2", type: "COMBO", from: "models/clip 目录中的 gguf 文件列表", desc: "第二个编码器" },
          { name: "clip_name3", type: "COMBO", from: "models/clip 目录中的 gguf 文件列表", desc: "第三个编码器" },
          { name: "clip_name4", type: "COMBO", from: "models/clip 目录中的 gguf 文件列表", desc: "第四个编码器" },
          { name: "type", type: "COMBO", from: "节点面板选择", desc: "对应模型架构" }
        ],
        outputs: [
          { type: "CLIP", to: "典型下游：CLIP Text Encode 的 clip 输入", desc: "合并后的四编码器" }
        ],
        why: "多编码器是新一代大模型的趋势，四路加载器保证社区在量化形态下也能第一时间跑通新模型。",
        params: [
          { name: "clip_name1", kind: "下拉选择", default: "—", desc: "第一个编码器文件，按目标模型官方说明的清单对应。" },
          { name: "clip_name2", kind: "下拉选择", default: "—", desc: "第二个编码器文件。" },
          { name: "clip_name3", kind: "下拉选择", default: "—", desc: "第三个编码器文件。" },
          { name: "clip_name4", kind: "下拉选择", default: "—", desc: "第四个编码器文件。" },
          { name: "type", kind: "下拉选择", default: "stable_diffusion", desc: "四编码器的组合架构，按所用模型选择对应档位。" }
        ],
        tips: "四个编码器总体积可观，逐个查看体积并按需选档，优先压缩体积最大的那一路。"
      },
      {
        name: "Unet Loader (GGUF/Advanced)", cat: "load",
        brief: "带补丁精度控制的进阶量化加载器，微调反量化行为。",
        desc: "在基础版之上增加 patch_dtype（LoRA 补丁计算精度）与 patch_on_device（补丁是否常驻显卡计算）两个开关：LoRA 与量化模型精度不匹配导致报错或效果异常时，就在这里调整。dequant_dtype 控制反量化目标精度，其余行为与基础版完全一致。",
        inputs: [
          { name: "unet_name", type: "COMBO", from: "models/unet 目录中的 gguf 文件列表", desc: "选择量化模型文件" }
        ],
        outputs: [
          { type: "MODEL", to: "典型下游：LoRA 链或 KSampler 的 model 输入", desc: "量化加载的扩散模型" }
        ],
        why: "高阶排错与性能调优的入口，普通场景用基础版即可，遇到补丁精度问题才需要它。",
        params: [
          { name: "dequant_dtype", kind: "下拉选择", default: "default", desc: "反量化计算精度，default 跟随目标，也可强制指定精度。" },
          { name: "patch_dtype", kind: "下拉选择", default: "default", desc: "LoRA 补丁的计算精度，与主权重精度不一致时报错时改这里。" },
          { name: "patch_on_device", kind: "开关", default: "false", desc: "补丁是否放显卡计算，显存充裕时打开能提速。" }
        ],
        tips: ""
      }
    ]
  });

  /* ---------------- 9. ComfyUI-KJNodes ---------------- */
  window.COMFY_DATA.nodePackages.push({
    id: "kjnodes",
    name: "ComfyUI-KJNodes",
    author: "kijai",
    official: false,
    category: "实用工具集",
    install: "在 ComfyUI-Manager 里搜索 KJNodes 一键安装",
    summary: "ComfyUI-KJNodes 是 kijai 维护的实用节点工具箱，收录了变量路由、图像缩放、遮罩分析、常量输出等几十个高频小工具。它不引入新算法，而是补齐原生节点缺失的胶水能力，让大工作流更整洁、更少绕路。",
    why: "工作流一大，连线就成蛛网；GetNode 与 SetNode 的变量路由能彻底整理布线。其余工具节点则为常见小需求提供现成解法，减少硬拼原生节点的麻烦。",
    tags: ["实用工具", "工作流整理"],
    nodes: [
      {
        name: "GetNode", cat: "util",
        brief: "按变量名取出对应 SetNode 存入的数据，替代跨屏长连线。",
        desc: "与 SetNode 成对使用。SetNode 存入数据并命名后，同一工作流中的任何 GetNode 只要选择同名变量，就能拿到同一条数据，输出类型自动与存入类型一致。它相当于编程里的「读变量」：把 VAE、CLIP 这类要发给很多下游的输出变成全局可取，画布上不再拉十几条横跨半个屏幕的线。",
        inputs: [],
        outputs: [
          { type: "*", to: "典型下游：任何需要该数据的节点", desc: "读取的变量值，类型与 SetNode 存入时一致" }
        ],
        why: "大工作流的可读性直接决定改图效率，变量路由是社区公认最有效的整理手段。",
        params: [
          { name: "constant", kind: "下拉选择", default: "—", desc: "要读取的变量名，下拉列出画布上所有 SetNode 存入的变量，输出类型自动与存入类型一致。" }
        ],
        tips: "变量名建议带类型前缀，如 vae_main、model_base，检索与排错都更快。GetNode 无需连线，选对变量名即可。"
      },
      {
        name: "SetNode", cat: "util",
        brief: "给任意输入命名存为变量，供全图 GetNode 读取。",
        desc: "数据从输入进来后被打上变量名标签，同时原样从输出透传，因此可以直接串在链路中间而不破坏原有连线。一个 SetNode 可被多个 GetNode 读取，实现一对多分发；跨分组也能取用，是整理分组式工作流的关键。",
        inputs: [
          { type: "*", from: "典型上游：任何要共享的数据输出", desc: "要存为变量的数据，类型不限" }
        ],
        outputs: [
          { type: "*", to: "典型下游：原链路的下一个节点", desc: "原样透传的数据" }
        ],
        why: "没有它，全局共享数据只能靠长连线硬拉，改一次布局就要重排整张图。",
        params: [
          { name: "constant", kind: "文本", default: "", desc: "给存入数据起的变量名，同名变量只能有一个来源，GetNode 靠这个名字取数据。" }
        ],
        tips: "同名变量只能有一个来源，出现重名冲突时节点会提示，注意改名区分。"
      },
      {
        name: "Image Resize", cat: "image",
        brief: "高质量缩放图像，支持保持比例、裁切与遮罩同步。",
        desc: "全能型图像缩放节点。width 与 height 指定目标尺寸，keep_proportion 可选择拉伸、按比例适配后居中裁切等模式，upscale_method 提供 lanczos 等插值算法，周边还能补边。若输入带遮罩，遮罩会随图像同步变换并一并输出，同时输出最终的实际宽高（INT），方便下游对齐潜空间尺寸。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：Load Image 或 VAE Decode", desc: "待缩放的图像" },
          { name: "mask", type: "MASK", from: "可选，遮罩来源节点", desc: "随图像同步缩放的遮罩" },
          { name: "width", type: "INT", from: "节点面板填写", desc: "目标宽度" },
          { name: "height", type: "INT", from: "节点面板填写", desc: "目标高度" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：VAE Encode 或图像混合链", desc: "缩放后的图像" },
          { type: "MASK", to: "典型下游：遮罩处理链", desc: "同步缩放后的遮罩" },
          { type: "INT", to: "典型下游：需要实际尺寸的节点", desc: "最终宽度" },
          { type: "INT", to: "典型下游：需要实际尺寸的节点", desc: "最终高度" }
        ],
        why: "原生缩放节点不支持遮罩同步与实际尺寸输出，而多图混合前必须保证尺寸一致，这个节点一站解决。",
        params: [
          { name: "width", kind: "整数", default: "512", desc: "目标宽度，设 0 表示按原图或比例自动计算。" },
          { name: "height", kind: "整数", default: "512", desc: "目标高度，设 0 表示按原图或比例自动计算。" },
          { name: "upscale_method", kind: "下拉选择", default: "nearest-exact", desc: "插值算法，缩小图片用 lanczos 通常最锐利。",
            options: [["lanczos", "缩小时观感最锐利，常用"], ["bicubic", "平滑适中"], ["nearest-exact", "最近邻，最快但有锯齿"]] },
          { name: "keep_proportion", kind: "下拉选择", default: "stretch", desc: "比例处理方式，决定目标宽高与原图比例不一致时怎么办。",
            options: [["stretch", "强行拉伸到目标宽高，会变形"], ["resize", "保比例缩放，结果可能不精确等于目标尺寸"], ["pad", "保比例缩放后补边，内容完整不裁切"], ["crop", "保比例铺满后居中裁切"]] },
          { name: "crop_position", kind: "下拉选择", default: "center", desc: "裁切锚点在图的哪个方位，居中是多数场景的选择。" },
          { name: "divisible_by", kind: "整数", default: "2", desc: "把结果尺寸对齐到该数的倍数，进 VAE 前常用 8 或 64，避免潜空间尺寸不整导致黑图。" }
        ],
        tips: "先用保持比例模式对齐到 64 的倍数再进 VAE，避免潜空间尺寸不整导致的黑图。"
      },
      {
        name: "Empty Latent Image Preset", cat: "latent",
        brief: "按预设分辨率一键生成空潜空间，附带宽高输出。",
        desc: "内置 Empty Latent Image 的增强版：把常用分辨率整理成预设，选择 SD1.5、SDXL 等档位后微调即可，同时输出 width 与 height 两个 INT，方便接给下游做比例计算或放大回推。输出 LATENT 给 KSampler 的 latent_image 输入。",
        inputs: [
          { name: "width", type: "INT", from: "节点面板填写", desc: "宽度" },
          { name: "height", type: "INT", from: "节点面板填写", desc: "高度" },
          { name: "batch_size", type: "INT", from: "节点面板填写", desc: "一次生成几张" }
        ],
        outputs: [
          { type: "LATENT", to: "典型下游：KSampler 的 latent_image 输入", desc: "初始噪声画布" },
          { type: "INT", to: "典型下游：需要宽度的节点", desc: "当前宽度" },
          { type: "INT", to: "典型下游：需要高度的节点", desc: "当前高度" }
        ],
        why: "文生图第一环就是定分辨率，预设加尺寸输出的设计让分辨率在整个工作流中可追踪、可联动。",
        params: [
          { name: "dimensions", kind: "下拉选择", default: "512 x 512 (1:1)", desc: "常用分辨率预设，覆盖 SD1.5 到 SDXL 的常用档位，选完还会带出宽高输出供下游联动。" },
          { name: "invert", kind: "开关", default: "false", desc: "交换宽高，横版竖版一键互转。" },
          { name: "batch_size", kind: "整数", default: "1", desc: "一次生成几张，即批次大小。" }
        ],
        tips: "把它输出的宽高接到放大或裁剪节点，改一处分辨率全图自动跟随。"
      },
      {
        name: "GetMaskSizeAndCoord", cat: "mask",
        brief: "分析遮罩范围，输出边界坐标与宽高尺寸。",
        desc: "对输入遮罩做连通分析，找出有效区域的边界框，输出 x、y 坐标与 width、height（均为 INT），同时输出裁剪后的遮罩。典型用途：从手绘或检测遮罩中提取目标位置，驱动裁剪、局部重绘区域定位或参数联动，实现「画哪里就处理哪里」的自动化。",
        inputs: [
          { name: "mask", type: "MASK", from: "典型上游：遮罩生成或手绘遮罩节点", desc: "待分析的遮罩" },
          { name: "threshold", type: "FLOAT", from: "节点面板调节", desc: "判定有效像素的阈值" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：局部重绘或裁剪链", desc: "边界范围内的遮罩" },
          { type: "INT", to: "典型下游：裁剪或坐标联动节点", desc: "有效区域左上角 x" },
          { type: "INT", to: "典型下游：裁剪或坐标联动节点", desc: "有效区域左上角 y" },
          { type: "INT", to: "典型下游：裁剪或尺寸联动节点", desc: "有效区域宽度" },
          { type: "INT", to: "典型下游：裁剪或尺寸联动节点", desc: "有效区域高度" }
        ],
        why: "遮罩往往只被当作黑白色块使用；能读出它的几何信息后，局部处理流程才能真正自动化。",
        params: [
          { name: "threshold", kind: "浮点数", default: "0.01", desc: "判定有效遮罩像素的阈值，透明度低于它的像素不算在范围内，一般保持默认即可。" }
        ],
        tips: "配合内置的 Image Crop 节点按输出坐标裁剪，可自动框定重绘区域。"
      },
      {
        name: "ColorToMask", cat: "mask",
        brief: "把画面中指定颜色的区域提取为遮罩。",
        desc: "选择一个目标颜色（以整数颜色值表示），节点在输入图像中寻找接近该颜色的像素并生成对应遮罩，处理绿幕抠像、纯色背景素材非常直接。输出 MASK 可继续做模糊、膨胀收缩等形态学处理后再投入使用。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：Load Image", desc: "待提取的图像" },
          { name: "color", type: "INT", from: "节点面板选择颜色", desc: "目标颜色值" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：遮罩处理或局部重绘链", desc: "目标颜色区域遮罩" }
        ],
        why: "纯色背景素材经常需要转成遮罩来控制重绘区域，这个节点省去了去外部软件抠图的步骤。",
        params: [
          { name: "red", kind: "整数", default: "0", desc: "目标颜色的红色分量，0 到 255。" },
          { name: "green", kind: "整数", default: "0", desc: "目标颜色的绿色分量，绿幕抠像常用 255。" },
          { name: "blue", kind: "整数", default: "0", desc: "目标颜色的蓝色分量，纯绿幕组合为 0、255、0。" },
          { name: "threshold", kind: "整数", default: "10", desc: "颜色容差，背景有噪点就调小、盖不全就调大，范围 0 到 255。" },
          { name: "invert", kind: "开关", default: "false", desc: "反相遮罩，把选中和未选中的区域对调。" }
        ],
        tips: "背景色有噪点时先收紧颜色范围，或对输出遮罩做轻微膨胀。"
      },
      {
        name: "INT Constant", cat: "util",
        brief: "输出一个固定整数值，作为可调参数源。",
        desc: "最简单的节点之一：在节点上设置一个整数，输出 INT。看似平淡却是参数化工作流的关键积木——把 seed、帧数、尺寸等常量集中到几个常量节点，再经由 SetNode 与 GetNode 分发，改参数就不用满图找节点。",
        inputs: [],
        outputs: [
          { type: "INT", to: "典型下游：任何接受整数的输入", desc: "设定的整数值" }
        ],
        why: "调试和批量跑图时，集中管理常量比逐个点开节点修改快得多，也更不容易漏改。",
        params: [
          { name: "value", kind: "整数", default: "0", desc: "输出的固定整数值，可以充当 seed、帧数、尺寸等任何整数参数的来源。" }
        ],
        tips: "搭配 SetNode 命名为 seed、frames 之类，全图共享同一套参数。"
      },
      {
        name: "SaveImageWithAlpha", cat: "image",
        brief: "保存带透明通道的 PNG，透明区域按遮罩保留。",
        desc: "内置 Save Image 会把透明信息压成背景色，该节点则保留 alpha 透明通道：输入图像与可选的 alpha 遮罩，直接落盘为带透明的 PNG。适合抠像结果、贴纸素材与需要叠层合成的产出物。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：抠像或合成结果", desc: "待保存的图像" },
          { name: "mask", type: "MASK", from: "可选，遮罩来源节点", desc: "作为透明通道的遮罩" }
        ],
        outputs: [],
        why: "透明素材是合成流程的通用货币，这一步丢了 alpha，下游合成全要返工。",
        params: [
          { name: "filename_prefix", kind: "文本", default: "ComfyUI", desc: "输出文件名前缀，生成的 PNG 保存在 output 目录并带透明通道。" }
        ],
        tips: "遮罩先做一次轻微羽化再当透明通道用，边缘合成时更自然。"
      },
      {
        name: "String Constant", cat: "util",
        brief: "输出一个固定字符串，供全图引用的文本常量。",
        desc: "在节点上写一段文本，输出 STRING。与 INT Constant 同类的积木：把模型名、文件名、提示词片段等集中管理，再经 SetNode 与 GetNode 分发，改一处全图生效。",
        inputs: [],
        outputs: [
          { type: "STRING", to: "典型下游：任何接受字符串的输入", desc: "设定的固定文本" }
        ],
        why: "参数化工作流里文本常量比散落在各节点的值好维护得多。",
        params: [
          { name: "string", kind: "文本", default: "", desc: "输出的固定文本内容。" }
        ],
        tips: ""
      },
      {
        name: "String Constant Multiline", cat: "util",
        brief: "多行文本常量，适合长提示词与大段说明。",
        desc: "String Constant 的多行版：以多行编辑框输入文本并输出 STRING，strip_newlines 可选择自动去掉换行符，把多行内容压成一行喂给只认单行的下游。",
        inputs: [],
        outputs: [
          { type: "STRING", to: "典型下游：提示词编码或文本处理节点", desc: "多行文本" }
        ],
        why: "写长提示词时挤在单行输入框里是灾难，多行常量让文本可读可改。",
        params: [
          { name: "strip_newlines", kind: "开关", default: "true", desc: "输出前移除换行符，把多行内容压成单行。" }
        ],
        tips: ""
      },
      {
        name: "Float Constant", cat: "util",
        brief: "输出一个固定浮点数，精确控制小数参数。",
        desc: "设置一个小数值输出 FLOAT，精度到五位小数。与 INT Constant 互补：凡是需要小数的参数源，比如强度、倍率、比例，都由它提供，再经变量路由分发。",
        inputs: [],
        outputs: [
          { type: "FLOAT", to: "典型下游：任何接受浮点数的输入", desc: "设定的浮点值" }
        ],
        why: "原生面板的小数输入藏在各节点深处，常量化后调参集中又不易漏改。",
        params: [
          { name: "value", kind: "浮点数", default: "0.0", desc: "输出的固定浮点值。" }
        ],
        tips: ""
      },
      {
        name: "BOOL Constant", cat: "util",
        brief: "输出一个固定布尔值，当开关常量用。",
        desc: "设置开或关，输出 BOOLEAN。用于把某些节点的开关输入集中管理，或配合条件类节点做流程开关。",
        inputs: [],
        outputs: [
          { type: "BOOLEAN", to: "典型下游：接受布尔输入的节点", desc: "设定的开关值" }
        ],
        why: "流程级的开关集中到一个常量节点，试跑与定稿切换就不必满图找开关。",
        params: [
          { name: "value", kind: "开关", default: "true", desc: "输出的布尔值。" }
        ],
        tips: ""
      },
      {
        name: "Join String Multi", cat: "util",
        brief: "把任意多路字符串按分隔符拼接成一路。",
        desc: "从两个输入口起步，inputcount 调大后前端会自动长出更多输入口，把所有字符串按 delimiter 拼接输出。return_list 打开后改为输出字符串列表而非拼接结果，供列表类下游使用。",
        inputs: [
          { name: "string_1", type: "STRING", from: "典型上游：文本类节点", desc: "第一段文本" },
          { name: "string_2", type: "STRING", from: "可选，文本类节点", desc: "第二段文本，输入口可继续扩展" }
        ],
        outputs: [
          { type: "STRING", to: "典型下游：提示词编码或文本节点", desc: "拼接后的文本" }
        ],
        why: "组装动态提示词时，原生只有两路拼接可用，多路拼接全靠它。",
        params: [
          { name: "inputcount", kind: "整数", default: "2", desc: "输入口数量，调大后点更新按钮生成更多输入口。" },
          { name: "delimiter", kind: "文本", default: " ", desc: "各段文本之间的分隔符，常用逗号加空格。" },
          { name: "return_list", kind: "开关", default: "false", desc: "改为输出字符串列表，不拼接。" }
        ],
        tips: ""
      },
      {
        name: "Something To String", cat: "util",
        brief: "把任意类型的输出转成字符串，调试打印两相宜。",
        desc: "接受 ANY 类型的输入，转成 STRING 输出，可加前后缀。用途有二：一是把整数、浮点、遮罩尺寸等元数据转文本显示或拼接；二是接到预览类节点查看数值内容，排查数据流问题。",
        inputs: [
          { name: "input", type: "*", from: "典型上游：任何数据输出", desc: "任意类型数据" }
        ],
        outputs: [
          { type: "STRING", to: "典型下游：文本拼接或显示节点", desc: "转换后的字符串" }
        ],
        why: "排查数据流时能「看见」变量的值，比对着连线瞎猜高效得多。",
        params: [
          { name: "prefix", kind: "文本", default: "", desc: "加在结果前面的文字标注。" },
          { name: "suffix", kind: "文本", default: "", desc: "加在结果后面的文字标注。" }
        ],
        tips: ""
      },
      {
        name: "Dummy Out", cat: "util",
        brief: "什么都不做的占位节点，数据原样透传。",
        desc: "接受 ANY 类型输入并原样输出 ANY。看似无用却有两个高频用途：一是临时替掉链路中某个节点做对比测试；二是接住暂时用不上的分支输出，避免报错。类似的还有 Image Pass、Model Pass Through 等专型透传节点。",
        inputs: [
          { name: "any_input", type: "*", from: "任何数据输出", desc: "任意类型数据" }
        ],
        outputs: [
          { type: "*", to: "典型下游：原链路下一个节点", desc: "原样透传的数据" }
        ],
        why: "调试与临时改造工作流时，它是随时可插拔的中性转接头。",
        params: [],
        tips: ""
      },
      {
        name: "ImagePass", cat: "util",
        brief: "图像原样透传，中间插桩不改变数据。",
        desc: "接受可选的 IMAGE 输入并原样输出。作为纯图像版透传节点，常用来在关键位置插入断点做对比，或给长连线留一个「中转站」让布线更整洁。",
        inputs: [
          { name: "image", type: "IMAGE", from: "可选，任何图像输出", desc: "透传的图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：下一个图像节点", desc: "原样透传的图像" }
        ],
        why: "长图链里做 A 与 B 对比时，一个透传节点就是最轻量的实验开关。",
        params: [],
        tips: ""
      },
      {
        name: "VRAM Debug", cat: "util",
        brief: "输出执行前后的空闲显存数值，顺带清理缓存。",
        desc: "执行时记录清理前后的空闲显存并输出两个 INT，any_input、image_pass、model_pass 三路输入都原样透传，因此可以塞进任意链路当「显存探头」。empty_cache 释放 PyTorch 缓存，gc_collect 触发垃圾回收，unload_all_models 可卸载全部模型。",
        inputs: [
          { name: "any_input", type: "*", from: "可选，任何数据输出", desc: "原样透传的数据" },
          { name: "image_pass", type: "IMAGE", from: "可选，图像输出", desc: "原样透传的图像" },
          { name: "model_pass", type: "MODEL", from: "可选，模型输出", desc: "原样透传的模型" }
        ],
        outputs: [
          { type: "*", to: "典型下游：原链路下一个节点", desc: "透传的数据" },
          { type: "IMAGE", to: "典型下游：图像链下一个节点", desc: "透传的图像" },
          { type: "MODEL", to: "典型下游：模型链下一个节点", desc: "透传的模型" },
          { type: "INT", to: "典型下游：数值显示节点", desc: "执行前空闲显存" },
          { type: "INT", to: "典型下游：数值显示节点", desc: "执行后空闲显存" }
        ],
        why: "爆显存问题需要先量化再解决，这个节点让显存水位变得可见。",
        params: [
          { name: "empty_cache", kind: "开关", default: "true", desc: "执行时释放 PyTorch 的缓存显存。" },
          { name: "gc_collect", kind: "开关", default: "true", desc: "执行时触发一次 Python 垃圾回收。" },
          { name: "unload_all_models", kind: "开关", default: "false", desc: "卸载当前所有已加载模型，显存极度紧张时才用。" }
        ],
        tips: ""
      },
      {
        name: "Superprompt", cat: "util",
        brief: "用本地 T5 模型把简短提示词扩写成详细描述。",
        desc: "接入 SuperPrompt 微调过的 T5 小模型，把一句话提示词扩写成细节丰富的描述，首次运行自动下载模型。输出 STRING 直接接提示词编码。作为出图前的自动润色步骤，对文本理解类模型提升明显，但也可能引入不需要的描述，需要酌情取舍。",
        inputs: [
          { name: "prompt", type: "STRING", from: "典型上游：String Constant 或文本节点", desc: "待扩写的简短提示词" }
        ],
        outputs: [
          { type: "STRING", to: "典型下游：CLIP Text Encode 的 text 输入", desc: "扩写后的详细提示词" }
        ],
        why: "不会写长提示词的用户靠它一键补细节，也常用来给批量素材生成差异化描述。",
        params: [
          { name: "instruction_prompt", kind: "文本", default: "Expand the following prompt to add more detail", desc: "给模型的扩写指令，可以改成指定风格方向的指令。" },
          { name: "max_new_tokens", kind: "整数", default: "128", desc: "扩写结果的长度上限，越大越详细也越慢。" }
        ],
        tips: ""
      },
      {
        name: "Image Batch Multi", cat: "image",
        brief: "把任意多张图合并成一个批次。",
        desc: "从两个输入口起步，inputcount 调大后可继续添加，把多路 IMAGE 合成一个批次输出。要求各图尺寸一致，否则需先用缩放节点对齐。与原生 Image Batch 的两路固定输入相比，多路合并一步到位。",
        inputs: [
          { name: "image_1", type: "IMAGE", from: "典型上游：Load Image 或 VAE Decode", desc: "第一张图" },
          { name: "image_2", type: "IMAGE", from: "可选，同上", desc: "第二张图，输入口可继续扩展" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：批次处理或序列节点", desc: "合并后的图像批次" }
        ],
        why: "做网格图、序列处理、多图对比前的合批，这个节点省掉层层嵌套的两两合并。",
        params: [
          { name: "inputcount", kind: "整数", default: "2", desc: "输入口数量，调大后点更新按钮生成更多输入口。" }
        ],
        tips: ""
      },
      {
        name: "Image Concatenate Multi", cat: "image",
        brief: "把多张图按方向拼成一张大图。",
        desc: "多路输入按 direction 方向（右、下、左、上）拼接成一张图，match_image_size 决定拼接前是否把后续图缩放到与第一张同尺寸。与 Batch Multi 的区别是这里拼的是一张图而不是批次，适合做对比图与长条预览。",
        inputs: [
          { name: "image_1", type: "IMAGE", from: "典型上游：Load Image 或 VAE Decode", desc: "第一张图，决定输出尺寸基准" },
          { name: "image_2", type: "IMAGE", from: "可选，同上", desc: "第二张图，输入口可继续扩展" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：Save Image 或预览节点", desc: "拼接成的大图" }
        ],
        why: "出对比图与长条拼图时一步到位，不用再套多层原生拼接节点。",
        params: [
          { name: "inputcount", kind: "整数", default: "2", desc: "输入口数量。" },
          { name: "direction", kind: "下拉选择", default: "right", desc: "拼接方向，依次向右、向下、向左或向上排。" },
          { name: "match_image_size", kind: "开关", default: "false", desc: "拼接前把后续图缩放到与第一张一致，尺寸不齐时打开。" }
        ],
        tips: ""
      },
      {
        name: "Image Grid Composite 2x2", cat: "image",
        brief: "把四张图合成带标注的 2x2 网格大图。",
        desc: "输入四张图，自动排成两行两列的网格并附坐标标注，常用于一次性预览四个变体。四张图尺寸不一致时会自动对齐到统一网格，输出单张 IMAGE。",
        inputs: [
          { name: "image1", type: "IMAGE", from: "典型上游：VAE Decode", desc: "第一格图像" },
          { name: "image2", type: "IMAGE", from: "典型上游：VAE Decode", desc: "第二格图像" },
          { name: "image3", type: "IMAGE", from: "典型上游：VAE Decode", desc: "第三格图像" },
          { name: "image4", type: "IMAGE", from: "典型上游：VAE Decode", desc: "第四格图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：Save Image", desc: "2x2 网格大图" }
        ],
        why: "对比种子或参数的四个变体时，网格合成比手动拼图省事得多。",
        params: [],
        tips: ""
      },
      {
        name: "Image Grid Composite 3x3", cat: "image",
        brief: "把九张图合成 3x3 网格大图。",
        desc: "Image Grid Composite 2x2 的九宫格版：输入九张图排成三行三列并附坐标标注，输出单张 IMAGE。一次对比九个变体时是效率神器。",
        inputs: [
          { name: "image1", type: "IMAGE", from: "典型上游：VAE Decode", desc: "第一格图像，其余八格同理" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：Save Image", desc: "3x3 网格大图" }
        ],
        why: "九个变体一图看全，挑种子挑参数的效率直接翻三倍。",
        params: [],
        tips: ""
      },
      {
        name: "Image Crop By Mask And Resize", cat: "image",
        brief: "按遮罩裁出主体并缩放到目标分辨率。",
        desc: "对输入图按遮罩范围裁剪出最小外接区域，缩放到 max_crop_resolution 以内的合适尺寸输出，同时输出裁剪区域的遮罩与 BBOX 边界框。与配套的 Uncrop 节点组合，构成「抠出来修好再贴回去」的局部重绘标准流程。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：Load Image 或 VAE Decode", desc: "原图" },
          { name: "mask", type: "MASK", from: "典型上游：遮罩生成节点", desc: "指定裁剪范围的遮罩" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：局部重绘或放大链", desc: "裁剪并缩放后的局部图" },
          { type: "MASK", to: "典型下游：局部处理链", desc: "裁剪区域的遮罩" },
          { type: "BBOX", to: "典型下游：Image Uncrop By Mask 的 bbox 输入", desc: "裁剪区域边界框，贴回时用" }
        ],
        why: "局部重绘的第一步就是把目标区域抠出来放大处理，这个节点把裁剪缩放打包成一步。",
        params: [
          { name: "base_resolution", kind: "整数", default: "512", desc: "基准分辨率，裁剪结果按它对齐。" },
          { name: "padding", kind: "整数", default: "0", desc: "裁剪范围向外扩的像素数，多留点上下文过渡更自然。" },
          { name: "min_crop_resolution", kind: "整数", default: "128", desc: "裁剪结果的最小边长。" },
          { name: "max_crop_resolution", kind: "整数", default: "512", desc: "裁剪结果的最大边长，超出会被缩小。" }
        ],
        tips: ""
      },
      {
        name: "Image Uncrop By Mask", cat: "image",
        brief: "把处理好的局部图贴回原图，完成局部重绘闭环。",
        desc: "与 Crop By Mask 系列配对的收尾节点：输入原图 destination、处理后的局部图 source、对应遮罩与 BBOX 边界框，把局部图按记录的位置贴回原处并做边缘融合，输出完整大图。",
        inputs: [
          { name: "destination", type: "IMAGE", from: "典型上游：原大图", desc: "要贴回去的底图" },
          { name: "source", type: "IMAGE", from: "典型上游：局部处理结果", desc: "修好的局部图" },
          { name: "mask", type: "MASK", from: "典型上游：裁剪时输出的遮罩", desc: "对应区域的遮罩" },
          { name: "bbox", type: "BBOX", from: "典型上游：裁剪时输出的 BBOX", desc: "记录裁剪位置的边界框" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：Save Image", desc: "贴回完成的完整图" }
        ],
        why: "局部重绘最怕贴回去有色差错位，配套的裁剪贴回节点把坐标对齐问题彻底解决。",
        params: [],
        tips: ""
      },
      {
        name: "Image Pad For Outpaint Masked", cat: "image",
        brief: "按遮罩方向外扩画布并生成羽化过渡，做扩图预处理。",
        desc: "扩展图布的四边（left、top、right、bottom 指定各边扩多少），可选输入遮罩决定扩图区域，feathering 控制原内容边缘的羽化过渡。输出扩大后的图与配套遮罩，直接喂给扩图采样流程。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：Load Image 或 VAE Decode", desc: "原图" },
          { name: "mask", type: "MASK", from: "可选，遮罩生成节点", desc: "决定扩图方向的遮罩" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：扩图采样链", desc: "外扩后的图" },
          { type: "MASK", to: "典型下游：扩图采样链", desc: "外扩区域的遮罩" }
        ],
        why: "原生外扩节点不带遮罩与羽化控制，扩图边界生硬时它是最快的替代。",
        params: [
          { name: "left", kind: "整数", default: "0", desc: "向左扩展的像素数，步长 8。" },
          { name: "top", kind: "整数", default: "0", desc: "向上扩展的像素数。" },
          { name: "right", kind: "整数", default: "0", desc: "向右扩展的像素数。" },
          { name: "bottom", kind: "整数", default: "0", desc: "向下扩展的像素数。" },
          { name: "feathering", kind: "整数", default: "0", desc: "原内容边缘的羽化宽度，过渡自然度靠它。" }
        ],
        tips: ""
      },
      {
        name: "Get Image Size & Count", cat: "image",
        brief: "输出图像宽、高与批次数量，数据原样透传。",
        desc: "输入 IMAGE，输出透传的图像以及 width、height、count 三个 INT。把尺寸元数据接给缩放节点、条件分支或显示节点，让分辨率信息在链路里流动起来。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：任何图像输出", desc: "待读取的图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：下一个图像节点", desc: "原样透传的图像" },
          { type: "INT", to: "典型下游：需要宽度的节点", desc: "图像宽度" },
          { type: "INT", to: "典型下游：需要高度的节点", desc: "图像高度" },
          { type: "INT", to: "典型下游：需要数量的节点", desc: "批次中的图像数量" }
        ],
        why: "让分辨率与帧数成为可参与计算的数据，是自动化工作流的基础能力。",
        params: [],
        tips: ""
      },
      {
        name: "Get Image or Mask Range From Batch", cat: "image",
        brief: "从批次中按起始索引截取一段帧或图。",
        desc: "输入图像或遮罩批次，用 start_index 与 num_frames 截取一段输出：start_index 填 -1 表示从末尾倒数。典型用途是视频首尾帧提取、分段处理与滚动窗口式重绘。",
        inputs: [
          { name: "images", type: "IMAGE", from: "可选，图像批次", desc: "待截取的图像批次" },
          { name: "masks", type: "MASK", from: "可选，遮罩批次", desc: "待截取的遮罩批次" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：处理或合成链", desc: "截取出的图像段" },
          { type: "MASK", to: "典型下游：处理或合成链", desc: "截取出的遮罩段" }
        ],
        why: "批次的分段处理全靠索引截取，一个节点同时伺候图像与遮罩两路。",
        params: [
          { name: "start_index", kind: "整数", default: "0", desc: "起始索引，-1 表示从末尾开始倒数。" },
          { name: "num_frames", kind: "整数", default: "1", desc: "截取的帧数。" }
        ],
        tips: ""
      },
      {
        name: "Cross Fade Images", cat: "image",
        brief: "在两组帧之间做可调曲线的交叉淡化转场。",
        desc: "输入两组帧序列，从 transition_start_index 开始用 transitioning_frames 帧完成交叉淡化，interpolation 提供线性、缓入缓出、弹性、故障感等多种过渡曲线，start_level 与 end_level 控制淡化起止幅度。输出合成后的完整序列。",
        inputs: [
          { name: "images_1", type: "IMAGE", from: "典型上游：VAE Decode 或视频加载", desc: "前一段帧序列" },
          { name: "images_2", type: "IMAGE", from: "典型上游：VAE Decode 或视频加载", desc: "后一段帧序列" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：VHS Video Combine", desc: "带转场的完整序列" }
        ],
        why: "两段动画硬切太生硬，交叉淡化是最低成本的转场方案。",
        params: [
          { name: "interpolation", kind: "下拉选择", default: "linear", desc: "过渡曲线，linear 平直、ease 系柔和、glitchy 带故障感。" },
          { name: "transition_start_index", kind: "整数", default: "1", desc: "从第几帧开始转场，负数表示从末尾倒数。" },
          { name: "transitioning_frames", kind: "整数", default: "1", desc: "转场持续的帧数，越多过渡越缓。" },
          { name: "start_level", kind: "浮点数", default: "0.0", desc: "转场起始混合比例。" },
          { name: "end_level", kind: "浮点数", default: "1.0", desc: "转场结束混合比例。" }
        ],
        tips: ""
      },
      {
        name: "ImageAndMaskPreview", cat: "image",
        brief: "把遮罩以指定颜色半透明叠加到图上预览。",
        desc: "临时预览节点：把遮罩按 mask_color 与 mask_opacity 叠加显示在图像上，不产生正式输出文件。pass_through 打开后把预览图转成正式图像输出。排查遮罩范围与羽化是否正确时几乎天天用它。",
        inputs: [
          { name: "image", type: "IMAGE", from: "可选，任何图像输出", desc: "底图" },
          { name: "mask", type: "MASK", from: "可选，任何遮罩输出", desc: "要叠加显示的遮罩" }
        ],
        outputs: [],
        why: "遮罩对不对肉眼说了算，这个预览节点是遮罩工作流的排错标配。",
        params: [
          { name: "mask_opacity", kind: "浮点数", default: "1.0", desc: "遮罩叠加的透明度，1 为不透明。" },
          { name: "mask_color", kind: "文本", default: "255, 255, 255", desc: "遮罩颜色，支持 RGB 数组、RGBA 数组与十六进制写法。" },
          { name: "pass_through", kind: "开关", default: "false", desc: "把叠加结果作为正式图像输出给下游。" }
        ],
        tips: ""
      },
      {
        name: "Preview Animation", cat: "image",
        brief: "在工作流内把帧批次快速预览成动画。",
        desc: "把 IMAGE 批次按 fps 播放成节点内嵌的临时动画预览，也支持遮罩批次。写临时文件、不进 output 目录，用来确认帧序列节奏，确认后再接 Video Combine 正式导出。",
        inputs: [
          { name: "images", type: "IMAGE", from: "可选，VAE Decode 或插帧节点", desc: "待预览的帧序列" },
          { name: "masks", type: "MASK", from: "可选，遮罩批次", desc: "待预览的遮罩序列" }
        ],
        outputs: [],
        why: "出片前看一眼动态节奏，能省掉一整轮不必要的正式渲染。",
        params: [
          { name: "fps", kind: "浮点数", default: "8.0", desc: "预览播放的帧率，与导出帧率保持一致最直观。" }
        ],
        tips: ""
      },
      {
        name: "Color Match", cat: "image",
        brief: "把目标图的色彩分布对齐到参考图。",
        desc: "以 image_ref 为色彩基准，调整 image_target 的色彩分布，method 提供 mkl、reinhard 等多种统计匹配算法，strength 控制匹配力度。视频工作流里逐帧统一色调、风格迁移后校正色偏都靠它。",
        inputs: [
          { name: "image_ref", type: "IMAGE", from: "典型上游：色彩基准图", desc: "色彩参考图" },
          { name: "image_target", type: "IMAGE", from: "典型上游：待校正的目标图", desc: "要被调整的图" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：Save Image 或合成链", desc: "色彩对齐后的图" }
        ],
        why: "多批次生成的画面色调飘忽时，色彩匹配是拉回一致性的最快手段。",
        params: [
          { name: "method", kind: "下拉选择", default: "mkl", desc: "色彩统计算法，mkl 通用且稳，reinhard 经典快速，hm-mkl-hm 组合算法更精细。" },
          { name: "strength", kind: "浮点数", default: "1.0", desc: "匹配强度，1 为完全对齐，调低保留部分原色调。" }
        ],
        tips: ""
      },
      {
        name: "Grow Mask With Blur", cat: "mask",
        brief: "一个节点完成遮罩扩张、填洞与边缘羽化。",
        desc: "遮罩处理瑞士军刀：expand 正负值控制膨胀收缩，tapered_corners 让直角变圆滑，blur_radius 对边缘羽化，fill_holes 补上遮罩内部的小洞。局部重绘前几乎都要过一遍它，把生硬的手绘遮罩变成边缘柔和的可用遮罩。",
        inputs: [
          { name: "mask", type: "MASK", from: "典型上游：遮罩生成节点", desc: "待处理的遮罩" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：重绘、预览或混合节点", desc: "处理后的遮罩" }
        ],
        why: "原生膨胀与羽化要串好几个节点，这里一个旋钮全包，参数还好回溯。",
        params: [
          { name: "expand", kind: "整数", default: "0", desc: "扩张像素数，正数膨胀负数收缩。" },
          { name: "tapered_corners", kind: "开关", default: "true", desc: "圆化直角，遮罩边缘更自然。" },
          { name: "blur_radius", kind: "浮点数", default: "0.0", desc: "边缘羽化半径，重绘过渡是否自然就看它。" },
          { name: "fill_holes", kind: "开关", default: "false", desc: "填补遮罩内部空洞。" }
        ],
        tips: ""
      },
      {
        name: "Create Text Mask", cat: "mask",
        brief: "把文字渲染成图像与遮罩，可加旋转动画。",
        desc: "按字体与字号把 text 渲染到指定尺寸的画布上，同时输出 IMAGE 与 MASK 两路，text_x、text_y 控制位置，start_rotation 与 end_rotation 不同时可生成逐帧旋转动画。做水印、文字遮罩、逐帧文字动效都很方便。",
        inputs: [],
        outputs: [
          { type: "IMAGE", to: "典型下游：预览或合成链", desc: "文字图像" },
          { type: "MASK", to: "典型下游：遮罩处理或局部重绘链", desc: "文字遮罩" }
        ],
        why: "文字转遮罩省去了去外部软件画字的往返，配合变量路由还能做动态字幕。",
        params: [
          { name: "text", kind: "文本", default: "HELLO!", desc: "要渲染的文字内容。" },
          { name: "font_size", kind: "整数", default: "32", desc: "字号。" },
          { name: "frames", kind: "整数", default: "1", desc: "输出帧数，配合旋转参数做文字动画。" },
          { name: "font", kind: "下拉选择", default: "—", desc: "字体文件，来自插件自带的 fonts 目录。" }
        ],
        tips: ""
      },
      {
        name: "Create Gradient Mask", cat: "mask",
        brief: "生成黑白渐变遮罩，多帧可做渐变流动动画。",
        desc: "生成横向黑到白的线性渐变遮罩：单帧时直接可用，frames 大于 1 时每帧的渐变位置随时间偏移，形成循环流动的渐变，常用于视频局部渐变控制与过渡遮罩。width 与 height 指定尺寸。",
        inputs: [],
        outputs: [
          { type: "MASK", to: "典型下游：遮罩混合或条件控制", desc: "渐变遮罩" }
        ],
        why: "渐变遮罩是最常用的过渡素材，按帧生成流动渐变更是原生节点做不到的。",
        params: [
          { name: "frames", kind: "整数", default: "0", desc: "帧数，0 或 1 输出单帧，大于 1 时渐变逐帧偏移成动画。" },
          { name: "width", kind: "整数", default: "256", desc: "遮罩宽度。" },
          { name: "height", kind: "整数", default: "256", desc: "遮罩高度。" },
          { name: "invert", kind: "开关", default: "false", desc: "黑白反转。" }
        ],
        tips: ""
      },
      {
        name: "Separate Masks", cat: "mask",
        brief: "把含多个目标的遮罩拆成每个目标一张。",
        desc: "输入一张含多个独立区域的遮罩，按几何分析把每个区域拆成单独的遮罩批次输出，可用面积或轮廓模式过滤小噪点。配合索引截取节点可对每个目标分别处理，实现多主体分别重绘。",
        inputs: [
          { name: "mask", type: "MASK", from: "典型上游：遮罩生成或检测节点", desc: "含多个区域的遮罩" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：索引截取或逐区域处理链", desc: "逐区域拆分的遮罩批次" }
        ],
        why: "多主体图想逐个分别处理，第一步就是把粘连的遮罩拆开。",
        params: [
          { name: "mode", kind: "下拉选择", default: "area", desc: "区域识别方式，area 按连通面积、box 按外接框、convex_polygons 按多边形轮廓。" },
          { name: "size_threshold_width", kind: "整数", default: "256", desc: "宽度阈值，小于它的区域会被过滤掉。" },
          { name: "size_threshold_height", kind: "整数", default: "256", desc: "高度阈值，与宽度阈值配合过滤小噪点。" }
        ],
        tips: ""
      },
      {
        name: "Offset Mask", cat: "mask",
        brief: "按位移与角度整体挪动遮罩，支持逐帧递增。",
        desc: "把遮罩按 x、y 平移并按 angle 旋转，incremental 打开后批次内每帧递增叠加变换，形成持续漂移的遮罩动画；roll 决定出界部分是否从另一侧绕回。视频工作流里让重绘区域随时间移动就靠它。",
        inputs: [
          { name: "mask", type: "MASK", from: "典型上游：遮罩生成节点", desc: "待变换的遮罩" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：重绘或混合链", desc: "位移旋转后的遮罩" }
        ],
        why: "让遮罩跟着镜头动起来，是视频局部重绘区别于静图的关键一招。",
        params: [
          { name: "x", kind: "整数", default: "0", desc: "水平位移像素数。" },
          { name: "y", kind: "整数", default: "0", desc: "垂直位移像素数。" },
          { name: "angle", kind: "整数", default: "0", desc: "旋转角度，正负 360 度。" },
          { name: "incremental", kind: "开关", default: "false", desc: "逐帧累加变换量，形成连续漂移动画。" },
          { name: "roll", kind: "开关", default: "false", desc: "边缘环绕，出界内容从对侧回来。" }
        ],
        tips: ""
      },
      {
        name: "Conditioning Multi Combine", cat: "cond",
        brief: "把任意多路条件合并成一路，可叠加或拼接。",
        desc: "从两路条件起步，inputcount 调大后继续扩展，把多路正负条件合成一路输出：operation 选 combine 时按加权求和叠加，选 concat 时按序列拼接。多主体多区域工作流里合并各分支条件的总装台。",
        inputs: [
          { name: "conditioning_1", type: "CONDITIONING", from: "典型上游：CLIP Text Encode 等", desc: "第一路条件" },
          { name: "conditioning_2", type: "CONDITIONING", from: "可选，同上", desc: "第二路条件，输入口可继续扩展" }
        ],
        outputs: [
          { type: "CONDITIONING", to: "典型下游：KSampler 的 positive 或 negative 输入", desc: "合并后的条件" },
          { type: "INT", to: "典型下游：需要输入数的节点", desc: "实际合并的路数" }
        ],
        why: "多分支条件的合并需求远超原生两路节点的上限，这个节点就是为此而生。",
        params: [
          { name: "inputcount", kind: "整数", default: "2", desc: "输入口数量，调大后点更新按钮生成更多输入口。" },
          { name: "operation", kind: "下拉选择", default: "combine", desc: "combine 按强度叠加合并，concat 按顺序拼接。" }
        ],
        tips: ""
      },
      {
        name: "ConditioningSetMaskAndCombine", cat: "cond",
        brief: "两路条件各自挂遮罩后合并，多区域控制一步到位。",
        desc: "相当于把两组「设遮罩加合并」原生节点压成一个：positive_1 与 negative_1 挂 mask_1，positive_2 与 negative_2 挂 mask_2，各自的强度由 mask_1_strength 与 mask_2_strength 控制，最后合并输出一对条件。还有三、四、五路扩展版本。",
        inputs: [
          { name: "positive_1", type: "CONDITIONING", from: "典型上游：正向 CLIP Text Encode", desc: "区域一正向条件" },
          { name: "negative_1", type: "CONDITIONING", from: "典型上游：负向 CLIP Text Encode", desc: "区域一负向条件" },
          { name: "positive_2", type: "CONDITIONING", from: "典型上游：正向 CLIP Text Encode", desc: "区域二正向条件" },
          { name: "negative_2", type: "CONDITIONING", from: "典型上游：负向 CLIP Text Encode", desc: "区域二负向条件" },
          { name: "mask_1", type: "MASK", from: "典型上游：遮罩节点", desc: "区域一遮罩" },
          { name: "mask_2", type: "MASK", from: "典型上游：遮罩节点", desc: "区域二遮罩" }
        ],
        outputs: [
          { type: "CONDITIONING", to: "典型下游：KSampler 的 positive 输入", desc: "合并后的正向条件" },
          { type: "CONDITIONING", to: "典型下游：KSampler 的 negative 输入", desc: "合并后的负向条件" }
        ],
        why: "左右分区不同提示词的多区域出图，用它比手拼原生节点少一半连线。",
        params: [
          { name: "mask_1_strength", kind: "浮点数", default: "1.0", desc: "区域一遮罩的作用强度。" },
          { name: "mask_2_strength", kind: "浮点数", default: "1.0", desc: "区域二遮罩的作用强度。" },
          { name: "set_cond_area", kind: "下拉选择", default: "default", desc: "default 全图生效，mask bounds 把作用范围收缩到遮罩边界。" }
        ],
        tips: ""
      },
      {
        name: "Inject Noise To Latent", cat: "latent",
        brief: "往潜空间里注入可控强度的噪声，局部或全图皆可。",
        desc: "输入 latents 与 noise 两路潜空间，按 strength 混合输出：mask 可把注入限制在局部，normalize 把结果归一化防止数值爆炸，average 改为取平均，mix_randn_amount 还能再混入一份随机噪声。常用于 img2img 加细节、局部重绘加随机性或清洗噪声。",
        inputs: [
          { name: "latents", type: "LATENT", from: "典型上游：KSampler 或 Empty Latent", desc: "基底潜空间" },
          { name: "noise", type: "LATENT", from: "典型上游：Generate Noise 或另一份潜空间", desc: "要注入的噪声潜空间" },
          { name: "mask", type: "MASK", from: "可选，遮罩节点", desc: "限定注入区域" },
          { name: "seed", type: "INT", from: "可选，INT 常量", desc: "随机噪声的种子" }
        ],
        outputs: [
          { type: "LATENT", to: "典型下游：KSampler 的 latent_image 输入", desc: "注入噪声后的潜空间" }
        ],
        why: "精确控制加噪的位置与强度，是 img2img 调质感和局部重绘补随机性的利器。",
        params: [
          { name: "strength", kind: "浮点数", default: "0.1", desc: "噪声注入强度，从小值起试，过大画面会被噪声淹没。" },
          { name: "normalize", kind: "开关", default: "false", desc: "输出前做标准差归一化，防止数值漂移。" },
          { name: "average", kind: "开关", default: "false", desc: "改为基底与噪声取平均，效果更温和。" },
          { name: "mix_randn_amount", kind: "浮点数", default: "0.0", desc: "额外混入的随机噪声比例，配合 seed 使用。" }
        ],
        tips: ""
      },
      {
        name: "Generate Noise", cat: "latent",
        brief: "按尺寸与种子生成纯噪声潜空间。",
        desc: "按 width、height、batch_size 生成一份随机噪声，以 LATENT 形式输出：可以Inject 到别的潜空间，也可以在采样器关闭加噪时直接当初始潜空间用。multiplier 放大噪声幅度，constant_batch_noise 让同批次共享同一份噪声，latent_channels 与 shape 支持新一代视频模型的不同潜空间形状。",
        inputs: [],
        outputs: [
          { type: "LATENT", to: "典型下游：Inject Noise To Latent 或 KSampler", desc: "噪声潜空间" }
        ],
        why: "可控的噪声来源是很多进阶玩法的起点，从 FreeNoise 到潜空间混合都离不开它。",
        params: [
          { name: "width", kind: "整数", default: "512", desc: "噪声画布宽度，按像素填，内部自动换算成潜空间尺寸。" },
          { name: "height", kind: "整数", default: "512", desc: "噪声画布高度。" },
          { name: "batch_size", kind: "整数", default: "1", desc: "批次大小，即生成几份噪声。" },
          { name: "seed", kind: "整数", default: "123", desc: "随机种子，固定它噪声就可复现。" },
          { name: "multiplier", kind: "浮点数", default: "1.0", desc: "噪声幅度倍率。" },
          { name: "constant_batch_noise", kind: "开关", default: "false", desc: "批次内所有噪声相同，做一致性实验时用。" }
        ],
        tips: ""
      },
      {
        name: "Spline Editor", cat: "mask",
        brief: "在节点上画样条曲线，输出坐标序列与遮罩。",
        desc: "交互式编辑器：在节点面板的画布上绘制样条曲线并调整插值方式，输出坐标串、按 points_to_sample 采样的 FLOAT 序列、采样点数与 normalized 坐标串，同时可输出沿曲线的遮罩。常用于给视频工作流提供随时间变化的轨迹控制，比如镜头路径或效果强度曲线。",
        inputs: [],
        outputs: [
          { type: "MASK", to: "典型下游：遮罩处理链", desc: "沿曲线生成的遮罩" },
          { type: "STRING", to: "典型下游：坐标解析节点", desc: "曲线坐标字符串" },
          { type: "FLOAT", to: "典型下游：需要数值序列的节点", desc: "按曲线采样的数值序列" },
          { type: "INT", to: "典型下游：需要数量的节点", desc: "采样点数" }
        ],
        why: "把「随时间变化的数值曲线」变成可视化编辑，比手写关键帧序列直观一个量级。",
        params: [
          { name: "points_to_sample", kind: "整数", default: "16", desc: "沿曲线采样的点数，对应输出序列长度。" },
          { name: "interpolation", kind: "下拉选择", default: "cardinal", desc: "曲线插值方式，cardinal 平滑、linear 折线、step-before 阶梯等。" },
          { name: "mask_width", kind: "整数", default: "512", desc: "编辑器画布宽度，决定坐标范围。" },
          { name: "mask_height", kind: "整数", default: "512", desc: "编辑器画布高度。" }
        ],
        tips: ""
      },
      {
        name: "Sound Reactive", cat: "audio",
        brief: "读取浏览器声音输入，输出实时声音强度数值。",
        desc: "通过浏览器麦克风或系统声音获取实时音量，经频段过滤（start_range_hz 到 end_range_hz）、倍率放大与平滑后输出 FLOAT 与 INT 两路声音强度。配合实时扩散与自动队列，可以让画面强度随音乐律动。",
        inputs: [],
        outputs: [
          { type: "FLOAT", to: "典型下游：强度类参数输入", desc: "实时声音强度" },
          { type: "INT", to: "典型下游：整数参数输入", desc: "取整后的声音强度" }
        ],
        why: "音乐可视化与声音驱动生成的入门节点，无需任何音频预处理链。",
        params: [
          { name: "multiplier", kind: "浮点数", default: "1.0", desc: "强度放大倍率。" },
          { name: "smoothing_factor", kind: "浮点数", default: "0.5", desc: "平滑系数，越大曲线越柔和、跟随越慢。" },
          { name: "start_range_hz", kind: "整数", default: "150", desc: "参与统计的频段下限。" },
          { name: "end_range_hz", kind: "整数", default: "2000", desc: "参与统计的频段上限，只听低音鼓点就把上限调低。" }
        ],
        tips: ""
      }
    ]
  });
})();
