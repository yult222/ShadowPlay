Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },

    title: {
      type: String,
      value: '提示'
    },

    content: {
      type: String,
      value: ''
    },

    showCancel: {
      type: Boolean,
      value: true
    },

    confirmText: {
      type: String,
      value: '确定'
    }
  },

  methods: {
    onConfirm() {
      this.triggerEvent('confirm')
    },

    onCancel() {
      this.triggerEvent('cancel')
    }
  }
})
