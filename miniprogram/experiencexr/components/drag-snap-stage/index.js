const { clamp, toLocalPoint, canSnap } = require("../../../utils/geometry");

Component({
  options:{multipleSlots:true},
  properties:{
    items:{type:Array,value:[]},targets:{type:Array,value:[]},
    width:{type:Number,value:320},height:{type:Number,value:420},tolerance:{type:Number,value:38},
  },
  data:{localItems:[],stageRect:null,active:null},
  observers:{items(items){this.setData({localItems:(items||[]).map((item)=>({...item}))});}},
  lifetimes:{ready(){this.measure();}},
  methods:{
    measure(){wx.createSelectorQuery().in(this).select(".drag-stage").boundingClientRect((rect)=>{if(rect)this.setData({stageRect:rect});}).exec();},
    onStart(e){
      const index=Number(e.currentTarget.dataset.index);const item=this.data.localItems[index];if(!item||item.fixed)return;
      const point=toLocalPoint(e.touches?.[0],this.data.stageRect);if(!point)return;
      this.setData({active:{index,start:point,originX:item.x,originY:item.y}});
    },
    onMove(e){
      const active=this.data.active;if(!active)return;
      const point=toLocalPoint(e.touches?.[0],this.data.stageRect);if(!point)return;
      const item=this.data.localItems[active.index];
      const x=clamp(active.originX+point.x-active.start.x,0,this.properties.width-item.width);
      const y=clamp(active.originY+point.y-active.start.y,0,this.properties.height-item.height);
      this.setData({[`localItems[${active.index}].x`]:x,[`localItems[${active.index}].y`]:y});
    },
    onEnd(){
      const active=this.data.active;if(!active)return;
      const items=this.data.localItems.map((item)=>({...item}));const item=items[active.index];
      const target=this.properties.targets[item.targetIndex];
      if(target&&canSnap(item,target,this.properties.tolerance)){
        item.x=target.x;item.y=target.y;item.fixed=true;
        this.triggerEvent("snap",{id:item.id,index:active.index});
      }else{item.x=item.startX;item.y=item.startY;}
      const complete=items.length>0&&items.every((entry)=>entry.fixed);
      this.setData({localItems:items,active:null});
      if(complete)this.triggerEvent("complete");
    },
  },
});
