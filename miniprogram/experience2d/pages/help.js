const { COPY, STAGES } = require("../../data/experience");const audio=require("../../services/experienceAudio");
const GESTURES=["tilt","tap","trace","trace","paint","tap","drag","drag","drag"];
Page({data:{copy:COPY,stages:STAGES.map((stage,index)=>({...stage,gesture:GESTURES[index]}))},onShow(){audio.enterPage(this.route);},onHide(){audio.leavePage(this.route);},onUnload(){audio.leavePage(this.route);},back(){wx.navigateBack();}});
