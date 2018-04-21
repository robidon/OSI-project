<? if (@$errors) : ?>
<script>
    window.complete = true;
    window.error = true;
</script>
Не получилось войти используя Vkontakte. Попробуйте ещё раз.
<? else : ?>
<script>
    window.complete = true;
</script>
<? endif; ?>
