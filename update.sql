ALTER TABLE `c_files_settings`
ADD COLUMN `keys_filter`  tinytext NOT NULL AFTER `zoom`,
ADD COLUMN `keys_min_bound`  double NULL DEFAULT NULL AFTER `keys_filter`,
ADD COLUMN `keys_max_bound`  double NULL DEFAULT NULL AFTER `keys_min_bound`,
ADD COLUMN `keys_filter_enabled`  tinyint UNSIGNED NOT NULL DEFAULT 0 AFTER `keys_max_bound`,
ADD COLUMN `keys_sort`  tinyint NOT NULL DEFAULT 0 AFTER `keys_filter_enabled`;


ALTER TABLE `c_nodes`
ADD COLUMN `rotation`  tinyint UNSIGNED NOT NULL DEFAULT 0 AFTER `style`;

ALTER TABLE `c_groups`
ADD COLUMN `rotation`  tinyint UNSIGNED NOT NULL DEFAULT 0 AFTER `style`;

---

ALTER TABLE `c_nodes`
ADD COLUMN `full_desc`  text AFTER `rotation`;
ADD COLUMN `date_modified`  datetime NOT NULL DEFAULT 0 AFTER `full_desc`;


ALTER TABLE `c_groups`
ADD COLUMN `full_desc`  text AFTER `rotation`;
ADD COLUMN `date_modified`  datetime NOT NULL DEFAULT 0 AFTER `full_desc`;

---

ALTER TABLE `c_nodes_data`
DROP PRIMARY KEY;

ALTER TABLE `c_nodes_data`
MODIFY COLUMN `key`  varchar(255) NOT NULL DEFAULT '' AFTER `node_id`;

ALTER TABLE `c_nodes_data`
ADD COLUMN `keyHash`  bigint UNSIGNED NOT NULL DEFAULT 0 AFTER `file_uid`;

update c_nodes_data set c_nodes_data.keyHash = CRC32(c_nodes_data.key) where 1;

ALTER TABLE `c_nodes_data`
ADD PRIMARY KEY (`node_id`, `keyHash`);


---

CREATE TABLE `users_auth_vk` (
`id`  int UNSIGNED NOT NULL DEFAULT 0 ,
`user_id`  int UNSIGNED NOT NULL DEFAULT 0 ,
`create_date`  int UNSIGNED NOT NULL DEFAULT 0 ,
`update_date`  int UNSIGNED NOT NULL DEFAULT 0 ,
`first_name`  varchar(255) NOT NULL DEFAULT '' ,
`last_name`  varchar(255) NOT NULL DEFAULT '' ,
`screen_name`  varchar(255) NOT NULL DEFAULT '' ,
`sex`  tinyint NOT NULL DEFAULT 0 ,
`bdate`  varchar(255) NOT NULL DEFAULT '' ,
`photo_big`  varchar(255) NOT NULL DEFAULT '' ,
PRIMARY KEY (`id`),
INDEX `user` (`user_id`) 
)
;


`ALTER TABLE users DROP INDEX uniq_email;`

ALTER TABLE `users_auth_vk`
MODIFY COLUMN `id`  int(10) UNSIGNED NOT NULL AUTO_INCREMENT FIRST ,
ADD COLUMN `uid`  int UNSIGNED NOT NULL DEFAULT 0 AFTER `id`,
ADD INDEX `uid` (`uid`) ;

--------------
