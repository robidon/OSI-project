<?
$accessLevels = Constructor_Service_File::get_access_list();
?>
<script id="accessLevelsTemplate" type="text/x-jquery-tmpl">
    <?
    
    foreach ($accessLevels as $val=>$opt) :
    ?>
    <div class="access_list_item_box">
        <input
            class="access_list_item_check"
            type="checkbox"
            id="access_list_item_<?=$opt['name']?>"
            value="<?=$opt['name']?>"
            title = "<?=$opt['title']?>"
            {{if <?=$opt['name']?>==1 }} checked="checked"{{/if}}
            <? if ($val==Constructor_Service_File::ACCESS_LEVEL_ADMIN) {
                ?>{{if !read }} disabled="disabled" {{/if}}<?
            } else if ($val==Constructor_Service_File::ACCESS_LEVEL_READ) {
                ?>{{if admin }} disabled="disabled" {{/if}}<?
            } else {
                ?>{{if !read || admin }} disabled="disabled" {{/if}}<?
            }?>/>
    </div>
    <?
    endforeach;
    
    ?>
</script>
<script id="fileShareDialogTemplate" type="text/x-jquery-tmpl">
    <div id="fileShareDialog">
        <div class="access_list">
            <div class="access_list_header">
                <div class="access_list_header_title"></div>
                <?
                
                foreach ($accessLevels as $val=>$opt) :
                ?>
                    <div
                        class="access_list_header_item"
                        title="<?=$opt['title']?>"
                    ><span class="ico access_list_header_item_<?=$opt['name']?>"></span></div>
                <?
                endforeach;
                
                ?>
            </div>
            <div class="access_list_items">
                <div class="access_list_item access_publish">
                    <div class="access_list_item_icon"><span class="ico access_list_item_publish"></span></div>
                    <div class="access_list_item_title">Публичный доступ</div>
                    {{tmpl(publish) '#accessLevelsTemplate'}}
                </div>
                {{each users}}
                    <div class="access_list_item access_personal access_list_item_${user_id}" userId="${user_id}">
                        <div class="access_list_item_icon">{{if user_ava}}<img class='access_list_item_ava' src="${user_ava}"/>{{/if}}</div>
                        <div class="access_list_item_title">${user_name}</div>
                        {{tmpl(access) '#accessLevelsTemplate'}}
                        <div class="access_list_item_remove" title="Закрыть доступ"></div>
                    </div>
                {{/each}}
            </div>
            <div class="access_list_additems">
                <div class="access_list_additems_title">
                    <strong>Предоставить доступ:</strong><br/>
                    (укажите email пользователей через &laquo;,&raquo;)
                </div>
                <div class="access_list_item">
                    <div class="access_list_item_title">
                        <textarea class="access_list_additems_area"></textarea><br/>
                    </div>
                    {{tmpl(newAccess) '#accessLevelsTemplate'}}
                    <a id="addUsersAccess" class="ico access_list_item_add" title="Предоставить доступ"></a>
                </div>
            </div>
        </div>
    </div>
</script>
<script id="fileShareUserTemplate" type="text/x-jquery-tmpl">
    <div class="shareUser">
        <img src="${user_ava}"/>
        ${user_name}
    </div>
</script>
