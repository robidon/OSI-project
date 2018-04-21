<? Helper_Html::jsStart(); ?>
<script>
$(function () {
    osi.auth.referrer = '<?=urldecode(@$referrer)?>';
});
function RegisterSend() {
    var params = {
        'json':1,
        'email':$("#register_email").val(),
        'username':$("#register_username").val(),
        'password':$("#register_password").val(),
        'referrer':'<?=@$referrer?>'
    }
    $.post('<?=Route::url('default',array('controller'=>'profile','action'=>'register'))?>', params, function(resp) {
        if (resp["status"]==1) {
            $("#registerForm").hide();
            $("#confirmSent").show();
            if (resp["data"]['success']) {
                $("#confirmSent").append("<a href='"+resp["data"]['success']+"'>"+resp["data"]['success']+"</a>");
            }
            return;
        }
        if (resp["data"]["errors"]) {
            var i;
            $(".error").hide();
            for (i=0;i<resp["data"]['errors'].length;i++) {
                $("#field_"+resp["data"]['errors'][i][0]+" .error").html(resp["data"]['errors'][i][1]).show();
            }
        }
    }, "json");
}
</script>
<? Helper_Html::jsEnd(); ?>

<div id="registerForm">
    <h1>Создать аккаунт</h1>
    <h2>(если Вы ранее не регистрировались)</h2>
    <form class="w-600" method='post' action='<?=Route::url('default',array('controller'=>'profile','action'=>'register'))?>'>
        <div id="registerVKForm">
            <p><strong>Самый простой способ создать аккаунт:</strong>
            <a href="#" onclick="VKRegister('<?=Model_Dao_UserAuth_VK::oauth_vk_url()?>')"><img align="absmiddle" src="<?=STATIC_URL?>/img/vk_promo_button.png" width="122" height="32"/></a></p>
            <hr/>
            <p><strong>Либо воспользуйтесь формой регистрации:</strong></p>
        </div>
        <fieldset id="field_username">
            <label for="register_username">Ваше имя</label>
            <input type="text" name="username" id="register_username"/>
            <span class="error"></span>
        </fieldset>
        <fieldset id="field_email">
            <label for="register_email">Email</label>
            <input type="text" name="email" id="register_email"/>
            <span class="error"></span>
        </fieldset>
        <fieldset id="field_password">
            <label for="register_password">Пароль</label>
            <input type="password" name="password" id="register_password"/>
            <span class="error"></span>
        </fieldset>
        <fieldset>
            <span class="button buttonGreen" onclick="RegisterSend(); return false;"><em></em>Зарегистрироваться</span>
        </fieldset>
    </form>
</div>
<div id="confirmSent" class="h">
    На ваш email было выслано письмо с подтверждением регистрации.<br/>
    Пожалуйста, перейдите по ссылке, указанной в этом письме, чтобы подтвердить ваш почтовый ящик.<br/>
</div>