/* 节点标题别名映射：工作流中的显示名 → 第二部分包内条目
   key 为 normName 归一化后的小写串（去空格/下划线/横线/括号等） */
(function () {
  "use strict";
  window.COMFY_DATA = window.COMFY_DATA || {};
  window.COMFY_DATA.nodeAliases = {
    "loaddiffusionmodel": { pkg: "core-nodes", node: "Load Checkpoint 之外的模型加载家族" },
    "loadvae": { pkg: "core-nodes", node: "Load Checkpoint 之外的模型加载家族" },
    "loadlora": { pkg: "core-nodes", node: "Load Checkpoint 之外的模型加载家族" },
    "loadupscalemodel": { pkg: "core-nodes", node: "Upscale Model Loader + Image Upscale With Model" },
    "upscaleimageusingmodel": { pkg: "core-nodes", node: "Upscale Model Loader + Image Upscale With Model" },
    "loadcontrolnetmodel": { pkg: "core-nodes", node: "ControlNet Loader / Apply ControlNet (Advanced)" },
    "upscalelatent": { pkg: "core-nodes", node: "Latent Upscale (by)" },
    "emptysd3latentimage": { pkg: "core-nodes", node: "Empty Latent Image" },
    "conditioningzeroout": { pkg: "core-nodes", node: "Conditioning (Combine / Set Area 等)" },
    "dwposepreprocessor": { pkg: "controlnet-aux", node: "DWPreprocessor" },
    "wan22imagetovideolatent": { pkg: "comfy-extras", node: "WanImageToVideo" },
    "ltxavtextencoderloader": { pkg: "comfy-extras" },
    "ltxvtextencoderloader": { pkg: "comfy-extras" },
    "ltxvaudiovaeloader": { pkg: "comfy-extras" },
    "ltxvaudiovaeloader": { pkg: "comfy-extras" },
    "emptyltxvlatentvideo": { pkg: "comfy-extras" },
    "facerestoregpganwithmodel": { pkg: "comfy-extras" },
    "basicscheduler": { pkg: "core-nodes", node: "SamplerCustomAdvanced + 基础采样组件" },
    "randomnoise": { pkg: "core-nodes", node: "SamplerCustomAdvanced + 基础采样组件" },
    "cfgguider": { pkg: "core-nodes", node: "SamplerCustomAdvanced + 基础采样组件" },
    "controlnetapplyadvanced": { pkg: "core-nodes", node: "ControlNet Loader / Apply ControlNet (Advanced)" },
    "easycache": { pkg: "comfy-extras" },
    "emptyhunyuanvideo15latent": { pkg: "comfy-extras" },
    "ltxvemptylatentaudio": { pkg: "comfy-extras" },
    "ltxvlatentupsampler": { pkg: "comfy-extras" },
    "resizeimagemasknode": { pkg: "comfy-extras" }
  };
})();
