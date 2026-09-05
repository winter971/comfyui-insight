/* 工作流源文件清单：真实文件来源标注
   origin: "external" = 来自公开真实仓库（可点击溯源）; 缺省 = 本站自制参考版 */
(function () {
  "use strict";
  window.COMFY_DATA = window.COMFY_DATA || {};
  var WT_REPO = "https://github.com/Comfy-Org/workflow_templates/blob/main/";
  var CB_REPO = "https://github.com/cubiq/ComfyUI_Workflows/blob/master/";
  window.COMFY_DATA.workflowFiles = {
    "sd15-txt2img":       { origin: "external", sourceName: "cubiq/ComfyUI_Workflows", sourceUrl: CB_REPO + "basic/basic_workflow.json", file: "assets/files/workflows/sd15-txt2img.json" },
    "sdxl-txt2img":       { origin: "external", sourceName: "ComfyUI 官方模板库 (Comfy-Org)", sourceUrl: WT_REPO + "templates/image_sdxl_simple.json", file: "assets/files/workflows/sdxl-txt2img.json" },
    "flux-dev-txt2img":   { origin: "external", sourceName: "ComfyUI 官方模板库 (Comfy-Org)", sourceUrl: WT_REPO + "templates/flux_dev_full_text_to_image.json", file: "assets/files/workflows/flux-dev-txt2img.json" },
    "img2img":            { origin: "external", sourceName: "cubiq/ComfyUI_Workflows", sourceUrl: CB_REPO + "image_conditioning/img2img_SDXL.json", file: "assets/files/workflows/img2img.json" },
    "hires-fix":          { origin: "external", sourceName: "ComfyUI 官方模板库（archived）", sourceUrl: WT_REPO + "archived/hiresfix_latent_workflow.json", file: "assets/files/workflows/hires-fix.json" },
    "inpaint-mask":       { origin: "external", sourceName: "cubiq/ComfyUI_Workflows", sourceUrl: CB_REPO + "in-out_painting/inpaint.json", file: "assets/files/workflows/inpaint-mask.json" },
    "outpaint":           { origin: "external", sourceName: "cubiq/ComfyUI_Workflows", sourceUrl: CB_REPO + "in-out_painting/outpaint.json", file: "assets/files/workflows/outpaint.json" },
    "ultimate-upscale":   { origin: "external", sourceName: "cubiq/ComfyUI_Workflows", sourceUrl: CB_REPO + "upscale/upscale_by_model.json", file: "assets/files/workflows/ultimate-upscale.json" },
    "turbo-lcm":          { origin: "external", sourceName: "ComfyUI 官方模板库 (Comfy-Org)", sourceUrl: WT_REPO + "templates/sdxlturbo_example.json", file: "assets/files/workflows/turbo-lcm.json" },
    "controlnet-canny":   { origin: "external", sourceName: "cubiq/ComfyUI_Workflows", sourceUrl: CB_REPO + "guided_composition/canny.json", file: "assets/files/workflows/controlnet-canny.json" },
    "controlnet-multi":   { origin: "external", sourceName: "cubiq/ComfyUI_Workflows", sourceUrl: CB_REPO + "guided_composition/experiments/multiple_controlnets.json", file: "assets/files/workflows/controlnet-multi.json" },
    "ipadapter-style":    { origin: "external", sourceName: "cubiq/ComfyUI_Workflows（IPAdapter 作者本人整理）", sourceUrl: CB_REPO + "image_conditioning/IPAdapter_basic_SDXL.json", file: "assets/files/workflows/ipadapter-style.json" },
    "animatediff-txt2vid":{ origin: "external", sourceName: "ComfyUI 官方模板库 (Comfy-Org)", sourceUrl: WT_REPO + "templates/template_animate_diff_loops.json", file: "assets/files/workflows/animatediff-txt2vid.json" },
    "wan22-txt2vid":      { origin: "external", sourceName: "ComfyUI 官方模板库 (Comfy-Org)", sourceUrl: WT_REPO + "templates/video_wan2_2_5B_ti2v.json", file: "assets/files/workflows/wan22-txt2vid.json" },
    "wan22-img2vid":      { origin: "external", sourceName: "ComfyUI 官方模板库 (Comfy-Org)", sourceUrl: WT_REPO + "templates/video_wan2_2_14B_i2v.json", file: "assets/files/workflows/wan22-img2vid.json" },
    "rife-frame-interp":  { origin: "external", sourceName: "ComfyUI 官方模板库 (Comfy-Org)", sourceUrl: WT_REPO + "templates/utility_video_frame_interpolation.json", file: "assets/files/workflows/rife-frame-interp.json" },

    /* —— 新增的官方模板工作流 —— */
    "flux-kontext-edit":  { origin: "external", sourceName: "ComfyUI 官方模板库 (Comfy-Org)", sourceUrl: WT_REPO + "templates/flux_kontext_dev_basic.json", file: "assets/files/workflows/flux-kontext-edit.json" },
    "qwen-image-edit":    { origin: "external", sourceName: "ComfyUI 官方模板库 (Comfy-Org)", sourceUrl: WT_REPO + "templates/image_qwen_image_edit_2509.json", file: "assets/files/workflows/qwen-image-edit.json" },
    "sdxl-refiner":       { origin: "external", sourceName: "ComfyUI 官方模板库 (Comfy-Org)", sourceUrl: WT_REPO + "templates/sdxl_refiner_prompt_example.json", file: "assets/files/workflows/sdxl-refiner.json" },
    "wan-vace-t2v":       { origin: "external", sourceName: "ComfyUI 官方模板库 (Comfy-Org)", sourceUrl: WT_REPO + "templates/video_wan_vace_14B_t2v.json", file: "assets/files/workflows/wan-vace-t2v.json" },
    "ltxv-t2v":           { origin: "external", sourceName: "ComfyUI 官方模板库 (Comfy-Org)", sourceUrl: WT_REPO + "templates/video_ltx2_t2v.json", file: "assets/files/workflows/ltxv-t2v.json" },
    "hunyuan-t2v":        { origin: "external", sourceName: "ComfyUI 官方模板库 (Comfy-Org)", sourceUrl: WT_REPO + "templates/video_hunyuan_video_1.5_720p_t2v.json", file: "assets/files/workflows/hunyuan-t2v.json" },
    "supir-upscale":      { origin: "external", sourceName: "ComfyUI 官方模板库 (Comfy-Org)", sourceUrl: WT_REPO + "templates/utility_image_upscale_supir.json", file: "assets/files/workflows/supir-upscale.json" },
    "ace-step-music":     { origin: "external", sourceName: "ComfyUI 官方模板库 (Comfy-Org)", sourceUrl: WT_REPO + "templates/audio_ace_step1_5_xl_turbo.json", file: "assets/files/workflows/ace-step-music.json" },
    "sd35-canny":         { origin: "external", sourceName: "ComfyUI 官方模板库 (Comfy-Org)", sourceUrl: WT_REPO + "templates/sd3.5_large_canny_controlnet_example.json", file: "assets/files/workflows/sd35-canny.json" }
  };
})();
