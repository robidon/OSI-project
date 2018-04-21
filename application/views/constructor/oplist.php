<div class="operatorsList">
<? foreach ($operators as $op) : ?>
<? /**
   * @var $op Constructor_Dao_Operator
   */
?>
<div class="operator" rel="<?=$op->uid?>" type="<?=$op->type?>">
    <div class="operator_name"><?=$op->name?></div>
    <div class="operator_title"><?=$op->title?></div>
</div>
<? endforeach; ?>
</div>