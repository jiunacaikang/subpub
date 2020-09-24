const duration = 300;

String.prototype.trim = function () {
  return this.replace(/(^\s*)|(\s*$)/g, "");
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
      msgIpt: '',
      prompt: ''
    }
  },
  mounted() {
    this.prompt = Popop.prompt.bind(this);
    return false
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
        Popop.pop('测试演示2个够用了')
        return false
      }

      this.prompt({
        title: '请输入发布者名称',
        confirm(name) {
          name = name.trim();
          if (!name) return false
          if (this.pubers.find(el => el.name == name)) {
            Popop.toast("名字不能重复");
            return false
          }
    
          let puber = new Publish(name);
          this.pubers.push(puber)
          Popop.toast("创建发布者:" + name);
        },
      });
    },
    /**
     * 创建订阅者
     */
    addSuber() {
      if (this.subers.length > 9) {
        Popop.pop('测试演示10个够用了')
        return false
      }
      this.prompt({
        title: '请输入订阅者名称',
        confirm(name) {
          name = name.trim();
          if (!name) return false
          if (this.subers.find(el => el.name == name)) {
            Popop.toast("名字不能重复");
            return false
          }
    
          let suber = new Subscribe(name);
          this.subers.push(suber)
          Popop.toast("创建订阅者:" + name);
        },
      });
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
      this.closeMsgBox();
      if (Object.keys(puber.messageMap).length >= 10 && msg && Object.keys(puber.messageMap).indexOf(msg) === -1) {
        Popop.pop('测试演示10条消息够用了')
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
        Popop.toast(`${suber.name}订阅了 ${puber.name} ${msg ? "的'" + msg + "'" : ''}`);
        suber.listen({ publisher: puber, message: msg, handler });
      } else { //更新订阅时 等抖动效果执行完再添加
        Popop.toast(`${suber.name}刷新了对 ${puber.name} ${msg ? "'" + msg + "'" : ''}的订阅`);
        setTimeout(() => {
          suber.listen({ publisher: puber, message: msg, handler });
        }, duration)
      }
      this.resetSuber();
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
      Popop.toast(`${suber.name}解除对 ${puber.name} ${msg ? "'" + msg + "'" : ''}的订阅`);
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
      this.prompt({
        title: '请输入要发布的内容',
        confirm(value) {
          this.closeMsgBox();
          value = value.trim()
          setTimeout(() => this.doPublish(puber, msg, { value }), duration + 50)
        }
      });
    },
    /**
     * 执行发布消息
     * @param {Publish} puber 发布者
     * @param {String} msg 消息
     * @param {Object} info 内容
     */
    doPublish(puber, msg, info) {
      const hasMsg = msg && Object.keys(puber.messageMap).includes(msg);
      
      //添加上发布者名字 发布消息名字 发布时间 
      info = Object.assign({ _puberName: puber.name, _msgName: msg, _timePublish: Date.now() }, info)
      
      //若观察者列表有数据 就闪动表示收到消息
      if (puber.watcherList.length) {
        //先更新观察者列表 再更新订阅者列表
        Popop.toast(puber.name + '通知观察者列表');
        this.$set(puber, 'watchBlink', true);
        setTimeout(() => {
          this.$set(puber, 'watchBlink', false);
          
          if (hasMsg) {//订阅者集合收到对应消息 闪动
            Popop.toast(`再通知'${msg}'的订阅列表`);
            this.$set(puber, 'subBlink', msg);
          }
        }, duration * 2)
      } else if(hasMsg) {
        //订阅者集合收到对应消息 闪动
        this.$set(puber, 'subBlink', msg);
      }

      if (hasMsg) { //取消动画
        let delayTime = duration * (puber.watcherList.length ? 2 : 1) + 200;
        setTimeout(() => { this.$set(puber, 'subBlink', '') }, delayTime);
      }

      puber.publish(msg, info);
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
        this.closeMsgBox();
        this.prompt({
          title: '请输入要发布的内容',
          confirm(value) {
            setTimeout(() => this.doPublish(this.selectedPuber, msg, { value }), duration + 50)
          }
        });
      }

      if (this.subType === 'remove') { //取订
        this.doUnlisten(this.curSuber, this.selectedPuber, msg);
      }
    }
  }
})