(function () {
  "use strict";
  window.COMFY_DATA = window.COMFY_DATA || {};
  window.COMFY_DATA.nodePackages = window.COMFY_DATA.nodePackages || [];

  // ---------- 6. ComfyUI 官方进阶节点（comfy_extras） ----------
  // 节点名与参数均核对自本机 ComfyUI v0.34.2 源码（comfy_extras/ 各 nodes_*.py 与核心 nodes.py），
  // 少数老牌进阶节点（CLIPVisionEncode 等）注册在核心 nodes.py，一并收录便于对照官方模板。
  window.COMFY_DATA.nodePackages.push({
    id: "comfy-extras",
    name: "ComfyUI 官方进阶节点（comfy_extras）",
    author: "Comfy Org",
    official: true,
    category: "官方进阶",
    install: "ComfyUI 自带（comfy_extras/ 目录，随版本持续新增）",
    summary: "comfy_extras 是 ComfyUI 官方仓库里的进阶节点目录，定位是实验与前沿特性的孵化区：新模型的条件节点、新的采样与调度技巧、新的保存与视频封装体系都先在这里落地，成熟后再转正进核心。近几年 Flux Kontext、Qwen Image、Wan、LTXV 等新架构的官方工作流，骨架几乎全部由这里的节点搭成，新版官方模板中它出场的数量已经超过老核心节点。对用户来说装好 ComfyUI 就自动拥有它们，不需要任何安装动作，问题只在于看不看得懂。",
    why: "官方模板越新，用到的进阶节点越多：编辑模型的参考潜空间挂载、VACE 视频控制、声画联合潜空间、逻辑开关、对比与调色工具全都出自这个目录。看不懂新版官方模板，多半就是卡在这些节点上。把它们逐个讲透，等于把官方模板的骨架拆开摆在面前。",
    tags: ["官方", "进阶", "新架构"],
    nodes: [
      // ===== 图像编辑与 Flux Kontext 系 =====
      {
        name: "ReferenceLatent", cat: "cond",
        brief: "把参考图潜空间挂到条件上，官方编辑模型的通用入口。",
        desc: "显示名为 Set Reference Latent。它接收一路条件与一路可选潜空间，把潜空间写进条件的参考潜空间字段后原样输出。Flux Kontext、Qwen Image Edit 这类官方编辑模型都会读取该字段来获知要参照哪张图。节点可以串联多个，每接一级就多挂一路参考，模型支持时即可实现多图参照编辑。",
        inputs: [
          { name: "conditioning", type: "CONDITIONING", from: "典型上游：CLIP Text Encode 或上一级 ReferenceLatent", desc: "待挂载参考的条件" },
          { name: "latent", type: "LATENT", from: "可选，VAE Encode 编码的参考图潜空间", desc: "参考图内容，不接时条件原样通过" }
        ],
        outputs: [
          { type: "CONDITIONING", to: "典型下游：采样器正面输入，或下一级 ReferenceLatent 继续串联", desc: "携带参考潜空间的条件" }
        ],
        why: "官方编辑模型没有专有节点，统一走条件里的参考潜空间字段，这个节点就是写字段的唯一入口。理解它，就理解了官方编辑工作流里图像是如何进入模型的。",
        params: [],
        tips: "串联时把上一级的条件输出接进下一级即可累积多张参考；参考图先经 FluxKontextImageScale 或缩放节点规整尺寸，效果最稳。"
      },
      {
        name: "FluxKontextImageScale", cat: "image",
        brief: "把参考图自动缩放到 Flux Kontext 推荐的分辨率档位。",
        desc: "Flux Kontext 对参考图分辨率有明确偏好，官方在源码里内置了一张推荐分辨率表。这个节点读取输入图的宽高比，从表里挑出比例最接近的一档，用 lanczos 算法居中缩放后输出，全程没有可调参数。官方 Kontext 模板里它挂在参考图编码之前，属于免思考的固定件。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：Load Image 或生成的图像", desc: "待规整的参考图" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：VAE Encode 后接 ReferenceLatent，或直接进编辑链路", desc: "按推荐档位缩放后的图像" }
        ],
        why: "参考图分辨率不合会直接拖累 Kontext 的编辑质量与显存占用。官方把这份经验做成免调参节点，保证模板开箱即得，不必手动试尺寸。",
        params: [],
        tips: "节点保持原图长宽比选档不会裁剪；后续空潜空间最好取相近比例，编辑区域与参考图构图才对得上。"
      },
      {
        name: "CFGNorm", cat: "model",
        brief: "按范数比例衰减无条件增量，抑制高引导下的过曝烧图。",
        desc: "实验特性。高 CFG 或大引导值容易出现过曝、过饱和的烧图现象，这个节点挂在模型上，在采样器完成 CFG 合成后比较条件与无条件两路去噪结果的差异范数，把无条件的过量成分按比例衰减回去，相当于一次自适应的 CFG 归一化。strength 控制力度，pre_cfg 开关则改在合成前做无钳制的缩放，对应另一派模型的归一化方式。",
        inputs: [
          { name: "model", type: "MODEL", from: "典型上游：Checkpoint 或 UNET Loader", desc: "待打补丁的模型" }
        ],
        outputs: [
          { type: "MODEL", to: "典型下游：KSampler 或 SamplerCustom 的 model 输入", desc: "打过归一化补丁的模型" }
        ],
        why: "它是官方应对高引导烧图的轻量方案：不动采样器、不改引导值，模型链上插一个节点就生效。新版官方模板里出现频率很高。",
        params: [
          { name: "strength", kind: "浮点数", default: "1.0", desc: "归一化力度，越大对无条件增量的压制越强。" },
          { name: "pre_cfg", kind: "开关", default: "false", desc: "改为在 CFG 合成之前做无钳制缩放，默认关闭保持经典的合成后衰减模式，只减不增更安全。" }
        ],
        tips: "默认模式只衰减不放大，可放心常驻；画面发灰说明压过头，把 strength 降到 0.5 左右，烧图明显时再升上去。"
      },
      {
        name: "ImageStitch", cat: "image",
        brief: "按上下左右方向把第二张图拼接进第一张图。",
        desc: "显示名为 Stitch Images，上游来自社区 KJNodes，官方收编进核心。把 image2 拼到 image1 的右侧、下侧、左侧或上侧；match_image_size 打开时自动把 image2 缩放到与 image1 对应边等高再拼，spacing_width 可在两图之间垫一条指定颜色的间隔带。不接 image2 时原样输出 image1，批量图会自动补齐批量数。",
        inputs: [
          { name: "image1", type: "IMAGE", from: "典型上游：Load Image 或生成的图像", desc: "拼接的主图" },
          { name: "image2", type: "IMAGE", from: "可选，另一路图像", desc: "被拼进去的副图" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：编辑模型的参考图分支或保存节点", desc: "拼接完成的宽幅或长条图像" }
        ],
        why: "前后对比、双图参照编辑的准备工作经常需要拼图。官方收编后不必再装社区包，模板里的对比与参照环节都靠它。",
        params: [
          { name: "direction", kind: "下拉选择", default: "right", desc: "image2 拼接在 image1 的哪一侧。", options: [["right", "拼到右侧，最常用"], ["down", "拼到下方"], ["left", "拼到左侧"], ["up", "拼到上方"]] },
          { name: "match_image_size", kind: "开关", default: "true", desc: "把副图缩放到与主图对应边一致再拼，关闭则保持原尺寸。" },
          { name: "spacing_width", kind: "整数", default: "0", desc: "两图之间间隔带的像素宽度，为零时无缝拼接。" },
          { name: "spacing_color", kind: "下拉选择", default: "white", desc: "间隔带颜色。", options: [["white", "白色"], ["black", "黑色"], ["red", "红色"], ["green", "绿色"], ["blue", "蓝色"]] }
        ],
        tips: "给 Kontext 喂双图参照前先用它拼图是官方模板的标准接法；批量对比出图时垫一条黑色间隔带方便肉眼划界。"
      },
      {
        name: "SaveImageAdvanced", cat: "image",
        brief: "官方进阶保存节点，支持高 位深 png 与 exr 输出。",
        desc: "显示名为 Save Image (Advanced)，Save Image 的升级版。除了常规 png，还提供十六位 png 与三十二位浮点 exr：exr 路径还能声明输入色彩空间是 sRGB、HDR 还是线性，写盘前自动做对应变换，交付调色与合成管线时特别有用。文件名前缀支持日期等格式化占位符，保存后图像原样输出可继续串联下游。",
        inputs: [
          { name: "images", type: "IMAGE", from: "典型上游：采样解码或任何图像输出", desc: "要保存的图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：继续接预览、对比或后处理节点", desc: "原样透传的图像" }
        ],
        why: "官方模板用它展示新的保存体系：一个节点覆盖普通出图到影视级 exr 交付的全部场景，格式子选项随所选格式动态展开。",
        params: [
          { name: "filename_prefix", kind: "文本", default: "ComfyUI", desc: "文件名前缀，可插入日期等占位符按天归档。" },
          { name: "format", kind: "下拉选择", default: "png", desc: "保存格式，选 exr 时展开色彩空间子选项。", options: [["png", "常规无损位图"], ["exr", "影视级高动态范围格式"]] },
          { name: "bit_depth", kind: "下拉选择", default: "8-bit", desc: "png 的位深，十六位保留更多层次便于后期调色。", options: [["8-bit", "常规八位"], ["16-bit", "十六位，后期余量更大"]] }
        ],
        tips: "普通出图它与 Save Image 等价；要把成片交给 DaVinci 或 Nuke 调色时才需要切到 exr 并选对输入色彩空间。"
      },
      {
        name: "ComfySwitchNode", cat: "util",
        brief: "官方二选一开关，按布尔值路由两路同型数据。",
        desc: "显示名为 If/Else Switch，官方逻辑节点家族的条件分支。接一路布尔值与两路类型一致的数据，为真输出 on_true，为假输出 on_false。两路输入都是惰性求值，只有被选中的一路才会真正执行，另一条整条子链直接跳过，因此做分支不仅省显存也省时间。输出类型自动跟随输入，模型、图像、文本、整数都能走。",
        inputs: [
          { name: "on_true", type: "与 on_false 同类型", from: "典型上游：任一方案 A 的输出", desc: "开关为真时走的一路" },
          { name: "on_false", type: "与 on_true 同类型", from: "典型上游：任一方案 B 的输出", desc: "开关为假时走的一路" }
        ],
        outputs: [
          { type: "与输入同类型", to: "典型下游：汇合后的下游节点", desc: "被选中一路的数据" }
        ],
        why: "工作流里做方案切换、按条件启用放大或修复分支，靠它免拔线。惰性执行让关闭分支的开销归零，这是社区开关节点普遍做不到的。",
        params: [
          { name: "switch", kind: "开关", default: "false", desc: "分支开关，为真走 on_true，为假走 on_false。" }
        ],
        tips: "两路输入类型必须一致，先接好一路再看输出类型；把开关接到种子或计数器上，可以自动在两套方案间轮换对比。"
      },
      {
        name: "StringConcatenate", cat: "util",
        brief: "把两段文本按分隔符拼接成一段。",
        desc: "显示名为 Concatenate Text，官方文本工具家族的一员。string_a 与 string_b 两段多行文本用 delimiter 指定的分隔符连接后输出，默认无分隔符直接相连。提示词前缀加主体、标签加歌词这类拼装需求一个节点搞定，两段文本可分别来自其他文本节点，实现模板化管理。",
        inputs: [],
        outputs: [
          { type: "STRING", to: "典型下游：条件编码或文本处理节点", desc: "拼接完成的文本" }
        ],
        why: "提示词模板化最基础的积木。与多行文本、格式化文本节点配合，可以把固定词与变化词分层维护，换风格只动一处。",
        params: [
          { name: "string_a", kind: "文本", default: "空", desc: "拼接的第一段，常放固定的前缀或风格词。" },
          { name: "string_b", kind: "文本", default: "空", desc: "拼接的第二段，常放每轮变化的主体词。" },
          { name: "delimiter", kind: "文本", default: "空", desc: "两段之间的分隔符，提示词场景常用逗号加空格。" }
        ],
        tips: "固定前缀放 a、每轮变化放 b，调词时只动一处；两段都支持多行，长提示词也不会挤成一团。"
      },
      {
        name: "PrimitiveStringMultiline", cat: "util",
        brief: "官方多行文本框，把手写文本输出为字符串。",
        desc: "显示名为 Text (Multiline)，官方原始值家族的文本节点：一个多行输入框，内容原样输出为字符串。它补齐了核心节点长期缺少的多行文本体验，写长提示词、维护负面词库或给下游文本工具供料都靠它，官方模板里出现频率极高。",
        inputs: [],
        outputs: [
          { type: "STRING", to: "典型下游：条件编码、拼接或格式化节点", desc: "输入框里的文本" }
        ],
        why: "文本进入工作流最朴素的官方入口。与单行版相比支持换行，长提示词与分段的负面词可读性好得多。",
        params: [
          { name: "value", kind: "文本", default: "空", desc: "文本内容，支持多行书写。" }
        ],
        tips: "想两套提示词整体切换，配两个本节点加官方开关节点即可；输出的字符串可接任何文本输入口。"
      },
      {
        name: "PreviewAny", cat: "util",
        brief: "把任意类型输入转成文本显示，官方万能调试窗。",
        desc: "显示名为 Preview as Text，设计源自社区 rgthree 的经典节点并由官方收编。输入端口接受任意类型：字符串直接显示，数值转成文本，复杂对象尝试序列化成缩进的 JSON，张量则按截断形式打印。结果显示在节点画面上，同时原样输出为字符串可以继续向后传，属于输出节点不落盘。",
        inputs: [
          { name: "source", type: "任意", from: "典型上游：任何想查看的数据", desc: "待显示的数据，类型不限" }
        ],
        outputs: [
          { type: "STRING", to: "典型下游：继续观察或接文本处理", desc: "转成文本后的内容" }
        ],
        why: "调试链路最想知道中间到底是什么值。一个节点覆盖所有类型，不必为每种数据另找专用显示节点，官方调试标配。",
        params: [],
        tips: "接在文本处理链的每一级逐级核对最直观；长张量按边界截断显示，足够定位维度与数值范围问题。"
      },
      {
        name: "TextGenerate", cat: "util",
        brief: "用加载的语言模型在画布上生成或改写文本。",
        desc: "显示名为 Generate Text，官方文本生成节点。接一路带生成能力的语言模型编码器（如官方 Gemma 系列），用提示词驱动它输出文本，可以扩写提示词、反推图注、给工作流加一个会写词的大脑。支持可选的图像、视频帧与音频输入做多模态理解，让模型看着素材写描述；采样参数通过采样模式动态展开，也支持思考模式。",
        inputs: [
          { name: "clip", type: "CLIP", from: "典型上游：语言模型加载节点", desc: "带生成能力的模型与分词器" },
          { name: "image", type: "IMAGE", from: "可选，待理解的图像", desc: "多模态输入，让模型看着图写词" },
          { name: "video", type: "IMAGE", from: "可选，视频帧序列", desc: "按帧率抽稀后交给模型理解" },
          { name: "audio", type: "AUDIO", from: "可选，音频输入", desc: "多模态理解的可选素材" }
        ],
        outputs: [
          { type: "STRING", to: "典型下游：条件编码或文本处理节点", desc: "生成的文本" }
        ],
        why: "反推提示词、自动扩写词表这类语言任务被官方做成了标准件，多模态输入让它能直接读图生词，省掉一整套外部工具链。",
        params: [
          { name: "prompt", kind: "文本", default: "空", desc: "驱动生成的提示词或指令，支持多行与动态提示词。" },
          { name: "max_length", kind: "整数", default: "512", desc: "生成文本的最大长度上限。" },
          { name: "sampling_mode", kind: "下拉选择", default: "on", desc: "是否启用随机采样，选中后展开温度、top_k 等子参数。", options: [["on", "启用采样，展开完整采样参数"], ["off", "关闭采样，贪心直出，速度最快"]] },
          { name: "thinking", kind: "开关", default: "false", desc: "让支持的模型进入思考模式，推理更稳但更慢。" },
          { name: "use_default_template", kind: "开关", default: "true", desc: "使用模型自带的系统提示模板，反推图注类任务保持默认即可。" }
        ],
        tips: "反推提示词只需接图像输入，默认参数已经很好用；采样关掉可显著提速，写关键词任务够用。"
      },
      {
        name: "ImageCompare", cat: "image",
        brief: "两图并排加滑动对比，官方出图对照工具。",
        desc: "显示名为 Compare Images。接入两组图像后在节点界面里并排展示，自带滑动分割线控件，拖动即可逐像素对比前后差异，也支持切换成只看某一侧的视图。两组输入都可选，批量图同样支持。它是输出节点，只在界面展示不落盘，重启后消失。",
        inputs: [
          { name: "image_a", type: "IMAGE", from: "可选，对比的 A 组图像", desc: "例如放大或修复前" },
          { name: "image_b", type: "IMAGE", from: "可选，对比的 B 组图像", desc: "例如放大或修复后" }
        ],
        outputs: [],
        why: "放大前后、修复前后、有无 LoRA 的对照是调参刚需。官方原生提供滑动对比视图，省去装社区对比节点或肉眼切窗口的功夫。",
        params: [],
        tips: "常见接法是把放大链前后两路各接一组；节点上的视图控件可在并排、滑动、单侧之间切换，看细节用滑动最直观。"
      },
      {
        name: "ColorTransfer", cat: "image",
        brief: "把参考图的色调按统计方法迁移到目标图。",
        desc: "显示名为 Transfer Color。以 image_ref 的色彩分布为目标，把 image_target 的颜色统计调整过去：方法有 reinhard_lab、mkl_lab 与 histogram 三种，前两种在 LAB 空间做统计匹配，直方图法逐通道拉齐。处理视频帧序列时 source_stats 决定取源统计的方式，可逐帧、全程池化或以指定帧为基准统一套用。strength 控制迁移力度。",
        inputs: [
          { name: "image_target", type: "IMAGE", from: "典型上游：待调色的图像或帧序列", desc: "被改颜色的目标图" },
          { name: "image_ref", type: "IMAGE", from: "典型上游：色彩基调参考图", desc: "提供目标色调的参考图" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：保存、对比或视频封装节点", desc: "色调对齐后的图像" }
        ],
        why: "生成帧序列色彩漂移、外绘区域色调不接、换背景后光影违和，都能用它一次性对齐色调，不必回采样重来。",
        params: [
          { name: "method", kind: "下拉选择", default: "reinhard_lab", desc: "色彩统计匹配算法。", options: [["reinhard_lab", "LAB 空间均值方差匹配，通用默认"], ["mkl_lab", "LAB 空间 MKL 匹配，保留更多分布细节"], ["histogram", "直方图逐通道拉齐，风格化更强"]] },
          { name: "source_stats", kind: "下拉选择", default: "per_frame", desc: "源统计的取法，视频场景建议改用池化或指定帧。", options: [["per_frame", "每帧独立统计"], ["uniform", "全程池化统一处理，帧间更稳"], ["target_frame", "以指定帧为基准统一套用"]] },
          { name: "strength", kind: "浮点数", default: "1.0", desc: "迁移力度，零到十之间可调，小值做微调最自然。" }
        ],
        tips: "单图用默认即可；视频调色把 source_stats 切到 uniform 或 target_frame 防止帧间闪烁，strength 在零点三到零点五之间做微调最不着痕迹。"
      },
      // ===== Qwen 系 =====
      {
        name: "TextEncodeQwenImageEdit", cat: "cond",
        brief: "Qwen Image 编辑模型的条件编码器，单参考图版。",
        desc: "为 Qwen Image 编辑模型准备条件：把提示词与参考图一起交给 Qwen 的语言模型编码器，图像会先按面积缩放到约一百万像素再进入视觉通道。接了 VAE 时还会把参考图编码成参考潜空间写进条件，编辑模型据此知道要保留什么、改什么。输出标准条件，直接接采样器正面输入。",
        inputs: [
          { name: "clip", type: "CLIP", from: "典型上游：Qwen Image 专用文本编码器加载", desc: "Qwen 语言模型编码器" },
          { name: "vae", type: "VAE", from: "可选，Qwen Image 的 VAE", desc: "提供后额外生成参考潜空间，编辑更稳" },
          { name: "image", type: "IMAGE", from: "可选，参考图", desc: "要被编辑或参照的图像" }
        ],
        outputs: [
          { type: "CONDITIONING", to: "典型下游：采样器正面输入", desc: "携带图像理解与参考潜空间的条件" }
        ],
        why: "Qwen Image 官方编辑链路的第一站。图像理解与参考潜空间在一个节点内一次完成，画布上省去一串预处理。",
        params: [
          { name: "prompt", kind: "文本", default: "空", desc: "编辑指令或提示词，描述要把参考图改成什么样。" }
        ],
        tips: "想精确控制参考图尺寸可在上游先接缩放节点；不接 VAE 时仅靠语言通道理解图像，轻量但保真度略低。"
      },
      {
        name: "TextEncodeQwenImageEditPlus", cat: "cond",
        brief: "Qwen Image 编辑进阶编码器，最多三张参考图。",
        desc: "单图版的增强：image1 到 image3 三个可选输入，每张图分别以小尺寸规格交给语言模型做视觉理解，接了 VAE 时再逐张编码成参考潜空间，并在提示词前自动插入 Picture 1、2、3 的定位模板让模型分得清谁是谁。适合多图合成、人物保持加背景替换这类多参照任务。",
        inputs: [
          { name: "clip", type: "CLIP", from: "典型上游：Qwen Image 专用文本编码器加载", desc: "Qwen 语言模型编码器" },
          { name: "vae", type: "VAE", from: "可选，Qwen Image 的 VAE", desc: "提供后逐张生成参考潜空间" },
          { name: "image1", type: "IMAGE", from: "可选，第一张参考图", desc: "通常放主体或人物" },
          { name: "image2", type: "IMAGE", from: "可选，第二张参考图", desc: "第二参照，接几张算几张" },
          { name: "image3", type: "IMAGE", from: "可选，第三张参考图", desc: "第三参照" }
        ],
        outputs: [
          { type: "CONDITIONING", to: "典型下游：采样器正面输入", desc: "携带多图理解与多路参考潜空间的条件" }
        ],
        why: "多图参照是 Qwen Image 编辑的招牌能力，这个节点把多图理解与参考潜空间打包在一处，官方多图模板必挂。",
        params: [
          { name: "prompt", kind: "文本", default: "空", desc: "编辑指令，可在文中用第几张来指代具体参考图。" }
        ],
        tips: "空的输入会自动跳过不用补齐；参考图越多显存越高，一次别超过三张，主体放第一张效果最稳。"
      },
      {
        name: "ModelSamplingAuraFlow", cat: "model",
        brief: "用 AuraFlow 式偏移重排采样噪声分布。",
        desc: "继承自 SD3 采样体系：把 sigma 分布按 shift 值做偏移，决定去噪前段与后段的力度分配。AuraFlow 体系以及不少基于它的模型官方推荐 shift 从一点七三起步，shift 越大前段去噪越激进、构图定型越早。输出打了补丁的模型接给采样器，属于流匹配模型调优的第一旋钮。",
        inputs: [
          { name: "model", type: "MODEL", from: "典型上游：Checkpoint 或 UNET Loader", desc: "待打采样补丁的模型" }
        ],
        outputs: [
          { type: "MODEL", to: "典型下游：KSampler 或 SamplerCustom", desc: "采样分布调整后的模型" }
        ],
        why: "一个参数就能明显改变构图与细节分布，官方模板里它常驻模型链。理解 shift，就理解了流匹配模型手感调校的半壁江山。",
        params: [
          { name: "shift", kind: "浮点数", default: "1.73", desc: "分布偏移量，官方推荐起点一点七三，越大构图越早定型。" }
        ],
        tips: "构图不稳先在一点七三上下浮动零点五试起；细节发糊可略降 shift，画面呆板可略升。"
      },
      // ===== Wan 系 =====
      {
        name: "WanImageToVideo", cat: "video",
        brief: "Wan 图生视频官方条件节点，编码首帧并锁定画幅帧数。",
        desc: "官方 Wan 图生视频的枢纽：把首帧图像按宽高缩放后经 VAE 编码，连同首帧之后放开的拼接遮罩一起写进正负条件，同时生成对应尺寸与帧数的空潜空间供采样。可选接 CLIP Vision 输出增强主体一致性。输出正负条件与潜空间三路，画幅与时长决策全部在此完成。",
        inputs: [
          { name: "positive", type: "CONDITIONING", from: "典型上游：CLIP Text Encode 正面", desc: "正面条件" },
          { name: "negative", type: "CONDITIONING", from: "典型上游：CLIP Text Encode 负面", desc: "负面条件" },
          { name: "vae", type: "VAE", from: "典型上游：Wan VAE 加载", desc: "编码首帧用" },
          { name: "clip_vision_output", type: "CLIP_VISION_OUTPUT", from: "可选，CLIP Vision Encode", desc: "首帧视觉嵌入，主体一致性更好" },
          { name: "start_image", type: "IMAGE", from: "可选，起始帧图像", desc: "视频第一帧" }
        ],
        outputs: [
          { type: "CONDITIONING", to: "典型下游：采样器正面输入", desc: "携带首帧信息的正面条件" },
          { type: "CONDITIONING", to: "典型下游：采样器负面输入", desc: "携带首帧信息的负面条件" },
          { type: "LATENT", to: "典型下游：采样器的 latent_image 输入", desc: "对应画幅帧数的空潜空间" }
        ],
        why: "官方 Wan 工作流图生视频的标准入口，不装社区包就能跑通。尺寸、帧数、批量三件事都在这里一锤定音。",
        params: [
          { name: "width", kind: "整数", default: "832", desc: "画幅宽度，十六的倍数，832 配 480 是标准横幅。" },
          { name: "height", kind: "整数", default: "480", desc: "画幅高度，竖版把宽高对调即可。" },
          { name: "length", kind: "整数", default: "81", desc: "总帧数，按四的倍数设置，81 帧约五秒。" },
          { name: "batch_size", kind: "整数", default: "1", desc: "批量数，视频下显存随批量成倍增长。" }
        ],
        tips: "首帧画质决定整条视频质感，建议先修图再进来；想要更长视频优先考虑分段生成而不是硬拉帧数。"
      },
      {
        name: "WanFirstLastFrameToVideo", cat: "video",
        brief: "Wan 首尾帧图生视频，两端同时锁定中间自由过渡。",
        desc: "在首帧基础上加入尾帧控制：首尾两图分别缩放编码进拼接潜空间，遮罩只放开中段让模型自由发挥过渡，做出运镜式的首尾衔接，也可以只接首帧或只接尾帧单边控制。另有两路可选 CLIP Vision 输入分别对应首尾图，进一步稳住主体一致性。",
        inputs: [
          { name: "positive", type: "CONDITIONING", from: "典型上游：CLIP Text Encode 正面", desc: "正面条件" },
          { name: "negative", type: "CONDITIONING", from: "典型上游：CLIP Text Encode 负面", desc: "负面条件" },
          { name: "vae", type: "VAE", from: "典型上游：Wan VAE 加载", desc: "编码首尾帧用" },
          { name: "clip_vision_start_image", type: "CLIP_VISION_OUTPUT", from: "可选，首帧的视觉嵌入", desc: "增强首帧主体一致性" },
          { name: "clip_vision_end_image", type: "CLIP_VISION_OUTPUT", from: "可选，尾帧的视觉嵌入", desc: "增强尾帧主体一致性" },
          { name: "start_image", type: "IMAGE", from: "可选，起始帧", desc: "视频第一帧" },
          { name: "end_image", type: "IMAGE", from: "可选，结束帧", desc: "视频最后一帧" }
        ],
        outputs: [
          { type: "CONDITIONING", to: "典型下游：采样器正面输入", desc: "携带首尾帧信息的正面条件" },
          { type: "CONDITIONING", to: "典型下游：采样器负面输入", desc: "携带首尾帧信息的负面条件" },
          { type: "LATENT", to: "典型下游：采样器的 latent_image 输入", desc: "对应画幅帧数的空潜空间" }
        ],
        why: "首尾帧转场是 Wan 系列最出圈的玩法，官方原生支持无需插件。中段放开的遮罩设计让模型专心编排过渡。",
        params: [
          { name: "width", kind: "整数", default: "832", desc: "画幅宽度，与首尾图一起决定缩放。" },
          { name: "height", kind: "整数", default: "480", desc: "画幅高度。" },
          { name: "length", kind: "整数", default: "81", desc: "总帧数，按四的倍数设置，过渡时长随之变化。" },
          { name: "batch_size", kind: "整数", default: "1", desc: "批量数。" }
        ],
        tips: "首尾图构图差异越大中间过渡越抽象，先从相近构图试起；只接尾帧不接首帧可做倒放感的开场。"
      },
      {
        name: "WanVaceToVideo", cat: "video",
        brief: "Wan VACE 控制视频条件的官方实现，支持遮罩与参考图。",
        desc: "VACE 是 Wan 官方的统一控制分支：用一段控制视频加遮罩指定画面里哪里保留、哪里重画。节点把控制视频按遮罩拆成激活与未激活两路潜空间拼在一起，把遮罩重排成模型要求的形状写进条件，参考图则编码后拼在时间轴最前面。输出比普通节点多一路 trim_latent 整数，标记参考图占用了多少帧。",
        inputs: [
          { name: "positive", type: "CONDITIONING", from: "典型上游：CLIP Text Encode 正面", desc: "正面条件" },
          { name: "negative", type: "CONDITIONING", from: "典型上游：CLIP Text Encode 负面", desc: "负面条件" },
          { name: "vae", type: "VAE", from: "典型上游：Wan VAE 加载", desc: "编码控制视频与参考图" },
          { name: "control_video", type: "IMAGE", from: "可选，控制视频帧序列", desc: "指定运动与构图的参考帧" },
          { name: "control_masks", type: "MASK", from: "可选，与控制视频配套的遮罩", desc: "白处重绘黑处保留" },
          { name: "reference_image", type: "IMAGE", from: "可选，参考图", desc: "拼在时间轴开头的主体参考" }
        ],
        outputs: [
          { type: "CONDITIONING", to: "典型下游：采样器正面输入", desc: "携带 VACE 控制信息的正面条件" },
          { type: "CONDITIONING", to: "典型下游：采样器负面输入", desc: "携带 VACE 控制信息的负面条件" },
          { type: "LATENT", to: "典型下游：采样器的 latent_image 输入", desc: "含参考图占位的空潜空间" },
          { type: "INT", to: "典型下游：TrimVideoLatent 的 trim_amount", desc: "参考图占用的帧数" }
        ],
        why: "官方核心自带 VACE 控制能力，不装 WanVideoWrapper 也能做运动控制与局部重绘。trim_latent 输出是官方设计的精巧衔接。",
        params: [
          { name: "width", kind: "整数", default: "832", desc: "画幅宽度，控制视频会被缩放到此尺寸。" },
          { name: "height", kind: "整数", default: "480", desc: "画幅高度。" },
          { name: "length", kind: "整数", default: "81", desc: "总帧数，按四的倍数设置。" },
          { name: "batch_size", kind: "整数", default: "1", desc: "批量数。" },
          { name: "strength", kind: "浮点数", default: "1.0", desc: "控制强度，画面过分黏住控制视频时调低。" }
        ],
        tips: "接了参考图时把 trim_latent 接进 TrimVideoLatent，采样后掐掉占位帧再解码，成片开头才干净；遮罩白处重绘黑处保留。"
      },
      {
        name: "TrimVideoLatent", cat: "latent",
        brief: "从视频潜空间开头裁掉指定帧数。",
        desc: "显示名为 Trim Video Latent。沿时间维把潜空间开头 trim_amount 帧裁掉后输出。最典型的用法是与 WanVaceToVideo 配合：VACE 的参考图会占住潜空间开头几帧，采样完成后用这里的 trim_amount 掐掉占位帧再解码，成片才不会以静止参考帧开场。",
        inputs: [
          { name: "samples", type: "LATENT", from: "典型上游：采样器输出的视频潜空间", desc: "待裁剪的潜空间" }
        ],
        outputs: [
          { type: "LATENT", to: "典型下游：VAE Decode 或解码类节点", desc: "掐头后的视频潜空间" }
        ],
        why: "一帧之差决定 VACE 成片开头干不干净。官方把裁剪做成独立小节点，让参考图链与视频链保持解耦。",
        params: [
          { name: "trim_amount", kind: "整数", default: "0", desc: "从开头裁掉的帧数，直接接 WanVaceToVideo 的 trim_latent 输出即可。" }
        ],
        tips: "只裁时间头不裁尾；普通视频想掐掉开头几帧也可以用它，比解码后再删帧省算力。"
      },
      // ===== LTX 系 =====
      {
        name: "LTXVConditioning", cat: "cond",
        brief: "把帧率写进 LTXV 条件，同步时间维度语义。",
        desc: "LTXV 模型需要知道帧率才能正确理解时间压缩关系。这个节点把 frame_rate 写进正负两组条件后原样输出，是 LTXV 图生视频与文生视频工作流的固定环节，官方模板取每秒二十五帧。缺了这一步，LTXV 采样会直接报错。",
        inputs: [
          { name: "positive", type: "CONDITIONING", from: "典型上游：CLIP Text Encode 正面或图生视频节点", desc: "正面条件" },
          { name: "negative", type: "CONDITIONING", from: "典型上游：CLIP Text Encode 负面", desc: "负面条件" }
        ],
        outputs: [
          { type: "CONDITIONING", to: "典型下游：采样器正面输入", desc: "写入帧率后的正面条件" },
          { type: "CONDITIONING", to: "典型下游：采样器负面输入", desc: "写入帧率后的负面条件" }
        ],
        why: "帧率是把运动速度的语义接进模型的通道，不同帧率下同样的提示词会呈现不同的动作节奏，它让 LTXV 的时间维度有了刻度。",
        params: [
          { name: "frame_rate", kind: "浮点数", default: "25.0", desc: "每秒帧数，官方模板默认二十五，与下游封装帧率保持一致。" }
        ],
        tips: "想要慢动作先降帧率再考虑改提示词；封装时的 fps 与这里的帧率是两回事，前者只影响播放。"
      },
      {
        name: "LTXVImgToVideo", cat: "video",
        brief: "LTXV 图生视频条件节点，首帧编码加噪声遮罩控制。",
        desc: "把输入图缩放后经 VAE 编码填进潜空间的时间开头，其余帧置零，再用噪声遮罩按 strength 控制对首帧的忠实程度，输出正负条件与带遮罩的潜空间三路。LTXV 的时间压缩是八倍，帧数要按八的倍数加一设置，这是它与 Wan 系最大的结构差异。",
        inputs: [
          { name: "positive", type: "CONDITIONING", from: "典型上游：CLIP Text Encode 正面", desc: "正面条件" },
          { name: "negative", type: "CONDITIONING", from: "典型上游：CLIP Text Encode 负面", desc: "负面条件" },
          { name: "vae", type: "VAE", from: "典型上游：LTXV VAE 加载", desc: "编码首帧用" },
          { name: "image", type: "IMAGE", from: "典型上游：Load Image", desc: "作为第一帧的图像" }
        ],
        outputs: [
          { type: "CONDITIONING", to: "典型下游：LTXVConditioning 或采样器正面输入", desc: "正面条件" },
          { type: "CONDITIONING", to: "典型下游：LTXVConditioning 或采样器负面输入", desc: "负面条件" },
          { type: "LATENT", to: "典型下游：采样器的 latent_image 输入", desc: "带首帧与噪声遮罩的潜空间" }
        ],
        why: "LTXV 主打低显存快速出视频，这个节点让首帧可控。理解它的帧数规则，就不会在分辨率报错上浪费时间。",
        params: [
          { name: "width", kind: "整数", default: "768", desc: "画幅宽度，三十二的倍数。" },
          { name: "height", kind: "整数", default: "512", desc: "画幅高度。" },
          { name: "length", kind: "整数", default: "97", desc: "总帧数，必须满足八的倍数加一，如 9、17、97。" },
          { name: "batch_size", kind: "整数", default: "1", desc: "批量数。" },
          { name: "strength", kind: "浮点数", default: "1.0", desc: "首帧约束强度，调低画面更敢动但可能偏离原图。" }
        ],
        tips: "帧数报错先检查是不是八的倍数加一；strength 降到零点八左右，动态会更舒展。"
      },
      {
        name: "LTXVScheduler", cat: "sampler",
        brief: "生成 LTXV 专用 sigma 序列，按潜空间大小自适应偏移。",
        desc: "根据步数生成 LTXV 推荐的 sigma 调度：偏移量由潜空间 token 总数动态算出，潜空间越大偏移越大，高分辨率自动获得更合理的前段去噪力度，不必手动换算。可选接一路潜空间来参考形状；stretch 与 terminal 控制尾段 sigma 的拉伸收口。输出 SIGMAS 接 SamplerCustom 的 sigma 输入。",
        inputs: [
          { name: "latent", type: "LATENT", from: "可选，参考形状的潜空间", desc: "接入后按实际 token 数计算偏移" }
        ],
        outputs: [
          { type: "SIGMAS", to: "典型下游：SamplerCustom 的 sigmas 输入", desc: "LTXV 专用噪声调度序列" }
        ],
        why: "LTXV 的画质与稳定性高度依赖这套调度。官方把它做成独立节点与采样器解耦，同一份 sigma 可以喂给不同的采样核心做对比。",
        params: [
          { name: "steps", kind: "整数", default: "20", desc: "去噪步数，二十步是速度与质量的平衡点。" },
          { name: "max_shift", kind: "浮点数", default: "2.05", desc: "大潜空间端的偏移上限。" },
          { name: "base_shift", kind: "浮点数", default: "0.95", desc: "小潜空间端的偏移下限。" },
          { name: "stretch", kind: "开关", default: "true", desc: "把尾段 sigma 拉伸到终端值，保持默认即可。" },
          { name: "terminal", kind: "浮点数", default: "0.1", desc: "拉伸后 sigma 的终端值，影响最后一步的收尾力度。" }
        ],
        tips: "改分辨率后不用手动改偏移，节点按潜空间自己算；追求更快出片可降到十二步左右观察质量损失。"
      },
      {
        name: "LTXVConcatAVLatent", cat: "latent",
        brief: "把视频潜空间与音频潜空间合并成联合潜空间。",
        desc: "显示名为 Concat AV Latent。音视频联合生成模型要求画面与声音两路潜空间打包成一条再送采样：节点把两路潜空间的字段合并输出，音频长度与视频对不齐时自动裁剪或补零，并同步噪声遮罩，让短音频的缺省段交给模型自己生成。",
        inputs: [
          { name: "video_latent", type: "LATENT", from: "典型上游：视频编码或空视频潜空间", desc: "画面流潜空间" },
          { name: "audio_latent", type: "LATENT", from: "典型上游：音频编码或空音频潜空间", desc: "声音流潜空间" }
        ],
        outputs: [
          { type: "LATENT", to: "典型下游：SamplerCustom 的 latent_image 输入", desc: "音画合一的联合潜空间" }
        ],
        why: "声画同步生成是新趋势，官方用一个纯连接节点完成两流合一，下游采样器无需感知任何细节差异。",
        params: [],
        tips: "两路潜空间必须来自配套的编码器，混用会形状报错；反向拆开用同家族的 Separate AV Latent 节点。"
      },
      {
        name: "LTXVAudioVAEDecode", cat: "audio",
        brief: "用 LTXV 音频 VAE 把音频潜空间解码成可播放音频。",
        desc: "显示名为 LTXV Audio VAE Decode。接一路潜空间与音频 VAE，取其中的音频流解码成波形并附上采样率，输出标准 AUDIO。常与视频解码并行：画面流走普通 VAE 解码，声音流走这个节点，最后在 CreateVideo 里音画合体。",
        inputs: [
          { name: "samples", type: "LATENT", from: "典型上游：采样器输出的联合潜空间", desc: "含音频流的潜空间" },
          { name: "audio_vae", type: "VAE", from: "典型上游：LTXV Audio VAE Loader", desc: "LTXV 专用音频解码器" }
        ],
        outputs: [
          { type: "AUDIO", to: "典型下游：SaveAudioAdvanced 或 CreateVideo 的 audio 输入", desc: "解码出的音频" }
        ],
        why: "LTXV 声画模型的潜空间里同时装着画面与声音，解码端必须分流处理，这个节点就是声音的出口。",
        params: [],
        tips: "音频 VAE 要用 LTXV 专属加载器加载，与画面 VAE 不是同一个文件；解码出的音频可直接进视频封装或单独保存。"
      },
      {
        name: "VAEDecodeTiled", cat: "vae",
        brief: "分块解码潜空间，低显存跑大图与长视频的保底手段。",
        desc: "显示名为 VAE Decode (Tiled)。解码结果与普通 VAE Decode 一致，但把潜空间切成小块逐块解码再缝合：空间上按 tile_size 加 overlap 滑动，视频 VAE 再按 temporal_size 分时间段处理，显存峰值大幅下降，代价是块与块之间可能出现细微接缝。官方视频模板常用它替代普通解码。",
        inputs: [
          { name: "samples", type: "LATENT", from: "典型上游：采样器输出", desc: "待解码的潜空间" },
          { name: "vae", type: "VAE", from: "典型上游：Checkpoint 或 VAE Loader", desc: "解码器" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：保存、对比或视频封装节点", desc: "分块解码出的帧序列" }
        ],
        why: "解码是全流程第二个显存高峰。参数化的分块让用户按显卡余量自由权衡速度与显存，长视频能否跑完常常就看这里。",
        params: [
          { name: "tile_size", kind: "整数", default: "512", desc: "空间分块的边长，爆显存就调小。" },
          { name: "overlap", kind: "整数", default: "64", desc: "相邻块的重叠像素，接缝明显时加大。" },
          { name: "temporal_size", kind: "整数", default: "64", desc: "视频 VAE 一次解码的帧数，仅对视频潜空间生效。" },
          { name: "temporal_overlap", kind: "整数", default: "8", desc: "时间块之间的重叠帧数，防闪变。" }
        ],
        tips: "爆显存先减 tile_size 再减 temporal_size；接缝明显就加大 overlap。空间与时间两套参数各自独立生效。"
      },
      // ===== SUPIR 系 =====
      {
        name: "ModelPatchLoader", cat: "load",
        brief: "从补丁目录加载模型外挂，官方补丁体系统一入口。",
        desc: "实验特性。官方新引入的补丁体系加载器：从 models/model_patches 目录读取补丁权重，按内部结构自动识别类型——ControlNet、SUPIR、LLLite 与各类特征投影模块——输出 MODEL_PATCH 对象交给对应的应用节点。一个加载器配合不同应用节点，覆盖多种模型外挂方案。",
        inputs: [],
        outputs: [
          { type: "MODEL_PATCH", to: "典型下游：SUPIRApply 等补丁应用节点", desc: "自动识别类型的补丁对象" }
        ],
        why: "官方把 SUPIR 这类社区经典方案收编成补丁体系，加载与应用分离，同一份补丁可以接到不同底模上反复试验。",
        params: [
          { name: "name", kind: "下拉选择", default: "按下载的补丁选择", desc: "从 models/model_patches 目录选择补丁文件，放入后刷新下拉。" }
        ],
        tips: "不同补丁对应不同的应用节点，报类型错误先查加载器与应用节点的搭配；补丁是实验特性，随版本可能有调整。"
      },
      {
        name: "SUPIRApply", cat: "model",
        brief: "把 SUPIR 修复补丁挂到模型，做高质量图像修复放大。",
        desc: "实验特性。SUPIR 是社区验证多年的老牌修复方案，官方以补丁形式收编。节点把加载的 SUPIR 补丁挂到采样模型上，同时用 VAE 把参考图编码成引导潜空间：strength_start 与 strength_end 分别控制采样前段与后段的控制强度，restore_cfg 把去噪结果往输入拉近，数值越高保真越强、想象越少。",
        inputs: [
          { name: "model", type: "MODEL", from: "典型上游：Checkpoint 或 UNET Loader", desc: "待打补丁的底模" },
          { name: "model_patch", type: "MODEL_PATCH", from: "典型上游：ModelPatchLoader", desc: "SUPIR 补丁" },
          { name: "vae", type: "VAE", from: "典型上游：配套 VAE", desc: "编码引导图用" },
          { name: "image", type: "IMAGE", from: "典型上游：待修复的低清图", desc: "修复的引导图像" }
        ],
        outputs: [
          { type: "MODEL", to: "典型下游：KSampler 或 SamplerCustom", desc: "携带修复控制的模型" }
        ],
        why: "低清老照片、放大后发糊的图靠它起死回生。官方收编后不必再装 SUPIR 专用包，底模替换也更灵活。",
        params: [
          { name: "strength_start", kind: "浮点数", default: "1.0", desc: "采样前段的控制强度，前段定构图。" },
          { name: "strength_end", kind: "浮点数", default: "1.0", desc: "采样后段的控制强度，后段补细节。" },
          { name: "restore_cfg", kind: "浮点数", default: "4.0", desc: "把结果往输入拉近的力度，越高越保真，零为关闭。" },
          { name: "restore_cfg_s_tmin", kind: "浮点数", default: "0.05", desc: "低于该阈值的步不再施加保真拉回。" }
        ],
        tips: "修复出蜡像感就降 restore_cfg，想要更多细节想象可在前段降 strength_start；配合放大模型先用低倍率试效果。"
      },
      // ===== 音频系 =====
      {
        name: "TextEncodeAceStepAudio1.5", cat: "cond",
        brief: "Ace Step 1.5 音乐生成条件编码器，标签歌词加节奏控制。",
        desc: "Ace Step 1.5 的条件入口：tags 写风格与乐器标签，lyrics 写歌词并用结构标记分段，再配上节奏、时长、拍号、语言与调式等结构化控件，一次编码成条件。种子等采样参数直接内置在节点里；可选的音频代码生成开关会调用内置语言模型提升成品质感，代价是编码变慢。",
        inputs: [
          { name: "clip", type: "CLIP", from: "典型上游：Ace Step 1.5 模型加载", desc: "音乐模型与分词器" }
        ],
        outputs: [
          { type: "CONDITIONING", to: "典型下游：采样器正面输入", desc: "携带完整歌曲设定的条件" }
        ],
        why: "音乐生成从玄学变成填表：要什么风格、什么节奏、多长，填进去就行。1.5 版把控制粒度做进了官方节点级。",
        params: [
          { name: "tags", kind: "文本", default: "空", desc: "风格、乐器、情绪标签，逗号分隔。" },
          { name: "lyrics", kind: "文本", default: "空", desc: "歌词内容，用主歌副歌等结构标记分段。" },
          { name: "seed", kind: "整数", default: "0（执行后自动换新）", desc: "随机种子，默认每次执行后自动更换。" },
          { name: "bpm", kind: "整数", default: "120", desc: "每分钟节拍数，十到三百。" },
          { name: "duration", kind: "浮点数", default: "120.0", desc: "目标时长秒数，与空潜空间的 seconds 保持一致。" },
          { name: "timesignature", kind: "下拉选择", default: "4", desc: "拍号。", options: [["2", "二拍子"], ["3", "三拍子，圆舞曲感"], ["4", "四拍子，最常见"], ["6", "六拍子"]] }
        ],
        tips: "歌词用结构标记分段成曲更规整；给了音频参考时把高级参数里的音频代码生成关掉省时间；keyscale 与 language 在高级参数里按需调。"
      },
      {
        name: "EmptyAceStep1.5LatentAudio", cat: "latent",
        brief: "按时长生成 Ace Step 1.5 的空白音频潜空间。",
        desc: "显示名为 Empty Ace Step 1.5 Latent Audio，音乐工作流里的噪声画布：按秒数生成对应长度的空音频潜空间，采样器在其上迭代去噪成曲。1.5 版换用了新的采样率与压缩比，潜空间结构与 1.0 版不同，两代节点的输出不能混用。",
        inputs: [],
        outputs: [
          { type: "LATENT", to: "典型下游：采样器的 latent_image 输入", desc: "带音频类型标记的空潜空间" }
        ],
        why: "时长在这里一锤定音。它与条件编码节点里的 duration 是一对，两个节点要一起改，对不上模型就会困惑。",
        params: [
          { name: "seconds", kind: "浮点数", default: "120.0", desc: "音频时长秒数。" },
          { name: "batch_size", kind: "整数", default: "1", desc: "批量数，批量出小样再挑中意的精修。" }
        ],
        tips: "改时长记得同步条件编码节点的 duration；先按短时长快速试风格，定稿再拉满时长精修。"
      },
      {
        name: "SaveAudioAdvanced", cat: "audio",
        brief: "官方进阶音频保存，无损有损三种格式可选。",
        desc: "显示名为 Save Audio (Advanced)，Save Audio 的升级版。格式下拉在 flac 无损、mp3 与 opus 之间切换，有损格式下再展开码率子选项。文件名前缀支持日期占位符，保存后音频原样输出，可继续接预览或视频封装节点，属于输出节点。",
        inputs: [
          { name: "audio", type: "AUDIO", from: "典型上游：音频解码或生成节点", desc: "要保存的音频" }
        ],
        outputs: [
          { type: "AUDIO", to: "典型下游：CreateVideo 的 audio 输入或继续预览", desc: "原样透传的音频" }
        ],
        why: "一个节点覆盖小样试听到母带交付：无损归档用 flac，分享试听用 mp3，流媒体类场景用 opus。",
        params: [
          { name: "filename_prefix", kind: "文本", default: "audio/ComfyUI", desc: "文件名前缀，可含目录层级与日期占位符。" },
          { name: "format", kind: "下拉选择", default: "flac", desc: "保存格式，选有损格式时展开码率选项。", options: [["flac", "无损，归档首选"], ["mp3", "兼容性最好，可选拍 320k"], ["opus", "同体积音质更好，适合分发"]] }
        ],
        tips: "默认 flac 最稳，只在确定成品格式后再转有损，避免多一次有损压缩叠加损失；mp3 选 320k 码率听感几乎无损。"
      },
      // ===== 视频新体系 =====
      {
        name: "CreateVideo", cat: "video",
        brief: "把帧序列加音频封装成视频对象，官方合体节点。",
        desc: "接收一组图像帧与可选音频，按 fps 封装成统一的 VIDEO 对象输出。位深与色彩空间可选自动、八位、十位与 sRGB、HDR 等组合，选 HDR 色彩空间时自动用十位。它把过去散落在社区包里的合帧、配音、封装能力收进官方一个节点，是帧与声音走向文件的汇合点。",
        inputs: [
          { name: "images", type: "IMAGE", from: "典型上游：视频解码的帧序列", desc: "组成视频的画面帧" },
          { name: "audio", type: "AUDIO", from: "可选，音频解码输出", desc: "要合入的音轨" }
        ],
        outputs: [
          { type: "VIDEO", to: "典型下游：SaveVideo 或视频预览", desc: "封装完成的视频对象" }
        ],
        why: "VIDEO 是官方新视频体系的通用类型，保存与预览都认它。帧与音频在此汇成一个文件级对象，链路立刻清爽。",
        params: [
          { name: "fps", kind: "浮点数", default: "30.0", desc: "封装播放帧率，与采样条件里的帧率是两回事。" },
          { name: "bit_depth", kind: "下拉选择", default: "auto", desc: "位深，自动模式下 HDR 色彩空间用十位。", options: [["auto", "按色彩空间自动决定"], ["8", "固定八位"], ["10", "固定十位"]] },
          { name: "color_space", kind: "下拉选择", default: "sRGB", desc: "输入画面的色彩空间。", options: [["sRGB", "常规出片"], ["HDR", "HLG 广色域"], ["HDR PQ", "PQ 广色域"]] }
        ],
        tips: "Wan 出片常用十六或二十四帧率，LTXV 用二十五或三十；HDR 素材记得把色彩空间切对，否则颜色发灰。"
      },
      {
        name: "SaveVideo", cat: "video",
        brief: "把视频对象写盘成文件，容器与编码可指定。",
        desc: "显示名为 Save Video，官方视频保存出口。接一路 VIDEO，格式下拉在 auto、mp4、mkv、webm 之间切换，编码可选自动、h264 或 av1，自动模式下按编码选择合适的容器。文件名前缀支持日期等占位符，属于输出节点，界面里直接预览成片。",
        inputs: [
          { name: "video", type: "VIDEO", from: "典型上游：CreateVideo 或视频生成链路", desc: "要保存的视频对象" }
        ],
        outputs: [
          { type: "VIDEO", to: "典型下游：继续预览或再接一个保存节点", desc: "原样透传的视频" }
        ],
        why: "官方统一了视频输出路径，不必再靠社区节点转封装。av1 在同画质下体积更小，官方原生支持让长片存储压力小很多。",
        params: [
          { name: "filename_prefix", kind: "文本", default: "video/ComfyUI", desc: "文件名前缀，可含目录层级与日期占位符。" },
          { name: "format", kind: "下拉选择", default: "auto", desc: "容器格式，子项里可再指定编码。", options: [["auto", "按编码自动选容器"], ["mp4", "兼容性最好的通用容器"], ["mkv", "容纳多轨，适合归档"], ["webm", "网页友好，配 av1 或 vp9"]] }
        ],
        tips: "优先 auto；要浏览器直接播放选 mp4 加 h264，追求小体积试 av1，编码慢但省空间。"
      },
      {
        name: "GetVideoComponents", cat: "video",
        brief: "拆解视频对象，抽出帧序列、音频与帧率等成分。",
        desc: "显示名为 Get Video Components，官方拆解节点：接一路 VIDEO，输出五路——图像帧序列、音频波形、帧率、位深与色彩空间。做视频转视频、抽帧重剪、换音轨都要先经它拆开，各成分分别处理后，再用 CreateVideo 封装回去。",
        inputs: [
          { name: "video", type: "VIDEO", from: "典型上游：LoadVideo 或视频生成链路", desc: "待拆解的视频对象" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：图生视频编码或图像处理节点", desc: "拆出的帧序列" },
          { type: "AUDIO", to: "典型下游：音频处理或保存节点", desc: "拆出的音轨" },
          { type: "FLOAT", to: "典型下游：CreateVideo 的 fps 输入", desc: "原视频帧率" },
          { type: "位深", to: "典型下游：CreateVideo 的 bit_depth", desc: "原视频位深" },
          { type: "色彩空间", to: "典型下游：CreateVideo 的 color_space", desc: "原视频色彩空间" }
        ],
        why: "与 CreateVideo 一拆一合，构成官方视频类型的双向接口。任何视频素材都能由此进入像素级处理流程。",
        params: [],
        tips: "抽帧做图生视频首帧时取序列第一张即可；位深与色彩空间两路直接回接 CreateVideo 可保持属性不丢。"
      },
      // ===== 常用老牌进阶 =====
      {
        name: "ImagePadForOutpaint", cat: "image",
        brief: "四边外扩画布并生成羽化遮罩，官方扩图起点。",
        desc: "显示名为 Pad Image for Outpainting。按上下左右四个方向的像素数把图像向外扩，新增区域填中性灰，同时输出一张标记新增区域的遮罩，feathering 控制边缘羽化宽度让新旧过渡自然。扩边图经 VAE Encode、遮罩经 SetLatentNoiseMask 接采样器，模型就只在新增区域作画。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：Load Image 或缩放后的图像", desc: "待外扩的原图" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：VAE Encode", desc: "扩边后的图像" },
          { type: "MASK", to: "典型下游：SetLatentNoiseMask 或 GrowMask", desc: "标记新增区域的遮罩" }
        ],
        why: "扩图的本质是给模型划定创作边界，遮罩就是边界的数字表达。官方一个节点把扩边与遮罩一次给齐，链路最短。",
        params: [
          { name: "left", kind: "整数", default: "0", desc: "向左扩展的像素数，八的倍数最稳。" },
          { name: "top", kind: "整数", default: "0", desc: "向上扩展的像素数。" },
          { name: "right", kind: "整数", default: "0", desc: "向右扩展的像素数。" },
          { name: "bottom", kind: "整数", default: "0", desc: "向下扩展的像素数。" },
          { name: "feathering", kind: "整数", default: "40", desc: "边缘羽化宽度，越大新旧过渡越柔和。" }
        ],
        tips: "只扩一侧就把其余方向设零；原图过大可扩余地就小，先缩放再扩边是常规操作；配合 GrowMask 微调遮罩范围能消除边界硬痕。"
      },
      {
        name: "GrowMask", cat: "mask",
        brief: "把遮罩整体外扩或内缩指定像素。",
        desc: "显示名为 Grow Mask。对遮罩做形态学膨胀或腐蚀：expand 为正向外扩、负向内缩，单位是像素；tapered_corners 决定用方形还是圆角结构元，圆角过渡更柔和。重绘边缘发硬、外扩区域衔接生硬时，微调遮罩范围是最立竿见影的手段。",
        inputs: [
          { name: "mask", type: "MASK", from: "典型上游：Load Image Mask 或扩图节点", desc: "待调整的遮罩" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：SetLatentNoiseMask 或羽化类节点", desc: "调整后的遮罩" }
        ],
        why: "遮罩差几个像素，重绘结果就是天壤之别。官方把它做成独立小节点，插在遮罩链任何位置都能随时调。",
        params: [
          { name: "expand", kind: "整数", default: "0", desc: "外扩为正、内缩为负，像素数。" },
          { name: "tapered_corners", kind: "开关", default: "true", desc: "用圆角结构元，膨胀腐蚀的边缘更圆润。" }
        ],
        tips: "expand 先试八到十六像素；外扩后再接羽化，重绘边界几乎不可见；细线条遮罩慎用大数值，容易糊成一团。"
      },
      {
        name: "DifferentialDiffusion", cat: "model",
        brief: "让遮罩边缘的每步去噪强度平滑过渡。",
        desc: "显示名为 Differential Diffusion，实验特性。传统重绘遮罩是二值的：遮住就完全重画，没遮住就完全不动，边缘容易出接缝。这个节点给模型挂上去噪掩码函数，按当前步的噪声水平动态计算遮罩阈值，让边缘像素早期步多参与、后期步少参与，过渡自然。strength 控制整体混合比例。",
        inputs: [
          { name: "model", type: "MODEL", from: "典型上游：Checkpoint 或 UNET Loader", desc: "待挂掩码函数的模型" }
        ],
        outputs: [
          { type: "MODEL", to: "典型下游：KSampler 或 SamplerCustom", desc: "边缘平滑化的模型" }
        ],
        why: "配合外扩与局部重绘能显著消除边界痕迹。官方收编了这个社区验证多年的技巧，模型链上一挂即用，零学习成本。",
        params: [
          { name: "strength", kind: "浮点数", default: "1.0", desc: "混合比例，低于一时保留更多原遮罩的梯度。" }
        ],
        tips: "与带羽化的软遮罩同用效果最佳；接在模型链上即可，对采样器没有任何要求。"
      },
      {
        name: "ImageOnlyCheckpointLoader", cat: "load",
        brief: "只取视频底模的模型、CLIP Vision 与 VAE 三路。",
        desc: "显示名为 Load Checkpoint Image Only (img2vid model)。与普通 Checkpoint 加载器的区别是不加载文本编码器：它面向 SVD 这类以图像为条件的视频模型，输出 MODEL、CLIP_VISION 与 VAE 三路。条件侧由专门的图像条件节点负责，整条链路都不需要文本编码器。",
        inputs: [],
        outputs: [
          { type: "MODEL", to: "典型下游：视频采样器", desc: "视频扩散模型" },
          { type: "CLIP_VISION", to: "典型下游：CLIP Vision Encode", desc: "底模捆绑的视觉编码器" },
          { type: "VAE", to: "典型下游：VAE Encode 与 Decode", desc: "视频 VAE" }
        ],
        why: "视频底模的文件结构与条件体系都和文生图不同，专用加载器避免用户对着用不上的文本编码器输出发懵。",
        params: [
          { name: "ckpt_name", kind: "下拉选择", default: "按下载的视频底模选择", desc: "从 models/checkpoints 目录选择视频类底模文件。" }
        ],
        tips: "加载出的 CLIP Vision 输出接视觉编码节点做首帧条件；普通文生图工作流不要用它，会拿不到文本编码器。"
      },
      {
        name: "CLIPVisionEncode", cat: "clip",
        brief: "用 CLIP Vision 模型把图像编码成视觉嵌入。",
        desc: "接一路 CLIP_VISION 模型与图像，输出 CLIP_VISION_OUTPUT 视觉嵌入。crop 选 center 时先把图中心裁剪到模型需要的方形再编码，none 则整体缩放保留全构图。这份嵌入是 Style Model、各类图生视频条件与参考图方案的共同食粮，让模型知道参考图长什么样。",
        inputs: [
          { name: "clip_vision", type: "CLIP_VISION", from: "典型上游：CLIP Vision Loader 或视频底模", desc: "视觉编码模型" },
          { name: "image", type: "IMAGE", from: "典型上游：Load Image 或生成图像", desc: "待编码的参考图" }
        ],
        outputs: [
          { type: "CLIP_VISION_OUTPUT", to: "典型下游：StyleModelApply 或视频条件节点", desc: "参考图的视觉嵌入" }
        ],
        why: "凡是以图像为视觉条件的官方模型，都要经这个节点把像素变成模型语言。裁剪与否直接影响构图信息是否完整。",
        params: [
          { name: "crop", kind: "下拉选择", default: "center", desc: "编码前的取景方式。", options: [["center", "中心裁剪到方形，主体居中时最准"], ["none", "整体缩放，保留完整构图"]] }
        ],
        tips: "参考图主体偏一侧或构图特殊就用 none，避免裁掉关键内容；视觉嵌入只能连线获得，没有可手填的替代品。"
      },
      {
        name: "StyleModelApply", cat: "cond",
        brief: "把风格模型的视觉嵌入注入条件实现风格迁移。",
        desc: "显示名为 Apply Style Model。三路输入汇合：条件、风格模型与 CLIP Vision 输出。风格模型把视觉嵌入转成风格特征序列拼进条件的文本特征，采样时画面就朝参考图风格靠拢。strength 控制强度；strength_type 决定作用方式，multiply 直接缩放特征，attn_bias 在注意力偏置层面施加，对带注意力掩码的条件兼容更好。",
        inputs: [
          { name: "conditioning", type: "CONDITIONING", from: "典型上游：CLIP Text Encode", desc: "待注入风格的条件" },
          { name: "style_model", type: "STYLE_MODEL", from: "典型上游：Style Model Loader", desc: "风格模型" },
          { name: "clip_vision_output", type: "CLIP_VISION_OUTPUT", from: "典型上游：CLIPVisionEncode", desc: "风格参考图的视觉嵌入" }
        ],
        outputs: [
          { type: "CONDITIONING", to: "典型下游：采样器正面输入", desc: "携带风格信息条件" }
        ],
        why: "一张风格参考图加一个风格模型就能把画风搬过来，这是官方原生的风格迁移通道，不依赖任何插件。",
        params: [
          { name: "strength", kind: "浮点数", default: "1.0", desc: "风格强度，风格糊掉主体就调低。" },
          { name: "strength_type", kind: "下拉选择", default: "multiply", desc: "强度作用方式。", options: [["multiply", "直接缩放特征，通用默认"], ["attn_bias", "注意力偏置方式，配遮罩分区时更稳"]] }
        ],
        tips: "风格模型文件放 models/style_models 目录；想要局部风格化，把带遮罩的条件接进来再配合 attn_bias。"
      },
      {
        name: "GLIGENTextBoxApply", cat: "cond",
        brief: "在画面指定矩形区域按文本生成指定内容。",
        desc: "显示名为 Apply GLIGEN Text Box，区域控制的经典方案。给一段文本指定画面上的矩形框——坐标与宽高——编码后的文本嵌入连同位置参数注入条件，模型就会把这段内容画在框里。多个本节点串联可实现多物体分区布局，各框内容互不干扰。",
        inputs: [
          { name: "conditioning_to", type: "CONDITIONING", from: "典型上游：CLIP Text Encode 或上一个本节点", desc: "待注入区域信息的条件" },
          { name: "clip", type: "CLIP", from: "典型上游：Checkpoint 的 CLIP 输出", desc: "编码框内文本用" },
          { name: "gligen_textbox_model", type: "GLIGEN", from: "典型上游：GLIGEN Loader", desc: "GLIGEN 文本框模型" }
        ],
        outputs: [
          { type: "CONDITIONING", to: "典型下游：采样器正面输入或下一个本节点继续串联", desc: "携带区域布局的条件" }
        ],
        why: "构图控制最直观的官方方案之一：左上天空、右下建筑，用文本加坐标就能锁定，不必手绘蒙版也不必训练。",
        params: [
          { name: "text", kind: "文本", default: "空", desc: "框内要生成的内容描述。" },
          { name: "width", kind: "整数", default: "64", desc: "框宽，八的倍数，基于原图像素。" },
          { name: "height", kind: "整数", default: "64", desc: "框高。" },
          { name: "x", kind: "整数", default: "0", desc: "框左上角横坐标。" },
          { name: "y", kind: "整数", default: "0", desc: "框左上角纵坐标。" }
        ],
        tips: "坐标与宽高都是原图像素并按八对齐；框可以重叠，重叠处模型自行融合；需要 models/gligen 目录里的文本框模型支持。"
      }
    ]
  });
})();
