$(function() {
  var payment = {
    init: function() {
      var price = public.localStorage.get('price');
      $('.s-detail_a .s-price').text(price);
      $('.s-money_a .s-price').text('￥' + price);
      $('.s-money_b .s-price').text('￥' + price);
      $('[event-payment]').on('click', function() {
        public.getCode();
      });
      if (public.getParameter('code')) {
        //判断有没有code
        var code = public.getParameter('code');
        var orderId = public.localStorage.get('orderId');
        var backUrl = h5Url + 'success.html?orderId=' + orderId;
        var orderNo = public.localStorage.get('orderNo');
        console.log(code);
        // public.getOpenid(code);
        // public.onBridgeReady(orderNo, backUrl);
      }
    }
  };
  payment.init();
});
