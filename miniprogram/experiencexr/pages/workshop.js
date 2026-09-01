const { COPY, STAGES } = require("../../data/experience");
const game = require("../../utils/game");
const audio = require("../../services/experienceAudio");
const { canUseXR } = require("../../utils/xr");

Page({
  data:{copy:COPY,progress:0,stageViews:[],activeId:"",activeTitle:"",completedTitle:"",xrEnabled:false},
  onLoad(){this.setData({xrEnabled:canUseXR()});},
  onShow(){audio.enterPage(this.route);this.refresh();},
  onHide(){audio.leavePage(this.route);if(this.resultTimer)clearTimeout(this.resultTimer);},
  onUnload(){audio.leavePage(this.route);if(this.resultTimer)clearTimeout(this.resultTimer);},
  back(){wx.navigateBack();},
  refresh(){
    const state=game.getSnapshot();
    if(!state.selectedRole){wx.navigateBack();return;}
    const stageViews=STAGES.map((stage,index)=>({...stage,status:state.completedStageIds.includes(stage.id)?"completed":index===state.activeStageIndex?"active":"locked"}));
    const completedTitle=state.completedStageIds.length?STAGES.filter((stage)=>state.completedStageIds.includes(stage.id)).map((stage)=>stage.title).join("、"):COPY.none;
    this.setData({progress:state.progress,stageViews,activeId:state.activeStage?.id||"",activeTitle:state.activeStage?.title||COPY.result,completedTitle});
    if(state.finished){this.resultTimer=setTimeout(()=>wx.redirectTo({url:"/experience2d/pages/result"}),720);}
  },
  enterStage(e){
    const id=e.detail.id||e.currentTarget.dataset.id;if(!game.enterStage(id))return;
    const stage=STAGES.find((item)=>item.id===id);
    const root=stage?.renderer==="canvas"?"experience2d":"experiencexr";
    audio.playFeedback();wx.navigateTo({url:`/${root}/pages/stage?id=${id}`});
  },
  xrFallback(){this.setData({xrEnabled:false});},
});
