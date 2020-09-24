const noop = function () {}
const checkType = (source, type) => {
  return Object.prototype.toString.call(source).slice(8, -1).toLowerCase() === type.toLowerCase();
}

//订阅者构造器
class Subscribe {
  constructor(name = 'subscriber') {
    this.name = name
    //随机id模拟唯一
    this.id = Math.ceil(Math.random() * 500000) + 500000
  }
  /**
   * 订阅消息
   * @param {Object} 
   */
  listen({
    publisher,//订阅的是哪个发布者
    message,//订阅的消息
    handler//收到消息后的处理方法
  }) {
    //可能存在对不同发布者订阅相同的消息
    //回调函数要跟发布者id绑定 来区分不同发布者
    if (publisher instanceof Publish) {
      publisher._addListener(this, message)
      this[`${publisher.id}_${message}_handler`] = checkType(handler,'function') ? handler : noop
    }
    return this
  }
  /**
   * 解除订阅
   * @param {Publisher} publisher 发布者
   * @param {String} message 消息
   */
  unlisten(publisher, message, removeAll = true) {
    if (publisher instanceof Publish) { 
      publisher._removeListener(this, message, removeAll)
    }
    return this
  }
}


//发布者构造器
class Publish {
  constructor(name = 'publisher') {
    this.messageMap = {} //消息事件订阅者集合对象
    this.watcherList = [] //观察者列表
    //随机id模拟唯一
    this.id = Math.ceil(Math.random() * 10000) + 10000
    this.name = name
  }
  /**
   * 添加订阅者 内部方法
   * @param {Subscribe} subscriber 订阅者
   * @param {String} message 消息
   */
  _addListener(subscriber, message) { //添加消息订阅者
    if (!subscriber) return false
    const existInWatcherList = this.watcherList.findIndex(exitSubscriber => exitSubscriber.id === subscriber.id)
    if (!message) { //若没有订阅任何消息 则认为是观察者模式
      if (existInWatcherList === -1) {//观察者列表中不存在此订阅者
        this.watcherList.push(subscriber)
      } else {
        this.watcherList[existInWatcherList] = subscriber;
      }

      //并取消这个订阅者已经订阅的消息 但是不取消观察者模式关系
      this._removeListener(subscriber, '', false)
    } else { //订阅发布模式
      //已经是观察者情况下 不用再单独订阅消息
      if(existInWatcherList !== -1) return false

      if (!this.messageMap[message]) { //如果消息列表不存在，就新建
        this.messageMap[message] = []
      }
  
      const existIndex = this.messageMap[message].findIndex(exitSubscriber => exitSubscriber.id === subscriber.id)
      if (existIndex === -1) {//不存在这个订阅者时添加
        this.messageMap[message].push(subscriber)
      } else {//存在这个订阅者时更新回调handler
        this.messageMap[message][existIndex][`${this.id}_${message}_handler`] = subscriber[`${this.id}_${message}_handler`]
      }
    }

  }
  /**
   * 移除订阅者
   * @param {Subscribe} subscriber 
   * @param {String} message 
   * @param {Boolean} removeAll 删除 所有订阅列表和观察列表中的此订阅者
   */
  _removeListener(subscriber, message, removeAll = true) { //删除消息订阅者
    if (!subscriber) return this

    //如果传了message只删除此message下的订阅关系，否则删除此订阅者的所有订阅关系
    const messageList = message ? [message] : Object.keys(this.messageMap)

    messageList.forEach(message => {
      const subscribers = this.messageMap[message];

      if (!subscribers) return false;

      let i = subscribers.length;
      while (i--) {
        if (subscribers[i].id === subscriber.id) {
          subscribers.splice(i, 1)
        }
      }

      //若是此消息没有订阅者了 删除这个消息列表
      if (!subscribers.length) delete this.messageMap[message]
    })

    //没有具体消息为观察者模式
    !message && removeAll && (this.watcherList = this.watcherList.filter(watcher => watcher.id !== subscriber.id))
    return this
  }
  /**
   * 发布消息
   * @param {String} message 消息
   * @param {Object} info 内容
   */
  publish(message, info) { //发布通知
    //观察者模式 执行回调
    this.watcherList.forEach(watcher => {
      watcher[`${this.id}__handler`](info)
    })

    if (message) {//执行此消息下的订阅者回调
      const subscribers = this.messageMap[message]
      if (subscribers && subscribers.length) {
        subscribers.forEach(subscriber => {
          subscriber[`${this.id}_${message}_handler`](info)
        })
      }
    } 
  
    return this
  }
};