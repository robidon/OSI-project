<?

    if ($auth_user && $auth_user->status == Model_User::STATUS_ADMIN) {
        Helper_Html::jsFile(STATIC_URL.'/admin/admin.js', true);
        Helper_Html::cssFile(STATIC_URL.'/admin/admin.css', true);

        Helper_Html::jsFile(STATIC_URL.'/admin/htmlparser.js', true);
        
        Helper_Html::jsFile(STATIC_URL.'/admin/jquery.wysiwyg.js', true);
        Helper_Html::cssFile(STATIC_URL.'/admin/jquery.wysiwyg.css', true);
        
        Helper_Html::jsFile(STATIC_URL.'/admin/highlight/highlight.pack.js', true);
        Helper_Html::cssFile(STATIC_URL.'/admin/highlight/styles/sunburst.css',true);
    }
    Helper_Html::jsFile(STATIC_URL.'/histogram.js', true);
    Helper_Html::jsFile(STATIC_URL.'/osi.js', true);
    Helper_Html::jsFile(STATIC_URL.'/thread.js', true);
    Helper_Html::jsFile(STATIC_URL.'/jquery-ui/jquery-ui-1.10.4.custom.min.js', true);
    Helper_Html::jsFile(STATIC_URL.'/jquery.simplemodal.1.4.min.js', true);
    Helper_Html::jsFile(STATIC_URL.'/jquery.tools.min.js', true);
    Helper_Html::jsFile(STATIC_URL.'/jquery.1.7.2.min.js', true);
    //Helper_Html::jsFile('http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js', true);
    //http://ajax.googleapis.com/ajax/libs/jquery/1.8.0/jquery.min.js
    //http://code.jquery.com/jquery-1.8.0.min.js
    
    Helper_Html::cssFile(STATIC_URL.'/jquery-ui/jquery-ui-1.10.4.custom.min.css', true);
    Helper_Html::cssFile(STATIC_URL.'/histogram.css', true);
    Helper_Html::cssFile(STATIC_URL.'/osi.css', true);
    
?><!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"> 
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta http-equiv="Pragma" content="no-cache" />
    <meta http-equiv="expires" content="0" />
    <meta name="robots" content="" />
    <meta name="keywords" content="" />
    <meta name="description" content="" />
    <link href="/static/favicon.ico" rel="icon" type="image/x-icon" />

    <title><?=$page_title?></title>
    <script>
        var STATIC_URL = '<?=STATIC_URL?>';
        var DOMAIN_NAME = '<?=DOMAIN_NAME?>'
    </script>
    <?=Helper_Html::jsRender(); ?>
    <?=Helper_Html::cssRender(); ?>
    <script>
        var VKRegister_intl = 0;
        function VKRegister(url) {
            if (VKRegister_intl) return;
            var newWin = window.open(url,'vkAuth',"width=656,height=315,resizable=yes,scrollbars=yes,status=yes");
            newWin.focus();
            VKRegister_intl = setInterval(function () {
                if (!newWin || newWin.closed) {
                    clearInterval(VKRegister_intl);
                    VKRegister_intl = 0;
                    osi.alert('Не получилось войти используя Vkontakte. Попробуйте ещё раз.');
                }
                if (newWin.complete) {
                    clearInterval(VKRegister_intl);
                    VKRegister_intl = 0;
                    newWin.close();
                    if (newWin.error) {
                        osi.alert('Не получилось войти используя Vkontakte. Попробуйте ещё раз.');
                    } else {
                        document.location.reload();
                    }
                }
            },1000);
        }
    </script>
    <? if (IN_PRODUCTION) : ?>
        <? if (IN_SBOR) { ?>
            <script>
              (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
              (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
              m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
              })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

              ga('create', 'UA-54353265-1', 'auto');
              ga('send', 'pageview');

            </script>
        <? } else { ?>
            <script type="text/javascript">
              var _gaq = _gaq || [];
              _gaq.push(['_setAccount', 'UA-19873192-1']);
              _gaq.push(['_trackPageview']);
              (function() {
                var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
                ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
                var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
              })();
            </script>
        <? } ?>
    <? endif; ?>
</head>
<body>
<div id="wrapper">
    <div id="container">
        <div id="pageTop">
            <a class="logo <?=IN_SBOR?"opensbor":""?>" href="/"></a>
            <div class="about"><?=IN_SBOR ? "Рейтинги, общение и цифровая летопись" : "Подробно и профессионально об инвестициях"?></div>
            <? include "inc/login.php"; ?>
        </div>
        <div id="pageMiddle">
            <div class="clear">
                <?=Helper_Menu::render(1); ?>
                <?=Helper_Menu::render(2, 'additional'); ?>
            </div>
            <div id="pageContent">
                <?=$content;?>
            </div>
        </div>
        <div id="pageBottom">
            <? if (IN_SBOR) { ?> 
                <p>Для связи: <a href="mailto:osi.contacts@gmail.com">osi.contacts@gmail.com</a></p>
                <p>&copy; <a href="http://opensbor.org">OpenSbor</a>. Все права защищены. Любое несанкционированное копирование материалов с данного интернет-ресурса запрещено.</p>
            <? } else { ?>
                <p>Для связи: <a href="mailto:osi.contacts@gmail.com">osi.contacts@gmail.com</a></p>
                <p>&copy; <a href="http://osi-project.ru">OSI Project</a>. Все права защищены. Любое несанкционированное копирование материалов с данного интернет-ресурса запрещено.</p>
            <? } ?>
        </div>
    </div>
</div>
<div id="globalAjaxMessage" class="h"><p></p></div>
<div id="ajaxMessages" class="h">
    <div id="ajax_message_loading">Загрузка...</div>
    <div id="ajax_message_error">Произошла ошибка.</div>
</div>
<? if (IN_SBOR) : ?>
    <!-- Yandex.Metrika counter -->
    <script type="text/javascript">
    (function (d, w, c) {
        (w[c] = w[c] || []).push(function() {
            try {
                w.yaCounter26053053 = new Ya.Metrika({id:26053053,
                        webvisor:true,
                        clickmap:true,
                        trackLinks:true,
                        accurateTrackBounce:true,
                        trackHash:true,
                        ut:"noindex"});
            } catch(e) { }
        });

        var n = d.getElementsByTagName("script")[0],
            s = d.createElement("script"),
            f = function () { n.parentNode.insertBefore(s, n); };
        s.type = "text/javascript";
        s.async = true;
        s.src = (d.location.protocol == "https:" ? "https:" : "http:") + "//mc.yandex.ru/metrika/watch.js";

        if (w.opera == "[object Opera]") {
            d.addEventListener("DOMContentLoaded", f, false);
        } else { f(); }
    })(document, window, "yandex_metrika_callbacks");
    </script>
    <noscript><div><img src="//mc.yandex.ru/watch/26053053?ut=noindex" style="position:absolute; left:-9999px;" alt="" /></div></noscript>
    <!-- /Yandex.Metrika counter -->
<? endif; ?>
</body>
</html>