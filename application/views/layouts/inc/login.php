<? if ($auth_user) : ?>
<div class="formLogin">
    Вы авторизованы как: <em><?=$auth_user->username?></em> <a class="button" href="/profile/logout"><em></em>Выйти</a>
</div>
<? else : ?>
<div id="form_login" class="formLogin">
    <?/*<form action="/profile/login" method="post" name="login" id="form-login" >*/?>
        <label for="email" class="email">Email:</label>
        <input id="email" class="email" type="text" value="" name="email" alt="Email" size="18"/>
        <label for="password" class="pswrd">Пароль:</label>
        <input id="password" type="password" name="password" class="pswrd" size="18" alt="Password" />
        <span id="btn_login" class='button'><em></em>Войти</span>
        <a class="button buttonGreen btnJoin" href="/profile/register"><em></em>Регистрация</a>
        <a href="#" id="topLoginVKButton" onclick="VKRegister('<?=Model_Dao_UserAuth_VK::oauth_vk_url()?>')"><img align="absmiddle" src="<?=STATIC_URL?>/img/vk_promo_button.png" height="22"/></a>
    <?/*</form>*/?>
</div>
<? endif; ?>