var public = public ? public : {}; //封装

/*
 * ajax
 * */
public.ajaxLoadData = function(url, data, callback, type, async) {
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
    async: async,
    timeout: 4500,
    beforeSend: function() {
      var html =
        '<div class="s-loading-bg" id="s-loading-bg" style="position: fixed;left: 0;top:0;width: 100%;height: 100%;background: rgba(0,0,0,0.1);z-index: 333;"> ' +
        '<div style="position: absolute;left: 50%;top: 50%;margin-top: -0.34rem;margin-left: -0.34rem;width: 0.68rem;height: 0.68rem;"><div class="loadEffect"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div></div>' +
        '</div>';
      $(document.body).append(html);
    },
    complete: function(xhr, status) {
      $('#s-loading-bg').remove();
      if (status == 'timeout') {
        public.showValidateMsgTrsf('请求超时');
      }
    },
    success: function(result, textStatus) {
      result = result || '';
      if (callback) {
        callback(result);
      }
    },
    error: function(errorMsg) {
      if (errorMsg && errorMsg.status == 200) {
        public.showValidateMsgTrsf(errorMsg.responseText);
      } else {
        public.showValidateMsgTrsf('链接服务器失败');
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
 * 微信支付
 * */
public.onBridgeReady = function(orderNo, backUrl, code, token) {
  var url = '/pay/wxgzhorder?code=' + code + '&token=' + token;
  var data = { orderNo: orderNo, backUrl: backUrl, code: code, token: token };
  var callback = function(result) {
    if (result.returnCode === 'success') {
      if (typeof WeixinJSBridge !== 'undefined') {
        WeixinJSBridge.invoke(
          'getBrandWCPayRequest',
          {
            appId: result.appId, //公众号名称，由商户传入
            timeStamp: result.timeStamp, //时间戳，自1970年以来的秒数
            nonceStr: result.nonceStr, //随机串
            package: result.package,
            signType: result.signType, //微信签名方式：
            paySign: result.paySign //微信签名
          },
          function(res) {
            if (res.err_msg == 'get_brand_wcpay_request:ok') {
              public.showValidateMsgTrsf('支付成功');
              public.paySuccessCallBack(true, '支付成功');
            } else if (res.err_msg == 'get_brand_wcpay_request:cancel') {
              public.showValidateMsgTrsf('支付过程中用户取消');
            } else if (res.err_msg == 'get_brand_wcpay_request:fail') {
              public.showValidateMsgTrsf('支付失败');
              public.paySuccessCallBack(false, '支付失败');
            } else {
              public.showValidateMsgTrsf('支付失败');
              public.paySuccessCallBack(false, '请求参数失效，请重新扫码');
            }
          }
        );
      } else {
        $('#s-loading-bg').remove();
        public.showErrMsg('请在微信中打开此链接');
      }
    } else {
      public.showValidateMsgTrsf(result.returnMessage);
    }
  };
  public.ajaxLoadData(url, null, callback, 'get');
};
public.paySuccessCallBack = function(flag, msg) {
  var AMT = public.localStorage.get('AMT');
  if (!flag) {
    $('.s-money_b.pay-call-back').html('<p>已付款：<span class="s-price">￥' + AMT + '</span></p>');
    $('.pay-detail-box').addClass('hidden');
    $('.pay-success-box').removeClass('hidden');
  } else {
    $('.s-money_b.pay-call-back').html('<p style="color:#ee5e7b">' + msg + '</p>');
  }
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
    public.showErrMsg('请在微信中打开此链接');
    return false;
  }
};
//
function Fen2Yuan(num) {
  if (typeof num !== 'number' || isNaN(num)) return null;
  return (num / 100).toFixed(2);
}

// 获取AMT,NO,TOKEN
public.getANT = function() {
  var param = {
    amt: '',
    no: '',
    token: ''
  };
  var paramStr = public.getParameter('state');
  console.log(paramStr);
  if (paramStr && paramStr.match(/AMT|NO|TOKEN/g) && paramStr.match(/AMT|NO|TOKEN/g).length == 3) {
    var amtIndex = paramStr.search('AMT');
    var noIndex = paramStr.search('NO');
    var tokenIndex = paramStr.search('TOKEN');
    var amt = paramStr.substring(amtIndex, noIndex).substr(3);
    var no = paramStr.substring(noIndex, tokenIndex).substr(2);
    var token = paramStr.substring(tokenIndex).substr(5);
    var yuan = Fen2Yuan(Number(amt));
    param = {
      amt: yuan,
      no: no,
      token: token
    };
  }
  public.localStorage.add('AMT', param.amt);
  public.localStorage.add('NO', param.no);
  public.localStorage.add('token', param.token);
  console.log(param);
};
// 显示信息
public.showErrMsg = function(msg) {
  var html =
    '<div class="s-bg-wx" style="position: fixed;top: 0;left: 0;background: rgba(0,0,0,0.5);width: 100%;height: 100%;z-index:3333;">' +
    '<div style="width: 4rem;display: block;position: absolute;top: 50%;left: 50%;margin-left: -2rem;font-size:0.3rem;color:#fff;text-align:center;letter-spacing: 2px;">' +
    msg +
    '</div>' +
    '</div>';
  $(document.body).append(html);
};

$(function() {
  public.isWeixin();
  public.getANT();
  var payment = {
    init: function() {
      // 支付成功
      if (public.getParameter('paySuccess') == 'WXPAYSUCESS') {
        $('.pay-detail-box').addClass('hidden');
        $('.pay-success-box').removeClass('hidden');
      } else {
        // 支付详情
        payinit();
        $('.pay-detail-box').removeClass('hidden');
        $('.pay-success-box').addClass('hidden');
      }

      function payinit() {
        var AMT = public.localStorage.get('AMT');
        var NO = public.localStorage.get('NO');
        $('.s-shop-detail .s-detail').text(NO);
        $('.s-price').text('￥' + AMT);
        // 支付
        $('[event-payment]').on('click', function() {
          if (public.getParameter('code')) {
            var code = public.getParameter('code');
            var token = public.localStorage.get('token');
            var backUrl = window.location.origin + window.location.pathname + '?paySuccess=WXPAYSUCESS&';
            var orderNo = public.localStorage.get('NO');
            if (token && code) {
              if (typeof WeixinJSBridge == 'undefined') {
                if (document.addEventListener) {
                  document.addEventListener(
                    'WeixinJSBridgeReady',
                    public.onBridgeReady(orderNo, backUrl, code, token),
                    false
                  );
                } else if (document.attachEvent) {
                  document.attachEvent('WeixinJSBridgeReady', public.onBridgeReady(orderNo, backUrl, code, token));
                  document.attachEvent('onWeixinJSBridgeReady', public.onBridgeReady(orderNo, backUrl, code, token));
                }
              } else {
                public.onBridgeReady(orderNo, backUrl, code, token);
              }
            } else {
              public.showValidateMsgTrsf('链接已经失效');
            }
          } else {
            public.showValidateMsgTrsf('链接已经失效');
          }
        });
      }
    }
  };
  payment.init();
});
