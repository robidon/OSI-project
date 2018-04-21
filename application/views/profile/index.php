<?
/**
* @var $user Model_User
*/
?><div class="fl-l w-120 content-l">
    <img src="<?=$user->get_photo(100);?>" />
    <? if ($me) : ?>
    <a href="#" id="changeAva">Изменить аватар</a><br/>
    <a href="#" id="profileSettings">Настройки профиля</a><br/>
    <a href="#" id="changePassword">Сменить пароль</a><br/>
    <? endif; ?>
</div>
<? if ($me) : ?>
<div class="h" id="changeAvaDialog" title="Загрузка аватара">
    <form id="changeAvaForm" action="/profile/uploadPhoto" method="POST" enctype="multipart/form-data">
        <fieldset>
            <label for="file">Выберите картинку:</label>
            <input type="file" name="file" id="file"/>
        </fieldset>

        <fieldset>
            <span class="button buttonGreen send"><em></em>Отправить</span>
            <span class="button buttonGrey cancel"><em></em>Отмена</span>
        </fieldset>
    </form>
</div>
<div class="h" id="profileSettingsDialog" title="Настройки профиля">
    <form id="profileSettingsForm" action="/profile/edit" method="POST">
        <div class="errors"></div>
        <fieldset>
            <label for="profile_username">Ваше имя:</label>
            <input type="text" name="profile_username" id="profile_username" value="<?=$user->username?>"/>
        </fieldset>
        <fieldset>
            <label for="profile_email">Ваш email:</label>
            <input type="text" name="profile_email" id="profile_email" value="<?=$user->email?>"/>
        </fieldset>                                                                                       
        <fieldset>
            При смене email (если указать новый адрес) на новый указанный адрес будет выслано письмо с подтверждением. Перейдите по ссылке, указанной в письме, чтобы подтвердить email адрес.
        </fieldset>

        <fieldset>
            <span class="button buttonGreen send"><em></em>Отправить</span>
            <span class="button buttonGrey cancel"><em></em>Отмена</span>
        </fieldset>
    </form>
</div>
<div class="h" id="changePasswordDialog" title="Смена пароля">
    <form id="changePasswordForm" action="/profile/changepassword" method="POST">
        <div class="errors"></div>
        <?/*<fieldset>
            <label for="profile_oldpassword">Старый пароль:</label>
            <input type="password" name="profile_oldpassword" id="profile_oldpassword" value=""/>
        </fieldset>*/?>
        <fieldset>
            <label for="profile_newpassword">Новый пароль:</label>
            <input type="password" name="profile_newpassword" id="profile_newpassword" value=""/>
        </fieldset>
        <fieldset>
            <label for="profile_newpasswordcheck">Повторите новый пароль:</label>
            <input type="password" name="profile_newpasswordcheck" id="profile_newpasswordcheck" value=""/>
        </fieldset>
        <fieldset>
            Новый пароль будет выслан на почтовый адрес: <em><?=$user->email?></em>
        </fieldset>
        <fieldset>
            <span class="button buttonGreen send"><em></em>Отправить</span>
            <span class="button buttonGrey cancel"><em></em>Отмена</span>
        </fieldset>
    </form>
</div>
<script>
$(function () {
    $("#profileSettings").click(function () {
        $("#profileSettingsForm .errors").empty().hide();
        $("#profileSettingsDialog").dialog({width:500});
        var onclick = function () {
            var params = {json:1};
            $("#profileSettingsForm input").each(function() {
                params[$(this).attr('name')] = $(this).val();
            });
            $.post("/profile/edit", params, function(data) {
                $("#profileSettingsForm .send").unbind('click').one('click',onclick);
                if (data['status'] == '2') {
                    $("#profileSettingsDialog").dialog("close");
                } else if (data['status'] == '1') {
                    $("#profileSettingsDialog").dialog("close");
                    osi.alert('Изменения сохранены', function() {
                        document.location.reload();
                    });
                } else {
                    var errorText = "Не правильно введены данные";
                    $("#profileSettingsForm .errors").html(errorText).show();
                }
            },"json")
        };
        $("#profileSettingsForm .send").unbind('click').one('click',onclick);
        $("#profileSettingsForm .cancel").unbind('click').one('click',function () {
            $("#profileSettingsDialog").dialog("close");
        });
    });
    $("#changePassword").click(function () {
        $("#changePasswordDialog .errors").empty().hide();
        $("#changePasswordDialog").dialog({width:500});
        var onclick = function () {
            var params = {json:1};
            $("#changePasswordForm input").each(function() {
                params[$(this).attr('name')] = $(this).val();
            });
            $.post("/profile/changepassword", params, function(data) {
                $("#changePasswordForm .send").unbind('click').one('click',onclick);
                if (data['status'] == '2') {
                    $("#changePasswordDialog").dialog("close");
                } else if (data['status'] == '1') {
                    $("#changePasswordDialog").dialog("close");
                    osi.alert('Изменения сохранены', function() {
                        document.location.reload();
                    });
                } else {
                    var errorText = "Не правильно введены данные";
                    $("#changePasswordForm .errors").html(errorText).show();
                }
            },"json")
        };
        $("#changePasswordForm .send").unbind('click').one('click',onclick);
        $("#changePasswordForm .cancel").unbind('click').one('click',function () {
            $("#changePasswordDialog").dialog("close");
        });
    });
    $("#changeAva").click(function () {
        $("#changeAvaDialog").dialog({width:500});
        $("#changeAvaForm .send").unbind('click').one('click',function () {
            $("#changeAvaForm").submit();
        });
        $("#changeAvaForm .cancel").unbind('click').one('click',function () {
            $("#changeAvaDialog").dialog("close");
        });
    });
});
</script>
<? endif; ?>
<div class="fl-l w-800 content-r">
    <h2>Профиль пользователя: <?=$user->username?></h2>
    <div>Карма: <?=$user->karma?></div>
    <? if ($me && @$votelog) : ?>
    <div>
        <h3>Голоса</h3>
        <div id="votelog">
        <?
        include "ajax/votelog.php";
        ?>
        </div>
    </div>
    <? Helper_Html::jsStart(); ?>
    <script>
        var votes_page = function (page) {
            $.post('/profile/votelog', {json:1,'page':page}, function (resp) {
                $("#votelog").empty().html(resp['data']);
            }, 'json');
        }
    </script>
    <? Helper_Html::jsEnd(); ?>
    <? endif; ?>
</div>
<div class="clearer"></div>