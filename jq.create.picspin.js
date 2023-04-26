/**
 * @插件依赖  jQuery, easeljs, tweenjs
 * @构思原理  每一幅图, 都是由同一张图片分别占据左右部分合成,左右部分都有两个遮罩,  遮罩A用于擦除当前图像,遮罩B用于固定图片显示区域
 * @作者 k
 * @email chanthinker@foxmail.com
 */
;(function(window,$){
  function PicSpin(config) {
    this.dev = window.location.href.indexOf('_dev_') > 0;
    this.config = $.extend({},PicSpin.config,config)
    this.fullScreen = this.config.width == $(window).width(); //设fullScreen是为了误判reszie
    this.canvas = config.canvas
    this.init()
  }
  PicSpin.config = {
    time:2000,
    delay:3000,
    resize:false,
    auto:false,
  }
  PicSpin.prototype = {
    init:function(){
      var c = this.config, b = c.banner;
      var x = typeof b == 'undefined';
      if (x) {
        console.warn('缺少参数banner, 必须是包含正确图片路径的数组!')
        return
      }else{
        if (!b.length) {
          console.warn('参数banner必须是包含正确图片路径的数组!')
          return;
        }
      }
      this.setCanvas()
      // this.fullScreen&&this.config.resize&&this.resizeFn();
    },
    resizeMark:null,
    resizeFn:function(){
      // 作废
      var _this = this;
      $(window).on('resize',function(event) {
        if (_this.resizeMark) clearTimeout(_this.resizeMark); // 避免吃性能
        _this.resizeMark = setTimeout(function(){
          clearTimeout(_this.resizeMark)
          _this.resizeMark = null;
          for (var i = 0; i < _this.loopTimerArr.length; i++) {
            !!_this.loopTimerArr[i] && (clearTimeout(_this.loopTimerArr[i]),_this.loopTimerArr[i]=null) //手动删除定时器
            !!_this.coverTimerArr[i] && (clearTimeout(_this.coverTimerArr[i]),_this.coverTimerArr[i]=null) //手动删除定时器
          }
          _this.reSizeCanvas()
        } , 300);
      });
    },
    setSize:function(){
      var c = this.config
      this._w = c.width || $(window).width();
      this._h = c.height || $(window).height();
      this._r =parseInt( (Math.sqrt(this._h*this._h+this._w*this._w))*0.5); // 遮罩的半径, 否则遮不住一张图的对角线
    },
    setCanvas:function(){
      var _this = this;
      this.setSize()  // 初始化canvas的宽高和遮罩半径
      this.canvas.parent().height(_this._h); // .canvas-wrap高度
      this.canvas = this.canvas.attr({
        'width': _this._w,
        'height': _this._h
      })
      this.buildStage();
    },
    reSizeCanvas:function(){
      this._w = $(window).width()
      this._h = $(window).height()
      this._r =parseInt( (Math.sqrt(this._h*this._h+this._w*this._w))*0.5);
      this.canvas.parent().height(this._h);
      this.canvas = this.canvas.attr({
        'width': this._w,
        'height': this._h
      })
      this.stage.clear();
      this.buildStage();
    },
    buildStage:function(){
      var _this = this;
      var c = this.config, b = c.banner;
      this.len = b.length;
      this.stage  = new createjs.Stage(this.canvas[0]);

      createjs.Ticker.addEventListener("tick", tick);
      function tick(event) {
        _this.stage.update();
      }

      this.objArr = []
      for (var i = 0; i < this.len; i++) {
        this.objArr.push(_this.setSingleLayer(_this.stage,b[i],i)) // 图片插入舞台
      }
      this._initShape = this.initShape();

      if(c.auto){
        this.loop();
      }else{
        this.play()
      }
    },
    play(){
      var prev = this.config.prev;
      var next = this.config.next;
      var _this = this;
      this.curIndex = 0;
      this.lock = false


      next.on('click',function(){
        if (_this.lock) {
          return;
        }
        _this.lock = true


        // console.log(`切换前:`, _this.curIndex);
        let activePage =  _this.objArr[_this.curIndex]
        let activePageIndex =  _this.stage.getChildIndex(activePage.singleCon)
        // console.log(`activePageIndex`, activePageIndex);
        _this.stage.setChildIndex(_this.objArr[_this.curIndex == _this.len-1?0 : _this.curIndex+1].singleCon, activePageIndex-1)

        _this.spinSingleLayer(_this.objArr[_this.curIndex],function(){
          // console.log(`切换后:`, _this.curIndex);
          _this.lock = false
        })

        _this.curIndex++;
        if (_this.curIndex == _this.len) {
          _this.curIndex = 0;
        }
      })

      prev.on('click',function(){
        if (_this.lock) {
          return;
        }

        _this.lock = true

        // console.log(`切换前:`, _this.curIndex);
        let activePage =  _this.objArr[_this.curIndex]
        let activePageIndex =  _this.stage.getChildIndex(activePage.singleCon)
        _this.stage.setChildIndex(_this.objArr[_this.curIndex == 0?_this.len-1 : _this.curIndex-1].singleCon, activePageIndex-1)

        _this.spinSingleLayer(activePage,function(){
          // console.log(`切换后:`, _this.curIndex);
          _this.lock = false
        })

        _this.curIndex--;

        if (_this.curIndex < 0) {
          _this.curIndex = _this.len-1;
        }
      })
    },
    loop:function(){
      var _this = this,c = this.config;
      // c.delay = 500;

      for (var i = 0; i < _this.len; i++) {
        (function(i){
          // 遮罩
          if (_this.coverTimerArr[i]) clearTimeout(_this.coverTimerArr[i]);
            _this.coverTimerArr[i] = setTimeout(function(){
            clearTimeout(_this.coverTimerArr[i]);
            _this.coverTimerArr[i] = null;
            _this.spinInitShape(_this._initShape)
          },(c.time+c.delay)*i)

          // 图片
          if (_this.loopTimerArr[i]) clearTimeout(_this.loopTimerArr[i]);

          _this.loopTimerArr[i] = setTimeout(function (){
            clearTimeout(_this.loopTimerArr[i]);
            _this.loopTimerArr[i] = null;
            _this.spinSingleLayer(_this.objArr[i],function(){
              var _loop = i == _this.len-1
              if (_loop) {
                  _this.loop()
              }
            });
          },(c.time+c.delay)*i+c.delay);
        })(i);
      }
    },
    loopTimerArr:[],
    coverTimerArr:[],
    spinSingleLayer : function(obj,cb,index){
      var _this = this;
      this.spinAni(obj.leftShape,function(){
        _this.resetSingleCon(obj,index=0);
        cb && cb();
      });
      this.spinAni(obj.rightShape);
    },
    resetSingleCon:function(obj,index){
      this.stage.setChildIndex(obj.singleCon,index)
      this.resetShape(obj.leftShape)
      this.resetShape(obj.rightShape)
    },
    resetShape:function(shape){
      createjs.Tween.get(shape, {
        loop: false,
      }, true).to({
        rotation: 0
      }, 0)
    },
    spinAni:function(shape,cb){
      createjs.Tween.get(shape, {
        loop: false,
      }, true).to({
        rotation: 180,
        scaleX: 1,
        scaleY: 1
      }, this.config.time,
        createjs.Ease.cubicInOut
      ).call(function(){
        cb && cb();
      })
    },
    setSingleLayer:function(stage,picSrc,index){
      var _this = this;
      var singleCon = new createjs.Container,
          leftShape = this.half(singleCon,picSrc,false), //左边
          rightShape = this.half(singleCon,picSrc,true); //右边

      stage.addChild(singleCon)
      // 异步setChildIndex , 如果getChildIndex == -1那么不存在这个层
      var t = setTimeout(function(){
        clearTimeout(t);
        t = null;
        stage.setChildIndex(singleCon,_this.len-index-1)
      },0)
      return {
        singleCon:singleCon,
        index:index,
        leftShape:leftShape,
        rightShape: rightShape,
        picSrc
      }
    },
    half:function(singleCon,picSrc,dir){
      var halfCon = new createjs.Container,
          halfPic = new createjs.Bitmap(picSrc),
          shapeA,shapeB;
      if (dir) {
        shapeA = this.setShape({
          startAng:-(1/3)*Math.PI,
          endAng:(2/3)*Math.PI,
          // bgc:'#f00',
          // opacity:0.2
        }), //shapeA固定显示区域

        shapeB = this.setShape({
          startAng:-(1/3)*Math.PI,
          endAng:(2/3)*Math.PI,
        })  //shapeB擦除图片
      }else{
        shapeA = this.setShape({
          startAng:(2/3)*Math.PI,
          endAng:(5/3)*Math.PI
        }), //shapeA固定显示区域

        shapeB = this.setShape({
          startAng:(2/3)*Math.PI,
          endAng:(5/3)*Math.PI
        })  //shapeB擦除图片

      }

      halfPic.x = -parseInt((this._w-this._w)/2)
      halfPic.y = -parseInt((this._h-this._h)/2)

      halfPic.mask = shapeA;
      halfCon.addChild(halfPic);

      halfCon.mask = shapeB;

      singleCon.addChild(shapeA);
      singleCon.addChild(halfCon);
      return shapeA;
    },
    setShape:function(config){
      var _this = this;
      var shape = new createjs.Shape();
      !!config.bgc && shape.graphics.beginFill(config.bgc)
      !!config.opacity && (shape.alpha = config.opacity);
      // 居中这个遮罩
      shape.x=0.5*_this._w;
      shape.y=0.5*_this._h;

      shape.graphics.arc(
        0,
        0,
        (!_this.dev? _this._r : 300),
        config.startAng,
        config.endAng,
        false
      )
      return shape;
    },

    initShape:function(){
      var _initShape = this.setShape({
        startAng:-(1/3)*Math.PI,
        endAng:(2/3)*Math.PI,
        bgc:'#000',
        opacity:0.3
      });
      this.stage.addChild(_initShape);
      return _initShape;
    },
    spinInitShape:function(shape,cb){
      var c = this.config;
      createjs.Tween.get(shape, {
        loop: false,
      }, true).to({
        rotation: -20
      }, (5/15)*c.delay,
        createjs.Ease.cubicInOut
      )
      .to({
          rotation: 10
        }, (6/15)*c.delay,
          createjs.Ease.cubicInOut
        )
      .to({
          rotation: 0
        }, (4/15)*c.delay,
          createjs.Ease.cubicInOut
        )
      .call(function(){
        cb && cb();
      })
    }
  }
  window.PicSpin = PicSpin;
})(window,jQuery)