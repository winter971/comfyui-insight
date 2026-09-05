/* ============================================================
   WIDGET_HELP — ComfyUI 常见参数知识库
   按 参数名 匹配，为任何节点的参数提供中文详解与选项含义
   ============================================================ */
(function () {
  "use strict";

  var H = {};

  /* ---- 采样核心 ---- */
  H.seed = { zh: "种子", desc: "决定初始噪声的随机数。同一个种子+同一套参数=完全相同的结果，想固定构图微调提示词就锁定它。填 -1（或点击骰子）表示每次随机。" };
  H.noise_seed = { zh: "噪声种子", desc: "作用同种子，Advanced 采样节点中把『造噪声』与『加噪声』分开控制。" };
  H.steps = { zh: "采样步数", desc: "去噪迭代的次数。越多越精细但越慢。SD1.5/SDXL 常用 20-35；Turbo/LCM 模型 4-8 即可；Flux 用 20 左右。超过 40 收益极低。" };
  H.cfg = { zh: "提示词引导强度 (CFG)", desc: "模型对提示词的服从度。过高（>9）画面僵硬过饱和，过低（<3）开始无视提示词。SD1.5 常用 7 左右，SDXL 5-7，Turbo/LCM 必须用 1-2，Flux 不使用传统 cfg。" };
  H.denoise = { zh: "重绘幅度", desc: "图生图/重绘/放大时控制改动力度：1.0 完全重画（等于文生图），0.5 保留构图改细节，0.3 以下仅微调纹理。高清修复第二遍常用 0.35-0.55。" };
  H.sampler_name = {
    zh: "采样算法", desc: "去噪的数学策略。选哪个对速度和画风都有影响。",
    options: [
      ["euler", "最朴素稳定，通用首选，出图柔和"],
      ["euler_ancestral (euler_a)", "每步引入随机性，细节更奔放，同种子复现性略差"],
      ["dpmpp_2m", "2阶多步方法，速度与质量兼顾，配合 karras 是社区最热门组合"],
      ["dpmpp_2m_sde", "在 dpmpp_2m 基础上加噪声方程，纹理更锐利"],
      ["dpmpp_3m_sde", "3阶版本，步数足够时细节更优，速度稍慢"],
      ["dpmpp_sde", "单步随机版本，风格偏细腻锐利"],
      ["ddim", "经典确定性采样，适合需要中间可预测性的场景"],
      ["uni_pc", "较新的高阶求解器，低步数表现好"],
      ["lcm", "LCM 模型专用，4-8 步出图"],
      ["res_multistep", "SVD 视频模型常用"]
    ]
  };
  H.scheduler = {
    zh: "调度器", desc: "控制每一步的噪声强度时间表（sigmas）。同样的采样器配不同调度器，画面质感不同。",
    options: [
      ["normal", "默认线性计划，通用"],
      ["karras", "步间过渡更平滑，细节更干净，最常用"],
      ["exponential", "指数衰减，早期去噪快，构图感强"],
      ["sgm_uniform", "SD3/Flux/视频模型常用"],
      ["simple", "简化日程，部分新模型表现更稳"],
      ["beta", "按测试对 SD3 系效果更好"]
    ]
  };
  H.start_at_step = { zh: "起始步", desc: "从第几步开始执行（用于把一次采样切成两段，与 end_at_step 配合，两段的步数表必须一致）。" };
  H.end_at_step = { zh: "结束步", desc: "执行到第几步停止。高清修复典型用法：第一遍到 15 停，放大后从 15 继续。" };
  H.add_noise = { zh: "是否添加噪声", desc: "Advanced 采样开关：第二段续采样时要关掉，否则画面会被重新打脏。" };
  H.return_with_leftover_noise = { zh: "保留剩余噪声", desc: "开启后中途截断的结果带着残余噪声输出，专用于两段式接力的第一段。" };
  H.force_full_denoise = { zh: "强制完全去噪", desc: "视频/接力采样里确保最后一步彻底去净噪声。" };

  /* ---- 尺寸与批次 ---- */
  H.width = { zh: "宽度 (px)", desc: "输出宽度。注意这是潜空间尺寸：SD1.5 以 512 为基准、SDXL/Flux 以 1024 为基准，偏离太多会构图崩坏；需为 8 的倍数。" };
  H.height = { zh: "高度 (px)", desc: "输出高度。竖图 768x1024（SD1.5）/ 1024x1536（SDXL）是常用档位。" };
  H.batch_size = { zh: "批次数", desc: "一次并行生成几张图。显存消耗按张数近似线性增加，12G 显存跑 SDXL 建议 ≤3。" };
  H.length = { zh: "帧数", desc: "视频 latent 的总帧数。显存随帧数近似线性上涨，Wan 5B 在 12G 卡建议 81 帧内。" };
  H.fps = { zh: "帧率", desc: "合成视频的每秒帧数。16 是多数开源视频模型的训练帧率，配合 8 的倍数选帧数。" };
  H.upscale_method = {
    zh: "插值算法", desc: "潜空间/图像放大时用的插值方式。",
    options: [
      ["nearest-exact", "最近邻，硬边像素风"],
      ["bilinear", "双线性，速度快，偏糊"],
      ["area", "区域平均，整体平滑"],
      ["bicubic", "三次卷积，较锐利，放大首选"],
      ["lanczos", "质量最高的经典插值，稍慢"]
    ]
  };
  H.crop = { zh: "裁剪", desc: "centered 表示缩放时按中心裁齐到目标比例；disabled 则直接拉伸变形。" };

  /* ---- 模型与加载 ---- */
  H.ckpt_name = { zh: "底模文件", desc: "models/checkpoints 目录下的模型。模型决定大致画风上限；文件放进去后刷新列表即可看到。" };
  H.unet_name = { zh: "扩散主干", desc: "分离式模型的主干文件（Flux/Wan/SD3 等在 models/diffusion_models 或 unet 目录），可选用 fp8 量化版省显存。" };
  H.clip_name = { zh: "文本编码器", desc: "models/clip 目录下的编码器文件。T5 系负责长文本理解，CLIP-L 负责短标签触发。" };
  H.clip_name1 = { zh: "文本编码器 1", desc: "Flux 用 T5-XXL 负责长文本理解，CLIP-L 负责短标签触发。" };
  H.clip_name2 = { zh: "文本编码器 2", desc: "与编码器 1 组成双编码器组合，Dual 版本一次挂两个。" };
  H.lora_name = { zh: "LoRA 文件", desc: "models/loras 目录下的微调补丁文件。" };
  H.strength_model = { zh: "模型强度", desc: "LoRA 对画面的影响力度。1.0 完全施加；多 LoRA 叠加建议各 0.6-0.8 起步，过高互相打架。" };
  H.strength_clip = { zh: "编码器强度", desc: "LoRA 对文本编码侧的影响力度。一般与模型强度保持一致即可。" };
  H.stop_at_clip_layer = { zh: "CLIP 截断层", desc: "-1 或 -2 表示截掉编码器最后 1/2 层，部分二次元底模用 -2 明显提升色彩与构图。" };
  H.vae_name = { zh: "VAE 文件", desc: "models/vae 目录下的编解码器。出图发灰常是 VAE 不匹配，SDXL 建议显式挂官方 VAE。" };

  /* ---- 条件与控制 ---- */
  H.guidance = { zh: "引导值 (Flux)", desc: "Flux 的 distilled 引导：3.5 是通用默认，越高越贴提示词但越死板，人像 2.5-3.5，需要严格服从构图时 4-5。" };
  H.strength = { zh: "控制强度", desc: "ControlNet/IPAdapter 等对结果的影响力度。ControlNet 0.8-1.0 全程控制；0.5-0.7 留自由度。" };
  H.start_percent = { zh: "起始占比", desc: "控制从采样的前百分之几开始生效，默认 0。" };
  H.end_percent = { zh: "结束占比", desc: "控制到百分之几停止生效。0.5-0.8 表示后半程松手让模型自由补细节，是防『结构过度僵硬』的常用技巧。" };
  H.positive = { zh: "正向作用面", desc: "Advanced 控制节点里单独指定 ControlNet 只作用于正向条件。" };
  H.negative = { zh: "负向作用面", desc: "Advanced 控制节点里单独指定 ControlNet 对负向条件也生效（一般保持默认）。" };
  H.control_net_name = { zh: "ControlNet 模型", desc: "models/controlnet 目录下的控制网文件。名字里的 canny/depth/pose 等后缀标明它吃哪种参考图。" };
  H.preprocessor = { zh: "预处理器", desc: "把普通照片转成对应类型的参考图（线稿/深度/姿态），必须与 ControlNet 类型匹配。" };
  H.low_threshold = { zh: "Canny 低阈值", desc: "边缘检测下限，低于此梯度不算边缘。默认 0.4。" };
  H.high_threshold = { zh: "Canny 高阈值", desc: "边缘检测上限，高于此梯度必为边缘。默认 0.8，两个阈值间为过渡区。" };

  /* ---- 输入输出与杂项 ---- */
  H.image = { zh: "图像", desc: "选择 input 目录中的图片或上传。" };
  H.filename_prefix = { zh: "文件名前缀", desc: "保存文件命名模板，支持 ComfyUI_[%date:yyyy-MM-dd%] 等占位符，输出到 output 目录。" };
  H.channel = { zh: "通道", desc: "从图片的 red/green/blue/alpha 哪个通道提取蒙版。" };
  H.blend_mode = {
    zh: "混合模式", desc: "图层叠加的数学方式，与 Photoshop 同名模式一致。",
    options: [
      ["normal", "正常覆盖"],
      ["multiply", "正片叠底，压暗"],
      ["screen", "滤色，提亮"],
      ["overlay", "叠加，增强对比"],
      ["add", "线性减淡"]
    ]
  };
  H.interpolation = {
    zh: "插值方式", desc: "RIFE/FILM 补帧的倍率控制。",
    options: [
      ["ease_in", "缓入"],
      ["ease_out", "缓出"],
      ["linear", "线性（补帧常用）"]
    ]
  };
  H.factor = { zh: "倍率", desc: "补帧倍率：2 表示帧率翻倍（插 1 帧补 1 帧）。" };
  H.ckpt_name_2 = H.ckpt_name;
  H.text = { zh: "提示词文本", desc: "支持英文逗号分隔的标签与 (word:1.2) 权重语法；Flux 适合自然语言长句。" };
  H.grow_amount = { zh: "扩张像素", desc: "蒙版向外扩/向内缩的像素数，正值扩大重绘范围。重绘衔接生硬时外扩 8-16 像素并羽化。" };
  H.blur_radius = { zh: "羽化半径", desc: "蒙版边缘的模糊程度，让重绘区与原图的过渡更柔和。" };

  /* ---- 类型中文翻译 ---- */
  var TYPE_ZH = {
    "MODEL": "模型主干", "CLIP": "文本编码器", "CLIP_VISION": "CLIP 视觉编码器", "STYLE_MODEL": "风格模型",
    "VAE": "变分编解码器", "IMAGE": "图像", "LATENT": "潜空间", "CONDITIONING": "条件（提示词向量）",
    "CONTROL_NET": "ControlNet 模型", "MASK": "遮罩", "SAMPLER": "采样器", "SAMPLERS": "采样器",
    "SIGMAS": "噪声日程表", "NOISE": "噪声生成器", "GUIDER": "引导器", "CFG": "引导配置",
    "UPSCALE_MODEL": "放大模型", "SEGS": "分割区域组", "DETAILER_PIPE": "精修管道包",
    "BBOX_DETECTOR": "边框检测器", "SEGM_DETECTOR": "分割检测器", "SAM_MODEL": "SAM 分割模型",
    "VIDEO": "视频", "AUDIO": "音频", "STRING": "文本", "INT": "整数", "FLOAT": "浮点数",
    "COMBO": "下拉选择", "BOOLEAN": "开关", "NUMBER": "数值", "*": "任意类型", "WEBCAM": "摄像头",
    "LATENT_KEYFRAME": "潜空间关键帧", "CLIP_VISION_OUTPUT": "视觉编码输出", "STYLE_MODEL_ADVANCED": "风格模型(增强)",
    "INSIGHTFACE": "人脸识别模型", "FACE_ANALYSIS_MODEL": "人脸分析模型", "INSTANTID_MODEL": "InstantID 模型",
    "CONTROL_NET_WEIGHTS": "控制网权重", "TIMESTEP_KEYFRAME": "时间步关键帧", "SIGMAS_SIMPLE": "简化噪声日程"
  };

  window.WIDGET_HELP = {
    get: function (name) {
      if (!name) return null;
      var n = String(name).toLowerCase();
      if (H[n]) return H[n];
      var keys = Object.keys(H);
      for (var i = 0; i < keys.length; i++) {
        if (n.indexOf(keys[i]) >= 0 || keys[i].indexOf(n) >= 0 && n.length > 3) return H[keys[i]];
      }
      return null;
    },
    typeZh: function (t) {
      if (!t) return "";
      return TYPE_ZH[String(t).toUpperCase()] || "";
    }
  };
})();
