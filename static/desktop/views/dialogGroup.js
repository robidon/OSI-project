//dialogGroup
var Desktop_View_Dialog_Group = function Desktop_View_Dialog_Group(params, file) {
    params.width = 350;
    params.height = 150;
    Desktop_View_Dialog_Group.superclass.constructor.apply(this, [params]);
    var T = this;
    this.controller = file;
    var contentElement = T.getContentElement();


    var saveClickHandler = function () {
    
        var name = objName.val();
        if (!name) name = 'Новая группа';
        var description = objDesc.val();
        if (!description) description = '';
        T.controller.saveGroupAction(group, name, description, function (status) {
            T.close();
        });

    }
    var removeClickHandler = function () {
        T.controller.removeGroupAction(group, function (status) {
            T.close();
        });
    }
    
    var group = params.group ? params.group : undefined;
    var name = group ? group.name : "Напишите название элемента"
    var res = $('<div class="popupForm groupDetails_Data"></div>');
    var objName,objDesc;
    if (T.controller.dao.user_access.edit) {
        objName = $('<input class="formString groupName" type="text"/>');
        objDesc = $('<textarea class="formText groupDesc"></textarea>');
        objName.val(name);
        objDesc.val(group.get('full_desc'));
    } else {
        objName = $('<div>').text(name);
        objDesc = $('<div>').html(group.get('full_desc'));
    }
    res.append($("<div class='groupNameWrap'>").append(objName))
        .append($("<div class='groupDescWrap'>").append(objDesc));
    if (T.controller.dao.user_access.edit) {
        var btns = $("<div>");
        var saveBtn = $('<div class="button buttonGreen"><em></em>Сохранить</div>')
        saveBtn.click(saveClickHandler);
        var removeBtn = $('<div class="button buttonRed"><em></em>Удалить</div>')
        removeBtn.click(removeClickHandler);
        btns.append(saveBtn,"&nbsp;",removeBtn);
        res.append(btns);
        var editor = new wysihtml5.Editor(objDesc.get(0), {
          parserRules:  wysihtml5ParserRules
        });
    }
    contentElement.append(res);
}
extend(Desktop_View_Dialog_Group, Desktop_View_Dialog);