const duration = 200;

//如果传消息了 则取具体消息列表 否则取观察者列表
const $selcetSuberWrapper = function (puber, msg) {
  return !msg ? $(`.watcher-${puber.id}`).parents('.watcher-wrapper')
    : $(`.puber-${puber.id}[data-msg='${msg}']`).parent()
}

//闪动
const $blink = function (selector, cb) {
  $(selector).fadeOut(duration, function(){
    $(this).fadeIn(duration, function () {
      cb && cb();
    });
  });
}

new Vue({
  el: '#app',
  data: function() {
    return {
      pubers: [],
      subers: [],
      curSuber: {},//要操作的订阅者
      selectedPuber: {},//选中的发布者
      showMsgBox: false,
      subType: '',//操作类型 add:订阅 remove:解除
      msgType: '',//消息类型 listen:订阅 publish:发布
      msg: '',
      msgIpt: ''
    }
  },
  mounted() {
    //return false
    for (var i = 0; i < 2; i++) {
      if (i < 1) {
        this.pubers.push(new Publish('pub' + i))
      }
      this.subers.push(new Subscribe('sub' + i))
      this.doListen(this.subers[i], this.pubers[0], 'asdafla')
      this.doListen(this.subers[i], this.pubers[0], '胜多负少')
    }
  },
  methods: {
    /**
     * 创建发布者
     */
    addPuber() {
      if (this.pubers.length > 1) {
        alert('样式限制只能增加2个')
        return false
      }
      let name = prompt("请输入发布者名称")
      if (!name) return false
      if (this.pubers.find(el => el.name == name)) {
        alert("名字不能重复");
        return false
      }

      let puber = new Publish(name);
      this.pubers.push(puber)
    },
    /**
     * 创建订阅者
     */
    addSuber() {
      if (this.subers.length > 9) {
        alert('只能增加10个')
        return false
      }
      let name = prompt("请输入订阅者名称")
      if (!name) return false
      if (this.subers.find(el => el.name == name)) {
        alert("名字不能重复");
        return false
      }

      let suber = new Subscribe(name);
      this.subers.push(suber)
    },
    /**
     * 开始订阅
     * @param {Subscribe} suber 订阅者
     */
    listen(suber) {
      this.subType = 'add'; //订阅
      this.msgType = 'listen'; //订阅
      this.curSuber = suber;
      this.selectedPuber = {};
    },
    /**
     * 执行订阅
     * @param {Subscribe} suber 订阅者
     * @param {Publish} puber 发布者
     * @param {String} msg 消息
     * @param {Function} handler 回调函数
     */
    doListen(suber, puber, msg, handler = noop) {
      if (Object.keys(puber.messageMap).length >= 10 && Object.keys(puber.messageMap).indexOf(msg) === -1) {
        alert("不可超过10条消息")
        return false
      }

      //重新订阅时 执行抖动表示重新订阅
      let suberIndex = puber.messageMap[msg] ? puber.messageMap[msg].findIndex(el => el.id === suber.id) : -1
      let watcherIndex = puber.watcherList.findIndex(el => el.id === suber.id)
      let curSuber = Object.assign({refresh: true}, suber)

      if (suberIndex > -1) {//订阅模式下 执行抖动效果
        this.$set(puber.messageMap[msg], suberIndex, curSuber)
        setTimeout(() => {
          curSuber.refresh = false;
          this.$set(puber.messageMap[msg], suberIndex, curSuber)
          this.$forceUpdate();
        }, duration)
      } else if (watcherIndex > -1) {//观察者模式下 执行抖动效果
        this.$set(puber.watcherList, watcherIndex, curSuber)
        setTimeout(() => {
          curSuber.refresh = false;
          this.$set(puber.watcherList, watcherIndex, curSuber)
        }, duration)
      }

      //初始化订阅 立即执行订阅
      if (suberIndex === -1 && watcherIndex === -1 ) {
        suber.listen({ publisher: puber, message: msg, handler });
      } else { //更新订阅时 等抖动效果执行完再添加
        setTimeout(() => {
          suber.listen({ publisher: puber, message: msg, handler });
        }, duration)
      }
      this.resetSuber();
      this.closeMsgBox();
    },

    /**
     * 解除订阅
     * @param {Subscribe} suber 订阅者
     */
    unlisten(suber) {
      this.subType = 'remove'; //解除
      this.msgType = '';
      this.curSuber = suber;
      this.selectedPuber = {};
    },
    /**
     * 执行解除订阅
     * @param {Subscribe} suber 订阅者
     */
    doUnlisten(suber, puber, msg) {
      suber.unlisten(puber, msg);
      this.closeMsgBox();
      this.resetSuber();
    },

    /**
     * 选择发布者
     * @param {Publish} puber 发布者
     */
    choicePuber(puber) {
      this.selectedPuber = puber;
      this.toggleMsgBox(true)
    },
    /**
     * 发布消息
     * @param {Publish} puber 发布者
     */
    publish(puber) {
      this.subType = '';
      this.msgType = 'publish';
      this.selectedPuber = puber;
      this.toggleMsgBox(true);
    },
    /**
     * 快速发布消息
     * @param {Publish} puber 发布者
     * @param {String} msg 消息
     */
    fastPublish(puber, msg) {
      let value = prompt("请输入要发布的内容")
      value !== null && setTimeout(() => this.doPublish(puber, msg, { value }), duration + 50)
    },
    /**
     * 执行发布消息
     * @param {Publish} puber 发布者
     * @param {String} msg 消息
     * @param {Object} info 内容
     */
    doPublish(puber, msg, info) {
      info = Object.assign({ _puberName: puber.name, _msgName: msg, _timePublish: Date.now() }, info)
      
      //若观察者列表有数据 就闪动表示收到消息
      if (puber.watcherList.length) {
        //先更新观察者列表 再更新订阅者列表
        $blink($selcetSuberWrapper(puber), () =>  msg && $blink($selcetSuberWrapper(puber, msg)));
      } else {
        //订阅者集合照到对应消息 闪动
        if (msg) {
          $blink($selcetSuberWrapper(puber, msg));
        }
      }

      if (msg) { //让msg标签变绿
        let $msg = $selcetSuberWrapper(puber, msg).siblings('.msg');
        $msg.addClass('light');
        let times = puber.watcherList.length ? 4 : 2;
        setTimeout(() => {  $msg.removeClass('light') }, duration * times + 100);
      }

      
      puber.publish(msg, info);
      this.closeMsgBox();
      this.resetSuber();
    },

    /**
     * 关闭选择
     */
    closeChoice() {
      this.curSuber = {};
      this.selectedPuber = {};
    },
    /**
     * 关闭选择消息弹框
     */
    closeMsgBox() {
      this.msg = '';
      this.msgIpt = '';
      this.toggleMsgBox(false)
    },
    /**
     * 重置当前操作的订阅者
     */
    resetSuber() {
      this.$nextTick(() => {
        this.curSuber = {};
      })
    },
    /**
     * 
     * @param {Boolean} type 方式
     */
    toggleMsgBox(type) {
      this.showMsgBox = type;
    },
    /**
     * 确认选择消息
     */
    msgConfirm() {
      let msg = this.msgIpt || this.msg;

      if (this.msgType === 'listen') { //订阅
        let suberCopy = JSON.parse(JSON.stringify(this.curSuber));
        let _timeListen = Date.now();
        this.doListen(this.curSuber, this.selectedPuber, msg, function (info) {
          console.log(`%c ${suberCopy.name} receive message:`, 'color:#fff;background:#03ff4b');
          console.dir({ _timeListen, ...info })
        })
      }

      if (this.msgType === 'publish') { //发布
        let value = prompt("请输入要发布的内容")
        value !== null && setTimeout(() => this.doPublish(this.selectedPuber, msg, { value }), duration + 50);
      }

      if (this.subType === 'remove') { //取订
        this.doUnlisten(this.curSuber, this.selectedPuber, msg);
      }
    }
  }
})