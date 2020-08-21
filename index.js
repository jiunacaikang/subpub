const noop = function () { console.log('i am noop') };

const duration = 200;

//如果传消息了 则取具体消息列表 否则取观察者列表
const $selcetSuberWrapper = function (puber, msg) {
  return !msg ? $(`.watcher-${puber.id}`).parent()
    : $(`.puber-${puber.id}[data-msg='${msg}']`).parent()
}
//获取订阅者
const $selectSuber = function (puber, msg, suber) {
  return $(`.puber-${puber.id}[data-msg='${msg}']`).find(`.suber-${suber.id}`)
}
//获取观察者
const $selectWatcher = function (puber, suber) {
  return $(`.watcher-${puber.id}`).find(`.suber-${suber.id}`)
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
      subType: '',//操作类型 add:订阅 remove:解除
      msgType: '',//消息类型 listen:订阅 publish:发布
      msg: '',
      msgIpt: ''
    }
  },
  mounted() {
    return false
    for (var i = 0; i < 2; i++) {
      if (i < 1) {
        this.pubers.push(new Publish('pub' + i))
      }
      this.subers.push(new Subscribe('sub' + i))
      this.doListen(this.subers[i], this.pubers[0], 'asdaflasdasdfs')
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
      suber.listen({ publisher: puber, message: msg, handler });
      this.closeMsgBox();
      this.resetSuber();
      this.$nextTick(() => {
        $blink($selectWatcher(puber, suber))
        $blink($selectSuber(puber, msg, suber))
      })
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
      let type = 'fadeOut';
      if (msg) {
        //解除某一个消息下的订阅者
        $selectSuber(puber, msg, suber)[type](duration, () => {
          suber.unlisten(puber, msg);
        })
      } else {
        //解除所有订阅者列表中的订阅者
        for (let key in puber.messageMap) {
          $selectSuber(puber, key, suber)[type](duration, () => {
            suber.unlisten(puber, key);
          })
        }

        //解除观察者列表中的观察者
        $selectWatcher(puber, suber)[type](duration, () => {
          suber.unlisten(puber, msg);
        })
      }

      setTimeout(() => {
        this.closeMsgBox();
        this.resetSuber();
      }, duration + 50)
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
      value !== null && setTimeout(() => this.doPublish(puber, msg, { value }), duration)
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
        $blink($selcetSuberWrapper(puber), () => msg && $blink($selcetSuberWrapper(puber, msg)));
      } else {
        msg && $blink($selcetSuberWrapper(puber, msg));
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
      if (type) {
        $(".mask,.msg-box").fadeIn();
      } else {
        $(".mask,.msg-box").fadeOut();
      }
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
        this.doPublish(this.selectedPuber, msg, { value })
      }

      if (this.subType === 'remove') { //取订
        this.doUnlisten(this.curSuber, this.selectedPuber, msg);
      }
    }
  }
})