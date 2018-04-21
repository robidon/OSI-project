<?php
class Helper_Migration {
    static public function isNewConstructorEnabled() {
        return !IN_PRODUCTION || IN_STAGE;
    }
}
?>
