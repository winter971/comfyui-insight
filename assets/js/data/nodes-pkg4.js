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
        tips: "参考图分辨率偏低时适当增加锐化，布纹、笔触等细节更容易被学到。"
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
        tips: "提醒：人脸属于敏感个人信息，处理他人照片前请确认已获得授权，并遵守肖像权与个人信息保护法规。修复权重越高画面越「整齐」但越容易失真。"
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
        tips: "预览图上关键点错乱时先换正脸图或裁剪放大；多人脸图先框定目标脸。提醒：调试真实人脸素材时注意肖像权授权。"
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
        tips: "先用 16 帧小尺寸测试构图与运动，确认后再放大 length 与分辨率。"
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
        tips: "出片前先用 gif 或高 crf 快速预览运动效果，确认后再导出高质量 mp4。"
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
        tips: "实拍素材仍优先 RIFE 或 FILM；动画素材可以把几个模型并排对比选效果。"
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
        tips: "当作全图精修用：denoise 0.15 到 0.3、块尺寸 1024，正负提示词沿用出图时那一套，画面不会变构图。"
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
        tips: "四个编码器总体积可观，逐个查看体积并按需选档，优先压缩体积最大的那一路。"
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
        tips: "遮罩先做一次轻微羽化再当透明通道用，边缘合成时更自然。"
      }
    ]
  });
})();
