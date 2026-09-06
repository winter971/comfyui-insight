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
        params: [],
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
        params: [],
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
        params: [],
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
        params: [],
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
        params: [],
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
        params: [],
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
        params: [],
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
        params: [],
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
        params: [
          { name: "model_name", kind: "下拉选择", default: "bbox/face_yolov8m.pt", desc: "选择 models/ultralytics 目录里的检测模型文件，文件名决定了检测什么目标（人脸、手部、全身等）。",
            options: [["bbox/ 开头的文件", "边界框模型，速度快，只给方形框区域"], ["segm/ 开头的文件", "分割模型，输出贴合轮廓的区域，重绘边缘更准"]] }
        ],
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
        params: [
          { name: "model_name", kind: "下拉选择", default: "sam_vit_b_01ec64.pth", desc: "SAM 模型文件，vit_b 轻量常用，vit_l 和 vit_h 分割更准但更占显存、更慢。首次使用会自动下载。" },
          { name: "device_mode", kind: "下拉选择", default: "AUTO", desc: "SAM 在什么设备上运行，决定显存占用与速度。",
            options: [["AUTO", "平时不占显存，检测时才临时载入 GPU，显存紧张首选"], ["Prefer GPU", "模型常驻显存，多次检测更快，显存充裕时用"], ["CPU", "只用内存不占显存，速度最慢"]] }
        ],
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
        params: [
          { name: "threshold", kind: "浮点数", default: "0.5", desc: "检测置信度阈值，调低能找出更多目标但容易误报，0.3 到 0.5 是常用区间。" },
          { name: "dilation", kind: "整数", default: "10", desc: "检测框向外扩张的像素数，调大能多盖住一点周围区域，负数则向内收缩。" },
          { name: "crop_factor", kind: "浮点数", default: "3.0", desc: "裁剪区域相对检测框的放大倍数，越大重绘时看到的上下文越多也越慢，一般保持 3 左右。" }
        ],
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
        params: [
          { name: "threshold", kind: "浮点数", default: "0.5", desc: "检测置信度阈值，调低找得更多但误报也多，0.3 到 0.5 常用。" },
          { name: "dilation", kind: "整数", default: "10", desc: "分割区域向外扩张的像素数，想让重绘范围多盖一圈就调大。" },
          { name: "crop_factor", kind: "浮点数", default: "3.0", desc: "裁剪区域相对检测框的放大倍数，影响重绘时的上下文量，一般保持默认。" }
        ],
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
        params: [
          { name: "detection_hint", kind: "下拉选择", default: "center-1", desc: "告诉 SAM 在区域内取哪里当提示点来生成分割遮罩，多数场景用默认即可，边缘不贴时可换其他方式。",
            options: [["center-1", "取区域中心一个点，通用默认"], ["mask-points", "在遮罩范围内自动取多个点，边缘更贴合"], ["mask-area", "把整个遮罩都当提示，覆盖最完整"]] },
          { name: "dilation", kind: "整数", default: "0", desc: "分割结果向外扩张的像素数，想让遮罩比目标多盖一圈就调大。" },
          { name: "threshold", kind: "浮点数", default: "0.93", desc: "SAM 分割灵敏度，调低遮罩会盖住更大范围（例如连同衣服），调高只保留最核心的区域。" }
        ],
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
        params: [
          { name: "guide_size", kind: "浮点数", default: "512", desc: "脸部裁剪后至少放大到的边长，太小修不动、太大太慢，256 到 512 常用。" },
          { name: "steps", kind: "整数", default: "20", desc: "人脸重绘的采样步数，与主图采样类似，20 左右够用。" },
          { name: "cfg", kind: "浮点数", default: "8.0", desc: "人脸重绘的提示词遵循度，过高会过饱和，一般与主图保持一致。" },
          { name: "sampler_name", kind: "下拉选择", default: "euler", desc: "人脸重绘用的采样器，与主图用同一款最不容易风格脱节。",
            options: [["euler", "最朴素稳定，与主图一致最稳妥"], ["dpmpp_2m", "收敛快细节好，常配 karras 调度"]] },
          { name: "scheduler", kind: "下拉选择", default: "normal", desc: "采样时噪声步的排布方式。",
            options: [["normal", "默认排布，通用"], ["karras", "步数少时噪点更少、细节更细腻，人脸重绘常用"]] },
          { name: "denoise", kind: "浮点数", default: "0.5", desc: "重绘幅度，越低越贴近原脸、越高改动越大，0.3 到 0.5 常用，过高会有换脸感。" },
          { name: "feather", kind: "整数", default: "5", desc: "修好的脸贴回原图时的边缘羽化宽度，调大过渡更柔和，太大会出现糊边。" }
        ],
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
        params: [
          { name: "guide_size", kind: "浮点数", default: "512", desc: "每个区域裁剪后至少放大到的边长，修手等小目标建议 320 到 512。" },
          { name: "seed", kind: "整数", default: "0", desc: "区域重绘的随机种子，固定可复现，配合通配符能让每个区域各有变化。" },
          { name: "steps", kind: "整数", default: "20", desc: "每个区域重绘的采样步数，20 左右够用。" },
          { name: "cfg", kind: "浮点数", default: "8.0", desc: "区域重绘的提示词遵循度，一般与主图一致。" },
          { name: "sampler_name", kind: "下拉选择", default: "euler", desc: "区域重绘用的采样器。",
            options: [["euler", "最朴素稳定，通用首选"], ["dpmpp_2m", "收敛快细节好，常配 karras 调度"]] },
          { name: "denoise", kind: "浮点数", default: "0.5", desc: "重绘幅度，修手修物体建议 0.3 到 0.5，过高容易把内容改掉。" }
        ],
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
        params: [
          { name: "guide_size", kind: "浮点数", default: "512", desc: "每个区域裁剪后至少放大到的边长，与正式版含义一致。" },
          { name: "seed", kind: "整数", default: "0", desc: "区域重绘的随机种子，调参时固定住方便对比修改效果。" },
          { name: "steps", kind: "整数", default: "20", desc: "每个区域重绘的采样步数。" },
          { name: "cfg", kind: "浮点数", default: "8.0", desc: "区域重绘的提示词遵循度。" },
          { name: "sampler_name", kind: "下拉选择", default: "euler", desc: "区域重绘用的采样器。",
            options: [["euler", "最朴素稳定，通用首选"], ["dpmpp_2m", "收敛快细节好，常配 karras 调度"]] },
          { name: "denoise", kind: "浮点数", default: "0.5", desc: "重绘幅度，观察预览图判断检测和遮罩是否正确。" }
        ],
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
        params: [],
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
        params: [],
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
        params: [],
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
        params: [
          { name: "wildcard_text", kind: "文本", default: "", desc: "通配符模板，用花括号包住候选词并用竖线分隔，例如 {红|蓝|白}色裙子，运行时随机展开成一条具体提示词。" },
          { name: "mode", kind: "下拉选择", default: "populate", desc: "决定用哪种方式产出最终文本。",
            options: [["populate", "每次按种子重新展开 wildcard_text，批量抽卡用它"], ["fixed", "锁定使用 populated_text 的内容，方便手动微调后固定"]] },
          { name: "seed", kind: "整数", default: "0", desc: "控制随机展开的结果，固定种子可以复现同一句提示词。" }
        ],
        tips: "先固定种子检查展开结果是否符合预期；注意区分处理器（出文本）和接收器（在 Detailer 节点里消费通配符）的分工。"
      },
      {
        name: "CLIPSegDetectorProvider",
        cat: "load",
        brief: "用文本描述目标生成检测器，不用专门的检测模型。",
        desc: "输入一句英文文本（例如 glasses, hair），它用 CLIPSeg 模型按语义在图里找出对应区域，输出一个 BBOX_DETECTOR。它不需要下载专门的 YOLO 检测模型，理论上什么词都能找，但精度不如专用检测器，适合找没有现成模型可用的冷门目标。使用前需要安装 CLIPSeg 依赖。",
        inputs: [
          { name: "text", type: "STRING", from: "节点上填写英文文本", desc: "要检测的目标，多个目标用英文逗号分隔" }
        ],
        outputs: [
          { type: "BBOX_DETECTOR", to: "典型下游：BboxDetectorSEGS", desc: "按文本语义检测的检测器" }
        ],
        why: "冷门目标没有现成检测模型时，文本驱动的检测是唯一省事的出路。",
        params: [
          { name: "text", kind: "文本", default: "", desc: "英文目标描述，多个用逗号分隔，例如 face, hair。" },
          { name: "threshold", kind: "浮点数", default: "0.4", desc: "置信度阈值，高于它的区域才算命中，调高更严格。" },
          { name: "blur", kind: "浮点数", default: "7", desc: "对检测遮罩做模糊的强度，让边缘更柔和。" },
          { name: "dilation_factor", kind: "整数", default: "4", desc: "检测遮罩向外扩张的程度，0 到 10。" }
        ],
        tips: ""
      },
      {
        name: "ImpactSimpleDetectorSEGS",
        cat: "mask",
        brief: "一个节点完成检测加可选 SAM 精修的简化检测器。",
        desc: "把常用的检测流程打包成一步：先用边界框检测器找目标，可选地接分割检测器或 SAM 模型细化边缘，直接输出 SEGS。相比 BboxDetectorSEGS 加 SAMDetectorCombined 的组合，它把参数精简到一屏以内。想快速验证检测效果时用它最省事。",
        inputs: [
          { name: "bbox_detector", type: "BBOX_DETECTOR", from: "典型上游：UltralyticsDetectorProvider", desc: "边界框检测器" },
          { name: "image", type: "IMAGE", from: "典型上游：VAEDecode 或 LoadImage", desc: "要检测的图像" }
        ],
        outputs: [
          { type: "SEGS", to: "典型下游：DetailerForEach、SEGS 过滤节点", desc: "检测并细化后的区域" }
        ],
        why: "少接两个节点就能拿到带 SAM 精修的检测结果，搭工作流的原型阶段特别顺手。",
        params: [
          { name: "bbox_threshold", kind: "浮点数", default: "0.5", desc: "检测置信度阈值，调低找得更多但误报也多。" },
          { name: "bbox_dilation", kind: "整数", default: "0", desc: "检测框向外扩张的像素数。" },
          { name: "crop_factor", kind: "浮点数", default: "3.0", desc: "裁剪区域相对检测框的放大倍数。" }
        ],
        tips: ""
      },
      {
        name: "SAMDetectorSegmented",
        cat: "mask",
        brief: "SAM 分割输出合并遮罩和逐区域的遮罩批次。",
        desc: "与 SAMDetectorCombined 同源：用 SAM 把 SEGS 里的粗糙区域细化成贴边遮罩。区别是它输出两个结果，一个是全部区域叠加的合并遮罩，另一个是每个区域单独成帧的遮罩批次。需要逐区域单独处理时用它。",
        inputs: [
          { name: "segs", type: "SEGS", from: "典型上游：BboxDetectorSEGS", desc: "待细化的粗糙区域" },
          { name: "sam_model", type: "SAM_MODEL", from: "典型上游：SAMLoader", desc: "SAM 分割模型" },
          { name: "image", type: "IMAGE", from: "典型上游：与检测时相同的原图", desc: "SAM 分割所依据的原图" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：遮罩运算或局部重绘节点", desc: "全部区域叠加的合并遮罩" },
          { type: "MASK", to: "典型下游：逐区域处理的节点", desc: "每个区域单独成帧的遮罩批次" }
        ],
        why: "既要整图遮罩又要逐区域遮罩的场景，一次搞定不用接两个节点。",
        params: [
          { name: "detection_hint", kind: "下拉选择", default: "center-1", desc: "告诉 SAM 在区域内取哪里当提示点，多数场景用默认即可。" },
          { name: "dilation", kind: "整数", default: "0", desc: "分割结果向外扩张的像素数。" },
          { name: "threshold", kind: "浮点数", default: "0.93", desc: "SAM 分割灵敏度，越低覆盖范围越大。" }
        ],
        tips: ""
      },
      {
        name: "FaceDetailerPipe",
        cat: "sampler",
        brief: "FaceDetailer 的管道版，配置打包成一根线传入。",
        desc: "功能与 FaceDetailer 完全相同：自动找脸、裁剪放大、重绘、回贴。区别是模型、条件、检测器等配置不再逐项接线，而是通过 ToDetailerPipe 打包成 DETAILER_PIPE 传入。输入从几十个缩减为两三个，复杂工作流用它画面更整洁。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：KSampler 加 VAEDecode", desc: "待修脸的整图" },
          { name: "detailer_pipe", type: "DETAILER_PIPE", from: "典型上游：ToDetailerPipe", desc: "打包好的模型、条件与检测器配置" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：SaveImage", desc: "修好所有人脸后的整图" },
          { type: "DETAILER_PIPE", to: "典型下游：下一个 Detailer 类节点", desc: "原样透传的管道" }
        ],
        why: "管道版让修脸环节在复杂工作流里只占两根线，可读性完全不同。",
        params: [
          { name: "guide_size", kind: "浮点数", default: "512", desc: "脸部裁剪后至少放大到的边长。" },
          { name: "denoise", kind: "浮点数", default: "0.5", desc: "重绘幅度，过高会有换脸感。" },
          { name: "feather", kind: "整数", default: "5", desc: "贴回原图时的边缘羽化宽度。" }
        ],
        tips: ""
      },
      {
        name: "DetailerForEachPipe",
        cat: "sampler",
        brief: "DetailerForEach 的管道版，支持多轮循环细化。",
        desc: "对 SEGS 里每个区域做裁剪、放大、重绘、回贴，与 DetailerForEach 一致，但模型、CLIP、VAE、正负条件打包成 BASIC_PIPE 一根线传入。它还多一个 cycle 参数，可以把同一批区域循环细化多轮，每轮配合通配符逐步提高细节。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：VAEDecode", desc: "区域所在的原图" },
          { name: "segs", type: "SEGS", from: "典型上游：各类检测节点", desc: "要细化的区域列表" },
          { name: "basic_pipe", type: "BASIC_PIPE", from: "典型上游：ToBasicPipe", desc: "打包好的采样配置" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：SaveImage", desc: "细化完成后的整图" },
          { type: "SEGS", to: "典型下游：SEGSPaste 或预览节点", desc: "细化后的区域数据" }
        ],
        why: "管道加循环的组合让批量多轮精修只用一个节点完成，是重度修图工作流的主力。",
        params: [
          { name: "guide_size", kind: "浮点数", default: "512", desc: "每个区域裁剪后至少放大到的边长。" },
          { name: "denoise", kind: "浮点数", default: "0.5", desc: "重绘幅度，每轮相同。" },
          { name: "cycle", kind: "整数", default: "1", desc: "循环细化的轮数，1 表示只做一轮。" }
        ],
        tips: ""
      },
      {
        name: "DetailerForEachAutoRetry",
        cat: "sampler",
        brief: "区域细化失败时自动换种子重试的版本。",
        desc: "在 DetailerForEach 基础上增加自动重试：每个区域重绘后自动检查效果，不满意就换种子再试，最多 max_retries 次。适合无人值守的批量出图，能明显减少偶发崩坏导致的废片。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：VAEDecode", desc: "原图" },
          { name: "segs", type: "SEGS", from: "典型上游：各类检测节点", desc: "要细化的区域" },
          { name: "model", type: "MODEL", from: "典型上游：CheckpointLoaderSimple", desc: "用于重绘的模型" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：SaveImage", desc: "细化后的整图" }
        ],
        why: "批量跑图最怕半夜蹦出一堆崩脸废片，自动重试把质量底线兜住。",
        params: [
          { name: "max_retries", kind: "整数", default: "1", desc: "每个区域最多自动重试的次数。" },
          { name: "cycle", kind: "整数", default: "1", desc: "循环细化轮数。" },
          { name: "denoise", kind: "浮点数", default: "0.5", desc: "重绘幅度，每次重试沿用。" }
        ],
        tips: ""
      },
      {
        name: "SEGSDetailer",
        cat: "sampler",
        brief: "只细化 SEGS 内部内容，不立即回贴原图。",
        desc: "对输入 SEGS 的每个区域做放大重绘，但结果仍以 SEGS 形式输出，不直接贴回原图。想对细化结果先过滤、预览或再加工时用它，最后用 SEGSPaste 贴回。与 DetailerForEach 的区别是把细化和回贴拆成了两步。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：VAEDecode", desc: "区域所在的原图" },
          { name: "segs", type: "SEGS", from: "典型上游：各类检测节点", desc: "要细化的区域" },
          { name: "basic_pipe", type: "BASIC_PIPE", from: "典型上游：ToBasicPipe", desc: "打包好的采样配置" }
        ],
        outputs: [
          { type: "SEGS", to: "典型下游：SEGSPaste、SEGS 过滤节点", desc: "细化后的区域数据" },
          { type: "IMAGE", to: "典型下游：预览或保存", desc: "每个区域重绘结果的裁剪图列表" }
        ],
        why: "细化与回贴解耦后，中间可以插入过滤和检查，流程更可控。",
        params: [
          { name: "guide_size", kind: "浮点数", default: "512", desc: "每个区域裁剪后至少放大到的边长。" },
          { name: "denoise", kind: "浮点数", default: "0.5", desc: "重绘幅度。" },
          { name: "batch_size", kind: "整数", default: "1", desc: "每个区域生成的候选数量，配合挑选使用。" }
        ],
        tips: ""
      },
      {
        name: "SEGSPaste",
        cat: "sampler",
        brief: "把细化后的 SEGS 贴回原图，完成回贴闭环。",
        desc: "接收原图和一组已细化的 SEGS，把每个区域的裁剪图按遮罩羽化贴回原位。配合 SEGSDetailer 构成先细化后回贴的两段式流程。feather 控制边缘融合宽度，alpha 控制贴图不透明度。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：与检测时相同的原图", desc: "贴回的目标底图" },
          { name: "segs", type: "SEGS", from: "典型上游：SEGSDetailer", desc: "含细化结果的区域数据" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：SaveImage 或色彩匹配", desc: "回贴完成后的整图" }
        ],
        why: "把回贴单独拿出来，才能在中间插入自定义的筛选和修饰步骤。",
        params: [
          { name: "feather", kind: "整数", default: "5", desc: "边缘羽化宽度，越大过渡越柔和。" },
          { name: "alpha", kind: "整数", default: "255", desc: "贴图不透明度，255 为完全覆盖。" }
        ],
        tips: ""
      },
      {
        name: "SEGSPreview",
        cat: "image",
        brief: "把 SEGS 里每个区域的裁剪图输出成预览列表。",
        desc: "输入 SEGS，输出每个区域裁剪出来的小图，可在画布上直接预览检测到了什么。调试检测器、确认过滤条件是否正确时必用，输出的图也可以接保存节点留档。",
        inputs: [
          { name: "segs", type: "SEGS", from: "典型上游：各类检测节点", desc: "要预览的区域" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：Preview Image 或 SaveImage", desc: "逐张输出的裁剪图列表" }
        ],
        why: "自动修图最大的风险是检测错了都不知道，预览是零成本的保险。",
        params: [],
        tips: ""
      },
      {
        name: "SEGSToImageList",
        cat: "image",
        brief: "把 SEGS 拆成裁剪图列表和对应遮罩列表。",
        desc: "将一组 SEGS 分解为逐张流动的裁剪图像列表、遮罩列表和置信度列表，方便对每个区域做自定义处理，例如手动挑选、接普通采样节点或逐张保存。是 SEGS 数据结构对外输出的标准出口之一。",
        inputs: [
          { name: "segs", type: "SEGS", from: "典型上游：各类检测节点", desc: "要拆解的区域" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：逐张处理的图像节点", desc: "每个区域的裁剪图列表" },
          { type: "MASK", to: "典型下游：遮罩类节点", desc: "每个区域的遮罩列表" }
        ],
        why: "离开 Impact 节点体系处理区域内容，就靠它把 SEGS 拆成通用类型。",
        params: [],
        tips: ""
      },
      {
        name: "ImpactSEGSToMaskList",
        cat: "mask",
        brief: "把 SEGS 拆成逐个区域的遮罩列表。",
        desc: "输出每个检测区域单独的遮罩（列表形式）。想对某个区域单独做局部重绘或分析时，用它把 SEGS 拆开。需要全部叠加成一张时改用 SegsToCombinedMask。",
        inputs: [
          { name: "segs", type: "SEGS", from: "典型上游：各类检测节点", desc: "要拆解的区域" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：逐遮罩处理的节点", desc: "每个区域单独的遮罩列表" }
        ],
        why: "逐区域遮罩是精细控制局部重绘范围的基础素材。",
        params: [],
        tips: ""
      },
      {
        name: "ImpactSEGSLabelFilter",
        cat: "mask",
        brief: "按目标类别标签筛选 SEGS。",
        desc: "检测模型通常会给每个区域打上类别标签（例如 face、hair）。这个节点按标签筛选，输出命中的 filtered_SEGS 和未命中的 remained_SEGS。labels 用逗号分隔书写，preset 下拉可快速选择常用组合。",
        inputs: [
          { name: "segs", type: "SEGS", from: "典型上游：各类检测节点", desc: "待过滤的区域" }
        ],
        outputs: [
          { type: "SEGS", to: "典型下游：DetailerForEach", desc: "标签命中的区域" },
          { type: "SEGS", to: "典型下游：另一路处理", desc: "未命中的剩余区域" }
        ],
        why: "全身检测模型的输出里混着各种目标，按标签分拣才能各走各的细化流程。",
        params: [
          { name: "preset", kind: "下拉选择", default: "all", desc: "预设的标签组合，例如只保留人脸相关类别。" },
          { name: "labels", kind: "文本", default: "", desc: "逗号分隔的标签列表，写在这里的类别会被保留。" }
        ],
        tips: ""
      },
      {
        name: "ImpactSEGSOrderedFilter",
        cat: "mask",
        brief: "按面积或置信度排序后截取指定区间的区域。",
        desc: "把 SEGS 按指定指标排序（例如按面积从大到小），再用 take_start 和 take_count 截取一段输出。只要最大的一张脸、或跳过最前面的几个目标时都用它。",
        inputs: [
          { name: "segs", type: "SEGS", from: "典型上游：各类检测节点", desc: "待筛选的区域" }
        ],
        outputs: [
          { type: "SEGS", to: "典型下游：DetailerForEach", desc: "截取出来的区域" },
          { type: "SEGS", to: "典型下游：备用支路", desc: "剩余的区域" }
        ],
        why: "合影里只想修最清楚的那张脸，排序截取是最直接的做法。",
        params: [
          { name: "target", kind: "下拉选择", default: "area(=w*h)", desc: "排序依据，可选面积、宽高、位置坐标或置信度。" },
          { name: "order", kind: "开关", default: "descending", desc: "降序或升序排列。" },
          { name: "take_start", kind: "整数", default: "0", desc: "从排序结果第几个开始取，从 0 数起。" },
          { name: "take_count", kind: "整数", default: "1", desc: "取多少个区域。" }
        ],
        tips: ""
      },
      {
        name: "ImpactSEGSRangeFilter",
        cat: "mask",
        brief: "按数值范围筛选区域，例如只留足够大的脸。",
        desc: "按 target 指定的指标（面积、宽、高、坐标、置信度等）把区域分成范围内和范围外两组输出。过滤掉太小的误检目标是最常见的用法，小到看不清的脸修了反而添乱。",
        inputs: [
          { name: "segs", type: "SEGS", from: "典型上游：各类检测节点", desc: "待筛选的区域" }
        ],
        outputs: [
          { type: "SEGS", to: "典型下游：DetailerForEach", desc: "范围内的区域" },
          { type: "SEGS", to: "典型下游：备用支路", desc: "范围外的区域" }
        ],
        why: "远景小脸重绘常常得不偿失，按面积设门槛能自动放过它们。",
        params: [
          { name: "target", kind: "下拉选择", default: "area(=w*h)", desc: "比较哪个指标，例如面积、宽度或置信度。" },
          { name: "min_value", kind: "整数", default: "0", desc: "范围下限。" },
          { name: "max_value", kind: "整数", default: "67108864", desc: "范围上限。" }
        ],
        tips: ""
      },
      {
        name: "ImpactSEGSNMSFilter",
        cat: "mask",
        brief: "用非极大值抑制去掉互相重叠的重复检测。",
        desc: "同一目标常被检测出多个高度重叠的区域，NMS（非极大值抑制）按重叠度阈值保留最优的一个，去掉其余重复项。检测器把一张脸输出三四个堆在一起时，用它清理最有效。",
        inputs: [
          { name: "segs", type: "SEGS", from: "典型上游：各类检测节点", desc: "含重复检测的区域" }
        ],
        outputs: [
          { type: "SEGS", to: "典型下游：DetailerForEach", desc: "去掉重复后的区域" }
        ],
        why: "同一张脸被重复重绘轻则浪费算力，重则画面错乱，去重是必要的清理。",
        params: [
          { name: "iou_threshold", kind: "浮点数", default: "0.5", desc: "重叠度阈值，两个区域重叠超过它就视为重复，调高保留更多。" }
        ],
        tips: ""
      },
      {
        name: "ImpactSEGSMerge",
        cat: "mask",
        brief: "把多个区域合并成一个整体区域。",
        desc: "输入一组 SEGS，把其中所有小区域合并成一个大区域输出，标签改为 merged，置信度取最小值。想对一群相邻目标整体处理而非逐个处理时用它。注意与 SEGSConcat 区分：后者只是把两组区域排队拼接，不合并内容。",
        inputs: [
          { name: "segs", type: "SEGS", from: "典型上游：各类检测节点", desc: "要合并的区域" }
        ],
        outputs: [
          { type: "SEGS", to: "典型下游：DetailerForEach", desc: "合并成单个的区域" }
        ],
        why: "两个挨在一起的眼睛与其逐个重绘，不如合并成一个区域一次处理。",
        params: [],
        tips: ""
      },
      {
        name: "EmptySegs",
        cat: "mask",
        brief: "生成一个不含任何区域的空 SEGS。",
        desc: "输出空的 SEGS 数据，作为循环、分支或初始化的占位起点。例如首次运行为空、后续迭代里才逐个添加区域的流程。配合 ImpactIfNone 可以判断一条 SEGS 是否为空。",
        inputs: [],
        outputs: [
          { type: "SEGS", to: "典型下游：循环或分支节点", desc: "空的区域数据" }
        ],
        why: "边界情况需要合法的空值占位，而不是让工作流直接报错断线。",
        params: [],
        tips: ""
      },
      {
        name: "MaskToSEGS",
        cat: "mask",
        brief: "把普通遮罩转换成 SEGS 区域数据。",
        desc: "手绘或外部来源的 MASK 一样能接入 Impact 的细化流程：这个节点把遮罩转成带裁剪图和边界框的 SEGS，之后就能交给 SEGSDetailer 或 DetailerForEach 处理。是手动指定区域与自动检测流程之间的桥梁。",
        inputs: [
          { name: "mask", type: "MASK", from: "典型上游：遮罩编辑器或 MaskBlur 等节点", desc: "要转换的遮罩" }
        ],
        outputs: [
          { type: "SEGS", to: "典型下游：SEGSDetailer、DetailerForEach", desc: "由遮罩生成的区域" }
        ],
        why: "自动检测找不到的目标，手画一块遮罩就能进入同一套细化管线。",
        params: [
          { name: "crop_factor", kind: "浮点数", default: "3.0", desc: "裁剪区域相对遮罩边界框的放大倍数。" },
          { name: "combined", kind: "开关", default: "false", desc: "开启时把整张遮罩当一个区域，关闭时按连通块拆成多个区域。" },
          { name: "drop_size", kind: "整数", default: "10", desc: "小于该像素数的碎块会被丢弃。" }
        ],
        tips: ""
      },
      {
        name: "SegsToCombinedMask",
        cat: "mask",
        brief: "把一组 SEGS 叠加合并成一整张遮罩。",
        desc: "把 SEGS 里所有区域的遮罩叠加合并为一张 MASK 输出。想用 Impact 的检测结果去喂普通遮罩节点（例如局部重绘采样、遮罩预览、遮罩运算）时，这是标准出口。",
        inputs: [
          { name: "segs", type: "SEGS", from: "典型上游：各类检测节点", desc: "要合并的区域" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：核心遮罩与重绘节点", desc: "全部区域叠加后的遮罩" }
        ],
        why: "Impact 的区域数据和核心遮罩体系就靠这一步互通。",
        params: [],
        tips: ""
      },
      {
        name: "MediaPipeFaceMeshToSEGS",
        cat: "mask",
        brief: "人脸网格检测，把五官拆成精细的 SEGS 区域。",
        desc: "MediaPipe FaceMesh 在人脸标出上百个关键点，这个节点把它们组织成整脸、嘴、左右眉、左右眼等独立区域的 SEGS。配合 DetailerForEach 可以只重绘眼睛或嘴巴这类局部，是精细修图和换妆的利器。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：VAEDecode 或 LoadImage", desc: "包含人脸的图像" }
        ],
        outputs: [
          { type: "SEGS", to: "典型下游：DetailerForEach", desc: "按五官划分的区域" }
        ],
        why: "只想重画眼睛不动其他部位时，五官级别的区域划分是普通检测器做不到的。",
        params: [
          { name: "crop_factor", kind: "浮点数", default: "3.0", desc: "裁剪区域相对检测框的放大倍数。" },
          { name: "face", kind: "开关", default: "enable", desc: "是否输出整脸区域。" },
          { name: "mouth", kind: "开关", default: "disable", desc: "是否输出嘴部区域，做唇部细化时开启。" },
          { name: "dilation", kind: "整数", default: "0", desc: "区域向外扩张的像素数。" }
        ],
        tips: ""
      },
      {
        name: "ImpactMakeTileSEGS",
        cat: "mask",
        brief: "把图像切成网格区域块，供分块放大细化。",
        desc: "按指定 bbox_size 把图像划分成一行行区域块输出 SEGS，可设置块间重叠，还能用可选输入指定排除或只保留某些区域。接 DetailerForEach 即可对大图分块迭代细化，是放大流程的常用零件。",
        inputs: [
          { name: "images", type: "IMAGE", from: "典型上游：VAEDecode 或放大节点", desc: "要切块的图像" }
        ],
        outputs: [
          { type: "SEGS", to: "典型下游：DetailerForEach", desc: "按网格划分的区域块" }
        ],
        why: "大图没有明确检测目标时，按网格均匀细化是保住全图细节的笨办法也是好办法。",
        params: [
          { name: "bbox_size", kind: "整数", default: "512", desc: "每个区域块的边长，越大块越少。" },
          { name: "min_overlap", kind: "整数", default: "5", desc: "相邻块之间的最小重叠像素，避免接缝。" },
          { name: "crop_factor", kind: "浮点数", default: "3.0", desc: "每块的裁剪上下文放大倍数。" }
        ],
        tips: ""
      },
      {
        name: "ImpactDilateMask",
        cat: "mask",
        brief: "遮罩向外扩张或向内收缩指定像素。",
        desc: "对 MASK 做形态学膨胀收缩：正数向外扩、负数向内缩。重绘前微调遮罩覆盖范围的常用小工具，例如让重绘范围多盖住一圈过渡区域。",
        inputs: [
          { name: "mask", type: "MASK", from: "典型上游：遮罩编辑器或检测节点", desc: "要处理的遮罩" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：局部重绘或 MaskToSEGS", desc: "调整范围后的遮罩" }
        ],
        why: "遮罩差一圈就会留下一圈没重绘到的旧内容，扩张几个像素经常救命。",
        params: [
          { name: "dilation", kind: "整数", default: "10", desc: "扩张或收缩的像素数，负数向内收缩。" }
        ],
        tips: ""
      },
      {
        name: "ImpactGaussianBlurMask",
        cat: "mask",
        brief: "对遮罩做高斯模糊，让边缘柔和过渡。",
        desc: "输入 MASK，按 kernel_size 和 sigma 做高斯模糊后输出。边缘半透明的遮罩能让重绘区域与原图平滑衔接，减少接缝感，常放在局部重绘的遮罩链路上。",
        inputs: [
          { name: "mask", type: "MASK", from: "典型上游：遮罩编辑器或检测节点", desc: "要模糊的遮罩" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：局部重绘节点", desc: "边缘柔化后的遮罩" }
        ],
        why: "硬边遮罩是重绘接缝的主要来源，模糊一下便宜又有效。",
        params: [
          { name: "kernel_size", kind: "整数", default: "10", desc: "模糊核大小，越大边缘过渡越宽。" },
          { name: "sigma", kind: "浮点数", default: "10.0", desc: "高斯标准差，控制模糊强度。" }
        ],
        tips: ""
      },
      {
        name: "ToDetailerPipe",
        cat: "util",
        brief: "打包 Detailer 专用管道，含通配符与检测器。",
        desc: "与 ToBasicPipe 类似，但打包的是 DETAILER_PIPE：模型、CLIP、VAE、正负条件、框检测器，外加通配符文本和可选的 SAM、分割检测器。供 FaceDetailerPipe、DetailerForEachPipe 等管道版细化节点使用。",
        inputs: [
          { name: "model", type: "MODEL", from: "典型上游：CheckpointLoaderSimple", desc: "扩散模型" },
          { name: "positive", type: "CONDITIONING", from: "典型上游：CLIPTextEncode", desc: "正向条件" },
          { name: "bbox_detector", type: "BBOX_DETECTOR", from: "典型上游：UltralyticsDetectorProvider", desc: "边界框检测器" }
        ],
        outputs: [
          { type: "DETAILER_PIPE", to: "典型下游：FaceDetailerPipe、DetailerForEachPipe", desc: "打包好的细化配置" }
        ],
        why: "管道版细化节点的全部配置都靠这一根线带进来。",
        params: [],
        tips: ""
      },
      {
        name: "FromDetailerPipe",
        cat: "util",
        brief: "把 Detailer 管道拆回模型、条件与检测器。",
        desc: "输入 DETAILER_PIPE，输出模型、CLIP、VAE、正负条件、框检测器、SAM、分割检测器等全部内容。需要在管道外借用其中某一项时使用，例如把模型送去叠 LoRA。",
        inputs: [
          { name: "detailer_pipe", type: "DETAILER_PIPE", from: "典型上游：ToDetailerPipe", desc: "要拆开的管道" }
        ],
        outputs: [
          { type: "MODEL", to: "典型下游：KSampler 或 LoRA 加载器", desc: "管道里的扩散模型" },
          { type: "CONDITIONING", to: "典型下游：KSampler 条件输入", desc: "管道里的正向与负向条件" }
        ],
        why: "管道能进也能出，才能与工作流其他部分自由互通。",
        params: [],
        tips: ""
      },
      {
        name: "EditBasicPipe",
        cat: "util",
        brief: "替换管道里的单项配置而不必重新打包。",
        desc: "输入一根 BASIC_PIPE，用可选输入替换其中的模型、CLIP、VAE 或条件后输出新管道。常见用法是加载 LoRA 后只换模型，其余配置原样保留。",
        inputs: [
          { name: "basic_pipe", type: "BASIC_PIPE", from: "典型上游：ToBasicPipe", desc: "要修改的管道" },
          { name: "model", type: "MODEL", from: "可选，LoRA 加载后的模型", desc: "要替换进去的新模型" }
        ],
        outputs: [
          { type: "BASIC_PIPE", to: "典型下游：DetailerForEach、KSampler 类节点", desc: "替换后的新管道" }
        ],
        why: "同一套流程想试不同模型或不同提示词时，改管道比重搭工作流省事得多。",
        params: [],
        tips: ""
      },
      {
        name: "EditDetailerPipe",
        cat: "util",
        brief: "替换 Detailer 管道里的单项配置。",
        desc: "与 EditBasicPipe 同理，作用于 DETAILER_PIPE，还能替换检测器、SAM 和通配符文本。想给不同区域配不同检测器时，用它从一根管道派生出多根很方便。",
        inputs: [
          { name: "detailer_pipe", type: "DETAILER_PIPE", from: "典型上游：ToDetailerPipe", desc: "要修改的管道" },
          { name: "bbox_detector", type: "BBOX_DETECTOR", from: "可选，另一路的检测器", desc: "要替换进去的检测器" }
        ],
        outputs: [
          { type: "DETAILER_PIPE", to: "典型下游：FaceDetailerPipe 等管道版细化节点", desc: "替换后的新管道" }
        ],
        why: "管道的可编辑性决定了它能适应多少种细分场景。",
        params: [],
        tips: ""
      },
      {
        name: "ImpactWildcardEncode",
        cat: "cond",
        brief: "通配符展开并直接编码成条件，支持 LoRA 语法。",
        desc: "把通配符文本按种子随机展开后直接用 CLIP 编码成条件输出，同时支持在文本里写 LoRA 调用语法并应用到模型。相比 ImpactWildcardProcessor 需要另接 CLIPTextEncode，它一步到位，还能让不同批次或不同区域用不同 LoRA。",
        inputs: [
          { name: "model", type: "MODEL", from: "典型上游：CheckpointLoaderSimple", desc: "接收 LoRA 作用的模型" },
          { name: "clip", type: "CLIP", from: "典型上游：CheckpointLoaderSimple", desc: "文本编码器" }
        ],
        outputs: [
          { type: "CONDITIONING", to: "典型下游：KSampler、Detailer 类节点", desc: "展开后的正向或负向条件" },
          { type: "STRING", to: "典型下游：显示或保存文本", desc: "展开后的最终文本" }
        ],
        why: "通配符加 LoRA 语法一步出条件，是批量抽卡工作流里效率最高的提示词方案。",
        params: [
          { name: "wildcard_text", kind: "文本", default: "", desc: "通配符模板，可用花括号候选词，也可写 LoRA 调用语法。" },
          { name: "mode", kind: "下拉选择", default: "populate", desc: "populate 按种子重新展开，fixed 锁定当前文本。" },
          { name: "seed", kind: "整数", default: "0", desc: "控制展开结果的随机种子。" }
        ],
        tips: ""
      },
      {
        name: "ImpactImageInfo",
        cat: "util",
        brief: "读取图像的批次、宽、高和通道数。",
        desc: "输出图像的批量张数、高度、宽度和通道数四个整数。与 essentials 的尺寸节点类似，用于让下游节点的尺寸自动跟随上游图像，避免写死数值。",
        inputs: [
          { name: "value", type: "IMAGE", from: "任何图像输出口", desc: "要读取信息的图像" }
        ],
        outputs: [
          { type: "INT", to: "典型下游：EmptyLatentImage 等尺寸输入", desc: "批量张数与高度等整数" }
        ],
        why: "动态工作流靠数据流而非人眼确定尺寸，这种读取节点是胶水。",
        params: [],
        tips: ""
      },
      {
        name: "ImpactInt",
        cat: "util",
        brief: "定义一个整数值供工作流使用。",
        desc: "输出一个整数常量，常配合数值发送接收节点、比较节点或开关节点的序号使用。给散落在各处的同类参数一个统一入口，改一处全图生效。",
        inputs: [],
        outputs: [
          { type: "INT", to: "典型下游：数值类或逻辑类节点", desc: "设定的整数值" }
        ],
        why: "想让某个整数参数同时驱动多个节点，先把它变成可传递的数据。",
        params: [
          { name: "value", kind: "整数", default: "0", desc: "要输出的整数。" }
        ],
        tips: ""
      },
      {
        name: "ImpactValueSender",
        cat: "util",
        brief: "把任意值广播给配对的接收节点。",
        desc: "把输入的任意类型值发送出去，link_id 与之匹配的 ImpactValueReceiver 都会收到同一个值。让一个参数（例如种子或尺寸）同时驱动多条支路，改一处全联动。",
        inputs: [
          { name: "value", type: "ANY", from: "任何节点的任意输出口", desc: "要发送的值" },
          { name: "link_id", type: "INT", from: "节点上设置", desc: "发送频道编号，需与接收端一致" }
        ],
        outputs: [
          { type: "ANY", to: "典型下游：继续透传", desc: "透传的信号" }
        ],
        why: "连线不便跨越的远距离参数共享，用频道号空中接力最干净。",
        params: [
          { name: "link_id", kind: "整数", default: "0", desc: "频道编号，0 表示广播给所有接收端。" }
        ],
        tips: ""
      },
      {
        name: "ImpactValueReceiver",
        cat: "util",
        brief: "接收发送节点传来的值并按类型输出。",
        desc: "与 ImpactValueSender 配对使用，link_id 匹配后输出收到的值，typ 下拉声明输出类型（STRING、INT、FLOAT、BOOLEAN）。解决画布远距离传值连线难看又难管的问题。",
        inputs: [
          { name: "value", type: "STRING", from: "节点上填写默认值", desc: "未收到信号时使用的默认值" }
        ],
        outputs: [
          { type: "ANY", to: "典型下游：需要该参数的节点", desc: "收到的值，按设定类型输出" }
        ],
        why: "发送端改一个数字，全图几十个接收端一起变，这是集中管理参数的方式。",
        params: [
          { name: "typ", kind: "下拉选择", default: "STRING", desc: "输出的目标类型。" },
          { name: "link_id", kind: "整数", default: "0", desc: "频道编号，与发送端配对。" }
        ],
        tips: ""
      },
      {
        name: "ImpactIfNone",
        cat: "util",
        brief: "判断输入是否为空并按情况透传。",
        desc: "检查 any_input 是否为空值：为空时输出 signal_opt，否则透传 any_input，同时输出一个布尔结果。配合 EmptySEGS 可实现没有检测到目标就走另一条路的工作流。",
        inputs: [
          { name: "any_input", type: "ANY", from: "任何可能为空的输出口", desc: "要判断的输入" },
          { name: "signal", type: "ANY", from: "可选，空值时的替代输出", desc: "输入为空时透传的内容" }
        ],
        outputs: [
          { type: "ANY", to: "典型下游：任一路继续处理", desc: "按判断结果透传的内容" },
          { type: "BOOLEAN", to: "典型下游：逻辑节点", desc: "是否为空的布尔结果" }
        ],
        why: "检测不到人脸时工作流不该崩溃，空值分支让流程优雅降级。",
        params: [],
        tips: ""
      },
      {
        name: "ImpactCompare",
        cat: "util",
        brief: "比较两个任意值的大小或相等关系。",
        desc: "用 cmp 下拉选择比较方式（等于、不等于、大于、小于、大于等于、小于等于），输出布尔值。常与数值、种子或步数等节点联动做流程控制。",
        inputs: [
          { name: "a", type: "ANY", from: "任何数值或文本输出口", desc: "比较的左边" },
          { name: "b", type: "ANY", from: "任何数值或文本输出口", desc: "比较的右边" }
        ],
        outputs: [
          { type: "BOOLEAN", to: "典型下游：分支或开关节点", desc: "比较结果的布尔值" }
        ],
        why: "流程自动化离不开条件判断，比较节点是条件的地基。",
        params: [
          { name: "cmp", kind: "下拉选择", default: "a < b", desc: "选择比较方式。" }
        ],
        tips: ""
      },
      {
        name: "ImpactStringSelector",
        cat: "util",
        brief: "从多行文本中按序号挑出一条字符串。",
        desc: "输入一组换行分隔的候选字符串，用 select 序号选中其中一条输出。配合通配符词库或风格列表，可实现外部控制的风格切换。",
        inputs: [
          { name: "strings", type: "STRING", from: "节点上填写多行文本", desc: "候选字符串，每行一条" }
        ],
        outputs: [
          { type: "STRING", to: "典型下游：CLIPTextEncode 等文本输入", desc: "选中的那条字符串" }
        ],
        why: "把风格清单存进一个节点，靠序号切换，比来回改提示词方便。",
        params: [
          { name: "select", kind: "整数", default: "0", desc: "选第几条，从 0 数起。" },
          { name: "multiline", kind: "开关", default: "disable", desc: "开启时每行一条，关闭时整段当作一条。" }
        ],
        tips: ""
      },
      {
        name: "ImpactSwitch",
        cat: "util",
        brief: "按序号从多路任意输入中选一路通过。",
        desc: "开关节点：select 为几就把第几路输入原样输出，支持多路可选输入，类型不限。想做 A 与 B 方案切换、或按条件选择不同模型时使用。",
        inputs: [
          { name: "input1", type: "ANY", from: "第一路任意输入", desc: "候选输入之一" }
        ],
        outputs: [
          { type: "ANY", to: "典型下游：被选中的一路继续流动", desc: "选中的那路输入" }
        ],
        why: "一套工作流跑多个方案对比时，开关比来回改线优雅得多。",
        params: [
          { name: "select", kind: "整数", default: "1", desc: "选第几路输入，从 1 数起。" }
        ],
        tips: ""
      },
      {
        name: "PreviewBridge",
        cat: "util",
        brief: "在画布预览图上直接涂抹遮罩并回传。",
        desc: "把图像显示在节点里，你可以直接在预览图上涂抹遮罩，节点把图像与遮罩一起输出。相当于把遮罩编辑器嵌进了节点，比点开遮罩编辑器快捷，适合反复微调局部重绘区域的流程。",
        inputs: [
          { name: "images", type: "IMAGE", from: "典型上游：LoadImage 或 VAEDecode", desc: "要预览和涂抹的图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：继续处理", desc: "预览的图像" },
          { type: "MASK", to: "典型下游：局部重绘或 MaskToSEGS", desc: "在预览图上涂抹出的遮罩" }
        ],
        why: "改遮罩不用离开画布主视角，反复调整的效率完全不一样。",
        params: [],
        tips: ""
      },
      {
        name: "ImpactKSamplerBasicPipe",
        cat: "sampler",
        brief: "用 BASIC_PIPE 一根线接入的标准采样器。",
        desc: "等价于核心 KSampler，但模型、CLIP、VAE、正负条件全部来自 BASIC_PIPE，输出结果潜空间并透传管道。工作流里采样器前后都是 Impact 节点时，用它能把连线减到最少。",
        inputs: [
          { name: "basic_pipe", type: "BASIC_PIPE", from: "典型上游：ToBasicPipe", desc: "打包好的模型与条件" },
          { name: "latent_image", type: "LATENT", from: "典型上游：EmptyLatentImage 或 VAEEncode", desc: "初始潜空间" }
        ],
        outputs: [
          { type: "LATENT", to: "典型下游：VAEDecode 或迭代放大", desc: "采样结果潜空间" },
          { type: "BASIC_PIPE", to: "典型下游：后续 Impact 节点", desc: "透传的管道" }
        ],
        why: "采样器也管道化之后，Impact 工作流可以做到全图只有几根主线。",
        params: [
          { name: "seed", kind: "整数", default: "0", desc: "随机种子。" },
          { name: "steps", kind: "整数", default: "20", desc: "采样步数。" },
          { name: "cfg", kind: "浮点数", default: "8.0", desc: "提示词遵循度。" },
          { name: "denoise", kind: "浮点数", default: "1.0", desc: "重绘幅度，文生图用 1。" }
        ],
        tips: ""
      },
      {
        name: "IterativeLatentUpscale",
        cat: "latent",
        brief: "分多轮放大潜空间，每轮之间重新采样。",
        desc: "把放大任务拆成 steps 轮进行：每轮先放大一点，再用 upscaler 输入提供的方式重新采样，比一步到位放大细节更扎实、噪点更少。配合 PixelKSampleUpscalerProvider 使用，是 Impact 放大流程的核心节点。",
        inputs: [
          { name: "samples", type: "LATENT", from: "典型上游：KSampler 输出", desc: "初始潜空间" },
          { name: "upscaler", type: "UPSCALER", from: "典型上游：PixelKSampleUpscalerProvider", desc: "定义每轮如何放大和采样" }
        ],
        outputs: [
          { type: "LATENT", to: "典型下游：VAEDecode", desc: "放大完成的潜空间" }
        ],
        why: "一次放大两倍再采样容易出油糊结构，分轮放大是大倍率出图质量的保底方案。",
        params: [
          { name: "upscale_factor", kind: "浮点数", default: "1.5", desc: "总放大倍数。" },
          { name: "steps", kind: "整数", default: "3", desc: "分几轮完成放大。" }
        ],
        tips: ""
      },
      {
        name: "IterativeImageUpscale",
        cat: "image",
        brief: "像素空间迭代放大，每轮放大后重新采样。",
        desc: "与 IterativeLatentUpscale 对应，输入是像素图像：每轮放大、编码、采样、解码后继续下一轮，输出最终图像。显存吃紧或希望每轮都经过像素处理时选它。",
        inputs: [
          { name: "pixels", type: "IMAGE", from: "典型上游：VAEDecode 输出", desc: "初始图像" },
          { name: "upscaler", type: "UPSCALER", from: "典型上游：PixelKSampleUpscalerProvider", desc: "每轮的放大采样配置" },
          { name: "vae", type: "VAE", from: "典型上游：CheckpointLoaderSimple", desc: "编码解码用的 VAE" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：SaveImage", desc: "放大完成的图像" }
        ],
        why: "从图像出发的迭代放大省去手动解码编码的接线，倍率大了也稳。",
        params: [
          { name: "upscale_factor", kind: "浮点数", default: "1.5", desc: "总放大倍数。" },
          { name: "steps", kind: "整数", default: "3", desc: "分几轮完成放大。" }
        ],
        tips: ""
      },
      {
        name: "LatentPixelScale",
        cat: "latent",
        brief: "潜空间一步放大：解码、缩放、再编码。",
        desc: "把潜空间解码成图像，用选定的插值方法或放大模型缩放后重新编码回潜空间。比直接在潜空间插值清晰得多，是快速放大潜图的常用手段，也常当作迭代放大流程里的单轮部件。",
        inputs: [
          { name: "samples", type: "LATENT", from: "典型上游：KSampler 输出", desc: "要放大的潜空间" },
          { name: "vae", type: "VAE", from: "典型上游：CheckpointLoaderSimple", desc: "编码解码用的 VAE" }
        ],
        outputs: [
          { type: "LATENT", to: "典型下游：KSampler 或 VAEDecode", desc: "放大后的潜空间" },
          { type: "IMAGE", to: "典型下游：预览或保存", desc: "编码前的放大图像" }
        ],
        why: "潜空间里直接缩放会糊，绕道像素空间再回来是最实用的折中。",
        params: [
          { name: "scale_factor", kind: "浮点数", default: "1.5", desc: "放大倍数。" },
          { name: "use_tiled_vae", kind: "开关", default: "disable", desc: "显存不足时开启分块编码解码。" }
        ],
        tips: ""
      },
      {
        name: "TwoSamplersForMask",
        cat: "sampler",
        brief: "遮罩内外用两个采样器分别采样再融合。",
        desc: "输入两个采样器和一张遮罩：遮罩内用 mask_sampler、遮罩外用 base_sampler，两路采样结果按遮罩融合成一张图。例如主体区用高 CFG 细化、背景区用低 CFG 保持安静，一个节点搞定分区差异化采样。",
        inputs: [
          { name: "base_sampler", type: "KSAMPLER", from: "典型上游：KSamplerProvider", desc: "遮罩外区域用的采样器" },
          { name: "mask_sampler", type: "KSAMPLER", from: "典型上游：KSamplerProvider", desc: "遮罩内区域用的采样器" },
          { name: "mask", type: "MASK", from: "典型上游：检测或手绘遮罩", desc: "划分两个采样区域的遮罩" },
          { name: "vae", type: "VAE", from: "典型上游：CheckpointLoaderSimple", desc: "编码解码用的 VAE" }
        ],
        outputs: [
          { type: "UPSCALER", to: "典型下游：Iterative Upscale 类放大节点", desc: "封装好的分区采样放大器" }
        ],
        why: "主体和背景需要不同强度对待时，双采样器是比反复局部重绘更干净的做法。",
        params: [
          { name: "use_tiled_vae", kind: "开关", default: "disable", desc: "显存不足时开启分块编码解码。" },
          { name: "tile_size", kind: "整数", default: "512", desc: "分块尺寸，仅在分块模式下生效。" }
        ],
        tips: ""
      },
      {
        name: "KSamplerProvider",
        cat: "sampler",
        brief: "把采样参数和管道封装成采样器对象。",
        desc: "输入 BASIC_PIPE 和一组采样参数（种子、步数、CFG、采样器、调度器、重绘幅度），输出一个 KSAMPLER 对象供 TwoSamplersForMask、分区放大器等节点使用。相当于把一次采样的配置预存起来交给需要采样器对象的节点。",
        inputs: [
          { name: "basic_pipe", type: "BASIC_PIPE", from: "典型上游：ToBasicPipe", desc: "打包好的模型与条件" }
        ],
        outputs: [
          { type: "KSAMPLER", to: "典型下游：TwoSamplersForMask", desc: "封装好的采样器对象" }
        ],
        why: "分区采样流程需要把采样配置当数据传递，这个节点就是打包站。",
        params: [
          { name: "seed", kind: "整数", default: "0", desc: "随机种子。" },
          { name: "steps", kind: "整数", default: "20", desc: "采样步数。" },
          { name: "cfg", kind: "浮点数", default: "8.0", desc: "提示词遵循度。" },
          { name: "denoise", kind: "浮点数", default: "1.0", desc: "重绘幅度。" }
        ],
        tips: ""
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
        params: [
          { name: "low_threshold", kind: "浮点数", default: "0.4", desc: "弱边缘门槛，亮度变化弱于它的部分被忽略，调高线条更少更干净，调低细节更多但也更杂。" },
          { name: "high_threshold", kind: "浮点数", default: "0.8", desc: "强边缘门槛，变化强于它的部分画成实线，与低阈值之间决定线条的主次过渡。" },
          { name: "resolution", kind: "整数", default: "512", desc: "预处理用的处理分辨率，越高边缘越精细也越慢，一般与出图分辨率接近。" }
        ],
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
        params: [
          { name: "coarse", kind: "下拉选择", default: "disable", desc: "粗略模式开关，影响线条的概括程度。",
            options: [["disable", "精细连贯的线稿，多数场景用它"], ["enable", "粗略模式，线条更少更概括"]] },
          { name: "resolution", kind: "整数", default: "512", desc: "处理分辨率，越高线条越精细也越慢。" }
        ],
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
        params: [
          { name: "resolution", kind: "整数", default: "512", desc: "处理分辨率，越高发丝和细线保留越完整也越慢。" }
        ],
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
        params: [
          { name: "ckpt_name", kind: "下拉选择", default: "depth_anything_v2_vitl.pth", desc: "模型规格，越大深度估计越准也越慢。",
            options: [["depth_anything_v2_vitl.pth", "大型模型，边界和细节最稳，常用推荐"], ["depth_anything_v2_vitb.pth", "中型，速度与质量折中"], ["depth_anything_v2_vits.pth", "小型最快，适合快速预览"]] },
          { name: "resolution", kind: "整数", default: "512", desc: "处理分辨率，越高深度细节越丰富也越慢。" }
        ],
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
        params: [
          { name: "bg_threshold", kind: "浮点数", default: "0.1", desc: "背景判定阈值，把最远的背景统一压黑让主体更突出，一般保持默认。" },
          { name: "resolution", kind: "整数", default: "512", desc: "处理分辨率，越高深度过渡越细腻也越慢。" }
        ],
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
        params: [
          { name: "safe", kind: "下拉选择", default: "enable", desc: "安全模式，决定是否抑制误检测出来的杂线。",
            options: [["enable", "开启后线条更少更干净，推荐"], ["disable", "保留更多边缘细节，噪线也会变多"]] },
          { name: "resolution", kind: "整数", default: "512", desc: "处理分辨率，越高边缘浓淡层次越丰富也越慢。" }
        ],
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
        params: [
          { name: "resolution", kind: "整数", default: "512", desc: "处理分辨率，越高边缘越清晰也越慢。" }
        ],
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
        params: [
          { name: "detect_body", kind: "开关", default: "enable", desc: "是否检测身体骨架，做姿势控制必须开启。" },
          { name: "detect_hand", kind: "开关", default: "enable", desc: "是否检测手部骨架，只控大致姿势时关掉可以提速。" },
          { name: "detect_face", kind: "开关", default: "enable", desc: "是否检测面部关键点，不需要控表情时可以关掉。" },
          { name: "resolution", kind: "整数", default: "512", desc: "处理分辨率，越高关键点定位越准也越慢。" }
        ],
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
        params: [
          { name: "detect_body", kind: "开关", default: "enable", desc: "是否检测身体骨架，做姿势控制必须开启。" },
          { name: "detect_hand", kind: "开关", default: "enable", desc: "是否检测手部骨架，复杂手势记得打开。" },
          { name: "detect_face", kind: "开关", default: "enable", desc: "是否检测面部关键点，不需要控表情时可以关掉。" },
          { name: "resolution", kind: "整数", default: "512", desc: "处理分辨率，越高手指等细节定位越准也越慢。" }
        ],
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
        params: [
          { name: "pyrUp_iters", kind: "整数", default: "3", desc: "色块化迭代次数，越大图越模糊、对细节的约束越松，1 到 3 常用。" },
          { name: "resolution", kind: "整数", default: "512", desc: "色块图的生成分辨率，一般保持默认即可。" }
        ],
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
        params: [
          { name: "resolution", kind: "整数", default: "512", desc: "处理分辨率，越高涂鸦线条越连贯也越慢。" }
        ],
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
        params: [],
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
        params: [
          { name: "resolution", kind: "整数", default: "512", desc: "处理分辨率，色彩分布的采样精度，一般保持默认。" },
          { name: "seed", kind: "整数", default: "0", desc: "打乱方式的随机种子，固定后色斑分布可以复现。" }
        ],
        tips: "控制强度不用太高；先看洗牌结果再决定是否接入 ControlNet。"
      },
      {
        name: "AIO_Preprocessor",
        cat: "image",
        brief: "一个节点下拉切换几乎所有预处理器。",
        desc: "全能预处理器：在下拉里选择任意一种预处理方式（Canny、线稿、深度、姿态、分割等），输入图像即输出对应控制图。除 Inpaint 等少数需要额外输入的处理器外全部支持。缺点是只能使用各处理器的默认参数，需要精细调参时请改用对应的具体节点。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage 或 VAEDecode", desc: "要预处理的参考图" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：ControlNetApplyAdvanced", desc: "所选预处理器生成的控制图" }
        ],
        why: "快速试验不同预处理效果时不用换节点，一个下拉全搞定，是入门 ControlNet 的最低门槛。",
        params: [
          { name: "preprocessor", kind: "下拉选择", default: "none", desc: "选择预处理方式，none 表示原图直接通过。" },
          { name: "resolution", kind: "整数", default: "512", desc: "处理分辨率，越高越精细也越慢。" }
        ],
        tips: ""
      },
      {
        name: "ControlNetPreprocessorSelector",
        cat: "util",
        brief: "只输出预处理器名称字符串的选择器。",
        desc: "它不处理图像，只把下拉选中的预处理器名字输出成字符串，接到 AIO_Preprocessor 的 preprocessor 输入上。用数据流而不是节点本身来切换预处理方式，方便在多条支路间共享同一个选择。",
        inputs: [],
        outputs: [
          { type: "COMBO", to: "典型下游：AIO_Preprocessor 的 preprocessor 输入", desc: "选中的预处理器名称" }
        ],
        why: "把选哪种预处理变成一根可复用的线，批量对比实验时特别好使。",
        params: [
          { name: "preprocessor", kind: "下拉选择", default: "none", desc: "要输出的预处理器名称。" }
        ],
        tips: ""
      },
      {
        name: "BinaryPreprocessor",
        cat: "image",
        brief: "把图像转成纯黑白二值线条。",
        desc: "按亮度阈值把图像压成纯黑与纯白两级，线条硬朗干净，没有中间灰度。配合 scribble 系 ControlNet 使用，适合需要极简线条控制构图、排除灰度干扰的场景。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage 或 VAEDecode", desc: "参考图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：ControlNetApplyAdvanced 配合 scribble 模型", desc: "黑白二值线条控制图" }
        ],
        why: "画面被灰度细节干扰时，二值化是最彻底的简化手段。",
        params: [
          { name: "bin_threshold", kind: "整数", default: "100", desc: "黑白分界阈值，调高黑区变多、线条变少。" },
          { name: "resolution", kind: "整数", default: "512", desc: "处理分辨率。" }
        ],
        tips: ""
      },
      {
        name: "LineartStandardPreprocessor",
        cat: "image",
        brief: "标准线稿预处理，平衡细节与概括。",
        desc: "生成介于精细与概括之间的标准线稿，通过高斯模糊强度和强度阈值控制线条的取舍。对应 sd-webui 里的 standard_lineart，配套 lineart 系 ControlNet 模型使用，是线稿控制里最常用的通用方案之一。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage 或 VAEDecode", desc: "参考图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：ControlNetApplyAdvanced 配合 lineart 模型", desc: "标准线稿控制图" }
        ],
        why: "既想要比 Canny 干净、又要比粗略模式保留更多细节时，标准线稿是均衡的选择。",
        params: [
          { name: "guassian_sigma", kind: "浮点数", default: "6.0", desc: "先做的高斯模糊强度，越大线条越概括。" },
          { name: "intensity_threshold", kind: "整数", default: "8", desc: "强度门槛，低于它的弱线条被丢弃。" },
          { name: "resolution", kind: "整数", default: "512", desc: "处理分辨率。" }
        ],
        tips: ""
      },
      {
        name: "Manga2Anime_LineArt_Preprocessor",
        cat: "image",
        brief: "从漫画图像提取去阴影的干净线稿。",
        desc: "针对漫画与动画截图优化，能去掉网点、阴影和色块干扰，输出较纯净的线稿，对应 lineart_anime_denoise 类模型。处理漫画素材比普通线稿器干净得多，断线和噪块明显更少。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage", desc: "漫画或动画截图" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：ControlNetApplyAdvanced 配合 lineart anime 模型", desc: "去阴影后的线稿控制图" }
        ],
        why: "漫画自带的网点和阴影会被普通线稿器误当轮廓，特化版专治这个。",
        params: [
          { name: "resolution", kind: "整数", default: "512", desc: "处理分辨率。" }
        ],
        tips: ""
      },
      {
        name: "M-LSDPreprocessor",
        cat: "image",
        brief: "提取画面中的直线段，专攻建筑与室内。",
        desc: "M-LSD 是轻量直线段检测算法，把画面里横平竖直的线条提取成直线控制图。配合 mlsd 系 ControlNet 使用，是建筑摄影、室内设计、几何构图控制的标准搭档，对曲线物体基本不起作用。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage 或 VAEDecode", desc: "参考图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：ControlNetApplyAdvanced 配合 mlsd 模型", desc: "直线段控制图" }
        ],
        why: "建筑和室内对横平竖直极其敏感，直线专用控制比通用线稿准得多。",
        params: [
          { name: "score_threshold", kind: "浮点数", default: "0.1", desc: "直线判定分数门槛，调高只留最明确的直线。" },
          { name: "dist_threshold", kind: "浮点数", default: "0.1", desc: "直线长度相关阈值，调高短线被过滤。" },
          { name: "resolution", kind: "整数", default: "512", desc: "处理分辨率。" }
        ],
        tips: ""
      },
      {
        name: "PiDiNetPreprocessor",
        cat: "image",
        brief: "轻量神经网络的软边缘提取器。",
        desc: "用 PiDiNet 模型提取带浓淡的软边缘，思路与 HED 类似但模型更轻量、速度更快。输出可配 softedge 或 scribble 系 ControlNet，safe 模式开启可抑制误检的杂线。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage 或 VAEDecode", desc: "参考图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：ControlNetApplyAdvanced 配合 softedge 模型", desc: "软边缘控制图" }
        ],
        why: "配置有限的机器上想要 HED 风格的软边缘，PiDiNet 是省资源的替代。",
        params: [
          { name: "safe", kind: "下拉选择", default: "enable", desc: "开启后抑制杂线，线条更少更干净。" },
          { name: "resolution", kind: "整数", default: "512", desc: "处理分辨率。" }
        ],
        tips: ""
      },
      {
        name: "Scribble_PiDiNet_Preprocessor",
        cat: "image",
        brief: "PiDiNet 版涂鸦线，线条更抽象随意。",
        desc: "在 PiDiNet 边缘基础上进一步简化成涂鸦风格，比真实线稿更潦草抽象。配合 scribble 系 ControlNet 使用，适合从照片生成手绘涂鸦感的画面。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage", desc: "参考图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：ControlNetApplyAdvanced 配合 scribble 模型", desc: "涂鸦风格控制图" }
        ],
        why: "想让结果只保留大概轮廓、细节自由发挥时，涂鸦化预处理是合适的控制强度。",
        params: [
          { name: "resolution", kind: "整数", default: "512", desc: "处理分辨率。" }
        ],
        tips: ""
      },
      {
        name: "Scribble_XDoG_Preprocessor",
        cat: "image",
        brief: "用 XDoG 算法生成高对比涂鸦线。",
        desc: "XDoG（扩展高斯差分）是一种图像滤镜算法，输出对比强烈、笔触分明的黑白涂鸦线。与普通 Scribble 相比线条更粗犷、更有版画感，配合 scribble 系 ControlNet 使用。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage", desc: "参考图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：ControlNetApplyAdvanced 配合 scribble 模型", desc: "高对比涂鸦控制图" }
        ],
        why: "版画和钢笔触感的画面用 XDoG 的线条风格更搭。",
        params: [
          { name: "resolution", kind: "整数", default: "512", desc: "处理分辨率。" }
        ],
        tips: ""
      },
      {
        name: "FakeScribblePreprocessor",
        cat: "image",
        brief: "用 HED 边缘模拟的手绘涂鸦线。",
        desc: "先用 HED 提取软边缘，再处理成类似人手涂鸦的线条，输出比真实涂鸦稳定一些。对应 sd-webui 的 scribble_hed，配合 scribble 系 ControlNet 使用。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage", desc: "参考图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：ControlNetApplyAdvanced 配合 scribble 模型", desc: "模拟涂鸦的控制图" }
        ],
        why: "涂鸦控制里最平衡的一档，比真涂鸦稳、比线稿自由。",
        params: [
          { name: "safe", kind: "下拉选择", default: "enable", desc: "开启后抑制杂线。" },
          { name: "resolution", kind: "整数", default: "512", desc: "处理分辨率。" }
        ],
        tips: ""
      },
      {
        name: "TEEDPreprocessor",
        cat: "image",
        brief: "轻量级边缘检测新秀，线条干净柔和。",
        desc: "TEED 是近年提出的轻量边缘检测模型，输出干净且连贯的软边缘，在 SDXL 的 softedge 模型上表现尤其好。比 HED 杂线更少，是新工作流里值得尝试的线稿方案。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage 或 VAEDecode", desc: "参考图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：ControlNetApplyAdvanced 配合 softedge 模型", desc: "软边缘控制图" }
        ],
        why: "模型小速度快、线条质量还不差，软边缘控制的实惠之选。",
        params: [
          { name: "safe_steps", kind: "整数", default: "2", desc: "安全步数，用于抑制误检杂线。" },
          { name: "resolution", kind: "整数", default: "512", desc: "处理分辨率。" }
        ],
        tips: ""
      },
      {
        name: "AnyLineArtPreprocessor_aux",
        cat: "image",
        brief: "AnyLine 线稿提取，细节丰富层次分明。",
        desc: "面向 mistoline（AnyLine）系 ControlNet 的线稿预处理器，能提取带深浅层次的细密线稿，对动漫图和实物都适用。可与多种 lineart 结果合并使用，上下限参数控制线条的取舍范围。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage 或 VAEDecode", desc: "参考图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：ControlNetApplyAdvanced 配合 mistoline 模型", desc: "带层次的线稿控制图" }
        ],
        why: "mistoline 类模型对预处理的层次要求高，AnyLine 是它的原配。",
        params: [
          { name: "merge_with_lineart", kind: "下拉选择", default: "lineart_standard", desc: "与哪种线稿结果合并，可选真实线稿、动漫线稿或漫画线稿。" },
          { name: "lineart_lower_bound", kind: "浮点数", default: "0", desc: "线稿下限，低于它的细节被丢弃。" },
          { name: "lineart_upper_bound", kind: "浮点数", default: "1", desc: "线稿上限。" },
          { name: "resolution", kind: "整数", default: "1280", desc: "处理分辨率，默认较高以保留细节。" }
        ],
        tips: ""
      },
      {
        name: "PyraCannyPreprocessor",
        cat: "image",
        brief: "金字塔式 Canny，SDXL 放大流程更稳。",
        desc: "PyraCanny 对 Canny 的改进：以整数阈值工作并在多分辨率金字塔上处理，线条在放大流程中更稳定连贯。主要为 SDXL 高分辨率工作流设计，参数含义与普通 Canny 相同。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage 或放大节点", desc: "参考图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：ControlNetApplyAdvanced 配合 canny 模型", desc: "多分辨率优化的边缘控制图" }
        ],
        why: "SDXL 大图流程里普通 Canny 的线容易碎，金字塔处理明显更稳。",
        params: [
          { name: "low_threshold", kind: "整数", default: "64", desc: "低阈值，弱于此的边缘被忽略。" },
          { name: "high_threshold", kind: "整数", default: "128", desc: "高阈值，强于此的画成实线。" },
          { name: "resolution", kind: "整数", default: "512", desc: "处理分辨率。" }
        ],
        tips: ""
      },
      {
        name: "DiffusionEdge_Preprocessor",
        cat: "image",
        brief: "用扩散模型提取高质量软边缘。",
        desc: "DiffusionEdge 用扩散模型做边缘检测，线条质量高、抗噪能力强，适合对线稿质量要求高的场合。运行较慢，可选室内、城市、自然三种场景环境适配。注意它不支持被 AIO 预处理器调用，必须单独使用。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage 或 VAEDecode", desc: "参考图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：ControlNetApplyAdvanced 配合 softedge 模型", desc: "高质量软边缘控制图" }
        ],
        why: "对线稿质量有洁癖时值得等它慢慢算。",
        params: [
          { name: "environment", kind: "下拉选择", default: "indoor", desc: "按图像场景选择适配环境。" },
          { name: "patch_batch_size", kind: "整数", default: "4", desc: "分块批处理大小，越大越快越占显存。" },
          { name: "resolution", kind: "整数", default: "512", desc: "处理分辨率。" }
        ],
        tips: ""
      },
      {
        name: "Zoe-DepthMapPreprocessor",
        cat: "image",
        brief: "Zoe 深度估计模型，室内场景表现出色。",
        desc: "Zoe 是早期广泛使用的单目深度估计模型，输出明暗表示远近的深度图。与 depth 系 ControlNet 搭配，室内场景深度过渡自然，是 Depth Anything 出现前的主力方案，大量旧工作流仍在使用。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage 或 VAEDecode", desc: "参考图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：ControlNetApplyAdvanced 配合 depth 模型", desc: "灰度深度控制图" }
        ],
        why: "复刻旧工作流或与早期 depth 模型搭配时，Zoe 的深度风格更协调。",
        params: [
          { name: "resolution", kind: "整数", default: "512", desc: "处理分辨率。" }
        ],
        tips: ""
      },
      {
        name: "LeReS-DepthMapPreprocessor",
        cat: "image",
        brief: "LeReS 深度估计，可手动压平近景或背景。",
        desc: "LeReS 输出深度图并额外提供两个独有参数：rm_nearest 可把最近的一段距离压平，rm_background 可把最远的背景压平，用来突出主体层次。boost 开关启用增强版模型，更准但更慢。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage 或 VAEDecode", desc: "参考图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：ControlNetApplyAdvanced 配合 depth 模型", desc: "深度控制图" }
        ],
        why: "背景杂乱抢戏时，把远景统一压平是深度控制里少有的主动干预手段。",
        params: [
          { name: "rm_nearest", kind: "浮点数", default: "0", desc: "把最近多大距离内的物体压成同亮度。" },
          { name: "rm_background", kind: "浮点数", default: "0", desc: "把背景压平的范围。" },
          { name: "boost", kind: "下拉选择", default: "disable", desc: "开启后使用增强版模型，精度更高速度更慢。" }
        ],
        tips: ""
      },
      {
        name: "DepthAnythingPreprocessor",
        cat: "image",
        brief: "第一代 Depth Anything 深度估计。",
        desc: "第一代通用深度估计模型，泛化能力强，各类图像的深度结构都稳定。第二代已出，但部分 ControlNet 模型与一代深度风格匹配更好，复刻旧工作流时也需要它。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage 或 VAEDecode", desc: "参考图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：ControlNetApplyAdvanced 配合 depth 模型", desc: "灰度深度控制图" }
        ],
        why: "一代与二代的深度明暗分布有差异，配模型时要跟着选对版本。",
        params: [
          { name: "ckpt_name", kind: "下拉选择", default: "depth_anything_vitl14.pth", desc: "模型规格，vitl 最准最慢，vits 最快。" },
          { name: "resolution", kind: "整数", default: "512", desc: "处理分辨率。" }
        ],
        tips: ""
      },
      {
        name: "BAE-NormalMapPreprocessor",
        cat: "image",
        brief: "BAE 法线贴图估计，控制凹凸结构。",
        desc: "法线贴图用 RGB 颜色编码每个像素表面的朝向，比深度图更精细地表达表面起伏。BAE 是常用的法线估计模型，配合 normalbae 系 ControlNet，可以在保持光照结构的同时改换材质与画风。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage 或 VAEDecode", desc: "参考图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：ControlNetApplyAdvanced 配合 normalbae 模型", desc: "彩色法线控制图" }
        ],
        why: "想保留雕塑般的表面结构又想换材质换画风，法线控制比深度控制更细。",
        params: [
          { name: "resolution", kind: "整数", default: "512", desc: "处理分辨率。" }
        ],
        tips: ""
      },
      {
        name: "MiDaS-NormalMapPreprocessor",
        cat: "image",
        brief: "用 MiDaS 深度换算的法线贴图。",
        desc: "先用 MiDaS 估计深度再换算法线方向，输出与 BAE 类似的法线控制图，是早期工作流里的法线方案。参数 a 控制角度换算系数，bg_threshold 控制背景判定。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage 或 VAEDecode", desc: "参考图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：ControlNetApplyAdvanced 配合 normal 模型", desc: "法线控制图" }
        ],
        why: "复刻旧法线控制工作流时保持同一来源才能还原效果。",
        params: [
          { name: "bg_threshold", kind: "浮点数", default: "0.1", desc: "背景判定阈值。" },
          { name: "resolution", kind: "整数", default: "512", desc: "处理分辨率。" }
        ],
        tips: ""
      },
      {
        name: "MeshGraphormer-DepthMapPreprocessor",
        cat: "image",
        brief: "手部修复专用深度图生成器。",
        desc: "MeshGraphormer 检测图像中的手并重建手部三维结构，输出把手部区域替换成合理手部深度的特殊深度图，配合 HandRefiner 的 inpaint depth ControlNet 使用，是修复崩坏手指的经典方案。另有与 Impact 检测器联动的增强版节点。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：VAEDecode 或 LoadImage", desc: "包含手部的图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：ControlNetApplyAdvanced 配合 inpaint depth hand 模型", desc: "手部深度修正图" }
        ],
        why: "崩手是人物图的高发问题，这个节点给出的手部深度是专门为修手设计的。",
        params: [
          { name: "mask_bbox_padding", kind: "整数", default: "30", desc: "手部区域边界框的外扩像素数。" },
          { name: "mask_type", kind: "下拉选择", default: "based_on_depth", desc: "遮罩生成方式，影响替换区域范围。" },
          { name: "detect_thr", kind: "浮点数", default: "0.6", desc: "手部检测置信度阈值。" }
        ],
        tips: ""
      },
      {
        name: "MediaPipe-FaceMeshPreprocessor",
        cat: "image",
        brief: "人脸网格关键点检测，输出面部网格控制图。",
        desc: "MediaPipe 在每张脸上标出细密网格关键点，输出覆盖眼、鼻、唇的面部网格图，配合 laion face 或 mediapipe face 类 ControlNet 控制面部朝向与表情结构。max_faces 限制最多处理几张脸，适合合影场景。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage 或 VAEDecode", desc: "包含人脸的图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：ControlNetApplyAdvanced 配合 face 类模型", desc: "面部网格控制图" }
        ],
        why: "换脸和表情控制需要脸部的细粒度结构，网格点比骨架点丰富得多。",
        params: [
          { name: "max_faces", kind: "整数", default: "10", desc: "最多检测的人脸数量。" },
          { name: "min_confidence", kind: "浮点数", default: "0.5", desc: "人脸判定置信度，调高只留清晰的正脸。" },
          { name: "resolution", kind: "整数", default: "512", desc: "处理分辨率。" }
        ],
        tips: ""
      },
      {
        name: "AnimalPosePreprocessor",
        cat: "image",
        brief: "检测猫狗等动物的骨骼关键点。",
        desc: "人体姿态估计的动物版：检测动物的身体和四足关键点并画成骨架图，配合动物 openpose 类 ControlNet 控制动物姿势。对遮挡严重或非四足动物效果会下降，出骨架前先预览确认。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage", desc: "包含动物的图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：ControlNetApplyAdvanced 配合 animal openpose 模型", desc: "动物骨架控制图" }
        ],
        why: "宠物写真和动物插画想控制姿势，人体骨架模型帮不上忙，得靠它。",
        params: [
          { name: "resolution", kind: "整数", default: "512", desc: "处理分辨率。" }
        ],
        tips: ""
      },
      {
        name: "DensePosePreprocessor",
        cat: "image",
        brief: "人体密集部位分割图，视频动作迁移常用。",
        desc: "DensePose 把人体划分成二十多个身体部位并用不同颜色标注，传递比骨架更丰富的人体表面信息。主要用于 MagicAnimate 一类视频动作迁移流程，cmap 参数决定配色方案，不同生态的工作流要求不同配色。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage 或视频帧", desc: "包含人物的图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：ControlNetApplyAdvanced 配合 densepose 类模型", desc: "部位彩色标注图" }
        ],
        why: "做人物动作迁移视频时，DensePose 是比骨架信息量更大的控制来源。",
        params: [
          { name: "model", kind: "下拉选择", default: "densepose_r50_fpn_dl.torchscript", desc: "检测模型规格。" },
          { name: "cmap", kind: "下拉选择", default: "Viridis (MagicAnimate)", desc: "部位配色方案，按所用模型生态选择。" },
          { name: "resolution", kind: "整数", default: "512", desc: "处理分辨率。" }
        ],
        tips: ""
      },
      {
        name: "SemSegPreprocessor",
        cat: "image",
        brief: "UniFormer 语义分割，按类别涂色。",
        desc: "语义分割把画面按类别（人、车、天空、建筑等）划分并涂成不同颜色，配合 seg 系 ControlNet 控制画面布局结构。SemSeg 是旧版入口，内部使用 UniFormer 模型，与 UniFormer-SemSegPreprocessor 等效。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage 或 VAEDecode", desc: "参考图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：ControlNetApplyAdvanced 配合 seg 模型", desc: "语义分割控制图" }
        ],
        why: "想让生成结果保持人在这、天在那的布局关系，分割控制比线稿深度都直接。",
        params: [
          { name: "resolution", kind: "整数", default: "512", desc: "处理分辨率。" }
        ],
        tips: ""
      },
      {
        name: "OneFormer-ADE20K-SemSegPreprocessor",
        cat: "image",
        brief: "OneFormer 语义分割，ADE20K 类别体系。",
        desc: "用 OneFormer 模型按 ADE20K 一百五十类标准做语义分割，类别划分细、精度高。配合 seg 系 ControlNet 使用，是旧 UniFormer 方案的升级替代。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage 或 VAEDecode", desc: "参考图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：ControlNetApplyAdvanced 配合 seg 模型", desc: "语义分割控制图" }
        ],
        why: "场景构成复杂、类别多时，更细的类别体系让布局控制更精确。",
        params: [
          { name: "resolution", kind: "整数", default: "512", desc: "处理分辨率。" }
        ],
        tips: ""
      },
      {
        name: "OneFormer-COCO-SemSegPreprocessor",
        cat: "image",
        brief: "OneFormer 语义分割，COCO 类别体系。",
        desc: "与 ADE20K 版本同族，改用 COCO 八十类物体类别体系，类别少但更聚焦常见物体。按你的 ControlNet 模型训练时使用的分割体系选择对应版本，两者不可混用。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage 或 VAEDecode", desc: "参考图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：ControlNetApplyAdvanced 配合 seg 模型", desc: "语义分割控制图" }
        ],
        why: "分割体系要与模型匹配，颜色对不上位就起不到控制作用。",
        params: [
          { name: "resolution", kind: "整数", default: "512", desc: "处理分辨率。" }
        ],
        tips: ""
      },
      {
        name: "AnimeFace_SemSegPreprocessor",
        cat: "image",
        brief: "动漫人脸专用语义分割。",
        desc: "专门针对动漫人脸训练的分割模型，把头发、眼睛、皮肤等部位分开标色，输出彩色分割图和可去除背景的角色遮罩。模型只在 512 分辨率下训练，resolution 固定为 512。输出的遮罩还能直接用于抠出人物。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage 或 VAEDecode", desc: "动漫人物图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：ControlNetApplyAdvanced 配合 seg 模型", desc: "部位分割控制图" },
          { type: "MASK", to: "典型下游：抠图或遮罩节点", desc: "去除背景后的角色遮罩" }
        ],
        why: "二次元抠图和换发色换瞳色这类局部改色，都从这份分割数据开始。",
        params: [
          { name: "remove_background_using_abg", kind: "开关", default: "enable", desc: "开启后用 ABG 模型去除背景输出角色遮罩。" }
        ],
        tips: ""
      },
      {
        name: "SAMPreprocessor",
        cat: "image",
        brief: "用 Segment Anything 分割全图所有物体。",
        desc: "让 Segment Anything 模型自动把画面里能识别的物体全部分割出来，输出带彩色区块的分割图。配合 seg 类 ControlNet 可控制画面中物体的分布与形状，属于零样本的通用分割方案。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage", desc: "参考图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：ControlNetApplyAdvanced 配合 seg 模型", desc: "全图分割控制图" }
        ],
        why: "不挑类别、什么都能分，画面物体布局控制的万能兜底。",
        params: [
          { name: "resolution", kind: "整数", default: "512", desc: "处理分辨率。" }
        ],
        tips: ""
      },
      {
        name: "ColorPreprocessor",
        cat: "image",
        brief: "提取参考图色板，控制整体配色。",
        desc: "把图像压缩成几张横向色带，保留整体配色关系而丢弃内容。配合 t2iadapter_color 使用，把参考图的色彩方案迁移到生成结果上，属于纯色彩层面的软控制。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage", desc: "提供配色的参考图" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：ControlNetApplyAdvanced 配合 t2iadapter_color", desc: "色板控制图" }
        ],
        why: "配色和内容解耦控制时，色板是最轻量的载体。",
        params: [
          { name: "resolution", kind: "整数", default: "512", desc: "处理分辨率。" }
        ],
        tips: ""
      },
      {
        name: "ImageLuminanceDetector",
        cat: "image",
        brief: "提取亮度分布图，recolor 控制用。",
        desc: "把图像转成纯亮度信息图，配合 recolor luminance 类 ControlNet 使用：生成结果跟随参考图的明暗分布，但颜色可以完全重设计，是黑白照片上色、整体换色调流程的常用预处理。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage", desc: "参考图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：ControlNetApplyAdvanced 配合 recolor 模型", desc: "亮度分布控制图" }
        ],
        why: "只想继承明暗不继承颜色时，亮度图就是两者之间的隔离带。",
        params: [
          { name: "gamma_correction", kind: "浮点数", default: "1.0", desc: "伽马校正，调整明暗分布的对比。" },
          { name: "resolution", kind: "整数", default: "512", desc: "处理分辨率。" }
        ],
        tips: ""
      },
      {
        name: "ImageIntensityDetector",
        cat: "image",
        brief: "提取图像强度分布，另一种 recolor 预处理。",
        desc: "与亮度版类似但换算方式不同，输出图像强度分布图，配合 recolor intensity 类 ControlNet 使用。两个版本效果相近，按所用模型的匹配情况选择即可。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage", desc: "参考图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：ControlNetApplyAdvanced 配合 recolor 模型", desc: "强度分布控制图" }
        ],
        why: "不同 recolor 模型偏好的换算不同，两个版本互为备份。",
        params: [
          { name: "resolution", kind: "整数", default: "512", desc: "处理分辨率。" }
        ],
        tips: ""
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
        params: [
          { name: "width", kind: "整数", default: "512", desc: "目标宽度，设 0 表示跟随原图或按比例自动计算。" },
          { name: "height", kind: "整数", default: "512", desc: "目标高度，设 0 表示跟随原图或按比例自动计算。" },
          { name: "method", kind: "下拉选择", default: "stretch", desc: "缩放策略，决定原图比例与目标不一致时怎么处理。",
            options: [["stretch", "强行拉伸到目标宽高，画面会变形"], ["keep proportion", "保比例缩放，结果可能不精确等于目标尺寸"], ["fill / crop", "保比例铺满后裁掉多余部分，统一一批尺寸最省心"], ["pad", "保比例缩放后补边，内容完整不裁切"]] },
          { name: "interpolation", kind: "下拉选择", default: "nearest", desc: "插值算法，影响缩放后的清晰度。",
            options: [["lanczos", "缩小图片时观感最锐利，最常用"], ["bicubic", "平滑适中"], ["nearest", "最近邻，最快但有锯齿，像素风可用"]] },
          { name: "condition", kind: "下拉选择", default: "always", desc: "什么情况下才执行缩放，可以只在图比目标大或小时才动。",
            options: [["always", "每次都缩放"], ["downscale if bigger", "图比目标大时才缩小，小图保持原样"], ["upscale if smaller", "图比目标小时才放大，大图保持原样"]] },
          { name: "multiple_of", kind: "整数", default: "0", desc: "把结果尺寸对齐到该数的倍数，8 是扩散模型的安全值，SDXL 常用 64，0 表示不处理。" }
        ],
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
        params: [
          { name: "axis", kind: "下拉选择", default: "x", desc: "翻转方向。",
            options: [["x", "水平镜像，左右对调"], ["y", "垂直翻转，上下对调"], ["xy", "双向翻转，相当于旋转 180 度"]] }
        ],
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
        params: [
          { name: "width", kind: "整数", default: "256", desc: "裁剪宽度，超出源图会被自动截到边界。" },
          { name: "height", kind: "整数", default: "256", desc: "裁剪高度，超出源图会被自动截到边界。" },
          { name: "position", kind: "下拉选择", default: "top-left", desc: "裁剪锚点在图的哪个方位。",
            options: [["center", "居中裁剪，二次构图最常用"], ["top-left", "从左上角开始裁"], ["bottom-right", "从右下角开始裁"]] },
          { name: "x_offset", kind: "整数", default: "0", desc: "起点横坐标微调，正数向右移、负数向左移。" },
          { name: "y_offset", kind: "整数", default: "0", desc: "起点纵坐标微调，正数向下移、负数向上移。" }
        ],
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
        params: [
          { name: "method", kind: "下拉选择", default: "lanczos", desc: "尺寸不一致时对齐用的插值算法，lanczos 效果较好。" }
        ],
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
        params: [
          { name: "size", kind: "整数", default: "16", desc: "目标帧数，输出正好这个数量。" },
          { name: "method", kind: "下拉选择", default: "expand", desc: "凑数策略，决定多出的帧怎么生成、缺的帧怎么补。",
            options: [["expand", "在批次内均匀取样，数量变多时相邻帧自动过渡，适合补间"], ["repeat all", "整批循环复制凑满"], ["repeat first", "在开头复制首帧补齐"], ["repeat last", "在末尾复制末帧补齐，只为凑数时最不伤画质"]] }
        ],
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
        params: [
          { name: "start", kind: "整数", default: "0", desc: "起始序号，从 0 开始数，超出范围会自动夹到最后一帧。" },
          { name: "length", kind: "整数", default: "-1", desc: "取多少张，-1 表示从起点一直取到末尾。" }
        ],
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
        params: [],
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
        params: [],
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
        params: [
          { name: "x", kind: "整数", default: "0", desc: "源图粘贴到 底图 上的横坐标，支持负数表示部分移出画面。" },
          { name: "y", kind: "整数", default: "0", desc: "粘贴的纵坐标，负数表示向上移出画面。" },
          { name: "offset_x", kind: "整数", default: "0", desc: "在 x 基础上再整体偏移的量，方便接外部坐标数据。" },
          { name: "offset_y", kind: "整数", default: "0", desc: "在 y 基础上再整体偏移的量。" }
        ],
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
        params: [
          { name: "color_space", kind: "下拉选择", default: "LAB", desc: "统计色彩分布用的色彩空间。",
            options: [["LAB", "按亮度与色彩分离统计，最常用最稳"], ["RGB", "直接按三通道统计，简单直接"], ["YCbCr", "按亮度与色度统计，肤色场景可用"]] },
          { name: "factor", kind: "浮点数", default: "1.0", desc: "匹配力度，0 不变，1 完全对齐参考图；想保留原图氛围可以从 0.5 左右试起。" }
        ],
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
        params: [
          { name: "sharpen", kind: "浮点数", default: "5.0", desc: "锐化强度，越大细节越脆也越容易出现白边，从低数值试起。" },
          { name: "noise_radius", kind: "整数", default: "7", desc: "保边滤波的半径，越大抹噪越多，过大可能糊掉细节。" },
          { name: "preserve_edges", kind: "浮点数", default: "0.75", desc: "边缘保护程度，越高越不容易把噪点一起锐化，0.5 到 0.9 常用。" },
          { name: "ratio", kind: "浮点数", default: "0.5", desc: "锐化结果与保边模糊结果的混合比例，1 为全锐化、0 为全模糊。" }
        ],
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
        params: [],
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
        params: [
          { name: "prefix", kind: "文本", default: "Value:", desc: "打印前缀，用来区分控制台里多条日志分别来自哪个节点。" }
        ],
        tips: "去启动 ComfyUI 的那个终端窗口看输出；一条线看不透就沿线多放几个分别打印。"
      },
      {
        name: "ImageEnhanceDifference+",
        cat: "image",
        brief: "放大两张图之间的差异，让局部变化清晰可见。",
        desc: "对比 image1 和 image2 的像素差异并按指数放大输出差异图。调试局部重绘效果、对比不同参数的两张输出时一眼看出改了哪里。",
        inputs: [
          { name: "image1", type: "IMAGE", from: "对比的第一张图", desc: "基准图" },
          { name: "image2", type: "IMAGE", from: "对比的第二张图", desc: "对比图" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：SaveImage 预览", desc: "差异放大后的图" }
        ],
        why: "参数调没调出区别，肉眼比像素级对比图更直观。",
        params: [
          { name: "exponent", kind: "浮点数", default: "0.75", desc: "差异放大指数，越小差异越明显。" }
        ],
        tips: ""
      },
      {
        name: "ImageCompositeFromMaskBatch+",
        cat: "image",
        brief: "按遮罩批次把一批图逐张合成到另一批图上。",
        desc: "image_from 与 image_to 两个批次按遮罩逐帧合成，遮罩批次决定每帧的融合范围。配合逐帧遮罩做批量局部替换，是批量修图流程的合成工位。",
        inputs: [
          { name: "image_from", type: "IMAGE", from: "提供内容的批次", desc: "要贴上去的图" },
          { name: "image_to", type: "IMAGE", from: "底图批次", desc: "被合成的底图" },
          { name: "mask", type: "MASK", from: "遮罩批次", desc: "控制融合范围的遮罩" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：SaveImage", desc: "批量合成结果" }
        ],
        why: "逐帧对齐的批量合成用核心节点要绕好几步，它一步到位。",
        params: [],
        tips: ""
      },
      {
        name: "ImageRandomTransform+",
        cat: "image",
        brief: "按种子对图像做随机裁剪缩放翻转增广。",
        desc: "用种子驱动一组随机的位置、缩放和变换，输出变换后的图，repeat 参数可一次生成多个变体。数据增广和抽卡式二次构图的便捷工具。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage 或 VAEDecode", desc: "原图" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：批处理或保存", desc: "随机变换后的图" }
        ],
        why: "同一张素材想要多个随机取景变体，手动裁剪太慢。",
        params: [
          { name: "seed", kind: "整数", default: "0", desc: "随机变换的种子。" },
          { name: "repeat", kind: "整数", default: "1", desc: "生成多少个变体。" },
          { name: "variation", kind: "浮点数", default: "0.1", desc: "变换幅度，越大变化越明显。" }
        ],
        tips: ""
      },
      {
        name: "ImageRemoveAlpha+",
        cat: "image",
        brief: "去掉 PNG 透明通道，输出纯 RGB 图像。",
        desc: "把带透明通道的图像压平成不带透明的三通道图，透明区域按黑底处理。很多下游节点不支持四通道图像，出问题前先压平是省心做法。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage 加载的 PNG", desc: "带透明通道的图" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：任何图像节点", desc: "无透明通道的图像" }
        ],
        why: "透明通道引起的偶发报错很难排查，提前统一通道数最省心。",
        params: [],
        tips: ""
      },
      {
        name: "ImageRemoveBackground+",
        cat: "image",
        brief: "用 RemBG 会话抠出主体、去掉背景。",
        desc: "接收 RemBGSession+ 或 TransparentBGSession+ 提供的会话，对图像做主体分割，输出去背图和主体遮罩。配合会话节点的不同模型，可针对人物、动漫或衣物优化。",
        inputs: [
          { name: "rembg_session", type: "REMBG_SESSION", from: "典型上游：RemBGSession+", desc: "抠图会话与模型" },
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage", desc: "要抠图的图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：合成或保存", desc: "去背景后的图像" },
          { type: "MASK", to: "典型下游：遮罩类节点", desc: "主体遮罩" }
        ],
        why: "不需要额外打点标注的一键抠图，做贴图和合成的前置步骤。",
        params: [],
        tips: ""
      },
      {
        name: "RemBGSession+",
        cat: "load",
        brief: "加载 RemBG 抠图模型，生成可复用的会话。",
        desc: "选择一个 RemBG 模型（通用、轻量、人物、衣物、动漫等）和运行设备，输出 REMBG_SESSION 会话供 ImageRemoveBackground+ 使用。会话只加载一次模型，后续多张图复用，省去重复开销。",
        inputs: [],
        outputs: [
          { type: "REMBG_SESSION", to: "典型下游：ImageRemoveBackground+", desc: "抠图会话" }
        ],
        why: "模型加载和抠图分离，批量抠图时不用每张图都重新加载模型。",
        params: [
          { name: "model", kind: "下拉选择", default: "u2net: general purpose", desc: "按素材类型选模型，动漫图选 isnet-anime。" },
          { name: "providers", kind: "下拉选择", default: "CPU", desc: "运行设备，有独显可选 CUDA 提速。" }
        ],
        tips: ""
      },
      {
        name: "TransparentBGSession+",
        cat: "load",
        brief: "加载 InSPyReNet 透明背景模型会话。",
        desc: "加载 InSPyReNet 系列的透明背景分割模型，输出会话供 ImageRemoveBackground+ 使用。与 RemBG 相比边缘细节更好，适合对抠图质量要求高的场合。",
        inputs: [],
        outputs: [
          { type: "REMBG_SESSION", to: "典型下游：ImageRemoveBackground+", desc: "抠图会话" }
        ],
        why: "头发丝级别的抠图质量，比通用 RemBG 模型高一档。",
        params: [
          { name: "mode", kind: "下拉选择", default: "base", desc: "模型版本，base 质量好，fast 速度快。" },
          { name: "use_jit", kind: "开关", default: "enable", desc: "启用 JIT 加速推理。" }
        ],
        tips: ""
      },
      {
        name: "ImageSeamCarving+",
        cat: "image",
        brief: "接缝裁剪缩图，删除不重要的内容保主体。",
        desc: "接缝裁剪（Seam Carving）通过删除低能量像素带改变尺寸：不是均匀缩放，而是把最不重要的部分挤掉，主体比例保持不变。可用遮罩保护必须保留或必须删除的区域。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage", desc: "源图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：SaveImage 或继续处理", desc: "缩放后的图像" }
        ],
        why: "把横构图改成竖构图又不许变形不许裁掉主体时，只有它能办到。",
        params: [
          { name: "width", kind: "整数", default: "512", desc: "目标宽度。" },
          { name: "height", kind: "整数", default: "512", desc: "目标高度。" },
          { name: "energy", kind: "下拉选择", default: "backward", desc: "能量计算方式，forward 更慢但更保护结构。" }
        ],
        tips: ""
      },
      {
        name: "ImageTile+",
        cat: "image",
        brief: "把大图切成带重叠的小块网格。",
        desc: "按行列把图像切块，可设置块间重叠像素，输出全部小块及每块的宽高和重叠信息。分块放大、分块局部重绘流程的第一步，配套的 ImageUntile+ 负责还原拼合。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：放大节点或 VAEDecode", desc: "要切块的大图" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：逐块处理节点", desc: "切块后的批次" },
          { type: "INT", to: "典型下游：ImageUntile+ 的对应输入", desc: "块宽、块高与重叠量" }
        ],
        why: "分块处理大图的核心不在于切，而在于切完还能严丝合缝拼回去。",
        params: [
          { name: "rows", kind: "整数", default: "2", desc: "切几行。" },
          { name: "cols", kind: "整数", default: "2", desc: "切几列。" },
          { name: "overlap", kind: "浮点数", default: "0", desc: "块间重叠比例，重叠区让拼合无缝。" }
        ],
        tips: ""
      },
      {
        name: "ImageUntile+",
        cat: "image",
        brief: "把切块处理后的图像重新拼合成整图。",
        desc: "ImageTile+ 的逆操作：接收处理过的小块批次和切块时的行列、重叠参数，拼回完整大图。重叠区会做融合过渡，是分块放大流程的收尾环节。",
        inputs: [
          { name: "tiles", type: "IMAGE", from: "典型上游：逐块处理后的批次", desc: "处理过的小块" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：SaveImage", desc: "拼合完成的整图" }
        ],
        why: "切块与拼回的参数完全对称，才不会出现错位接缝。",
        params: [
          { name: "rows", kind: "整数", default: "2", desc: "与切块时的行数一致。" },
          { name: "cols", kind: "整数", default: "2", desc: "与切块时的列数一致。" },
          { name: "overlap_x", kind: "整数", default: "0", desc: "与切块时的横向重叠一致。" }
        ],
        tips: ""
      },
      {
        name: "ImageApplyLUT+",
        cat: "image",
        brief: "用 LUT 调色文件给图像上色。",
        desc: "加载 luts 目录里的 LUT（查找表调色文件）应用到图像，strength 控制调色强度。把达芬奇或 PS 里的调色方案直接搬进工作流，比手动调曲线更风格化也更省事。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：VAEDecode", desc: "要调色的图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：SaveImage", desc: "调色后的图像" }
        ],
        why: "专业调色不必重学，把现成的 LUT 文件丢进目录就能用。",
        params: [
          { name: "lut_file", kind: "下拉选择", default: "", desc: "选择 luts 目录里的调色文件。" },
          { name: "strength", kind: "浮点数", default: "1.0", desc: "调色强度，0 为不生效。" }
        ],
        tips: ""
      },
      {
        name: "ImageCASharpening+",
        cat: "image",
        brief: "对比度自适应锐化，一步完成的轻量锐化。",
        desc: "CAS（Contrast Adaptive Sharpening）是 AMD 提出的单 pass 锐化算法：对比度高的区域锐得轻、对比度低的区域锐得重，不易出白边。只需一个 amount 参数，是快速提升观感锐利度的实惠选择。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：放大或重绘输出", desc: "待锐化的图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：SaveImage", desc: "锐化后的图像" }
        ],
        why: "参数只有一个还不出白边，锐化收尾的工具首选之一。",
        params: [
          { name: "amount", kind: "浮点数", default: "0.8", desc: "锐化强度，0 到 1，过高会出现噪点。" }
        ],
        tips: ""
      },
      {
        name: "ImageDesaturate+",
        cat: "image",
        brief: "把图像转灰度，可选四种去色算法。",
        desc: "按所选算法把彩色图转成灰度：两种标准亮度加权、平均值或明暗折中。做黑白画面、色彩匹配预处理或给上色流程打底时使用。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：VAEDecode 或 LoadImage", desc: "要去色的图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：SaveImage 或上色流程", desc: "灰度图像" }
        ],
        why: "不同灰度换算的明暗层次有差，四种算法覆盖不同审美偏好。",
        params: [
          { name: "factor", kind: "浮点数", default: "1.0", desc: "去色程度，1 为全灰，低数值保留部分色彩。" },
          { name: "method", kind: "下拉选择", default: "luminance (Rec.709)", desc: "灰度换算算法。" }
        ],
        tips: ""
      },
      {
        name: "ImagePosterize+",
        cat: "image",
        brief: "按阈值把图像压成大幅色块。",
        desc: "色阶分离的简化版：按亮度阈值把图像分成明暗两档，输出类似剪纸或海报的强对比色块图。做扁平风格、色块底稿或遮罩近似时使用。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：VAEDecode", desc: "源图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：SaveImage 或合成", desc: "色块化图像" }
        ],
        why: "把连续影调压成几块颜色，是扁平插画风最快的前处理。",
        params: [
          { name: "threshold", kind: "浮点数", default: "0.5", desc: "明暗分界阈值，偏移它改变色块占比。" }
        ],
        tips: ""
      },
      {
        name: "PixelOEPixelize+",
        cat: "image",
        brief: "把图像转成精心量化的像素画。",
        desc: "基于 PixelOE 思路的像素画转换：先按对比度降采样再量化色彩，输出货真价实的像素艺术而不是模糊马赛克。提供 k-centroid 等多种降采样模式，可自动放大回目标尺寸。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage 或 VAEDecode", desc: "源图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：SaveImage", desc: "像素画风格图像" }
        ],
        why: "像素游戏头像和图标素材不用手点，直接从出图转换。",
        params: [
          { name: "target_size", kind: "整数", default: "128", desc: "像素画的目标逻辑尺寸。" },
          { name: "patch_size", kind: "整数", default: "16", desc: "色块聚合大小，决定像素颗粒感。" },
          { name: "downscale_mode", kind: "下拉选择", default: "contrast", desc: "降采样方式，contrast 保留结构最清晰。" },
          { name: "upscale", kind: "开关", default: "enable", desc: "是否放大回大尺寸方便查看。" }
        ],
        tips: ""
      },
      {
        name: "ImageColorMatchAdobe+",
        cat: "image",
        brief: "Adobe 风格的四参数精细色彩匹配。",
        desc: "经典色彩匹配的增强版，把亮度、色彩浓度、褪色、中和四个维度拆开分别控制，比一维 factor 的版本细腻得多。适合对色调要求讲究的修图收尾。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：重绘或合成输出", desc: "要调色的图" },
          { name: "reference", type: "IMAGE", from: "典型上游：原始整图或参考图", desc: "色彩基准图" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：SaveImage", desc: "色调对齐后的图" }
        ],
        why: "局部重绘的补丁感和拼接的色差，用它可以分维度微调到看不出破绽。",
        params: [
          { name: "luminance_factor", kind: "浮点数", default: "1.0", desc: "亮度匹配力度。" },
          { name: "color_intensity_factor", kind: "浮点数", default: "1.0", desc: "色彩浓度匹配力度。" },
          { name: "fade_factor", kind: "浮点数", default: "1.0", desc: "褪色程度控制。" },
          { name: "neutralization_factor", kind: "浮点数", default: "0.0", desc: "色调中和力度，压掉偏色用。" }
        ],
        tips: ""
      },
      {
        name: "ImageHistogramMatch+",
        cat: "image",
        brief: "直方图匹配，把色调分布对齐参考图。",
        desc: "统计参考图的亮度直方图，把目标图的分布重映射成一致的形状，比均值方差式的色彩匹配更完整地继承影调风格。factor 控制匹配力度。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：重绘或放大输出", desc: "要调色的图" },
          { name: "reference", type: "IMAGE", from: "典型上游：风格参考图", desc: "影调基准图" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：SaveImage", desc: "直方图对齐后的图" }
        ],
        why: "想完整复刻一张胶片或电影的影调时，直方图匹配比色彩匹配更彻底。",
        params: [
          { name: "factor", kind: "浮点数", default: "1.0", desc: "匹配力度，0 不变，1 完全对齐。" },
          { name: "method", kind: "下拉选择", default: "pytorch", desc: "实现方式，速度与精度略有差异。" }
        ],
        tips: ""
      },
      {
        name: "ImageToDevice+",
        cat: "image",
        brief: "把图像数据在 CPU 和 GPU 之间搬运。",
        desc: "显式指定图像张量存放在 CPU 还是 GPU。显存吃紧的流程把中间结果搬回内存，或让特定节点拿到 GPU 上的数据提速，都是它的用武之地。",
        inputs: [
          { name: "image", type: "IMAGE", from: "任何图像输出口", desc: "要搬移的图像" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：后续图像节点", desc: "搬运后的图像" }
        ],
        why: "显存爆掉之前把不用的数据搬走，是长流程救命的细节。",
        params: [
          { name: "device", kind: "下拉选择", default: "auto", desc: "auto 跟随默认，cpu 或 gpu 强制指定。" }
        ],
        tips: ""
      },
      {
        name: "ImagePreviewFromLatent+",
        cat: "image",
        brief: "解码潜空间预览中间结果，输出尺寸信息。",
        desc: "把采样中途或放大后的潜空间解码成图像做预览，分块解码可降显存，同时输出宽高整数。排查放大流程里潜空间到底长什么样时特别有用。",
        inputs: [
          { name: "latent", type: "LATENT", from: "典型上游：KSampler 或放大节点", desc: "要预览的潜空间" },
          { name: "vae", type: "VAE", from: "典型上游：CheckpointLoaderSimple", desc: "解码用的 VAE" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：Preview Image", desc: "解码出的预览图" },
          { type: "INT", to: "典型下游：尺寸类输入", desc: "图像宽高" }
        ],
        why: "潜空间是黑盒，中途解码预览是白盒化的标准手段。",
        params: [
          { name: "tile_size", kind: "整数", default: "0", desc: "分块解码尺寸，0 表示整图解码，显存不足可设 512。" }
        ],
        tips: ""
      },
      {
        name: "NoiseFromImage+",
        cat: "image",
        brief: "从图像提取可控噪声，注入或合成用。",
        desc: "把一张图像转换成带参数控制的噪声图：强度、色彩噪声、饱和度、对比度、模糊都可调，可选遮罩控制噪声区域。常用于给图叠 film grain 质感，或配合噪声注入节点做变化。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage 或 VAEDecode", desc: "噪声来源图" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：合成或噪声注入节点", desc: "生成的噪声图" }
        ],
        why: "颗粒感是提升照片质感的老手艺，可控噪声让它能进工作流。",
        params: [
          { name: "noise_strenght", kind: "浮点数", default: "1.0", desc: "噪声强度。" },
          { name: "color_noise", kind: "浮点数", default: "0.2", desc: "彩色噪声占比，越高颗粒越花。" },
          { name: "blur", kind: "浮点数", default: "1.0", desc: "噪声模糊程度。" }
        ],
        tips: ""
      },
      {
        name: "MaskBlur+",
        cat: "mask",
        brief: "对遮罩做高斯模糊，柔化边缘。",
        desc: "amount 控制模糊强度，输出边缘半透明的遮罩，让局部重绘与原图过渡自然。可选择在 CPU 或 GPU 上计算，大批量遮罩也能应付。",
        inputs: [
          { name: "mask", type: "MASK", from: "典型上游：遮罩编辑器或检测节点", desc: "要模糊的遮罩" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：局部重绘节点", desc: "柔化后的遮罩" }
        ],
        why: "遮罩边缘生硬是重绘接缝的主因，模糊几个像素就能解决。",
        params: [
          { name: "amount", kind: "整数", default: "6", desc: "模糊强度，越大边缘过渡越宽。" },
          { name: "device", kind: "下拉选择", default: "auto", desc: "计算设备。" }
        ],
        tips: ""
      },
      {
        name: "MaskFix+",
        cat: "mask",
        brief: "遮罩修整五合一：腐蚀、填洞、去杂、平滑、模糊。",
        desc: "把常用的遮罩清理操作集中到一个节点：正负值腐蚀膨胀、填充孔洞、清除孤立小点、边缘平滑和模糊。手绘或自动生成的遮罩不够干净时，一个节点收拾利索。",
        inputs: [
          { name: "mask", type: "MASK", from: "典型上游：遮罩编辑器或检测节点", desc: "待修整的遮罩" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：局部重绘节点", desc: "修整后的遮罩" }
        ],
        why: "遮罩不干净导致的崩图，多数能在这个节点里一次修好。",
        params: [
          { name: "erode_dilate", kind: "整数", default: "0", desc: "正数膨胀、负数腐蚀，单位像素。" },
          { name: "fill_holes", kind: "整数", default: "0", desc: "填充多大的内部孔洞。" },
          { name: "remove_isolated_pixels", kind: "整数", default: "0", desc: "清除小于该尺寸的孤立碎块。" },
          { name: "smooth", kind: "整数", default: "0", desc: "边缘平滑强度。" },
          { name: "blur", kind: "整数", default: "0", desc: "边缘模糊强度。" }
        ],
        tips: ""
      },
      {
        name: "MaskSmooth+",
        cat: "mask",
        brief: "平滑遮罩边缘的轮廓线。",
        desc: "对遮罩轮廓做多边形平滑，去掉锯齿和毛刺，但不产生半透明过渡（区别于模糊）。想要干净利落又整齐的遮罩边缘时用它。",
        inputs: [
          { name: "mask", type: "MASK", from: "典型上游：遮罩编辑器", desc: "要平滑的遮罩" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：局部重绘节点", desc: "平滑后的遮罩" }
        ],
        why: "手抖涂出来的锯齿边，平滑一下就整齐了。",
        params: [
          { name: "amount", kind: "整数", default: "0", desc: "平滑强度，越大轮廓越圆润。" }
        ],
        tips: ""
      },
      {
        name: "MaskFlip+",
        cat: "mask",
        brief: "水平、垂直或双向镜像遮罩。",
        desc: "与 ImageFlip+ 同族的遮罩版，沿 x、y 或 xy 轴镜像。配合图像翻转使用，保证遮罩与画面同步翻转。",
        inputs: [
          { name: "mask", type: "MASK", from: "典型上游：遮罩节点", desc: "要翻转的遮罩" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：局部重绘或合成", desc: "翻转后的遮罩" }
        ],
        why: "图像翻了一圈遮罩没翻，重绘区域就会错位。",
        params: [
          { name: "axis", kind: "下拉选择", default: "x", desc: "翻转方向。" }
        ],
        tips: ""
      },
      {
        name: "MaskFromColor+",
        cat: "mask",
        brief: "按指定颜色生成色彩接近区域的遮罩。",
        desc: "设定一个 RGB 颜色和容差阈值，输出图像中颜色接近该值的区域遮罩。抠纯色背景、按颜色圈选物体时直接了当。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage", desc: "源图像" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：遮罩运算或重绘", desc: "颜色匹配区域的遮罩" }
        ],
        why: "绿幕和纯色底图的高效选择，不需要任何模型。",
        params: [
          { name: "red", kind: "整数", default: "255", desc: "目标颜色红分量。" },
          { name: "green", kind: "整数", default: "255", desc: "目标颜色绿分量。" },
          { name: "blue", kind: "整数", default: "255", desc: "目标颜色蓝分量。" },
          { name: "threshold", kind: "整数", default: "0", desc: "容差范围，调大覆盖更多相近颜色。" }
        ],
        tips: ""
      },
      {
        name: "MaskFromRGBCMYBW+",
        cat: "mask",
        brief: "一次输出红绿蓝青品黄黑白八种颜色遮罩。",
        desc: "按色彩阈值把图像按红、绿、蓝、青、品红、黄、黑、白八个方向拆成八个遮罩同时输出。想按颜色挑区域又说不准具体色值时，把八个都接出来挑最合适的。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage", desc: "源图像" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：遮罩运算或重绘", desc: "八个方向的颜色遮罩" }
        ],
        why: "一个节点穷举八种颜色选择，省去反复试色值的麻烦。",
        params: [
          { name: "threshold_r", kind: "浮点数", default: "0.15", desc: "红色方向的判定阈值。" },
          { name: "threshold_g", kind: "浮点数", default: "0.15", desc: "绿色方向的判定阈值。" },
          { name: "threshold_b", kind: "浮点数", default: "0.15", desc: "蓝色方向的判定阈值。" }
        ],
        tips: ""
      },
      {
        name: "MaskFromSegmentation+",
        cat: "mask",
        brief: "用聚类分割自动按色块区域生成遮罩。",
        desc: "对图像做 KMeans 风格的聚类分割，把颜色相近的区域聚成 segments 组，再按组生成遮罩。可清理孤立像素、丢弃过小的块和填充孔洞。没有训练模型也能快速按颜色分区。",
        inputs: [
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage", desc: "源图像" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：遮罩运算或重绘", desc: "聚类区域的遮罩" }
        ],
        why: "按颜色块快速圈选区域，比手动涂快也比单色匹配聪明。",
        params: [
          { name: "segments", kind: "整数", default: "6", desc: "聚类数量，越多划分越细。" },
          { name: "remove_isolated_pixels", kind: "整数", default: "0", desc: "清除孤立碎点的大小。" },
          { name: "fill_holes", kind: "开关", default: "disable", desc: "是否填充内部孔洞。" }
        ],
        tips: ""
      },
      {
        name: "MaskFromList+",
        cat: "mask",
        brief: "按数值列表生成渐变遮罩批次。",
        desc: "输入宽高和一组 0 到 1 之间的数值（逗号分隔或列表输入），生成对应数量的遮罩，每张遮罩的整体强度对应一个数值。给批量重绘准备不同强度的遮罩组时很方便。",
        inputs: [],
        outputs: [
          { type: "MASK", to: "典型下游：重绘或合成", desc: "按数值生成的遮罩批次" }
        ],
        why: "想在一次运行里试多档遮罩强度，数值列表就是排程表。",
        params: [
          { name: "width", kind: "整数", default: "32", desc: "遮罩宽度，0 表示跟随图像。" },
          { name: "height", kind: "整数", default: "32", desc: "遮罩高度。" },
          { name: "str_values", kind: "文本", default: "", desc: "逗号分隔的强度数值，例如 0.2, 0.5, 1.0。" }
        ],
        tips: ""
      },
      {
        name: "MaskFromBatch+",
        cat: "mask",
        brief: "从遮罩批次中取出指定一段。",
        desc: "输入遮罩批次、起始序号和长度，输出对应的子批次。与 Image From Batch+ 同族的遮罩版，用于把整批遮罩拆开分别处理。",
        inputs: [
          { name: "mask", type: "MASK", from: "典型上游：批次遮罩输出", desc: "遮罩批次" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：单独处理的节点", desc: "取出的子批次" }
        ],
        why: "批处理里的某一帧需要特殊对待时，先把它切出来。",
        params: [
          { name: "start", kind: "整数", default: "0", desc: "起始序号，从 0 数起。" },
          { name: "length", kind: "整数", default: "1", desc: "取多少张。" }
        ],
        tips: ""
      },
      {
        name: "MaskBatch+",
        cat: "mask",
        brief: "把两个遮罩合并成一个批次。",
        desc: "提供两个遮罩输入口合并成批次，尺寸不一致时自动对齐。与图像批次合并对应，遮罩侧的批次起点。",
        inputs: [
          { name: "mask1", type: "MASK", from: "第一个遮罩", desc: "决定整体尺寸" },
          { name: "mask2", type: "MASK", from: "第二个遮罩", desc: "可选" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：批处理节点", desc: "合并后的遮罩批次" }
        ],
        why: "遮罩与图像要成批同步处理，批次数量得对得上。",
        params: [],
        tips: ""
      },
      {
        name: "MaskExpandBatch+",
        cat: "mask",
        brief: "把遮罩批次扩展或压缩到指定数量。",
        desc: "与 ImageExpandBatch+ 同族的遮罩版：expand 均匀取样过渡，repeat all 循环复制，repeat first 或 last 复制首末张。视频流程里让遮罩与帧数对齐的标准做法。",
        inputs: [
          { name: "mask", type: "MASK", from: "典型上游：遮罩批次", desc: "输入批次" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：视频或批量重绘", desc: "对齐后的遮罩批次" }
        ],
        why: "帧数对不齐是视频流程报错的常客，这个节点负责垫平。",
        params: [
          { name: "size", kind: "整数", default: "16", desc: "目标数量。" },
          { name: "method", kind: "下拉选择", default: "expand", desc: "凑数策略。" }
        ],
        tips: ""
      },
      {
        name: "MaskBoundingBox+",
        cat: "mask",
        brief: "计算遮罩边界框，输出框遮罩和坐标尺寸。",
        desc: "求遮罩的外接矩形，可加 padding 外扩和 blur 收边，输出矩形遮罩、预览图和 x、y、宽、高四个整数。配合裁剪回贴流程，或把不规则遮罩规整成矩形区域。",
        inputs: [
          { name: "mask", type: "MASK", from: "典型上游：检测或手绘遮罩", desc: "输入遮罩" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：重绘或合成", desc: "矩形化的遮罩" },
          { type: "INT", to: "典型下游：裁剪与坐标输入", desc: "边界框坐标与尺寸" }
        ],
        why: "遮罩换算成坐标数据后，裁剪、回贴、拼接都好办了。",
        params: [
          { name: "padding", kind: "整数", default: "0", desc: "边界框向外扩的像素数。" },
          { name: "blur", kind: "整数", default: "0", desc: "矩形边缘的模糊收边。" }
        ],
        tips: ""
      },
      {
        name: "TransitionMask+",
        cat: "mask",
        brief: "生成滑入、开门、圆形等转场遮罩序列。",
        desc: "按转场类型和时间函数生成一组逐帧变化的遮罩，实现横向滑动、开门、圆形展开、淡入淡出等画面过渡效果。给两张图或两段素材做转场合成时，配它就够。",
        inputs: [],
        outputs: [
          { type: "MASK", to: "典型下游：图像合成节点", desc: "转场遮罩批次" }
        ],
        why: "工作流里做视频转场，遮罩驱动的合成是最可控的实现方式。",
        params: [
          { name: "frames", kind: "整数", default: "16", desc: "生成多少帧转场遮罩。" },
          { name: "transition_type", kind: "下拉选择", default: "fade", desc: "转场样式，含滑动、开门、圆形、淡入等。" },
          { name: "timing_function", kind: "下拉选择", default: "linear", desc: "时间曲线，in-out 更有加减速感。" }
        ],
        tips: ""
      },
      {
        name: "MaskPreview+",
        cat: "mask",
        brief: "把遮罩渲染成图像快速预览。",
        desc: "把遮罩显示成黑白图像，方便检查遮罩形状、位置和羽化是否符合预期。调试遮罩链路的必备小工具。",
        inputs: [
          { name: "mask", type: "MASK", from: "任何遮罩输出口", desc: "要预览的遮罩" }
        ],
        outputs: [],
        why: "遮罩看不见就没法调，预览是遮罩工作的眼睛。",
        params: [],
        tips: ""
      },
      {
        name: "KSamplerVariationsWithNoise+",
        cat: "sampler",
        brief: "在同一张图上叠加受控变化，出图族谱的标准工具。",
        desc: "先按主种子正常采样，再用独立的 variation_seed 和 variation_strength 在中途注入变化，得到与原图相近但有差异的版本。主种子固定、变化种子滚动，就能批量探索同一构图的不同细节，是找变体的标准玩法。",
        inputs: [
          { name: "model", type: "MODEL", from: "典型上游：CheckpointLoaderSimple", desc: "采样模型" },
          { name: "latent_image", type: "LATENT", from: "典型上游：EmptyLatentImage 或 VAEEncode", desc: "初始潜空间" },
          { name: "positive", type: "CONDITIONING", from: "典型上游：CLIPTextEncode", desc: "正向条件" },
          { name: "negative", type: "CONDITIONING", from: "典型上游：CLIPTextEncode", desc: "负向条件" }
        ],
        outputs: [
          { type: "LATENT", to: "典型下游：VAEDecode", desc: "带变化的采样结果" }
        ],
        why: "出图满意后想要同一张脸的十个变体，改主种子会面目全非，只有变化种子能拿捏分寸。",
        params: [
          { name: "main_seed", kind: "整数", default: "0", desc: "主种子，决定整体构图，固定它保住原图。" },
          { name: "variation_seed", kind: "整数", default: "12345", desc: "变化种子，滚动它探索不同变体。" },
          { name: "variation_strength", kind: "浮点数", default: "0.17", desc: "变化强度，0.2 到 0.4 常用，太大就换图了。" },
          { name: "denoise", kind: "浮点数", default: "1.0", desc: "整体重绘幅度。" }
        ],
        tips: ""
      },
      {
        name: "KSamplerVariationsStochastic+",
        cat: "sampler",
        brief: "随机KSampler 变体，逐步注入随机性。",
        desc: "与噪声注入版目标相同但实现不同：在采样过程中按变化强度逐步加入随机性，变化更自然弥散。cfg_scale 可在采样时反向缩放 CFG，额外多一档微调手段。",
        inputs: [
          { name: "model", type: "MODEL", from: "典型上游：CheckpointLoaderSimple", desc: "采样模型" },
          { name: "latent_image", type: "LATENT", from: "典型上游：EmptyLatentImage", desc: "初始潜空间" },
          { name: "positive", type: "CONDITIONING", from: "典型上游：CLIPTextEncode", desc: "正向条件" },
          { name: "negative", type: "CONDITIONING", from: "典型上游：CLIPTextEncode", desc: "负向条件" }
        ],
        outputs: [
          { type: "LATENT", to: "典型下游：VAEDecode", desc: "变化后的结果" }
        ],
        why: "噪声注入版的变化偏局部，随机采样版的变化更整体，两者互补。",
        params: [
          { name: "noise_seed", kind: "整数", default: "0", desc: "基础噪声种子。" },
          { name: "variation_seed", kind: "整数", default: "0", desc: "变化种子，控制变体方向。" },
          { name: "variation_strength", kind: "浮点数", default: "0.2", desc: "变化强度。" }
        ],
        tips: ""
      },
      {
        name: "InjectLatentNoise+",
        cat: "latent",
        brief: "直接往潜空间注入噪声，支持遮罩控制。",
        desc: "向输入潜空间叠加一层噪声：强度可正可负（负数相当于减噪），可用遮罩限制注入区域，可选归一化。做局部重做、细节扰动或手工改造潜空间时的底层工具。",
        inputs: [
          { name: "latent", type: "LATENT", from: "典型上游：KSampler 或 VAEEncode", desc: "目标潜空间" },
          { name: "mask", type: "MASK", from: "可选，遮罩节点", desc: "只在遮罩区域注入噪声" }
        ],
        outputs: [
          { type: "LATENT", to: "典型下游：KSampler 继续采样", desc: "注入噪声后的潜空间" }
        ],
        why: "想在指定区域重新长细节，注入噪声再低幅度重采样是精细的解法。",
        params: [
          { name: "noise_seed", kind: "整数", default: "0", desc: "噪声种子。" },
          { name: "noise_strength", kind: "浮点数", default: "1.0", desc: "注入强度，负数为减弱噪声。" },
          { name: "normalize", kind: "下拉选择", default: "false", desc: "是否把结果归一化到标准范围。" }
        ],
        tips: ""
      },
      {
        name: "FluxSamplerParams+",
        cat: "sampler",
        brief: "Flux 专用一体化采样器，参数支持表达式。",
        desc: "为 Flux 模型设计的采样节点：把 seed、sampler、scheduler、steps、guidance、shift、denoise 全部集中，参数栏接受字符串表达式，可用问号随机、用算式联动，输出结果和参数记录。配合 PlotParameters+ 能自动出参数对比图。",
        inputs: [
          { name: "model", type: "MODEL", from: "典型上游：Flux 相关加载器", desc: "Flux 模型" },
          { name: "conditioning", type: "CONDITIONING", from: "典型上游：T5 与 CLIP 编码结果", desc: "合并后的条件" },
          { name: "latent_image", type: "LATENT", from: "典型上游：EmptyLatentImage", desc: "初始潜空间" }
        ],
        outputs: [
          { type: "LATENT", to: "典型下游：VAEDecode", desc: "采样结果" },
          { type: "SAMPLER_PARAMS", to: "典型下游：PlotParameters+", desc: "本次使用的参数记录" }
        ],
        why: "Flux 的 shift 和 guidance 调参需要大量对比实验，表达式参数加参数记录就是为此准备的。",
        params: [
          { name: "seed", kind: "文本", default: "?", desc: "问号表示每次随机，也可写具体数字。" },
          { name: "guidance", kind: "文本", default: "3.5", desc: "Flux 的引导强度，2 到 4 常用。" },
          { name: "steps", kind: "文本", default: "20", desc: "采样步数。" },
          { name: "denoise", kind: "文本", default: "1.0", desc: "重绘幅度。" }
        ],
        tips: ""
      },
      {
        name: "TextEncodeForSamplerParams+",
        cat: "sampler",
        brief: "按三横线分隔多组提示词，编码成参数批次。",
        desc: "把用三条短横线分隔的多段提示词分别编码，输出一个条件批次，配合 FluxSamplerParams+ 的参数表逐组采样。做提示词对比实验时，一个节点装下全部方案。",
        inputs: [
          { name: "clip", type: "CLIP", from: "典型上游：CheckpointLoaderSimple", desc: "文本编码器" }
        ],
        outputs: [
          { type: "CONDITIONING", to: "典型下游：FluxSamplerParams+", desc: "多组条件的批次" }
        ],
        why: "提示词对比实验的排版器，改文案不用改结构。",
        params: [
          { name: "text", kind: "文本", default: "", desc: "多段提示词，段与段之间用三条短横线分隔。" }
        ],
        tips: ""
      },
      {
        name: "SamplerSelectHelper+",
        cat: "sampler",
        brief: "勾选多个采样器，批量生成对比实验组。",
        desc: "把全部采样器列成开关，勾选哪几个就输出哪几个的名称列表，配合 FluxSamplerParams+ 做批量对比。想系统测试 euler、dpmpp 等采样器差异时，它是排版友好的入口。",
        inputs: [],
        outputs: [
          { type: "STRING", to: "典型下游：FluxSamplerParams+ 的 sampler 输入", desc: "勾选的采样器名称列表" }
        ],
        why: "采样器对比实验的开关面板，勾选即成组。",
        params: [],
        tips: ""
      },
      {
        name: "SchedulerSelectHelper+",
        cat: "sampler",
        brief: "勾选多个调度器，批量生成对比实验组。",
        desc: "与 SamplerSelectHelper+ 同族，对象是调度器（normal、karras、sgm_uniform 等）。勾选组合后输出名称列表供参数化采样节点使用。",
        inputs: [],
        outputs: [
          { type: "STRING", to: "典型下游：FluxSamplerParams+ 的 scheduler 输入", desc: "勾选的调度器名称列表" }
        ],
        why: "调度器对成图节奏影响不小，批量验证比逐个改快得多。",
        params: [],
        tips: ""
      },
      {
        name: "LorasForFluxParams+",
        cat: "sampler",
        brief: "把 LoRA 及强度打包成参数对象。",
        desc: "选择一个 LoRA 文件和强度（强度同样支持表达式），输出 LORA_PARAMS 对象供 FluxSamplerParams+ 使用。让 LoRA 加载也进入参数化采样流程。",
        inputs: [],
        outputs: [
          { type: "LORA_PARAMS", to: "典型下游：FluxSamplerParams+ 的 loras 输入", desc: "LoRA 参数对象" }
        ],
        why: "LoRA 强度对比实验也要批量跑，打包成对象才能进参数表。",
        params: [
          { name: "lora_1", kind: "下拉选择", default: "", desc: "选择 LoRA 文件。" },
          { name: "strength_model_1", kind: "文本", default: "1.0", desc: "模型强度，支持表达式。" }
        ],
        tips: ""
      },
      {
        name: "ModelSamplingSD3Advanced+",
        cat: "model",
        brief: "调整 SD3 与 Flux 系模型的采样噪声分布。",
        desc: "在核心 shift 补丁基础上增加 cut_off 和 shift_multiplier 两个高级参数，更细地控制高分辨率下的噪声调度形状。SD3、Flux 出图发灰或细节失衡时的调参手段。",
        inputs: [
          { name: "model", type: "MODEL", from: "典型上游：模型加载或 LoRA 节点", desc: "目标模型" }
        ],
        outputs: [
          { type: "MODEL", to: "典型下游：采样器", desc: "调整后的模型" }
        ],
        why: "分辨率越高越需要 shift 调度配合，高级参数把这条路走到头。",
        params: [
          { name: "shift", kind: "浮点数", default: "3.0", desc: "基础偏移量，越大高分辨率细节越稳。" },
          { name: "cut_off", kind: "浮点数", default: "0.5", desc: "截断位置。" },
          { name: "shift_multiplier", kind: "浮点数", default: "2", desc: "偏移放大倍数。" }
        ],
        tips: ""
      },
      {
        name: "GuidanceTimestepping+",
        cat: "sampler",
        brief: "只在采样的指定时间段调整引导强度。",
        desc: "给模型打上时间步补丁：在 start_at 到 end_at 的采样区间内用指定引导值，其余区间保持默认。早期重引导定构图、后期弱引导养细节的思路靠它实现。",
        inputs: [
          { name: "model", type: "MODEL", from: "典型上游：模型加载节点", desc: "目标模型" }
        ],
        outputs: [
          { type: "MODEL", to: "典型下游：采样器", desc: "打过补丁的模型" }
        ],
        why: "全程高引导容易过饱和，分段引导是兼顾结构与质感的进阶玩法。",
        params: [
          { name: "value", kind: "浮点数", default: "2.0", desc: "区间内使用的引导值。" },
          { name: "start_at", kind: "浮点数", default: "0.2", desc: "区间起点，按采样进度 0 到 1 计。" },
          { name: "end_at", kind: "浮点数", default: "0.8", desc: "区间终点。" }
        ],
        tips: ""
      },
      {
        name: "PlotParameters+",
        cat: "sampler",
        brief: "把批量采样的结果拼成参数对比图。",
        desc: "接收 FluxSamplerParams+ 等节点产出的图像批次和参数记录，按指定维度排成网格，并在图上标注对应的参数值和提示词。参数实验的成果整理一步到位，不用手动记录。",
        inputs: [
          { name: "images", type: "IMAGE", from: "典型上游：FluxSamplerParams+", desc: "实验产出的图像批次" },
          { name: "params", type: "SAMPLER_PARAMS", from: "典型上游：FluxSamplerParams+", desc: "对应的参数记录" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：SaveImage", desc: "带参数标注的对比网格图" }
        ],
        why: "对比实验最难的是记录谁是谁，它把标注自动画在图上。",
        params: [
          { name: "order_by", kind: "下拉选择", default: "none", desc: "按哪个参数排序。" },
          { name: "cols_value", kind: "下拉选择", default: "none", desc: "列方向按哪个参数分组。" }
        ],
        tips: ""
      },
      {
        name: "BatchCount+",
        cat: "util",
        brief: "读取任意批次数据的张数。",
        desc: "输入图像、遮罩或潜空间等批次数据，输出批内张数。配合数学节点做按张数判断或循环控制。",
        inputs: [
          { name: "batch", type: "ANY", from: "任何批次类型输出口", desc: "要计数的批次数据" }
        ],
        outputs: [
          { type: "INT", to: "典型下游：数学或逻辑节点", desc: "批内张数" }
        ],
        why: "批次数在流程里经常需要当成参数用，这个节点把它变成数字。",
        params: [],
        tips: ""
      },
      {
        name: "DebugTensorShape+",
        cat: "util",
        brief: "在控制台打印张量的形状信息。",
        desc: "接收任意张量数据，把形状、类型等信息打印到启动 ComfyUI 的终端窗口。与 ConsoleDebug+ 侧重不同，它专看数据的形状规格，排查批次与尺寸对不上的问题时最有用。",
        inputs: [
          { name: "tensor", type: "ANY", from: "任何数据输出口", desc: "要查看的张量" }
        ],
        outputs: [],
        why: "尺寸不匹配的报错往往看不出哪根线出了问题，打印形状一目了然。",
        params: [],
        tips: ""
      },
      {
        name: "DisplayAny",
        cat: "util",
        brief: "在节点上直接显示任意输入的内容。",
        desc: "把任意类型的输入渲染到节点界面里，支持看原始值或张量形状。不用去翻控制台，画布上就能监视数据，是比 ConsoleDebug+ 更直观的监视器。",
        inputs: [
          { name: "input", type: "ANY", from: "任何节点的任意输出口", desc: "要显示的数据" }
        ],
        outputs: [],
        why: "监视数据不用切窗口，画布即仪表盘。",
        params: [
          { name: "mode", kind: "下拉选择", default: "raw value", desc: "显示原始值还是张量形状。" }
        ],
        tips: ""
      },
      {
        name: "ModelCompile+",
        cat: "model",
        brief: "用 torch compile 编译模型提速推理。",
        desc: "对模型做即时编译优化，首次运行慢但后续采样提速，可选多种优化模式。对新架构显卡收益明显，出问题可随时移除节点回退。",
        inputs: [
          { name: "model", type: "MODEL", from: "典型上游：模型加载节点", desc: "要编译的模型" }
        ],
        outputs: [
          { type: "MODEL", to: "典型下游：采样器", desc: "编译后的模型" }
        ],
        why: "不改工作流白拿速度收益，代价只是首次跑图多等一会儿。",
        params: [
          { name: "mode", kind: "下拉选择", default: "default", desc: "优化强度，max-autotune 最快但编译最久。" },
          { name: "dynamic", kind: "开关", default: "disable", desc: "开启后兼容动态尺寸，速度略降。" }
        ],
        tips: ""
      },
      {
        name: "RemoveLatentMask+",
        cat: "latent",
        brief: "移除潜空间数据附带的噪声遮罩。",
        desc: "潜空间批次里可能带有上一次局部操作留下的遮罩信息，继续采 sampling 会按遮罩行事。这个节点把附带遮罩清掉，让后续采样作用于整张潜空间。",
        inputs: [
          { name: "samples", type: "LATENT", from: "典型上游：局部重绘类节点", desc: "带遮罩的潜空间" }
        ],
        outputs: [
          { type: "LATENT", to: "典型下游：KSampler", desc: "无遮罩的潜空间" }
        ],
        why: "上一步的遮罩残留会让下一步莫名只改一块，清掉才安心。",
        params: [],
        tips: ""
      },
      {
        name: "SDXLEmptyLatentSizePicker+",
        cat: "latent",
        brief: "SDXL 官方分辨率列表一键选择。",
        desc: "内置 SDXL 官方推荐的全部宽高组合（从 0.5 到 3.0 的比例），选中即生成对应空潜空间，同时输出宽高数值。还能用覆盖参数手动改尺寸，比手填数字少犯错。",
        inputs: [],
        outputs: [
          { type: "LATENT", to: "典型下游：KSampler", desc: "空潜空间" },
          { type: "INT", to: "典型下游：尺寸类输入", desc: "所选宽度和高度" }
        ],
        why: "SDXL 对尺寸敏感，从官方列表选比例是最稳的起手。",
        params: [
          { name: "resolution", kind: "下拉选择", default: "1024x1024 (1.0)", desc: "宽高组合，括号内为宽高比。" },
          { name: "batch_size", kind: "整数", default: "1", desc: "批次数量。" },
          { name: "width_override", kind: "整数", default: "0", desc: "覆盖宽度，0 表示用列表值。" },
          { name: "height_override", kind: "整数", default: "0", desc: "覆盖高度，0 表示用列表值。" }
        ],
        tips: ""
      },
      {
        name: "SimpleComparison+",
        cat: "util",
        brief: "比较两个值，输出布尔结果。",
        desc: "用 comparison 下拉选择等于、不等于、大于、小于等比较方式，输出 BOOLEAN。essentials 数学逻辑体系的比较环节，配合 SimpleCondition 做分支。",
        inputs: [
          { name: "a", type: "ANY", from: "任意数值输出口", desc: "比较的左边" },
          { name: "b", type: "ANY", from: "任意数值输出口", desc: "比较的右边" }
        ],
        outputs: [
          { type: "BOOLEAN", to: "典型下游：SimpleCondition+", desc: "比较结果" }
        ],
        why: "工作流自动化从会做比较开始。",
        params: [
          { name: "comparison", kind: "下拉选择", default: "==", desc: "比较方式。" }
        ],
        tips: ""
      },
      {
        name: "SimpleCondition+",
        cat: "util",
        brief: "按布尔条件在两路输入中选一路。",
        desc: "evaluate 输入为真时输出 on_true，否则输出 on_false，类型不限。实现条件选择分支的最简形式。",
        inputs: [
          { name: "evaluate", type: "ANY", from: "典型上游：SimpleComparison+", desc: "布尔条件" },
          { name: "on_true", type: "ANY", from: "任意输出口", desc: "条件为真时的输出" },
          { name: "on_false", type: "ANY", from: "任意输出口", desc: "条件为假时的输出" }
        ],
        outputs: [
          { type: "ANY", to: "典型下游：被选中的一路继续流动", desc: "按条件选中的内容" }
        ],
        why: "条件分支是智能工作流的骨架，它就是那个最小分岔口。",
        params: [],
        tips: ""
      },
      {
        name: "SimpleMath+",
        cat: "util",
        brief: "写表达式做四则运算，支持引用变量。",
        desc: "在 value 里写数学表达式（例如 a 乘 2 再加 b），abc 三个可选输入提供变量，输出整数和浮点两个结果。让尺寸、步数等参数之间产生联动关系，改一处自动换算。",
        inputs: [
          { name: "a", type: "ANY", from: "任意数值输出口", desc: "表达式变量 a" },
          { name: "b", type: "ANY", from: "任意数值输出口", desc: "表达式变量 b" }
        ],
        outputs: [
          { type: "INT", to: "典型下游：整数参数输入", desc: "计算结果的整数部分" },
          { type: "FLOAT", to: "典型下游：浮点参数输入", desc: "计算结果" }
        ],
        why: "参数联动是动态工作流的核心能力，一个表达式节点就能搭起来。",
        params: [
          { name: "value", kind: "文本", default: "", desc: "数学表达式，可用加、减、乘、除和括号。" }
        ],
        tips: ""
      },
      {
        name: "SimpleMathDual+",
        cat: "util",
        brief: "一次算两条表达式，输出四个结果。",
        desc: "与 SimpleMath+ 相同的表达式语法，但可写两条分别计算，输出两组整数与浮点结果。成对的参数（例如宽和高）联动时正好用。",
        inputs: [
          { name: "a", type: "ANY", from: "任意数值输出口", desc: "表达式变量" }
        ],
        outputs: [
          { type: "INT", to: "典型下游：整数参数输入", desc: "两条表达式的整数结果" },
          { type: "FLOAT", to: "典型下游：浮点参数输入", desc: "两条表达式的浮点结果" }
        ],
        why: "宽高、横纵这类成对参数需要同步换算，一个节点省一半。",
        params: [
          { name: "value_1", kind: "文本", default: "", desc: "第一条表达式。" },
          { name: "value_2", kind: "文本", default: "", desc: "第二条表达式。" }
        ],
        tips: ""
      },
      {
        name: "SimpleMathCondition+",
        cat: "util",
        brief: "条件成立算一条式子，不成立算另一条。",
        desc: "evaluate 条件为真时计算 on_true 表达式，否则计算 on_false 表达式，输出整数与浮点结果。把分支和计算合在一步完成。",
        inputs: [
          { name: "evaluate", type: "ANY", from: "典型上游：比较节点", desc: "布尔条件" }
        ],
        outputs: [
          { type: "INT", to: "典型下游：整数参数输入", desc: "选中表达式的整数结果" },
          { type: "FLOAT", to: "典型下游：浮点参数输入", desc: "选中表达式的浮点结果" }
        ],
        why: "尺寸按条件切换这类需求，分支加计算一步到位。",
        params: [
          { name: "on_true", kind: "文本", default: "", desc: "条件为真时计算的表达式。" },
          { name: "on_false", kind: "文本", default: "", desc: "条件为假时计算的表达式。" }
        ],
        tips: ""
      },
      {
        name: "SimpleMathBoolean+",
        cat: "util",
        brief: "对布尔值做与或非运算。",
        desc: "输入布尔值，用表达式做逻辑运算（例如 a and b），输出布尔结果。多条件组合判断的组成单元。",
        inputs: [
          { name: "value", type: "BOOLEAN", from: "典型上游：比较节点", desc: "布尔输入" }
        ],
        outputs: [
          { type: "BOOLEAN", to: "典型下游：条件节点", desc: "运算结果" }
        ],
        why: "复杂条件离不开与或非的组合。",
        params: [
          { name: "value", kind: "文本", default: "False", desc: "布尔表达式，可用 and、or、not。" }
        ],
        tips: ""
      },
      {
        name: "SimpleMathFloat+",
        cat: "util",
        brief: "定义一个浮点数常量。",
        desc: "最简单的数值来源：在节点上写一个浮点数输出。配合表达式节点做基础素材，或直接喂给任何浮点参数。",
        inputs: [],
        outputs: [
          { type: "FLOAT", to: "典型下游：浮点参数输入", desc: "设定的浮点值" }
        ],
        why: "把常量变成节点，画布上的每个数字都有出处。",
        params: [
          { name: "value", kind: "浮点数", default: "0.0", desc: "要输出的数值。" }
        ],
        tips: ""
      },
      {
        name: "SimpleMathInt+",
        cat: "util",
        brief: "定义一个整数常量。",
        desc: "与浮点版对应的整数常量节点，输出 INT。喂给种子、步数、序号等整数参数。",
        inputs: [],
        outputs: [
          { type: "INT", to: "典型下游：整数参数输入", desc: "设定的整数值" }
        ],
        why: "常量入画布，参数才有据可查。",
        params: [
          { name: "value", kind: "整数", default: "0", desc: "要输出的整数。" }
        ],
        tips: ""
      },
      {
        name: "SimpleMathPercent+",
        cat: "util",
        brief: "把 0 到 1 的比例换算成另一数值的百分比。",
        desc: "输入一个 0 到 1 的比例值和一个基准值，按比例换算输出。滑杆控制步数、尺寸按比例缩放这类场景的换算器。",
        inputs: [
          { name: "value", type: "FLOAT", from: "典型上游：滑杆节点", desc: "0 到 1 的比例" }
        ],
        outputs: [
          { type: "FLOAT", to: "典型下游：参数输入", desc: "换算结果" }
        ],
        why: "比例思维的参数控制离不开百分比换算。",
        params: [
          { name: "value", kind: "浮点数", default: "0.0", desc: "比例输入。" }
        ],
        tips: ""
      },
      {
        name: "SimpleMathSlider+",
        cat: "util",
        brief: "通用浮点滑杆，输出浮点与整数。",
        desc: "提供一根可自定义范围和步进的滑杆，同时输出浮点和取整后的整数。给任何参数一个顺手的手动调节入口，比在节点属性里翻参数快。",
        inputs: [],
        outputs: [
          { type: "FLOAT", to: "典型下游：浮点参数输入", desc: "滑杆当前值" },
          { type: "INT", to: "典型下游：整数参数输入", desc: "取整后的值" }
        ],
        why: "调节体验决定调参效率，滑杆是最直接的输入方式。",
        params: [
          { name: "value", kind: "浮点数", default: "0.5", desc: "滑杆位置。" },
          { name: "min", kind: "浮点数", default: "0.0", desc: "范围下限。" },
          { name: "max", kind: "浮点数", default: "1.0", desc: "范围上限。" },
          { name: "rounding", kind: "整数", default: "0", desc: "保留小数位数，0 表示取整。" }
        ],
        tips: ""
      },
      {
        name: "SimpleMathSliderLowRes+",
        cat: "util",
        brief: "低分辨率预览用的十档整数滑杆。",
        desc: "0 到 10 的整数滑杆，输出浮点与整数，专配低分辨率快速预览工作流：用小档位控制质量档，正式出图时再换高值。",
        inputs: [],
        outputs: [
          { type: "FLOAT", to: "典型下游：浮点参数输入", desc: "按范围换算的浮点值" },
          { type: "INT", to: "典型下游：整数参数输入", desc: "滑杆整数值" }
        ],
        why: "预览与正式档位分离，是省时间的工作流习惯。",
        params: [
          { name: "value", kind: "整数", default: "5", desc: "滑杆档位。" },
          { name: "min", kind: "浮点数", default: "0.0", desc: "输出范围下限。" },
          { name: "max", kind: "浮点数", default: "1.0", desc: "输出范围上限。" }
        ],
        tips: ""
      },
      {
        name: "LoadCLIPSegModels+",
        cat: "load",
        brief: "加载 CLIPSeg 分割模型。",
        desc: "从 HuggingFace 加载 CLIPSeg 处理器和模型，输出 CLIP_SEG 会话供 ApplyCLIPSeg+ 使用。首次运行会自动下载模型文件。",
        inputs: [],
        outputs: [
          { type: "CLIP_SEG", to: "典型下游：ApplyCLIPSeg+", desc: "CLIPSeg 模型会话" }
        ],
        why: "文本圈选区域的模型加载一次到处复用。",
        params: [],
        tips: ""
      },
      {
        name: "ApplyCLIPSeg+",
        cat: "mask",
        brief: "用文字描述直接圈出图中物体生成遮罩。",
        desc: "输入一句英文提示词（例如 the red car），CLIPSeg 按语义在图里找出对应物体并生成遮罩，可再平滑、扩张、模糊。不需要训练和标注的零样本分割，指定任意目标都行。",
        inputs: [
          { name: "clip_seg", type: "CLIP_SEG", from: "典型上游：LoadCLIPSegModels+", desc: "CLIPSeg 模型会话" },
          { name: "image", type: "IMAGE", from: "典型上游：LoadImage 或 VAEDecode", desc: "要分割的图像" }
        ],
        outputs: [
          { type: "MASK", to: "典型下游：局部重绘或遮罩运算", desc: "文字指定目标的遮罩" }
        ],
        why: "想重画画面里某个具体东西，打一句英文就得到它的遮罩。",
        params: [
          { name: "prompt", kind: "文本", default: "", desc: "英文目标描述，越具体越准。" },
          { name: "threshold", kind: "浮点数", default: "0.4", desc: "判定阈值，调高遮罩更严格。" },
          { name: "smooth", kind: "整数", default: "9", desc: "遮罩平滑强度。" },
          { name: "dilate", kind: "整数", default: "0", desc: "遮罩扩张或收缩像素数。" }
        ],
        tips: ""
      },
      {
        name: "CLIPTextEncodeSDXL+",
        cat: "cond",
        brief: "SDXL 简化版文本编码，一个节点出条件。",
        desc: "相比核心的 SDXL 双节点编码，它把宽高和裁剪参数合并到一个节点里，size_cond_factor 控制编码分辨率折算。只想快速给 SDXL 写提示词时少接一个节点。",
        inputs: [
          { name: "clip", type: "CLIP", from: "典型上游：CheckpointLoaderSimple", desc: "SDXL 的文本编码器" }
        ],
        outputs: [
          { type: "CONDITIONING", to: "典型下游：KSampler", desc: "编码后的条件" }
        ],
        why: "SDXL 编码双节点的简化替代，接线少一半。",
        params: [
          { name: "width", kind: "整数", default: "1024", desc: "目标出图宽度，参与编码。" },
          { name: "height", kind: "整数", default: "1024", desc: "目标出图高度。" },
          { name: "size_cond_factor", kind: "整数", default: "4", desc: "编码尺寸折算系数，默认即可。" }
        ],
        tips: ""
      },
      {
        name: "ConditioningCombineMultiple+",
        cat: "cond",
        brief: "把最多五路条件合并成一路。",
        desc: "核心条件合并节点只有两个输入，这个版本提供五路输入，把多组条件（不同风格、不同区域、不同 LoRA 的编码结果）合并到一起送进采样器。",
        inputs: [
          { name: "conditioning_1", type: "CONDITIONING", from: "任意编码输出", desc: "第一路条件" },
          { name: "conditioning_2", type: "CONDITIONING", from: "任意编码输出", desc: "第二路条件" }
        ],
        outputs: [
          { type: "CONDITIONING", to: "典型下游：KSampler", desc: "合并后的条件" }
        ],
        why: "多风格混合提示词是常见需求，输入口越多越少绕接。",
        params: [],
        tips: ""
      },
      {
        name: "SD3NegativeConditioning+",
        cat: "cond",
        brief: "处理 SD3 系模型的负向条件。",
        desc: "SD3 与 Flux 等模型没有传统的负向提示词机制，这个节点把负向条件转换成模型可用的形式，end 参数控制它在采样早期的作用范围。SD3 出画面瑕疵时先调它。",
        inputs: [
          { name: "conditioning", type: "CONDITIONING", from: "典型上游：CLIPTextEncode 的负向文本", desc: "负向条件" }
        ],
        outputs: [
          { type: "CONDITIONING", to: "典型下游：KSampler 的负向输入", desc: "适配后的负向条件" }
        ],
        why: "新架构模型的负向提示词要特殊处理，硬接旧采样器会不生效。",
        params: [
          { name: "end", kind: "浮点数", default: "0.1", desc: "负向条件作用的采样进度上限。" }
        ],
        tips: ""
      },
      {
        name: "FluxAttentionSeeker+",
        cat: "cond",
        brief: "按层调整 Flux 文本编码的注意力强度。",
        desc: "对 Flux 的 CLIP 与 T5 编码结果按层加权：12 层 CLIP、24 层 T5 各有独立滑杆，可分别作用于注意力的查询、键、值、输出。精细控制提示词在哪些层起作用，是 Flux 风格微调的进阶工具。",
        inputs: [
          { name: "clip", type: "CLIP", from: "典型上游：Flux 相关加载器", desc: "Flux 文本编码器" }
        ],
        outputs: [
          { type: "CLIP", to: "典型下游：CLIPTextEncode", desc: "加权后的编码器" }
        ],
        why: "提示词不生效或过强时，按层加权比改词更可控。",
        params: [
          { name: "apply_to_query", kind: "开关", default: "enable", desc: "是否对查询部分加权。" },
          { name: "clip_l_layers", kind: "浮点数", default: "1.0", desc: "各层 CLIP 的强度滑杆。" },
          { name: "t5xxl_layers", kind: "浮点数", default: "1.0", desc: "各层 T5 的强度滑杆。" }
        ],
        tips: ""
      },
      {
        name: "SD3AttentionSeekerLG+",
        cat: "cond",
        brief: "按层调整 SD3 双编码器的注意力强度。",
        desc: "SD3AttentionSeeker 的 SD3 版本，作用于 CLIP-L 的 12 层和 CLIP-G 的 32 层，同样支持对注意力的四个部分分别开关。配合 SD3 负向条件节点一起使用。",
        inputs: [
          { name: "clip", type: "CLIP", from: "典型上游：SD3 相关加载器", desc: "SD3 文本编码器" }
        ],
        outputs: [
          { type: "CLIP", to: "典型下游：CLIPTextEncode", desc: "加权后的编码器" }
        ],
        why: "SD3 双编码器的权重平衡需要更细的旋钮。",
        params: [
          { name: "apply_to_query", kind: "开关", default: "enable", desc: "是否对查询部分加权。" },
          { name: "clip_l_layers", kind: "浮点数", default: "1.0", desc: "各层 CLIP-L 的强度滑杆。" },
          { name: "clip_g_layers", kind: "浮点数", default: "1.0", desc: "各层 CLIP-G 的强度滑杆。" }
        ],
        tips: ""
      },
      {
        name: "SD3AttentionSeekerT5+",
        cat: "cond",
        brief: "按层调整 T5 编码器的注意力强度。",
        desc: "AttentionSeeker 家族中只作用于 T5 编码的版本，提供 24 层独立滑杆。适合 Flux 等以 T5 为主导的模型，单独雕琢长文本提示词的作用强度。",
        inputs: [
          { name: "clip", type: "CLIP", from: "典型上游：模型加载器", desc: "带 T5 的文本编码器" }
        ],
        outputs: [
          { type: "CLIP", to: "典型下游：CLIPTextEncode", desc: "加权后的编码器" }
        ],
        why: "T5 主导的模型里，长提示词的层次感就藏在这些层里。",
        params: [
          { name: "apply_to_value", kind: "开关", default: "enable", desc: "是否对值部分加权。" },
          { name: "t5xxl_layers", kind: "浮点数", default: "1.0", desc: "各层 T5 的强度滑杆。" }
        ],
        tips: ""
      },
      {
        name: "FluxBlocksBuster+",
        cat: "cond",
        brief: "按块调整 Flux 模型的变换器权重。",
        desc: "对 Flux 的 19 个双块和 38 个单块分别设置权重倍率，输出打过补丁的模型和补丁文本。模型微调风格的权重化表达：哪一块管构图、哪一块管细节，靠它逐块实验。",
        inputs: [
          { name: "model", type: "MODEL", from: "典型上游：Flux 模型加载器", desc: "Flux 模型" }
        ],
        outputs: [
          { type: "MODEL", to: "典型下游：采样器", desc: "按块加权后的模型" },
          { type: "STRING", to: "典型下游：保存或复用配置", desc: "当前各块权重清单" }
        ],
        why: "LoRA 之外的另一种模型行为微调方式，粒度细到每一个变换器块。",
        params: [
          { name: "blocks", kind: "文本", default: "", desc: "各块权重清单，双块用双井号、单块用单井号开头书写。" }
        ],
        tips: ""
      },
      {
        name: "DrawText+",
        cat: "image",
        brief: "把文字渲染成图像或叠加到图上。",
        desc: "用内置字体把多行文字渲染成图片，支持字号、颜色、对齐、方向和阴影参数；可选把文字直接合成到输入图像上。给图加水印、标注、字幕条，或生成文字底图都靠它。",
        inputs: [
          { name: "img_composite", type: "IMAGE", from: "可选，要叠字的图像", desc: "提供背景时文字合成其上" }
        ],
        outputs: [
          { type: "IMAGE", to: "典型下游：SaveImage 或合成", desc: "文字图像或合成结果" },
          { type: "MASK", to: "典型下游：遮罩类节点", desc: "文字区域的遮罩" }
        ],
        why: "文字渲染在工作流里出奇地常用，从水印到对比图标注都用得上。",
        params: [
          { name: "text", kind: "文本", default: "", desc: "要渲染的文字，支持多行。" },
          { name: "font", kind: "下拉选择", default: "", desc: "内置字体列表。" },
          { name: "size", kind: "整数", default: "56", desc: "字号。" },
          { name: "color", kind: "文本", default: "", desc: "文字颜色，用颜色代码书写。" }
        ],
        tips: ""
      }
    ]
  });
})();
