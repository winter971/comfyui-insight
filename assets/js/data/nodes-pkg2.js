(function () {
  "use strict";
  window.COMFY_DATA = window.COMFY_DATA || {};
  window.COMFY_DATA.nodePackages = window.COMFY_DATA.nodePackages || [];

  // ---------- 1. ComfyUI-Manager ----------
  window.COMFY_DATA.nodePackages.push({
    id: "comfyui-manager",
    name: "ComfyUI-Manager",
    author: "Dr.Lt.Data / ltdrdata",
    official: false,
    category: "节点管理",
    install: "多数整合包和官方桌面版已自带；也可手动把仓库克隆到 ComfyUI 的 custom_nodes 目录后重启",
    summary: "需要先说明：ComfyUI-Manager 严格来说不是图节点包，而是 ComfyUI 的管理器，它呈现为一个菜单界面，而不是画布上的节点。它负责自定义节点的安装与更新、模型下载、缺失节点检测和依赖修复，是几乎所有用户装好 ComfyUI 后第一件安上的装备。本页把它的核心功能单元当作节点来介绍，方便你弄清每个按钮到底做了什么。",
    why: "没有它，装节点要手动克隆仓库、敲 pip 命令装依赖、报错自己排查；有了它，这些全变成按钮操作。它把 ComfyUI 庞大社区生态的大门打开，让不懂命令行的人也能安全地扩展 ComfyUI。",
    tags: ["管理", "安装", "环境"],
    nodes: [
      {
        name: "Install Custom Nodes",
        cat: "util",
        brief: "浏览节点库并一键安装第三方自定义节点包。",
        desc: "这是 ComfyUI-Manager 最常用的功能。打开后是一个可搜索的自定义节点列表，展示包名、作者、安装量、与当前 ComfyUI 版本的兼容状态等信息。选中一个包点安装，它会自动克隆仓库、安装 Python 依赖，然后提示重启 ComfyUI。对不懂原理的人可以把它理解成一个图形化的应用商店，只不过卖的是节点包。安装完成后，新节点会出现在画布右键菜单或双击搜索里。",
        inputs: [],
        outputs: [],
        why: "ComfyUI 核心节点只有几十个，修脸、控图、视频等能力几乎全靠社区节点包扩展，这个入口决定了你能多容易地接入整个生态。",
        tips: "优先选安装量大、维护活跃的包；装完务必按提示重启 ComfyUI，否则新节点不会出现。"
      },
      {
        name: "Install Models",
        cat: "util",
        brief: "浏览模型库并按类别一键下载大模型、LoRA 等文件。",
        desc: "它内置了一个模型数据库，按大模型、LoRA、VAE、ControlNet、放大模型、动画模型等类别整理，可以直接搜索社区来源的模型并选择下载到哪个目录。它知道每类模型应放到 models 下哪个子文件夹，避免手动下载后放错位置导致节点找不到模型。下载进度和失败重试也在界面里完成。可以把它理解为带正确路径提示的模型下载器。",
        inputs: [],
        outputs: [],
        why: "模型文件动辄几 GB、类别多、存放路径要求严格，手动管理容易出错，这个功能把选模型、下模型、放模型三步合并成一步。",
        tips: "下载前留意模型的许可证和用途限制；列表里没有的模型也可以手动下载后放入 models 对应子目录再刷新。"
      },
      {
        name: "Fetch Updates",
        cat: "util",
        brief: "检查已装节点包和 ComfyUI 本体是否有可用更新。",
        desc: "点击后它会逐个访问已安装自定义节点的代码仓库，比较本地版本和远端最新版本，并在列表里标记哪些包有更新。它只做检查不自动改代码，真正更新由你在节点管理界面逐个确认。对不懂原理的人可以把它理解为应用商店里的检查更新按钮。",
        inputs: [],
        outputs: [],
        why: "社区节点更新频繁，修复缺陷和适配新模型都靠更新；定期检查更新能少踩很多别人已经修过的坑。",
        tips: "更新 ComfyUI 本体之后建议先获取更新再更新各节点包，避免新旧接口不匹配；重要任务跑到一半时不要更新节点。"
      },
      {
        name: "Update ComfyUI",
        cat: "util",
        brief: "把 ComfyUI 主程序更新到最新版本。",
        desc: "通过 git 拉取 ComfyUI 主仓库的最新代码，重启后生效。新版本常带来新的采样器、新模型支持和性能优化，但偶尔也有破坏性改动，让旧节点暂时不兼容。它和 Fetch Updates 的区别是：这个更新 ComfyUI 本体，那个更新各个插件包。",
        inputs: [],
        outputs: [],
        why: "很多新模型和新节点都要求较新的 ComfyUI 版本，长期不更新会逐渐出现装得上却跑不动的兼容问题。",
        tips: "更新前记下当前可用版本号，出问题可以用 git 回退；建议在两批任务之间更新，不要在任务中途动环境。"
      },
      {
        name: "Check Missing Nodes",
        cat: "util",
        brief: "打开他人工作流时找出并补装缺失的节点包。",
        desc: "当你加载别人分享的工作流图片或 JSON 时，如果里面用了你没装的节点，会出现红色节点或弹窗提示。ComfyUI-Manager 能列出缺失节点分别来自哪些包，并提供一键安装缺失节点的按钮。装好并重启后，原本报错的工作流通常就能直接跑通。这是分享和复用工作流时最重要的功能。",
        inputs: [],
        outputs: [],
        why: "复用社区工作流几乎必然遇到缺节点，没有它你要对着一个个红色节点猜来源，有它就是一次点击的事。",
        tips: "分享时尽量用自带工作流信息的 PNG 或 JSON；补装后如果仍有红色节点，试试修复依赖或手动重装对应包。"
      },
      {
        name: "Fix Dependencies",
        cat: "util",
        brief: "节点因缺 Python 依赖而报错时尝试自动修复。",
        desc: "自定义节点依赖特定的 Python 库，如果安装失败或版本不对，节点会无法导入并在控制台报导入错误。ComfyUI-Manager 检测到导入失败的节点时，会弹出对话框并提供尝试修复按钮，自动重装缺失或损坏的依赖并给出诊断信息。多数导入失败问题都能靠它解决，省去手动敲命令。",
        inputs: [],
        outputs: [],
        why: "依赖问题是新手装节点最常见的失败原因，报错又往往是英文技术细节，一键修复能救命。",
        tips: "修复后务必重启 ComfyUI 再验证；反复失败时把控制台完整报错复制去搜索或提交 issue。"
      },
      {
        name: "Snapshot Manager",
        cat: "util",
        brief: "保存和恢复当前全部节点包版本的快照。",
        desc: "它把当前所有已安装自定义节点的版本和提交记录保存成一个快照文件，之后可以一键恢复到这个状态。当你想更新某个包又担心弄坏现有工作流时，先打快照再动手，出问题随时回滚。也可以把快照分享给别人，让对方复现和你一致的节点环境。",
        inputs: [],
        outputs: [],
        why: "环境一致性是稳定出图的前提，快照相当于给节点环境做系统还原点，是任何折腾之前的保险。",
        tips: "每次大更新前先保存快照；恢复快照后同样需要重启 ComfyUI 才生效。"
      },
      {
        name: "Install via Git URL",
        cat: "util",
        brief: "粘贴仓库地址，直接安装未被收录的节点包。",
        desc: "有些新包或小众包还没进节点库，或者你想安装某个仓库的特定分支版本，这时可以把 GitHub 仓库地址粘贴进来直接克隆安装。它执行的流程和普通安装一样：克隆代码、安装依赖、提示重启。地址通常就是仓库主页的 https 链接。",
        inputs: [],
        outputs: [],
        why: "节点库的收录有延迟，这个入口保证你总能装到最新发布的包，不受收录进度限制。",
        tips: "只安装信任来源的代码；如果依赖安装失败，看控制台输出按提示处理。"
      }
    ]
  });

  // ---------- 2. ComfyUI-Impact-Pack ----------
  window.COMFY_DATA.nodePackages.push({
    id: "impact-pack",
    name: "ComfyUI-Impact-Pack",
    author: "ltdrdata",
    official: false,
    category: "检测与自动修图",
    install: "在 ComfyUI-Manager 里搜索 Impact Pack 一键安装",
    summary: "ComfyUI-Impact-Pack 是检测与自动修图类工作流的基石，作者和 ComfyUI-Manager 同为 ltdrdata。它把目标检测模型引入 ComfyUI，用 SEGS（Segments，区域段数据，一组带裁剪图和遮罩的检测区域）描述图中找到的人脸、人体等区域，再对这些小区域自动做放大重绘。典型用途是无手动操作的修脸：整图采样一次后，自动找到每张脸并局部高清重绘，让远景小脸也清晰好看。",
    why: "只要做人物出图，几乎迟早会用到它。它解决两个痛点：一是手动画遮罩太累，用检测器自动找脸找手；二是整图直接重绘又慢又容易破坏构图，Impact 的区域细化只对关键部位做局部重绘，又快又稳。",
    tags: ["修脸", "检测", "SEGS"],
    nodes: [
      {
        name: "UltralyticsDetectorProvider",
        cat: "load",
        brief: "加载 Ultralytics 检测模型，提供框检测和分割两种检测器。",
        desc: "这是 Impact 检测管线的起点，负责把一个 Ultralytics（YOLO 系）检测模型文件加载成可用的检测器。同一个模型文件经过它会输出两个结果：BBOX_DETECTOR（边界框检测器，只画框）和 SEGM_DETECTOR（分割检测器，贴着轮廓抠）。模型文件放在 models 的 ultralytics 目录，常见有人脸、手部、全身等目标的框版或分割版。对不懂原理的人可以把它理解成挑选并装上一双会找东西的眼睛。",
        inputs: [
          { name: "model_name", type: "COMBO", from: "下拉选择 models 的 ultralytics 目录中的检测模型", desc: "选哪个检测模型，例如人脸框检测模型或人物分割模型" }
        ],
        outputs: [
          { type: "BBOX_DETECTOR", to: "典型下游：BboxDetectorSEGS", desc: "边界框检测器，输出方形框区域" },
          { type: "SEGM_DETECTOR", to: "典型下游：SegmDetectorSEGS", desc: "分割检测器，输出贴轮廓的精细区域" }
        ],
        why: "没有它，后面的 SEGS 检测节点就没有模型可用；选哪个模型决定了你检测的是脸、手还是整个人。",
        tips: "只找位置选框版模型，要贴边轮廓选分割版；模型可从 Impact Pack 官方说明提供的地址下载。"
      },
      {
        name: "SAMLoader",
        cat: "load",
        brief: "加载 SAM 分割模型，用于把粗糙框细化成贴边遮罩。",
        desc: "SAM（Segment Anything Model，任意物体分割模型）是一个通用分割模型：给它一张图和一个大致区域，它能沿着物体边缘生成非常贴合的遮罩。这个节点负责把 SAM 模型加载进工作流，可选择模型尺寸和运行设备。它常和边界框检测搭配：检测先框个大概，SAM 再把框内目标的边缘抠准。",
        inputs: [
          { name: "model_name", type: "COMBO", from: "下拉选择 models 的 sams 目录中的 SAM 模型", desc: "SAM 模型文件，体积越大精度越高也越慢" },
          { name: "device_mode", type: "COMBO", from: "一般保持自动", desc: "在 CPU 还是 GPU 上运行" }
        ],
        outputs: [
          { type: "SAM_MODEL", to: "典型下游：SAMDetectorCombined 或带 SAM 选项的检测节点", desc: "已加载的 SAM 分割模型" }
        ],
        why: "边界框检测快但粗糙，直接拿框当遮罩会把背景一起重绘；SAM 负责把区域边缘抠准，是修图不伤背景的关键。",
        tips: "首次使用会自动下载模型；追求速度用最小型号，对边缘质量要求高再上大型号。"
      },
      {
        name: "BboxDetectorSEGS",
        cat: "mask",
        brief: "用边界框检测器在图上找出目标区域，输出 SEGS。",
        desc: "输入一张图像和一个边界框检测器，它在图中检测指定目标（人脸、手、全身等，取决于检测模型），把每个命中目标输出为一个 SEGS 项。SEGS 是 Impact Pack 的核心数据类型，可以理解为一批带裁剪图和遮罩的小区域。它只框位置不做精细分割，速度快，是大多数自动修脸流程的第一步。",
        inputs: [
          { name: "bbox_detector", type: "BBOX_DETECTOR", from: "典型上游：UltralyticsDetectorProvider", desc: "用来检测的边界框检测器" },
          { name: "image", type: "IMAGE", from: "典型上游：VAEDecode 或 LoadImage 的输出", desc: "要在哪张图上检测目标" }
        ],
        outputs: [
          { type: "SEGS", to: "典型下游：FaceDetailer、DetailerForEach 或 SAMDetectorCombined", desc: "检测到的所有区域，每项含裁剪图和遮罩" }
        ],
        why: "自动找脸是整套自动修图的第一环；没有检测结果，后面的细化重绘无从谈起。",
        tips: "检测阈值调低能找出更多目标但可能误报，0.3 到 0.5 是常用区间；输出可以直接接 FaceDetailer。"
      },
      {
        name: "SegmDetectorSEGS",
        cat: "mask",
        brief: "用分割检测器找出贴轮廓的目标区域，输出 SEGS。",
        desc: "与 BboxDetectorSEGS 同族，但使用分割检测器，直接输出贴着目标轮廓的区域而不是方形框。因为分割模型本身就带精细边界，通常不需要再过 SAM。适合人形、手部等对重绘边缘要求高的任务。",
        inputs: [
          { name: "segm_detector", type: "SEGM_DETECTOR", from: "典型上游：UltralyticsDetectorProvider", desc: "用来检测的分割检测器" },
          { name: "image", type: "IMAGE", from: "典型上游：VAEDecode 或 LoadImage 的输出", desc: "要检测的图像" }
        ],
        outputs: [
          { type: "SEGS", to: "典型下游：DetailerForEach、FaceDetailer", desc: "分割出的一组精细区域" }
        ],
        why: "当重绘边缘贴不贴肉很关键时，例如换装、修手，分割检测比边界框加 SAM 更省事也更准。",
        tips: "有分割版检测模型就优先用它，可以省掉 SAMLoader；没有再用框检测加 SAM 的组合。"
      },
      {
        name: "SAMDetectorCombined",
        cat: "mask",
        brief: "用 SAM 把 SEGS 里的粗糙框细化为贴合遮罩。",
        desc: "输入 SEGS 和 SAM 模型，它对每个区域的裁剪图跑 SAM 分割，把框级别的粗区域变成沿物体边缘的精细遮罩，并合并回新的 SEGS。它是从快速检测到精细遮罩之间的中间加工站。对不懂原理的人：框好比用笔粗略圈出的选区，SAM 帮你把选区边缘描得严丝合缝。",
        inputs: [
          { name: "segs", type: "SEGS", from: "典型上游：BboxDetectorSEGS", desc: "待细化的粗糙区域" },
          { name: "sam_model", type: "SAM_MODEL", from: "典型上游：SAMLoader", desc: "用于精细分割的 SAM 模型" },
          { name: "image", type: "IMAGE", from: "典型上游：与检测时相同的原图", desc: "SAM 分割所依据的原图" }
        ],
        outputs: [
          { type: "SEGS", to: "典型下游：DetailerForEach、FaceDetailer", desc: "遮罩已细化的 SEGS" }
        ],
        why: "修脸最怕遮罩盖到背景，重绘后脸周围出现糊边；这一步保证遮罩只盖住该盖的地方。",
        tips: "检测提示等参数多数场景用默认即可；已经用分割版检测模型时可以跳过这个节点。"
      },
      {
        name: "FaceDetailer",
        cat: "sampler",
        brief: "自动检测人脸并逐个放大重绘，让小脸变清晰。",
        desc: "这是 Impact Pack 最出名的节点。它接收一张生成好的图像，先用检测器找出所有脸，把每张脸裁剪放大，在放大后的图上用你提供的模型和正向、负向条件（Conditioning）重新采样，类似局部重绘，再把修好的脸贴回原图。全程自动，一图多脸也逐个处理。对不懂原理的人可以把它理解为会自己找脸的局部高清修复器。它在 KSampler 之后、SaveImage 之前的位置。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：KSampler 加 VAEDecode 的输出", desc: "待修脸的整图" },
          { name: "model", type: "MODEL", from: "典型上游：CheckpointLoaderSimple 的输出", desc: "用于重绘人脸的扩散模型" },
          { name: "positive", type: "CONDITIONING", from: "典型上游：CLIPTextEncode 的正向输出口", desc: "人脸重绘用的正向条件" },
          { name: "negative", type: "CONDITIONING", from: "典型上游：CLIPTextEncode 的负向输出口", desc: "人脸重绘用的负向条件" },
          { name: "vae", type: "VAE", from: "典型上游：CheckpointLoaderSimple 的输出", desc: "编码解码人脸片段用的 VAE" },
          { name: "bbox_detector", type: "BBOX_DETECTOR", from: "典型上游：UltralyticsDetectorProvider", desc: "用来找脸的检测器" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：SaveImage 或继续后续处理", desc: "修好所有人脸后的整图" },
          { type: "DETAILER_PIPE", to: "典型下游：其他 Detailer 类节点", desc: "打包好的细化配置，便于传递复用" }
        ],
        why: "远景和合影里的脸经常只有几十个像素，噪点和崩坏在所难免；FaceDetailer 不需要你手动框脸就能批量修复，是人物出图质量的保底环节。",
        tips: "guide_size 决定脸至少放大到多少像素再重绘，256 到 512 常用；给重绘单独配一组人脸向提示词（例如干净皮肤、精致眼睛）效果更好。"
      },
      {
        name: "DetailerForEach",
        cat: "sampler",
        brief: "对 SEGS 里的每个区域逐个做放大重绘。",
        desc: "FaceDetailer 的泛化版：不限于脸，而是对输入 SEGS 里的每个区域用给定模型和条件做裁剪、放大、重绘、回贴。检测到什么就修什么，例如接分割检测修手、接全身检测修整个人。它把检测和细化解耦，同一套细化配置可以服务任意检测目标。",
        inputs: [
          { name: "detailer_pipe", type: "DETAILER_PIPE", from: "典型上游：ToBasicPipe 或 FaceDetailer 的管道输出口", desc: "打包好的模型、条件、检测器等配置" },
          { name: "segs", type: "SEGS", from: "典型上游：各类 DetectorSEGS 检测节点", desc: "要逐个细化的区域列表" },
          { name: "image", type: "IMAGE", from: "典型上游：VAEDecode 的输出", desc: "区域所在的原图" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：SaveImage 或下一个 Detailer 类节点", desc: "所有区域细化完成后的整图" }
        ],
        why: "想修手、修画面里的特定物体时，只要换检测器就能复用同一套细化逻辑，不必为每种目标重搭工作流。",
        tips: "用 BasicPipe 传配置能让画面清爽很多；通配符和种子参数可以让每个区域的重绘各有变化。"
      },
      {
        name: "DetailerForEachDebug",
        cat: "sampler",
        brief: "DetailerForEach 的调试版，保存中间结果便于检查。",
        desc: "功能与 DetailerForEach 完全一致，区别是它会把每个区域检测到的裁剪图、遮罩和重绘结果输出为预览图，让你看清它到底找到了什么、改了什么。调参阶段用它验证检测和遮罩是否正确，确认无误后可以换回正式节点，也可以留着当监控。",
        inputs: [
          { name: "detailer_pipe", type: "DETAILER_PIPE", from: "典型上游：ToBasicPipe 或 FaceDetailer 的管道输出口", desc: "打包好的细化配置" },
          { name: "segs", type: "SEGS", from: "典型上游：各类 DetectorSEGS 检测节点", desc: "待细化的区域" },
          { name: "image", type: "IMAGE", from: "典型上游：VAEDecode 的输出", desc: "原图" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：SaveImage", desc: "细化后的整图" }
        ],
        why: "自动修图最大的问题是出错了你也不知道，调试版让检测误报、遮罩偏移、重绘过头这些藏起来的问题一眼可见。",
        tips: "新工作流第一次跑建议先用调试版；预览图存在临时目录，不影响正式输出。"
      },
      {
        name: "SEGSConcat",
        cat: "mask",
        brief: "把两组 SEGS 连接成一组，合并不同来源的检测结果。",
        desc: "输入两个 SEGS，输出一个前后拼接的 SEGS。典型用法是先检测脸得到一组区域，再检测手得到另一组区域，用这个节点合成一组，交给 DetailerForEach 一次性细化。它不修改区域内容，只负责把队伍排到一起。",
        inputs: [
          { name: "segs_1", type: "SEGS", from: "典型上游：一路检测节点", desc: "第一组区域" },
          { name: "segs_2", type: "SEGS", from: "典型上游：另一路检测节点", desc: "第二组区域" }
        ],
        outputs: [
          { type: "SEGS", to: "典型下游：DetailerForEach", desc: "合并后的区域列表" }
        ],
        why: "想用一套细化流程同时修脸和修手，就需要把两路检测结果合并，这个节点就是那个合流三通。",
        tips: "合并前确认两路 SEGS 来自同一张原图，尺寸不一致会导致后续回贴错位。"
      },
      {
        name: "ToBasicPipe",
        cat: "util",
        brief: "把模型、条件、检测器等八项配置打包成一根管道。",
        desc: "BasicPipe（基础管道）是 Impact Pack 定义的一种打包格式，把细化重绘需要的 model、clip、vae、正向条件、负向条件、框检测器、分割检测器、SAM 模型八样东西捆成一根 DETAILER_PIPE 输出。这样工作流里不用拉八根线，只需要传一根。FromBasicPipe 负责拆包还原。",
        inputs: [
          { name: "model", type: "MODEL", from: "典型上游：CheckpointLoaderSimple", desc: "扩散模型" },
          { name: "clip", type: "CLIP", from: "典型上游：CheckpointLoaderSimple", desc: "文本编码器" },
          { name: "vae", type: "VAE", from: "典型上游：CheckpointLoaderSimple", desc: "变分自编码器" },
          { name: "positive", type: "CONDITIONING", from: "典型上游：CLIPTextEncode", desc: "正向条件" },
          { name: "negative", type: "CONDITIONING", from: "典型上游：CLIPTextEncode", desc: "负向条件" },
          { name: "bbox_detector", type: "BBOX_DETECTOR", from: "典型上游：UltralyticsDetectorProvider", desc: "边界框检测器" }
        ],
        outputs: [
          { type: "DETAILER_PIPE", to: "典型下游：FaceDetailer、DetailerForEach", desc: "打包好的完整细化配置" }
        ],
        why: "Detailer 类节点的输入又多又长，复杂工作流里满屏连线难读，管道化是 Impact 官方给出的整理方案。",
        tips: "暂时没有的项目（例如分割检测器）可以空着；同一根管道可以分发给多个 Detailer 类节点。"
      },
      {
        name: "FromBasicPipe",
        cat: "util",
        brief: "把打包管道拆回模型、条件等独立输出口。",
        desc: "ToBasicPipe 的反向操作：输入一根管道，输出八条独立的连线，包括模型、文本编码器、VAE、正向与负向条件和三种检测器。当管道里的配置需要分流给非 Impact 节点使用时，例如把模型送去加载 LoRA，就需要先拆包。",
        inputs: [
          { name: "basic_pipe", type: "DETAILER_PIPE", from: "典型上游：ToBasicPipe 或 FaceDetailer 的管道输出口", desc: "要拆开的细化配置管道" }
        ],
        outputs: [
          { type: "MODEL", to: "典型下游：KSampler、LoRA 加载器", desc: "打包时的扩散模型" },
          { type: "CONDITIONING", to: "典型下游：KSampler 的条件输入", desc: "打包时的正向与负向条件" }
        ],
        why: "没有拆包节点，管道里的配置就只能整体在 Impact 节点之间流转；有了它，管道和其他节点体系可以自由互通。",
        tips: "拆包得到的各项与打包时完全相同；只是临时借用某一项时，从对应输出口接即可。"
      },
      {
        name: "ImpactWildcardProcessor",
        cat: "util",
        brief: "处理通配符文本，按种子随机展开成具体提示词。",
        desc: "通配符（Wildcard）是一种词库语法：文本里写一组用花括号包起来的候选词（用竖线分隔），或引用下划线包起来的外部词库文件，运行时随机选中其中一个展开。这个节点读取通配符文本，按种子（Seed）随机展开成一条具体提示词输出。它常与种子绑定，让同一工作流每次跑出不同的服装、发型、场景组合，是批量抽卡的文案引擎。",
        inputs: [
          { name: "wildcard_text", type: "STRING", from: "直接在节点上填写", desc: "包含通配符标记的文本模板" },
          { name: "seed", type: "INT", from: "节点自带种子控件，也可由上游种子节点提供", desc: "控制随机展开结果的种子" }
        ],
        outputs: [
          { type: "STRING", to: "典型下游：CLIPTextEncode 的正向文本输入", desc: "展开后的具体提示词" }
        ],
        why: "想批量生成多样内容时手改文本效率极低；通配符加种子让多样性自动化且可复现。",
        tips: "先固定种子检查展开结果是否符合预期；注意区分处理器（出文本）和接收器（在 Detailer 节点里消费通配符）的分工。"
      }
    ]
  });

  // ---------- 3. comfyui_controlnet_aux ----------
  window.COMFY_DATA.nodePackages.push({
    id: "controlnet-aux",
    name: "comfyui_controlnet_aux",
    author: "Fannovel16",
    official: false,
    category: "ControlNet 预处理器",
    install: "在 ComfyUI-Manager 里搜索 comfyui_controlnet_aux 一键安装",
    summary: "comfyui_controlnet_aux 由 Fannovel16 维护，把社区里几乎所有 ControlNet 预处理器集中到一个包里。预处理器（Preprocessor）是放在 ControlNet 模型前面的图像加工站：把普通照片加工成线稿、深度图、骨骼点等 ControlNet 能读懂的控制图（Control 图）。没有它，你需要到外部软件生成控制图；有了它，整条 ControlNet 流程都能在 ComfyUI 里一站式完成。",
    why: "用 ControlNet 控图，选对预处理器比选对模型更影响结果。这个包把几十种预处理一网打尽，并自动安装各自需要的 Python 依赖和模型权重，是 ControlNet 工作流的事实标配。",
    tags: ["ControlNet", "预处理", "控图"],
    nodes: [
      {
        name: "CannyEdgePreprocessor",
        cat: "image",
        brief: "提取边缘线，生成类似铅笔描边的 Canny 控制图。",
        desc: "Canny（坎尼边缘检测）是经典边缘提取算法，把照片变成黑底白线的轮廓图：哪里亮度变化剧烈，哪里就有线。线条保留了物体的形状和构图，抹掉了颜色和材质。输出的控制图接给 ControlNet 后，生成结果会严格沿着这些线条重构内容。这是最常用也最直观的控图方式之一。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage 或 VAEDecode 的输出", desc: "要提取边缘的参考图" },
          { name: "low_threshold", type: "FLOAT", from: "节点上手动调节", desc: "低阈值，弱于此的亮度变化被忽略" },
          { name: "high_threshold", type: "FLOAT", from: "节点上手动调节", desc: "高阈值，强于此的变化才算硬边缘" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：ControlNetApplyAdvanced 配合 canny 模型", desc: "黑底白线的边缘控制图" }
        ],
        why: "想让生成结果严格复刻参考图的构图和轮廓时，Canny 是首选；线稿转实景、建筑效果图都靠它。",
        tips: "线太杂就提高阈值，丢结构就降低；处理手绘线稿素材时可以试试 LineArt，通常更干净。"
      },
      {
        name: "LineArtPreprocessor",
        cat: "image",
        brief: "把图像转成干净连贯的手绘风线稿控制图。",
        desc: "与 Canny 的算法边缘不同，LineArt 更接近人类手绘线稿：线条闭合、连贯、粗细自然，杂乱纹理干扰更少。它对物体轮廓的判断更语义化，适合插画和动漫风格。生成的控制图配合 lineart 系列的 ControlNet 模型使用效果最佳。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage 或 VAEDecode 的输出", desc: "参考图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：ControlNetApplyAdvanced 配合 lineart 模型", desc: "线稿风格控制图" }
        ],
        why: "做插画、漫画风控图时，Canny 的碎线会让画面毛糙，LineArt 给出的是画师会画的那种线。",
        tips: "粗略与精细两种模式可以切换；实物照片转线稿再上色是它的经典用法。"
      },
      {
        name: "LineArtAnimePreprocessor",
        cat: "image",
        brief: "针对动漫图优化的线稿提取器。",
        desc: "LineArt 的动漫特化版，专门针对动漫截图和赛璐璐风格图像调校，能更好地处理动漫里常见的色块边界、发丝和细线。处理动漫素材时比通用 LineArt 更干净、断线更少。配合 lineart anime 系 ControlNet 模型使用。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage 或 VAEDecode 的输出", desc: "动漫风格参考图" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：ControlNetApplyAdvanced 配合 lineart anime 模型", desc: "动漫线稿控制图" }
        ],
        why: "用通用线稿器处理动漫图常有噪点和断线，特化版本让二次元素材的控图干净利落。",
        tips: "处理真人照片不要用它，换回 LineArt 或 Canny 更合适。"
      },
      {
        name: "DepthAnythingV2Preprocessor",
        cat: "image",
        brief: "用 Depth Anything V2 模型估计画面的深度图。",
        desc: "深度图（Depth Map）用明暗表示远近：越亮越近，越暗越远。这个节点用 Depth Anything V2 模型推理出图像的深度结构，物体边界清楚、细节丰富。深度控制图让生成结果保持参考图的空间关系而不复制纹理，适合把照片变雕塑、重新设计光影材质这类任务。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage 或 VAEDecode 的输出", desc: "需要估计深度的参考图" },
          { name: "resolution", type: "INT", from: "节点上手动设置", desc: "处理分辨率，越高越精细也越慢" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：ControlNetApplyAdvanced 配合 depth 模型", desc: "灰度深度控制图" }
        ],
        why: "想保留构图的空间骨架、又想自由更换画风和材质时，深度控制比边缘控制更灵活。",
        tips: "首次使用会自动下载模型权重；与同名的 depth anything 相关 ControlNet 模型搭配效果最稳。"
      },
      {
        name: "MiDaS-DepthMapPreprocessor",
        cat: "image",
        brief: "用 MiDaS 模型生成深度图，Depth Anything 的前辈。",
        desc: "MiDaS 是较早被广泛使用的单目深度估计模型家族，这个节点输出它的深度估计结果，远近映射的亮度范围可调。在 Depth Anything 出现之前它是深度控制的默认选择，现在依然稳定可用，大量旧工作流仍在使用它。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage 或 VAEDecode 的输出", desc: "参考图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：ControlNetApplyAdvanced 配合 depth 模型", desc: "深度控制图" }
        ],
        why: "它兼容大量既有工作流；某些场景下它的深度风格与早期 depth 模型搭配更协调。",
        tips: "新流程一般优先 Depth Anything V2；复刻旧工作流时保持 MiDaS 才能还原原始效果。"
      },
      {
        name: "HEDPreprocessor",
        cat: "image",
        brief: "提取带浓淡变化的软边缘，SoftEdge 与它同源。",
        desc: "HED（Holistically-Nested Edge Detection，整体嵌套边缘检测）是神经网络边缘检测器，输出有浓淡变化的软边缘，而不是 Canny 那种非黑即白的硬线条。线条柔和、有主次，给生成模型留了更多发挥余地，控制力介于 Canny 和不控制之间。SoftEdge 预处理器与它一脉相承，风格更柔和。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage 或 VAEDecode 的输出", desc: "参考图像" },
          { name: "safe", type: "COMBO", from: "节点上选择开启或关闭", desc: "安全模式，可减少误检测" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：ControlNetApplyAdvanced 配合 softedge 或 hed 模型", desc: "带浓淡的软边缘控制图" }
        ],
        why: "既想保留构图、又不想被死线条锁死时，HED 与 SoftEdge 是很好的折中选择。",
        tips: "配合 softedge 模型时强度不要拉满，0.5 到 0.8 常能兼顾结构与自由度。"
      },
      {
        name: "SoftEdgePreprocessor",
        cat: "image",
        brief: "HED 的柔化版，输出更轻盈的软边缘控制图。",
        desc: "SoftEdge 在 HED 思路基础上进一步柔化边缘，线条淡而有致，只框定大结构，把细节空间留给模型。它配套 softedge 系 ControlNet 模型，是既想构图受控又想画面自然的常用选择。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage 或 VAEDecode 的输出", desc: "参考图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：ControlNetApplyAdvanced 配合 softedge 模型", desc: "软边缘控制图" }
        ],
        why: "在 Canny 的死板与无控制的放飞之间，SoftEdge 提供了一个好用的中间档。",
        tips: "常配 0.5 到 0.8 的控制强度；需要更硬的结构约束就退回 Canny。"
      },
      {
        name: "OpenposePreprocessor",
        cat: "image",
        brief: "检测人体骨骼关键点，生成火柴人骨架控制图。",
        desc: "Openpose 预处理器从图像中检测头、肩、肘、腕、髋、膝等关键点，画成彩色火柴人骨架图。骨架只描述姿势，不描述体型和服装，配合 openpose 系 ControlNet 模型可以完全重绘人物外观而保持姿势不变。它是姿势控制、动作复刻的标准工具。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage 或 VAEDecode 的输出", desc: "包含人物的参考图" },
          { name: "detect_body", type: "COMBO", from: "节点上的启用开关", desc: "是否检测身体骨架" },
          { name: "detect_hand", type: "COMBO", from: "节点上的启用开关", desc: "是否检测手部骨架" },
          { name: "detect_face", type: "COMBO", from: "节点上的启用开关", desc: "是否检测面部关键点" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：ControlNetApplyAdvanced 配合 openpose 模型", desc: "黑底彩色骨架控制图" }
        ],
        why: "想让两个角色摆同一姿势、或按参考照片摆动作时，骨架控制是不二之选。",
        tips: "只控姿势时关掉手部和面部检测可以提速；手指细节要求高时可改用 DWPreprocessor。"
      },
      {
        name: "DWPreprocessor",
        cat: "image",
        brief: "用 DWPose 模型检测更准的身体、手部、面部关键点。",
        desc: "DWPose 是更强的姿态估计模型，对身体、手部、面部三类关键点的精度都高于经典 Openpose，尤其是手指细节。输出与 Openpose 预处理器相同的骨架图，两者可以直接互换。当前新工作流一般默认选它。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage 或 VAEDecode 的输出", desc: "人物参考图" },
          { name: "detect_body", type: "COMBO", from: "节点上的启用开关", desc: "是否检测身体骨架" },
          { name: "detect_hand", type: "COMBO", from: "节点上的启用开关", desc: "是否检测手部骨架" },
          { name: "detect_face", type: "COMBO", from: "节点上的启用开关", desc: "是否检测面部关键点" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：ControlNetApplyAdvanced 配合 openpose 或 dwpose 模型", desc: "骨架控制图" }
        ],
        why: "手指和面部姿态的还原度直接决定人物质量，DWPose 在这些难点上明显更稳。",
        tips: "首次使用会自动下载权重；复杂手势场景记得打开手部检测。"
      },
      {
        name: "TilePreprocessor",
        cat: "image",
        brief: "生成色块化细节引导图，配合 tile 模型做分块放大。",
        desc: "Tile 预处理器把图像按块降质成低细节的色块图，配合 tile 系 ControlNet 模型使用。它传递的不是形状而是细节密度：常用于放大流程中防止每个分块自由发挥，以及在不改变构图的前提下注入参考图的纹理密度。对不懂原理的人：它告诉 ControlNet 的是这里该有多少细节，而不是这里该画什么。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：放大节点输出的大图", desc: "待分块引导的图像" },
          { name: "pyrUp_iters", type: "INT", from: "节点上手动调节", desc: "色块化强度，数值越大细节越模糊" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：ControlNetApplyAdvanced 配合 tile 模型", desc: "色块化控制图" }
        ],
        why: "直接放大一张大图，模型经常凭空加内容或糊成一片；tile 控制让每个分块只补细节、不乱改结构。",
        tips: "经典配方是先把图放大 1.5 到 2 倍，再接 tile 控制，强度 0.4 到 0.7。"
      },
      {
        name: "ScribblePreprocessor",
        cat: "image",
        brief: "把图像或涂鸦转成随性的手绘涂鸦线。",
        desc: "Scribble（涂鸦）预处理器把图像简化成潦草的手绘线条，比 Canny 更随意、更抽象。适合以涂鸦为起点的创作：随手几笔，模型据此脑补完整画面；也用于把照片转涂鸦再重新演绎。配套 scribble 系 ControlNet 模型。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage 或手绘草图", desc: "参考图或涂鸦" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：ControlNetApplyAdvanced 配合 scribble 模型", desc: "涂鸦风格控制图" }
        ],
        why: "涂鸦控制是给灵感起稿最快的路径，几根线就能定构图，把细节决定权留给模型。",
        tips: "想要更自由的结果，可以降低 ControlNet 强度或把控制图先轻微模糊。"
      },
      {
        name: "InpaintPreprocessor",
        cat: "image",
        brief: "为局部重绘准备控制图，只让 ControlNet 看未遮罩区域。",
        desc: "普通预处理器会处理整张图，但局部重绘时你只希望 ControlNet 参考未遮罩的部分。Inpaint 预处理器接收图像和遮罩（MASK），把遮罩外的区域加工成控制图、遮罩内涂黑，配合 ControlNet 做有边界的局部重绘，例如只替换画面里一件物品而不被周边内容干扰。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage 或 VAEDecode 的输出", desc: "待重绘的原图" },
          { name: "mask", type: "MASK", from: "典型上游：遮罩编辑器或遮罩节点", desc: "标出重绘范围的遮罩" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：ControlNetApplyAdvanced 的控制图输入", desc: "遮罩外保留、遮罩内变黑的控制图" }
        ],
        why: "局部重绘时若控制图包含遮罩内的旧内容，模型会被带偏；这个节点让 ControlNet 只看该看的地方。",
        tips: "遮罩边缘稍微羽化能让重绘过渡更自然；配合局部重绘采样流程使用效果最佳。"
      },
      {
        name: "ShufflePreprocessor",
        cat: "image",
        brief: "打乱参考图内部色块，只保留整体色彩分布。",
        desc: "Shuffle（洗牌）预处理器把图像内容打乱重排成抽象色斑图，保留原图的色彩分布和明暗节奏，但破坏具体内容。配合 shuffle 系 ControlNet 模型，可以把参考图的配色与氛围迁移到新画面上，属于风格与色彩层面的软控制。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage", desc: "提供配色的参考图" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：ControlNetApplyAdvanced 配合 shuffle 模型", desc: "内容打乱后的色彩控制图" }
        ],
        why: "想借一张图的色调气质而不是它的内容时，Shuffle 是轻量直接的办法。",
        tips: "控制强度不用太高；先看洗牌结果再决定是否接入 ControlNet。"
      }
    ]
  });

  // ---------- 4. ComfyUI_essentials ----------
  window.COMFY_DATA.nodePackages.push({
    id: "essentials",
    name: "ComfyUI_essentials",
    author: "cubiq",
    official: false,
    category: "图像与批处理工具",
    install: "在 ComfyUI-Manager 里搜索 ComfyUI_essentials 一键安装",
    summary: "ComfyUI_essentials 由 cubiq 开发，收录的都是 ComfyUI 核心里缺失的基础节点：图像缩放裁剪、批次整理、色彩匹配、智能锐化、尺寸读取、控制台调试等。它不引入任何新模型，全是纯工具，胜在参数设计贴心，例如缩放时可以把尺寸对齐到 8 的倍数、只在必要时才缩放。2025 年起作者进入仅维护模式，但节点依然稳定可用，大量公开工作流都在使用。",
    why: "当你发现核心节点缩放不能保比例、多张图不好合并、想知道某条线里图像的尺寸数据时，essentials 几乎总有对应的答案。它像一把瑞士军刀，单个不起眼，装上之后画布上到处都会出现它。",
    tags: ["图像处理", "批处理", "调试"],
    nodes: [
      {
        name: "Image Resize+",
        cat: "image",
        brief: "功能齐全的缩放节点，支持保比例、填充裁剪、倍数对齐。",
        desc: "缩放图像的增强版。除了常规指定宽高，还提供四种方法：stretch 强行拉伸、keep proportion 保比例缩放、fill / crop 保比例再裁出目标尺寸、pad 保比例再补边。condition 参数可以让缩放只在图比目标大或小时才发生。multiple_of 参数能把结果对齐到 8 或 64 的倍数，这很重要，因为多数扩散模型要求尺寸是 8 的倍数。输出还会附带最终宽高两个数值，方便下游使用。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：VAEDecode 或 LoadImage", desc: "要缩放的图像" },
          { name: "width", type: "INT", from: "节点上设置，0 表示按比例自动", desc: "目标宽度" },
          { name: "height", type: "INT", from: "节点上设置，0 表示按比例自动", desc: "目标高度" },
          { name: "interpolation", type: "COMBO", from: "下拉选择 lanczos 等插值算法", desc: "缩放算法，影响清晰度" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：VAEEncode 或 SaveImage", desc: "缩放后的图像" },
          { type: "INT", to: "典型下游：EmptyLatentImage 等尺寸输入", desc: "实际输出宽度" }
        ],
        why: "核心缩放节点功能太朴素，出图尺寸没对齐 8 的倍数就会报错或画质下降；这个节点是很多工作流的标准尺寸入口。",
        tips: "统一一批不同比例的图时，用 fill / crop 加固定宽高最省心；缩小图片用 lanczos 插值通常最锐利。"
      },
      {
        name: "Image Flip+",
        cat: "image",
        brief: "水平、垂直或双向镜像翻转图像。",
        desc: "提供沿 x 轴水平镜像、沿 y 轴垂直翻转或 xy 双向翻转。看似简单，却是构图微调和批量增广的常用工具：人物朝向不对时镜像一下，或者对一批图做镜像扩充。支持批次，一整批图会一起翻转。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage、VAEDecode 或批处理节点", desc: "要翻转的图像" },
          { name: "axis", type: "COMBO", from: "下拉选择 x、y 或 xy", desc: "翻转方向" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：SaveImage 或合成节点", desc: "翻转后的图像" }
        ],
        why: "一句话搞定镜像、还支持整批处理，是画布上出现频率很高的小工具。",
        tips: "画面里有文字或标志时镜像会反字，注意使用场景。"
      },
      {
        name: "Image Crop+",
        cat: "image",
        brief: "按九宫格位置和偏移从图上裁出指定大小区域。",
        desc: "输入目标宽高和一个九宫格位置（例如左上、居中、右下），它从对应方位裁出矩形区域，还能用横纵偏移微调起点。输出除裁剪图外还返回实际裁剪的起点坐标，便于和后续节点对齐。核心节点的裁剪需要手动换算坐标，这个节点把常用裁剪逻辑都预设好了。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：VAEDecode 或 LoadImage", desc: "源图像" },
          { name: "width", type: "INT", from: "节点上设置", desc: "裁剪宽度" },
          { name: "height", type: "INT", from: "节点上设置", desc: "裁剪高度" },
          { name: "position", type: "COMBO", from: "下拉选择九宫格位置", desc: "裁剪锚点在图的哪个方位" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：VAEEncode 或 SaveImage", desc: "裁剪出的区域" },
          { type: "INT", to: "典型下游：合成或回贴节点", desc: "裁剪起点的横坐标" }
        ],
        why: "二次构图的常规操作；自动返回坐标的设计让裁剪再回贴的闭环工作流好写很多。",
        tips: "宽高超出源图时会被自动截到图片边界，不会报错。"
      },
      {
        name: "Images Batch Multiple+",
        cat: "image",
        brief: "最多把五张图合并成一个图像批次。",
        desc: "提供五个图像输入口，把多张图拼接为一个批次（Batch，捆在一起一起处理的一组图）。尺寸不同的图会自动按指定插值方法缩放到第一张的大小再拼接。适合把不同来源的图凑成一批，统一送进采样、放大或保存流程。",
        inputs: [
          { name: "image_1", type: "IMAGE", from: "典型上游：LoadImage 或 VAEDecode", desc: "批次的第一张图，决定整体尺寸" },
          { name: "image_2", type: "IMAGE", from: "另一路 LoadImage 等节点", desc: "第二张图，可选" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：采样、放大或批量保存节点", desc: "合并后的图像批次" }
        ],
        why: "核心节点合并批次不自动对齐尺寸、入口也少；多图合并成批是批量处理的第一步。",
        tips: "尺寸对齐方式默认 lanczos 效果较好；除第一张外的输入都可选，空着即不参与。"
      },
      {
        name: "Image Expand Batch+",
        cat: "image",
        brief: "把批次扩展或压缩到指定帧数。",
        desc: "输入一个图像批次和目标数量，它输出正好这个数量的图：expand 模式在批次内均匀取样或插值过渡；repeat all 整批循环复制；repeat first 和 repeat last 复制首张或末张。做动画和视频时，用它把任意数量的关键帧整理成固定帧数非常方便。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：采样批次输出或视频帧", desc: "输入批次" },
          { name: "size", type: "INT", from: "节点上设置", desc: "目标帧数" },
          { name: "method", type: "COMBO", from: "下拉选择 expand 等方式", desc: "扩展或压缩的取样策略" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：视频合成或 SaveImage", desc: "固定数量的图像批次" }
        ],
        why: "后续视频节点常要求固定帧数，手动凑数很痛苦；这个节点是图像批次和视频流程之间的适配器。",
        tips: "expand 的插值过渡适合做补间动画；只为补齐数量时用 repeat last 最不伤画质。"
      },
      {
        name: "Image From Batch+",
        cat: "image",
        brief: "从批次中取出从指定序号开始的一段图像。",
        desc: "输入批次、起始序号和长度，输出对应的子批次；长度为负一表示取到末尾。用于把一个大批次拆开分别处理，例如只放大第一张，或把后半段交给另一条支路。序号从 0 开始数。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：批处理或采样输出", desc: "来源批次" },
          { name: "start", type: "INT", from: "节点上设置", desc: "起始序号，从 0 开始" },
          { name: "length", type: "INT", from: "节点上设置", desc: "取多少张，负一表示取到末尾" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：任何接受图像的节点", desc: "取出的子批次" }
        ],
        why: "分而治之是复杂工作流的常用手法，批次切分是它的基础操作。",
        tips: "起始序号超出范围会被自动夹到最后一帧，不会报错。"
      },
      {
        name: "Image Batch To List+",
        cat: "image",
        brief: "把一个批次拆成图像列表逐张传递。",
        desc: "批次是捆在一起的一摞图，列表（List）是逐张流动的一队图，ComfyUI 对两者的处理方式不同。这个节点把批次拆成列表，让下游逐张执行，例如逐张保存成文件或逐张接不同的处理参数。配套的 Image List To Batch+ 负责反向合并。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：批处理输出", desc: "要拆开的批次" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：支持逐张处理列表的节点", desc: "逐张流动的图像列表" }
        ],
        why: "很多循环、逐张保存类玩法依赖列表语义；分不清批次和列表时，记住拆开用这个节点就行。",
        tips: "下游节点会按列表逐张运行，总耗时随张数线性增加。"
      },
      {
        name: "Image List To Batch+",
        cat: "image",
        brief: "把逐张流动的图像列表重新捆成一个批次。",
        desc: "与上一个节点互为反向：接收逐张流动的图像列表，把所有图对齐尺寸后合并成一个批次输出。当上游节点是逐张产出（例如循环里每轮一张图）而下游需要整批处理时，用它收拢。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：循环或逐张输出的节点", desc: "图像列表" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：批次类节点", desc: "合并后的批次" }
        ],
        why: "批次与列表两种语义互转是搭建灵活工作流的必备工具，essentials 这一对节点把转换做得很干净。",
        tips: "尺寸不一致的列表项会自动缩放到第一张的尺寸再合并。"
      },
      {
        name: "Image Composite+",
        cat: "image",
        brief: "按坐标把一张图叠到另一张图上，支持遮罩。",
        desc: "把源图按横纵坐标合成到底图上，可选遮罩控制融合区域。相比核心节点，它支持负坐标、批次自动对齐和偏移参数，处理不同尺寸和批次时行为更稳。做拼贴、水印、局部贴图时是直接可用的图章工具。",
        inputs: [
          { name: "destination", type: "IMAGE", from: "典型上游：VAEDecode", desc: "底图" },
          { name: "source", type: "IMAGE", from: "典型上游：VAEDecode 或 LoadImage", desc: "要叠上去的图" },
          { name: "x", type: "INT", from: "节点上设置", desc: "粘贴位置的横坐标" },
          { name: "y", type: "INT", from: "节点上设置", desc: "粘贴位置的纵坐标" },
          { name: "mask", type: "MASK", from: "可选，遮罩节点输出", desc: "控制源图融合范围的遮罩" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：SaveImage 或 VAEEncode", desc: "合成结果" }
        ],
        why: "图像级合成不用回修图软件，在工作流里直接完成，方便自动化批量出图。",
        tips: "源图超出底图边界会被裁掉而不是报错；配合裁剪节点返回的坐标可以做裁剪后原位回贴。"
      },
      {
        name: "Image Color Match+",
        cat: "image",
        brief: "把参考图的色调分布匹配到目标图上。",
        desc: "统计参考图和目标图在指定色彩空间（例如 LAB）里的均值和方差，把目标图的色彩分布调整到和参考图一致，factor 控制匹配力度。典型用途是局部重绘后把补丁的色调拉回整图，或把两张图的影调统一。还可以用参考遮罩只取参考图的某个区域作为色彩来源。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：VAEDecode 或 Detailer 类输出", desc: "要调整色彩的图" },
          { name: "reference", type: "IMAGE", from: "典型上游：原始整图或风格参考图", desc: "色彩基准图" },
          { name: "factor", type: "FLOAT", from: "节点上调节", desc: "匹配强度，0 不变，1 完全匹配" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：SaveImage 或继续合成", desc: "色调对齐后的图" }
        ],
        why: "自动修图和拼接最容易出现色温不一致的补丁感，色彩匹配是消除违和的收尾工序。",
        tips: "力度先从 0.5 试起，完全匹配有时会丢原图氛围；LAB 是默认且通常最好的色彩空间。"
      },
      {
        name: "Image Smart Sharpen+",
        cat: "image",
        brief: "先滤波保边再锐化的智能锐化器。",
        desc: "与普通锐化不同，它先用双边滤波（一种抹平噪声但保住边缘的模糊）把噪声分离出来，再对细节做锐化，并把两者按比例混合。边缘保护参数越高，越不容易把噪点一起锐利化。适合给放大后的图、重绘后的脸做最终质感处理。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：放大或 Detailer 类输出", desc: "待锐化的图" },
          { name: "sharpen", type: "FLOAT", from: "节点上调节", desc: "锐化强度" },
          { name: "preserve_edges", type: "FLOAT", from: "节点上调节", desc: "边缘保护程度" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：SaveImage", desc: "锐化后的图" }
        ],
        why: "出图最后一步的锐化决定观感，但普通锐化会把噪点一并放大，智能锐化专治这个问题。",
        tips: "锐化过头会出现白边和噪点，从低数值试起；混合比例参数控制锐化与滤波的平衡。"
      },
      {
        name: "Get Image Size+",
        cat: "util",
        brief: "读取图像的宽、高和批内张数。",
        desc: "输入图像，输出三个整数：宽度、高度和批次数量。它本身不改图，是工作流里的测量仪：把尺寸接到空潜空间节点、缩放节点或数学节点上，实现尺寸自动跟随，避免写死数值导致的比例失调。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage 或 VAEDecode", desc: "要测量的图像" }
        ],
        outputs: [
          { type: "INT", to: "典型下游：EmptyLatentImage 的宽高输入", desc: "图像宽度" },
          { type: "INT", to: "典型下游：数学或逻辑节点", desc: "图像高度" }
        ],
        why: "动态工作流要靠数据流而不是人眼确定尺寸，这个节点把图像尺寸变成可传递的数值。",
        tips: "数量输出可以用来做与批次相关的条件判断。"
      },
      {
        name: "Console Debug+",
        cat: "util",
        brief: "把任意输入打印到终端控制台方便排查。",
        desc: "接收任意类型的输入，在启动 ComfyUI 的命令行窗口里打印它的内容，可加前缀便于区分多条输出。节点本身没有输出，纯监视用途。排查工作流中断、查看张量尺寸、确认文本内容时非常有用。",
        inputs: [
          { name: "value", type: "ANY", from: "任何节点的任意输出口", desc: "要查看的数据，任意类型均可" },
          { name: "prefix", type: "STRING", from: "节点上填写", desc: "打印前缀，方便区分多条日志" }
        ],
        outputs: [],
        why: "画布上的数据流对用户多是黑盒，控制台打印是成本最低的黑盒透视工具。",
        tips: "去启动 ComfyUI 的那个终端窗口看输出；一条线看不透就沿线多放几个分别打印。"
      }
    ]
  });
})();
