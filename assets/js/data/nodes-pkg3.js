(function () {
  "use strict";
  window.COMFY_DATA = window.COMFY_DATA || {};
  window.COMFY_DATA.nodePackages = window.COMFY_DATA.nodePackages || [];

  // ---------- 1. rgthree-comfy ----------
  window.COMFY_DATA.nodePackages.push({
    id: "rgthree-comfy",
    name: "rgthree-comfy",
    author: "rgthree",
    official: false,
    category: "效率与连线路由",
    install: "在 ComfyUI-Manager 里搜索 rgthree 一键安装",
    summary: "rgthree-comfy 是 ComfyUI 社区最受欢迎的效率增强包之一，它几乎不碰生成算法本身，而是专门解决连线杂乱、种子不同步、分支难以切换这类工程问题。它的节点大多是小巧的虚拟节点和控制面板，可以与任何其他节点包自由混搭。很多公开发布的工作流都默认依赖它的几个基础节点，装上它几乎是标配。",
    why: "节点数量一旦超过二三十个，管理与可读性就会成为主要矛盾：连线缠绕、参数散落、调试困难。rgthree 用极轻量的路由节点、集中式种子和一键开关工具，让大型工作流保持整洁、可维护、可复现。",
    tags: ["效率", "路由", "调试"],
    nodes: [
      {
        name: "Reroute (rgthree)", cat: "util",
        brief: "任意类型通用的连线路由点，用于整理画布上的长线。",
        desc: "ComfyUI 自带的 Reroute（改道点）是一个很小的圆点，不容易选中，批量复制也不方便。rgthree 的 Reroute 是一个普通节点形态的路由器，左右各有一个连接点，可以自由缩放、复制和摆放。它的类型由第一次连线决定，之后所有经过它的数据原样通过，不做任何转换。用它把跨越半个画布的斜线拆成几段整齐的折线，或者把多条相关线路沿同一路径排布，工作流立刻清爽很多。",
        inputs: [
          { name: "input", type: "*", from: "典型上游：任意节点的输出", desc: "任意类型的连线，类型由首次连接确定" }
        ],
        outputs: [
          { type: "*", to: "典型下游：任意节点的输入", desc: "原样传出数据，不产生任何变换" }
        ],
        why: "长距离连线是画布混乱的第一来源，也最容易误连错连。Reroute 给连线提供了中继点，让数据流向清晰可读，改线时也只需动中继点。",
        params: [],
        tips: "复制多个 Reroute 后全选并用对齐功能排成一列，就是一条整齐的总线路由；配上 Label 标签节点更直观。"
      },
      {
        name: "Seed (rgthree)", cat: "util",
        brief: "把随机种子变成可分发的连线，一处管理多处使用。",
        desc: "随机种子（Seed）是决定生成结果随机性的数字，标准采样节点把它藏在各自的面板控件里。Seed (rgthree) 把种子变成一个整数输出接口，一次设置就能同时接到多个采样节点或其他需要种子的节点上。节点自带固定、随机、递增、递减等变化策略，每次运行种子如何变化一目了然。多阶段采样时统一种子来源，可以避免某处种子不同步导致结果无法复现。",
        inputs: [],
        outputs: [
          { type: "INT", to: "典型下游：各采样节点的 seed 输入", desc: "统一管理的种子值，可多路分发" }
        ],
        why: "对照实验必须锁住除目标变量以外的一切，种子是最常被忽略的一个。集中供种让多组结果真正可比，也让复现只依赖一个节点。",
        params: [
          { name: "seed", kind: "整数", default: "-1（每次随机）", desc: "种子数值，-1 表示每次执行都重新随机；面板上的按钮可以一键生成一个新的固定随机数，锁定后便于复现。" }
        ],
        tips: "想系统筛选种子时把策略设为递增并固定步长，配合批量运行就能逐个尝试候选种子。"
      },
      {
        name: "Power Prompt (rgthree)", cat: "cond",
        brief: "增强版提示词节点，支持内嵌 LoRA 标记与条件输出。",
        desc: "它看起来是一个文本框节点，平时像字符串原点一样把提示词文本原样输出，另有嵌入与 LoRA 名称的下拉选项辅助输入。接入 CLIP 后它可以直接完成条件编码（Conditioning，把文本转成引导采样的条件），省掉一个 CLIP Text Encode 节点。接入 MODEL 时还能解析 A1111 风格的内嵌 LoRA 写法，也就是 lora 加文件名和权重的标记，自动完成加载而不需要单独的 LoRA 节点。从 WebUI 迁移过来的提示词习惯在这里几乎可以原样保留。",
        inputs: [
          { name: "clip", type: "CLIP", from: "可选，Checkpoint 加载器", desc: "接入后节点增加条件编码输出" },
          { name: "model", type: "MODEL", from: "可选，Checkpoint 加载器", desc: "接入后可解析提示词里内嵌的 LoRA 标记" }
        ],
        outputs: [
          { type: "STRING", to: "典型下游：CLIP Text Encode 等文本输入", desc: "提示词文本本身" },
          { type: "CONDITIONING", to: "典型下游：采样节点", desc: "接入 CLIP 后输出的条件编码" },
          { type: "MODEL", to: "典型下游：采样节点", desc: "接入 MODEL 且文本含 LoRA 标记时输出的模型" }
        ],
        why: "它把提示词、条件编码与内嵌 LoRA 三个环节收拢在一个节点里，画布更紧凑，WebUI 用户也更容易上手。",
        params: [
          { name: "prompt", kind: "文本", default: "空", desc: "提示词正文，支持权重写法；接入 model 输入后还能解析 A1111 风格的内嵌 LoRA 标记并自动加载。" },
          { name: "insert_lora", kind: "下拉选择", default: "CHOOSE", desc: "从已安装的 LoRA 里挑一个，选完后自动把对应标记插入文本，不用手打文件名。",
            options: [["CHOOSE", "占位项，表示尚未选择"], ["DISABLE LORAS", "插入禁用 LoRA 的标记，临时关闭全部内嵌 LoRA"]] },
          { name: "insert_embedding", kind: "下拉选择", default: "CHOOSE", desc: "从 embeddings 目录里挑一个嵌入词，选完后自动插入文本，避免手打拼写错误。" }
        ],
        tips: "负面提示词通常搭配不带 LoRA 解析的 Power Prompt - Simple 变体，结构更干净。"
      },
      {
        name: "Power Lora Loader (rgthree)", cat: "model",
        brief: "列表式多 LoRA 加载器，逐条开关与调节权重。",
        desc: "普通 LoRA（Low-Rank Adaptation，低秩适配小模型）加载节点一次只能挂一个模型，叠加多个时节点链很长。Power Lora Loader 在一个节点里维护一张列表，可以随意增删条目、单独开关、分别设置模型与文本侧强度。节点接受上游传来的模型与编码器，输出应用完列表内全部 LoRA 的结果。开关状态会随工作流保存，做有无对比或回退都很方便。",
        inputs: [
          { name: "model", type: "MODEL", from: "典型上游：Checkpoint 加载器", desc: "待叠加 LoRA 的基础模型" },
          { name: "clip", type: "CLIP", from: "典型上游：同一 Checkpoint 加载器", desc: "配套文本编码器，用于应用文本侧权重" }
        ],
        outputs: [
          { type: "MODEL", to: "典型下游：采样节点的 model 输入", desc: "应用列表内全部 LoRA 后的模型" },
          { type: "CLIP", to: "典型下游：条件编码节点", desc: "应用文本侧权重后的编码器" }
        ],
        why: "混搭风格通常要同时挂好几个 LoRA，逐个串节点既占地方又难管理。列表化之后每次实验只动一个开关，配方也一目了然。",
        params: [
          { name: "on", kind: "开关", default: "开", desc: "该行 LoRA 的启用开关，关掉相当于临时注释一条配方，不必删除重来。" },
          { name: "lora", kind: "下拉选择", default: "None", desc: "该行要加载的 LoRA 文件，选项来自 models 的 lora 目录，行数可以自由增删。",
            options: [["None", "该行不加载任何 LoRA"]] },
          { name: "strength", kind: "浮点数", default: "1.0", desc: "该行 LoRA 的模型侧强度，1.0 为标准强度，混搭时 0.6 到 0.8 更不容易互相打架。" },
          { name: "strengthTwo", kind: "浮点数", default: "空（跟随 strength）", desc: "可选的文本编码器侧强度，留空时与 strength 相同，适合模型与文本侧需要分开调的场景。" }
        ],
        tips: "临时不用某个 LoRA 时直接关掉该行而不是删除；文件必须已放在 models 的 lora 目录，缺失时节点会给出提示。"
      },
      {
        name: "Any Switch (rgthree)", cat: "util",
        brief: "多路输入自动取第一条有效连线，当切换台使用。",
        desc: "Any Switch 接受任意数量、任意类型的输入连线，运行时从上到下检查，把第一条有数据的连线原样传出。例如主图与放大图两条管线都连到它，启用放大流程时上一路被静音，它就自动切换到下一路结果。输入接口是动态的，连几路就出现几个接口，接口类型跟随上游自动匹配。它不改变数据，纯粹是给只能接一条线的接口提供选择能力。",
        inputs: [
          { name: "any_01", type: "*", from: "典型上游：任意待切换的数据源", desc: "继续连线会自动追加 any_02 等输入" }
        ],
        outputs: [
          { type: "*", to: "典型下游：原本只能接一条线的任意接口", desc: "输出第一条非空输入的数据，类型与之一致" }
        ],
        why: "ComfyUI 绝大多数接口只允许一条连线，想在两个方案之间切换就得手动拔线重接。Any Switch 让 A 与 B 方案共存于同一画布，随时切换。",
        params: [],
        tips: "配合静音或旁路操作关闭某一路输入即可完成切换；同类思路还有 Context Switch，用于整套上下文的整体切换。"
      },
      {
        name: "Mute / Bypass Repeater", cat: "util",
        brief: "把自身的激活静音旁路状态分发给相连的一组节点。",
        desc: "静音（Mute）让节点停止执行，旁路（Bypass）让节点跳过执行并把输入直通到输出。这个节点有激活、静音、旁路三种状态，切换时会把自己的状态分发给所有接到它输入的节点；如果它没有连线却位于某个分组里，则状态会作用于整个分组内的节点。把一条支路上的多个节点交给它统一管理，就能用一个开关整体启停。",
        inputs: [
          { name: "input", type: "*", from: "典型上游：需要统一控制的支路节点", desc: "接入的节点会跟随它的状态变化" }
        ],
        outputs: [
          { type: "*", to: "典型下游：Fast Muter 等控制面板节点", desc: "把输出接到控制面板可以按钮化管理一大批节点" }
        ],
        why: "一条辅助流程（例如放大或局部重绘）往往包含十来个节点，逐个切换状态非常繁琐。状态分发把多个开关收拢成一个。",
        params: [],
        tips: "把它的输出连到 Fast Muter 或 Fast Bypasser，就能在面板上一键控制多个节点的静音或旁路。"
      },
      {
        name: "Fast Muter (rgthree)", cat: "util",
        brief: "控制面板式节点，一键静音或恢复所连的节点。",
        desc: "它本身不参与计算，而是一块面板：每接到它一路输入，面板上就多一个对应的开关按钮，点击即可静音或恢复该节点。它有一个只负责旁路的孪生版本 Fast Bypasser，行为相同但切换的是旁路状态。把需要频繁启停的节点都连过来，画布一角就形成了一个简易控制台。",
        inputs: [
          { name: "node", type: "*", from: "典型上游：需要被开关的任意节点", desc: "每接一路都会生成一个对应按钮" }
        ],
        outputs: [],
        why: "反复做对比实验时，某些节点要不停开关，逐个点击既慢又容易漏。面板化之后一次点击完成，状态还一目了然。",
        params: [],
        tips: "按钮与所连节点一一对应，给节点起好名字，面板的可读性会好很多。"
      },
      {
        name: "Image Comparer (rgthree)", cat: "image",
        brief: "双图滑块叠加对比，直接在画布上查看处理前后差异。",
        desc: "Image Comparer 接收两张图像，在节点内以可拖动的分隔线把两者叠加显示，左右滑动即可逐区域比较。它只做展示，不改变图像数据。调试放大器、修脸节点或滤镜参数时，不用把图导出到外部看图软件，画布内就能完成对比，找差异又快又准。",
        inputs: [
          { name: "image_a", type: "IMAGE", from: "典型上游：处理前的图像", desc: "对比基准图" },
          { name: "image_b", type: "IMAGE", from: "典型上游：处理后的图像", desc: "待对比的结果图" }
        ],
        outputs: [],
        why: "调参的核心是看见差别。两张图来回切换容易受记忆干扰，滑块叠加对比能立刻暴露细节、结构与色彩的差异，缩短试错周期。",
        params: [],
        tips: "两张图分辨率不一致时也能显示，但同尺寸下对比最准确。"
      },
      {
        name: "Context (rgthree)", cat: "util",
        brief: "把模型条件潜空间等常用数据打包成一条上下文线。",
        desc: "标准工作流里模型、文本编码器、正负条件、潜空间要分别拉线，节点一多画布就成了蜘蛛网。Context 节点把这些常用数据打包成一个上下文对象输出一条线，同时保留各个单项的展开输出，打包与拆包在同一节点完成。它配套有 Context Switch、Context Merge 与更大容量的 Context Big 等变体，可以在多条流程间整体切换或合并。中途更换模型或条件时，只需改 Context 的对应输入，下游线路完全不动。",
        inputs: [
          { name: "base_context", type: "CONTEXT", from: "可选，另一个 Context 节点", desc: "在此基础之上覆盖部分内容" },
          { name: "model", type: "MODEL", from: "典型上游：Checkpoint 加载器", desc: "扩散模型" },
          { name: "clip", type: "CLIP", from: "典型上游：Checkpoint 加载器", desc: "文本编码器" },
          { name: "vae", type: "VAE", from: "典型上游：Checkpoint 或 VAE 加载器", desc: "潜空间编解码器" },
          { name: "positive", type: "CONDITIONING", from: "典型上游：正面条件编码", desc: "正面条件" },
          { name: "negative", type: "CONDITIONING", from: "典型上游：负面条件编码", desc: "负面条件" },
          { name: "latent", type: "LATENT", from: "典型上游：空潜空间或采样节点", desc: "潜空间数据" }
        ],
        outputs: [
          { type: "CONTEXT", to: "典型下游：Context 系列节点或采样节点", desc: "打包后的上下文对象" },
          { type: "MODEL", to: "典型下游：采样节点", desc: "展开输出，与打包内容一致" },
          { type: "CLIP", to: "典型下游：条件编码节点", desc: "展开输出的编码器" },
          { type: "VAE", to: "典型下游：VAE 解码节点", desc: "展开输出的解码器" },
          { type: "CONDITIONING", to: "典型下游：采样节点正面输入", desc: "展开输出的正面条件" },
          { type: "CONDITIONING", to: "典型下游：采样节点负面输入", desc: "展开输出的负面条件" },
          { type: "LATENT", to: "典型下游：采样节点", desc: "展开输出的潜空间" }
        ],
        why: "在多分支、多阶段的大型工作流里，一条上下文线可以替代六七条平行线，显著降低连线复杂度，也让整体切换方案变得轻松。",
        params: [],
        tips: "不是每个输入都必须连接，未连接的部分会继承 base_context 里的内容，适合做渐进式配置。"
      },
      {
        name: "Display Any (rgthree)", cat: "util",
        brief: "把任意连线的数据转成文本直接显示在节点上。",
        desc: "这是一个纯调试节点：把任何类型的数据接进来，它会把内容转成可读文本显示在节点画面上，自身不输出任何数据。查看当前种子、文本处理结果或数值参数是否符合预期时非常有用。相比把中间结果存成文件再打开检查，这种即时显示快得多，是画布上的监视器。",
        inputs: [
          { name: "source", type: "*", from: "典型上游：任意想查看的数据", desc: "任意类型，节点会尝试转成文本" }
        ],
        outputs: [],
        why: "排查问题的第一步是确认每个环节的输入到底是不是预期值。零成本的中间值检查手段，能省掉大量盲目猜测。",
        params: [],
        tips: "需要同时观察多个数值时，复制几个节点并排摆放并配好标签即可。"
      }
    ]
  });

  // ---------- 2. WAS Node Suite ----------
  window.COMFY_DATA.nodePackages.push({
    id: "was-node-suite",
    name: "WAS Node Suite",
    author: "WASasquatch",
    official: false,
    category: "万能工具箱",
    install: "在 ComfyUI-Manager 里搜索 WAS Node Suite 一键安装",
    summary: "WAS Node Suite 是一个功能极其庞杂的万能工具箱，两百余个节点覆盖图像处理、文本处理、数值工具、遮罩操作与批量读写等方方面面。单个节点未必最强，但胜在覆盖面广、行为稳定，许多经典工作流都建立在它之上。作者已在 2023 年底宣布项目退休，社区维护版仍在广泛使用，遇到基础功能缺件时先来这里翻一翻往往有惊喜。",
    why: "搭工作流时经常缺一个小工具：改段文字、算个数字、调个尺寸、裁个区域。WAS 把这些边角功能一次配齐，避免为一个小功能引入整套节点包。",
    tags: ["工具箱", "图像处理", "文本"],
    nodes: [
      {
        name: "Image Blend", cat: "image",
        brief: "按十余种混合模式把两张图像叠加合成一张。",
        desc: "图像混合（Blend）是把两张图像按指定模式逐像素合成。节点内置正片叠底、滤色、叠加、差值等常见混合模式，与 Photoshop 里的同名模式概念一致，另有混合比例滑杆控制第二张图的影响程度。常用于贴纹理、叠加光效、融入参考图风格或制作双重曝光效果。对不懂原理的人可以把它理解成流程内的图层混合器。",
        inputs: [
          { name: "image_a", type: "IMAGE", from: "典型上游：生成图像或 VAE 解码", desc: "底层图像" },
          { name: "image_b", type: "IMAGE", from: "典型上游：另一路图像", desc: "叠加在上层的图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：预览、保存或继续处理", desc: "混合后的图像" }
        ],
        why: "许多风格化效果不需要重新生成，把两张图按合适模式叠加就能得到，参数直观、结果可预期，是性价比很高的后期手段。",
        params: [
          { name: "mode", kind: "下拉选择", default: "add", desc: "两张图的混合模式，概念与 Photoshop 图层混合一致。",
            options: [["add", "近似不透明叠加，最通用"], ["multiply", "正片叠底，整体压暗，叠纹理常用"], ["screen", "滤色，整体提亮，叠光效常用"], ["overlay", "叠加，提高对比与饱和"], ["soft_light", "柔光，效果比叠加温和"], ["difference", "差值，凸显两图差异，找不同很直观"]] },
          { name: "blend_percentage", kind: "浮点数", default: "1.0", desc: "混合比例，0 为完全显示 image_a，1 为完全应用混合模式，0.5 左右是自然的半融合。" }
        ],
        tips: "串联多组 Blend 分别负责纹理、光效与色调，比一次混合三层素材更可控。"
      },
      {
        name: "Image Filter Adjustments", cat: "image",
        brief: "亮度对比度饱和度锐化等基础调参一站式完成。",
        desc: "这个节点把常用调色工具合并到一个面板：亮度、对比度、饱和度、锐度、伽马等参数，保持默认值时图像不变，需要时再动。相比在外部软件里反复导出导入，直接在流程内调参能让后续节点继续使用调整结果。对生成图做最终修饰时，通常把它放在保存节点之前。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：采样后解码的图像", desc: "待调整的图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：保存或预览节点", desc: "调整后的图像" }
        ],
        why: "生成结果经常需要轻微的对比度或饱和度修正。把它内嵌到工作流，批量出图时每张图都能得到一致的后期处理。",
        params: [
          { name: "brightness", kind: "浮点数", default: "0.0", desc: "亮度增减量，范围 -1 到 1，0 为不变，常用幅度在 0.05 到 0.15 之间。" },
          { name: "contrast", kind: "浮点数", default: "1.0", desc: "对比度系数，1 为不变，大于 1 增强小于 1 减弱，1.1 到 1.3 是安全区。" },
          { name: "saturation", kind: "浮点数", default: "1.0", desc: "饱和度系数，0 到 5，1 为不变，灰蒙时可试 1.1 到 1.3。" },
          { name: "sharpness", kind: "浮点数", default: "1.0", desc: "锐度系数，-5 到 5，大于 1 锐化、小于 1 柔化，出图发糊可微调到 1.2 左右。" },
          { name: "blur", kind: "整数", default: "0", desc: "普通模糊半径，0 到 16 像素，0 为关闭，通常只用于弱化噪点或背景。" },
          { name: "edge_enhance", kind: "浮点数", default: "0.0", desc: "边缘增强的混合比例，0 到 1，0 为关闭，能轻微提高轮廓清晰度。" }
        ],
        tips: "调整幅度宜小，先只动对比度观察效果，避免掩盖模型本身的优势。"
      },
      {
        name: "Image Resize", cat: "image",
        brief: "多种缩放裁剪模式与插值算法的图像尺寸工具。",
        desc: "该节点支持按目标分辨率缩放、保持比例缩放与裁剪等模式，插值算法可选最近邻、双线性、双三次、Lanczos 等。需要放大时还能外接放大模型（Upscale Model）先超分再缩回，兼顾速度与清晰度。在把参考图送入图生图（img2img）之前统一尺寸，是它最常见的用途。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：加载或生成的图像", desc: "待调整尺寸的图像" },
          { name: "upscale_model", type: "UPSCALE_MODEL", from: "可选，Upscale Model Loader", desc: "接入后先做模型超分再缩放" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：编码进潜空间或继续处理", desc: "调整后的图像" }
        ],
        why: "不同模型有各自合适的出图分辨率，参考图尺寸不对会导致构图变形或重复纹理。一个可控的缩放节点是工作流的标准入口组件。",
        params: [
          { name: "mode", kind: "下拉选择", default: "rescale", desc: "缩放方式，决定下面的宽高参数如何生效。",
            options: [["rescale", "按倍数缩放，用 rescale_factor 控制"], ["resize", "缩放到指定宽高，用 resize_width 与 resize_height 控制"]] },
          { name: "rescale_factor", kind: "浮点数", default: "2.0", desc: "倍数模式的缩放系数，0.01 到 16，2 表示放大一倍，放小图喂给模型常用。" },
          { name: "resize_width", kind: "整数", default: "1024", desc: "目标宽度（像素），建议取 64 的倍数以对齐潜空间。" },
          { name: "resize_height", kind: "整数", default: "1536", desc: "目标高度（像素），建议取 64 的倍数，竖构图常配 1216 或 1536。" },
          { name: "resampling", kind: "下拉选择", default: "lanczos", desc: "缩放插值算法，影响缩放后的清晰度与平滑度。",
            options: [["lanczos", "细节保留最好，通用首选"], ["nearest", "最近邻，保留硬边像素风"], ["bilinear", "双线性，速度快画面偏软"], ["bicubic", "双三次，介于两者之间"]] },
          { name: "supersample", kind: "下拉选择", default: "true", desc: "是否先放大一档再缩回目标尺寸，能让缩放结果更锐利，代价是稍慢。" }
        ],
        tips: "图生图前把宽高调到 64 的倍数，可以避免潜空间对齐带来的噪点。"
      },
      {
        name: "Image Save", cat: "image",
        brief: "自定义输出路径、文件名与格式的图像保存节点。",
        desc: "它比内置 Save Image 更可定制：输出路径、文件名前缀、分隔符、计数器等都可以设置，支持选择保存格式与质量。历史记录功能还能翻看这个节点保存过的旧图。批量跑图时把结果按规则归档，后期整理会轻松很多。",
        inputs: [
          { name: "images", type: "IMAGE", from: "典型上游：任何图像输出", desc: "要保存的图像，支持批量" }
        ],
        outputs: [],
        why: "认真管理输出是批量生产的第一步，路径与命名规则固定后，一天跑几百张图也不会乱。",
        params: [
          { name: "output_path", kind: "文本", default: "[time(%Y-%m-%d)]", desc: "输出目录，支持时间变量自动建按日期归档的子目录，也可以写死一个绝对路径。" },
          { name: "filename_prefix", kind: "文本", default: "ComfyUI", desc: "文件名前缀，建议带模型或风格关键词，方便按主题检索。" },
          { name: "extension", kind: "下拉选择", default: "png", desc: "保存格式，png 无损通用，jpg 与 webp 体积小，tiff 适合存档。",
            options: [["png", "无损格式，默认推荐"], ["jpg", "有损压缩，体积最小"], ["webp", "高压缩率，支持无损模式"], ["tiff", "高质量存档，文件很大"]] },
          { name: "quality", kind: "整数", default: "100", desc: "有损格式（jpg 等）的画质，1 到 100，png 格式下不生效。" },
          { name: "filename_number_padding", kind: "整数", default: "4", desc: "文件名序号的补零位数，4 表示 ComfyUI_0001 这样的编号宽度。" }
        ],
        tips: "把输出路径指向专门的成图目录，文件名里带上模型或风格关键词，方便按主题检索。"
      },
      {
        name: "Image Threshold", cat: "image",
        brief: "按阈值把图像二值化为非黑即白的硬边结果。",
        desc: "阈值化（Threshold）按亮度把图像划成两个部分：亮于阈值的部分变白，暗于阈值的部分变黑，节点用滑杆决定分界位置。得到的硬边黑白图可以直接转成遮罩使用，也适合制作版画、剪影风格的效果。它是从图像到遮罩的常用过渡工具之一。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：生成图像或灰度图", desc: "待处理的图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：转遮罩或保存", desc: "二值化后的黑白图像" }
        ],
        why: "很多下游操作需要干净的黑白分界，例如局部重绘区域的粗提取。阈值化是获得硬边结果最直接的方式。",
        params: [
          { name: "threshold", kind: "浮点数", default: "0.5", desc: "亮度分界点，范围 0 到 1，亮于该值的部分变白、其余变黑；小幅度步进调整逼近目标区域。" }
        ],
        tips: "彩色图先转灰度再取阈值，分界会更符合直觉；调阈值时配合预览逐步逼近目标区域。"
      },
      {
        name: "Bounded Image Crop with Mask", cat: "image",
        brief: "按遮罩内容的包围盒自动裁剪出局部区域图。",
        desc: "该节点分析输入遮罩，找出内容的包围盒（Bounding Box，框住遮罩内容的最小矩形），然后按这个范围裁剪图像。做局部重绘时，它能自动把画面裁到主体附近，只把小图送去处理，又快又稳。裁出的区域通常需要放回原图，WAS 里配套的 Bounded Image Blend with Mask 可以直接完成回贴。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：原图像", desc: "待裁剪的图像" },
          { name: "mask", type: "MASK", from: "典型上游：遮罩绘制或分割节点", desc: "定义裁剪范围的遮罩" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：局部采样或继续处理", desc: "按包围盒裁出的图像区域" }
        ],
        why: "整图重绘又慢又容易破坏构图，而手动画框又累又难对齐。用遮罩加包围盒的方式自动定位，是局部处理的标准做法。",
        params: [
          { name: "padding_left", kind: "整数", default: "64", desc: "包围盒左侧外扩的像素数，给重绘留出过渡余量。" },
          { name: "padding_right", kind: "整数", default: "64", desc: "包围盒右侧外扩的像素数，与左侧保持一致最省心。" },
          { name: "padding_top", kind: "整数", default: "64", desc: "包围盒上方外扩的像素数，人物发丝边缘记得多留一些。" },
          { name: "padding_bottom", kind: "整数", default: "64", desc: "包围盒下方外扩的像素数，避免裁得太贴导致接缝。" },
          { name: "return_list", kind: "开关", default: "关", desc: "开启后按遮罩逐张输出裁剪结果列表，适合批量遮罩分别裁剪的场景。" }
        ],
        tips: "先用分割或阈值类节点生成主体遮罩，再接本节点，就得到全自动的主体裁剪链路。"
      },
      {
        name: "Text Find and Replace", cat: "util",
        brief: "在文本中查找指定片段并替换为新的内容。",
        desc: "它接收一段文本，把其中匹配的片段替换成新内容，查找与替换的内容在节点面板里填写。在维护大型提示词模板时，它是轻量的字符串处理工具，不必为一次改动重写整段提示词。与拼接、插入等文本节点组合，可以搭出灵活的提示词装配线。",
        inputs: [
          { name: "text", type: "STRING", from: "典型上游：任意文本节点或模板文本", desc: "待处理的原始文本" }
        ],
        outputs: [
          { type: "STRING", to: "典型下游：条件编码或文本拼接节点", desc: "替换完成的文本" }
        ],
        why: "提示词实验经常是只改一个词的对照。用替换节点可以保留原始模板不动，只在外层换词，版本管理清晰。",
        params: [
          { name: "find", kind: "文本", default: "空", desc: "要查找的片段，支持正则表达式写法，内容要与提示词里的写法逐字一致。" },
          { name: "replace", kind: "文本", default: "空", desc: "替换成的新内容，留空即为删除找到的片段。" }
        ],
        tips: "查找目标要足够独特，避免误伤提示词里其他含相同片段的单词。"
      },
      {
        name: "Text Concatenate", cat: "util",
        brief: "把两段文本按分隔符拼接成一段完整文本。",
        desc: "它提供文本输入与分隔符设置，按顺序把多段文本连接成一段。可以把固定前缀、主体提示词、风格后缀分别由不同节点维护，最后在这里组装。某一路为空时依然可以正常拼接，适合搭建可插拔的提示词结构。",
        inputs: [
          { name: "text_a", type: "STRING", from: "典型上游：任意文本节点", desc: "第一段文本" },
          { name: "text_b", type: "STRING", from: "典型上游：任意文本节点", desc: "第二段文本" }
        ],
        outputs: [
          { type: "STRING", to: "典型下游：条件编码节点", desc: "拼接后的完整文本" }
        ],
        why: "把质量词、主体、风格拆开管理，比维护一整段超长提示词清晰得多。拼接节点让模块化的提示词组装成为可能。",
        params: [
          { name: "delimiter", kind: "文本", default: ", ", desc: "各段文本之间的分隔符，填 \\n 表示换行拼接。" },
          { name: "clean_whitespace", kind: "下拉选择", default: "true", desc: "拼接前是否去掉各段首尾的空白字符，开启可避免出现多余空格。",
            options: [["true", "去除首尾空白，最常用"], ["false", "原样保留，需要精确控制空格时用"]] }
        ],
        tips: "分隔符用逗号加空格最稳妥；拼接顺序会影响权重表现，重要的放前面。"
      },
      {
        name: "Number Counter", cat: "util",
        brief: "按步长递增递减的数值计数器，可循环可复位。",
        desc: "计数器每次运行按设定的步长变化，支持递增、递增到上限、递减、递减到下限等模式，可以设定起始值与停止值，还能通过复位信号回到起点。它常用来为批量输出编号、控制逐张切换的输入图，或驱动需要步进变化的参数。节点同时提供整数与小数两种输出，方便接给不同类型的接口。",
        inputs: [],
        outputs: [
          { type: "INT", to: "典型下游：需要整数参数的节点", desc: "当前计数的整数形式" },
          { type: "FLOAT", to: "典型下游：需要小数参数的节点", desc: "当前计数的小数形式" }
        ],
        why: "自动化流程里经常需要一个随执行推进的数值，例如编号、索引或逐次变化的参数。计数器把这个逻辑独立成节点，避免手动改参。",
        params: [
          { name: "number_type", kind: "下拉选择", default: "integer", desc: "输出数值类型，integer 为整数，float 为小数，两种输出接口节点上都有。",
            options: [["integer", "整数计数，编号场景用"], ["float", "小数计数，步进带小数时用"]] },
          { name: "mode", kind: "下拉选择", default: "increment", desc: "每次执行的变化方式。",
            options: [["increment", "一直递增，不设上限"], ["decrement", "一直递减，不设下限"], ["increment_to_stop", "递增到 stop 值后停住"], ["decrement_to_stop", "递减到 stop 值后停住"], ["reset_after_stop", "到达 stop 后自动复位重新开始"]] },
          { name: "start", kind: "浮点数", default: "0", desc: "计数的起始值，也是复位后回到的值。" },
          { name: "stop", kind: "浮点数", default: "0", desc: "停止值，只在带 to_stop 的模式下生效。" },
          { name: "step", kind: "浮点数", default: "1", desc: "每次执行的步进量，可为小数，扫描式实验常用 0.05 这类细步长。" }
        ],
        tips: "先固定其他参数只让计数器变化，可以确认某参数连续变化时的效果趋势；批量任务中断后可用复位重新开始。"
      },
      {
        name: "Seed", cat: "util",
        brief: "提供可复现可管理的随机种子输出。",
        desc: "这个节点输出一个种子值，供采样器等节点连线使用，面板上可以固定数值或每次运行随机更新。它的思路与 rgthree 的同名节点一致：把种子从控件变成可分发的连线。多个采样节点共用一个种子源时，可以排除种子差异对实验的干扰。",
        inputs: [],
        outputs: [
          { type: "INT", to: "典型下游：采样节点的 seed 输入", desc: "统一管理的种子值" }
        ],
        why: "做对照实验时种子必须可控。集中供种能保证多组结果真正可比，复现结果也只取决于一个节点。",
        params: [
          { name: "seed", kind: "整数", default: "0", desc: "输出给下游的种子值，可同时接到多个采样节点；界面会附带每次生成后的变化策略下拉，如 fixed、randomize、increment。" }
        ],
        tips: "找到满意构图后固定种子，再微调提示词或 CFG，是逐步逼近理想结果的常用手法。"
      }
    ]
  });

  // ---------- 3. ComfyUI-Inspire-Pack ----------
  window.COMFY_DATA.nodePackages.push({
    id: "inspire-pack",
    name: "ComfyUI-Inspire-Pack",
    author: "Dr.Lt.Data / ltdrdata",
    official: false,
    category: "提示词与批量实验",
    install: "在 ComfyUI-Manager 里搜索 Inspire Pack 一键安装",
    summary: "ComfyUI-Inspire-Pack 与知名的 Impact Pack 出自同一作者 ltdrdata，聚焦批量实验与采样增强。它提供全局种子管理、LoRA 块权重加载与分析、目录级批量读图等能力，把 A1111 用户熟悉的批量出图与参数扫描习惯带进 ComfyUI。它常与 Impact Pack 搭配出现在自动修图与批量生产工作流里。",
    why: "认真做图离不开重复实验：换词、换种子、逐张处理图集。Inspire Pack 把这些重复劳动自动化，同时保留人工挑选与把关的接口。",
    tags: ["批量", "种子", "LoRA"],
    nodes: [
      {
        name: "Global Seed (Inspire)", cat: "util",
        brief: "执行前统一写入全画布的种子控件，无需拉线。",
        desc: "这个节点不通过连线传递种子，而是在每次执行前，把面板上的种子值统一写入工作流里所有名为 seed 或 noise_seed 的控件，等于给全画布的采样节点统一种子。已改成输入连线的种子不受它控制，需要独立管理的环节可以照常单独连线。配合控制选项可以在每次生成前刷新种子，实现一键全员随机或全员固定。",
        inputs: [],
        outputs: [],
        why: "工作流越复杂，散落的种子控件越多，漏改一个就会失去复现性。全局种子把这件琐事变成单一开关，多采样器协作时尤其重要。",
        params: [
          { name: "value", kind: "整数", default: "0", desc: "全局种子数值，执行前会统一写入工作流里所有名为 seed 或 noise_seed 的控件。" },
          { name: "action", kind: "下拉选择", default: "fixed", desc: "每次执行时种子如何变化。",
            options: [["fixed", "始终用这里填的值，全员锁种"], ["increment", "每次整体加 1，逐个试种"], ["decrement", "每次整体减 1"], ["randomize", "每次全员随机"], ["increment for each node", "各节点分别递增，互不相同"]] },
          { name: "mode", kind: "开关", default: "开", desc: "开为排队前刷新种子（control_before_generate），关为执行后刷新（control_after_generate），影响批量连跑时的节奏。" }
        ],
        tips: "想让某个环节的种子独立变化，把该节点的种子转为输入连线即可脱离全局控制。"
      },
      {
        name: "LoraLoaderBlockWeight", cat: "model",
        brief: "按模型分块精细控制 LoRA 各层的作用强度。",
        desc: "普通 LoRA 加载只能设定整体强度，而扩散模型内部由多个块（Block）组成，不同块对构图与细节的影响各不相同。该节点为每个块提供独立的强度设置，可以观察或限制 LoRA 在哪些层起作用。它是研究 LoRA 行为、做块权重扫描的专业工具，常与参数对比流程搭配使用。",
        inputs: [
          { name: "model", type: "MODEL", from: "典型上游：Checkpoint 加载器", desc: "基础模型" },
          { name: "clip", type: "CLIP", from: "典型上游：Checkpoint 加载器", desc: "文本编码器" }
        ],
        outputs: [
          { type: "MODEL", to: "典型下游：采样节点", desc: "应用块权重后的模型" },
          { type: "CLIP", to: "典型下游：条件编码节点", desc: "应用文本侧权重后的编码器" }
        ],
        why: "同一个 LoRA 在不同底模上表现差异很大，逐块调节是定位问题与微调效果的重要手段。想理解 LoRA 到底改了什么，离不开块级控制。",
        params: [
          { name: "lora_name", kind: "下拉选择", default: "第一个 LoRA 文件", desc: "要按块加载的 LoRA 文件，可用 category_filter 先按目录过滤缩小列表。" },
          { name: "strength_model", kind: "浮点数", default: "1.0", desc: "模型侧总强度，与块权重相乘后生效，先从这里确认方向。" },
          { name: "strength_clip", kind: "浮点数", default: "1.0", desc: "文本编码器侧总强度，通常与模型侧同值，遇到文不对图时再单独调。" },
          { name: "preset", kind: "下拉选择", default: "Preset", desc: "内置的块权重预设，选择后自动填充块向量。",
            options: [["Preset", "使用 block_vector 里手写的向量"], ["P0", "全部块权重设为 1，相当于不分区"]] },
          { name: "block_vector", kind: "文本", default: "1,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1", desc: "逐块权重向量，每个数字对应模型的一个块，0 表示该块不生效，1 表示正常生效。" },
          { name: "inverse", kind: "开关", default: "关", desc: "开启后每块权重取反（按 1 减权重），方便快速对比某组块开启与关闭的差异。" },
          { name: "A", kind: "浮点数", default: "4.0", desc: "部分预设生成正弦式块向量用的系数，手动向量模式下不用管。" },
          { name: "B", kind: "浮点数", default: "1.0", desc: "同上，向量生成的第二个系数，一般保持默认。" }
        ],
        tips: "初次使用建议所有块保持默认，只调整体强度确认方向，再深入到具体块做细调。"
      },
      {
        name: "LoraBlockInfo", cat: "model",
        brief: "查看 LoRA 文件在模型各块中的权重分布。",
        desc: "该节点读取指定 LoRA 与当前模型，把 LoRA 实际写入的块与权重分布展示出来，帮助判断它偏向影响构图还是细节。它与块权重加载器配合，形成先查看再调节的工作闭环。对研究型用户来说，这是少有的把内部结构透明化的工具。",
        inputs: [
          { name: "model", type: "MODEL", from: "典型上游：模型链路", desc: "用于读取信息的模型" },
          { name: "clip", type: "CLIP", from: "典型上游：同一链路", desc: "配套文本编码器" },
          { name: "lora_name", type: "COMBO", from: "节点面板选择", desc: "要查看的 LoRA 文件" }
        ],
        outputs: [],
        why: "不明就里地叠加 LoRA 容易互相冲突。先查看它作用于哪些块，再决定放置位置与强度，可以少走很多弯路。",
        params: [
          { name: "lora_name", kind: "下拉选择", default: "第一个 LoRA 文件", desc: "要分析的 LoRA 文件，节点会把它的块分布写入 block_info 显示。" },
          { name: "block_info", kind: "文本", default: "空", desc: "分析结果展示区，执行后自动填入各块的权重明细，不需要手动填写。" }
        ],
        tips: "分析时连接的模型应与实际使用一致，不同底模的块结构可能不同。"
      },
      {
        name: "Show Info", cat: "util",
        brief: "在节点上打印任意输入的内部信息便于排查。",
        desc: "Show Info 提供多种类型的可选输入，接入模型、潜空间、图像或字符串等数据后，会把内部信息以文本形式显示出来，例如模型名称、潜空间尺寸、图像规格或文本内容。它不改数据、不参与生成，纯粹用于观察。排查工作流问题时，把它临时接到可疑位置往往能立刻定位原因。",
        inputs: [
          { name: "model", type: "MODEL", from: "可选，任意模型链路", desc: "显示模型相关信息" },
          { name: "latent", type: "LATENT", from: "可选，采样或编码节点", desc: "显示潜空间尺寸等信息" },
          { name: "image", type: "IMAGE", from: "可选，任意图像", desc: "显示图像尺寸等信息" },
          { name: "string", type: "STRING", from: "可选，任意文本", desc: "直接显示文本内容" }
        ],
        outputs: [],
        why: "很多问题源于数据在某个环节与预期不符。有一个随时可挂接的信息窗口，比猜测和盲试高效得多。",
        params: [],
        tips: "调试完成后记得移除或静音，保持工作流整洁。"
      },
      {
        name: "KSampler (Inspire)", cat: "sampler",
        brief: "标准采样器的增强版，强化种子管理与复现能力。",
        desc: "它的采样行为与标准 KSampler 一致，额外强化了种子与实验管理：提供运行后恢复种子之类的选项，反复执行时不容易把设定改乱，也能配合全局种子节点做统一管理。多阶段采样工作流里用它承担采样环节，可以明显减少忘记改种子导致的事故。",
        inputs: [
          { name: "model", type: "MODEL", from: "典型上游：模型加载或 LoRA 链路", desc: "采样用模型" },
          { name: "positive", type: "CONDITIONING", from: "典型上游：正面条件编码", desc: "正面引导条件" },
          { name: "negative", type: "CONDITIONING", from: "典型上游：负面条件编码", desc: "负面引导条件" },
          { name: "latent_image", type: "LATENT", from: "典型上游：空潜空间或上游采样结果", desc: "采样起点" }
        ],
        outputs: [
          { type: "LATENT", to: "典型下游：VAE 解码或二次采样", desc: "采样结果潜空间" }
        ],
        why: "种子管理是复现实验的生命线。在不改变采样习惯的前提下，这个节点把种子链路纳入统一控制，适合所有多阶段流程。",
        params: [
          { name: "seed", kind: "整数", default: "0", desc: "随机种子，受全局种子节点统一管理；界面附带每次生成后的变化策略下拉。" },
          { name: "steps", kind: "整数", default: "20", desc: "去噪总步数，20 到 35 是常用区间。" },
          { name: "cfg", kind: "浮点数", default: "8.0", desc: "提示词服从度，SD1.5 用 6 到 8，SDXL 用 4 到 7。" },
          { name: "sampler_name", kind: "下拉选择", default: "euler", desc: "去噪算法，选项与标准 KSampler 一致；euler 与 dpmpp_2m 是稳妥起步。" },
          { name: "scheduler", kind: "下拉选择", default: "normal", desc: "步数调度方式，karras 通常让画面细节更均匀。" },
          { name: "denoise", kind: "浮点数", default: "1.0", desc: "去噪强度，1 为完全重绘；接上游潜空间做图生图时降到 0.5 到 0.8。" },
          { name: "noise_mode", kind: "下拉选择", default: "GPU(=A1111)", desc: "初始噪声的生成设备，影响随机序列，与 A1111 对齐结果时保持默认。",
            options: [["GPU(=A1111)", "显卡生成，行为与 A1111 一致"], ["CPU", "处理器生成，是 ComfyUI 的传统方式"]] },
          { name: "batch_seed_mode", kind: "下拉选择", default: "incremental", desc: "批量多张时种子如何推进。",
            options: [["incremental", "每张种子递增，出图彼此独立"], ["comfy", "沿用 ComfyUI 默认的批量种子方式"], ["variation str inc:0.01", "在相近种子上做微变化，幅度 0.01"]] }
        ],
        tips: "需要起止步数与噪声注入等高级控制时，改用同包的 KSamplerAdvanced (Inspire)。"
      },
      {
        name: "KSamplerAdvanced (Inspire)", cat: "sampler",
        brief: "支持分段采样与噪声控制的高级版采样器。",
        desc: "在标准采样能力之上，它开放了噪声注入、起始步与结束步、剩余噪声返回等高级参数，可以把一次完整采样拆成多段接力完成。典型用法是先用低步数铺构图，再接另一台采样器做细化。种子管理特性与 KSampler (Inspire) 一致，可与全局种子节点协同。",
        inputs: [
          { name: "model", type: "MODEL", from: "典型上游：模型链路", desc: "采样用模型" },
          { name: "positive", type: "CONDITIONING", from: "典型上游：正面条件", desc: "正面条件" },
          { name: "negative", type: "CONDITIONING", from: "典型上游：负面条件", desc: "负面条件" },
          { name: "latent_image", type: "LATENT", from: "典型上游：上游采样结果", desc: "接续采样的潜空间" }
        ],
        outputs: [
          { type: "LATENT", to: "典型下游：后续采样或解码", desc: "采样结果潜空间" }
        ],
        why: "分阶段采样是放大、细化与风格迁移流程的基础。把起止步数与种子控制交给节点管理，接力实验才不会混乱。",
        params: [
          { name: "add_noise", kind: "开关", default: "enable", desc: "是否在本段起点注入新噪声；接力采样的第二段通常关闭，沿用上游剩余噪声。" },
          { name: "noise_seed", kind: "整数", default: "0", desc: "噪声种子，仅当 add_noise 开启时生效，可与全局种子节点协同。" },
          { name: "steps", kind: "整数", default: "20", desc: "整条采样计划的总步数，分段时各段要基于同一总步数换算。" },
          { name: "cfg", kind: "浮点数", default: "8.0", desc: "提示词服从度，含义与标准采样器一致。" },
          { name: "sampler_name", kind: "下拉选择", default: "euler", desc: "去噪算法，分段接力时前后段建议使用同一种。" },
          { name: "start_at_step", kind: "整数", default: "0", desc: "本段从第几步开始，第二段填上一段的结束步即可无缝接力。" },
          { name: "end_at_step", kind: "整数", default: "10000", desc: "本段跑到第几步为止，填 10000 表示跑到总步数结束。" },
          { name: "return_with_leftover_noise", kind: "开关", default: "disable", desc: "开启后到达结束步时带着剩余噪声直接输出，供下一段继续；单段使用保持关闭。" }
        ],
        tips: "分段采样时让后一段的起始步对齐前一段的结束步，过渡会更自然。"
      },
      {
        name: "Load Image List From Dir (Inspire)", cat: "load",
        brief: "读取目录内全部图像作为一个批量列表。",
        desc: "指定一个文件夹路径，节点会把其中所有图像读入为一个图像列表，供下游按批量方式一次性处理。它常用于给已有图集统一放大、换风格或重写提示词等批处理任务。列表一次性进入流程，配合批量采样能力可以自动跑完整个目录。",
        inputs: [],
        outputs: [
          { type: "IMAGE", to: "典型下游：批处理型节点", desc: "目录内图像组成的批量数据" },
          { type: "MASK", to: "典型下游：遮罩类节点", desc: "图像附带的遮罩数据" }
        ],
        why: "手头有一批图需要统一处理时，手动逐张加载完全不现实。目录读取节点让 ComfyUI 具备了批处理流水线的入口。",
        params: [
          { name: "directory", kind: "文本", default: "空", desc: "图像目录路径，用正斜杠书写可以减少跨平台问题，例如 D:/images/batch。" },
          { name: "image_load_cap", kind: "整数", default: "0", desc: "最多读取几张图，0 表示不限，先用小数字试跑流程更稳。" },
          { name: "start_index", kind: "整数", default: "0", desc: "从目录里第几张开始读，改这个数字可以跳过已处理过的图。" },
          { name: "sort_method", kind: "下拉选择", default: "None", desc: "文件排序方式，决定批量处理的先后顺序。",
            options: [["None", "按系统列出的顺序"], ["Alphabetical (ASC)", "按文件名升序"], ["Alphabetical (DESC)", "按文件名降序"], ["Numerical (ASC)", "按文件名中的数字升序"]] },
          { name: "load_always", kind: "开关", default: "关", desc: "开启后每次执行都重新读盘，目录内容变了能及时生效；关闭则走缓存更快。" }
        ],
        tips: "路径使用正斜杠书写可以减少跨平台问题；确认目录里没有不想处理的杂图。"
      },
      {
        name: "Load Image Batch From Dir (Inspire)", cat: "load",
        brief: "每次执行读取目录中的一张图像并可自动推进。",
        desc: "与一次读入整个列表不同，这个节点每次执行读取目录里的一张图像，并按增量、随机等模式在多次运行间推进指针。它适合把整个目录当作队列逐张处理的场景，例如逐张重绘或逐张放大，中途可以随时停下来检查。配合提示词与种子的联动，能搭出全自动的批量重绘流水线。",
        inputs: [],
        outputs: [
          { type: "IMAGE", to: "典型下游：图生图编码或处理节点", desc: "当前读取的图像" },
          { type: "MASK", to: "典型下游：遮罩类节点", desc: "当前图像的遮罩" }
        ],
        why: "逐张推进意味着可控：随时中断、检查、继续，比一次性批量更适合慢流程或贵模型的批量任务。",
        params: [
          { name: "directory", kind: "文本", default: "空", desc: "图像目录路径，节点会从这里按顺序逐张读取。" },
          { name: "image_load_cap", kind: "整数", default: "0", desc: "最多读取几张，0 表示不限，便于先拿两三张图验证流程。" },
          { name: "start_index", kind: "整数", default: "0", desc: "起始读取位置，中断后从这里接着跑，-1 表示从最后一张往前推。" },
          { name: "load_always", kind: "开关", default: "关", desc: "开启后每次执行都重新扫描目录，适合逐张推进的队列式用法。" },
          { name: "sort_method", kind: "下拉选择", default: "None", desc: "文件排序方式，逐张处理时建议按文件名排序保证顺序可预期。",
            options: [["None", "按系统列出的顺序"], ["Alphabetical (ASC)", "按文件名升序"], ["Numerical (ASC)", "按文件名中的数字升序"], ["Datetime (ASC)", "按修改时间从旧到新"]] }
        ],
        tips: "把模式切到单张模式可以固定读取某一张，便于调试完再放开批量。"
      }
    ]
  });

  // ---------- 4. ComfyUI-Easy-Use ----------
  window.COMFY_DATA.nodePackages.push({
    id: "easy-use",
    name: "ComfyUI-Easy-Use",
    author: "yolain",
    official: false,
    category: "一体化简化节点",
    install: "在 ComfyUI-Manager 里搜索 Easy Use 一键安装",
    summary: "ComfyUI-Easy-Use 的理念是把常用流程压缩成少量一体化节点。Easy 系列通过管线对象（Pipe，把模型、条件、图像等打包传递的数据结构）在节点间传递全部上下文，让加载、预采样、采样、精修首尾相接，画布上只剩一条干净的流水线。它同时保留了对输出方式与噪声种子的细粒度控制，简单而不简陋。",
    why: "标准工作流对新手并不友好，接线错误比参数错误更常见。Easy 系列把固定搭配打包，既降低了入门门槛，也给熟练用户省下大量重复劳动。",
    tags: ["简化", "一体化", "管线"],
    nodes: [
      {
        name: "Easy Full Loader", cat: "load",
        brief: "一个节点完成模型提示词分辨率等全部初始配置。",
        desc: "这个节点把标准工作流的起点全部收拢：底模选择、VAE 指定、CLIP 跳层、内置 LoRA、正负提示词、分辨率与批量数都在一个面板里，输出一条承载全部信息的管线给后续 Easy 节点。需要外挂模型、编码器或解码器时，也可以通过可选输入覆盖面板设置。新版本还把正面提示词、负面提示词与潜空间作为独立输出了出来，方便兼容非 Easy 节点。",
        inputs: [
          { name: "model_override", type: "MODEL", from: "可选，外部模型加载节点", desc: "覆盖面板选择的底模" },
          { name: "clip_override", type: "CLIP", from: "可选，外部加载节点", desc: "覆盖默认文本编码器" },
          { name: "vae_override", type: "VAE", from: "可选，外部 VAE 加载节点", desc: "覆盖默认 VAE" }
        ],
        outputs: [
          { type: "PIPE_LINE", to: "典型下游：Easy preSampling 或 Easy KSampler", desc: "打包模型条件与设置的管线对象" }
        ],
        why: "新手最容易在加载与编码环节接错线。一体式加载器把这些步骤固化成面板选项，降低入门门槛的同时也让画布更简洁。",
        params: [
          { name: "ckpt_name", kind: "下拉选择", default: "第一个底模文件", desc: "底模文件，选项来自 models 的 checkpoints 目录；接了 model_override 输入时可以留 None。" },
          { name: "vae_name", kind: "下拉选择", default: "Baked VAE", desc: "指定 VAE，Baked VAE 表示直接用底模内置的解码器；底模内置 VAE 质量差时再选外部文件。",
            options: [["Baked VAE", "使用底模内置 VAE，最省事"], ["外部 vae 文件", "列表其余项为 models 的 vae 目录里的独立 VAE"]] },
          { name: "clip_skip", kind: "整数", default: "-2", desc: "CLIP 跳层，-1 为不跳层，动漫类模型常用 -2，具体以模型说明为准。" },
          { name: "lora_name", kind: "下拉选择", default: "None", desc: "内置的一枚 LoRA，None 表示不挂；需要多枚时改用 Easy Lora Loader。",
            options: [["None", "不加载内置 LoRA"]] },
          { name: "positive", kind: "文本", default: "空", desc: "正面提示词，填这里可以省掉单独的条件编码节点。" },
          { name: "negative", kind: "文本", default: "空", desc: "负面提示词，与正面提示词一起打包进管线。" },
          { name: "resolution", kind: "下拉选择", default: "512 x 512", desc: "内置的常见分辨率预设，选中后自动填充宽高；SDXL 建议选 1024 一档。" },
          { name: "batch_size", kind: "整数", default: "1", desc: "一次生成的张数，批量大时显存占用线性上升，出图 2 到 4 张便于挑选。" }
        ],
        tips: "面板留空的选项会使用默认行为，不必逐项填写；需要精细控制时再改用标准节点组合。"
      },
      {
        name: "Easy Lora Loader", cat: "model",
        brief: "多 LoRA 列表加载，可与 Easy 管线直接串联。",
        desc: "节点内置 LoRA 列表，可逐条添加模型、设置强度并单独开关，相当于把一串 LoRA 加载器折叠成一个节点。它接受上游的模型与编码器，也兼容 Easy 管线，输出应用完毕的结果。与 Easy Full Loader 组合时，底模与 LoRA 配方可以分开管理，换模型不换配方。",
        inputs: [
          { name: "model", type: "MODEL", from: "典型上游：Checkpoint 或 Easy 加载器", desc: "基础模型" },
          { name: "clip", type: "CLIP", from: "典型上游：同一加载器", desc: "文本编码器" }
        ],
        outputs: [
          { type: "MODEL", to: "典型下游：采样或预采样节点", desc: "叠加 LoRA 后的模型" },
          { type: "CLIP", to: "典型下游：条件编码节点", desc: "叠加文本侧权重后的编码器" }
        ],
        why: "LoRA 配方往往要长期复用，折叠成一个列表节点后，换底模、换风格都只需要动一处配置。",
        params: [
          { name: "toggle", kind: "开关", default: "开", desc: "整个节点的总开关，关闭后原样放行上游模型，等于一键跳过全部 LoRA。" },
          { name: "lora_name", kind: "下拉选择", default: "None", desc: "某一行的 LoRA 文件，None 表示该行不生效；行数可以增删，逐行独立配置。",
            options: [["None", "该行不加载任何 LoRA"]] },
          { name: "strength", kind: "浮点数", default: "1.0", desc: "该行 LoRA 的强度，简单模式下模型与文本侧共用；进阶模式可分开设置。" }
        ],
        tips: "为不同用途保存不同的列表配置，比每次手改权重更快也更不容易出错。"
      },
      {
        name: "Easy Positive", cat: "cond",
        brief: "面向正面提示词的快捷文本节点。",
        desc: "这是一个简单直接的正面提示词文本节点，输出普通字符串，可以接到条件编码节点，也可以直接喂给 Easy 系列加载器的提示词输入。它的价值在于与其他 Easy 节点风格统一：同样的连线方式、同样的使用习惯，让整条流水线保持一致。配合通配符或文本处理节点，还可以进一步自动化。",
        inputs: [],
        outputs: [
          { type: "STRING", to: "典型下游：条件编码或 Easy 加载器", desc: "正面提示词文本" }
        ],
        why: "Easy 流水线里到处都是管线对象，但在提示词层面保持普通字符串接口，才能与其他文本工具自由组合。",
        params: [
          { name: "positive", kind: "文本", default: "空", desc: "正面提示词正文，支持权重写法，直接输出字符串给下游。" }
        ],
        tips: "把它与 Easy Negative 成对使用，正负提示词在画布上位置对称、一目了然。"
      },
      {
        name: "Easy Negative", cat: "cond",
        brief: "面向负面提示词的快捷文本节点。",
        desc: "负面提示词（Negative Prompt）告诉模型要避免什么，例如低画质、多余肢体、模糊等。该节点与 Easy Positive 对应，专门承载负面文本，输出字符串供条件编码或 Easy 加载器使用。负面词写法高度依赖模型，把它独立成节点方便按模型维护不同的负面模板。",
        inputs: [],
        outputs: [
          { type: "STRING", to: "典型下游：负面条件编码或 Easy 加载器", desc: "负面提示词文本" }
        ],
        why: "负面提示词对成品质量影响巨大，但新手往往不知道该写什么。独立成节点后，可以积累一套随模型走的负面模板。",
        params: [
          { name: "negative", kind: "文本", default: "空", desc: "负面提示词正文，描述要避免的元素，随模型维护不同的模板。" }
        ],
        tips: "负面词不是越多越好，先从少量高频词开始，出现对应问题时再追加。"
      },
      {
        name: "Easy Wildcards", cat: "cond",
        brief: "解析通配符词表，批量随机生成提示词组合。",
        desc: "通配符（Wildcards）是一种批量实验语法：在文本里写下特定标记，节点运行时用预先准备好的词表随机替换标记，每次生成不同的组合。该节点解析这类语法并输出填充后的提示词，词表以文本文件维护，也支持直接内嵌写法。想系统探索发型、服装、场景等要素组合时，它是效率最高的工具之一。",
        inputs: [],
        outputs: [
          { type: "STRING", to: "典型下游：条件编码或 Easy 采样链路", desc: "随机填充后的提示词文本" }
        ],
        why: "手动穷举要素组合不现实，通配符把组合实验变成自动过程，是打开创意边界的常用手段。",
        params: [
          { name: "text", kind: "文本", default: "空", desc: "含通配符标记的提示词，运行时用词表随机替换标记；可用下拉按钮快速插入词库或 LoRA 标记。" },
          { name: "seed", kind: "整数", default: "0", desc: "随机填充用的种子，固定它可以让同一套词表组合稳定复现。" },
          { name: "multiline_mode", kind: "开关", default: "关", desc: "开启后逐行独立解析通配符，一行一个提示词变体，适合批量派生多组写法。" }
        ],
        tips: "词表每行一个词条；先用小词表验证流程，再扩充到大词表跑批量。"
      },
      {
        name: "Easy preSampling", cat: "sampler",
        brief: "把步数 CFG 采样器等采样计划配置进管线。",
        desc: "预采样节点负责配置采样参数：步数、CFG、采样器、调度器、去噪强度等都在这里设定，同时生成或接收初始潜空间。它本身不执行采样，只是把完整的采样计划打包进管线，交给下游的采样节点执行。上游通常是 Easy Full Loader，还可以接入图像直接转为初始潜空间做图生图。",
        inputs: [
          { name: "pipe", type: "PIPE_LINE", from: "典型上游：Easy Full Loader", desc: "载入模型与条件的管线对象" },
          { name: "image_to_latent", type: "IMAGE", from: "可选，加载或生成的图像", desc: "接入后按图生图方式生成初始潜空间" }
        ],
        outputs: [
          { type: "PIPE_LINE", to: "典型下游：Easy KSampler", desc: "附带采样计划与初始潜空间的管线" }
        ],
        why: "把参数配置与执行拆开，是 Easy 流程清晰的关键。同一套模型条件可以搭配不同采样计划反复实验，而不用重接线路。",
        params: [
          { name: "steps", kind: "整数", default: "20", desc: "去噪总步数，20 到 35 常用。" },
          { name: "cfg", kind: "浮点数", default: "8.0", desc: "提示词服从度，SD1.5 用 6 到 8，SDXL 用 4 到 7。" },
          { name: "sampler_name", kind: "下拉选择", default: "euler", desc: "去噪算法，euler 朴素稳定，dpmpp_2m 搭配 karras 细节更好。" },
          { name: "scheduler", kind: "下拉选择", default: "normal", desc: "步数调度方式，还包含 karras、sgm_uniform 等扩展调度器。" },
          { name: "denoise", kind: "浮点数", default: "1.0", desc: "去噪强度，1 为文生图；接 image_to_latent 做图生图时用 0.6 到 0.8 探索。" },
          { name: "seed", kind: "整数", default: "0", desc: "初始潜空间的随机种子，写入管线交给下游采样器使用。" }
        ],
        tips: "去噪强度决定图生图时保留原图多少内容，先用 0.6 到 0.8 之间探索。"
      },
      {
        name: "Easy preSamplingAdvanced", cat: "sampler",
        brief: "在预采样基础上开放种子与噪声生成等高级控制。",
        desc: "这是预采样节点的高级版本，额外开放种子、噪声生成方式、剩余噪声返回等控制项，把随机性也纳入管线统一管理。其中噪声模式可以模拟 A1111 的行为，方便迁移用户对齐老习惯的出图结果。其余用法与 Easy preSampling 一致，配置完成后交给 Easy KSampler 执行。",
        inputs: [
          { name: "pipe", type: "PIPE_LINE", from: "典型上游：Easy Full Loader 或 LoRA 节点", desc: "上游管线对象" }
        ],
        outputs: [
          { type: "PIPE_LINE", to: "典型下游：Easy KSampler", desc: "附带完整采样计划的管线" }
        ],
        why: "批量实验最怕随机因素不受控。高级预采样把种子与噪声策略写进管线，多组对比才真正公平。",
        params: [
          { name: "seed", kind: "整数", default: "0", desc: "随机种子，写入管线统一管理；固定种子后只改提示词是标准的对照做法。" },
          { name: "add_noise", kind: "下拉选择", default: "enable (CPU)", desc: "噪声注入方式，模拟 A1111 出图习惯时选 GPU 档。",
            options: [["enable (CPU)", "处理器生成噪声，默认行为"], ["enable (GPU=A1111)", "显卡生成噪声，与 A1111 行为一致，便于对齐旧结果"], ["disable", "不注入新噪声，用于接力采样"]] },
          { name: "steps", kind: "整数", default: "20", desc: "采样总步数，分段时用起止步数划分。" },
          { name: "cfg", kind: "浮点数", default: "8.0", desc: "提示词服从度，含义与标准采样器一致。" },
          { name: "sampler_name", kind: "下拉选择", default: "euler", desc: "去噪算法，分段接力时前后段保持一致最稳。" },
          { name: "start_at_step", kind: "整数", default: "0", desc: "本段起始步，0 表示从头开始。" },
          { name: "end_at_step", kind: "整数", default: "10000", desc: "本段结束步，填 10000 表示跑到总步数结束。" },
          { name: "return_with_leftover_noise", kind: "下拉选择", default: "disable", desc: "是否带着剩余噪声输出本段结果，分阶段接力时开启。",
            options: [["disable", "强制收尾去噪，单段使用"], ["enable", "保留剩余噪声，交给下一段继续"]] }
        ],
        tips: "固定种子后只改提示词，是验证提示词改动的标准做法。"
      },
      {
        name: "Easy KSampler", cat: "sampler",
        brief: "执行管线采样并按设定方式预览或保存成图。",
        desc: "这是 Easy 管线的执行者：接收配置好的管线对象，实际运行采样，输出图像并继续传递管线。节点内置输出方式选项，默认预览，也可以选择保存、发送等，预览加挑选的模式还能在多张候选中人工选图。参数大多来自上游预采样节点，这里保持简洁，适合作为流程的固定执行端。",
        inputs: [
          { name: "pipe", type: "PIPE_LINE", from: "典型上游：Easy preSampling", desc: "包含模型条件与采样计划的管线" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：保存、放大或对比节点", desc: "采样得到的图像" },
          { type: "PIPE_LINE", to: "典型下游：精修或后处理节点", desc: "继续传递的管线对象" }
        ],
        why: "它把标准流程里采样与解码等步骤合并为一步，并在输出方式上给了灵活选择，让简单工作流真正简单。",
        params: [
          { name: "image_output", kind: "下拉选择", default: "Preview", desc: "成图的处理方式，决定结果去哪里。",
            options: [["Preview", "仅在画布预览，日常调参首选"], ["Save", "自动保存到输出目录"], ["Hide&Save", "保存但不重复预览"], ["Sender", "发送给同包的 Receiver 类节点，跨分支出图"], ["None", "不输出图像，只要管线"]] },
          { name: "save_prefix", kind: "文本", default: "ComfyUI", desc: "保存时的文件名前缀，建议改成模型或项目关键词便于归档。" },
          { name: "steps", kind: "整数", default: "20", desc: "覆盖管线里的步数设置，与上游预采样节点保持一致即可。" },
          { name: "denoise", kind: "浮点数", default: "1.0", desc: "覆盖管线里的去噪强度，文生图保持 1。" }
        ],
        tips: "日常用预览即可，需要归档时再切换为保存，省去多余的保存节点。"
      },
      {
        name: "Easy DetailerFix", cat: "image",
        brief: "面向管线的细节修复节点，二次重绘增强质感。",
        desc: "它的思路与高清修复类似：把图像放大后用较低的去噪强度重新采样，在保留构图的同时补足细节，再缩回目标尺寸。节点直接在 Easy 管线里工作，读取管线中的成图与模型条件，完成后把结果写回管线继续传递。放在 Easy KSampler 之后即插即用，是 Easy 流水线的标配精修环节。",
        inputs: [
          { name: "pipe", type: "PIPE_LINE", from: "典型上游：Easy KSampler", desc: "包含成图与模型条件的管线" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：保存或对比节点", desc: "精修后的图像" },
          { type: "PIPE_LINE", to: "典型下游：后续 Easy 节点", desc: "继续传递的管线" }
        ],
        why: "直接高倍放大常伴随塑料感或纹理重复，低强度重绘能在放大过程中引入合理细节，是提升完成度的标配步骤。",
        params: [
          { name: "image_output", kind: "下拉选择", default: "Preview", desc: "精修结果的处理方式，含义与 Easy KSampler 相同。",
            options: [["Preview", "仅在画布预览"], ["Save", "自动保存到输出目录"], ["Hide&Save", "保存但不重复预览"], ["Sender", "发送给 Receiver 类节点继续传递"]] },
          { name: "save_prefix", kind: "文本", default: "ComfyUI", desc: "保存时的文件名前缀，便于区分精修前后成图。" }
        ],
        tips: "重绘强度从较低值开始，过高会明显改变构图与人物特征。"
      },
      {
        name: "Easy Show Anything", cat: "util",
        brief: "把任意数据转成文本显示，简化流程的检视窗。",
        desc: "这个调试节点把上游传来的任何数据转换成文本显示出来，包括字符串、数值、张量、条件乃至图像的基本信息。它不改变数据，新版还提供输出接口可以把内容继续向后传递。在 Easy 流程里中间数据被管线对象包裹，用它可以直接查看管线内容或提示词处理结果。",
        inputs: [
          { name: "source", type: "*", from: "典型上游：任意数据或管线", desc: "任意类型输入" }
        ],
        outputs: [
          { type: "*", to: "典型下游：可选继续传递", desc: "新版本可以把内容继续传出" }
        ],
        why: "简化流程隐藏了大量细节，出错时更需要观察手段。Show Anything 就是简化管线上的检视窗口。",
        params: [],
        tips: "排查提示词问题时把它接到文本链路末端，立刻能看到实际送入编码的内容。"
      }
    ]
  });

  // ---------- 5. Efficiency Nodes ----------
  window.COMFY_DATA.nodePackages.push({
    id: "efficiency-nodes",
    name: "Efficiency Nodes",
    author: "TLS / jags111",
    official: false,
    category: "一体化采样与参数扫描",
    install: "在 ComfyUI-Manager 里搜索 Efficiency Nodes 一键安装",
    summary: "Efficiency Nodes 的设计目标是把工作流头部与采样环节压缩到极致，同时提供经典的 XY Plot 参数扫描。加载器与采样器互相回传数据，配合堆栈化的 LoRA 管理与 XY 输入系列节点，可以用极少的节点完成系统性的调参实验。它是老牌的一体化流程包，很多调参教程都基于它的 XY Plot。",
    why: "出图质量的一半在参数，而手动试参数既慢又容易遗漏。这套节点把加载、采样、扫描做成一个整体，让实验像查表一样简单。",
    tags: ["采样", "调参", "XY Plot"],
    nodes: [
      {
        name: "Efficient Loader", cat: "load",
        brief: "一站式加载模型提示词并生成初始潜空间。",
        desc: "这个加载器把 Checkpoint、VAE、内置 LoRA、CLIP 跳层、正负提示词、分辨率与批量数集中在一个节点，一次性输出模型、编码器、正负条件与初始潜空间。它还能接收 LoRA Stacker 的堆栈输入，把多 LoRA 配方合并进来。设计目标是让一个节点撑起工作流的整个头部，减少重复连线。",
        inputs: [
          { name: "lora_stack", type: "LORA_STACK", from: "可选，LoRA Stacker", desc: "外部 LoRA 配方堆栈" }
        ],
        outputs: [
          { type: "MODEL", to: "典型下游：采样器", desc: "加载完成的模型" },
          { type: "CLIP", to: "典型下游：条件编码", desc: "文本编码器" },
          { type: "VAE", to: "典型下游：VAE 解码", desc: "潜空间解码器" },
          { type: "CONDITIONING", to: "典型下游：采样器正面输入", desc: "正面条件" },
          { type: "CONDITIONING", to: "典型下游：采样器负面输入", desc: "负面条件" },
          { type: "LATENT", to: "典型下游：采样器", desc: "按设定分辨率生成的初始潜空间" }
        ],
        why: "标准流程的头部要五六个节点才能凑齐采样所需的全部输入。一体化加载器在保证能力的同时大幅压缩画布，也让参数扫描可以覆盖全流程。",
        params: [
          { name: "ckpt_name", kind: "下拉选择", default: "第一个底模文件", desc: "底模文件，选项来自 models 的 checkpoints 目录。" },
          { name: "vae_name", kind: "下拉选择", default: "Baked VAE", desc: "指定 VAE，Baked VAE 表示用底模内置解码器，色彩发灰时再换独立 VAE。",
            options: [["Baked VAE", "使用底模内置 VAE"], ["外部 vae 文件", "models 的 vae 目录里的独立 VAE"]] },
          { name: "clip_skip", kind: "整数", default: "-1", desc: "CLIP 跳层，-1 为不跳层，动漫模型常用 -2。" },
          { name: "lora_name", kind: "下拉选择", default: "None", desc: "内置单枚 LoRA，None 表示不挂；多枚 LoRA 用 lora_stack 输入接 LoRA Stacker。",
            options: [["None", "不加载内置 LoRA"]] },
          { name: "positive", kind: "文本", default: "CLIP_POSITIVE", desc: "正面提示词，直接在加载器里完成编码。" },
          { name: "negative", kind: "文本", default: "CLIP_NEGATIVE", desc: "负面提示词，与正面提示词一起编码后输出。" },
          { name: "empty_latent_width", kind: "整数", default: "512", desc: "初始潜空间宽度（像素），取 64 的倍数，SDXL 建议 1024 起。" },
          { name: "batch_size", kind: "整数", default: "1", desc: "批量张数，XY Plot 扫描时交给纵轴张数控制，这里保持 1。" }
        ],
        tips: "分辨率选项内置了常见模型的标准出图尺寸，不确定该用多大时先从预设里选。"
      },
      {
        name: "KSampler (Efficient)", cat: "sampler",
        brief: "采样并把全部上下文回传，集成多种出图方式。",
        desc: "高效采样器在完成采样的同时，把模型、编码器、正负条件原样回传，下游节点不必再从加载器重新拉线，这正是 XY Plot 能串联全流程的关键。它内置丰富的输出方式：预览、保存、发送等，还能在生成后自动清理显存。一个节点覆盖采样、解码与存图三件事。",
        inputs: [
          { name: "model", type: "MODEL", from: "典型上游：Efficient Loader", desc: "采样用模型" },
          { name: "positive", type: "CONDITIONING", from: "典型上游：Efficient Loader", desc: "正面条件" },
          { name: "negative", type: "CONDITIONING", from: "典型上游：Efficient Loader", desc: "负面条件" },
          { name: "latent_image", type: "LATENT", from: "典型上游：Efficient Loader", desc: "初始潜空间" }
        ],
        outputs: [
          { type: "MODEL", to: "典型下游：后续采样或精修", desc: "回传的模型" },
          { type: "CLIP", to: "典型下游：条件编码", desc: "回传的编码器" },
          { type: "VAE", to: "典型下游：VAE 解码", desc: "回传的解码器" },
          { type: "CONDITIONING", to: "典型下游：二次采样条件输入", desc: "回传的正面条件" },
          { type: "CONDITIONING", to: "典型下游：二次采样条件输入", desc: "回传的负面条件" },
          { type: "IMAGE", to: "典型下游：保存或对比", desc: "采样并解码后的图像" },
          { type: "LATENT", to: "典型下游：放大或二次采样", desc: "采样结果潜空间" }
        ],
        why: "回传上下文的设定让链式采样不再重复布线，配合输出方式选项，大幅减少了支撑性的杂节点。",
        params: [
          { name: "seed", kind: "整数", default: "0", desc: "随机种子，界面附带每次生成后的变化策略下拉；XY Plot 扫描时会接管它。" },
          { name: "steps", kind: "整数", default: "20", desc: "去噪总步数，20 到 35 常用。" },
          { name: "cfg", kind: "浮点数", default: "7.0", desc: "提示词服从度，SD1.5 用 6 到 8，SDXL 用 4 到 7。" },
          { name: "sampler_name", kind: "下拉选择", default: "euler", desc: "去噪算法，euler_ancestral 出图偏暖细节多，dpmpp_2m 加 karras 更稳。" },
          { name: "scheduler", kind: "下拉选择", default: "normal", desc: "步数调度方式，karras 是社区高频选择。" },
          { name: "denoise", kind: "浮点数", default: "1.0", desc: "去噪强度，1 为完全重绘，接上游潜空间时按需降到 0.4 到 0.8。" },
          { name: "preview_method", kind: "下拉选择", default: "auto", desc: "采样过程中的实时预览方式，只影响显示不影响结果。",
            options: [["auto", "跟随 ComfyUI 全局设置"], ["latent2rgb", "快速粗略预览，最常用"], ["taesd", "高质量预览，需安装 taesd 模型"], ["none", "关闭中途预览"]] },
          { name: "vae_decode", kind: "下拉选择", default: "true", desc: "是否在本节点内解码成图像。",
            options: [["true", "正常解码出图"], ["true (tiled)", "分块解码，低显存跑大图"], ["false", "不解码，只输出潜空间"]] }
        ],
        tips: "面板里可以把采样器状态设为停用，临时跳过采样而不断线，方便只跑上游或下游部分。"
      },
      {
        name: "KSampler (Adv. Efficient)", cat: "sampler",
        brief: "高级版高效采样器，支持分段采样与噪声控制。",
        desc: "与基础版的区别在于开放了高级参数：噪声注入方式、起始步与结束步、剩余噪声返回等，可以把一次生成拆成多阶段接力。其余特性与 KSampler (Efficient) 相同，包括上下文回传与输出方式管理。做放大重绘、细化接力或分阶段实验时选它。",
        inputs: [
          { name: "model", type: "MODEL", from: "典型上游：模型链路", desc: "采样用模型" },
          { name: "positive", type: "CONDITIONING", from: "典型上游：条件链路", desc: "正面条件" },
          { name: "negative", type: "CONDITIONING", from: "典型上游：条件链路", desc: "负面条件" },
          { name: "latent_image", type: "LATENT", from: "典型上游：上游潜空间", desc: "接续采样的起点" }
        ],
        outputs: [
          { type: "MODEL", to: "典型下游：后续采样", desc: "回传的模型" },
          { type: "CLIP", to: "典型下游：条件编码", desc: "回传的编码器" },
          { type: "VAE", to: "典型下游：VAE 解码", desc: "回传的解码器" },
          { type: "CONDITIONING", to: "典型下游：二次采样条件输入", desc: "回传的正面条件" },
          { type: "CONDITIONING", to: "典型下游：二次采样条件输入", desc: "回传的负面条件" },
          { type: "IMAGE", to: "典型下游：保存或对比", desc: "采样并解码后的图像" },
          { type: "LATENT", to: "典型下游：放大或二次采样", desc: "采样结果潜空间" }
        ],
        why: "分阶段生成离不开起止步数与噪声的精细控制。高级版把这些参数纳入高效体系，接力流程也能享受回传与一体化输出。",
        params: [
          { name: "add_noise", kind: "开关", default: "enable", desc: "是否在起点注入新噪声；接力采样第二段通常关闭。" },
          { name: "noise_seed", kind: "整数", default: "0", desc: "噪声种子，仅 add_noise 开启时生效。" },
          { name: "steps", kind: "整数", default: "20", desc: "总步数，起止步数都基于这个总数换算。" },
          { name: "cfg", kind: "浮点数", default: "7.0", desc: "提示词服从度，含义与基础版一致。" },
          { name: "sampler_name", kind: "下拉选择", default: "euler", desc: "去噪算法，分段时前后段保持同一种。" },
          { name: "start_at_step", kind: "整数", default: "0", desc: "本段起始步，第二段填第一段的结束步。" },
          { name: "end_at_step", kind: "整数", default: "10000", desc: "本段结束步，高清修复第一段常填 15 左右。" },
          { name: "return_with_leftover_noise", kind: "开关", default: "disable", desc: "开启后到达结束步保留剩余噪声直接输出，分段接力必须开启；单段保持关闭。" }
        ],
        tips: "分段时把第二段的起始步设为第一段的结束步，进度语义连续，调参记录也好整理。"
      },
      {
        name: "LoRA Stacker", cat: "model",
        brief: "把多个 LoRA 与权重打包成可连线的配方堆栈。",
        desc: "堆栈（Stack）是效率节点的核心概念之一：把一串 LoRA 名称与强度整理成一个可连线的列表对象。节点支持简单与高级两种模式，高级模式可以逐条指定文本侧权重等细节。多个堆栈节点串联即可叠加更多 LoRA，最后交给 Apply LoRA Stacker 或加载器统一应用。",
        inputs: [
          { name: "lora_stack", type: "LORA_STACK", from: "可选，另一个 LoRA Stacker", desc: "叠加到前面的既有堆栈" }
        ],
        outputs: [
          { type: "LORA_STACK", to: "典型下游：Apply LoRA Stacker 或 Efficient Loader", desc: "打包完成的 LoRA 堆栈" }
        ],
        why: "把 LoRA 配方做成一条可插拔的堆栈线，意味着同一套配方可以喂给多个流程分支，或者整体替换成另一套配方。",
        params: [
          { name: "input_mode", kind: "下拉选择", default: "simple", desc: "配置模式，决定每条 LoRA 有几个强度滑杆。",
            options: [["simple", "每条只有一个总强度"], ["advanced", "每条分开设置模型侧与文本侧强度"]] },
          { name: "lora_count", kind: "整数", default: "3", desc: "显示的 LoRA 行数，0 到 50，节点面板按此数量展开条目。" },
          { name: "lora_name_1", kind: "下拉选择", default: "None", desc: "第 1 条的 LoRA 文件，None 表示该行跳过；后续行名为 lora_name_2 以此类推。",
            options: [["None", "该行不加载"]] },
          { name: "lora_wt_1", kind: "浮点数", default: "1.0", desc: "第 1 条的总强度（simple 模式），0.6 到 0.8 适合混搭。" },
          { name: "model_str_1", kind: "浮点数", default: "1.0", desc: "第 1 条的模型侧强度（advanced 模式），与 clip_str_1 配合分开控制。" }
        ],
        tips: "为常用药方各保存一个堆栈节点，配合切换节点就能在配方之间整体切换。"
      },
      {
        name: "Apply LoRA Stacker", cat: "model",
        brief: "把堆栈里的 LoRA 配方实际应用到模型上。",
        desc: "堆栈只是数据，真正把列表里的 LoRA 逐个加载到模型上的是这个节点。它接收模型、编码器与堆栈，输出应用后的结果。配方与应用分离的设计意味着同一份配方可以应用于多个不同模型，或在应用前再做确认。",
        inputs: [
          { name: "model", type: "MODEL", from: "典型上游：Checkpoint 加载器", desc: "待应用 LoRA 的模型" },
          { name: "clip", type: "CLIP", from: "典型上游：同一加载器", desc: "待应用文本权重的编码器" },
          { name: "lora_stack", type: "LORA_STACK", from: "可选，LoRA Stacker", desc: "要应用的配方堆栈" }
        ],
        outputs: [
          { type: "MODEL", to: "典型下游：采样器", desc: "应用堆栈后的模型" },
          { type: "CLIP", to: "典型下游：条件编码", desc: "应用文本权重后的编码器" }
        ],
        why: "配方与应用分离后，测试新模型与测试新配方变成两个独立维度，组合实验的空间一下子打开。",
        params: [],
        tips: "堆栈为空时等于不应用任何 LoRA，可以用这一点做有与无的对照实验。"
      },
      {
        name: "XY Plot", cat: "sampler",
        brief: "自动执行参数网格扫描并拼出一张对比大图。",
        desc: "XY Plot 是这个包的灵魂：定义好横轴与纵轴的参数序列后，它会为网格中每个组合自动执行一次采样，最后把所有结果拼成一张标注参数的对比图。一次运行就能看完几十组参数的效果，是查找最佳步数、CFG、采样器组合的经典工具。它需要与 XY Input 系列节点和高效采样器配合使用。",
        inputs: [
          { name: "model", type: "MODEL", from: "典型上游：Efficient Loader 或采样器回传", desc: "扫描用模型" },
          { name: "positive", type: "CONDITIONING", from: "典型上游：同上", desc: "正面条件" },
          { name: "negative", type: "CONDITIONING", from: "典型上游：同上", desc: "负面条件" },
          { name: "latent_image", type: "LATENT", from: "典型上游：同上", desc: "初始潜空间" },
          { name: "X", type: "XY", from: "可选，XY Input 系列节点", desc: "横轴参数序列" },
          { name: "Y", type: "XY", from: "可选，XY Input 系列节点", desc: "纵轴参数序列" }
        ],
        outputs: [],
        why: "调参靠感觉是低效的。XY Plot 把穷举实验自动化，产出一张信息密度极高的对比图，让参数选择变成看图说话。",
        params: [
          { name: "grid_spacing", kind: "整数", default: "0", desc: "对比大图中小图之间的间隔像素，0 到 500，方便后期裁切或标注。" },
          { name: "XY_flip", kind: "下拉选择", default: "False", desc: "是否交换横纵轴，网格太宽时翻转成竖版更好看。",
            options: [["False", "按 X 轴在横、Y 轴在纵排布"], ["True", "横纵互换"]] },
          { name: "Y_label_orientation", kind: "下拉选择", default: "Horizontal", desc: "纵轴参数标签的排版方向。",
            options: [["Horizontal", "横排标签，读起来快"], ["Vertical", "竖排标签，节省横向空间"]] },
          { name: "cache_models", kind: "下拉选择", default: "True", desc: "扫描中是否缓存模型与 VAE，开启能大幅提速，显存吃紧时关掉。",
            options: [["True", "缓存模型，切换快、占显存"], ["False", "不缓存，更省显存但更慢"]] },
          { name: "ksampler_output_image", kind: "下拉选择", default: "Images", desc: "每个格子输出的内容。",
            options: [["Images", "输出每组的图像，拼成对比大图"], ["Plot", "只输出整张拼图，省去多余预览"]] }
        ],
        tips: "第一次扫描建议只开单轴、小张数，确认趋势后再上双轴网格，控制总张数。"
      },
      {
        name: "XY Input: Steps", cat: "util",
        brief: "生成步数序列，供 XY Plot 做横轴或纵轴扫描。",
        desc: "该节点定义一条从起始值到结束值的步数（Steps）序列，作为 XY Plot 的一个坐标轴。面板可以控制取值个数与范围，节点状态开关可以临时停用该轴。输出一个 XY 类型的参数序列，直接连到 XY Plot 的对应输入。",
        inputs: [],
        outputs: [
          { type: "XY", to: "典型下游：XY Plot 的 X 或 Y 输入", desc: "步数参数序列" }
        ],
        why: "步数决定细节积累程度，是最常被扫描的参数之一。用序列节点定义扫描范围，比手改几十次步数高效得多。",
        params: [
          { name: "target_parameter", kind: "下拉选择", default: "steps", desc: "这条轴扫描哪个参数，一个节点只扫一种。",
            options: [["steps", "扫描总步数"], ["start_at_step", "扫描起始步"], ["end_at_step", "扫描结束步"], ["refine_at_step", "扫描精修分界步"]] },
          { name: "batch_count", kind: "整数", default: "3", desc: "这条轴取多少个值，值会从起点到终点均匀生成。" },
          { name: "first_step", kind: "整数", default: "10", desc: "序列起点（steps 模式下），扫描低步数从 10 起比较典型。" },
          { name: "last_step", kind: "整数", default: "20", desc: "序列终点（steps 模式下），10 到 30 基本覆盖常用区间。" }
        ],
        tips: "步数扫描从 10 到 30 基本覆盖常用区间，超过 40 往往收益有限。"
      },
      {
        name: "XY Input: Prompt S/R", cat: "util",
        brief: "按查找替换生成多组提示词变体参与扫描。",
        desc: "提示词查找替换（Prompt S/R）是提示词扫描的经典方式：指定一段要查找的文字与若干替换项，节点为每个替换项生成一条变体。把结果接到 XY Plot，就能一次看到不同触发词、风格词或权重写法对画面的影响。它让提示词实验从逐次手改变成一张网格图。",
        inputs: [],
        outputs: [
          { type: "XY", to: "典型下游：XY Plot", desc: "提示词变体序列" }
        ],
        why: "提示词是最灵活也最难量化的变量。查找替换机制把多个候选词纳入同一次批量运行，对比起来非常直观。",
        params: [
          { name: "target_prompt", kind: "下拉选择", default: "positive", desc: "对哪一侧提示词做替换。",
            options: [["positive", "扫描正面提示词变体"], ["negative", "扫描负面提示词变体"]] },
          { name: "search_txt", kind: "文本", default: "空", desc: "要查找的文字片段，每个变体就是把提示词里这段文字换掉后的结果，留空则不生效。" },
          { name: "replace_count", kind: "整数", default: "3", desc: "替换变体的数量，决定这条轴上多几个格子。" },
          { name: "replace_1", kind: "文本", default: "空", desc: "第 1 个替换内容；后续为 replace_2、replace_3 等，留空可得到去掉该词的对照样本。" }
        ],
        tips: "想对比某个词的有无，把替换项留空即可得到无该词的对照样本。"
      }
    ]
  });
})();
