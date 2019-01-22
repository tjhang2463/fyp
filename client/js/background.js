(function(){
    var stage;
    //var image, bitmap;
    var colors = ['#B2949D', '#FFF578', '#FF5F8D', '#37A9CC', '#188EB2'];

    function init() {
        initStages();
        initCircles();
        //initImage();
        animate();
    }

    // Init Canvas
    function initStages() {
        stage = new createjs.Stage("stage");
        stage.canvas.width = window.innerWidth - 18;
        stage.canvas.height = window.innerHeight;
    }

    /*
    function initImage() {
        image = new Image();
        image.src = '../img/background4.png';
        bitmap = new createjs.Bitmap(image);
        bitmap.x = 740;
        bitmap.scaleX = 480/image.width;
        bitmap.scaleY = 800/image.height;
        bitmap.image.onload = function() {
            stage.update();
        }
        stage.addChild(bitmap);
    }
    */

    function initCircles() {
        circles = [];
        for(var i = 0; i < 600; i++) {
            var circle = new createjs.Shape();
            var r = 7;
            var x = stage.canvas.width * Math.random();
            var y = stage.canvas.height * Math.random();
            var color = colors[Math.floor(i % colors.length)];
            var alpha = 0.2 + Math.random() * 0.5;
            circle.alpha = alpha;
            circle.radius = r;
            circle.graphics.beginFill(color).drawCircle(0, 0, r);
            circle.x = x;
            circle.y = y;
            circles.push(circle);
            stage.addChild(circle);
            circle.movement = 'float';
            tweenCircle(circle);
        }
    }


    // animating circles
    function animate() {
        stage.update();
        requestAnimationFrame(animate);
    }

    function tweenCircle(c, dir) {
        if(c.tween) c.tween.kill();
        if(dir == 'in') {
            c.tween = TweenLite.to(c, 0.4, {x: c.originX, y: c.originY, ease:Quad.easeInOut, alpha: 1, radius: 5, scaleX: 0.4, scaleY: 0.4, onComplete: function() {
                c.movement = 'jiggle';
                tweenCircle(c);
            }});
        } else if(dir == 'out') {
            c.tween = TweenLite.to(c, 0.8, {x: window.innerWidth*Math.random(), y: window.innerHeight*Math.random(), ease:Quad.easeInOut, alpha: 0.2 + Math.random()*0.5, scaleX: 1, scaleY: 1, onComplete: function() {
                c.movement = 'float';
                tweenCircle(c);
            }});
        } else {
            if(c.movement == 'float') {
                c.tween = TweenLite.to(c, 5 + Math.random()*3.5, {x: c.x + -100+Math.random()*200, y: c.y + -100+Math.random()*200, ease:Quad.easeInOut, alpha: 0.2 + Math.random()*0.5,
                    onComplete: function() {
                        tweenCircle(c);
                    }});
            } else {
                c.tween = TweenLite.to(c, 0.05, {x: c.originX + Math.random()*3, y: c.originY + Math.random()*3, ease:Quad.easeInOut,
                    onComplete: function() {
                        tweenCircle(c);
                    }});
            }
        }
    }

    window.onload = function() { 
        init();
    };
})();