<?php
return array
(
    'transport'    => 'smtp',
    'options'    => array
                    (
                        'hostname'    => 'smtp.spaceweb.ru',
                        'username'    => IN_SBOR ? 'opensbor.org+open' : 'osi-project.ru+register',
                        'password'    => IN_SBOR ? 'openopensborsbor': 'fixmepls',
                        'port'        => '2525',
                    ),
);
/*
return array
(
    'transport'    => 'sendmail',
    'options'      => '/usr/sbin/sendmail -t -i',
);  */
?>
