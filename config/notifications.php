<?php

return [
    'email' => [
        'enabled' => env('EMAIL_NOTIFICATIONS_ENABLED', true) && env('SEND_EMAIL', true),
    ],
];
