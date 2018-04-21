<? include "inc/top.php"; ?>
<h1>Пользователи</h1>
Всего в базе <?=$users_count?> пользователей.
<table class="data" cellspacing="1">
    <thead>
        <tr>
            <th>Ава</th>
            <th>ID</th>
            <th>Имя</th>
            <th>Email</th>
            <th>Права</th>
            <th>Кол-во логинов</th>
            <th>Последний логин</th>
            <th>Карма</th>
            <th>Реферер</th>
            <th></th>
        </tr>
    </thead>
    <tbody>
        <? foreach ($users as $user) : ?>
        <tr id="user_<?=$user->id?>" rel="<?=$user->id?>">
            <td><img src="<?=$user->get_photo(35)?>" width="35" height="35"/></td>
            <td><?=$user->id?></td>
            <td class="field field_username" rel="<?=htmlspecialchars($user->username)?>"><?=$user->username?></td>
            <td class="field field_email" rel="<?=htmlspecialchars($user->email)?>"><?=$user->email?></td>
            <td class="field field_status" rel="<?=$user->status?>"><?=Model_User::$statuses[$user->status]?></td>
            <td><?=$user->logins?></td>
            <td><?=date("Y-m-d H:i:s",$user->last_login)?></td>
            <td class="field field_karma" rel="<?=$user->karma?>"><?=$user->karma?></td>
            <td><?=$user->referrer?></td>
            <td><span class="button" onclick="editItem('user_<?=$user->id?>')"><em></em>Edit</span></td>
        </tr>
        <? endforeach; ?>
    </tbody>
    <tfoot>
    </tfoot>
</table>
<br/>
<? if ($page>0) : ?>
<a class="button" href="/admin/users?page=<?=$page-1?>"><em></em>&laquo; Назад</a> &nbsp; 
<? endif; ?>
<a class="button" href="/admin/users?page=<?=$page+1?>"><em></em>Вперед &raquo;</a>
<?
    $edit_item = array(
        'title'=>'Редактирование пользователя',
        'action_save'=>'/admin/users/save',
        'action_remove'=>'/admin/users/remove',
        'fields'=>array(
            'username'=>array(
                'type'=>'text',
                'title'=>'Имя',
            ),
            'email'=>array(
                'type'=>'text',
                'title'=>'Email',
            ),
            'status'=>array(
                'type'=>'select',
                'select_from'=>Model_User::$statuses,
                'title'=>'Права',
            ),
            'karma'=>array(
                'type'=>'int',
                'title'=>'Карма',
            ),
        )
    );
?>
<? include "inc/edit_item.php"; ?>