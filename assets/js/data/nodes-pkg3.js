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
    summary: "WAS Node Suite 是一个功能极其庞杂的万能工具箱，两百余个节点覆盖图像处理、滤镜纹理、遮罩操作、文本与数值工具、AI 分割与深度估计、批量读写、逻辑切换、缓存总线乃至动画视频导出等方方面面，本页按功能分组全量收录全部官方节点。单个节点未必最强，但胜在覆盖面广、行为稳定，许多经典工作流都建立在它之上。作者已在 2023 年底宣布项目退休，社区维护版仍在广泛使用，遇到基础功能缺件时先来这里翻一翻往往有惊喜。",
    why: "搭工作流时经常缺一个小工具：改段文字、算个数字、调个尺寸、裁个区域。WAS 把这些边角功能一次配齐，避免为一个小功能引入整套节点包；全部节点按功能分组收录，需要什么按图索骥即可。",
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
      },
      {
        name: "Image Load", cat: "load",
        brief: "按路径读图，支持本地文件与网络地址。",
        desc: "通过文本路径读取图像，路径以 http 开头时自动下载网络图片，路径加载失败时会提示并回退为黑图。alpha 通道拆成 MASK 输出，文件名也以文本形式输出供下游使用。没有文件选择弹窗，路径固定后每次执行都读同一张图，适合自动化与批量流程。",
        inputs: [],
        outputs: [
          { type: "IMAGE", to: "典型下游：图像处理或编码节点", desc: "读取到的图像" },
          { type: "MASK", to: "典型下游：遮罩类节点", desc: "图像自带的 alpha 通道转成的遮罩" },
          { type: "STRING", to: "典型下游：保存命名或文本处理", desc: "文件名文本" }
        ],
        why: "批量与自动化流程需要一个不弹窗、路径可控的读图入口，它还顺带解决了带透明通道图像的遮罩拆分。",
        params: [
          { name: "image_path", kind: "文本", default: "./ComfyUI/input/example.png", desc: "图像路径，支持本地相对或绝对路径，也支持 http 开头的网络地址。" },
          { name: "RGBA", kind: "下拉选择", default: "false", desc: "是否保留 alpha 通道，开启后从 MASK 输出透明信息。" },
          { name: "filename_text_extension", kind: "下拉选择", default: "true", desc: "文件名文本是否带扩展名。" }
        ],
        tips: ""
      },
      {
        name: "Load Image Batch", cat: "load",
        brief: "每次执行读取目录中的一张图像并可自动推进。",
        desc: "按目录加通配符扫描图像文件，单张、递增、随机三种模式决定每次执行取哪一张。递增模式把整个目录变成队列逐张处理，中断后可以从索引继续，随机模式适合抽图做实验。输出图像与文件名文本。",
        inputs: [],
        outputs: [
          { type: "IMAGE", to: "典型下游：图生图编码或图像处理", desc: "当前读取的图像" },
          { type: "STRING", to: "典型下游：保存命名或日志", desc: "当前图像的文件名" }
        ],
        why: "它让 ComfyUI 具备了把图集当队列消费的能力，是批量重绘与批量放大流程的经典入口。",
        params: [
          { name: "mode", kind: "下拉选择", default: "single_image", desc: "single_image 固定读一张，incremental_image 每次执行推进一张，random 随机取一张。" },
          { name: "path", kind: "文本", default: "./ComfyUI/input/", desc: "图像目录路径，配合 pattern 筛选文件。" },
          { name: "pattern", kind: "文本", default: "*", desc: "通配符匹配规则，例如 png 只取 png 文件。" },
          { name: "index", kind: "整数", default: "0", desc: "起始或指定的图像序号，递增模式下从这里推进。" },
          { name: "allow_RGBA_output", kind: "开关", default: "关", desc: "是否保留 alpha 通道输出。" }
        ],
        tips: ""
      },
      {
        name: "Image History Loader", cat: "load",
        brief: "从历史记录下拉载入 WAS 保存过的旧图。",
        desc: "WAS 的保存类节点会把输出路径写入历史数据库，本节点把这些历史图像整理成下拉选项。挑中即可把旧图重新接回工作流继续处理，找回几天前的满意结果不用翻文件夹。",
        inputs: [],
        outputs: [
          { type: "IMAGE", to: "典型下游：图像处理节点", desc: "选中的历史图像" },
          { type: "STRING", to: "典型下游：文本处理", desc: "历史图像的文件名" }
        ],
        why: "生成记录就是工作流的一部分资产，能直接回载旧图意味着任何一张旧图都能随时复用与再加工。",
        params: [
          { name: "image", kind: "下拉选择", default: "No History", desc: "历史图像列表，由 WAS 保存节点的记录自动填充。" }
        ],
        tips: ""
      },
      {
        name: "Checkpoint Loader (Simple)", cat: "load",
        brief: "精简底模加载器，额外输出模型文件名。",
        desc: "与内置 Checkpoint Loader 等价的底模加载节点，自动猜测配置加载并输出模型、编码器与解码器。比内置版多一个文件名文本输出，方便下游拼接提示词或按模型归档，老工作流里很常见。",
        inputs: [],
        outputs: [
          { type: "MODEL", to: "典型下游：采样器或 LoRA 链路", desc: "加载的模型" },
          { type: "CLIP", to: "典型下游：条件编码节点", desc: "文本编码器" },
          { type: "VAE", to: "典型下游：编码解码节点", desc: "潜空间编解码器" },
          { type: "STRING", to: "典型下游：文本处理", desc: "模型文件名文本" }
        ],
        why: "行为与内置一致但多了文件名输出，是从老教程迁移工作流时的兼容之选。",
        params: [
          { name: "ckpt_name", kind: "下拉选择", default: "第一个底模文件", desc: "底模文件，选项来自 models 的 checkpoints 目录。" }
        ],
        tips: ""
      },
      {
        name: "Checkpoint Loader", cat: "load",
        brief: "带配置文件选项的底模加载器。",
        desc: "在普通加载的基础上可以指定 configs 目录里的配置文件，用于需要显式配置的旧式检查点。输出模型、编码器、解码器与文件名文本，其余用法与 Checkpoint Loader (Simple) 相同。",
        inputs: [],
        outputs: [
          { type: "MODEL", to: "典型下游：采样器", desc: "加载的模型" },
          { type: "CLIP", to: "典型下游：条件编码节点", desc: "文本编码器" },
          { type: "VAE", to: "典型下游：编码解码节点", desc: "解码器" },
          { type: "STRING", to: "典型下游：文本处理", desc: "模型文件名文本" }
        ],
        why: "一些老模型必须配合指定配置文件才能正确加载，这个节点保留了这个传统选项。",
        params: [
          { name: "config_name", kind: "下拉选择", default: "第一个配置文件", desc: "configs 目录里的 yaml 配置，通常留默认即可。" },
          { name: "ckpt_name", kind: "下拉选择", default: "第一个底模文件", desc: "底模文件。" }
        ],
        tips: ""
      },
      {
        name: "unCLIP Checkpoint Loader", cat: "load",
        brief: "加载 unCLIP 底模并额外输出 CLIP Vision。",
        desc: "与普通加载器相同，但会额外加载检查点里附带的 CLIP Vision 权重并输出，供 unCLIP 图像变体、图像引导生成等流程使用。普通模型用它也没问题，只是多出一个可用的视觉编码输出。",
        inputs: [],
        outputs: [
          { type: "MODEL", to: "典型下游：采样器", desc: "加载的模型" },
          { type: "CLIP", to: "典型下游：条件编码节点", desc: "文本编码器" },
          { type: "VAE", to: "典型下游：编码解码节点", desc: "解码器" },
          { type: "CLIP_VISION", to: "典型下游：unCLIP 条件节点", desc: "视觉编码器" },
          { type: "STRING", to: "典型下游：文本处理", desc: "模型文件名文本" }
        ],
        why: "玩 unCLIP 图像变体需要独立的 CLIP Vision 输出，这个加载器省去了单独加载视觉模型的步骤。",
        params: [
          { name: "ckpt_name", kind: "下拉选择", default: "第一个底模文件", desc: "底模文件，unCLIP 架构的检查点会自带视觉编码权重。" }
        ],
        tips: ""
      },
      {
        name: "Lora Loader", cat: "model",
        brief: "单枚 LoRA 加载器，模型与文本侧强度分开调。",
        desc: "把一枚 LoRA 应用到模型与文本编码器上，两侧强度独立设置，输出应用后的结果与 LoRA 文件名文本。旧版界面里该节点名为 Load Lora，行为一致，是 WAS 体系里最常用的模型辅助节点之一。",
        inputs: [
          { name: "model", type: "MODEL", from: "典型上游：Checkpoint 加载器", desc: "基础模型" },
          { name: "clip", type: "CLIP", from: "典型上游：同一加载器", desc: "文本编码器" }
        ],
        outputs: [
          { type: "MODEL", to: "典型下游：采样器", desc: "应用 LoRA 后的模型" },
          { type: "CLIP", to: "典型下游：条件编码节点", desc: "应用文本侧权重后的编码器" },
          { type: "STRING", to: "典型下游：文本处理", desc: "LoRA 文件名文本" }
        ],
        why: "单枚加载器串联虽然朴素，但输出文件名文本的特性让它能参与自动化命名与记录。",
        params: [
          { name: "lora_name", kind: "下拉选择", default: "第一个 LoRA 文件", desc: "LoRA 文件，选项来自 models 的 lora 目录。" },
          { name: "strength_model", kind: "浮点数", default: "1.0", desc: "模型侧强度，混搭时 0.6 到 0.8 更稳。" },
          { name: "strength_clip", kind: "浮点数", default: "1.0", desc: "文本侧强度，通常与模型侧同值。" }
        ],
        tips: ""
      },
      {
        name: "Upscale Model Loader", cat: "load",
        brief: "加载超分放大模型供图像放大使用。",
        desc: "从 models 的 upscale_models 目录加载 ESRGAN、SwinIR 等放大模型，输出 UPSCALE_MODEL 连线给放大节点使用，同时输出模型名文本。与 WAS 的 Image Resize 搭配，可以在缩放前先做一次模型超分。",
        inputs: [],
        outputs: [
          { type: "UPSCALE_MODEL", to: "典型下游：放大节点或 Image Resize", desc: "超分模型" },
          { type: "STRING", to: "典型下游：文本处理", desc: "模型名文本" }
        ],
        why: "模型超分比纯插值放大保留更多细节，把模型加载与使用拆开后，同一模型可以喂给多条支路。",
        params: [
          { name: "model_name", kind: "下拉选择", default: "第一个放大模型", desc: "放大模型文件，选项来自 upscale_models 目录。" }
        ],
        tips: ""
      },
      {
        name: "CLIPSeg Model Loader", cat: "load",
        brief: "预加载 CLIPSeg 分割模型供遮罩节点复用。",
        desc: "按模型标识加载 CLIPSeg 语义分割模型并输出 CLIPSEG_MODEL。接到 CLIPSeg Masking 的可选输入后，多次执行不再重复加载，批量分割场景能省不少时间。",
        inputs: [],
        outputs: [
          { type: "CLIPSEG_MODEL", to: "典型下游：CLIPSeg Masking", desc: "分割模型对象" }
        ],
        why: "分割模型加载开销不小，与使用节点拆开后，一个模型可以服务多条分割支路。",
        params: [
          { name: "model", kind: "文本", default: "CIDAS/clipseg-rd64-refined", desc: "Hugging Face 模型标识，首次使用自动下载。" }
        ],
        tips: ""
      },
      {
        name: "MiDaS Model Loader", cat: "load",
        brief: "预加载 MiDaS 深度估计模型。",
        desc: "加载 MiDaS 单目深度估计模型并输出 MIDAS_MODEL，供深度近似节点复用。DPT_Large 精度更高，DPT_Hybrid 更快更省显存，按需取舍。",
        inputs: [],
        outputs: [
          { type: "MIDAS_MODEL", to: "典型下游：深度估计节点", desc: "深度模型对象" }
        ],
        why: "深度估计模型体积不小，独立加载一次全流程复用是最经济的用法。",
        params: [
          { name: "midas_model", kind: "下拉选择", default: "DPT_Large", desc: "模型规格，Large 精度高、Hybrid 速度快。" }
        ],
        tips: ""
      },
      {
        name: "SAM Model Loader", cat: "load",
        brief: "加载 Segment Anything 分割模型。",
        desc: "加载 Meta 的 SAM 图像分割模型，三种规格按显存与精度取舍，输出 SAM_MODEL 给 SAM Image Mask 使用，首次运行自动下载权重。",
        inputs: [],
        outputs: [
          { type: "SAM_MODEL", to: "典型下游：SAM Image Mask", desc: "分割模型对象" }
        ],
        why: "SAM 是点选式分割的精度天花板，预加载它才能让点提示分割流程跑得顺畅。",
        params: [
          { name: "model_size", kind: "下拉选择", default: "ViT-H", desc: "模型规格，ViT-H 效果最好也最吃显存，ViT-B 轻量。" }
        ],
        tips: ""
      },
      {
        name: "BLIP Model Loader", cat: "load",
        brief: "加载 BLIP 图像描述模型。",
        desc: "下载并加载 BLIP 图注模型与可选的视觉问答模型，输出 BLIP_MODEL 给 BLIP Analyze Image 使用。模型标识按 Hugging Face 仓库填写，默认为大号图注模型。",
        inputs: [],
        outputs: [
          { type: "BLIP_MODEL", to: "典型下游：BLIP Analyze Image", desc: "图注模型对象" }
        ],
        why: "自动打标、反推提示词流程都需要它先把模型准备好。",
        params: [
          { name: "blip_model", kind: "文本", default: "Salesforce/blip-image-captioning-large", desc: "图注模型的 Hugging Face 仓库标识。" },
          { name: "vqa_model_id", kind: "文本", default: "空", desc: "可选的视觉问答模型标识，配合 interrogate 模式提问用。" },
          { name: "device", kind: "下拉选择", default: "cuda", desc: "运行设备，显存不足时可改 cpu。" }
        ],
        tips: ""
      },
      {
        name: "Diffusers Model Loader", cat: "load",
        brief: "加载 diffusers 目录格式的模型。",
        desc: "扫描 models 的 diffusers 目录，把以 Hugging Face 文件夹结构存放的模型加载为模型、编码器与解码器三件套。适合直接使用从官方仓库下载的模型文件夹。",
        inputs: [],
        outputs: [
          { type: "MODEL", to: "典型下游：采样器", desc: "加载的模型" },
          { type: "CLIP", to: "典型下游：条件编码节点", desc: "文本编码器" },
          { type: "VAE", to: "典型下游：编码解码节点", desc: "解码器" },
          { type: "STRING", to: "典型下游：文本处理", desc: "模型路径文本" }
        ],
        why: "diffusers 是社区模型分发的主流格式之一，这个加载器让这类模型无需转换即可入流程。",
        params: [
          { name: "model_path", kind: "下拉选择", default: "第一个 diffusers 模型", desc: "diffusers 目录下的模型文件夹。" }
        ],
        tips: ""
      },
      {
        name: "Diffusers Hub Model Down-Loader", cat: "load",
        brief: "从 Hugging Face 仓库下载并加载 diffusers 模型。",
        desc: "按仓库标识直接从 Hugging Face 拉取 diffusers 模型到本地并加载输出，revision 可指定版本分支。首次执行需要联网下载，之后走本地缓存。",
        inputs: [],
        outputs: [
          { type: "MODEL", to: "典型下游：采样器", desc: "下载并加载的模型" },
          { type: "CLIP", to: "典型下游：条件编码节点", desc: "文本编码器" },
          { type: "VAE", to: "典型下游：编码解码节点", desc: "解码器" },
          { type: "STRING", to: "典型下游：文本处理", desc: "仓库标识文本" }
        ],
        why: "省去手动下载整理模型文件夹的环节，把模型来源写进工作流本身，换机器也容易复现。",
        params: [
          { name: "repo_id", kind: "文本", default: "空", desc: "Hugging Face 仓库标识，例如用户名加模型名。" },
          { name: "revision", kind: "文本", default: "None", desc: "版本分支或提交号，None 表示默认最新版。" }
        ],
        tips: ""
      },
      {
        name: "Image Blank", cat: "image",
        brief: "生成指定尺寸与颜色的纯色底图。",
        desc: "按宽高与 RGB 数值生成一张纯色图像，宽高会自动取整到 8 的倍数以对齐潜空间。常用作拼接底板、遮罩底图或占位输入，让某些只有下游没有上游的试验流程能跑起来。",
        inputs: [],
        outputs: [
          { type: "IMAGE", to: "典型下游：合成、裁剪或编码节点", desc: "纯色底图" }
        ],
        why: "流程调试经常缺一张可控的底图，纯色图既是画布也是参照物。",
        params: [
          { name: "width", kind: "整数", default: "512", desc: "宽度（像素），自动取 8 的倍数。" },
          { name: "height", kind: "整数", default: "512", desc: "高度（像素），自动取 8 的倍数。" },
          { name: "red", kind: "整数", default: "255", desc: "红色分量，0 到 255。" },
          { name: "green", kind: "整数", default: "255", desc: "绿色分量，0 到 255。" },
          { name: "blue", kind: "整数", default: "255", desc: "蓝色分量，0 到 255。" }
        ],
        tips: ""
      },
      {
        name: "Image Generate Gradient", cat: "image",
        brief: "按多段色标生成线性渐变图。",
        desc: "依据多段颜色停靠点生成水平或垂直渐变，色标写成 位置:红,绿,蓝 的格式，一行一段，例如 0:255,0,0 表示起点为纯红。做渐变背景、渐变映射的色带素材都很方便。",
        inputs: [],
        outputs: [
          { type: "IMAGE", to: "典型下游：Image Gradient Map 或直接使用", desc: "渐变图像" }
        ],
        why: "渐变是调色与背景制作的通用素材，用文本定义色标比手动画色带更精确也更容易复现。",
        params: [
          { name: "width", kind: "整数", default: "512", desc: "渐变图宽度（像素）。" },
          { name: "height", kind: "整数", default: "512", desc: "渐变图高度（像素）。" },
          { name: "direction", kind: "下拉选择", default: "horizontal", desc: "渐变方向，horizontal 水平、vertical 垂直。" },
          { name: "gradient_stops", kind: "文本", default: "0:255,0,0 等多行色标", desc: "色标列表，每行格式为 位置:R,G,B，位置用 0 到 100 的整数。" }
        ],
        tips: ""
      },
      {
        name: "Image Gradient Map", cat: "image",
        brief: "按亮度把图像映射到参考渐变色带。",
        desc: "读取图像的明暗结构，把暗部映射到渐变图左端、亮部映射到右端，相当于用任意渐变为图像重新上色。渐变条可由 Image Generate Gradient 或任意窄长图提供，是流行的电影感调色手法。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：生成或解码的图像", desc: "待上色的图像" },
          { name: "gradient_image", type: "IMAGE", from: "典型上游：Image Generate Gradient", desc: "作为色带的渐变图" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：保存或继续调色", desc: "按渐变重新上色的图像" }
        ],
        why: "换一条渐变就是换一套色调，比手动调色更整体也更可控，双色调海报就是这么做的。",
        params: [
          { name: "flip_left_right", kind: "开关", default: "关", desc: "是否水平翻转渐变映射方向，反向配色时勾选。" }
        ],
        tips: ""
      },
      {
        name: "Image Batch", cat: "image",
        brief: "把多路图像合并成一个批次。",
        desc: "把若干路图像按顺序合并为一个批次张量，接口是动态的，连几路算几路，理论上不限数量。所有输入图像尺寸必须一致，否则节点会报错指出是哪一路不匹配。聚合后可供批处理节点统一处理。",
        inputs: [
          { name: "images_a", type: "IMAGE", from: "典型上游：任意图像来源", desc: "第一路图像，继续连线自动追加后续输入" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：批处理型节点", desc: "合并后的图像批次" }
        ],
        why: "ComfyUI 的批量能力大多依赖批次数据，这个节点是把分散的多张图汇入流水线的集线器。",
        params: [],
        tips: ""
      },
      {
        name: "Create Grid Image", cat: "image",
        brief: "扫描目录拼出带边框的图像总览网格。",
        desc: "按目录与通配符扫描图像文件，自动缩放后拼成一张网格大图，列数、单元格上限与边框颜色可调。给图集生成一张总览供人工挑选，比翻文件夹快得多。",
        inputs: [],
        outputs: [
          { type: "IMAGE", to: "典型下游：预览或保存", desc: "拼好的网格总览图" }
        ],
        why: "批量出图之后的第一件事往往是挑选，网格总览把挑选成本从逐张打开降到一张图。",
        params: [
          { name: "images_path", kind: "文本", default: "./ComfyUI/input/", desc: "图像目录路径。" },
          { name: "pattern_glob", kind: "文本", default: "*", desc: "文件名通配符匹配规则。" },
          { name: "include_subfolders", kind: "开关", default: "关", desc: "是否递归包含子目录。" },
          { name: "number_of_columns", kind: "整数", default: "6", desc: "网格列数。" },
          { name: "max_cell_size", kind: "整数", default: "256", desc: "单格最长边的像素上限，控制总图大小。" },
          { name: "border_width", kind: "整数", default: "3", desc: "格子间边框宽度，配合边框颜色使用。" }
        ],
        tips: ""
      },
      {
        name: "Create Grid Image from Batch", cat: "image",
        brief: "把一个图像批次拼成网格总览。",
        desc: "与 Create Grid Image 相同，但输入直接来自图像批次而不是目录扫描，把一次生成的多张图拼成网格预览，调参对比特别直观。",
        inputs: [
          { name: "images", type: "IMAGE", from: "典型上游：批量生成或采样输出", desc: "图像批次" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：预览或保存", desc: "网格总览图" }
        ],
        why: "批次结果的对比预览不需要先落盘，一步拼图立刻可看。",
        params: [
          { name: "number_of_columns", kind: "整数", default: "6", desc: "网格列数。" },
          { name: "max_cell_size", kind: "整数", default: "256", desc: "单格最长边像素上限。" },
          { name: "border_width", kind: "整数", default: "3", desc: "边框宽度。" }
        ],
        tips: ""
      },
      {
        name: "Image Tiled", cat: "image",
        brief: "把单张图像切成均等小块批次。",
        desc: "按设定数量把图像均分成若干块，输出为批次。分块放大、分块重绘、分块修复等化整为零的处理流程都从它开始，处理完再用拼接或批次手段合回。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：加载或生成的图像", desc: "待切块的图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：批处理或放大节点", desc: "切出的图像块批次" }
        ],
        why: "大图整体处理容易爆显存或破坏整体性，切块再处理是低配机器跑高分辨率的经典策略。",
        params: [
          { name: "num_tiles", kind: "整数", default: "4", desc: "切出的总块数。" }
        ],
        tips: ""
      },
      {
        name: "Image Stitch", cat: "image",
        brief: "把两张图沿指定方向拼接成一张。",
        desc: "把 image_b 拼到 image_a 的上、下、左或右，交界处可做羽化过渡。拼接全景、制作上下对比长图时很有用。",
        inputs: [
          { name: "image_a", type: "IMAGE", from: "典型上游：主图", desc: "拼接基底" },
          { name: "image_b", type: "IMAGE", from: "典型上游：另一张图", desc: "拼接到边缘的第二张图" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：保存或继续处理", desc: "拼接结果" }
        ],
        why: "对比图与长图在展示与存档中很常用，流程内直接拼接省去外部软件操作。",
        params: [
          { name: "stitch", kind: "下拉选择", default: "top", desc: "拼接方向，top 为拼到上方，其余为左、下、右。" },
          { name: "feathering", kind: "整数", default: "0", desc: "交界处羽化像素数，让接缝柔和过渡。" }
        ],
        tips: ""
      },
      {
        name: "Image Blend by Mask", cat: "image",
        brief: "用遮罩控制第二张图只混入选区。",
        desc: "把 image_b 按遮罩范围混入 image_a，遮罩内显示上层、遮罩外保持底层，混合比例可调。局部换脸、局部贴图、局部调色都靠它落地，遮罩边缘先做羽化过渡会更自然。",
        inputs: [
          { name: "image_a", type: "IMAGE", from: "典型上游：底层图像", desc: "底层图像" },
          { name: "image_b", type: "IMAGE", from: "典型上游：上层图像", desc: "要混入的上层图像" },
          { name: "mask", type: "IMAGE", from: "典型上游：遮罩或分割结果", desc: "控制混合范围的遮罩" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：保存或继续处理", desc: "局部混合结果" }
        ],
        why: "有遮罩参与的混合是局部处理闭环的最后一环，没有它小图改得再好也贴不回去。",
        params: [
          { name: "blend_percentage", kind: "浮点数", default: "1.0", desc: "混合比例，1 为完全应用上层，0.5 左右是半融合。" }
        ],
        tips: ""
      },
      {
        name: "Image Blending Mode", cat: "image",
        brief: "全套 Photoshop 式混合模式的图层合成。",
        desc: "与 Image Blend 类似，但提供 color、color_burn、hard_light、hue 等完整的标准混合模式清单，混合在感知亮度空间进行，观感更接近专业修图软件。功能与 Image Blend 重叠，可视为同族工具的增强版。",
        inputs: [
          { name: "image_a", type: "IMAGE", from: "典型上游：底层图像", desc: "底层图像" },
          { name: "image_b", type: "IMAGE", from: "典型上游：叠加层", desc: "上层图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：预览或保存", desc: "按模式合成后的图像" }
        ],
        why: "标准混合模式语义明确，从修图经验直接迁移过来就能用，调色与光效合成的万金油。",
        params: [
          { name: "mode", kind: "下拉选择", default: "add", desc: "混合模式，含 multiply、screen、overlay、soft_light、difference、exclusion 等。" },
          { name: "blend_percentage", kind: "浮点数", default: "1.0", desc: "混合比例，0 为只显示底层，1 为完全应用模式。" }
        ],
        tips: ""
      },
      {
        name: "Image Displacement Warp", cat: "image",
        brief: "用置换图扭曲图像制作变形效果。",
        desc: "以另一张图的亮度为位移依据扭曲目标图像，亮处向一侧偏、暗处向另一侧偏，幅度可调。置换图可来自噪声、渐变或深度图，能做水波、热浪、旗帜飘动等效果。",
        inputs: [
          { name: "images", type: "IMAGE", from: "典型上游：待扭曲的图像", desc: "目标图像" },
          { name: "displacement_maps", type: "IMAGE", from: "典型上游：噪声或深度图", desc: "亮度即位移量的置换图" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：保存或继续处理", desc: "扭曲后的图像" }
        ],
        why: "置换扭曲是程序化变形的通用引擎，一张图控制千变万化的形变。",
        params: [
          { name: "amplitude", kind: "浮点数", default: "1.0", desc: "位移强度，越大变形越剧烈。" }
        ],
        tips: ""
      },
      {
        name: "Image Transpose", cat: "image",
        brief: "把叠加图按位置尺寸旋转贴到目标图上。",
        desc: "把 image_overlay 缩放到指定宽高、放到指定坐标、可带旋转角度，再以羽化边缘融入目标图，相当于流程内的自由图章。拼贴合成、贴水印、局部素材布置都用它。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：目标底图", desc: "底图" },
          { name: "image_overlay", type: "IMAGE", from: "典型上游：贴图素材", desc: "叠加图层" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：保存或继续合成", desc: "贴合后的图像" }
        ],
        why: "只要涉及把小素材放到大图的指定位置，这个节点就是答案，参数全由连线数据或面板控制。",
        params: [
          { name: "width", kind: "整数", default: "512", desc: "叠加层缩放后的宽度。" },
          { name: "height", kind: "整数", default: "512", desc: "叠加层缩放后的高度。" },
          { name: "X", kind: "整数", default: "0", desc: "叠加层左上角的横坐标。" },
          { name: "Y", kind: "整数", default: "0", desc: "叠加层左上角的纵坐标。" },
          { name: "rotation", kind: "整数", default: "0", desc: "旋转角度（度）。" },
          { name: "feathering", kind: "整数", default: "0", desc: "边缘羽化像素数，让贴合边界不生硬。" }
        ],
        tips: ""
      },
      {
        name: "Image Padding", cat: "image",
        brief: "按四边独立像素数扩边并羽化。",
        desc: "按左右上下各自的外扩量扩大画布，边缘以羽化方式填充，可做两段羽化让过渡更柔和。把方图扩成目标比例、给局部重绘留出余量时常用。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：加载或生成的图像", desc: "待扩边的图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：编码或继续处理", desc: "扩边后的图像" },
          { type: "MASK", to: "典型下游：局部重绘节点", desc: "标记新增边缘区域的遮罩" }
        ],
        why: "扩边自带遮罩输出，扩出来的区域立刻可以交给采样重绘，是 outpainting 流程的起手式。",
        params: [
          { name: "left_padding", kind: "整数", default: "0", desc: "左侧外扩像素数。" },
          { name: "right_padding", kind: "整数", default: "0", desc: "右侧外扩像素数。" },
          { name: "top_padding", kind: "整数", default: "0", desc: "上方外扩像素数。" },
          { name: "bottom_padding", kind: "整数", default: "0", desc: "下方外扩像素数。" },
          { name: "feathering", kind: "整数", default: "0", desc: "边缘羽化像素数。" }
        ],
        tips: ""
      },
      {
        name: "Image Chromatic Aberration", cat: "image",
        brief: "模拟镜头色差的 RGB 错位滤镜。",
        desc: "让红绿蓝三个通道各自错位偏移并随半径衰减，复刻老镜头边缘的彩色镶边。给画面加复古光学味道，或强化赛博朋克氛围时很好用。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：生成或解码的图像", desc: "待处理的图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：保存或继续处理", desc: "带色差效果的图像" }
        ],
        why: "色差是摄影质感的细节之一，一点点错位就能让数字图像不那么 sterile。",
        params: [
          { name: "red_offset", kind: "整数", default: "2", desc: "红色通道偏移像素数。" },
          { name: "green_offset", kind: "整数", default: "0", desc: "绿色通道偏移像素数。" },
          { name: "blue_offset", kind: "整数", default: "2", desc: "蓝色通道偏移像素数。" },
          { name: "intensity", kind: "浮点数", default: "1.0", desc: "整体效果强度。" },
          { name: "fade_radius", kind: "整数", default: "2", desc: "向画面中心衰减的半径，越大越集中在边缘。" }
        ],
        tips: ""
      },
      {
        name: "Image Flip", cat: "image",
        brief: "水平或垂直翻转图像。",
        desc: "一行参数决定水平镜像还是垂直翻转。数据增广、构图微调、修正朝向的小工具。",
        inputs: [
          { name: "images", type: "IMAGE", from: "典型上游：任意图像", desc: "待翻转的图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：保存或继续处理", desc: "翻转后的图像" }
        ],
        why: "最简单的几何变换，却是增广与对称实验里出场率最高的操作之一。",
        params: [
          { name: "mode", kind: "下拉选择", default: "horizontal", desc: "horizontal 水平镜像，vertical 垂直翻转。" }
        ],
        tips: ""
      },
      {
        name: "Image Rotate", cat: "image",
        brief: "按 90 度翻折或任意角度旋转图像。",
        desc: "transpose 模式按 90 度整数倍翻折旋转，不损画质；internal 模式支持任意角度并可指定插值算法，适合微调构图倾斜。",
        inputs: [
          { name: "images", type: "IMAGE", from: "典型上游：任意图像", desc: "待旋转的图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：保存或继续处理", desc: "旋转后的图像" }
        ],
        why: "构图修正与素材整理的基本件，两种模式覆盖无损与自由两种需求。",
        params: [
          { name: "mode", kind: "下拉选择", default: "transpose", desc: "transpose 无损翻折，internal 任意角度插值旋转。" },
          { name: "rotation", kind: "整数", default: "0", desc: "旋转角度（度），transpose 模式下按 90 度取整。" },
          { name: "sampler", kind: "下拉选择", default: "bilinear", desc: "internal 模式的插值算法。" }
        ],
        tips: ""
      },
      {
        name: "Image Rotate Hue", cat: "image",
        brief: "整体旋转色相实现换色。",
        desc: "把整幅图的色相沿色轮整体偏移，红变蓝、蓝变绿而明暗结构不变。同构图换配色的最快方式，也可用于配色探索。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：任意图像", desc: "待处理的图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：保存或继续处理", desc: "换色后的图像" }
        ],
        why: "配色不满意时先扫一遍色相轮，比重新生成便宜得多。",
        params: [
          { name: "hue_shift", kind: "浮点数", default: "0.0", desc: "色相偏移量，1 为一整圈，0.5 即互补色。" }
        ],
        tips: ""
      },
      {
        name: "Image Aspect Ratio", cat: "image",
        brief: "计算图像宽高比并判断横竖构图。",
        desc: "读取图像尺寸（或用手填宽高）计算宽高比，输出精确比例数值与 16:9 这样的常用比例文本，并判断是否横构图。做按比例分支、按比例缩放时把比例交给下游。",
        inputs: [
          { name: "image", type: "IMAGE", from: "可选，任意图像", desc: "取尺寸的图像" }
        ],
        outputs: [
          { type: "NUMBER", to: "典型下游：数值运算或条件分支", desc: "宽高比例数值" },
          { type: "NUMBER", to: "典型下游：数值运算", desc: "是否横构图的判断（0 或 1）" },
          { type: "STRING", to: "典型下游：文本显示", desc: "16:9 形式的常用比例文本" }
        ],
        why: "构图方向是很多流程分支的依据，把这个判断变成连线数据才能自动路由。",
        params: [],
        tips: ""
      },
      {
        name: "Image Pixelate", cat: "image",
        brief: "像素化滤镜，复刻复古像素画质感。",
        desc: "先按块缩小图像，再用 k-means 聚类把颜色数压到指定数量，可选拌色抖动让色块之间过渡更生动。既做复古像素风，也做隐私打码。",
        inputs: [
          { name: "images", type: "IMAGE", from: "典型上游：任意图像", desc: "待像素化的图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：保存或继续处理", desc: "像素化结果" },
          { type: "LIST", to: "典型下游：文本处理", desc: "聚类得到的主色列表" }
        ],
        why: "减色加块状化是把照片变像素画的标准两步，顺带还能抽出调色板。",
        params: [
          { name: "pixelation_size", kind: "浮点数", default: "8.0", desc: "色块大小，越大马赛克越粗。" },
          { name: "num_colors", kind: "浮点数", default: "16.0", desc: "保留的颜色数量。" },
          { name: "dither", kind: "开关", default: "关", desc: "是否使用抖动模拟过渡色。" }
        ],
        tips: ""
      },
      {
        name: "Image Seamless Texture", cat: "image",
        brief: "把图像边缘处理成可无缝平铺的材质。",
        desc: "通过边缘镜像混合消除平铺时的接缝，tiled 模式还可以直接生成四联平铺预览验证效果。制作贴图材质的必备小工具。",
        inputs: [
          { name: "images", type: "IMAGE", from: "典型上游：生成的纹理图", desc: "待处理纹理" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：保存或平铺预览", desc: "无缝化后的纹理" }
        ],
        why: "AI 生成的纹理四边往往对不上，这个节点把素材真正变成可平铺的贴图。",
        params: [
          { name: "blending", kind: "浮点数", default: "0.4", desc: "边缘混合强度。" },
          { name: "tiled", kind: "开关", default: "关", desc: "开启后输出四联平铺图，方便检查接缝。" },
          { name: "tiles", kind: "整数", default: "2", desc: "平铺预览的行列数。" }
        ],
        tips: ""
      },
      {
        name: "Image Bloom Filter", cat: "image",
        brief: "高光扩散成光晕的辉光滤镜。",
        desc: "提取画面高光部分并向外扩散成柔和光晕再叠加回去，模拟镜头辉光。夜景、魔法特效、霓虹灯场景加一点 bloom 立刻梦幻起来。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：生成或解码的图像", desc: "待处理图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：保存或继续处理", desc: "带辉光效果的图像" }
        ],
        why: "辉光是渲染质感里最讨喜的效果之一，一个节点一步到位。",
        params: [
          { name: "radius", kind: "浮点数", default: "1.0", desc: "光晕扩散半径。" },
          { name: "intensity", kind: "浮点数", default: "1.0", desc: "光晕强度，过高会洗白画面。" }
        ],
        tips: ""
      },
      {
        name: "Image Canny Filter", cat: "image",
        brief: "Canny 边缘检测，输出线稿风格图。",
        desc: "经典 Canny 算子提取画面轮廓，输出黑底白线的线稿，双阈值控制边缘的取舍。把参考图转成构图骨架、或给 Control Line 类控制网准备输入时都用它。",
        inputs: [
          { name: "images", type: "IMAGE", from: "典型上游：参考图或生成图", desc: "待提取边缘的图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：控制网输入或保存", desc: "边缘线稿图" }
        ],
        why: "线稿是结构与构图的抽象，Canny 是从图像到线稿最经典的一跳。",
        params: [
          { name: "enable_threshold", kind: "开关", default: "关", desc: "是否启用自定义双阈值，关闭时自动取值。" },
          { name: "threshold_low", kind: "浮点数", default: "0.4", desc: "低阈值，低于它的边缘被丢弃。" },
          { name: "threshold_high", kind: "浮点数", default: "0.8", desc: "高阈值，高于它的边缘确定保留。" }
        ],
        tips: ""
      },
      {
        name: "Image Edge Detection Filter", cat: "image",
        brief: "普通或拉普拉斯模式的轮廓提取。",
        desc: "用常规差分或拉普拉斯算子勾出画面轮廓，输出介于线稿与浮雕之间的描边效果。与 Canny 相比更粗犷，适合风格化而非精确控制。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：任意图像", desc: "待处理图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：保存或混合", desc: "描边效果图像" }
        ],
        why: "想要手绘描边感或者快速看清结构时，它比 Canny 更有味道。",
        params: [
          { name: "mode", kind: "下拉选择", default: "normal", desc: "normal 常规差分，laplacian 拉普拉斯算子。" }
        ],
        tips: ""
      },
      {
        name: "Image High Pass Filter", cat: "image",
        brief: "高反差保留，只留中高频细节。",
        desc: "滤掉低频的大块明暗，只保留边缘与纹理等中高频信息，可输出彩色或中性灰底。与叠加混合配合就是 Photoshop 经典锐化手法，也是质感强化的秘密武器。",
        inputs: [
          { name: "images", type: "IMAGE", from: "典型上游：任意图像", desc: "待处理图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：混合回原图或保存", desc: "高频细节图" }
        ],
        why: "把图像拆成低频与高频分别处理，是专业修图的基本功，这个节点提供了高频那一半。",
        params: [
          { name: "radius", kind: "整数", default: "10", desc: "低频滤除半径，越大保留的细节层越低频。" },
          { name: "strength", kind: "浮点数", default: "1.5", desc: "细节增强强度。" },
          { name: "color_output", kind: "开关", default: "开", desc: "是否保留彩色，关闭输出灰度细节。" },
          { name: "neutral_background", kind: "开关", default: "开", desc: "是否以中性灰为底，方便叠加混合。" }
        ],
        tips: ""
      },
      {
        name: "Image Lucy Sharpen", cat: "image",
        brief: "Lucy-Richardson 迭代反卷积锐化。",
        desc: "用 Richardson-Lucy 反卷积迭代恢复细节，比普通 USM 锐化更擅长拯救轻微失焦的图像。迭代越多越锐，也越容易放大噪点，配合中值滤镜使用更稳。",
        inputs: [
          { name: "images", type: "IMAGE", from: "典型上游：发糊的图像", desc: "待锐化图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：保存或继续处理", desc: "锐化后的图像" }
        ],
        why: "轻微糊图不必重画，反卷积锐化是物理意义上的补救手段。",
        params: [
          { name: "iterations", kind: "整数", default: "10", desc: "迭代次数，越多越锐。" },
          { name: "kernel_size", kind: "整数", default: "5", desc: "卷积核尺寸，影响锐化的作用范围。" }
        ],
        tips: ""
      },
      {
        name: "Image Median Filter", cat: "image",
        brief: "保边去噪的双边式中值滤镜。",
        desc: "在压平噪点与色块的同时保住边缘轮廓，效果类似双边滤波，也常用来给人像磨皮。sigma 参数分别控制颜色与空间上的平滑范围。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：带噪点的图像", desc: "待处理图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：保存或继续处理", desc: "去噪后的图像" }
        ],
        why: "AI 出图的细碎噪点与色斑，用保边滤镜清理比重新采样便宜。",
        params: [
          { name: "diameter", kind: "整数", default: "4", desc: "滤波直径，越大越平滑。" },
          { name: "sigma_color", kind: "浮点数", default: "20.0", desc: "颜色差异的平滑容限。" },
          { name: "sigma_space", kind: "浮点数", default: "20.0", desc: "空间距离的平滑权重。" }
        ],
        tips: ""
      },
      {
        name: "Image Film Grain", cat: "image",
        brief: "胶片颗粒噪点滤镜。",
        desc: "叠加可控密度与强度的胶片颗粒，让过于干净的 AI 出图带上胶片质感，对高光的颗粒强度可单独调整。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：生成或解码的图像", desc: "待处理图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：保存或继续处理", desc: "带颗粒的图像" }
        ],
        why: "一点颗粒感就能显著削弱塑料味，是出图收尾的高性价比装饰。",
        params: [
          { name: "density", kind: "浮点数", default: "1.0", desc: "颗粒密度。" },
          { name: "intensity", kind: "浮点数", default: "1.0", desc: "颗粒明暗强度。" },
          { name: "highlights", kind: "浮点数", default: "1.0", desc: "高光区的颗粒权重。" },
          { name: "supersample_factor", kind: "整数", default: "4", desc: "超采样倍数，影响颗粒的细腻程度。" }
        ],
        tips: ""
      },
      {
        name: "Image Dragan Photography Filter", cat: "image",
        brief: "Dragan 风格高对比电影感滤镜。",
        desc: "模仿摄影师 Andrzej Dragan 的标志性风格：提高对比与锐度、压暗周围、强调皮肤与材质纹理，人像立刻带上戏剧化的电影感。可整体上色或保留高反差灰调。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：人像或静物照片", desc: "待处理图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：保存或继续处理", desc: "风格化后的图像" }
        ],
        why: "一组参数就能套用整套摄影美学，是滤镜包里最出效果的明星之一。",
        params: [
          { name: "saturation", kind: "浮点数", default: "1.4", desc: "饱和度系数。" },
          { name: "contrast", kind: "浮点数", default: "1.2", desc: "对比度系数。" },
          { name: "brightness", kind: "浮点数", default: "1.0", desc: "亮度系数。" },
          { name: "sharpness", kind: "浮点数", default: "1.0", desc: "锐度系数。" },
          { name: "highpass_strength", kind: "浮点数", default: "1.0", desc: "内置高反差保留的强度，负责质感。" }
        ],
        tips: ""
      },
      {
        name: "Image Monitor Effects Filter", cat: "image",
        brief: "老式显示器与信号失真滤镜。",
        desc: "模拟数字失真、信号干扰与电视花屏三种老屏幕效果，振幅与偏移可调。做故障艺术（Glitch）或复古科幻界面的现成工具。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：任意图像", desc: "待处理图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：保存或继续处理", desc: "失真效果图像" }
        ],
        why: "故障风的核心就是信号错乱，这个节点把它参数化成一行下拉的事。",
        params: [
          { name: "mode", kind: "下拉选择", default: "Digital Distortion", desc: "Digital Distortion 数字失真，Signal Distortion 信号干扰，TV Distortion 电视花屏。" },
          { name: "amplitude", kind: "整数", default: "64", desc: "失真强度。" },
          { name: "offset", kind: "整数", default: "32", desc: "错位偏移量。" }
        ],
        tips: ""
      },
      {
        name: "Image Nova Filter", cat: "image",
        brief: "太阳化负片感的超现实滤镜。",
        desc: "让亮部按正弦曲线发生色彩翻转，产生类似中途曝光的负片色彩，amplitude 与 frequency 控制翻转的强度与节奏。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：任意图像", desc: "待处理图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：保存或继续处理", desc: "太阳化效果图像" }
        ],
        why: "超现实色彩一两步就能得到，做海报与封面时是很好的意外感来源。",
        params: [
          { name: "amplitude", kind: "浮点数", default: "1.0", desc: "翻转幅度。" },
          { name: "frequency", kind: "浮点数", default: "1.0", desc: "翻转频率。" }
        ],
        tips: ""
      },
      {
        name: "Image Style Filter", cat: "image",
        brief: "三十余种 Instagram 风格滤镜一键套用。",
        desc: "内置 1977、Clarendon、Inkwell、Nashville 等三十多种经典滤镜配方，一键改变色彩氛围。快速浏览不同调性、给批量图统一气质都很快。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：生成或解码的图像", desc: "待处理图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：保存或继续处理", desc: "滤镜处理后的图像" }
        ],
        why: "不用理解调色原理也能立刻得到成熟配色，是探索氛围的快捷方式。",
        params: [
          { name: "style", kind: "下拉选择", default: "1977", desc: "滤镜名称，列表涵盖绝大多数经典 Instagram 配方。" }
        ],
        tips: ""
      },
      {
        name: "Image fDOF Filter", cat: "image",
        brief: "按深度图模拟大光圈景深虚化。",
        desc: "假景深（fake DOF）滤镜：结合深度图让远处模糊、近处清晰，模拟大光圈镜头的焦外效果，支持高斯与盒式模糊两种模式。深度图可来自 MiDaS 深度估计。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：任意图像", desc: "目标图像" },
          { name: "depth", type: "IMAGE", from: "典型上游：MiDaS 深度估计", desc: "引导虚化的深度图" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：保存或继续处理", desc: "带景深虚化的图像" }
        ],
        why: "生成图的景深经常太平，按深度补一层虚化立刻有摄影感。",
        params: [
          { name: "mode", kind: "下拉选择", default: "mock", desc: "mock 模拟镜头虚化，gaussian 高斯模糊，box 盒式模糊。" },
          { name: "radius", kind: "整数", default: "8", desc: "虚化半径。" },
          { name: "samples", kind: "整数", default: "2", desc: "采样次数，影响虚化质量与速度。" }
        ],
        tips: ""
      },
      {
        name: "Image Voronoi Noise Filter", cat: "image",
        brief: "生成 Voronoi 晶格噪声纹理。",
        desc: "按密度生成 Voronoi 胞元图案，modulator 控制胞元形状的扰动，可输出平面或带立体感的 RGB 版本。作纹理素材、置换图或装饰背景都很合适。",
        inputs: [],
        outputs: [
          { type: "IMAGE", to: "典型下游：纹理使用或置换扭曲", desc: "Voronoi 噪声图" }
        ],
        why: "Voronoi 图案是自然肌理（龟裂、细胞、鳞片）的数学近似，程序生成即取即用。",
        params: [
          { name: "width", kind: "整数", default: "512", desc: "输出宽度（像素）。" },
          { name: "height", kind: "整数", default: "512", desc: "输出高度（像素）。" },
          { name: "density", kind: "整数", default: "12", desc: "胞元密度，越大胞元越小越多。" },
          { name: "modulator", kind: "整数", default: "2", desc: "胞元形状扰动强度。" },
          { name: "seed", kind: "整数", default: "0", desc: "随机种子，固定可复现。" }
        ],
        tips: ""
      },
      {
        name: "Image Perlin Noise", cat: "image",
        brief: "经典 Perlin 云雾噪声图生成器。",
        desc: "生成平滑连续的 Perlin 噪声灰度图，scale 控制云团大小，octaves 与 persistence 控制细节层次。作为置换扭曲的驱动、噪点素材或潜空间纹理来源都很常用。",
        inputs: [],
        outputs: [
          { type: "IMAGE", to: "典型下游：置换扭曲或混合", desc: "Perlin 噪声灰度图" }
        ],
        why: "Perlin 噪声是程序纹理的基石，云雾、水流、地形都从它变形而来。",
        params: [
          { name: "width", kind: "整数", default: "512", desc: "输出宽度（像素）。" },
          { name: "height", kind: "整数", default: "512", desc: "输出高度（像素）。" },
          { name: "scale", kind: "整数", default: "100", desc: "噪声尺度，越小云团越大。" },
          { name: "octaves", kind: "整数", default: "5", desc: "叠加的细节层数。" },
          { name: "persistence", kind: "浮点数", default: "0.5", desc: "每层细节的衰减比例。" },
          { name: "seed", kind: "整数", default: "0", desc: "随机种子。" }
        ],
        tips: ""
      },
      {
        name: "Image Perlin Power Fractal", cat: "image",
        brief: "可调能量分布的分形 Perlin 噪声。",
        desc: "在 Perlin 噪声基础上加入指数与倍频控制，能做出更尖锐或更平缓的分形纹理。地形、岩石、云层的程序化素材库。",
        inputs: [],
        outputs: [
          { type: "IMAGE", to: "典型下游：置换扭曲或混合", desc: "分形噪声灰度图" }
        ],
        why: "普通 Perlin 的细节均匀，分形版可以按需要把能量集中到某个尺度，更像自然肌理。",
        params: [
          { name: "scale", kind: "整数", default: "100", desc: "基础噪声尺度。" },
          { name: "octaves", kind: "整数", default: "5", desc: "叠加的细节层数。" },
          { name: "persistence", kind: "浮点数", default: "0.5", desc: "每层细节的衰减比例。" },
          { name: "lacunarity", kind: "浮点数", default: "2.0", desc: "每层细节的频率倍增系数。" },
          { name: "exponent", kind: "浮点数", default: "2.0", desc: "能量指数，大于 1 时暗部更沉、对比更强。" }
        ],
        tips: ""
      },
      {
        name: "Image Power Noise", cat: "image",
        brief: "白粉蓝绿等多频谱程序噪声。",
        desc: "生成指定频谱特征的噪声图：白噪声纯随机、粉红噪声低频更强、蓝绿噪声高频更强，mix 混合多种频谱。颗粒质感、材质测试与抗图案化的底噪都靠它。",
        inputs: [],
        outputs: [
          { type: "IMAGE", to: "典型下游：混合或置换", desc: "指定频谱的噪声图" }
        ],
        why: "不同频谱的噪声观感完全不同，粉红噪声最接近真实胶片颗粒。",
        params: [
          { name: "noise_type", kind: "下拉选择", default: "grey", desc: "grey 灰噪、white 白噪、pink 粉噪、blue 蓝噪、green 绿噪、mix 混合。" },
          { name: "frequency", kind: "浮点数", default: "0.0", desc: "频率参数，影响颗粒粗细。" },
          { name: "attenuation", kind: "浮点数", default: "1.0", desc: "衰减系数，控制频谱倾斜程度。" }
        ],
        tips: ""
      },
      {
        name: "Image Shadows and Highlights", cat: "image",
        brief: "阴影与高光分区独立调整。",
        desc: "按亮度阈值把画面分成阴影区与高光区，各自独立提亮或压暗，平滑参数控制过渡，还输出两张分区图便于检查。类似 Lightroom 的阴影高光工具，救死黑与死白很有效。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：生成或解码的图像", desc: "待调整图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：保存或继续调色", desc: "调整后的图像" },
          { type: "IMAGE", to: "典型下游：遮罩类节点", desc: "阴影区选区图" },
          { type: "IMAGE", to: "典型下游：遮罩类节点", desc: "高光区选区图" }
        ],
        why: "整体调对比救不了局部死黑，分区调整才是精细手段，顺带输出的选区图还能参与后续处理。",
        params: [
          { name: "shadow_threshold", kind: "浮点数", default: "0.3", desc: "阴影区判定阈值。" },
          { name: "shadow_factor", kind: "浮点数", default: "1.0", desc: "阴影区调整系数，大于 1 提亮。" },
          { name: "highlight_threshold", kind: "浮点数", default: "0.7", desc: "高光区判定阈值。" },
          { name: "highlight_factor", kind: "浮点数", default: "1.0", desc: "高光区调整系数，小于 1 压暗。" }
        ],
        tips: ""
      },
      {
        name: "Image Levels Adjustment", cat: "image",
        brief: "黑场白场中间调的色阶调整。",
        desc: "重新定义图像的黑场、中间调与白场，一步拉出通透的对比度。比曲线直观，比亮度对比度精细，是出图收尾的常用三连。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：生成或解码的图像", desc: "待调整图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：保存或继续处理", desc: "调整后的图像" }
        ],
        why: "灰蒙蒙的出图大多数只需要重设色阶，比堆滤镜更干净。",
        params: [
          { name: "black_level", kind: "浮点数", default: "0.0", desc: "黑场位置，低于它的亮度被压成纯黑。" },
          { name: "mid_level", kind: "浮点数", default: "0.5", desc: "中间调位置，控制整体明暗走向。" },
          { name: "white_level", kind: "浮点数", default: "1.0", desc: "白场位置，高于它的亮度被提成纯白。" }
        ],
        tips: ""
      },
      {
        name: "Image Analyze", cat: "image",
        brief: "输出图像的直方图分析图。",
        desc: "生成黑白电平或 RGB 三通道的直方图可视化，帮助判断曝光与色彩分布。调色前看一眼直方图，比凭感觉猜靠谱得多。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：任意图像", desc: "待分析图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：预览", desc: "直方图分析图" }
        ],
        why: "把图像统计变成可看的图，让调参有依据而不是玄学。",
        params: [
          { name: "mode", kind: "下拉选择", default: "Black White Levels", desc: "Black White Levels 黑白电平分布，RGB Levels 三通道分布。" }
        ],
        tips: ""
      },
      {
        name: "Image Color Palette", cat: "image",
        brief: "提取图像主色并生成色卡。",
        desc: "用聚类算法从图像提取指定数量的主色，输出一张色卡图与颜色列表。做配色方案、插画取色、海报排版都用得上。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：参考图", desc: "取色来源图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：预览或保存", desc: "色卡条图" },
          { type: "LIST", to: "典型下游：文本处理", desc: "主色数据列表" }
        ],
        why: "从好图里偷配色是设计师的日常，这个节点把偷色自动化了。",
        params: [
          { name: "colors", kind: "整数", default: "5", desc: "提取的主色数量。" },
          { name: "mode", kind: "下拉选择", default: "Chart", desc: "Chart 色卡条样式，back_to_back 背靠背色块。" }
        ],
        tips: ""
      },
      {
        name: "Image Select Channel", cat: "image",
        brief: "抽取单一颜色通道为灰度图。",
        desc: "把图像的红、绿或蓝通道单独抽出输出为灰度图。自制遮罩、检查通道信息、与通道合成节点配合重组图像的基础操作。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：任意图像", desc: "待处理图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：遮罩或通道合成", desc: "单通道灰度图" }
        ],
        why: "通道是图像的隐藏结构，抽出来就能当遮罩或数据用。",
        params: [
          { name: "channel", kind: "下拉选择", default: "red", desc: "要抽取的通道。" }
        ],
        tips: ""
      },
      {
        name: "Image Select Color", cat: "image",
        brief: "按颜色选区生成遮罩。",
        desc: "选出与目标 RGB 颜色相近的像素生成遮罩，variance 控制容差范围。抠取纯色背景、选定特定色块做局部处理的好工具。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：任意图像", desc: "待处理图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：遮罩类节点或局部混合", desc: "颜色选区遮罩" }
        ],
        why: "对于绿幕或纯色背景，颜色选区比 AI 抠图更快更准。",
        params: [
          { name: "red", kind: "整数", default: "255", desc: "目标颜色的红色分量。" },
          { name: "green", kind: "整数", default: "255", desc: "目标颜色的绿色分量。" },
          { name: "blue", kind: "整数", default: "255", desc: "目标颜色的蓝色分量。" },
          { name: "variance", kind: "整数", default: "10", desc: "颜色容差，越大选区越宽。" }
        ],
        tips: ""
      },
      {
        name: "Image Mix RGB Channels", cat: "image",
        brief: "把三张灰度图重组为 RGB 彩色图。",
        desc: "把三路灰度图分别作为红绿蓝通道合成一张彩色图。与 Select Channel 配对可以自由交换通道，做风格化调色或修复错误通道。",
        inputs: [
          { name: "red_channel", type: "IMAGE", from: "典型上游：通道抽取或灰度图", desc: "作为红色通道的灰度图" },
          { name: "green_channel", type: "IMAGE", from: "同上", desc: "作为绿色通道的灰度图" },
          { name: "blue_channel", type: "IMAGE", from: "同上", desc: "作为蓝色通道的灰度图" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：保存或继续处理", desc: "合成后的彩色图" }
        ],
        why: "通道自由组合是色彩实验的底层玩法，也是通道错位故障风的实现手段。",
        params: [],
        tips: ""
      },
      {
        name: "Image Remove Color", cat: "image",
        brief: "把接近目标色的像素替换成新颜色。",
        desc: "检测画面中接近目标 RGB 的像素并替换为指定的新颜色，clip_threshold 控制判定阈值。改背景色、去色边、统一色块时很直接。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：任意图像", desc: "待处理图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：保存或继续处理", desc: "替换后的图像" }
        ],
        why: "某些颜色问题不值得重新生成，定位加替换一步完成。",
        params: [
          { name: "target_red", kind: "整数", default: "255", desc: "目标颜色红色分量。" },
          { name: "target_green", kind: "整数", default: "255", desc: "目标颜色绿色分量。" },
          { name: "target_blue", kind: "整数", default: "255", desc: "目标颜色蓝色分量。" },
          { name: "replace_red", kind: "整数", default: "255", desc: "替换颜色红色分量。" },
          { name: "clip_threshold", kind: "整数", default: "10", desc: "颜色接近程度的判定阈值。" }
        ],
        tips: ""
      },
      {
        name: "Images to Linear", cat: "image",
        brief: "把图像从 sRGB 转到线性色彩空间。",
        desc: "把 sRGB 编码的图像转换为线性光照空间数值，供需要物理正确合成的节点（如 SSAO、SSDO）使用，避免直接混合出现亮度失真。",
        inputs: [
          { name: "images", type: "IMAGE", from: "典型上游：任意图像", desc: "待转换图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：光照合成类节点", desc: "线性空间图像" }
        ],
        why: "线性空间下的混合与光照计算才符合物理直觉，专业向节点的配套转换器。",
        params: [],
        tips: ""
      },
      {
        name: "Images to RGB", cat: "image",
        brief: "把线性空间图像转回 sRGB。",
        desc: "Images to Linear 的逆操作，把线性数值重新编码回 sRGB 显示空间。走完线性合成流程后，输出前记得补这一步，否则画面会发灰。",
        inputs: [
          { name: "images", type: "IMAGE", from: "典型上游：线性合成结果", desc: "线性空间图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：保存或预览", desc: "sRGB 空间图像" }
        ],
        why: "进线性、出 sRGB 是一对往返票，缺了返程票结果就不对。",
        params: [],
        tips: ""
      },
      {
        name: "Image SSAO (Ambient Occlusion)", cat: "image",
        brief: "按深度图计算环境光遮蔽体积感。",
        desc: "结合深度图在缝隙与转折处生成柔和的环境光遮蔽阴影，让平面插画获得伪 3D 的体积感，还输出高光遮罩供额外控制。深度图通常来自 MiDaS 深度估计。",
        inputs: [
          { name: "images", type: "IMAGE", from: "典型上游：目标图像", desc: "原图像" },
          { name: "depth_images", type: "IMAGE", from: "典型上游：深度估计节点", desc: "对应的深度图" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：保存或继续处理", desc: "叠加遮蔽后的合成图" },
          { type: "IMAGE", to: "典型下游：混合或保存", desc: "AO 遮蔽图" },
          { type: "IMAGE", to: "典型下游：混合或保存", desc: "高光遮罩图" }
        ],
        why: "环境光遮蔽是画面体积感的来源之一，深度驱动的方式无需建模就能实现。",
        params: [
          { name: "strength", kind: "浮点数", default: "1.0", desc: "遮蔽强度。" },
          { name: "radius", kind: "浮点数", default: "2.0", desc: "遮蔽采样半径。" },
          { name: "ao_blur", kind: "浮点数", default: "1.0", desc: "遮蔽图模糊程度。" },
          { name: "enable_specular_masking", kind: "开关", default: "关", desc: "是否启用高光遮罩。" }
        ],
        tips: ""
      },
      {
        name: "Image SSDO (Direct Occlusion)", cat: "image",
        brief: "方向性更强的直接遮挡阴影。",
        desc: "直接遮挡（SSDO）比 SSAO 更进一步，考虑遮挡的方向与颜色渗透，生成带方向感的接触阴影与色彩反弹。同样以深度图为依据，效果更真实、计算也稍重。",
        inputs: [
          { name: "images", type: "IMAGE", from: "典型上游：目标图像", desc: "原图像" },
          { name: "depth_images", type: "IMAGE", from: "典型上游：深度估计节点", desc: "对应的深度图" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：保存或继续处理", desc: "合成后的图像" },
          { type: "IMAGE", to: "典型下游：混合或保存", desc: "SSDO 遮蔽图" },
          { type: "IMAGE", to: "典型下游：混合或保存", desc: "遮蔽遮罩图" },
          { type: "IMAGE", to: "典型下游：混合或保存", desc: "光源遮罩图" }
        ],
        why: "想要物理正确的阴影接触感，SSDO 是这套深度工具链的天花板。",
        params: [
          { name: "strength", kind: "浮点数", default: "1.0", desc: "遮蔽强度。" },
          { name: "radius", kind: "浮点数", default: "2.0", desc: "遮蔽采样半径。" },
          { name: "colored_occlusion", kind: "开关", default: "关", desc: "是否启用带颜色的渗透阴影。" }
        ],
        tips: ""
      },
      {
        name: "Image Crop Location", cat: "image",
        brief: "按四边坐标裁剪并输出定位数据。",
        desc: "按上左下右四个坐标裁出区域，同时输出 CROP_DATA 定位数据，供 Image Paste Crop 把处理结果原位贴回。裁出去改完再贴回来，构成局部处理闭环。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：原图像", desc: "待裁剪图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：局部采样或处理", desc: "裁出的区域图" },
          { type: "CROP_DATA", to: "典型下游：Image Paste Crop", desc: "记录裁剪位置的定位数据" }
        ],
        why: "局部重绘的标准打法是裁出小图处理再回贴，裁与贴成对出现才不会错位。",
        params: [
          { name: "top", kind: "整数", default: "0", desc: "上边界坐标。" },
          { name: "left", kind: "整数", default: "0", desc: "左边界坐标。" },
          { name: "right", kind: "整数", default: "256", desc: "右边界坐标。" },
          { name: "bottom", kind: "整数", default: "256", desc: "下边界坐标。" }
        ],
        tips: ""
      },
      {
        name: "Image Crop Square Location", cat: "image",
        brief: "按坐标与边长裁出正方形区域。",
        desc: "以 x、y 坐标与边长裁出一个正方形区域，同样输出 CROP_DATA 配对回贴。给主体截取方形头像或标准尺寸素材时方便。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：原图像", desc: "待裁剪图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：局部处理", desc: "正方形区域图" },
          { type: "CROP_DATA", to: "典型下游：Image Paste Crop", desc: "定位数据" }
        ],
        why: "方形裁剪参数少、不易出错，是定位裁剪里的常用简化版。",
        params: [
          { name: "x", kind: "整数", default: "0", desc: "起点横坐标。" },
          { name: "y", kind: "整数", default: "0", desc: "起点纵坐标。" },
          { name: "size", kind: "整数", default: "256", desc: "正方形边长（像素）。" }
        ],
        tips: ""
      },
      {
        name: "Image Paste Crop", cat: "image",
        brief: "按定位数据把小图原位贴回大图。",
        desc: "接收裁剪时输出的 CROP_DATA，把处理过的小图对位贴回原图，贴入时的混合比例与锐化强度可调。与 Image Crop Location 系列配对，是局部重绘的标准收尾。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：原图像", desc: "目标底图" },
          { name: "crop_image", type: "IMAGE", from: "典型上游：处理后的区域图", desc: "要贴回的小图" },
          { name: "crop_data", type: "CROP_DATA", from: "典型上游：裁剪节点", desc: "定位数据" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：保存或继续处理", desc: "回贴完成的图像" },
          { type: "IMAGE", to: "典型下游：遮罩类节点", desc: "贴入区域的遮罩图" }
        ],
        why: "有定位数据在手，贴回零对齐成本，小图改多少贴多少。",
        params: [
          { name: "crop_blending", kind: "浮点数", default: "0.25", desc: "边缘融合比例，越大过渡越柔。" },
          { name: "crop_sharpening", kind: "整数", default: "0", desc: "贴入前对小图锐化的档位，0 为关闭。" }
        ],
        tips: ""
      },
      {
        name: "Image Paste Crop by Location", cat: "image",
        brief: "按坐标参数把小图贴回指定位置。",
        desc: "与 Image Paste Crop 相同，但用上左下右坐标参数定位，不依赖 CROP_DATA。适合位置固定的合成，或手动指定贴入点。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：目标底图", desc: "底图" },
          { name: "crop_image", type: "IMAGE", from: "典型上游：素材小图", desc: "要贴入的图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：保存或继续处理", desc: "贴入后的图像" },
          { type: "IMAGE", to: "典型下游：遮罩类节点", desc: "贴入区域遮罩" }
        ],
        why: "没有配套裁剪节点时也能精确贴图，参数即位置。",
        params: [
          { name: "top", kind: "整数", default: "0", desc: "贴入区上边界。" },
          { name: "left", kind: "整数", default: "0", desc: "贴入区左边界。" },
          { name: "right", kind: "整数", default: "256", desc: "贴入区右边界。" },
          { name: "bottom", kind: "整数", default: "256", desc: "贴入区下边界。" },
          { name: "crop_blending", kind: "浮点数", default: "0.25", desc: "边缘融合比例。" }
        ],
        tips: ""
      },
      {
        name: "Image Crop Face", cat: "image",
        brief: "自动检测人脸并裁剪成小图。",
        desc: "用 OpenCV 级联检测器在图中找脸并按外扩系数裁剪，内置动漫脸检测器，输出小图与 CROP_DATA。批量修脸、换脸流程的前半段，配合 Image Paste Face 完成自动回贴。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：人像图像", desc: "待检测的图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：修脸或采样节点", desc: "裁出的脸部小图" },
          { type: "CROP_DATA", to: "典型下游：Image Paste Face", desc: "脸部定位数据" }
        ],
        why: "脸部是画面最挑剔的区域，自动定位裁剪让高清修复只作用于脸，又快又稳。",
        params: [
          { name: "crop_padding_factor", kind: "浮点数", default: "0.25", desc: "脸部包围盒的外扩比例，给修脸留余量。" },
          { name: "cascade_xml", kind: "下拉选择", default: "lbpcascade_animeface.xml", desc: "检测器选择，含动漫脸、正脸、侧脸、眼部等多种级联文件。" }
        ],
        tips: ""
      },
      {
        name: "Image Paste Face", cat: "image",
        brief: "把修好的脸部小图原位贴回。",
        desc: "接收 Image Crop Face 输出的 CROP_DATA，把修复后的脸部小图融合回原图，边缘混合与锐化可调。与裁脸节点配对形成自动修脸闭环。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：原图像", desc: "目标底图" },
          { name: "crop_image", type: "IMAGE", from: "典型上游：修复后的脸部图", desc: "脸部小图" },
          { name: "crop_data", type: "CROP_DATA", from: "典型上游：Image Crop Face", desc: "脸部定位数据" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：保存或继续处理", desc: "回贴完成的人像" },
          { type: "IMAGE", to: "典型下游：遮罩类节点", desc: "脸部区域遮罩" }
        ],
        why: "修脸流程的最后一步是干净地贴回去，融合参数决定脖颈与发际线处是否穿帮。",
        params: [
          { name: "crop_blending", kind: "浮点数", default: "0.25", desc: "边缘融合比例。" },
          { name: "crop_sharpening", kind: "整数", default: "0", desc: "贴入前锐化档位。" }
        ],
        tips: ""
      },
      {
        name: "Image Bounds", cat: "image",
        brief: "记录图像边界输出可连线数据。",
        desc: "读取图像的边界信息（尺寸范围）输出为 IMAGE_BOUNDS 对象，与 Bounded 系列节点配合，实现按边界自动定位的局部处理。边界数据本身也可以供数字节点或控制台查看。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：任意图像", desc: "取边界的图像" }
        ],
        outputs: [
          { type: "IMAGE_BOUNDS", to: "典型下游：Bounded 系列节点", desc: "边界数据对象" }
        ],
        why: "把尺寸信息变成连线数据，裁剪与回贴就不再需要手抄数字。",
        params: [],
        tips: ""
      },
      {
        name: "Inset Image Bounds", cat: "image",
        brief: "把边界向内收缩指定像素。",
        desc: "在已有 IMAGE_BOUNDS 基础上，按左右上下各自内缩，常用于给回贴留出过渡区、避免边缘接缝。与 Image Bounds 配合构成边界计算链。",
        inputs: [
          { name: "image_bounds", type: "IMAGE_BOUNDS", from: "典型上游：Image Bounds", desc: "原始边界数据" }
        ],
        outputs: [
          { type: "IMAGE_BOUNDS", to: "典型下游：Bounded 系列节点", desc: "收缩后的边界数据" }
        ],
        why: "放大回贴时边缘最容易穿帮，先内缩再处理是最省心的预防手段。",
        params: [
          { name: "inset_left", kind: "整数", default: "0", desc: "左侧内缩像素数。" },
          { name: "inset_right", kind: "整数", default: "0", desc: "右侧内缩像素数。" },
          { name: "inset_top", kind: "整数", default: "0", desc: "上方内缩像素数。" },
          { name: "inset_bottom", kind: "整数", default: "0", desc: "下方内缩像素数。" }
        ],
        tips: ""
      },
      {
        name: "Bounded Image Crop", cat: "image",
        brief: "按边界数据裁剪图像。",
        desc: "按 IMAGE_BOUNDS 数据直接裁出区域图，与带遮罩版本的区别是不从遮罩计算包围盒，而是使用现成边界。配套的 Bounded Image Blend 负责回贴。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：原图像", desc: "待裁剪图像" },
          { name: "image_bounds", type: "IMAGE_BOUNDS", from: "典型上游：Image Bounds", desc: "边界数据" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：局部处理或放大", desc: "边界内裁出的图像" }
        ],
        why: "边界数据一旦有了，裁剪就是零参数动作，流程更少手动干预。",
        params: [],
        tips: ""
      },
      {
        name: "Bounded Image Blend", cat: "image",
        brief: "按边界把小图融合回目标图。",
        desc: "把处理后的 source 图按 target_bounds 记录的位置贴回 target，带羽化与混合系数。与 Bounded Image Crop 配对完成不带遮罩的局部处理闭环。",
        inputs: [
          { name: "target", type: "IMAGE", from: "典型上游：原图像", desc: "目标底图" },
          { name: "target_bounds", type: "IMAGE_BOUNDS", from: "典型上游：Image Bounds", desc: "边界数据" },
          { name: "source", type: "IMAGE", from: "典型上游：处理后的区域图", desc: "要贴回的图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：保存或继续处理", desc: "回贴完成的图像" }
        ],
        why: "边界数据驱动的回贴无需手动对位，局部放大流程的标准收尾。",
        params: [
          { name: "blend_factor", kind: "浮点数", default: "1.0", desc: "融合比例。" },
          { name: "feathering", kind: "整数", default: "0", desc: "边缘羽化像素数。" }
        ],
        tips: ""
      },
      {
        name: "Bounded Image Blend with Mask", cat: "image",
        brief: "边界加遮罩双重控制的回贴。",
        desc: "与 Bounded Image Blend 相同，但额外接受遮罩精确限定融合区域，边界定位置、遮罩定形状，两者结合最不容易穿帮。",
        inputs: [
          { name: "target", type: "IMAGE", from: "典型上游：原图像", desc: "目标底图" },
          { name: "target_mask", type: "MASK", from: "典型上游：遮罩节点", desc: "限定融合范围的遮罩" },
          { name: "target_bounds", type: "IMAGE_BOUNDS", from: "典型上游：Image Bounds", desc: "边界数据" },
          { name: "source", type: "IMAGE", from: "典型上游：处理后的区域图", desc: "要贴回的图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：保存或继续处理", desc: "回贴完成的图像" }
        ],
        why: "局部处理精度要求高时，位置与形状分开控制是必要的。",
        params: [
          { name: "blend_factor", kind: "浮点数", default: "1.0", desc: "融合比例。" },
          { name: "feathering", kind: "整数", default: "0", desc: "边缘羽化像素数。" }
        ],
        tips: ""
      },
      {
        name: "Image Bounds to Console", cat: "image",
        brief: "把边界数据打印到控制台。",
        desc: "把 IMAGE_BOUNDS 数据打印到 ComfyUI 控制台并原样输出，调试局部处理流程时确认边界数值是否符合预期。",
        inputs: [
          { name: "image_bounds", type: "IMAGE_BOUNDS", from: "典型上游：Image Bounds", desc: "边界数据" }
        ],
        outputs: [
          { type: "IMAGE_BOUNDS", to: "典型下游：Bounded 系列节点", desc: "原样传递的边界数据" }
        ],
        why: "看不见的数据没法调试，一行打印省去大量猜测。",
        params: [
          { name: "label", kind: "文本", default: "Bounds", desc: "打印时的标签文字。" }
        ],
        tips: ""
      },
      {
        name: "Image Rembg (Remove Background)", cat: "image",
        brief: "Rembg 智能抠图去背景。",
        desc: "用 Rembg 模型自动识别主体并去除背景，可输出透明背景图、纯主体遮罩（only_mask）或填充指定背景色，支持 alpha matting 精修发丝边缘。多种模型覆盖通用、人像、动漫等场景，首次使用自动下载。",
        inputs: [
          { name: "images", type: "IMAGE", from: "典型上游：人像或主体图", desc: "待抠图图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：合成或保存", desc: "去背景后的图像" }
        ],
        why: "抠图是合成的前置刚需，Rembg 一站式搞定并且质量稳定，是这个领域最常被引用的方案。",
        params: [
          { name: "model", kind: "下拉选择", default: "u2net", desc: "分割模型，u2net 通用，u2net_human_seg 人像，isnet-anime 动漫。" },
          { name: "transparency", kind: "开关", default: "开", desc: "是否输出透明通道。" },
          { name: "only_mask", kind: "开关", default: "关", desc: "开启后只输出主体遮罩而不抠图。" },
          { name: "post_processing", kind: "开关", default: "关", desc: "对遮罩做后处理平滑。" },
          { name: "alpha_matting", kind: "开关", default: "关", desc: "启用 alpha matting，改善毛发边缘。" },
          { name: "background_color", kind: "下拉选择", default: "none", desc: "填充背景色，none 保留透明。" }
        ],
        tips: ""
      },
      {
        name: "Image Remove Background (Alpha)", cat: "image",
        brief: "按亮度阈值生成透明背景。",
        desc: "按亮度阈值把背景与前景分离并生成 alpha 通道，不依赖 AI 模型，对纯色或高对比背景的图速度极快，mode 决定保留前景还是背景。",
        inputs: [
          { name: "images", type: "IMAGE", from: "典型上游：纯色背景图像", desc: "待处理图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：合成或保存", desc: "带透明通道的图像" }
        ],
        why: "对于背景干净的素材，阈值法比 AI 抠图更快也更可控。",
        params: [
          { name: "mode", kind: "下拉选择", default: "background", desc: "background 去除背景，foreground 去除前景。" },
          { name: "threshold", kind: "整数", default: "127", desc: "亮度分界阈值。" },
          { name: "threshold_tolerance", kind: "整数", default: "2", desc: "阈值容差，让边缘过渡更宽容。" }
        ],
        tips: ""
      },
      {
        name: "MiDaS Depth Approximation", cat: "image",
        brief: "从单张图估计深度输出深度图。",
        desc: "用 MiDaS 神经网络从单张图像推测场景深度，输出近白远黑的灰度深度图（可反转）。深度图是景深滤镜、SSAO 遮蔽、置换扭曲等一整套深度驱动效果的基础数据。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：任意图像", desc: "待估计的图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：景深、遮蔽或扭曲节点", desc: "灰度深度图" }
        ],
        why: "单目深度估计把二维图变成三维数据，是所有深度玩法的第一站。",
        params: [
          { name: "midas_type", kind: "下拉选择", default: "DPT_Large", desc: "模型规格，Large 精度高、Hybrid 速度快。" },
          { name: "use_cpu", kind: "开关", default: "关", desc: "是否用处理器跑，显存不足时开启。" },
          { name: "invert_depth", kind: "开关", default: "关", desc: "反转深度远近关系。" }
        ],
        tips: ""
      },
      {
        name: "MiDaS Mask Image", cat: "image",
        brief: "按深度自动分离前景与背景。",
        desc: "基于 MiDaS 深度估计自动抠出前景或背景，支持阈值化输出更干净的选区，可自定背景色填回。无需训练即可获得快速的主体分离，精度不及 Rembg 但胜在零依赖。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：任意图像", desc: "待分离图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：合成或保存", desc: "分离结果图像" },
          { type: "IMAGE", to: "典型下游：景深或遮蔽节点", desc: "深度图" }
        ],
        why: "深度天然携带前后关系，一刀切下去就是粗抠图，顺手深度图也拿到了。",
        params: [
          { name: "midas_type", kind: "下拉选择", default: "DPT_Large", desc: "深度模型规格。" },
          { name: "remove", kind: "下拉选择", default: "background", desc: "background 移除背景留前景，foregroud 反之。" },
          { name: "threshold", kind: "开关", default: "关", desc: "是否按双阈值把深度二值化。" },
          { name: "smoothing", kind: "浮点数", default: "0.25", desc: "边缘平滑程度。" }
        ],
        tips: ""
      },
      {
        name: "CLIPSeg Masking", cat: "image",
        brief: "按一句话文本分割出对应物体遮罩。",
        desc: "输入文本描述（例如 glasses），CLIPSeg 在图像中定位对应物体并输出遮罩。零样本、免训练，写什么分什么，是文本驱动抠图的经典方案。可接预加载的 CLIPSEG_MODEL 加速。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：任意图像", desc: "待分割图像" },
          { name: "text", type: "STRING", from: "典型上游：文本节点", desc: "要分割的目标描述" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：局部重绘或混合", desc: "目标物体遮罩" },
          { type: "IMAGE", to: "典型下游：预览或图像处理", desc: "遮罩的可视化图像" }
        ],
        why: "不用训练不用标注，一句话换一个分割目标，灵活性是阈值法与模型抠图都无法比的。",
        params: [],
        tips: ""
      },
      {
        name: "CLIPSeg Batch Masking", cat: "image",
        brief: "多组图文批量分割一次成型。",
        desc: "支持最多六组图像加文本同时分割，一次生成多张遮罩。给多主体分别建遮罩、或对批量图像执行同一分割时，免去复制多份节点。",
        inputs: [
          { name: "image_a", type: "IMAGE", from: "典型上游：待分割图像", desc: "第一路图像" },
          { name: "text_a", type: "STRING", from: "典型上游：文本节点", desc: "第一路目标描述" },
          { name: "image_b", type: "IMAGE", from: "同上", desc: "第二路图像" },
          { name: "text_b", type: "STRING", from: "同上", desc: "第二路描述" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：批处理节点", desc: "图像批次" },
          { type: "MASK", to: "典型下游：遮罩类节点", desc: "遮罩批次" },
          { type: "IMAGE", to: "典型下游：预览", desc: "遮罩可视化批次" }
        ],
        why: "批量场景下节点数量直接砍半，参数也更好维护。",
        params: [],
        tips: ""
      },
      {
        name: "CLIPSEG2", cat: "mask",
        brief: "CLIPSeg 的早期兼容实现。",
        desc: "同样按文本分割物体，是 CLIPSeg 系列的旧版实现：支持开关 CUDA 与可选的预加载模型，但输出为遮罩图像而非标准 MASK 类型。老工作流兼容用，新流程建议用 CLIPSeg Masking。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：任意图像", desc: "待分割图像" },
          { name: "text", type: "STRING", from: "典型上游：文本节点", desc: "目标描述" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：遮罩转图像类节点", desc: "遮罩图像" }
        ],
        why: "保留旧接口是为了老工作流不断线，功能上已被新版覆盖。",
        params: [
          { name: "use_cuda", kind: "开关", default: "关", desc: "是否使用显卡推理。" }
        ],
        tips: ""
      },
      {
        name: "SAM Parameters", cat: "mask",
        brief: "定义 SAM 的点提示参数。",
        desc: "以坐标点列表加标签（1 表示前景、0 表示背景）定义 SAM 的分割提示，输出 SAM_PARAMETERS 对象。配合坐标固定的场景或上游计算出的点位使用。",
        inputs: [],
        outputs: [
          { type: "SAM_PARAMETERS", to: "典型下游：SAM Image Mask", desc: "点提示参数对象" }
        ],
        why: "SAM 用点说话，这个节点把点变成可连线、可合并的数据。",
        params: [
          { name: "points", kind: "文本", default: "空", desc: "坐标点列表，格式为 x,y 一组一行或逗号分隔。" },
          { name: "labels", kind: "文本", default: "空", desc: "与点一一对应的标签，1 前景 0 背景。" }
        ],
        tips: ""
      },
      {
        name: "SAM Parameters Combine", cat: "mask",
        brief: "合并两组 SAM 点提示。",
        desc: "把两组 SAM_PARAMETERS 合并为一组，让 SAM 同时按多个点做分割。点提示可以来自不同来源，组合出更精确的目标描述。",
        inputs: [
          { name: "sam_parameters_a", type: "SAM_PARAMETERS", from: "典型上游：SAM Parameters", desc: "第一组点提示" },
          { name: "sam_parameters_b", type: "SAM_PARAMETERS", from: "同上", desc: "第二组点提示" }
        ],
        outputs: [
          { type: "SAM_PARAMETERS", to: "典型下游：SAM Image Mask", desc: "合并后的点提示" }
        ],
        why: "一次点不准的时候，把正负点组合起来是 SAM 的标准用法。",
        params: [],
        tips: ""
      },
      {
        name: "SAM Image Mask", cat: "mask",
        brief: "SAM 按点提示分割物体出遮罩。",
        desc: "接收 SAM 模型与点提示参数，在图像上执行 Segment Anything 分割，输出遮罩与可视化图像。精度高于阈值法，配合 CLIPSeg 或固定坐标可实现半自动精准选区。",
        inputs: [
          { name: "sam_model", type: "SAM_MODEL", from: "典型上游：SAM Model Loader", desc: "分割模型" },
          { name: "sam_parameters", type: "SAM_PARAMETERS", from: "典型上游：SAM Parameters", desc: "点提示" },
          { name: "image", type: "IMAGE", from: "典型上游：待分割图像", desc: "目标图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：预览或保存", desc: "分割可视化图像" },
          { type: "MASK", to: "典型下游：局部重绘或混合", desc: "目标物体遮罩" }
        ],
        why: "需要精确到物体轮廓的选区时，SAM 是开源方案里的天花板。",
        params: [],
        tips: ""
      },
      {
        name: "BLIP Analyze Image", cat: "clip",
        brief: "BLIP 自动写图注或回答提问。",
        desc: "用 BLIP 模型给图像生成自然语言描述，caption 模式自由作图注，interrogate 模式按提问回答。输出的文字可以反哺提示词、写进文件名或参与逻辑分支，是自动打标流程的核心。",
        inputs: [
          { name: "images", type: "IMAGE", from: "典型上游：任意图像", desc: "待分析图像" },
          { name: "blip_model", type: "BLIP_MODEL", from: "典型上游：BLIP Model Loader", desc: "图注模型" }
        ],
        outputs: [
          { type: "STRING", to: "典型下游：条件编码或保存", desc: "完整描述文本" },
          { type: "STRING", to: "典型下游：条件编码", desc: "不含标点的简洁描述" }
        ],
        why: "反推提示词、建立图库索引、自动写说明都依赖它，让图自己开口说话。",
        params: [
          { name: "mode", kind: "下拉选择", default: "caption", desc: "caption 生成图注，interrogate 按问题回答。" },
          { name: "question", kind: "文本", default: "空", desc: "interrogate 模式下的提问内容。" },
          { name: "min_length", kind: "整数", default: "24", desc: "描述的最短词数。" },
          { name: "max_length", kind: "整数", default: "48", desc: "描述的最长词数。" },
          { name: "num_beams", kind: "整数", default: "1", desc: "束搜索宽度，越大描述越稳越慢。" }
        ],
        tips: ""
      },
      {
        name: "Image to Latent Mask", cat: "mask",
        brief: "把图像通道转成潜空间遮罩格式。",
        desc: "从图像的 alpha、红、绿或蓝通道生成 MASK 类型数据。与内置的图转遮罩功能类似，方便在图像生态与遮罩生态之间转档。",
        inputs: [
          { name: "images", type: "IMAGE", from: "典型上游：灰度图或带透明通道的图", desc: "来源图像" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：局部重绘或遮罩处理", desc: "转换出的遮罩" }
        ],
        why: "遮罩与图像是两套格式，转档节点虽然不起眼但缺了就断线。",
        params: [
          { name: "channel", kind: "下拉选择", default: "alpha", desc: "取哪个通道作为遮罩来源。" }
        ],
        tips: ""
      },
      {
        name: "Image to Noise", cat: "image",
        brief: "把图像变成带结构的噪声图。",
        desc: "把图像压缩到少量颜色、混合黑场与高斯扰动后重新输出为噪声化的图，可作为初始噪声或纹理素材，让采样从图像结构出发而不是纯随机。",
        inputs: [
          { name: "images", type: "IMAGE", from: "典型上游：参考图像", desc: "噪声化来源图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：编码或混合进流程", desc: "噪声化图像" }
        ],
        why: "想让随机性里带一点参考图的影子，先把图变成噪声是最直接的桥。",
        params: [
          { name: "num_colors", kind: "整数", default: "16", desc: "保留的颜色数，越少结构越抽象。" },
          { name: "black_mix", kind: "整数", default: "0", desc: "混入黑色的比例。" },
          { name: "gaussian_mix", kind: "浮点数", default: "0.0", desc: "混入高斯噪声的比例。" },
          { name: "brightness", kind: "浮点数", default: "1.0", desc: "输出亮度系数。" },
          { name: "seed", kind: "整数", default: "0", desc: "扰动随机种子。" }
        ],
        tips: ""
      },
      {
        name: "Image to Seed", cat: "image",
        brief: "从图像计算一个稳定种子。",
        desc: "对图像内容做哈希计算输出一个整数种子。同一张图永远得到同一个种子，不同图得到不同种子，可实现每张参考图驱动一条固定的随机分支。",
        inputs: [
          { name: "images", type: "IMAGE", from: "典型上游：任意图像", desc: "取种子的图像" }
        ],
        outputs: [
          { type: "INT", to: "典型下游：采样器种子或数字节点", desc: "图像哈希种子" }
        ],
        why: "把图像身份变成数字，让随机分支跟着内容走而不是跟着运气走。",
        params: [],
        tips: ""
      },
      {
        name: "Image Size to Number", cat: "image",
        brief: "读取图像宽高输出多格式数值。",
        desc: "把图像宽与高分别以 NUMBER、FLOAT、INT 三种形式输出，共六个接口。尺寸接进运算或条件分支后，就能做出按尺寸路由、按比例换算等自动化逻辑。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：任意图像", desc: "取尺寸的图像" }
        ],
        outputs: [
          { type: "NUMBER", to: "典型下游：数值运算", desc: "宽与高的数值形式" },
          { type: "INT", to: "典型下游：整数参数节点", desc: "宽与高的整数形式" }
        ],
        why: "尺寸是最常用的图像元数据，变成连线数据后一切按尺寸自动化都有了入口。",
        params: [],
        tips: ""
      },
      {
        name: "Image Send HTTP", cat: "net",
        brief: "把图像 POST 到指定网络接口。",
        desc: "把图像通过 HTTP 请求发送到指定地址，支持 post、put、patch 方法，可自定义字段名与请求头，返回状态码与响应文本。把 ComfyUI 接进 Webhook、爬虫或自动化系统的桥梁。",
        inputs: [
          { name: "images", type: "IMAGE", from: "典型上游：任何图像输出", desc: "要发送的图像" }
        ],
        outputs: [
          { type: "INT", to: "典型下游：条件分支", desc: "HTTP 状态码" },
          { type: "STRING", to: "典型下游：文本处理", desc: "响应文本" }
        ],
        why: "成图之后的分发环节往往被忽略，它让工作流直接长在互联网上。",
        params: [
          { name: "url", kind: "文本", default: "空", desc: "接收图像的接口地址。" },
          { name: "method_type", kind: "下拉选择", default: "post", desc: "请求方法。" },
          { name: "request_field_name", kind: "文本", default: "image", desc: "图像字段的名称。" }
        ],
        tips: ""
      },
      {
        name: "Mask Invert", cat: "mask",
        brief: "遮罩黑白反转。",
        desc: "把遮罩的选区与排除区对调，原来看不见的地方变成选区。最常用的遮罩整理操作之一。",
        inputs: [
          { name: "masks", type: "MASK", from: "典型上游：任意遮罩来源", desc: "输入遮罩" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：局部重绘或混合", desc: "反转后的遮罩" }
        ],
        why: "工具输出的遮罩往往与需要的方向相反，反转一下就解决。",
        params: [],
        tips: ""
      },
      {
        name: "Masks Add", cat: "mask",
        brief: "两个遮罩相加合并选区。",
        desc: "把两个遮罩的白色区域相加成一张更大的选区，重合部分自动归一。扩大处理范围时的基本运算。",
        inputs: [
          { name: "masks_a", type: "MASK", from: "典型上游：遮罩来源一", desc: "第一个遮罩" },
          { name: "masks_b", type: "MASK", from: "典型上游：遮罩来源二", desc: "第二个遮罩" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：局部重绘或混合", desc: "合并后的遮罩" }
        ],
        why: "多区域处理的第一步是把各自的小选区并成一个大选区。",
        params: [],
        tips: ""
      },
      {
        name: "Masks Subtract", cat: "mask",
        brief: "从第一个遮罩中减去第二个遮罩。",
        desc: "大遮罩减去小遮罩得到环形或排除区遮罩，挖洞、去重合区域都靠它。",
        inputs: [
          { name: "masks_a", type: "MASK", from: "典型上游：大遮罩", desc: "被减的遮罩" },
          { name: "masks_b", type: "MASK", from: "典型上游：小遮罩", desc: "减去的遮罩" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：局部重绘或混合", desc: "差值遮罩" }
        ],
        why: "保护某个子区域不被处理时，减法比重新画一个环快得多。",
        params: [],
        tips: ""
      },
      {
        name: "Masks Combine Regions", cat: "mask",
        brief: "把最多六个遮罩合并成一张。",
        desc: "固定六个可选接口，把多条支路的遮罩合并成一张综合选区。与动态的 Mask Batch 不同，它适合接口数量固定的合成。",
        inputs: [
          { name: "mask_a", type: "MASK", from: "典型上游：遮罩来源", desc: "第一个遮罩，其余接口可选" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：局部重绘或混合", desc: "合并后的遮罩" }
        ],
        why: "遮罩版的多合一集线器，接口明确、接线清楚。",
        params: [],
        tips: ""
      },
      {
        name: "Masks Combine Batch", cat: "mask",
        brief: "把遮罩批次压缩合并成一张。",
        desc: "对整批遮罩逐像素求和并截断到 0 与 1 之间，把批次数据压成单张综合遮罩。分割模型输出多个目标的遮罩批次时，用它合并成总选区。",
        inputs: [
          { name: "masks", type: "MASK", from: "典型上游：遮罩批次", desc: "待合并的遮罩批次" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：局部重绘或混合", desc: "合并后的单张遮罩" }
        ],
        why: "批次进、单张出，是批量分割结果汇总成总选区的标准动作。",
        params: [],
        tips: ""
      },
      {
        name: "Mask Batch", cat: "mask",
        brief: "把多张遮罩合并成批次。",
        desc: "把若干路遮罩组成一个批次，接口动态可选，要求尺寸一致。与图像批次对应，供批量处理或 Combine Batch 类节点消费。",
        inputs: [
          { name: "masks_a", type: "MASK", from: "典型上游：遮罩来源", desc: "第一路遮罩，继续连线自动追加" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：批处理型遮罩节点", desc: "遮罩批次" }
        ],
        why: "批量化是大规模处理的前提，遮罩也需要一个集线器。",
        params: [],
        tips: ""
      },
      {
        name: "Mask Batch to Mask", cat: "mask",
        brief: "从遮罩批次中取出指定一张。",
        desc: "按序号从遮罩批次中抽取一张单独输出。分割批次里只想要某个目标、或只想检查其中一张时用。",
        inputs: [
          { name: "masks", type: "MASK", from: "典型上游：遮罩批次", desc: "批次数据" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：局部重绘或混合", desc: "选出的单张遮罩" }
        ],
        why: "批次与单张之间的双向通道之一，取号即取图。",
        params: [
          { name: "batch_number", kind: "整数", default: "0", desc: "要取出的批次序号，从 0 开始。" }
        ],
        tips: ""
      },
      {
        name: "Convert Masks to Images", cat: "mask",
        brief: "把遮罩转成黑白图像格式。",
        desc: "MASK 转 IMAGE，白色代表选区。转成图像后可以用图像节点查看、调色或继续处理，排查遮罩问题时的标准动作。",
        inputs: [
          { name: "masks", type: "MASK", from: "典型上游：任意遮罩", desc: "输入遮罩" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：预览或图像处理", desc: "遮罩的黑白图像形式" }
        ],
        why: "看不见的遮罩没法调试，转成图像就是给它开了个检视窗。",
        params: [],
        tips: ""
      },
      {
        name: "Mask Dominant Region", cat: "mask",
        brief: "只保留遮罩中最大的连通区域。",
        desc: "分析遮罩里的连通块，只保留面积最大的一块，散落的噪斑自动清除。让主体选区干净利落。",
        inputs: [
          { name: "masks", type: "MASK", from: "典型上游：分割或阈值遮罩", desc: "输入遮罩" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：局部重绘或混合", desc: "清理后的遮罩" }
        ],
        why: "自动生成的遮罩常带杂点，按面积筛选是最有效的清理方式。",
        params: [
          { name: "threshold", kind: "整数", default: "128", desc: "连通判定阈值。" }
        ],
        tips: ""
      },
      {
        name: "Mask Minority Region", cat: "mask",
        brief: "只保留遮罩中最小的连通区域。",
        desc: "与 Dominant 相反，保留面积最小的连通块。提取画面里的小瑕疵点、小物件选区时有奇用。",
        inputs: [
          { name: "masks", type: "MASK", from: "典型上游：任意遮罩", desc: "输入遮罩" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：局部重绘或混合", desc: "小区域遮罩" }
        ],
        why: "大区域好找，小区域难挑，反向筛选让小目标自己现形。",
        params: [
          { name: "threshold", kind: "整数", default: "128", desc: "连通判定阈值。" }
        ],
        tips: ""
      },
      {
        name: "Mask Crop Dominant Region", cat: "mask",
        brief: "裁出最大连通区域的包围盒。",
        desc: "在遮罩上找到最大连通块的包围盒并裁出该范围（可外扩），输出裁剪后的遮罩。把主体选区裁到最紧，供局部处理。",
        inputs: [
          { name: "masks", type: "MASK", from: "典型上游：任意遮罩", desc: "输入遮罩" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：局部重绘", desc: "包围盒内的遮罩" }
        ],
        why: "选区裁得越紧，下游处理的画面越小越快。",
        params: [
          { name: "padding", kind: "整数", default: "24", desc: "包围盒外扩像素数。" }
        ],
        tips: ""
      },
      {
        name: "Mask Crop Minority Region", cat: "mask",
        brief: "裁出最小连通区域的包围盒。",
        desc: "与裁最大区域相反，针对最小连通块裁出包围盒范围，把小目标定位出来单独处理。",
        inputs: [
          { name: "masks", type: "MASK", from: "典型上游：任意遮罩", desc: "输入遮罩" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：局部重绘", desc: "小目标区域的遮罩" }
        ],
        why: "小瑕疵的处理也要裁剪定位，流程逻辑与主体处理完全一致。",
        params: [
          { name: "padding", kind: "整数", default: "24", desc: "包围盒外扩像素数。" }
        ],
        tips: ""
      },
      {
        name: "Mask Crop Region", cat: "mask",
        brief: "裁剪遮罩区域并输出全部定位数据。",
        desc: "集大小区域裁剪于一身（region_type 选择最大或最小连通块），除了裁剪结果还输出 CROP_DATA 与上左下右宽高六个数值，配合 Mask Paste Region 完成精确回贴。",
        inputs: [
          { name: "mask", type: "MASK", from: "典型上游：任意遮罩", desc: "输入遮罩" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：局部处理", desc: "裁出的遮罩" },
          { type: "CROP_DATA", to: "典型下游：Mask Paste Region", desc: "定位数据" },
          { type: "INT", to: "典型下游：数值节点", desc: "包围盒上下左右与宽高数值" }
        ],
        why: "一个节点把遮罩裁剪的全部信息都吐出来，回贴与记录两不误。",
        params: [
          { name: "region_type", kind: "下拉选择", default: "dominant", desc: "dominant 最大连通块，minority 最小连通块。" },
          { name: "padding", kind: "整数", default: "24", desc: "包围盒外扩像素数。" }
        ],
        tips: ""
      },
      {
        name: "Mask Paste Region", cat: "mask",
        brief: "把局部遮罩按定位数据贴回原位。",
        desc: "接收 Mask Crop Region 输出的 CROP_DATA，把改好的局部遮罩对位贴回原遮罩，融合与锐化可调。遮罩版的裁出去改好了再贴回来。",
        inputs: [
          { name: "mask", type: "MASK", from: "典型上游：原遮罩", desc: "原遮罩" },
          { name: "crop_mask", type: "MASK", from: "典型上游：修改后的局部遮罩", desc: "局部遮罩" },
          { name: "crop_data", type: "CROP_DATA", from: "典型上游：Mask Crop Region", desc: "定位数据" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：局部重绘或混合", desc: "回贴后的遮罩" },
          { type: "MASK", to: "典型下游：调试查看", desc: "局部遮罩的副本" }
        ],
        why: "遮罩的局部修正也要能原位归队，这个节点补齐了遮罩版的裁贴闭环。",
        params: [
          { name: "crop_blending", kind: "浮点数", default: "0.25", desc: "边缘融合比例。" },
          { name: "crop_sharpening", kind: "整数", default: "0", desc: "贴入前锐化档位。" }
        ],
        tips: ""
      },
      {
        name: "Mask Fill Holes", cat: "mask",
        brief: "填补遮罩内部的孔洞。",
        desc: "把遮罩内部的白色空洞填成实心，让主体选区完整。分割结果有镂空时的一键补救。",
        inputs: [
          { name: "masks", type: "MASK", from: "典型上游：带孔洞的遮罩", desc: "输入遮罩" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：局部重绘或混合", desc: "填洞后的遮罩" }
        ],
        why: "镂空的选区会让重绘在洞里乱来，填洞是最直接的修正。",
        params: [],
        tips: ""
      },
      {
        name: "Mask Threshold Region", cat: "mask",
        brief: "双阈值把灰度遮罩二值化。",
        desc: "低于黑阈值的部分变 0，高于白阈值的部分变 1，两者之间线性过渡。给羽化过头的遮罩找回硬边，或给灰度图做干净的选区。",
        inputs: [
          { name: "masks", type: "MASK", from: "典型上游：灰度遮罩或图像转遮罩", desc: "输入遮罩" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：局部重绘或混合", desc: "二值化遮罩" }
        ],
        why: "干净的分界能避免半透明选区带来的重影，双阈值比单阈值多一段可控过渡。",
        params: [
          { name: "black_threshold", kind: "整数", default: "75", desc: "黑阈值，低于它变成 0。" },
          { name: "white_threshold", kind: "整数", default: "175", desc: "白阈值，高于它变成 1。" }
        ],
        tips: ""
      },
      {
        name: "Mask Smooth Region", cat: "mask",
        brief: "高斯平滑遮罩边缘。",
        desc: "对遮罩做高斯平滑，让锯齿边缘变得柔和。羽化选区、消除二值化痕迹的标准手段。",
        inputs: [
          { name: "masks", type: "MASK", from: "典型上游：任意遮罩", desc: "输入遮罩" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：局部重绘或混合", desc: "平滑后的遮罩" }
        ],
        why: "硬边遮罩贴图必留痕，柔边是一切自然融合的前提。",
        params: [
          { name: "sigma", kind: "浮点数", default: "5.0", desc: "高斯平滑强度。" }
        ],
        tips: ""
      },
      {
        name: "Mask Gaussian Region", cat: "mask",
        brief: "按半径对遮罩做高斯模糊。",
        desc: "与 Mask Smooth Region 效果相近，以更直观的 radius 参数控制模糊半径，常用于扩大羽化范围。",
        inputs: [
          { name: "masks", type: "MASK", from: "典型上游：任意遮罩", desc: "输入遮罩" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：局部重绘或混合", desc: "模糊后的遮罩" }
        ],
        why: "同族工具提供不同手感，radius 版更适合试参数。",
        params: [
          { name: "radius", kind: "浮点数", default: "5.0", desc: "模糊半径。" }
        ],
        tips: ""
      },
      {
        name: "Mask Dilate Region", cat: "mask",
        brief: "遮罩向外扩张。",
        desc: "形态学膨胀，让选区向外长大指定迭代次数。给重绘留余量、扩大保护区的常用操作。",
        inputs: [
          { name: "masks", type: "MASK", from: "典型上游：任意遮罩", desc: "输入遮罩" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：局部重绘或混合", desc: "扩张后的遮罩" }
        ],
        why: "遮罩略大于目标是局部重绘不出接缝的经验法则。",
        params: [
          { name: "iterations", kind: "整数", default: "5", desc: "膨胀迭代次数，每次扩一点。" }
        ],
        tips: ""
      },
      {
        name: "Mask Erode Region", cat: "mask",
        brief: "遮罩向内收缩。",
        desc: "形态学腐蚀，让选区向内缩进指定迭代次数，去掉边缘毛边与白边，与 Dilate 成对使用。",
        inputs: [
          { name: "masks", type: "MASK", from: "典型上游：任意遮罩", desc: "输入遮罩" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：局部重绘或混合", desc: "收缩后的遮罩" }
        ],
        why: "抠图边缘的白边靠收缩一步解决，比手工修边快太多。",
        params: [
          { name: "iterations", kind: "整数", default: "5", desc: "腐蚀迭代次数。" }
        ],
        tips: ""
      },
      {
        name: "Mask Ceiling Region", cat: "mask",
        brief: "提取遮罩最上缘生成顶面遮罩。",
        desc: "沿遮罩的上边界生成一条顶面选区，用于做天空上沿、物体顶面之类的特殊选区，是 Mask Tools 里的特色操作。",
        inputs: [
          { name: "masks", type: "MASK", from: "典型上游：任意遮罩", desc: "输入遮罩" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：局部重绘或混合", desc: "顶面遮罩" }
        ],
        why: "常规工具没有的取边玩法，需要时独一无二。",
        params: [],
        tips: ""
      },
      {
        name: "Mask Floor Region", cat: "mask",
        brief: "提取遮罩最下缘生成地面遮罩。",
        desc: "沿遮罩的下边界生成一条底部选区，常用于给人物或物体脚下添加接触阴影类的选区。",
        inputs: [
          { name: "masks", type: "MASK", from: "典型上游：任意遮罩", desc: "输入遮罩" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：局部重绘或混合", desc: "底面遮罩" }
        ],
        why: "与 Ceiling 成对，取底边做选区在构图上很实用。",
        params: [],
        tips: ""
      },
      {
        name: "Mask Arbitrary Region", cat: "mask",
        brief: "从边缘扩展出任意形状选区。",
        desc: "用 walkout 类算法从遮罩边缘按尺寸与阈值扩展出任意形状的区域，处理不规则、非凸形状选区的特色工具。",
        inputs: [
          { name: "masks", type: "MASK", from: "典型上游：任意遮罩", desc: "输入遮罩" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：局部重绘或混合", desc: "扩展出的区域遮罩" }
        ],
        why: "矩形与圆形解决不了的选区形状，交给它试试。",
        params: [
          { name: "size", kind: "整数", default: "256", desc: "扩展窗口尺寸。" },
          { name: "threshold", kind: "整数", default: "128", desc: "边界判定阈值。" }
        ],
        tips: ""
      },
      {
        name: "Mask Rect Area", cat: "mask",
        brief: "按坐标画一个矩形遮罩。",
        desc: "以 x、y 与宽高生成矩形选区，边缘可加模糊。最简单的遮罩生成器，做固定位置的选区就靠它。",
        inputs: [],
        outputs: [
          { type: "MASK", to: "典型下游：局部重绘或混合", desc: "矩形遮罩" }
        ],
        why: "所有遮罩操作里参数最少的一个，但在固定构图流程里出场率极高。",
        params: [
          { name: "x", kind: "整数", default: "0", desc: "矩形左上角横坐标。" },
          { name: "y", kind: "整数", default: "0", desc: "矩形左上角纵坐标。" },
          { name: "width", kind: "整数", default: "256", desc: "矩形宽度。" },
          { name: "height", kind: "整数", default: "256", desc: "矩形高度。" },
          { name: "blur_radius", kind: "整数", default: "0", desc: "边缘模糊半径。" }
        ],
        tips: ""
      },
      {
        name: "Mask Rect Area (Advanced)", cat: "mask",
        brief: "可指定画布尺寸的矩形遮罩。",
        desc: "与 Mask Rect Area 相同，但额外指定画布宽高，让遮罩尺寸与目标图像严格对齐，避免隐式默认尺寸带来的错位。",
        inputs: [],
        outputs: [
          { type: "MASK", to: "典型下游：局部重绘或混合", desc: "矩形遮罩" }
        ],
        why: "显式声明画布尺寸是多分辨率流程里避免玄学错位的关键。",
        params: [
          { name: "x", kind: "整数", default: "0", desc: "矩形左上角横坐标。" },
          { name: "y", kind: "整数", default: "0", desc: "矩形左上角纵坐标。" },
          { name: "width", kind: "整数", default: "256", desc: "矩形宽度。" },
          { name: "height", kind: "整数", default: "256", desc: "矩形高度。" },
          { name: "image_width", kind: "整数", default: "512", desc: "遮罩画布宽度。" },
          { name: "image_height", kind: "整数", default: "512", desc: "遮罩画布高度。" }
        ],
        tips: ""
      },
      {
        name: "Blend Latents", cat: "latent",
        brief: "在潜空间按多种模式混合两组数据。",
        desc: "把两份潜空间按 add、multiply、difference 等模式逐元素混合。图像层面的混合发生在采样之前，能产生真正的语义融合（例如两个人物的脸融在一起），比像素混合更内在。",
        inputs: [
          { name: "latent_a", type: "LATENT", from: "典型上游：编码或采样输出", desc: "第一份潜空间" },
          { name: "latent_b", type: "LATENT", from: "典型上游：另一路编码", desc: "第二份潜空间" }
        ],
        outputs: [
          { type: "LATENT", to: "典型下游：VAE 解码或继续采样", desc: "混合后的潜空间" }
        ],
        why: "潜空间混合出的是概念的融合，许多梦境感、双曝光效果只有这条路能走通。",
        params: [
          { name: "operation", kind: "下拉选择", default: "add", desc: "混合模式，含 multiply、screen、difference、random 等。" },
          { name: "blend", kind: "浮点数", default: "1.0", desc: "混合比例。" }
        ],
        tips: ""
      },
      {
        name: "Latent Batch", cat: "latent",
        brief: "把多路潜空间合并成批次。",
        desc: "把最多四路潜空间按批次维拼接，要求尺寸一致。供批量解码、批量继续采样或批量对比实验使用。",
        inputs: [
          { name: "latent_a", type: "LATENT", from: "典型上游：编码或采样输出", desc: "第一路，其余接口可选" }
        ],
        outputs: [
          { type: "LATENT", to: "典型下游：解码或采样", desc: "合并后的潜空间批次" }
        ],
        why: "想让多路结果一次解码一次看，批次合并就是那个集线器。",
        params: [],
        tips: ""
      },
      {
        name: "Latent Noise Injection", cat: "latent",
        brief: "向潜空间注入可控随机噪声。",
        desc: "给现有潜空间叠加标准差可控的高斯噪声，图生图增加变化、打破采样停滞、制造随机性时的小旋钮。",
        inputs: [
          { name: "samples", type: "LATENT", from: "典型上游：编码或上游采样", desc: "目标潜空间" }
        ],
        outputs: [
          { type: "LATENT", to: "典型下游：继续采样或解码", desc: "加噪后的潜空间" }
        ],
        why: "一撮噪声能让死板的图生图重新长出细节，强度全在你手里。",
        params: [
          { name: "noise_std", kind: "浮点数", default: "0.1", desc: "注入噪声的标准差，越大越乱。" }
        ],
        tips: ""
      },
      {
        name: "Latent Upscale by Factor (WAS)", cat: "latent",
        brief: "按倍数放大潜空间，多种插值可选。",
        desc: "对潜空间按倍数缩放，插值方式可选 area、bicubic、bilinear、nearest，对齐选项控制尺寸取整。高清修复流程里潜空间阶段的放大工具，与像素放大相比省显存。",
        inputs: [
          { name: "samples", type: "LATENT", from: "典型上游：采样输出", desc: "待放大的潜空间" }
        ],
        outputs: [
          { type: "LATENT", to: "典型下游：二次采样或解码", desc: "放大后的潜空间" }
        ],
        why: "放大后接低去噪采样是高清修复的标准二段式，这个节点是第一段的核心。",
        params: [
          { name: "mode", kind: "下拉选择", default: "area", desc: "插值算法，bicubic 细节更锐，bislerp 类风格更平滑。" },
          { name: "factor", kind: "浮点数", default: "2.0", desc: "放大倍数。" },
          { name: "align", kind: "开关", default: "开", desc: "插值对齐选项，影响边缘取样。" }
        ],
        tips: ""
      },
      {
        name: "Latent Size to Number", cat: "latent",
        brief: "读取潜空间尺寸输出多格式数值。",
        desc: "把潜空间的宽高输出为 NUMBER、FLOAT、INT 三种形式。潜空间尺寸是像素尺寸的八分之一，判断放大倍率、计算目标分辨率时有用。",
        inputs: [
          { name: "samples", type: "LATENT", from: "典型上游：编码或采样", desc: "取尺寸的潜空间" }
        ],
        outputs: [
          { type: "NUMBER", to: "典型下游：数值运算", desc: "宽高数值" },
          { type: "INT", to: "典型下游：整数参数", desc: "宽高整数" }
        ],
        why: "让下游知道当前潜空间多大，放大策略才能自动决策。",
        params: [],
        tips: ""
      },
      {
        name: "Tensor Batch to Image", cat: "image",
        brief: "从图像批次中取出指定一张。",
        desc: "按序号从批次张量中抽取单张图像。批量出图只想要某一张继续处理时，用它把批次拆回单图。",
        inputs: [
          { name: "images_batch", type: "IMAGE", from: "典型上游：批量生成结果", desc: "图像批次" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：单图处理节点", desc: "选出的单张图像" }
        ],
        why: "批次是打包发货，这个节点负责拆包裹。",
        params: [
          { name: "batch_image_number", kind: "整数", default: "0", desc: "要取出的序号，从 0 开始。" }
        ],
        tips: ""
      },
      {
        name: "KSampler (WAS)", cat: "sampler",
        brief: "标准采样器的种子连线复刻版。",
        desc: "采样参数与内置 KSampler 一致，差别在种子：接受 SEED 类型连线输入，可以接 Seed、Number to Seed 等节点的输出实现统一供种。其余用法完全照旧。",
        inputs: [
          { name: "model", type: "MODEL", from: "典型上游：模型链路", desc: "采样模型" },
          { name: "positive", type: "CONDITIONING", from: "典型上游：正面条件", desc: "正面条件" },
          { name: "negative", type: "CONDITIONING", from: "典型上游：负面条件", desc: "负面条件" },
          { name: "latent_image", type: "LATENT", from: "典型上游：初始潜空间", desc: "采样起点" }
        ],
        outputs: [
          { type: "LATENT", to: "典型下游：解码或二次采样", desc: "采样结果潜空间" }
        ],
        why: "种子从控件变成连线是多采样器协作的基础，这个节点让内置采样器也拥有这个能力。",
        params: [
          { name: "steps", kind: "整数", default: "20", desc: "去噪总步数。" },
          { name: "cfg", kind: "浮点数", default: "8.0", desc: "提示词服从度。" },
          { name: "sampler_name", kind: "下拉选择", default: "euler", desc: "采样算法，选项与内置一致。" },
          { name: "scheduler", kind: "下拉选择", default: "normal", desc: "调度器。" },
          { name: "denoise", kind: "浮点数", default: "1.0", desc: "去噪强度。" }
        ],
        tips: ""
      },
      {
        name: "KSampler Cycle", cat: "sampler",
        brief: "采样放大循环的渐进式高清修复器。",
        desc: "把采样、潜空间放大、再采样循环若干轮，每轮降低去噪强度，一轮比一轮精细，一个节点顶一整条放大链。可接入第二模型在指定轮次后切换，还支持附加正负条件与步数衰减等微调。",
        inputs: [
          { name: "model", type: "MODEL", from: "典型上游：模型链路", desc: "采样模型" },
          { name: "positive", type: "CONDITIONING", from: "典型上游：正面条件", desc: "正面条件" },
          { name: "negative", type: "CONDITIONING", from: "典型上游：负面条件", desc: "负面条件" },
          { name: "latent_image", type: "LATENT", from: "典型上游：初始潜空间", desc: "采样起点" },
          { name: "vae", type: "VAE", from: "典型上游：加载器", desc: "用于中途解码比对的解码器" }
        ],
        outputs: [
          { type: "LATENT", to: "典型下游：解码或继续处理", desc: "循环完成后的潜空间" }
        ],
        why: "渐进式放大是低显存出高分辨率的核心思路，循环参数化后不再需要手工接力。",
        params: [
          { name: "upscale_factor", kind: "浮点数", default: "2.0", desc: "每轮放大的倍数。" },
          { name: "upscale_cycles", kind: "整数", default: "2", desc: "循环轮数，2 到 12。" },
          { name: "starting_denoise", kind: "浮点数", default: "1.0", desc: "第一轮的去噪强度。" },
          { name: "cycle_denoise", kind: "浮点数", default: "0.5", desc: "后续各轮的去噪强度。" },
          { name: "scale_denoise", kind: "开关", default: "开", desc: "是否按轮次自动衰减去噪强度。" },
          { name: "latent_upscale", kind: "下拉选择", default: "disable", desc: "潜空间放大插值方式，disable 表示不做潜空间放大。" }
        ],
        tips: ""
      },
      {
        name: "Samples Passthrough (Stat System)", cat: "util",
        brief: "原样传递潜空间并打印统计信息。",
        desc: "数据完全透传，但会把潜空间的均值、方差等统计特征打印出来，帮助判断噪声水平是否正常。采样排查时的观察窗口。",
        inputs: [
          { name: "samples", type: "LATENT", from: "典型上游：采样或编码", desc: "透传的潜空间" }
        ],
        outputs: [
          { type: "LATENT", to: "典型下游：原下游节点", desc: "原样输出的潜空间" }
        ],
        why: "潜空间是看不见的黑盒，统计数字是唯一能直接阅读的健康指标。",
        params: [],
        tips: ""
      },
      {
        name: "CLIPTextEncode (NSP)", cat: "cond",
        brief: "支持面条汤提示词与通配符的条件编码。",
        desc: "在条件编码的同时解析 NSP 语法：花括号内随机二选一、双下划线引用词表文件，也可以切换成 Wildcards 模式。种子固定时随机结果可复现，输出解析前后的文本便于检查。",
        inputs: [
          { name: "clip", type: "CLIP", from: "典型上游：Checkpoint 加载器", desc: "文本编码器" }
        ],
        outputs: [
          { type: "CONDITIONING", to: "典型下游：采样器", desc: "编码后的条件" },
          { type: "STRING", to: "典型下游：文本处理", desc: "解析后的提示词" },
          { type: "STRING", to: "典型下游：文本处理", desc: "原始提示词" }
        ],
        why: "把随机组合写进提示词语法本身，批量探索要素组合时省掉大量手工排列。",
        params: [
          { name: "mode", kind: "下拉选择", default: "Noodle Soup Prompts", desc: "Noodle Soup Prompts 或 Wildcards 两种解析模式。" },
          { name: "noodle_key", kind: "文本", default: "__", desc: "词表引用的定界符。" },
          { name: "seed", kind: "整数", default: "0", desc: "解析随机种子，0 表示跟随全局随机。" },
          { name: "text", kind: "文本", default: "空", desc: "提示词正文，可含 NSP 与通配符标记。" }
        ],
        tips: ""
      },
      {
        name: "CLIPTextEncode (BlenderNeko Advanced + NSP)", cat: "cond",
        brief: "在高级权重语法上叠加 NSP 解析。",
        desc: "需要安装 BlenderNeko 高级 CLIP 扩展才会启用：提供 token 归一化与 A1111、compel 等权重解释方式，在此之上保留 NSP 与通配符解析。追求精细权重控制的随机提示词用户用它。",
        inputs: [
          { name: "clip", type: "CLIP", from: "典型上游：Checkpoint 加载器", desc: "文本编码器" }
        ],
        outputs: [
          { type: "CONDITIONING", to: "典型下游：采样器", desc: "编码后的条件" },
          { type: "STRING", to: "典型下游：文本处理", desc: "解析后的提示词" },
          { type: "STRING", to: "典型下游：文本处理", desc: "原始提示词" }
        ],
        why: "两个世界的合体：高级权重语法照顾出图质量，NSP 照顾批量实验。",
        params: [
          { name: "mode", kind: "下拉选择", default: "Noodle Soup Prompts", desc: "NSP 或 Wildcards 解析模式。" },
          { name: "token_normalization", kind: "下拉选择", default: "none", desc: "词元归一化方式。" },
          { name: "weight_interpretation", kind: "下拉选择", default: "comfy", desc: "权重语法解释方式，可选 A1111 与 compel。" },
          { name: "text", kind: "文本", default: "空", desc: "提示词正文。" }
        ],
        tips: ""
      },
      {
        name: "Text to Conditioning", cat: "cond",
        brief: "把上游文本直接编码成条件。",
        desc: "只有编码功能没有文本框，把连线传来的文本编码成 CONDITIONING。文本由文件、代码或其他节点生成时，它是最干净的编码入口。",
        inputs: [
          { name: "clip", type: "CLIP", from: "典型上游：Checkpoint 加载器", desc: "文本编码器" },
          { name: "text", type: "STRING", from: "典型上游：任意文本节点", desc: "待编码文本" }
        ],
        outputs: [
          { type: "CONDITIONING", to: "典型下游：采样器", desc: "编码后的条件" }
        ],
        why: "自动化流程里文本是数据不是常量，编码器也应该只吃连线。",
        params: [],
        tips: ""
      },
      {
        name: "Text Multiline", cat: "util",
        brief: "基础多行文本输入节点。",
        desc: "WAS 体系里最常用的文本源，支持多行书写，并内置行内变量与令牌语法（日期、计数等占位符运行时替换）。作为提示词模板、词库、任何文本常量的家。",
        inputs: [],
        outputs: [
          { type: "STRING", to: "典型下游：条件编码或文本处理", desc: "输入的文本" }
        ],
        why: "一切文本流程的起点，语法糖虽小，批量场景里省的是真工夫。",
        params: [
          { name: "text", kind: "文本", default: "空", desc: "多行文本内容，支持 WAS 的行内变量与令牌标记。" }
        ],
        tips: ""
      },
      {
        name: "Text Multiline (Code Compatible)", cat: "util",
        brief: "不转义换行的原始文本输入。",
        desc: "与 Text Multiline 相同，但不做换行符等字符的转义处理，保留原始字符。写代码、JSON 或需要精确控制换行符的场景用它。",
        inputs: [],
        outputs: [
          { type: "STRING", to: "典型下游：代码执行或文本处理", desc: "原始文本" }
        ],
        why: "普通文本节点会悄悄处理特殊字符，代码场景必须用原始版避免惊喜。",
        params: [
          { name: "text", kind: "文本", default: "空", desc: "原始多行文本。" }
        ],
        tips: ""
      },
      {
        name: "Text String", cat: "util",
        brief: "单行文本输入，附带多路回传。",
        desc: "一个单行文本框输出文本，另有三个可选输入可把其他文本原样回传成多路输出。把一段文本分发给多个下游时少拉转接节点。",
        inputs: [
          { name: "text_b", type: "STRING", from: "可选，任意文本", desc: "原样回传的第二路" }
        ],
        outputs: [
          { type: "STRING", to: "典型下游：条件编码或文本处理", desc: "面板输入的文本" },
          { type: "STRING", to: "典型下游：其他分支", desc: "回传的输入文本" }
        ],
        why: "输入与分发合一，画布上少一个节点就少一分乱。",
        params: [
          { name: "text", kind: "文本", default: "空", desc: "单行文本内容。" }
        ],
        tips: ""
      },
      {
        name: "String to Text", cat: "util",
        brief: "标准字符串转 WAS 文本格式。",
        desc: "把 STRING 连线转成 WAS 内部 TEXT 类型的适配器。老版本里两者类型不同，跨包连线时用它兜底。",
        inputs: [
          { name: "string", type: "STRING", from: "典型上游：任意文本输出", desc: "输入文本" }
        ],
        outputs: [
          { type: "STRING", to: "典型下游：WAS 文本节点", desc: "文本格式输出" }
        ],
        why: "类型适配器不起眼，但老工作流的兼容全靠它们。",
        params: [],
        tips: ""
      },
      {
        name: "Text to String", cat: "util",
        brief: "WAS 文本转标准字符串。",
        desc: "与 String to Text 方向相反的适配器，把 WAS 文本连线转成标准 STRING 输出，喂给其他节点包或内置节点。",
        inputs: [
          { name: "text", type: "STRING", from: "典型上游：WAS 文本节点", desc: "输入文本" }
        ],
        outputs: [
          { type: "STRING", to: "典型下游：任意文本输入", desc: "标准字符串输出" }
        ],
        why: "出 WAS 的门要换通行证，这一步换完天下通用。",
        params: [],
        tips: ""
      },
      {
        name: "Text List", cat: "util",
        brief: "把多段文本合并成列表。",
        desc: "最多七个可选文本输入，组成一个 LIST 输出。供支持列表的节点逐项处理，实现一次配置跑多条提示词。",
        inputs: [
          { name: "text_a", type: "STRING", from: "可选，任意文本", desc: "列表第一项" }
        ],
        outputs: [
          { type: "LIST", to: "典型下游：支持列表的节点", desc: "文本列表" }
        ],
        why: "列表是 ComfyUI 批处理的原生货币，这个节点负责铸币。",
        params: [],
        tips: ""
      },
      {
        name: "Text List Concatenate", cat: "util",
        brief: "把多个文本列表合并成一个。",
        desc: "把最多四个 LIST 输入按顺序串成一个更长的列表。多路词库合并成一条队列时用。",
        inputs: [
          { name: "list_a", type: "LIST", from: "典型上游：Text List", desc: "第一个列表" }
        ],
        outputs: [
          { type: "LIST", to: "典型下游：支持列表的节点", desc: "合并后的列表" }
        ],
        why: "列表的加法，让词库可以分头维护、统一消费。",
        params: [],
        tips: ""
      },
      {
        name: "Text List to Text", cat: "util",
        brief: "把列表按分隔符拼回文本。",
        desc: "把 LIST 的每一项用分隔符连接成一段文本。列表与文本两种形态之间的转换器。",
        inputs: [
          { name: "text_list", type: "LIST", from: "典型上游：Text List", desc: "输入列表" }
        ],
        outputs: [
          { type: "STRING", to: "典型下游：条件编码", desc: "拼接后的文本" }
        ],
        why: "批处理完想看整体效果，拼回文本一眼便知。",
        params: [
          { name: "delimiter", kind: "文本", default: ", ", desc: "各项之间的分隔符。" }
        ],
        tips: ""
      },
      {
        name: "Text Random Line", cat: "util",
        brief: "从多行文本中随机抽一行。",
        desc: "把输入文本按行拆开随机抽取一行输出，种子可锁定。轻量的词库随机方案，不用维护词表文件。",
        inputs: [
          { name: "text", type: "STRING", from: "典型上游：多行文本节点", desc: "候选文本" }
        ],
        outputs: [
          { type: "STRING", to: "典型下游：条件编码或拼接", desc: "随机选中的一行" }
        ],
        why: "每次生成换一句话，固定种子又能复现，随机与可控兼得。",
        params: [
          { name: "seed", kind: "整数", default: "0", desc: "随机种子，0 表示每次随机。" }
        ],
        tips: ""
      },
      {
        name: "Text Random Prompt", cat: "util",
        brief: "从 Lexica 词库随机抓取真实提示词。",
        desc: "按主题词调用 Lexica.art 图库接口，随机返回一条真实作品提示词，留空则随机选主题。给灵感枯竭的时刻投喂现成素材，需要联网。",
        inputs: [],
        outputs: [
          { type: "STRING", to: "典型下游：条件编码", desc: "随机抓取的提示词" }
        ],
        why: "看别人怎么写提示词是学习最快的方式，随机投喂刚好治选择困难。",
        params: [
          { name: "search_seed", kind: "文本", default: "空", desc: "搜索主题词，留空则随机选 portrait、landscape 等主题。" }
        ],
        tips: ""
      },
      {
        name: "Text Shuffle", cat: "util",
        brief: "按分隔符随机打乱文本片段。",
        desc: "把文本按分隔符拆成片段后随机重新排列，种子可锁。做词序实验、生成变体句式的小工具。",
        inputs: [
          { name: "text", type: "STRING", from: "典型上游：任意文本节点", desc: "待打乱的文本" }
        ],
        outputs: [
          { type: "STRING", to: "典型下游：条件编码", desc: "乱序后的文本" }
        ],
        why: "词序对画面影响不小，随机重排是廉价的变体生成器。",
        params: [
          { name: "separator", kind: "文本", default: ", ", desc: "拆分用的分隔符。" },
          { name: "seed", kind: "整数", default: "0", desc: "随机种子。" }
        ],
        tips: ""
      },
      {
        name: "Text Sort", cat: "util",
        brief: "按分隔符拆分后排序文本。",
        desc: "把文本按分隔符拆开排序再拼回去。整理词表、让对比实验的输入有序可循。",
        inputs: [
          { name: "text", type: "STRING", from: "典型上游：任意文本节点", desc: "待排序文本" }
        ],
        outputs: [
          { type: "STRING", to: "典型下游：条件编码", desc: "排序后的文本" }
        ],
        why: "有序输入让批量实验的记录对得上号。",
        params: [
          { name: "separator", kind: "文本", default: ", ", desc: "拆分用的分隔符。" }
        ],
        tips: ""
      },
      {
        name: "Text Compare", cat: "util",
        brief: "比较两段文本的相似或差异。",
        desc: "similarity 模式计算两段文本的相似度评分，difference 模式给出差异描述，tolerance 控制判定门槛。输出布尔与评分，让流程能根据文本一致性自动走分支。",
        inputs: [
          { name: "text_a", type: "STRING", from: "典型上游：文本来源一", desc: "比较基准" },
          { name: "text_b", type: "STRING", from: "典型上游：文本来源二", desc: "比较对象" }
        ],
        outputs: [
          { type: "STRING", to: "典型下游：任意文本输入", desc: "原样回传的文本 A" },
          { type: "STRING", to: "典型下游：任意文本输入", desc: "原样回传的文本 B" },
          { type: "BOOLEAN", to: "典型下游：逻辑或切换节点", desc: "是否达标" },
          { type: "NUMBER", to: "典型下游：数值节点", desc: "相似度评分" },
          { type: "STRING", to: "典型下游：显示或保存", desc: "比较结果描述" }
        ],
        why: "让流程自己判断两个提示词是不是一回事，是自动质检的起点。",
        params: [
          { name: "mode", kind: "下拉选择", default: "similarity", desc: "similarity 相似度，difference 差异描述。" },
          { name: "tolerance", kind: "浮点数", default: "1.0", desc: "判定阈值，相似度高于它才算通过。" }
        ],
        tips: ""
      },
      {
        name: "Text Contains", cat: "util",
        brief: "判断文本是否包含子串。",
        desc: "检查 text 里是否出现 sub_text，可忽略大小写，输出布尔值。配合各类切换节点实现按内容自动路由。",
        inputs: [
          { name: "text", type: "STRING", from: "典型上游：任意文本节点", desc: "被检查的文本" },
          { name: "sub_text", type: "STRING", from: "典型上游：文本节点", desc: "要找的子串" }
        ],
        outputs: [
          { type: "BOOLEAN", to: "典型下游：Input Switch 系列节点", desc: "是否包含" }
        ],
        why: "布尔值是流程分支的火花塞，这个节点负责点火。",
        params: [],
        tips: ""
      },
      {
        name: "Text Find", cat: "util",
        brief: "按子串或正则查找文本。",
        desc: "substring 非空时按普通子串查找，否则把 pattern 当正则表达式匹配，输出是否找到的布尔值。带正则能力的文本探测。",
        inputs: [
          { name: "text", type: "STRING", from: "典型上游：任意文本节点", desc: "被查找的文本" }
        ],
        outputs: [
          { type: "BOOLEAN", to: "典型下游：逻辑或切换节点", desc: "是否找到" }
        ],
        why: "比 Contains 多一个正则维度，结构化的文本检查全靠它。",
        params: [
          { name: "substring", kind: "文本", default: "空", desc: "普通子串查找目标，非空时优先。" },
          { name: "pattern", kind: "文本", default: "空", desc: "正则表达式，substring 为空时生效。" }
        ],
        tips: ""
      },
      {
        name: "Text Find and Replace Input", cat: "util",
        brief: "查找与替换的纯连线版本。",
        desc: "与 Text Find and Replace 相同，但查找内容与替换内容都由连线提供而非面板填写，还能输出替换发生的次数。替换规则动态变化的流程用它。",
        inputs: [
          { name: "text", type: "STRING", from: "典型上游：任意文本节点", desc: "待处理文本" },
          { name: "find", type: "STRING", from: "典型上游：文本节点", desc: "查找内容" },
          { name: "replace", type: "STRING", from: "典型上游：文本节点", desc: "替换内容" }
        ],
        outputs: [
          { type: "STRING", to: "典型下游：条件编码", desc: "替换后的文本" },
          { type: "NUMBER", to: "典型下游：数值节点", desc: "替换发生次数" }
        ],
        why: "替换规则也成为连线数据后，规则本身可以被计算出来。",
        params: [],
        tips: ""
      },
      {
        name: "Text Find and Replace by Dictionary", cat: "util",
        brief: "用字典批量替换并支持随机值。",
        desc: "按 replacement_key 指定的键从字典里取值，替换文本中的查找目标，值可以写成随机选项组实现变体。模板化提示词装配的进阶件。",
        inputs: [
          { name: "dictionary", type: "DICT", from: "典型上游：字典节点", desc: "替换字典" },
          { name: "text", type: "STRING", from: "典型上游：任意文本节点", desc: "待处理文本" }
        ],
        outputs: [
          { type: "STRING", to: "典型下游：条件编码", desc: "替换后的文本" }
        ],
        why: "字典驱动意味着替换规则可以集中管理、按需切换。",
        params: [
          { name: "replacement_key", kind: "文本", default: "空", desc: "字典里的键名。" },
          { name: "seed", kind: "整数", default: "0", desc: "随机值选取种子。" }
        ],
        tips: ""
      },
      {
        name: "Text String Truncate", cat: "util",
        brief: "按字符或词数截断文本。",
        desc: "从头部或尾部按指定长度截断，支持按字符数或词数计算，输出四路截断结果。清理超长提示词、压缩进文件名的实用工具。",
        inputs: [
          { name: "text", type: "STRING", from: "典型上游：任意文本节点", desc: "待截断文本" }
        ],
        outputs: [
          { type: "STRING", to: "典型下游：条件编码或保存", desc: "截断后的文本" }
        ],
        why: "提示词超长轻则失效重则报错，一截了之。",
        params: [
          { name: "truncate_by", kind: "下拉选择", default: "characters", desc: "characters 按字符，words 按词。" },
          { name: "truncate_from", kind: "下拉选择", default: "end", desc: "end 从尾部截断，beginning 从头部截断。" },
          { name: "truncate_to", kind: "整数", default: "20", desc: "保留的长度。" }
        ],
        tips: ""
      },
      {
        name: "Text Load Line From File", cat: "util",
        brief: "从文本文件按行读取并可自动推进。",
        desc: "读取指定文本文件，automatic 模式每次执行自动取下一行，index 模式按序号取行，内容同时存进字典供其他节点取用。把提示词库做成队列逐条消费的标配。",
        inputs: [],
        outputs: [
          { type: "STRING", to: "典型下游：条件编码", desc: "当前行文本" },
          { type: "DICT", to: "典型下游：字典节点", desc: "按行号索引的字典" }
        ],
        why: "外置词库意味着提示词的修改不用动工作流，运营思维进画布。",
        params: [
          { name: "file_path", kind: "文本", default: "空", desc: "文本文件路径。" },
          { name: "mode", kind: "下拉选择", default: "automatic", desc: "automatic 自动推进，index 按序号取。" },
          { name: "index", kind: "整数", default: "0", desc: "index 模式下取第几行，从 0 开始。" },
          { name: "dictionary_name", kind: "文本", default: "[filename]", desc: "字典输出的命名，默认用文件名。" }
        ],
        tips: ""
      },
      {
        name: "Save Text File", cat: "util",
        brief: "把文本保存为磁盘文件。",
        desc: "把连线传来的文本写到指定目录，文件名前缀、分隔符、编号位数、编码都可设置。记录每次使用的提示词、输出日志或导出词库。",
        inputs: [
          { name: "text", type: "STRING", from: "典型上游：任意文本节点", desc: "要保存的文本" }
        ],
        outputs: [],
        why: "出图要存，文本同样要存，尤其是实验记录。",
        params: [
          { name: "path", kind: "文本", default: "./ComfyUI/output/", desc: "保存目录。" },
          { name: "filename_prefix", kind: "文本", default: "ComfyUI", desc: "文件名前缀。" },
          { name: "filename_number_padding", kind: "整数", default: "4", desc: "编号补零位数。" },
          { name: "file_extension", kind: "文本", default: "txt", desc: "文件扩展名。" }
        ],
        tips: ""
      },
      {
        name: "Load Text File", cat: "util",
        brief: "读取整个文本文件。",
        desc: "读取文本文件全部内容输出，同时把每行文本存进字典供后续节点按键取用。与 Save Text File 一存一读配套。",
        inputs: [],
        outputs: [
          { type: "STRING", to: "典型下游：条件编码或文本处理", desc: "文件全文" },
          { type: "DICT", to: "典型下游：字典节点", desc: "按行组织的字典" }
        ],
        why: "外部词库、说明文件、参数表都能这样接入流程。",
        params: [
          { name: "file_path", kind: "文本", default: "空", desc: "文本文件路径。" },
          { name: "dictionary_name", kind: "文本", default: "[filename]", desc: "字典输出的命名。" }
        ],
        tips: ""
      },
      {
        name: "Text File History Loader", cat: "util",
        brief: "下拉载入 WAS 保存过的历史文本。",
        desc: "把 WAS 保存节点写过的文本文件整理成下拉列表，选中即重新载入。找回某次用过的提示词组合不用翻目录。",
        inputs: [],
        outputs: [
          { type: "STRING", to: "典型下游：条件编码或文本处理", desc: "历史文本内容" },
          { type: "DICT", to: "典型下游：字典节点", desc: "按行组织的字典" }
        ],
        why: "文本的历史记录与图像历史同样有价值，回溯成本几乎为零。",
        params: [
          { name: "file", kind: "下拉选择", default: "No History", desc: "历史文件列表。" },
          { name: "dictionary_name", kind: "文本", default: "[filename]", desc: "字典输出的命名。" }
        ],
        tips: ""
      },
      {
        name: "Text to Console", cat: "util",
        brief: "把文本打印到控制台并透传。",
        desc: "把文本内容打印到 ComfyUI 控制台，同时原样输出给下游。检查提示词链路最终送进编码器的真实内容，是最常用的文本监视器。",
        inputs: [
          { name: "text", type: "STRING", from: "典型上游：任意文本节点", desc: "待显示文本" }
        ],
        outputs: [
          { type: "STRING", to: "典型下游：原下游节点", desc: "原样透传的文本" }
        ],
        why: "看得见才能排查，透传设计让它可以常驻链路不碍事。",
        params: [
          { name: "label", kind: "文本", default: "Text", desc: "打印时的标签文字。" }
        ],
        tips: ""
      },
      {
        name: "Text Parse Noodle Soup Prompts", cat: "util",
        brief: "独立的 NSP 与通配符解析器。",
        desc: "把文本里的花括号随机项与双下划线词表引用替换成实际内容，模式与定界符可配，种子固定可复现。文本已由其他节点生成、只差随机展开时的补件。",
        inputs: [
          { name: "text", type: "STRING", from: "典型上游：任意文本节点", desc: "含标记的文本" }
        ],
        outputs: [
          { type: "STRING", to: "典型下游：条件编码", desc: "解析后的文本" }
        ],
        why: "编码与解析分离后，任何文本来源都能获得随机展开能力。",
        params: [
          { name: "mode", kind: "下拉选择", default: "Noodle Soup Prompts", desc: "NSP 或 Wildcards 模式。" },
          { name: "noodle_key", kind: "文本", default: "__", desc: "词表定界符。" },
          { name: "seed", kind: "整数", default: "0", desc: "解析种子，0 表示跟随随机。" }
        ],
        tips: ""
      },
      {
        name: "Text Parse Tokens", cat: "util",
        brief: "替换文本中的自定义令牌。",
        desc: "把文本里的 %令牌% 标记替换成 Text Add Tokens 登记的对应值。全局变量替换机制，改一处全流程生效。",
        inputs: [
          { name: "text", type: "STRING", from: "典型上游：任意文本节点", desc: "含令牌的文本" }
        ],
        outputs: [
          { type: "STRING", to: "典型下游：条件编码", desc: "替换后的文本" }
        ],
        why: "常用词抽成令牌统一维护，改风格词不用满画布找节点。",
        params: [],
        tips: ""
      },
      {
        name: "Text Add Tokens", cat: "util",
        brief: "登记令牌与值的对应表。",
        desc: "以 令牌=值 的格式登记自定义令牌，print 开关可在控制台查看当前全部令牌。配合 Text Parse Tokens 完成全局替换。",
        inputs: [],
        outputs: [],
        why: "令牌表是文本体系的变量区，登记一次全局可用。",
        params: [
          { name: "tokens", kind: "文本", default: "空", desc: "每行一条 令牌=值 的定义。" },
          { name: "print_current_tokens", kind: "开关", default: "关", desc: "执行时是否打印当前令牌表。" }
        ],
        tips: ""
      },
      {
        name: "Text Add Token by Input", cat: "util",
        brief: "用连线动态登记令牌。",
        desc: "令牌名与值都由连线传入，适合把运行时的数据（如种子、文件名）注册成令牌供其他文本引用。本身是输出节点，登记完即结束。",
        inputs: [
          { name: "token_name", type: "STRING", from: "典型上游：文本节点", desc: "令牌名" },
          { name: "token_value", type: "STRING", from: "典型上游：任意文本", desc: "令牌值" }
        ],
        outputs: [],
        why: "静态登记覆盖常量，动态登记覆盖变量，两者合起来才是完整体系。",
        params: [
          { name: "print_current_tokens", kind: "开关", default: "关", desc: "执行时是否打印当前令牌表。" }
        ],
        tips: ""
      },
      {
        name: "Text Parse A1111 Embeddings", cat: "util",
        brief: "转换 A1111 的 embedding 写法。",
        desc: "把 WebUI 风格的 embedding 标记转换成 ComfyUI 的 embedding:文件名 写法，从 WebUI 迁移过来的提示词不用手改。",
        inputs: [
          { name: "text", type: "STRING", from: "典型上游：迁移来的提示词", desc: "含 A1111 标记的文本" }
        ],
        outputs: [
          { type: "STRING", to: "典型下游：条件编码", desc: "转换后的文本" }
        ],
        why: "迁移成本最低的做法是让旧写法自动变新写法。",
        params: [],
        tips: ""
      },
      {
        name: "Prompt Styles Selector", cat: "util",
        brief: "下拉选择一套正负提示词样式。",
        desc: "读取 ComfyUI 的样式文件（styles.csv），选中一套样式后同时输出正面与负面两段文本。样式集中管理，比复制粘贴可靠。",
        inputs: [],
        outputs: [
          { type: "STRING", to: "典型下游：正面条件编码", desc: "样式的正面文本" },
          { type: "STRING", to: "典型下游：负面条件编码", desc: "样式的负面文本" }
        ],
        why: "常用的正负词组合固化成样式，切换风格一键完成。",
        params: [
          { name: "style", kind: "下拉选择", default: "第一套样式", desc: "样式列表，来自 ComfyUI 的 styles 文件。" }
        ],
        tips: ""
      },
      {
        name: "Prompt Multiple Styles Selector", cat: "util",
        brief: "同时组合最多四套提示词样式。",
        desc: "选择四个样式并把内容拼接输出，适合把质量词、画风、场景、镜头等分门别类维护后自由组合。",
        inputs: [],
        outputs: [
          { type: "STRING", to: "典型下游：正面条件编码", desc: "组合后的正面文本" },
          { type: "STRING", to: "典型下游：负面条件编码", desc: "组合后的负面文本" }
        ],
        why: "样式即积木，四个槽位足以拼出绝大多数配方。",
        params: [
          { name: "style1", kind: "下拉选择", default: "第一套样式", desc: "第一套样式。" },
          { name: "style2", kind: "下拉选择", default: "第一套样式", desc: "第二套样式。" },
          { name: "style3", kind: "下拉选择", default: "第一套样式", desc: "第三套样式。" },
          { name: "style4", kind: "下拉选择", default: "第一套样式", desc: "第四套样式。" }
        ],
        tips: ""
      },
      {
        name: "Text Dictionary New", cat: "util",
        brief: "用键值对创建字典对象。",
        desc: "提供最多五组键值对创建一个 DICT 字典。需要结构化数据或批量替换表的下游节点从这里拿到数据。",
        inputs: [],
        outputs: [
          { type: "DICT", to: "典型下游：字典类节点", desc: "创建的字典" }
        ],
        why: "字典是文本世界里的表格，配齐创建与查询才算完整工具箱。",
        params: [
          { name: "key_1", kind: "文本", default: "空", desc: "第一组的键。" },
          { name: "value_1", kind: "文本", default: "空", desc: "第一组的值，其余四组同构。" }
        ],
        tips: ""
      },
      {
        name: "Text Dictionary Update", cat: "util",
        brief: "合并两个字典，后者优先。",
        desc: "把字典 B 合并进字典 A，同名键以 B 为准。字典的组合运算，让默认值与覆盖值分层管理。",
        inputs: [
          { name: "dictionary_a", type: "DICT", from: "典型上游：字典节点", desc: "基础字典" },
          { name: "dictionary_b", type: "DICT", from: "典型上游：字典节点", desc: "覆盖字典" }
        ],
        outputs: [
          { type: "DICT", to: "典型下游：字典类节点", desc: "合并结果" }
        ],
        why: "配置分层（基础加覆盖）是管理复杂参数的通用模式。",
        params: [],
        tips: ""
      },
      {
        name: "Text Dictionary Get", cat: "util",
        brief: "按键从字典取值。",
        desc: "取出字典里指定键的值，键不存在时返回默认值。安全读取，不会因为缺键而断流程。",
        inputs: [
          { name: "dictionary", type: "DICT", from: "典型上游：字典节点", desc: "来源字典" },
          { name: "key", type: "STRING", from: "典型上游：文本节点", desc: "要取的键名" }
        ],
        outputs: [
          { type: "STRING", to: "典型下游：条件编码或文本处理", desc: "键对应的值" }
        ],
        why: "默认值兜底是自动化流程稳定运行的细节。",
        params: [
          { name: "default_value", kind: "文本", default: "空", desc: "键不存在时的返回值。" }
        ],
        tips: ""
      },
      {
        name: "Text Dictionary Keys", cat: "util",
        brief: "输出字典的全部键。",
        desc: "把字典的所有键组织成 LIST 输出。检查字典结构、或按键列表驱动循环处理时用。",
        inputs: [
          { name: "dictionary", type: "DICT", from: "典型上游：字典节点", desc: "来源字典" }
        ],
        outputs: [
          { type: "LIST", to: "典型下游：支持列表的节点", desc: "键名列表" }
        ],
        why: "键列表是遍历字典的入口。",
        params: [],
        tips: ""
      },
      {
        name: "Text Dictionary To Text", cat: "util",
        brief: "把字典序列化成文本。",
        desc: "把字典转成可读文本输出，方便保存、显示或交给文本节点处理。字典的导出口。",
        inputs: [
          { name: "dictionary", type: "DICT", from: "典型上游：字典节点", desc: "来源字典" }
        ],
        outputs: [
          { type: "STRING", to: "典型下游：保存或显示", desc: "序列化文本" }
        ],
        why: "结构化数据落盘前先变文本。",
        params: [],
        tips: ""
      },
      {
        name: "Text Dictionary Convert", cat: "util",
        brief: "把字典字面量文本转成字典。",
        desc: "把形如 Python 字典的字面量字符串解析成真正的 DICT 对象。外部文件或上游文本生成的字典数据从这里进门。",
        inputs: [
          { name: "dictionary_text", type: "STRING", from: "典型上游：文本节点或文件读取", desc: "字典格式文本" }
        ],
        outputs: [
          { type: "DICT", to: "典型下游：字典类节点", desc: "解析出的字典" }
        ],
        why: "文本进、结构出，外部数据源接入字典体系的转换头。",
        params: [],
        tips: ""
      },
      {
        name: "Constant Number", cat: "util",
        brief: "输出一个固定数值的三种形式。",
        desc: "面板设定一个数值，同时以 NUMBER、FLOAT、INT 三种类型输出。给任何需要连线数值的节点供数，是数字体系里的常量原点。",
        inputs: [],
        outputs: [
          { type: "NUMBER", to: "典型下游：数值运算或参数节点", desc: "通用数值" },
          { type: "FLOAT", to: "典型下游：浮点参数节点", desc: "浮点形式" },
          { type: "INT", to: "典型下游：整数参数节点", desc: "整数形式" }
        ],
        why: "把数值从控件变成连线，多个节点共用一个数才不用改三遍。",
        params: [
          { name: "number_type", kind: "下拉选择", default: "integer", desc: "面板数值的书写类型，integer 整数、float 小数、bool 布尔。" },
          { name: "number", kind: "浮点数", default: "0.0", desc: "常量数值。" }
        ],
        tips: ""
      },
      {
        name: "Random Number", cat: "util",
        brief: "按范围生成随机数。",
        desc: "在最小值与最大值之间生成随机数，类型可选整数、小数或布尔，种子可锁定复现。给参数加随机扰动的标准件。",
        inputs: [],
        outputs: [
          { type: "NUMBER", to: "典型下游：数值参数节点", desc: "随机数值" },
          { type: "INT", to: "典型下游：整数参数节点", desc: "整数形式" },
          { type: "FLOAT", to: "典型下游：浮点参数节点", desc: "浮点形式" }
        ],
        why: "随机化实验参数是打破套路的常用手段，范围与种子都可控才好用。",
        params: [
          { name: "number_type", kind: "下拉选择", default: "integer", desc: "输出类型，integer、float 或 bool。" },
          { name: "minimum", kind: "浮点数", default: "0.0", desc: "随机下界。" },
          { name: "maximum", kind: "浮点数", default: "1.0", desc: "随机上界。" },
          { name: "seed", kind: "整数", default: "0", desc: "随机种子，0 表示每次随机。" }
        ],
        tips: ""
      },
      {
        name: "True Random.org Number Generator", cat: "util",
        brief: "调用 random.org 在线真随机服务。",
        desc: "通过 random.org 的 API 获取基于大气噪声的真随机数，需要申请 API key，mode 可切换随机与固定。对随机性有仪式感或统计需求的用户适用，需要联网。",
        inputs: [],
        outputs: [
          { type: "NUMBER", to: "典型下游：数值参数节点", desc: "真随机数" },
          { type: "INT", to: "典型下游：整数参数节点", desc: "整数形式" },
          { type: "FLOAT", to: "典型下游：浮点参数节点", desc: "浮点形式" }
        ],
        why: "计算机随机数是伪随机，真随机服务给了追求随机纯粹性的选择。",
        params: [
          { name: "api_key", kind: "文本", default: "空", desc: "random.org 的 API key。" },
          { name: "minimum", kind: "浮点数", default: "0.0", desc: "随机下界。" },
          { name: "maximum", kind: "浮点数", default: "1.0", desc: "随机上界。" },
          { name: "mode", kind: "下拉选择", default: "random", desc: "random 每次取新数，fixed 固定。" }
        ],
        tips: ""
      },
      {
        name: "Number PI", cat: "util",
        brief: "输出圆周率常量。",
        desc: "输出圆周率的 NUMBER 与 FLOAT 两种形式。数学演示、比例计算的彩蛋级小工具。",
        inputs: [],
        outputs: [
          { type: "NUMBER", to: "典型下游：数值运算", desc: "圆周率" },
          { type: "FLOAT", to: "典型下游：浮点参数", desc: "浮点形式" }
        ],
        why: "工具箱里最没有实用压力也最有梗的一个。",
        params: [],
        tips: ""
      },
      {
        name: "Number Operation", cat: "util",
        brief: "两数四则运算与比较运算。",
        desc: "对两个连线数值执行加、减、乘、除、整除、幂、取模，以及大于、小于、等于等比较运算，结果以 NUMBER、FLOAT、INT 三种形式输出。搭建计算链的基础积木。",
        inputs: [
          { name: "number_a", type: "NUMBER", from: "典型上游：任意数值输出", desc: "第一个操作数" },
          { name: "number_b", type: "NUMBER", from: "典型上游：任意数值输出", desc: "第二个操作数" }
        ],
        outputs: [
          { type: "NUMBER", to: "典型下游：数值参数节点", desc: "运算结果" },
          { type: "INT", to: "典型下游：整数参数节点", desc: "整数形式" },
          { type: "FLOAT", to: "典型下游：浮点参数节点", desc: "浮点形式" }
        ],
        why: "分辨率换算、比例计算、计数推进都靠它串起来。",
        params: [
          { name: "operation", kind: "下拉选择", default: "addition", desc: "运算类型，涵盖四则、幂、模与各种比较。" }
        ],
        tips: ""
      },
      {
        name: "Number Multiple Of", cat: "util",
        brief: "把数字对齐到指定倍数。",
        desc: "把输入数值向上取整到 multiple 的整数倍。把任意计算结果对齐到 8 或 64 的倍数以适配潜空间，是分辨率计算链的收尾件。",
        inputs: [
          { name: "number", type: "NUMBER", from: "典型上游：任意数值输出", desc: "待对齐数值" }
        ],
        outputs: [
          { type: "NUMBER", to: "典型下游：分辨率参数节点", desc: "对齐后的数值" },
          { type: "INT", to: "典型下游：整数参数节点", desc: "整数形式" }
        ],
        why: "潜空间只认 8 的倍数，这一步不做出图必有噪点。",
        params: [
          { name: "multiple", kind: "整数", default: "8", desc: "对齐的目标倍数。" }
        ],
        tips: ""
      },
      {
        name: "Number Input Condition", cat: "util",
        brief: "按条件对两个数做判断与选择。",
        desc: "支持大于、等于、整除、奇偶、质数等十几种比较条件，可选择只输出布尔判断，或按条件在两路数值间选择。数字版的条件路由器。",
        inputs: [
          { name: "number_a", type: "NUMBER", from: "典型上游：任意数值输出", desc: "操作数 A" },
          { name: "number_b", type: "NUMBER", from: "典型上游：任意数值输出", desc: "操作数 B" }
        ],
        outputs: [
          { type: "NUMBER", to: "典型下游：数值参数节点", desc: "判断通过时输出 A，否则输出 B" },
          { type: "INT", to: "典型下游：整数参数节点", desc: "整数形式" },
          { type: "BOOLEAN", to: "典型下游：切换节点", desc: "return_boolean 开启时的判断结果" }
        ],
        why: "把如果这样否则那样写进连线，流程就有了自己的判断力。",
        params: [
          { name: "comparison", kind: "下拉选择", default: "greater-than", desc: "比较条件，含整除、奇偶、质数等特殊判断。" },
          { name: "return_boolean", kind: "开关", default: "关", desc: "开启后输出布尔值而不是选择数值。" }
        ],
        tips: ""
      },
      {
        name: "Number to Int", cat: "util",
        brief: "数值转整数。",
        desc: "把 NUMBER 数值截断为 INT 输出。类型适配的小转换器。",
        inputs: [
          { name: "number", type: "NUMBER", from: "典型上游：任意数值输出", desc: "输入数值" }
        ],
        outputs: [
          { type: "INT", to: "典型下游：整数参数节点", desc: "整数结果" }
        ],
        why: "接口类型不匹配时的小扳手，顺手但不可或缺。",
        params: [],
        tips: ""
      },
      {
        name: "Number to Float", cat: "util",
        brief: "数值转浮点。",
        desc: "把 NUMBER 数值转成 FLOAT 输出，与 Number to Int 成对。",
        inputs: [
          { name: "number", type: "NUMBER", from: "典型上游：任意数值输出", desc: "输入数值" }
        ],
        outputs: [
          { type: "FLOAT", to: "典型下游：浮点参数节点", desc: "浮点结果" }
        ],
        why: "同族的类型适配件。",
        params: [],
        tips: ""
      },
      {
        name: "Number to Seed", cat: "util",
        brief: "把数值包装成种子类型。",
        desc: "把 NUMBER 包装成 SEED 类型输出，专门喂给 KSampler (WAS) 等接受种子连线的节点。计算出来的种子从此可以连线。",
        inputs: [
          { name: "number", type: "NUMBER", from: "典型上游：任意数值输出", desc: "种子数值" }
        ],
        outputs: [
          { type: "SEED", to: "典型下游：KSampler (WAS) 的种子输入", desc: "种子类型输出" }
        ],
        why: "种子连线的最后一公里，类型对了线才接得上。",
        params: [],
        tips: ""
      },
      {
        name: "Number to String", cat: "util",
        brief: "数值转文本字符串。",
        desc: "把 NUMBER 转成 STRING 文本输出。数值写进提示词、文件名或日志的必经之路。旧版同功能节点名为 Number to Text，行为一致。",
        inputs: [
          { name: "number", type: "NUMBER", from: "典型上游：任意数值输出", desc: "输入数值" }
        ],
        outputs: [
          { type: "STRING", to: "典型下游：文本拼接或编码", desc: "文本形式数值" }
        ],
        why: "数字要与文字混排，先过这个门。",
        params: [],
        tips: ""
      },
      {
        name: "Text to Number", cat: "util",
        brief: "把数字文本解析成数值。",
        desc: "把连线传来的文本解析为 NUMBER 输出，无法解析时报警并返回 0。外部数据进数值运算的入口。",
        inputs: [
          { name: "text", type: "STRING", from: "典型上游：文本节点或文件", desc: "数字文本" }
        ],
        outputs: [
          { type: "NUMBER", to: "典型下游：数值运算", desc: "解析出的数值" }
        ],
        why: "文本与数值两个世界的海关。",
        params: [],
        tips: ""
      },
      {
        name: "Boolean To Text", cat: "util",
        brief: "布尔值转 true 或 false 文本。",
        desc: "把 BOOLEAN 转成 true 或 false 的文本输出，写日志、拼提示词条件都用得上。",
        inputs: [
          { name: "boolean", type: "BOOLEAN", from: "典型上游：逻辑节点", desc: "输入布尔" }
        ],
        outputs: [
          { type: "STRING", to: "典型下游：文本处理", desc: "true 或 false 文本" }
        ],
        why: "布尔值也想上墙，靠它变文字。",
        params: [],
        tips: ""
      },
      {
        name: "Integer place counter", cat: "util",
        brief: "输出整数有几位数。",
        desc: "返回输入整数是几位数（例如 1234 输出 4）。给编号补零逻辑、命名规则判断提供位数信息。",
        inputs: [
          { name: "int_input", type: "INT", from: "典型上游：计数器或随机数", desc: "输入整数" }
        ],
        outputs: [
          { type: "INT", to: "典型下游：数值运算或命名逻辑", desc: "位数数值" }
        ],
        why: "文件命名想按位数变化时，它是那个不起眼的关键件。",
        params: [],
        tips: ""
      },
      {
        name: "Hex to HSL", cat: "util",
        brief: "十六进制色值转 HSL 分量。",
        desc: "把 #RRGGBB 形式的色值解析出色相、饱和度、明度分量输出，可附带 alpha。颜色在数值层面被拆解后就能参与运算与渐变。",
        inputs: [],
        outputs: [
          { type: "INT", to: "典型下游：数值运算", desc: "色相、饱和度、明度分量" },
          { type: "STRING", to: "典型下游：文本处理", desc: "hsl 形式的文本" }
        ],
        why: "颜色变成数字才能被程序化地调整与组合。",
        params: [
          { name: "hex_color", kind: "文本", default: "#FFFFFF", desc: "十六进制颜色值。" },
          { name: "include_alpha", kind: "开关", default: "关", desc: "是否解析 alpha 通道。" }
        ],
        tips: ""
      },
      {
        name: "HSL to Hex", cat: "util",
        brief: "把 HSL 文本转回十六进制色值。",
        desc: "把 hsl 格式的颜色文本转成十六进制色值输出。与 Hex to HSL 成对，颜色运算完成后的回程票。",
        inputs: [],
        outputs: [
          { type: "STRING", to: "典型下游：文本处理或配色输出", desc: "十六进制色值文本" }
        ],
        why: "运算完的颜色要变回标准格式才能被下游使用。",
        params: [
          { name: "hsl_color", kind: "文本", default: "空", desc: "hsl 格式的颜色文本。" }
        ],
        tips: ""
      },
      {
        name: "Logic Boolean", cat: "util",
        brief: "面板布尔开关，多形式输出。",
        desc: "面板上一个 0 到 1 的滑杆，四舍五入后输出 BOOLEAN、NUMBER、INT、FLOAT 多种形式。逻辑链路的手动总开关。",
        inputs: [],
        outputs: [
          { type: "BOOLEAN", to: "典型下游：切换节点或逻辑运算", desc: "布尔结果" },
          { type: "INT", to: "典型下游：数值参数节点", desc: "0 或 1 的整数形式" }
        ],
        why: "想手动控制一条分支的通断，从它开始。",
        params: [
          { name: "boolean", kind: "浮点数", default: "1.0", desc: "0 到 1 的值，四舍五入为布尔。" }
        ],
        tips: ""
      },
      {
        name: "Logic Boolean Primitive", cat: "util",
        brief: "面板布尔原语，直出开关值。",
        desc: "与 Logic Boolean 类似但只输出 BOOLEAN，输入就是真正的布尔控件，语义更直白。",
        inputs: [],
        outputs: [
          { type: "BOOLEAN", to: "典型下游：切换节点或逻辑运算", desc: "布尔输出" }
        ],
        why: "逻辑链路里最简单的起点，开或关。",
        params: [
          { name: "boolean", kind: "开关", default: "关", desc: "布尔开关。" }
        ],
        tips: ""
      },
      {
        name: "Logic Comparison AND", cat: "util",
        brief: "两路布尔的与运算。",
        desc: "两个输入都为真才输出真。多条条件同时满足才放行的场景用。",
        inputs: [
          { name: "boolean_a", type: "BOOLEAN", from: "典型上游：任意布尔输出", desc: "条件一" },
          { name: "boolean_b", type: "BOOLEAN", from: "典型上游：任意布尔输出", desc: "条件二" }
        ],
        outputs: [
          { type: "BOOLEAN", to: "典型下游：切换节点或继续运算", desc: "与运算结果" }
        ],
        why: "复合条件的粘合剂。",
        params: [],
        tips: ""
      },
      {
        name: "Logic Comparison OR", cat: "util",
        brief: "两路布尔的或运算。",
        desc: "任一输入为真即输出真。多来源信号汇总触发时用。",
        inputs: [
          { name: "boolean_a", type: "BOOLEAN", from: "典型上游：任意布尔输出", desc: "条件一" },
          { name: "boolean_b", type: "BOOLEAN", from: "典型上游：任意布尔输出", desc: "条件二" }
        ],
        outputs: [
          { type: "BOOLEAN", to: "典型下游：切换节点或继续运算", desc: "或运算结果" }
        ],
        why: "多条路都能触发同一条流程时用它合并。",
        params: [],
        tips: ""
      },
      {
        name: "Logic Comparison XOR", cat: "util",
        brief: "两路布尔的异或运算。",
        desc: "两个输入恰好一真一假时输出真。判断两路信号是否分歧的小工具。",
        inputs: [
          { name: "boolean_a", type: "BOOLEAN", from: "典型上游：任意布尔输出", desc: "条件一" },
          { name: "boolean_b", type: "BOOLEAN", from: "典型上游：任意布尔输出", desc: "条件二" }
        ],
        outputs: [
          { type: "BOOLEAN", to: "典型下游：切换节点或继续运算", desc: "异或结果" }
        ],
        why: "不多见的运算符，但判断互斥状态时刚好。",
        params: [],
        tips: ""
      },
      {
        name: "Logic NOT", cat: "util",
        brief: "布尔取反。",
        desc: "把输入的布尔值反转输出。让某条分支在条件不成立时启用的简单办法。",
        inputs: [
          { name: "boolean", type: "BOOLEAN", from: "典型上游：任意布尔输出", desc: "输入布尔" }
        ],
        outputs: [
          { type: "BOOLEAN", to: "典型下游：切换节点", desc: "取反结果" }
        ],
        why: "不是的意思，逻辑里最便宜的反转。",
        params: [],
        tips: ""
      },
      {
        name: "Image Input Switch", cat: "util",
        brief: "按布尔值在两路图像间切换。",
        desc: "布尔为真输出 image_a，为假输出 image_b。配合 Logic Boolean 或条件节点，可以让流程自动选择图像来源。",
        inputs: [
          { name: "image_a", type: "IMAGE", from: "典型上游：图像来源一", desc: "真值时的输出" },
          { name: "image_b", type: "IMAGE", from: "典型上游：图像来源二", desc: "假值时的输出" },
          { name: "boolean", type: "BOOLEAN", from: "典型上游：Logic Boolean", desc: "切换条件" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：任意图像输入", desc: "选中的图像" }
        ],
        why: "A 与 B 方案自动二选一，流程分支的第一块积木。",
        params: [],
        tips: ""
      },
      {
        name: "Model Input Switch", cat: "util",
        brief: "按布尔值在两路模型间切换。",
        desc: "在两个 MODEL 连线间按布尔条件切换输出。不同底模的整体切换不必重新接线。",
        inputs: [
          { name: "model_a", type: "MODEL", from: "典型上游：模型加载链路", desc: "真值时的输出" },
          { name: "model_b", type: "MODEL", from: "典型上游：另一路模型", desc: "假值时的输出" },
          { name: "boolean", type: "BOOLEAN", from: "典型上游：Logic Boolean", desc: "切换条件" }
        ],
        outputs: [
          { type: "MODEL", to: "典型下游：采样器", desc: "选中的模型" }
        ],
        why: "底模对比实验的自动切换台。",
        params: [],
        tips: ""
      },
      {
        name: "CLIP Input Switch", cat: "util",
        brief: "按布尔值在两路 CLIP 间切换。",
        desc: "在两个 CLIP 文本编码器连线间按布尔条件切换输出，换编码器方案时不必拔线。",
        inputs: [
          { name: "clip_a", type: "CLIP", from: "典型上游：加载器", desc: "真值时的输出" },
          { name: "clip_b", type: "CLIP", from: "典型上游：另一路", desc: "假值时的输出" },
          { name: "boolean", type: "BOOLEAN", from: "典型上游：Logic Boolean", desc: "切换条件" }
        ],
        outputs: [
          { type: "CLIP", to: "典型下游：条件编码节点", desc: "选中的编码器" }
        ],
        why: "编码器方案的自动切换件。",
        params: [],
        tips: ""
      },
      {
        name: "CLIP Vision Input Switch", cat: "util",
        brief: "按布尔值在两路 CLIP Vision 间切换。",
        desc: "在两个视觉编码器之间按布尔条件切换，图像引导流程的方案切换件。",
        inputs: [
          { name: "clip_vision_a", type: "CLIP_VISION", from: "典型上游：视觉模型加载", desc: "真值时的输出" },
          { name: "clip_vision_b", type: "CLIP_VISION", from: "同上", desc: "假值时的输出" },
          { name: "boolean", type: "BOOLEAN", from: "典型上游：Logic Boolean", desc: "切换条件" }
        ],
        outputs: [
          { type: "CLIP_VISION", to: "典型下游：图像引导条件节点", desc: "选中的视觉编码器" }
        ],
        why: "视觉模型也有 A 与 B。",
        params: [],
        tips: ""
      },
      {
        name: "VAE Input Switch", cat: "util",
        brief: "按布尔值在两路 VAE 间切换。",
        desc: "在两个解码器之间按布尔条件切换，对比内置与外挂 VAE 效果时省去拔线。",
        inputs: [
          { name: "vae_a", type: "VAE", from: "典型上游：加载器", desc: "真值时的输出" },
          { name: "vae_b", type: "VAE", from: "同上", desc: "假值时的输出" },
          { name: "boolean", type: "BOOLEAN", from: "典型上游：Logic Boolean", desc: "切换条件" }
        ],
        outputs: [
          { type: "VAE", to: "典型下游：编码解码节点", desc: "选中的解码器" }
        ],
        why: "VAE 影响色彩，切换对比是最常用的排查手段。",
        params: [],
        tips: ""
      },
      {
        name: "Conditioning Input Switch", cat: "util",
        brief: "按布尔值在两路条件间切换。",
        desc: "在两组正负条件之间按布尔条件切换输出，不同提示词方案的整体切换件。",
        inputs: [
          { name: "conditioning_a", type: "CONDITIONING", from: "典型上游：条件编码", desc: "真值时的输出" },
          { name: "conditioning_b", type: "CONDITIONING", from: "同上", desc: "假值时的输出" },
          { name: "boolean", type: "BOOLEAN", from: "典型上游：Logic Boolean", desc: "切换条件" }
        ],
        outputs: [
          { type: "CONDITIONING", to: "典型下游：采样器", desc: "选中的条件" }
        ],
        why: "提示词方案切换的最小颗粒度。",
        params: [],
        tips: ""
      },
      {
        name: "Latent Input Switch", cat: "util",
        brief: "按布尔值在两路潜空间间切换。",
        desc: "在两个 LATENT 连线间按布尔条件切换输出，多分支采样结果的选择器。",
        inputs: [
          { name: "latent_a", type: "LATENT", from: "典型上游：采样或编码", desc: "真值时的输出" },
          { name: "latent_b", type: "LATENT", from: "同上", desc: "假值时的输出" },
          { name: "boolean", type: "BOOLEAN", from: "典型上游：Logic Boolean", desc: "切换条件" }
        ],
        outputs: [
          { type: "LATENT", to: "典型下游：解码或二次采样", desc: "选中的潜空间" }
        ],
        why: "潜空间层面的方案合并。",
        params: [],
        tips: ""
      },
      {
        name: "Lora Input Switch", cat: "util",
        brief: "按布尔值在两组模型编码器间切换。",
        desc: "同时切换 model 与 clip 两路连线，等于在两套 LoRA 配方之间整体切换。输出是一对连线的开关。",
        inputs: [
          { name: "model_a", type: "MODEL", from: "典型上游：LoRA 链路一", desc: "真值时的模型" },
          { name: "clip_a", type: "CLIP", from: "同上", desc: "真值时的编码器" },
          { name: "model_b", type: "MODEL", from: "典型上游：LoRA 链路二", desc: "假值时的模型" },
          { name: "clip_b", type: "CLIP", from: "同上", desc: "假值时的编码器" },
          { name: "boolean", type: "BOOLEAN", from: "典型上游：Logic Boolean", desc: "切换条件" }
        ],
        outputs: [
          { type: "MODEL", to: "典型下游：采样器", desc: "选中的模型" },
          { type: "CLIP", to: "典型下游：条件编码", desc: "选中的编码器" }
        ],
        why: "LoRA 配方切换要成对切换才不会错位，它把成对变成一个动作。",
        params: [],
        tips: ""
      },
      {
        name: "Upscale Model Switch", cat: "util",
        brief: "按布尔值在两个放大模型间切换。",
        desc: "在两个 UPSCALE_MODEL 之间按布尔条件切换，不同放大方案的自动选择件。",
        inputs: [
          { name: "upscale_model_a", type: "UPSCALE_MODEL", from: "典型上游：放大模型加载", desc: "真值时的输出" },
          { name: "upscale_model_b", type: "UPSCALE_MODEL", from: "同上", desc: "假值时的输出" },
          { name: "boolean", type: "BOOLEAN", from: "典型上游：Logic Boolean", desc: "切换条件" }
        ],
        outputs: [
          { type: "UPSCALE_MODEL", to: "典型下游：放大节点", desc: "选中的放大模型" }
        ],
        why: "放大模型的选择也可以自动化。",
        params: [],
        tips: ""
      },
      {
        name: "Control Net Model Input Switch", cat: "util",
        brief: "按布尔值在两个控制网模型间切换。",
        desc: "在两个 CONTROL_NET 之间按布尔条件切换输出。同一结构控制下换控制网方案的切换件。",
        inputs: [
          { name: "control_net_a", type: "CONTROL_NET", from: "典型上游：控制网加载", desc: "真值时的输出" },
          { name: "control_net_b", type: "CONTROL_NET", from: "同上", desc: "假值时的输出" },
          { name: "boolean", type: "BOOLEAN", from: "典型上游：Logic Boolean", desc: "切换条件" }
        ],
        outputs: [
          { type: "CONTROL_NET", to: "典型下游：控制网应用节点", desc: "选中的控制网" }
        ],
        why: "控制方案切换从拔线变成一个布尔信号。",
        params: [],
        tips: ""
      },
      {
        name: "Text Input Switch", cat: "util",
        brief: "按布尔值在两段文本间切换。",
        desc: "在两个文本连线之间按布尔条件切换输出。多语言提示词、多方案词组的自动选择件。",
        inputs: [
          { name: "text_a", type: "STRING", from: "典型上游：文本节点", desc: "真值时的输出" },
          { name: "text_b", type: "STRING", from: "典型上游：文本节点", desc: "假值时的输出" },
          { name: "boolean", type: "BOOLEAN", from: "典型上游：Logic Boolean", desc: "切换条件" }
        ],
        outputs: [
          { type: "STRING", to: "典型下游：条件编码或文本处理", desc: "选中的文本" }
        ],
        why: "文本分支的轻量开关。",
        params: [],
        tips: ""
      },
      {
        name: "Number Input Switch", cat: "util",
        brief: "按布尔值在两个数值间切换。",
        desc: "在两路数值连线之间按布尔条件切换，输出 NUMBER、FLOAT、INT 三种形式。参数档位切换的数字开关。",
        inputs: [
          { name: "number_a", type: "NUMBER", from: "典型上游：任意数值输出", desc: "真值时的输出" },
          { name: "number_b", type: "NUMBER", from: "典型上游：任意数值输出", desc: "假值时的输出" },
          { name: "boolean", type: "BOOLEAN", from: "典型上游：Logic Boolean", desc: "切换条件" }
        ],
        outputs: [
          { type: "NUMBER", to: "典型下游：数值参数节点", desc: "选中的数值" },
          { type: "INT", to: "典型下游：整数参数节点", desc: "整数形式" }
        ],
        why: "参数组切换的数字版本。",
        params: [],
        tips: ""
      },
      {
        name: "Bus Node", cat: "util",
        brief: "把模型条件等数据打包成一条总线。",
        desc: "把模型、编码器、解码器、正负条件五路数据收进一条 BUS 线传递，下一站再用另一个 Bus Node 拆包。跨越大半个画布的五条平行线从此变成一条，改线也只动总线。",
        inputs: [
          { name: "bus", type: "BUS", from: "可选，上游 Bus Node", desc: "承接上游总线，未连接的部分由本节点输入填充" },
          { name: "model", type: "MODEL", from: "典型上游：加载器", desc: "打包的模型" },
          { name: "clip", type: "CLIP", from: "典型上游：加载器", desc: "打包的编码器" },
          { name: "vae", type: "VAE", from: "典型上游：加载器", desc: "打包的解码器" },
          { name: "positive", type: "CONDITIONING", from: "典型上游：正面编码", desc: "打包的正面条件" },
          { name: "negative", type: "CONDITIONING", from: "典型上游：负面编码", desc: "打包的负面条件" }
        ],
        outputs: [
          { type: "BUS", to: "典型下游：下一个 Bus Node", desc: "打包后的总线" },
          { type: "MODEL", to: "典型下游：采样器", desc: "展开输出的模型" },
          { type: "CLIP", to: "典型下游：条件编码", desc: "展开输出的编码器" },
          { type: "VAE", to: "典型下游：解码节点", desc: "展开输出的解码器" },
          { type: "CONDITIONING", to: "典型下游：采样器", desc: "展开输出的正负条件" }
        ],
        why: "总线思路与 rgthree 的 Context 类似，是画布防蜘蛛网的经典手段。",
        params: [],
        tips: ""
      },
      {
        name: "Cache Node", cat: "util",
        brief: "把潜空间图像条件缓存到磁盘。",
        desc: "把上游数据序列化保存到本地缓存目录，文件名由后缀参数拼出，并输出三个文件路径文本。与 Load Cache 配对，让昂贵环节的计算结果跨执行复用。",
        inputs: [
          { name: "latent", type: "LATENT", from: "可选，采样或编码输出", desc: "要缓存的潜空间" },
          { name: "image", type: "IMAGE", from: "可选，任意图像", desc: "要缓存的图像" },
          { name: "conditioning", type: "CONDITIONING", from: "可选，条件编码", desc: "要缓存的条件" }
        ],
        outputs: [
          { type: "STRING", to: "典型下游：Load Cache", desc: "三个缓存文件的路径文本" }
        ],
        why: "缓存是省时间的最直接手段，重复跑图时收效立竿见影。",
        params: [
          { name: "latent_suffix", kind: "文本", default: "空", desc: "潜空间缓存文件的后缀命名。" },
          { name: "image_suffix", kind: "文本", default: "空", desc: "图像缓存文件的后缀命名。" },
          { name: "conditioning_suffix", kind: "文本", default: "空", desc: "条件缓存文件的后缀命名。" },
          { name: "output_path", kind: "文本", default: "默认缓存目录", desc: "缓存输出目录。" }
        ],
        tips: ""
      },
      {
        name: "Load Cache", cat: "util",
        brief: "读回磁盘上的缓存数据。",
        desc: "按文件路径把 Cache Node 保存的潜空间、图像或条件读回流程。调试下游时跳过上游计算，或复用昨天跑好的昂贵中间结果。",
        inputs: [],
        outputs: [
          { type: "LATENT", to: "典型下游：解码或采样", desc: "读回的潜空间" },
          { type: "IMAGE", to: "典型下游：图像处理", desc: "读回的图像" },
          { type: "CONDITIONING", to: "典型下游：采样器", desc: "读回的条件" }
        ],
        why: "与 Cache Node 一存一取，中间结果的价值被真正留住。",
        params: [
          { name: "latent_path", kind: "文本", default: "空", desc: "潜空间缓存文件路径。" },
          { name: "image_path", kind: "文本", default: "空", desc: "图像缓存文件路径。" },
          { name: "conditioning_path", kind: "文本", default: "空", desc: "条件缓存文件路径。" }
        ],
        tips: ""
      },
      {
        name: "Export API", cat: "util",
        brief: "把当前工作流导出为 API 格式 JSON。",
        desc: "把工作流序列化成 ComfyUI 的 API 格式 JSON 文件保存到磁盘，可附带当前提示词内容。外部程序拿这个文件就能直接提交执行队列，是搭建自动化生产线的出口。",
        inputs: [],
        outputs: [],
        why: "让工作流离开画布也能被程序驱动，批量系统集成的桥梁。",
        params: [
          { name: "save_prompt_api", kind: "开关", default: "关", desc: "是否把当前提示词一并写入导出文件。" },
          { name: "output_path", kind: "文本", default: "./ComfyUI/output/", desc: "导出目录。" },
          { name: "filename_prefix", kind: "文本", default: "workflow_API", desc: "文件名前缀。" },
          { name: "parse_text_tokens", kind: "开关", default: "关", desc: "导出前是否解析文本令牌。" }
        ],
        tips: ""
      },
      {
        name: "Debug Number to Console", cat: "util",
        brief: "把数值打印到控制台并透传。",
        desc: "把连线数值打印到控制台，同时原样输出。数字链路排查的眼睛，确认计数器、随机数等是否符合预期。",
        inputs: [
          { name: "number", type: "NUMBER", from: "典型上游：任意数值输出", desc: "待显示数值" }
        ],
        outputs: [
          { type: "NUMBER", to: "典型下游：原下游节点", desc: "原样透传的数值" }
        ],
        why: "打印一行胜过猜测十分钟。",
        params: [
          { name: "label", kind: "文本", default: "Number", desc: "打印时的标签文字。" }
        ],
        tips: ""
      },
      {
        name: "Dictionary to Console", cat: "util",
        brief: "把字典打印到控制台。",
        desc: "把字典内容完整打印到控制台，方便检查键值对是否符合预期。字典链路的调试窗。",
        inputs: [
          { name: "dictionary", type: "DICT", from: "典型上游：字典节点", desc: "待显示字典" }
        ],
        outputs: [
          { type: "DICT", to: "典型下游：原下游节点", desc: "原样透传的字典" }
        ],
        why: "结构化数据更需要随时可看。",
        params: [
          { name: "label", kind: "文本", default: "Dictionary", desc: "打印时的标签文字。" }
        ],
        tips: ""
      },
      {
        name: "Create Morph Image", cat: "video",
        brief: "把两张图交叉淡化合成动图。",
        desc: "在两张图之间生成指定帧数的渐变过渡并输出 GIF 或 APNG 动画文件，可控制停留时长、循环次数与最大边长，同时输出两路原图与文件路径。",
        inputs: [
          { name: "image_a", type: "IMAGE", from: "典型上游：起始图像", desc: "过渡起点" },
          { name: "image_b", type: "IMAGE", from: "典型上游：结束图像", desc: "过渡终点" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：预览或继续处理", desc: "起始图像回传" },
          { type: "IMAGE", to: "典型下游：预览", desc: "结束图像回传" },
          { type: "STRING", to: "典型下游：文本处理", desc: "输出路径与文件名文本" }
        ],
        why: "两张图的渐变动画一条流程搞定，做展示与动效很顺手。",
        params: [
          { name: "transition_frames", kind: "整数", default: "30", desc: "过渡帧数。" },
          { name: "duration_ms", kind: "浮点数", default: "1000.0", desc: "总时长（毫秒）。" },
          { name: "loops", kind: "整数", default: "0", desc: "循环次数，0 表示无限循环。" },
          { name: "max_size", kind: "整数", default: "512", desc: "输出最长边像素上限。" },
          { name: "filetype", kind: "下拉选择", default: "GIF", desc: "GIF 或 APNG 格式。" }
        ],
        tips: ""
      },
      {
        name: "Create Morph Image from Path", cat: "video",
        brief: "把目录图像序列合成渐变动图。",
        desc: "与 Create Morph Image 相同，但图像来源改为按目录与通配符扫描的文件序列，多张图依序渐变。",
        inputs: [],
        outputs: [
          { type: "STRING", to: "典型下游：文本处理", desc: "输出路径与文件名文本" }
        ],
        why: "序列帧素材直接变动画，无需逐张加载。",
        params: [
          { name: "input_path", kind: "文本", default: "./ComfyUI/input/", desc: "输入图像目录。" },
          { name: "input_pattern", kind: "文本", default: "*", desc: "文件名通配符。" },
          { name: "transition_frames", kind: "整数", default: "30", desc: "过渡帧数。" },
          { name: "output_path", kind: "文本", default: "./ComfyUI/output/", desc: "输出目录。" },
          { name: "filetype", kind: "下拉选择", default: "GIF", desc: "GIF 或 APNG 格式。" }
        ],
        tips: ""
      },
      {
        name: "Write to GIF", cat: "video",
        brief: "把图像批次写成 GIF 动图。",
        desc: "把上游传来的批次图像逐帧写成 GIF 文件，帧间过渡、停留时长、循环与尺寸可调。批次结果一键变动画。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：批量生成结果", desc: "作为帧的图像批次" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：预览", desc: "回传的批次图像" },
          { type: "STRING", to: "典型下游：文本处理", desc: "输出路径与文件名文本" }
        ],
        why: "逐帧渐变动画与快速预览动图的通用出口。",
        params: [
          { name: "transition_frames", kind: "整数", default: "30", desc: "帧间过渡帧数。" },
          { name: "image_delay_ms", kind: "浮点数", default: "0.0", desc: "每帧停留毫秒数。" },
          { name: "duration_ms", kind: "浮点数", default: "1000.0", desc: "总时长（毫秒）。" },
          { name: "loops", kind: "整数", default: "0", desc: "循环次数，0 表示无限。" },
          { name: "max_size", kind: "整数", default: "512", desc: "最长边像素上限。" }
        ],
        tips: ""
      },
      {
        name: "Write to Video", cat: "video",
        brief: "把图像批次写成视频文件。",
        desc: "用 FFmpeg 把图像批次编码成视频，帧率、时长、尺寸与编码器可调，默认支持 mp4v 与 ffv1 编码，配置后可扩展更多格式。需要先在 WAS 配置文件里指定 ffmpeg 路径。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：批量生成结果", desc: "作为帧的图像批次" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：预览", desc: "回传的批次图像" },
          { type: "STRING", to: "典型下游：文本处理", desc: "输出路径与文件名文本" }
        ],
        why: "AI 视频与动画流程的最后一环，直接出可播放的视频。",
        params: [
          { name: "fps", kind: "整数", default: "30", desc: "视频帧率。" },
          { name: "max_size", kind: "整数", default: "512", desc: "最长边像素上限。" },
          { name: "codec", kind: "下拉选择", default: "mp4v", desc: "视频编码器。" },
          { name: "output_path", kind: "文本", default: "./ComfyUI/output", desc: "输出目录。" },
          { name: "filename", kind: "文本", default: "comfy_writer", desc: "输出文件名。" }
        ],
        tips: ""
      },
      {
        name: "Create Video from Path", cat: "video",
        brief: "把目录图像序列直接合成视频。",
        desc: "扫描输入目录里的图像序列，用 FFmpeg 编码成视频文件。与 Write to Video 的区别是图像来自磁盘而不是连线批次。",
        inputs: [],
        outputs: [
          { type: "STRING", to: "典型下游：文本处理", desc: "输出路径与文件名文本" }
        ],
        why: "已有帧序列的场景少一次加载，直接落成视频。",
        params: [
          { name: "input_path", kind: "文本", default: "./ComfyUI/input", desc: "帧序列目录。" },
          { name: "fps", kind: "整数", default: "30", desc: "视频帧率。" },
          { name: "codec", kind: "下拉选择", default: "mp4v", desc: "视频编码器。" },
          { name: "output_path", kind: "文本", default: "./ComfyUI/output", desc: "输出目录。" },
          { name: "filename", kind: "文本", default: "comfy_video", desc: "输出文件名。" }
        ],
        tips: ""
      },
      {
        name: "Video Dump Frames", cat: "video",
        brief: "把视频逐帧导出为图像。",
        desc: "用 FFmpeg 把视频文件拆成逐帧图像，输出目录、文件名前缀、编号位数与格式可设，同时输出实际处理帧数。逆向取材，把视频变成可处理的帧序列。",
        inputs: [],
        outputs: [
          { type: "STRING", to: "典型下游：文本处理", desc: "输出目录路径文本" },
          { type: "NUMBER", to: "典型下游：数值节点", desc: "导出的帧数" }
        ],
        why: "视频再创作的第一步是把帧拿回来，之后逐帧重绘或插值都自由了。",
        params: [
          { name: "video_path", kind: "文本", default: "./ComfyUI/input/MyVideo.mp4", desc: "视频文件路径。" },
          { name: "output_path", kind: "文本", default: "./ComfyUI/input/MyVideo", desc: "帧输出目录。" },
          { name: "prefix", kind: "文本", default: "frame_", desc: "帧文件名前缀。" },
          { name: "extension", kind: "下拉选择", default: "png", desc: "帧图像格式。" },
          { name: "filenumber_digits", kind: "整数", default: "4", desc: "编号补零位数，-1 表示自动。" }
        ],
        tips: ""
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
