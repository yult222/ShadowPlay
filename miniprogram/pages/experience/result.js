const { COPY }=require("../../data/experience");const audio=require("../../services/experienceAudio");
Page({data:{copy:COPY},onShow(){audio.enterPage(this.route);},onHide(){audio.leavePage(this.route);},onUnload(){audio.leavePage(this.route);}});
