<?php
return [
    'enabled' => true,
    'provider' => 'firebase',
    'firebase' => [
        'apiKey' => getenv('FIREBASE_API_KEY') ?: 'YOUR_FIREBASE_API_KEY',
        'authDomain' => getenv('FIREBASE_AUTH_DOMAIN') ?: 'your-app.firebaseapp.com',
        'projectId' => getenv('FIREBASE_PROJECT_ID') ?: 'your-app',
        'appId' => getenv('FIREBASE_APP_ID') ?: '1:1234567890:web:abcdef',
        'measurementId' => getenv('FIREBASE_MEASUREMENT_ID') ?: 'G-XXXXXXXXXX'
    ]
];
