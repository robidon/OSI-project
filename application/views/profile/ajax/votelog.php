<table class="data w-100p" cellspacing="1">
    <thead>
        <tr>
            <th class="w-150">Дата</th>
            <th class="w-50">Голос</th>
            <th class="w-100">Кто</th>
            <th>Где</th>
            <th class="w-150">Причина</th>
        </tr>
    </thead>
    <tbody>
        <? foreach($votelog as $vote) : ?>
            <?/**
            * @var $vote Model_Dao_Vote
            */?>
            <tr class="v-t">
                <td><?=Helper_String::r_date($vote->date)?></td>
                <td><?=( $vote->points > 0 ? '+' : '' ) . $vote->points?></td>
                <td><a href="/profile/<?=$vote->from_user_id?>"><?=$vote->from_user()->username?></a></td>
                <td><a href="/index/subject?type=<?=$vote->subject_type?>&id=<?=$vote->subject_id?>"><?=$vote->info()?></a></td>
                <td><?=Service_Karma::$reasons[$vote->reason]['title']?></td>
            </tr>
        <? endforeach;?>
    </tbody>
    <tfoot><tr>
        <td colspan="5" align="right">
            <? if ($prev_page) : ?>
                <a href="javascript:votes_page(<?=$page-1?>);">&laquo; Назад</a>
            <? endif; ?>
            <? if ($next_page) : ?>
                <a href="javascript:votes_page(<?=$page+1?>);">Далее &raquo;</a>
            <? endif; ?>
        </td>
    </tr></tfoot>
</table>
