$(function() {
  var payment = {
    init: function() {
      var price = public.localStorage.get('price');
      $('.s-detail_a .s-price').text(price);
      $('.s-money_a .s-price').text('￥' + price);
      $('.s-money_b .s-price').text('￥' + price);
      $('[event-payment]').on('click', function() {
        //获取code
        var appid = 'wx2ad7e44b51a54aa1';
        //获取 code
        var local = window.location.href;
        var code = public.getParameter('code');
        if (code === null || code === '') {
          // 跳转至授权地址，该地址只支持微信浏览器打开
          window.location.href =
            'https://open.weixin.qq.com/connect/oauth2/authorize?appid=' +
            appid +
            '&redirect_uri=' +
            encodeURIComponent(local) +
            '&response_type=code&scope=snsapi_base#wechat_redirect';
        } else {
          console.log(code);
        }
      });
      if (public.getParameter('code')) {
        //判断有没有code
        var code = public.getParameter('code');
        var orderId = public.localStorage.get('orderId');
        var backUrl = h5Url + 'paymentSuccess.html?orderId=' + orderId;
        var orderNo = public.localStorage.get('orderNo');
        console.log(code);
        public.getOpenid(code);
        public.onBridgeReady(orderNo, backUrl);
      }
    }
  };
  payment.init();
});
