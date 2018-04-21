var Desktop_View_LatestComments = function Desktop_View_LatestComments() {
    Desktop_View_LatestComments.superclass.constructor.apply(this, []);
    this.render = function () {
        var T = this;
        if (!this.html) this.html = $("<div/>");
        var oh = this.html;
        this.html = $("#latestCommentsTemplate").tmpl();
        oh.replaceWith(this.html);
        var comments = this.controller.dao.latest_comments.slice();
        var selection = this.controller.getSelection();
        var i,selNodes = [];
        if (selection.length) {
            for (i=0;i<selection.length;i++) {
                if (!(selection[i] instanceof Desktop_View_Group)) {
                    selNodes.push(selection[i].id);
                }
            }
        }
        if (selNodes.length) {
            for (i=comments.length-1;i>=0;i--) {
                if (selNodes.indexOf(comments[i].node.id)==-1) 
                    delete comments[i];
            }
        }
        if (comments) {
            var commentsHtml = $("#latestCommentTemplate").tmpl(comments);
            $("#latestCommentsList",this.html).append(commentsHtml);
            $(".latestComment",this.html).each(function () {
                var nodeId = $(this).attr('nodeId');
                var node = T.controller.dao.nodes.get(nodeId);
                $(".latestCommentBody",this).bind({
                    'mouseenter':function () {
                        node.setHighlighted(true);
                    },
                    'mouseleave':function () {
                        node.setHighlighted(false);
                    },
                    'click':function () {
                        T.controller.showHiddenNodeAction(node);
                        var nodeView = T.controller.view.nodes.get(nodeId);
                        T.controller.clearSelectionAction();
                        T.controller.scrollToNodeAction(node);
                        T.controller.zoomAction(-2);
                        if (nodeView) {
                            nodeView.select();
                            T.controller.addToSelectionAction(nodeView);
                        }
                    },
                    'dblclick':function () {
                        var nodeView = T.controller.view.nodes.get(nodeId);
                        if (nodeView) {
                            T.controller.showNodeDetailsAction(nodeId);
                        }
                        return false;
                    }
                })
            });
        }
    }
    this.init = function(file) {
        var T = this;
        this.controller = file;
        this.render();
        file.bind('change:selection', function () {
            setTimeout(function () {
                T.render(); 
            },500);
        });
    }
}
extend(Desktop_View_LatestComments, Desktop_View_HTML)
