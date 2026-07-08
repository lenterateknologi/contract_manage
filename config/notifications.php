<?php

// ponytail: configuration for enabling/disabling email notifications
return [
    'email' => [
        'enabled' => env('EMAIL_NOTIFICATIONS_ENABLED', true) && env('SEND_EMAIL', true),
    ],
];
