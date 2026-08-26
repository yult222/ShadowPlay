Component({properties:{stages:Array},methods:{onStage(e){this.triggerEvent("stage",{id:e.currentTarget.dataset.id});}}});
