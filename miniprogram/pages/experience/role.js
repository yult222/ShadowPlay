const { COPY } = require("../../data/experience");
const game = require("../../utils/game");
const audio = require("../../services/experienceAudio");
const { hideShareMenu } = require("../../utils/page");

Page({
  data:{copy:COPY,selected:true},
  onLoad(){hideShareMenu();},
  onShow(){audio.enterPage(this.route);},
  onHide(){audio.leavePage(this.route);},
  onUnload(){audio.leavePage(this.route);},
  back(){wx.navigateBack();},
  selectXiaodan(){this.setData({selected:true});audio.playFeedback();},
  choose(){if(game.selectRole("xiaodan")){audio.playFeedback();wx.navigateTo({url:"/pages/experience/workshop"});}},
});
