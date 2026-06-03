<?php

namespace App\Http\Controllers\Swagger;

use OpenApi\Attributes as OA;

#[OA\Info(
    title: 'Contract Manage API',
    version: '1.0.0',
    description: 'API documentation for Contract Management System',
    contact: new OA\Contact(email: 'admin@example.com'),
)]
#[OA\Server(
    url: 'http://localhost:8000',
    description: 'Contract Manage API Server',
)]
#[OA\SecurityScheme(
    securityScheme: 'bearerAuth',
    type: 'http',
    name: 'bearerAuth',
    in: 'header',
    scheme: 'bearer',
)]
class SwaggerInfo {}
