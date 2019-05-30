var public = public ? public : {}; //封装
context = ''; //后台接口
h5Url = ''; //前端域名

/*
 * ajax
 * */
public.ajaxLoadData = function(url, data, callback, type, async, dataType) {
  var async = typeof async != 'undefined' ? async : true;
  var type = typeof type != 'undefined' ? type : 'get';
  var token = public.localStorage.get('token');
  $.ajax({
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json;charset=utf-8',
      token: token
    },
    url: url,
    data: JSON.stringify(data),
    type: type,
    dataType: 'json',
    async: async,
    beforeSend: function() {
      var html =
        '<div class="s-loading-bg" id="s-loading-bg" style="position: fixed;left: 0;top:0;width: 100%;height: 100%;background: rgba(0,0,0,0.1);z-index: 333;"> ' +
        '<img src="img/common/loading.gif" alt="" style="position: absolute;left: 50%;top: 50%;margin-top: -16px;margin-left: -16px;width: 32px;height: 32px;"> ' +
        '</div>';
      $(document.body).append(html);
    },
    complete: function() {
      $('#s-loading-bg').remove();
    },
    dataFilter: function(result) {
      return result;
    },
    success: function(result, textStatus) {
      result = result || '';
      if (callback) {
        callback(result);
      }
    },
    error: function(errorMsg) {
      alert('链接服务器失a败');
      if (errorMsg.responseText) {
        if (typeof errorMsg.responseText == 'string') {
          try {
            msg = eval('(' + errorMsg.responseText + ')');
            msg = msg.errormsg;
          } catch (e) {}
        } else {
          msg = errorMsg.responseText.errormsg;
        }
      }
    }
  });
};

/*
 * 时间戳转换
 * */
Date.prototype.format = function(format) {
  var date = {
    'M+': this.getMonth() + 1,
    'd+': this.getDate(),
    'h+': this.getHours(),
    'm+': this.getMinutes(),
    's+': this.getSeconds(),
    'q+': Math.floor((this.getMonth() + 3) / 3),
    'S+': this.getMilliseconds()
  };
  if (/(y+)/i.test(format)) {
    format = format.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length));
  }
  for (var k in date) {
    if (new RegExp('(' + k + ')').test(format)) {
      format = format.replace(
        RegExp.$1,
        RegExp.$1.length == 1 ? date[k] : ('00' + date[k]).substr(('' + date[k]).length)
      );
    }
  }
  return format;
};

/*
 * 缓存
 * */
public.localStorage = {
  init: function() {
    if (window.localStorage) {
      public.localStorage.obj = window.localStorage;
    } else {
      public.localStorage.obj = null;
    }
    public.localStorage.localtype = true;
  },
  add: function(name, value) {
    if (public.localStorage.obj) {
      try {
        if (typeof value == 'object') {
          value = JSON.stringify(value);
        }
        public.localStorage.obj.setItem(name, value);
        public.cookieStorage.setCookie(name, value);
      } catch (e) {
        public.localStorage.remove(name);
        public.cookieStorage.clearCookie(name);
      }
    } else {
      public.cookieStorage.setCookie(name, value);
    }
  },
  get: function(name) {
    if (public.localStorage.obj) {
      var obj = public.localStorage.obj.getItem(name);
      if (!obj || obj == 'null') {
        obj = public.cookieStorage.getCookie(name);
      }
      return obj;
    } else {
      return public.cookieStorage.getCookie(name);
    }
  },
  remove: function(name) {
    if (public.localStorage.obj) {
      public.localStorage.obj.removeItem(name);
      public.cookieStorage.clearCookie(name);
    } else {
      public.cookieStorage.clearCookie(name);
    }
  }
};
public.cookieStorage = {
  getCookie: function(name) {
    var start = document.cookie.indexOf(name + '=');
    var len = start + name.length + 1;
    if (!start && name != document.cookie.substring(0, name.length)) {
      return '';
    }
    if (start == -1) {
      return '';
    }
    var end = document.cookie.indexOf(';', len);
    if (end == -1) {
      end = document.cookie.length;
    }
    return unescape(document.cookie.substring(len, end));
  },
  setCookie: function(name, value, expires) {
    var exp = new Date();
    expires = expires ? expires : 90;
    exp.setTime(exp.getTime() + 60 * 1000 * expires);
    document.cookie = name + '=' + escape(value) + ';expires=' + exp.toGMTString();
    //document.cookie = name + "=" + escape(value);
  },
  clearCookie: function(name) {
    var date = new Date();
    date.setTime(date.getTime() - 10000);
    document.cookie = name + '=a; expires=' + date.toGMTString();
  }
};

/*
 * 配置信息
 * context：后台接口地址
 * h5Url：前端网址域名
 * */
public.pathName = function() {
  var url = location.href;
  var pathName = url.substring(url.indexOf('//') + 2, url.indexOf('.'));
  if (pathName == 't7') {
    //测试环境
    context = 'http://192.168.1.27:28008/';
    h5Url = 'http://t7.aintelligen.com/';
  } else {
    //正式环境（灰度/全量）
    context = 'https://m.aintelligen.com/';
    h5Url = 'https://m.aintelligen.com/';
  }

  public.localStorage.add('context', context);
  public.localStorage.add('h5Url', h5Url);
};

/*
 * 微信支付
 * */
public.onBridgeReady = function(orderNo, backUrl) {
  var url = context + 'wechat/payHandler';
  var openid = public.localStorage.get('openid');
  var data = { orderNo: orderNo, openid: openid, url: backUrl };
  var callback = function(result) {
    if (result.code === '00000') {
      wx.config({
        debug: false, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
        appId: result.data.appId, // 必填，公众号的唯一标识
        timestamp: result.data.timeStamp, // 必填，生成签名的时间戳
        nonceStr: result.data.nonceStr, // 必填，生成签名的随机串
        signature: result.data.ticketSign, // 必填，sdk权限签名，见附录1
        jsApiList: ['checkJsApi', 'chooseWXPay'] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
      });
      wx.ready(function() {
        //支付
        wx.chooseWXPay({
          timestamp: result.data.timeStamp, // 支付签名时间戳，注意微信jssdk中的所有使用timestamp字段均为小写。但最新版的支付后台生成签名使用的timeStamp字段名需大写其中的S字符
          nonceStr: result.data.nonceStr, // 支付签名随机串，不长于 32 位
          package: result.data.package, // 统一支付接口返回的prepay_id参数值，提交格式如：prepay_id=***）
          signType: 'MD5', // 签名方式，默认为'SHA1'，使用新版支付需传入'MD5'
          paySign: result.data.paySign, // 支付签名
          success: function(res) {
            // 支付成功后的回调函数
            if (!res.err_msg) {
              //支付完后.跳转到成功页面.
              location.href = backUrl;
            }
          },
          cancel: function(res) {
            $('#payWBtn').text('微信支付');
            $('#payWBtn').removeAttr('active');
          }
        });
        // config信息验证后会执行ready方法，所有接口调用都必须在config接口获得结果之后，config是一个客户端的异步操作，所以如果需要在页面加载时就调用相关接口，则须把相关接口放在ready函数中调用来确保正确执行。对于用户触发时才调用的接口，则可以直接调用，不需要放在ready函数中。
      });
      wx.error(function(res) {
        //config信息验证失败会执行error函数，如签名过期导致验证失败，具体错误信息可以打开config的debug模式查看，也可以在返回的res参数中查看，对于SPA可以在这里更新签名。
        //alert("支付失败"+res.errMsg);
      });
      wx.checkJsApi({
        jsApiList: ['chooseWXPay'], // 需要检测的JS接口列表，所有JS接口列表见附录2,
        success: function(res) {
          //alert("检测接口:"+res.errMsg);
        }
      });
    } else {
      public.showValidateMsgTrsf(result.data);
    }
  };
  public.ajaxLoadData(url, data, callback, 'post');
};

/*
 * 支付宝支付
 * */
public.onAlipayZ = function(orderNo, backUrl) {
  var bsUrl = backUrl.split('com');
  //var backUrl = bsUrl[0]+"com/vernonshopweb/guide/pay_complete.html";
  //var url = context + "/vernonshop/alipay/payinfo/"+orderNo+"?return_url="+backUrl;
  var url = context + '/vernonshop/alipay/payinfo';
  var data = { orderNo: orderNo, return_url: backUrl };
  var callback = function(result) {
    if (result.code === 0) {
      var data = result.data.payInfo;
      public.localStorage.remove('show-dailog');
      location.href = data;
    } else {
      console.log('alipay:' + result);
      public.showValidateMsgTrsf(result.message);
      $('#payZBtn').text('支付宝支付');
      $('#payZBtn').removeAttr('active');
    }
  };
  public.ajaxLoadData(url, data, callback, 'post');
};

/*
 * 获取url参数
 * */
public.getParameter = function(name) {
  var reg = new RegExp('(^|&|@)' + name + '=([^&@]*)(@|&|$)'); //构造一个含有目标参数的正则表达式对象
  var str = window.location.search.substr(1);
  str = str.split('?');
  var r = str[0].match(reg); //匹配目标参数
  if (r != null) return unescape(r[2]);
  return null; //返回参数值
};

/*
 * 提示框
 * */
public.showValidateMsgTrsf = function(msg, times) {
  var dailog = $(document.body).find('#validateDailog');
  if (dailog.length === 0) {
    var target =
      "<div id='validateDailog' style='position:absolute;top:50%;left:50%;z-index:33333;width:3rem;margin-left:-1.5rem;text-align:center;font-size:.2rem;background-color: #666666;padding:.12rem 0.06rem;color: #fff;border-radius: 0.08rem;'>" +
      msg +
      '</div>';
    $(document.body).append(target);
    var height = parseInt($('#validateDailog').css('height')) / 2;
    $('#validateDailog').css('margin-top', '-' + height + 'px');
  }
  var times = times ? times : 2000;
  setTimeout(function() {
    $('#validateDailog').remove();
  }, times);
};

/*
 * 判断微信浏览器
 * */
public.isWeixin = function() {
  var ua = window.navigator.userAgent.toLowerCase();
  var href = window.location.href;
  var boolean = href.indexOf('download');
  if (href.indexOf('download') != -1) {
    return;
  }
  if (ua.match(/MicroMessenger/i) == 'micromessenger') {
    return true;
  } else {
    var html =
      '<div class="s-bg-wx" style="position: fixed;top: 0;left: 0;background: rgba(0,0,0,0.5);width: 100%;height: 100%;z-index:3333;">' +
      '<img src="img/common/weixinduan.png" style="width: 4rem;display: block;position: absolute;top: 50%;left: 50%;margin-left: -2rem;">' +
      '</div>';
    $(document.body).append(html);
    return false;
  }
};

/*
 * 获取code
 * */
public.getCode = function() {
  var url = context + 'wechat/isAuthorize?redirect_uri' + window.location.origin;
  var callback = function(result) {
    if (result.code == '00000') {
      // window.location.href = result.data.redirectUrl;
      console.log(result);
    } else {
      public.showValidateMsgTrsf(result.data);
    }
  };
  public.ajaxLoadData(url, window.location.origin, callback, 'get');
};

/*
 * 获取openid
 * */
public.getOpenid = function(code) {
  var url = context + 'wechat/getWachatOpid?code=' + code;
  var callback = function(result) {
    if (result.code == '00000') {
      public.localStorage.add('openid', result.data.openid);
      public.cookieStorage.setCookie('openid', result.data.openid);
    } else {
      public.showValidateMsgTrsf(result.data);
    }
  };
  public.ajaxLoadData(url, null, callback, 'get', null, false);
};

public.getPath = function() {
  //获取当前网址，如： https://localhost:8080/vernonshopweb/detail.html
  var cur_3w = window.document.location.href;
  /*cur_3w = cur_3w.substring(0,cur_3w.substr(1).indexOf('.com')+1)+".com/vernonshopweb/";
	 return cur_3w;*/
  //获取主机地址之后的目录，如： vernonshopweb/detail.html
  var pathName = window.document.location.pathname;
  var pos = cur_3w.indexOf(pathName);
  //获取主机地址，如： https://localhost:8080
  var localhostPaht = cur_3w.substring(0, pos);
  //获取带"/"的项目名，如：/vernonshopweb
  var projectName = pathName.substring(0, pathName.substr(1).indexOf('/') + 1);
  return localhostPaht + projectName;
};

function getArguments() {
  var url = location.search; //获取url中"?"符后的字串
  var theRequest = new Object();
  if (url == '') {
    theRequest = null;
  } else {
    if (url.indexOf('?') != -1) {
      var str = url.substr(1);
      strs = str.split('&');
      for (var i = 0; i < strs.length; i++) {
        theRequest[strs[i].split('=')[0]] = decodeURI(strs[i].split('=')[1]);
      }
    } else {
      theRequest = null;
    }
  }
  return theRequest;
}

public.pathName();
public.isWeixin();
