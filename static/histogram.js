var histogram = {
    init:function() {
        $(".histogram").each(function() {
            histogram.draw($(this));
        });
        $(".histogramV").each(function() {
            histogram.drawV($(this));
        });
    },
    draw:function(obj) {
    },
    drawV:function(obj) {
        obj.find('li').each(function () {
            var val = parseFloat($('em',this).hide().html());
            var a = $('a',this);
            var innerClass = '';
            if (val<0) {
                innerClass = 'red';
            }
            if (val>0) {
                innerClass = 'green';
            }
            if (a.length>0) {
                innerClass += ' link';
            }
            var html = '<div class="label">'+
                $(this).html()+
                '</div><div class="bar"><div class="inner '+innerClass+'" style="width:'+Math.abs(val)+'%"><em>'+val+'%</em></div></div>';
            $(this).html(html);
        });
    }
}